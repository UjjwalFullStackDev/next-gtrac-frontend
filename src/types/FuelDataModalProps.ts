import { FuelRecord } from "./FuelRecord";

export interface FuelDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: FuelRecord | null;
  refresh: () => void;
}
