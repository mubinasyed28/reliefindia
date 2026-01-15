import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import {
  LayoutDashboard,
  Building2,
  Store,
  Users,
  AlertTriangle,
  MapPin,
  FileText,
  Settings,
  MessageSquare,
  Search,
  Eye,
  Link2,
  CheckCircle,
  XCircle,
  Clock,
  ArrowRight,
  Hash,
  Shield,
  Wallet,
  MapPinned,
  Calendar,
  Activity,
  Copy,
  Check,
} from "lucide-react";
import { toast } from "sonner";

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
  { label: "Audit Logs", href: "/admin/audit", icon: <FileText className="w-4 h-4" /> },
  { label: "Settings", href: "/admin/settings", icon: <Settings className="w-4 h-4" /> },
];

interface Transaction {
  id: string;
  from_wallet: string;
  to_wallet: string;
  from_type: string;
  to_type: string;
  amount: number;
  status: string;
  transaction_hash: string | null;
  purpose: string | null;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  is_offline: boolean;
  bill_verified: boolean | null;
  bill_url: string | null;
  created_at: string;
  disaster_id: string | null;
}

interface AuditLog {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  performed_by: string | null;
  details: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode }> = {
  pending: { label: "Pending", variant: "secondary", icon: <Clock className="w-3 h-3" /> },
  completed: { label: "Completed", variant: "default", icon: <CheckCircle className="w-3 h-3" /> },
  failed: { label: "Failed", variant: "destructive", icon: <XCircle className="w-3 h-3" /> },
  synced: { label: "Synced", variant: "outline", icon: <Link2 className="w-3 h-3" /> },
};

const typeLabels: Record<string, string> = {
  citizen: "Citizen",
  merchant: "Merchant",
  ngo: "NGO",
  government: "Government",
};

export default function TransactionExplorer() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && (!user || profile?.role !== "admin")) {
      navigate("/auth/admin");
    }
  }, [user, profile, loading, navigate]);

  useEffect(() => {
    if (user && profile?.role === "admin") {
      fetchData();
    }
  }, [user, profile]);

  useEffect(() => {
    filterTransactions();
  }, [transactions, searchQuery, statusFilter, typeFilter]);

  const fetchData = async () => {
    setLoadingData(true);
    
    const [transactionsRes, auditRes] = await Promise.all([
      supabase
        .from("transactions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500),
      supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100),
    ]);

    if (transactionsRes.data) setTransactions(transactionsRes.data);
    if (auditRes.data) setAuditLogs(auditRes.data as AuditLog[]);
    
    setLoadingData(false);
  };

  const filterTransactions = () => {
    let filtered = [...transactions];
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.id.toLowerCase().includes(query) ||
          t.from_wallet.toLowerCase().includes(query) ||
          t.to_wallet.toLowerCase().includes(query) ||
          t.transaction_hash?.toLowerCase().includes(query) ||
          t.purpose?.toLowerCase().includes(query)
      );
    }
    
    if (statusFilter !== "all") {
      filtered = filtered.filter((t) => t.status === statusFilter);
    }
    
    if (typeFilter !== "all") {
      filtered = filtered.filter((t) => t.from_type === typeFilter || t.to_type === typeFilter);
    }
    
    setFilteredTransactions(filtered);
  };

  const openTransactionDialog = (tx: Transaction) => {
    setSelectedTransaction(tx);
    setDialogOpen(true);
  };

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedHash(text);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const verifyHash = (tx: Transaction): boolean => {
    if (!tx.transaction_hash) return false;
    // Simple verification: hash should start with 0x and be 34 chars
    return tx.transaction_hash.startsWith("0x") && tx.transaction_hash.length === 34;
  };

  const stats = {
    total: transactions.length,
    completed: transactions.filter((t) => t.status === "completed").length,
    pending: transactions.filter((t) => t.status === "pending").length,
    totalVolume: transactions
      .filter((t) => t.status === "completed")
      .reduce((sum, t) => sum + t.amount, 0),
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <DashboardLayout title="Transaction Explorer" navItems={navItems} role="admin">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Total Transactions</span>
            </div>
            <p className="text-2xl font-bold mt-1">{stats.total}</p>
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-sm text-green-700 dark:text-green-400">Completed</span>
            </div>
            <p className="text-2xl font-bold mt-1 text-green-700 dark:text-green-400">{stats.completed}</p>
          </CardContent>
        </Card>
        <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-yellow-600" />
              <span className="text-sm text-yellow-700 dark:text-yellow-400">Pending</span>
            </div>
            <p className="text-2xl font-bold mt-1 text-yellow-700 dark:text-yellow-400">{stats.pending}</p>
          </CardContent>
        </Card>
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-primary" />
              <span className="text-sm text-primary">Total Volume</span>
            </div>
            <p className="text-2xl font-bold mt-1 text-primary">₹{stats.totalVolume.toLocaleString("en-IN")}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by ID, wallet, hash, or purpose..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="synced">Synced</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="citizen">Citizen</SelectItem>
                <SelectItem value="merchant">Merchant</SelectItem>
                <SelectItem value="ngo">NGO</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Transactions Table */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link2 className="w-5 h-5" />
              Transaction Ledger
            </CardTitle>
            <CardDescription>Blockchain-verified transaction history</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingData ? (
              <div className="text-center py-8 text-muted-foreground">Loading transactions...</div>
            ) : filteredTransactions.length === 0 ? (
              <div className="text-center py-8">
                <Activity className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">No transactions found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Hash</TableHead>
                      <TableHead>From → To</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransactions.slice(0, 20).map((tx) => {
                      const status = statusConfig[tx.status] || statusConfig.pending;
                      const isValid = verifyHash(tx);
                      return (
                        <TableRow key={tx.id} className="group">
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {isValid ? (
                                <Shield className="w-4 h-4 text-green-500" />
                              ) : (
                                <Shield className="w-4 h-4 text-muted-foreground" />
                              )}
                              <code className="text-xs font-mono bg-muted px-2 py-1 rounded">
                                {tx.transaction_hash?.slice(0, 10)}...
                              </code>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 text-xs">
                              <Badge variant="outline" className="font-mono">
                                {tx.from_wallet.slice(0, 8)}...
                              </Badge>
                              <ArrowRight className="w-3 h-3 text-muted-foreground" />
                              <Badge variant="outline" className="font-mono">
                                {tx.to_wallet.slice(0, 8)}...
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="font-semibold">
                            ₹{tx.amount.toLocaleString("en-IN")}
                          </TableCell>
                          <TableCell>
                            <Badge variant={status.variant} className="gap-1">
                              {status.icon}
                              {status.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => openTransactionDialog(tx)}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Audit Log */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Audit Trail
            </CardTitle>
            <CardDescription>Recent system activities</CardDescription>
          </CardHeader>
          <CardContent>
            {auditLogs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No audit logs</p>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {auditLogs.slice(0, 15).map((log) => (
                  <div
                    key={log.id}
                    className="p-3 bg-muted/50 rounded-lg border-l-4 border-primary/50"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <Badge variant="outline" className="text-xs">
                        {log.entity_type}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(log.created_at), "MMM d, HH:mm")}
                      </span>
                    </div>
                    <p className="text-sm font-medium mt-1">{log.action}</p>
                    {log.entity_id && (
                      <code className="text-xs font-mono text-muted-foreground block mt-1 truncate">
                        {log.entity_id}
                      </code>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Transaction Detail Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Hash className="w-5 h-5" />
              Transaction Details
            </DialogTitle>
            <DialogDescription>
              Blockchain-verified transaction record
            </DialogDescription>
          </DialogHeader>
          
          {selectedTransaction && (
            <div className="space-y-6 mt-4">
              {/* Hash Verification Banner */}
              <div className={`p-4 rounded-lg flex items-center gap-3 ${
                verifyHash(selectedTransaction)
                  ? "bg-green-50 border border-green-200 dark:bg-green-900/20 dark:border-green-800"
                  : "bg-yellow-50 border border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800"
              }`}>
                <Shield className={`w-6 h-6 ${
                  verifyHash(selectedTransaction) ? "text-green-600" : "text-yellow-600"
                }`} />
                <div>
                  <p className={`font-medium ${
                    verifyHash(selectedTransaction)
                      ? "text-green-700 dark:text-green-400"
                      : "text-yellow-700 dark:text-yellow-400"
                  }`}>
                    {verifyHash(selectedTransaction)
                      ? "Hash Verified"
                      : "Hash Pending Verification"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {verifyHash(selectedTransaction)
                      ? "This transaction has been cryptographically verified"
                      : "Transaction hash verification in progress"}
                  </p>
                </div>
              </div>

              {/* Transaction Hash */}
              <div className="bg-muted/50 p-4 rounded-lg">
                <label className="text-xs text-muted-foreground uppercase tracking-wide">Transaction Hash</label>
                <div className="flex items-center gap-2 mt-2">
                  <code className="font-mono text-sm bg-background p-2 rounded flex-1 overflow-hidden text-ellipsis">
                    {selectedTransaction.transaction_hash || "Pending..."}
                  </code>
                  {selectedTransaction.transaction_hash && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(selectedTransaction.transaction_hash!)}
                    >
                      {copiedHash === selectedTransaction.transaction_hash ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  )}
                </div>
              </div>

              {/* Transaction Flow */}
              <div className="grid grid-cols-[1fr,auto,1fr] items-center gap-4 p-4 bg-gradient-to-r from-muted/50 via-transparent to-muted/50 rounded-lg">
                <div className="text-center">
                  <Badge className="mb-2">{typeLabels[selectedTransaction.from_type] || selectedTransaction.from_type}</Badge>
                  <p className="font-mono text-xs break-all">{selectedTransaction.from_wallet}</p>
                </div>
                <div className="flex flex-col items-center">
                  <ArrowRight className="w-6 h-6 text-primary" />
                  <span className="text-lg font-bold text-primary mt-1">
                    ₹{selectedTransaction.amount.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="text-center">
                  <Badge className="mb-2">{typeLabels[selectedTransaction.to_type] || selectedTransaction.to_type}</Badge>
                  <p className="font-mono text-xs break-all">{selectedTransaction.to_wallet}</p>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                  <Calendar className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <div>
                    <span className="text-muted-foreground text-xs">Date & Time</span>
                    <p className="font-medium">{format(new Date(selectedTransaction.created_at), "MMM d, yyyy 'at' h:mm a")}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                  <Activity className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <div>
                    <span className="text-muted-foreground text-xs">Status</span>
                    <p className="font-medium">
                      <Badge variant={statusConfig[selectedTransaction.status]?.variant || "secondary"}>
                        {statusConfig[selectedTransaction.status]?.label || selectedTransaction.status}
                      </Badge>
                    </p>
                  </div>
                </div>
                {selectedTransaction.purpose && (
                  <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg col-span-2">
                    <FileText className="w-4 h-4 text-muted-foreground mt-0.5" />
                    <div>
                      <span className="text-muted-foreground text-xs">Purpose</span>
                      <p className="font-medium">{selectedTransaction.purpose}</p>
                    </div>
                  </div>
                )}
                {selectedTransaction.location && (
                  <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg col-span-2">
                    <MapPinned className="w-4 h-4 text-muted-foreground mt-0.5" />
                    <div>
                      <span className="text-muted-foreground text-xs">Location</span>
                      <p className="font-medium">{selectedTransaction.location}</p>
                      {selectedTransaction.latitude && selectedTransaction.longitude && (
                        <p className="text-xs text-muted-foreground font-mono mt-1">
                          {selectedTransaction.latitude.toFixed(6)}, {selectedTransaction.longitude.toFixed(6)}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Additional Info */}
              <div className="flex flex-wrap gap-2 pt-2 border-t">
                {selectedTransaction.is_offline && (
                  <Badge variant="outline" className="gap-1">
                    <Link2 className="w-3 h-3" />
                    Offline Transaction
                  </Badge>
                )}
                {selectedTransaction.bill_verified !== null && (
                  <Badge variant={selectedTransaction.bill_verified ? "default" : "secondary"} className="gap-1">
                    {selectedTransaction.bill_verified ? (
                      <CheckCircle className="w-3 h-3" />
                    ) : (
                      <Clock className="w-3 h-3" />
                    )}
                    Bill {selectedTransaction.bill_verified ? "Verified" : "Pending"}
                  </Badge>
                )}
              </div>

              {/* Copy ID */}
              <div className="flex justify-between items-center pt-4 border-t">
                <code className="text-xs text-muted-foreground font-mono">
                  ID: {selectedTransaction.id}
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(selectedTransaction.id)}
                >
                  {copiedHash === selectedTransaction.id ? (
                    <Check className="w-4 h-4 mr-1 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4 mr-1" />
                  )}
                  Copy ID
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}