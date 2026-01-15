import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
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
  Send,
  Banknote,
  Wallet,
  ArrowRight,
  CheckCircle,
  Clock,
  CreditCard,
  MessageSquare
} from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/admin", icon: <LayoutDashboard className="w-4 h-4" /> },
  { label: "Distribute Funds", href: "/admin/distribute", icon: <Send className="w-4 h-4" /> },
  { label: "Settlements", href: "/admin/settlements", icon: <Banknote className="w-4 h-4" /> },
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

interface Merchant {
  id: string;
  shop_name: string;
  full_name: string;
  wallet_address: string;
  total_redemptions: number;
  daily_volume: number;
  bank_name?: string;
  bank_account?: string;
  bank_ifsc?: string;
  is_active: boolean;
  pending_settlement: number;
}

interface Settlement {
  id: string;
  merchant_name: string;
  amount: number;
  created_at: string;
  status: string;
  bank_reference?: string;
}

const TOKEN_RATE = 1;

export default function AdminSettlements() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [selectedMerchant, setSelectedMerchant] = useState<Merchant | null>(null);
  const [settlementAmount, setSettlementAmount] = useState("");
  const [bankReference, setBankReference] = useState("");
  const [processing, setProcessing] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    if (!loading && (!user || profile?.role !== "admin")) {
      navigate("/auth/admin");
    }
  }, [user, profile, loading, navigate]);

  useEffect(() => {
    if (user && profile?.role === "admin") {
      fetchMerchants();
      fetchSettlements();
    }
  }, [user, profile]);

  const fetchMerchants = async () => {
    const { data: merchantsData } = await supabase
      .from("merchants")
      .select("*")
      .eq("is_active", true)
      .order("total_redemptions", { ascending: false });

    if (merchantsData) {
      const enriched = await Promise.all(
        merchantsData.map(async (m) => {
          // Calculate pending settlement from transactions
          const { data: txData } = await supabase
            .from("transactions")
            .select("amount")
            .eq("to_wallet", m.wallet_address)
            .eq("to_type", "merchant")
            .eq("status", "completed");

          const totalReceived = txData?.reduce((sum, tx) => sum + Number(tx.amount), 0) || 0;

          // Get already settled amount
          const { data: settledData } = await supabase
            .from("transactions")
            .select("amount")
            .eq("from_wallet", m.wallet_address)
            .eq("from_type", "merchant")
            .eq("to_type", "bank")
            .eq("status", "completed");

          const totalSettled = settledData?.reduce((sum, tx) => sum + Number(tx.amount), 0) || 0;

          return {
            ...m,
            pending_settlement: totalReceived - totalSettled,
          };
        })
      );
      setMerchants(enriched);
    }
  };

  const fetchSettlements = async () => {
    const { data } = await supabase
      .from("transactions")
      .select("*")
      .eq("to_type", "bank")
      .eq("from_type", "merchant")
      .order("created_at", { ascending: false })
      .limit(20);

    if (data) {
      const enriched = await Promise.all(
        data.map(async (tx) => {
          const { data: merchant } = await supabase
            .from("merchants")
            .select("shop_name")
            .eq("wallet_address", tx.from_wallet)
            .maybeSingle();

          return {
            id: tx.id,
            merchant_name: merchant?.shop_name || "Unknown",
            amount: tx.amount,
            created_at: tx.created_at,
            status: tx.status,
            bank_reference: tx.transaction_hash,
          };
        })
      );
      setSettlements(enriched);
    }
  };

  const handleSettle = async () => {
    if (!selectedMerchant || !settlementAmount) {
      toast.error("Please enter settlement amount");
      return;
    }

    const amount = parseFloat(settlementAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (amount > selectedMerchant.pending_settlement) {
      toast.error("Amount exceeds pending settlement");
      return;
    }

    setProcessing(true);

    try {
      const txHash = bankReference || `NEFT${Date.now()}${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

      // Create settlement transaction
      const { error: txError } = await supabase
        .from("transactions")
        .insert({
          from_wallet: selectedMerchant.wallet_address,
          to_wallet: "BANK_SETTLEMENT",
          from_type: "merchant",
          to_type: "bank",
          amount: amount,
          purpose: `Bank settlement for ${selectedMerchant.shop_name}`,
          status: "completed",
          transaction_hash: txHash,
        });

      if (txError) throw txError;

      // Log audit
      await supabase.from("audit_logs").insert({
        action: "MERCHANT_SETTLEMENT",
        entity_type: "merchant",
        entity_id: selectedMerchant.id,
        performed_by: user?.id,
        details: {
          merchant_id: selectedMerchant.id,
          merchant_name: selectedMerchant.shop_name,
          amount_inr: amount,
          bank_reference: txHash,
        },
      });

      toast.success(`₹${amount.toLocaleString("en-IN")} settled to ${selectedMerchant.shop_name}'s bank account`);
      setDialogOpen(false);
      setSettlementAmount("");
      setBankReference("");
      setSelectedMerchant(null);
      fetchMerchants();
      fetchSettlements();
    } catch (error: any) {
      toast.error(error.message || "Settlement failed");
    } finally {
      setProcessing(false);
    }
  };

  const openSettlementDialog = (merchant: Merchant) => {
    setSelectedMerchant(merchant);
    setSettlementAmount(merchant.pending_settlement.toString());
    setDialogOpen(true);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  const totalPending = merchants.reduce((sum, m) => sum + m.pending_settlement, 0);

  return (
    <DashboardLayout title="Merchant Settlements" navItems={navItems} role="admin">
      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <Card className="animate-fade-in-up">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Store className="w-4 h-4" />
              Active Merchants
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{merchants.length}</p>
          </CardContent>
        </Card>

        <Card className="animate-fade-in-up animate-delay-100">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              Pending Settlements
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-amber-600">
              ₹{totalPending.toLocaleString("en-IN")}
            </p>
          </CardContent>
        </Card>

        <Card className="animate-fade-in-up animate-delay-200">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Settled Today
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">
              ₹{settlements
                .filter(s => new Date(s.created_at).toDateString() === new Date().toDateString())
                .reduce((sum, s) => sum + s.amount, 0)
                .toLocaleString("en-IN")}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Merchants with Pending Settlements */}
        <Card className="animate-fade-in-up animate-delay-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-amber-500" />
              Pending Merchant Settlements
            </CardTitle>
            <CardDescription>
              Convert merchant tokens to INR and transfer to bank
            </CardDescription>
          </CardHeader>
          <CardContent>
            {merchants.filter(m => m.pending_settlement > 0).length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No pending settlements
              </p>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {merchants
                  .filter(m => m.pending_settlement > 0)
                  .map((merchant) => (
                    <div key={merchant.id} className="p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-medium">{merchant.shop_name}</p>
                          <p className="text-sm text-muted-foreground">{merchant.full_name}</p>
                        </div>
                        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                          Pending
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-sm">
                          <span className="text-muted-foreground">Tokens: </span>
                          <span className="font-medium">{merchant.pending_settlement.toLocaleString("en-IN")}</span>
                          <ArrowRight className="w-3 h-3 inline mx-2" />
                          <span className="text-green-600 font-semibold">
                            ₹{merchant.pending_settlement.toLocaleString("en-IN")}
                          </span>
                        </div>
                        <Button size="sm" onClick={() => openSettlementDialog(merchant)}>
                          <CreditCard className="w-4 h-4 mr-1" />
                          Settle
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Settlements */}
        <Card className="animate-fade-in-up animate-delay-400">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Banknote className="w-5 h-5 text-green-500" />
              Recent Settlements
            </CardTitle>
            <CardDescription>Bank transfers to merchants</CardDescription>
          </CardHeader>
          <CardContent>
            {settlements.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No settlements yet
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Merchant</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {settlements.map((settlement) => (
                    <TableRow key={settlement.id}>
                      <TableCell className="font-medium">{settlement.merchant_name}</TableCell>
                      <TableCell className="text-green-600">
                        ₹{settlement.amount.toLocaleString("en-IN")}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(settlement.created_at).toLocaleDateString("en-IN")}
                      </TableCell>
                      <TableCell>
                        <Badge variant="default" className="bg-green-500">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Settled
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Settlement Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Settle Merchant Tokens</DialogTitle>
            <DialogDescription>
              Convert tokens to INR and transfer to {selectedMerchant?.shop_name}'s bank account
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex justify-between mb-2">
                <span className="text-muted-foreground">Merchant:</span>
                <span className="font-medium">{selectedMerchant?.shop_name}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-muted-foreground">Pending Tokens:</span>
                <span className="font-medium">{selectedMerchant?.pending_settlement.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">INR Value:</span>
                <span className="font-medium text-green-600">
                  ₹{selectedMerchant?.pending_settlement.toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Settlement Amount (INR)</Label>
              <Input
                type="number"
                value={settlementAmount}
                onChange={(e) => setSettlementAmount(e.target.value)}
                max={selectedMerchant?.pending_settlement}
              />
            </div>

            <div className="space-y-2">
              <Label>Bank Reference (Optional)</Label>
              <Input
                placeholder="NEFT/IMPS Reference Number"
                value={bankReference}
                onChange={(e) => setBankReference(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSettle} disabled={processing}>
              {processing ? "Processing..." : "Confirm Settlement"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
