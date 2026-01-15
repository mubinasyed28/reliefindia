import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

// India state coordinates for markers
const stateCoordinates: Record<string, [number, number]> = {
  "Andhra Pradesh": [79.74, 15.91],
  "Arunachal Pradesh": [94.73, 28.22],
  "Assam": [92.94, 26.20],
  "Bihar": [85.31, 25.10],
  "Chhattisgarh": [81.87, 21.28],
  "Goa": [74.12, 15.30],
  "Gujarat": [71.19, 22.26],
  "Haryana": [76.09, 29.06],
  "Himachal Pradesh": [77.17, 31.10],
  "Jharkhand": [85.28, 23.61],
  "Karnataka": [75.71, 15.32],
  "Kerala": [76.27, 10.85],
  "Madhya Pradesh": [78.66, 22.97],
  "Maharashtra": [75.71, 19.75],
  "Manipur": [93.91, 24.66],
  "Meghalaya": [91.37, 25.47],
  "Mizoram": [92.94, 23.16],
  "Nagaland": [94.56, 26.16],
  "Odisha": [85.09, 20.95],
  "Punjab": [75.34, 31.15],
  "Rajasthan": [74.22, 27.02],
  "Sikkim": [88.51, 27.53],
  "Tamil Nadu": [78.66, 11.13],
  "Telangana": [79.02, 18.11],
  "Tripura": [91.99, 23.94],
  "Uttar Pradesh": [80.95, 26.85],
  "Uttarakhand": [79.02, 30.07],
  "West Bengal": [87.75, 22.99],
  "Delhi": [77.10, 28.70],
  "Jammu and Kashmir": [74.80, 33.78],
  "Ladakh": [77.58, 34.16],
};

interface StateData {
  state: string;
  disasters: number;
  fundsAllocated: number;
  fundsSpent: number;
  beneficiaries: number;
}

interface IndiaMapProps {
  onStateClick?: (state: string, data: StateData) => void;
}

export function IndiaMap({ onStateClick }: IndiaMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stateData, setStateData] = useState<Record<string, StateData>>({});

  useEffect(() => {
    fetchStateData();
  }, []);

  const fetchStateData = async () => {
    // Fetch disasters with affected states
    const { data: disasters } = await supabase
      .from("disasters")
      .select("affected_states, total_tokens_allocated, tokens_distributed, status");

    // Aggregate data by state
    const aggregated: Record<string, StateData> = {};

    disasters?.forEach((disaster) => {
      const states = disaster.affected_states || [];
      states.forEach((state: string) => {
        if (!aggregated[state]) {
          aggregated[state] = {
            state,
            disasters: 0,
            fundsAllocated: 0,
            fundsSpent: 0,
            beneficiaries: 0,
          };
        }
        aggregated[state].disasters += 1;
        aggregated[state].fundsAllocated += Number(disaster.total_tokens_allocated) || 0;
        aggregated[state].fundsSpent += Number(disaster.tokens_distributed) || 0;
      });
    });

    // Add simulated beneficiary data
    Object.keys(aggregated).forEach((state) => {
      aggregated[state].beneficiaries = Math.floor(aggregated[state].fundsAllocated / 1000);
    });

    setStateData(aggregated);
  };

  useEffect(() => {
    if (!mapContainer.current) return;

    const initMap = async () => {
      try {
        // Fetch Mapbox token from edge function
        const { data, error: fnError } = await supabase.functions.invoke("get-mapbox-token");

        if (fnError || !data?.token) {
          setError("Failed to load map configuration");
          setIsLoading(false);
          return;
        }

        mapboxgl.accessToken = data.token;

        map.current = new mapboxgl.Map({
          container: mapContainer.current!,
          style: "mapbox://styles/mapbox/light-v11",
          center: [78.9629, 22.5937], // Center of India
          zoom: 4,
          minZoom: 3,
          maxZoom: 8,
        });

        map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

        map.current.on("load", () => {
          addStateMarkers();
          setIsLoading(false);
        });

        map.current.on("error", (e) => {
          console.error("Map error:", e);
          setError("Failed to load map");
          setIsLoading(false);
        });
      } catch (err) {
        console.error("Map init error:", err);
        setError("Failed to initialize map");
        setIsLoading(false);
      }
    };

    initMap();

    return () => {
      map.current?.remove();
    };
  }, []);

  useEffect(() => {
    if (map.current && Object.keys(stateData).length > 0) {
      addStateMarkers();
    }
  }, [stateData]);

  const addStateMarkers = () => {
    if (!map.current) return;

    // Remove existing markers
    const markers = document.querySelectorAll(".state-marker");
    markers.forEach((m) => m.remove());

    Object.entries(stateData).forEach(([state, data]) => {
      const coords = stateCoordinates[state];
      if (!coords) return;

      // Calculate marker size based on funds
      const size = Math.min(60, Math.max(20, data.fundsAllocated / 50000));
      const utilizationRate = data.fundsAllocated > 0 
        ? (data.fundsSpent / data.fundsAllocated) * 100 
        : 0;

      // Create custom marker element
      const el = document.createElement("div");
      el.className = "state-marker";
      el.style.cssText = `
        width: ${size}px;
        height: ${size}px;
        background: linear-gradient(135deg, 
          hsl(var(--primary)) ${utilizationRate}%, 
          hsl(var(--muted)) ${utilizationRate}%);
        border-radius: 50%;
        border: 3px solid hsl(var(--primary));
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: ${size / 4}px;
        font-weight: bold;
        color: white;
        text-shadow: 0 1px 2px rgba(0,0,0,0.5);
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        transition: transform 0.2s, box-shadow 0.2s;
      `;
      el.innerText = data.disasters.toString();

      el.addEventListener("mouseenter", () => {
        el.style.transform = "scale(1.2)";
        el.style.boxShadow = "0 6px 20px rgba(0,0,0,0.3)";
      });

      el.addEventListener("mouseleave", () => {
        el.style.transform = "scale(1)";
        el.style.boxShadow = "0 4px 12px rgba(0,0,0,0.2)";
      });

      el.addEventListener("click", () => {
        onStateClick?.(state, data);
      });

      // Create popup
      const popup = new mapboxgl.Popup({
        offset: 25,
        closeButton: false,
      }).setHTML(`
        <div style="padding: 8px; min-width: 150px;">
          <h3 style="font-weight: 600; margin-bottom: 8px; font-size: 14px;">${state}</h3>
          <div style="font-size: 12px; color: #666;">
            <p style="margin: 4px 0;"><strong>Disasters:</strong> ${data.disasters}</p>
            <p style="margin: 4px 0;"><strong>Funds Allocated:</strong> ₹${data.fundsAllocated.toLocaleString("en-IN")}</p>
            <p style="margin: 4px 0;"><strong>Funds Spent:</strong> ₹${data.fundsSpent.toLocaleString("en-IN")}</p>
            <p style="margin: 4px 0;"><strong>Beneficiaries:</strong> ${data.beneficiaries.toLocaleString("en-IN")}</p>
            <p style="margin: 4px 0;"><strong>Utilization:</strong> ${utilizationRate.toFixed(1)}%</p>
          </div>
        </div>
      `);

      new mapboxgl.Marker(el)
        .setLngLat(coords)
        .setPopup(popup)
        .addTo(map.current!);
    });
  };

  if (error) {
    return (
      <div className="w-full h-[500px] flex items-center justify-center bg-muted rounded-lg">
        <p className="text-muted-foreground">{error}</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[500px] rounded-lg overflow-hidden">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted z-10">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}
      <div ref={mapContainer} className="absolute inset-0" />
    </div>
  );
}
