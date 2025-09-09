import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { FuelRecord } from '../types/FuelRecord';
import { PRODUCTION_API_ENDPOINT } from '@/utils/constants';

export const useFuelData = () => {
  const fetchRequests = async () => {
    const response = await axios.get(`${PRODUCTION_API_ENDPOINT}/ambulance/fuel/record`);
    return response.data.ambulanceFuelLog;
  };
  const { data:fuelLogs = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: ['fuelLogs'],
    queryFn: fetchRequests,
  });

  // Transform API data to FuelRecord format
  const records: FuelRecord[] = (fuelLogs).map((r: any) => {
    const software = parseFloat(r.softwareReadingLitres) || 0;
    const manual = parseFloat(r.manualReadingLitres) || 0;

    // Calculate % difference and status
    let status: 'audit' | 'ok' = 'ok';
    let diffLitres = Math.abs(software - manual);
    let diffPercent = 0;

    if (manual > 0) {
      diffPercent = (diffLitres / manual) * 100;
      if (diffPercent > 2) {
        status = 'audit';
      }
    }

  //   const formatDateTime = (date:Date) => {
  //   const dateObj = new Date(`${date}`);
  //   return dateObj.toLocaleString('en-IN', {
  //     year: 'numeric',
  //     month: 'short',
  //     day: 'numeric',
  //     hour: '2-digit',
  //     minute: '2-digit'
  //   });
  // };

    return {
      id: r.id,
      sysServiceId: r.ambulance.sysServiceId,
      alertBankId: r.alertBankId,
      ambulanceNumber: r.ambulance.ambulanceNumber,
      vehicle: r.ambulanceId,
      fuelStatus: r.fuelType,
      currentReading: software,
      quantityReading: manual,
      appQuantityReading: software,
      softwareReadingTotalAmount: r.softwareReadingTotalAmount,
      fuelDifference: Math.round(diffPercent),
      pumpLocation: r.location,
      totalAmount: 0,
      otp: r.otp,
      invoice: r.invoiceFileUrl,
    };
  });

  return { records, isLoading, isError, error, refetch };
};