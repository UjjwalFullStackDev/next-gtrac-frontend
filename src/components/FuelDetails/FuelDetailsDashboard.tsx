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
  const [selectedDate, setSelectedDate] = useState('');
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
  const auditStatus = Math.abs(fuelDifference) > 2 ? "Audit" : "OK";

  return {
    ...alert,
    ...log, // ✅ log should come after alert so invoiceFileUrl isn’t lost
    liveFuel: graph ? Math.round(graph.fuel) : null,
    gpsTime: graph ? graph.gpsTime : null,
    fuelDifference: Math.round(fuelDifference * 100) / 100,
    auditStatus,
    invoiceFileUrl: log?.invoiceFileUrl ?? null, // ✅ explicitly safe
  };
});

  // 🔹 Split data into three
  const pendingData = useMemo(() => merged.filter((r) => r.statusText  === "Pending"), [merged]);
  const processingData = useMemo(() => merged.filter((r) => r.statusText  === "Processing"), [merged]);
  const completeData = useMemo(() => merged.filter((r) => r.statusText  === "Completed"), [merged]);

  const handleExport = () => {
    console.log('Exporting data...');
    // Add export logic
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
          onVehicleClick={(record) => console.log("Vehicle clicked:", record)}
          mode="complete"
        />
      )}
      </div>
    </div>
  );
};