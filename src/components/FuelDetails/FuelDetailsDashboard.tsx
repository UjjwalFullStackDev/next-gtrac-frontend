'use client'
import React, { useState, useMemo } from 'react';
import { FuelRecord } from '@/types/FuelRecord';
import { useFuelData } from '@/hooks/useFuelData';
import LoadingSpinner from '@/components/FuelDetails/LoadingSpinner';
import ErrorDisplay from '@/components/FuelDetails/ErrorDisplay';
import DashboardHeader from '@/components/FuelDetails/DashboardHeader';
import SearchAndFilters from '@/components/FuelDetails/SearchAndFilters';
import FuelTable from '@/components/FuelDetails/FuelTable';
import SummaryStats from '@/components/FuelDetails/SummaryStats';
import VehicleDetailModal from '@/components/FuelDetails/VehicleDetailModal';
import { useFuelGraphData } from '@/hooks/useFuelGraphData';

export default function FuelDetailsDashboard() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<FuelRecord | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const { records, isLoading, isError, error, refetch } = useFuelData();

  // For now, pick first sysServiceId to test (later you can loop all)
  const sysServiceId = records[0]?.sysServiceId;
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
          <DashboardHeader />

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
        <FuelTable data={filteredData} onVehicleClick={handleVehicleClick} />

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