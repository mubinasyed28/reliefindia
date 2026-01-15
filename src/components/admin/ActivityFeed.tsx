import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { 
  Activity, 
  ArrowRightLeft, 
  Building2, 
  AlertTriangle, 
  FileText,
  UserPlus,
  CheckCircle,
  XCircle,
  Coins,
  Clock
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ActivityItem {
  id: string;
  type: "transaction" | "ngo_registration" | "audit" | "disaster";
  title: string;
  description: string;
  timestamp: string;
  status?: string;
  amount?: number;
}

interface ActivityFeedProps {
  searchQuery?: string;
}

export function ActivityFeed({ searchQuery = "" }: ActivityFeedProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  const query = searchQuery.toLowerCase();
  const filteredActivities = activities.filter(
    (a) =>
      a.title.toLowerCase().includes(query) ||
      a.description.toLowerCase().includes(query) ||
      a.type.toLowerCase().includes(query) ||
      (a.status?.toLowerCase().includes(query) ?? false)
  );

  useEffect(() => {
    fetchInitialData();
    
    // Subscribe to real-time updates
    const transactionChannel = supabase
      .channel('activity-transactions')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'transactions' },
        (payload) => {
          const t = payload.new;
          addActivity({
            id: `txn-${t.id}`,
            type: "transaction",
            title: "New Transaction",
            description: `₹${Number(t.amount).toLocaleString("en-IN")} transferred`,
            timestamp: t.created_at,
            status: t.status,
            amount: t.amount,
          });
        }
      )
      .subscribe();

    const ngoChannel = supabase
      .channel('activity-ngos')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'ngos' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const n = payload.new;
            addActivity({
              id: `ngo-${n.id}`,
              type: "ngo_registration",
              title: "New NGO Registration",
              description: n.ngo_name,
              timestamp: n.created_at,
              status: "pending",
            });
          } else if (payload.eventType === 'UPDATE') {
            const n = payload.new;
            if (n.status === 'verified' || n.status === 'rejected') {
              addActivity({
                id: `ngo-update-${n.id}-${Date.now()}`,
                type: "ngo_registration",
                title: `NGO ${n.status === 'verified' ? 'Approved' : 'Rejected'}`,
                description: n.ngo_name,
                timestamp: new Date().toISOString(),
                status: n.status,
              });
            }
          }
        }
      )
      .subscribe();

    const auditChannel = supabase
      .channel('activity-audit')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'audit_logs' },
        (payload) => {
          const a = payload.new;
          addActivity({
            id: `audit-${a.id}`,
            type: "audit",
            title: formatAuditAction(a.action),
            description: `${a.entity_type}: ${a.action}`,
            timestamp: a.created_at,
          });
        }
      )
      .subscribe();

    const disasterChannel = supabase
      .channel('activity-disasters')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'disasters' },
        (payload) => {
          const d = payload.new as Record<string, unknown>;
          if (!d || !d.id) return;
          addActivity({
            id: `disaster-${d.id}-${Date.now()}`,
            type: "disaster",
            title: payload.eventType === 'INSERT' ? "New Disaster Created" : "Disaster Updated",
            description: String(d.name || "Unknown"),
            timestamp: String(d.created_at || new Date().toISOString()),
            status: String(d.status || "active"),
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(transactionChannel);
      supabase.removeChannel(ngoChannel);
      supabase.removeChannel(auditChannel);
      supabase.removeChannel(disasterChannel);
    };
  }, []);

  const fetchInitialData = async () => {
    const initialActivities: ActivityItem[] = [];

    // Fetch recent transactions
    const { data: transactions } = await supabase
      .from("transactions")
      .select("id, amount, status, created_at")
      .order("created_at", { ascending: false })
      .limit(5);

    transactions?.forEach((t) => {
      initialActivities.push({
        id: `txn-${t.id}`,
        type: "transaction",
        title: "Transaction",
        description: `₹${Number(t.amount).toLocaleString("en-IN")} transferred`,
        timestamp: t.created_at || "",
        status: t.status || "completed",
        amount: t.amount,
      });
    });

    // Fetch recent NGO registrations
    const { data: ngos } = await supabase
      .from("ngos")
      .select("id, ngo_name, status, created_at")
      .order("created_at", { ascending: false })
      .limit(5);

    ngos?.forEach((n) => {
      initialActivities.push({
        id: `ngo-${n.id}`,
        type: "ngo_registration",
        title: n.status === "pending" ? "NGO Registration" : `NGO ${n.status === 'verified' ? 'Verified' : 'Rejected'}`,
        description: n.ngo_name,
        timestamp: n.created_at || "",
        status: n.status || "pending",
      });
    });

    // Fetch recent audit logs
    const { data: audits } = await supabase
      .from("audit_logs")
      .select("id, action, entity_type, created_at")
      .order("created_at", { ascending: false })
      .limit(5);

    audits?.forEach((a) => {
      initialActivities.push({
        id: `audit-${a.id}`,
        type: "audit",
        title: formatAuditAction(a.action),
        description: `${a.entity_type}: ${a.action}`,
        timestamp: a.created_at || "",
      });
    });

    // Fetch recent disasters
    const { data: disasters } = await supabase
      .from("disasters")
      .select("id, name, status, created_at")
      .order("created_at", { ascending: false })
      .limit(3);

    disasters?.forEach((d) => {
      initialActivities.push({
        id: `disaster-${d.id}`,
        type: "disaster",
        title: "Disaster",
        description: d.name,
        timestamp: d.created_at || "",
        status: d.status || "active",
      });
    });

    // Sort by timestamp
    initialActivities.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    setActivities(initialActivities.slice(0, 15));
    setLoading(false);
  };

  const addActivity = (activity: ActivityItem) => {
    setActivities((prev) => {
      const updated = [activity, ...prev.filter(a => a.id !== activity.id)];
      return updated.slice(0, 20);
    });
  };

  const formatAuditAction = (action: string): string => {
    return action
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const getActivityIcon = (type: ActivityItem["type"], status?: string) => {
    switch (type) {
      case "transaction":
        return <ArrowRightLeft className="w-4 h-4 text-blue-500" />;
      case "ngo_registration":
        if (status === "verified") return <CheckCircle className="w-4 h-4 text-green-500" />;
        if (status === "rejected") return <XCircle className="w-4 h-4 text-red-500" />;
        return <Building2 className="w-4 h-4 text-amber-500" />;
      case "audit":
        return <FileText className="w-4 h-4 text-purple-500" />;
      case "disaster":
        return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      default:
        return <Activity className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (type: ActivityItem["type"], status?: string) => {
    if (!status) return null;
    
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      completed: "default",
      pending: "secondary",
      verified: "default",
      rejected: "destructive",
      active: "default",
      frozen: "destructive",
    };

    return (
      <Badge variant={variants[status] || "outline"} className="text-xs">
        {status}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary animate-pulse" />
            Live Activity Feed
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="w-8 h-8 rounded-full bg-muted"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-muted rounded w-1/3"></div>
                  <div className="h-2 bg-muted rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary" />
          Live Activity Feed
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
        </CardTitle>
        <CardDescription>Real-time updates from across the platform</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          {filteredActivities.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">{searchQuery ? "No matching activities" : "No recent activity"}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredActivities.map((activity, index) => (
                <div
                  key={activity.id}
                  className={`flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors ${
                    index === 0 ? "animate-fade-in-up ring-1 ring-primary/20" : ""
                  }`}
                >
                  <div className="p-2 rounded-full bg-background">
                    {getActivityIcon(activity.type, activity.status)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium text-sm truncate">{activity.title}</p>
                      {getStatusBadge(activity.type, activity.status)}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {activity.description}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {activity.timestamp
                        ? formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })
                        : "Just now"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
