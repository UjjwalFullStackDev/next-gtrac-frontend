'use client'
import React, { useState, useMemo } from 'react';
import { FuelRecord } from '@/types/FuelRecord';
import { useFuelData } from '@/hooks/useFuelData';
import LoadingSpinner from '@/components/FuelDetails/LoadingSpinner';
import ErrorDisplay from '@/components/FuelDetails/ErrorDisplay';
import DashboardHeader from '@/components/FuelDetails/DashboardHeader';
import SearchAndFilters from '@/components/FuelDetails/SearchAndFilters';
import FuelTableComplete from '@/components/FuelDetails/FuelTableComplete';
import SummaryStats from '@/components/FuelDetails/SummaryStats';
import VehicleDetailModal from '@/components/FuelDetails/VehicleDetailModal';
import { useFuelGraphData } from '@/hooks/useFuelGraphData';
import FuelTablePending from './FuelTablePending';
import FuelTableProcessing from './FuelTableProcessing';
import { useFuelAlerts } from '@/hooks/useFuelAlerts';

export default function FuelDetailsDashboard() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<FuelRecord | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [activeTab, setActiveTab] = useState<"Pending" | "Processing" | "Complete">("Pending");

  const { records, isLoading, isError, error, refetch } = useFuelData();

  const { data: alertRecords = [], isLoading: alertsLoading } = useFuelAlerts();
  // For now, pick first sysServiceId to test (later you can loop all)
  const sysServiceId = records.length > 0 ? records[0].sysServiceId : null;
  const { data: graphData = [] } = useFuelGraphData(
    sysServiceId,
    "2025-08-03 00:00",
    "2025-08-03 16:00"
  );

  // 🔹 Merge graph data with fuel records
  const mergedRecords = useMemo(() => {
    return records.map((rec) => {
      const extra = graphData.find((g) => g.sysServiceId === rec.sysServiceId);
      return {
        ...rec,
        gpsTime: extra?.gpsTime ?? null,
        rv: extra?.rv ?? null,
        fuelTypeGraph: extra?.fuelType ?? null,
      };
    });
  }, [records, graphData]);


  // 🔹 Filters (use merged records instead of records)
  const filteredData = useMemo(() => {
    return mergedRecords.filter((record: any) => {
      const search = searchTerm.toLowerCase();

      const matchesSearch =
        record.ambulanceNumber.toString().toLowerCase().includes(search) ||
        record.pumpLocation.toLowerCase().includes(search) ||
        record.gpsTime?.toLowerCase().includes(search);

      const recordDate = new Date(record.rawTime);

      const matchesDate =
        (!startDate || recordDate >= new Date(startDate)) &&
        (!endDate || recordDate <= new Date(endDate));

      return matchesSearch && matchesDate;
    });
  }, [mergedRecords, searchTerm, startDate, endDate]);

  // 🔹 Split data into three
  const pendingData = useMemo(() => alertRecords.filter((r) => r.status === "Pending"), [alertRecords]);
  const processingData = useMemo(() => filteredData.filter((r) => r.status === "Processing"), [filteredData]);
  console.log("procs",processingData)
  const completeData = useMemo(() => filteredData.filter((r) => r.status === "Completed"), [filteredData]);

  const handleExport = () => {
    console.log('Exporting data...');
    // Add export logic
  };

  const handleVehicleClick = (record: FuelRecord) => {
    setSelectedRecord(record);
    setIsDetailModalOpen(true);
  };

  const closeDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedRecord(null);
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
          mode="pending"
        />
      )}

        {activeTab === "Processing" && (
        <FuelTableProcessing
          data={processingData}
          onVehicleClick={(record) => console.log("Vehicle clicked:", record)}
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

        {/* Summary Stats */}
        <SummaryStats data={filteredData} />

        {/* Footer Info */}
        <div className="mt-6 text-center text-sm text-gray-500">
          Showing {filteredData.length} of {records.length} records
        </div>

        {/* Vehicle Detail Modal */}
        <VehicleDetailModal
          isOpen={isDetailModalOpen}
          record={selectedRecord}
          onClose={closeDetailModal}
        />
      </div>
    </div>
  );
};