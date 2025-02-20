import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Icon } from "leaflet";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Collectible } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

// Fix the default marker icon issue
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerIconShadow from "leaflet/dist/images/marker-shadow.png";

const defaultIcon = new Icon({
  iconUrl: markerIcon,
  shadowUrl: markerIconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

export default function GameMap() {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const { toast } = useToast();

  const { data: collectibles = [] } = useQuery<Collectible[]>({
    queryKey: ["/api/collectibles"],
  });

  const collectMutation = useMutation({
    mutationFn: async ({
      credits,
      gamecoins,
    }: {
      credits: number;
      gamecoins: number;
    }) => {
      const res = await apiRequest("POST", "/api/collect", {
        credits,
        gamecoins,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Collected!",
        description: "The reward has been added to your wallet.",
      });
    },
  });

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation([position.coords.latitude, position.coords.longitude]);
      },
      (error) => {
        console.error("Error getting location:", error);
        toast({
          title: "Location Error",
          description: "Could not get your current location.",
          variant: "destructive",
        });
      }
    );
  }, []);

  const handleCollect = (collectible: Collectible) => {
    if (!userLocation) return;

    const distance = calculateDistance(
      userLocation[0],
      userLocation[1],
      collectible.latitude,
      collectible.longitude
    );

    if (distance <= 0.1) {
      // Within 100 meters
      collectMutation.mutate({
        credits: collectible.type === "credit" ? collectible.amount : 0,
        gamecoins: collectible.type === "gamecoin" ? collectible.amount : 0,
      });
    } else {
      toast({
        title: "Too Far",
        description: "You need to be closer to collect this reward!",
        variant: "destructive",
      });
    }
  };

  if (!userLocation) {
    return (
      <div className="h-full flex items-center justify-center">
        <p>Loading map...</p>
      </div>
    );
  }

  return (
    <MapContainer
      center={userLocation}
      zoom={13}
      className="h-full w-full"
      attributionControl={false}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      
      <Marker position={userLocation} icon={defaultIcon}>
        <Popup>You are here</Popup>
      </Marker>

      {collectibles.map((collectible, index) => (
        <Marker
          key={index}
          position={[collectible.latitude, collectible.longitude]}
          icon={defaultIcon}
        >
          <Popup>
            <div className="text-center">
              <p className="text-lg mb-2">
                {collectible.type === "credit" ? "💰" : "🎮"}{" "}
                {collectible.amount} {collectible.type}
                {collectible.amount > 1 ? "s" : ""}
              </p>
              <Button
                size="sm"
                onClick={() => handleCollect(collectible)}
                disabled={collectMutation.isPending}
              >
                Collect
              </Button>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}

function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(value: number): number {
  return (value * Math.PI) / 180;
}
