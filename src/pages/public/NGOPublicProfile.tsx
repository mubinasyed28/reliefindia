import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { GovHeader } from "@/components/layout/GovHeader";
import { GovFooter } from "@/components/layout/GovFooter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { TrustScore } from "@/components/transparency/TrustScore";
import { FundTracker } from "@/components/transparency/FundTracker";
import { supabase } from "@/integrations/supabase/client";
import { 
  Building2, MapPin, Phone, Mail, Calendar, Wallet, TrendingUp, 
  FileText, Users, ArrowLeft, CheckCircle, AlertTriangle, Shield
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface NGOData {
  id: string;
  ngo_name: string;
  office_address: string;
  contact_email: string;
  contact_phone: string;
  status: string;
  created_at: string;
  wallet_balance: number;
  trust_score: number;
  fraud_flags: number;
  impact_metrics: {
    people_helped: number;
    meals_served: number;
    medicines_delivered: number;
    shelters_provided: number;
  };
}

interface Transaction {
  id: string;
  amount: number;
  purpose: string | null;
  created_at: string;
  to_type: string;
}

interface BillValidation {
  id: string;
  amount: number;
  vendor_name: string | null;
  ai_validation_status: string;
  created_at: string;
}

export default function NGOPublicProfile() {
  const { id } = useParams<{ id: string }>();
  const [ngo, setNgo] = useState<NGOData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [bills, setBills] = useState<BillValidation[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalReceived: 0,
    totalSpent: 0,
    transactionCount: 0,
  });

  useEffect(() => {
    if (id) {
      fetchNGOData();
    }
  }, [id]);

  const fetchNGOData = async () => {
    setLoading(true);

    // Fetch NGO details
    const { data: ngoData } = await supabase
      .from("ngos")
      .select("*")
      .eq("id", id)
      .eq("status", "verified")
      .maybeSingle();

    if (!ngoData) {
      setLoading(false);
      return;
    }

    // Parse impact_metrics properly
    const impactMetrics = typeof ngoData.impact_metrics === 'object' && ngoData.impact_metrics !== null
      ? ngoData.impact_metrics as NGOData['impact_metrics']
      : { people_helped: 0, meals_served: 0, medicines_delivered: 0, shelters_provided: 0 };

    setNgo({
      ...ngoData,
      trust_score: ngoData.trust_score || 75,
      fraud_flags: ngoData.fraud_flags || 0,
      impact_metrics: impactMetrics,
    });

    // Fetch transactions where NGO wallet is involved
    if (ngoData.wallet_address) {
      const { data: txData } = await supabase
        .from("transactions")
        .select("id, amount, purpose, created_at, to_type")
        .or(`from_wallet.eq.${ngoData.wallet_address},to_wallet.eq.${ngoData.wallet_address}`)
        .order("created_at", { ascending: false })
        .limit(10);

      setTransactions(txData || []);

      // Calculate stats
      const totalSpent = (txData || [])
        .filter((t) => t.to_type === "merchant")
        .reduce((sum, t) => sum + Number(t.amount), 0);

      setStats({
        totalReceived: Number(ngoData.wallet_balance || 0) + totalSpent,
        totalSpent,
        transactionCount: txData?.length || 0,
      });
    }

    // Fetch bill validations
    const { data: billData } = await supabase
      .from("bill_validations")
      .select("id, amount, vendor_name, ai_validation_status, created_at")
      .eq("ngo_id", id)
      .order("created_at", { ascending: false })
      .limit(5);

    setBills(billData || []);

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!ngo) {
    return (
      <div className="min-h-screen flex flex-col">
        <GovHeader />
        <div className="flex-1 flex items-center justify-center">
          <Card className="max-w-md">
            <CardContent className="pt-6 text-center">
              <AlertTriangle className="w-12 h-12 mx-auto text-amber-500 mb-4" />
              <h2 className="text-xl font-bold mb-2">NGO Not Found</h2>
              <p className="text-muted-foreground mb-4">
                This NGO profile is not available or has not been verified.
              </p>
              <Button asChild>
                <Link to="/">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Home
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
        <GovFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <GovHeader />

      <main className="flex-1 py-8">
        <div className="container mx-auto px-4 max-w-6xl">
          <Button variant="ghost" asChild className="mb-6">
            <Link to="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Link>
          </Button>

          {/* Header */}
          <div className="grid lg:grid-cols-3 gap-6 mb-8">
            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Building2 className="w-8 h-8 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <CardTitle className="text-xl">{ngo.ngo_name}</CardTitle>
                      <Badge variant="default" className="bg-green-600">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Verified
                      </Badge>
                    </div>
                    <CardDescription className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {ngo.office_address}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <a href={`mailto:${ngo.contact_email}`} className="text-primary hover:underline">
                      {ngo.contact_email}
                    </a>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <a href={`tel:${ngo.contact_phone}`} className="text-primary hover:underline">
                      {ngo.contact_phone}
                    </a>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span>
                      Registered {formatDistanceToNow(new Date(ngo.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <span>{stats.transactionCount} transactions</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <TrustScore
              score={ngo.trust_score}
              verifiedTransactions={stats.transactionCount}
              complianceRate={95}
              fraudFlags={ngo.fraud_flags}
              timeInSystem={Math.floor(
                (Date.now() - new Date(ngo.created_at).getTime()) / (1000 * 60 * 60 * 24 * 30)
              )}
            />
          </div>

          {/* Fund Tracker */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-primary" />
                Fund Utilization
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FundTracker
                released={stats.totalReceived}
                used={stats.totalSpent}
                remaining={stats.totalReceived - stats.totalSpent}
              />
            </CardContent>
          </Card>

          {/* Impact Metrics */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Impact Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold text-primary">
                    {ngo.impact_metrics.people_helped.toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground">People Helped</p>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold text-amber-600">
                    {ngo.impact_metrics.meals_served.toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground">Meals Served</p>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">
                    {ngo.impact_metrics.medicines_delivered.toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground">Medicines Delivered</p>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">
                    {ngo.impact_metrics.shelters_provided.toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground">Shelters Provided</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Transactions & Bills */}
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Recent Transactions
                </CardTitle>
              </CardHeader>
              <CardContent>
                {transactions.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No transactions yet</p>
                ) : (
                  <div className="space-y-3">
                    {transactions.map((tx) => (
                      <div key={tx.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div>
                          <p className="font-medium text-sm">{tx.purpose || "Token transfer"}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(tx.created_at), { addSuffix: true })}
                          </p>
                        </div>
                        <p className="font-semibold text-green-600">
                          ₹{Number(tx.amount).toLocaleString("en-IN")}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Bills Uploaded
                </CardTitle>
              </CardHeader>
              <CardContent>
                {bills.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No bills uploaded yet</p>
                ) : (
                  <div className="space-y-3">
                    {bills.map((bill) => (
                      <div key={bill.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div>
                          <p className="font-medium text-sm">{bill.vendor_name || "Unknown vendor"}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(bill.created_at), { addSuffix: true })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">₹{Number(bill.amount).toLocaleString("en-IN")}</p>
                          <Badge
                            variant={bill.ai_validation_status === "approved" ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {bill.ai_validation_status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <GovFooter />
    </div>
  );
}
