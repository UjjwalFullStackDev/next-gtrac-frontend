import React from 'react';
import { X, Fuel, Clock, DollarSign, AlertTriangle, MapPin, Eye } from 'lucide-react';
import { FuelRecord } from '@/types/FuelRecord';

interface VehicleDetailModalProps {
  isOpen: boolean;
  record: FuelRecord | null;
  onClose: () => void;
}

const VehicleDetailModal: React.FC<VehicleDetailModalProps> = ({ isOpen, record, onClose }) => {
  if (!isOpen || !record) return null;

  const variancePercentage = ((record.fuelDifference / record.quantityReading) * 100);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Fuel className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Vehicle Details - {record.ambulanceNumber}
              </h2>
              <p className="text-sm text-gray-600">Fuel transaction details and analysis</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-6">
          {/* Status Alert */}
          {record.status === 'audit' && (
            <div className="flex items-center space-x-3 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-red-900">Audit Required</h3>
                <p className="text-sm text-red-700">
                  Fuel reading difference exceeds 2% threshold. Manual verification needed.
                </p>
              </div>
            </div>
          )}

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Fuel className="w-5 h-5 text-gray-600" />
                <h3 className="font-medium text-gray-900">Vehicle Info</h3>
              </div>
              <div className="space-y-2 text-sm">
                <div><span className="font-medium">Vehicle ID:</span> {record.vehicle}</div>
                <div><span className="font-medium">Fuel Type:</span> {record.fuelType || record.fuelStatus}</div>
                <div><span className="font-medium">Driver:</span> {record.driverName || 'N/A'}</div>
                <div><span className="font-medium">Status:</span> 
                  <span className={`ml-2 px-2 py-1 rounded text-xs ${
                    record.status === 'audit' 
                      ? 'bg-red-100 text-red-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {record.status === 'audit' ? 'Audit Required' : 'Approved'}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Clock className="w-5 h-5 text-gray-600" />
                <h3 className="font-medium text-gray-900">Transaction Info</h3>
              </div>
              <div className="space-y-2 text-sm">
                <div><span className="font-medium">Date & Time:</span> {
                  record.gpsTime 
                    ? record.gpsTime
                    : 'N/A'
                }</div>
                <div><span className="font-medium">OTP:</span> {record.otp}</div>
                <div><span className="font-medium">Invoice:</span> {record.invoice}</div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <DollarSign className="w-5 h-5 text-gray-600" />
                <h3 className="font-medium text-gray-900">Financial Info</h3>
              </div>
              <div className="space-y-2 text-sm">
                <div><span className="font-medium">Total Amount:</span> ₹{record.softwareReadingTotalAmount}</div>
                <div><span className="font-medium">Rate per Liter:</span> ₹{(record.totalAmount / record.quantityReading).toFixed(2)}</div>
                <div><span className="font-medium">Efficiency:</span> {record.efficiency || 'N/A'} km/l</div>
              </div>
            </div>
          </div>

          {/* Fuel Readings Comparison */}
          <div className="bg-white border rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Fuel Readings Analysis</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="text-2xl font-bold text-yellow-700">{record.quantityReading}L</div>
                <div className="text-sm text-yellow-600 font-medium">Manual Reading</div>
                <div className="text-xs text-gray-500 mt-1">Physical measurement</div>
              </div>
              
              <div className="text-center p-4 bg-cyan-50 rounded-lg border border-cyan-200">
                <div className="text-2xl font-bold text-cyan-700">L</div>
                <div className="text-sm text-cyan-600 font-medium">Software Reading</div>
                <div className="text-xs text-gray-500 mt-1">System measurement</div>
              </div>
              
              <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
                <div className="text-2xl font-bold text-red-700">{record.fuelDifference.toFixed(1)}L</div>
                <div className="text-sm text-red-600 font-medium">Difference</div>
                <div className="text-xs text-gray-500 mt-1">
                  {variancePercentage.toFixed(1)}% variance
                </div>
              </div>
            </div>

            {/* Progress Bar for Difference */}
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Variance Percentage</span>
                <span>{variancePercentage.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    variancePercentage > 2 ? 'bg-red-600' : 'bg-green-600'
                  }`}
                  style={{ width: `${Math.min(variancePercentage, 100)}%` }}
                ></div>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {variancePercentage > 2 
                  ? 'Exceeds 2% threshold - Audit required' 
                  : 'Within acceptable range'}
              </div>
            </div>
          </div>

          {/* Location Information */}
          <div className="bg-white border rounded-lg p-6">
            <div className="flex items-center space-x-2 mb-4">
              <MapPin className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">Pump Location</h3>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-800 whitespace-pre-line">{record.pumpLocation}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            {record.status === 'audit' && (
              <button className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                <AlertTriangle className="w-4 h-4" />
                <span>Send Alert</span>
              </button>
            )}
            <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <Eye className="w-4 h-4" />
              <span>View Invoice</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VehicleDetailModal;