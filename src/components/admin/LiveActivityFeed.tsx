import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Activity, Building2, Users, Store, Coins } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ActivityEntry {
  id: string;
  type: "ngo_issue" | "citizen_payment" | "merchant_redeem" | "fund_allocation";
  message: string;
  amount: number;
  timestamp: string;
}

export function LiveActivityFeed() {
  const [activities, setActivities] = useState<ActivityEntry[]>([]);

  useEffect(() => {
    fetchRecentTransactions();

    const channel = supabase
      .channel("live-activity")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "transactions" },
        (payload) => {
          const t = payload.new;
          const entry = parseTransaction(t);
          if (entry) {
            setActivities((prev) => [entry, ...prev].slice(0, 50));
          }
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
      .select("*")
      .order("created_at", { ascending: false })
      .limit(30);

    if (data) {
      const entries = data.map(parseTransaction).filter(Boolean) as ActivityEntry[];
      setActivities(entries);
    }
  };

  const parseTransaction = (t: any): ActivityEntry | null => {
    if (!t) return null;

    let type: ActivityEntry["type"] = "citizen_payment";
    let message = "";

    if (t.from_type === "ngo" && t.to_type === "citizen") {
      type = "ngo_issue";
      message = `NGO issued ₹${Number(t.amount).toLocaleString("en-IN")} tokens`;
    } else if (t.from_type === "citizen" && t.to_type === "merchant") {
      type = "citizen_payment";
      message = `Citizen paid ₹${Number(t.amount).toLocaleString("en-IN")} for ${t.purpose || "relief supplies"}`;
    } else if (t.from_type === "admin" && t.to_type === "ngo") {
      type = "fund_allocation";
      message = `Funds allocated: ₹${Number(t.amount).toLocaleString("en-IN")} to NGO`;
    } else {
      type = "merchant_redeem";
      message = `Merchant redeemed ₹${Number(t.amount).toLocaleString("en-IN")}`;
    }

    return {
      id: t.id,
      type,
      message,
      amount: Number(t.amount),
      timestamp: t.created_at,
    };
  };

  const getIcon = (type: ActivityEntry["type"]) => {
    switch (type) {
      case "ngo_issue":
        return <Building2 className="w-4 h-4 text-purple-500" />;
      case "citizen_payment":
        return <Users className="w-4 h-4 text-blue-500" />;
      case "merchant_redeem":
        return <Store className="w-4 h-4 text-green-500" />;
      case "fund_allocation":
        return <Coins className="w-4 h-4 text-amber-500" />;
    }
  };

  const getColor = (type: ActivityEntry["type"]) => {
    switch (type) {
      case "ngo_issue":
        return "border-l-purple-500";
      case "citizen_payment":
        return "border-l-blue-500";
      case "merchant_redeem":
        return "border-l-green-500";
      case "fund_allocation":
        return "border-l-amber-500";
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          Live National Activity
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[400px]">
          <div className="p-4 space-y-2">
            {activities.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No activity yet
              </p>
            ) : (
              activities.map((activity, index) => (
                <div
                  key={activity.id}
                  className={`flex items-start gap-3 p-2 rounded-md bg-muted/50 border-l-4 ${getColor(activity.type)} ${
                    index === 0 ? "animate-fade-in-up" : ""
                  }`}
                >
                  <div className="p-1.5 rounded-full bg-background">
                    {getIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{activity.message}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
