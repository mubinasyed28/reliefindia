import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Gift, Heart, IndianRupee, CheckCircle, Smartphone, ArrowLeft, Loader2 } from "lucide-react";

const donationSchema = z.object({
  donor_name: z.string().optional(),
  donor_email: z.string().email("Valid email is required").optional().or(z.literal("")),
  donor_phone: z.string().optional(),
  amount: z.number().min(100, "Minimum donation is ₹100"),
  disaster_id: z.string().optional(),
  is_anonymous: z.boolean().default(false),
});

type DonationFormData = z.infer<typeof donationSchema>;

interface Disaster {
  id: string;
  name: string;
}

type Step = "form" | "upi" | "processing" | "success";

export function DonateButton() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("form");
  const [upiId, setUpiId] = useState("");
  const [disasters, setDisasters] = useState<Disaster[]>([]);
  const [formData, setFormData] = useState<DonationFormData | null>(null);

  useEffect(() => {
    fetchDisasters();
  }, []);

  useEffect(() => {
    if (!open) {
      setStep("form");
      setUpiId("");
      setFormData(null);
    }
  }, [open]);

  const fetchDisasters = async () => {
    const { data } = await supabase
      .from("disasters")
      .select("id, name")
      .eq("status", "active");
    setDisasters(data || []);
  };

  const form = useForm<DonationFormData>({
    resolver: zodResolver(donationSchema),
    defaultValues: {
      donor_name: "",
      donor_email: "",
      donor_phone: "",
      amount: 1000,
      disaster_id: undefined,
      is_anonymous: false,
    },
  });

  const isAnonymous = form.watch("is_anonymous");

  const onSubmitForm = (data: DonationFormData) => {
    setFormData(data);
    setStep("upi");
  };

  const handleUpiPayment = async () => {
    if (!upiId || !upiId.includes("@")) {
      toast.error("Please enter a valid UPI ID");
      return;
    }

    setStep("processing");

    // Simulate UPI processing
    await new Promise((resolve) => setTimeout(resolve, 2500));

    try {
      const paymentRef = `UPI${Date.now()}${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      
      const { error } = await supabase.from("donations").insert({
        donor_name: formData?.is_anonymous ? null : formData?.donor_name || null,
        donor_email: formData?.donor_email || null,
        donor_phone: formData?.donor_phone || null,
        amount: formData?.amount || 0,
        disaster_id: formData?.disaster_id || null,
        is_anonymous: formData?.is_anonymous || false,
        payment_status: "completed",
        payment_reference: paymentRef,
      });

      if (error) throw error;

      setStep("success");
      
      // Auto close after success
      setTimeout(() => {
        setOpen(false);
        form.reset();
      }, 3000);

    } catch (error) {
      console.error("Error:", error);
      toast.error("Payment failed. Please try again.");
      setStep("upi");
    }
  };

  const presetAmounts = [500, 1000, 2500, 5000, 10000];

  const renderStep = () => {
    switch (step) {
      case "form":
        return (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-red-500" />
                Support Disaster Relief
              </DialogTitle>
              <DialogDescription>
                Your donation helps provide essential relief to those affected by disasters
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmitForm)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Donation Amount</FormLabel>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {presetAmounts.map((amt) => (
                          <Button
                            key={amt}
                            type="button"
                            variant={field.value === amt ? "default" : "outline"}
                            size="sm"
                            onClick={() => field.onChange(amt)}
                          >
                            ₹{amt.toLocaleString("en-IN")}
                          </Button>
                        ))}
                      </div>
                      <FormControl>
                        <div className="relative">
                          <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            type="number"
                            placeholder="Enter amount"
                            className="pl-10"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {disasters.length > 0 && (
                  <FormField
                    control={form.control}
                    name="disaster_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Donate to Specific Disaster (Optional)</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="General Relief Fund" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="">General Relief Fund</SelectItem>
                            {disasters.map((d) => (
                              <SelectItem key={d.id} value={d.id}>
                                {d.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="is_anonymous"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="font-normal cursor-pointer">
                        Donate anonymously
                      </FormLabel>
                    </FormItem>
                  )}
                />

                {!isAnonymous && (
                  <>
                    <FormField
                      control={form.control}
                      name="donor_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Your Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="donor_email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="your@email.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="donor_phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone</FormLabel>
                            <FormControl>
                              <Input placeholder="+91 98765 43210" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </>
                )}

                <Button type="submit" className="w-full bg-green-india hover:bg-green-india/90">
                  Continue to Payment →
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  All donations are tax-deductible under Section 80G of the Income Tax Act
                </p>
              </form>
            </Form>
          </>
        );

      case "upi":
        return (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-primary" />
                Pay via UPI
              </DialogTitle>
              <DialogDescription>
                Enter your UPI ID to complete the donation
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Amount Display */}
              <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                <CardContent className="pt-6 text-center">
                  <p className="text-sm text-muted-foreground mb-1">Amount to Pay</p>
                  <p className="text-4xl font-bold text-primary">
                    ₹{formData?.amount.toLocaleString("en-IN")}
                  </p>
                  {formData?.disaster_id && (
                    <p className="text-sm text-muted-foreground mt-2">
                      For: {disasters.find(d => d.id === formData.disaster_id)?.name || "Disaster Relief"}
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* UPI ID Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Enter UPI ID</label>
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="yourname@upi"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    className="text-lg h-12"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Example: mobilenumber@ybl, username@paytm, etc.
                </p>
              </div>

              {/* Supported Apps */}
              <div className="flex justify-center gap-4 py-2">
                <div className="text-center">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-1">
                    <span className="text-xs font-bold text-green-600">GPay</span>
                  </div>
                </div>
                <div className="text-center">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-1">
                    <span className="text-xs font-bold text-blue-600">Paytm</span>
                  </div>
                </div>
                <div className="text-center">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-1">
                    <span className="text-xs font-bold text-purple-600">PhonePe</span>
                  </div>
                </div>
                <div className="text-center">
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-1">
                    <span className="text-xs font-bold text-orange-600">BHIM</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep("form")}
                  className="flex-1"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button
                  onClick={handleUpiPayment}
                  className="flex-1 bg-green-india hover:bg-green-india/90"
                >
                  Pay ₹{formData?.amount.toLocaleString("en-IN")}
                </Button>
              </div>
            </div>
          </>
        );

      case "processing":
        return (
          <div className="py-12 text-center space-y-6">
            <div className="relative">
              <div className="w-20 h-20 border-4 border-primary/30 rounded-full mx-auto" />
              <Loader2 className="w-20 h-20 text-primary animate-spin absolute top-0 left-1/2 -translate-x-1/2" />
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Processing Payment</h3>
              <p className="text-muted-foreground">Please wait while we verify your payment...</p>
              <p className="text-sm text-muted-foreground mt-2">UPI ID: {upiId}</p>
            </div>
          </div>
        );

      case "success":
        return (
          <div className="py-12 text-center space-y-6">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto animate-bounce-subtle">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2 text-green-600">Payment Successful!</h3>
              <p className="text-muted-foreground mb-4">
                Thank you for your generous donation of ₹{formData?.amount.toLocaleString("en-IN")}
              </p>
              <Card className="bg-muted/50 max-w-xs mx-auto">
                <CardContent className="pt-4 text-sm">
                  <p className="text-muted-foreground">Your contribution will be converted to disaster relief tokens and used to help those in need.</p>
                </CardContent>
              </Card>
            </div>
          </div>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="bg-green-india hover:bg-green-india/90 text-white">
          <Gift className="w-4 h-4 mr-2" />
          Donate to Relief
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        {renderStep()}
      </DialogContent>
    </Dialog>
  );
}
