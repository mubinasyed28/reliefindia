import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { IndiaMap } from "@/components/map/IndiaMap";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { 
  LayoutDashboard, Building2, Store, Users, AlertTriangle, MapPin, FileText, Settings,
  FileCheck, Wallet, TrendingUp, Activity, MessageSquare, Eye, ChevronRight
} from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/admin", icon: <LayoutDashboard className="w-4 h-4" /> },
  { label: "NGO Management", href: "/admin/ngos", icon: <Building2 className="w-4 h-4" /> },
  { label: "Merchants", href: "/admin/merchants", icon: <Store className="w-4 h-4" /> },
  { label: "Beneficiaries", href: "/admin/beneficiaries", icon: <Users className="w-4 h-4" /> },
  { label: "Disasters", href: "/admin/disasters", icon: <AlertTriangle className="w-4 h-4" /> },
  { label: "Bill Review", href: "/admin/bills", icon: <FileCheck className="w-4 h-4" /> },
  { label: "Complaints", href: "/admin/complaints", icon: <MessageSquare className="w-4 h-4" /> },
  { label: "Transactions", href: "/admin/transactions", icon: <Activity className="w-4 h-4" /> },
  { label: "India Map", href: "/admin/map", icon: <MapPin className="w-4 h-4" /> },
  { label: "Settings", href: "/admin/settings", icon: <Settings className="w-4 h-4" /> },
];

interface StateData {
  state: string;
  disasters: number;
  fundsAllocated: number;
  fundsSpent: number;
  beneficiaries: number;
}

interface NationalStats {
  totalDisasters: number;
  totalFundsAllocated: number;
  totalFundsSpent: number;
  totalBeneficiaries: number;
  affectedStates: number;
  totalNgos: number;
  totalMerchants: number;
}

interface DisasterInfo {
  id: string;
  name: string;
  status: string;
  total_tokens_allocated: number;
  tokens_distributed: number;
  created_at: string;
}

export default function AdminMapView() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const [selectedState, setSelectedState] = useState<StateData | null>(null);
  const [stateDetailOpen, setStateDetailOpen] = useState(false);
  const [stateDisasters, setStateDisasters] = useState<DisasterInfo[]>([]);
  const [nationalStats, setNationalStats] = useState<NationalStats>({
    totalDisasters: 0,
    totalFundsAllocated: 0,
    totalFundsSpent: 0,
    totalBeneficiaries: 0,
    affectedStates: 0,
    totalNgos: 0,
    totalMerchants: 0,
  });

  useEffect(() => {
    if (!loading && (!user || profile?.role !== "admin")) {
      navigate("/auth/admin");
    }
  }, [user, profile, loading, navigate]);

  useEffect(() => {
    if (user && profile?.role === "admin") {
      fetchNationalStats();
    }
  }, [user, profile]);

  const fetchNationalStats = async () => {
    const { data: disasters } = await supabase
      .from("disasters")
      .select("affected_states, total_tokens_allocated, tokens_distributed");

    const { count: beneficiaryCount } = await supabase
      .from("beneficiaries")
      .select("*", { count: "exact", head: true });

    const { count: ngoCount } = await supabase
      .from("ngos")
      .select("*", { count: "exact", head: true })
      .eq("status", "verified");

    const { count: merchantCount } = await supabase
      .from("merchants")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true);

    const allStates = new Set<string>();
    let totalAllocated = 0;
    let totalSpent = 0;

    disasters?.forEach((d) => {
      d.affected_states?.forEach((s: string) => allStates.add(s));
      totalAllocated += Number(d.total_tokens_allocated) || 0;
      totalSpent += Number(d.tokens_distributed) || 0;
    });

    setNationalStats({
      totalDisasters: disasters?.length || 0,
      totalFundsAllocated: totalAllocated,
      totalFundsSpent: totalSpent,
      totalBeneficiaries: beneficiaryCount || 0,
      affectedStates: allStates.size,
      totalNgos: ngoCount || 0,
      totalMerchants: merchantCount || 0,
    });
  };

  const handleStateClick = async (state: string, data: StateData) => {
    setSelectedState(data);
    
    // Fetch disasters for this state
    const { data: disasters } = await supabase
      .from("disasters")
      .select("id, name, status, total_tokens_allocated, tokens_distributed, created_at")
      .contains("affected_states", [state])
      .order("created_at", { ascending: false });
    
    setStateDisasters(disasters || []);
  };

  const openStateDetail = () => {
    if (selectedState) {
      setStateDetailOpen(true);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <DashboardLayout title="India Map Analytics" navItems={navItems} role="admin">
      {/* National Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
        <Card className="animate-fade-in-up">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-xs">Disasters</span>
            </div>
            <p className="text-2xl font-bold">{nationalStats.totalDisasters}</p>
          </CardContent>
        </Card>

        <Card className="animate-fade-in-up animate-delay-100">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <MapPin className="w-4 h-4" />
              <span className="text-xs">States Affected</span>
            </div>
            <p className="text-2xl font-bold">{nationalStats.affectedStates}</p>
          </CardContent>
        </Card>

        <Card className="animate-fade-in-up animate-delay-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-green-600 mb-1">
              <Wallet className="w-4 h-4" />
              <span className="text-xs">Allocated</span>
            </div>
            <p className="text-lg font-bold text-green-600">₹{(nationalStats.totalFundsAllocated / 100000).toFixed(1)}L</p>
          </CardContent>
        </Card>

        <Card className="animate-fade-in-up animate-delay-300">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-blue-600 mb-1">
              <TrendingUp className="w-4 h-4" />
              <span className="text-xs">Utilized</span>
            </div>
            <p className="text-lg font-bold text-blue-600">₹{(nationalStats.totalFundsSpent / 100000).toFixed(1)}L</p>
          </CardContent>
        </Card>

        <Card className="animate-fade-in-up animate-delay-400">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Users className="w-4 h-4" />
              <span className="text-xs">Beneficiaries</span>
            </div>
            <p className="text-2xl font-bold">{nationalStats.totalBeneficiaries.toLocaleString("en-IN")}</p>
          </CardContent>
        </Card>

        <Card className="animate-fade-in-up animate-delay-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-primary mb-1">
              <Building2 className="w-4 h-4" />
              <span className="text-xs">NGOs</span>
            </div>
            <p className="text-2xl font-bold">{nationalStats.totalNgos}</p>
          </CardContent>
        </Card>

        <Card className="animate-fade-in-up animate-delay-600">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-amber-600 mb-1">
              <Store className="w-4 h-4" />
              <span className="text-xs">Merchants</span>
            </div>
            <p className="text-2xl font-bold">{nationalStats.totalMerchants}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Map */}
        <Card className="lg:col-span-2 animate-fade-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              State-wise Disaster Distribution
            </CardTitle>
            <CardDescription>
              Click on state markers to view detailed information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <IndiaMap onStateClick={handleStateClick} />
            <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-primary" />
                <span>Funds Utilized</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-muted border-2 border-primary" />
                <span>Funds Available</span>
              </div>
              <div className="flex items-center gap-2">
                <span>Marker size = Fund allocation</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* State Details */}
        <Card className="animate-fade-in-up animate-delay-200">
          <CardHeader>
            <CardTitle className="text-lg">State Details</CardTitle>
            <CardDescription>
              {selectedState 
                ? `Viewing ${selectedState.state}` 
                : "Select a state on the map"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedState ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">{selectedState.state}</h3>
                  <Badge variant={selectedState.disasters > 0 ? "destructive" : "secondary"}>
                    {selectedState.disasters} Disaster{selectedState.disasters !== 1 ? "s" : ""}
                  </Badge>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Funds Allocated</span>
                    <span className="font-medium">
                      ₹{selectedState.fundsAllocated.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Funds Spent</span>
                    <span className="font-medium text-primary">
                      ₹{selectedState.fundsSpent.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Available Funds</span>
                    <span className="font-medium text-green-600">
                      ₹{(selectedState.fundsAllocated - selectedState.fundsSpent).toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Beneficiaries</span>
                    <span className="font-medium">
                      {selectedState.beneficiaries.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-muted-foreground">Utilization Rate</span>
                    <span className="font-medium">
                      {selectedState.fundsAllocated > 0
                        ? ((selectedState.fundsSpent / selectedState.fundsAllocated) * 100).toFixed(1)
                        : 0}%
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Fund Utilization</span>
                    <span>
                      {selectedState.fundsAllocated > 0
                        ? ((selectedState.fundsSpent / selectedState.fundsAllocated) * 100).toFixed(0)
                        : 0}%
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-3">
                    <div
                      className="bg-primary h-3 rounded-full transition-all duration-500"
                      style={{
                        width: `${
                          selectedState.fundsAllocated > 0
                            ? Math.min((selectedState.fundsSpent / selectedState.fundsAllocated) * 100, 100)
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>

                <Button onClick={openStateDetail} className="w-full mt-4">
                  <Eye className="w-4 h-4 mr-2" />
                  View Detailed Breakdown
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <MapPin className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Click on a state marker to view detailed disaster relief information</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* State Detail Dialog */}
      <Dialog open={stateDetailOpen} onOpenChange={setStateDetailOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              {selectedState?.state} - Detailed Breakdown
            </DialogTitle>
            <DialogDescription>
              All disaster relief operations in this state
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="h-[500px] mt-4">
            <div className="space-y-6">
              {/* Summary Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <AlertTriangle className="w-6 h-6 mx-auto mb-2 text-destructive" />
                    <p className="text-2xl font-bold">{selectedState?.disasters}</p>
                    <p className="text-xs text-muted-foreground">Disasters</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <Wallet className="w-6 h-6 mx-auto mb-2 text-green-600" />
                    <p className="text-lg font-bold">₹{((selectedState?.fundsAllocated || 0) / 100000).toFixed(1)}L</p>
                    <p className="text-xs text-muted-foreground">Allocated</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <TrendingUp className="w-6 h-6 mx-auto mb-2 text-blue-600" />
                    <p className="text-lg font-bold">₹{((selectedState?.fundsSpent || 0) / 100000).toFixed(1)}L</p>
                    <p className="text-xs text-muted-foreground">Utilized</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <Users className="w-6 h-6 mx-auto mb-2 text-primary" />
                    <p className="text-2xl font-bold">{selectedState?.beneficiaries.toLocaleString("en-IN")}</p>
                    <p className="text-xs text-muted-foreground">Beneficiaries</p>
                  </CardContent>
                </Card>
              </div>

              {/* Disasters Table */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Disasters in {selectedState?.state}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Disaster</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Allocated</TableHead>
                        <TableHead>Distributed</TableHead>
                        <TableHead>Utilization</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stateDisasters.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                            No disasters found
                          </TableCell>
                        </TableRow>
                      ) : (
                        stateDisasters.map((disaster) => {
                          const util = Number(disaster.total_tokens_allocated) > 0
                            ? (Number(disaster.tokens_distributed) / Number(disaster.total_tokens_allocated)) * 100
                            : 0;
                          return (
                            <TableRow key={disaster.id}>
                              <TableCell className="font-medium">{disaster.name}</TableCell>
                              <TableCell>
                                <Badge variant={disaster.status === "active" ? "destructive" : "secondary"}>
                                  {disaster.status}
                                </Badge>
                              </TableCell>
                              <TableCell>₹{Number(disaster.total_tokens_allocated).toLocaleString("en-IN")}</TableCell>
                              <TableCell>₹{Number(disaster.tokens_distributed).toLocaleString("en-IN")}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <div className="w-16 bg-muted rounded-full h-2">
                                    <div 
                                      className="bg-primary h-2 rounded-full" 
                                      style={{ width: `${Math.min(util, 100)}%` }}
                                    />
                                  </div>
                                  <span className="text-sm">{util.toFixed(0)}%</span>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
