import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import { 
  LayoutDashboard,
  QrCode,
  History,
  Store,
  HelpCircle,
  User,
  Download,
  RefreshCw,
  Wallet,
  Shield
} from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/citizen", icon: <LayoutDashboard className="w-4 h-4" /> },
  { label: "My QR Code", href: "/citizen/qr", icon: <QrCode className="w-4 h-4" /> },
  { label: "Transactions", href: "/citizen/transactions", icon: <History className="w-4 h-4" /> },
  { label: "Nearby Merchants", href: "/citizen/merchants", icon: <Store className="w-4 h-4" /> },
  { label: "Help & Complaints", href: "/citizen/help", icon: <HelpCircle className="w-4 h-4" /> },
  { label: "Profile", href: "/citizen/profile", icon: <User className="w-4 h-4" /> },
];

export default function QRCodePage() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const [balance, setBalance] = useState(0);
  const [qrExpiry, setQrExpiry] = useState<Date | null>(null);

  useEffect(() => {
    if (!loading && (!user || profile?.role !== "citizen")) {
      navigate("/auth/citizen");
    }
  }, [user, profile, loading, navigate]);

  useEffect(() => {
    if (profile) {
      fetchBalance();
      // QR expires in 24 hours
      setQrExpiry(new Date(Date.now() + 24 * 60 * 60 * 1000));
    }
  }, [profile]);

  const fetchBalance = async () => {
    const { data: beneficiary } = await supabase
      .from("beneficiaries")
      .select("tokens_allocated, tokens_spent")
      .eq("citizen_id", profile?.id)
      .eq("is_active", true)
      .maybeSingle();

    if (beneficiary) {
      setBalance(Number(beneficiary.tokens_allocated) - Number(beneficiary.tokens_spent));
    } else {
      setBalance(Number(profile?.wallet_balance) || 0);
    }
  };

  const qrData = profile ? JSON.stringify({
    userId: profile.user_id,
    walletAddress: profile.wallet_address,
    timestamp: Date.now(),
    signature: btoa(`${profile.wallet_address}:${Date.now()}`).slice(0, 16),
    version: "1.0"
  }) : "";

  const downloadQR = () => {
    const svg = document.getElementById("citizen-qr");
    if (svg) {
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();
      
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);
        const pngFile = canvas.toDataURL("image/png");
        const downloadLink = document.createElement("a");
        downloadLink.download = `RELIFEX-QR-${profile?.wallet_address?.slice(0, 8)}.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
      };
      
      img.src = "data:image/svg+xml;base64," + btoa(svgData);
      toast.success("QR Code downloaded!");
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <DashboardLayout title="My QR Code" navItems={navItems} role="citizen">
      <div className="max-w-lg mx-auto space-y-6">
        {/* Main QR Card */}
        <Card className="border-2 border-primary/20 animate-fade-in">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <QrCode className="w-5 h-5" />
              Your Payment QR Code
            </CardTitle>
            <CardDescription>
              Show this to merchants to make payments using your relief tokens
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            {/* QR Code */}
            <div className="bg-white p-6 rounded-xl shadow-lg border-2 animate-scale-in">
              <QRCodeSVG 
                id="citizen-qr"
                value={qrData || "RELIFEX"} 
                size={220}
                level="H"
                includeMargin
                imageSettings={{
                  src: "/placeholder.svg",
                  height: 24,
                  width: 24,
                  excavate: true,
                }}
              />
            </div>

            {/* Wallet Address */}
            <div className="mt-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">Wallet Address</p>
              <p className="font-mono text-sm bg-muted px-3 py-1 rounded">
                {profile?.wallet_address}
              </p>
            </div>

            {/* Balance Display */}
            <div className="mt-4 bg-gradient-to-r from-primary/10 to-primary/5 p-4 rounded-lg w-full">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-primary" />
                  <span className="text-sm text-muted-foreground">Available Balance</span>
                </div>
                <span className="text-xl font-bold text-primary">
                  ₹{balance.toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            {/* QR Expiry */}
            {qrExpiry && (
              <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                <RefreshCw className="w-3 h-3" />
                QR refreshes: {qrExpiry.toLocaleString("en-IN")}
              </div>
            )}

            {/* Download Button */}
            <Button 
              onClick={downloadQR} 
              className="mt-4 w-full btn-hover"
              variant="outline"
            >
              <Download className="w-4 h-4 mr-2" />
              Download QR Code
            </Button>
          </CardContent>
        </Card>

        {/* Security Notice */}
        <Card className="bg-muted/50 animate-fade-in-up">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium text-sm">Secure Transaction</p>
                <p className="text-xs text-muted-foreground mt-1">
                  This QR code contains your encrypted wallet information. Only verified 
                  merchants can process payments. All transactions are recorded on the 
                  blockchain for transparency.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Usage Instructions */}
        <Card className="animate-fade-in-up animate-delay-100">
          <CardHeader>
            <CardTitle className="text-lg">How to Use</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <Badge className="shrink-0">1</Badge>
                <span>Visit any verified merchant displaying the RELIFEX logo</span>
              </li>
              <li className="flex items-start gap-3">
                <Badge className="shrink-0">2</Badge>
                <span>Show this QR code to the merchant</span>
              </li>
              <li className="flex items-start gap-3">
                <Badge className="shrink-0">3</Badge>
                <span>Merchant will scan and enter the purchase amount</span>
              </li>
              <li className="flex items-start gap-3">
                <Badge className="shrink-0">4</Badge>
                <span>Amount will be deducted from your relief balance</span>
              </li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
