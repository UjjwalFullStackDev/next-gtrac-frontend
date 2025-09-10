'use client'
import React, { useState } from 'react';
import { FileText, X, RefreshCw } from 'lucide-react';
import { Pill } from './ui/Pill';
import axios from 'axios';
import { PRODUCTION_API_ENDPOINT } from '@/utils/constants';
import { FuelDataModalProps } from '@/types/FuelDataModalProps'
import { truncateAddress } from '@/utils/truncateAddress';


export const FuelDataModal: React.FC<FuelDataModalProps>= ({ isOpen, onClose, record, refresh }) => {
  const [otp, setOtp] = useState("");
  const [payment, setPayment] = useState("Cash");
  const [amount, setAmount] = useState("");


  const handleRefresh = () => {
    // just trigger parent refresh (no API call here)
    if (refresh) refresh();
    console.log('refresh')
  };

  const handleSubmit = async () => {
    if (!otp) {
      alert("Please enter OTP");
      return;
    }
    
    const payload = {
    alertBankId: record?.alertBankId,
    fuelLogId: record?.id, 
    vehicleno: record?.vehicleno,
    location: record?.location,
    requestedFuel: record?.requestedFuel, //current fuel
    quantityReading: record?.quantityReading,  // from record invoice
    liveFuel: record?.liveFuel,  // by gps
    fuelDifference: record?.fuelDifference,
    status,
    otp,
    paymentMode: payment,
    amount,
    softwareReadingTotalAmount: record?.softwareReadingTotalAmount,
    invoiceFileUrl: record?.invoice,
    gpsTime: new Date().toISOString()
  };

  try {
    await axios.post(`${PRODUCTION_API_ENDPOINT}/ambulance/fuel/record/completed`, payload);
    alert("Transaction submitted successfully!");
    if (refresh) refresh();
    onClose();
  } catch (err) {
    console.error("Submit failed", err);
    alert("Failed to submit");
  }

  };

  if (!isOpen || !record) return null;

  const diffPct = Math.abs(record.fuelDifference);
  const status = Math.abs(record.fuelDifference) > 5 ? 'Audit' : 'OK';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-8xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-blue-500">
          <div className="text-white">
            <h2 className="text-2xl font-bold">Fuel Transaction Details</h2>
            <p className="text-indigo-100">Vehicle: {record.vehicleno}</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              className="flex items-center gap-2 bg-white text-black bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-lg transition-all duration-200 cursor-pointer">
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            {record?.invoice ? (
              <a
                href={record?.invoice}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-white bg-opacity-20 hover:bg-opacity-30 text-black px-4 py-2 rounded-lg transition-all duration-200"
              >
                <FileText className="w-4 h-4" />
                View Invoice
              </a>
            ) : (
              <button
                disabled
                className="flex items-center gap-2 bg-gray-200 text-gray-500 px-4 py-2 rounded-lg"
              >
                <FileText className="w-4 h-4" />
                No Invoice
              </button>
            )}
            <button
              onClick={onClose}
              className="text-white transition-all duration-200 cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-auto max-h-[calc(90vh-140px)]">
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-y-2">
              <thead>
                <tr className="text-left text-sm font-semibold text-gray-700 bg-gray-50 rounded-lg">
                  <th className="p-3 text-left font-semibold text-sm text-gray-700">Vehicle</th>
                  <th className="p-3 text-left font-semibold text-sm text-gray-700">Location</th>
                  <th className="p-3 text-left font-semibold text-sm text-gray-700">Current Status</th>
                  <th className="p-3 text-left font-semibold text-sm text-gray-700">Soft Reading</th>
                  <th className="p-3 text-left font-semibold text-sm text-gray-700">App Reading</th>
                  <th className="p-3 text-left font-semibold text-sm text-gray-700">Fuel Difference</th>
                  <th className="p-3 text-left font-semibold text-sm text-gray-700">OTP</th>
                  <th className="p-3 text-left font-semibold text-sm text-gray-700">Mode of Payment</th>
                  <th className="p-3 text-left font-semibold text-sm text-gray-700">Amount</th>
                  <th className="p-3 text-left font-semibold text-sm text-gray-700">Action</th>
                  <th className="p-3 text-left font-semibold text-sm text-gray-700 rounded-r-lg">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
                  <td className="px-4 py-4 rounded-l-xl">
                    <div className="font-semibold text-gray-900">{record.vehicleno}</div>
                  </td>
                  <td className="px-4 py-4 max-w-[220px]">
                    <div className="text-sm text-gray-900 whitespace-pre-line">{truncateAddress(record.location) || "-"}</div>
                  </td>
                  <td className="px-4 py-4">
                    <Pill>{record.requestedFuel || 0} L</Pill>
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-sm font-medium text-gray-900">{record.quantityReading} L</div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-sm font-medium text-gray-900">{record.liveFuel} L</div>
                  </td>
                  <td className="px-4 py-4">
                    <span className={
                      "font-semibold text-lg " + (status === "Audit" ? "text-red-600" : "text-emerald-600")
                    }>
                      {record.fuelDifference > 0 ? '+' : ''}{record.fuelDifference}%
                    </span>
                    <div className="text-xs text-gray-500 mt-1">
                      {status === "Audit" ? "Needs Review" : "Within Range"}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <input
                      type="number"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="Enter OTP"
                      className="w-32 rounded-lg border-2 border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-200"
                    />
                  </td>
                  <td className="px-4 py-4">
                    <select
                      value={payment}
                      onChange={(e) => setPayment(e.target.value)}
                      className="w-36 rounded-lg border-2 border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-200"
                    >
                      <option>UPI</option>
                      <option>Card</option>
                      <option>Online</option>
                    </select>
                  </td>
                  <td className="px-4 py-4">
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="₹ Enter amount"
                      className="w-36 rounded-lg border-2 border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-200"
                    />
                  </td>
                  <td className="px-4 py-4">
                    <button
                      onClick={handleSubmit}
                      disabled={!record?.invoice}
                      className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 shadow-md
                    ${record?.invoice
                          ? "bg-blue-500 text-white hover:bg-blue-600 cursor-pointer ease-in"
                          : "bg-gray-300 text-gray-500 cursor-not-allowed"}
                      `}
                    >
                      Submit
                    </button>
                  </td>
                  <td className="px-4 py-4 rounded-r-xl">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${status === "Audit" ? "bg-red-500" : "bg-emerald-500"}`}></div>
                      <span className={`font-medium ${status === "Audit" ? "text-red-600" : "text-emerald-600"}`}>
                        {status}
                      </span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};