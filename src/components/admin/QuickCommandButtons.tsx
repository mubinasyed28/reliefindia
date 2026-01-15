import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertTriangle,
  Send,
  Lock,
  FileSearch,
  Key,
  Zap,
} from "lucide-react";

export function QuickCommandButtons() {
  const navigate = useNavigate();

  const commands = [
    {
      label: "Create Disaster",
      icon: AlertTriangle,
      action: () => navigate("/admin/disasters"),
      color: "hover:bg-red-500 hover:text-white hover:border-red-500",
    },
    {
      label: "Distribute Funds",
      icon: Send,
      action: () => navigate("/admin/distribute"),
      color: "hover:bg-green-500 hover:text-white hover:border-green-500",
    },
    {
      label: "Freeze Wallet",
      icon: Lock,
      action: () => navigate("/admin/duplicate-claims"),
      color: "hover:bg-amber-500 hover:text-white hover:border-amber-500",
    },
    {
      label: "Open Audit",
      icon: FileSearch,
      action: () => navigate("/admin/transactions"),
      color: "hover:bg-purple-500 hover:text-white hover:border-purple-500",
    },
    {
      label: "API Control",
      icon: Key,
      action: () => navigate("/admin/api"),
      color: "hover:bg-blue-500 hover:text-white hover:border-blue-500",
    },
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Zap className="w-4 h-4 text-primary" />
          Quick Commands
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-2">
          {commands.map((cmd) => (
            <Button
              key={cmd.label}
              variant="outline"
              size="sm"
              onClick={cmd.action}
              className={`flex flex-col h-auto py-3 gap-1 transition-all duration-200 ${cmd.color}`}
            >
              <cmd.icon className="w-5 h-5" />
              <span className="text-xs">{cmd.label}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
