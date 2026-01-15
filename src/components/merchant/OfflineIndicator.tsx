import { useEffect, useState } from "react";
import { Wifi, WifiOff, RefreshCw, Clock, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";

interface OfflineIndicatorProps {
  pendingSyncCount?: number;
  lastSyncTime?: Date | null;
  onSync?: () => void;
}

export function OfflineIndicator({
  pendingSyncCount = 0,
  lastSyncTime = null,
  onSync,
}: OfflineIndicatorProps) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleSync = async () => {
    if (!onSync || !isOnline) return;
    setSyncing(true);
    await onSync();
    setSyncing(false);
  };

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 p-4 rounded-lg shadow-lg border transition-all ${
        isOnline
          ? "bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800"
          : "bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800"
      }`}
    >
      <div className="flex items-center gap-3">
        {isOnline ? (
          <div className="p-2 bg-green-100 dark:bg-green-800/50 rounded-full">
            <Wifi className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
        ) : (
          <div className="p-2 bg-amber-100 dark:bg-amber-800/50 rounded-full animate-pulse">
            <WifiOff className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
        )}

        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">
              {isOnline ? "Online" : "Offline Mode Active"}
            </span>
            {!isOnline && (
              <Badge variant="secondary" className="text-xs">
                Transactions will sync later
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
            {pendingSyncCount > 0 && (
              <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                <Clock className="w-3 h-3" />
                {pendingSyncCount} pending sync
              </span>
            )}
            {lastSyncTime && (
              <span className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-green-500" />
                Last sync: {formatDistanceToNow(lastSyncTime, { addSuffix: true })}
              </span>
            )}
          </div>
        </div>

        {isOnline && pendingSyncCount > 0 && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleSync}
            disabled={syncing}
            className="shrink-0"
          >
            <RefreshCw className={`w-4 h-4 mr-1 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Syncing..." : "Sync Now"}
          </Button>
        )}
      </div>
    </div>
  );
}
