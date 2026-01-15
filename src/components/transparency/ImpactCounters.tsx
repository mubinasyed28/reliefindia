import { useEffect, useState } from "react";
import { Users, Utensils, Pill, Home } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ImpactStats {
  peopleHelped: number;
  mealsServed: number;
  medicinesDelivered: number;
  sheltersProvided: number;
}

export function ImpactCounters() {
  const [stats, setStats] = useState<ImpactStats>({
    peopleHelped: 0,
    mealsServed: 0,
    medicinesDelivered: 0,
    sheltersProvided: 0,
  });
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    fetchImpactStats();
    setAnimated(true);
  }, []);

  const fetchImpactStats = async () => {
    // Get beneficiary count as people helped
    const { count: beneficiaryCount } = await supabase
      .from("beneficiaries")
      .select("*", { count: "exact", head: true });

    // Get transaction counts by purpose to estimate impact
    const { data: transactions } = await supabase
      .from("transactions")
      .select("purpose, amount")
      .eq("status", "completed");

    let meals = 0;
    let medicines = 0;
    let shelters = 0;

    transactions?.forEach((tx) => {
      const purpose = (tx.purpose || "").toLowerCase();
      if (purpose.includes("food") || purpose.includes("meal")) {
        meals += Math.floor(tx.amount / 50); // Estimate meals
      } else if (purpose.includes("medicine") || purpose.includes("medical")) {
        medicines += Math.floor(tx.amount / 100);
      } else if (purpose.includes("shelter") || purpose.includes("housing")) {
        shelters += 1;
      }
    });

    // Add some baseline numbers for demo
    setStats({
      peopleHelped: (beneficiaryCount || 0) + 12500,
      mealsServed: meals + 45000,
      medicinesDelivered: medicines + 8500,
      sheltersProvided: shelters + 350,
    });
  };

  const AnimatedNumber = ({ value }: { value: number }) => {
    const [display, setDisplay] = useState(0);

    useEffect(() => {
      if (!animated) return;
      const duration = 2000;
      const steps = 60;
      const increment = value / steps;
      let current = 0;

      const timer = setInterval(() => {
        current += increment;
        if (current >= value) {
          setDisplay(value);
          clearInterval(timer);
        } else {
          setDisplay(Math.floor(current));
        }
      }, duration / steps);

      return () => clearInterval(timer);
    }, [value, animated]);

    return <span>{display.toLocaleString("en-IN")}</span>;
  };

  const counters = [
    {
      icon: Users,
      value: stats.peopleHelped,
      label: "People Helped",
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      icon: Utensils,
      value: stats.mealsServed,
      label: "Meals Served",
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-100 dark:bg-amber-900/30",
    },
    {
      icon: Pill,
      value: stats.medicinesDelivered,
      label: "Medicines Delivered",
      color: "text-green-600 dark:text-green-400",
      bg: "bg-green-100 dark:bg-green-900/30",
    },
    {
      icon: Home,
      value: stats.sheltersProvided,
      label: "Shelters Provided",
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-100 dark:bg-blue-900/30",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {counters.map((counter, index) => (
        <div
          key={counter.label}
          className={`${counter.bg} rounded-xl p-6 text-center animate-fade-in-up`}
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <counter.icon className={`w-10 h-10 mx-auto mb-3 ${counter.color}`} />
          <p className={`text-3xl md:text-4xl font-bold ${counter.color}`}>
            <AnimatedNumber value={counter.value} />
          </p>
          <p className="text-sm text-muted-foreground mt-1">{counter.label}</p>
        </div>
      ))}
    </div>
  );
}
