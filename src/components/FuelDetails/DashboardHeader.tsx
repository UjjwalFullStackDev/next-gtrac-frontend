// DashboardHeader.tsx
import React from "react";

interface DashboardHeaderProps {
  activeTab: "Pending" | "Processing" | "Complete";
  onTabChange: (tab: "Pending" | "Processing" | "Complete") => void;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ activeTab, onTabChange }) => {
  const tabs: Array<"Pending" | "Processing" | "Complete"> = [
    "Pending",
    "Processing",
    "Complete",
  ];

  return (
    <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
      {/* Heading */}
      <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">Fuel Details</h1>

      {/* Filter Tabs */}
      <div className="flex gap-4">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition 
              ${
                activeTab === tab
                  ? "bg-blue-600 text-white shadow"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
          >
            {tab}
          </button>
        ))}
      </div>
    </div>
  );
};

export default DashboardHeader;
