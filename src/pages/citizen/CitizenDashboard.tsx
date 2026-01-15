import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { QRCodeSVG } from "qrcode.react";
import { 
  LayoutDashboard,
  Wallet,
  History,
  QrCode,
  Store,
  HelpCircle,
  User,
  AlertTriangle,
  ArrowRight
} from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/citizen", icon: <LayoutDashboard className="w-4 h-4" /> },
  { label: "My QR Code", href: "/citizen/qr", icon: <QrCode className="w-4 h-4" /> },
  { label: "Transactions", href: "/citizen/transactions", icon: <History className="w-4 h-4" /> },
  { label: "Nearby Merchants", href: "/citizen/merchants", icon: <Store className="w-4 h-4" /> },
  { label: "Help & Complaints", href: "/citizen/complaints", icon: <HelpCircle className="w-4 h-4" /> },
  { label: "Profile", href: "/citizen/profile", icon: <User className="w-4 h-4" /> },
];

interface BeneficiaryInfo {
  disaster_name: string;
  tokens_allocated: number;
  tokens_spent: number;
}

export default function CitizenDashboard() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const [beneficiaryInfo, setBeneficiaryInfo] = useState<BeneficiaryInfo | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    if (!loading && (!user || profile?.role !== "citizen")) {
      navigate("/auth/citizen");
    }
  }, [user, profile, loading, navigate]);

  useEffect(() => {
    if (user && profile) {
      fetchBeneficiaryInfo();
      fetchRecentTransactions();
    }
  }, [user, profile]);

  const fetchBeneficiaryInfo = async () => {
    const { data } = await supabase
      .from("beneficiaries")
      .select(`
        tokens_allocated,
        tokens_spent,
        disasters (name)
      `)
      .eq("citizen_id", profile?.id)
      .eq("is_active", true)
      .maybeSingle();

    if (data) {
      setBeneficiaryInfo({
        disaster_name: (data.disasters as any)?.name || "N/A",
        tokens_allocated: Number(data.tokens_allocated) || 0,
        tokens_spent: Number(data.tokens_spent) || 0,
      });
    }
  };

  const fetchRecentTransactions = async () => {
    if (!profile?.wallet_address) return;

    const { data } = await supabase
      .from("transactions")
      .select("*")
      .eq("from_wallet", profile.wallet_address)
      .order("created_at", { ascending: false })
      .limit(5);

    setTransactions(data || []);
  };

  const qrData = profile ? JSON.stringify({
    userId: profile.user_id,
    walletAddress: profile.wallet_address,
    timestamp: Date.now(),
  }) : "";

  const availableBalance = beneficiaryInfo 
    ? beneficiaryInfo.tokens_allocated - beneficiaryInfo.tokens_spent 
    : Number(profile?.wallet_balance) || 0;

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <DashboardLayout title="Citizen Dashboard" navItems={navItems} role="citizen">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-saffron to-saffron/80 text-white rounded-lg p-6 mb-6 animate-fade-in card-hover">
        <h2 className="text-xl font-bold mb-2">
          Welcome, {profile?.full_name || "Citizen"}
        </h2>
        <p className="text-white/90 text-sm">
          Your relief tokens are ready to use at verified merchants
        </p>
      </div>

      {/* Balance & Disaster Info */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <Card className="border-2 border-primary/20 animate-fade-in-up card-hover">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Wallet className="w-4 h-4" />
              Available Balance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-primary">
              ₹{availableBalance.toLocaleString("en-IN")}
            </p>
            {beneficiaryInfo && (
              <div className="mt-3 space-y-1">
                <p className="text-xs text-muted-foreground">
                  Allocated: ₹{beneficiaryInfo.tokens_allocated.toLocaleString("en-IN")}
                </p>
                <p className="text-xs text-muted-foreground">
                  Spent: ₹{beneficiaryInfo.tokens_spent.toLocaleString("en-IN")}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="animate-fade-in-up animate-delay-100 card-hover">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Active Disaster Relief
            </CardDescription>
          </CardHeader>
          <CardContent>
            {beneficiaryInfo ? (
              <>
                <p className="text-xl font-semibold">{beneficiaryInfo.disaster_name}</p>
                <Badge className="mt-2 bg-success/10 text-success border-success/20">
                  Active Beneficiary
                </Badge>
              </>
            ) : (
              <div className="text-center py-4">
                <p className="text-muted-foreground text-sm">
                  Not enrolled in any disaster relief program
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* QR Code & Actions */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* QR Code */}
        <Card className="animate-fade-in-up animate-delay-200 card-hover">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <QrCode className="w-5 h-5" />
              Your Payment QR Code
            </CardTitle>
            <CardDescription>
              Show this to merchants to make payments
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <div className="bg-white p-4 rounded-lg border-2">
              <QRCodeSVG 
                value={qrData || "RELIFEX"} 
                size={180}
                level="H"
                includeMargin
              />
            </div>
            <p className="text-xs text-muted-foreground mt-3 text-center">
              Wallet: {profile?.wallet_address?.slice(0, 12)}...
            </p>
            <Button 
              variant="outline" 
              className="mt-4 w-full btn-hover"
              onClick={() => navigate("/citizen/qr")}
            >
              View Full QR Code
              <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
            </Button>
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card className="animate-fade-in-up animate-delay-300 card-hover">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <History className="w-5 h-5" />
              Recent Transactions
            </CardTitle>
            <CardDescription>
              Your latest spending activity
            </CardDescription>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No transactions yet
              </p>
            ) : (
              <div className="space-y-3">
                {transactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
                    <div>
                      <p className="font-medium text-sm">{tx.purpose || "Payment"}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(tx.created_at).toLocaleDateString("en-IN")}
                      </p>
                    </div>
                    <p className="font-semibold text-destructive">
                      -₹{Number(tx.amount).toLocaleString("en-IN")}
                    </p>
                  </div>
                ))}
              </div>
            )}
            <Button 
              variant="outline" 
              className="w-full mt-4 btn-hover"
              onClick={() => navigate("/citizen/transactions")}
            >
              View All Transactions
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
