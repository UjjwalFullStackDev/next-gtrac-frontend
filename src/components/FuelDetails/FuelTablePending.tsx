'use client'
import React, { useMemo, useState } from 'react';
import { FileText } from 'lucide-react';
import { FuelRecord } from '@/types/FuelRecord';
import { FuelDataModal } from './popupTableComponents/FuelDataModel';

interface FuelTableProps {
  data: FuelRecord[];
  onVehicleClick: (record: FuelRecord) => void;
}

const FuelTablePending: React.FC<FuelTableProps> = ({
  data,
  onAccept,
  onReject,
  refresh
}) => {
    const [selectedRecord, setSelectedRecord] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

  const handleAccept = (record) => {
    setSelectedRecord(record);
    onAccept(record.id);
    setIsModalOpen(true);
  };

  const handleReject = (record) => {
    onReject(record.id);
    console.log("Rejected:", record);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedRecord(null);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="flex-1 overflow-y-scroll no-scrollbar relative">
        <table className="w-full border-collapse">
          <thead className="sticky -top-1 bg-gray-100 z-10">
            <tr>
              <th className="p-3 text-left font-semibold text-sm text-gray-700">
                Ambulance No
              </th>
              <th className="p-3 text-left font-semibold text-sm text-gray-700">
                Fuel Status
              </th>
              <th className="p-3 text-left font-semibold text-sm text-gray-700 flex items-center divide-x divide-gray-300">
                <div className="text-center px-2">(Soft) Reading</div>
                <div className="text-center px-2">(App) Reading</div>
              </th>
              <th className="p-3 text-left font-semibold text-sm text-gray-700">
                Fuel Difference
              </th>
              <th className="p-3 text-left font-semibold text-sm text-gray-700">
                Fuel Pump Location
              </th>
              <th className="p-3 text-left font-semibold text-sm text-gray-700">
                Date
              </th>
              <th className="p-3 text-left font-semibold text-sm text-gray-700">
                Total Amount
              </th>
              <th className="p-3 text-left font-semibold text-sm text-gray-700">
                OTP
              </th>
              <th className="p-3 text-left font-semibold text-sm text-gray-700">
                Invoice
              </th>
              <th className="p-3 text-left font-semibold text-sm text-gray-700">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((record: FuelRecord) => (
              <tr key={record.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  <button className="text-black-600">
                    {record.vehicleno}
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">Current</div>
                  <div className="text-sm text-gray-500">
                    {record.requestedFuel} liters
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center divide-x divide-gray-300">
                    <div className="text-center px-4">
                      <div className="text-sm font-medium text-yellow-600">
                        Quantity
                      </div>
                      <div className="text-sm text-gray-900">
                        {record.quantityReading} liters
                      </div>
                    </div>
                    <div className="text-center px-4">
                      <div className="text-sm font-medium text-cyan-600">
                        Quantity
                      </div>
                      <div className="text-sm text-gray-900"> liters</div>
                    </div>
                  </div>
                </td>

                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                    {record.fuelDifference}%
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                  <div className="whitespace-pre-line">{record.location || "-"}</div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                  <div className="whitespace-pre-line">{record.fuelDate}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  ₹{record.softwareReadingTotalAmount || 0}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm font-medium">
                    {record.otp}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <button className="text-blue-600 hover:text-blue-800">
                    <FileText className="w-5 h-5" />
                  </button>
                </td>

                {/* ✅ Actions Column */}
                <td className="px-6 py-4 whitespace-nowrap flex gap-2">
                  <button
                    onClick={() => handleAccept(record)}
                    className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => handleReject(record)}
                    className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                  >
                    Reject
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <FuelDataModal
        isOpen={isModalOpen}
        onClose={closeModal}
        record={selectedRecord}
        refresh={refresh}
      />
    </div>
  );
};

export default FuelTablePending;
