import { useState } from "react";
import { GovHeader } from "@/components/layout/GovHeader";
import { GovFooter } from "@/components/layout/GovFooter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Wallet, 
  Store, 
  MapPin, 
  Search, 
  CheckCircle, 
  XCircle, 
  Loader2,
  Navigation,
  Phone,
  Clock
} from "lucide-react";

export default function ServicesPage() {
  const [walletAddress, setWalletAddress] = useState("");
  const [merchantCode, setMerchantCode] = useState("");
  const [walletResult, setWalletResult] = useState<any>(null);
  const [merchantResult, setMerchantResult] = useState<any>(null);
  const [loadingWallet, setLoadingWallet] = useState(false);
  const [loadingMerchant, setLoadingMerchant] = useState(false);

  const verifyWallet = async () => {
    if (!walletAddress.trim()) {
      toast.error("Please enter a wallet address");
      return;
    }

    setLoadingWallet(true);
    setWalletResult(null);

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, wallet_address, wallet_balance, is_verified, role")
        .eq("wallet_address", walletAddress.trim())
        .single();

      if (error || !data) {
        setWalletResult({ found: false });
      } else {
        setWalletResult({ found: true, ...data });
      }
    } catch (error) {
      setWalletResult({ found: false });
    } finally {
      setLoadingWallet(false);
    }
  };

  const verifyMerchant = async () => {
    if (!merchantCode.trim()) {
      toast.error("Please enter a merchant code");
      return;
    }

    setLoadingMerchant(true);
    setMerchantResult(null);

    try {
      const { data, error } = await supabase
        .from("merchants")
        .select("shop_name, full_name, shop_address, is_active, trust_score, mobile")
        .or(`merchant_token.eq.${merchantCode.trim()},wallet_address.eq.${merchantCode.trim()}`)
        .single();

      if (error || !data) {
        setMerchantResult({ found: false });
      } else {
        setMerchantResult({ found: true, ...data });
      }
    } catch (error) {
      setMerchantResult({ found: false });
    } finally {
      setLoadingMerchant(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <GovHeader />

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-navy-dark via-navy-blue to-navy-dark text-white py-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-64 h-64 bg-saffron rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-64 h-64 bg-green-india rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 relative z-10 text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Public Services</h1>
          <p className="text-lg text-white/80 max-w-2xl mx-auto">
            Verify wallets, check merchant authenticity, and find help near you
          </p>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-12 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Wallet Verification */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-primary" />
                  Wallet Verification
                </CardTitle>
                <CardDescription>
                  Verify any RELIFEX wallet address
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="wallet">Wallet Address</Label>
                  <div className="flex gap-2">
                    <Input
                      id="wallet"
                      placeholder="Enter wallet address (RLX...)"
                      value={walletAddress}
                      onChange={(e) => setWalletAddress(e.target.value)}
                    />
                    <Button onClick={verifyWallet} disabled={loadingWallet}>
                      {loadingWallet ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Search className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {walletResult && (
                  <div className={`p-4 rounded-lg ${walletResult.found ? "bg-green-50 dark:bg-green-900/20" : "bg-red-50 dark:bg-red-900/20"}`}>
                    {walletResult.found ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                          <CheckCircle className="w-5 h-5" />
                          <span className="font-medium">Wallet Verified</span>
                        </div>
                        <p className="text-sm"><strong>Name:</strong> {walletResult.full_name || "N/A"}</p>
                        <p className="text-sm"><strong>Role:</strong> {walletResult.role}</p>
                        <p className="text-sm"><strong>Balance:</strong> ₹{walletResult.wallet_balance?.toLocaleString() || 0}</p>
                        <Badge variant={walletResult.is_verified ? "default" : "secondary"}>
                          {walletResult.is_verified ? "Verified" : "Unverified"}
                        </Badge>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                        <XCircle className="w-5 h-5" />
                        <span>Wallet not found in RELIFEX system</span>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Merchant Verification */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Store className="w-5 h-5 text-green-600" />
                  Merchant Verification
                </CardTitle>
                <CardDescription>
                  Verify merchant authenticity before transacting
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="merchant">Merchant Code</Label>
                  <div className="flex gap-2">
                    <Input
                      id="merchant"
                      placeholder="Enter merchant code or wallet"
                      value={merchantCode}
                      onChange={(e) => setMerchantCode(e.target.value)}
                    />
                    <Button onClick={verifyMerchant} disabled={loadingMerchant}>
                      {loadingMerchant ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Search className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {merchantResult && (
                  <div className={`p-4 rounded-lg ${merchantResult.found ? "bg-green-50 dark:bg-green-900/20" : "bg-red-50 dark:bg-red-900/20"}`}>
                    {merchantResult.found ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                          <CheckCircle className="w-5 h-5" />
                          <span className="font-medium">Merchant Verified</span>
                        </div>
                        <p className="text-sm"><strong>Shop:</strong> {merchantResult.shop_name}</p>
                        <p className="text-sm"><strong>Owner:</strong> {merchantResult.full_name}</p>
                        <p className="text-sm"><strong>Address:</strong> {merchantResult.shop_address}</p>
                        <p className="text-sm"><strong>Trust Score:</strong> {merchantResult.trust_score || 75}/100</p>
                        <Badge variant={merchantResult.is_active ? "default" : "destructive"}>
                          {merchantResult.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                        <XCircle className="w-5 h-5" />
                        <span>Merchant not found - Do not transact!</span>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Find Help Near Me */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-red-500" />
                  Find Help Near Me
                </CardTitle>
                <CardDescription>
                  Locate relief centers, medical camps, and food distribution points
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button className="w-full" variant="outline">
                  <Navigation className="w-4 h-4 mr-2" />
                  Use My Location
                </Button>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="secondary" size="sm">
                    <MapPin className="w-3 h-3 mr-1" />
                    Relief Centers
                  </Button>
                  <Button variant="secondary" size="sm">
                    <MapPin className="w-3 h-3 mr-1" />
                    Medical Camps
                  </Button>
                  <Button variant="secondary" size="sm">
                    <MapPin className="w-3 h-3 mr-1" />
                    Food Points
                  </Button>
                  <Button variant="secondary" size="sm">
                    <MapPin className="w-3 h-3 mr-1" />
                    Merchants
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Track My Aid */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="w-5 h-5 text-primary" />
                  Track My Aid
                </CardTitle>
                <CardDescription>
                  Track the status of your relief allocation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Enter Your Aadhaar (Last 4 digits) or Mobile</Label>
                  <div className="flex gap-2">
                    <Input placeholder="Mobile or Aadhaar last 4" />
                    <Button>
                      <Search className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="text-center text-sm text-muted-foreground py-4">
                  Enter your details to check if you've been registered as a beneficiary
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Helpline */}
      <section className="py-8 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-8 items-center">
            <div className="flex items-center gap-3">
              <Phone className="w-8 h-8 text-green-600" />
              <div>
                <p className="font-semibold">Toll Free Helpline</p>
                <p className="text-lg text-primary">1800-XXX-XXXX</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="w-8 h-8 text-primary" />
              <div>
                <p className="font-semibold">24x7 Support</p>
                <p className="text-muted-foreground">Available round the clock</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <GovFooter />
    </div>
  );
}
