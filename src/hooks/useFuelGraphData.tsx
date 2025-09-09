// hooks/useFuelGraphData.ts
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

export interface FuelGraphRecord {
  vehReg: string;
  vId: number;
  fuel: number;
  gpsTime: string;
}

export function useFuelGraphData() {
  return useQuery({
    queryKey: ["fuelGraphData"],
    queryFn: async (): Promise<FuelGraphRecord[]> => {
      const res = await axios.get(
        "https://gtrac.in:8089/trackingDashboard/getListVehiclesmob?token=59961&userid=833193&puserid=1&mode="
      );

      return (res.data.list ?? []).map((item: any) => ({
        vehReg: item.vehReg,
        vId: item.vId,
        fuel: item.gpsDtl?.fuel ?? 0,
        gpsTime: item.gpsDtl?.gpstime ?? "",
      }));
    },
  });
}
