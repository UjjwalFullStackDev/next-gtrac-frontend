export interface FuelRecord {
  id: number;
  sysServiceId: string;
  ambulanceNumber: string;
  vehicle: string;
  fuelStatus: string;
  currentReading: number;
  quantityReading: number;
  appQuantityReading: number;
  fuelDifference: number;
  pumpLocation: string;
  totalAmount: number;
  otp: string;
  invoice: string;
  status?: 'audit' | 'ok';
  timestamp?: string;
  previousReading?: number;
  efficiency?: string;
  fuelType?: string;
  driverName?: string;
  dateTime?: string;
  rawTime?: string;
  softwareReadingTotalAmount?: string,
}
