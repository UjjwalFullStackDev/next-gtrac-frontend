import React, { useMemo, useState } from 'react';
import { FileText } from 'lucide-react';
import { FuelRecord } from '@/types/FuelRecord';

interface FuelTableProps {
  data: FuelRecord[];
  onVehicleClick: (record: FuelRecord) => void;
  onAccept: (record: FuelRecord) => void;
  onReject: (record: FuelRecord) => void;
}

const FuelTablePending: React.FC<FuelTableProps> = ({
  data,
  onVehicleClick,
  onAccept,
  onReject,
}) => {
    const [activeTab, setActiveTab] = useState<"Pending" | "Processing" | "Complete">("Pending");


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
                  <button
                    onClick={() => onVehicleClick(record)}
                    className="text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    {record.ambulanceNumber}
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{record.fuelStatus}</div>
                  <div className="text-sm text-gray-500">
                    {record.currentReading} liters
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
                      <div className="text-sm text-gray-900">{record.rv} liters</div>
                    </div>
                  </div>
                </td>

                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                    {record.fuelDifference}%
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                  <div className="whitespace-pre-line">{record.pumpLocation}</div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                  <div className="whitespace-pre-line">{record.gpsTime}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  ₹{record.softwareReadingTotalAmount}
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
                    onClick={() => onAccept(record)}
                    className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => onReject(record)}
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
    </div>
  );
};

export default FuelTablePending;
