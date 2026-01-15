import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { ComplaintForm } from "@/components/complaints/ComplaintForm";
import { format } from "date-fns";
import {
  LayoutDashboard,
  History,
  QrCode,
  Store,
  HelpCircle,
  User,
  MessageSquare,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const navItems = [
  { label: "Dashboard", href: "/citizen", icon: <LayoutDashboard className="w-4 h-4" /> },
  { label: "My QR Code", href: "/citizen/qr", icon: <QrCode className="w-4 h-4" /> },
  { label: "Transactions", href: "/citizen/transactions", icon: <History className="w-4 h-4" /> },
  { label: "Nearby Merchants", href: "/citizen/merchants", icon: <Store className="w-4 h-4" /> },
  { label: "Help & Complaints", href: "/citizen/complaints", icon: <HelpCircle className="w-4 h-4" /> },
  { label: "Profile", href: "/citizen/profile", icon: <User className="w-4 h-4" /> },
];

interface Complaint {
  id: string;
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

export default function ComplaintsPage() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loadingComplaints, setLoadingComplaints] = useState(true);

  useEffect(() => {
    if (!loading && (!user || profile?.role !== "citizen")) {
      navigate("/auth/citizen");
    }
  }, [user, profile, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchComplaints();
    }
  }, [user]);

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
    <DashboardLayout title="Help & Complaints" navItems={navItems} role="citizen">
      {/* Header with Action */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold">My Complaints</h2>
          <p className="text-muted-foreground">Report and track issues with merchants or transactions</p>
        </div>
        <ComplaintForm onSuccess={fetchComplaints} />
      </div>

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
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-yellow-500" />
              <span className="text-sm text-muted-foreground">Open</span>
            </div>
            <p className="text-2xl font-bold mt-1">{stats.open}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-blue-500" />
              <span className="text-sm text-muted-foreground">In Progress</span>
            </div>
            <p className="text-2xl font-bold mt-1">{stats.inProgress}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-sm text-muted-foreground">Resolved</span>
            </div>
            <p className="text-2xl font-bold mt-1">{stats.resolved}</p>
          </CardContent>
        </Card>
      </div>

      {/* Complaints List */}
      <Card>
        <CardHeader>
          <CardTitle>Complaint History</CardTitle>
          <CardDescription>View all your submitted complaints and their status</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingComplaints ? (
            <div className="text-center py-8 text-muted-foreground">Loading complaints...</div>
          ) : complaints.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">No complaints filed yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Click "File a Complaint" to report an issue
              </p>
            </div>
          ) : (
            <Accordion type="single" collapsible className="space-y-2">
              {complaints.map((complaint) => {
                const status = statusConfig[complaint.status] || statusConfig.open;
                return (
                  <AccordionItem
                    key={complaint.id}
                    value={complaint.id}
                    className="border rounded-lg px-4"
                  >
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-left w-full pr-4">
                        <div className="flex-1">
                          <p className="font-medium">{complaint.subject}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {complaintTypeLabels[complaint.complaint_type] || complaint.complaint_type} •{" "}
                            {format(new Date(complaint.created_at), "MMM d, yyyy")}
                          </p>
                        </div>
                        <Badge variant={status.variant} className="gap-1 shrink-0">
                          {status.icon}
                          {status.label}
                        </Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-4">
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-sm font-medium mb-1">Description</h4>
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                            {complaint.description}
                          </p>
                        </div>
                        {complaint.resolution && (
                          <div className="bg-muted/50 p-3 rounded-md">
                            <h4 className="text-sm font-medium mb-1 flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-green-500" />
                              Resolution
                            </h4>
                            <p className="text-sm text-muted-foreground">{complaint.resolution}</p>
                            {complaint.resolved_at && (
                              <p className="text-xs text-muted-foreground mt-2">
                                Resolved on {format(new Date(complaint.resolved_at), "MMM d, yyyy 'at' h:mm a")}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
