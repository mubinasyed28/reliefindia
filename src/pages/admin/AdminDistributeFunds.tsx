import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
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
  Wallet,
  ArrowRight,
  CheckCircle,
  Coins,
  MessageSquare,
  Banknote
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

interface Disaster {
  id: string;
  name: string;
  status: string;
  total_tokens_allocated: number;
  tokens_distributed: number;
}

interface NGO {
  id: string;
  ngo_name: string;
  wallet_address: string;
  wallet_balance: number;
  status: string;
}

interface RecentDistribution {
  id: string;
  amount: number;
  created_at: string;
  disaster_name: string;
  ngo_name: string;
  to_wallet: string;
}

const TOKEN_RATE = 1; // 1 INR = 1 Token

export default function AdminDistributeFunds() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const [disasters, setDisasters] = useState<Disaster[]>([]);
  const [ngos, setNgos] = useState<NGO[]>([]);
  const [selectedDisaster, setSelectedDisaster] = useState("");
  const [selectedNgo, setSelectedNgo] = useState("");
  const [amountInr, setAmountInr] = useState("");
  const [processing, setProcessing] = useState(false);
  const [recentDistributions, setRecentDistributions] = useState<RecentDistribution[]>([]);

  useEffect(() => {
    if (!loading && (!user || profile?.role !== "admin")) {
      navigate("/auth/admin");
    }
  }, [user, profile, loading, navigate]);

  useEffect(() => {
    if (user && profile?.role === "admin") {
      fetchDisasters();
      fetchNgos();
      fetchRecentDistributions();
    }
  }, [user, profile]);

  const fetchDisasters = async () => {
    const { data } = await supabase
      .from("disasters")
      .select("id, name, status, total_tokens_allocated, tokens_distributed")
      .eq("status", "active")
      .order("created_at", { ascending: false });
    setDisasters(data || []);
  };

  const fetchNgos = async () => {
    const { data } = await supabase
      .from("ngos")
      .select("id, ngo_name, wallet_address, wallet_balance, status")
      .eq("status", "verified")
      .order("ngo_name");
    setNgos(data || []);
  };

  const fetchRecentDistributions = async () => {
    const { data } = await supabase
      .from("transactions")
      .select("id, amount, created_at, to_wallet, purpose, disaster_id")
      .eq("from_type", "government")
      .eq("to_type", "ngo")
      .order("created_at", { ascending: false })
      .limit(10);

    if (data) {
      const enriched = await Promise.all(
        data.map(async (tx) => {
          const { data: ngo } = await supabase
            .from("ngos")
            .select("ngo_name")
            .eq("wallet_address", tx.to_wallet)
            .maybeSingle();
          
          const { data: disaster } = await supabase
            .from("disasters")
            .select("name")
            .eq("id", tx.disaster_id)
            .maybeSingle();

          return {
            ...tx,
            ngo_name: ngo?.ngo_name || "Unknown NGO",
            disaster_name: disaster?.name || "Unknown Disaster",
          };
        })
      );
      setRecentDistributions(enriched);
    }
  };

  const handleDistribute = async () => {
    if (!selectedDisaster || !selectedNgo || !amountInr) {
      toast.error("Please fill all fields");
      return;
    }

    const amount = parseFloat(amountInr);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    setProcessing(true);

    try {
      const ngo = ngos.find(n => n.id === selectedNgo);
      const disaster = disasters.find(d => d.id === selectedDisaster);
      
      if (!ngo || !disaster) {
        throw new Error("Invalid selection");
      }

      const tokenAmount = amount * TOKEN_RATE;

      // Create transaction record
      const { error: txError } = await supabase
        .from("transactions")
        .insert({
          from_wallet: "GOVT_TREASURY",
          to_wallet: ngo.wallet_address,
          from_type: "government",
          to_type: "ngo",
          amount: amount,
          purpose: `Fund allocation for ${disaster.name}`,
          disaster_id: disaster.id,
          status: "completed",
          transaction_hash: `0x${Date.now().toString(16)}${Math.random().toString(16).slice(2, 10)}`,
        });

      if (txError) throw txError;

      // Update NGO wallet balance
      const { error: ngoError } = await supabase
        .from("ngos")
        .update({ wallet_balance: (ngo.wallet_balance || 0) + amount })
        .eq("id", ngo.id);

      if (ngoError) throw ngoError;

      // Update disaster tokens distributed
      const { error: disasterError } = await supabase
        .from("disasters")
        .update({ tokens_distributed: (disaster.tokens_distributed || 0) + tokenAmount })
        .eq("id", disaster.id);

      if (disasterError) throw disasterError;

      // Log audit
      await supabase.from("audit_logs").insert({
        action: "FUND_DISTRIBUTION",
        entity_type: "transaction",
        performed_by: user?.id,
        details: {
          ngo_id: ngo.id,
          ngo_name: ngo.ngo_name,
          disaster_id: disaster.id,
          disaster_name: disaster.name,
          amount_inr: amount,
          token_amount: tokenAmount,
        },
      });

      toast.success(`₹${amount.toLocaleString("en-IN")} (${tokenAmount} tokens) distributed to ${ngo.ngo_name}`);
      setAmountInr("");
      setSelectedNgo("");
      fetchNgos();
      fetchDisasters();
      fetchRecentDistributions();
    } catch (error: any) {
      toast.error(error.message || "Failed to distribute funds");
    } finally {
      setProcessing(false);
    }
  };

  const selectedDisasterData = disasters.find(d => d.id === selectedDisaster);
  const selectedNgoData = ngos.find(n => n.id === selectedNgo);
  const tokenAmount = parseFloat(amountInr) * TOKEN_RATE || 0;

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <DashboardLayout title="Distribute Funds" navItems={navItems} role="admin">
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Distribution Form */}
        <Card className="lg:col-span-2 animate-fade-in-up">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="w-5 h-5 text-primary" />
              Government to NGO Fund Distribution
            </CardTitle>
            <CardDescription>
              Allocate disaster relief funds to verified NGOs. Funds are converted to tokens for tracking.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Disaster Selection */}
            <div className="space-y-2">
              <Label>Select Disaster</Label>
              <Select value={selectedDisaster} onValueChange={setSelectedDisaster}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose active disaster..." />
                </SelectTrigger>
                <SelectContent>
                  {disasters.map((disaster) => (
                    <SelectItem key={disaster.id} value={disaster.id}>
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-destructive" />
                        {disaster.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedDisasterData && (
                <div className="text-sm text-muted-foreground mt-2 p-3 bg-muted rounded-md">
                  <div className="flex justify-between">
                    <span>Total Allocated:</span>
                    <span className="font-medium">₹{(selectedDisasterData.total_tokens_allocated || 0).toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Already Distributed:</span>
                    <span className="font-medium">₹{(selectedDisasterData.tokens_distributed || 0).toLocaleString("en-IN")}</span>
                  </div>
                </div>
              )}
            </div>

            {/* NGO Selection */}
            <div className="space-y-2">
              <Label>Select Verified NGO</Label>
              <Select value={selectedNgo} onValueChange={setSelectedNgo}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose NGO..." />
                </SelectTrigger>
                <SelectContent>
                  {ngos.map((ngo) => (
                    <SelectItem key={ngo.id} value={ngo.id}>
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-primary" />
                        {ngo.ngo_name}
                        <Badge variant="outline" className="ml-2">
                          ₹{(ngo.wallet_balance || 0).toLocaleString("en-IN")}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedNgoData && (
                <div className="text-sm text-muted-foreground mt-2 p-3 bg-muted rounded-md">
                  <div className="flex justify-between">
                    <span>Current Balance:</span>
                    <span className="font-medium">₹{(selectedNgoData.wallet_balance || 0).toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Wallet Address:</span>
                    <span className="font-mono text-xs">{selectedNgoData.wallet_address?.slice(0, 15)}...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Amount Input */}
            <div className="space-y-2">
              <Label>Amount (INR)</Label>
              <Input
                type="number"
                placeholder="Enter amount in INR"
                value={amountInr}
                onChange={(e) => setAmountInr(e.target.value)}
                min="1"
              />
            </div>

            {/* Conversion Preview */}
            {parseFloat(amountInr) > 0 && (
              <div className="p-4 bg-primary/10 rounded-lg border border-primary/20 animate-fade-in">
                <div className="flex items-center justify-center gap-4">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">INR Amount</p>
                    <p className="text-2xl font-bold">₹{parseFloat(amountInr).toLocaleString("en-IN")}</p>
                  </div>
                  <ArrowRight className="w-6 h-6 text-primary" />
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Token Amount</p>
                    <p className="text-2xl font-bold text-primary flex items-center gap-1">
                      <Coins className="w-5 h-5" />
                      {tokenAmount.toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-center text-muted-foreground mt-2">
                  Exchange Rate: 1 INR = 1 RELIFEX Token
                </p>
              </div>
            )}

            {/* Submit Button */}
            <Button 
              className="w-full" 
              size="lg"
              onClick={handleDistribute}
              disabled={!selectedDisaster || !selectedNgo || !amountInr || processing}
            >
              {processing ? (
                "Processing..."
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Distribute Funds to NGO
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Recent Distributions */}
        <Card className="animate-fade-in-up animate-delay-200">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Recent Distributions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentDistributions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No distributions yet
              </p>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {recentDistributions.map((dist) => (
                  <div key={dist.id} className="p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-sm">{dist.ngo_name}</p>
                        <p className="text-xs text-muted-foreground">{dist.disaster_name}</p>
                      </div>
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    </div>
                    <div className="flex justify-between mt-2 text-sm">
                      <span className="text-muted-foreground">
                        {new Date(dist.created_at).toLocaleDateString("en-IN")}
                      </span>
                      <span className="font-semibold text-green-600">
                        ₹{dist.amount.toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
