import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GovHeader } from "@/components/layout/GovHeader";
import { GovFooter } from "@/components/layout/GovFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AlertTriangle, CheckCircle, ArrowRight, Building2, FileText, Phone, Clock, Loader2 } from "lucide-react";

const GOVERNMENT_COMPLIANCE_TEXT = `GOVERNMENT OF INDIA
MINISTRY OF HOME AFFAIRS
DISASTER MANAGEMENT & RELIEF FUND ADMINISTRATION

COMPLIANCE DECLARATION FOR NGO REGISTRATION UNDER RELIFEX PLATFORM

PREAMBLE:
This document constitutes a legally binding agreement between the registering Non-Governmental Organization (hereinafter referred to as "NGO") and the Government of India, represented by the Ministry of Home Affairs, Disaster Management Division (hereinafter referred to as "Authority"). By accepting this declaration, the NGO agrees to comply with all terms, conditions, and regulations specified herein.

SECTION 1: FUND UTILIZATION
1.1 All funds received through the RELIFEX platform shall be used exclusively for disaster relief purposes as defined under the National Disaster Management Act, 2005.
1.2 No portion of the funds shall be used for administrative expenses exceeding 5% (five percent) of the total allocation received.
1.3 All expenditures must be supported by valid bills, invoices, and receipts from verified merchants registered on the RELIFEX platform.
1.4 Any deviation from the approved fund utilization plan shall require prior written approval from the Authority.

SECTION 2: TRANSPARENCY AND ACCOUNTABILITY
2.1 The NGO shall maintain complete transparency in all financial transactions conducted through the platform.
2.2 All transaction records shall be maintained for a minimum period of 10 (ten) years and shall be made available for audit upon request.
2.3 The NGO agrees to real-time monitoring of all fund movements through the blockchain-based tracking system.
2.4 Quarterly financial reports shall be submitted to the Authority in the prescribed format.

SECTION 3: BENEFICIARY VERIFICATION
3.1 All beneficiary data must be verified against government records (Aadhaar, BPL lists, disaster-affected registries) before any distribution.
3.2 The NGO shall not distribute relief to any individual or family not registered in the official beneficiary database.
3.3 Any discrepancies in beneficiary data must be immediately reported to the Authority.
3.4 The NGO shall maintain photographic and documentary evidence of all distributions.

SECTION 4: POLITICAL NEUTRALITY
4.1 The NGO shall not engage in any political activities or endorse any political party, candidate, or ideology.
4.2 No relief material shall bear any political symbols, party logos, or promotional content.
4.3 Distribution of relief shall not be conditioned upon political affiliation or voting patterns.
4.4 Violation of political neutrality shall result in immediate deregistration and legal prosecution.

SECTION 5: AUDIT AND INSPECTION
5.1 Regular audit reports must be submitted to the government portal as per the schedule prescribed by the Authority.
5.2 The NGO agrees to random inspections by government officials, auditors, or authorized third parties without prior notice.
5.3 All books of accounts, records, and documents shall be made available during inspections.
5.4 The NGO shall cooperate fully with any investigation initiated by the Authority.

SECTION 6: FRAUD PREVENTION
6.1 Any suspicious activity, including but not limited to duplicate claims, unauthorized fund transfers, or beneficiary impersonation, must be immediately reported to the administration.
6.2 The NGO shall implement internal controls to prevent fraud, corruption, and misuse of funds.
6.3 All board members and key personnel must have clear criminal records verified through police verification.
6.4 The NGO acknowledges that AI-based fraud detection systems will continuously monitor all transactions.

SECTION 7: NON-DISCRIMINATION
7.1 The NGO shall not discriminate based on caste, religion, gender, age, disability, or political affiliation in the distribution of relief.
7.2 Relief distribution shall be based solely on the needs assessment conducted by authorized officials.
7.3 Any complaint of discrimination shall be investigated, and penalties may include deregistration.

SECTION 8: TOKEN RESTRICTIONS
8.1 Relief tokens received through the RELIFEX platform cannot be converted to cash under any circumstances.
8.2 Tokens shall only be used for purchasing essential commodities from verified merchants.
8.3 Any attempt to circumvent token restrictions shall be treated as fraud and prosecuted accordingly.
8.4 Expired or unused tokens shall be returned to the disaster relief fund.

SECTION 9: MERCHANT RELATIONSHIPS
9.1 All relief materials must be purchased from verified merchants registered on the RELIFEX platform only.
9.2 The NGO shall not enter into exclusive agreements with any merchant that may compromise fair pricing.
9.3 Any instance of price manipulation or collusion with merchants shall result in immediate action.

SECTION 10: LEGAL COMPLIANCE
10.1 The NGO agrees to cooperate fully with Right to Information (RTI) requests related to disaster relief activities.
10.2 The NGO shall comply with all court orders, tribunals, and legal proceedings related to its activities.
10.3 Any legal dispute shall be subject to the jurisdiction of courts in New Delhi, India.
10.4 This agreement shall be governed by the laws of India.

SECTION 11: BLOCKCHAIN IMMUTABILITY
11.1 The NGO acknowledges that all transactions are permanently recorded on the blockchain and cannot be altered or deleted.
11.2 The immutable record serves as legal evidence and may be used in any proceedings.
11.3 Any attempt to manipulate blockchain records shall be treated as a criminal offense.

SECTION 12: PENALTIES AND ENFORCEMENT
12.1 Violation of any rule specified in this declaration may result in:
    a) Temporary suspension of fund disbursements
    b) Permanent deregistration from the RELIFEX platform
    c) Recovery of misused funds with interest
    d) Criminal prosecution under applicable laws
    e) Blacklisting from all government schemes and programs

12.2 The Authority reserves the right to take immediate action without prior notice in cases of suspected fraud.
12.3 The NGO hereby waives the right to claim damages for any action taken by the Authority under this agreement.

DECLARATION:
By accepting this agreement, the authorized signatory of the NGO confirms that:
• They have read and understood all the terms and conditions specified herein.
• They have the authority to bind the organization to this agreement.
• All information provided during registration is true and accurate.
• The organization will comply with all applicable laws and regulations.
• They understand the consequences of non-compliance.

This declaration is made in accordance with the National Disaster Management Act, 2005, Foreign Contribution (Regulation) Act, 2010, and other applicable laws and regulations of the Government of India.

---
Document Version: RELIFEX/NGO/TC/2026/v1.0
Effective Date: January 1, 2026
Issuing Authority: Ministry of Home Affairs, Government of India`;

export default function NGORegister() {
  const navigate = useNavigate();
  const [step, setStep] = useState<"compliance" | "form" | "otp" | "processing" | "success">("compliance");
  const [complianceAccepted, setComplianceAccepted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [registrationId, setRegistrationId] = useState("");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  
  // OTP states
  const [otpDialogOpen, setOtpDialogOpen] = useState(false);
  const [otp, setOtp] = useState("");
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [otpTimeLeft, setOtpTimeLeft] = useState(60);

  // Form states
  const [formData, setFormData] = useState({
    ngoName: "",
    legalRegistrationNumber: "",
    officeAddress: "",
    contactEmail: "",
    contactPhone: "",
    boardMembers: "",
    bankAccountNumber: "",
    bankIfsc: "",
    bankName: "",
    password: "",
    confirmPassword: "",
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    // Clear error when user starts typing
    if (formErrors[field]) {
      setFormErrors({ ...formErrors, [field]: "" });
    }
  };

  const handleComplianceChange = (checked: boolean) => {
    setComplianceAccepted(checked);
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // NGO Name validation
    if (!formData.ngoName.trim()) {
      errors.ngoName = "NGO name is required";
    } else if (formData.ngoName.trim().length < 3) {
      errors.ngoName = "NGO name must be at least 3 characters";
    }

    // Legal registration number validation
    if (!formData.legalRegistrationNumber.trim()) {
      errors.legalRegistrationNumber = "Legal registration number is required";
    }

    // Office address validation
    if (!formData.officeAddress.trim()) {
      errors.officeAddress = "Office address is required";
    } else if (formData.officeAddress.trim().length < 20) {
      errors.officeAddress = "Please provide complete office address";
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.contactEmail.trim()) {
      errors.contactEmail = "Email is required";
    } else if (!emailRegex.test(formData.contactEmail)) {
      errors.contactEmail = "Please enter a valid email address";
    }

    // Phone validation - exactly 10 digits
    const phoneDigits = formData.contactPhone.replace(/\D/g, "");
    if (!formData.contactPhone.trim()) {
      errors.contactPhone = "Phone number is required";
    } else if (phoneDigits.length !== 10) {
      errors.contactPhone = "Phone number must be exactly 10 digits";
    }

    // Board members validation
    if (!formData.boardMembers.trim()) {
      errors.boardMembers = "Board member names are required";
    }

    // Bank name validation
    if (!formData.bankName.trim()) {
      errors.bankName = "Bank name is required";
    }

    // Account number validation
    if (!formData.bankAccountNumber.trim()) {
      errors.bankAccountNumber = "Account number is required";
    } else if (formData.bankAccountNumber.length < 9 || formData.bankAccountNumber.length > 18) {
      errors.bankAccountNumber = "Account number must be 9-18 digits";
    }

    // IFSC validation
    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
    if (!formData.bankIfsc.trim()) {
      errors.bankIfsc = "IFSC code is required";
    } else if (!ifscRegex.test(formData.bankIfsc.toUpperCase())) {
      errors.bankIfsc = "Invalid IFSC format (e.g., SBIN0001234)";
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

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!validateForm()) {
      toast.error("Please correct the errors in the form");
      return;
    }

    // Generate simulated OTP
    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(newOtp);
    setOtpTimeLeft(60);
    setOtpDialogOpen(true);
    toast.info(`Demo OTP: ${newOtp} (expires in 60 seconds)`, { duration: 10000 });
  };

  const handleVerifyOtp = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (otp !== generatedOtp) {
      toast.error("Invalid OTP. Please check and try again.");
      setOtp("");
      return;
    }

    setOtpDialogOpen(false);
    toast.success("Phone verified successfully!");
    handleSubmit();
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setStep("processing");

    try {
      // Generate registration ID and verification token
      const regId = `NGO${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      const verificationToken = `VT${Date.now().toString(36)}${Math.random().toString(36).substring(2, 8)}`.toUpperCase();

      // Create auth user for NGO
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.contactEmail.trim().toLowerCase(),
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: formData.ngoName.trim(),
            role: "ngo",
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
        // Update profile to NGO role
        await supabase
          .from("profiles")
          .update({
            role: "ngo",
            mobile: formData.contactPhone.replace(/\D/g, ""),
            full_name: formData.ngoName.trim(),
            is_verified: false,
          })
          .eq("user_id", authData.user.id);

        // Parse board members as JSON
        let boardMembersJson = [];
        try {
          boardMembersJson = formData.boardMembers.split(",").map((name) => ({ name: name.trim() }));
        } catch {
          boardMembersJson = [{ name: formData.boardMembers }];
        }

        // Create NGO record
        const { error: ngoError } = await supabase.from("ngos").insert({
          user_id: authData.user.id,
          registration_id: regId,
          verification_token: verificationToken,
          ngo_name: formData.ngoName.trim(),
          legal_registration_number: formData.legalRegistrationNumber.trim(),
          office_address: formData.officeAddress.trim(),
          contact_email: formData.contactEmail.trim().toLowerCase(),
          contact_phone: formData.contactPhone.replace(/\D/g, ""),
          board_members: boardMembersJson,
          bank_account_number: formData.bankAccountNumber.trim(),
          bank_ifsc: formData.bankIfsc.toUpperCase().trim(),
          bank_name: formData.bankName.trim(),
          compliance_accepted: true,
          status: "pending",
          trust_score: 0,
          fraud_flags: 0,
          wallet_balance: 0,
        });

        if (ngoError) {
          console.error("NGO creation error:", ngoError);
          toast.error("Failed to create NGO record. Please try again.");
          setStep("form");
          setIsLoading(false);
          return;
        }

        // Log registration in audit_logs
        await supabase.from("audit_logs").insert({
          action: "ngo_registered",
          entity_type: "ngo",
          entity_id: authData.user.id,
          details: {
            ngo_name: formData.ngoName.trim(),
            registration_id: regId,
            email: formData.contactEmail.trim().toLowerCase()
          },
        });

        // Sign out - NGO can't login until approved
        await supabase.auth.signOut();

        setRegistrationId(regId);
        setStep("success");
        toast.success("NGO registration submitted successfully!");
      }
    } catch (error: any) {
      toast.error("An error occurred during registration");
      console.error("Registration error:", error);
      setStep("form");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <GovHeader />

      <main className="flex-1 py-8 px-4 bg-muted/30">
        <div className="container mx-auto max-w-3xl">
          {step === "compliance" && (
            <Card>
              <CardHeader className="text-center border-b bg-destructive/5">
                <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-destructive" />
                </div>
                <CardTitle className="text-xl">Government Compliance Declaration</CardTitle>
                <CardDescription>
                  Read the complete terms and conditions before proceeding with NGO registration
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {/* Scrollable Terms and Conditions */}
                <div className="border rounded-lg bg-muted/30 mb-6">
                  <div className="bg-muted/50 px-4 py-2 border-b flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span className="text-sm font-medium">Official Government Document</span>
                  </div>
                  <ScrollArea className="h-[400px] p-4">
                    <pre className="whitespace-pre-wrap text-sm font-mono leading-relaxed text-foreground/90">
                      {GOVERNMENT_COMPLIANCE_TEXT}
                    </pre>
                  </ScrollArea>
                </div>

                {/* Single Checkbox Agreement */}
                <div className="border-2 border-primary/20 rounded-lg p-4 bg-primary/5">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="compliance-accept"
                      checked={complianceAccepted}
                      onCheckedChange={handleComplianceChange}
                      className="mt-0.5"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <label
                      htmlFor="compliance-accept"
                      className="text-sm leading-relaxed cursor-pointer font-medium"
                      onClick={(e) => e.stopPropagation()}
                    >
                      I have read, understood, and agree to all the government compliance rules, 
                      terms and conditions specified in this declaration. I confirm that I have 
                      the authority to bind my organization to these terms and that the information 
                      provided during registration will be true and accurate.
                    </label>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t">
                  <div className="flex items-center justify-between">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate("/")}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setStep("form")}
                      disabled={!complianceAccepted}
                      className="gap-2"
                    >
                      Proceed to Registration
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {step === "form" && (
            <Card>
              <CardHeader className="text-center border-b">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Building2 className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-xl">NGO Registration Form</CardTitle>
                <CardDescription>
                  All fields are mandatory. Documents will be verified by the administration.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <form onSubmit={handleSendOtp} className="space-y-6">
                  {/* Basic Information */}
                  <div className="form-section space-y-4">
                    <h3 className="font-semibold">Organization Details</h3>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="ngoName">NGO Name *</Label>
                        <Input
                          id="ngoName"
                          value={formData.ngoName}
                          onChange={(e) => handleInputChange("ngoName", e.target.value)}
                          placeholder="Official registered name"
                          className={formErrors.ngoName ? "border-destructive" : ""}
                        />
                        {formErrors.ngoName && (
                          <p className="text-xs text-destructive">{formErrors.ngoName}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="regNumber">Legal Registration Number *</Label>
                        <Input
                          id="regNumber"
                          value={formData.legalRegistrationNumber}
                          onChange={(e) => handleInputChange("legalRegistrationNumber", e.target.value)}
                          placeholder="e.g., 12AA/80G certificate number"
                          className={formErrors.legalRegistrationNumber ? "border-destructive" : ""}
                        />
                        {formErrors.legalRegistrationNumber && (
                          <p className="text-xs text-destructive">{formErrors.legalRegistrationNumber}</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address">Office Address *</Label>
                      <Textarea
                        id="address"
                        value={formData.officeAddress}
                        onChange={(e) => handleInputChange("officeAddress", e.target.value)}
                        placeholder="Complete registered office address"
                        rows={3}
                        className={formErrors.officeAddress ? "border-destructive" : ""}
                      />
                      {formErrors.officeAddress && (
                        <p className="text-xs text-destructive">{formErrors.officeAddress}</p>
                      )}
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div className="form-section space-y-4">
                    <h3 className="font-semibold">Contact Information</h3>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">Contact Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.contactEmail}
                          onChange={(e) => handleInputChange("contactEmail", e.target.value)}
                          placeholder="official@ngo.org"
                          className={formErrors.contactEmail ? "border-destructive" : ""}
                        />
                        {formErrors.contactEmail && (
                          <p className="text-xs text-destructive">{formErrors.contactEmail}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Contact Phone *</Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={formData.contactPhone}
                          onChange={(e) => handleInputChange("contactPhone", e.target.value.replace(/\D/g, "").slice(0, 10))}
                          placeholder="10-digit mobile number"
                          maxLength={10}
                          className={formErrors.contactPhone ? "border-destructive" : ""}
                        />
                        {formErrors.contactPhone && (
                          <p className="text-xs text-destructive">{formErrors.contactPhone}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Board Members */}
                  <div className="form-section space-y-4">
                    <h3 className="font-semibold">Board Members</h3>
                    <div className="space-y-2">
                      <Label htmlFor="boardMembers">Board Member Names *</Label>
                      <Textarea
                        id="boardMembers"
                        value={formData.boardMembers}
                        onChange={(e) => handleInputChange("boardMembers", e.target.value)}
                        placeholder="Enter names separated by commas (e.g., John Doe, Jane Smith)"
                        rows={2}
                        className={formErrors.boardMembers ? "border-destructive" : ""}
                      />
                      {formErrors.boardMembers && (
                        <p className="text-xs text-destructive">{formErrors.boardMembers}</p>
                      )}
                    </div>
                  </div>

                  {/* Bank Details */}
                  <div className="form-section space-y-4">
                    <h3 className="font-semibold">Bank Details</h3>
                    
                    <div className="space-y-2">
                      <Label htmlFor="bankName">Bank Name *</Label>
                      <Input
                        id="bankName"
                        value={formData.bankName}
                        onChange={(e) => handleInputChange("bankName", e.target.value)}
                        placeholder="Bank name"
                        className={formErrors.bankName ? "border-destructive" : ""}
                      />
                      {formErrors.bankName && (
                        <p className="text-xs text-destructive">{formErrors.bankName}</p>
                      )}
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="accountNumber">Account Number *</Label>
                        <Input
                          id="accountNumber"
                          value={formData.bankAccountNumber}
                          onChange={(e) => handleInputChange("bankAccountNumber", e.target.value.replace(/\D/g, ""))}
                          placeholder="Account number"
                          className={formErrors.bankAccountNumber ? "border-destructive" : ""}
                        />
                        {formErrors.bankAccountNumber && (
                          <p className="text-xs text-destructive">{formErrors.bankAccountNumber}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="ifsc">IFSC Code *</Label>
                        <Input
                          id="ifsc"
                          value={formData.bankIfsc}
                          onChange={(e) => handleInputChange("bankIfsc", e.target.value.toUpperCase())}
                          placeholder="e.g., SBIN0001234"
                          maxLength={11}
                          className={formErrors.bankIfsc ? "border-destructive" : ""}
                        />
                        {formErrors.bankIfsc && (
                          <p className="text-xs text-destructive">{formErrors.bankIfsc}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Account Credentials */}
                  <div className="form-section space-y-4">
                    <h3 className="font-semibold">Account Credentials</h3>
                    
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

                  <div className="flex gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setStep("compliance")}
                    >
                      Back
                    </Button>
                    <Button type="submit" className="flex-1">
                      Verify Phone & Submit
                    </Button>
                  </div>
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
                  Your NGO application is pending government verification
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-muted p-6 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">Your Registration ID</p>
                  <p className="text-2xl font-mono font-bold text-primary">{registrationId}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Save this ID to track your application status
                  </p>
                </div>

                <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-md p-4 text-sm">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div className="text-left">
                      <p className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                        Account Status: Pending Verification
                      </p>
                      <ul className="space-y-2 text-blue-700 dark:text-blue-300">
                        <li>• Your registration is under review by government officials</li>
                        <li>• Documents and organization details will be verified</li>
                        <li>• You will NOT be able to login until verified</li>
                        <li>• Upon verification, you'll receive email confirmation</li>
                        <li>• Only then will your wallet be activated for fund disbursement</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="text-left space-y-3 p-4 bg-muted/50 rounded-lg">
                  <h3 className="font-semibold">What happens next?</h3>
                  <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
                    <li>Government officials review your application (3-5 business days)</li>
                    <li>If verified, you receive email with login access</li>
                    <li>Your wallet is activated for receiving and disbursing funds</li>
                    <li>Start serving disaster-affected beneficiaries</li>
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
            <DialogTitle className="text-center">Phone Verification</DialogTitle>
            <DialogDescription className="text-center">
              Enter the OTP sent to your contact phone number
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
            
            <div className="space-y-2">
              <Label htmlFor="otp">Enter 6-digit OTP</Label>
              <Input
                id="otp"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                className="text-center text-2xl tracking-widest"
                maxLength={6}
              />
            </div>

            <Button 
              onClick={handleVerifyOtp} 
              className="w-full" 
              disabled={otp.length !== 6}
            >
              Verify & Submit
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <GovFooter />
    </div>
  );
}
