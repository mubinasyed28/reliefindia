import { useEffect, useState } from "react";
import { GovHeader } from "@/components/layout/GovHeader";
import { GovFooter } from "@/components/layout/GovFooter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { DonateButton } from "@/components/public/DonateButton";
import { 
  Heart, Gift, Users, TrendingUp, IndianRupee, 
  Sparkles, Trophy, Calendar, Target, Filter
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Donation {
  id: string;
  donor_name: string | null;
  amount: number;
  disaster_id: string | null;
  is_anonymous: boolean;
  created_at: string;
  disaster_name?: string;
}

interface Disaster {
  id: string;
  name: string;
}

interface Stats {
  totalAmount: number;
  totalDonors: number;
  disastersSupported: number;
}

export default function DonorsPage() {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [filteredDonations, setFilteredDonations] = useState<Donation[]>([]);
  const [disasters, setDisasters] = useState<Disaster[]>([]);
  const [selectedDisaster, setSelectedDisaster] = useState<string>("all");
  const [stats, setStats] = useState<Stats>({
    totalAmount: 0,
    totalDonors: 0,
    disastersSupported: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDonations();
    fetchDisasters();
  }, []);

  useEffect(() => {
    if (selectedDisaster === "all") {
      setFilteredDonations(donations);
    } else {
      setFilteredDonations(donations.filter(d => d.disaster_id === selectedDisaster));
    }
  }, [selectedDisaster, donations]);

  const fetchDisasters = async () => {
    const { data } = await supabase
      .from("disasters")
      .select("id, name")
      .order("created_at", { ascending: false });
    setDisasters(data || []);
  };

  const fetchDonations = async () => {
    try {
      const { data, error } = await supabase
        .from("donations")
        .select("id, donor_name, amount, disaster_id, is_anonymous, created_at")
        .eq("payment_status", "completed")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;

      const disasterIds = [...new Set((data || []).filter(d => d.disaster_id).map(d => d.disaster_id))];
      let disasterMap: Record<string, string> = {};
      
      if (disasterIds.length > 0) {
        const { data: disastersData } = await supabase
          .from("disasters")
          .select("id, name")
          .in("id", disasterIds as string[]);
        
        disasterMap = (disastersData || []).reduce((acc, d) => {
          acc[d.id] = d.name;
          return acc;
        }, {} as Record<string, string>);
      }

      const donationsWithNames = (data || []).map(d => ({
        ...d,
        disaster_name: d.disaster_id ? disasterMap[d.disaster_id] : undefined,
      }));

      setDonations(donationsWithNames);
      setFilteredDonations(donationsWithNames);

      const totalAmount = (data || []).reduce((sum, d) => sum + Number(d.amount), 0);
      const uniqueDisasters = new Set((data || []).filter(d => d.disaster_id).map(d => d.disaster_id));

      setStats({
        totalAmount,
        totalDonors: (data || []).length,
        disastersSupported: uniqueDisasters.size,
      });
    } catch (error) {
      console.error("Error fetching donations:", error);
    } finally {
      setLoading(false);
    }
  };

  const getAmountTier = (amount: number) => {
    if (amount >= 50000) return { label: "Platinum", color: "bg-gradient-to-r from-purple-500 to-pink-500" };
    if (amount >= 25000) return { label: "Gold", color: "bg-gradient-to-r from-yellow-400 to-amber-500" };
    if (amount >= 10000) return { label: "Silver", color: "bg-gradient-to-r from-gray-300 to-gray-400" };
    if (amount >= 5000) return { label: "Bronze", color: "bg-gradient-to-r from-orange-400 to-orange-600" };
    return { label: "Supporter", color: "bg-primary" };
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <GovHeader />

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-red-600 via-red-500 to-red-600 text-white py-16 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 left-10 w-64 h-64 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-64 h-64 bg-white rounded-full blur-3xl" />
        </div>
        
        <div className="container mx-auto px-4 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-4 py-1.5 text-sm mb-6">
            <Heart className="w-4 h-4" />
            Wall of Heroes
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Our Generous Donors
          </h1>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            These incredible individuals and organizations have contributed to disaster relief, 
            making a real difference in the lives of those affected.
          </p>
          <DonateButton />
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                  <IndianRupee className="w-6 h-6 text-green-600" />
                </div>
                <p className="text-3xl font-bold text-green-600">
                  ₹{stats.totalAmount.toLocaleString("en-IN")}
                </p>
                <p className="text-sm text-muted-foreground">Total Raised</p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <p className="text-3xl font-bold">{stats.totalDonors}</p>
                <p className="text-sm text-muted-foreground">Donations Made</p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Target className="w-6 h-6 text-red-600" />
                </div>
                <p className="text-3xl font-bold text-red-600">{stats.disastersSupported}</p>
                <p className="text-sm text-muted-foreground">Disasters Supported</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Donor Wall */}
      <section className="py-12 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold mb-1 flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-amber-500" />
                Recent Donations
              </h2>
              <p className="text-muted-foreground">Every contribution counts. Thank you for your generosity!</p>
            </div>
            
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <Select value={selectedDisaster} onValueChange={setSelectedDisaster}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filter by disaster" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Disasters</SelectItem>
                  {disasters.map((disaster) => (
                    <SelectItem key={disaster.id} value={disaster.id}>
                      {disaster.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading donations...</p>
            </div>
          ) : filteredDonations.length === 0 ? (
            <Card className="max-w-lg mx-auto text-center py-12">
              <CardContent>
                <Gift className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                <h3 className="text-xl font-semibold mb-2">
                  {selectedDisaster !== "all" ? "No donations for this disaster yet" : "Be the First to Donate!"}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {selectedDisaster !== "all" 
                    ? "Be the first to contribute to this cause."
                    : "Your donation can kickstart the relief efforts and inspire others to contribute."}
                </p>
                <DonateButton />
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDonations.map((donation, index) => {
                const tier = getAmountTier(donation.amount);
                return (
                  <Card 
                    key={donation.id} 
                    className={`overflow-hidden transition-all hover:shadow-lg ${index < 3 ? "border-2 border-amber-300 dark:border-amber-700" : ""}`}
                  >
                    {index < 3 && (
                      <div className="bg-gradient-to-r from-amber-400 to-amber-600 text-white text-center py-1 text-xs font-medium flex items-center justify-center gap-1">
                        <Trophy className="w-3 h-3" />
                        Top Donor #{index + 1}
                      </div>
                    )}
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 ${tier.color} rounded-full flex items-center justify-center text-white font-bold`}>
                            {donation.is_anonymous ? "?" : (donation.donor_name?.[0] || "D").toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium">
                              {donation.is_anonymous ? "Anonymous Hero" : donation.donor_name || "Kind Donor"}
                            </p>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Calendar className="w-3 h-3" />
                              {format(new Date(donation.created_at), "dd MMM yyyy")}
                            </div>
                          </div>
                        </div>
                        <Badge variant="secondary" className={`${tier.color} text-white text-xs`}>
                          {tier.label}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center justify-between pt-3 border-t">
                        <div>
                          <p className="text-2xl font-bold text-green-600">
                            ₹{donation.amount.toLocaleString("en-IN")}
                          </p>
                        </div>
                        {donation.disaster_name && (
                          <Badge variant="outline" className="text-xs">
                            {donation.disaster_name}
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-primary to-primary/80 text-white">
        <div className="container mx-auto px-4 text-center">
          <Heart className="w-12 h-12 mx-auto mb-4" />
          <h2 className="text-3xl font-bold mb-4">Join Our Heroes</h2>
          <p className="text-lg text-white/90 mb-8 max-w-xl mx-auto">
            Your donation, no matter the size, helps provide food, shelter, and medical aid 
            to families affected by disasters across India.
          </p>
          <DonateButton />
        </div>
      </section>

      <GovFooter />
    </div>
  );
}
