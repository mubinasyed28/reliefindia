import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { useOfflinePayments } from "@/hooks/useOfflinePayments";
import { supabase } from "@/integrations/supabase/client";
import { 
  LayoutDashboard,
  QrCode,
  History,
  WifiOff,
  User,
  Wifi,
  RefreshCw,
  Trash2,
  CheckCircle,
  Clock,
  AlertTriangle,
  Database
} from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/merchant", icon: <LayoutDashboard className="w-4 h-4" /> },
  { label: "Accept Payment", href: "/merchant/accept", icon: <QrCode className="w-4 h-4" /> },
  { label: "Transactions", href: "/merchant/transactions", icon: <History className="w-4 h-4" /> },
  { label: "Offline Sync", href: "/merchant/offline", icon: <WifiOff className="w-4 h-4" /> },
  { label: "Profile", href: "/merchant/profile", icon: <User className="w-4 h-4" /> },
];

export default function OfflineSync() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const [merchantWallet, setMerchantWallet] = useState("");

  useEffect(() => {
    if (!loading && (!user || profile?.role !== "merchant")) {
      navigate("/auth/merchant");
    }
  }, [user, profile, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchMerchantWallet();
    }
  }, [user]);

  const fetchMerchantWallet = async () => {
    const { data } = await supabase
      .from("merchants")
      .select("wallet_address")
      .eq("user_id", user?.id)
      .maybeSingle();

    if (data?.wallet_address) {
      setMerchantWallet(data.wallet_address);
    }
  };

  const {
    isOnline,
    pendingTransactions,
    isSyncing,
    syncTransactions,
    clearSyncedTransactions,
    getPendingCount,
  } = useOfflinePayments(merchantWallet);

  const pendingCount = getPendingCount();
  const syncedCount = pendingTransactions.filter(tx => tx.synced).length;
  const totalCount = pendingTransactions.length;
  const syncProgress = totalCount > 0 ? (syncedCount / totalCount) * 100 : 0;

  const totalPendingAmount = pendingTransactions
    .filter(tx => !tx.synced)
    .reduce((sum, tx) => sum + tx.amount, 0);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <DashboardLayout title="Offline Sync" navItems={navItems} role="merchant">
      <div className="space-y-6">
        {/* Connection Status */}
        <Card className={`border-2 animate-fade-in ${isOnline ? "border-success/30" : "border-warning/30"}`}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  isOnline ? "bg-success/10" : "bg-warning/10"
                }`}>
                  {isOnline ? (
                    <Wifi className="w-6 h-6 text-success" />
                  ) : (
                    <WifiOff className="w-6 h-6 text-warning" />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-semibold">
                    {isOnline ? "Online" : "Offline Mode"}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {isOnline 
                      ? "Connected to RELIFEX network"
                      : "Transactions will be saved locally"
                    }
                  </p>
                </div>
              </div>
              <Badge 
                variant="outline" 
                className={isOnline ? "text-success border-success" : "text-warning border-warning"}
              >
                {isOnline ? "Connected" : "Disconnected"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Sync Status */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="animate-fade-in-up card-hover">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Sync</p>
                  <p className="text-2xl font-bold text-warning">{pendingCount}</p>
                </div>
                <Clock className="w-8 h-8 text-warning/50" />
              </div>
            </CardContent>
          </Card>

          <Card className="animate-fade-in-up animate-delay-100 card-hover">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Synced</p>
                  <p className="text-2xl font-bold text-success">{syncedCount}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-success/50" />
              </div>
            </CardContent>
          </Card>

          <Card className="animate-fade-in-up animate-delay-200 card-hover">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Amount</p>
                  <p className="text-2xl font-bold">₹{totalPendingAmount.toLocaleString("en-IN")}</p>
                </div>
                <Database className="w-8 h-8 text-muted-foreground/50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sync Progress */}
        {totalCount > 0 && (
          <Card className="animate-fade-in-up animate-delay-300">
            <CardHeader>
              <CardTitle className="text-lg">Sync Progress</CardTitle>
              <CardDescription>
                {syncedCount} of {totalCount} transactions synced
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Progress value={syncProgress} className="h-2" />
              <div className="flex justify-between mt-2 text-sm text-muted-foreground">
                <span>0%</span>
                <span>{Math.round(syncProgress)}%</span>
                <span>100%</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <Card className="animate-fade-in-up">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5" />
              Sync Actions
            </CardTitle>
            <CardDescription>
              Manage your offline transactions
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button
              onClick={syncTransactions}
              disabled={!isOnline || isSyncing || pendingCount === 0}
              className="bg-primary hover:bg-primary/90 btn-hover"
            >
              {isSyncing ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Sync Now ({pendingCount})
                </>
              )}
            </Button>

            <Button
              variant="outline"
              onClick={clearSyncedTransactions}
              disabled={syncedCount === 0}
              className="btn-hover"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear Synced
            </Button>
          </CardContent>
        </Card>

        {/* Pending Transactions */}
        <Card className="animate-fade-in-up">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="w-5 h-5" />
              Offline Transactions
            </CardTitle>
            <CardDescription>
              Transactions stored locally
            </CardDescription>
          </CardHeader>
          <CardContent>
            {pendingTransactions.length === 0 ? (
              <div className="py-12 text-center">
                <Database className="w-12 h-12 text-muted-foreground/50 mx-auto" />
                <p className="mt-2 text-muted-foreground">No offline transactions</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingTransactions.map((tx, index) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-4 bg-muted/50 rounded-lg animate-fade-in"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        tx.synced ? "bg-success/10" : "bg-warning/10"
                      }`}>
                        {tx.synced ? (
                          <CheckCircle className="w-5 h-5 text-success" />
                        ) : (
                          <Clock className="w-5 h-5 text-warning" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{tx.purpose || "Relief Payment"}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(tx.timestamp).toLocaleString("en-IN")}
                        </p>
                        <p className="text-xs font-mono text-muted-foreground">
                          {tx.citizenWallet.slice(0, 16)}...
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-success">
                        +₹{tx.amount.toLocaleString("en-IN")}
                      </p>
                      <div className="flex items-center gap-2 justify-end mt-1">
                        <Badge
                          variant="outline"
                          className={tx.synced 
                            ? "text-success border-success/30" 
                            : "text-warning border-warning/30"
                          }
                        >
                          {tx.synced ? "Synced" : "Pending"}
                        </Badge>
                        {tx.syncAttempts > 0 && !tx.synced && (
                          <Badge variant="outline" className="text-xs">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            {tx.syncAttempts} retries
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

        {/* Offline Mode Instructions */}
        <Card className="bg-muted/50 animate-fade-in-up">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-warning" />
              Offline Mode Guidelines
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                Transactions are stored securely in your browser's local storage
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                Each transaction includes a unique signature to prevent double-spending
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                Automatic sync occurs when internet connection is restored
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                Maximum offline storage: 50 transactions or ₹2,00,000 total
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                Synced transactions are verified on the blockchain
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
