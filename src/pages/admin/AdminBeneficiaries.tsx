import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  LayoutDashboard, Building2, Store, Users, AlertTriangle, MapPin, Activity,
  FileText, Settings, Search, Filter, Wallet, Clock, MessageSquare, RefreshCw,
  TrendingUp, CheckCircle
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const navItems = [
  { label: "Dashboard", href: "/admin", icon: <LayoutDashboard className="w-4 h-4" /> },
  { label: "NGO Management", href: "/admin/ngos", icon: <Building2 className="w-4 h-4" /> },
  { label: "Merchants", href: "/admin/merchants", icon: <Store className="w-4 h-4" /> },
  { label: "Beneficiaries", href: "/admin/beneficiaries", icon: <Users className="w-4 h-4" /> },
  { label: "Disasters", href: "/admin/disasters", icon: <AlertTriangle className="w-4 h-4" /> },
  { label: "Bill Review", href: "/admin/bills", icon: <FileText className="w-4 h-4" /> },
  { label: "Complaints", href: "/admin/complaints", icon: <MessageSquare className="w-4 h-4" /> },
  { label: "Transactions", href: "/admin/transactions", icon: <Activity className="w-4 h-4" /> },
  { label: "India Map", href: "/admin/map", icon: <MapPin className="w-4 h-4" /> },
  { label: "Settings", href: "/admin/settings", icon: <Settings className="w-4 h-4" /> },
];

interface Beneficiary {
  id: string;
  citizen_id: string;
  disaster_id: string;
  tokens_allocated: number;
  tokens_spent: number;
  is_active: boolean;
  created_at: string;
  profiles?: { full_name: string; mobile: string; wallet_address: string };
  disasters?: { name: string };
}

export default function AdminBeneficiaries() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    totalAllocated: 0,
    totalSpent: 0,
  });

  useEffect(() => {
    if (!loading && (!user || profile?.role !== "admin")) {
      navigate("/auth/admin");
    }
  }, [user, profile, loading, navigate]);

  useEffect(() => {
    if (user && profile?.role === "admin") {
      fetchBeneficiaries();
    }
  }, [user, profile]);

  const fetchBeneficiaries = async () => {
    setIsRefreshing(true);
    const { data } = await supabase
      .from("beneficiaries")
      .select(`
        *,
        profiles:citizen_id(full_name, mobile, wallet_address),
        disasters:disaster_id(name)
      `)
      .order("created_at", { ascending: false });

    const list = data || [];
    setBeneficiaries(list);

    setStats({
      total: list.length,
      active: list.filter(b => b.is_active).length,
      totalAllocated: list.reduce((sum, b) => sum + Number(b.tokens_allocated || 0), 0),
      totalSpent: list.reduce((sum, b) => sum + Number(b.tokens_spent || 0), 0),
    });

    setIsRefreshing(false);
  };

  const filteredBeneficiaries = beneficiaries.filter((b) => {
    const matchesSearch = 
      b.profiles?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.profiles?.mobile?.includes(searchQuery) ||
      b.disasters?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = 
      statusFilter === "all" || 
      (statusFilter === "active" && b.is_active) ||
      (statusFilter === "inactive" && !b.is_active);
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <DashboardLayout title="Beneficiary Management" navItems={navItems} role="admin">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="stat-card">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="w-4 h-4" />
            <span className="text-xs">Total Beneficiaries</span>
          </div>
          <p className="text-2xl font-bold">{stats.total}</p>
        </Card>
        <Card className="stat-card">
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="w-4 h-4" />
            <span className="text-xs">Active</span>
          </div>
          <p className="text-2xl font-bold text-green-600">{stats.active}</p>
        </Card>
        <Card className="stat-card">
          <div className="flex items-center gap-2 text-primary">
            <Wallet className="w-4 h-4" />
            <span className="text-xs">Total Allocated</span>
          </div>
          <p className="text-2xl font-bold">₹{stats.totalAllocated.toLocaleString("en-IN")}</p>
        </Card>
        <Card className="stat-card">
          <div className="flex items-center gap-2 text-amber-600">
            <TrendingUp className="w-4 h-4" />
            <span className="text-xs">Total Spent</span>
          </div>
          <p className="text-2xl font-bold text-amber-600">₹{stats.totalSpent.toLocaleString("en-IN")}</p>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, mobile, or disaster..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon" onClick={fetchBeneficiaries} disabled={isRefreshing}>
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Beneficiary Registry</CardTitle>
          <CardDescription>All registered beneficiaries across disasters</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Mobile</TableHead>
                <TableHead>Disaster</TableHead>
                <TableHead>Allocated</TableHead>
                <TableHead>Spent</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Registered</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBeneficiaries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No beneficiaries found
                  </TableCell>
                </TableRow>
              ) : (
                filteredBeneficiaries.map((b) => {
                  const balance = Number(b.tokens_allocated || 0) - Number(b.tokens_spent || 0);
                  return (
                    <TableRow key={b.id}>
                      <TableCell className="font-medium">{b.profiles?.full_name || "Unknown"}</TableCell>
                      <TableCell>{b.profiles?.mobile || "-"}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{b.disasters?.name || "Unknown"}</Badge>
                      </TableCell>
                      <TableCell>₹{Number(b.tokens_allocated || 0).toLocaleString("en-IN")}</TableCell>
                      <TableCell>₹{Number(b.tokens_spent || 0).toLocaleString("en-IN")}</TableCell>
                      <TableCell className={balance > 0 ? "text-green-600" : "text-muted-foreground"}>
                        ₹{balance.toLocaleString("en-IN")}
                      </TableCell>
                      <TableCell>
                        <Badge variant={b.is_active ? "default" : "secondary"}>
                          {b.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {b.created_at ? formatDistanceToNow(new Date(b.created_at), { addSuffix: true }) : "-"}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
