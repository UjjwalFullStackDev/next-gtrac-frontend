import React from 'react';
import { FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { FuelRecord } from '@/types/FuelRecord';

interface SummaryStatsProps {
  data: FuelRecord[];
}

const SummaryStats: React.FC<SummaryStatsProps> = ({ data }) => {
  const totalAmount = data.reduce((sum, record) => sum + record.totalAmount, 0);
  const approvedCount = data.filter(r => r.status === 'ok').length;
  const auditCount = data.filter(r => r.status === 'audit').length;

  return (
    <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <div className="flex items-center">
          <div className="p-3 rounded-full bg-blue-100">
            <FileText className="w-6 h-6 text-blue-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Total Records</p>
            <p className="text-2xl font-bold text-gray-900">{data.length}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg p-6 shadow-sm">
        <div className="flex items-center">
          <div className="p-3 rounded-full bg-green-100">
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Approved</p>
            <p className="text-2xl font-bold text-gray-900">{approvedCount}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg p-6 shadow-sm">
        <div className="flex items-center">
          <div className="p-3 rounded-full bg-red-100">
            <AlertCircle className="w-6 h-6 text-red-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Pending Audit</p>
            <p className="text-2xl font-bold text-gray-900">{auditCount}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg p-6 shadow-sm">
        <div className="flex items-center">
          <div className="p-3 rounded-full bg-yellow-100">
            <span className="text-yellow-600 font-bold text-lg">₹</span>
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Total Amount</p>
            <p className="text-2xl font-bold text-gray-900">₹{totalAmount.toFixed(2)}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SummaryStats;