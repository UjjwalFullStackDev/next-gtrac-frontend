"use client";
import { useEffect, useState, useMemo } from "react";
import { format, isSameDay, parseISO, startOfDay, subDays, addDays } from "date-fns";
import { PRODUCTION_API_ENDPOINT } from "@/utils/constants";
import * as XLSX from "xlsx";
import CustomDatePicker from "@/components/CustomDatePicker";

interface Attendance {
  ambulanceNumber: string;
  date: string;
  punchTime: string;
  status: string;
}

interface Employee {
  id: number;
  employeeSystemId: string;
  name: string;
  phoneNumber: string;
  userRole: string;
  attendance: Attendance[];
}

interface Ambulance {
  ambulanceNumber: string;
}

export default function LiveAttendanceDayRoster() {
  const [inputValue, setInputValue] = useState<string>("");
  const [employeeAttendanceData, setEmployeeAttendanceData] = useState<Employee[]>([]);
  const [ambulances, setAmbulances] = useState<Ambulance[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

  const fetchEmployeeAttendance = async () => {
    if (!selectedDate) return;
    const formattedDate = format(startOfDay(selectedDate), "yyyy-MM-dd");
    const nextDay = format(addDays(startOfDay(selectedDate), 1), "yyyy-MM-dd");
    try {
      const res = await fetch(`${PRODUCTION_API_ENDPOINT}/attendance?startDate=${formattedDate}&endDate=${nextDay}`);
      if (!res.ok) throw new Error("Failed to fetch employee data");
      const data: Employee[] = await res.json();
      setEmployeeAttendanceData((prevData) => {
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
  }, [selectedDate]);

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
    return selectedDate ? [format(startOfDay(selectedDate), "yyyy-MM-dd")] : [];
  }, [selectedDate]);

  const getAttendanceForAmbulanceAndDate = (ambulanceNumber: string, date: string) => {
    const targetDate = parseISO(date);
    const nextDay = addDays(targetDate, 1);

    const employeesOnDate = employeeAttendanceData.filter((emp) =>
      emp.attendance.some((att) => {
        const attDate = parseISO(att.date);
        const punchTime = parseISO(att.punchTime);
        const hour = punchTime.getHours();
        return (
          att.ambulanceNumber === ambulanceNumber &&
          ((isSameDay(attDate, targetDate) && (hour >= 8 || hour >= 20)) ||
           (isSameDay(attDate, nextDay) && hour < 8))
        );
      })
    );

    const isDayShift = (punchTime: string) => {
      const hour = parseISO(punchTime).getHours();
      return hour >= 8 && hour < 20;
    };

    const isNightShift = (punchTime: string) => {
      const hour = parseISO(punchTime).getHours();
      return hour >= 20 || hour < 8;
    };

    const getShiftAttendance = (employees: Employee[], shiftFilter: (punchTime: string) => boolean) => {
      const drivers = employees
        .filter((emp) => emp.userRole.toLowerCase() === "driver" && !emp.employeeSystemId.toLowerCase().startsWith('itg'))
        .map((emp) => {
          const attendance = emp.attendance
            .filter((att) => {
              const attDate = parseISO(att.date);
              const punchTime = parseISO(att.punchTime);
              const hour = punchTime.getHours();
              return (
                att.ambulanceNumber === ambulanceNumber &&
                att.status === "PunchIn" &&
                shiftFilter(att.punchTime) &&
                ((isSameDay(attDate, targetDate) && (hour >= 8 || hour >= 20)) ||
                 (isSameDay(attDate, nextDay) && hour < 8))
              );
            })
            .sort((a, b) => b.punchTime.localeCompare(a.punchTime));
          const firstPunchIn = attendance[0]?.punchTime;
          const lastPunchOut = emp.attendance
            .filter((att) => {
              const attDate = parseISO(att.date);
              const punchTime = parseISO(att.punchTime);
              const hour = punchTime.getHours();
              return (
                att.ambulanceNumber === ambulanceNumber &&
                att.status === "PunchOut" &&
                ((isSameDay(attDate, targetDate) && (hour >= 8 || hour >= 20)) ||
                 (isSameDay(attDate, nextDay) && hour < 8))
              );
            })
            .sort((a, b) => b.punchTime.localeCompare(a.punchTime))[0]?.punchTime;
          return {
            name: emp.name,
            employeeSystemId: emp.employeeSystemId,
            firstPunchIn: firstPunchIn ? format(parseISO(firstPunchIn), "hh:mm:ss a") : "",
            lastPunchOut: lastPunchOut ? format(parseISO(lastPunchOut), "hh:mm:ss a") : "",
            firstPunchDate: firstPunchIn ? format(parseISO(firstPunchIn), "MMMM d, yyyy") : "",
            lastPunchDate: lastPunchOut ? format(parseISO(lastPunchOut), "MMMM d, yyyy") : "",
            punchInTime: firstPunchIn ? parseISO(firstPunchIn).getTime() : 0,
            punchOutTime: lastPunchOut ? parseISO(lastPunchOut).getTime() : 0,
          };
        })
        .filter((driver) => driver.firstPunchIn)
        .sort((a, b) => b.punchInTime - a.punchInTime)
        .slice(0, 1);

      const emts = employees
        .filter((emp) => emp.userRole.toLowerCase() === "emt" && !emp.employeeSystemId.toLowerCase().startsWith('itg'))
        .map((emp) => {
          const attendance = emp.attendance
            .filter((att) => {
              const attDate = parseISO(att.date);
              const punchTime = parseISO(att.punchTime);
              const hour = punchTime.getHours();
              return (
                att.ambulanceNumber === ambulanceNumber &&
                att.status === "PunchIn" &&
                shiftFilter(att.punchTime) &&
                ((isSameDay(attDate, targetDate) && (hour >= 8 || hour >= 20)) ||
                 (isSameDay(attDate, nextDay) && hour < 8))
              );
            })
            .sort((a, b) => b.punchTime.localeCompare(a.punchTime));
          const firstPunchIn = attendance[0]?.punchTime;
          const lastPunchOut = emp.attendance
            .filter((att) => {
              const attDate = parseISO(att.date);
              const punchTime = parseISO(att.punchTime);
              const hour = punchTime.getHours();
              return (
                att.ambulanceNumber === ambulanceNumber &&
                att.status === "PunchOut" &&
                ((isSameDay(attDate, targetDate) && (hour >= 8 || hour >= 20)) ||
                 (isSameDay(attDate, nextDay) && hour < 8))
              );
            })
            .sort((a, b) => b.punchTime.localeCompare(a.punchTime))[0]?.punchTime;
          return {
            name: emp.name,
            employeeSystemId: emp.employeeSystemId,
            firstPunchIn: firstPunchIn ? format(parseISO(firstPunchIn), "hh:mm:ss a") : "",
            lastPunchOut: lastPunchOut ? format(parseISO(lastPunchOut), "hh:mm:ss a") : "",
            firstPunchDate: firstPunchIn ? format(parseISO(firstPunchIn), "MMMM d, yyyy") : "",
            lastPunchDate: lastPunchOut ? format(parseISO(lastPunchOut), "MMMM d, yyyy") : "",
            punchInTime: firstPunchIn ? parseISO(firstPunchIn).getTime() : 0,
            punchOutTime: lastPunchOut ? parseISO(lastPunchOut).getTime() : 0,
          };
        })
        .filter((emt) => emt.firstPunchIn)
        .sort((a, b) => b.punchInTime - a.punchInTime)
        .slice(0, 1);

      return { drivers, emts };
    };

    return {
      day: getShiftAttendance(employeesOnDate, isDayShift),
      night: getShiftAttendance(employeesOnDate, isNightShift),
    };
  };

  const getLatestActivityTime = (ambulanceNumber: string) => {
    const { day, night } = getAttendanceForAmbulanceAndDate(ambulanceNumber, selectedDate ? format(startOfDay(selectedDate), "yyyy-MM-dd") : "");
    const allTimes = [
      ...day.drivers.flatMap(driver => [driver.firstPunchIn, driver.lastPunchOut]),
      ...day.emts.flatMap(emt => [emt.firstPunchIn, emt.lastPunchOut]),
      ...night.drivers.flatMap(driver => [driver.firstPunchIn, driver.lastPunchOut]),
      ...night.emts.flatMap(emt => [emt.firstPunchIn, emt.lastPunchOut]),
    ].filter(Boolean);

    return allTimes.length > 0 ? Math.max(...allTimes.map((time) => new Date(`1970-01-01 ${time}`).getTime())) : -Infinity;
  };

  const filteredAmbulances = useMemo(() => {
    return [...ambulances]
      .filter((ambulance) => ambulance.ambulanceNumber.toLowerCase().includes(inputValue.toLowerCase()) || employeeAttendanceData.some((emp) => (emp.name.toLowerCase().includes(inputValue.toLowerCase()) || emp.employeeSystemId.toLowerCase().includes(inputValue.toLowerCase())) && emp.attendance.some((att) => att.ambulanceNumber === ambulance.ambulanceNumber)))
      .filter((ambulance) => !ambulance.ambulanceNumber.toLowerCase().startsWith('itg'))
      .sort((a, b) => getLatestActivityTime(b.ambulanceNumber) - getLatestActivityTime(a.ambulanceNumber));
  }, [ambulances, employeeAttendanceData, inputValue]);

  const isLoading = employeeAttendanceData.length === 0 || ambulances.length === 0;

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
        const { day, night } = getAttendanceForAmbulanceAndDate(ambulance.ambulanceNumber, date);
        wsData.push([
          ambulance.ambulanceNumber,
          format(parseISO(date), "yyyy-MM-dd"),
          day.drivers.length > 0 ? day.drivers[0].name : "-",
          day.drivers.length > 0 ? day.drivers[0].firstPunchIn : "-",
          day.drivers.length > 0 && day.drivers[0].punchOutTime >= day.drivers[0].punchInTime ? day.drivers[0].lastPunchOut : "-",
          day.emts.length > 0 ? day.emts[0].name : "-",
          day.emts.length > 0 ? day.emts[0].firstPunchIn : "-",
          day.emts.length > 0 && day.emts[0].punchOutTime >= day.emts[0].punchInTime ? day.emts[0].lastPunchOut : "-",
          night.drivers.length > 0 ? night.drivers[0].name : "-",
          night.drivers.length > 0 ? night.drivers[0].firstPunchIn : "-",
          night.drivers.length > 0 && night.drivers[0].punchOutTime >= night.drivers[0].punchInTime ? night.drivers[0].lastPunchOut : "-",
          night.emts.length > 0 ? night.emts[0].name : "-",
          night.emts.length > 0 ? night.emts[0].firstPunchIn : "-",
          night.emts.length > 0 && night.emts[0].punchOutTime >= night.emts[0].punchInTime ? night.emts[0].lastPunchOut : "-",
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
      if (wsData[i][1]) ws[`B${i + 1}`].t = "d";
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
    const fileName = `Duty_Roster_${selectedDate ? format(startOfDay(selectedDate), "yyyy-MM-dd") : "export"}.xlsx`;
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
              <label htmlFor="employee-name" className={`absolute pointer-events-none bg-white px-1 left-3 text-gray-700 text-sm transition-all duration-300 ${inputValue ? "-top-2 text-[13px] text-blue-600" : "top-1.5 peer-placeholder morph text-sm text-gray-400"} peer-focus:-top-2 peer-focus:text-[13px] peer-focus:text-blue-600`}>Search</label>
              <span className="absolute inset-y-0 right-2.5 flex items-center text-gray-400 peer-focus:text-blue-600 peer-placeholder-shown:text-gray-400">
                <svg width="18" height="18" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-inherit">
                  <path d="M7.66659 13.9999C11.1644 13.9999 13.9999 11.1644 13.9999 7.66659C13.9999 4.16878 11.1644 1.3339 7.66659 1.3339C4.16878 1.3339 1.3339 4.16878 1.3339 7.6669C1.3339 11.1644 4.16878 13.9999 7.66659 13.9999Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M14.6666 14.6666L13.3333 13.3333" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </div>
            <CustomDatePicker setSelectedDate={setSelectedDate}/>
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

      <section className="relative bg-white rounded-md overflow-hidden h-[85vh] animate-slide-up border border-gray-200">
        <div className="h-full w-full overflow-auto custom-scrollbar">
          <div className="min-w-max">
            <div className="flex sticky top-0 z-40 bg-white border-b border-gray-200">
              <div className="flex items-center justify-center border-r border-gray-200 w-[17.5rem] min-w-[17.5rem] h-16 px-4 sticky left-0 z-50 bg-gray-50">
                <p className="text-sm font-bold text-gray-900">Ambulance</p>
              </div>
              {dateRangeDays.map((date, index) => (
                <div key={index} className="flex border-r border-gray-200 w-[75rem] min-w-[75rem] h-16">
                  <div className="flex flex-col items-center justify-center w-[39.8rem] min-w-[39.8rem] bg-blue-100 text-blue-800 transition-all duration-200" aria-label={`Date: ${format(parseISO(date), "MMMM d, yyyy")} - Day`}>
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
                      <div className="flex items-center justify-center border-b border-r border-gray-200 w-[17.5rem] min-w-[17.5rem] h-28 px-4 sticky left-0 z-10 bg-gray-50">
                        <div className="w-3/4 h-4 bg-gray-200 rounded animate-pulse"></div>
                      </div>
                      {dateRangeDays.map((_, dayIndex) => (
                        <div key={dayIndex} className="flex w-[75rem] min-w-[75rem]">
                          <div className="flex flex-col justify-center border-r border-b border-gray-200 w-[39.8rem] min-w-[39.8rem] h-24 px-4">
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
                      const { day, night } = getAttendanceForAmbulanceAndDate(ambulance.ambulanceNumber, date);
                      return (
                        <div key={dayIndex} className="flex w-[75rem] min-w-[75rem]">
                          <div className="flex flex-col justify-center border-r border-b border-gray-200 w-[39.8rem] min-w-[39.8rem] h-24 px-4 relative group">
                            {day.drivers.length > 0 || day.emts.length > 0 ? (
                              <div className="flex flex-col items-center space-y-2">
                                <div className="grid grid-cols-3 w-full text-gray-500 text-[10px] font-semibold text-center mt-3">
                                  <div>Driver</div>
                                  <div className="text-gray-400">|</div>
                                  <div>EMT</div>
                                </div>
                                <div className="grid grid-cols-3 w-full text-gray-700 text-xs font-medium text-center">
                                  <div className="flex flex-col items-center space-y-1">
                                    <span className="truncate px-2">{day.drivers.length > 0 ? day.drivers[0].name : "--"}</span>
                                    {day.drivers.length > 0 && (
                                      <div className="mb-3">
                                        <div className="grid grid-cols-3 text-gray-500 text-[10px] text-center">
                                          <div>In</div>
                                          <div className="text-center text-gray-400">|</div>
                                          <div>Out</div>
                                        </div>
                                        <div className="grid grid-cols-3 text-gray-900 text-[10px] font-medium text-center">
                                          <div className="flex flex-col items-center">
                                            <span>{day.drivers[0].firstPunchIn}</span>
                                            <span>{day.drivers[0].firstPunchDate}</span>
                                          </div>
                                          <div className="text-center text-gray-400">|</div>
                                          <div className="flex flex-col items-center">
                                            {day.drivers[0].punchOutTime >= day.drivers[0].punchInTime ? (
                                              <>
                                                <span>{day.drivers[0].lastPunchOut}</span>
                                                <span>{day.drivers[0].lastPunchDate}</span>
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
                                    <span className="truncate px-2">{day.emts.length > 0 ? day.emts[0].name : "--"}</span>
                                    {day.emts.length > 0 && (
                                      <div className="mb-3">
                                        <div className="grid grid-cols-3 text-gray-500 text-[10px] text-center">
                                          <div>In</div>
                                          <div className="text-center text-gray-400">|</div>
                                          <div>Out</div>
                                        </div>
                                        <div className="grid grid-cols-3 text-gray-900 text-[10px] font-medium text-center">
                                          <div className="flex flex-col items-center">
                                            <span>{day.emts[0].firstPunchIn}</span>
                                            <span>{day.emts[0].firstPunchDate}</span>
                                          </div>
                                          <div className="text-center text-gray-400">|</div>
                                          <div className="flex flex-col items-center">
                                            {day.emts[0].punchOutTime >= day.emts[0].punchInTime ? (
                                              <>
                                                <span>{day.emts[0].lastPunchOut}</span>
                                                <span>{day.emts[0].lastPunchDate}</span>
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
                            {night.drivers.length > 0 || night.emts.length > 0 ? (
                              <div className="flex flex-col items-center space-y-2">
                                <div className="grid grid-cols-3 w-full text-gray-500 text-xs font-semibold text-center mt-3">
                                  <div>Driver</div>
                                  <div className="text-gray-400">|</div>
                                  <div>EMT</div>
                                </div>
                                <div className="grid grid-cols-3 w-full text-gray-700 text-xs font-medium text-center">
                                  <div className="flex flex-col items-center space-y-1">
                                    <span className="truncate px-2">{night.drivers.length > 0 ? night.drivers[0].name : "--"}</span>
                                    {night.drivers.length > 0 && (
                                      <div className="mb-3">
                                        <div className="grid grid-cols-3 text-gray-500 text-[10px] text-center">
                                          <div>In</div>
                                          <div className="text-center text-gray-400">|</div>
                                          <div>Out</div>
                                        </div>
                                        <div className="grid grid-cols-3 text-gray-900 text-[10px] font-medium text-center">
                                          <div className="flex flex-col items-center">
                                            <span>{night.drivers[0].firstPunchIn}</span>
                                            <span>{night.drivers[0].firstPunchDate}</span>
                                          </div>
                                          <div className="text-center text-gray-400">|</div>
                                          <div className="flex flex-col items-center">
                                            {night.drivers[0].punchOutTime >= night.drivers[0].punchInTime ? (
                                              <>
                                                <span>{night.drivers[0].lastPunchOut}</span>
                                                <span>{night.drivers[0].lastPunchDate}</span>
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
                                    <span className="truncate px-2">{night.emts.length > 0 ? night.emts[0].name : "--"}</span>
                                    {night.emts.length > 0 && (
                                      <div className="mb-3">
                                        <div className="grid grid-cols-3 text-gray-500 text-[10px] text-center">
                                          <div>In</div>
                                          <div className="text-center text-gray-400">|</div>
                                          <div>Out</div>
                                        </div>
                                        <div className="grid grid-cols-3 text-gray-900 text-[10px] font-medium text-center">
                                          <div className="flex flex-col items-center">
                                            <span>{night.emts[0].firstPunchIn}</span>
                                            <span>{night.emts[0].firstPunchDate}</span>
                                          </div>
                                          <div className="text-center text-gray-400">|</div>
                                          <div className="flex flex-col items-center">
                                            {night.emts[0].punchOutTime >= night.emts[0].punchInTime ? (
                                              <>
                                                <span>{night.emts[0].lastPunchOut}</span>
                                                <span>{night.emts[0].lastPunchDate}</span>
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