import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  LayoutDashboard, 
  Building2, 
  Store, 
  Users, 
  AlertTriangle,
  MapPin,
  FileText,
  Settings,
  CheckCircle,
  XCircle,
  Eye,
  Search,
  Filter,
  FileCheck,
  Loader2,
  ExternalLink
} from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/admin", icon: <LayoutDashboard className="w-4 h-4" /> },
  { label: "NGO Management", href: "/admin/ngos", icon: <Building2 className="w-4 h-4" /> },
  { label: "Merchants", href: "/admin/merchants", icon: <Store className="w-4 h-4" /> },
  { label: "Beneficiaries", href: "/admin/beneficiaries", icon: <Users className="w-4 h-4" /> },
  { label: "Disasters", href: "/admin/disasters", icon: <AlertTriangle className="w-4 h-4" /> },
  { label: "Bill Review", href: "/admin/bills", icon: <FileCheck className="w-4 h-4" /> },
  { label: "India Map", href: "/admin/map", icon: <MapPin className="w-4 h-4" /> },
  { label: "Audit Logs", href: "/admin/audit", icon: <FileText className="w-4 h-4" /> },
  { label: "Settings", href: "/admin/settings", icon: <Settings className="w-4 h-4" /> },
];

interface BillValidation {
  id: string;
  file_path: string;
  file_name: string;
  amount: number;
  vendor_name: string | null;
  bill_date: string | null;
  ai_validation_status: string;
  ai_validation_notes: string | null;
  ai_confidence_score: number | null;
  created_at: string;
  validated_at: string | null;
  ngo_id: string;
  ngo_name?: string;
}

type FilterStatus = "all" | "requires_review" | "valid" | "invalid" | "pending";

export default function AdminBillReview() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const [bills, setBills] = useState<BillValidation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("requires_review");
  const [selectedBill, setSelectedBill] = useState<BillValidation | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [billImageUrl, setBillImageUrl] = useState<string | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    requiresReview: 0,
    valid: 0,
    invalid: 0,
  });

  useEffect(() => {
    if (!loading && (!user || profile?.role !== "admin")) {
      navigate("/auth/admin");
    }
  }, [user, profile, loading, navigate]);

  useEffect(() => {
    if (user && profile?.role === "admin") {
      fetchBills();
      fetchStats();
    }
  }, [user, profile, filterStatus]);

  const fetchStats = async () => {
    const { count: total } = await supabase
      .from("bill_validations")
      .select("*", { count: "exact", head: true });

    const { count: pending } = await supabase
      .from("bill_validations")
      .select("*", { count: "exact", head: true })
      .eq("ai_validation_status", "pending");

    const { count: requiresReview } = await supabase
      .from("bill_validations")
      .select("*", { count: "exact", head: true })
      .eq("ai_validation_status", "requires_review");

    const { count: valid } = await supabase
      .from("bill_validations")
      .select("*", { count: "exact", head: true })
      .eq("ai_validation_status", "valid");

    const { count: invalid } = await supabase
      .from("bill_validations")
      .select("*", { count: "exact", head: true })
      .eq("ai_validation_status", "invalid");

    setStats({
      total: total || 0,
      pending: pending || 0,
      requiresReview: requiresReview || 0,
      valid: valid || 0,
      invalid: invalid || 0,
    });
  };

  const fetchBills = async () => {
    setIsLoading(true);
    
    let query = supabase
      .from("bill_validations")
      .select("*")
      .order("created_at", { ascending: false });

    if (filterStatus !== "all") {
      query = query.eq("ai_validation_status", filterStatus);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching bills:", error);
      toast.error("Failed to fetch bills");
      setIsLoading(false);
      return;
    }

    // Fetch NGO names for each bill
    const billsWithNgoNames = await Promise.all(
      (data || []).map(async (bill) => {
        const { data: ngo } = await supabase
          .from("ngos")
          .select("ngo_name")
          .eq("id", bill.ngo_id)
          .maybeSingle();
        return { ...bill, ngo_name: ngo?.ngo_name || "Unknown NGO" };
      })
    );

    setBills(billsWithNgoNames);
    setIsLoading(false);
  };

  const handleViewBill = async (bill: BillValidation) => {
    setSelectedBill(bill);
    setReviewNotes("");
    setBillImageUrl(null);

    // Get signed URL for the bill
    const { data: signedUrlData } = await supabase.storage
      .from("ngo-bills")
      .createSignedUrl(bill.file_path, 3600);

    if (signedUrlData?.signedUrl) {
      setBillImageUrl(signedUrlData.signedUrl);
    }
  };

  const handleApprove = async () => {
    if (!selectedBill) return;
    setIsSubmitting(true);

    const { error } = await supabase
      .from("bill_validations")
      .update({
        ai_validation_status: "valid",
        ai_validation_notes: selectedBill.ai_validation_notes 
          ? `${selectedBill.ai_validation_notes}\n\nAdmin Review: ${reviewNotes || "Approved"}`
          : `Admin Review: ${reviewNotes || "Approved"}`,
        validated_at: new Date().toISOString(),
      })
      .eq("id", selectedBill.id);

    if (error) {
      console.error("Error approving bill:", error);
      toast.error("Failed to approve bill");
    } else {
      toast.success("Bill approved successfully");
      setSelectedBill(null);
      fetchBills();
      fetchStats();
    }

    setIsSubmitting(false);
  };

  const handleReject = async () => {
    if (!selectedBill) return;
    if (!reviewNotes.trim()) {
      toast.error("Please provide rejection reason");
      return;
    }
    setIsSubmitting(true);

    const { error } = await supabase
      .from("bill_validations")
      .update({
        ai_validation_status: "invalid",
        ai_validation_notes: selectedBill.ai_validation_notes 
          ? `${selectedBill.ai_validation_notes}\n\nAdmin Review: REJECTED - ${reviewNotes}`
          : `Admin Review: REJECTED - ${reviewNotes}`,
        validated_at: new Date().toISOString(),
      })
      .eq("id", selectedBill.id);

    if (error) {
      console.error("Error rejecting bill:", error);
      toast.error("Failed to reject bill");
    } else {
      toast.success("Bill rejected");
      setSelectedBill(null);
      fetchBills();
      fetchStats();
    }

    setIsSubmitting(false);
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { variant: "default" | "destructive" | "secondary" | "outline"; label: string }> = {
      valid: { variant: "default", label: "Valid" },
      invalid: { variant: "destructive", label: "Invalid" },
      requires_review: { variant: "secondary", label: "Needs Review" },
      pending: { variant: "outline", label: "Pending" },
    };
    const { variant, label } = config[status] || { variant: "outline", label: status };
    return <Badge variant={variant}>{label}</Badge>;
  };

  const filteredBills = bills.filter((bill) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      bill.file_name.toLowerCase().includes(query) ||
      bill.ngo_name?.toLowerCase().includes(query) ||
      bill.vendor_name?.toLowerCase().includes(query)
    );
  });

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <DashboardLayout title="Bill Review" navItems={navItems} role="admin">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <Card 
          className={`cursor-pointer transition-all duration-200 ${filterStatus === "all" ? "ring-2 ring-primary" : "hover:shadow-md"}`}
          onClick={() => setFilterStatus("all")}
        >
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Bills</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer transition-all duration-200 ${filterStatus === "requires_review" ? "ring-2 ring-amber-500" : "hover:shadow-md"}`}
          onClick={() => setFilterStatus("requires_review")}
        >
          <CardContent className="p-4">
            <p className="text-xs text-amber-600">Needs Review</p>
            <p className="text-2xl font-bold text-amber-600">{stats.requiresReview}</p>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer transition-all duration-200 ${filterStatus === "pending" ? "ring-2 ring-blue-500" : "hover:shadow-md"}`}
          onClick={() => setFilterStatus("pending")}
        >
          <CardContent className="p-4">
            <p className="text-xs text-blue-600">Pending</p>
            <p className="text-2xl font-bold text-blue-600">{stats.pending}</p>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer transition-all duration-200 ${filterStatus === "valid" ? "ring-2 ring-green-500" : "hover:shadow-md"}`}
          onClick={() => setFilterStatus("valid")}
        >
          <CardContent className="p-4">
            <p className="text-xs text-green-600">Approved</p>
            <p className="text-2xl font-bold text-green-600">{stats.valid}</p>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer transition-all duration-200 ${filterStatus === "invalid" ? "ring-2 ring-red-500" : "hover:shadow-md"}`}
          onClick={() => setFilterStatus("invalid")}
        >
          <CardContent className="p-4">
            <p className="text-xs text-red-600">Rejected</p>
            <p className="text-2xl font-bold text-red-600">{stats.invalid}</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by file name, NGO, or vendor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Bills List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCheck className="w-5 h-5" />
            Bill Validations
          </CardTitle>
          <CardDescription>
            Review and approve/reject bills flagged by AI validation
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredBills.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">
              No bills found
            </p>
          ) : (
            <div className="space-y-3">
              {filteredBills.map((bill) => (
                <div
                  key={bill.id}
                  className="flex items-center justify-between p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <p className="font-medium truncate">{bill.file_name}</p>
                      {getStatusBadge(bill.ai_validation_status)}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>NGO: {bill.ngo_name}</span>
                      <span>Amount: ₹{Number(bill.amount).toLocaleString("en-IN")}</span>
                      {bill.vendor_name && <span>Vendor: {bill.vendor_name}</span>}
                    </div>
                    {bill.ai_confidence_score !== null && (
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-muted-foreground">
                          AI Confidence: {(bill.ai_confidence_score * 100).toFixed(0)}%
                        </span>
                        <Progress 
                          value={bill.ai_confidence_score * 100} 
                          className="h-1 w-24"
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewBill(bill)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Review
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Review Dialog */}
      <Dialog open={!!selectedBill} onOpenChange={(open) => !open && setSelectedBill(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileCheck className="w-5 h-5" />
              Review Bill: {selectedBill?.file_name}
            </DialogTitle>
            <DialogDescription>
              Review the bill details and AI validation notes, then approve or reject.
            </DialogDescription>
          </DialogHeader>

          {selectedBill && (
            <div className="grid md:grid-cols-2 gap-6">
              {/* Bill Image */}
              <div className="space-y-4">
                <h4 className="font-medium">Bill Image</h4>
                {billImageUrl ? (
                  <div className="border rounded-lg overflow-hidden bg-muted">
                    {selectedBill.file_name.toLowerCase().endsWith('.pdf') ? (
                      <div className="p-8 text-center">
                        <FileText className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground mb-4">PDF Document</p>
                        <Button asChild variant="outline">
                          <a href={billImageUrl} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Open PDF
                          </a>
                        </Button>
                      </div>
                    ) : (
                      <img 
                        src={billImageUrl} 
                        alt="Bill" 
                        className="w-full h-auto"
                      />
                    )}
                  </div>
                ) : (
                  <div className="border rounded-lg p-8 text-center bg-muted">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mt-2">Loading image...</p>
                  </div>
                )}
              </div>

              {/* Bill Details */}
              <div className="space-y-4">
                <h4 className="font-medium">Bill Details</h4>
                
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">NGO</span>
                    <span className="font-medium">{selectedBill.ngo_name}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Amount</span>
                    <span className="font-medium">₹{Number(selectedBill.amount).toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Vendor</span>
                    <span className="font-medium">{selectedBill.vendor_name || "Not specified"}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Bill Date</span>
                    <span className="font-medium">
                      {selectedBill.bill_date 
                        ? new Date(selectedBill.bill_date).toLocaleDateString("en-IN")
                        : "Not extracted"}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">AI Status</span>
                    {getStatusBadge(selectedBill.ai_validation_status)}
                  </div>
                  {selectedBill.ai_confidence_score !== null && (
                    <div className="py-2 border-b">
                      <div className="flex justify-between mb-1">
                        <span className="text-muted-foreground">AI Confidence</span>
                        <span className="font-medium">
                          {(selectedBill.ai_confidence_score * 100).toFixed(0)}%
                        </span>
                      </div>
                      <Progress value={selectedBill.ai_confidence_score * 100} className="h-2" />
                    </div>
                  )}
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Submitted</span>
                    <span className="font-medium">
                      {new Date(selectedBill.created_at).toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>

                {selectedBill.ai_validation_notes && (
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">AI Validation Notes</h4>
                    <div className="p-3 bg-muted rounded-lg text-sm whitespace-pre-wrap">
                      {selectedBill.ai_validation_notes}
                    </div>
                  </div>
                )}

                <div className="mt-4">
                  <h4 className="font-medium mb-2">Admin Review Notes</h4>
                  <Textarea
                    placeholder="Add notes for approval/rejection (required for rejection)..."
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setSelectedBill(null)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <XCircle className="w-4 h-4 mr-2" />
              )}
              Reject
            </Button>
            <Button
              onClick={handleApprove}
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4 mr-2" />
              )}
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
