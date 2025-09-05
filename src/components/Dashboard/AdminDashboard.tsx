"use client";

import { useState, useEffect, useRef, JSX } from "react";
import { parseISO, format } from "date-fns";
import { PRODUCTION_API_ENDPOINT } from "@/utils/constants";
import * as XLSX from "xlsx";

interface AttendanceRecord {
  ambulanceNumber: string | null;
  employeeSystemId: string | null;
  name: string | null;
  phoneNumber: string | null;
  latestPunchTime: string;
  latestStatus: string | null;
  punchOutType: string | null;
  designation?: string | null;
}

interface AmbulanceAttendanceResponse {
  totalAmbulances: number;
  totalActiveAmbulances: number;
  totalInActiveAmbulances: number;
  driversOnly: number;
  emtsOnly: number;
  totalDrivers: number;
  totalEmts: number;
  ambulances: {
    ambulanceNumber: string | null;
    driver: AttendanceRecord;
    emt: AttendanceRecord;
  }[];
}

interface DriverAttendanceResponse {
  totalDrivers: number;
  totalAmbulances: number;
  activeDrivers: number;
  inactiveDrivers: number;
  drivers: {
    ambulanceNumber: string | null;
    info: AttendanceRecord[];
  }[];
}

interface EMTAttendanceResponse {
  totalEmployees: number;
  totalAmbulances: number;
  activeEMTs: number;
  inactiveEMTs: number;
  employees: {
    ambulanceNumber: string | null;
    info: AttendanceRecord[];
  }[];
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

type Stat = AmbulanceStat | DutyStat;

export default function AdminDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const [inputValue, setInputValue] = useState<string>("");
  const [attendanceData, setAttendanceData] = useState<{
    ambulances: AmbulanceAttendanceResponse | null;
    drivers: DriverAttendanceResponse | null;
    emts: EMTAttendanceResponse | null;
  }>({
    ambulances: null,
    drivers: null,
    emts: null,
  });
  const [selectedAttendanceStatus, setSelectedAttendanceStatus] = useState<"All" | "Early" | "Present" | "Late" | "Absent">("All");
  const [selectedDutyStatus, setSelectedDutyStatus] = useState<"All" | "Active" | "Inactive" | "Drivers only" | "EMTs only">("All");
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string | null>("Total Ambulances"); // Changed to "Total Ambulances"
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
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
  ]);

  const isLatePunchIn = (punchTime: string | null): "Early" | "Present" | "Late" | "Absent" => {
    if (!punchTime) return "Absent";
    const istPunchInTime = new Date(punchTime);
    const punchInHour = istPunchInTime.getHours();
    const punchInMinute = istPunchInTime.getMinutes();
    const isBefore730 = punchInHour < 7 || (punchInHour === 7 && punchInMinute <= 30);
    const isBetween731And815 = (punchInHour === 7 && punchInMinute > 30) || (punchInHour === 8 && punchInMinute <= 15);
    const isAfter815 = punchInHour > 8 || (punchInHour === 8 && punchInMinute > 15);

    if (isBefore730) return "Early";
    if (isBetween731And815) return "Present";
    if (isAfter815) return "Late";
    return "Absent";
  };

  const countEarlyAndLate = (records: { ambulanceNumber: string | null; info: AttendanceRecord[] }[], role: "driver" | "emt"): { early: number; late: number } => {
    return records
      .flatMap((group) => group.info)
      .filter((employee) => employee.designation?.toLowerCase() === role)
      .filter((employee) => employee.latestStatus === "PunchIn" && !!employee.latestPunchTime)
      .reduce(
        (acc, employee) => {
          const status = isLatePunchIn(employee.latestPunchTime);
          if (status === "Early") acc.early += 1;
          if (status === "Late") acc.late += 1;
          return acc;
        },
        { early: 0, late: 0 }
      );
  };

  const fetchAllData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const endpoints = [
        { title: "Total Ambulances", url: `${PRODUCTION_API_ENDPOINT}/dashboard/ambulance/active/employees` },
        { title: "Drivers on Duty", url: `${PRODUCTION_API_ENDPOINT}/dashboard/ambulance/driver/only` },
        { title: "EMTs on Duty", url: `${PRODUCTION_API_ENDPOINT}/dashboard/ambulance/emt/only` },
      ];

      const responses = await Promise.all(
        endpoints.map(async ({ title, url }) => {
          const response = await fetch(url, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
          });
          if (!response.ok) {
            throw new Error(`HTTP error for ${title}! Status: ${response.status}, StatusText: ${response.statusText}`);
          }
          return { title, data: await response.json() };
        })
      );

      const newData = {
        ambulances: null,
        drivers: null,
        emts: null,
      } as typeof attendanceData;

      const newStats = stats.map((stat) => {
        const response = responses.find((res) => res.title === stat.title);
        if (!response) return stat;

        if (stat.title === "Total Ambulances") {
          const data = response.data as AmbulanceAttendanceResponse;
          newData.ambulances = data;
          return {
            ...stat,
            value: (data.totalActiveAmbulances + data.driversOnly + data.emtsOnly).toString(),
            active: data.totalActiveAmbulances,
            inactive: data.totalInActiveAmbulances,
            driverOnly: data.driversOnly,
            emtOnly: data.emtsOnly,
          };
        } else if (stat.title === "Drivers on Duty") {
          const data = response.data as DriverAttendanceResponse;
          newData.drivers = data;
          const { early, late } = data.drivers && Array.isArray(data.drivers)
            ? countEarlyAndLate(data.drivers, "driver")
            : { early: 0, late: 0 };
          return {
            ...stat,
            value: data.totalDrivers.toString(),
            active: data.activeDrivers,
            inactive: data.inactiveDrivers,
            early,
            late,
          };
        } else if (stat.title === "EMTs on Duty") {
          const data = response.data as EMTAttendanceResponse;
          newData.emts = data;
          const { early, late } = data.employees && Array.isArray(data.employees)
            ? countEarlyAndLate(data.employees, "emt")
            : { early: 0, late: 0 };
          return {
            ...stat,
            value: data.totalEmployees.toString(),
            active: data.activeEMTs,
            inactive: data.inactiveEMTs,
            early,
            late,
          };
        }
        return stat;
      });

      setAttendanceData(newData);
      setStats(newStats);
    } catch (error) {
      console.error("Error fetching data:", error);
      setError(`Failed to fetch data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
        setSelectedDutyStatus(status === "driverOnly" ? "Drivers only" : "EMTs only");
        setSelectedAttendanceStatus("All");
      }
    } else {
      setSelectedAttendanceStatus("All");
      setSelectedDutyStatus("All");
    }
  };

  const renderAmbulanceTable = () => {
    if (!attendanceData.ambulances) return null;

    const data = attendanceData.ambulances;
    const filteredAmbulances = data.ambulances
      .filter((ambulance) => {
        if (selectedDutyStatus === "All") return true;
        const driverActive = !!ambulance.driver.latestPunchTime;
        const emtActive = !!ambulance.emt.latestPunchTime;
        if (selectedDutyStatus === "Active") return driverActive && emtActive;
        if (selectedDutyStatus === "Inactive") return !driverActive && !emtActive;
        if (selectedDutyStatus === "Drivers only") return driverActive && !emtActive;
        if (selectedDutyStatus === "EMTs only") return !driverActive && emtActive;
        return true;
      })
      .filter((ambulance) => {
        const searchLower = inputValue.toLowerCase();
        return (
          (ambulance.ambulanceNumber?.toLowerCase().includes(searchLower) || false) ||
          (ambulance.driver.employeeSystemId?.toLowerCase().includes(searchLower) || false) ||
          (ambulance.driver.name?.toLowerCase().includes(searchLower) || false) ||
          (ambulance.driver.phoneNumber?.toLowerCase().includes(searchLower) || false) ||
          (ambulance.emt.employeeSystemId?.toLowerCase().includes(searchLower) || false) ||
          (ambulance.emt.name?.toLowerCase().includes(searchLower) || false) ||
          (ambulance.emt.phoneNumber?.toLowerCase().includes(searchLower) || false)
        );
      });

    return filteredAmbulances.map((ambulance, index) => (
      <tr key={index} className="bg-white border-b border-gray-200">
        <td className="px-6 py-3.5">{index + 1}</td>
        <th scope="row" className="px-6 py-3.5 font-medium text-gray-900 whitespace-nowrap">{ambulance.ambulanceNumber || "-"}</th>
        <td className="px-6 py-3.5">{ambulance.driver.employeeSystemId || "-"}</td>
        <td className="px-6 py-3.5">{ambulance.driver.name || "-"}</td>
        <td className="px-6 py-3.5">{ambulance.driver.phoneNumber || "-"}</td>
        <td className="px-6 py-3.5">{ambulance.driver.latestPunchTime ? format(parseISO(ambulance.driver.latestPunchTime), "HH:mm:ss") : "-"}</td>
        <td className="px-6 py-3.5">{ambulance.emt.employeeSystemId || "-"}</td>
        <td className="px-6 py-3.5">{ambulance.emt.name || "-"}</td>
        <td className="px-6 py-3.5">{ambulance.emt.phoneNumber || "-"}</td>
        <td className="px-6 py-3.5">{ambulance.emt.latestPunchTime ? format(parseISO(ambulance.emt.latestPunchTime), "HH:mm:ss") : "-"}</td>
      </tr>
    ));
  };

  const renderEmployeeTable = (role: "driver" | "emt") => {
    const data = role === "driver" ? attendanceData.drivers : attendanceData.emts;
    if (!data) return null;

    const records = "drivers" in data ? data.drivers : data.employees;

    if (!records || !Array.isArray(records)) return null;

    const filteredRecords = records
      .flatMap((group) => group.info)
      .filter((employee) => employee.designation?.toLowerCase() === role)
      .filter((employee) => {
        const isActive = employee.latestStatus === "PunchIn" && !!employee.latestPunchTime;
        const attendanceStatus = isActive ? isLatePunchIn(employee.latestPunchTime) : "Absent";
        const isInactive = !isActive;

        if (selectedAttendanceStatus === "All" && selectedDutyStatus === "All") return true;
        if (selectedAttendanceStatus === "Early" || selectedAttendanceStatus === "Present" || selectedAttendanceStatus === "Late") {
          return isActive && attendanceStatus === selectedAttendanceStatus;
        }
        if (selectedAttendanceStatus === "Absent" && selectedDutyStatus === "All") {
          return isInactive;
        }
        if (selectedAttendanceStatus === "All" && selectedDutyStatus !== "All") {
          return selectedDutyStatus === "Active" ? isActive : isInactive;
        }
        if (selectedAttendanceStatus !== "All" && selectedDutyStatus !== "All") {
          const attendanceMatch = attendanceStatus === selectedAttendanceStatus;
          const dutyMatch = selectedDutyStatus === "Active" ? isActive : isInactive;
          return attendanceMatch && dutyMatch;
        }
        return true;
      })
      .filter((employee) => {
        const searchLower = inputValue.toLowerCase();
        return (
          (employee.ambulanceNumber?.toLowerCase().includes(searchLower) || false) ||
          (employee.employeeSystemId?.toLowerCase().includes(searchLower) || false) ||
          (employee.name?.toLowerCase().includes(searchLower) || false) ||
          (employee.phoneNumber?.toLowerCase().includes(searchLower) || false)
        );
      })
      .sort((a, b) => {
        const aIsActive = a.latestStatus === "PunchIn" && !!a.latestPunchTime;
        const bIsActive = b.latestStatus === "PunchIn" && !!b.latestPunchTime;
        return aIsActive === bIsActive ? 0 : aIsActive ? -1 : 1;
      });

    return filteredRecords.map((employee, index) => {
      const isActive = employee.latestStatus === "PunchIn" && !!employee.latestPunchTime;
      const attendanceStatus = isActive ? isLatePunchIn(employee.latestPunchTime) : "Absent";
      const dutyStatus = isActive ? "Active" : "Inactive";
      const attendanceColor = isActive ? attendanceStatus === "Early" ? "text-blue-600" : attendanceStatus === "Present" ? "text-green-600" : attendanceStatus === "Late" ? "text-yellow-600" : "text-gray-600" : "text-gray-600";
      const dutyColor = isActive ? "text-green-600" : "text-red-600";
      const attendanceBg = isActive ? attendanceStatus === "Early" ? "bg-blue-500" : attendanceStatus === "Present" ? "bg-green-500" : attendanceStatus === "Late" ? "bg-yellow-500" : "bg-gray-500" : "bg-gray-500";
      const dutyBg = isActive ? "bg-green-500" : "bg-red-600";

      return (
        <tr key={index} className="bg-white border-b border-gray-200">
          <td className="px-6 py-3.5">{index + 1}</td>
          <th scope="row" className="px-6 py-3.5 font-medium text-gray-900 whitespace-nowrap">{employee.ambulanceNumber || "-"}</th>
          <td className="px-6 py-3.5">
            <div>
              <p className="text-gray-900 font-semibold">{employee.name}</p>
              <p className="flex items-center space-x-2 uppercase text-xs">
                <span>{employee.designation}</span>
                <span>-</span>
                <span>{employee.employeeSystemId}</span>
              </p>
            </div>
          </td>
          <td className="px-6 py-3.5">
            {isActive ? (
              <p className={`text-xs font-medium ${attendanceColor} flex items-center space-x-1.5 border w-[6.5rem] px-2 py-[1px] rounded-md`}>
                <span className={`block ${attendanceBg} w-2 h-2 rounded-full`}></span>
                <span>{attendanceStatus}</span>
              </p>
            ) : (
              <p className="text-xs font-medium text-gray-600 flex items-center space-x-1.5 border w-[6.5rem] px-2 py-[1px] rounded-md">
                <span className="block bg-gray-500 w-2 h-2 rounded-full"></span>
                <span>-</span>
              </p>
            )}
          </td>
          <td className="px-6 py-3.5">
            <p className={`text-xs font-medium ${dutyColor} flex items-center space-x-1.5 border w-[6.5rem] px-2 py-[1px] rounded-md`}>
              <span className={`block ${dutyBg} w-2 h-2 rounded-full`}></span>
              <span>{dutyStatus}</span>
            </p>
          </td>
          <td className="px-6 py-3.5">
            {isActive ? format(parseISO(employee.latestPunchTime), "HH:mm:ss") : "-"}
          </td>
        </tr>
      );
    });
  };

  const exportToExcel = () => {
    if (!attendanceData) {
      return;
    }

    const workbook = XLSX.utils.book_new();
    const timestamp = format(new Date(), "yyyy-MM-dd_HH-mm-ss");
    const filename = `Employees_Status_${timestamp}.xlsx`;
    const tableData: any[] = [];

    if (selectedRoleFilter === "Total Ambulances") {
      const data = attendanceData.ambulances;
      if (!data) return;
      let index = 1;
      data.ambulances
        .filter((ambulance) => {
          if (selectedDutyStatus === "All") return true;
          const driverActive = !!ambulance.driver.latestPunchTime;
          const emtActive = !!ambulance.emt.latestPunchTime;
          if (selectedDutyStatus === "Active") return driverActive && emtActive;
          if (selectedDutyStatus === "Inactive") return !driverActive && !emtActive;
          if (selectedDutyStatus === "Drivers only") return driverActive && !emtActive;
          if (selectedDutyStatus === "EMTs only") return !driverActive && emtActive;
          return true;
        })
        .filter((ambulance) => {
          const searchLower = inputValue.toLowerCase();
          return (
            (ambulance.ambulanceNumber?.toLowerCase().includes(searchLower) || false) ||
            (ambulance.driver.employeeSystemId?.toLowerCase().includes(searchLower) || false) ||
            (ambulance.driver.name?.toLowerCase().includes(searchLower) || false) ||
            (ambulance.driver.phoneNumber?.toLowerCase().includes(searchLower) || false) ||
            (ambulance.emt.employeeSystemId?.toLowerCase().includes(searchLower) || false) ||
            (ambulance.emt.name?.toLowerCase().includes(searchLower) || false) ||
            (ambulance.emt.phoneNumber?.toLowerCase().includes(searchLower) || false)
          );
        })
        .forEach((ambulance) => {
          tableData.push({
            "Serial Number": index++,
            "Ambulance Number": ambulance.ambulanceNumber || "",
            "Driver ID": ambulance.driver.employeeSystemId || "",
            "Driver Name": ambulance.driver.name || "",
            "Driver Phone Number": ambulance.driver.phoneNumber || "",
            "Driver Punch Time": ambulance.driver.latestPunchTime ? format(parseISO(ambulance.driver.latestPunchTime), "HH:mm:ss") : "",
            "EMT ID": ambulance.emt.employeeSystemId || "",
            "EMT Name": ambulance.emt.name || "",
            "EMT Phone Number": ambulance.emt.phoneNumber || "",
            "EMT Punch Time": ambulance.emt.latestPunchTime ? format(parseISO(ambulance.emt.latestPunchTime), "HH:mm:ss") : "",
          });
        });

      const dataSheet = XLSX.utils.json_to_sheet(tableData, {
        header: [
          "Serial Number",
          "Ambulance Number",
          "Driver ID",
          "Driver Name",
          "Driver Phone Number",
          "Driver Punch Time",
          "EMT ID",
          "EMT Name",
          "EMT Phone Number",
          "EMT Punch Time",
        ],
      });
      dataSheet['!cols'] = [
        { wch: 10 },
        { wch: 15 },
        { wch: 15 },
        { wch: 20 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
        { wch: 20 },
        { wch: 15 },
        { wch: 15 },
      ];
      XLSX.utils.book_append_sheet(workbook, dataSheet, "Ambulance Status");
    } else {
      const data = selectedRoleFilter === "Drivers on Duty" ? attendanceData.drivers : attendanceData.emts;
      if (!data) return;
      const role = selectedRoleFilter === "Drivers on Duty" ? "driver" : "emt";
      let index = 1;

      const records = "drivers" in data ? data.drivers : data.employees;
      if (records && Array.isArray(records)) {
        records
          .flatMap((group) => group.info)
          .filter((employee) => employee.designation?.toLowerCase() === role)
          .filter((employee) => {
            const isActive = employee.latestStatus === "PunchIn" && !!employee.latestPunchTime;
            const attendanceStatus = isActive ? isLatePunchIn(employee.latestPunchTime) : "Absent";
            const isInactive = !isActive;

            if (selectedAttendanceStatus === "All" && selectedDutyStatus === "All") return true;
            if (selectedAttendanceStatus === "Early" || selectedAttendanceStatus === "Present" || selectedAttendanceStatus === "Late") {
              return isActive && attendanceStatus === selectedAttendanceStatus;
            }
            if (selectedAttendanceStatus === "Absent" && selectedDutyStatus === "All") {
              return isInactive;
            }
            if (selectedAttendanceStatus === "All" && selectedDutyStatus !== "All") {
              return selectedDutyStatus === "Active" ? isActive : isInactive;
            }
            if (selectedAttendanceStatus !== "All" && selectedDutyStatus !== "All") {
              const attendanceMatch = attendanceStatus === selectedAttendanceStatus;
              const dutyMatch = selectedDutyStatus === "Active" ? isActive : isInactive;
              return attendanceMatch && dutyMatch;
            }
            return true;
          })
          .filter((employee) => {
            const searchLower = inputValue.toLowerCase();
            return (
              (employee.ambulanceNumber?.toLowerCase().includes(searchLower) || false) ||
              (employee.employeeSystemId?.toLowerCase().includes(searchLower) || false) ||
              (employee.name?.toLowerCase().includes(searchLower) || false) ||
              (employee.phoneNumber?.toLowerCase().includes(searchLower) || false)
            );
          })
          .sort((a, b) => {
            const aIsActive = a.latestStatus === "PunchIn" && !!a.latestPunchTime;
            const bIsActive = b.latestStatus === "PunchIn" && !!b.latestPunchTime;
            return aIsActive === bIsActive ? 0 : aIsActive ? -1 : 1;
          })
          .forEach((employee) => {
            const isActive = employee.latestStatus === "PunchIn" && !!employee.latestPunchTime;
            const attendanceStatus = isActive ? isLatePunchIn(employee.latestPunchTime) : "-";
            const dutyStatus = isActive ? "Active" : "Inactive";
            tableData.push({
              "Serial Number": index++,
              "Ambulance Number": employee.ambulanceNumber || "",
              "Employee Name": employee.name || "",
              "Employee Role": employee.designation || "",
              "Employee ID": employee.employeeSystemId || "",
              "Attendance Status": attendanceStatus,
              "Duty Status": dutyStatus,
              "Punch Time": isActive ? format(parseISO(employee.latestPunchTime), "HH:mm:ss") : "",
            });
          });
      }

      const dataSheet = XLSX.utils.json_to_sheet(tableData, {
        header: ["Serial Number", "Ambulance Number", "Employee Name", "Employee Role", "Employee ID", "Attendance Status", "Duty Status", "Punch Time"],
      });
      dataSheet['!cols'] = [
        { wch: 10 },
        { wch: 15 },
        { wch: 20 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
      ];
      XLSX.utils.book_append_sheet(workbook, dataSheet, "Employee Status");
    }

    XLSX.writeFile(workbook, filename);
  };

  const renderSkeleton = () => (
    <div className="animate-pulse p-4">
      <div className="flex items-center justify-between">
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
      </div>
      <div className="space-y-2.5">
        {[...Array(7)].map((_, index) => (
          <div key={index} className="h-11 bg-gray-200 rounded"></div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="p-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-3">
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
            <div className={`border-t border-gray-100 px-4 py-2 flex items-center bg-gray-50/50 rounded-b-xl ${
                stat.title === "Total Ambulances" ? "space-x-4" : "space-x-4 flex-wrap"
              }`}
            >
              <p className="text-xs font-medium text-green-600 flex items-center space-x-1.5 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  handleStatClick(stat.title, "active");
                }}
              >
                <span className="block bg-green-500 w-2 h-2 rounded-full"></span>
                <span>{stat.active} active</span>
              </p>
              <p className="text-xs font-medium text-red-600 flex items-center space-x-1.5 cursor-pointer"
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
        <div className="w-full bg-white border border-gray-200 shadow-xs rounded-xl">
          <div className="flex items-center justify-between p-3 border-b border-gray-200">
            <h1 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Employees Status Overview</h1>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <div className="relative">
                  <input id="employee-name" className="peer w-[10rem] bg-transparent text-gray-800 text-sm border border-gray-300 rounded-md px-3 py-[2px] pr-8 focus:outline-none focus:border-blue-500 hover:border-blue-200 focus:shadow" placeholder=" " value={inputValue} onChange={(e) => setInputValue(e.target.value)}/>
                  <label
                    htmlFor="employee-name"
                    className={`absolute pointer-events-none bg-white px-1 left-3 text-sm transition-all duration-300 ${
                      inputValue
                        ? "-top-2.5 text-[14px] text-blue-600"
                        : "top-[1px] peer-placeholder morph text-sm text-gray-400"
                    } peer-focus:-top-2.5 peer-focus:text-[12px] peer-focus:text-blue-600`}
                  >
                    Search
                  </label>
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
                      {selectedRoleFilter === "Total Ambulances" ? selectedDutyStatus !== "All" ? `Duty: ${selectedDutyStatus}` : "All" : selectedAttendanceStatus !== "All" ? `Attendance: ${selectedAttendanceStatus}` : selectedDutyStatus !== "All" ? `Duty: ${selectedDutyStatus}` : "All"}
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
                      <li
                        className="p-2 hover:bg-blue-100 cursor-pointer text-sm border-b border-gray-300"
                        onClick={() => {
                          setSelectedAttendanceStatus("All");
                          setSelectedDutyStatus("All");
                          setIsDropdownOpen(false);
                        }}
                      >
                        <p className="inline-flex items-center space-x-2">
                          <span className="block w-2 h-2 bg-indigo-600 rounded-full"></span>
                          <span>ALL</span>
                        </p>
                      </li>
                      {selectedRoleFilter === "Total Ambulances" ? (
                        <>
                          <li
                            className="p-2 hover:bg-blue-100 cursor-pointer text-sm border-b border-gray-300"
                            onClick={() => {
                              setSelectedAttendanceStatus("All");
                              setSelectedDutyStatus("Active");
                              setIsDropdownOpen(false);
                            }}
                          >
                            <p className="inline-flex items-center space-x-2">
                              <span className="block w-2 h-2 bg-indigo-600 rounded-full"></span>
                              <span>Active</span>
                            </p>
                          </li>
                          <li
                            className="p-2 hover:bg-blue-100 cursor-pointer text-sm border-b border-gray-300"
                            onClick={() => {
                              setSelectedAttendanceStatus("All");
                              setSelectedDutyStatus("Inactive");
                              setIsDropdownOpen(false);
                            }}
                          >
                            <p className="inline-flex items-center space-x-2">
                              <span className="block w-2 h-2 bg-indigo-600 rounded-full"></span>
                              <span>Inactive</span>
                            </p>
                          </li>
                          <li
                            className="p-2 hover:bg-blue-100 cursor-pointer text-sm border-b border-gray-300"
                            onClick={() => {
                              setSelectedAttendanceStatus("All");
                              setSelectedDutyStatus("Drivers only");
                              setIsDropdownOpen(false);
                            }}
                          >
                            <p className="inline-flex items-center space-x-2">
                              <span className="block w-2 h-2 bg-indigo-600 rounded-full"></span>
                              <span>Drivers only</span>
                            </p>
                          </li>
                          <li
                            className="p-2 hover:bg-blue-100 cursor-pointer text-sm border-b border-gray-300"
                            onClick={() => {
                              setSelectedAttendanceStatus("All");
                              setSelectedDutyStatus("EMTs only");
                              setIsDropdownOpen(false);
                            }}
                          >
                            <p className="inline-flex items-center space-x-2">
                              <span className="block w-2 h-2 bg-indigo-600 rounded-full"></span>
                              <span>EMTs only</span>
                            </p>
                          </li>
                        </>
                      ) : (
                        <>
                          <li
                            className="p-2 hover:bg-blue-100 cursor-pointer text-sm border-b border-gray-300"
                            onClick={() => {
                              setSelectedAttendanceStatus("Early");
                              setSelectedDutyStatus("All");
                              setIsDropdownOpen(false);
                            }}
                          >
                            <p className="inline-flex items-center space-x-2">
                              <span className="block w-2 h-2 bg-indigo-600 rounded-full"></span>
                              <span>Early</span>
                            </p>
                          </li>
                          <li
                            className="p-2 hover:bg-blue-100 cursor-pointer text-sm border-b border-gray-300"
                            onClick={() => {
                              setSelectedAttendanceStatus("Present");
                              setSelectedDutyStatus("All");
                              setIsDropdownOpen(false);
                            }}
                          >
                            <p className="inline-flex items-center space-x-2">
                              <span className="block w-2 h-2 bg-indigo-600 rounded-full"></span>
                              <span>Present</span>
                            </p>
                          </li>
                          <li
                            className="p-2 hover:bg-blue-100 cursor-pointer text-sm border-b border-gray-300"
                            onClick={() => {
                              setSelectedAttendanceStatus("Late");
                              setSelectedDutyStatus("All");
                              setIsDropdownOpen(false);
                            }}
                          >
                            <p className="inline-flex items-center space-x-2">
                              <span className="block w-2 h-2 bg-indigo-600 rounded-full"></span>
                              <span>Late</span>
                            </p>
                          </li>
                          <li
                            className="p-2 hover:bg-blue-100 cursor-pointer text-sm border-b border-gray-300"
                            onClick={() => {
                              setSelectedAttendanceStatus("Absent");
                              setSelectedDutyStatus("All");
                              setIsDropdownOpen(false);
                            }}
                          >
                            <p className="inline-flex items-center space-x-2">
                              <span className="block w-2 h-2 bg-indigo-600 rounded-full"></span>
                              <span>Absent</span>
                            </p>
                          </li>
                          <li
                            className="p-2 hover:bg-blue-100 cursor-pointer text-sm border-b border-gray-300"
                            onClick={() => {
                              setSelectedAttendanceStatus("All");
                              setSelectedDutyStatus("Active");
                              setIsDropdownOpen(false);
                            }}
                          >
                            <p className="inline-flex items-center space-x-2">
                              <span className="block w-2 h-2 bg-indigo-600 rounded-full"></span>
                              <span>Active</span>
                            </p>
                          </li>
                          <li
                            className="p-2 hover:bg-blue-100 cursor-pointer text-sm border-b border-gray-300"
                            onClick={() => {
                              setSelectedAttendanceStatus("All");
                              setSelectedDutyStatus("Inactive");
                              setIsDropdownOpen(false);
                            }}
                          >
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
              <button
                onClick={exportToExcel}
                className="bg-blue-500 text-white px-3 py-1 rounded-md text-sm hover:bg-blue-600 disabled:bg-gray-400"
                disabled={isLoading || !selectedRoleFilter || !attendanceData.ambulances && !attendanceData.drivers && !attendanceData.emts}
              >
                Export
              </button>
            </div>
          </div>

          <div className="relative h-[63vh] overflow-y-scroll custom-scrollbar rounded-bl-xl">
            {error && (
              <div className="p-4 text-red-600 text-sm">{error}</div>
            )}
            {isLoading && renderSkeleton()}
            {!error && !isLoading && selectedRoleFilter && (
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
                        <th scope="col" className="px-6 py-3">Employee Info</th>
                        <th scope="col" className="px-6 py-3">Attendance Status</th>
                        <th scope="col" className="px-6 py-3">Duty Status</th>
                        <th scope="col" className="px-6 py-3">Punch Time</th>
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
                    : null}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}