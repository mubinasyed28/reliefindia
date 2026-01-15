import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { toast } from "sonner";
import { 
  LayoutDashboard, Building2, Store, Users, AlertTriangle,
  MapPin, Activity, FileText, Settings, Send, Banknote,
  ShieldAlert, Key, Heart, Download, TrendingUp, Calendar,
  IndianRupee, Gift
} from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/admin", icon: <LayoutDashboard className="w-4 h-4" /> },
  { label: "Donations", href: "/admin/donations", icon: <Gift className="w-4 h-4" /> },
  { label: "Distribute Funds", href: "/admin/distribute", icon: <Send className="w-4 h-4" /> },
  { label: "Settlements", href: "/admin/settlements", icon: <Banknote className="w-4 h-4" /> },
  { label: "NGO Management", href: "/admin/ngos", icon: <Building2 className="w-4 h-4" /> },
  { label: "Merchants", href: "/admin/merchants", icon: <Store className="w-4 h-4" /> },
  { label: "Beneficiaries", href: "/admin/beneficiaries", icon: <Users className="w-4 h-4" /> },
  { label: "Disasters", href: "/admin/disasters", icon: <AlertTriangle className="w-4 h-4" /> },
  { label: "Bill Review", href: "/admin/bills", icon: <FileText className="w-4 h-4" /> },
  { label: "Duplicate Claims", href: "/admin/duplicate-claims", icon: <ShieldAlert className="w-4 h-4" /> },
  { label: "Transactions", href: "/admin/transactions", icon: <Activity className="w-4 h-4" /> },
  { label: "India Map", href: "/admin/map", icon: <MapPin className="w-4 h-4" /> },
  { label: "API Management", href: "/admin/api", icon: <Key className="w-4 h-4" /> },
  { label: "Settings", href: "/admin/settings", icon: <Settings className="w-4 h-4" /> },
];

interface Donation {
  id: string;
  donor_name: string | null;
  donor_email: string | null;
  amount: number;
  disaster_id: string | null;
  is_anonymous: boolean;
  payment_status: string;
  payment_reference: string | null;
  created_at: string;
  disaster?: { name: string } | null;
}

interface Disaster {
  id: string;
  name: string;
}

interface DonationStats {
  totalAmount: number;
  totalCount: number;
  completedAmount: number;
  topDonor: { name: string; amount: number } | null;
}

export default function AdminDonations() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [disasters, setDisasters] = useState<Disaster[]>([]);
  const [stats, setStats] = useState<DonationStats>({
    totalAmount: 0,
    totalCount: 0,
    completedAmount: 0,
    topDonor: null,
  });
  const [filterDisaster, setFilterDisaster] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!loading && (!user || profile?.role !== "admin")) {
      navigate("/auth/admin");
    }
  }, [user, profile, loading, navigate]);

  useEffect(() => {
    if (user && profile?.role === "admin") {
      fetchDonations();
      fetchDisasters();
    }
  }, [user, profile]);

  const fetchDisasters = async () => {
    const { data } = await supabase.from("disasters").select("id, name");
    setDisasters(data || []);
  };

  const fetchDonations = async () => {
    setDataLoading(true);
    try {
      const { data, error } = await supabase
        .from("donations")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch disaster names for each donation
      const donationsWithDisasters = await Promise.all(
        (data || []).map(async (donation) => {
          if (donation.disaster_id) {
            const { data: disasterData } = await supabase
              .from("disasters")
              .select("name")
              .eq("id", donation.disaster_id)
              .single();
            return { ...donation, disaster: disasterData };
          }
          return { ...donation, disaster: null };
        })
      );

      setDonations(donationsWithDisasters);

      // Calculate stats
      const totalAmount = (data || []).reduce((sum, d) => sum + Number(d.amount), 0);
      const completedAmount = (data || [])
        .filter((d) => d.payment_status === "completed")
        .reduce((sum, d) => sum + Number(d.amount), 0);

      // Find top donor
      const namedDonations = (data || []).filter((d) => d.donor_name && !d.is_anonymous);
      const donorTotals: Record<string, number> = {};
      namedDonations.forEach((d) => {
        if (d.donor_name) {
          donorTotals[d.donor_name] = (donorTotals[d.donor_name] || 0) + Number(d.amount);
        }
      });
      const topDonorEntry = Object.entries(donorTotals).sort((a, b) => b[1] - a[1])[0];

      setStats({
        totalAmount,
        totalCount: (data || []).length,
        completedAmount,
        topDonor: topDonorEntry ? { name: topDonorEntry[0], amount: topDonorEntry[1] } : null,
      });
    } catch (error) {
      console.error("Error fetching donations:", error);
      toast.error("Failed to load donations");
    } finally {
      setDataLoading(false);
    }
  };

  const filteredDonations = donations.filter((d) => {
    if (filterDisaster !== "all" && d.disaster_id !== filterDisaster) return false;
    if (filterStatus !== "all" && d.payment_status !== filterStatus) return false;
    return true;
  });

  const downloadReport = () => {
    const csvContent = [
      ["Date", "Donor Name", "Email", "Amount", "Disaster", "Status", "Reference"].join(","),
      ...filteredDonations.map((d) =>
        [
          format(new Date(d.created_at), "yyyy-MM-dd HH:mm"),
          d.is_anonymous ? "Anonymous" : d.donor_name || "N/A",
          d.donor_email || "N/A",
          d.amount,
          d.disaster?.name || "General Fund",
          d.payment_status,
          d.payment_reference || "N/A",
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `donations-report-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success("Report downloaded successfully");
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <DashboardLayout title="Donations Management" navItems={navItems} role="admin">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-500/20 rounded-lg">
                <IndianRupee className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Donations</p>
                <p className="text-2xl font-bold text-green-600">
                  ₹{stats.totalAmount.toLocaleString("en-IN")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/20 rounded-lg">
                <Heart className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Donors</p>
                <p className="text-2xl font-bold">{stats.totalCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-500/20 rounded-lg">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Completed Payments</p>
                <p className="text-2xl font-bold text-blue-600">
                  ₹{stats.completedAmount.toLocaleString("en-IN")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 border-amber-200 dark:border-amber-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-500/20 rounded-lg">
                <Gift className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Top Donor</p>
                <p className="text-lg font-bold text-amber-600 truncate">
                  {stats.topDonor?.name || "N/A"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-red-500" />
                Donation Records
              </CardTitle>
              <CardDescription>Track all donations received for disaster relief</CardDescription>
            </div>
            <Button onClick={downloadReport} variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              Download Report
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 mb-6">
            <Select value={filterDisaster} onValueChange={setFilterDisaster}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by Disaster" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Disasters</SelectItem>
                {disasters.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {dataLoading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading donations...</p>
            </div>
          ) : filteredDonations.length === 0 ? (
            <div className="text-center py-12">
              <Heart className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-muted-foreground">No donations found</p>
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Donor</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Disaster</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Reference</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDonations.map((donation) => (
                    <TableRow key={donation.id}>
                      <TableCell className="whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          {format(new Date(donation.created_at), "dd MMM yyyy HH:mm")}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {donation.is_anonymous ? "Anonymous Donor" : donation.donor_name || "Unknown"}
                          </p>
                          {donation.donor_email && !donation.is_anonymous && (
                            <p className="text-xs text-muted-foreground">{donation.donor_email}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold text-green-600">
                          ₹{donation.amount.toLocaleString("en-IN")}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {donation.disaster?.name || "General Fund"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={donation.payment_status === "completed" ? "default" : "secondary"}
                          className={
                            donation.payment_status === "completed"
                              ? "bg-green-100 text-green-700 hover:bg-green-100"
                              : ""
                          }
                        >
                          {donation.payment_status}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {donation.payment_reference || "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
