import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Building2,
  Store,
  AlertTriangle,
  ClipboardList,
  Settings,
  Map,
  Wallet,
  FileText,
  Ban,
  CheckCircle,
  Eye,
  AlertOctagon,
  ShieldAlert,
  Key,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const navItems = [
  { label: "Dashboard", href: "/admin", icon: <LayoutDashboard className="w-4 h-4" /> },
  { label: "Disasters", href: "/admin/disasters", icon: <AlertTriangle className="w-4 h-4" /> },
  { label: "Map View", href: "/admin/map", icon: <Map className="w-4 h-4" /> },
  { label: "Beneficiaries", href: "/admin/beneficiaries", icon: <Users className="w-4 h-4" /> },
  { label: "NGOs", href: "/admin/ngos", icon: <Building2 className="w-4 h-4" /> },
  { label: "Merchants", href: "/admin/merchants", icon: <Store className="w-4 h-4" /> },
  { label: "Distribute Funds", href: "/admin/distribute", icon: <Wallet className="w-4 h-4" /> },
  { label: "Settlements", href: "/admin/settlements", icon: <Wallet className="w-4 h-4" /> },
  { label: "Bill Review", href: "/admin/bills", icon: <FileText className="w-4 h-4" /> },
  { label: "Grievances", href: "/admin/grievances", icon: <ClipboardList className="w-4 h-4" /> },
  { label: "Complaints", href: "/admin/complaints", icon: <ClipboardList className="w-4 h-4" /> },
  { label: "Duplicate Claims", href: "/admin/duplicate-claims", icon: <ShieldAlert className="w-4 h-4" /> },
  { label: "API Management", href: "/admin/api", icon: <Key className="w-4 h-4" /> },
  { label: "Settings", href: "/admin/settings", icon: <Settings className="w-4 h-4" /> },
];

interface DuplicateClaim {
  id: string;
  aadhaar_hash: string;
  wallet_addresses: string[];
  status: string;
  flagged_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  notes: string | null;
}

interface WalletDetails {
  wallet_address: string;
  owner_type: string;
  owner_name: string;
  balance: number;
  is_frozen: boolean;
}

export default function AdminDuplicateClaims() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const [claims, setClaims] = useState<DuplicateClaim[]>([]);
  const [selectedClaim, setSelectedClaim] = useState<DuplicateClaim | null>(null);
  const [walletDetails, setWalletDetails] = useState<WalletDetails[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [reviewNotes, setReviewNotes] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!loading && (!user || profile?.role !== "admin")) {
      navigate("/auth/admin");
    }
  }, [user, profile, loading, navigate]);

  useEffect(() => {
    fetchClaims();
  }, []);

  const fetchClaims = async () => {
    const { data, error } = await supabase
      .from("duplicate_claims")
      .select("*")
      .order("flagged_at", { ascending: false });

    if (error) {
      toast.error("Failed to fetch duplicate claims");
      return;
    }

    setClaims(data || []);
  };

  const fetchWalletDetails = async (walletAddresses: string[]) => {
    const details: WalletDetails[] = [];

    for (const wallet of walletAddresses) {
      // Check profiles
      const { data: profileData } = await supabase
        .from("profiles")
        .select("full_name, wallet_balance")
        .eq("wallet_address", wallet)
        .maybeSingle();

      if (profileData) {
        details.push({
          wallet_address: wallet,
          owner_type: "Citizen",
          owner_name: profileData.full_name || "Unknown",
          balance: Number(profileData.wallet_balance) || 0,
          is_frozen: false,
        });
        continue;
      }

      // Check merchants
      const { data: merchantData } = await supabase
        .from("merchants")
        .select("full_name, is_active")
        .eq("wallet_address", wallet)
        .maybeSingle();

      if (merchantData) {
        details.push({
          wallet_address: wallet,
          owner_type: "Merchant",
          owner_name: merchantData.full_name || "Unknown",
          balance: 0,
          is_frozen: !merchantData.is_active,
        });
        continue;
      }

      // Check NGOs
      const { data: ngoData } = await supabase
        .from("ngos")
        .select("ngo_name, wallet_balance")
        .eq("wallet_address", wallet)
        .maybeSingle();

      if (ngoData) {
        details.push({
          wallet_address: wallet,
          owner_type: "NGO",
          owner_name: ngoData.ngo_name || "Unknown",
          balance: Number(ngoData.wallet_balance) || 0,
          is_frozen: false,
        });
      }
    }

    setWalletDetails(details);
  };

  const openClaimDetails = async (claim: DuplicateClaim) => {
    setSelectedClaim(claim);
    setReviewNotes(claim.notes || "");
    await fetchWalletDetails(claim.wallet_addresses);
    setShowDialog(true);
  };

  const handleResolve = async (action: "dismiss" | "freeze_all" | "freeze_duplicates") => {
    if (!selectedClaim) return;
    setIsProcessing(true);

    try {
      if (action === "freeze_all" || action === "freeze_duplicates") {
        // Freeze wallets
        const walletsToFreeze = action === "freeze_all" 
          ? selectedClaim.wallet_addresses 
          : selectedClaim.wallet_addresses.slice(1); // Keep first, freeze rest

        for (const wallet of walletsToFreeze) {
          // Update tokens to frozen
          await supabase
            .from("tokens")
            .update({ is_frozen: true })
            .eq("owner_id", wallet);

          // Deactivate merchants
          await supabase
            .from("merchants")
            .update({ is_active: false })
            .eq("wallet_address", wallet);
        }
      }

      // Update claim status
      await supabase
        .from("duplicate_claims")
        .update({
          status: action === "dismiss" ? "dismissed" : "resolved",
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id,
          notes: reviewNotes,
        })
        .eq("id", selectedClaim.id);

      // Log audit
      await supabase.from("audit_logs").insert({
        entity_type: "duplicate_claim",
        entity_id: selectedClaim.id,
        action: `duplicate_claim_${action}`,
        performed_by: user?.id,
        details: {
          wallet_count: selectedClaim.wallet_addresses.length,
          action_taken: action,
        },
      });

      toast.success(
        action === "dismiss" 
          ? "Claim dismissed" 
          : `Wallets ${action === "freeze_all" ? "all frozen" : "duplicate wallets frozen"}`
      );
      setShowDialog(false);
      fetchClaims();
    } catch (error) {
      toast.error("Failed to process claim");
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "flagged":
        return <Badge variant="destructive" className="flex items-center gap-1"><AlertOctagon className="w-3 h-3" /> Flagged</Badge>;
      case "resolved":
        return <Badge className="bg-success text-white flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Resolved</Badge>;
      case "dismissed":
        return <Badge variant="secondary" className="flex items-center gap-1"><Ban className="w-3 h-3" /> Dismissed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <DashboardLayout title="Duplicate Aadhaar Claims" navItems={navItems} role="admin">
      <div className="mb-6">
        <Card className="border-destructive/20 bg-destructive/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-destructive" />
              Fraud Detection System
            </CardTitle>
            <CardDescription>
              Review cases where one Aadhaar has been used to create multiple wallets
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-destructive">
                {claims.filter(c => c.status === "flagged").length}
              </p>
              <p className="text-sm text-muted-foreground">Pending Review</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-success">
                {claims.filter(c => c.status === "resolved").length}
              </p>
              <p className="text-sm text-muted-foreground">Resolved</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-muted-foreground">
                {claims.filter(c => c.status === "dismissed").length}
              </p>
              <p className="text-sm text-muted-foreground">Dismissed</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Claims Table */}
      <Card>
        <CardHeader>
          <CardTitle>Duplicate Claims</CardTitle>
        </CardHeader>
        <CardContent>
          {claims.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ShieldAlert className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No duplicate claims detected</p>
              <p className="text-sm">The system is actively monitoring for fraud</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Aadhaar Hash</TableHead>
                  <TableHead>Wallets Found</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Flagged At</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {claims.map((claim) => (
                  <TableRow key={claim.id}>
                    <TableCell className="font-mono text-xs">
                      {claim.aadhaar_hash.slice(0, 16)}...
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-destructive/10">
                        {claim.wallet_addresses.length} wallets
                      </Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(claim.status)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(claim.flagged_at).toLocaleString("en-IN")}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openClaimDetails(claim)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Review
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Review Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-destructive" />
              Duplicate Aadhaar Review
            </DialogTitle>
            <DialogDescription>
              Multiple wallets were created using the same Aadhaar credentials
            </DialogDescription>
          </DialogHeader>

          {selectedClaim && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Aadhaar Hash</p>
                  <p className="font-mono">{selectedClaim.aadhaar_hash}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Flagged At</p>
                  <p>{new Date(selectedClaim.flagged_at).toLocaleString("en-IN")}</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">Associated Wallets ({walletDetails.length})</p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {walletDetails.map((wallet, idx) => (
                    <div 
                      key={wallet.wallet_address} 
                      className={`p-3 rounded-lg border ${idx === 0 ? 'bg-green-50 border-green-200 dark:bg-green-900/20' : 'bg-destructive/5 border-destructive/20'}`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{wallet.owner_name}</p>
                          <p className="text-xs text-muted-foreground font-mono">
                            {wallet.wallet_address.slice(0, 20)}...
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge variant={idx === 0 ? "default" : "destructive"}>
                            {wallet.owner_type}
                          </Badge>
                          <p className="text-xs mt-1">Balance: ₹{wallet.balance.toLocaleString("en-IN")}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">Review Notes</p>
                <Textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Add notes about this case..."
                  className="min-h-[80px]"
                />
              </div>
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => handleResolve("dismiss")}
              disabled={isProcessing || selectedClaim?.status !== "flagged"}
            >
              <Ban className="w-4 h-4 mr-1" />
              Dismiss (False Positive)
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleResolve("freeze_duplicates")}
              disabled={isProcessing || selectedClaim?.status !== "flagged"}
            >
              <AlertTriangle className="w-4 h-4 mr-1" />
              Freeze Duplicates
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleResolve("freeze_all")}
              disabled={isProcessing || selectedClaim?.status !== "flagged"}
            >
              <Ban className="w-4 h-4 mr-1" />
              Freeze All Wallets
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
