import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Building, Utensils, Pill, Home, Navigation } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ReliefLocation {
  id: string;
  name: string;
  location_type: string;
  address: string;
  latitude: number;
  longitude: number;
  contact_phone: string | null;
  operating_hours: string | null;
  capacity: number | null;
  current_occupancy: number | null;
}

// Mock relief locations for demo
const mockLocations: ReliefLocation[] = [
  {
    id: "1",
    name: "Government Relief Camp - Sector 5",
    location_type: "relief_camp",
    address: "Sector 5, Main Road, Near Bus Stand",
    latitude: 28.6139,
    longitude: 77.209,
    contact_phone: "+91 98765 43210",
    operating_hours: "24 Hours",
    capacity: 500,
    current_occupancy: 320,
  },
  {
    id: "2",
    name: "Community Kitchen - Block A",
    location_type: "food_point",
    address: "Block A, Community Center",
    latitude: 28.6149,
    longitude: 77.211,
    contact_phone: "+91 98765 43211",
    operating_hours: "6 AM - 10 PM",
    capacity: null,
    current_occupancy: null,
  },
  {
    id: "3",
    name: "Emergency Medical Center",
    location_type: "medical_store",
    address: "District Hospital Campus",
    latitude: 28.6119,
    longitude: 77.207,
    contact_phone: "+91 98765 43212",
    operating_hours: "24 Hours",
    capacity: null,
    current_occupancy: null,
  },
  {
    id: "4",
    name: "Temporary Shelter - School",
    location_type: "shelter",
    address: "Government School, Ward 12",
    latitude: 28.6159,
    longitude: 77.213,
    contact_phone: "+91 98765 43213",
    operating_hours: "24 Hours",
    capacity: 200,
    current_occupancy: 145,
  },
];

export function HelpMap() {
  const [locations, setLocations] = useState<ReliefLocation[]>(mockLocations);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    // Try to get user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        () => {
          // Default to Delhi if location access denied
          setUserLocation({ lat: 28.6139, lng: 77.209 });
        }
      );
    }

    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    const { data } = await supabase
      .from("relief_locations")
      .select("*")
      .eq("is_active", true);

    if (data && data.length > 0) {
      setLocations(data);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "relief_camp":
        return <Building className="w-5 h-5" />;
      case "food_point":
        return <Utensils className="w-5 h-5" />;
      case "medical_store":
        return <Pill className="w-5 h-5" />;
      case "shelter":
        return <Home className="w-5 h-5" />;
      default:
        return <MapPin className="w-5 h-5" />;
    }
  };

  const getColor = (type: string) => {
    switch (type) {
      case "relief_camp":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
      case "food_point":
        return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
      case "medical_store":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      case "shelter":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "relief_camp":
        return "Relief Camp";
      case "food_point":
        return "Food Point";
      case "medical_store":
        return "Medical";
      case "shelter":
        return "Shelter";
      default:
        return type;
    }
  };

  const openInMaps = (lat: number, lng: number, name: string) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_id=${encodeURIComponent(name)}`;
    window.open(url, "_blank");
  };

  const filteredLocations = selectedType
    ? locations.filter((l) => l.location_type === selectedType)
    : locations;

  const types = ["relief_camp", "food_point", "medical_store", "shelter"];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-primary" />
          Find Help Nearby
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Filter buttons */}
        <div className="flex flex-wrap gap-2 mb-4">
          <Button
            variant={selectedType === null ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedType(null)}
          >
            All
          </Button>
          {types.map((type) => (
            <Button
              key={type}
              variant={selectedType === type ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedType(type)}
              className="flex items-center gap-1"
            >
              {getIcon(type)}
              {getTypeLabel(type)}
            </Button>
          ))}
        </div>

        {/* Locations list */}
        <div className="space-y-3 max-h-[400px] overflow-y-auto">
          {filteredLocations.map((location) => (
            <div
              key={location.id}
              className="p-4 rounded-lg border hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${getColor(location.location_type)}`}>
                  {getIcon(location.location_type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-sm truncate">{location.name}</h4>
                    <Badge variant="secondary" className="text-xs shrink-0">
                      {getTypeLabel(location.location_type)}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">{location.address}</p>
                  
                  <div className="flex flex-wrap gap-2 text-xs">
                    {location.operating_hours && (
                      <span className="text-muted-foreground">
                        🕐 {location.operating_hours}
                      </span>
                    )}
                    {location.contact_phone && (
                      <a
                        href={`tel:${location.contact_phone}`}
                        className="text-primary hover:underline"
                      >
                        📞 {location.contact_phone}
                      </a>
                    )}
                    {location.capacity && (
                      <span className="text-muted-foreground">
                        👥 {location.current_occupancy}/{location.capacity}
                      </span>
                    )}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openInMaps(location.latitude, location.longitude, location.name)}
                  className="shrink-0"
                >
                  <Navigation className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
