import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  LayoutDashboard, Building2, Store, Users, AlertTriangle, MapPin, Activity,
  FileText, Settings, Search, Filter, Eye, CheckCircle, XCircle, Wallet,
  Clock, MessageSquare, RefreshCw, Mail, Phone, MapPinIcon, Download,
  Shield, TrendingUp, AlertCircle, Ban, FileCheck
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
  { label: "Transactions", href: "/admin/transactions", icon: <Activity className="w-4 h-4" /> },
  { label: "India Map", href: "/admin/map", icon: <MapPin className="w-4 h-4" /> },
  { label: "Settings", href: "/admin/settings", icon: <Settings className="w-4 h-4" /> },
];

interface NGO {
  id: string;
  ngo_name: string;
  contact_email: string;
  contact_phone: string;
  office_address: string;
  legal_registration_number: string;
  status: string;
  wallet_balance: number;
  wallet_address: string;
  created_at: string;
  compliance_accepted: boolean;
  government_certificates: string[];
  tax_documents: string[];
  relief_work_proof: string[];
  bank_name: string;
  bank_account_number: string;
  bank_ifsc: string;
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

interface BillValidation {
  id: string;
  amount: number;
  file_name: string;
  ai_validation_status: string;
  created_at: string;
  vendor_name: string;
}

export default function AdminNGOs() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const [ngos, setNgos] = useState<NGO[]>([]);
  const [selectedNgo, setSelectedNgo] = useState<NGO | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [ngoTransactions, setNgoTransactions] = useState<Transaction[]>([]);
  const [ngoBills, setNgoBills] = useState<BillValidation[]>([]);
  const [stats, setStats] = useState({ total: 0, verified: 0, pending: 0, rejected: 0, totalBalance: 0 });

  useEffect(() => {
    if (!loading && (!user || profile?.role !== "admin")) {
      navigate("/auth/admin");
    }
  }, [user, profile, loading, navigate]);

  useEffect(() => {
    if (user && profile?.role === "admin") {
      fetchNGOs();
    }
  }, [user, profile]);

  const fetchNGOs = async () => {
    setIsRefreshing(true);
    const { data } = await supabase
      .from("ngos")
      .select("*")
      .order("created_at", { ascending: false });

    const ngoList = data || [];
    setNgos(ngoList);
    
    setStats({
      total: ngoList.length,
      verified: ngoList.filter(n => n.status === "verified").length,
      pending: ngoList.filter(n => n.status === "pending").length,
      rejected: ngoList.filter(n => n.status === "rejected").length,
      totalBalance: ngoList.reduce((sum, n) => sum + (Number(n.wallet_balance) || 0), 0),
    });
    
    setIsRefreshing(false);
  };

  const fetchNgoDetails = async (ngo: NGO) => {
    // Fetch transactions
    const { data: transactions } = await supabase
      .from("transactions")
      .select("*")
      .or(`from_wallet.eq.${ngo.wallet_address},to_wallet.eq.${ngo.wallet_address}`)
      .order("created_at", { ascending: false })
      .limit(50);
    
    setNgoTransactions(transactions || []);

    // Fetch bill validations
    const { data: bills } = await supabase
      .from("bill_validations")
      .select("*")
      .eq("ngo_id", ngo.id)
      .order("created_at", { ascending: false })
      .limit(50);
    
    setNgoBills(bills || []);
  };

  const openNgoDetail = async (ngo: NGO) => {
    setSelectedNgo(ngo);
    await fetchNgoDetails(ngo);
    setDetailOpen(true);
  };

  const handleStatusChange = async (ngoId: string, newStatus: "pending" | "verified" | "rejected") => {
    const { error } = await supabase
      .from("ngos")
      .update({ status: newStatus })
      .eq("id", ngoId);

    if (error) {
      toast.error("Failed to update status");
      return;
    }

    toast.success(`NGO ${newStatus === "verified" ? "approved" : newStatus}`);
    fetchNGOs();
    if (selectedNgo?.id === ngoId) {
      setSelectedNgo({ ...selectedNgo, status: newStatus });
    }
  };

  const filteredNgos = ngos.filter((ngo) => {
    const matchesSearch = 
      ngo.ngo_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ngo.contact_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ngo.office_address?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || ngo.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "verified":
        return <Badge className="bg-green-500">Verified</Badge>;
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <DashboardLayout title="NGO Management" navItems={navItems} role="admin">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <Card className="stat-card">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Building2 className="w-4 h-4" />
            <span className="text-xs">Total NGOs</span>
          </div>
          <p className="text-2xl font-bold">{stats.total}</p>
        </Card>
        <Card className="stat-card">
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="w-4 h-4" />
            <span className="text-xs">Verified</span>
          </div>
          <p className="text-2xl font-bold text-green-600">{stats.verified}</p>
        </Card>
        <Card className="stat-card">
          <div className="flex items-center gap-2 text-amber-600">
            <Clock className="w-4 h-4" />
            <span className="text-xs">Pending</span>
          </div>
          <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
        </Card>
        <Card className="stat-card">
          <div className="flex items-center gap-2 text-red-600">
            <XCircle className="w-4 h-4" />
            <span className="text-xs">Rejected</span>
          </div>
          <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
        </Card>
        <Card className="stat-card">
          <div className="flex items-center gap-2 text-primary">
            <Wallet className="w-4 h-4" />
            <span className="text-xs">Total Balance</span>
          </div>
          <p className="text-2xl font-bold">₹{stats.totalBalance.toLocaleString("en-IN")}</p>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search NGOs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="verified">Verified</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon" onClick={fetchNGOs} disabled={isRefreshing}>
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* NGO Table */}
      <Card>
        <CardHeader>
          <CardTitle>NGO Registry</CardTitle>
          <CardDescription>Click on any NGO to view full details</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>NGO Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Wallet Balance</TableHead>
                <TableHead>Registered</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredNgos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No NGOs found
                  </TableCell>
                </TableRow>
              ) : (
                filteredNgos.map((ngo) => (
                  <TableRow 
                    key={ngo.id} 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => openNgoDetail(ngo)}
                  >
                    <TableCell className="font-medium">{ngo.ngo_name}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {ngo.contact_email}
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Phone className="w-3 h-3" />
                          {ngo.contact_phone}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(ngo.status || "pending")}</TableCell>
                    <TableCell>₹{Number(ngo.wallet_balance || 0).toLocaleString("en-IN")}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {ngo.created_at ? formatDistanceToNow(new Date(ngo.created_at), { addSuffix: true }) : "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                        <Button size="sm" variant="outline" onClick={() => openNgoDetail(ngo)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        {ngo.status === "pending" && (
                          <>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-green-600 border-green-600"
                              onClick={() => handleStatusChange(ngo.id, "verified")}
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-red-600 border-red-600"
                              onClick={() => handleStatusChange(ngo.id, "rejected")}
                            >
                              <XCircle className="w-4 h-4" />
                            </Button>
                          </>
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

      {/* NGO Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              {selectedNgo?.ngo_name}
              {selectedNgo && getStatusBadge(selectedNgo.status || "pending")}
            </DialogTitle>
            <DialogDescription>Complete NGO profile and activity</DialogDescription>
          </DialogHeader>

          {selectedNgo && (
            <Tabs defaultValue="profile" className="mt-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
                <TabsTrigger value="transactions">Transactions</TabsTrigger>
                <TabsTrigger value="bills">Bills</TabsTrigger>
              </TabsList>

              <ScrollArea className="h-[500px] mt-4">
                <TabsContent value="profile" className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Contact Information</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-muted-foreground" />
                          {selectedNgo.contact_email}
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-muted-foreground" />
                          {selectedNgo.contact_phone}
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPinIcon className="w-4 h-4 text-muted-foreground" />
                          {selectedNgo.office_address}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Wallet Information</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Balance:</span>
                          <span className="font-bold text-green-600">
                            ₹{Number(selectedNgo.wallet_balance || 0).toLocaleString("en-IN")}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Address:</span>
                          <span className="font-mono text-xs">{selectedNgo.wallet_address?.slice(0, 20)}...</span>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Registration</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Reg No:</span>
                          <span>{selectedNgo.legal_registration_number}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Compliance:</span>
                          <span>{selectedNgo.compliance_accepted ? "Accepted" : "Pending"}</span>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Bank Details</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Bank:</span>
                          <span>{selectedNgo.bank_name || "-"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Account:</span>
                          <span>{selectedNgo.bank_account_number || "-"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">IFSC:</span>
                          <span>{selectedNgo.bank_ifsc || "-"}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {selectedNgo.status === "pending" && (
                    <div className="flex gap-2 pt-4">
                      <Button 
                        className="flex-1 bg-green-600 hover:bg-green-700"
                        onClick={() => handleStatusChange(selectedNgo.id, "verified")}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Approve NGO
                      </Button>
                      <Button 
                        variant="destructive" 
                        className="flex-1"
                        onClick={() => handleStatusChange(selectedNgo.id, "rejected")}
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Reject NGO
                      </Button>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="documents" className="space-y-4">
                  <div className="grid gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <FileCheck className="w-4 h-4" />
                          Government Certificates
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {selectedNgo.government_certificates?.length ? (
                          <div className="space-y-2">
                            {selectedNgo.government_certificates.map((cert, i) => (
                              <div key={i} className="flex items-center justify-between p-2 bg-muted rounded">
                                <span className="text-sm">{cert}</span>
                                <Button size="sm" variant="ghost">
                                  <Download className="w-4 h-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-muted-foreground text-sm">No certificates uploaded</p>
                        )}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          Tax Documents
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {selectedNgo.tax_documents?.length ? (
                          <div className="space-y-2">
                            {selectedNgo.tax_documents.map((doc, i) => (
                              <div key={i} className="flex items-center justify-between p-2 bg-muted rounded">
                                <span className="text-sm">{doc}</span>
                                <Button size="sm" variant="ghost">
                                  <Download className="w-4 h-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-muted-foreground text-sm">No tax documents uploaded</p>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="transactions">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Purpose</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ngoTransactions.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                            No transactions found
                          </TableCell>
                        </TableRow>
                      ) : (
                        ngoTransactions.map((txn) => (
                          <TableRow key={txn.id}>
                            <TableCell className="text-sm">
                              {txn.created_at ? new Date(txn.created_at).toLocaleDateString() : "-"}
                            </TableCell>
                            <TableCell>
                              <Badge variant={txn.from_wallet === selectedNgo?.wallet_address ? "destructive" : "default"}>
                                {txn.from_wallet === selectedNgo?.wallet_address ? "Sent" : "Received"}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-medium">
                              ₹{Number(txn.amount).toLocaleString("en-IN")}
                            </TableCell>
                            <TableCell>
                              <Badge variant={txn.status === "completed" ? "default" : "secondary"}>
                                {txn.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                              {txn.purpose || "-"}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TabsContent>

                <TabsContent value="bills">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>File</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Vendor</TableHead>
                        <TableHead>AI Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ngoBills.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                            No bills uploaded
                          </TableCell>
                        </TableRow>
                      ) : (
                        ngoBills.map((bill) => (
                          <TableRow key={bill.id}>
                            <TableCell className="text-sm">
                              {bill.created_at ? new Date(bill.created_at).toLocaleDateString() : "-"}
                            </TableCell>
                            <TableCell className="text-sm">{bill.file_name}</TableCell>
                            <TableCell className="font-medium">
                              ₹{Number(bill.amount).toLocaleString("en-IN")}
                            </TableCell>
                            <TableCell>{bill.vendor_name || "-"}</TableCell>
                            <TableCell>
                              <Badge variant={
                                bill.ai_validation_status === "valid" ? "default" : 
                                bill.ai_validation_status === "invalid" ? "destructive" : "secondary"
                              }>
                                {bill.ai_validation_status || "pending"}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TabsContent>
              </ScrollArea>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
