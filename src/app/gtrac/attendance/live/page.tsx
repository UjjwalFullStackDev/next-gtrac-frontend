
import LiveAttendanceDayRoster from "@/components/gtracIntegration/LiveAttendanceDayRoster";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Day Attendance",
  description: "Track, manage, and analyze employee attendance in real-time",
};

export default function LivePage() {
  return (<LiveAttendanceDayRoster />);
}
