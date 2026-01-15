import { useState } from "react";
import { TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  AlertTriangle, 
  RefreshCw, 
  Trash2, 
  Play,
  CheckCircle,
  Database,
  Building2,
  Store,
  Users,
  Activity,
  Zap,
  Shield,
  WifiOff,
  TrendingUp
} from "lucide-react";

type DemoLevel = "off" | "basic" | "simulation";

export function DemoModeTab() {
  const [demoLevel, setDemoLevel] = useState<DemoLevel>("off");
  const [generating, setGenerating] = useState(false);
  const [clearing, setClearing] = useState(false);

  const generateBasicDemoData = async () => {
    setGenerating(true);
    try {
      // Generate 3 disasters
      const disasterNames = [
        { name: "Kerala Floods 2026", states: ["Kerala", "Karnataka"] },
        { name: "Assam Earthquake 2026", states: ["Assam", "Meghalaya", "Arunachal Pradesh"] },
        { name: "Rajasthan Drought 2026", states: ["Rajasthan", "Gujarat"] },
      ];

      const disasterInserts = disasterNames.map((d) => ({
        name: d.name,
        affected_states: d.states,
        status: "active" as const,
        total_tokens_allocated: Math.floor(Math.random() * 50000000) + 10000000,
        tokens_distributed: Math.floor(Math.random() * 5000000),
        spending_limit_per_user: 15000,
        description: `Emergency relief operation for ${d.name}`,
      }));

      const { data: disasters, error: disasterError } = await supabase
        .from("disasters")
        .insert(disasterInserts)
        .select();

      if (disasterError) throw disasterError;

      // Generate 5 NGOs
      const ngoNames = [
        "Relief Foundation India",
        "Helping Hands Trust",
        "Disaster Aid Network",
        "Community Care NGO",
        "Bharat Seva Sangh",
      ];

      const ngoInserts = ngoNames.map((name, i) => ({
        ngo_name: name,
        contact_email: `contact@${name.toLowerCase().replace(/\s+/g, "")}.org`,
        contact_phone: `+91 98765 ${43210 + i}`,
        legal_registration_number: `NGO${Date.now()}${i}`,
        office_address: `${100 + i} Relief Road, New Delhi`,
        status: "verified" as const,
        trust_score: 70 + Math.floor(Math.random() * 30),
        wallet_balance: Math.floor(Math.random() * 1000000) + 100000,
        wallet_address: `RLXNGO${Date.now()}${i}`.toUpperCase(),
      }));

      const { error: ngoError } = await supabase.from("ngos").insert(ngoInserts);
      if (ngoError) throw ngoError;

      // Generate 10 merchants
      const shopNames = [
        "Sharma General Store",
        "Gupta Provisions",
        "Khan Medical Store",
        "Patel Grocery",
        "Singh Kirana",
        "Das Food Mart",
        "Reddy Essentials",
        "Nair Supermarket",
        "Verma Daily Needs",
        "Iyer Provisions",
      ];

      const merchantInserts = shopNames.map((shop, i) => ({
        shop_name: shop,
        full_name: shop.split(" ")[0] + " " + ["Kumar", "Singh", "Sharma", "Patel", "Das"][i % 5],
        mobile: `+91 87654 ${32100 + i}`,
        aadhaar_number: `${Math.floor(Math.random() * 900000000000) + 100000000000}`,
        date_of_birth: `199${i % 10}-0${(i % 9) + 1}-15`,
        shop_address: `${i + 1} Market Road, District ${i + 1}`,
        is_active: true,
        trust_score: 60 + Math.floor(Math.random() * 40),
        wallet_address: `RLXMER${Date.now()}${i}`.toUpperCase(),
        total_redemptions: Math.floor(Math.random() * 100),
        daily_volume: Math.floor(Math.random() * 50000),
      }));

      const { error: merchantError } = await supabase.from("merchants").insert(merchantInserts);
      if (merchantError) throw merchantError;

      // Generate 100 transactions
      if (disasters && disasters.length > 0) {
        const transactionInserts = Array.from({ length: 100 }, (_, i) => ({
          from_wallet: `RLXNGO${Date.now()}${i % 5}`.toUpperCase(),
          to_wallet: `RLXCIT${Date.now()}${i}`.toUpperCase(),
          from_type: i % 3 === 0 ? "ngo" : i % 3 === 1 ? "citizen" : "admin",
          to_type: i % 3 === 0 ? "citizen" : i % 3 === 1 ? "merchant" : "ngo",
          amount: Math.floor(Math.random() * 5000) + 500,
          status: "completed" as const,
          disaster_id: disasters[i % disasters.length].id,
          purpose: ["Food", "Medicine", "Shelter", "Clothing", "Emergency"][i % 5],
          location: ["Delhi", "Mumbai", "Kolkata", "Chennai", "Bangalore"][i % 5],
        }));

        const { error: txError } = await supabase.from("transactions").insert(transactionInserts);
        if (txError) throw txError;
      }

      // Generate sample donations
      const donationInserts = Array.from({ length: 20 }, (_, i) => ({
        donor_name: i % 3 === 0 ? null : ["Rajesh Kumar", "Priya Sharma", "Amit Patel", "Sunita Devi", "Vikram Singh"][i % 5],
        donor_email: i % 3 === 0 ? null : `donor${i}@example.com`,
        amount: [500, 1000, 2500, 5000, 10000, 25000][i % 6],
        disaster_id: disasters ? disasters[i % disasters.length].id : null,
        is_anonymous: i % 3 === 0,
        payment_status: "completed",
        payment_reference: `UPI${Date.now()}${i}`,
      }));

      const { error: donationError } = await supabase.from("donations").insert(donationInserts);
      if (donationError) throw donationError;

      setDemoLevel("basic");
      toast.success("Basic Demo Mode Activated!", {
        description: "3 disasters, 5 NGOs, 10 merchants, 100 transactions, and 20 donations created.",
      });
    } catch (error: any) {
      console.error("Error generating demo data:", error);
      toast.error("Failed to generate demo data", {
        description: error.message,
      });
    } finally {
      setGenerating(false);
    }
  };

  const generateSimulationData = async () => {
    setGenerating(true);
    try {
      // First, ensure basic data exists
      if (demoLevel !== "basic") {
        await generateBasicDemoData();
      }

      // Get existing disasters
      const { data: disasters } = await supabase
        .from("disasters")
        .select("id, name")
        .eq("status", "active");

      if (!disasters || disasters.length === 0) {
        throw new Error("No disasters found. Please enable Basic mode first.");
      }

      // Simulate fund distributions (Admin → NGO → Citizen → Merchant flow)
      const simulationTransactions = [];
      
      // Admin to NGO transfers
      for (let i = 0; i < 10; i++) {
        simulationTransactions.push({
          from_wallet: "RLXGOV001ADMIN",
          to_wallet: `RLXNGO${Date.now()}${i % 5}`.toUpperCase(),
          from_type: "admin",
          to_type: "ngo",
          amount: Math.floor(Math.random() * 500000) + 100000,
          status: "completed" as const,
          disaster_id: disasters[i % disasters.length].id,
          purpose: "Fund Allocation",
          location: "New Delhi",
        });
      }

      // NGO to Citizen transfers
      for (let i = 0; i < 30; i++) {
        simulationTransactions.push({
          from_wallet: `RLXNGO${Date.now()}${i % 5}`.toUpperCase(),
          to_wallet: `RLXCIT${Date.now()}SIM${i}`.toUpperCase(),
          from_type: "ngo",
          to_type: "citizen",
          amount: Math.floor(Math.random() * 10000) + 2000,
          status: "completed" as const,
          disaster_id: disasters[i % disasters.length].id,
          purpose: ["Food Assistance", "Medical Aid", "Shelter Support", "Emergency Relief"][i % 4],
          location: ["Mumbai", "Kolkata", "Chennai", "Bangalore", "Hyderabad"][i % 5],
        });
      }

      // Citizen to Merchant payments
      for (let i = 0; i < 50; i++) {
        simulationTransactions.push({
          from_wallet: `RLXCIT${Date.now()}SIM${i % 30}`.toUpperCase(),
          to_wallet: `RLXMER${Date.now()}${i % 10}`.toUpperCase(),
          from_type: "citizen",
          to_type: "merchant",
          amount: Math.floor(Math.random() * 2000) + 100,
          status: "completed" as const,
          disaster_id: disasters[i % disasters.length].id,
          purpose: ["Groceries", "Medicine", "Clothing", "Essentials", "Food"][i % 5],
          location: ["Local Market", "Relief Zone", "Camp Area", "Town Center"][i % 4],
        });
      }

      // Simulate fraud attempts (flagged transactions)
      for (let i = 0; i < 5; i++) {
        simulationTransactions.push({
          from_wallet: `RLXFRAUD${Date.now()}${i}`.toUpperCase(),
          to_wallet: `RLXMER${Date.now()}${i}`.toUpperCase(),
          from_type: "citizen",
          to_type: "merchant",
          amount: Math.floor(Math.random() * 50000) + 20000,
          status: "failed" as const,
          disaster_id: disasters[i % disasters.length].id,
          purpose: "Suspicious Activity",
          location: "Unknown",
        });
      }

      // Simulate offline transactions
      for (let i = 0; i < 10; i++) {
        simulationTransactions.push({
          from_wallet: `RLXCITOFF${Date.now()}${i}`.toUpperCase(),
          to_wallet: `RLXMEROFF${Date.now()}${i % 5}`.toUpperCase(),
          from_type: "citizen",
          to_type: "merchant",
          amount: Math.floor(Math.random() * 1500) + 200,
          status: "synced" as const,
          disaster_id: disasters[i % disasters.length].id,
          purpose: "Offline Purchase",
          location: "Remote Area",
          is_offline: true,
        });
      }

      const { error: txError } = await supabase.from("transactions").insert(simulationTransactions);
      if (txError) throw txError;

      // Add duplicate claim flags
      const duplicateClaims = Array.from({ length: 3 }, (_, i) => ({
        aadhaar_hash: `HASH${Date.now()}DUP${i}`,
        wallet_addresses: [`RLXDUP1${i}`, `RLXDUP2${i}`, `RLXDUP3${i}`],
        status: "flagged",
        notes: "Detected multiple wallet registrations with same Aadhaar",
      }));

      await supabase.from("duplicate_claims").insert(duplicateClaims);

      setDemoLevel("simulation");
      toast.success("Disaster Simulation Activated!", {
        description: "Live disaster scenario with fund flows, citizen payments, fraud attempts, and offline transactions simulated.",
      });
    } catch (error: any) {
      console.error("Error generating simulation:", error);
      toast.error("Failed to start simulation", {
        description: error.message,
      });
    } finally {
      setGenerating(false);
    }
  };

  const clearDemoData = async () => {
    setClearing(true);
    try {
      // Clear in order due to foreign keys
      await supabase.from("duplicate_claims").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabase.from("donations").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabase.from("transactions").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabase.from("beneficiaries").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabase.from("merchants").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabase.from("ngos").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabase.from("disasters").delete().neq("id", "00000000-0000-0000-0000-000000000000");

      setDemoLevel("off");
      toast.success("Demo data cleared successfully!");
    } catch (error: any) {
      console.error("Error clearing demo data:", error);
      toast.error("Failed to clear demo data", {
        description: error.message,
      });
    } finally {
      setClearing(false);
    }
  };

  return (
    <TabsContent value="demo" className="space-y-6">
      {/* Demo Mode Status Banner */}
      {demoLevel !== "off" && (
        <div className={`p-4 rounded-lg border-2 ${
          demoLevel === "simulation" 
            ? "bg-purple-50 dark:bg-purple-900/20 border-purple-500" 
            : "bg-amber-50 dark:bg-amber-900/20 border-amber-500"
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {demoLevel === "simulation" ? (
                <Zap className="w-6 h-6 text-purple-600" />
              ) : (
                <Database className="w-6 h-6 text-amber-600" />
              )}
              <div>
                <p className="font-semibold text-lg">
                  {demoLevel === "simulation" ? "Disaster Simulation Mode" : "Basic Demo Mode"} Active
                </p>
                <p className="text-sm text-muted-foreground">
                  {demoLevel === "simulation" 
                    ? "Live disaster scenario running with simulated fund flows and transactions" 
                    : "Sample data loaded for demonstration purposes"
                  }
                </p>
              </div>
            </div>
            <Badge 
              variant="destructive" 
              className={demoLevel === "simulation" ? "bg-purple-600" : "bg-amber-600"}
            >
              {demoLevel.toUpperCase()}
            </Badge>
          </div>
        </div>
      )}

      {/* Demo Mode Level 1 - Basic */}
      <Card className={demoLevel === "basic" ? "border-amber-500/50 bg-amber-50/30 dark:bg-amber-900/10" : ""}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5 text-amber-500" />
                Demo Mode Level 1: Basic
              </CardTitle>
              <CardDescription>
                Generate sample users, NGOs, merchants, and transactions
              </CardDescription>
            </div>
            {demoLevel === "basic" && (
              <Badge variant="secondary" className="bg-amber-500 text-white">ACTIVE</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="text-center p-3 bg-muted rounded-lg">
              <AlertTriangle className="w-6 h-6 mx-auto mb-1 text-red-500" />
              <p className="text-xl font-bold">3</p>
              <p className="text-xs text-muted-foreground">Disasters</p>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <Building2 className="w-6 h-6 mx-auto mb-1 text-primary" />
              <p className="text-xl font-bold">5</p>
              <p className="text-xs text-muted-foreground">NGOs</p>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <Store className="w-6 h-6 mx-auto mb-1 text-green-600" />
              <p className="text-xl font-bold">10</p>
              <p className="text-xs text-muted-foreground">Merchants</p>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <Activity className="w-6 h-6 mx-auto mb-1 text-blue-600" />
              <p className="text-xl font-bold">100</p>
              <p className="text-xs text-muted-foreground">Transactions</p>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <TrendingUp className="w-6 h-6 mx-auto mb-1 text-purple-600" />
              <p className="text-xl font-bold">20</p>
              <p className="text-xs text-muted-foreground">Donations</p>
            </div>
          </div>

          <Button
            onClick={generateBasicDemoData}
            disabled={generating || demoLevel !== "off"}
            className="w-full bg-amber-600 hover:bg-amber-700 text-white"
            size="lg"
          >
            {generating ? (
              <>
                <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                Generating...
              </>
            ) : demoLevel === "basic" ? (
              <>
                <CheckCircle className="w-5 h-5 mr-2" />
                Basic Mode Active
              </>
            ) : (
              <>
                <Play className="w-5 h-5 mr-2" />
                Enable Basic Demo Mode
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Demo Mode Level 2 - Disaster Simulation */}
      <Card className={demoLevel === "simulation" ? "border-purple-500/50 bg-purple-50/30 dark:bg-purple-900/10" : ""}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-purple-500" />
                Demo Mode Level 2: Disaster Simulation
              </CardTitle>
              <CardDescription>
                Create a live disaster scenario with complete fund flow simulation
              </CardDescription>
            </div>
            {demoLevel === "simulation" && (
              <Badge variant="secondary" className="bg-purple-500 text-white">ACTIVE</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
            <p className="text-sm text-purple-800 dark:text-purple-200 mb-3">
              <strong>This simulation includes:</strong>
            </p>
            <div className="grid md:grid-cols-2 gap-2 text-sm text-purple-700 dark:text-purple-300">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Auto-allocated disaster funds
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                NGO → Citizen token transfers
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Citizen → Merchant payments
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Simulated fraud attempts
              </div>
              <div className="flex items-center gap-2">
                <WifiOff className="w-4 h-4" />
                Offline transaction syncing
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Duplicate Aadhaar flags
              </div>
            </div>
          </div>

          <Button
            onClick={generateSimulationData}
            disabled={generating || demoLevel === "simulation"}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white"
            size="lg"
          >
            {generating ? (
              <>
                <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                Starting Simulation...
              </>
            ) : demoLevel === "simulation" ? (
              <>
                <CheckCircle className="w-5 h-5 mr-2" />
                Simulation Running
              </>
            ) : (
              <>
                <Zap className="w-5 h-5 mr-2" />
                Start Disaster Simulation
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Clear Demo Data */}
      <Card className="border-red-200 dark:border-red-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <Trash2 className="w-5 h-5" />
            Clear All Demo Data
          </CardTitle>
          <CardDescription>
            Remove all generated demo data and return to a clean state
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg mb-4">
            <p className="text-sm text-red-800 dark:text-red-200">
              <strong>Warning:</strong> This will delete all demo-generated disasters, NGOs, 
              merchants, transactions, donations, and duplicate claims. Real data may also be affected.
            </p>
          </div>

          <Button
            onClick={clearDemoData}
            disabled={clearing || demoLevel === "off"}
            variant="outline"
            className="w-full border-red-500 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
            size="lg"
          >
            {clearing ? (
              <>
                <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                Clearing...
              </>
            ) : (
              <>
                <Trash2 className="w-5 h-5 mr-2" />
                Disable All Demo Modes
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </TabsContent>
  );
}
