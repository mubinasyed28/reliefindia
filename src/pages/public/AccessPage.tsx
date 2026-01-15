import { GovHeader } from "@/components/layout/GovHeader";
import { GovFooter } from "@/components/layout/GovFooter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { 
  UserCog, 
  Building2, 
  Store, 
  Users,
  UserPlus,
  LogIn,
  Shield
} from "lucide-react";

export default function AccessPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <GovHeader />

      {/* Hero Section */}
      <section className="flex-1 bg-gradient-to-b from-navy-dark via-navy-blue to-navy-dark text-white py-20 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-64 h-64 bg-saffron rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-64 h-64 bg-green-india rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-12">
            <Shield className="w-16 h-16 mx-auto mb-4 text-saffron" />
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Access Portal</h1>
            <p className="text-lg text-white/80 max-w-2xl mx-auto">
              Select your role to login or register for RELIFEX
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            {/* Login Options */}
            <div className="mb-12">
              <h2 className="text-xl font-semibold mb-6 text-center flex items-center justify-center gap-2">
                <LogIn className="w-5 h-5" />
                Login
              </h2>
              <div className="grid md:grid-cols-4 gap-4">
                <Link to="/auth/admin">
                  <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer bg-white/10 border-white/20 text-white hover:bg-white/20">
                    <CardContent className="pt-6 text-center">
                      <UserCog className="w-12 h-12 mx-auto mb-3 text-red-400" />
                      <p className="font-semibold">Admin</p>
                      <p className="text-xs text-white/70 mt-1">Government Officials</p>
                    </CardContent>
                  </Card>
                </Link>

                <Link to="/auth/ngo">
                  <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer bg-white/10 border-white/20 text-white hover:bg-white/20">
                    <CardContent className="pt-6 text-center">
                      <Building2 className="w-12 h-12 mx-auto mb-3 text-blue-400" />
                      <p className="font-semibold">NGO</p>
                      <p className="text-xs text-white/70 mt-1">Relief Organizations</p>
                    </CardContent>
                  </Card>
                </Link>

                <Link to="/auth/merchant">
                  <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer bg-white/10 border-white/20 text-white hover:bg-white/20">
                    <CardContent className="pt-6 text-center">
                      <Store className="w-12 h-12 mx-auto mb-3 text-green-400" />
                      <p className="font-semibold">Merchant</p>
                      <p className="text-xs text-white/70 mt-1">Verified Vendors</p>
                    </CardContent>
                  </Card>
                </Link>

                <Link to="/auth/citizen">
                  <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer bg-white/10 border-white/20 text-white hover:bg-white/20">
                    <CardContent className="pt-6 text-center">
                      <Users className="w-12 h-12 mx-auto mb-3 text-saffron" />
                      <p className="font-semibold">Citizen</p>
                      <p className="text-xs text-white/70 mt-1">Beneficiaries</p>
                    </CardContent>
                  </Card>
                </Link>
              </div>
            </div>

            {/* Register Options */}
            <div>
              <h2 className="text-xl font-semibold mb-6 text-center flex items-center justify-center gap-2">
                <UserPlus className="w-5 h-5" />
                Register
              </h2>
              <div className="grid md:grid-cols-3 gap-4 max-w-3xl mx-auto">
                <Link to="/ngo/register">
                  <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer bg-white/5 border-white/10 text-white hover:bg-white/15">
                    <CardContent className="pt-6 text-center">
                      <UserPlus className="w-10 h-10 mx-auto mb-3 text-blue-400" />
                      <p className="font-semibold">NGO Registration</p>
                      <p className="text-xs text-white/70 mt-1">Apply for verification</p>
                    </CardContent>
                  </Card>
                </Link>

                <Link to="/merchant/register">
                  <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer bg-white/5 border-white/10 text-white hover:bg-white/15">
                    <CardContent className="pt-6 text-center">
                      <UserPlus className="w-10 h-10 mx-auto mb-3 text-green-400" />
                      <p className="font-semibold">Merchant Registration</p>
                      <p className="text-xs text-white/70 mt-1">Join as vendor</p>
                    </CardContent>
                  </Card>
                </Link>

                <Link to="/auth/citizen">
                  <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer bg-white/5 border-white/10 text-white hover:bg-white/15">
                    <CardContent className="pt-6 text-center">
                      <UserPlus className="w-10 h-10 mx-auto mb-3 text-saffron" />
                      <p className="font-semibold">Citizen Signup</p>
                      <p className="text-xs text-white/70 mt-1">Register for aid</p>
                    </CardContent>
                  </Card>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <GovFooter />
    </div>
  );
}
