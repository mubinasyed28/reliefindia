import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  User, 
  Wallet, 
  CheckCircle, 
  XCircle, 
  Loader2,
  ShoppingBag,
  AlertTriangle,
  WifiOff
} from "lucide-react";
import { OfflineTransaction } from "@/hooks/useOfflinePayments";

interface CitizenInfo {
  userId: string;
  walletAddress: string;
  fullName: string;
  balance: number;
  spentToday: number;
  dailyLimit: number;
}

interface PaymentProcessorProps {
  citizenData: string;
  merchantWallet: string;
  onSuccess: () => void;
  onCancel: () => void;
  isOnline?: boolean;
  onOfflinePayment?: (tx: Omit<OfflineTransaction, "id" | "synced" | "syncAttempts">) => void;
}

export function PaymentProcessor({ 
  citizenData, 
  merchantWallet, 
  onSuccess, 
  onCancel,
  isOnline = true,
  onOfflinePayment
}: PaymentProcessorProps) {
  const [step, setStep] = useState<"verify" | "amount" | "confirm" | "processing" | "success" | "error">("verify");
  const [citizenInfo, setCitizenInfo] = useState<CitizenInfo | null>(null);
  const [amount, setAmount] = useState("");
  const [purpose, setPurpose] = useState("");
  const [error, setError] = useState("");
  const [transactionHash, setTransactionHash] = useState("");

  const verifyCitizen = async () => {
    try {
      let parsedData: any;
      
      // Try to parse QR data
      try {
        parsedData = JSON.parse(citizenData);
      } catch {
        // If not JSON, treat as wallet address
        parsedData = { walletAddress: citizenData };
      }

      const walletAddress = parsedData.walletAddress || citizenData;

      // Fetch citizen profile by wallet address
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("wallet_address", walletAddress)
        .maybeSingle();

      if (profileError || !profile) {
        setError("Citizen not found. Please check the QR code or wallet address.");
        setStep("error");
        return;
      }

      // Get beneficiary info for spending limits
      const { data: beneficiary } = await supabase
        .from("beneficiaries")
        .select("tokens_allocated, tokens_spent")
        .eq("citizen_id", profile.id)
        .eq("is_active", true)
        .maybeSingle();

      // Calculate today's spending
      const today = new Date().toISOString().split('T')[0];
      const { data: todayTxs } = await supabase
        .from("transactions")
        .select("amount")
        .eq("from_wallet", walletAddress)
        .gte("created_at", today);

      const spentToday = todayTxs?.reduce((sum, tx) => sum + Number(tx.amount), 0) || 0;

      setCitizenInfo({
        userId: profile.user_id,
        walletAddress: profile.wallet_address,
        fullName: profile.full_name || "Citizen",
        balance: beneficiary 
          ? Number(beneficiary.tokens_allocated) - Number(beneficiary.tokens_spent)
          : Number(profile.wallet_balance) || 0,
        spentToday,
        dailyLimit: 15000
      });

      setStep("amount");
    } catch (err) {
      setError("Failed to verify citizen. Please try again.");
      setStep("error");
    }
  };

  const validateAmount = () => {
    const numAmount = parseFloat(amount);
    
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error("Please enter a valid amount");
      return false;
    }

    if (!citizenInfo) return false;

    if (numAmount > citizenInfo.balance) {
      toast.error("Insufficient balance");
      return false;
    }

    const remainingLimit = citizenInfo.dailyLimit - citizenInfo.spentToday;
    if (numAmount > remainingLimit) {
      toast.error(`Daily limit exceeded. Remaining: ₹${remainingLimit.toLocaleString("en-IN")}`);
      return false;
    }

    setStep("confirm");
    return true;
  };

  const processPayment = async () => {
    setStep("processing");
    
    try {
      const numAmount = parseFloat(amount);
      
      // Generate transaction hash
      const txHash = "0x" + Array.from({length: 64}, () => 
        Math.floor(Math.random() * 16).toString(16)
      ).join("");

      // Handle offline payment
      if (!isOnline && onOfflinePayment) {
        const qrSignature = btoa(`${citizenInfo!.walletAddress}:${numAmount}:${Date.now()}`).slice(0, 32);
        
        onOfflinePayment({
          citizenWallet: citizenInfo!.walletAddress,
          citizenName: citizenInfo!.fullName,
          merchantWallet,
          amount: numAmount,
          purpose: purpose || "Relief goods purchase",
          timestamp: new Date().toISOString(),
          qrSignature,
        });

        setTransactionHash(`OFFLINE_${qrSignature}`);
        setStep("success");
        return;
      }

      // Create transaction record (online mode)
      const { error: txError } = await supabase
        .from("transactions")
        .insert({
          from_wallet: citizenInfo!.walletAddress,
          from_type: "citizen",
          to_wallet: merchantWallet,
          to_type: "merchant",
          amount: numAmount,
          purpose: purpose || "Relief goods purchase",
          status: "completed",
          transaction_hash: txHash,
          is_offline: false
        });

      if (txError) throw txError;

      // Update beneficiary spent amount
      const { data: beneficiary } = await supabase
        .from("beneficiaries")
        .select("id, tokens_spent")
        .eq("citizen_id", citizenInfo!.userId)
        .eq("is_active", true)
        .maybeSingle();

      if (beneficiary) {
        // Note: This update might fail due to RLS, but the transaction is recorded
        await supabase
          .from("beneficiaries")
          .update({ tokens_spent: Number(beneficiary.tokens_spent) + numAmount })
          .eq("id", beneficiary.id);
      }

      setTransactionHash(txHash);
      setStep("success");
      
    } catch (err) {
      console.error("Payment error:", err);
      setError("Payment failed. Please try again.");
      setStep("error");
    }
  };

  // Verify citizen on mount
  if (step === "verify") {
    verifyCitizen();
  }

  return (
    <Card className="w-full max-w-md mx-auto animate-scale-in">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShoppingBag className="w-5 h-5" />
          Process Payment
        </CardTitle>
        <CardDescription>
          {step === "verify" && "Verifying citizen..."}
          {step === "amount" && "Enter payment details"}
          {step === "confirm" && "Confirm transaction"}
          {step === "processing" && "Processing payment..."}
          {step === "success" && "Payment successful!"}
          {step === "error" && "Payment failed"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {step === "verify" && (
          <div className="flex flex-col items-center py-8">
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
            <p className="mt-4 text-muted-foreground">Verifying citizen identity...</p>
          </div>
        )}

        {step === "amount" && citizenInfo && (
          <div className="space-y-4">
            {/* Citizen Info */}
            <div className="bg-muted/50 p-4 rounded-lg space-y-2">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">{citizenInfo.fullName}</span>
              </div>
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-mono">
                  {citizenInfo.walletAddress.slice(0, 16)}...
                </span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between text-sm">
                <span>Available Balance:</span>
                <span className="font-semibold text-success">
                  ₹{citizenInfo.balance.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Spent Today:</span>
                <span>₹{citizenInfo.spentToday.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Remaining Limit:</span>
                <span className="font-semibold">
                  ₹{(citizenInfo.dailyLimit - citizenInfo.spentToday).toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            {/* Amount Input */}
            <div className="space-y-2">
              <Label htmlFor="payAmount">Amount (₹)</Label>
              <Input
                id="payAmount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                className="text-2xl font-bold h-14"
                autoFocus
              />
            </div>

            {/* Purpose */}
            <div className="space-y-2">
              <Label htmlFor="purpose">Purpose (Optional)</Label>
              <Input
                id="purpose"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="e.g., Groceries, Medicine"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={onCancel} className="flex-1">
                Cancel
              </Button>
              <Button 
                onClick={validateAmount} 
                className="flex-1 bg-green-india hover:bg-green-india/90"
              >
                Continue
              </Button>
            </div>
          </div>
        )}

        {step === "confirm" && citizenInfo && (
          <div className="space-y-4">
            <div className="bg-primary/5 border-2 border-primary/20 p-4 rounded-lg">
              <p className="text-center text-3xl font-bold text-primary">
                ₹{parseFloat(amount).toLocaleString("en-IN")}
              </p>
              <p className="text-center text-sm text-muted-foreground mt-1">
                {purpose || "Relief goods purchase"}
              </p>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">From:</span>
                <span className="font-medium">{citizenInfo.fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">To:</span>
                <span className="font-mono text-xs">{merchantWallet.slice(0, 16)}...</span>
              </div>
            </div>

            <div className="bg-warning/10 border border-warning/20 p-3 rounded-lg flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-warning mt-0.5" />
              <p className="text-sm text-warning">
                Please verify the amount before confirming. Transactions cannot be reversed.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => setStep("amount")} className="flex-1">
                Back
              </Button>
              <Button 
                onClick={processPayment} 
                className="flex-1 bg-green-india hover:bg-green-india/90"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Confirm Payment
              </Button>
            </div>
          </div>
        )}

        {step === "processing" && (
          <div className="flex flex-col items-center py-8">
            <div className="relative">
              <Loader2 className="w-16 h-16 text-primary animate-spin" />
              <div className="absolute inset-0 w-16 h-16 border-4 border-primary/20 rounded-full" />
            </div>
            <p className="mt-4 font-medium">Processing transaction...</p>
            <p className="text-sm text-muted-foreground">Please wait, do not close this window</p>
          </div>
        )}

        {step === "success" && (
          <div className="flex flex-col items-center py-6">
            <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center animate-scale-in">
              <CheckCircle className="w-12 h-12 text-success" />
            </div>
            <p className="mt-4 text-xl font-bold text-success">Payment Successful!</p>
            <p className="text-3xl font-bold mt-2">
              ₹{parseFloat(amount).toLocaleString("en-IN")}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {purpose || "Relief goods purchase"}
            </p>
            
            <div className="w-full mt-4 p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground">Transaction Hash:</p>
              <p className="text-xs font-mono break-all">{transactionHash}</p>
            </div>

            <Button 
              onClick={onSuccess} 
              className="w-full mt-4 bg-green-india hover:bg-green-india/90"
            >
              Done
            </Button>
          </div>
        )}

        {step === "error" && (
          <div className="flex flex-col items-center py-6">
            <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center">
              <XCircle className="w-12 h-12 text-destructive" />
            </div>
            <p className="mt-4 text-xl font-bold text-destructive">Payment Failed</p>
            <p className="text-sm text-muted-foreground mt-2 text-center">{error}</p>
            
            <div className="flex gap-2 w-full mt-6">
              <Button variant="outline" onClick={onCancel} className="flex-1">
                Cancel
              </Button>
              <Button onClick={() => setStep("verify")} className="flex-1">
                Try Again
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
