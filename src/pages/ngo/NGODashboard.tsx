import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { 
  LayoutDashboard,
  Wallet,
  History,
  Users,
  FileText,
  User,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Send
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
  ngo_name: string;
  wallet_balance: number;
  status: string;
}

interface DisasterFund {
  disaster_name: string;
  allocated: number;
  spent: number;
}

export default function NGODashboard() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const [ngoData, setNgoData] = useState<NGOData | null>(null);
  const [disasterFunds, setDisasterFunds] = useState<DisasterFund[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    if (!loading && (!user || profile?.role !== "ngo")) {
      navigate("/auth/ngo");
    }
  }, [user, profile, loading, navigate]);

  useEffect(() => {
    if (user && profile?.role === "ngo") {
      fetchNgoData();
      fetchTransactions();
    }
  }, [user, profile]);

  const fetchNgoData = async () => {
    const { data } = await supabase
      .from("ngos")
      .select("ngo_name, wallet_balance, status")
      .eq("user_id", user?.id)
      .maybeSingle();

    if (data) {
      setNgoData({
        ngo_name: data.ngo_name,
        wallet_balance: Number(data.wallet_balance) || 0,
        status: data.status || "pending",
      });
    }

    // Simulate disaster funds data
    setDisasterFunds([
      { disaster_name: "Kerala Floods 2024", allocated: 500000, spent: 125000 },
      { disaster_name: "Cyclone Relief - Odisha", allocated: 300000, spent: 75000 },
    ]);
  };

  const fetchTransactions = async () => {
    const { data: ngo } = await supabase
      .from("ngos")
      .select("wallet_address")
      .eq("user_id", user?.id)
      .maybeSingle();

    if (ngo?.wallet_address) {
      const { data } = await supabase
        .from("transactions")
        .select("*")
        .or(`from_wallet.eq.${ngo.wallet_address},to_wallet.eq.${ngo.wallet_address}`)
        .order("created_at", { ascending: false })
        .limit(10);

      setTransactions(data || []);
    }
  };

  const totalAllocated = disasterFunds.reduce((sum, d) => sum + d.allocated, 0);
  const totalSpent = disasterFunds.reduce((sum, d) => sum + d.spent, 0);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <DashboardLayout title="NGO Dashboard" navItems={navItems} role="ngo">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 animate-fade-in">
        <div>
          <h2 className="text-2xl font-bold">{ngoData?.ngo_name || "NGO Dashboard"}</h2>
          <Badge variant={ngoData?.status === "verified" ? "default" : "secondary"} className="mt-1">
            {ngoData?.status === "verified" ? "Verified Organization" : "Pending Verification"}
          </Badge>
        </div>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <Card className="border-2 border-primary/20 animate-fade-in-up card-hover">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Wallet className="w-4 h-4" />
              Total Balance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary">
              ₹{totalAllocated.toLocaleString("en-IN")}
            </p>
          </CardContent>
        </Card>

        <Card className="animate-fade-in-up animate-delay-100 card-hover">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <TrendingDown className="w-4 h-4" />
              Total Spent
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-destructive">
              ₹{totalSpent.toLocaleString("en-IN")}
            </p>
          </CardContent>
        </Card>

        <Card className="animate-fade-in-up animate-delay-200 card-hover">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Available
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-success">
              ₹{(totalAllocated - totalSpent).toLocaleString("en-IN")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Disaster Funds */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="animate-fade-in-up animate-delay-300 card-hover">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Disaster-wise Funds
            </CardTitle>
            <CardDescription>Fund allocation by disaster</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {disasterFunds.map((fund, index) => (
                <div key={index} className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium">{fund.disaster_name}</h4>
                    <Badge variant="outline">Active</Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Allocated</span>
                      <span className="font-medium">₹{fund.allocated.toLocaleString("en-IN")}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Spent</span>
                      <span className="font-medium text-destructive">₹{fund.spent.toLocaleString("en-IN")}</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2 mt-2">
                      <div 
                        className="bg-primary h-2 rounded-full" 
                        style={{ width: `${(fund.spent / fund.allocated) * 100}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground text-right">
                      {((fund.spent / fund.allocated) * 100).toFixed(1)}% utilized
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card className="animate-fade-in-up animate-delay-400 card-hover">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <History className="w-5 h-5" />
              Recent Transactions
            </CardTitle>
            <CardDescription>Latest spending activity</CardDescription>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No transactions yet
              </p>
            ) : (
              <div className="space-y-3">
                {transactions.slice(0, 5).map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
                    <div>
                      <p className="font-medium text-sm">{tx.purpose || "Transaction"}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(tx.created_at).toLocaleDateString("en-IN")}
                      </p>
                    </div>
                    <p className="font-semibold">
                      ₹{Number(tx.amount).toLocaleString("en-IN")}
                    </p>
                  </div>
                ))}
              </div>
            )}
            <Button variant="outline" className="w-full mt-4 btn-hover" onClick={() => navigate("/ngo/spending")}>
              View All Transactions
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
