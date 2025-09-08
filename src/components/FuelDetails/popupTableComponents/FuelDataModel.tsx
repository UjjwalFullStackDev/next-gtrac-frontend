'use client'
import React, { useState } from 'react';
import { FileText, X, RefreshCw } from 'lucide-react';
import { Pill } from './ui/Pill';
import { useFuelGraphData } from '@/hooks/useFuelGraphData';
import axios from 'axios';


export const FuelDataModal = ({ isOpen, onClose, record }) => {
  const [otp, setOtp] = useState("");
  const [payment, setPayment] = useState("Cash");
  const [amount, setAmount] = useState("");
  const [invoiceReady, setInvoiceReady] = useState(false);
  const [invoiceUrl, setInvoiceUrl] = useState(null);
  const [manualReading, setManualReading] = useState(null);
  const [vehicleno, setVehicleno] = useState(null);

  const sysServiceId = record?.sysServiceId || record?.sys_service_id;
  const { data: graphData = [] } = useFuelGraphData(sysServiceId);


  const handleRefresh = async () => {
    try {
      const res = await axios.get(
        `http://localhost:5001/api/v1/ambulance/fuel/record/${record.id}`
      );

      if (res.data.ambulanceFuelLog.length > 0) {
        setInvoiceUrl(res.data.ambulanceFuelLog[0].invoiceFileUrl);
        setInvoiceReady(true);
        setManualReading(res.data.ambulanceFuelLog[0].manualReadingLitres);
        setVehicleno(res.data.ambulanceFuelLog[0].ambulance.ambulanceNumber)
      }

      
      console.log("Refreshed graph data:", graphData);
    } catch (err) {
      console.error("Failed to fetch invoice", err);
      alert("Could not fetch invoice");
    }
  };

  const handleSubmit = () => {
    if (!otp) {
      alert("Please enter OTP");
      return;
    }
    console.log("Submitting:", { otp, payment, amount, record });
    // Handle submission logic here
    onClose();
  };

  if (!isOpen || !record) return null;

  const diffPct = Math.abs(record.fuelDifference);
  const status = Math.abs(record.fuelDifference) > 5 ? 'Audit' : 'OK';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-8xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-indigo-500 to-purple-600">
          <div className="text-white">
            <h2 className="text-2xl font-bold">Fuel Transaction Details</h2>
            <p className="text-indigo-100">Vehicle: {record.vehicleno || vehicleno}</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              className="flex items-center gap-2 bg-white text-black bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-lg transition-all duration-200 cursor-pointer">
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            {invoiceUrl ? (
              <a
                href={invoiceUrl}
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
                    <div className="text-sm text-gray-900 whitespace-pre-line">{record.pumpLocation}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      0
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <Pill>{record.currentReading} 0L</Pill>
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-sm font-medium text-gray-900">{manualReading} L</div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-sm font-medium text-gray-900">{graphData[graphData.length - 1]?.rv} L</div>
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
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="₹ Enter amount"
                      className="w-36 rounded-lg border-2 border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-200"
                    />
                    <div className="text-xs text-gray-500 mt-1">
                      {record.softwareReadingTotalAmount}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <button
                      onClick={handleSubmit}
                      disabled={!invoiceReady}
                      className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 shadow-md
                    ${invoiceReady
                          ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 cursor-pointer"
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