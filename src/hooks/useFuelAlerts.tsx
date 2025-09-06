// hooks/useFuelAlerts.ts
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { FuelRecord } from "@/types/FuelRecord";

const mapStatus = (num: number) => {
  switch (num) {
    case 0: return "Pending";
    case 1: return "Processing";
    case 2: return "Complete";
    default: return "Unknown";
  }
};

const fetchFuelAlerts = async (): Promise<FuelRecord[]> => {
  const res = await axios.get("http://localhost:5001/api/v1/ambulance/fuel/alert/");
  return (
    res.data?.data?.map((r: any) => ({
      ...r,
      ambulanceNumber: r.vehicleno,
      sysServiceId: r.sys_service_id,
      gpsTime: r.created_at,
      status: mapStatus(r.status),
    })) || []
  )
};

export const useFuelAlerts = () => {
  return useQuery<FuelRecord[], Error>({
    queryKey: ["fuelAlerts"],
    queryFn: fetchFuelAlerts,
  });
};
