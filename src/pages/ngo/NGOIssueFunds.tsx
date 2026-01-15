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
  Wallet,
  Users,
  FileText,
  User,
  Send,
  ArrowRight,
  Coins,
  CheckCircle,
  AlertTriangle,
  History
} from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/ngo", icon: <LayoutDashboard className="w-4 h-4" /> },
  { label: "Issue Funds", href: "/ngo/issue-funds", icon: <Send className="w-4 h-4" /> },
  { label: "Spending", href: "/ngo/spending", icon: <Wallet className="w-4 h-4" /> },
  { label: "Beneficiaries", href: "/ngo/beneficiaries", icon: <Users className="w-4 h-4" /> },
  { label: "Bill Upload", href: "/ngo/bill-upload", icon: <FileText className="w-4 h-4" /> },
  { label: "Reports", href: "/ngo/reports", icon: <FileText className="w-4 h-4" /> },
  { label: "Profile", href: "/ngo/profile", icon: <User className="w-4 h-4" /> },
];

interface NGOData {
  id: string;
  ngo_name: string;
  wallet_address: string;
  wallet_balance: number;
  status: string;
}

interface Disaster {
  id: string;
  name: string;
  spending_limit_per_user: number;
}

interface Citizen {
  id: string;
  full_name: string;
  wallet_address: string;
  wallet_balance: number;
  mobile: string;
  is_verified: boolean;
}

interface RecentIssuance {
  id: string;
  citizen_name: string;
  amount: number;
  created_at: string;
  disaster_name: string;
}

export default function NGOIssueFunds() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const [ngoData, setNgoData] = useState<NGOData | null>(null);
  const [disasters, setDisasters] = useState<Disaster[]>([]);
  const [citizens, setCitizens] = useState<Citizen[]>([]);
  const [selectedDisaster, setSelectedDisaster] = useState("");
  const [selectedCitizen, setSelectedCitizen] = useState("");
  const [amount, setAmount] = useState("");
  const [processing, setProcessing] = useState(false);
  const [recentIssuances, setRecentIssuances] = useState<RecentIssuance[]>([]);
  const [searchCitizen, setSearchCitizen] = useState("");

  useEffect(() => {
    if (!loading && (!user || profile?.role !== "ngo")) {
      navigate("/auth/ngo");
    }
  }, [user, profile, loading, navigate]);

  useEffect(() => {
    if (user && profile?.role === "ngo") {
      fetchNgoData();
      fetchDisasters();
      fetchCitizens();
    }
  }, [user, profile]);

  const fetchNgoData = async () => {
    const { data } = await supabase
      .from("ngos")
      .select("id, ngo_name, wallet_address, wallet_balance, status")
      .eq("user_id", user?.id)
      .maybeSingle();

    if (data) {
      setNgoData(data);
      fetchRecentIssuances(data.wallet_address);
    }
  };

  const fetchDisasters = async () => {
    const { data } = await supabase
      .from("disasters")
      .select("id, name, spending_limit_per_user")
      .eq("status", "active");
    setDisasters(data || []);
  };

  const fetchCitizens = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, wallet_address, wallet_balance, mobile, is_verified")
      .eq("role", "citizen")
      .eq("is_verified", true)
      .order("full_name");
    setCitizens(data || []);
  };

  const fetchRecentIssuances = async (walletAddress: string) => {
    const { data } = await supabase
      .from("transactions")
      .select("id, amount, created_at, to_wallet, purpose, disaster_id")
      .eq("from_wallet", walletAddress)
      .eq("from_type", "ngo")
      .eq("to_type", "citizen")
      .order("created_at", { ascending: false })
      .limit(10);

    if (data) {
      const enriched = await Promise.all(
        data.map(async (tx) => {
          const { data: citizen } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("wallet_address", tx.to_wallet)
            .maybeSingle();

          const { data: disaster } = await supabase
            .from("disasters")
            .select("name")
            .eq("id", tx.disaster_id)
            .maybeSingle();

          return {
            id: tx.id,
            citizen_name: citizen?.full_name || "Unknown",
            amount: tx.amount,
            created_at: tx.created_at,
            disaster_name: disaster?.name || "Unknown",
          };
        })
      );
      setRecentIssuances(enriched);
    }
  };

  const handleIssueFunds = async () => {
    if (!selectedDisaster || !selectedCitizen || !amount) {
      toast.error("Please fill all fields");
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (!ngoData || amountNum > ngoData.wallet_balance) {
      toast.error("Insufficient balance in NGO wallet");
      return;
    }

    const disaster = disasters.find(d => d.id === selectedDisaster);
    if (disaster && amountNum > disaster.spending_limit_per_user) {
      toast.error(`Amount exceeds per-citizen limit of ₹${disaster.spending_limit_per_user}`);
      return;
    }

    setProcessing(true);

    try {
      const citizen = citizens.find(c => c.id === selectedCitizen);
      if (!citizen || !ngoData) throw new Error("Invalid selection");

      // Create transaction
      const { error: txError } = await supabase
        .from("transactions")
        .insert({
          from_wallet: ngoData.wallet_address,
          to_wallet: citizen.wallet_address,
          from_type: "ngo",
          to_type: "citizen",
          amount: amountNum,
          purpose: `Relief fund issuance for ${disaster?.name}`,
          disaster_id: selectedDisaster,
          status: "completed",
          transaction_hash: `0x${Date.now().toString(16)}${Math.random().toString(16).slice(2, 10)}`,
        });

      if (txError) throw txError;

      // Update NGO balance
      const { error: ngoError } = await supabase
        .from("ngos")
        .update({ wallet_balance: ngoData.wallet_balance - amountNum })
        .eq("id", ngoData.id);

      if (ngoError) throw ngoError;

      // Update citizen balance
      const { error: citizenError } = await supabase
        .from("profiles")
        .update({ wallet_balance: (citizen.wallet_balance || 0) + amountNum })
        .eq("id", citizen.id);

      if (citizenError) throw citizenError;

      // Create/update beneficiary record
      const { data: existingBeneficiary } = await supabase
        .from("beneficiaries")
        .select("id, tokens_allocated")
        .eq("citizen_id", citizen.id)
        .eq("disaster_id", selectedDisaster)
        .maybeSingle();

      if (existingBeneficiary) {
        await supabase
          .from("beneficiaries")
          .update({ 
            tokens_allocated: (existingBeneficiary.tokens_allocated || 0) + amountNum 
          })
          .eq("id", existingBeneficiary.id);
      } else {
        await supabase
          .from("beneficiaries")
          .insert({
            citizen_id: citizen.id,
            disaster_id: selectedDisaster,
            tokens_allocated: amountNum,
            is_active: true,
          });
      }

      toast.success(`₹${amountNum.toLocaleString("en-IN")} issued to ${citizen.full_name}`);
      setAmount("");
      setSelectedCitizen("");
      fetchNgoData();
      fetchCitizens();
    } catch (error: any) {
      toast.error(error.message || "Failed to issue funds");
    } finally {
      setProcessing(false);
    }
  };

  const selectedDisasterData = disasters.find(d => d.id === selectedDisaster);
  const selectedCitizenData = citizens.find(c => c.id === selectedCitizen);
  const filteredCitizens = citizens.filter(c => 
    c.full_name?.toLowerCase().includes(searchCitizen.toLowerCase()) ||
    c.mobile?.includes(searchCitizen)
  );

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (ngoData?.status !== "verified") {
    return (
      <DashboardLayout title="Issue Funds" navItems={navItems} role="ngo">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
            <p className="text-lg font-medium">NGO Not Verified</p>
            <p className="text-muted-foreground">
              Your NGO must be verified before issuing funds to citizens.
            </p>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Issue Funds to Citizens" navItems={navItems} role="ngo">
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Issue Form */}
        <Card className="lg:col-span-2 animate-fade-in-up">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="w-5 h-5 text-primary" />
              Issue Relief Tokens to Citizen
            </CardTitle>
            <CardDescription>
              Transfer tokens from your NGO wallet to verified beneficiaries
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* NGO Balance */}
            <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Your NGO Balance</p>
                  <p className="text-2xl font-bold text-primary">
                    ₹{(ngoData?.wallet_balance || 0).toLocaleString("en-IN")}
                  </p>
                </div>
                <Wallet className="w-10 h-10 text-primary/50" />
              </div>
            </div>

            {/* Disaster Selection */}
            <div className="space-y-2">
              <Label>Select Disaster</Label>
              <Select value={selectedDisaster} onValueChange={setSelectedDisaster}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose disaster..." />
                </SelectTrigger>
                <SelectContent>
                  {disasters.map((disaster) => (
                    <SelectItem key={disaster.id} value={disaster.id}>
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-destructive" />
                        {disaster.name}
                        <Badge variant="outline" className="ml-2">
                          Limit: ₹{disaster.spending_limit_per_user}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Citizen Search & Selection */}
            <div className="space-y-2">
              <Label>Select Verified Citizen</Label>
              <Input
                placeholder="Search by name or mobile..."
                value={searchCitizen}
                onChange={(e) => setSearchCitizen(e.target.value)}
                className="mb-2"
              />
              <Select value={selectedCitizen} onValueChange={setSelectedCitizen}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose citizen..." />
                </SelectTrigger>
                <SelectContent>
                  {filteredCitizens.map((citizen) => (
                    <SelectItem key={citizen.id} value={citizen.id}>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        {citizen.full_name || "Unnamed"}
                        <span className="text-muted-foreground text-xs">
                          ({citizen.mobile})
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedCitizenData && (
                <div className="text-sm text-muted-foreground mt-2 p-3 bg-muted rounded-md">
                  <div className="flex justify-between">
                    <span>Current Balance:</span>
                    <span className="font-medium">₹{(selectedCitizenData.wallet_balance || 0).toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Wallet:</span>
                    <span className="font-mono text-xs">{selectedCitizenData.wallet_address?.slice(0, 15)}...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <Label>Amount (₹)</Label>
              <Input
                type="number"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                max={Math.min(
                  ngoData?.wallet_balance || 0,
                  selectedDisasterData?.spending_limit_per_user || 999999
                )}
              />
              {selectedDisasterData && (
                <p className="text-xs text-muted-foreground">
                  Maximum per citizen: ₹{selectedDisasterData.spending_limit_per_user.toLocaleString("en-IN")}
                </p>
              )}
            </div>

            {/* Transfer Preview */}
            {parseFloat(amount) > 0 && selectedCitizenData && (
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800 animate-fade-in">
                <div className="flex items-center justify-center gap-4">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">From NGO</p>
                    <p className="font-medium">{ngoData?.ngo_name}</p>
                  </div>
                  <div className="flex flex-col items-center">
                    <ArrowRight className="w-6 h-6 text-green-600" />
                    <p className="text-lg font-bold text-green-600 flex items-center gap-1">
                      <Coins className="w-4 h-4" />
                      ₹{parseFloat(amount).toLocaleString("en-IN")}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">To Citizen</p>
                    <p className="font-medium">{selectedCitizenData.full_name}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Submit */}
            <Button
              className="w-full"
              size="lg"
              onClick={handleIssueFunds}
              disabled={!selectedDisaster || !selectedCitizen || !amount || processing}
            >
              {processing ? (
                "Processing..."
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Issue Tokens to Citizen
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Recent Issuances */}
        <Card className="animate-fade-in-up animate-delay-200">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <History className="w-5 h-5" />
              Recent Issuances
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentIssuances.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No issuances yet
              </p>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {recentIssuances.map((issuance) => (
                  <div key={issuance.id} className="p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-sm">{issuance.citizen_name}</p>
                        <p className="text-xs text-muted-foreground">{issuance.disaster_name}</p>
                      </div>
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    </div>
                    <div className="flex justify-between mt-2 text-sm">
                      <span className="text-muted-foreground">
                        {new Date(issuance.created_at).toLocaleDateString("en-IN")}
                      </span>
                      <span className="font-semibold text-green-600">
                        ₹{issuance.amount.toLocaleString("en-IN")}
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
