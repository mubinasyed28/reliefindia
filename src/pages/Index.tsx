import { useEffect, useState } from "react";
import { GovHeader } from "@/components/layout/GovHeader";
import { GovFooter } from "@/components/layout/GovFooter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ImpactCounters } from "@/components/transparency/ImpactCounters";
import { FundTracker } from "@/components/transparency/FundTracker";
import { LiveTransactionFeed } from "@/components/transparency/LiveTransactionFeed";
import { ImpactStories } from "@/components/public/ImpactStories";
import { HeroCommandCenter } from "@/components/home/HeroCommandCenter";
import { VolunteerSignup } from "@/components/public/VolunteerSignup";
import { DonateButton } from "@/components/public/DonateButton";
import { 
  Shield, Building2, CheckCircle, Lock, Eye, 
  Wallet, Globe, AlertTriangle, MapPin,
  Activity, Heart, Code, Users, Users2
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface LiveStats {
  totalFunds: number;
  fundsDistributed: number;
  remainingFunds: number;
  activeDisasters: number;
  totalBeneficiaries: number;
  totalNgos: number;
  totalMerchants: number;
  tokensInCirculation: number;
}

interface ActiveDisaster {
  id: string;
  name: string;
  affected_states: string[];
  total_tokens_allocated: number;
  tokens_distributed: number;
  status: string;
  created_at: string;
}

interface TopNGO {
  id: string;
  ngo_name: string;
  trust_score: number;
  wallet_balance: number;
}

const Index = () => {
  const [stats, setStats] = useState<LiveStats>({
    totalFunds: 0,
    fundsDistributed: 0,
    remainingFunds: 0,
    activeDisasters: 0,
    totalBeneficiaries: 0,
    totalNgos: 0,
    totalMerchants: 0,
    tokensInCirculation: 0,
  });
  const [activeDisasters, setActiveDisasters] = useState<ActiveDisaster[]>([]);
  const [topNGOs, setTopNGOs] = useState<TopNGO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPublicStats();
  }, []);

  const fetchPublicStats = async () => {
    try {
      // Fetch active disasters
      const { data: disasters } = await supabase
        .from("disasters")
        .select("*")
        .eq("status", "active")
        .order("created_at", { ascending: false });

      setActiveDisasters(disasters || []);

      // Calculate stats
      const allDisasters = disasters || [];
      const totalAllocated = allDisasters.reduce((sum, d) => sum + Number(d.total_tokens_allocated || 0), 0);
      const totalDistributed = allDisasters.reduce((sum, d) => sum + Number(d.tokens_distributed || 0), 0);

      // Fetch counts
      const { count: ngoCount } = await supabase
        .from("ngos")
        .select("*", { count: "exact", head: true })
        .eq("status", "verified");

      const { count: merchantCount } = await supabase
        .from("merchants")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true);

      const { count: beneficiaryCount } = await supabase
        .from("beneficiaries")
        .select("*", { count: "exact", head: true });

      // Fetch top NGOs
      const { data: ngos } = await supabase
        .from("ngos")
        .select("id, ngo_name, trust_score, wallet_balance")
        .eq("status", "verified")
        .order("trust_score", { ascending: false })
        .limit(5);

      setTopNGOs(ngos || []);

      // Fetch total transactions for tokens in circulation
      const { data: transactions } = await supabase
        .from("transactions")
        .select("amount")
        .eq("status", "completed");

      const tokensInCirculation = transactions?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;

      setStats({
        totalFunds: totalAllocated,
        fundsDistributed: totalDistributed,
        remainingFunds: totalAllocated - totalDistributed,
        activeDisasters: allDisasters.length,
        totalBeneficiaries: beneficiaryCount || 0,
        totalNgos: ngoCount || 0,
        totalMerchants: merchantCount || 0,
        tokensInCirculation,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <GovHeader />
      
      {/* Hero Command Center */}
      <HeroCommandCenter />

      {/* Live Disaster Ticker */}
      {activeDisasters.length > 0 && (
        <section className="bg-red-600 text-white py-3 overflow-hidden">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-4">
              <Badge className="bg-white text-red-600 shrink-0">
                <AlertTriangle className="w-3 h-3 mr-1" />
                LIVE
              </Badge>
              <div className="flex gap-8 animate-marquee whitespace-nowrap">
                {activeDisasters.map((disaster) => (
                  <span key={disaster.id} className="inline-flex items-center gap-2">
                    <span className="font-medium">{disaster.name}</span>
                    <span className="text-white/80">|</span>
                    <span className="text-white/80">{disaster.affected_states?.join(", ")}</span>
                    <span className="text-white/80">|</span>
                    <span className="text-green-300">₹{Number(disaster.total_tokens_allocated).toLocaleString("en-IN")} allocated</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Impact Counters */}
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold mb-2 flex items-center justify-center gap-2">
              <Heart className="w-6 h-6 text-red-500" />
              Our Impact
            </h2>
            <p className="text-muted-foreground">Making a difference, one life at a time</p>
          </div>
          <ImpactCounters />
        </div>
      </section>

      {/* Fund Tracker & Live Feed */}
      <section className="py-12 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold mb-2 flex items-center justify-center gap-2">
              <Activity className="w-6 h-6 text-primary animate-pulse" />
              Live Transparency Dashboard
            </h2>
            <p className="text-muted-foreground">Real-time data from the RELIFEX blockchain</p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-primary" />
                  National Fund Tracker
                </CardTitle>
              </CardHeader>
              <CardContent>
                <FundTracker
                  released={stats.totalFunds}
                  used={stats.fundsDistributed}
                  remaining={stats.remainingFunds}
                />
              </CardContent>
            </Card>

            <LiveTransactionFeed />
          </div>

        </div>
      </section>

      {/* Top NGOs by Trust Score */}
      {topNGOs.length > 0 && (
        <section className="py-12 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold mb-6 text-center flex items-center justify-center gap-2">
              <Shield className="w-6 h-6 text-primary" />
              Top NGOs by Trust Score
            </h2>
            <div className="grid md:grid-cols-5 gap-4">
              {topNGOs.map((ngo, index) => (
                <Link key={ngo.id} to={`/ngo/${ngo.id}`} className="block">
                  <Card className="hover:shadow-lg transition-shadow h-full">
                    <CardContent className="pt-6 text-center">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                        <span className="text-xl font-bold text-primary">#{index + 1}</span>
                      </div>
                      <p className="font-medium text-sm truncate">{ngo.ngo_name}</p>
                      <Badge variant="secondary" className="mt-2">
                        <Shield className="w-3 h-3 mr-1" />
                        {ngo.trust_score || 75}/100
                      </Badge>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Active Disasters */}
      {activeDisasters.length > 0 && (
        <section className="py-12 bg-background">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold mb-6 text-center">Active Relief Operations</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeDisasters.slice(0, 6).map((disaster) => {
                const progress = disaster.total_tokens_allocated 
                  ? (Number(disaster.tokens_distributed) / Number(disaster.total_tokens_allocated)) * 100 
                  : 0;
                return (
                  <Card key={disaster.id} className="overflow-hidden">
                    <div className="h-2 bg-gradient-to-r from-saffron via-white to-green-india" />
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{disaster.name}</CardTitle>
                          <CardDescription className="flex items-center gap-1 mt-1">
                            <MapPin className="w-3 h-3" />
                            {disaster.affected_states?.slice(0, 3).join(", ")}
                          </CardDescription>
                        </div>
                        <Badge variant="destructive" className="shrink-0">Active</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Utilization</span>
                          <span className="font-medium">{progress.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full transition-all"
                            style={{ width: `${Math.min(progress, 100)}%` }}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4 pt-2">
                          <div>
                            <p className="text-xs text-muted-foreground">Allocated</p>
                            <p className="font-semibold">₹{Number(disaster.total_tokens_allocated).toLocaleString("en-IN")}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Distributed</p>
                            <p className="font-semibold">₹{Number(disaster.tokens_distributed).toLocaleString("en-IN")}</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Quick Actions - Public Only */}
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            <Link to="/services">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer text-center p-4">
                <Eye className="w-8 h-8 mx-auto mb-2 text-primary" />
                <p className="font-medium text-sm">Verify Transaction</p>
              </Card>
            </Link>
            <Link to="/services">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer text-center p-4">
                <MapPin className="w-8 h-8 mx-auto mb-2 text-primary" />
                <p className="font-medium text-sm">Find Relief Centers</p>
              </Card>
            </Link>
            <Link to="/services">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer text-center p-4">
                <Building2 className="w-8 h-8 mx-auto mb-2 text-primary" />
                <p className="font-medium text-sm">Track NGO</p>
              </Card>
            </Link>
            <Link to="/services">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer text-center p-4">
                <Globe className="w-8 h-8 mx-auto mb-2 text-primary" />
                <p className="font-medium text-sm">Public Audit</p>
              </Card>
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">How RELIFEX Works</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              A secure, transparent, and efficient system for disaster relief
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="gov-card card-hover">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-2">
                  <Wallet className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-lg">Digital Tokens</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Relief funds converted to blockchain tokens for designated purposes only.
                </p>
              </CardContent>
            </Card>

            <Card className="gov-card card-hover">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-2">
                  <Lock className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-lg">Anti-Corruption</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Tokens cannot be transferred, sold, or misused. They expire if not used.
                </p>
              </CardContent>
            </Card>

            <Card className="gov-card card-hover">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-2">
                  <Eye className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-lg">Full Transparency</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Every transaction on blockchain. Audit trail available for RTI and courts.
                </p>
              </CardContent>
            </Card>

            <Card className="gov-card card-hover">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-2">
                  <CheckCircle className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-lg">Verified Network</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  All NGOs and merchants verified. Fake entities cannot enter the system.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Impact Stories */}
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <ImpactStories />
        </div>
      </section>

      {/* Team Branding Section */}
      <section className="py-12 bg-gradient-to-b from-background to-muted/30">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Code className="w-6 h-6 text-primary" />
              <span className="text-sm text-muted-foreground uppercase tracking-wider">Made by</span>
            </div>
            <h3 className="text-2xl md:text-3xl font-bold mb-4 bg-gradient-to-r from-saffron via-primary to-green-india bg-clip-text text-transparent">
              Pixel Phantoms
            </h3>
            <div className="space-y-2 text-muted-foreground">
              <p className="flex items-center justify-center gap-2">
                <Users2 className="w-4 h-4 text-saffron" />
                <span><strong>Team Leader:</strong> Samiksha Chavan</span>
              </p>
              <p className="flex items-center justify-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                <span><strong>Team Members:</strong> Nikhil Kaware, Mubina, Paris Kulkarni</span>
              </p>
            </div>
            <Link to="/team">
              <Button variant="outline" className="mt-6">
                <Users2 className="w-4 h-4 mr-2" />
                Meet the Team
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-gradient-to-r from-navy-dark to-navy-blue text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Join the National Mission</h2>
          <p className="text-white/80 mb-8 max-w-2xl mx-auto">
            Be part of India's most transparent disaster relief system. Every contribution counts.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <VolunteerSignup />
            <DonateButton />
          </div>
        </div>
      </section>

      <GovFooter />
    </div>
  );
};

export default Index;
