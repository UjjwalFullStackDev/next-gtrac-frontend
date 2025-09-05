import { FuelGraphRecord } from '@/types/FuelGraphRecord';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

export const useFuelGraphData = (sysServiceId: string, startDate: string, endDate: string) => {
    const fetchGraphData = async (): Promise<FuelGraphRecord[]> => {
        const response = await axios.get(
            `https://gtrac.in:8089/trackingDashboard/getAllfueldatagraph`,
            {
                params: {
                    sys_service_id: sysServiceId,
                    startdate: startDate,
                    enddate: endDate,
                    TypeFT: 1,
                    userid: 833193,
                },
            }
        );

        const formatDateTime = (date: Date) => {
            const dateObj = new Date(`${date}`);
            return dateObj.toLocaleString('en-IN', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        };

        // map to keep only required fields
        return response.data.list.map((item: any) => {
            const raw = new Date(item.gps_time);
            return {
                sysServiceId: sysServiceId,
                gpsTime: formatDateTime(raw),
                rawTime: raw.toISOString(),              // full ISO
                dateOnly: raw.toISOString().split("T")[0], // just YYYY-MM-DD
                rv: item.rv,
                fuelType: "Fuel",
            }
        });
    };
    return useQuery({
        queryKey: ['fuelGraph', sysServiceId, startDate, endDate],
        queryFn: fetchGraphData,
        enabled: !!sysServiceId, // only fetch if we have a sysServiceId
    });
};
