import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { GovHeader } from "@/components/layout/GovHeader";
import { GovFooter } from "@/components/layout/GovFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Store, CheckCircle, Phone, Loader2, Clock, AlertTriangle, Package } from "lucide-react";

const STOCK_CATEGORIES = [
  { id: "food", label: "Food & Groceries", description: "Rice, dal, oil, vegetables, etc." },
  { id: "medicine", label: "Medicine & Healthcare", description: "First aid, medicines, hygiene products" },
  { id: "shelter", label: "Shelter Items", description: "Tarpaulin, blankets, tents, etc." },
  { id: "clothing", label: "Clothing", description: "Essential garments, footwear" },
  { id: "water", label: "Water & Sanitation", description: "Packaged water, purifiers, sanitary items" },
];

export default function MerchantRegister() {
  const navigate = useNavigate();
  const [step, setStep] = useState<"form" | "otp" | "processing" | "success">("form");
  const [isLoading, setIsLoading] = useState(false);
  const [otpDialogOpen, setOtpDialogOpen] = useState(false);
  const [otp, setOtp] = useState("");
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [otpExpiry, setOtpExpiry] = useState<Date | null>(null);
  const [otpTimeLeft, setOtpTimeLeft] = useState(60);
  const [merchantToken, setMerchantToken] = useState("");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const otpTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [formData, setFormData] = useState({
    fullName: "",
    dateOfBirth: "",
    aadhaarNumber: "",
    mobile: "",
    email: "",
    password: "",
    confirmPassword: "",
    shopName: "",
    shopAddress: "",
    shopLicense: "",
    gstNumber: "",
  });

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (otpTimerRef.current) {
        clearInterval(otpTimerRef.current);
      }
    };
  }, []);

  // OTP Timer
  useEffect(() => {
    if (otpDialogOpen && otpExpiry) {
      otpTimerRef.current = setInterval(() => {
        const now = new Date();
        const diff = Math.max(0, Math.floor((otpExpiry.getTime() - now.getTime()) / 1000));
        setOtpTimeLeft(diff);
        
        if (diff === 0) {
          if (otpTimerRef.current) {
            clearInterval(otpTimerRef.current);
          }
        }
      }, 1000);

      return () => {
        if (otpTimerRef.current) {
          clearInterval(otpTimerRef.current);
        }
      };
    }
  }, [otpDialogOpen, otpExpiry]);

  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    if (formErrors[field]) {
      setFormErrors({ ...formErrors, [field]: "" });
    }
  };

  const toggleCategory = (e: React.MouseEvent, categoryId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(c => c !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleCategoryCheckboxChange = (categoryId: string, checked: boolean) => {
    if (checked) {
      setSelectedCategories(prev => [...prev, categoryId]);
    } else {
      setSelectedCategories(prev => prev.filter(c => c !== categoryId));
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Name validation
    if (!formData.fullName.trim()) {
      errors.fullName = "Full name is required";
    } else if (formData.fullName.trim().length < 3) {
      errors.fullName = "Full name must be at least 3 characters";
    }

    // Date of birth validation
    if (!formData.dateOfBirth) {
      errors.dateOfBirth = "Date of birth is required";
    } else {
      const dob = new Date(formData.dateOfBirth);
      const age = (new Date().getFullYear() - dob.getFullYear());
      if (age < 18) {
        errors.dateOfBirth = "You must be at least 18 years old";
      }
    }

    // Aadhaar validation - exactly 12 digits
    if (!formData.aadhaarNumber) {
      errors.aadhaarNumber = "Aadhaar number is required";
    } else if (formData.aadhaarNumber.length !== 12) {
      errors.aadhaarNumber = "Aadhaar number must be exactly 12 digits";
    }

    // Mobile validation - exactly 10 digits
    const mobileDigits = formData.mobile.replace(/\D/g, "");
    if (!formData.mobile) {
      errors.mobile = "Mobile number is required";
    } else if (mobileDigits.length !== 10) {
      errors.mobile = "Mobile number must be exactly 10 digits";
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      errors.email = "Email is required";
    } else if (!emailRegex.test(formData.email)) {
      errors.email = "Please enter a valid email address";
    }

    // Password validation
    if (!formData.password) {
      errors.password = "Password is required";
    } else if (formData.password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    }

    // Confirm password
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    // Shop name validation
    if (!formData.shopName.trim()) {
      errors.shopName = "Shop name is required";
    }

    // Shop address validation
    if (!formData.shopAddress.trim()) {
      errors.shopAddress = "Shop address is required";
    } else if (formData.shopAddress.trim().length < 20) {
      errors.shopAddress = "Please provide complete shop address";
    }

    // Shop license validation
    if (!formData.shopLicense.trim()) {
      errors.shopLicense = "Shop license is required";
    }

    // Stock categories validation
    if (selectedCategories.length === 0) {
      errors.categories = "Select at least one stock category";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSendOtp = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (!validateForm()) {
      toast.error("Please correct the errors in the form");
      return;
    }

    // Generate simulated OTP (6 digits)
    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(newOtp);
    
    // Set OTP expiry to 1 minute from now
    const expiry = new Date(Date.now() + 60 * 1000);
    setOtpExpiry(expiry);
    setOtpTimeLeft(60);
    
    setOtpDialogOpen(true);
    toast.info(`Demo OTP: ${newOtp} (expires in 60 seconds)`, { duration: 10000 });
  };

  const handleResendOtp = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Generate new OTP
    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(newOtp);
    setOtp("");
    
    // Reset expiry
    const expiry = new Date(Date.now() + 60 * 1000);
    setOtpExpiry(expiry);
    setOtpTimeLeft(60);
    
    toast.info(`New OTP: ${newOtp} (expires in 60 seconds)`, { duration: 10000 });
  };

  const handleVerifyOtp = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Check if OTP expired
    if (otpTimeLeft === 0) {
      toast.error("OTP has expired. Please request a new one.");
      return;
    }

    if (otp !== generatedOtp) {
      toast.error("Invalid OTP. Please check and try again.");
      setOtp("");
      return;
    }

    setOtpDialogOpen(false);
    toast.success("Aadhaar verified successfully!");
    handleSubmit();
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setStep("processing");

    try {
      // Generate merchant token
      const token = `MER${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      setMerchantToken(token);

      // Create auth user (but merchant will not be able to login until approved)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: formData.fullName.trim(),
            role: "merchant",
          },
        },
      });

      if (authError) {
        if (authError.message.includes("already registered")) {
          toast.error("This email is already registered. Please use a different email or login.");
        } else {
          toast.error("Registration failed. Please try again.");
        }
        setStep("form");
        setIsLoading(false);
        return;
      }

      if (authData.user) {
        const mobileDigits = formData.mobile.replace(/\D/g, "");
        
        // Update profile to merchant role with mobile and is_verified = false
        const { error: profileError } = await supabase
          .from("profiles")
          .update({
            role: "merchant",
            mobile: mobileDigits,
            is_verified: false, // Not verified until admin approves
            full_name: formData.fullName.trim(),
          })
          .eq("user_id", authData.user.id);

        if (profileError) {
          console.error("Profile update error:", profileError);
        }

        // Create merchant record with PENDING status (is_active = false)
        const { error: merchantError } = await supabase.from("merchants").insert({
          user_id: authData.user.id,
          merchant_token: token,
          full_name: formData.fullName.trim(),
          date_of_birth: formData.dateOfBirth,
          aadhaar_number: formData.aadhaarNumber,
          aadhaar_verified: true,
          mobile: mobileDigits,
          shop_name: formData.shopName.trim(),
          shop_address: formData.shopAddress.trim(),
          shop_license: formData.shopLicense.trim(),
          gst_number: formData.gstNumber.trim() || null,
          stock_categories: selectedCategories,
          is_active: false, // Pending admin approval
          activation_time: null, // Will be set when admin approves
          trust_score: 0,
          performance_score: 0,
          fraud_flags: 0,
          total_redemptions: 0,
          daily_volume: 0,
        });

        if (merchantError) {
          console.error("Merchant creation error:", merchantError);
          toast.error("Failed to create merchant record. Please try again.");
          setStep("form");
          setIsLoading(false);
          return;
        }

        // Log registration in audit_logs
        await supabase.from("audit_logs").insert({
          action: "merchant_registered",
          entity_type: "merchant",
          entity_id: authData.user.id,
          details: { 
            shop_name: formData.shopName.trim(),
            merchant_token: token,
            email: formData.email.trim().toLowerCase()
          },
        });

        // Sign out the user immediately - they can't login until approved
        await supabase.auth.signOut();

        setStep("success");
        toast.success("Registration submitted for approval!");
      }
    } catch (error: any) {
      console.error("Registration error:", error);
      toast.error("An error occurred during registration");
      setStep("form");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleSendOtp();
  };

  return (
    <div className="min-h-screen flex flex-col">
      <GovHeader />

      <main className="flex-1 py-8 px-4 bg-muted/30">
        <div className="container mx-auto max-w-2xl">
          {step === "form" && (
            <Card>
              <CardHeader className="text-center border-b">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Store className="w-8 h-8 text-green-600" />
                </div>
                <CardTitle className="text-xl">Merchant Registration</CardTitle>
                <CardDescription>
                  Register your shop to accept RELIFEX relief tokens
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <form onSubmit={handleFormSubmit} className="space-y-6">
                  {/* Personal Information */}
                  <div className="form-section space-y-4">
                    <h3 className="font-semibold">Personal Information</h3>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="fullName">Full Name *</Label>
                        <Input
                          id="fullName"
                          value={formData.fullName}
                          onChange={(e) => handleInputChange("fullName", e.target.value)}
                          placeholder="As per Aadhaar"
                          className={formErrors.fullName ? "border-destructive" : ""}
                        />
                        {formErrors.fullName && (
                          <p className="text-xs text-destructive">{formErrors.fullName}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="dob">Date of Birth *</Label>
                        <Input
                          id="dob"
                          type="date"
                          value={formData.dateOfBirth}
                          onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
                          className={formErrors.dateOfBirth ? "border-destructive" : ""}
                        />
                        {formErrors.dateOfBirth && (
                          <p className="text-xs text-destructive">{formErrors.dateOfBirth}</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="aadhaar">Aadhaar Number *</Label>
                      <Input
                        id="aadhaar"
                        value={formData.aadhaarNumber}
                        onChange={(e) => handleInputChange("aadhaarNumber", e.target.value.replace(/\D/g, "").slice(0, 12))}
                        placeholder="12-digit Aadhaar number"
                        maxLength={12}
                        className={formErrors.aadhaarNumber ? "border-destructive" : ""}
                      />
                      {formErrors.aadhaarNumber && (
                        <p className="text-xs text-destructive">{formErrors.aadhaarNumber}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        OTP verification will be sent to your Aadhaar-linked mobile
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="mobile">Mobile Number *</Label>
                      <Input
                        id="mobile"
                        type="tel"
                        value={formData.mobile}
                        onChange={(e) => handleInputChange("mobile", e.target.value.replace(/\D/g, "").slice(0, 10))}
                        placeholder="10-digit mobile number"
                        maxLength={10}
                        className={formErrors.mobile ? "border-destructive" : ""}
                      />
                      {formErrors.mobile && (
                        <p className="text-xs text-destructive">{formErrors.mobile}</p>
                      )}
                    </div>
                  </div>

                  {/* Account Credentials */}
                  <div className="form-section space-y-4">
                    <h3 className="font-semibold">Account Credentials</h3>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        placeholder="your@email.com"
                        className={formErrors.email ? "border-destructive" : ""}
                      />
                      {formErrors.email && (
                        <p className="text-xs text-destructive">{formErrors.email}</p>
                      )}
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="password">Password *</Label>
                        <Input
                          id="password"
                          type="password"
                          value={formData.password}
                          onChange={(e) => handleInputChange("password", e.target.value)}
                          placeholder="Min 6 characters"
                          className={formErrors.password ? "border-destructive" : ""}
                        />
                        {formErrors.password && (
                          <p className="text-xs text-destructive">{formErrors.password}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirm Password *</Label>
                        <Input
                          id="confirmPassword"
                          type="password"
                          value={formData.confirmPassword}
                          onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                          placeholder="Confirm password"
                          className={formErrors.confirmPassword ? "border-destructive" : ""}
                        />
                        {formErrors.confirmPassword && (
                          <p className="text-xs text-destructive">{formErrors.confirmPassword}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Shop Information */}
                  <div className="form-section space-y-4">
                    <h3 className="font-semibold">Shop Information</h3>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="shopName">Shop Name *</Label>
                        <Input
                          id="shopName"
                          value={formData.shopName}
                          onChange={(e) => handleInputChange("shopName", e.target.value)}
                          placeholder="Your shop name"
                          className={formErrors.shopName ? "border-destructive" : ""}
                        />
                        {formErrors.shopName && (
                          <p className="text-xs text-destructive">{formErrors.shopName}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="shopLicense">Shop License Number *</Label>
                        <Input
                          id="shopLicense"
                          value={formData.shopLicense}
                          onChange={(e) => handleInputChange("shopLicense", e.target.value)}
                          placeholder="Trade license number"
                          className={formErrors.shopLicense ? "border-destructive" : ""}
                        />
                        {formErrors.shopLicense && (
                          <p className="text-xs text-destructive">{formErrors.shopLicense}</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="shopAddress">Shop Address *</Label>
                      <Textarea
                        id="shopAddress"
                        value={formData.shopAddress}
                        onChange={(e) => handleInputChange("shopAddress", e.target.value)}
                        placeholder="Complete shop address including city, state and PIN code"
                        className={formErrors.shopAddress ? "border-destructive" : ""}
                      />
                      {formErrors.shopAddress && (
                        <p className="text-xs text-destructive">{formErrors.shopAddress}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="gst">GST Number (Optional)</Label>
                      <Input
                        id="gst"
                        value={formData.gstNumber}
                        onChange={(e) => handleInputChange("gstNumber", e.target.value.toUpperCase())}
                        placeholder="15-digit GST number"
                      />
                    </div>
                  </div>

                  {/* Stock Categories */}
                  <div className="form-section space-y-4">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Package className="w-4 h-4" />
                      Stock Categories *
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Select the categories of relief items you can supply. Tokens will only work for allowed categories.
                    </p>
                    
                    <div className="grid gap-3">
                      {STOCK_CATEGORIES.map((category) => (
                        <div
                          key={category.id}
                          className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                            selectedCategories.includes(category.id)
                              ? "border-primary bg-primary/5"
                              : "border-muted hover:border-muted-foreground/30"
                          }`}
                          onClick={(e) => toggleCategory(e, category.id)}
                        >
                          <Checkbox
                            checked={selectedCategories.includes(category.id)}
                            onCheckedChange={(checked) => handleCategoryCheckboxChange(category.id, checked as boolean)}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <div>
                            <p className="font-medium text-sm">{category.label}</p>
                            <p className="text-xs text-muted-foreground">{category.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    {formErrors.categories && (
                      <p className="text-xs text-destructive">{formErrors.categories}</p>
                    )}
                  </div>

                  <Button type="submit" className="w-full bg-green-600 hover:bg-green-700">
                    Submit & Verify Aadhaar
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {step === "processing" && (
            <Card className="text-center py-12">
              <CardContent className="space-y-6">
                <Loader2 className="w-16 h-16 animate-spin mx-auto text-primary" />
                <div>
                  <h2 className="text-xl font-semibold mb-2">Submitting Your Application</h2>
                  <p className="text-muted-foreground">
                    Please wait while we process your registration...
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {step === "success" && (
            <Card className="text-center">
              <CardHeader>
                <div className="w-20 h-20 bg-amber-100 dark:bg-amber-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-10 h-10 text-amber-600" />
                </div>
                <CardTitle className="text-2xl">Registration Submitted</CardTitle>
                <CardDescription>
                  Your application is pending government approval
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-muted p-6 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">Your Merchant Token</p>
                  <p className="text-2xl font-mono font-bold text-primary">{merchantToken}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Save this token to track your application status
                  </p>
                </div>

                <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-md p-4 text-sm">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                    <div className="text-left">
                      <p className="font-medium text-amber-800 dark:text-amber-200 mb-2">
                        Account Status: Pending Approval
                      </p>
                      <ul className="space-y-2 text-amber-700 dark:text-amber-300">
                        <li>• Your registration is under review by government officials</li>
                        <li>• Documents and shop details will be verified</li>
                        <li>• You will NOT be able to login until approved</li>
                        <li>• Upon approval, you'll receive email confirmation</li>
                        <li>• Only then will your wallet and QR code be activated</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="text-left space-y-3 p-4 bg-muted/50 rounded-lg">
                  <h3 className="font-semibold">What happens next?</h3>
                  <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
                    <li>Admin reviews your application (1-3 business days)</li>
                    <li>If approved, you receive email with login access</li>
                    <li>Your wallet is activated for accepting payments</li>
                    <li>Start accepting relief tokens from beneficiaries</li>
                  </ol>
                </div>

                <Button onClick={() => navigate("/")} className="w-full">
                  Return to Home
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      {/* OTP Dialog */}
      <Dialog open={otpDialogOpen} onOpenChange={setOtpDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Phone className="w-6 h-6 text-primary" />
            </div>
            <DialogTitle className="text-center">Aadhaar OTP Verification</DialogTitle>
            <DialogDescription className="text-center">
              Enter the OTP sent to your Aadhaar-linked mobile number
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-md p-3 text-center">
              <p className="text-sm text-green-700 dark:text-green-300">
                <strong>Demo OTP:</strong> {generatedOtp}
              </p>
              <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                (In production, this would be sent via SMS)
              </p>
            </div>

            {/* OTP Timer */}
            <div className={`text-center p-2 rounded ${otpTimeLeft > 0 ? 'bg-muted' : 'bg-destructive/10'}`}>
              {otpTimeLeft > 0 ? (
                <p className="text-sm flex items-center justify-center gap-2">
                  <Clock className="w-4 h-4" />
                  OTP expires in <span className="font-bold">{otpTimeLeft}s</span>
                </p>
              ) : (
                <p className="text-sm text-destructive font-medium">OTP has expired</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="otp">Enter 6-digit OTP</Label>
              <Input
                id="otp"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                className="text-center text-2xl tracking-widest"
                maxLength={6}
                disabled={otpTimeLeft === 0}
              />
            </div>

            <div className="flex gap-2">
              {otpTimeLeft === 0 ? (
                <Button onClick={handleResendOtp} className="flex-1" variant="outline">
                  Resend OTP
                </Button>
              ) : (
                <Button 
                  onClick={handleVerifyOtp} 
                  className="flex-1" 
                  disabled={otp.length !== 6}
                >
                  Verify & Register
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <GovFooter />
    </div>
  );
}
