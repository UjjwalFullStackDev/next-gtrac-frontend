'use client'
import React, { useState, useMemo } from 'react';
import { useFuelData } from '@/hooks/useFuelData';
import LoadingSpinner from '@/components/FuelDetails/LoadingSpinner';
import ErrorDisplay from '@/components/FuelDetails/ErrorDisplay';
import DashboardHeader from '@/components/FuelDetails/DashboardHeader';
import SearchAndFilters from '@/components/FuelDetails/SearchAndFilters';
import FuelTableComplete from '@/components/FuelDetails/FuelTableComplete';
import { useFuelGraphData } from '@/hooks/useFuelGraphData';
import FuelTablePending from './FuelTablePending';
import FuelTableProcessing from './FuelTableProcessing';
import { useFuelAlerts } from '@/hooks/useFuelAlerts';

export default function FuelDetailsDashboard() {
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [activeTab, setActiveTab] = useState<"Pending" | "Processing" | "Complete">("Pending");

  const { records: fuelLogs = [], isLoading, isError, error, refetch } = useFuelData();
  const { alerts: alertRecords, isLoading: alertsLoading, acceptAlert, rejectAlert } = useFuelAlerts();
  const { data: fuelGraphData = [] } = useFuelGraphData();

  const merged = alertRecords.map(alert => {
  const graph = fuelGraphData.find(g => g.vehReg === alert.vehicleno);
  const log = fuelLogs.find(l => l.alertBankId === alert.id);

  // readings
  const softReading = log?.quantityReading ?? 0;   // software log
  const liveReading = graph ? Math.round(graph.fuel) : 0; // live GPS reading

  // calculate percentage difference
  let fuelDifference = 0;
  if (softReading > 0 && liveReading > 0) {
    fuelDifference = ((liveReading - softReading) / softReading) * 100;
  }

  // set status based on >2% diff
  const auditStatus: "Audit" | "OK" = Math.abs(fuelDifference) > 2 ? "Audit" : "OK";

  return {
    ...alert,
    ...log,
    liveFuel: graph ? Math.round(graph.fuel) : null,
    gpsTime: graph ? graph.gpsTime : null,
    fuelDifference: Math.round(fuelDifference * 100) / 100,
    status: String(alert.status),
    auditStatus,
  };
});


const filteredData = useMemo(() => {
  return merged.filter(r => {
    // search filter (Username, vehicleno, location, msg)
    const matchesSearch =
      !searchTerm ||
      r.Username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.vehicleno?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.msg?.toLowerCase().includes(searchTerm.toLowerCase());

    // date filter (use created_at or fuelDate)
    const recordDate = r.created_at ? new Date(r.created_at) : null;
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate + "T23:59:59") : null;

    const matchesDate =
      (!start || (recordDate && recordDate >= start)) &&
      (!end || (recordDate && recordDate <= end));

    return matchesSearch && matchesDate;
  });
}, [merged, searchTerm, startDate, endDate]);


  // 🔹 Split data into three
  const pendingData = useMemo(() => filteredData.filter((r) => r.statusText  === "Pending"), [filteredData]);
  const processingData = useMemo(() => filteredData.filter((r) => r.statusText  === "Processing"), [filteredData]);
  const completeData = useMemo(() => filteredData.filter((r) => r.statusText  === "Completed"), [filteredData]);

  const handleExport = () => {
    const headers = ["vehicleno","location","fuelDate","statusText","auditStatus","fuelDifference"];
    const rows = filteredData.map(r => [
      r.vehicleno ?? "",
      r.location ?? "",
      r.fuelDate ?? "",
      r.statusText ?? "",
      r.auditStatus ?? "",
      r.fuelDifference ?? ""
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "fuel_data.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (isError) {
    return <ErrorDisplay error={error?.message || 'An error occurred'} onRetry={refetch} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <DashboardHeader activeTab={activeTab} onTabChange={setActiveTab} />

          {/* Controls */}
          <SearchAndFilters
            searchTerm={searchTerm}
            startDate={startDate}
            endDate={endDate}
            onSearchChange={setSearchTerm}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
            onExport={handleExport}
          />
        </div>

        {/* Table */}
        {activeTab === "Pending" && (
        <FuelTablePending
          data={pendingData}
          onVehicleClick={(record) => console.log("Vehicle clicked:", record)}
          onAccept={acceptAlert}
          onReject={rejectAlert}
          refresh={refetch}
          mode="pending"
        />
      )}

        {activeTab === "Processing" && (
        <FuelTableProcessing
          data={processingData}
          onVehicleClick={(record) => console.log("Vehicle clicked:", record)}
          refresh={refetch}
          mode="processing"
        />
      )}

      {activeTab === "Complete" && (
        <FuelTableComplete
          data={completeData}
          mode="complete"
        />
      )}
      </div>
    </div>
  );
};