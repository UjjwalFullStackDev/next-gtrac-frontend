"use client";
import { PRODUCTION_API_ENDPOINT } from "@/utils/constants";
import { useEffect, useRef, useState } from "react";

interface Role {
  id: number;
  name: string;
  description: string;
  shiftStartTime: string;
  shiftEndTime: string;
}

interface Employee {
    employeeId: number;
    employeeSystemId: string;
    name: string;
    phoneNumber: string;
    categoryName: string;
}

export default function EmployeeLists () {
    const dropdownRef = useRef<HTMLDivElement | null>(null);
    const editDropdownRef = useRef<HTMLDivElement | null>(null);
    const [inputValue, setInputValue] = useState<string>("");
    const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
    const [selectedRole, setSelectedRole] = useState<string>("");
    const [roleSearch, setRoleSearch] = useState<string>("");
    const [roles, setRoles] = useState<Role[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
    const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
    const [editFormData, setEditFormData] = useState<Employee>({ employeeId: 0, employeeSystemId: "", name: "", phoneNumber: "", categoryName: "" });
    const [isEditDropdownOpen, setIsEditDropdownOpen] = useState<boolean>(false);
    const [editRoleSearch, setEditRoleSearch] = useState<string>("");
    const [isLoading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
        const fetchEmployees = async () => {
            try {
                setIsLoading(true);
                const response = await fetch(`${PRODUCTION_API_ENDPOINT}/master/employee/all`);
                const data = await response.json();
                setEmployees(data);
                setFilteredEmployees(data);
            } finally {
                setIsLoading(false);
            }
        }

        fetchEmployees();
    }, []);

    const roleOptions = async () => {
      const response = await fetch(`${PRODUCTION_API_ENDPOINT}/master/categories`);
      const data = await response.json();
      return data.data || [];
    };

    const filteredRoles = async (search: string): Promise<Role[]> => {
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

    useEffect(() => {
        const filtered = employees.filter(employee =>
            employee.name.toLowerCase().includes(inputValue.toLowerCase()) ||
            employee.employeeSystemId.toLowerCase().includes(inputValue.toLowerCase()) ||
            employee.phoneNumber.toLowerCase().includes(inputValue.toLowerCase())
        );
        setFilteredEmployees(selectedRole 
            ? filtered.filter(employee => employee.categoryName === selectedRole)
            : filtered
        );
    }, [inputValue, employees, selectedRole]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
                setRoleSearch('');
            }
            if (editDropdownRef.current && !editDropdownRef.current.contains(event.target as Node)) {
                setIsEditDropdownOpen(false);
                setEditRoleSearch('');
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleEditClick = (employee: Employee) => {
        setSelectedEmployee(employee);
        setEditFormData(employee);
        setIsEditModalOpen(true);
    };

    const handleDeleteClick = (employee: Employee) => {
        setSelectedEmployee(employee);
        setIsDeleteModalOpen(true);
    };

    const handleEditSubmit = async () => {
        try {
            const response = await fetch(`${PRODUCTION_API_ENDPOINT}/master/employee/${editFormData.employeeId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editFormData)
            });
            if (response.ok) {
                const updatedEmployee = await response.json();
                setEmployees(employees.map(emp => 
                    emp.employeeId === updatedEmployee.employeeId ? updatedEmployee : emp
                ));
                setFilteredEmployees(filteredEmployees.map(emp => 
                    emp.employeeId === updatedEmployee.employeeId ? updatedEmployee : emp
                ));
                setIsEditModalOpen(false);
                setSelectedEmployee(null);
            }
        } catch (error) {
            console.error('Error updating employee:', error);
        }
    };

    const handleDeleteConfirm = async () => {
        if (selectedEmployee) {
            try {
                const response = await fetch(`${PRODUCTION_API_ENDPOINT}/master/employee/${selectedEmployee.employeeId}`, { method: 'DELETE' });
                if (response.ok) {
                    setEmployees(employees.filter(emp => emp.employeeId !== selectedEmployee.employeeId));
                    setFilteredEmployees(filteredEmployees.filter(emp => emp.employeeId !== selectedEmployee.employeeId));
                    setIsDeleteModalOpen(false);
                    setSelectedEmployee(null);
                }
            } catch (error) {
                console.error('Error deleting employee:', error);
            }
        }
    };

    return (
        <div className="p-4">
            <div className="flex items-center justify-between mb-5">
                <h1 className="text-2xl font-bold tracking-wide">Employee Management</h1>

                <div className="flex items-center space-x-3">
                    <div className="relative">
                        <div className="relative">
                            <input id="employee-name" className="peer w-full bg-transparent text-gray-800 text-sm border border-gray-300 rounded-md px-3 py-1.5 pr-8 focus:outline-none focus:border-blue-500 hover:border-blue-200 focus:shadow" placeholder=" " value={inputValue} onChange={(e) => setInputValue(e.target.value)}/>
                            <label htmlFor="employee-name" className={`absolute pointer-events-none bg-gradient-to-br from-gray-50 to-gray-100 px-1 left-3 text-sm transition-all duration-300 ${inputValue ? "-top-2 text-[13px] text-blue-600" : "top-1.5 peer-placeholder morph text-sm text-gray-400"} peer-focus:-top-2.5 peer-focus:text-[13px] peer-focus:text-blue-600`}>Search</label>
                        </div>
                        <span className="absolute inset-y-0 right-2.5 flex items-center text-gray-400 peer-focus:text-blue-600 peer-placeholder-shown:text-gray-400">
                            <svg width="15" height="15" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-inherit">
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
                        {roles.length > 0 ? (
                            roles.map((role, index) => (
                            <li key={index} className="p-2 hover:bg-blue-100 cursor-pointer text-sm" onClick={() => {
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
                </div>
            </div>
            
            <div className="relative overflow-x-auto custom-scrollbar shadow-xs border border-gray-300 rounded-lg h-[80vh]">
                <table className="w-full text-sm text-center text-gray-500 table-fixed">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                        <tr>
                            <th scope="col" className="w-[16.67%] px-6 py-3">Employee ID</th>
                            <th scope="col" className="w-[16.67%] px-6 py-3">Name</th>
                            <th scope="col" className="w-[16.67%] px-6 py-3">Phone</th>
                            <th scope="col" className="w-[16.67%] px-6 py-3">Designation</th>
                            <th scope="col" className="w-[16.67%] px-6 py-3" colSpan={2}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            Array.from({ length: 8 }).map((_, index) => (
                                <tr key={index} className="odd:bg-white even:bg-gray-50 border-b border-gray-200">
                                    <td className="px-6 py-[25px]">
                                        <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4 mx-auto"></div>
                                    </td>
                                    <td className="px-6 py-[25px]">
                                        <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4 mx-auto"></div>
                                    </td>
                                    <td className="px-6 py-[25px]">
                                        <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4 mx-auto"></div>
                                    </td>
                                    <td className="px-6 py-[25px]">
                                        <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4 mx-auto"></div>
                                    </td>
                                    <td className="px-6 py-[25px]">
                                        <div className="h-4 bg-gray-200 rounded animate-pulse w-6 mx-auto"></div>
                                    </td>
                                    <td className="px-6 py-[25px]">
                                        <div className="h-4 bg-gray-200 rounded animate-pulse w-6 mx-auto"></div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            filteredEmployees.filter((emp) => !emp.employeeSystemId.toLowerCase().startsWith('itg')).map((employee) => (
                                <tr key={employee.employeeId} className="odd:bg-white even:bg-gray-50 border-b border-gray-200">
                                    <td className="px-6 py-4">{employee.employeeSystemId}</td>
                                    <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">{employee.name}</th>
                                    <td className="px-6 py-4">{employee.phoneNumber}</td>
                                    <td className="px-6 py-4">
                                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg border w-32 mx-auto ${employee.categoryName === 'Driver' ? 'border-blue-800 text-[#193cb8] bg-blue-50' : employee.categoryName === 'EMT' ? 'border-violet-800 text-[#5d0ec0] bg-violet-50' : 'border-gray-400 text-gray-700 bg-gray-50'}`}>
                                            {employee.categoryName === 'Driver' && (
                                            <>
                                                <svg xmlns="http://www.w3.org/2000/svg" width={20} height={20} viewBox="0 0 24 24">
                                                <path fill="#193cb8" d="M5 20v-2h1.6l1.975-6.575q.2-.65.738-1.037T10.5 10h3q.65 0 1.188.388t.737 1.037L17.4 18H19v2zm3.7-2h6.6l-1.8-6h-3zM11 8V3h2v5zm5.95 2.475L15.525 9.05l3.55-3.525l1.4 1.4zM18 15v-2h5v2zM7.05 10.475l-3.525-3.55l1.4-1.4l3.55 3.525zM1 15v-2h5v2zm11 3" strokeWidth={0.1} stroke="currentColor"></path>
                                                </svg>
                                                <span className="font-medium text-sm">Driver</span>
                                            </>
                                            )}
                                            {employee.categoryName === 'EMT' && (
                                            <>
                                                <svg xmlns="http://www.w3.org/2000/svg" width={20} height={20} viewBox="0 0 24 24">
                                                <g fill="none" stroke="#5d0ec0" strokeWidth={1.3}>
                                                    <path strokeLinecap="round" d="M2 14c0-3.771 0-5.657 1.172-6.828S6.229 6 10 6h4c3.771 0 5.657 0 6.828 1.172c.654.653.943 1.528 1.07 2.828M22 14c0 3.771 0 5.657-1.172 6.828S17.771 22 14 22h-4c-3.771 0-5.657 0-6.828-1.172c-.654-.653-.943-1.528-1.07-2.828"></path>
                                                    <path d="M16 6c0-1.886 0-2.828-.586-3.414S13.886 2 12 2s-2.828 0-3.414.586S8 4.114 8 6"></path>
                                                    <path strokeLinecap="round" d="M13.5 14h-3m1.5-1.5v3"></path>
                                                    <circle cx={12} cy={14} r={4}></circle>
                                                </g>
                                                </svg>
                                                <span className="font-medium text-sm">EMT</span>
                                            </>
                                            )}
                                            {employee.categoryName !== 'Driver' && employee.categoryName !== 'EMT' && (
                                            <>
                                                <svg xmlns="http://www.w3.org/2000/svg" width={20} height={20} viewBox="0 0 32 32">
                                                <path fill="currentColor" d="M9 11a7 7 0 1 1 14 0a1 1 0 1 0 2 0a9 9 0 1 0-14.385 7.212a9 9 0 0 0 3.558 1.602a2 2 0 1 0 .216-2A7 7 0 0 1 9 11m1 0a6 6 0 1 1 7.913 5.689A3 3 0 0 0 16 16c-.727 0-1.393.259-1.913.689A6 6 0 0 1 10 11m6 11a3 3 0 0 0 2.83-4h5.67a3.5 3.5 0 0 1 3.5 3.5v.5c0 2.393-1.523 4.417-3.685 5.793C22.141 29.177 19.198 30 16 30s-6.14-.823-8.315-2.207C5.523 26.417 4 24.393 4 22v-.5A3.5 3.5 0 0 1 7.5 18h1.359a10 10 0 0 0 4.662 2.69c.54.791 1.45 1.31 2.479 1.31"></path>
                                                </svg>
                                                <span className="font-medium text-sm">{employee.categoryName}</span>
                                            </>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <button className="cursor-pointer mx-auto" title={`Update ${employee.name} record.`} onClick={() => handleEditClick(employee)}>
                                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M11.05 3.00002L4.20829 10.2417C3.94996 10.5167 3.69996 11.0584 3.64996 11.4334L3.34162 14.1334C3.23329 15.1084 3.93329 15.775 4.89996 15.6084L7.58329 15.15C7.95829 15.0834 8.48329 14.8084 8.74162 14.525L15.5833 7.28335C16.7666 6.03335 17.3 4.60835 15.4583 2.86668C13.625 1.14168 12.2333 1.75002 11.05 3.00002Z" stroke="#4F46E5" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
                                                <path d="M9.90845 4.20825C10.2668 6.50825 12.1334 8.26659 14.4501 8.49992" stroke="#4F46E5" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
                                                <path d="M2.5 18.3333H17.5" stroke="#4F46E5" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
                                            </svg>
                                        </button>
                                    </td>
                                    <td className="px-6 py-4">
                                        <button className="cursor-pointer mx-auto" title={`Delete ${employee.name} record.`} onClick={() => handleDeleteClick(employee)}>
                                            <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24">
                                                <path fill="none" stroke="#d50000" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="m18 9l-.84 8.398c-.127 1.273-.19 1.909-.48 2.39a2.5 2.5 0 0 1-1.075.973C15.098 21 14.46 21 13.18 21h-2.36c-1.279 0-1.918 0-2.425-.24a2.5 2.5 0 0 1-1.076-.973c-.288-.48-.352-1.116-.48-2.389L6 9m7.5 6.5v-5m-3 5v-5m-6-4h4.615m0 0l.386-2.672c.112-.486.516-.828.98-.828h3.038c.464 0 .867.342.98.828l.386 2.672m-5.77 0h5.77m0 0H19.5"></path>
                                            </svg>
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Edit Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 backdrop-blur-[3px] flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-2xl border border-gray-300 w-[40vw]">
                        <h2 className="text-xl font-bold mb-6">Update Employee Record</h2>
                        <div className="space-y-4">
                            <div className="relative z-0 w-full mb-5 group">
                                <input type="text" name="employeeId" id="employeeId" value={editFormData.employeeSystemId} onChange={(e) => setEditFormData({ ...editFormData, employeeSystemId: e.target.value })} className="block py-2.5 px-0 w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none focus:outline-none focus:ring-0 focus:border-blue-600 peer" placeholder=" " required />
                                <label htmlFor="employeeId" className="peer-focus:font-medium absolute text-sm text-gray-500 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:start-0 rtl:peer-focus:translate-x-1/4 rtl:peer-focus:left-auto peer-focus:text-blue-600 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6">Employee ID</label>
                            </div>
                            <div className="relative z-0 w-full mb-5 group">
                                <input type="text" name="name" id="name" value={editFormData.name} onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })} className="block py-2.5 px-0 w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none focus:outline-none focus:ring-0 focus:border-blue-600 peer" placeholder=" " required />
                                <label htmlFor="name" className="peer-focus:font-medium absolute text-sm text-gray-500 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:start-0 rtl:peer-focus:translate-x-1/4 rtl:peer-focus:left-auto peer-focus:text-blue-600 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6">Name</label>
                            </div>
                            <div className="relative z-0 w-full mb-4 group">
                                <input type="text" name="phoneNumber" id="phoneNumber" value={editFormData.phoneNumber} onChange={(e) => setEditFormData({ ...editFormData, phoneNumber: e.target.value })} className="block py-2.5 px-0 w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none focus:outline-none focus:ring-0 focus:border-blue-600 peer" placeholder=" " required />
                                <label htmlFor="phoneNumber" className="peer-focus:font-medium absolute text-sm text-gray-500 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:start-0 rtl:peer-focus:translate-x-1/4 rtl:peer-focus:left-auto peer-focus:text-blue-600 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6">Phone Number</label>
                            </div>
                            <div className="relative z-10" ref={editDropdownRef}>
                                <div  className="border-0 border-b-2 border-gray-300 text-gray-900 text-sm w-full cursor-pointer p-1.5 bg-white" onClick={() => setIsEditDropdownOpen(!isEditDropdownOpen)}  tabIndex={0}>
                                    <span className="flex items-center justify-between">
                                        <span className="truncate tracking-wider">{editFormData.categoryName || "Select Category..."}</span>
                                        <span className={isEditDropdownOpen ? "rotate-180" : ""}>
                                            <svg width="12" height="6" viewBox="0 0 14 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path fillRule="evenodd" clipRule="evenodd" d="M6.28935 7.15694L0.632351 1.49994L2.04635 0.085937L6.99635 5.03594L11.9464 0.0859374L13.3604 1.49994L7.70335 7.15694C7.51582 7.34441 7.26152 7.44972 6.99635 7.44972C6.73119 7.44972 6.47688 7.34441 6.28935 7.15694Z" fill="#797979"/>
                                            </svg>
                                        </span>
                                    </span>
                                </div>
                                {isEditDropdownOpen && (
                                    <div className="absolute z-20 bg-white border border-gray-300 rounded-lg shadow mt-1 w-full">
                                        <input type="text" placeholder="Search..." className="w-full p-1.5 border-b border-gray-300 text-sm text-gray-500 outline-none" value={editRoleSearch} onChange={(e) => setEditRoleSearch(e.target.value)}/>
                                        <ul className="overflow-y-auto custom-scrollbar max-h-44">
                                            {roles.filter(role => role.name.toLowerCase().includes(editRoleSearch.toLowerCase())).length > 0 ? (
                                                roles.filter(role => role.name.toLowerCase().includes(editRoleSearch.toLowerCase())).map((role, index) => (
                                                    <li key={index} className="p-2 hover:bg-blue-100 cursor-pointer text-sm" onClick={() => {
                                                            setEditFormData({ ...editFormData, categoryName: role.name });
                                                            setIsEditDropdownOpen(false);
                                                            setEditRoleSearch('');
                                                        }}
                                                    >
                                                        {role.name}
                                                    </li>
                                                ))
                                            ) : (
                                                <li className="p-2 text-gray-500 text-sm">No categories found</li>
                                            )}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="flex justify-end space-x-2 mt-6">
                            <button className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md text-sm text-gray-800 transition cursor-pointer outline-none" onClick={() => setIsEditModalOpen(false)}>Cancel</button>
                            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm transition cursor-pointer outline-none" onClick={handleEditSubmit}>Save</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {isDeleteModalOpen && selectedEmployee && (
                <div className="fixed inset-0 backdrop-blur-[3px] z-50 flex items-center justify-center">
                    <div className="flex flex-col items-center justify-center border border-gray-300 bg-white p-6 rounded-lg shadow-2xl w-[500px]">
                        <h2 className="text-xl font-bold mb-4">Delete Employee Record</h2>
                        <p className="text-sm text-gray-700">Are you sure you want to delete the record for <span className="font-medium">{selectedEmployee.name}</span>?</p>
                        <p className="text-sm text-gray-700 mb-4">This action cannot be undone.</p>
                        <div className="flex justify-center space-x-2 w-full">
                            <button className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md text-sm text-gray-800 transition cursor-pointer outline-none" onClick={() => setIsDeleteModalOpen(false)}>No, Keep It</button>
                            <button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm transition cursor-pointer outline-none" onClick={handleDeleteConfirm}>Yes, Delete It</button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}