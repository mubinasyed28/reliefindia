import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Server,
  Database,
  Wifi,
  WifiOff,
  Cloud,
  CheckCircle,
  AlertCircle,
  Play,
} from "lucide-react";

interface SystemStatus {
  blockchain: "online" | "degraded" | "offline";
  offlineSync: "synced" | "pending" | "error";
  apiHealth: "healthy" | "degraded" | "down";
  demoMode: boolean;
}

export function SystemHealthPanel() {
  const [status, setStatus] = useState<SystemStatus>({
    blockchain: "online",
    offlineSync: "synced",
    apiHealth: "healthy",
    demoMode: false,
  });

  useEffect(() => {
    // Check demo mode from localStorage or context
    const demoActive = localStorage.getItem("demoMode") === "true";
    setStatus((prev) => ({ ...prev, demoMode: demoActive }));

    // Simulate health checks
    const checkHealth = () => {
      // In production, these would be actual API calls
      setStatus((prev) => ({
        ...prev,
        blockchain: "online",
        offlineSync: Math.random() > 0.1 ? "synced" : "pending",
        apiHealth: Math.random() > 0.05 ? "healthy" : "degraded",
      }));
    };

    checkHealth();
    const interval = setInterval(checkHealth, 60000);
    return () => clearInterval(interval);
  }, []);

  const getStatusBadge = (
    value: string,
    good: string,
    warning: string
  ): { variant: "default" | "secondary" | "destructive"; label: string } => {
    if (value === good) return { variant: "default", label: value };
    if (value === warning) return { variant: "secondary", label: value };
    return { variant: "destructive", label: value };
  };

  const items = [
    {
      label: "Blockchain",
      icon: Database,
      status: getStatusBadge(status.blockchain, "online", "degraded"),
    },
    {
      label: "Offline Sync",
      icon: status.offlineSync === "synced" ? Wifi : WifiOff,
      status: getStatusBadge(status.offlineSync, "synced", "pending"),
    },
    {
      label: "API Health",
      icon: Cloud,
      status: getStatusBadge(status.apiHealth, "healthy", "degraded"),
    },
    {
      label: "Demo Mode",
      icon: Play,
      status: {
        variant: status.demoMode ? "secondary" : "default",
        label: status.demoMode ? "Active" : "Off",
      } as const,
    },
  ];

  const allHealthy =
    status.blockchain === "online" &&
    status.offlineSync === "synced" &&
    status.apiHealth === "healthy";

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Server className="w-4 h-4 text-primary" />
          System Health
          {allHealthy ? (
            <CheckCircle className="w-4 h-4 text-green-500" />
          ) : (
            <AlertCircle className="w-4 h-4 text-amber-500" />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between p-2 rounded-md bg-muted/50"
            >
              <div className="flex items-center gap-2">
                <item.icon className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs font-medium">{item.label}</span>
              </div>
              <Badge variant={item.status.variant} className="text-xs capitalize">
                {item.status.label}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
