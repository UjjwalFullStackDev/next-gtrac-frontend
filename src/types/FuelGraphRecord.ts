export interface FuelGraphRecord {
  sysServiceId: string;
  gpsTime: string;
  fuelType: string;
  liveFuel: number | null;
  statusText?: string;
}