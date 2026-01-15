import { useState } from "react";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Plus } from "lucide-react";

interface ComplaintFormProps {
  onSuccess?: () => void;
}

const complaintTypes = [
  { value: "merchant_issue", label: "Merchant Issue" },
  { value: "transaction_dispute", label: "Transaction Dispute" },
  { value: "token_problem", label: "Token/Balance Problem" },
  { value: "fraud_report", label: "Fraud Report" },
  { value: "service_complaint", label: "Service Complaint" },
  { value: "other", label: "Other" },
];

export function ComplaintForm({ onSuccess }: ComplaintFormProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    complaint_type: "",
    subject: "",
    description: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error("You must be logged in to submit a complaint");
      return;
    }

    if (!formData.complaint_type || !formData.subject || !formData.description) {
      toast.error("Please fill in all fields");
      return;
    }

    if (formData.subject.length > 200) {
      toast.error("Subject must be less than 200 characters");
      return;
    }

    if (formData.description.length > 2000) {
      toast.error("Description must be less than 2000 characters");
      return;
    }

    setLoading(true);
    
    const { error } = await supabase.from("complaints").insert({
      complainant_id: user.id,
      complaint_type: formData.complaint_type,
      subject: formData.subject.trim(),
      description: formData.description.trim(),
    });

    setLoading(false);

    if (error) {
      toast.error("Failed to submit complaint: " + error.message);
      return;
    }

    toast.success("Complaint submitted successfully");
    setFormData({ complaint_type: "", subject: "", description: "" });
    setOpen(false);
    onSuccess?.();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          File a Complaint
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>File a Complaint</DialogTitle>
          <DialogDescription>
            Report an issue with a merchant, transaction, or service. We'll review your complaint and get back to you.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="complaint_type">Complaint Type *</Label>
            <Select
              value={formData.complaint_type}
              onValueChange={(value) => setFormData({ ...formData, complaint_type: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select complaint type" />
              </SelectTrigger>
              <SelectContent>
                {complaintTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Subject *</Label>
            <Input
              id="subject"
              placeholder="Brief summary of your complaint"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              maxLength={200}
            />
            <p className="text-xs text-muted-foreground">
              {formData.subject.length}/200 characters
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              placeholder="Provide detailed information about your complaint including dates, amounts, merchant names, etc."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="min-h-[120px]"
              maxLength={2000}
            />
            <p className="text-xs text-muted-foreground">
              {formData.description.length}/2000 characters
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Submitting..." : "Submit Complaint"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
