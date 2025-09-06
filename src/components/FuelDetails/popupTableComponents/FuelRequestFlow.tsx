// FuelRequestFlow.tsx - Main Component
import React, { useState } from "react";
import { FuelRequestCard } from "./FuelRequestCard";
import { FuelDetailsModal } from "./FuelDetailsModal";
import { useFuelData } from "../hooks/useFuelData";
import { fuelApiService } from "../services/fuelApiService";
import type { AlertContext } from "../types/fuelTypes";

interface FuelRequestFlowProps {
  alertId: number;
}

export default function FuelRequestFlow({ alertId }: FuelRequestFlowProps) {
  const [showRequest, setShowRequest] = useState(true);
  const [loadingAccept, setLoadingAccept] = useState(false);
  const [context, setContext] = useState<AlertContext | null>(null);
  const [showModal, setShowModal] = useState(false);

  const {
    logs,
    gpsData,
    loadingData,
    refreshData,
    softwareReading,
    gpsFilling,
    diffPct,
    status
  } = useFuelData(context);

  const handleAccept = async () => {
    try {
      setLoadingAccept(true);
      
      // Step 1: Accept alert and get context (vehicleno, sys_service_id, etc.)
      const contextData = await fuelApiService.acceptAlert(alertId);
      setContext(contextData);
      
      console.log("Alert accepted, context:", contextData);
      
      // Step 2: Hide request popup and show modal
      setShowRequest(false);
      setShowModal(true);
      
      // Step 3: Load fuel data using the context and alertId
      await refreshData(contextData, alertId);
      
    } catch (error: any) {
      console.error("Accept failed:", error);
      alert(error?.message || "Failed to accept alert");
    } finally {
      setLoadingAccept(false);
    }
  };

  const handleReject = () => {
    setShowRequest(false);
    // Here you could make an API call to mark the alert as rejected
    console.log(`Alert ${alertId} rejected`);
  };

  const handleSubmit = async (formData: {
    otp: string;
    payment: string;
    amount: string | number;
  }) => {
    if (!context) {
      alert("Missing context data");
      return;
    }
    
    // Prepare submission body with all required data
    const body = {
      alertId: context.alertId,
      ambulanceId: context.ambulanceId,
      sysServiceId: context.sysServiceId,
      ambulanceNumber: context.ambulanceNumber,
      otp: formData.otp,
      payment: formData.payment,
      amount: Number(formData.amount || 0),
      softwareReadingLitres: softwareReading,
      appReadingLitres: gpsFilling,
      fuelDifferencePct: diffPct,
      status,
      invoiceUrl: logs[0]?.invoiceFileUrl || null,
      location: logs[0]?.location || null,
      decidedAt: new Date().toISOString(),
    };

    try {
      console.log("Submitting fuel decision:", body);
      await fuelApiService.submitFuelDecision(body);
      alert("Fuel decision submitted successfully!");
      setShowModal(false);
      setContext(null);
    } catch (error: any) {
      console.error("Submit failed:", error);
      alert(error?.message || "Failed to submit decision");
    }
  };

  const handleRefresh = async () => {
    if (context) {
      await refreshData(context, alertId);
    }
  };

  return (
    <div className="p-4">
      {showRequest && (
        <FuelRequestCard
          onAccept={handleAccept}
          onReject={handleReject}
          loading={loadingAccept}
          alertId={alertId}
        />
      )}

      {showModal && context && (
        <FuelDetailsModal
          context={context}
          logs={logs}
          gpsData={gpsData}
          loadingData={loadingData}
          softwareReading={softwareReading}
          gpsFilling={gpsFilling}
          diffPct={diffPct}
          status={status}
          onClose={() => setShowModal(false)}
          onRefresh={handleRefresh}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}