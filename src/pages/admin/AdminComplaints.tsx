import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
import { toast } from "sonner";
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
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Search,
  Eye,
} from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/admin", icon: <LayoutDashboard className="w-4 h-4" /> },
  { label: "NGO Management", href: "/admin/ngos", icon: <Building2 className="w-4 h-4" /> },
  { label: "Merchants", href: "/admin/merchants", icon: <Store className="w-4 h-4" /> },
  { label: "Beneficiaries", href: "/admin/beneficiaries", icon: <Users className="w-4 h-4" /> },
  { label: "Disasters", href: "/admin/disasters", icon: <AlertTriangle className="w-4 h-4" /> },
  { label: "Bill Review", href: "/admin/bills", icon: <FileText className="w-4 h-4" /> },
  { label: "Complaints", href: "/admin/complaints", icon: <MessageSquare className="w-4 h-4" /> },
  { label: "India Map", href: "/admin/map", icon: <MapPin className="w-4 h-4" /> },
  { label: "Audit Logs", href: "/admin/audit", icon: <FileText className="w-4 h-4" /> },
  { label: "Settings", href: "/admin/settings", icon: <Settings className="w-4 h-4" /> },
];

interface Complaint {
  id: string;
  complainant_id: string;
  complaint_type: string;
  subject: string;
  description: string;
  status: string;
  resolution: string | null;
  created_at: string;
  resolved_at: string | null;
}

const complaintTypeLabels: Record<string, string> = {
  merchant_issue: "Merchant Issue",
  transaction_dispute: "Transaction Dispute",
  token_problem: "Token/Balance Problem",
  fraud_report: "Fraud Report",
  service_complaint: "Service Complaint",
  other: "Other",
};

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode }> = {
  open: { label: "Open", variant: "secondary", icon: <Clock className="w-3 h-3" /> },
  in_progress: { label: "In Progress", variant: "default", icon: <AlertCircle className="w-3 h-3" /> },
  resolved: { label: "Resolved", variant: "outline", icon: <CheckCircle className="w-3 h-3" /> },
  closed: { label: "Closed", variant: "destructive", icon: <XCircle className="w-3 h-3" /> },
};

export default function AdminComplaints() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [filteredComplaints, setFilteredComplaints] = useState<Complaint[]>([]);
  const [loadingComplaints, setLoadingComplaints] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  
  // Dialog state
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [resolution, setResolution] = useState("");

  useEffect(() => {
    if (!loading && (!user || profile?.role !== "admin")) {
      navigate("/auth/admin");
    }
  }, [user, profile, loading, navigate]);

  useEffect(() => {
    if (user && profile?.role === "admin") {
      fetchComplaints();

      // Subscribe to realtime changes
      const channel = supabase
        .channel('admin-complaints')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'complaints'
          },
          (payload) => {
            if (payload.eventType === 'INSERT') {
              setComplaints((prev) => [payload.new as Complaint, ...prev]);
              toast.info("New complaint received");
            } else if (payload.eventType === 'UPDATE') {
              setComplaints((prev) =>
                prev.map((c) => (c.id === payload.new.id ? (payload.new as Complaint) : c))
              );
            } else if (payload.eventType === 'DELETE') {
              setComplaints((prev) => prev.filter((c) => c.id !== payload.old.id));
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, profile]);

  useEffect(() => {
    filterComplaints();
  }, [complaints, searchQuery, statusFilter, typeFilter]);

  const fetchComplaints = async () => {
    setLoadingComplaints(true);
    const { data, error } = await supabase
      .from("complaints")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setComplaints(data);
    }
    setLoadingComplaints(false);
  };

  const filterComplaints = () => {
    let filtered = [...complaints];
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.subject.toLowerCase().includes(query) ||
          c.description.toLowerCase().includes(query) ||
          c.id.toLowerCase().includes(query)
      );
    }
    
    if (statusFilter !== "all") {
      filtered = filtered.filter((c) => c.status === statusFilter);
    }
    
    if (typeFilter !== "all") {
      filtered = filtered.filter((c) => c.complaint_type === typeFilter);
    }
    
    setFilteredComplaints(filtered);
  };

  const openComplaintDialog = (complaint: Complaint) => {
    setSelectedComplaint(complaint);
    setNewStatus(complaint.status);
    setResolution(complaint.resolution || "");
    setDialogOpen(true);
  };

  const handleUpdateComplaint = async () => {
    if (!selectedComplaint) return;
    
    if (newStatus === "resolved" && !resolution.trim()) {
      toast.error("Please provide a resolution before marking as resolved");
      return;
    }

    setUpdating(true);
    
    const updateData: Record<string, unknown> = {
      status: newStatus,
      resolution: resolution.trim() || null,
    };

    if (newStatus === "resolved" || newStatus === "closed") {
      updateData.resolved_at = new Date().toISOString();
      updateData.resolved_by = user?.id;
    }

    const { error } = await supabase
      .from("complaints")
      .update(updateData)
      .eq("id", selectedComplaint.id);

    setUpdating(false);

    if (error) {
      toast.error("Failed to update complaint: " + error.message);
      return;
    }

    toast.success("Complaint updated successfully");
    setDialogOpen(false);
    fetchComplaints();
  };

  const stats = {
    total: complaints.length,
    open: complaints.filter((c) => c.status === "open").length,
    inProgress: complaints.filter((c) => c.status === "in_progress").length,
    resolved: complaints.filter((c) => c.status === "resolved" || c.status === "closed").length,
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <DashboardLayout title="Complaints Management" navItems={navItems} role="admin">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Total</span>
            </div>
            <p className="text-2xl font-bold mt-1">{stats.total}</p>
          </CardContent>
        </Card>
        <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-yellow-600" />
              <span className="text-sm text-yellow-700 dark:text-yellow-400">Open</span>
            </div>
            <p className="text-2xl font-bold mt-1 text-yellow-700 dark:text-yellow-400">{stats.open}</p>
          </CardContent>
        </Card>
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-blue-700 dark:text-blue-400">In Progress</span>
            </div>
            <p className="text-2xl font-bold mt-1 text-blue-700 dark:text-blue-400">{stats.inProgress}</p>
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-sm text-green-700 dark:text-green-400">Resolved</span>
            </div>
            <p className="text-2xl font-bold mt-1 text-green-700 dark:text-green-400">{stats.resolved}</p>
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
                placeholder="Search by subject, description, or ID..."
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
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {Object.entries(complaintTypeLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Complaints Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Complaints</CardTitle>
          <CardDescription>View and manage citizen complaints</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingComplaints ? (
            <div className="text-center py-8 text-muted-foreground">Loading complaints...</div>
          ) : filteredComplaints.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">No complaints found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredComplaints.map((complaint) => {
                    const status = statusConfig[complaint.status] || statusConfig.open;
                    return (
                      <TableRow key={complaint.id}>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(complaint.created_at), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {complaintTypeLabels[complaint.complaint_type] || complaint.complaint_type}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[300px] truncate">
                          {complaint.subject}
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
                            onClick={() => openComplaintDialog(complaint)}
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

      {/* Complaint Detail Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Complaint Details</DialogTitle>
            <DialogDescription>
              Review and update the complaint status
            </DialogDescription>
          </DialogHeader>
          
          {selectedComplaint && (
            <div className="space-y-6 mt-4">
              {/* Complaint Info */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">ID:</span>
                  <p className="font-mono text-xs mt-1">{selectedComplaint.id}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Date:</span>
                  <p className="mt-1">{format(new Date(selectedComplaint.created_at), "MMM d, yyyy 'at' h:mm a")}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Type:</span>
                  <p className="mt-1">{complaintTypeLabels[selectedComplaint.complaint_type] || selectedComplaint.complaint_type}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Current Status:</span>
                  <p className="mt-1">
                    <Badge variant={statusConfig[selectedComplaint.status]?.variant || "secondary"}>
                      {statusConfig[selectedComplaint.status]?.label || selectedComplaint.status}
                    </Badge>
                  </p>
                </div>
              </div>

              <div>
                <span className="text-sm text-muted-foreground">Subject:</span>
                <p className="mt-1 font-medium">{selectedComplaint.subject}</p>
              </div>

              <div>
                <span className="text-sm text-muted-foreground">Description:</span>
                <p className="mt-1 text-sm bg-muted/50 p-3 rounded-md whitespace-pre-wrap">
                  {selectedComplaint.description}
                </p>
              </div>

              {/* Update Form */}
              <div className="border-t pt-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Update Status</Label>
                  <Select value={newStatus} onValueChange={setNewStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select new status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="resolution">
                    Resolution / Notes
                    {(newStatus === "resolved" || newStatus === "closed") && (
                      <span className="text-destructive ml-1">*</span>
                    )}
                  </Label>
                  <Textarea
                    id="resolution"
                    placeholder="Provide details about the resolution or any notes..."
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value)}
                    className="min-h-[100px]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateComplaint} disabled={updating}>
                  {updating ? "Updating..." : "Update Complaint"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
