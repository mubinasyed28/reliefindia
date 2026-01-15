import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { BillUpload } from "@/components/ngo/BillUpload";
import { useAuth } from "@/hooks/useAuth";
import { 
  LayoutDashboard,
  Wallet,
  Users,
  FileText,
  User,
  ArrowLeft
} from "lucide-react";
import { useEffect } from "react";

const navItems = [
  { label: "Dashboard", href: "/ngo", icon: <LayoutDashboard className="w-4 h-4" /> },
  { label: "Spending", href: "/ngo/spending", icon: <Wallet className="w-4 h-4" /> },
  { label: "Beneficiaries", href: "/ngo/beneficiaries", icon: <Users className="w-4 h-4" /> },
  { label: "Reports", href: "/ngo/reports", icon: <FileText className="w-4 h-4" /> },
  { label: "Profile", href: "/ngo/profile", icon: <User className="w-4 h-4" /> },
];

export default function BillUploadPage() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const [amount, setAmount] = useState<number>(0);
  const [showUpload, setShowUpload] = useState(false);

  useEffect(() => {
    if (!loading && (!user || profile?.role !== "ngo")) {
      navigate("/auth/ngo");
    }
  }, [user, profile, loading, navigate]);

  const handleAmountSubmit = () => {
    if (amount >= 50000) {
      setShowUpload(true);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <DashboardLayout title="Bill Upload" navItems={navItems} role="ngo">
      <Button
        variant="ghost"
        className="mb-4"
        onClick={() => navigate("/ngo")}
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Dashboard
      </Button>

      <div className="max-w-2xl mx-auto space-y-6">
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Submit Bill for Large Transaction
            </CardTitle>
            <CardDescription>
              As per transparency guidelines, bills are required for all transactions above ₹50,000.
              Our AI system will validate the bill details automatically.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!showUpload ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Transaction Amount (₹)</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="Enter amount"
                    value={amount || ""}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="text-lg"
                  />
                </div>

                {amount > 0 && amount < 50000 && (
                  <p className="text-sm text-muted-foreground">
                    Bill upload is only required for transactions ≥ ₹50,000.
                    Current amount is below the threshold.
                  </p>
                )}

                <Button
                  className="w-full btn-hover"
                  onClick={handleAmountSubmit}
                  disabled={amount < 50000}
                >
                  {amount >= 50000 
                    ? "Proceed to Upload Bill" 
                    : "Enter amount ≥ ₹50,000 to continue"
                  }
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <Button
                  variant="outline"
                  onClick={() => setShowUpload(false)}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Change Amount
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {showUpload && (
          <BillUpload 
            amount={amount}
            onValidationComplete={(result) => {
              console.log("Validation complete:", result);
            }}
          />
        )}

        {/* Information Card */}
        <Card className="animate-fade-in-up animate-delay-200">
          <CardHeader>
            <CardTitle className="text-lg">About AI Bill Validation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              Our AI-powered validation system automatically checks:
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li>Amount consistency with claimed transaction value</li>
              <li>Vendor/supplier details verification</li>
              <li>Bill date and format validity</li>
              <li>Signs of tampering or irregularities</li>
              <li>GST compliance for applicable transactions</li>
            </ul>
            <p className="text-amber-600">
              Bills flagged for review will be manually verified by administrators.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
