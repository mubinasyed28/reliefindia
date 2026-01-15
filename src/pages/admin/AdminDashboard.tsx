import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { DashboardCharts } from "@/components/admin/DashboardCharts";
import { CommandSummary } from "@/components/admin/CommandSummary";
import { LiveActivityFeed } from "@/components/admin/LiveActivityFeed";
import { FraudRiskPanel } from "@/components/admin/FraudRiskPanel";
import { QuickCommandButtons } from "@/components/admin/QuickCommandButtons";
import { SystemHealthPanel } from "@/components/admin/SystemHealthPanel";
import { IndiaMap } from "@/components/map/IndiaMap";
import { 
  LayoutDashboard, 
  Building2, 
  Store, 
  Users, 
  AlertTriangle,
  MapPin,
  Activity,
  FileText,
  Settings,
  Wallet,
  CheckCircle,
  Clock,
  XCircle,
  MessageSquare,
  Send,
  Banknote,
  ShieldAlert,
  Key,
  Map
} from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/admin", icon: <LayoutDashboard className="w-4 h-4" /> },
  { label: "Donations", href: "/admin/donations", icon: <Wallet className="w-4 h-4" /> },
  { label: "Distribute Funds", href: "/admin/distribute", icon: <Send className="w-4 h-4" /> },
  { label: "Settlements", href: "/admin/settlements", icon: <Banknote className="w-4 h-4" /> },
  { label: "NGO Management", href: "/admin/ngos", icon: <Building2 className="w-4 h-4" /> },
  { label: "Merchants", href: "/admin/merchants", icon: <Store className="w-4 h-4" /> },
  { label: "Beneficiaries", href: "/admin/beneficiaries", icon: <Users className="w-4 h-4" /> },
  { label: "Disasters", href: "/admin/disasters", icon: <AlertTriangle className="w-4 h-4" /> },
  { label: "Bill Review", href: "/admin/bills", icon: <FileText className="w-4 h-4" /> },
  { label: "Complaints", href: "/admin/complaints", icon: <MessageSquare className="w-4 h-4" /> },
  { label: "Duplicate Claims", href: "/admin/duplicate-claims", icon: <ShieldAlert className="w-4 h-4" /> },
  { label: "Transactions", href: "/admin/transactions", icon: <Activity className="w-4 h-4" /> },
  { label: "India Map", href: "/admin/map", icon: <MapPin className="w-4 h-4" /> },
  { label: "API Management", href: "/admin/api", icon: <Key className="w-4 h-4" /> },
  { label: "Settings", href: "/admin/settings", icon: <Settings className="w-4 h-4" /> },
];

interface PendingNGO {
  id: string;
  ngo_name: string;
  contact_email: string;
  created_at: string;
  status: string;
}

interface StateData {
  state: string;
  disasters: number;
  fundsAllocated: number;
  fundsSpent: number;
  beneficiaries: number;
}

export default function AdminDashboard() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const [pendingNgos, setPendingNgos] = useState<PendingNGO[]>([]);
  const [selectedState, setSelectedState] = useState<{ state: string; data: StateData } | null>(null);

  useEffect(() => {
    if (!loading && (!user || profile?.role !== "admin")) {
      navigate("/auth/admin");
    }
  }, [user, profile, loading, navigate]);

  useEffect(() => {
    if (user && profile?.role === "admin") {
      fetchPendingNgos();
    }
  }, [user, profile]);

  const fetchPendingNgos = async () => {
    const { data } = await supabase
      .from("ngos")
      .select("id, ngo_name, contact_email, created_at, status")
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(5);

    setPendingNgos(data || []);
  };

  const handleNgoAction = async (ngoId: string, action: "verified" | "rejected") => {
    await supabase
      .from("ngos")
      .update({ status: action })
      .eq("id", ngoId);
    fetchPendingNgos();
  };

  const handleStateClick = (state: string, data: StateData) => {
    setSelectedState({ state, data });
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <DashboardLayout title="National Disaster Command Center" navItems={navItems} role="admin">
      {/* Command Summary - Top Priority Stats */}
      <CommandSummary />

      {/* Quick Command Buttons */}
      <QuickCommandButtons />

      {/* Main Grid: Map + Activity + Risk */}
      <div className="grid lg:grid-cols-3 gap-6 mt-6">
        {/* India Operations Map */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Map className="w-4 h-4 text-primary" />
                India Operations Map
                {selectedState && (
                  <Badge variant="outline" className="ml-2">
                    {selectedState.state}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2">
              <IndiaMap onStateClick={handleStateClick} />
              {selectedState && (
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <h4 className="font-semibold mb-2">{selectedState.state} Statistics</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Disasters</p>
                      <p className="font-bold text-lg">{selectedState.data.disasters}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Allocated</p>
                      <p className="font-bold text-lg">₹{(selectedState.data.fundsAllocated / 100000).toFixed(1)}L</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Spent</p>
                      <p className="font-bold text-lg">₹{(selectedState.data.fundsSpent / 100000).toFixed(1)}L</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Beneficiaries</p>
                      <p className="font-bold text-lg">{selectedState.data.beneficiaries.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Activity + Risk + Health */}
        <div className="space-y-6">
          <LiveActivityFeed />
        </div>
      </div>

      {/* Second Row: Risk + Health + Pending NGOs */}
      <div className="grid lg:grid-cols-3 gap-6 mt-6">
        <FraudRiskPanel />
        <SystemHealthPanel />
        
        {/* Pending NGO Approvals */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              Pending NGO Approvals
              {pendingNgos.length > 0 && (
                <Badge variant="secondary">{pendingNgos.length}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pendingNgos.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                No pending registrations
              </p>
            ) : (
              <div className="space-y-2">
                {pendingNgos.map((ngo) => (
                  <div key={ngo.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-md">
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{ngo.ngo_name}</p>
                      <p className="text-xs text-muted-foreground truncate">{ngo.contact_email}</p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-green-600 hover:bg-green-100 hover:text-green-700"
                        onClick={() => handleNgoAction(ngo.id, "verified")}
                      >
                        <CheckCircle className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-red-600 hover:bg-red-100 hover:text-red-700"
                        onClick={() => handleNgoAction(ngo.id, "rejected")}
                      >
                        <XCircle className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="mt-6">
        <DashboardCharts />
      </div>
    </DashboardLayout>
  );
}
