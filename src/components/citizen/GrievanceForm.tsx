import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { AlertTriangle, Send } from "lucide-react";

const grievanceSchema = z.object({
  grievance_type: z.enum(["overpricing", "refusal_of_service", "fraud", "other"]),
  description: z.string().min(20, "Please provide at least 20 characters"),
  merchant_name: z.string().optional(),
  location: z.string().optional(),
});

type GrievanceFormData = z.infer<typeof grievanceSchema>;

export function GrievanceForm({ onSuccess }: { onSuccess?: () => void }) {
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<GrievanceFormData>({
    resolver: zodResolver(grievanceSchema),
    defaultValues: {
      grievance_type: undefined,
      description: "",
      merchant_name: "",
      location: "",
    },
  });

  const onSubmit = async (data: GrievanceFormData) => {
    if (!user) {
      toast.error("Please login to submit a grievance");
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from("grievances").insert({
        complainant_id: user.id,
        grievance_type: data.grievance_type,
        description: `${data.description}${data.merchant_name ? `\n\nMerchant: ${data.merchant_name}` : ""}${data.location ? `\nLocation: ${data.location}` : ""}`,
      });

      if (error) throw error;

      toast.success("Grievance submitted successfully. Our team will investigate.");
      form.reset();
      onSuccess?.();
    } catch (error) {
      console.error("Error submitting grievance:", error);
      toast.error("Failed to submit grievance. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-destructive" />
          Report a Grievance
        </CardTitle>
        <CardDescription>
          Report overpricing, refusal of service, or fraud. All reports go directly to the admin team.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="grievance_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type of Grievance</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select grievance type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="overpricing">Overpricing</SelectItem>
                      <SelectItem value="refusal_of_service">Refusal of Service</SelectItem>
                      <SelectItem value="fraud">Fraud / Cheating</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="merchant_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Merchant / Shop Name (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter merchant name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter location" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Describe the Issue</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Please describe what happened in detail..."
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? (
                "Submitting..."
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Submit Grievance
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
