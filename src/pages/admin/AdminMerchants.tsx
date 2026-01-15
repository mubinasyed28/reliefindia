import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  LayoutDashboard, Building2, Store, Users, AlertTriangle, MapPin, Activity,
  FileText, Settings, Search, Filter, Eye, CheckCircle, XCircle, Wallet,
  Clock, MessageSquare, RefreshCw, Phone, MapPinIcon, Ban,
  ShieldCheck, TrendingUp, AlertCircle, ShoppingBag, Package
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const navItems = [
  { label: "Dashboard", href: "/admin", icon: <LayoutDashboard className="w-4 h-4" /> },
  { label: "NGO Management", href: "/admin/ngos", icon: <Building2 className="w-4 h-4" /> },
  { label: "Merchants", href: "/admin/merchants", icon: <Store className="w-4 h-4" /> },
  { label: "Beneficiaries", href: "/admin/beneficiaries", icon: <Users className="w-4 h-4" /> },
  { label: "Disasters", href: "/admin/disasters", icon: <AlertTriangle className="w-4 h-4" /> },
  { label: "Bill Review", href: "/admin/bills", icon: <FileText className="w-4 h-4" /> },
  { label: "Complaints", href: "/admin/complaints", icon: <MessageSquare className="w-4 h-4" /> },
  { label: "Grievances", href: "/admin/grievances", icon: <AlertCircle className="w-4 h-4" /> },
  { label: "Transactions", href: "/admin/transactions", icon: <Activity className="w-4 h-4" /> },
  { label: "India Map", href: "/admin/map", icon: <MapPin className="w-4 h-4" /> },
  { label: "Settings", href: "/admin/settings", icon: <Settings className="w-4 h-4" /> },
];

interface Merchant {
  id: string;
  user_id: string | null;
  full_name: string;
  shop_name: string;
  mobile: string;
  shop_address: string;
  is_active: boolean;
  aadhaar_verified: boolean;
  aadhaar_number: string;
  wallet_address: string;
  gst_number: string;
  shop_license: string;
  stock_categories: string[];
  created_at: string;
  activation_time: string;
  trust_score: number;
  performance_score: number;
  fraud_flags: number;
}

interface Transaction {
  id: string;
  amount: number;
  from_wallet: string;
  to_wallet: string;
  status: string;
  created_at: string;
  purpose: string;
}

export default function AdminMerchants() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [selectedMerchant, setSelectedMerchant] = useState<Merchant | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [rejectionDialogOpen, setRejectionDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [merchantTransactions, setMerchantTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState({ total: 0, active: 0, pending: 0, totalRedemptions: 0, todayVolume: 0 });
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    if (!loading && (!user || profile?.role !== "admin")) {
      navigate("/auth/admin");
    }
  }, [user, profile, loading, navigate]);

  useEffect(() => {
    if (user && profile?.role === "admin") {
      fetchMerchants();
      fetchStats();
    }
  }, [user, profile]);

  const fetchMerchants = async () => {
    setIsRefreshing(true);
    const { data } = await supabase
      .from("merchants")
      .select("*")
      .order("created_at", { ascending: false });

    setMerchants(data || []);
    setIsRefreshing(false);
  };

  const fetchStats = async () => {
    const { data: merchantData } = await supabase.from("merchants").select("*");
    const merchantList = merchantData || [];

    // Get all merchant wallet addresses
    const walletAddresses = merchantList.map(m => m.wallet_address).filter(Boolean);

    // Fetch total redemptions
    let totalRedemptions = 0;
    let todayVolume = 0;
    
    if (walletAddresses.length > 0) {
      const { data: transactions } = await supabase
        .from("transactions")
        .select("amount, created_at")
        .in("to_wallet", walletAddresses);

      if (transactions) {
        totalRedemptions = transactions.reduce((sum, t) => sum + Number(t.amount), 0);
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        todayVolume = transactions
          .filter(t => new Date(t.created_at || "") >= today)
          .reduce((sum, t) => sum + Number(t.amount), 0);
      }
    }

    setStats({
      total: merchantList.length,
      active: merchantList.filter(m => m.is_active).length,
      pending: merchantList.filter(m => !m.is_active).length,
      totalRedemptions,
      todayVolume,
    });
  };

  const fetchMerchantDetails = async (merchant: Merchant) => {
    if (!merchant.wallet_address) {
      setMerchantTransactions([]);
      return;
    }

    const { data: transactions } = await supabase
      .from("transactions")
      .select("*")
      .or(`from_wallet.eq.${merchant.wallet_address},to_wallet.eq.${merchant.wallet_address}`)
      .order("created_at", { ascending: false })
      .limit(50);
    
    setMerchantTransactions(transactions || []);
  };

  const openMerchantDetail = async (merchant: Merchant) => {
    setSelectedMerchant(merchant);
    await fetchMerchantDetails(merchant);
    setDetailOpen(true);
  };

  const handleApproveMerchant = async () => {
    if (!selectedMerchant) return;

    // Generate wallet address if not exists
    const walletAddress = selectedMerchant.wallet_address || 
      `RLX${Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('').toUpperCase()}`;

    const { error } = await supabase
      .from("merchants")
      .update({ 
        is_active: true,
        activation_time: new Date().toISOString(),
        wallet_address: walletAddress,
        trust_score: 50, // Start with base trust score
      })
      .eq("id", selectedMerchant.id);

    if (error) {
      toast.error("Failed to approve merchant");
      return;
    }

    // Update profile verification
    if (selectedMerchant.user_id) {
      await supabase
        .from("profiles")
        .update({ is_verified: true, wallet_address: walletAddress })
        .eq("user_id", selectedMerchant.user_id);
    }

    // Log audit
    await supabase.from("audit_logs").insert({
      action: "merchant_approved",
      entity_type: "merchant",
      entity_id: selectedMerchant.id,
      performed_by: user?.id,
      details: { merchant_name: selectedMerchant.shop_name },
    });

    toast.success(`Merchant "${selectedMerchant.shop_name}" approved successfully!`);
    setApprovalDialogOpen(false);
    setDetailOpen(false);
    fetchMerchants();
    fetchStats();
  };

  const handleRejectMerchant = async () => {
    if (!selectedMerchant || !rejectionReason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }

    // For rejection, we'll keep is_active false and log the rejection
    await supabase.from("audit_logs").insert({
      action: "merchant_rejected",
      entity_type: "merchant",
      entity_id: selectedMerchant.id,
      performed_by: user?.id,
      details: { 
        merchant_name: selectedMerchant.shop_name,
        rejection_reason: rejectionReason 
      },
    });

    toast.success(`Merchant "${selectedMerchant.shop_name}" rejected.`);
    setRejectionDialogOpen(false);
    setRejectionReason("");
    setDetailOpen(false);
  };

  const handleToggleActive = async (merchantId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from("merchants")
      .update({ 
        is_active: !currentStatus,
        activation_time: !currentStatus ? new Date().toISOString() : null
      })
      .eq("id", merchantId);

    if (error) {
      toast.error("Failed to update status");
      return;
    }

    // Log audit
    await supabase.from("audit_logs").insert({
      action: currentStatus ? "merchant_deactivated" : "merchant_activated",
      entity_type: "merchant",
      entity_id: merchantId,
      performed_by: user?.id,
    });

    toast.success(`Merchant ${!currentStatus ? "activated" : "deactivated"}`);
    fetchMerchants();
    fetchStats();
    if (selectedMerchant?.id === merchantId) {
      setSelectedMerchant({ ...selectedMerchant, is_active: !currentStatus });
    }
  };

  const handleFreezeWallet = async (merchant: Merchant) => {
    // Log the wallet freeze action
    await supabase.from("audit_logs").insert({
      action: "wallet_frozen",
      entity_type: "merchant",
      entity_id: merchant.id,
      performed_by: user?.id,
      details: { wallet_address: merchant.wallet_address },
    });

    // Deactivate the merchant
    await supabase
      .from("merchants")
      .update({ is_active: false, fraud_flags: (merchant.fraud_flags || 0) + 1 })
      .eq("id", merchant.id);

    toast.success("Merchant wallet frozen and account deactivated");
    fetchMerchants();
  };

  const filteredMerchants = merchants.filter((merchant) => {
    const matchesSearch = 
      merchant.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      merchant.shop_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      merchant.mobile?.includes(searchQuery) ||
      merchant.shop_address?.toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesStatus = true;
    if (activeTab === "pending") {
      matchesStatus = !merchant.is_active;
    } else if (activeTab === "active") {
      matchesStatus = merchant.is_active;
    }
    
    const matchesFilter = 
      statusFilter === "all" || 
      (statusFilter === "active" && merchant.is_active) ||
      (statusFilter === "inactive" && !merchant.is_active);
    
    return matchesSearch && matchesStatus && matchesFilter;
  });

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <DashboardLayout title="Merchant Management" navItems={navItems} role="admin">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Store className="w-4 h-4" />
            <span className="text-xs">Total Merchants</span>
          </div>
          <p className="text-2xl font-bold">{stats.total}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="w-4 h-4" />
            <span className="text-xs">Active</span>
          </div>
          <p className="text-2xl font-bold text-green-600">{stats.active}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-amber-600">
            <Clock className="w-4 h-4" />
            <span className="text-xs">Pending Approval</span>
          </div>
          <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-primary">
            <ShoppingBag className="w-4 h-4" />
            <span className="text-xs">Total Redemptions</span>
          </div>
          <p className="text-2xl font-bold">₹{stats.totalRedemptions.toLocaleString("en-IN")}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-blue-600">
            <TrendingUp className="w-4 h-4" />
            <span className="text-xs">Today's Volume</span>
          </div>
          <p className="text-2xl font-bold text-blue-600">₹{stats.todayVolume.toLocaleString("en-IN")}</p>
        </Card>
      </div>

      {/* Tabs for filtering */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList>
          <TabsTrigger value="all" className="gap-2">
            All <Badge variant="secondary">{merchants.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="pending" className="gap-2">
            <Clock className="w-4 h-4" />
            Pending Approval <Badge variant="secondary" className="bg-amber-100 text-amber-800">{stats.pending}</Badge>
          </TabsTrigger>
          <TabsTrigger value="active" className="gap-2">
            <CheckCircle className="w-4 h-4" />
            Active <Badge variant="secondary" className="bg-green-100 text-green-800">{stats.active}</Badge>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search merchants..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" size="icon" onClick={fetchMerchants} disabled={isRefreshing}>
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* Merchant Table */}
      <Card>
        <CardHeader>
          <CardTitle>Merchant Registry</CardTitle>
          <CardDescription>Click on any merchant to view full details and take action</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Shop Name</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Categories</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Aadhaar</TableHead>
                <TableHead>Registered</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMerchants.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No merchants found
                  </TableCell>
                </TableRow>
              ) : (
                filteredMerchants.map((merchant) => (
                  <TableRow 
                    key={merchant.id} 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => openMerchantDetail(merchant)}
                  >
                    <TableCell className="font-medium">{merchant.shop_name}</TableCell>
                    <TableCell>{merchant.full_name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Phone className="w-3 h-3" />
                        {merchant.mobile}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {merchant.stock_categories?.slice(0, 2).map((cat) => (
                          <Badge key={cat} variant="outline" className="text-xs capitalize">
                            {cat}
                          </Badge>
                        ))}
                        {(merchant.stock_categories?.length || 0) > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{merchant.stock_categories.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {merchant.is_active ? (
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300">
                          Active
                        </Badge>
                      ) : (
                        <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
                          Pending
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {merchant.aadhaar_verified ? (
                        <ShieldCheck className="w-4 h-4 text-green-600" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-amber-500" />
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {merchant.created_at ? formatDistanceToNow(new Date(merchant.created_at), { addSuffix: true }) : "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                        <Button size="sm" variant="outline" onClick={() => openMerchantDetail(merchant)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        {!merchant.is_active ? (
                          <Button 
                            size="sm" 
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => {
                              setSelectedMerchant(merchant);
                              setApprovalDialogOpen(true);
                            }}
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                        ) : (
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="text-red-600 border-red-600"
                            onClick={() => handleToggleActive(merchant.id, merchant.is_active || false)}
                          >
                            <Ban className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Merchant Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Store className="w-5 h-5" />
              {selectedMerchant?.shop_name}
              {selectedMerchant?.is_active ? (
                <Badge className="bg-green-100 text-green-800">Active</Badge>
              ) : (
                <Badge className="bg-amber-100 text-amber-800">Pending Approval</Badge>
              )}
            </DialogTitle>
            <DialogDescription>Complete merchant profile and transaction history</DialogDescription>
          </DialogHeader>

          {selectedMerchant && (
            <Tabs defaultValue="profile" className="mt-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
                <TabsTrigger value="transactions">Transactions</TabsTrigger>
              </TabsList>

              <ScrollArea className="h-[500px] mt-4">
                <TabsContent value="profile" className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Owner Information</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Name:</span>
                          <span>{selectedMerchant.full_name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Mobile:</span>
                          <span>{selectedMerchant.mobile}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Aadhaar:</span>
                          <span className="font-mono">
                            {selectedMerchant.aadhaar_number?.slice(0, 4)}****{selectedMerchant.aadhaar_number?.slice(-4)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Aadhaar Verified:</span>
                          <span className={selectedMerchant.aadhaar_verified ? "text-green-600" : "text-amber-600"}>
                            {selectedMerchant.aadhaar_verified ? "Yes" : "No"}
                          </span>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Shop Details</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Shop Name:</span>
                          <span>{selectedMerchant.shop_name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">GST:</span>
                          <span>{selectedMerchant.gst_number || "N/A"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">License:</span>
                          <span>{selectedMerchant.shop_license || "N/A"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Trust Score:</span>
                          <span className="font-bold text-primary">{selectedMerchant.trust_score || 0}%</span>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="md:col-span-2">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Package className="w-4 h-4" />
                          Stock Categories
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex gap-2 flex-wrap">
                          {selectedMerchant.stock_categories?.map((cat) => (
                            <Badge key={cat} className="capitalize">
                              {cat}
                            </Badge>
                          )) || <span className="text-muted-foreground">No categories specified</span>}
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="md:col-span-2">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Address & Wallet</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        <div className="flex items-start gap-2">
                          <MapPinIcon className="w-4 h-4 text-muted-foreground mt-0.5" />
                          <span>{selectedMerchant.shop_address}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Wallet:</span>
                          <span className="font-mono text-xs">{selectedMerchant.wallet_address || "Not assigned"}</span>
                        </div>
                        {selectedMerchant.activation_time && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Activated:</span>
                            <span>{new Date(selectedMerchant.activation_time).toLocaleDateString("en-IN")}</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  {/* Action Buttons */}
                  {!selectedMerchant.is_active && (
                    <div className="flex gap-3 pt-4">
                      <Button 
                        className="flex-1 bg-green-600 hover:bg-green-700"
                        onClick={() => setApprovalDialogOpen(true)}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Approve Merchant
                      </Button>
                      <Button 
                        variant="destructive"
                        className="flex-1"
                        onClick={() => setRejectionDialogOpen(true)}
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Reject Application
                      </Button>
                    </div>
                  )}

                  {selectedMerchant.is_active && (
                    <div className="flex gap-3 pt-4">
                      <Button 
                        variant="outline"
                        className="flex-1 text-red-600 border-red-600"
                        onClick={() => handleToggleActive(selectedMerchant.id, true)}
                      >
                        <Ban className="w-4 h-4 mr-2" />
                        Deactivate Account
                      </Button>
                      <Button 
                        variant="destructive"
                        className="flex-1"
                        onClick={() => handleFreezeWallet(selectedMerchant)}
                      >
                        <Wallet className="w-4 h-4 mr-2" />
                        Freeze Wallet
                      </Button>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="documents" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Verification Documents</CardTitle>
                      <CardDescription>Documents submitted during registration</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid gap-4">
                        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                          <div className="flex items-center gap-3">
                            <FileText className="w-5 h-5 text-primary" />
                            <div>
                              <p className="font-medium">Shop License</p>
                              <p className="text-xs text-muted-foreground">
                                License No: {selectedMerchant.shop_license || "Not provided"}
                              </p>
                            </div>
                          </div>
                          <Badge variant={selectedMerchant.shop_license ? "default" : "secondary"}>
                            {selectedMerchant.shop_license ? "Provided" : "Missing"}
                          </Badge>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                          <div className="flex items-center gap-3">
                            <ShieldCheck className="w-5 h-5 text-primary" />
                            <div>
                              <p className="font-medium">Aadhaar Verification</p>
                              <p className="text-xs text-muted-foreground">
                                OTP verified through UIDAI
                              </p>
                            </div>
                          </div>
                          <Badge className={selectedMerchant.aadhaar_verified ? "bg-green-100 text-green-800" : ""}>
                            {selectedMerchant.aadhaar_verified ? "Verified" : "Pending"}
                          </Badge>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                          <div className="flex items-center gap-3">
                            <FileText className="w-5 h-5 text-primary" />
                            <div>
                              <p className="font-medium">GST Registration</p>
                              <p className="text-xs text-muted-foreground">
                                GST No: {selectedMerchant.gst_number || "Not provided"}
                              </p>
                            </div>
                          </div>
                          <Badge variant={selectedMerchant.gst_number ? "default" : "secondary"}>
                            {selectedMerchant.gst_number ? "Provided" : "Optional"}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="transactions" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Transaction History</CardTitle>
                      <CardDescription>Recent transactions for this merchant</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {merchantTransactions.length === 0 ? (
                        <p className="text-center py-8 text-muted-foreground">
                          No transactions found
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {merchantTransactions.map((tx) => (
                            <div key={tx.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                              <div>
                                <p className="font-medium text-sm">{tx.purpose || "Relief Payment"}</p>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(tx.created_at).toLocaleString("en-IN")}
                                </p>
                              </div>
                              <p className="font-bold text-green-600">
                                +₹{Number(tx.amount).toLocaleString("en-IN")}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </ScrollArea>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* Approval Confirmation Dialog */}
      <Dialog open={approvalDialogOpen} onOpenChange={setApprovalDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Approve Merchant
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to approve this merchant? This will:
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-4">
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                Activate their merchant account
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                Generate and assign a wallet address
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                Allow them to accept relief payments
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                Send activation notification email
              </li>
            </ul>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApprovalDialogOpen(false)}>
              Cancel
            </Button>
            <Button className="bg-green-600 hover:bg-green-700" onClick={handleApproveMerchant}>
              Confirm Approval
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rejection Dialog */}
      <Dialog open={rejectionDialogOpen} onOpenChange={setRejectionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-600" />
              Reject Merchant Application
            </DialogTitle>
            <DialogDescription>
              Please provide a reason for rejection. This will be recorded in the audit log.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rejection-reason">Rejection Reason *</Label>
              <Textarea
                id="rejection-reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Enter the reason for rejecting this application..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectionDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRejectMerchant}>
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
