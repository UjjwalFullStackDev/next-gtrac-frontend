import { FuelGraphRecord } from '@/types/FuelGraphRecord';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

export function useFuelGraphData(sysServiceId?: string, startDate?: string, endDate?: string) {
  const formatDate = (d: Date) =>
    d.toISOString().slice(0, 16).replace("T", " ");

  const today = new Date();
  const defaultStart = formatDate(new Date(today.setHours(0, 0, 0, 0)));
  const defaultEnd = formatDate(new Date(today.setHours(23, 59, 59, 999)));

  const start = startDate ?? defaultStart;
  const end = endDate ?? defaultEnd;

  return useQuery({
    queryKey: ["fuelGraphData", sysServiceId, start, end],
    queryFn: async () => {
      if (!sysServiceId) return [];
      const res = await axios.get(
        `https://gtrac.in:8089/trackingDashboard/getAllfueldatagraph`,
        {
          params: {
            sys_service_id: sysServiceId,
            startdate: start,
            enddate: end,
            TypeFT: 1,
            userid: 833193,
          },
        }
      );
      return res.data ?? [];
    },
    enabled: !!sysServiceId,
  });
}