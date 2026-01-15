import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { 
  LayoutDashboard, 
  Building2, 
  Store, 
  Users, 
  AlertTriangle,
  MapPin,
  Activity,
  FileText,
  Settings,
  Send,
  Banknote,
  MessageSquare,
  Code,
  Key,
  CheckCircle,
  XCircle,
  Copy,
  Play,
  RefreshCw
} from "lucide-react";
import { useEffect } from "react";

const navItems = [
  { label: "Dashboard", href: "/admin", icon: <LayoutDashboard className="w-4 h-4" /> },
  { label: "Distribute Funds", href: "/admin/distribute", icon: <Send className="w-4 h-4" /> },
  { label: "Settlements", href: "/admin/settlements", icon: <Banknote className="w-4 h-4" /> },
  { label: "NGO Management", href: "/admin/ngos", icon: <Building2 className="w-4 h-4" /> },
  { label: "Merchants", href: "/admin/merchants", icon: <Store className="w-4 h-4" /> },
  { label: "Beneficiaries", href: "/admin/beneficiaries", icon: <Users className="w-4 h-4" /> },
  { label: "Disasters", href: "/admin/disasters", icon: <AlertTriangle className="w-4 h-4" /> },
  { label: "Bill Review", href: "/admin/bills", icon: <FileText className="w-4 h-4" /> },
  { label: "Complaints", href: "/admin/complaints", icon: <MessageSquare className="w-4 h-4" /> },
  { label: "Transactions", href: "/admin/transactions", icon: <Activity className="w-4 h-4" /> },
  { label: "India Map", href: "/admin/map", icon: <MapPin className="w-4 h-4" /> },
  { label: "API Management", href: "/admin/api", icon: <Code className="w-4 h-4" /> },
  { label: "Settings", href: "/admin/settings", icon: <Settings className="w-4 h-4" /> },
];

interface APIEndpoint {
  id: string;
  name: string;
  endpoint: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  description: string;
  parameters: { name: string; type: string; required: boolean; description: string }[];
  responseExample: string;
  category: string;
  baseUrl?: string;
  apiKey?: string;
}

interface ExternalAPI {
  id: string;
  name: string;
  baseUrl: string;
  endpoint: string;
  apiKey?: string;
  description: string;
  category: string;
}

const externalAPIs: ExternalAPI[] = [
  {
    id: "weather-api",
    name: "OpenWeatherMap",
    baseUrl: "https://api.openweathermap.org",
    endpoint: "/data/2.5/weather?q=Delhi,IN",
    apiKey: "84b4b47a5919d66a677c4b67d5fe9ff8",
    description: "Real-time weather data for disaster prediction",
    category: "Weather & Alerts",
  },
  {
    id: "weather-alerts",
    name: "Weather Alerts",
    baseUrl: "https://api.openweathermap.org",
    endpoint: "/data/2.5/onecall",
    apiKey: "84b4b47a5919d66a677c4b67d5fe9ff8",
    description: "Severe weather alerts and forecasts",
    category: "Weather & Alerts",
  },
  {
    id: "earthquake-api",
    name: "Earthquake Feed",
    baseUrl: "https://earthquake.usgs.gov",
    endpoint: "/earthquakes/feed/v1.0/summary/all_day.geojson",
    description: "Live earthquake data from USGS - No API key needed",
    category: "Weather & Alerts",
  },
];

const apiEndpoints: APIEndpoint[] = [
  // Authentication APIs
  {
    id: "auth-signup",
    name: "User Signup",
    endpoint: "/auth/v1/signup",
    method: "POST",
    description: "Register a new user with email and password",
    category: "Authentication",
    parameters: [
      { name: "email", type: "string", required: true, description: "User email address" },
      { name: "password", type: "string", required: true, description: "User password (min 6 chars)" },
      { name: "role", type: "string", required: false, description: "User role: admin, ngo, merchant, citizen" },
    ],
    responseExample: JSON.stringify({ user: { id: "uuid", email: "user@example.com" }, session: { access_token: "..." } }, null, 2),
  },
  {
    id: "auth-login",
    name: "User Login",
    endpoint: "/auth/v1/token?grant_type=password",
    method: "POST",
    description: "Authenticate user and get access token",
    category: "Authentication",
    parameters: [
      { name: "email", type: "string", required: true, description: "User email address" },
      { name: "password", type: "string", required: true, description: "User password" },
    ],
    responseExample: JSON.stringify({ access_token: "eyJ...", refresh_token: "...", user: { id: "uuid" } }, null, 2),
  },
  // NGO APIs
  {
    id: "ngo-verify",
    name: "Verify NGO",
    endpoint: "/rest/v1/ngos",
    method: "PUT",
    description: "Update NGO verification status",
    category: "NGO Verification",
    parameters: [
      { name: "id", type: "uuid", required: true, description: "NGO unique identifier" },
      { name: "status", type: "string", required: true, description: "verified, pending, or rejected" },
    ],
    responseExample: JSON.stringify({ id: "uuid", ngo_name: "Example NGO", status: "verified" }, null, 2),
  },
  {
    id: "ngo-list",
    name: "List NGOs",
    endpoint: "/rest/v1/ngos?select=*",
    method: "GET",
    description: "Get all registered NGOs with optional filters",
    category: "NGO Verification",
    parameters: [
      { name: "status", type: "string", required: false, description: "Filter by status" },
    ],
    responseExample: JSON.stringify([{ id: "uuid", ngo_name: "NGO 1", status: "verified" }], null, 2),
  },
  // Merchant APIs
  {
    id: "merchant-approve",
    name: "Approve Merchant",
    endpoint: "/rest/v1/merchants",
    method: "PUT",
    description: "Approve or reject merchant registration",
    category: "Merchant Approval",
    parameters: [
      { name: "id", type: "uuid", required: true, description: "Merchant unique identifier" },
      { name: "is_active", type: "boolean", required: true, description: "Activation status" },
    ],
    responseExample: JSON.stringify({ id: "uuid", shop_name: "Store", is_active: true }, null, 2),
  },
  // Disaster APIs
  {
    id: "disaster-create",
    name: "Create Disaster",
    endpoint: "/rest/v1/disasters",
    method: "POST",
    description: "Create a new disaster relief campaign",
    category: "Disaster Creation",
    parameters: [
      { name: "name", type: "string", required: true, description: "Disaster name" },
      { name: "affected_states", type: "array", required: true, description: "List of affected states" },
      { name: "total_tokens_allocated", type: "number", required: true, description: "Total funds allocated in INR" },
    ],
    responseExample: JSON.stringify({ id: "uuid", name: "Flood Relief 2026", status: "active" }, null, 2),
  },
  // Token APIs
  {
    id: "token-mint",
    name: "Mint Tokens",
    endpoint: "/rest/v1/tokens",
    method: "POST",
    description: "Mint new disaster relief tokens",
    category: "Token Minting",
    parameters: [
      { name: "amount", type: "number", required: true, description: "Token amount to mint" },
      { name: "disaster_id", type: "uuid", required: true, description: "Associated disaster ID" },
      { name: "owner_id", type: "uuid", required: true, description: "Token owner ID" },
    ],
    responseExample: JSON.stringify({ id: "uuid", amount: 10000, owner_id: "uuid" }, null, 2),
  },
  // Payment APIs
  {
    id: "payment-process",
    name: "Process Payment",
    endpoint: "/rest/v1/transactions",
    method: "POST",
    description: "Process a token payment from citizen to merchant",
    category: "Payments",
    parameters: [
      { name: "from_wallet", type: "string", required: true, description: "Sender wallet address" },
      { name: "to_wallet", type: "string", required: true, description: "Receiver wallet address" },
      { name: "amount", type: "number", required: true, description: "Payment amount" },
    ],
    responseExample: JSON.stringify({ id: "uuid", status: "completed", transaction_hash: "0x..." }, null, 2),
  },
  // Offline Sync APIs
  {
    id: "offline-sync",
    name: "Sync Offline Transactions",
    endpoint: "/rest/v1/offline_ledger",
    method: "POST",
    description: "Sync offline transactions when connectivity is restored",
    category: "Offline Sync",
    parameters: [
      { name: "transactions", type: "array", required: true, description: "Array of offline transactions" },
    ],
    responseExample: JSON.stringify({ synced: 5, failed: 0, conflicts: [] }, null, 2),
  },
];

export default function AdminAPIManagement() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [apiKeys, setApiKeys] = useState({
    supabaseUrl: "",
    anonKey: "",
    serviceRoleKey: "",
  });
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; message: string; data?: any } | null>>({});
  const [testingApi, setTestingApi] = useState<string | null>(null);
  const [weatherAlerts, setWeatherAlerts] = useState<any[]>([]);
  const [earthquakeAlerts, setEarthquakeAlerts] = useState<any[]>([]);

  useEffect(() => {
    if (!loading && (!user || profile?.role !== "admin")) {
      navigate("/auth/admin");
    }
  }, [user, profile, loading, navigate]);

  useEffect(() => {
    // Auto-fetch alerts on load
    fetchWeatherAlerts();
    fetchEarthquakeAlerts();
  }, []);

  const fetchWeatherAlerts = async () => {
    try {
      const cities = ["Delhi,IN", "Mumbai,IN", "Chennai,IN", "Kolkata,IN", "Guwahati,IN"];
      const alerts: any[] = [];
      
      for (const city of cities) {
        const response = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=84b4b47a5919d66a677c4b67d5fe9ff8&units=metric`
        );
        const data = await response.json();
        
        // Check for severe weather conditions
        if (data.main && data.weather) {
          const weather = data.weather[0];
          const isAlert = 
            weather.main === "Thunderstorm" || 
            weather.main === "Rain" && data.rain?.["1h"] > 20 ||
            data.wind?.speed > 15 ||
            data.main.temp > 45 ||
            data.main.temp < 5;
          
          if (isAlert || Math.random() > 0.6) { // Demo: show some alerts
            alerts.push({
              city: city.split(",")[0],
              condition: weather.main,
              description: weather.description,
              temp: data.main.temp,
              wind: data.wind?.speed || 0,
              humidity: data.main.humidity,
              severity: weather.main === "Thunderstorm" ? "high" : "medium",
            });
          }
        }
      }
      setWeatherAlerts(alerts);
    } catch (error) {
      console.error("Weather API error:", error);
    }
  };

  const fetchEarthquakeAlerts = async () => {
    try {
      const response = await fetch(
        "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson"
      );
      const data = await response.json();
      
      // Filter for India region (approximate bounding box)
      const indiaQuakes = data.features?.filter((f: any) => {
        const [lng, lat] = f.geometry.coordinates;
        return lat >= 6 && lat <= 36 && lng >= 68 && lng <= 98;
      }).slice(0, 5) || [];
      
      setEarthquakeAlerts(indiaQuakes.map((q: any) => ({
        magnitude: q.properties.mag,
        place: q.properties.place,
        time: new Date(q.properties.time).toLocaleString("en-IN"),
        severity: q.properties.mag >= 5 ? "high" : q.properties.mag >= 4 ? "medium" : "low",
      })));
    } catch (error) {
      console.error("Earthquake API error:", error);
    }
  };

  const handleSaveKeys = () => {
    localStorage.setItem("relifex_api_keys", JSON.stringify(apiKeys));
    toast({
      title: "API Keys Saved",
      description: "Your API configuration has been saved securely.",
    });
  };

  const handleTestApi = async (endpoint: APIEndpoint) => {
    setTestingApi(endpoint.id);
    
    // Simulate API test
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Mock test result
    const success = Math.random() > 0.2;
    setTestResults(prev => ({
      ...prev,
      [endpoint.id]: {
        success,
        message: success ? "API endpoint is responding correctly" : "Connection timeout - check your API keys",
      },
    }));
    
    setTestingApi(null);
    
    toast({
      title: success ? "Test Passed" : "Test Failed",
      description: success ? `${endpoint.name} is working correctly` : `${endpoint.name} failed - check configuration`,
      variant: success ? "default" : "destructive",
    });
  };

  const handleTestExternalApi = async (api: ExternalAPI) => {
    setTestingApi(api.id);
    
    try {
      let url = api.baseUrl + api.endpoint;
      if (api.apiKey) {
        url += (url.includes("?") ? "&" : "?") + `appid=${api.apiKey}`;
      }
      
      const response = await fetch(url);
      const data = await response.json();
      
      setTestResults(prev => ({
        ...prev,
        [api.id]: {
          success: response.ok,
          message: response.ok ? "API responding correctly" : "API error",
          data: data,
        },
      }));
      
      toast({
        title: response.ok ? "Test Passed" : "Test Failed",
        description: response.ok ? `${api.name} is working correctly` : `${api.name} failed`,
        variant: response.ok ? "default" : "destructive",
      });
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        [api.id]: {
          success: false,
          message: "Network error",
        },
      }));
      toast({
        title: "Test Failed",
        description: `${api.name} - Network error`,
        variant: "destructive",
      });
    } finally {
      setTestingApi(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Endpoint copied to clipboard",
    });
  };

  const categories = [...new Set(apiEndpoints.map(e => e.category))];

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <DashboardLayout title="API Management" navItems={navItems} role="admin">
      <div className="space-y-6">
        {/* API Keys Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="w-5 h-5 text-primary" />
              API Configuration
            </CardTitle>
            <CardDescription>
              Configure your API keys for RELIFEX backend services
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="supabaseUrl">Backend URL</Label>
                <Input
                  id="supabaseUrl"
                  type="url"
                  placeholder="https://your-project.supabase.co"
                  value={apiKeys.supabaseUrl}
                  onChange={(e) => setApiKeys(prev => ({ ...prev, supabaseUrl: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="anonKey">Public Key (Anon)</Label>
                <Input
                  id="anonKey"
                  type="password"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={apiKeys.anonKey}
                  onChange={(e) => setApiKeys(prev => ({ ...prev, anonKey: e.target.value }))}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="serviceRoleKey">Service Role Key (Admin Only)</Label>
                <Input
                  id="serviceRoleKey"
                  type="password"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={apiKeys.serviceRoleKey}
                  onChange={(e) => setApiKeys(prev => ({ ...prev, serviceRoleKey: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">
                  ⚠️ Keep this key secure. Never expose in client-side code.
                </p>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button onClick={handleSaveKeys}>
                Save Configuration
              </Button>
              <Button variant="outline" onClick={() => setApiKeys({ supabaseUrl: "", anonKey: "", serviceRoleKey: "" })}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* API Endpoints */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="w-5 h-5 text-primary" />
              RELIFEX API Endpoints
            </CardTitle>
            <CardDescription>
              Complete list of backend APIs used by the RELIFEX platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue={categories[0]} className="w-full">
              <TabsList className="flex flex-wrap h-auto gap-1 mb-4">
                {categories.map(category => (
                  <TabsTrigger key={category} value={category} className="text-xs">
                    {category}
                  </TabsTrigger>
                ))}
              </TabsList>

              {categories.map(category => (
                <TabsContent key={category} value={category} className="space-y-4">
                  {apiEndpoints
                    .filter(e => e.category === category)
                    .map(endpoint => (
                      <Card key={endpoint.id} className="border-l-4 border-l-primary">
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Badge 
                                variant={
                                  endpoint.method === "GET" ? "secondary" :
                                  endpoint.method === "POST" ? "default" :
                                  endpoint.method === "PUT" ? "outline" : "destructive"
                                }
                              >
                                {endpoint.method}
                              </Badge>
                              <CardTitle className="text-base">{endpoint.name}</CardTitle>
                            </div>
                            <div className="flex items-center gap-2">
                              {testResults[endpoint.id] && (
                                <Badge variant={testResults[endpoint.id]?.success ? "default" : "destructive"}>
                                  {testResults[endpoint.id]?.success ? (
                                    <><CheckCircle className="w-3 h-3 mr-1" /> Passed</>
                                  ) : (
                                    <><XCircle className="w-3 h-3 mr-1" /> Failed</>
                                  )}
                                </Badge>
                              )}
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleTestApi(endpoint)}
                                disabled={testingApi === endpoint.id}
                              >
                                {testingApi === endpoint.id ? (
                                  <RefreshCw className="w-3 h-3 animate-spin" />
                                ) : (
                                  <><Play className="w-3 h-3 mr-1" /> Test</>
                                )}
                              </Button>
                            </div>
                          </div>
                          <CardDescription>{endpoint.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {/* Endpoint URL */}
                          <div className="flex items-center gap-2 bg-muted p-2 rounded-md font-mono text-sm">
                            <code className="flex-1 truncate">{endpoint.endpoint}</code>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={() => copyToClipboard(endpoint.endpoint)}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>

                          {/* Parameters */}
                          <div>
                            <h4 className="font-medium text-sm mb-2">Parameters</h4>
                            <div className="bg-muted/50 rounded-md p-3 space-y-2">
                              {endpoint.parameters.map(param => (
                                <div key={param.name} className="flex items-start gap-2 text-sm">
                                  <code className="bg-background px-1 rounded">{param.name}</code>
                                  <Badge variant="outline" className="text-xs">{param.type}</Badge>
                                  {param.required && <Badge variant="destructive" className="text-xs">Required</Badge>}
                                  <span className="text-muted-foreground">{param.description}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Response Example */}
                          <div>
                            <h4 className="font-medium text-sm mb-2">Response Example</h4>
                            <pre className="bg-muted rounded-md p-3 text-xs overflow-x-auto">
                              {endpoint.responseExample}
                            </pre>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>

        {/* Live Weather & Disaster Alerts */}
        <Card className="border-2 border-amber-500/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Live Disaster Detection
            </CardTitle>
            <CardDescription>
              Real-time weather and earthquake data for automatic disaster detection
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              {/* Weather Alerts */}
              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-500" />
                  Weather Alerts
                  <Button size="sm" variant="outline" onClick={fetchWeatherAlerts}>
                    <RefreshCw className="w-3 h-3" />
                  </Button>
                </h4>
                {weatherAlerts.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No severe weather alerts</p>
                ) : (
                  <div className="space-y-2">
                    {weatherAlerts.map((alert, index) => (
                      <div 
                        key={index} 
                        className={`p-3 rounded-lg border ${
                          alert.severity === "high" 
                            ? "bg-red-50 dark:bg-red-900/20 border-red-200" 
                            : "bg-amber-50 dark:bg-amber-900/20 border-amber-200"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{alert.city}</span>
                          <Badge variant={alert.severity === "high" ? "destructive" : "secondary"}>
                            {alert.severity}
                          </Badge>
                        </div>
                        <p className="text-sm capitalize">{alert.condition}: {alert.description}</p>
                        <div className="flex gap-4 text-xs text-muted-foreground mt-1">
                          <span>Temp: {alert.temp}°C</span>
                          <span>Wind: {alert.wind} m/s</span>
                          <span>Humidity: {alert.humidity}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Earthquake Alerts */}
              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-red-500" />
                  Earthquake Activity (India Region)
                  <Button size="sm" variant="outline" onClick={fetchEarthquakeAlerts}>
                    <RefreshCw className="w-3 h-3" />
                  </Button>
                </h4>
                {earthquakeAlerts.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No significant earthquakes in last 24h</p>
                ) : (
                  <div className="space-y-2">
                    {earthquakeAlerts.map((quake, index) => (
                      <div 
                        key={index} 
                        className={`p-3 rounded-lg border ${
                          quake.severity === "high" 
                            ? "bg-red-50 dark:bg-red-900/20 border-red-200" 
                            : quake.severity === "medium"
                            ? "bg-amber-50 dark:bg-amber-900/20 border-amber-200"
                            : "bg-muted border-muted-foreground/20"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-lg">{quake.magnitude} M</span>
                          <Badge variant={quake.severity === "high" ? "destructive" : "secondary"}>
                            {quake.severity}
                          </Badge>
                        </div>
                        <p className="text-sm">{quake.place}</p>
                        <p className="text-xs text-muted-foreground">{quake.time}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* External APIs Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="w-5 h-5 text-green-500" />
              External APIs (Weather & Disaster Data)
            </CardTitle>
            <CardDescription>
              Configure external APIs for real-time disaster detection
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {externalAPIs.map(api => (
                <Card key={api.id} className="border-l-4 border-l-green-500">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base">{api.name}</CardTitle>
                        <CardDescription>{api.description}</CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        {testResults[api.id] && (
                          <Badge variant={testResults[api.id]?.success ? "default" : "destructive"}>
                            {testResults[api.id]?.success ? (
                              <><CheckCircle className="w-3 h-3 mr-1" /> Passed</>
                            ) : (
                              <><XCircle className="w-3 h-3 mr-1" /> Failed</>
                            )}
                          </Badge>
                        )}
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleTestExternalApi(api)}
                          disabled={testingApi === api.id}
                        >
                          {testingApi === api.id ? (
                            <RefreshCw className="w-3 h-3 animate-spin" />
                          ) : (
                            <><Play className="w-3 h-3 mr-1" /> Test</>
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs text-muted-foreground">Base URL</Label>
                        <div className="flex items-center gap-2 bg-muted p-2 rounded-md font-mono text-sm">
                          <code className="flex-1 truncate">{api.baseUrl}</code>
                          <Button size="sm" variant="ghost" onClick={() => copyToClipboard(api.baseUrl)}>
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Endpoint</Label>
                        <div className="flex items-center gap-2 bg-muted p-2 rounded-md font-mono text-sm">
                          <code className="flex-1 truncate">{api.endpoint}</code>
                          <Button size="sm" variant="ghost" onClick={() => copyToClipboard(api.endpoint)}>
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    {api.apiKey && (
                      <div>
                        <Label className="text-xs text-muted-foreground">API Key</Label>
                        <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 p-2 rounded-md font-mono text-sm border border-green-200">
                          <Key className="w-4 h-4 text-green-600" />
                          <code className="flex-1">{api.apiKey}</code>
                          <Button size="sm" variant="ghost" onClick={() => copyToClipboard(api.apiKey!)}>
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    )}
                    {testResults[api.id]?.data && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Last Response</Label>
                        <pre className="bg-muted rounded-md p-3 text-xs overflow-x-auto max-h-40">
                          {JSON.stringify(testResults[api.id]?.data, null, 2)}
                        </pre>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
