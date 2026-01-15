import { IndianRupee, TrendingUp, Wallet } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface FundTrackerProps {
  released: number;
  used: number;
  remaining: number;
  showLabels?: boolean;
}

export function FundTracker({ released, used, remaining, showLabels = true }: FundTrackerProps) {
  const usedPercent = released > 0 ? (used / released) * 100 : 0;
  const remainingPercent = released > 0 ? (remaining / released) * 100 : 0;

  return (
    <div className="space-y-4">
      {showLabels && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Fund Utilization</span>
          <span className="font-medium">{usedPercent.toFixed(1)}% utilized</span>
        </div>
      )}

      <div className="relative h-8 bg-muted rounded-full overflow-hidden">
        {/* Used portion */}
        <div
          className="absolute left-0 top-0 h-full bg-gradient-to-r from-green-500 to-green-600 transition-all duration-500"
          style={{ width: `${usedPercent}%` }}
        />
        {/* Remaining portion indicator */}
        <div
          className="absolute top-0 h-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-500"
          style={{ left: `${usedPercent}%`, width: `${remainingPercent}%` }}
        />
      </div>

      <div className="grid grid-cols-3 gap-4 text-center">
        <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
          <div className="flex items-center justify-center gap-1 text-green-600 dark:text-green-400 mb-1">
            <Wallet className="w-4 h-4" />
          </div>
          <p className="text-xs text-muted-foreground">Released</p>
          <p className="font-bold text-green-600 dark:text-green-400">
            ₹{(released / 100000).toFixed(1)}L
          </p>
        </div>
        <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
          <div className="flex items-center justify-center gap-1 text-blue-600 dark:text-blue-400 mb-1">
            <TrendingUp className="w-4 h-4" />
          </div>
          <p className="text-xs text-muted-foreground">Utilized</p>
          <p className="font-bold text-blue-600 dark:text-blue-400">
            ₹{(used / 100000).toFixed(1)}L
          </p>
        </div>
        <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20">
          <div className="flex items-center justify-center gap-1 text-amber-600 dark:text-amber-400 mb-1">
            <IndianRupee className="w-4 h-4" />
          </div>
          <p className="text-xs text-muted-foreground">Available</p>
          <p className="font-bold text-amber-600 dark:text-amber-400">
            ₹{(remaining / 100000).toFixed(1)}L
          </p>
        </div>
      </div>
    </div>
  );
}
