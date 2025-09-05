"use client";

import { useState, useEffect, useRef, JSX } from "react";
import { startOfMonth, endOfMonth, parseISO, startOfDay, isSameDay, differenceInSeconds, format, addMonths, isAfter, addDays, getDay } from "date-fns";
import { PRODUCTION_API_ENDPOINT } from "@/utils/constants";
import * as XLSX from "xlsx";

interface AttendanceRecord {
  ambulanceNumber: string;
  punchTime: string;
  punchLocation: string;
  status: "PunchIn" | "PunchOut";
  deviceMode: string;
  date: string;
  shiftType: string;
  imageCapture: string;
  responseStatus: string;
}

interface Employee {
  id: number;
  employeeSystemId: string;
  name: string;
  phoneNumber: string;
  userRole: string;
  attendance: AttendanceRecord[];
}

interface Ambulance {
  isSpareAmbulance: any;
  ambulanceNumber: string;
}

interface ProcessedAttendance {
  date: string;
  status: "PunchIn" | "PunchOut";
  punchIn: string;
  punchOut: string;
  punchLocation: string;
  totalWorkingSeconds: number;
  ambulanceNumber: string;
}

interface StatBase {
  title: string;
  value: string;
  icon: JSX.Element;
  active: number;
  inactive: number;
}

interface AmbulanceStat extends StatBase {
  driverOnly: number;
  emtOnly: number;
}

interface DutyStat extends StatBase {
  early: number;
  late: number;
}

interface SupportStat extends StatBase {}

type Stat = AmbulanceStat | DutyStat | SupportStat;

export default function AdminDashboard() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [inputValue, setInputValue] = useState<string>("");
  const [attendanceData, setAttendanceData] = useState<Employee[]>([]);
  const [ambulanceData, setAmbulanceData] = useState<Ambulance[]>([]);
  const [selectedAttendanceStatus, setSelectedAttendanceStatus] = useState<"All" | "Early" | "Present" | "Late" | "Absent">("All");
  const [selectedDutyStatus, setSelectedDutyStatus] = useState<"All" | "Active" | "Inactive" | "Drivers only" | "EMTs only">("All");
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>("Total Ambulances");
  const [selectedActivityFilter, setSelectedActivityFilter] = useState<"All" | "Active" | "Inactive">("All");
  const [stats, setStats] = useState<Stat[]>([
    {
      title: "Total Ambulances",
      value: "0",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width={32} height={32} viewBox="0 0 14 14" className="text-indigo-600" aria-hidden="true">
          <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2}>
            <path d="M9.159 10.773V4a1 1 0 0 0-1-1H1.702a1 1 0 0 0-1 1v6.626a1 1 0 0 0 1 1h.787m10.809-3.894H9.16"></path>
            <path d="M11.638 11.626h.682a1 1 0 0 0 1-1.008l-.024-3.18l-1.392-2.85a1 1 0 0 0-.899-.562h-1.86m-6.643 7.63a1.396 1.396 0 1 0 2.792 0a1.396 1.396 0 1 0-2.792 0"></path>
            <path d="M8.839 11.656a1.396 1.396 0 1 0 2.792 0a1.396 1.396 0 1 0-2.792 0M3.431 7H6.43m-1.5-1.499v2.998m3.909 3.127H5.294"></path>
          </g>
        </svg>
      ),
      active: 0,
      inactive: 0,
      driverOnly: 0,
      emtOnly: 0,
    },
    {
      title: "Drivers on Duty",
      value: "0",
      icon: (
        <svg width="32" height="32" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-indigo-600" aria-hidden="true">
          <path fillRule="evenodd" clipRule="evenodd" d="M20 10C20 15.5228 15.5228 20 10 20C4.47715 20 0 15.5228 0 10C0 4.47715 4.47715 0 10 0C15.5228 0 20 4.47715 20 10ZM8.76268 17.9049C8.10388 16.2879 6.22077 11.9069 5 11.5C4.14617 11.2154 2.96833 11.2548 2.112 11.3416C2.68235 14.7196 5.37002 17.3781 8.76268 17.9049ZM2.32945 7.72049C3.31094 4.41274 6.37371 2 10 2C13.6263 2 16.6891 4.41274 17.6706 7.72049C16.0917 7.42464 13.2582 7 10 7C6.74181 7 3.90825 7.42464 2.32945 7.72049ZM17.888 11.3416C17.0317 11.2548 15.8538 11.2154 15 11.5C13.7792 11.9069 11.8961 16.2879 11.2373 17.9049C14.63 17.3781 17.3176 14.7196 17.888 11.3416Z" fill="currentColor"/>
        </svg>
      ),
      active: 0,
      inactive: 0,
      early: 0,
      late: 0,
    },
    {
      title: "EMTs on Duty",
      value: "0",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width={32} height={32} viewBox="0 0 26 26" className="text-indigo-600" aria-hidden="true">
          <path fill="currentColor" d="M10 1C8.355 1 7 2.355 7 4v2h2V4c0-.563.437-1 1-1h6c.563 0 1 .437 1 1v2h2V4c0-1.645-1.355-3-3-3zM3 7a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3h20c1.656 0 3-1.344 3-3V10a3 3 0 0 0-3-3zm10 2.906A6.09 6.09 0 0 1 19.094 16A6.09 6.09 0 0 1 13 22.094A6.09 6.09 0 0 1 6.906 16A6.09 6.09 0 0 1 13 9.906M12 13v2h-2v2h2v2h2v-2h2v-2h-2v-2z" strokeWidth={0.5} stroke="currentColor"/>
        </svg>
      ),
      active: 0,
      inactive: 0,
      early: 0,
      late: 0,
    },
    {
      title: "Support Staff",
      value: "0",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width={32} height={32} viewBox="0 0 64 64" className="text-indigo-600" aria-hidden="true">
          <path fill="currentColor" d="M40.067 20.573c0 4.557-3.699 8.25-8.26 8.25c-4.556 0-8.249-3.694-8.249-8.25s3.693-8.25 8.249-8.25c4.561 0 8.26 3.694 8.26 8.25" strokeWidth={1.5} stroke="currentColor"/>
          <path fill="currentColor" d="M31.82.524c-3.818 0-9.151 1.522-13.014 5.385l4.588 8.359a10.7 10.7 0 0 1 8.426-4.09c3.459 0 6.537 1.634 8.498 4.175l4.5-8.636C41.475 2.064 35.48.525 31.82.525zm3.4 6.138h-2.136v2.134h-2.566V6.662h-2.136V4.097h2.136V1.954h2.566v2.143h2.136zM20.966 43.651h2.113l-3.018 10.344h23.581l-3.004-10.344h2.115l3.023 10.344h6.939l-4.736-15.672c-.74-2.587-3.984-7.142-9.582-7.28l-12.87-.011c-5.725.028-9.037 4.672-9.786 7.29l-4.828 15.672h7.037zM.947 57.293h61.73v5.873H.947z" strokeWidth={1.5} stroke="currentColor"/>
        </svg>
      ),
      active: 0,
      inactive: 0,
    },
  ]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const getCurrentDate = () => {
    return selectedDate ? format(selectedDate, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd");
  };

  const processAttendance = (attendance: AttendanceRecord[], day: Date): ProcessedAttendance | undefined => {
    const dayRecords = attendance.filter((att) => isSameDay(parseISO(att.date), startOfDay(day)));
    if (dayRecords.length === 0) return undefined;

    const sortedRecords = dayRecords.sort((a, b) => new Date(a.punchTime).getTime() - new Date(b.punchTime).getTime());
    const punchIns = sortedRecords.filter((att) => att.status === "PunchIn");
    const punchOuts = sortedRecords.filter((att) => att.status === "PunchOut");

    if (punchIns.length === 0) return undefined;

    const firstPunchIn = punchIns[0];
    const lastRecord = sortedRecords[sortedRecords.length - 1];

    let totalWorkingSeconds = 0;
    let punchOutTime: Date | null = null;

    for (let i = 0; i < punchIns.length; i++) {
      const punchInTime = parseISO(punchIns[i].punchTime);
      const nextPunchOut = punchOuts.find(
        (out) => parseISO(out.punchTime) > punchInTime
      );
      if (nextPunchOut) {
        punchOutTime = parseISO(nextPunchOut.punchTime);
        totalWorkingSeconds += differenceInSeconds(punchOutTime, punchInTime);
      }
    }

    return {
      date: format(day, "yyyy-MM-dd"),
      status: punchOutTime ? "PunchOut" : "PunchIn",
      punchIn: firstPunchIn.punchTime,
      punchOut: punchOutTime ? punchOutTime.toISOString() : "",
      punchLocation: lastRecord.punchLocation,
      totalWorkingSeconds,
      ambulanceNumber: lastRecord.ambulanceNumber,
    };
  };

  const formatWorkingTime = (totalSeconds: number): string => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    let result = "";
    if (hours > 0) result += `${hours}h `;
    if (minutes > 0 || hours > 0) result += `${minutes}m `;
    result += `${seconds}s`;
    return result.trim();
  };

  const getShiftStatus = (employee: Employee, totalSeconds: number): "Normal" | "Over" | "Double" => {
    const isDriver = employee.userRole.toLowerCase() === "driver";
    const overThreshold = isDriver ? 24 * 3600 : 12 * 3600;
    const doubleThreshold = isDriver ? 48 * 3600 : 24 * 3600;

    if (totalSeconds >= doubleThreshold) return "Double";
    if (totalSeconds >= overThreshold) return "Over";
    return "Normal";
  };

  const isLatePunchIn = (punchInTime: Date): "Early" | "Present" | "Late" | "Absent" => {
    const istPunchInTime = new Date(punchInTime.getTime() + (5.5 * 60 * 60 * 1000)); // Convert to IST
    const punchInHour = istPunchInTime.getUTCHours();
    const punchInMinute = istPunchInTime.getUTCMinutes();
    const punchInSecond = istPunchInTime.getUTCSeconds();

    const isBefore730 = punchInHour < 7 || (punchInHour === 7 && punchInMinute < 30) || (punchInHour === 7 && punchInMinute === 30 && punchInSecond === 0);
    const isAfter815 = punchInHour > 8 || (punchInHour === 8 && punchInMinute > 15) || (punchInHour === 8 && punchInMinute === 15 && punchInSecond > 0);
    const isBetween731And815 = (punchInHour === 7 && punchInMinute >= 30) || (punchInHour === 8 && punchInMinute <= 15);

    if (isBefore730) return "Early";
    if (isAfter815) return "Late";
    if (isBetween731And815) return "Present";
    return "Absent"; // Default for no punch record
  };

  const isEmployeeActive = (employee: Employee, date: string): boolean => {
    const todayRecords = employee.attendance
      .filter((record) => record.date === date)
      .sort((a, b) => new Date(a.punchTime).getTime() - new Date(b.punchTime).getTime());

    if (todayRecords.length === 0) return false;

    let isActive = false;
    for (const record of todayRecords) {
      if (record.status === "PunchIn") {
        isActive = true;
      } else if (record.status === "PunchOut") {
        isActive = false;
      }
    }
    return isActive;
  };

  const fetchData = async () => {
  try {
    const fetchDate = getCurrentDate();
    const attendanceResponse = await fetch(`${PRODUCTION_API_ENDPOINT}/attendance?startDate=${fetchDate}&endDate=${fetchDate}`);
    const attendanceResult: Employee[] = await attendanceResponse.json();
    const ambulanceResponse = await fetch(`${PRODUCTION_API_ENDPOINT}/ambulances/all`);
    const ambulanceResult: Ambulance[] = await ambulanceResponse.json();

    const ambulances = new Set<string>();
    const activeAmbulances = new Set<string>();
    const driverOnlyAmbulances = new Set<string>();
    const emtOnlyAmbulances = new Set<string>();
    const inactiveAmbulances = new Set<string>();
    const drivers = new Set<string>();
    const emts = new Set<string>();
    const supportStaff = new Set<string>();
    const activeDrivers = new Set<string>();
    const activeEmts = new Set<string>();
    const activeSupportStaff = new Set<string>();
    const earlyDrivers = new Set<string>();
    const earlyEmts = new Set<string>();
    const lateDrivers = new Set<string>();
    const lateEmts = new Set<string>();

    ambulanceResult.forEach((ambulance) => {
      if (!ambulance.ambulanceNumber.toLowerCase().startsWith('itg') && !ambulance.isSpareAmbulance) {
          ambulances.add(ambulance.ambulanceNumber);
      }
    });

    attendanceResult.forEach((employee) => {
      if (employee.employeeSystemId.toLowerCase().startsWith('itg')) return;

      const isActive = isEmployeeActive(employee, fetchDate);
      const todayRecords = employee.attendance.filter((record) => record.date === fetchDate);
      const punchIn = todayRecords.find((record) => record.status === "PunchIn");
      const attendanceStatus = punchIn ? isLatePunchIn(parseISO(punchIn.punchTime)) : "Absent";

      if (employee.userRole.toLowerCase() === "driver") {
        drivers.add(employee.employeeSystemId);
        if (isActive) activeDrivers.add(employee.employeeSystemId);
        if (attendanceStatus === "Early") earlyDrivers.add(employee.employeeSystemId);
        if (attendanceStatus === "Late") lateDrivers.add(employee.employeeSystemId);
      } else if (employee.userRole.toLowerCase() === "emt") {
        emts.add(employee.employeeSystemId);
        if (isActive) activeEmts.add(employee.employeeSystemId);
        if (attendanceStatus === "Early") earlyEmts.add(employee.employeeSystemId);
        if (attendanceStatus === "Late") lateEmts.add(employee.employeeSystemId);
      } else {
        supportStaff.add(employee.employeeSystemId);
        if (isActive) activeSupportStaff.add(employee.employeeSystemId);
      }
    });

    const ambulanceStatus = new Map<string, { drivers: Set<string>; emts: Set<string> }>();
    ambulances.forEach((ambulanceNumber) => {
      ambulanceStatus.set(ambulanceNumber, { drivers: new Set(), emts: new Set() });
    });

    attendanceResult.forEach((employee) => {
      if (employee.employeeSystemId.toLowerCase().startsWith('itg')) return;

        if (isEmployeeActive(employee, fetchDate)) {
          const todayRecords = employee.attendance
            .filter((record) => record.date === fetchDate && !record.ambulanceNumber.toLowerCase().startsWith('itg'))
            .sort((a, b) => new Date(a.punchTime).getTime() - new Date(b.punchTime).getTime());

          let latestAmbulanceNumber = "";
          for (const record of todayRecords) {
            if (record.status === "PunchIn") {
              latestAmbulanceNumber = record.ambulanceNumber;
            }
          }

          if (latestAmbulanceNumber) {
            const status = ambulanceStatus.get(latestAmbulanceNumber);
          if (status) {
            if (employee.userRole.toLowerCase() === "driver") {
                status.drivers.add(employee.employeeSystemId);
            } else if (employee.userRole.toLowerCase() === "emt") {
                status.emts.add(employee.employeeSystemId);
              }
            }
          }
        }
      });

    ambulanceStatus.forEach((status, ambulanceNumber) => {
      const isSpare = ambulanceData.find((a) => a.ambulanceNumber === ambulanceNumber)?.isSpareAmbulance;
      if (isSpare) {
        inactiveAmbulances.add(ambulanceNumber);
      } else if (status.drivers.size > 0 && status.emts.size > 0) {
        activeAmbulances.add(ambulanceNumber);
      } else if (status.drivers.size > 0) {
        driverOnlyAmbulances.add(ambulanceNumber);
      } else if (status.emts.size > 0) {
        emtOnlyAmbulances.add(ambulanceNumber);
      } else {
        inactiveAmbulances.add(ambulanceNumber);
      }
    });

    setStats((prevStats) =>
      prevStats.map((stat) => {
        if (stat.title === "Total Ambulances") {
          const total = activeAmbulances.size + driverOnlyAmbulances.size + emtOnlyAmbulances.size;
          return {
            ...stat,
            value: total.toString(),
            active: activeAmbulances.size,
            inactive: inactiveAmbulances.size,
            driverOnly: driverOnlyAmbulances.size,
            emtOnly: emtOnlyAmbulances.size,
          };
        } else if (stat.title === "Drivers on Duty") {
          return {
            ...stat,
            value: drivers.size.toString(),
            active: activeDrivers.size,
            inactive: drivers.size - activeDrivers.size,
            early: earlyDrivers.size,
            late: lateDrivers.size,
          };
        } else if (stat.title === "EMTs on Duty") {
          return {
            ...stat,
            value: emts.size.toString(),
            active: activeEmts.size,
            inactive: emts.size - activeEmts.size,
            early: earlyEmts.size,
            late: lateEmts.size,
          };
        } else if (stat.title === "Support Staff") {
          return {
            ...stat,
            value: supportStaff.size.toString(),
            active: activeSupportStaff.size,
            inactive: supportStaff.size - activeSupportStaff.size,
          };
        }
        return stat;
      })
    );

    setAttendanceData(attendanceResult.filter((employee) => !employee.employeeSystemId.toLowerCase().startsWith('itg')));
    setAmbulanceData(ambulanceResult.filter((ambulance) => !ambulance.ambulanceNumber.toLowerCase().startsWith('itg') && !ambulance.isSpareAmbulance));
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

  useEffect(() => {
    fetchData();
  }, [selectedDate]);

  const currentDate = new Date();
  const overShiftEmployees = attendanceData
    .filter((employee) => ["driver", "emt"].includes(employee.userRole.toLowerCase()))
    .map((employee) => ({
      employee,
      processed: processAttendance(
        employee.attendance,
        selectedDate || currentDate
      ),
    }))
    .filter(({ processed, employee }) => processed && getShiftStatus(employee, processed.totalWorkingSeconds) === "Over");

  const generateCalendarDays = (month: Date) => {
    const start = startOfMonth(month);
    const end = endOfMonth(month);
    const days: Date[] = [];
    let currentDay = start;

    while (currentDay <= end) {
      days.push(currentDay);
      currentDay = addDays(currentDay, 1);
    }

    const firstDayOfWeek = getDay(start);
    const paddedDays: (Date | null)[] = Array(firstDayOfWeek)
      .fill(null)
      .concat(days);

    return paddedDays;
  };

  const nextMonth = () => {
    const next = addMonths(currentMonth, 1);
    if (isAfter(next, currentDate)) return;
    setCurrentMonth(next);
  };

  const prevMonth = () => {
    setCurrentMonth(addMonths(currentMonth, -1));
  };

  const handleDateClick = (date: Date) => {
    if (isAfter(date, currentDate)) return;
    setSelectedDate(date);
  };

  const renderCalendar = () => {
    const days = generateCalendarDays(currentMonth);
    const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    return (
      <div className="flex-1 px-2">
        <div className="flex items-center justify-between my-2">
          <button onClick={prevMonth} className="px-2 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 hover:bg-gray-100 text-indigo-600" aria-label="Previous month">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
            </svg>
          </button>
          <span className="text-sm text-gray-800">{format(currentMonth, "MMMM yyyy")}</span>
          <button onClick={nextMonth} className="px-2 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 hover:bg-gray-100 text-indigo-600" aria-label="Next month">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
            </svg>
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-sm mb-2">
          {weekDays.map((day) => (
            <div key={day} className="text-center text-xs text-gray-600">{day}</div>
          ))}
          {days.map((day, index) => {
            const isSelected = day && selectedDate && isSameDay(day, selectedDate);
            const isCurrentDate = day && isSameDay(day, currentDate);
            const isDisabled = day ? isAfter(day, currentDate) : true;

            return (
              <button
                key={index}
                onClick={() => day && !isDisabled && handleDateClick(day)}
                className={`rounded-full p-1 text-center text-xs transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  !day
                    ? "text-transparent bg-transparent cursor-default"
                    : isDisabled
                    ? "text-gray-300 bg-gray-50 cursor-not-allowed"
                    : isSelected
                    ? "bg-indigo-600 text-white shadow-md"
                    : isCurrentDate
                    ? "bg-indigo-100 text-indigo-700"
                    : "text-gray-800 hover:bg-indigo-100 hover:text-indigo-700"
                }`}
                disabled={isDisabled}
                aria-label={day ? `Select ${format(day, "MMMM d, yyyy")}` : ""}
              >
                {day ? format(day, "d") : ""}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const handleStatClick = (title: string, status?: "active" | "inactive" | "driverOnly" | "emtOnly" | "early" | "late") => {
    setSelectedRoleFilter(title);
    if (status) {
      if (status === "active" || status === "inactive") {
        setSelectedDutyStatus(status === "active" ? "Active" : "Inactive");
        setSelectedAttendanceStatus("All");
      } else if (status === "early" || status === "late") {
        setSelectedAttendanceStatus(status === "early" ? "Early" : "Late");
        setSelectedDutyStatus("All");
      } else {
        setSelectedAttendanceStatus("All");
        setSelectedDutyStatus("All");
      }
      setSelectedActivityFilter(status === "active" ? "Active" : status === "inactive" ? "Inactive" : "All");
    } else {
      setSelectedAttendanceStatus("All");
      setSelectedDutyStatus("All");
      setSelectedActivityFilter("All");
    }
  };

  const getEmployeeStatus = (employee: Employee, date: string): { 
    isPresent: boolean; 
    isEarly: boolean; 
    isLate: boolean; 
    isPresentOnTime: boolean; 
    isAbsent: boolean; 
    isActive: boolean; 
    isInactive: boolean; 
    punchInTime: string; 
    punchLocation: string; 
    ambulanceNumber: string; 
    attendanceStatus: string;
  } => {
    const todayRecords = employee.attendance
      .filter((record) => record.date === date)
      .sort((a, b) => new Date(a.punchTime).getTime() - new Date(b.punchTime).getTime());

    let punchIn: AttendanceRecord | undefined;
    let lastRecord: AttendanceRecord | undefined;
    let isActive = false;

    if (todayRecords.length > 0) {
      lastRecord = todayRecords[todayRecords.length - 1];
      punchIn = todayRecords.find((record) => record.status === "PunchIn");
      isActive = isEmployeeActive(employee, date);
    }

    const isAbsent = !punchIn;
    const attendanceStatus = punchIn ? isLatePunchIn(parseISO(punchIn.punchTime)) : "Absent";
    const isEarly = attendanceStatus === "Early";
    const isLate = attendanceStatus === "Late";
    const isPresentOnTime = attendanceStatus === "Present";
    const isPresent = !!punchIn;
    const isInactive = !isActive;

    return {
      isPresent,
      isEarly,
      isLate,
      isPresentOnTime,
      isAbsent,
      isActive,
      isInactive,
      punchInTime: punchIn ? new Date(punchIn.punchTime).toLocaleTimeString() : "-",
      punchLocation: lastRecord?.punchLocation || "-",
      ambulanceNumber: lastRecord?.ambulanceNumber || "-",
      attendanceStatus,
    };
  };

  const renderAmbulanceTable = () => {
    const ambulanceMap = new Map<string, { driver?: Employee; emt?: Employee; isSpareAmbulance: boolean }>();
    const ambulanceStatus = new Map<string, { drivers: Set<string>; emts: Set<string> }>();

    ambulanceData.forEach((ambulance) => {
      if (!ambulance.ambulanceNumber.toLowerCase().startsWith('itg') && !ambulance.isSpareAmbulance) {
        ambulanceMap.set(ambulance.ambulanceNumber, { isSpareAmbulance: false });
        ambulanceStatus.set(ambulance.ambulanceNumber, { drivers: new Set(), emts: new Set() });
      }
    });

    attendanceData.forEach((employee) => {
      if (employee.employeeSystemId.toLowerCase().startsWith('itg')) return;

      if (isEmployeeActive(employee, getCurrentDate())) {
        const todayRecords = employee.attendance
          .filter((record) => record.date === getCurrentDate() && !record.ambulanceNumber.toLowerCase().startsWith('itg'))
          .sort((a, b) => new Date(a.punchTime).getTime() - new Date(b.punchTime).getTime());

        let latestAmbulanceNumber = "";
        for (const record of todayRecords) {
          if (record.status === "PunchIn") {
            latestAmbulanceNumber = record.ambulanceNumber;
          }
        }

        if (latestAmbulanceNumber) {
          const status = ambulanceStatus.get(latestAmbulanceNumber);
          if (status) {
            if (employee.userRole.toLowerCase() === "driver") {
              status.drivers.add(employee.employeeSystemId);
              const current = ambulanceMap.get(latestAmbulanceNumber);
              if (current) current.driver = employee;
            } else if (employee.userRole.toLowerCase() === "emt") {
              status.emts.add(employee.employeeSystemId);
              const current = ambulanceMap.get(latestAmbulanceNumber);
              if (current) current.emt = employee;
            }
          }
        }
      }
    });

    return Array.from(ambulanceMap.entries())
      .filter(([ambulanceNumber, { isSpareAmbulance }]) => {
        const status = ambulanceStatus.get(ambulanceNumber);
        if (!status) return false;

        const driverActive = status.drivers.size > 0;
        const emtActive = status.emts.size > 0;

        if (selectedDutyStatus === "All") return true;
        if (selectedDutyStatus === "Active") {
          return driverActive && emtActive && !isSpareAmbulance;
        }
        if (selectedDutyStatus === "Inactive") {
          return (!driverActive && !emtActive) || isSpareAmbulance;
        }
        if (selectedDutyStatus === "Drivers only") {
          return driverActive && !emtActive && !isSpareAmbulance;
        }
        if (selectedDutyStatus === "EMTs only") {
          return !driverActive && emtActive && !isSpareAmbulance;
        }
        return true;
      })
      .filter(([ambulanceNumber, { driver, emt }]) => {
        const searchLower = inputValue.toLowerCase();
        return (
          ambulanceNumber.toLowerCase().includes(searchLower) ||
          (driver?.employeeSystemId?.toLowerCase().includes(searchLower) || false) ||
          (driver?.name?.toLowerCase().includes(searchLower) || false) ||
          (driver?.phoneNumber?.toLowerCase().includes(searchLower) || false) ||
          (emt?.employeeSystemId?.toLowerCase().includes(searchLower) || false) ||
          (emt?.name?.toLowerCase().includes(searchLower) || false) ||
          (emt?.phoneNumber?.toLowerCase().includes(searchLower) || false)
        );
      })
      .map(([ambulanceNumber, { driver, emt }], index) => {
        const driverLatestPunchTime = driver ? driver.attendance
            .filter((record) => record.date === getCurrentDate())
            .sort((a, b) => new Date(b.punchTime).getTime() - new Date(a.punchTime).getTime())[0]?.punchTime
        : null;
        const emtLatestPunchTime = emt ? emt.attendance
            .filter((record) => record.date === getCurrentDate())
            .sort((a, b) => new Date(b.punchTime).getTime() - new Date(a.punchTime).getTime())[0]?.punchTime
        : null;
        return (
        <tr key={index} className="bg-white border-b border-gray-200">
          <td className="px-6 py-3.5">{index + 1}</td>
          <th scope="row" className="px-6 py-3.5 font-medium text-gray-900 whitespace-nowrap">{ambulanceNumber}</th>
          <td className="px-6 py-3.5">{driver?.employeeSystemId || "-"}</td>
          <td className="px-6 py-3.5">{driver?.name || "-"}</td>
          <td className="px-6 py-3.5">{driver?.phoneNumber || "-"}</td>
          <td className="px-6 py-3.5">{driverLatestPunchTime ? new Date(driverLatestPunchTime).toLocaleTimeString() : "-"}</td>
          <td className="px-6 py-3.5">{emt?.employeeSystemId || "-"}</td>
          <td className="px-6 py-3.5">{emt?.name || "-"}</td>
          <td className="px-6 py-3.5">{emt?.phoneNumber || "-"}</td>
          <td className="px-6 py-3.5">{emtLatestPunchTime ? new Date(emtLatestPunchTime).toLocaleTimeString() : "-"}</td>
        </tr>
      )
      });
  };

  const renderEmployeeTable = (role: "driver" | "emt") => {
    return attendanceData
      .filter((employee) => employee.userRole.toLowerCase() === role)
      .filter((employee) => {
        const { isActive, isInactive, isEarly, isPresentOnTime, isLate, isAbsent, attendanceStatus } = getEmployeeStatus(employee, getCurrentDate());
        if (selectedAttendanceStatus === "All" && selectedDutyStatus === "All") return true;
        if (selectedAttendanceStatus !== "All" && selectedDutyStatus === "All") {
          if (selectedAttendanceStatus === "Early") return isEarly;
          if (selectedAttendanceStatus === "Present") return isPresentOnTime;
          if (selectedAttendanceStatus === "Late") return isLate;
          if (selectedAttendanceStatus === "Absent") return isAbsent;
        }
        if (selectedAttendanceStatus === "All" && selectedDutyStatus !== "All") {
          if (selectedDutyStatus === "Active") return isActive;
          if (selectedDutyStatus === "Inactive") return isInactive;
        }
        if (selectedAttendanceStatus !== "All" && selectedDutyStatus !== "All") {
          const attendanceMatch = selectedAttendanceStatus === "Early" ? isEarly : selectedAttendanceStatus === "Present" ? isPresentOnTime : selectedAttendanceStatus === "Late" ? isLate : selectedAttendanceStatus === "Absent" ? isAbsent : true;
          const dutyMatch = selectedDutyStatus === "Active" ? isActive : selectedDutyStatus === "Inactive" ? isInactive : true;
          return attendanceMatch && dutyMatch;
        }
        return true;
      })
      .filter((employee) => {
        if (selectedActivityFilter === "All") return true;
        const { isActive, isInactive } = getEmployeeStatus(employee, getCurrentDate());
        return selectedActivityFilter === "Active" ? isActive : isInactive;
      })
      .filter((employee) => {
        const searchLower = inputValue.toLowerCase();
        const { ambulanceNumber } = getEmployeeStatus(employee, getCurrentDate());
        return (
          employee.name.toLowerCase().includes(searchLower) ||
          employee.employeeSystemId.toLowerCase().includes(searchLower) ||
          employee.phoneNumber.toLowerCase().includes(searchLower) ||
          (ambulanceNumber.toLowerCase().includes(searchLower) || false)
        );
      })
      .sort((a, b) => {
        const aStatus = getEmployeeStatus(a, getCurrentDate());
        const bStatus = getEmployeeStatus(b, getCurrentDate());
        return aStatus.isActive === bStatus.isActive ? 0 : aStatus.isActive ? -1 : 1;
      })
      .map((employee, index) => {
        const { isPresent, isEarly, isLate, isPresentOnTime, isAbsent, isActive, isInactive, punchInTime, punchLocation, ambulanceNumber, attendanceStatus } = getEmployeeStatus(employee, getCurrentDate());
        const dutyStatus = isActive ? "Active" : isInactive ? "Inactive" : "-";
        const attendanceColor = isEarly ? "text-blue-600" : isPresentOnTime ? "text-green-600" : isLate ? "text-yellow-600" : isAbsent ? "text-gray-600" : "text-gray-600";
        const dutyColor = isActive ? "text-green-600" : isInactive ? "text-red-600" : "text-gray-600";
        const attendanceBg = isEarly ? "bg-blue-500" : isPresentOnTime ? "bg-green-500" : isLate ? "bg-yellow-500" : isAbsent ? "bg-gray-500" : "bg-gray-500";
        const dutyBg = isActive ? "bg-green-500" : isInactive ? "bg-red-600" : "bg-gray-500";

        return (
          <tr key={index} className="bg-white border-b border-gray-200">
            <td className="px-6 py-3.5">{index + 1}</td>
            <th scope="row" className="px-6 py-3.5 font-medium text-gray-900 whitespace-nowrap">{ambulanceNumber || "-"}</th>
            <td className="px-6 py-3.5">
              <div>
                <p className="text-gray-900 font-semibold">{employee.name}</p>
                <p className="flex items-center space-x-2 uppercase text-xs">
                  <span>{employee.userRole}</span>
                  <span>-</span>
                  <span>{employee.employeeSystemId}</span>
                </p>
              </div>
            </td>
            <td className="px-6 py-3.5">
              <p className={`text-xs font-medium ${attendanceColor} flex items-center space-x-1.5 border w-[6.5rem] px-2 py-[1px] rounded-md`}>
                <span className={`block ${attendanceBg} w-2 h-2 rounded-full`}></span>
                <span>{attendanceStatus}</span>
              </p>
            </td>
            <td className="px-6 py-3.5">
              <p className={`text-xs font-medium ${dutyColor} flex items-center space-x-1.5 border w-[6.5rem] px-2 py-[1px] rounded-md`}>
                <span className={`block ${dutyBg} w-2 h-2 rounded-full`}></span>
                <span>{dutyStatus}</span>
              </p>
            </td>
            <td className="px-6 py-3.5">{punchInTime}</td>
            <td className="px-6 py-3.5">{punchLocation}</td>
          </tr>
        );
      });
  };

  const exportToExcel = () => {
  const workbook = XLSX.utils.book_new();
  const timestamp = format(new Date(), "yyyy-MM-dd_HH-mm-ss");
  const filename = `Employees_Status_${timestamp}.xlsx`;

  const tableData: any[] = [];
  const currentDate = getCurrentDate(); // Ensure consistent date usage

  if (selectedRoleFilter === "Total Ambulances") {
    const ambulanceMap = new Map<string, { driver?: Employee; emt?: Employee; isSpareAmbulance: boolean }>();
    const ambulanceStatus = new Map<string, { drivers: Set<string>; emts: Set<string> }>();

    ambulanceData.forEach((ambulance) => {
      if (!ambulance.ambulanceNumber.toLowerCase().startsWith('itg') && !ambulance.isSpareAmbulance) {
        ambulanceMap.set(ambulance.ambulanceNumber, { isSpareAmbulance: false });
        ambulanceStatus.set(ambulance.ambulanceNumber, { drivers: new Set(), emts: new Set() });
      }
    });

    attendanceData.forEach((employee) => {
      if (employee.employeeSystemId.toLowerCase().startsWith('itg')) return;

        if (isEmployeeActive(employee, currentDate)) {
          const todayRecords = employee.attendance
            .filter((record) => record.date === currentDate && !record.ambulanceNumber.toLowerCase().startsWith('itg'))
            .sort((a, b) => new Date(a.punchTime).getTime() - new Date(b.punchTime).getTime());

          let latestAmbulanceNumber = "";
          for (const record of todayRecords) {
            if (record.status === "PunchIn") {
              latestAmbulanceNumber = record.ambulanceNumber;
            }
          }

          if (latestAmbulanceNumber) {
            const status = ambulanceStatus.get(latestAmbulanceNumber);
            if (status) {
              if (employee.userRole.toLowerCase() === "driver") {
                status.drivers.add(employee.employeeSystemId);
                const current = ambulanceMap.get(latestAmbulanceNumber);
                if (current) current.driver = employee;
              } else if (employee.userRole.toLowerCase() === "emt") {
                status.emts.add(employee.employeeSystemId);
      const current = ambulanceMap.get(latestAmbulanceNumber);
      if (current) current.emt = employee;
        }
          }
        }
      }
    });

    let index = 1;
    Array.from(ambulanceMap.entries())
      .filter(([ambulanceNumber, { isSpareAmbulance }]) => {
        const status = ambulanceStatus.get(ambulanceNumber);
        if (!status) return false;

        const driverActive = status.drivers.size > 0;
        const emtActive = status.emts.size > 0;

        if (selectedDutyStatus === "All") return true;
        if (selectedDutyStatus === "Active") {
          return driverActive && emtActive && !isSpareAmbulance;
        }
        if (selectedDutyStatus === "Inactive") {
          return (!driverActive && !emtActive) || isSpareAmbulance;
        }
        if (selectedDutyStatus === "Drivers only") {
          return driverActive && !emtActive && !isSpareAmbulance;
        }
        if (selectedDutyStatus === "EMTs only") {
          return !driverActive && emtActive && !isSpareAmbulance;
        }
        return true;
      })
      .filter(([ambulanceNumber, { driver, emt }]) => {
        const searchLower = inputValue.toLowerCase();
        return (
          ambulanceNumber.toLowerCase().includes(searchLower) ||
          (driver?.employeeSystemId?.toLowerCase().includes(searchLower) || false) ||
          (driver?.name?.toLowerCase().includes(searchLower) || false) ||
          (driver?.phoneNumber?.toLowerCase().includes(searchLower) || false) ||
          (emt?.employeeSystemId?.toLowerCase().includes(searchLower) || false) ||
          (emt?.name?.toLowerCase().includes(searchLower) || false) ||
          (emt?.phoneNumber?.toLowerCase().includes(searchLower) || false)
        );
      })
      .forEach(([ambulanceNumber, { driver, emt }]) => {
        tableData.push({
          "Serial Number": index++,
          "Ambulance Number": ambulanceNumber,
          "Driver ID": driver?.employeeSystemId || "",
          "Driver Name": driver?.name || "",
          "Driver Phone Number": driver?.phoneNumber || "",
          "EMT ID": emt?.employeeSystemId || "",
          "EMT Name": emt?.name || "",
          "EMT Phone Number": emt?.phoneNumber || "",
        });
      });
  } else {
    const role = selectedRoleFilter === "Drivers on Duty" ? "driver" : selectedRoleFilter === "EMTs on Duty" ? "emt" : null;
    let index = 1;

    attendanceData
      .filter((employee) => !role || employee.userRole.toLowerCase() === role)
      .filter((employee) => {
        if (selectedActivityFilter === "All") return true;
        const { isActive, isInactive } = getEmployeeStatus(employee, currentDate);
        return selectedActivityFilter === "Active" ? isActive : isInactive;
      })
      .filter((employee) => {
        const searchLower = inputValue.toLowerCase();
        const { ambulanceNumber } = getEmployeeStatus(employee, currentDate);
        return (
          employee.name.toLowerCase().includes(searchLower) ||
          employee.employeeSystemId.toLowerCase().includes(searchLower) ||
          employee.phoneNumber.toLowerCase().includes(searchLower) ||
          (ambulanceNumber.toLowerCase().includes(searchLower) || false)
        );
      })
      .filter((employee) => {
        const { isEarly, isPresentOnTime, isLate, isAbsent, isActive, isInactive } = getEmployeeStatus(employee, currentDate);
        if (selectedAttendanceStatus === "All" && selectedDutyStatus === "All") return true;
        if (selectedAttendanceStatus !== "All" && selectedDutyStatus === "All") {
          if (selectedAttendanceStatus === "Early") return isEarly;
          if (selectedAttendanceStatus === "Present") return isPresentOnTime;
          if (selectedAttendanceStatus === "Late") return isLate;
          if (selectedAttendanceStatus === "Absent") return isAbsent;
        }
        if (selectedAttendanceStatus === "All" && selectedDutyStatus !== "All") {
          if (selectedDutyStatus === "Active") return isActive;
          if (selectedDutyStatus === "Inactive") return isInactive;
        }
        if (selectedAttendanceStatus !== "All" && selectedDutyStatus !== "All") {
          const attendanceMatch = selectedAttendanceStatus === "Early" ? isEarly : 
                                 selectedAttendanceStatus === "Present" ? isPresentOnTime : 
                                 selectedAttendanceStatus === "Late" ? isLate : 
                                 selectedAttendanceStatus === "Absent" ? isAbsent : true;
          const dutyMatch = selectedDutyStatus === "Active" ? isActive : 
                           selectedDutyStatus === "Inactive" ? isInactive : true;
          return attendanceMatch && dutyMatch;
        }
        return true;
      })
      .sort((a, b) => {
        const aStatus = getEmployeeStatus(a, currentDate);
        const bStatus = getEmployeeStatus(b, currentDate);
        return aStatus.isActive === bStatus.isActive ? 0 : aStatus.isActive ? -1 : 1;
      })
      .forEach((employee) => {
        const { isEarly, isPresentOnTime, isLate, isAbsent, isActive, isInactive, punchInTime, punchLocation, ambulanceNumber, attendanceStatus } = getEmployeeStatus(employee, currentDate);
        const dutyStatus = isActive ? "Active" : isInactive ? "Inactive" : "-";
        const latestRecord = employee.attendance
          .filter((record) => record.date === currentDate)
          .sort((a, b) => new Date(b.punchTime).getTime() - new Date(a.punchTime).getTime())[0];

        tableData.push({
          "Serial Number": index++,
          "Ambulance Number": ambulanceNumber || "",
          "Employee Name": employee.name,
          "Employee Role": employee.userRole,
          "Employee ID": employee.employeeSystemId,
          "Attendance Status": attendanceStatus,
          "Duty Status": dutyStatus,
          "Punch Time": punchInTime,
          "Location": punchLocation,
          "Date": latestRecord ? latestRecord.date : "",
        });
      });
  }

  const dataSheet = XLSX.utils.json_to_sheet(tableData, {
    header: selectedRoleFilter === "Total Ambulances"
      ? ["Serial Number", "Ambulance Number", "Driver ID", "Driver Name", "Driver Phone Number", "EMT ID", "EMT Name", "EMT Phone Number"]
      : ["Serial Number", "Ambulance Number", "Employee Name", "Employee Role", "Employee ID", "Attendance Status", "Duty Status", "Punch Time", "Location", "Date"],
  });
  XLSX.utils.book_append_sheet(workbook, dataSheet, "Employee Status");

  const colWidths = selectedRoleFilter === "Total Ambulances"
    ? [
        { wch: 10 },
        { wch: 15 },
        { wch: 15 },
        { wch: 20 },
        { wch: 15 },
        { wch: 15 },
        { wch: 20 },
        { wch: 15 },
      ]
    : [
        { wch: 10 },
        { wch: 15 },
        { wch: 20 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
        { wch: 20 },
        { wch: 12 },
      ];
  dataSheet['!cols'] = colWidths;

  XLSX.writeFile(workbook, filename);
};

  return (
    <div className="p-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-3">
        {stats.map((stat, index) => (
          <div
            key={index}
            className={`group relative bg-white rounded-xl shadow-xs border ${
              selectedRoleFilter === stat.title ? "border-indigo-500" : "border-gray-200"
            } hover:border-indigo-500 cursor-pointer`}
            role="region"
            aria-labelledby={`stat-title-${index}`}
            onClick={() => handleStatClick(stat.title)}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-50/30 to-blue-50/30 opacity-0 rounded-xl"></div>
            <div className="relative p-3 flex items-center justify-between">
              <div>
                <p id={`stat-title-${index}`} className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
              </div>
              <div className="opacity-70">{stat.icon}</div>
            </div>
            <div className={`border-t border-gray-100 px-4 py-2 flex items-center bg-gray-50/50 rounded-b-xl ${stat.title === "Total Ambulances" ? "space-x-4" : "space-x-4 flex-wrap"}`}>
              <p
                className="text-xs font-medium text-green-600 flex items-center space-x-1.5 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  handleStatClick(stat.title, "active");
                }}
              >
                <span className="block bg-green-500 w-2 h-2 rounded-full"></span>
                <span>{stat.active} active</span>
              </p>
              <p
                className="text-xs font-medium text-red-600 flex items-center space-x-1.5 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  handleStatClick(stat.title, "inactive");
                }}
              >
                <span className="block bg-red-600 w-2 h-2 rounded-full"></span>
                <span>{stat.inactive} inactive</span>
              </p>
              {stat.title === "Total Ambulances" && (
                <>
                  <p
                    className="text-xs font-medium text-blue-600 flex items-center space-x-1.5 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStatClick(stat.title, "driverOnly");
                    }}
                  >
                    <span className="block bg-blue-500 w-2 h-2 rounded-full"></span>
                    <span>{(stat as AmbulanceStat).driverOnly} driver</span>
                  </p>
                  <p
                    className="text-xs font-medium text-yellow-600 flex items-center space-x-1.5 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStatClick(stat.title, "emtOnly");
                    }}
                  >
                    <span className="block bg-yellow-500 w-2 h-2 rounded-full"></span>
                    <span>{(stat as AmbulanceStat).emtOnly} EMT</span>
                  </p>
                </>
              )}
              {(stat.title === "Drivers on Duty" || stat.title === "EMTs on Duty") && (
                <>
                  <p
                    className="text-xs font-medium text-blue-600 flex items-center space-x-1.5 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStatClick(stat.title, "early");
                    }}
                  >
                    <span className="block bg-blue-500 w-2 h-2 rounded-full"></span>
                    <span>{(stat as DutyStat).early} early</span>
                  </p>
                  <p
                    className="text-xs font-medium text-yellow-600 flex items-center space-x-1.5 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStatClick(stat.title, "late");
                    }}
                  >
                    <span className="block bg-yellow-500 w-2 h-2 rounded-full"></span>
                    <span>{(stat as DutyStat).late} late</span>
                  </p>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center space-x-3 h-[70vh] mb-3">
        <div className="w-[70%] bg-white border border-gray-200 shadow-xs rounded-xl">
          <div className="flex items-center justify-between p-3 border-b border-gray-200">
            <h1 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Employees Status Overview</h1>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <div className="relative">
                  <input id="employee-name" className="peer w-[10rem] bg-transparent text-gray-800 text-sm border border-gray-300 rounded-md px-3 py-[2px] pr-8 focus:outline-none focus:border-blue-500 hover:border-blue-200 focus:shadow" placeholder=" " value={inputValue} onChange={(e) => setInputValue(e.target.value)}/>
                  <label htmlFor="employee-name" className={`absolute pointer-events-none bg-white px-1 left-3 text-sm transition-all duration-300 ${inputValue ? "-top-2.5 text-[14px] text-blue-600" : "top-[1px] peer-placeholder morph text-sm text-gray-400"} peer-focus:-top-2.5 peer-focus:text-[12px] peer-focus:text-blue-600`}>Search</label>
                </div>
                <span className="absolute inset-y-0 right-2.5 flex items-center text-gray-400 peer-focus:text-blue-600 peer-placeholder-shown:text-gray-400">
                  <svg width="15" height="15" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-inherit">
                    <path d="M7.66659 13.9999C11.1644 13.9999 13.9999 11.1644 13.9999 7.66659C13.9999 4.16878 11.1644 1.3339 7.66659 1.3339C4.16878 1.3339 1.3339 4.16878 1.3339 7.6669C1.3339 11.1644 4.16878 13.9999 7.66659 13.9999Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M14.6666 14.6666L13.3333 13.3333" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
              </div>

              <div className="relative w-[160px]" ref={dropdownRef}>
                <div className="border border-gray-300 text-[#797979] text-sm w-full cursor-pointer px-1.5 py-[2px] rounded-md" onClick={() => setIsDropdownOpen(!isDropdownOpen)} tabIndex={0}>
                  <span className="flex items-center justify-between">
                    <span className="truncate tracking-wider">
                      {selectedRoleFilter === "Total Ambulances"
                        ? selectedDutyStatus !== "All" ? `Duty: ${selectedDutyStatus}` : "All"
                        : selectedAttendanceStatus !== "All" ? `Attendance: ${selectedAttendanceStatus}` : selectedDutyStatus !== "All" ? `Duty: ${selectedDutyStatus}` : "All"}
                    </span>
                    <span className={isDropdownOpen ? "rotate-180" : ""}>
                      <svg width="12" height="6" viewBox="0 0 14 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" clipRule="evenodd" d="M6.28935 7.15694L0.632351 1.49994L2.04635 0.085937L6.99635 5.03594L11.9464 0.0859374L13.3604 1.49994L7.70335 7.15694C7.51582 7.34441 7.26152 7.44972 6.99635 7.44972C6.73119 7.44972 6.47688 7.34441 6.28935 7.15694Z" fill="#797979"/>
                      </svg>
                    </span>
                  </span>
                </div>
                {isDropdownOpen && (
                  <div className="absolute z-50 bg-white border border-gray-300 rounded-lg shadow mt-1 w-full">
                    <ul className="overflow-y-auto custom-scrollbar max-h-44">
                      <li className="p-2 hover:bg-blue-100 cursor-pointer text-sm border-b border-gray-300" onClick={() => { setSelectedAttendanceStatus("All"); setSelectedDutyStatus("All"); setIsDropdownOpen(false); }}>
                        <p className="inline-flex items-center space-x-2">
                          <span className="block w-2 h-2 bg-indigo-600 rounded-full"></span>
                          <span>ALL</span>
                        </p>
                      </li>
                      {selectedRoleFilter === "Total Ambulances" ? (
                        <>
                          <li className="p-2 hover:bg-blue-100 cursor-pointer text-sm border-b border-gray-300" onClick={() => { setSelectedAttendanceStatus("All"); setSelectedDutyStatus("Active"); setIsDropdownOpen(false); }}>  
                            <p className="inline-flex items-center space-x-2">
                              <span className="block w-2 h-2 bg-indigo-600 rounded-full"></span>
                              <span>Active</span>
                            </p>
                          </li>
                          <li className="p-2 hover:bg-blue-100 cursor-pointer text-sm border-b border-gray-300" onClick={() => { setSelectedAttendanceStatus("All"); setSelectedDutyStatus("Inactive"); setIsDropdownOpen(false); }}>
                            <p className="inline-flex items-center space-x-2">
                              <span className="block w-2 h-2 bg-indigo-600 rounded-full"></span>
                              <span>Inactive</span>
                            </p>
                          </li>
                          <li className="p-2 hover:bg-blue-100 cursor-pointer text-sm border-b border-gray-300" onClick={() => { setSelectedAttendanceStatus("All"); setSelectedDutyStatus("Drivers only"); setIsDropdownOpen(false); }}>
                            <p className="inline-flex items-center space-x-2">
                              <span className="block w-2 h-2 bg-indigo-600 rounded-full"></span>
                              <span>Drivers only</span>
                            </p>
                          </li>
                          <li className="p-2 hover:bg-blue-100 cursor-pointer text-sm border-b border-gray-300" onClick={() => { setSelectedAttendanceStatus("All"); setSelectedDutyStatus("EMTs only"); setIsDropdownOpen(false); }}>
                            <p className="inline-flex items-center space-x-2">
                              <span className="block w-2 h-2 bg-indigo-600 rounded-full"></span>
                              <span>EMTs only</span>
                            </p>
                          </li>
                        </>
                      ) : (
                        <>
                          <li className="p-2 hover:bg-blue-100 cursor-pointer text-sm border-b border-gray-300" onClick={() => { setSelectedAttendanceStatus("Early"); setSelectedDutyStatus("All"); setIsDropdownOpen(false); }}>
                            <p className="inline-flex items-center space-x-2">
                              <span className="block w-2 h-2 bg-indigo-600 rounded-full"></span>
                              <span>Early</span>
                            </p>
                          </li>
                          <li className="p-2 hover:bg-blue-100 cursor-pointer text-sm border-b border-gray-300" onClick={() => { setSelectedAttendanceStatus("Present"); setSelectedDutyStatus("All"); setIsDropdownOpen(false); }}>
                            <p className="inline-flex items-center space-x-2">
                              <span className="block w-2 h-2 bg-indigo-600 rounded-full"></span>
                              <span>Present</span>
                            </p>
                          </li>
                          <li className="p-2 hover:bg-blue-100 cursor-pointer text-sm border-b border-gray-300" onClick={() => { setSelectedAttendanceStatus("Late"); setSelectedDutyStatus("All"); setIsDropdownOpen(false); }}>
                            <p className="inline-flex items-center space-x-2">
                              <span className="block w-2 h-2 bg-indigo-600 rounded-full"></span>
                              <span>Late</span>
                            </p>
                          </li>
                          <li className="p-2 hover:bg-blue-100 cursor-pointer text-sm border-b border-gray-300" onClick={() => { setSelectedAttendanceStatus("Absent"); setSelectedDutyStatus("All"); setIsDropdownOpen(false); }}>
                            <p className="inline-flex items-center space-x-2">
                              <span className="block w-2 h-2 bg-indigo-600 rounded-full"></span>
                              <span>Absent</span>
                            </p>
                          </li>
                          <li className="p-2 hover:bg-blue-100 cursor-pointer text-sm border-b border-gray-300" onClick={() => { setSelectedAttendanceStatus("All"); setSelectedDutyStatus("Active"); setIsDropdownOpen(false); }}>
                            <p className="inline-flex items-center space-x-2">
                              <span className="block w-2 h-2 bg-indigo-600 rounded-full"></span>
                              <span>Active</span>
                            </p>
                          </li>
                          <li className="p-2 hover:bg-blue-100 cursor-pointer text-sm border-b border-gray-300" onClick={() => { setSelectedAttendanceStatus("All"); setSelectedDutyStatus("Inactive"); setIsDropdownOpen(false); }}>
                            <p className="inline-flex items-center space-x-2">
                              <span className="block w-2 h-2 bg-indigo-600 rounded-full"></span>
                              <span>Inactive</span>
                            </p>
                          </li>
                        </>
                      )}
                    </ul>
                  </div>
                )}
              </div>
              <button onClick={exportToExcel} className="bg-blue-500 text-white px-3 py-1 rounded-md text-sm hover:bg-blue-600">Export</button>
            </div>
          </div>

          <div className="relative h-[63vh] overflow-y-scroll custom-scrollbar rounded-bl-xl">
            <table className="w-full text-sm text-left rtl:text-right text-gray-500">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 capitalize">Sl. No.</th>
                  {selectedRoleFilter === "Total Ambulances" ? (
                    <>
                      <th scope="col" className="px-6 py-3">Ambulance</th>
                      <th scope="col" className="px-6 py-3">Driver ID</th>
                      <th scope="col" className="px-6 py-3">Driver Name</th>
                      <th scope="col" className="px-6 py-3">Phone No.</th>
                      <th scope="col" className="px-6 py-3">Punch Time</th>
                      <th scope="col" className="px-6 py-3">EMT ID</th>
                      <th scope="col" className="px-6 py-3">EMT Name</th>
                      <th scope="col" className="px-6 py-3">Phone No.</th>
                      <th scope="col" className="px-6 py-3">Punch Time</th>
                    </>
                  ) : (
                    <>
                      <th scope="col" className="px-6 py-3">Ambulance</th>
                      <th scope="col" className="px-6 py-3">Employee Info.</th>
                      <th scope="col" className="px-6 py-3">Attendance Status</th>
                      <th scope="col" className="px-6 py-3">Duty Status</th>
                      <th scope="col" className="px-6 py-3">Punch-Time</th>
                      <th scope="col" className="px-6 py-3">Location</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {selectedRoleFilter === "Total Ambulances"
                  ? renderAmbulanceTable()
                  : selectedRoleFilter === "Drivers on Duty"
                  ? renderEmployeeTable("driver")
                  : selectedRoleFilter === "EMTs on Duty"
                  ? renderEmployeeTable("emt")
                  : attendanceData
                      .filter((employee) => !["driver", "emt"].includes(employee.userRole.toLowerCase()))
                      .filter((employee) => {
                        if (selectedActivityFilter === "All") return true;
                        const { isPresent, isInactive } = getEmployeeStatus(employee, '');
                        return selectedActivityFilter === "Active" ? isPresent : isInactive;
                      })
                      .filter((employee) => {
                        const searchLower = inputValue.toLowerCase();
                        const { ambulanceNumber } = getEmployeeStatus(employee, '');
                        return (
                          employee.name.toLowerCase().includes(searchLower) ||
                          employee.employeeSystemId.toLowerCase().includes(searchLower) ||
                          employee.phoneNumber.toLowerCase().includes(searchLower) ||
                          (ambulanceNumber.toLowerCase().includes(searchLower) || false)
                        );
                      })
                      .filter((employee) => {
                        const { isPresent, isAbsent, isEarly, isLate, isPresentOnTime, isInactive } = getEmployeeStatus(employee, '');
                        if (selectedAttendanceStatus === "All" && selectedDutyStatus === "All") return true;
                        if (selectedAttendanceStatus !== "All" && selectedDutyStatus === "All") {
                          if (selectedAttendanceStatus === "Early") return isEarly;
                          if (selectedAttendanceStatus === "Present") return isPresentOnTime;
                          if (selectedAttendanceStatus === "Late") return isLate;
                          if (selectedAttendanceStatus === "Absent") return isAbsent;
                        }
                        if (selectedAttendanceStatus === "All" && selectedDutyStatus !== "All") {
                          if (selectedDutyStatus === "Active") return isPresent;
                          if (selectedDutyStatus === "Inactive") return isInactive;
                        }
                        return true;
                      })
                      .sort((a, b) => {
                        const aStatus = getEmployeeStatus(a, '');
                        const bStatus = getEmployeeStatus(b, '');
                        return aStatus.isPresent === bStatus.isPresent ? 0 : aStatus.isPresent ? -1 : 1;
                      })
                      .map((employee, index) => {
                        const { isEarly, isLate, isPresentOnTime, punchInTime, punchLocation, ambulanceNumber } = getEmployeeStatus(employee, '');
                        return (
                          <tr key={index} className="bg-white border-b border-gray-200">
                            <td className="px-6 py-3.5">{index + 1}</td>
                            <th scope="row" className="px-6 py-3.5 font-medium text-gray-900 whitespace-nowrap">{ambulanceNumber || "-"}</th>
                            <td className="px-6 py-3.5">
                              <div>
                                <p className="text-gray-900 font-semibold">{employee.name}</p>
                                <p className="flex items-center space-x-2 uppercase text-xs">
                                  <span>{employee.userRole}</span>
                                  <span>-</span>
                                  <span>{employee.employeeSystemId}</span>
                                </p>
                              </div>
                            </td>
                            <td className="px-6 py-3.5">
                              <p className={`text-xs font-medium ${isEarly ? "text-blue-600" : isPresentOnTime ? "text-green-600" : isLate ? "text-yellow-600" : "text-red-600"} flex items-center space-x-1.5 border w-[6.5rem] px-2 py-[1px] rounded-md`}>
                                <span className={`block ${isEarly ? "bg-blue-500" : isPresentOnTime ? "bg-green-500" : isLate ? "bg-yellow-500" : "bg-red-600"} w-2 h-2 rounded-full`}></span>
                                <span>{isEarly ? "Early" : isPresentOnTime ? "Present" : isLate ? "Late" : "Absent"}</span>
                              </p>
                            </td>
                            <td className="px-6 py-3.5">{punchInTime}</td>
                            <td className="px-6 py-3.5">{punchLocation}</td>
                          </tr>
                        );
                      })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="w-[30%] h-[70vh] space-y-3">
          <div className="bg-white border border-gray-200 shadow-xs rounded-xl">
            <div className="p-3.5 border-b border-gray-100 bg-white rounded-t-xl">
              <h1 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Browse by Date</h1>
            </div>
            {renderCalendar()}
          </div>
          <div className="bg-white border border-gray-200 shadow-xs rounded-xl p-3">
            <h1 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Over Shift</h1>
            <div className="relative h-[25vh] overflow-y-scroll custom-scrollbar">
              {overShiftEmployees.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No employees on over shift</p>
              ) : (
                overShiftEmployees.map(({ employee, processed }, index) => (
                  <div key={index} className="flex items-center justify-between border-b border-gray-300 pb-2 mb-2">
                    <div>
                      <p className="flex flex-col">
                        <span className="text-gray-900 text-sm">{employee.name}</span>
                        <span className="flex items-center space-x-1">
                          <span className="text-[11px] uppercase">{employee.userRole}</span>
                          <span className="block w-1 h-1 bg-indigo-600 rounded-full"></span>
                          <span className="text-[11px]">{employee.employeeSystemId}</span>
                        </span>
                      </p>
                    </div>
                    <div>
                      <p className="flex flex-col">
                        <span className="flex items-center space-x-2">
                          <span className="text-gray-900 text-xs">Time Logged</span>
                          <span className="text-gray-900">-</span>
                          <span className="text-gray-900 font-semibold">{processed ? formatWorkingTime(processed.totalWorkingSeconds) : "-"}</span>
                        </span>
                        <span className="text-xs">{processed?.punchLocation || "-"}</span>
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}











































