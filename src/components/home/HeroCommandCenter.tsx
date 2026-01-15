import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { VolunteerSignup } from "@/components/public/VolunteerSignup";
import { DonateButton } from "@/components/public/DonateButton";
import { toast } from "sonner";
import {
  Shield,
  AlertTriangle,
  Wallet,
  Play,
  Zap,
  RefreshCw,
} from "lucide-react";

interface LiveStats {
  activeDisasters: number;
  govVaultBalance: number;
}

export function HeroCommandCenter() {
  const [stats, setStats] = useState<LiveStats>({
    activeDisasters: 0,
    govVaultBalance: 0,
  });
  const [demoMode, setDemoMode] = useState(false);
  const [launching, setLaunching] = useState(false);

  useEffect(() => {
    fetchLiveStats();
    const interval = setInterval(fetchLiveStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchLiveStats = async () => {
    try {
      const { data: disasters, count: disasterCount } = await supabase
        .from("disasters")
        .select("total_tokens_allocated", { count: "exact" })
        .eq("status", "active");

      const totalVault = disasters?.reduce(
        (sum, d) => sum + Number(d.total_tokens_allocated || 0),
        0
      ) || 0;

      setStats({
        activeDisasters: disasterCount || 0,
        govVaultBalance: totalVault,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const launchDemoMode = async () => {
    setLaunching(true);
    try {
      const disasterNames = [
        { name: "Cyclone Vardah - Tamil Nadu", states: ["Tamil Nadu", "Andhra Pradesh"] },
        { name: "Assam Floods 2026", states: ["Assam", "Meghalaya"] },
        { name: "Uttarakhand Earthquake", states: ["Uttarakhand", "Himachal Pradesh"] },
      ];

      const { data: disasters, error: disasterError } = await supabase
        .from("disasters")
        .insert(
          disasterNames.map((d) => ({
            name: d.name,
            affected_states: d.states,
            status: "active" as const,
            total_tokens_allocated: Math.floor(Math.random() * 80000000) + 20000000,
            tokens_distributed: Math.floor(Math.random() * 10000000),
            spending_limit_per_user: 15000,
            description: `Emergency relief for ${d.name}`,
          }))
        )
        .select();

      if (disasterError) throw disasterError;

      const ngoNames = [
        "National Disaster Response Force",
        "Indian Red Cross Society",
        "Care India Foundation",
        "Goonj Relief Network",
        "Rapid Relief Team",
      ];

      await supabase.from("ngos").insert(
        ngoNames.map((name, i) => ({
          ngo_name: name,
          contact_email: `contact@${name.toLowerCase().replace(/\s+/g, "")}.org`,
          contact_phone: `+91 98765 ${43210 + i}`,
          legal_registration_number: `NGODEM${Date.now()}${i}`,
          office_address: `${100 + i} Relief HQ, New Delhi`,
          status: "verified" as const,
          trust_score: 80 + Math.floor(Math.random() * 20),
          wallet_balance: Math.floor(Math.random() * 2000000) + 500000,
          wallet_address: `RLXNGO${Date.now()}${i}`.toUpperCase(),
        }))
      );

      const shopNames = [
        "Jan Aushadhi Kendra",
        "Ration Depot - Block A",
        "Relief Medical Store",
        "Community Grocery",
        "Essential Supplies Hub",
      ];

      await supabase.from("merchants").insert(
        shopNames.map((shop, i) => ({
          shop_name: shop,
          full_name: `Operator ${i + 1}`,
          mobile: `+91 87654 ${32100 + i}`,
          aadhaar_number: `${Math.floor(Math.random() * 900000000000) + 100000000000}`,
          date_of_birth: `1985-0${(i % 9) + 1}-15`,
          shop_address: `Relief Zone ${i + 1}`,
          is_active: true,
          trust_score: 70 + Math.floor(Math.random() * 30),
          wallet_address: `RLXMER${Date.now()}${i}`.toUpperCase(),
        }))
      );

      if (disasters) {
        const txInserts = [];
        for (let i = 0; i < 50; i++) {
          txInserts.push({
            from_wallet: `RLXNGO${Date.now()}${i % 5}`.toUpperCase(),
            to_wallet: `RLXCIT${Date.now()}${i}`.toUpperCase(),
            from_type: i % 3 === 0 ? "admin" : i % 3 === 1 ? "ngo" : "citizen",
            to_type: i % 3 === 0 ? "ngo" : i % 3 === 1 ? "citizen" : "merchant",
            amount: Math.floor(Math.random() * 8000) + 1000,
            status: "completed" as const,
            disaster_id: disasters[i % disasters.length].id,
            purpose: ["Food Relief", "Medical Aid", "Shelter Kit", "Emergency Cash", "Ration Supply"][i % 5],
            location: ["Chennai", "Guwahati", "Dehradun", "Kolkata", "Mumbai"][i % 5],
          });
        }
        await supabase.from("transactions").insert(txInserts);
      }

      const donorNames = ["Ratan Tata Foundation", "Azim Premji Trust", "Infosys Foundation", "Anonymous Donor", "Corporate CSR Fund"];
      await supabase.from("donations").insert(
        donorNames.map((name, i) => ({
          donor_name: name === "Anonymous Donor" ? null : name,
          donor_email: name === "Anonymous Donor" ? null : `${name.toLowerCase().replace(/\s+/g, "")}@example.com`,
          amount: [100000, 500000, 250000, 50000, 1000000][i],
          disaster_id: disasters ? disasters[i % disasters.length].id : null,
          is_anonymous: name === "Anonymous Donor",
          payment_status: "completed",
          payment_reference: `DEMO${Date.now()}${i}`,
        }))
      );

      setDemoMode(true);
      await fetchLiveStats();

      toast.success("🚀 Demo Mode Activated!", {
        description: "Live disaster simulation running. Watch the dashboards come alive!",
      });
    } catch (error: any) {
      console.error("Error launching demo:", error);
      toast.error("Failed to launch demo", { description: error.message });
    } finally {
      setLaunching(false);
    }
  };

  return (
    <section className="relative bg-gradient-to-b from-primary/5 via-background to-background py-16 md:py-24">
      {/* Demo Mode Banner */}
      {demoMode && (
        <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-purple-600 via-purple-500 to-purple-600 py-2 text-center text-sm font-medium text-white z-20">
          <div className="flex items-center justify-center gap-2">
            <Zap className="w-4 h-4 animate-pulse" />
            DEMO MODE ACTIVE — Live Disaster Simulation Running
            <Zap className="w-4 h-4 animate-pulse" />
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 text-center">
        {/* Government Badge */}
        <div className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-4 py-1.5 text-sm text-primary mb-6">
          <Shield className="w-4 h-4" />
          Government of India Initiative
        </div>

        {/* Main Headline */}
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 text-foreground">
          Transparent Disaster Relief
          <br />
          <span className="bg-gradient-to-r from-saffron via-primary to-green-india bg-clip-text text-transparent">
            Through Blockchain
          </span>
        </h1>

        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-6">
          Every rupee tracked. Every transaction verified. Zero corruption.
        </p>

        {/* Live Stats - Small info under headline */}
        <div className="flex items-center justify-center gap-6 mb-8">
          <div className="flex items-center gap-2 text-sm">
            <AlertTriangle className="w-4 h-4 text-destructive" />
            <span className="font-semibold">{stats.activeDisasters}</span>
            <span className="text-muted-foreground">Active Disasters</span>
          </div>
          <div className="w-px h-4 bg-border" />
          <div className="flex items-center gap-2 text-sm">
            <Wallet className="w-4 h-4 text-green-600" />
            <span className="font-semibold">₹{(stats.govVaultBalance / 10000000).toFixed(1)}Cr</span>
            <span className="text-muted-foreground">Government Vault</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap justify-center gap-4">
          <VolunteerSignup />
          <DonateButton />
          
        </div>
      </div>
    </section>
  );
}
