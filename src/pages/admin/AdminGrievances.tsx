import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  LayoutDashboard, Building2, Store, Users, AlertTriangle, MapPin, Activity,
  FileText, Settings, MessageSquare, Search, Eye, CheckCircle, XCircle, Clock
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const navItems = [
  { label: "Dashboard", href: "/admin", icon: <LayoutDashboard className="w-4 h-4" /> },
  { label: "NGO Management", href: "/admin/ngos", icon: <Building2 className="w-4 h-4" /> },
  { label: "Merchants", href: "/admin/merchants", icon: <Store className="w-4 h-4" /> },
  { label: "Beneficiaries", href: "/admin/beneficiaries", icon: <Users className="w-4 h-4" /> },
  { label: "Disasters", href: "/admin/disasters", icon: <AlertTriangle className="w-4 h-4" /> },
  { label: "Bill Review", href: "/admin/bills", icon: <FileText className="w-4 h-4" /> },
  { label: "Grievances", href: "/admin/grievances", icon: <MessageSquare className="w-4 h-4" /> },
  { label: "Transactions", href: "/admin/transactions", icon: <Activity className="w-4 h-4" /> },
  { label: "India Map", href: "/admin/map", icon: <MapPin className="w-4 h-4" /> },
  { label: "Settings", href: "/admin/settings", icon: <Settings className="w-4 h-4" /> },
];

interface Grievance {
  id: string;
  complainant_id: string;
  grievance_type: string;
  description: string;
  status: string;
  resolution: string | null;
  created_at: string;
}

export default function AdminGrievances() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const [grievances, setGrievances] = useState<Grievance[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedGrievance, setSelectedGrievance] = useState<Grievance | null>(null);
  const [resolution, setResolution] = useState("");
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    if (!loading && (!user || profile?.role !== "admin")) {
      navigate("/auth/admin");
    }
  }, [user, profile, loading, navigate]);

  useEffect(() => {
    if (user && profile?.role === "admin") {
      fetchGrievances();
    }
  }, [user, profile]);

  const fetchGrievances = async () => {
    setLoadingData(true);
    const { data, error } = await supabase
      .from("grievances")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setGrievances(data);
    }
    setLoadingData(false);
  };

  const handleResolve = async (status: "resolved" | "dismissed") => {
    if (!selectedGrievance || !user) return;

    setResolving(true);
    try {
      const { error } = await supabase
        .from("grievances")
        .update({
          status,
          resolution: resolution || null,
          resolved_by: user.id,
          resolved_at: new Date().toISOString(),
        })
        .eq("id", selectedGrievance.id);

      if (error) throw error;

      toast.success(`Grievance ${status === "resolved" ? "resolved" : "dismissed"} successfully`);
      setSelectedGrievance(null);
      setResolution("");
      fetchGrievances();
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to update grievance");
    } finally {
      setResolving(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary" className="bg-amber-100 text-amber-700"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case "investigating":
        return <Badge variant="secondary" className="bg-blue-100 text-blue-700"><Eye className="w-3 h-3 mr-1" />Investigating</Badge>;
      case "resolved":
        return <Badge variant="default" className="bg-green-600"><CheckCircle className="w-3 h-3 mr-1" />Resolved</Badge>;
      case "dismissed":
        return <Badge variant="secondary" className="bg-gray-100 text-gray-700"><XCircle className="w-3 h-3 mr-1" />Dismissed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "overpricing":
        return <Badge variant="destructive">Overpricing</Badge>;
      case "refusal_of_service":
        return <Badge variant="secondary" className="bg-amber-100 text-amber-700">Refusal of Service</Badge>;
      case "fraud":
        return <Badge variant="destructive">Fraud</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const filteredGrievances = grievances.filter((g) => {
    const matchesSearch = g.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.grievance_type.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === "all" || g.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: grievances.length,
    pending: grievances.filter((g) => g.status === "pending").length,
    investigating: grievances.filter((g) => g.status === "investigating").length,
    resolved: grievances.filter((g) => g.status === "resolved").length,
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <DashboardLayout title="Grievance Management" navItems={navItems} role="admin">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-muted/50">
          <CardContent className="pt-4">
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-sm text-muted-foreground">Total Grievances</p>
          </CardContent>
        </Card>
        <Card className="bg-amber-50 dark:bg-amber-900/20">
          <CardContent className="pt-4">
            <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">{stats.pending}</p>
            <p className="text-sm text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
        <Card className="bg-blue-50 dark:bg-blue-900/20">
          <CardContent className="pt-4">
            <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">{stats.investigating}</p>
            <p className="text-sm text-muted-foreground">Investigating</p>
          </CardContent>
        </Card>
        <Card className="bg-green-50 dark:bg-green-900/20">
          <CardContent className="pt-4">
            <p className="text-2xl font-bold text-green-700 dark:text-green-400">{stats.resolved}</p>
            <p className="text-sm text-muted-foreground">Resolved</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search grievances..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="investigating">Investigating</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="dismissed">Dismissed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Grievances List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            Grievances
          </CardTitle>
          <CardDescription>
            Citizen complaints and grievances requiring attention
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingData ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : filteredGrievances.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No grievances found
            </div>
          ) : (
            <div className="space-y-4">
              {filteredGrievances.map((grievance) => (
                <div
                  key={grievance.id}
                  className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        {getTypeBadge(grievance.grievance_type)}
                        {getStatusBadge(grievance.status)}
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(grievance.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-sm line-clamp-2">{grievance.description}</p>
                      {grievance.resolution && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Resolution: {grievance.resolution}
                        </p>
                      )}
                    </div>
                    {grievance.status === "pending" || grievance.status === "investigating" ? (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedGrievance(grievance)}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Review
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Review Grievance</DialogTitle>
                            <DialogDescription>
                              Review and resolve this grievance
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <p className="text-sm font-medium mb-1">Type</p>
                              {getTypeBadge(grievance.grievance_type)}
                            </div>
                            <div>
                              <p className="text-sm font-medium mb-1">Description</p>
                              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                {grievance.description}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm font-medium mb-1">Resolution Notes</p>
                              <Textarea
                                value={resolution}
                                onChange={(e) => setResolution(e.target.value)}
                                placeholder="Enter resolution notes..."
                                rows={3}
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button
                                className="flex-1 bg-green-600 hover:bg-green-700"
                                onClick={() => handleResolve("resolved")}
                                disabled={resolving}
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Resolve
                              </Button>
                              <Button
                                variant="outline"
                                className="flex-1"
                                onClick={() => handleResolve("dismissed")}
                                disabled={resolving}
                              >
                                <XCircle className="w-4 h-4 mr-1" />
                                Dismiss
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    ) : (
                      <Badge variant="outline">Closed</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
