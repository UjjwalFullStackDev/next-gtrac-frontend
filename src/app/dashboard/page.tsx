import React from "react";
import { Metadata } from "next";
import AdminDashboard from "@/components/Dashboard/AdminDashboard";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "On Time, Every Time, For Life",
};

export default function DashboardPage() {
  return (<AdminDashboard />);
}
