import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNotifications } from "@/hooks/useNotifications";
import { 
  LayoutDashboard, 
  Building2, 
  Store, 
  Users, 
  AlertTriangle,
  MapPin,
  FileText,
  Settings,
  Plus,
  Wallet,
  Calendar,
  Eye,
  Edit,
  Trash2,
  Coins,
  UserCheck,
  ArrowRightLeft,
  TrendingUp,
  RefreshCw,
  Search,
  Filter,
  MoreVertical,
  Copy,
  ExternalLink,
  Activity,
  Shield,
  Clock,
  CheckCircle,
  Download,
  FileSpreadsheet
} from "lucide-react";
import { exportToCSV, exportDisastersToPDF, exportBeneficiariesToPDF, exportTransactionsToPDF } from "@/utils/exportUtils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const navItems = [
  { label: "Dashboard", href: "/admin", icon: <LayoutDashboard className="w-4 h-4" /> },
  { label: "NGO Management", href: "/admin/ngos", icon: <Building2 className="w-4 h-4" /> },
  { label: "Merchants", href: "/admin/merchants", icon: <Store className="w-4 h-4" /> },
  { label: "Beneficiaries", href: "/admin/beneficiaries", icon: <Users className="w-4 h-4" /> },
  { label: "Disasters", href: "/admin/disasters", icon: <AlertTriangle className="w-4 h-4" /> },
  { label: "Transactions", href: "/admin/transactions", icon: <ArrowRightLeft className="w-4 h-4" /> },
  { label: "India Map", href: "/admin/map", icon: <MapPin className="w-4 h-4" /> },
  { label: "Complaints", href: "/admin/complaints", icon: <FileText className="w-4 h-4" /> },
  { label: "Settings", href: "/admin/settings", icon: <Settings className="w-4 h-4" /> },
];

const indianStates = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Delhi", "Jammu and Kashmir", "Ladakh", "Puducherry", "Chandigarh"
];

interface Disaster {
  id: string;
  name: string;
  description: string;
  affected_states: string[];
  total_tokens_allocated: number;
  tokens_distributed: number;
  spending_limit_per_user: number;
  status: string;
  start_date: string;
  end_date: string | null;
  created_at: string;
}

interface Beneficiary {
  id: string;
  citizen_id: string;
  tokens_allocated: number;
  tokens_spent: number;
  is_active: boolean;
  created_at: string;
  profiles?: { full_name: string; mobile: string };
}

interface Transaction {
  id: string;
  amount: number;
  from_wallet: string;
  to_wallet: string;
  status: string;
  created_at: string;
  purpose: string;
  transaction_hash: string;
}

export default function AdminDisasters() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const { notifyDisasterCreated, notifyTokensAllocated } = useNotifications();
  const [disasters, setDisasters] = useState<Disaster[]>([]);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedStates, setSelectedStates] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  // Detail view states
  const [selectedDisaster, setSelectedDisaster] = useState<Disaster | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [allocateDialogOpen, setAllocateDialogOpen] = useState(false);
  const [beneficiariesDialogOpen, setBeneficiariesDialogOpen] = useState(false);
  const [transactionsDialogOpen, setTransactionsDialogOpen] = useState(false);
  
  // Data for dialogs
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [allocateAmount, setAllocateAmount] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    totalTokens: "",
    spendingLimit: "15000",
  });

  useEffect(() => {
    if (!loading && (!user || profile?.role !== "admin")) {
      navigate("/auth/admin");
    }
  }, [user, profile, loading, navigate]);

  useEffect(() => {
    if (user && profile?.role === "admin") {
      fetchDisasters();

      // Subscribe to real-time updates
      const channel = supabase
        .channel('disasters-realtime')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'disasters' },
          (payload) => {
            if (payload.eventType === 'INSERT') {
              setDisasters(prev => [payload.new as Disaster, ...prev]);
              toast.info(`New disaster added: ${(payload.new as Disaster).name}`);
            } else if (payload.eventType === 'UPDATE') {
              setDisasters(prev => 
                prev.map(d => d.id === payload.new.id ? payload.new as Disaster : d)
              );
              toast.info(`Disaster updated: ${(payload.new as Disaster).name}`);
            } else if (payload.eventType === 'DELETE') {
              setDisasters(prev => prev.filter(d => d.id !== payload.old.id));
              toast.info('A disaster was removed');
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, profile]);

  const fetchDisasters = async () => {
    setIsRefreshing(true);
    const { data } = await supabase
      .from("disasters")
      .select("*")
      .order("created_at", { ascending: false });

    setDisasters(data || []);
    setIsRefreshing(false);
  };

  const fetchBeneficiaries = async (disasterId: string) => {
    const { data } = await supabase
      .from("beneficiaries")
      .select(`*, profiles:citizen_id(full_name, mobile)`)
      .eq("disaster_id", disasterId)
      .order("created_at", { ascending: false });

    setBeneficiaries(data || []);
  };

  const fetchTransactions = async (disasterId: string) => {
    const { data } = await supabase
      .from("transactions")
      .select("*")
      .eq("disaster_id", disasterId)
      .order("created_at", { ascending: false });

    setTransactions(data || []);
  };

  const handleCreateDisaster = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedStates.length === 0) {
      toast.error("Please select at least one affected state");
      return;
    }

    const { error } = await supabase.from("disasters").insert({
      name: formData.name,
      description: formData.description,
      affected_states: selectedStates,
      total_tokens_allocated: parseFloat(formData.totalTokens),
      spending_limit_per_user: parseFloat(formData.spendingLimit),
      status: "active",
      created_by: user?.id,
    });

    if (error) {
      toast.error("Failed to create disaster: " + error.message);
      return;
    }

    toast.success("Disaster created successfully!");
    
    // Send notification email
    notifyDisasterCreated(
      formData.name,
      selectedStates,
      parseFloat(formData.totalTokens),
      user?.email ? [user.email] : undefined
    );
    
    setCreateDialogOpen(false);
    setFormData({ name: "", description: "", totalTokens: "", spendingLimit: "15000" });
    setSelectedStates([]);
    fetchDisasters();
  };

  const handleEditDisaster = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDisaster) return;

    const { error } = await supabase
      .from("disasters")
      .update({
        name: formData.name,
        description: formData.description,
        affected_states: selectedStates,
        total_tokens_allocated: parseFloat(formData.totalTokens),
        spending_limit_per_user: parseFloat(formData.spendingLimit),
      })
      .eq("id", selectedDisaster.id);

    if (error) {
      toast.error("Failed to update disaster: " + error.message);
      return;
    }

    toast.success("Disaster updated successfully!");
    setEditDialogOpen(false);
    fetchDisasters();
  };

  const handleDeleteDisaster = async () => {
    if (!selectedDisaster) return;

    const { error } = await supabase
      .from("disasters")
      .delete()
      .eq("id", selectedDisaster.id);

    if (error) {
      toast.error("Failed to delete disaster: " + error.message);
      return;
    }

    toast.success("Disaster deleted successfully!");
    setDeleteDialogOpen(false);
    setSelectedDisaster(null);
    fetchDisasters();
  };

  const handleAllocateTokens = async () => {
    if (!selectedDisaster || !allocateAmount) return;

    const newTotal = (selectedDisaster.total_tokens_allocated || 0) + parseFloat(allocateAmount);
    
    const { error } = await supabase
      .from("disasters")
      .update({ total_tokens_allocated: newTotal })
      .eq("id", selectedDisaster.id);

    if (error) {
      toast.error("Failed to allocate tokens: " + error.message);
      return;
    }

    await supabase.from("audit_logs").insert({
      action: "tokens_allocated",
      entity_type: "disaster",
      entity_id: selectedDisaster.id,
      details: { amount: parseFloat(allocateAmount), new_total: newTotal },
      performed_by: user?.id,
    });

    // Send notification email
    notifyTokensAllocated(
      selectedDisaster.name,
      parseFloat(allocateAmount),
      user?.email ? [user.email] : undefined
    );

    toast.success(`₹${Number(allocateAmount).toLocaleString("en-IN")} tokens allocated!`);
    setAllocateDialogOpen(false);
    setAllocateAmount("");
    fetchDisasters();
  };

  const handleStatusChange = async (disasterId: string, newStatus: "active" | "completed" | "frozen") => {
    await supabase
      .from("disasters")
      .update({ status: newStatus, end_date: newStatus === "completed" ? new Date().toISOString() : null })
      .eq("id", disasterId);

    await supabase.from("audit_logs").insert({
      action: "status_changed",
      entity_type: "disaster",
      entity_id: disasterId,
      details: { new_status: newStatus },
      performed_by: user?.id,
    });

    toast.success(`Disaster status updated to ${newStatus}`);
    fetchDisasters();
  };

  const toggleState = (state: string) => {
    setSelectedStates((prev) =>
      prev.includes(state) ? prev.filter((s) => s !== state) : [...prev, state]
    );
  };

  const openDetailDialog = (disaster: Disaster) => {
    setSelectedDisaster(disaster);
    setDetailDialogOpen(true);
  };

  const openEditDialog = (disaster: Disaster) => {
    setSelectedDisaster(disaster);
    setFormData({
      name: disaster.name,
      description: disaster.description || "",
      totalTokens: String(disaster.total_tokens_allocated || 0),
      spendingLimit: String(disaster.spending_limit_per_user || 15000),
    });
    setSelectedStates(disaster.affected_states || []);
    setEditDialogOpen(true);
  };

  const openBeneficiariesDialog = async (disaster: Disaster) => {
    setSelectedDisaster(disaster);
    await fetchBeneficiaries(disaster.id);
    setBeneficiariesDialogOpen(true);
  };

  const openTransactionsDialog = async (disaster: Disaster) => {
    setSelectedDisaster(disaster);
    await fetchTransactions(disaster.id);
    setTransactionsDialogOpen(true);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  // Filter disasters
  const filteredDisasters = disasters.filter((d) => {
    const matchesSearch = d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || d.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Stats
  const totalAllocated = disasters.reduce((sum, d) => sum + (d.total_tokens_allocated || 0), 0);
  const totalDistributed = disasters.reduce((sum, d) => sum + (d.tokens_distributed || 0), 0);
  const activeDisasters = disasters.filter((d) => d.status === "active").length;

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <DashboardLayout title="Disaster Management" navItems={navItems} role="admin">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/10">
                <AlertTriangle className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Disasters</p>
                <p className="text-2xl font-bold">{disasters.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/10">
                <Activity className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold">{activeDisasters}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/10">
                <Wallet className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Allocated</p>
                <p className="text-2xl font-bold">₹{Number(totalAllocated).toLocaleString("en-IN")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-orange-500/10">
                <TrendingUp className="w-6 h-6 text-orange-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Distributed</p>
                <p className="text-2xl font-bold">₹{Number(totalDistributed).toLocaleString("en-IN")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Header with Search and Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex flex-1 gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search disasters..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="frozen">Frozen</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={fetchDisasters} disabled={isRefreshing}>
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
          </Button>
        </div>
        
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Download className="w-4 h-4" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Export Disasters</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => {
                exportToCSV(
                  filteredDisasters.map(d => ({
                    name: d.name,
                    status: d.status,
                    affected_states: d.affected_states?.join('; ') || '',
                    total_tokens_allocated: d.total_tokens_allocated,
                    tokens_distributed: d.tokens_distributed,
                    spending_limit_per_user: d.spending_limit_per_user,
                    start_date: d.start_date,
                    end_date: d.end_date || '',
                    created_at: d.created_at
                  })),
                  'disasters-report'
                );
                toast.success('CSV downloaded successfully!');
              }}>
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Download CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                exportDisastersToPDF(filteredDisasters);
                toast.success('PDF downloaded successfully!');
              }}>
                <FileText className="w-4 h-4 mr-2" />
                Download PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Create Disaster
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Disaster Relief Program</DialogTitle>
              <DialogDescription>
                Set up a new disaster and allocate relief tokens
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateDisaster} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Disaster Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Kerala Floods 2024"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of the disaster"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tokens">Total Tokens (₹) *</Label>
                  <Input
                    id="tokens"
                    type="number"
                    value={formData.totalTokens}
                    onChange={(e) => setFormData({ ...formData, totalTokens: e.target.value })}
                    placeholder="e.g., 10000000"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="limit">Per-User Spending Limit (₹)</Label>
                  <Input
                    id="limit"
                    type="number"
                    value={formData.spendingLimit}
                    onChange={(e) => setFormData({ ...formData, spendingLimit: e.target.value })}
                    placeholder="15000"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Affected States *</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-2 border rounded-md">
                  {indianStates.map((state) => (
                    <label
                      key={state}
                      className={`flex items-center gap-2 p-2 rounded cursor-pointer text-sm ${
                        selectedStates.includes(state) ? "bg-primary/10 text-primary" : "hover:bg-muted"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedStates.includes(state)}
                        onChange={() => toggleState(state)}
                        className="rounded"
                      />
                      {state}
                    </label>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  {selectedStates.length} state(s) selected
                </p>
              </div>

              <Button type="submit" className="w-full">
                Create Disaster Relief Program
              </Button>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Disasters List */}
      <div className="grid gap-4">
        {filteredDisasters.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold mb-2">No Disasters Found</h3>
              <p className="text-muted-foreground text-sm mb-4">
                {searchQuery || statusFilter !== "all" 
                  ? "No disasters match your filters" 
                  : "Create your first disaster relief program to start distributing tokens"}
              </p>
              {!searchQuery && statusFilter === "all" && (
                <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Create Disaster
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredDisasters.map((disaster) => {
            const progress = disaster.total_tokens_allocated 
              ? ((disaster.tokens_distributed || 0) / disaster.total_tokens_allocated) * 100 
              : 0;

            return (
              <Card key={disaster.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">{disaster.name}</CardTitle>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => copyToClipboard(disaster.id)}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                      <CardDescription className="line-clamp-2">{disaster.description}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={disaster.status === "active" ? "default" : disaster.status === "completed" ? "secondary" : "destructive"}
                      >
                        {disaster.status === "active" && <Activity className="w-3 h-3 mr-1" />}
                        {disaster.status === "completed" && <CheckCircle className="w-3 h-3 mr-1" />}
                        {disaster.status === "frozen" && <Shield className="w-3 h-3 mr-1" />}
                        {disaster.status}
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => openDetailDialog(disaster)}>
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEditDialog(disaster)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit Disaster
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            setSelectedDisaster(disaster);
                            setAllocateDialogOpen(true);
                          }}>
                            <Coins className="w-4 h-4 mr-2" />
                            Allocate Tokens
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => openBeneficiariesDialog(disaster)}>
                            <UserCheck className="w-4 h-4 mr-2" />
                            View Beneficiaries
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openTransactionsDialog(disaster)}>
                            <ArrowRightLeft className="w-4 h-4 mr-2" />
                            View Transactions
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate(`/admin/map?disaster=${disaster.id}`)}>
                            <MapPin className="w-4 h-4 mr-2" />
                            View on Map
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => {
                              setSelectedDisaster(disaster);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete Disaster
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-4 gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <Wallet className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Total Allocated</p>
                        <p className="font-semibold">₹{Number(disaster.total_tokens_allocated || 0).toLocaleString("en-IN")}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Distributed</p>
                        <p className="font-semibold">₹{Number(disaster.tokens_distributed || 0).toLocaleString("en-IN")}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">States Affected</p>
                        <p className="font-semibold">{disaster.affected_states?.length || 0}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Started</p>
                        <p className="font-semibold">
                          {disaster.start_date ? new Date(disaster.start_date).toLocaleDateString("en-IN") : "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Distribution Progress</span>
                      <span className="font-medium">{progress.toFixed(1)}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>

                  <div className="flex flex-wrap gap-1 mb-4">
                    {disaster.affected_states?.slice(0, 5).map((state) => (
                      <Badge key={state} variant="outline" className="text-xs">
                        {state}
                      </Badge>
                    ))}
                    {disaster.affected_states && disaster.affected_states.length > 5 && (
                      <Badge variant="outline" className="text-xs">
                        +{disaster.affected_states.length - 5} more
                      </Badge>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openDetailDialog(disaster)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openBeneficiariesDialog(disaster)}
                    >
                      <UserCheck className="w-4 h-4 mr-2" />
                      Beneficiaries
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openTransactionsDialog(disaster)}
                    >
                      <ArrowRightLeft className="w-4 h-4 mr-2" />
                      Transactions
                    </Button>
                    {disaster.status === "active" && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStatusChange(disaster.id, "completed")}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Complete
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive"
                          onClick={() => handleStatusChange(disaster.id, "frozen")}
                        >
                          <Shield className="w-4 h-4 mr-2" />
                          Freeze
                        </Button>
                      </>
                    )}
                    {disaster.status === "frozen" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStatusChange(disaster.id, "active")}
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Reactivate
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedDisaster?.name}
              <Badge variant={selectedDisaster?.status === "active" ? "default" : "secondary"}>
                {selectedDisaster?.status}
              </Badge>
            </DialogTitle>
            <DialogDescription>{selectedDisaster?.description}</DialogDescription>
          </DialogHeader>
          
          {selectedDisaster && (
            <Tabs defaultValue="overview" className="mt-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="states">Affected States</TabsTrigger>
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2">
                        <Wallet className="w-5 h-5 text-primary" />
                        <div>
                          <p className="text-sm text-muted-foreground">Total Allocated</p>
                          <p className="text-xl font-bold">₹{Number(selectedDisaster.total_tokens_allocated || 0).toLocaleString("en-IN")}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-green-500" />
                        <div>
                          <p className="text-sm text-muted-foreground">Distributed</p>
                          <p className="text-xl font-bold">₹{Number(selectedDisaster.tokens_distributed || 0).toLocaleString("en-IN")}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-blue-500" />
                        <div>
                          <p className="text-sm text-muted-foreground">Spending Limit/User</p>
                          <p className="text-xl font-bold">₹{Number(selectedDisaster.spending_limit_per_user || 0).toLocaleString("en-IN")}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-orange-500" />
                        <div>
                          <p className="text-sm text-muted-foreground">States Affected</p>
                          <p className="text-xl font-bold">{selectedDisaster.affected_states?.length || 0}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="space-y-2">
                  <Label>Disaster ID</Label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 p-2 bg-muted rounded text-sm font-mono">{selectedDisaster.id}</code>
                    <Button variant="outline" size="icon" onClick={() => copyToClipboard(selectedDisaster.id)}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="states">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {selectedDisaster.affected_states?.map((state) => (
                    <Badge key={state} variant="outline" className="justify-center py-2">
                      <MapPin className="w-3 h-3 mr-1" />
                      {state}
                    </Badge>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="timeline" className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                      <Plus className="w-5 h-5 text-green-500" />
                    </div>
                    <div>
                      <p className="font-medium">Disaster Created</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(selectedDisaster.created_at).toLocaleString("en-IN")}
                      </p>
                    </div>
                  </div>
                  {selectedDisaster.start_date && (
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-blue-500" />
                      </div>
                      <div>
                        <p className="font-medium">Relief Started</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(selectedDisaster.start_date).toLocaleString("en-IN")}
                        </p>
                      </div>
                    </div>
                  )}
                  {selectedDisaster.end_date && (
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-orange-500" />
                      </div>
                      <div>
                        <p className="font-medium">Relief Completed</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(selectedDisaster.end_date).toLocaleString("en-IN")}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Disaster</DialogTitle>
            <DialogDescription>Update the disaster relief program details</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditDisaster} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Disaster Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-tokens">Total Tokens (₹) *</Label>
                <Input
                  id="edit-tokens"
                  type="number"
                  value={formData.totalTokens}
                  onChange={(e) => setFormData({ ...formData, totalTokens: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-limit">Per-User Spending Limit (₹)</Label>
                <Input
                  id="edit-limit"
                  type="number"
                  value={formData.spendingLimit}
                  onChange={(e) => setFormData({ ...formData, spendingLimit: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Affected States *</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-2 border rounded-md">
                {indianStates.map((state) => (
                  <label
                    key={state}
                    className={`flex items-center gap-2 p-2 rounded cursor-pointer text-sm ${
                      selectedStates.includes(state) ? "bg-primary/10 text-primary" : "hover:bg-muted"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedStates.includes(state)}
                      onChange={() => toggleState(state)}
                      className="rounded"
                    />
                    {state}
                  </label>
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Allocate Tokens Dialog */}
      <Dialog open={allocateDialogOpen} onOpenChange={setAllocateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Allocate Additional Tokens</DialogTitle>
            <DialogDescription>
              Add more tokens to {selectedDisaster?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Current Allocation</p>
              <p className="text-2xl font-bold">₹{Number(selectedDisaster?.total_tokens_allocated || 0).toLocaleString("en-IN")}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="allocate-amount">Amount to Add (₹)</Label>
              <Input
                id="allocate-amount"
                type="number"
                value={allocateAmount}
                onChange={(e) => setAllocateAmount(e.target.value)}
                placeholder="e.g., 1000000"
              />
            </div>
            {allocateAmount && (
              <div className="p-4 bg-green-500/10 rounded-lg">
                <p className="text-sm text-muted-foreground">New Total</p>
                <p className="text-2xl font-bold text-green-600">
                  ₹{Number((selectedDisaster?.total_tokens_allocated || 0) + parseFloat(allocateAmount || "0")).toLocaleString("en-IN")}
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAllocateDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAllocateTokens} disabled={!allocateAmount}>
              <Coins className="w-4 h-4 mr-2" />
              Allocate Tokens
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Beneficiaries Dialog */}
      <Dialog open={beneficiariesDialogOpen} onOpenChange={setBeneficiariesDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle>Beneficiaries - {selectedDisaster?.name}</DialogTitle>
                <DialogDescription>
                  {beneficiaries.length} beneficiaries enrolled
                </DialogDescription>
              </div>
              {beneficiaries.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Download className="w-4 h-4" />
                      Export
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => {
                      exportToCSV(
                        beneficiaries.map(b => ({
                          name: b.profiles?.full_name || 'N/A',
                          mobile: b.profiles?.mobile || 'N/A',
                          tokens_allocated: b.tokens_allocated,
                          tokens_spent: b.tokens_spent,
                          is_active: b.is_active ? 'Active' : 'Inactive',
                          enrolled: b.created_at
                        })),
                        `beneficiaries-${selectedDisaster?.name || 'export'}`
                      );
                      toast.success('CSV downloaded!');
                    }}>
                      <FileSpreadsheet className="w-4 h-4 mr-2" />
                      Download CSV
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => {
                      exportBeneficiariesToPDF(beneficiaries, selectedDisaster?.name || 'Unknown');
                      toast.success('PDF downloaded!');
                    }}>
                      <FileText className="w-4 h-4 mr-2" />
                      Download PDF
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </DialogHeader>
          <div className="mt-4">
            {beneficiaries.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No beneficiaries enrolled yet</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Mobile</TableHead>
                    <TableHead>Allocated</TableHead>
                    <TableHead>Spent</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Enrolled</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {beneficiaries.map((b) => (
                    <TableRow key={b.id}>
                      <TableCell className="font-medium">{b.profiles?.full_name || "Unknown"}</TableCell>
                      <TableCell>{b.profiles?.mobile || "N/A"}</TableCell>
                      <TableCell>₹{Number(b.tokens_allocated || 0).toLocaleString("en-IN")}</TableCell>
                      <TableCell>₹{Number(b.tokens_spent || 0).toLocaleString("en-IN")}</TableCell>
                      <TableCell>
                        <Badge variant={b.is_active ? "default" : "secondary"}>
                          {b.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(b.created_at).toLocaleDateString("en-IN")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Transactions Dialog */}
      <Dialog open={transactionsDialogOpen} onOpenChange={setTransactionsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle>Transactions - {selectedDisaster?.name}</DialogTitle>
                <DialogDescription>
                  {transactions.length} transactions recorded
                </DialogDescription>
              </div>
              {transactions.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Download className="w-4 h-4" />
                      Export
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => {
                      exportToCSV(
                        transactions.map(t => ({
                          id: t.id,
                          amount: t.amount,
                          from_wallet: t.from_wallet,
                          to_wallet: t.to_wallet,
                          purpose: t.purpose || 'N/A',
                          status: t.status,
                          transaction_hash: t.transaction_hash,
                          created_at: t.created_at
                        })),
                        `transactions-${selectedDisaster?.name || 'export'}`
                      );
                      toast.success('CSV downloaded!');
                    }}>
                      <FileSpreadsheet className="w-4 h-4 mr-2" />
                      Download CSV
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => {
                      exportTransactionsToPDF(transactions, selectedDisaster?.name || 'Unknown');
                      toast.success('PDF downloaded!');
                    }}>
                      <FileText className="w-4 h-4 mr-2" />
                      Download PDF
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </DialogHeader>
          <div className="mt-4">
            {transactions.length === 0 ? (
              <div className="text-center py-8">
                <ArrowRightLeft className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No transactions yet</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Amount</TableHead>
                    <TableHead>From</TableHead>
                    <TableHead>To</TableHead>
                    <TableHead>Purpose</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Hash</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium">₹{Number(t.amount).toLocaleString("en-IN")}</TableCell>
                      <TableCell className="font-mono text-xs">{t.from_wallet.slice(0, 8)}...</TableCell>
                      <TableCell className="font-mono text-xs">{t.to_wallet.slice(0, 8)}...</TableCell>
                      <TableCell>{t.purpose || "N/A"}</TableCell>
                      <TableCell>
                        <Badge variant={t.status === "completed" ? "default" : "secondary"}>
                          {t.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(t.created_at).toLocaleDateString("en-IN")}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(t.transaction_hash || t.id)}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => navigate("/admin/transactions")}>
              <ExternalLink className="w-4 h-4 mr-2" />
              View All in Explorer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Disaster?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{selectedDisaster?.name}" and all associated data. 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteDisaster} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}