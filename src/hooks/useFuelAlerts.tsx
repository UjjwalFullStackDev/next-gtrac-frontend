// hooks/useFuelAlerts.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { PRODUCTION_API_ENDPOINT } from "@/utils/constants";

export interface FuelAlert {
  id: number;
  vehicleno: string;
  msg: string;
  status: number;
  created_at: string;
}

export const useFuelAlerts = () => {
  const queryClient = useQueryClient();

  const fetchAlerts = async (): Promise<FuelAlert[]> => {
    const res = await axios.get(`${PRODUCTION_API_ENDPOINT}/ambulance/fuel/alert`);
    return res.data.data.map((r: any) => {
      // status mapping
      let statusText: "Pending" | "Processing" | "Completed" = "Pending";
      if (r.status === 1) statusText = "Processing";
      const parsed = parseMsg(r.msg);
      return {
        ...r,
        statusText,
        ...parsed
      };
    });
  };

  function parseMsg(msg: string) {
  // Extract location
  const locationMatch = msg.match(/fueling at (.*?) with/);
  // Extract fuel amount
  const fuelMatch = msg.match(/with ([\d.]+)L fuel/);
  // Extract date (dd-mm-yyyy)
  const dateMatch = msg.match(/on (\d{2}-\d{2}-\d{4})/);

  return {
    location: locationMatch ? locationMatch[1].trim() : "",
    requestedFuel: fuelMatch ? Math.round(parseFloat(fuelMatch[1])) : 0,
    fuelDate: dateMatch ? dateMatch[1] : "",
  };
}


  const { data = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: ["fuelAlerts"],
    queryFn: fetchAlerts,
  });

  // Accept mutation
  const acceptMutation = useMutation({
    mutationFn: (alertId: number) =>
      axios.post(`${PRODUCTION_API_ENDPOINT}/ambulance/fuel/alert/${alertId}/accept`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["fuelAlerts"] }),
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: (alertId: number) =>
      axios.post(`${PRODUCTION_API_ENDPOINT}/ambulance/fuel/alert/${alertId}/reject`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["fuelAlerts"] }),
  });

  return {
    alerts: data,
    isLoading,
    isError,
    error,
    refetch,
    acceptAlert: acceptMutation.mutate,
    rejectAlert: rejectMutation.mutate,
  };
};
