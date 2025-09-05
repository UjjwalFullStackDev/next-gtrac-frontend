import FuelDetailsDashboard from "@/components/FuelDetails/FuelDetailsDashboard";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Fuel Details",
  description: "Track, manage, and analyze fuel details in real-time",
};

export default function FuelDetailsPage() {
  return (<FuelDetailsDashboard />);
}
