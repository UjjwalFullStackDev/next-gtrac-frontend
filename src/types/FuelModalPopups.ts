import { FuelRecord } from "./FuelRecord";

interface FuelDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
  onReject: () => void;
  record: FuelRecord | null;
  refresh: () => void;
}
