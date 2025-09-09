import React from 'react';
import { FileText } from 'lucide-react';
import { FuelRecord } from '@/types/FuelRecord';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { PRODUCTION_API_ENDPOINT } from '@/utils/constants';
import { truncateAddress } from '@/utils/truncateAddress';


interface FuelTableProps {
  data: FuelRecord[];
  onVehicleClick: (record: FuelRecord) => void;
  mode: "pending" | "processing" | "complete";
  onAccept?: (id: number) => void;
  onReject?: (id: number) => void;
  refresh?: () => void;
}

const FuelTable: React.FC<FuelTableProps> = ({ onVehicleClick }) => {

  const { data, isLoading, error } = useQuery<FuelRecord[]>({
    queryKey: ["completedFuelTransactions"],
    queryFn: async () => {
      const response = await axios.get(
        `${PRODUCTION_API_ENDPOINT}/ambulance/fuel/record/completed/all`
      );
      return response.data.data;
    },
  });

  const formatDate = (isoString: string | undefined) => {
  if (!isoString) return "-";
  const date = new Date(isoString);
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0"); 
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error fetching data</div>;

  const sortedData = (data ?? []).sort((a, b) => b.id - a.id);
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
                <div className="text-center px-2">
                  <div>(Soft) Reading</div>
                </div>
                <div className="text-center px-2">
                  <div>(App) Reading</div>
                </div>
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
                Status
              </th>
              <th className="p-3 text-left font-semibold text-sm text-gray-700">
                Report
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedData.map((record: FuelRecord) => (
              <tr key={record.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  <button
                    onClick={() => onVehicleClick(record)}
                    className="text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    {record.vehicleno}
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">Current</div>
                  <div className="text-sm text-gray-500">{record.requestedFuel} liters</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center divide-x divide-gray-300">
                    <div className="text-center px-4">
                      <div className="text-sm font-medium text-yellow-600">Quantity</div>
                      <div className="text-sm text-gray-900">{record.quantityReading} liters</div>
                    </div>
                    <div className="text-center px-4">
                      <div className="text-sm font-medium text-cyan-600">Quantity</div>
                      <div className="text-sm text-gray-900">{record.liveFuel} liters</div>
                    </div>
                  </div>
                </td>

                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                    {record.fuelDifference}%
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                  <div className="whitespace-pre-line">{truncateAddress(record.location) || "-"}</div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                  <div className="whitespace-pre-line">{formatDate(record.gpsTime || undefined)}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  ₹{record.amount}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm font-medium">
                    {record.otp}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <button className="text-blue-600 hover:text-blue-800">
                    <a
                      href={record.invoiceFileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <FileText className="w-5 h-5" />
                    </a>
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className='w-full px-3 py-1 rounded-md text-xs font-medium bg-blue-700 text-white cursor-pointer'>
                  Completed
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {record.status === 'Audit' ? (
                    <span className="inline-flex items-center justify-center w-full px-6 py-1 rounded-md text-xs font-medium bg-red-700 text-white cursor-pointer">
                      Audit
                    </span>
                  ) : (
                    <span className="inline-flex items-center justify-center w-full px-3 py-1 rounded-md text-xs font-medium bg-blue-700 text-white cursor-pointer">
                      Ok
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FuelTable;