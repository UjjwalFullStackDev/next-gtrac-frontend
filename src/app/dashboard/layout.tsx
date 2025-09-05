'use client'

import React from "react";
import { useState, useRef, useEffect } from 'react';
import RakshakLogo from "@/components/Navbar/RakshakLogo";
import SettingNavbarMenu from "@/components/Navbar/SettingNavbarMenu";
import ActivityHistoryModal from "@/components/Modal/ActivityHistoryModal";
import DashboardMenu from "@/components/Sidebar/SidebarMenus/DashboardMenu";
import AttendanceMenu from "@/components/Sidebar/SidebarMenus/AttendanceMenu";
import EmployeeManagementMenu from "@/components/Sidebar/SidebarMenus/EmployeeManagementMenu";
import LiveAttendance from "@/components/Sidebar/SidebarMenus/LiveAttendance";
import FuelDetailsMenu from "@/components/Sidebar/SidebarMenus/FuelDetailsMenu";

export default function DashboardLayout({ children }: { children: React.ReactNode }): React.ReactElement {
  const [isActivityHistoryOpen, setIsActivityHistoryOpen] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  const handleDocumentClick = (event: MouseEvent) => {

    if ( modalRef.current && !modalRef.current.contains(event.target as Node) && !(event.target as HTMLElement).closest('#activity-history-button') ) {
      setIsActivityHistoryOpen(false);
    }
  };

  useEffect(() => {
    if (isActivityHistoryOpen) {
      document.addEventListener('mousedown', handleDocumentClick);
    } else {
      document.removeEventListener('mousedown', handleDocumentClick);
    }

    return () => {
      document.removeEventListener('mousedown', handleDocumentClick);
    };
  }, [isActivityHistoryOpen]);

  return (
    <div className="w-screen h-screen relative">
      <nav className="border-b border-[#eae4e4] flex items-center justify-between w-full h-[7vh] px-3 z-10 bg-white relative">
        <RakshakLogo />
        <div className="flex items-center space-x-6">
          <SettingNavbarMenu isOpen={isActivityHistoryOpen} toggle={() => setIsActivityHistoryOpen(prev => !prev)} />
        </div>
      </nav>

      {isActivityHistoryOpen && (
        <ActivityHistoryModal modalRef={modalRef} closeModal={() => setIsActivityHistoryOpen(false)} />
      )}


      <div className="flex flex-1">
        <aside className="border-r border-[#eae4e4] flex flex-col items-center space-y-5 w-[0vw] md:w-[3.5vw] h-[93vh] py-5">
          <DashboardMenu />
          <EmployeeManagementMenu />
          <AttendanceMenu />
          <LiveAttendance />
          <FuelDetailsMenu />
        </aside>

        <main className="bg-gradient-to-br from-gray-50 to-gray-100 flex-1 h-[93vh] overflow-scroll no-scrollbar">
          {children}
        </main>
      </div>
    </div>
  );
}
