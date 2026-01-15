import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Activity, ArrowRight, Wallet } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Transaction {
  id: string;
  amount: number;
  from_type: string;
  to_type: string;
  purpose: string | null;
  created_at: string;
  status: string;
}

export function LiveTransactionFeed() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentTransactions();

    // Subscribe to realtime updates
    const channel = supabase
      .channel("public-transactions")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "transactions",
        },
        (payload) => {
          setTransactions((prev) => [payload.new as Transaction, ...prev.slice(0, 9)]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchRecentTransactions = async () => {
    const { data } = await supabase
      .from("transactions")
      .select("id, amount, from_type, to_type, purpose, created_at, status")
      .eq("status", "completed")
      .order("created_at", { ascending: false })
      .limit(10);

    setTransactions(data || []);
    setLoading(false);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "ngo":
        return "🏢";
      case "merchant":
        return "🏪";
      case "citizen":
        return "👤";
      case "government":
        return "🏛️";
      default:
        return "💰";
    }
  };

  const anonymizeWallet = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    return `RLX${Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("")}...`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Activity className="w-5 h-5 text-primary animate-pulse" />
          Live Transaction Feed
          <Badge variant="secondary" className="ml-auto">
            Real-time
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No recent transactions</p>
        ) : (
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors animate-fade-in"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-xl">{getTypeIcon(tx.from_type)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1 text-sm">
                      <span className="font-mono text-xs truncate">{anonymizeWallet()}</span>
                      <ArrowRight className="w-3 h-3 text-muted-foreground shrink-0" />
                      <span className="font-mono text-xs truncate">{anonymizeWallet()}</span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {tx.purpose || "Token transfer"}
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-semibold text-green-600 dark:text-green-400">
                    ₹{tx.amount.toLocaleString("en-IN")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(tx.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
