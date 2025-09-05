import EmployeeLists from "@/components/Employees/EmployeeLists";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Employee Management",
  description: "Track, manage and analyze employee",
};

export default function AttendancePage() {
  return (<EmployeeLists />);
}
