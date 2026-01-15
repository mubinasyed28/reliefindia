import { Shield, Star, AlertTriangle, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface TrustScoreProps {
  score: number;
  verifiedTransactions: number;
  complianceRate: number;
  fraudFlags: number;
  timeInSystem: number; // months
  size?: "sm" | "md" | "lg";
}

export function TrustScore({
  score,
  verifiedTransactions,
  complianceRate,
  fraudFlags,
  timeInSystem,
  size = "md",
}: TrustScoreProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 dark:text-green-400";
    if (score >= 60) return "text-amber-600 dark:text-amber-400";
    return "text-red-600 dark:text-red-400";
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return "bg-green-100 dark:bg-green-900/30";
    if (score >= 60) return "bg-amber-100 dark:bg-amber-900/30";
    return "bg-red-100 dark:bg-red-900/30";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return "Excellent";
    if (score >= 80) return "Very Good";
    if (score >= 70) return "Good";
    if (score >= 60) return "Fair";
    return "Needs Review";
  };

  const iconSize = size === "sm" ? "w-4 h-4" : size === "lg" ? "w-8 h-8" : "w-6 h-6";
  const textSize = size === "sm" ? "text-lg" : size === "lg" ? "text-4xl" : "text-2xl";

  return (
    <div className={`rounded-lg p-4 ${getScoreBg(score)}`}>
      <div className="flex items-center gap-3 mb-3">
        <div className={`${getScoreColor(score)}`}>
          <Shield className={iconSize} />
        </div>
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Trust Score</p>
          <div className="flex items-baseline gap-2">
            <span className={`font-bold ${textSize} ${getScoreColor(score)}`}>
              {score.toFixed(0)}
            </span>
            <span className="text-sm text-muted-foreground">/100</span>
          </div>
        </div>
        <Badge variant={score >= 70 ? "default" : "destructive"} className="ml-auto">
          {getScoreLabel(score)}
        </Badge>
      </div>

      <Progress value={score} className="h-2 mb-3" />

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="flex items-center gap-1">
          <CheckCircle className="w-3 h-3 text-green-600" />
          <span>{verifiedTransactions} verified txns</span>
        </div>
        <div className="flex items-center gap-1">
          <Star className="w-3 h-3 text-amber-500" />
          <span>{complianceRate}% compliance</span>
        </div>
        <div className="flex items-center gap-1">
          {fraudFlags > 0 ? (
            <AlertTriangle className="w-3 h-3 text-red-500" />
          ) : (
            <CheckCircle className="w-3 h-3 text-green-600" />
          )}
          <span>{fraudFlags} fraud flags</span>
        </div>
        <div className="flex items-center gap-1">
          <Shield className="w-3 h-3 text-primary" />
          <span>{timeInSystem} months active</span>
        </div>
      </div>
    </div>
  );
}
