import EmployeeAttendance from "@/components/Attendance/EmployeeAttendance";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Attendance Management",
  description: "Track, manage, and analyze employee attendance in real-time",
};

export default function AttendancePage() {
  return (<EmployeeAttendance />);
}
