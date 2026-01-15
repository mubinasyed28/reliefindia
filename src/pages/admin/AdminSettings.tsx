import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { DemoModeTab } from "@/components/admin/DemoModeTab";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
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
  Bell,
  Shield,
  Database,
  Mail,
  Globe,
  Lock,
  UserCog,
  Edit,
  Search,
  MessageSquare,
  Save,
  RefreshCw
} from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/admin", icon: <LayoutDashboard className="w-4 h-4" /> },
  { label: "NGO Management", href: "/admin/ngos", icon: <Building2 className="w-4 h-4" /> },
  { label: "Merchants", href: "/admin/merchants", icon: <Store className="w-4 h-4" /> },
  { label: "Beneficiaries", href: "/admin/beneficiaries", icon: <Users className="w-4 h-4" /> },
  { label: "Disasters", href: "/admin/disasters", icon: <AlertTriangle className="w-4 h-4" /> },
  { label: "Bill Review", href: "/admin/bills", icon: <FileText className="w-4 h-4" /> },
  { label: "Complaints", href: "/admin/complaints", icon: <MessageSquare className="w-4 h-4" /> },
  { label: "Transactions", href: "/admin/transactions", icon: <Activity className="w-4 h-4" /> },
  { label: "India Map", href: "/admin/map", icon: <MapPin className="w-4 h-4" /> },
  { label: "Settings", href: "/admin/settings", icon: <Settings className="w-4 h-4" /> },
];

interface NotificationSettings {
  emailNotifications: boolean;
  disasterAlerts: boolean;
  ngoApprovals: boolean;
  merchantRegistrations: boolean;
  transactionAlerts: boolean;
  fraudAlerts: boolean;
  dailyReports: boolean;
  weeklyReports: boolean;
}

interface SystemConfig {
  defaultTokensPerBeneficiary: number;
  maxSpendingLimit: number;
  offlineSyncWindow: number;
  billVerificationThreshold: number;
  fraudAlertThreshold: number;
  sessionTimeout: number;
}

interface AdminUser {
  id: string;
  full_name: string | null;
  user_id: string;
  role: string;
  created_at: string | null;
  is_verified: boolean | null;
}

export default function AdminSettings() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);

  const [notifications, setNotifications] = useState<NotificationSettings>({
    emailNotifications: true,
    disasterAlerts: true,
    ngoApprovals: true,
    merchantRegistrations: true,
    transactionAlerts: false,
    fraudAlerts: true,
    dailyReports: false,
    weeklyReports: true,
  });

  const [systemConfig, setSystemConfig] = useState<SystemConfig>({
    defaultTokensPerBeneficiary: 5000,
    maxSpendingLimit: 15000,
    offlineSyncWindow: 24,
    billVerificationThreshold: 80,
    fraudAlertThreshold: 3,
    sessionTimeout: 30,
  });

  useEffect(() => {
    if (!loading && (!user || profile?.role !== "admin")) {
      navigate("/auth/admin");
    }
  }, [user, profile, loading, navigate]);

  useEffect(() => {
    if (user && profile?.role === "admin") {
      fetchAdminUsers();
    }
  }, [user, profile]);

  const fetchAdminUsers = async () => {
    setLoadingUsers(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, user_id, role, created_at, is_verified")
      .eq("role", "admin");

    if (!error && data) {
      setAdminUsers(data);
    }
    setLoadingUsers(false);
  };

  const handleNotificationChange = (key: keyof NotificationSettings) => {
    setNotifications((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSystemConfigChange = (key: keyof SystemConfig, value: number) => {
    setSystemConfig((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const saveNotificationSettings = async () => {
    setSavingSettings(true);
    // In a real app, this would save to the database
    await new Promise((resolve) => setTimeout(resolve, 1000));
    toast.success("Notification settings saved successfully");
    setSavingSettings(false);
  };

  const saveSystemConfig = async () => {
    setSavingSettings(true);
    // In a real app, this would save to the database
    await new Promise((resolve) => setTimeout(resolve, 1000));
    toast.success("System configuration saved successfully");
    setSavingSettings(false);
  };

  const filteredUsers = adminUsers.filter(
    (user) =>
      user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.user_id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <DashboardLayout title="Admin Settings" navItems={navItems} role="admin">
      <Tabs defaultValue="notifications" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 max-w-2xl">
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2">
            <Database className="w-4 h-4" />
            System
          </TabsTrigger>
          <TabsTrigger value="demo" className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Demo Mode
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <UserCog className="w-4 h-4" />
            Users
          </TabsTrigger>
        </TabsList>

        {/* Notification Preferences Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-primary" />
                Email Notifications
              </CardTitle>
              <CardDescription>
                Configure which email notifications you want to receive
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="email-notifications">Enable Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Master toggle for all email notifications
                  </p>
                </div>
                <Switch
                  id="email-notifications"
                  checked={notifications.emailNotifications}
                  onCheckedChange={() => handleNotificationChange("emailNotifications")}
                />
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="text-sm font-medium">Alert Types</h4>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Disaster Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      New disasters and emergency updates
                    </p>
                  </div>
                  <Switch
                    checked={notifications.disasterAlerts}
                    onCheckedChange={() => handleNotificationChange("disasterAlerts")}
                    disabled={!notifications.emailNotifications}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>NGO Approvals</Label>
                    <p className="text-sm text-muted-foreground">
                      New NGO registration requests
                    </p>
                  </div>
                  <Switch
                    checked={notifications.ngoApprovals}
                    onCheckedChange={() => handleNotificationChange("ngoApprovals")}
                    disabled={!notifications.emailNotifications}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Merchant Registrations</Label>
                    <p className="text-sm text-muted-foreground">
                      New merchant registration alerts
                    </p>
                  </div>
                  <Switch
                    checked={notifications.merchantRegistrations}
                    onCheckedChange={() => handleNotificationChange("merchantRegistrations")}
                    disabled={!notifications.emailNotifications}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Transaction Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      High-value transaction notifications
                    </p>
                  </div>
                  <Switch
                    checked={notifications.transactionAlerts}
                    onCheckedChange={() => handleNotificationChange("transactionAlerts")}
                    disabled={!notifications.emailNotifications}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-destructive">Fraud Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      Suspicious activity detection
                    </p>
                  </div>
                  <Switch
                    checked={notifications.fraudAlerts}
                    onCheckedChange={() => handleNotificationChange("fraudAlerts")}
                    disabled={!notifications.emailNotifications}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="text-sm font-medium">Scheduled Reports</h4>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Daily Reports</Label>
                    <p className="text-sm text-muted-foreground">
                      Daily summary of activities
                    </p>
                  </div>
                  <Switch
                    checked={notifications.dailyReports}
                    onCheckedChange={() => handleNotificationChange("dailyReports")}
                    disabled={!notifications.emailNotifications}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Weekly Reports</Label>
                    <p className="text-sm text-muted-foreground">
                      Weekly analytics and insights
                    </p>
                  </div>
                  <Switch
                    checked={notifications.weeklyReports}
                    onCheckedChange={() => handleNotificationChange("weeklyReports")}
                    disabled={!notifications.emailNotifications}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={saveNotificationSettings} disabled={savingSettings}>
                  {savingSettings ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Settings
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Configuration Tab */}
        <TabsContent value="system" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  Token Configuration
                </CardTitle>
                <CardDescription>
                  Configure default token allocation settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="default-tokens">Default Tokens per Beneficiary (₹)</Label>
                  <Input
                    id="default-tokens"
                    type="number"
                    value={systemConfig.defaultTokensPerBeneficiary}
                    onChange={(e) =>
                      handleSystemConfigChange("defaultTokensPerBeneficiary", Number(e.target.value))
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Default amount allocated to new beneficiaries
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max-spending">Maximum Spending Limit (₹)</Label>
                  <Input
                    id="max-spending"
                    type="number"
                    value={systemConfig.maxSpendingLimit}
                    onChange={(e) =>
                      handleSystemConfigChange("maxSpendingLimit", Number(e.target.value))
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Maximum tokens a beneficiary can spend
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-primary" />
                  Sync Settings
                </CardTitle>
                <CardDescription>
                  Configure offline sync and verification
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="sync-window">Offline Sync Window (hours)</Label>
                  <Input
                    id="sync-window"
                    type="number"
                    value={systemConfig.offlineSyncWindow}
                    onChange={(e) =>
                      handleSystemConfigChange("offlineSyncWindow", Number(e.target.value))
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Time allowed for offline transactions before sync
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bill-threshold">Bill Verification Threshold (%)</Label>
                  <Input
                    id="bill-threshold"
                    type="number"
                    value={systemConfig.billVerificationThreshold}
                    onChange={(e) =>
                      handleSystemConfigChange("billVerificationThreshold", Number(e.target.value))
                    }
                    min={0}
                    max={100}
                  />
                  <p className="text-xs text-muted-foreground">
                    AI confidence threshold for auto-approval
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="w-5 h-5" />
                  Security Settings
                </CardTitle>
                <CardDescription>
                  Configure fraud detection and security
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fraud-threshold">Fraud Alert Threshold</Label>
                  <Input
                    id="fraud-threshold"
                    type="number"
                    value={systemConfig.fraudAlertThreshold}
                    onChange={(e) =>
                      handleSystemConfigChange("fraudAlertThreshold", Number(e.target.value))
                    }
                    min={1}
                    max={10}
                  />
                  <p className="text-xs text-muted-foreground">
                    Number of suspicious activities before alert
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="session-timeout">Session Timeout (minutes)</Label>
                  <Input
                    id="session-timeout"
                    type="number"
                    value={systemConfig.sessionTimeout}
                    onChange={(e) =>
                      handleSystemConfigChange("sessionTimeout", Number(e.target.value))
                    }
                    min={5}
                    max={120}
                  />
                  <p className="text-xs text-muted-foreground">
                    Auto-logout after inactivity
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5 text-primary" />
                  System Health
                </CardTitle>
                <CardDescription>Current system status</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Database Status</span>
                  <Badge variant="default" className="bg-green-600">Online</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Edge Functions</span>
                  <Badge variant="default" className="bg-green-600">Active</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Email Service</span>
                  <Badge variant="default" className="bg-green-600">Connected</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Map Service</span>
                  <Badge variant="default" className="bg-green-600">Connected</Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end">
            <Button onClick={saveSystemConfig} disabled={savingSettings}>
              {savingSettings ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Configuration
                </>
              )}
            </Button>
          </div>
        </TabsContent>

        {/* Demo Mode Tab */}
        <DemoModeTab />

        {/* User Management Tab */}
        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCog className="w-5 h-5 text-primary" />
                Admin Users
              </CardTitle>
              <CardDescription>
                Manage admin users and their permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="relative max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {loadingUsers ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No admin users found
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredUsers.map((adminUser) => (
                    <div
                      key={adminUser.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <UserCog className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {adminUser.full_name || "Unknown Admin"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            ID: {adminUser.user_id.slice(0, 8)}...
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={adminUser.is_verified ? "default" : "secondary"}>
                          {adminUser.is_verified ? "Verified" : "Pending"}
                        </Badge>
                        <Badge variant="outline" className="capitalize">
                          {adminUser.role}
                        </Badge>
                        <div className="flex gap-2">
                          <Button size="sm" variant="ghost">
                            <Edit className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-primary" />
                Access Control
              </CardTitle>
              <CardDescription>
                Configure role-based access control settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-primary" />
                    Admin Role
                  </h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Full system access</li>
                    <li>• Manage disasters & funds</li>
                    <li>• Approve NGOs & merchants</li>
                    <li>• View all transactions</li>
                    <li>• Access audit logs</li>
                  </ul>
                </div>

                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-blue-600" />
                    NGO Role
                  </h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Manage beneficiaries</li>
                    <li>• Upload bills</li>
                    <li>• View assigned disasters</li>
                    <li>• Track spending</li>
                  </ul>
                </div>

                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Store className="w-4 h-4 text-green-600" />
                    Merchant Role
                  </h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Accept payments</li>
                    <li>• Offline transactions</li>
                    <li>• View own transactions</li>
                    <li>• Sync offline data</li>
                  </ul>
                </div>

                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Users className="w-4 h-4 text-amber-600" />
                    Citizen Role
                  </h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• View wallet balance</li>
                    <li>• Make payments via QR</li>
                    <li>• View transaction history</li>
                    <li>• File complaints</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
