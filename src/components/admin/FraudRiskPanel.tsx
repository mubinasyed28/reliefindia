import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import {
  ShieldAlert,
  AlertTriangle,
  Building2,
  Store,
  Copy,
  FileWarning,
} from "lucide-react";

interface RiskItem {
  id: string;
  type: "ngo" | "merchant" | "duplicate" | "bill";
  name: string;
  reason: string;
  severity: "high" | "medium" | "low";
}

export function FraudRiskPanel() {
  const [risks, setRisks] = useState<RiskItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRisks();
  }, []);

  const fetchRisks = async () => {
    const riskItems: RiskItem[] = [];

    // High risk NGOs (low trust score or fraud flags)
    const { data: ngos } = await supabase
      .from("ngos")
      .select("id, ngo_name, trust_score, fraud_flags")
      .or("trust_score.lt.50,fraud_flags.gt.0")
      .limit(5);

    ngos?.forEach((ngo) => {
      if (ngo.fraud_flags && ngo.fraud_flags > 0) {
        riskItems.push({
          id: `ngo-${ngo.id}`,
          type: "ngo",
          name: ngo.ngo_name,
          reason: `${ngo.fraud_flags} fraud flag(s) detected`,
          severity: "high",
        });
      } else if (ngo.trust_score && ngo.trust_score < 50) {
        riskItems.push({
          id: `ngo-${ngo.id}`,
          type: "ngo",
          name: ngo.ngo_name,
          reason: `Low trust score: ${ngo.trust_score}`,
          severity: "medium",
        });
      }
    });

    // High risk merchants
    const { data: merchants } = await supabase
      .from("merchants")
      .select("id, shop_name, trust_score, fraud_flags")
      .or("trust_score.lt.50,fraud_flags.gt.0")
      .limit(5);

    merchants?.forEach((m) => {
      if (m.fraud_flags && m.fraud_flags > 0) {
        riskItems.push({
          id: `merchant-${m.id}`,
          type: "merchant",
          name: m.shop_name,
          reason: `${m.fraud_flags} fraud flag(s)`,
          severity: "high",
        });
      } else if (m.trust_score && m.trust_score < 50) {
        riskItems.push({
          id: `merchant-${m.id}`,
          type: "merchant",
          name: m.shop_name,
          reason: `Low trust score: ${m.trust_score}`,
          severity: "medium",
        });
      }
    });

    // Duplicate claims
    const { data: duplicates } = await supabase
      .from("duplicate_claims")
      .select("id, aadhaar_hash, status")
      .eq("status", "flagged")
      .limit(5);

    duplicates?.forEach((d) => {
      riskItems.push({
        id: `dup-${d.id}`,
        type: "duplicate",
        name: `Aadhaar: ***${d.aadhaar_hash.slice(-4)}`,
        reason: "Multiple wallet addresses detected",
        severity: "high",
      });
    });

    // Flagged bills
    const { data: bills } = await supabase
      .from("bill_validations")
      .select("id, vendor_name, ai_validation_status, ai_confidence_score")
      .eq("ai_validation_status", "rejected")
      .limit(5);

    bills?.forEach((b) => {
      riskItems.push({
        id: `bill-${b.id}`,
        type: "bill",
        name: b.vendor_name || "Unknown Vendor",
        reason: `AI rejected (${((b.ai_confidence_score || 0) * 100).toFixed(0)}% confidence)`,
        severity: "medium",
      });
    });

    setRisks(riskItems);
    setLoading(false);
  };

  const getIcon = (type: RiskItem["type"]) => {
    switch (type) {
      case "ngo":
        return <Building2 className="w-4 h-4" />;
      case "merchant":
        return <Store className="w-4 h-4" />;
      case "duplicate":
        return <Copy className="w-4 h-4" />;
      case "bill":
        return <FileWarning className="w-4 h-4" />;
    }
  };

  const getSeverityColor = (severity: RiskItem["severity"]) => {
    switch (severity) {
      case "high":
        return "destructive";
      case "medium":
        return "secondary";
      case "low":
        return "outline";
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-red-500" />
          Fraud & Risk Alerts
          {risks.filter((r) => r.severity === "high").length > 0 && (
            <Badge variant="destructive" className="text-xs">
              {risks.filter((r) => r.severity === "high").length} Critical
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[250px]">
          <div className="p-4 space-y-2">
            {loading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-12 bg-muted animate-pulse rounded" />
                ))}
              </div>
            ) : risks.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <ShieldAlert className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No risk alerts</p>
              </div>
            ) : (
              risks.map((risk) => (
                <div
                  key={risk.id}
                  className="flex items-center gap-3 p-2 rounded-md bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div
                    className={`p-1.5 rounded-full ${
                      risk.severity === "high"
                        ? "bg-red-100 text-red-600 dark:bg-red-900/30"
                        : "bg-amber-100 text-amber-600 dark:bg-amber-900/30"
                    }`}
                  >
                    {getIcon(risk.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{risk.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{risk.reason}</p>
                  </div>
                  <Badge variant={getSeverityColor(risk.severity)} className="text-xs shrink-0">
                    {risk.severity}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
