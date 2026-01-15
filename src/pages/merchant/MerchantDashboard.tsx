import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  LayoutDashboard,
  Wallet,
  History,
  QrCode,
  WifiOff,
  User,
  ScanLine,
  CheckCircle,
  Store,
  Clock,
  XCircle,
  AlertTriangle
} from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/merchant", icon: <LayoutDashboard className="w-4 h-4" /> },
  { label: "Accept Payment", href: "/merchant/accept", icon: <QrCode className="w-4 h-4" /> },
  { label: "Transactions", href: "/merchant/transactions", icon: <History className="w-4 h-4" /> },
  { label: "Offline Sync", href: "/merchant/offline", icon: <WifiOff className="w-4 h-4" /> },
  { label: "Profile", href: "/merchant/profile", icon: <User className="w-4 h-4" /> },
];

interface MerchantData {
  shop_name: string;
  is_active: boolean;
  wallet_address: string;
  stock_categories: string[];
  trust_score: number;
  performance_score: number;
}

export default function MerchantDashboard() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const [merchantData, setMerchantData] = useState<MerchantData | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [todayEarnings, setTodayEarnings] = useState(0);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [citizenCode, setCitizenCode] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");

  useEffect(() => {
    if (!loading && (!user || profile?.role !== "merchant")) {
      navigate("/auth/merchant");
    }
  }, [user, profile, loading, navigate]);

  useEffect(() => {
    if (user && profile?.role === "merchant") {
      fetchMerchantData();
      fetchTransactions();
    }
  }, [user, profile]);

  const fetchMerchantData = async () => {
    const { data } = await supabase
      .from("merchants")
      .select("shop_name, is_active, wallet_address, stock_categories, trust_score, performance_score")
      .eq("user_id", user?.id)
      .maybeSingle();

    if (data) {
      setMerchantData(data);
    }
  };

  const fetchTransactions = async () => {
    const { data: merchant } = await supabase
      .from("merchants")
      .select("wallet_address")
      .eq("user_id", user?.id)
      .maybeSingle();

    if (merchant?.wallet_address) {
      const { data } = await supabase
        .from("transactions")
        .select("*")
        .eq("to_wallet", merchant.wallet_address)
        .order("created_at", { ascending: false });

      if (data) {
        setTransactions(data);
        
        // Calculate earnings
        const today = new Date().toDateString();
        const todayTxs = data.filter(tx => new Date(tx.created_at).toDateString() === today);
        setTodayEarnings(todayTxs.reduce((sum, tx) => sum + Number(tx.amount), 0));
        setTotalEarnings(data.reduce((sum, tx) => sum + Number(tx.amount), 0));
      }
    }
  };

  const handleAcceptPayment = async () => {
    if (!merchantData?.is_active) {
      toast.error("Your account is not active. Please wait for government approval.");
      return;
    }

    if (!citizenCode || !paymentAmount) {
      toast.error("Please enter citizen code and amount");
      return;
    }

    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (amount > 15000) {
      toast.error("Amount exceeds ₹15,000 per-user limit");
      return;
    }

    // Simulate payment processing
    toast.success(`Payment of ₹${amount.toLocaleString("en-IN")} received successfully!`);
    setPaymentDialogOpen(false);
    setCitizenCode("");
    setPaymentAmount("");
    fetchTransactions();
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  // Show pending status if not active
  const isPending = merchantData && !merchantData.is_active;

  const getStatusBadge = () => {
    if (!merchantData) return null;
    
    if (merchantData.is_active) {
      return (
        <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300">
          <CheckCircle className="w-3 h-3 mr-1" />
          Active
        </Badge>
      );
    }
    
    return (
      <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
        <Clock className="w-3 h-3 mr-1" />
        Pending Approval
      </Badge>
    );
  };

  return (
    <DashboardLayout title="Merchant Dashboard" navItems={navItems} role="merchant">
      {/* Pending Approval Banner */}
      {isPending && (
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-amber-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-amber-800 dark:text-amber-200">Account Pending Approval</h3>
              <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                Your merchant account is under review by government officials. 
                You will not be able to accept payments until your account is approved.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 animate-fade-in">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Store className="w-6 h-6" />
            {merchantData?.shop_name || "Merchant Dashboard"}
          </h2>
          <div className="flex items-center gap-2 mt-1">
            {getStatusBadge()}
            {merchantData?.stock_categories && merchantData.stock_categories.length > 0 && (
              <div className="flex gap-1">
                {merchantData.stock_categories.slice(0, 3).map((cat) => (
                  <Badge key={cat} variant="outline" className="text-xs capitalize">
                    {cat}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              className="bg-green-600 hover:bg-green-700 gap-2" 
              disabled={isPending}
            >
              <ScanLine className="w-4 h-4" />
              Accept Payment
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Accept Relief Payment</DialogTitle>
              <DialogDescription>
                Enter the citizen's relief code or scan their QR code
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="citizenCode">Citizen Relief Code</Label>
                <Input
                  id="citizenCode"
                  value={citizenCode}
                  onChange={(e) => setCitizenCode(e.target.value)}
                  placeholder="Enter code or scan QR"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (₹)</Label>
                <Input
                  id="amount"
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="Enter amount"
                  max={15000}
                />
                <p className="text-xs text-muted-foreground">
                  Maximum ₹15,000 per user per transaction
                </p>
              </div>
              <Button onClick={handleAcceptPayment} className="w-full bg-green-600 hover:bg-green-700">
                <CheckCircle className="w-4 h-4 mr-2" />
                Confirm Payment
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-4 mb-6">
        <Card className={`border-2 ${isPending ? 'border-muted' : 'border-green-200 dark:border-green-800'}`}>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Wallet className="w-4 h-4" />
              Today's Earnings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className={`text-3xl font-bold ${isPending ? 'text-muted-foreground' : 'text-green-600'}`}>
              ₹{todayEarnings.toLocaleString("en-IN")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Wallet className="w-4 h-4" />
              Total Earnings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              ₹{totalEarnings.toLocaleString("en-IN")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <History className="w-4 h-4" />
              Total Transactions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{transactions.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              Trust Score
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary">
              {merchantData?.trust_score || 0}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <History className="w-5 h-5" />
            Recent Transactions
          </CardTitle>
          <CardDescription>Payments received from beneficiaries</CardDescription>
        </CardHeader>
        <CardContent>
          {isPending ? (
            <div className="text-center py-8">
              <XCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Payment features will be available after account approval
              </p>
            </div>
          ) : transactions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No transactions yet. Accept your first payment!
            </p>
          ) : (
            <div className="space-y-3">
              {transactions.slice(0, 10).map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
                  <div>
                    <p className="font-medium text-sm">
                      {tx.purpose || "Relief Payment"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(tx.created_at).toLocaleString("en-IN")}
                    </p>
                    {tx.is_offline && (
                      <Badge variant="outline" className="text-xs mt-1">
                        <WifiOff className="w-3 h-3 mr-1" />
                        Offline
                      </Badge>
                    )}
                  </div>
                  <p className="font-semibold text-green-600">
                    +₹{Number(tx.amount).toLocaleString("en-IN")}
                  </p>
                </div>
              ))}
            </div>
          )}
          <Button variant="outline" className="w-full mt-4" onClick={() => navigate("/merchant/transactions")} disabled={isPending}>
            View All Transactions
          </Button>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
