export interface FuelRecord {
  // Core Identifiers
  id: number;
  sysServiceId?: string;
  alertBankId?: number;
  ambulanceNumber?: string;
  vehicle?: string;
  vehicleno?: string;

  // User / Meta
  Username?: string;
  user_id?: number;
  group_id?: number;
  email?: string | null;
  email_status?: number;
  number?: string | null;

  // Fuel Data
  fuelStatus?: string;
  currentReading?: number;
  previousReading?: number;
  quantityReading?: number;
  appQuantityReading?: number;
  requestedFuel?: string | number;
  liveFuel?: number | null;
  fuelDifference: number;
  efficiency?: string;
  fuelType?: string;

  // Location & GPS
  pumpLocation?: string;
  location?: string ;
  gps_latitude?: string | null;
  gps_longitude?: string | null;
  gpsTime?: string | null;
  speed?: string | null;

  // Amounts & Invoice
  totalAmount?: number;
  amount?: number;
  softwareReadingTotalAmount?: string;
  otp?: string;
  invoice?: string;
  invoiceFileUrl?: string;

  // Audit & Status
  auditStatus?: 'Audit' | 'OK';
  status?: string;
  statusText?: string;
  popup_status?: number;
  sms_status?: number;
  aws_msg_id?: string | null;

  // Dates & Time
  timestamp?: string;
  dateTime?: string;
  rawTime?: string;
  fuelDate?: string;
  created_at?: string;
  sent_at?: string;

  // Extra
  driverName?: string;
  msg?: string;
  issue?: string | null;
  remark?: string | null;
}
