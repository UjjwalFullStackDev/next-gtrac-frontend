import LiveAttendanceDayRoster from "@/components/Attendance/live/LiveAttendanceDayRoster";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Day Attendance",
  description: "Track, manage, and analyze employee attendance in real-time",
};

export default function ReportPage() {
  return (
  <div className="bg-gradient-to-br from-gray-50 to-gray-100 flex-1 h-[93vh] overflow-scroll no-scrollbar">
    <LiveAttendanceDayRoster />;
  </div>
  )
}
