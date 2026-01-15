import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { GovHeader } from "@/components/layout/GovHeader";
import { GovFooter } from "@/components/layout/GovFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useAadhaarDuplicateCheck } from "@/hooks/useAadhaarDuplicateCheck";
import { Building2, Store, Users, UserCog, RefreshCw, AlertTriangle } from "lucide-react";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const signupSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  fullName: z.string().min(2, "Full name is required"),
  mobile: z.string().length(10, "Mobile number must be exactly 10 digits"),
  aadhaar: z.string().length(4, "Enter exactly 4 digits"),
});

const roleConfig: Record<string, {
  title: string;
  icon: typeof UserCog;
  color: string;
  bgColor: string;
  allowSignup: boolean;
  dashboardPath: string;
  registerPath?: string;
}> = {
  admin: {
    title: "Government Admin Portal",
    icon: UserCog,
    color: "text-destructive",
    bgColor: "bg-destructive/10",
    allowSignup: false,
    dashboardPath: "/admin",
  },
  ngo: {
    title: "NGO Portal",
    icon: Building2,
    color: "text-primary",
    bgColor: "bg-primary/10",
    allowSignup: false,
    dashboardPath: "/ngo",
    registerPath: "/ngo/register",
  },
  merchant: {
    title: "Merchant Portal",
    icon: Store,
    color: "text-green-600",
    bgColor: "bg-green-100 dark:bg-green-900/20",
    allowSignup: false,
    dashboardPath: "/merchant",
    registerPath: "/merchant/register",
  },
  citizen: {
    title: "Citizen Portal",
    icon: Users,
    color: "text-orange-600",
    bgColor: "bg-orange-100 dark:bg-orange-900/20",
    allowSignup: true,
    dashboardPath: "/citizen",
  },
};

export default function AuthPage() {
  const { role } = useParams<{ role: string }>();
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();
  
  const [isLoading, setIsLoading] = useState(false);
  const [captcha, setCaptcha] = useState({ a: 0, b: 0, answer: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { checkForDuplicate } = useAadhaarDuplicateCheck();

  // Form states
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupFullName, setSignupFullName] = useState("");
  const [signupMobile, setSignupMobile] = useState("");
  const [aadhaarLastFour, setAadhaarLastFour] = useState("");

  const config = roleConfig[role as keyof typeof roleConfig];

  useEffect(() => {
    generateCaptcha();
  }, []);

  useEffect(() => {
    if (!loading && user && profile) {
      // Redirect based on actual user role from database
      const userRole = profile.role as keyof typeof roleConfig;
      if (roleConfig[userRole]) {
        navigate(roleConfig[userRole].dashboardPath);
      }
    }
  }, [user, profile, loading, navigate]);

  const generateCaptcha = () => {
    const a = Math.floor(Math.random() * 10) + 1;
    const b = Math.floor(Math.random() * 10) + 1;
    setCaptcha({ a, b, answer: "" });
  };

  const validateCaptcha = () => {
    const correctAnswer = captcha.a + captcha.b;
    return parseInt(captcha.answer) === correctAnswer;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setErrors({});

    if (!validateCaptcha()) {
      toast.error("Incorrect captcha answer");
      generateCaptcha();
      return;
    }

    setIsLoading(true);
    try {
      // Check for admin hardcoded credentials (Admin ID)
      if (role === "admin" && loginEmail === "admin" && loginPassword === "admin") {
        // Try signing in with demo admin account
        const { data, error } = await supabase.auth.signInWithPassword({
          email: "admin@relifex.gov.in",
          password: "admin123456",
        });

        if (error) {
          // Create admin account if it doesn't exist
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: "admin@relifex.gov.in",
            password: "admin123456",
            options: {
              emailRedirectTo: `${window.location.origin}/`,
              data: {
                full_name: "System Administrator",
                role: "admin",
              },
            },
          });

          if (signUpError) {
            toast.error("Failed to initialize admin account");
            setIsLoading(false);
            return;
          }

          if (signUpData.user) {
            // Update the profile to admin role
            await supabase
              .from("profiles")
              .update({ role: "admin", full_name: "System Administrator" })
              .eq("user_id", signUpData.user.id);
            
            toast.success("Admin login successful!");
            navigate("/admin");
          }
        } else {
          toast.success("Admin login successful!");
          navigate("/admin");
        }
        setIsLoading(false);
        return;
      }

      // Normal email/password login
      const result = loginSchema.safeParse({ email: loginEmail, password: loginPassword });
      if (!result.success) {
        const fieldErrors: Record<string, string> = {};
        result.error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(fieldErrors);
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          toast.error("Invalid email or password");
        } else {
          toast.error(error.message);
        }
        setIsLoading(false);
        return;
      }

      if (data.user) {
        // Fetch user profile to verify role
        const { data: userProfile } = await supabase
          .from("profiles")
          .select("role, is_verified")
          .eq("user_id", data.user.id)
          .maybeSingle();

        if (!userProfile) {
          await supabase.auth.signOut();
          toast.error("User profile not found. Please contact support.");
          setIsLoading(false);
          return;
        }

        // Verify role matches expected role (except for admin which can access any)
        if (role && role !== "admin" && userProfile.role !== role) {
          await supabase.auth.signOut();
          toast.error(`This account is registered as ${userProfile.role}. Please use the correct portal.`);
          setIsLoading(false);
          return;
        }

        // Check merchant approval status
        if (userProfile.role === "merchant") {
          const { data: merchantData } = await supabase
            .from("merchants")
            .select("is_active")
            .eq("user_id", data.user.id)
            .maybeSingle();

          if (!merchantData?.is_active) {
            await supabase.auth.signOut();
            toast.error("Your merchant account is pending approval. Please wait for government verification.");
            setIsLoading(false);
            return;
          }
        }

        // Check NGO approval status
        if (userProfile.role === "ngo") {
          const { data: ngoData } = await supabase
            .from("ngos")
            .select("status")
            .eq("user_id", data.user.id)
            .maybeSingle();

          if (!ngoData || ngoData.status !== "verified") {
            await supabase.auth.signOut();
            toast.error("Your NGO account is pending verification. Please wait for government approval.");
            setIsLoading(false);
            return;
          }
        }

        toast.success("Login successful");
        
        // Redirect based on actual role from database
        const dashboardPath = roleConfig[userProfile.role as keyof typeof roleConfig]?.dashboardPath;
        if (dashboardPath) {
          navigate(dashboardPath);
        }
      }
    } catch (error: any) {
      toast.error("An error occurred during login");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setErrors({});

    if (!validateCaptcha()) {
      toast.error("Incorrect captcha answer");
      generateCaptcha();
      return;
    }

    // Validate mobile - exactly 10 digits
    const mobileDigits = signupMobile.replace(/\D/g, "");
    if (mobileDigits.length !== 10) {
      setErrors({ mobile: "Mobile number must be exactly 10 digits" });
      return;
    }

    const result = signupSchema.safeParse({
      email: signupEmail,
      password: signupPassword,
      fullName: signupFullName,
      mobile: mobileDigits,
      aadhaar: aadhaarLastFour,
    });

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    if (!/^\d{4}$/.test(aadhaarLastFour)) {
      setErrors({ aadhaar: "Enter exactly 4 digits of Aadhaar" });
      return;
    }

    setIsLoading(true);
    try {
      // Check for duplicate Aadhaar BEFORE registration
      const duplicateResult = await checkForDuplicate(aadhaarLastFour, mobileDigits, false);
      
      if (duplicateResult.isDuplicate) {
        toast.error(
          "Duplicate Aadhaar Detected",
          {
            description: "This Aadhaar + mobile combination is already registered. If you believe this is an error, please contact support.",
            duration: 8000,
          }
        );
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email: signupEmail.trim().toLowerCase(),
        password: signupPassword,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: signupFullName.trim(),
            role: "citizen",
          },
        },
      });

      if (error) {
        if (error.message.includes("already registered")) {
          toast.error("This email is already registered. Please login instead.");
        } else {
          toast.error(error.message);
        }
        return;
      }

      if (data.user) {
        // Generate wallet address
        const { data: walletData } = await supabase.rpc("generate_wallet_address");
        const walletAddress = walletData || `RLX${Math.random().toString(16).slice(2, 34).toUpperCase()}`;

        // Update profile with additional info
        await supabase
          .from("profiles")
          .update({
            mobile: mobileDigits,
            aadhaar_last_four: aadhaarLastFour,
            wallet_address: walletAddress,
            is_verified: true,
          })
          .eq("user_id", data.user.id);

        // Log registration in audit_logs
        await supabase.from("audit_logs").insert({
          action: "citizen_registered",
          entity_type: "citizen",
          entity_id: data.user.id,
          details: { email: signupEmail.trim().toLowerCase() },
        });

        toast.success("Registration successful! Welcome to RELIFEX.");
      }
    } catch (error: any) {
      toast.error("An error occurred during registration");
    } finally {
      setIsLoading(false);
    }
  };

  if (!config) {
    return (
      <div className="min-h-screen flex flex-col">
        <GovHeader />
        <div className="flex-1 flex items-center justify-center">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle>Invalid Portal</CardTitle>
              <CardDescription>The portal you're looking for doesn't exist.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link to="/">Return to Home</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
        <GovFooter />
      </div>
    );
  }

  const Icon = config.icon;

  return (
    <div className="min-h-screen flex flex-col">
      <GovHeader />
      
      <main className="flex-1 flex items-center justify-center py-12 px-4 bg-muted/30">
        <Card className="w-full max-w-md animate-scale-in">
          <CardHeader className="text-center">
            <div className={`w-16 h-16 ${config.bgColor} rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce-subtle`}>
              <Icon className={`w-8 h-8 ${config.color}`} />
            </div>
            <CardTitle className="text-xl animate-fade-in">{config.title}</CardTitle>
            <CardDescription className="animate-fade-in animate-delay-100">
              {config.allowSignup ? "Login or create a new account" : "Login to access your dashboard"}
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {config.allowSignup ? (
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="login">Login</TabsTrigger>
                  <TabsTrigger value="signup">Sign Up</TabsTrigger>
                </TabsList>
                
                <TabsContent value="login">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email">Email</Label>
                      <Input
                        id="login-email"
                        type="email"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder="your@email.com"
                        required
                      />
                      {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="login-password">Password</Label>
                      <Input
                        id="login-password"
                        type="password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                      />
                      {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                    </div>

                    {/* Captcha */}
                    <div className="space-y-2">
                      <Label>Security Check: What is {captcha.a} + {captcha.b}?</Label>
                      <div className="flex gap-2">
                        <Input
                          type="text"
                          value={captcha.answer}
                          onChange={(e) => setCaptcha({ ...captcha, answer: e.target.value.replace(/\D/g, "") })}
                          placeholder="Answer"
                          required
                        />
                        <Button type="button" variant="outline" size="icon" onClick={generateCaptcha}>
                          <RefreshCw className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? "Logging in..." : "Login"}
                    </Button>
                  </form>
                </TabsContent>
                
                <TabsContent value="signup">
                  <form onSubmit={handleSignup} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-name">Full Name</Label>
                      <Input
                        id="signup-name"
                        type="text"
                        value={signupFullName}
                        onChange={(e) => setSignupFullName(e.target.value)}
                        placeholder="As per Aadhaar"
                        required
                      />
                      {errors.fullName && <p className="text-sm text-destructive">{errors.fullName}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        placeholder="your@email.com"
                        required
                      />
                      {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="signup-mobile">Mobile Number</Label>
                      <Input
                        id="signup-mobile"
                        type="tel"
                        value={signupMobile}
                        onChange={(e) => setSignupMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
                        placeholder="10 digit mobile number"
                        maxLength={10}
                        required
                      />
                      {errors.mobile && <p className="text-sm text-destructive">{errors.mobile}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="aadhaar">Last 4 digits of Aadhaar</Label>
                      <Input
                        id="aadhaar"
                        type="text"
                        maxLength={4}
                        value={aadhaarLastFour}
                        onChange={(e) => setAadhaarLastFour(e.target.value.replace(/\D/g, "").slice(0, 4))}
                        placeholder="XXXX"
                        required
                      />
                      {errors.aadhaar && <p className="text-sm text-destructive">{errors.aadhaar}</p>}
                      <p className="text-xs text-muted-foreground">
                        DigiLocker verification simulated for demo
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Password</Label>
                      <Input
                        id="signup-password"
                        type="password"
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        placeholder="Min 6 characters"
                        required
                      />
                      {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                    </div>

                    {/* Captcha */}
                    <div className="space-y-2">
                      <Label>Security Check: What is {captcha.a} + {captcha.b}?</Label>
                      <div className="flex gap-2">
                        <Input
                          type="text"
                          value={captcha.answer}
                          onChange={(e) => setCaptcha({ ...captcha, answer: e.target.value.replace(/\D/g, "") })}
                          placeholder="Answer"
                          required
                        />
                        <Button type="button" variant="outline" size="icon" onClick={generateCaptcha}>
                          <RefreshCw className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700" disabled={isLoading}>
                      {isLoading ? "Creating Account..." : "Create Account"}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            ) : (
              <form onSubmit={handleLogin} className="space-y-4">
                {role === "admin" && (
                  <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 mb-4 animate-fade-in">
                    <p className="text-sm text-primary font-medium">🔐 Demo Admin Credentials</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Admin ID: <code className="bg-muted px-1 rounded">admin</code> | 
                      Password: <code className="bg-muted px-1 rounded">admin</code>
                    </p>
                  </div>
                )}

                {role === "merchant" && (
                  <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 mb-4">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5" />
                      <div>
                        <p className="text-sm text-amber-800 dark:text-amber-200 font-medium">Important</p>
                        <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                          You can only login after your registration is approved by the government.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {role === "ngo" && (
                  <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-4">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-blue-600 mt-0.5" />
                      <div>
                        <p className="text-sm text-blue-800 dark:text-blue-200 font-medium">Important</p>
                        <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                          You can only login after your NGO registration is verified by the government.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="login-email">
                    {role === "admin" ? "Admin ID or Email" : "Email"}
                  </Label>
                  <Input
                    id="login-email"
                    type={role === "admin" ? "text" : "email"}
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder={role === "admin" ? "admin or email" : "your@email.com"}
                    required
                  />
                  {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <Input
                    id="login-password"
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                  {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                </div>

                {/* Captcha */}
                <div className="space-y-2">
                  <Label>Security Check: What is {captcha.a} + {captcha.b}?</Label>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      value={captcha.answer}
                      onChange={(e) => setCaptcha({ ...captcha, answer: e.target.value.replace(/\D/g, "") })}
                      placeholder="Answer"
                      required
                    />
                    <Button type="button" variant="outline" size="icon" onClick={generateCaptcha}>
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Logging in..." : "Login"}
                </Button>

                {/* Registration Link */}
                {(role === "ngo" || role === "merchant") && config.registerPath && (
                  <div className="text-center pt-4 border-t">
                    <p className="text-sm text-muted-foreground mb-2">
                      Don't have an account?
                    </p>
                    <Button asChild variant="outline" className="w-full">
                      <Link to={config.registerPath}>
                        Register as {role === "ngo" ? "NGO" : "Merchant"}
                      </Link>
                    </Button>
                  </div>
                )}
              </form>
            )}
          </CardContent>
        </Card>
      </main>
      
      <GovFooter />
    </div>
  );
}
