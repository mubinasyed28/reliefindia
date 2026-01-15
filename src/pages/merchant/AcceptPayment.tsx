import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QRScanner } from "@/components/payment/QRScanner";
import { PaymentProcessor } from "@/components/payment/PaymentProcessor";
import { useAuth } from "@/hooks/useAuth";
import { useOfflinePayments } from "@/hooks/useOfflinePayments";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  LayoutDashboard,
  History,
  QrCode,
  WifiOff,
  User,
  ScanLine,
  Keyboard,
  ArrowLeft,
  Wifi,
  AlertTriangle
} from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/merchant", icon: <LayoutDashboard className="w-4 h-4" /> },
  { label: "Accept Payment", href: "/merchant/accept", icon: <QrCode className="w-4 h-4" /> },
  { label: "Transactions", href: "/merchant/transactions", icon: <History className="w-4 h-4" /> },
  { label: "Offline Sync", href: "/merchant/offline", icon: <WifiOff className="w-4 h-4" /> },
  { label: "Profile", href: "/merchant/profile", icon: <User className="w-4 h-4" /> },
];

type PaymentStep = "select" | "scan" | "process";

export default function AcceptPayment() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const [merchantWallet, setMerchantWallet] = useState("");
  const [isActive, setIsActive] = useState(false);
  const [step, setStep] = useState<PaymentStep>("select");
  const [scannedData, setScannedData] = useState("");

  const { isOnline, addOfflineTransaction, getPendingCount } = useOfflinePayments(merchantWallet);

  useEffect(() => {
    if (!loading && (!user || profile?.role !== "merchant")) {
      navigate("/auth/merchant");
    }
  }, [user, profile, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchMerchantData();
    }
  }, [user]);

  const fetchMerchantData = async () => {
    const { data } = await supabase
      .from("merchants")
      .select("wallet_address, is_active")
      .eq("user_id", user?.id)
      .maybeSingle();

    if (data) {
      setMerchantWallet(data.wallet_address || "");
      setIsActive(data.is_active || false);
    }
  };

  const handleScan = (data: string) => {
    setScannedData(data);
    setStep("process");
  };

  const handlePaymentSuccess = () => {
    toast.success("Payment recorded successfully!");
    setStep("select");
    setScannedData("");
  };

  const handleCancel = () => {
    setStep("select");
    setScannedData("");
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <DashboardLayout title="Accept Payment" navItems={navItems} role="merchant">
      {!isActive ? (
        <Card className="border-warning border-2 animate-fade-in">
          <CardContent className="py-8 text-center">
            <Badge variant="outline" className="mb-4 text-warning border-warning">
              Account Not Active
            </Badge>
            <p className="text-muted-foreground">
              Your merchant account is pending activation. Please wait while we verify your details.
            </p>
            <Button variant="outline" className="mt-4" onClick={() => navigate("/merchant")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {step === "select" && (
            <div className="space-y-6 animate-fade-in">
              {/* Connection Status Banner */}
              <Card className={`border-2 ${isOnline ? "border-success/30" : "border-warning/30"}`}>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {isOnline ? (
                        <Wifi className="w-5 h-5 text-success" />
                      ) : (
                        <WifiOff className="w-5 h-5 text-warning" />
                      )}
                      <div>
                        <p className="font-medium">
                          {isOnline ? "Online Mode" : "Offline Mode"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {isOnline 
                            ? "Transactions will be processed immediately" 
                            : "Transactions will be saved locally and synced later"
                          }
                        </p>
                      </div>
                    </div>
                    {!isOnline && getPendingCount() > 0 && (
                      <Badge variant="outline" className="text-warning border-warning">
                        {getPendingCount()} pending sync
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>

              {!isOnline && (
                <Card className="bg-warning/5 border-warning/30">
                  <CardContent className="py-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-warning mt-0.5" />
                      <div>
                        <p className="font-medium text-warning">Offline Payment Mode</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          You can still accept payments while offline. Transactions will be saved 
                          locally and automatically synced when internet connection is restored.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card className="border-2 border-primary/20">
                <CardHeader>
                  <CardTitle>Accept Relief Payment</CardTitle>
                  <CardDescription>
                    Choose how to receive payment from beneficiaries
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-4">
                  <Button
                    variant="outline"
                    className="h-32 flex flex-col gap-2 card-hover btn-hover"
                    onClick={() => setStep("scan")}
                  >
                    <ScanLine className="w-10 h-10 text-primary" />
                    <span className="font-semibold">Scan QR Code</span>
                    <span className="text-xs text-muted-foreground">
                      Scan citizen's QR code
                    </span>
                  </Button>

                  <Button
                    variant="outline"
                    className="h-32 flex flex-col gap-2 card-hover btn-hover"
                    onClick={() => setStep("scan")}
                  >
                    <Keyboard className="w-10 h-10 text-primary" />
                    <span className="font-semibold">Enter Code</span>
                    <span className="text-xs text-muted-foreground">
                      Type wallet address manually
                    </span>
                  </Button>
                </CardContent>
              </Card>

              {/* Payment Guidelines */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Payment Guidelines</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      Maximum ₹15,000 per beneficiary per day
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      Only relief-related purchases are allowed
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      All transactions are recorded on blockchain
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      Offline transactions will sync when internet returns
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          )}

          {step === "scan" && (
            <QRScanner 
              onScan={handleScan} 
              onClose={handleCancel}
            />
          )}

          {step === "process" && scannedData && (
            <PaymentProcessor
              citizenData={scannedData}
              merchantWallet={merchantWallet}
              onSuccess={handlePaymentSuccess}
              onCancel={handleCancel}
              isOnline={isOnline}
              onOfflinePayment={addOfflineTransaction}
            />
          )}
        </>
      )}
    </DashboardLayout>
  );
}
