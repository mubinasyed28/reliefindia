import { GovHeader } from "@/components/layout/GovHeader";
import { GovFooter } from "@/components/layout/GovFooter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Crown, Code, Lightbulb, Target, Heart } from "lucide-react";

const teamMembers = [
  {
    name: "Samiksha Chavan",
    role: "Team Leader",
    description: "Project architecture & strategic planning",
    isLeader: true,
  },
  {
    name: "Nikhil Kaware",
    role: "Developer",
    description: "Backend development & blockchain integration",
    isLeader: false,
  },
  {
    name: "Mubina",
    role: "Developer",
    description: "Frontend development & UI/UX design",
    isLeader: false,
  },
  {
    name: "Paris Kulkarni",
    role: "Developer",
    description: "Database design & API development",
    isLeader: false,
  },
];

export default function TeamPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <GovHeader />

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-navy-dark via-navy-blue to-navy-dark text-white py-16 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-64 h-64 bg-saffron rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-64 h-64 bg-green-india rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 relative z-10 text-center">
          <Badge className="bg-white/10 text-white mb-4">
            <Users className="w-4 h-4 mr-2" />
            Meet The Team
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Pixel Phantoms</h1>
          <p className="text-lg text-white/80 max-w-2xl mx-auto">
            The innovative minds behind RELIFEX - Building transparent disaster relief for India
          </p>
        </div>
      </section>

      {/* Problem Statement */}
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <Card className="border-primary/20">
                <CardHeader>
                  <Target className="w-8 h-8 text-primary mx-auto mb-2" />
                  <CardTitle>Problem Statement Category</CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge variant="secondary" className="text-lg px-4 py-2">
                    Bybit
                  </Badge>
                </CardContent>
              </Card>

              <Card className="border-saffron/20">
                <CardHeader>
                  <Lightbulb className="w-8 h-8 text-saffron mx-auto mb-2" />
                  <CardTitle>Problem Statement</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Emergency & Disaster Relief Stablecoin System
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Team Members */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Our Team</h2>
            <p className="text-muted-foreground">
              Passionate developers committed to transforming disaster relief in India
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {teamMembers.map((member) => (
              <Card
                key={member.name}
                className={`text-center transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${
                  member.isLeader ? "border-saffron/50 bg-gradient-to-b from-saffron/5 to-transparent" : ""
                }`}
              >
                <CardHeader>
                  <div
                    className={`w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center ${
                      member.isLeader
                        ? "bg-gradient-to-br from-saffron to-saffron/70"
                        : "bg-gradient-to-br from-primary to-primary/70"
                    }`}
                  >
                    {member.isLeader ? (
                      <Crown className="w-10 h-10 text-white" />
                    ) : (
                      <Code className="w-10 h-10 text-white" />
                    )}
                  </div>
                  <CardTitle className="text-lg">{member.name}</CardTitle>
                  <CardDescription>
                    <Badge variant={member.isLeader ? "default" : "secondary"}>
                      {member.role}
                    </Badge>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{member.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Project Vision */}
      <section className="py-16 bg-gradient-to-b from-muted/30 to-background">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <Heart className="w-12 h-12 text-red-500 mx-auto mb-6" />
            <h2 className="text-3xl font-bold mb-6">Our Vision</h2>
            <p className="text-lg text-muted-foreground mb-6">
              RELIFEX envisions a future where every rupee of disaster relief reaches those
              who need it most. Through blockchain technology, we ensure complete transparency,
              eliminate corruption, and provide real-time tracking of funds from the government
              to the last-mile beneficiary.
            </p>
            <div className="grid grid-cols-3 gap-4 mt-8">
              <div className="p-4 rounded-lg bg-primary/5">
                <p className="text-2xl font-bold text-primary">Zero</p>
                <p className="text-sm text-muted-foreground">Corruption</p>
              </div>
              <div className="p-4 rounded-lg bg-saffron/10">
                <p className="text-2xl font-bold text-saffron">100%</p>
                <p className="text-sm text-muted-foreground">Transparency</p>
              </div>
              <div className="p-4 rounded-lg bg-green-india/10">
                <p className="text-2xl font-bold text-green-india">Real-time</p>
                <p className="text-sm text-muted-foreground">Tracking</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <GovFooter />
    </div>
  );
}
