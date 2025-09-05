"use client";
import { useEffect, useState, useMemo } from "react";
import { format, parseISO, startOfDay } from "date-fns";
import { PRODUCTION_API_ENDPOINT } from "@/utils/constants";
import * as XLSX from "xlsx";

interface Ambulance {
  ambulanceNumber: string;
}

interface ApiResponse {
  totalAmbulances: number;
  totalActiveAmbulances: number;
  totalInActiveAmbulances: number;
  driversOnly: number;
  emtsOnly: number;
  totalDrivers: number;
  totalEmts: number;
  totalActiveDrivers: number;
  totalActiveEmts: number;
  ambulances: {
    ambulanceNumber: string;
    dayShift: {
      name: string | null;
      employeeSystemId: string | null;
      phoneNumber: string | null;
      latestPunchInTime: string | null;
      latestPunchOutTime: string | null;
      punchOutType: string | null;
      categoryName: string;
      punctuality?: string | null;
    }[];
    nightShift: {
      name: string | null;
      employeeSystemId: string | null;
      phoneNumber: string | null;
      latestPunchInTime: string | null;
      latestPunchOutTime: string | null;
      punchOutType: string | null;
      categoryName: string;
      punctuality?: string | null;
    }[];
  }[];
}

export default function LiveAttendanceDayRoster() {
  const [inputValue, setInputValue] = useState<string>("");
  const [apiData, setApiData] = useState<ApiResponse | null>(null);
  const [ambulances, setAmbulances] = useState<Ambulance[]>([]);

  const fetchEmployeeAttendance = async () => {
    try {
      const res = await fetch(`${PRODUCTION_API_ENDPOINT}/dashboard/ambulance/day/attendance`);
      if (!res.ok) throw new Error("Failed to fetch employee data");
      const data: ApiResponse = await res.json();
      setApiData((prevData) => {
        const prevString = JSON.stringify(prevData);
        const newString = JSON.stringify(data);
        if (prevString !== newString) return data;
        return prevData;
      });
    } catch (error) {
      console.error("Error fetching employee data:", error);
    }
  };

  useEffect(() => {
    fetchEmployeeAttendance();
    const intervalId = setInterval(fetchEmployeeAttendance, 1000);
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const fetchAmbulances = async () => {
      try {
        const res = await fetch(`${PRODUCTION_API_ENDPOINT}/ambulances/all`);
        if (!res.ok) throw new Error("Failed to fetch ambulances");
        const data: Ambulance[] = await res.json();
        setAmbulances(data);
      } catch (error) {
        console.error("Error fetching ambulances:", error);
      }
    };
    fetchAmbulances();
  }, []);

  const dateRangeDays = useMemo(() => {
    return [format(startOfDay(new Date()), "yyyy-MM-dd")];
  }, []);

  const getLatestActivityTime = (ambulanceNumber: string) => {
    if (!apiData) return -Infinity;
    const ambulance = apiData.ambulances.find((amb) => amb.ambulanceNumber === ambulanceNumber);
    if (!ambulance) return -Infinity;

    const allTimes = [
      ...ambulance.dayShift
        .filter((shift) => shift.latestPunchInTime)
        .map((shift) => new Date(shift.latestPunchInTime!).getTime()),
      ...ambulance.nightShift
        .filter((shift) => shift.latestPunchInTime)
        .map((shift) => new Date(shift.latestPunchInTime!).getTime()),
    ];

    return allTimes.length > 0 ? Math.max(...allTimes) : -Infinity;
  };

  const filteredAmbulances = useMemo(() => {
    if (!apiData) return [];
    return [...ambulances]
      .filter((ambulance) => {
        const ambData = apiData.ambulances.find((a) => a.ambulanceNumber === ambulance.ambulanceNumber);
        return (
          ambulance.ambulanceNumber.toLowerCase().includes(inputValue.toLowerCase()) ||
          (ambData &&
            [...ambData.dayShift, ...ambData.nightShift].some(
              (shift) =>
                (shift.name?.toLowerCase().includes(inputValue.toLowerCase()) ||
                  shift.employeeSystemId?.toLowerCase().includes(inputValue.toLowerCase())) &&
                shift.latestPunchInTime
            ))
        );
      })
      .filter((amb) => !amb.ambulanceNumber.toLowerCase().startsWith('itg'))
      .sort((a, b) => getLatestActivityTime(b.ambulanceNumber) - getLatestActivityTime(a.ambulanceNumber));
  }, [ambulances, apiData, inputValue]);

  const isLoading = !apiData || ambulances.length === 0;

  const exportToExcel = () => {
    const wb = XLSX.utils.book_new();
    const wsData: any[] = [];

    const headers = [
      "Ambulance Number",
      "Date",
      "Day Shift Driver Name",
      "Day Shift Driver Punch In",
      "Day Shift Driver Punch Out",
      "Day Shift EMT Name",
      "Day Shift EMT Punch In",
      "Day Shift EMT Punch Out",
      "Night Shift Driver Name",
      "Night Shift Driver Punch In",
      "Night Shift Driver Punch Out",
      "Night Shift EMT Name",
      "Night Shift EMT Punch In",
      "Night Shift EMT Punch Out",
    ];
    wsData.push(headers);

    filteredAmbulances.forEach((ambulance) => {
      dateRangeDays.forEach((date) => {
        const ambData = apiData?.ambulances.find((a) => a.ambulanceNumber === ambulance.ambulanceNumber);
        const dayDriver = ambData?.dayShift.find((shift) => shift.categoryName === "Driver" && shift.latestPunchInTime);
        const dayEmt = ambData?.dayShift.find((shift) => shift.categoryName === "EMT" && shift.latestPunchInTime);
        const nightDriver = ambData?.nightShift.find((shift) => shift.categoryName === "Driver" && shift.latestPunchInTime);
        const nightEmt = ambData?.nightShift.find((shift) => shift.categoryName === "EMT" && shift.latestPunchInTime);

        wsData.push([
          ambulance.ambulanceNumber || "-",
          date,
          dayDriver?.name || "-",
          dayDriver?.latestPunchInTime ? format(parseISO(dayDriver.latestPunchInTime), "hh:mm:ss a") : "-",
          dayDriver?.latestPunchOutTime ? format(parseISO(dayDriver.latestPunchOutTime), "hh:mm:ss a") : "-",
          dayEmt?.name || "-",
          dayEmt?.latestPunchInTime ? format(parseISO(dayEmt.latestPunchInTime), "hh:mm:ss a") : "-",
          dayEmt?.latestPunchOutTime ? format(parseISO(dayEmt.latestPunchOutTime), "hh:mm:ss a") : "-",
          nightDriver?.name || "-",
          nightDriver?.latestPunchInTime ? format(parseISO(nightDriver.latestPunchInTime), "hh:mm:ss a") : "-",
          nightDriver?.latestPunchOutTime ? format(parseISO(nightDriver.latestPunchOutTime), "hh:mm:ss a") : "-",
          nightEmt?.name || "-",
          nightEmt?.latestPunchInTime ? format(parseISO(nightEmt.latestPunchInTime), "hh:mm:ss a") : "-",
          nightEmt?.latestPunchOutTime ? format(parseISO(nightEmt.latestPunchOutTime), "hh:mm:ss a") : "-",
        ]);
      });
    });

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws["!cols"] = [
      { wch: 15 },
      { wch: 12 },
      { wch: 20 },
      { wch: 15 },
      { wch: 15 },
      { wch: 20 },
      { wch: 15 },
      { wch: 15 },
      { wch: 20 },
      { wch: 15 },
      { wch: 15 },
      { wch: 20 },
      { wch: 15 },
      { wch: 15 },
    ];
    ws["!autofilter"] = { ref: `A1:N${wsData.length}` };
    ws["!freeze"] = { xSplit: 0, ySplit: 1 };

    for (let i = 1; i < wsData.length; i++) {
      const rowRef = `A${i + 1}:N${i + 1}`;
      ws[rowRef] = ws[rowRef] || {};
      ws[rowRef].s = {
        fill: { fgColor: { rgb: i % 2 === 0 ? "F5F5F5" : "FFFFFF" } },
      };
    }

    for (let i = 1; i < wsData.length; i++) {
      if (wsData[i][1]) ws[`B${i + 1}`].t = "s";
      if (wsData[i][3]) ws[`D${i + 1}`].t = "s";
      if (wsData[i][4]) ws[`E${i + 1}`].t = "s";
      if (wsData[i][6]) ws[`G${i + 1}`].t = "s";
      if (wsData[i][7]) ws[`H${i + 1}`].t = "s";
      if (wsData[i][9]) ws[`J${i + 1}`].t = "s";
      if (wsData[i][10]) ws[`K${i + 1}`].t = "s";
      if (wsData[i][12]) ws[`M${i + 1}`].t = "s";
      if (wsData[i][13]) ws[`N${i + 1}`].t = "s";
    }

    XLSX.utils.book_append_sheet(wb, ws, "Duty Roster");
    const fileName = `Duty_Roster_${format(startOfDay(new Date()), "yyyy-MM-dd")}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  return (
    <div className="p-3">
      <section className="mb-1">
        <div className="flex flex-col md:flex-row justify-between gap-6 items-center">
          <div>
            <div className="flex items-center">
              <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">Real Time Attendance</h1>
              <span className="ml-3 inline-flex items-center rounded-xl bg-[#3778E1] px-3 py-[1px] text-sm font-semibold text-white">
                <span className="mr-2 h-2 w-2 animate-pulse rounded-full bg-white"></span>
                Live
              </span>
            </div>
            <p className="mt-1 text-gray-600">Track, manage, and analyze employee attendance in real-time</p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
            <div className="relative">
              <input id="employee-name" className="peer w-full bg-transparent text-gray-800 text-sm border border-gray-300 rounded-md px-3 py-[7px] pr-8 focus:outline-none focus:border-blue-500 hover:border-blue-200 focus:shadow" placeholder=" " value={inputValue} onChange={(e) => setInputValue(e.target.value)}/>
              <label htmlFor="employee-name" className={`absolute pointer-events-none bg-gradient-to-br from-gray-50 to-gray-100 px-1 left-3 text-gray-700 text-sm transition-all duration-300 ${inputValue ? "-top-2 text-[13px] text-blue-600" : "top-1.5 peer-placeholder morph text-sm text-gray-400"} peer-focus:-top-2 peer-focus:text-[13px] peer-focus:text-blue-600`}>Search</label>
              <span className="absolute inset-y-0 right-2.5 flex items-center text-gray-400 peer-focus:text-blue-600 peer-placeholder-shown:text-gray-400">
                <svg width="18" height="18" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-inherit">
                  <path d="M7.66659 13.9999C11.1644 13.9999 13.9999 11.1644 13.9999 7.66659C13.9999 4.16878 11.1644 1.3339 7.66659 1.3339C4.16878 1.3339 1.3339 4.16878 1.3339 7.6669C1.3339 11.1644 4.16878 13.9999 7.66659 13.9999Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M14.6666 14.6666L13.3333 13.3333" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
            </div>
            <button onClick={exportToExcel} className="relative overflow-x-hidden py-[3px] px-2 cursor-pointer border border-[#1D6F42] text-[#1D6F42] font-bold rounded-md inline-flex items-center group">
              <span className="relative z-10 flex items-center group-hover:text-white duration-700">
                <svg xmlns="http://www.w3.org/2000/svg" width={48} height={48} viewBox="0 0 24 24" className="w-5 h-5 me-2 group-hover:fill-white duration-700">
                  <path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21c.607-.59 3-2.16 3-3s-2.393-2.41-3-3m2 3h-7m-2 3c-4.714 0-7.071 0-8.536-1.465C2 18.072 2 15.715 2 11V7.944c0-1.816 0-2.724.38-3.406A3 3 0 0 1 3.538 3.38C4.22 3 5.128 3 6.944 3C8.108 3 8.69 3 9.2 3.191c1.163.436 1.643 1.493 2.168 2.542L12 7M8 7h8.75c2.107 0 3.16 0 3.917.506a3 3 0 0 1 .827.827C21.98 9.06 22 10.06 22 12v1" color="currentColor"></path>
                </svg>
                Export
              </span>
              <div className="absolute inset-0 bg-[#1D6F42] transition-transform duration-500 transform -translate-x-full group-hover:translate-x-0"></div>
            </button>
          </div>
        </div>
      </section>

      <section className="relative bg-white rounded-md overflow-hidden h-[79vh] animate-slide-up border border-gray-200">
        <div className="h-full w-full overflow-auto custom-scrollbar">
          <div className="min-w-max">
            <div className="flex sticky top-0 z-40 bg-white border-b border-gray-200">
              <div className="flex items-center justify-center border-r border-gray-200 w-[17.5rem] min-w-[17.5rem] h-16 px-4 sticky left-0 z-50 bg-gray-50">
                <p className="text-sm font-bold text-gray-900">Ambulance</p>
              </div>
              {dateRangeDays.map((date, index) => (
                <div key={index} className="flex border-r border-gray-200 w-[70rem] min-w-[70rem] h-16">
                  <div className="flex flex-col items-center justify-center w-[36.4rem] min-w-[36.4rem] bg-blue-100 text-blue-800 transition-all duration-200" aria-label={`Date: ${format(parseISO(date), "MMMM d, yyyy")} - Day`}>
                    <span className="text-xs font-bold">{format(parseISO(date), "MMMM d, yyyy")}</span>
                    <span className="text-sm text-gray-500">Day Shift (8 AM - 8 PM)</span>
                  </div>
                  <div className="flex flex-col items-center justify-center w-[36.4rem] min-w-[36.4rem] bg-purple-100 text-purple-800 transition-all duration-200" aria-label={`Date: ${format(parseISO(date), "MMMM d, yyyy")} - Night`}>
                    <span className="text-xs font-bold">{format(parseISO(date), "MMMM d, yyyy")}</span>
                    <span className="text-sm text-gray-500">Night Shift (8 PM - 8 AM)</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex flex-col">
              {isLoading ? (
                // Skeleton Loader
                <div className="flex flex-col">
                  {[...Array(5)].map((_, rowIndex) => (
                    <div key={rowIndex} className={`flex ${rowIndex % 2 === 0 ? "bg-gray-50" : "bg-white"} transition-all duration-200`}>
                      <div className="flex items-center justify-center border-b border-r border-gray-200 w-[17.5rem] min-w-[17.5rem] h-24 px-4 sticky left-0 z-10 bg-gray-50">
                        <div className="w-3/4 h-4 bg-gray-200 rounded animate-pulse"></div>
                      </div>
                      {dateRangeDays.map((_, dayIndex) => (
                        <div key={dayIndex} className="flex w-[70rem] min-w-[70rem]">
                          <div className="flex flex-col justify-center border-r border-b border-gray-200 w-[36.4rem] min-w-[36.4rem] h-24 px-4">
                            <div className="flex flex-col items-center space-y-2">
                              <div className="grid grid-cols-3 w-full text-[10px] text-center mt-3">
                                <div className="w-3/4 h-3 bg-gray-200 rounded animate-pulse mx-auto"></div>
                                <div className="text-gray-400">|</div>
                                <div className="w-3/4 h-3 bg-gray-200 rounded animate-pulse mx-auto"></div>
                              </div>
                              <div className="grid grid-cols-3 w-full text-xs text-center">
                                <div className="flex flex-col items-center space-y-1">
                                  <div className="w-3/4 h-3 bg-gray-200 rounded animate-pulse"></div>
                                  <div className="mb-3">
                                    <div className="grid grid-cols-3 text-[10px] text-center">
                                      <div className="w-3/4 h-3 bg-gray-200 rounded animate-pulse mx-auto"></div>
                                      <div className="text-gray-400">|</div>
                                      <div className="w-3/4 h-3 bg-gray-200 rounded animate-pulse mx-auto"></div>
                                    </div>
                                    <div className="grid grid-cols-3 text-[10px] text-center">
                                      <div className="flex flex-col items-center">
                                        <div className="w-3/4 h-3 bg-gray-200 rounded animate-pulse"></div>
                                        <div className="w-3/4 h-3 bg-gray-200 rounded animate-pulse mt-1"></div>
                                      </div>
                                      <div className="text-gray-400">|</div>
                                      <div className="flex flex-col items-center">
                                        <div className="w-3/4 h-3 bg-gray-200 rounded animate-pulse"></div>
                                        <div className="w-3/4 h-3 bg-gray-200 rounded animate-pulse mt-1"></div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <div className="text-gray-400">|</div>
                                <div className="flex flex-col items-center space-y-1">
                                  <div className="w-3/4 h-3 bg-gray-200 rounded animate-pulse"></div>
                                  <div className="mb-3">
                                    <div className="grid grid-cols-3 text-[10px] text-center">
                                      <div className="w-3/4 h-3 bg-gray-200 rounded animate-pulse mx-auto"></div>
                                      <div className="text-gray-400">|</div>
                                      <div className="w-3/4 h-3 bg-gray-200 rounded animate-pulse mx-auto"></div>
                                    </div>
                                    <div className="grid grid-cols-3 text-[10px] text-center">
                                      <div className="flex flex-col items-center">
                                        <div className="w-3/4 h-3 bg-gray-200 rounded animate-pulse"></div>
                                        <div className="w-3/4 h-3 bg-gray-200 rounded animate-pulse mt-1"></div>
                                      </div>
                                      <div className="text-gray-400">|</div>
                                      <div className="flex flex-col items-center">
                                        <div className="w-3/4 h-3 bg-gray-200 rounded animate-pulse"></div>
                                        <div className="w-3/4 h-3 bg-gray-200 rounded animate-pulse mt-1"></div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col justify-center border-r border-b border-gray-200 w-[36.4rem] min-w-[36.4rem] h-24 px-4">
                            <div className="flex flex-col items-center space-y-2">
                              <div className="grid grid-cols-3 w-full text-[10px] text-center mt-3">
                                <div className="w-3/4 h-3 bg-gray-200 rounded animate-pulse mx-auto"></div>
                                <div className="text-gray-400">|</div>
                                <div className="w-3/4 h-3 bg-gray-200 rounded animate-pulse mx-auto"></div>
                              </div>
                              <div className="grid grid-cols-3 w-full text-xs text-center">
                                <div className="flex flex-col items-center space-y-1">
                                  <div className="w-3/4 h-3 bg-gray-200 rounded animate-pulse"></div>
                                  <div className="mb-3">
                                    <div className="grid grid-cols-3 text-[10px] text-center">
                                      <div className="w-3/4 h-3 bg-gray-200 rounded animate-pulse mx-auto"></div>
                                      <div className="text-gray-400">|</div>
                                      <div className="w-3/4 h-3 bg-gray-200 rounded animate-pulse mx-auto"></div>
                                    </div>
                                    <div className="grid grid-cols-3 text-[10px] text-center">
                                      <div className="flex flex-col items-center">
                                        <div className="w-3/4 h-3 bg-gray-200 rounded animate-pulse"></div>
                                        <div className="w-3/4 h-3 bg-gray-200 rounded animate-pulse mt-1"></div>
                                      </div>
                                      <div className="text-gray-400">|</div>
                                      <div className="flex flex-col items-center">
                                        <div className="w-3/4 h-3 bg-gray-200 rounded animate-pulse"></div>
                                        <div className="w-3/4 h-3 bg-gray-200 rounded animate-pulse mt-1"></div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <div className="text-gray-400">|</div>
                                <div className="flex flex-col items-center space-y-1">
                                  <div className="w-3/4 h-3 bg-gray-200 rounded animate-pulse"></div>
                                  <div className="mb-3">
                                    <div className="grid grid-cols-3 text-[10px] text-center">
                                      <div className="w-3/4 h-3 bg-gray-200 rounded animate-pulse mx-auto"></div>
                                      <div className="text-gray-400">|</div>
                                      <div className="w-3/4 h-3 bg-gray-200 rounded animate-pulse mx-auto"></div>
                                    </div>
                                    <div className="grid grid-cols-3 text-[10px] text-center">
                                      <div className="flex flex-col items-center">
                                        <div className="w-3/4 h-3 bg-gray-200 rounded animate-pulse"></div>
                                        <div className="w-3/4 h-3 bg-gray-200 rounded animate-pulse mt-1"></div>
                                      </div>
                                      <div className="text-gray-400">|</div>
                                      <div className="flex flex-col items-center">
                                        <div className="w-3/4 h-3 bg-gray-200 rounded animate-pulse"></div>
                                        <div className="w-3/4 h-3 bg-gray-200 rounded animate-pulse mt-1"></div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              ) : filteredAmbulances.length > 0 ? (
                filteredAmbulances.map((ambulance, rowIndex) => (
                  <div key={ambulance.ambulanceNumber} className={`flex ${rowIndex % 2 === 0 ? "bg-gray-50" : "bg-white"} transition-all duration-200`}>
                    <div className="flex items-center justify-center border-b border-r border-gray-200 w-[17.5rem] min-w-[17.5rem] h-24 px-4 sticky left-0 z-10 bg-gray-50">
                      <h1 className="text-sm font-semibold text-gray-900 text-center" title={ambulance.ambulanceNumber}>{ambulance.ambulanceNumber}</h1>
                    </div>
                    {dateRangeDays.map((date, dayIndex) => {
                      const ambData = apiData?.ambulances.find((a) => a.ambulanceNumber === ambulance.ambulanceNumber);
                      const dayDriver = ambData?.dayShift.find((shift) => shift.categoryName === "Driver" && shift.latestPunchInTime);
                      const dayEmt = ambData?.dayShift.find((shift) => shift.categoryName === "EMT" && shift.latestPunchInTime);
                      const nightDriver = ambData?.nightShift.find((shift) => shift.categoryName === "Driver" && shift.latestPunchInTime);
                      const nightEmt = ambData?.nightShift.find((shift) => shift.categoryName === "EMT" && shift.latestPunchInTime);
                      return (
                        <div key={dayIndex} className="flex w-[70rem] min-w-[70rem]">
                          <div className="flex flex-col justify-center border-r border-b border-gray-200 w-[36.4rem] min-w-[36.4rem] h-24 px-4 relative group">
                            {dayDriver || dayEmt ? (
                              <div className="flex flex-col items-center space-y-2">
                                <div className="grid grid-cols-3 w-full text-gray-500 text-[10px] font-semibold text-center mt-3">
                                  <div>Driver</div>
                                  <div className="text-gray-400">|</div>
                                  <div>EMT</div>
                                </div>
                                <div className="grid grid-cols-3 w-full text-gray-700 text-xs font-medium text-center">
                                  <div className="flex flex-col items-center space-y-1">
                                    <span className="truncate px-2">{dayDriver?.name || "--"}</span>
                                    {dayDriver && (
                                      <div className="mb-3">
                                        <div className="grid grid-cols-3 text-gray-500 text-[10px] text-center">
                                          <div>In</div>
                                          <div className="text-center text-gray-400">|</div>
                                          <div>Out</div>
                                        </div>
                                        <div className="grid grid-cols-3 text-gray-900 text-[10px] font-medium text-center">
                                          <div className="flex flex-col items-center">
                                            <span>{dayDriver.latestPunchInTime ? format(parseISO(dayDriver.latestPunchInTime), "hh:mm:ss a") : "--"}</span>
                                            <span>{dayDriver.latestPunchInTime ? format(parseISO(dayDriver.latestPunchInTime), "MMMM d, yyyy") : "--"}</span>
                                          </div>
                                          <div className="text-center text-gray-400">|</div>
                                          <div className="flex flex-col items-center">
                                            {dayDriver.latestPunchOutTime ? (
                                              <>
                                                <span>{format(parseISO(dayDriver.latestPunchOutTime), "hh:mm:ss a")}</span>
                                                <span>{format(parseISO(dayDriver.latestPunchOutTime), "MMMM d, yyyy")}</span>
                                              </>
                                            ) : (
                                              <span>-</span>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                  <div className="text-gray-400">|</div>
                                  <div className="flex flex-col items-center space-y-1">
                                    <span className="truncate px-2">{dayEmt?.name || "--"}</span>
                                    {dayEmt && (
                                      <div className="mb-3">
                                        <div className="grid grid-cols-3 text-gray-500 text-[10px] text-center">
                                          <div>In</div>
                                          <div className="text-center text-gray-400">|</div>
                                          <div>Out</div>
                                        </div>
                                        <div className="grid grid-cols-3 text-gray-900 text-[10px] font-medium text-center">
                                          <div className="flex flex-col items-center">
                                            <span>{dayEmt.latestPunchInTime ? format(parseISO(dayEmt.latestPunchInTime), "hh:mm:ss a") : "--"}</span>
                                            <span>{dayEmt.latestPunchInTime ? format(parseISO(dayEmt.latestPunchInTime), "MMMM d, yyyy") : "--"}</span>
                                          </div>
                                          <div className="text-center text-gray-400">|</div>
                                          <div className="flex flex-col items-center">
                                            {dayEmt.latestPunchOutTime ? (
                                              <>
                                                <span>{format(parseISO(dayEmt.latestPunchOutTime), "hh:mm:ss a")}</span>
                                                <span>{format(parseISO(dayEmt.latestPunchOutTime), "MMMM d, yyyy")}</span>
                                              </>
                                            ) : (
                                              <span>-</span>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center justify-center h-full">
                                <span className="text-sm font-medium text-gray-400">-</span>
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col justify-center border-r border-b border-gray-200 w-[36.4rem] min-w-[36.4rem] h-24 px-4 relative group">
                            {nightDriver || nightEmt ? (
                              <div className="flex flex-col items-center space-y-2">
                                <div className="grid grid-cols-3 w-full text-gray-500 text-[10px] font-semibold text-center mt-3">
                                  <div>Driver</div>
                                  <div className="text-gray-400">|</div>
                                  <div>EMT</div>
                                </div>
                                <div className="grid grid-cols-3 w-full text-gray-700 text-xs font-medium text-center">
                                  <div className="flex flex-col items-center space-y-1">
                                    <span className="truncate px-2">{nightDriver?.name || "--"}</span>
                                    {nightDriver && (
                                      <div className="mb-3">
                                        <div className="grid grid-cols-3 text-gray-500 text-[10px] text-center">
                                          <div>In</div>
                                          <div className="text-center text-gray-400">|</div>
                                          <div>Out</div>
                                        </div>
                                        <div className="grid grid-cols-3 text-gray-900 text-[10px] font-medium text-center">
                                          <div className="flex flex-col items-center">
                                            <span>{nightDriver.latestPunchInTime ? format(parseISO(nightDriver.latestPunchInTime), "hh:mm:ss a") : "--"}</span>
                                            <span>{nightDriver.latestPunchInTime ? format(parseISO(nightDriver.latestPunchInTime), "MMMM d, yyyy") : "--"}</span>
                                          </div>
                                          <div className="text-center text-gray-400">|</div>
                                          <div className="flex flex-col items-center">
                                            {nightDriver.latestPunchOutTime ? (
                                              <>
                                                <span>{format(parseISO(nightDriver.latestPunchOutTime), "hh:mm:ss a")}</span>
                                                <span>{format(parseISO(nightDriver.latestPunchOutTime), "MMMM d, yyyy")}</span>
                                              </>
                                            ) : (
                                              <span>-</span>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                  <div className="text-gray-400">|</div>
                                  <div className="flex flex-col items-center space-y-1">
                                    <span className="truncate px-2">{nightEmt?.name || "--"}</span>
                                    {nightEmt && (
                                      <div className="mb-3">
                                        <div className="grid grid-cols-3 text-gray-500 text-[10px] text-center">
                                          <div>In</div>
                                          <div className="text-center text-gray-400">|</div>
                                          <div>Out</div>
                                        </div>
                                        <div className="grid grid-cols-3 text-gray-900 text-[10px] font-medium text-center">
                                          <div className="flex flex-col items-center">
                                            <span>{nightEmt.latestPunchInTime ? format(parseISO(nightEmt.latestPunchInTime), "hh:mm:ss a") : "--"}</span>
                                            <span>{nightEmt.latestPunchInTime ? format(parseISO(nightEmt.latestPunchInTime), "MMMM d, yyyy") : "--"}</span>
                                          </div>
                                          <div className="text-center text-gray-400">|</div>
                                          <div className="flex flex-col items-center">
                                            {nightEmt.latestPunchOutTime ? (
                                              <>
                                                <span>{format(parseISO(nightEmt.latestPunchOutTime), "hh:mm:ss a")}</span>
                                                <span>{format(parseISO(nightEmt.latestPunchOutTime), "MMMM d, yyyy")}</span>
                                              </>
                                            ) : (
                                              <span>-</span>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center justify-center h-full">
                                <span className="text-sm font-medium text-gray-400">-</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))
              ) : (
                <div className="flex items-center justify-center h-64 w-full">
                  <p className="text-gray-500 text-sm font-medium">No data matches your search.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
        .animate-slide-up {
          animation: slide-up 0.5s ease-out;
        }
      `}</style>
    </div>
  );
}