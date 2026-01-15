import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Users,
  Building2,
  Store,
} from "lucide-react";

interface CommandStats {
  totalVault: number;
  totalDistributed: number;
  totalRemaining: number;
  activeDisasters: number;
  citizensAided: number;
  ngosOperating: number;
  merchantsServing: number;
}

export function CommandSummary() {
  const [stats, setStats] = useState<CommandStats>({
    totalVault: 0,
    totalDistributed: 0,
    totalRemaining: 0,
    activeDisasters: 0,
    citizensAided: 0,
    ngosOperating: 0,
    merchantsServing: 0,
  });

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    const { data: disasters } = await supabase
      .from("disasters")
      .select("total_tokens_allocated, tokens_distributed, status");

    const activeDisasters = disasters?.filter((d) => d.status === "active").length || 0;
    const totalVault = disasters?.reduce((sum, d) => sum + Number(d.total_tokens_allocated || 0), 0) || 0;
    const totalDistributed = disasters?.reduce((sum, d) => sum + Number(d.tokens_distributed || 0), 0) || 0;

    const { count: citizensAided } = await supabase
      .from("beneficiaries")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true);

    const { count: ngosOperating } = await supabase
      .from("ngos")
      .select("*", { count: "exact", head: true })
      .eq("status", "verified");

    const { count: merchantsServing } = await supabase
      .from("merchants")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true);

    setStats({
      totalVault,
      totalDistributed,
      totalRemaining: totalVault - totalDistributed,
      activeDisasters,
      citizensAided: citizensAided || 0,
      ngosOperating: ngosOperating || 0,
      merchantsServing: merchantsServing || 0,
    });
  };

  const statCards = [
    {
      label: "Government Vault",
      value: `₹${(stats.totalVault / 10000000).toFixed(2)}Cr`,
      icon: Wallet,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: "Distributed",
      value: `₹${(stats.totalDistributed / 10000000).toFixed(2)}Cr`,
      icon: TrendingUp,
      color: "text-green-600",
      bg: "bg-green-100 dark:bg-green-900/30",
    },
    {
      label: "Remaining",
      value: `₹${(stats.totalRemaining / 10000000).toFixed(2)}Cr`,
      icon: TrendingDown,
      color: "text-amber-600",
      bg: "bg-amber-100 dark:bg-amber-900/30",
    },
    {
      label: "Active Disasters",
      value: stats.activeDisasters.toString(),
      icon: AlertTriangle,
      color: "text-red-600",
      bg: "bg-red-100 dark:bg-red-900/30",
    },
    {
      label: "Citizens Receiving Aid",
      value: stats.citizensAided.toLocaleString(),
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-100 dark:bg-blue-900/30",
    },
    {
      label: "NGOs Operating",
      value: stats.ngosOperating.toString(),
      icon: Building2,
      color: "text-purple-600",
      bg: "bg-purple-100 dark:bg-purple-900/30",
    },
    {
      label: "Merchants Serving",
      value: stats.merchantsServing.toString(),
      icon: Store,
      color: "text-indigo-600",
      bg: "bg-indigo-100 dark:bg-indigo-900/30",
    },
  ];

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
        <h2 className="text-lg font-semibold">National Command Summary</h2>
        <span className="text-xs text-muted-foreground">Live</span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {statCards.map((stat) => (
          <Card
            key={stat.label}
            className="p-3 hover:shadow-md transition-shadow"
          >
            <div className={`w-8 h-8 rounded-lg ${stat.bg} flex items-center justify-center mb-2`}>
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
            </div>
            <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-muted-foreground truncate">{stat.label}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
