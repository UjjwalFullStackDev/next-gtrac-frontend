"use client";
import { utils, WorkBook, WorkSheet, writeFile } from "xlsx";
import { useEffect, useState, useRef } from "react";
import CustomDateRangePicker from "../CustomDateRangePicker";
import { PRODUCTION_API_ENDPOINT } from "@/utils/constants";
import { format, eachDayOfInterval, isSameDay, parseISO, startOfDay, isWithinInterval, differenceInSeconds, subDays } from "date-fns";

interface Attendance {
  ambulanceNumber: string;
  punchTime: string;
  punchLocation: string;
  status: string;
  date: string;
  shiftType: string;
  deviceMode: any;
  imageCapture: string;
  punchOutType: string;
}

interface Employee {
  id: number;
  employeeSystemId: string;
  name: string;
  phoneNumber: string;
  userRole: string;
  attendance: Attendance[];
}

interface ProcessedAttendance {
  date: string;
  status: string;
  punchIn: string;
  punchOut: string;
  punchLocation: string;
  totalWorkingSeconds: number;
  ambulanceNumber: string;
}

interface Role {
  id: number;
  name: string;
  description: string;
  shiftStartTime: string;
  shiftEndTime: string;
}

export default function EmployeeAttendance() {
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const [inputValue, setInputValue] = useState<string>("");
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([subDays(new Date(), 4), new Date()]);
  const [employeeAttendanceData, setEmployeeAttendanceData] = useState<Employee[]>([]);
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [selectedAttendance, setSelectedAttendance] = useState<Attendance[]>([]);
  const [selectedEmployeeName, setSelectedEmployeeName] = useState<string>("");
  const attendanceModalRef = useRef<HTMLDivElement>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [roleSearch, setRoleSearch] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [roles, setRoles] = useState<Role[]>([]);

  const calculateTotalWorkingHours = (attendance: Attendance[]): string => {
    const totalSeconds = getDateRangeDays().reduce((total, day) => {
      const dayAttendance = processAttendance(attendance, day);
      return total + (dayAttendance?.totalWorkingSeconds || 0);
    }, 0);

    return formatWorkingTime(totalSeconds);
  };

  useEffect(() => {
    const fetchEmployeeAttendance = async () => {
      try {
        const start = dateRange[0] ? format(startOfDay(dateRange[0]), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');
        const end = dateRange[1] ? format(startOfDay(dateRange[1]), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');
        const res = await fetch(`${PRODUCTION_API_ENDPOINT}/attendance?startDate=${start}&endDate=${end}`);
        if (!res.ok) {
          console.error("Failed to fetch attendance data");
          return;
        }
        let data: Employee[] = await res.json();
        if (selectedRole) {
          data = data.filter(emp => emp.userRole.toLowerCase() === selectedRole.toLowerCase());
        }
        data.sort((a, b) => {
          const aHasAttendance = a.attendance.length > 0;
          const bHasAttendance = b.attendance.length > 0;
          if (aHasAttendance && !bHasAttendance) return -1;
          if (!aHasAttendance && bHasAttendance) return 1;
          if (!aHasAttendance && !bHasAttendance) return 0;
          const aLatest = Math.max(...a.attendance.map(att => parseISO(att.punchTime).getTime()));
          const bLatest = Math.max(...b.attendance.map(att => parseISO(att.punchTime).getTime()));
          return bLatest - aLatest;
        });
        setEmployeeAttendanceData(data);
      } catch (error) {
        console.error("Error fetching attendance data:", error);
      }
    };

    fetchEmployeeAttendance();
    const intervalId = setInterval(fetchEmployeeAttendance, 1000);
    return () => clearInterval(intervalId);
  }, [dateRange, selectedRole]);

  useEffect(() => {
    function handleClickOutside(event: any) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [setIsDropdownOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (attendanceModalRef.current && !attendanceModalRef.current.contains(event.target as Node)) {
        setIsAttendanceModalOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getFormattedDateRange = (): string => {
    if (!dateRange[0] || !dateRange[1]) return format(new Date(), 'dd, MMMM') + ' - ' + format(new Date(), 'dd, MMMM');
    return `${format(dateRange[0], 'dd, MMMM')} - ${format(dateRange[1], 'dd, MMMM')}`;
  };

  const processAttendance = (attendance: Attendance[], day: Date): ProcessedAttendance | undefined => {
    const dayRecords = attendance.filter(att => isSameDay(parseISO(att.date), startOfDay(day)));
    if (dayRecords.length === 0) return undefined;

    const punchIns = dayRecords.filter(att => att.status === "PunchIn");
    const punchOuts = dayRecords.filter(att => att.status === "PunchOut");

    if (punchIns.length === 0) return undefined;

    const firstPunchIn = punchIns[0];
    const lastPunchOut = punchOuts[punchOuts.length - 1];
    const lastRecord = dayRecords[dayRecords.length - 1];

    let totalWorkingSeconds = 0;
    for (let i = 0; i < punchIns.length; i++) {
      const punchInTime = parseISO(punchIns[i].punchTime);
      const punchOutTime = punchOuts[i] && parseISO(punchOuts[i].punchTime);
      if (punchOutTime && punchOutTime > punchInTime) {
        totalWorkingSeconds += differenceInSeconds(punchOutTime, punchInTime);
      }
    }

    const punchInTime = parseISO(firstPunchIn.punchTime);
    const punchOutTime = lastPunchOut && parseISO(lastPunchOut.punchTime);
    const isPunchOutEarlier = punchOutTime && punchOutTime < punchInTime;

    return {
      date: format(day, 'yyyy-MM-dd'),
      status: lastPunchOut ? "PunchOut" : "PunchIn",
      punchIn: firstPunchIn.punchTime,
      punchOut: isPunchOutEarlier ? "" : lastPunchOut?.punchTime || "",
      punchLocation: lastRecord.punchLocation,
      totalWorkingSeconds,
      ambulanceNumber: lastRecord.ambulanceNumber,
    };
  };

  const filteredEmployees: Employee[] = employeeAttendanceData
  .filter((emp) => !emp.employeeSystemId.toLowerCase().startsWith('itg'))
  .filter((emp) => {
    return emp.name.toLowerCase().includes(inputValue.toLowerCase()) || emp.employeeSystemId.toLowerCase().includes(inputValue.toLowerCase());
  });

  const formatTime = (isoString?: string): string => {
    if (!isoString) return "--";
    return format(parseISO(isoString), "hh:mm:ss a");
  };

  const formatWorkingTime = (totalSeconds: number): string => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    let result = '';
    if (hours > 0) result += `${hours}h `;
    if (minutes > 0 || hours > 0) result += `${minutes}m `;
    result += `${seconds}s`;
    return result.trim();
  };

  const getDateRangeDays = (): Date[] => {
    if (!dateRange[0] || !dateRange[1]) return [new Date()];
    return eachDayOfInterval({ start: startOfDay(dateRange[0]), end: startOfDay(dateRange[1]) });
  };

  const handleExport = () => {
    if (!dateRange[0] || !dateRange[1]) return;

    const normalizedStart = startOfDay(dateRange[0]);
    const normalizedEnd = startOfDay(dateRange[1]);

    const exportData = employeeAttendanceData
      .filter((emp) => !emp.employeeSystemId.toLowerCase().startsWith('itg'))
      .flatMap((employee) => {
        const days = eachDayOfInterval({ 
          start: normalizedStart, 
          end: normalizedEnd 
        });
        
        const attendanceRecords = days
          .map(day => processAttendance(employee.attendance, day))
          .filter((att): att is ProcessedAttendance => att !== undefined)
          .filter((att) => !att.ambulanceNumber.toLowerCase().startsWith('itg'))
          .filter(att => isWithinInterval(parseISO(att.date), {
            start: normalizedStart,
            end: normalizedEnd
          }));

        if (attendanceRecords.length === 0) {
          return [{
            Category: employee.userRole.toUpperCase(),
            "Employee ID": employee.employeeSystemId,
            Name: employee.name,
            "Mobile Number": employee.phoneNumber,
            "Ambulance Number": "-",
            Date: "-",
            "Punch In Time": "--",
            "Punch Out Time": "--",
            "Punch In Location": "-",
            "Punch Out Location": "-",
            "Time Logged": "-"
          }];
        }

        return attendanceRecords.map((att) => ({
          Category: employee.userRole.toUpperCase(),
          "Employee ID": employee.employeeSystemId,
          Name: employee.name,
          "Mobile Number": employee.phoneNumber,
          "Ambulance Number": att.ambulanceNumber || "-",
          Date: att.date || "-",
          "Punch In Time": att.punchIn ? formatTime(att.punchIn) : "--",
          "Punch Out Time": att.punchOut ? formatTime(att.punchOut) : "--",
          "Punch In Location": employee.attendance.find(a => a.punchTime === att.punchIn)?.punchLocation || "-",
          "Punch Out Location": att.punchOut ? (employee.attendance.find(a => a.punchTime === att.punchOut)?.punchLocation || "-") : "-",
          "Time Logged": att.totalWorkingSeconds ? formatWorkingTime(att.totalWorkingSeconds) : "-"
        }));
      })
      .sort((a, b) => {
        if (a.Name < b.Name) return -1;
        if (a.Name > b.Name) return 1;
        return a.Date < b.Date ? -1 : a.Date > b.Date ? 1 : 0;
      });

    const summaryData = employeeAttendanceData
      .filter((emp) => !emp.employeeSystemId.toLowerCase().startsWith('itg'))
      .map((employee) => ({
        Category: employee.userRole.toUpperCase(),
        "Employee ID": employee.employeeSystemId,
        Name: employee.name,
        "Mobile Number": employee.phoneNumber,
        "Total Hours": calculateTotalWorkingHours(employee.attendance),
        "Days Present": getDateRangeDays()
          .map(day => processAttendance(employee.attendance, day))
          .filter(att => att !== undefined).length,
        "Average Hours Per Day": (() => {
          const totalSeconds = getDateRangeDays().reduce((total, day) => {
            const dayAttendance = processAttendance(employee.attendance, day);
            return total + (dayAttendance?.totalWorkingSeconds || 0);
          }, 0);
          const daysPresent = getDateRangeDays()
            .map(day => processAttendance(employee.attendance, day))
            .filter(att => att !== undefined).length;
          return daysPresent > 0 ? formatWorkingTime(totalSeconds / daysPresent) : "-";
        })()
      }));

    const workbook: WorkBook = utils.book_new();
    
    const worksheet: WorkSheet = utils.json_to_sheet(exportData);
    worksheet['!cols'] = [
      { wch: 15 }, { wch: 15 }, { wch: 20 },
      { wch: 15 }, { wch: 12 }, { wch: 10 }, { wch: 15 },
      { wch: 15 }, { wch: 25 }, { wch: 25 }, { wch: 12 }
    ];
    worksheet['!autofilter'] = { ref: `A1:L1` }; 
    
    const headerRange = utils.decode_range(worksheet['!ref'] || 'A1:L1');
    for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
      const cellAddress = utils.encode_cell({ r: 0, c: col });
      if (!worksheet[cellAddress]) continue;
      worksheet[cellAddress].s = {
        font: { bold: true, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "4F81BD" } },
        alignment: { horizontal: "center", vertical: "center" }
      };
    }

    const dataRange = utils.decode_range(worksheet['!ref'] || 'A1:L1');
    for (let row = dataRange.s.r + 1; row <= dataRange.e.r; row++) {
      for (let col = dataRange.s.c; col <= dataRange.e.c; col++) {
        const cellAddress = utils.encode_cell({ r: row, c: col });
        if (!worksheet[cellAddress]) continue;
        worksheet[cellAddress].s = {
          fill: { fgColor: { rgb: row % 2 === 0 ? "F5F5F5" : "FFFFFF" } },
          alignment: { horizontal: "left", vertical: "center" }
        };
      }
    }

    utils.book_append_sheet(workbook, worksheet, "Detailed Attendance");

    const summaryWorksheet: WorkSheet = utils.json_to_sheet(summaryData);
    summaryWorksheet['!cols'] = [
      { wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 15 },
      { wch: 12 }, { wch: 12 }, { wch: 15 }
    ];
    summaryWorksheet['!autofilter'] = { ref: `A1:G1` }; 
    
    const summaryHeaderRange = utils.decode_range(summaryWorksheet['!ref'] || 'A1:G1');
    for (let col = summaryHeaderRange.s.c; col <= summaryHeaderRange.e.c; col++) {
      const cellAddress = utils.encode_cell({ r: 0, c: col });
      if (!summaryWorksheet[cellAddress]) continue;
      summaryWorksheet[cellAddress].s = {
        font: { bold: true, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "4F81BD" } },
        alignment: { horizontal: "center", vertical: "center" }
      };
    }
    
    const summaryDataRange = utils.decode_range(summaryWorksheet['!ref'] || 'A1:G1');
    for (let row = summaryDataRange.s.r + 1; row <= summaryDataRange.e.r; row++) {
      for (let col = summaryDataRange.s.c; col <= summaryDataRange.e.c; col++) {
        const cellAddress = utils.encode_cell({ r: row, c: col });
        if (!summaryWorksheet[cellAddress]) continue;
        summaryWorksheet[cellAddress].s = {
          fill: { fgColor: { rgb: row % 2 === 0 ? "F5F5F5" : "FFFFFF" } },
          alignment: { horizontal: "left", vertical: "center" }
        };
      }
    }

    utils.book_append_sheet(workbook, summaryWorksheet, "Summary");

    writeFile(workbook, `Employee_Attendance_${format(normalizedStart, "yyyy-MM-dd")}_to_${format(normalizedEnd, "yyyy-MM-dd")}.xlsx`);
  };

  const handleCellClick = (employee: Employee, day: Date) => {
    const dayRecords = employee.attendance.filter(att => isSameDay(parseISO(att.date), startOfDay(day)));
    setSelectedAttendance(dayRecords);
    setSelectedEmployeeName(employee.name);
    setIsAttendanceModalOpen(true);
  };

  const roleOptions = async () => {
    const response = await fetch(`${PRODUCTION_API_ENDPOINT}/master/categories`);
    const data = await response.json();
    return data.data || [];
  };

  const filteredRoles = async (search: string):  Promise<Role[]> => {
    const allRoles = await roleOptions();
    return allRoles.filter((role: Role) =>
      role.name.toLowerCase().includes(search.toLowerCase())
    );
  };

  useEffect(() => {
    const fetchFilteredRoles = async () => {
      const filtered = await filteredRoles(roleSearch);
      setRoles(filtered);
    };

    fetchFilteredRoles();
  }, [roleSearch]);

  return (
    <div className="p-4">
      <section className="mb-4">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div>
            <div className="flex items-center">
              <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">Attendance Management</h1>
            </div>
            <p className="mt-2 text-gray-600">Track, manage, and analyze employee attendance in real-time</p>
          </div>
          
          <div className="flex flex-shrink-0 flex-wrap gap-3">
            <div className="flex items-center justify-between space-x-2">
              <div className="relative">
                <div className="relative">
                  <input id="employee-name" className="peer w-full bg-transparent text-gray-800 text-sm border border-gray-300 rounded-md px-3 py-[7px] pr-8 focus:outline-none focus:border-blue-500 hover:border-blue-200 focus:shadow" placeholder=" " value={inputValue} onChange={(e) => setInputValue(e.target.value)}/>
                  <label htmlFor="employee-name" className={`absolute pointer-events-none bg-gradient-to-br from-gray-50 to-gray-100 px-1 left-3 text-gray-700 text-sm transition-all duration-300 ${inputValue ? "-top-2 text-[13px] text-blue-600" : "top-1.5 peer-placeholder morph text-sm text-gray-400"} peer-focus:-top-2 peer-focus:text-[13px] peer-focus:text-blue-600`}>Search</label>
                </div>
                <span className="absolute inset-y-0 right-2.5 flex items-center text-gray-400 peer-focus:text-blue-600 peer-placeholder-shown:text-gray-400">
                  <svg width="18" height="18" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-inherit">
                    <path d="M7.66659 13.9999C11.1644 13.9999 13.9999 11.1644 13.9999 7.66659C13.9999 4.16878 11.1644 1.3339 7.66659 1.3339C4.16878 1.3339 1.3339 4.16878 1.3339 7.6669C1.3339 11.1644 4.16878 13.9999 7.66659 13.9999Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M14.6666 14.6666L13.3333 13.3333" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
              </div>

              <div className="relative w-[160px]" ref={dropdownRef}>
                <div className="border border-gray-300 text-[#797979] text-sm w-full cursor-pointer p-1.5 rounded-md" onClick={() => setIsDropdownOpen(!isDropdownOpen)} tabIndex={0}>
                  <span className="flex items-center justify-between">
                    <span className="truncate tracking-wider">{selectedRole || "Select Categories..."}</span>
                    <span className={isDropdownOpen ? "rotate-180" : ""}>
                      <svg width="12" height="6" viewBox="0 0 14 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" clipRule="evenodd" d="M6.28935 7.15694L0.632351 1.49994L2.04635 0.085937L6.99635 5.03594L11.9464 0.0859374L13.3604 1.49994L7.70335 7.15694C7.51582 7.34441 7.26152 7.44972 6.99635 7.44972C6.73119 7.44972 6.47688 7.34441 6.28935 7.15694Z" fill="#797979"/>
                      </svg>
                    </span>
                  </span>
                </div>
                {isDropdownOpen && (
                  <div className="absolute z-50 bg-white border border-gray-300 rounded-lg shadow mt-1 w-full">
                    <input type="text" placeholder="Search..." className="w-full p-1.5 border-b border-gray-300 text-sm text-gray-500 outline-none" value={roleSearch} onChange={(e) => setRoleSearch(e.target.value)}/>
                    <ul className="overflow-y-auto custom-scrollbar max-h-44">
                      <li
                      className="p-2 hover:bg-blue-100 cursor-pointer text-sm"
                      onClick={() => {
                        setSelectedRole("");
                        setIsDropdownOpen(false);
                        setRoleSearch("");
                      }}
                    >
                      All Categories
                    </li>
                      {roles.length > 0 ? (
                        roles.map((role, index) => (
                          <li
                            key={index}
                            className="p-2 hover:bg-blue-100 cursor-pointer text-sm"
                            onClick={() => {
                              setSelectedRole(role.name);
                              setIsDropdownOpen(false);
                              setRoleSearch('');
                            }}
                          >
                            {role.name}
                          </li>
                        ))
                      ) : (
                        <li className="p-2 text-gray-500 text-sm">No roles found</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
              
              <CustomDateRangePicker setDateRange={setDateRange} />

              <button onClick={handleExport} className="relative overflow-x-hidden py-[3px] px-2 cursor-pointer border border-[#1D6F42] text-[#1D6F42] font-bold rounded-md inline-flex items-center group">
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
          </div>
        </section>

      {isAttendanceModalOpen && selectedAttendance.length > 0 && (
        <div className="fixed inset-0 backdrop-blur-[1px] flex justify-end z-50 h-screen">
          <div ref={attendanceModalRef} className="bg-white shadow-2xl w-full max-w-[65rem] border border-gray-300 overflow-hidden max-h-[100vh] flex flex-col">
            <div className="flex items-center justify-between p-5 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Attendance Details</h2>
                <div className="flex items-center mt-1">
                  <div className="flex items-center space-x-1.5 text-gray-600">
                    <svg xmlns="http://www.w3.org/2000/svg" width={20} height={20} viewBox="0 0 24 24">
                      <path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M19.523 21.99H4.488c-1.503 0-2.663-1.134-2.466-2.624l.114-.869c.207-1.2 1.305-1.955 2.497-2.214L11.928 15h.144l7.295 1.283c1.212.28 2.29.993 2.497 2.214l.114.88c.197 1.49-.963 2.623-2.466 2.623zM17 7A5 5 0 1 1 7 7a5 5 0 0 1 10 0"></path>
                    </svg>
                    <span className="font-medium">{selectedEmployeeName}</span>
                  </div>
                  <span className="mx-3 text-gray-300">|</span>
                  <div className="flex items-center space-x-1.5 text-gray-600">
                    <svg xmlns="http://www.w3.org/2000/svg" width={20} height={20} viewBox="0 0 24 24">
                      <path fill="currentColor" d="M17 14a1 1 0 1 0 0-2a1 1 0 0 0 0 2m0 4a1 1 0 1 0 0-2a1 1 0 0 0 0 2m-4-5a1 1 0 1 1-2 0a1 1 0 0 1 2 0m0 4a1 1 0 1 1-2 0a1 1 0 0 1 2 0m-6-3a1 1 0 1 0 0-2a1 1 0 0 0 0 2m0 4a1 1 0 1 0 0-2a1 1 0 0 0 0 2"></path>
                      <path fill="currentColor" fillRule="evenodd" d="M7 1.75a.75.75 0 0 1 .75.75v.763c.662-.013 1.391-.013 2.193-.013h4.113c.803 0 1.532 0 2.194.013V2.5a.75.75 0 0 1 1.5 0v.827q.39.03.739.076c1.172.158 2.121.49 2.87 1.238c.748.749 1.08 1.698 1.238 2.87c.153 1.14.153 2.595.153 4.433v2.112c0 1.838 0 3.294-.153 4.433c-.158 1.172-.49 2.121-1.238 3.479c-.749.748-1.698 1.3-2.87 1.238c-1.14.153-2.595.153-4.433.153H9.945c-1.838 0-3.294 0-4.433-.153c-1.172-.158-2.121-.49-2.87-1.238c-.748-.749-1.08-1.698-1.238-2.87c-.153-1.14-.153-2.595-.153-4.433v-2.112c0-1.838 0-3.294.153-4.433c.158-1.172.49-2.121 1.238-2.87c.749-.748 1.698-1.08 2.87-1.238q.35-.046.739-.076V2.5A.75.75 0 0 1 7 1.75M5.71 4.89c-1.005.135-1.585.389-2.008.812S3.025 6.705 2.89 7.71q-.034.255-.058.539h18.336q-.024-.284-.058-.54c-.135-1.005-.389-1.585-.812-2.008s-1.003-.677-2.009-.812c-1.027-.138-2.382-.14-4.289-.14h-4c-1.907 0-3.261.002-4.29.14M2.75 12c0-.854 0-1.597.013-2.25h18.474c.013.653.013 1.396.013 2.25v2c0 1.907-.002 3.262-.14 4.29c-.135 1.005-.389 1.585-.812 2.008s-1.003.677-2.009.812c-1.027.138-2.382.14-4.289.14h-4c-1.907 0-3.261-.002-4.29-.14c-1.005-.135-1.585-.389-2.008-.812s-.677-1.003-.812-2.009c-.138-1.027-.14-2.382-.14-4.289z" clipRule="evenodd"></path>
                    </svg>
                    <span>{format(parseISO(selectedAttendance[0].date), 'MMMM d, yyyy')}</span>
                  </div>
                  <span className="mx-3 text-gray-300">|</span>
                  <div className="flex items-center space-x-1.5 text-gray-600">
                    <svg xmlns="http://www.w3.org/2000/svg" width={22} height={22} viewBox="0 0 50 50">
                      <g fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}>
                        <path stroke="#344054" d="M25 16.667V25l4.167 4.167m4.166 10.416L37.5 43.75m-25-37.5a6.25 6.25 0 0 0-2.687 11.875a16.67 16.67 0 0 1 8.333-8.333A6.25 6.25 0 0 0 12.5 6.25m25 0a6.25 6.25 0 0 0-5.625 3.563a16.67 16.67 0 0 1 8.333 8.333A6.25 6.25 0 0 0 37.5 6.25M16.667 39.583L12.5 43.75z"></path>
                        <path stroke="#344054" d="M41.667 25a16.667 16.667 0 0 1-33.334 0a16.5 16.5 0 0 1 1.48-6.875a16.67 16.67 0 0 1 8.333-8.333a16.67 16.67 0 0 1 13.75 0a16.67 16.67 0 0 1 8.333 8.333A16.5 16.5 0 0 1 41.667 25"></path>
                      </g>
                    </svg>
                    <span>
                      {selectedAttendance.length > 0 ? formatWorkingTime(
                            selectedAttendance
                              .filter((att) => att.status === "PunchIn" || att.status === "PunchOut")
                              .reduce((total, att, index, arr) => {
                                if (att.status === "PunchIn" && arr[index + 1]?.status === "PunchOut") {
                                  const punchInTime = parseISO(att.punchTime);
                                  const punchOutTime = parseISO(arr[index + 1].punchTime);
                                  if (punchOutTime > punchInTime) {
                                    return total + differenceInSeconds(punchOutTime, punchInTime);
                                  }
                                }
                                return total;
                              }, 0)
                          )
                        : "-"}
                    </span>
                  </div>
                </div>
              </div>
              
              <button className="flex items-center justify-center w-10 h-10 rounded-full bg-white hover:bg-gray-50 transition-all duration-200 border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:ring-opacity-50 cursor-pointer" onClick={() => setIsAttendanceModalOpen(false)}>
                <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" className="text-gray-500">
                  <path fill="currentColor" d="M6.4 19L5 17.6l5.6-5.6L5 6.4L6.4 5l5.6 5.6L17.6 5L19 6.4L13.4 12l5.6 5.6l-1.4 1.4l-5.6-5.6z" strokeWidth={0.5} stroke="currentColor"></path>
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-scroll no-scrollbar relative">
              <table className="w-full border-collapse">
                <thead className="sticky -top-1 bg-gray-100 z-10">
                  <tr>
                    <th className="p-3 text-left font-semibold text-sm text-gray-700">Time</th>
                    <th className="p-3 text-left font-semibold text-sm text-gray-700">Status</th>
                    <th className="p-3 text-left font-semibold text-sm text-gray-700">Location</th>
                    <th className="p-3 text-left font-semibold text-sm text-gray-700">Ambulance</th>
                    <th className="p-3 text-left font-semibold text-sm text-gray-700">Device Mode</th>
                    <th className="p-3 text-left font-semibold text-sm text-gray-700">Capture</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedAttendance.map((att, index) => (
                    <tr key={index} className="hover:bg-gray-50 transition-colors border-b border-gray-200">
                      <td className="p-3 text-sm text-gray-800">{formatTime(att.punchTime)}</td>
                      <td className="p-3">
                        <span className={`inline-block text-xs font-medium px-3 py-1 rounded-sm text-center w-24 uppercase ${
                          att.status === 'PunchIn' && att.punchOutType === 'manual' ? 'bg-indigo-100 text-green-700 border border-green-200' : att.status === 'PunchOut' && att.punchOutType === 'manual' ? 'bg-indigo-100 text-indigo-700 border border-indigo-200' : att.status === 'PunchOut' && att.punchOutType === 'auto' ? 'bg-red-100 text-red-700 border border-red-200' : ''
                        }`}>{att.status === 'PunchIn' && att.punchOutType === 'manual' ? 'Punch In' : att.status === 'PunchOut' && att.punchOutType === 'manual' ? 'Punch Out' : att.status === 'PunchOut' && att.punchOutType === 'auto' ? 'Auto Out' : ''}</span>
                      </td>
                      <td className="p-3 text-sm text-gray-700 text-wrap">{att.punchLocation}</td>
                      <td className="p-3 text-sm text-gray-700">{att.ambulanceNumber}</td>
                      <td className="p-3">
                        <span className={`flex items-center space-x-2 text-xs font-medium px-3 py-1 rounded-sm text-center w-24 tracking-widest uppercase ${att?.deviceMode === 'Online' ? 'border border-indigo-200 bg-indigo-100 text-indigo-700' : 'border border-rose-200 bg-rose-100 text-rose-700'}`}>
                          <span className={`inline-block w-[7px] h-[7px] rounded-full animate-pulse ${att?.deviceMode === 'Online' ? 'bg-indigo-700' : 'bg-rose-700'}`}></span>
                          <span>{att?.deviceMode ? att?.deviceMode : 'Offline'}</span>
                        </span>
                      </td>
                      <td className="p-3 text-sm text-gray-700">
                        {
                          att?.imageCapture && att?.imageCapture.trim() !== '' ? (
                            <button onClick={() => att.imageCapture && window.open(att.imageCapture, '_blank')} className={`flex items-center space-x-2 text-xs font-medium px-3 py-1 rounded-sm text-center w-24 uppercase border border-lime-200  bg-lime-100 text-lime-700 cursor-pointer`}>
                              <svg xmlns="http://www.w3.org/2000/svg" width={20} height={20} viewBox="0 0 24 24">
                                <g fill="currentColor" fillRule="evenodd" clipRule="evenodd">
                                  <path d="M16 6.75a1.25 1.25 0 1 0 0 2.5a1.25 1.25 0 0 0 0-2.5M13.25 8a2.75 2.75 0 1 1 5.5 0a2.75 2.75 0 0 1-5.5 0"></path>
                                  <path d="M11.943 1.25h.114c2.309 0 4.118 0 5.53.19c1.444.194 2.584.6 3.479 1.494c.895.895 1.3 2.035 1.494 3.48c.19 1.411.19 3.22.19 5.529v.114c0 2.309 0 4.118-.19 5.53c-.194 1.444-.6 2.584-1.494 3.479c-.895.895-2.035 1.3-3.48 1.494c-1.411.19-3.22.19-5.529.19h-.114c-2.309 0-4.118 0-5.53-.19c-1.444-.194-2.584-.6-3.479-1.494c-.895-.895-1.3-2.035-1.494-3.48c-.19-1.411-.19-3.22-.19-5.529v-.114c0-2.309 0-4.118.19-5.53c.194-1.444.6-2.584 1.494-3.479c.895-.895 2.035-1.3 3.48-1.494c1.411-.19 3.22-.19 5.529-.19M3.995 20.005c-.57-.57-.897-1.34-1.069-2.619c-.153-1.141-.173-2.597-.176-4.546l1.495-1.308a1.55 1.55 0 0 1 2.117.07l4.29 4.29a2.75 2.75 0 0 0 3.526.306l.298-.21a2.25 2.25 0 0 1 2.799.168l3.223 2.902q.053.047.111.083a3 3 0 0 1-.604.864c-.57.57-1.34.897-2.619 1.069c-1.3.174-3.008.176-5.386.176s-4.086-.002-5.386-.176c-1.279-.172-2.05-.5-2.62-1.069m2.62-17.079c-1.279.172-2.05.5-2.62 1.069c-.569.57-.896 1.34-1.068 2.619c-.145 1.08-.17 2.44-.175 4.233l.507-.444a3.05 3.05 0 0 1 4.165.139l4.29 4.29a1.25 1.25 0 0 0 1.602.138l.298-.21a3.75 3.75 0 0 1 4.665.281l2.774 2.497l.022-.152c.174-1.3.176-3.008.176-5.386s-.002-4.086-.176-5.386c-.172-1.279-.5-2.05-1.069-2.62c-.57-.569-1.34-.896-2.619-1.068c-1.3-.174-3.008-.176-5.386-.176s-4.086.002-5.386.176"></path>
                                </g>
                              </svg>
                              <span>image</span>
                            </button>
                          ) : (
                            <p className={`flex items-center space-x-2 text-xs font-medium px-3 py-1 rounded-sm text-center w-24 uppercase border border-indigo-200  bg-indigo-100 text-indigo-700 cursor-not-allowed`}>
                              <span>
                                <svg xmlns="http://www.w3.org/2000/svg" width={20} height={20} viewBox="0 0 24 24">
                                  <path fill="currentColor" d="M20 12a8 8 0 0 1-8 8a8 8 0 0 1-8-8a8 8 0 0 1 8-8c.76 0 1.5.11 2.2.31l1.57-1.57A9.8 9.8 0 0 0 12 2A10 10 0 0 0 2 12a10 10 0 0 0 10 10a10 10 0 0 0 10-10M7.91 10.08L6.5 11.5L11 16L21 6l-1.41-1.42L11 13.17z"></path>
                                </svg>
                              </span>
                              <span>verified</span>
                            </p>
                          )
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <div className="h-[75vh] rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-2">
        <div className="h-[72vh] bg-white border border-gray-50 shadow rounded-md overflow-hidden">
          <div className="h-full w-full overflow-auto custom-scrollbar">
            <div className="min-w-max">
              <div className="flex sticky top-0 z-40 bg-white">
                <div className="flex items-center justify-center border-r border-b border-gray-300 w-[10.06rem] min-w-[10rem] h-[5.5rem] px-2 sticky top-0 left-0 z-50 bg-white">
                  <p className="flex items-center space-x-2">
                    <span className="text-sm font-semibold text-gray-800">Employees</span>
                  </p>
                </div>

                <div className="flex items-center justify-center border-r border-b border-gray-300 w-[10rem] min-w-[10rem] h-[5.5rem] px-2 sticky top-0 left-[10.1rem] z-50 bg-white">
                  <p className="flex items-center space-x-2 text-sm font-semibold text-gray-800">Designation</p>
                </div>

                <div className="flex flex-col items-center justify-center border-r border-b border-gray-300 w-[10rem] min-w-[10rem] h-[5.5rem] px-2 sticky top-0 left-[20.12rem] z-50 bg-white font-semibold text-gray-800">
                  <p className="text-sm">Worked Hours</p>
                  <p className="text-xs">{getFormattedDateRange()}</p>
                </div>
                <div className="flex">
                  {getDateRangeDays().map((day, index) => (
                    <div
                      key={index}
                      className={`flex flex-col items-center justify-center border-r border-b border-gray-200 w-[12rem] min-w-[12rem] h-[5.5rem] px-2 ${
                        isSameDay(day, new Date()) ? 'bg-blue-100 text-blue-800' : 'bg-white text-gray-800'
                      }`}
                    >
                      <span className="text-sm font-semibold">{format(day, "MMM d, yyyy")}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex">
                <div className="flex flex-col sticky left-0 bg-white border-r border-gray-300 z-10">
                  {filteredEmployees.length > 0 ? (
                    filteredEmployees.map((employee) => (
                      <div key={employee.id} className="flex flex-col items-center justify-center border-b border-gray-200 w-[10rem] min-w-[10rem] h-[5.5rem] bg-white">
                        <h1 className="text-sm text-center font-medium w-full px-2 truncate">{employee.name}</h1>
                        <p className="text-sm text-gray-600">{employee.employeeSystemId}</p>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center border-b border-gray-200 w-[10rem] min-w-[10rem] h-[5.5rem] bg-white">
                      <span className="text-sm text-gray-600">No employee found</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-col bg-white border-r border-gray-300 sticky top-0 left-[10.1rem] z-10">
                  {filteredEmployees.length > 0 ? (
                    filteredEmployees.map((employee) => (
                      <div key={employee.id} className="flex flex-col items-center justify-center border-b border-gray-200 w-[9.95rem] min-w-[9.95rem] h-[5.5rem] bg-white">
                        <h1 className="text-sm text-center font-medium w-full px-2 uppercase">{employee.userRole}</h1>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center border-b border-gray-200 w-[9.95rem] min-w-[9.95rem] h-[5.5rem] bg-white">
                      <span className="text-sm text-gray-600">No employee found</span>
                    </div>
                  )}
                </div>
               
                <div className="flex flex-col bg-white border-r border-gray-300 sticky top-0 left-[20.12rem] z-10">
                  {filteredEmployees.length > 0 ? (
                    filteredEmployees.map((employee) => (
                      <div key={employee.id} className="flex flex-col items-center justify-center border-b border-gray-200 w-[9.95rem] min-w-[9.95rem] h-[5.5rem] bg-white">
                        <h1 className="text-xs text-center font-medium w-full px-2">{calculateTotalWorkingHours(employee.attendance)}</h1>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center border-b border-gray-200 w-[9.95rem] min-w-[9.95rem] h-[5.5rem] bg-white">
                      <span className="text-sm text-gray-600">No employee found</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-col">
                  {filteredEmployees.length > 0 ? (
                    filteredEmployees.map((employee) => (
                      <div key={employee.id} className="flex">
                        {getDateRangeDays().map((day, dayIndex) => {
                          const attendance = processAttendance(employee.attendance, day);
                          return (
                            <div key={dayIndex} title={employee.name ? employee.name : ""} className={`flex flex-col items-center justify-center border-r border-b border-gray-300 w-[12rem] min-w-[12rem] h-[5.5rem] px-2 relative ${attendance ? "bg-green-50 cursor-pointer" : "bg-white"}`} onClick={() => attendance && handleCellClick(employee, day)}>
                              {attendance ? (
                                <div className="flex flex-col items-center space-y-1">
                                  <div className="mb-3">
                                    <div className="grid grid-cols-3 text-gray-800 text-xs text-center w-full">
                                      <div className="text-[11px]">In Time</div>
                                      <div className="text-center text-gray-400">|</div>
                                      <div className="text-[11px]">Out Time</div>
                                    </div>
                                    <div className="grid grid-cols-3 text-gray-900 text-xs font-medium text-center w-full">
                                      <div>{formatTime(attendance.punchIn)}</div>
                                      <div className="text-center text-gray-400">|</div>
                                      <div>{attendance.punchOut ? formatTime(attendance.punchOut) : "--"}</div>
                                    </div>
                                  </div>
                                  <div className="text-xs text-gray-600">Time logged: {attendance.totalWorkingSeconds ? formatWorkingTime(attendance.totalWorkingSeconds) : "-"}</div>
                                </div>
                              ) : (
                                <div className="flex items-center justify-center h-full">
                                  <div className="text-xs font-medium text-center">-</div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ))
                  ) : (
                    <div className="flex">
                      {getDateRangeDays().map((_, dayIndex) => (
                        <div key={dayIndex} className="flex flex-col items-center justify-center border-r border-b border-gray-300 w-[12rem] min-w-[12rem] h-[5.5rem] px-2 bg-white">
                          <div className="text-xs font-medium text-center">-</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}