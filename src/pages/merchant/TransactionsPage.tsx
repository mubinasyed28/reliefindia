import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { 
  LayoutDashboard,
  QrCode,
  History,
  WifiOff,
  User,
  Search,
  ArrowDownLeft,
  Filter,
  Download,
  Calendar
} from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/merchant", icon: <LayoutDashboard className="w-4 h-4" /> },
  { label: "Accept Payment", href: "/merchant/accept", icon: <QrCode className="w-4 h-4" /> },
  { label: "Transactions", href: "/merchant/transactions", icon: <History className="w-4 h-4" /> },
  { label: "Offline Sync", href: "/merchant/offline", icon: <WifiOff className="w-4 h-4" /> },
  { label: "Profile", href: "/merchant/profile", icon: <User className="w-4 h-4" /> },
];

interface Transaction {
  id: string;
  amount: number;
  purpose: string | null;
  created_at: string;
  from_wallet: string;
  status: string;
  transaction_hash: string | null;
  is_offline: boolean;
}

export default function MerchantTransactionsPage() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [merchantWallet, setMerchantWallet] = useState("");

  useEffect(() => {
    if (!loading && (!user || profile?.role !== "merchant")) {
      navigate("/auth/merchant");
    }
  }, [user, profile, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchMerchantAndTransactions();
    }
  }, [user]);

  useEffect(() => {
    const filtered = transactions.filter(tx => 
      tx.purpose?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.transaction_hash?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.from_wallet.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredTransactions(filtered);
  }, [searchQuery, transactions]);

  const fetchMerchantAndTransactions = async () => {
    setIsLoading(true);
    
    const { data: merchant } = await supabase
      .from("merchants")
      .select("wallet_address")
      .eq("user_id", user?.id)
      .maybeSingle();

    if (merchant?.wallet_address) {
      setMerchantWallet(merchant.wallet_address);
      
      const { data } = await supabase
        .from("transactions")
        .select("*")
        .eq("to_wallet", merchant.wallet_address)
        .order("created_at", { ascending: false });

      setTransactions(data || []);
      setFilteredTransactions(data || []);
    }
    
    setIsLoading(false);
  };

  const totalEarnings = transactions.reduce((sum, tx) => sum + Number(tx.amount), 0);
  
  const today = new Date().toDateString();
  const todayEarnings = transactions
    .filter(tx => new Date(tx.created_at).toDateString() === today)
    .reduce((sum, tx) => sum + Number(tx.amount), 0);

  const exportTransactions = () => {
    const csv = [
      ["Date", "Amount", "Purpose", "From Wallet", "Status", "Transaction Hash"],
      ...transactions.map(tx => [
        new Date(tx.created_at).toLocaleString("en-IN"),
        tx.amount.toString(),
        tx.purpose || "Relief Payment",
        tx.from_wallet,
        tx.status,
        tx.transaction_hash || ""
      ])
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transactions-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <DashboardLayout title="Transaction History" navItems={navItems} role="merchant">
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="animate-fade-in card-hover border-2 border-green-india/20">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Today's Earnings</p>
                  <p className="text-2xl font-bold text-green-india">
                    ₹{todayEarnings.toLocaleString("en-IN")}
                  </p>
                </div>
                <Calendar className="w-8 h-8 text-green-india/50" />
              </div>
            </CardContent>
          </Card>

          <Card className="animate-fade-in animate-delay-100 card-hover">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Earnings</p>
                  <p className="text-2xl font-bold text-success">
                    ₹{totalEarnings.toLocaleString("en-IN")}
                  </p>
                </div>
                <ArrowDownLeft className="w-8 h-8 text-success/50" />
              </div>
            </CardContent>
          </Card>

          <Card className="animate-fade-in animate-delay-200 card-hover">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Transactions</p>
                  <p className="text-2xl font-bold">{transactions.length}</p>
                </div>
                <History className="w-8 h-8 text-muted-foreground/50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Transactions List */}
        <Card className="animate-fade-in-up">
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <History className="w-5 h-5" />
                  All Transactions
                </CardTitle>
                <CardDescription>
                  Payments received from beneficiaries
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search transactions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 w-64"
                  />
                </div>
                <Button variant="outline" size="icon">
                  <Filter className="w-4 h-4" />
                </Button>
                <Button variant="outline" onClick={exportTransactions}>
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="py-12 text-center">
                <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto" />
                <p className="mt-2 text-sm text-muted-foreground">Loading transactions...</p>
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className="py-12 text-center">
                <History className="w-12 h-12 text-muted-foreground/50 mx-auto" />
                <p className="mt-2 text-muted-foreground">No transactions found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTransactions.map((tx, index) => (
                  <div 
                    key={tx.id} 
                    className="flex items-center justify-between p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors animate-fade-in"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
                        <ArrowDownLeft className="w-5 h-5 text-success" />
                      </div>
                      <div>
                        <p className="font-medium">{tx.purpose || "Relief Payment"}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(tx.created_at).toLocaleString("en-IN")}
                        </p>
                        <p className="text-xs font-mono text-muted-foreground mt-1">
                          From: {tx.from_wallet.slice(0, 16)}...
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-success">
                        +₹{Number(tx.amount).toLocaleString("en-IN")}
                      </p>
                      <div className="flex items-center gap-2 justify-end mt-1">
                        <Badge 
                          variant="outline" 
                          className={
                            tx.status === "completed" 
                              ? "text-success border-success/30" 
                              : tx.status === "pending"
                              ? "text-warning border-warning/30"
                              : "text-destructive border-destructive/30"
                          }
                        >
                          {tx.status}
                        </Badge>
                        {tx.is_offline && (
                          <Badge variant="outline" className="text-xs">
                            <WifiOff className="w-3 h-3 mr-1" />
                            Offline
                          </Badge>
                        )}
                      </div>
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
