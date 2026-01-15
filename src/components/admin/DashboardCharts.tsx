import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { TrendingUp, PieChartIcon, BarChart3, Activity } from "lucide-react";

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

interface DisasterData {
  name: string;
  allocated: number;
  distributed: number;
  status: string;
  created_at: string;
}

interface TransactionTrend {
  date: string;
  amount: number;
  count: number;
}

interface StatusDistribution {
  name: string;
  value: number;
}

interface DashboardChartsProps {
  searchQuery?: string;
}

export function DashboardCharts({ searchQuery = "" }: DashboardChartsProps) {
  const [disasterData, setDisasterData] = useState<DisasterData[]>([]);
  const [transactionTrends, setTransactionTrends] = useState<TransactionTrend[]>([]);
  const [statusDistribution, setStatusDistribution] = useState<StatusDistribution[]>([]);
  const [monthlySpending, setMonthlySpending] = useState<{ month: string; spent: number; allocated: number }[]>([]);
  const [loading, setLoading] = useState(true);

  const query = searchQuery.toLowerCase();

  const filteredDisasterData = disasterData.filter(
    (d) => d.name.toLowerCase().includes(query) || d.status.toLowerCase().includes(query)
  );

  const filteredStatusDistribution = statusDistribution.filter((s) =>
    s.name.toLowerCase().includes(query)
  );

  useEffect(() => {
    fetchChartData();
  }, []);

  const fetchChartData = async () => {
    setLoading(true);

    // Fetch disasters for allocation vs distribution chart
    const { data: disasters } = await supabase
      .from("disasters")
      .select("name, total_tokens_allocated, tokens_distributed, status, created_at")
      .order("created_at", { ascending: false })
      .limit(10);

    if (disasters) {
      setDisasterData(
        disasters.map((d) => ({
          name: d.name.length > 15 ? d.name.slice(0, 15) + "..." : d.name,
          allocated: Number(d.total_tokens_allocated) || 0,
          distributed: Number(d.tokens_distributed) || 0,
          status: d.status || "active",
          created_at: d.created_at || "",
        }))
      );

      // Status distribution
      const statusCounts = disasters.reduce((acc: Record<string, number>, d) => {
        const status = d.status || "unknown";
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {});

      setStatusDistribution(
        Object.entries(statusCounts).map(([name, value]) => ({
          name: name.charAt(0).toUpperCase() + name.slice(1),
          value,
        }))
      );
    }

    // Fetch transactions for trends
    const { data: transactions } = await supabase
      .from("transactions")
      .select("amount, created_at, status")
      .order("created_at", { ascending: true });

    if (transactions) {
      // Group by date for daily trends (last 30 days)
      const last30Days = new Date();
      last30Days.setDate(last30Days.getDate() - 30);

      const dailyData: Record<string, { amount: number; count: number }> = {};
      
      transactions.forEach((t) => {
        if (!t.created_at) return;
        const date = new Date(t.created_at);
        if (date < last30Days) return;
        
        const dateKey = date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
        if (!dailyData[dateKey]) {
          dailyData[dateKey] = { amount: 0, count: 0 };
        }
        dailyData[dateKey].amount += Number(t.amount) || 0;
        dailyData[dateKey].count += 1;
      });

      setTransactionTrends(
        Object.entries(dailyData).map(([date, data]) => ({
          date,
          amount: data.amount,
          count: data.count,
        }))
      );

      // Monthly spending trends
      const monthlyData: Record<string, number> = {};
      transactions.forEach((t) => {
        if (!t.created_at) return;
        const date = new Date(t.created_at);
        const monthKey = date.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
        monthlyData[monthKey] = (monthlyData[monthKey] || 0) + (Number(t.amount) || 0);
      });

      // Get monthly allocations from disasters
      const monthlyAllocations: Record<string, number> = {};
      disasters?.forEach((d) => {
        if (!d.created_at) return;
        const date = new Date(d.created_at);
        const monthKey = date.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
        monthlyAllocations[monthKey] = (monthlyAllocations[monthKey] || 0) + (Number(d.total_tokens_allocated) || 0);
      });

      const allMonths = new Set([...Object.keys(monthlyData), ...Object.keys(monthlyAllocations)]);
      setMonthlySpending(
        Array.from(allMonths).slice(-6).map((month) => ({
          month,
          spent: monthlyData[month] || 0,
          allocated: monthlyAllocations[month] || 0,
        }))
      );
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-muted rounded w-1/3"></div>
            </CardHeader>
            <CardContent>
              <div className="h-[250px] bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-2 gap-6 mb-6">
      {/* Token Distribution by Disaster */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Token Allocation vs Distribution
          </CardTitle>
          <CardDescription>Funds allocated and distributed per disaster</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={filteredDisasterData} margin={{ top: 10, right: 10, left: 0, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 10 }} 
                angle={-45} 
                textAnchor="end"
                height={60}
                className="fill-muted-foreground"
              />
              <YAxis 
                tick={{ fontSize: 10 }} 
                tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                className="fill-muted-foreground"
              />
              <Tooltip
                formatter={(value: number) => `₹${value.toLocaleString("en-IN")}`}
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Bar dataKey="allocated" name="Allocated" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="distributed" name="Distributed" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Disaster Status Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <PieChartIcon className="w-5 h-5 text-primary" />
            Disaster Status Distribution
          </CardTitle>
          <CardDescription>Current status of all disasters</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={query ? filteredStatusDistribution : statusDistribution}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {statusDistribution.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Transaction Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Transaction Volume (Last 30 Days)
          </CardTitle>
          <CardDescription>Daily transaction amounts and counts</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={transactionTrends} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 10 }}
                className="fill-muted-foreground"
              />
              <YAxis 
                tick={{ fontSize: 10 }}
                tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                className="fill-muted-foreground"
              />
              <Tooltip
                formatter={(value: number, name: string) => [
                  name === "amount" ? `₹${value.toLocaleString("en-IN")}` : value,
                  name === "amount" ? "Amount" : "Transactions"
                ]}
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Area
                type="monotone"
                dataKey="amount"
                stroke="hsl(var(--primary))"
                fillOpacity={1}
                fill="url(#colorAmount)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Monthly Spending Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            Monthly Token Flow
          </CardTitle>
          <CardDescription>Allocated vs spent tokens by month</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={monthlySpending} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: 10 }}
                className="fill-muted-foreground"
              />
              <YAxis 
                tick={{ fontSize: 10 }}
                tickFormatter={(v) => `₹${(v / 1000000).toFixed(1)}M`}
                className="fill-muted-foreground"
              />
              <Tooltip
                formatter={(value: number) => `₹${value.toLocaleString("en-IN")}`}
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="allocated"
                name="Allocated"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ fill: "hsl(var(--primary))" }}
              />
              <Line
                type="monotone"
                dataKey="spent"
                name="Spent"
                stroke="hsl(var(--chart-2))"
                strokeWidth={2}
                dot={{ fill: "hsl(var(--chart-2))" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
