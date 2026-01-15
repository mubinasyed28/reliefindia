import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bell, Wallet, ArrowDownCircle, ArrowUpCircle, AlertTriangle, CheckCircle, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Notification {
  id: string;
  type: "tokens_received" | "tokens_spent" | "alert" | "success";
  title: string;
  message: string;
  amount?: number;
  timestamp: Date;
  read: boolean;
}

export function NotificationPanel() {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: "1",
      type: "tokens_received",
      title: "Tokens Received",
      message: "You received relief tokens for Kerala Flood Relief",
      amount: 5000,
      timestamp: new Date(Date.now() - 3600000),
      read: false,
    },
    {
      id: "2",
      type: "tokens_spent",
      title: "Payment Successful",
      message: "Payment to Krishna Medical Store",
      amount: 450,
      timestamp: new Date(Date.now() - 7200000),
      read: false,
    },
    {
      id: "3",
      type: "success",
      title: "Wallet Verified",
      message: "Your wallet has been successfully verified",
      timestamp: new Date(Date.now() - 86400000),
      read: true,
    },
  ]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const dismissNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const getIcon = (type: Notification["type"]) => {
    switch (type) {
      case "tokens_received":
        return <ArrowDownCircle className="w-5 h-5 text-green-500" />;
      case "tokens_spent":
        return <ArrowUpCircle className="w-5 h-5 text-blue-500" />;
      case "alert":
        return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case "success":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
    }
  };

  const getBg = (type: Notification["type"], read: boolean) => {
    if (read) return "bg-muted/30";
    switch (type) {
      case "tokens_received":
        return "bg-green-50 dark:bg-green-900/20";
      case "tokens_spent":
        return "bg-blue-50 dark:bg-blue-900/20";
      case "alert":
        return "bg-amber-50 dark:bg-amber-900/20";
      case "success":
        return "bg-green-50 dark:bg-green-900/20";
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            Notifications
          </div>
          {unreadCount > 0 && (
            <Badge variant="destructive">{unreadCount} new</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {notifications.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No notifications
          </p>
        ) : (
          <div className="space-y-2 max-h-[350px] overflow-y-auto">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-3 rounded-lg ${getBg(notification.type, notification.read)} transition-all relative group`}
                onClick={() => markAsRead(notification.id)}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    dismissNotification(notification.id);
                  }}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                </button>
                <div className="flex items-start gap-3">
                  {getIcon(notification.type)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`font-medium text-sm ${!notification.read && "text-foreground"}`}>
                        {notification.title}
                      </p>
                      {!notification.read && (
                        <span className="w-2 h-2 bg-primary rounded-full" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {notification.message}
                    </p>
                    {notification.amount && (
                      <p className={`text-sm font-semibold mt-1 ${
                        notification.type === "tokens_received" ? "text-green-600" : "text-blue-600"
                      }`}>
                        {notification.type === "tokens_received" ? "+" : "-"}₹{notification.amount.toLocaleString("en-IN")}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
