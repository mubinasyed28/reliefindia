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
  Store,
  HelpCircle,
  User,
  Search,
  ArrowDownLeft,
  ArrowUpRight,
  Filter
} from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/citizen", icon: <LayoutDashboard className="w-4 h-4" /> },
  { label: "My QR Code", href: "/citizen/qr", icon: <QrCode className="w-4 h-4" /> },
  { label: "Transactions", href: "/citizen/transactions", icon: <History className="w-4 h-4" /> },
  { label: "Nearby Merchants", href: "/citizen/merchants", icon: <Store className="w-4 h-4" /> },
  { label: "Help & Complaints", href: "/citizen/help", icon: <HelpCircle className="w-4 h-4" /> },
  { label: "Profile", href: "/citizen/profile", icon: <User className="w-4 h-4" /> },
];

interface Transaction {
  id: string;
  amount: number;
  purpose: string | null;
  created_at: string;
  from_wallet: string;
  to_wallet: string;
  status: string;
  transaction_hash: string | null;
  is_offline: boolean;
}

export default function TransactionsPage() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!loading && (!user || profile?.role !== "citizen")) {
      navigate("/auth/citizen");
    }
  }, [user, profile, loading, navigate]);

  useEffect(() => {
    if (profile?.wallet_address) {
      fetchTransactions();
    }
  }, [profile]);

  useEffect(() => {
    const filtered = transactions.filter(tx => 
      tx.purpose?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.transaction_hash?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredTransactions(filtered);
  }, [searchQuery, transactions]);

  const fetchTransactions = async () => {
    setIsLoading(true);
    const { data } = await supabase
      .from("transactions")
      .select("*")
      .or(`from_wallet.eq.${profile?.wallet_address},to_wallet.eq.${profile?.wallet_address}`)
      .order("created_at", { ascending: false });

    setTransactions(data || []);
    setFilteredTransactions(data || []);
    setIsLoading(false);
  };

  const isOutgoing = (tx: Transaction) => tx.from_wallet === profile?.wallet_address;

  const totalSpent = transactions
    .filter(tx => isOutgoing(tx))
    .reduce((sum, tx) => sum + Number(tx.amount), 0);

  const totalReceived = transactions
    .filter(tx => !isOutgoing(tx))
    .reduce((sum, tx) => sum + Number(tx.amount), 0);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <DashboardLayout title="Transaction History" navItems={navItems} role="citizen">
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="animate-fade-in card-hover">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Spent</p>
                  <p className="text-2xl font-bold text-destructive">
                    ₹{totalSpent.toLocaleString("en-IN")}
                  </p>
                </div>
                <ArrowUpRight className="w-8 h-8 text-destructive/50" />
              </div>
            </CardContent>
          </Card>

          <Card className="animate-fade-in animate-delay-100 card-hover">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Received</p>
                  <p className="text-2xl font-bold text-success">
                    ₹{totalReceived.toLocaleString("en-IN")}
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
                  Complete history of your relief token usage
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
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        isOutgoing(tx) ? "bg-destructive/10" : "bg-success/10"
                      }`}>
                        {isOutgoing(tx) ? (
                          <ArrowUpRight className="w-5 h-5 text-destructive" />
                        ) : (
                          <ArrowDownLeft className="w-5 h-5 text-success" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{tx.purpose || "Relief Payment"}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(tx.created_at).toLocaleString("en-IN")}
                        </p>
                        {tx.transaction_hash && (
                          <p className="text-xs font-mono text-muted-foreground mt-1">
                            {tx.transaction_hash.slice(0, 20)}...
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-semibold ${
                        isOutgoing(tx) ? "text-destructive" : "text-success"
                      }`}>
                        {isOutgoing(tx) ? "-" : "+"}₹{Number(tx.amount).toLocaleString("en-IN")}
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
