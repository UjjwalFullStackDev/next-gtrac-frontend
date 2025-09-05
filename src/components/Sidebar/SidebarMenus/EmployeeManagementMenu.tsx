'use client';

import Link from "next/link";
import { Fragment } from "react";
import { Tooltip } from "react-tooltip";
import 'react-tooltip/dist/react-tooltip.css';

export default function EmployeeManagementMenu () {
    return (
       <Fragment>
            <Link href={'/dashboard/employees'}>
                <div data-tooltip-id="attendance-tooltip" data-tooltip-content="Employees Management" data-tooltip-place="top">
                    <svg xmlns="http://www.w3.org/2000/svg" width={26} height={26} viewBox="0 0 24 24">
                        <g fill="none" stroke="#1E293B" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}>
                            <path d="M17.931 23.25H6.069l-1.542-6.969a1.14 1.14 0 0 1 .166-.885a.88.88 0 0 1 .72-.4h13.174a.88.88 0 0 1 .72.4a1.14 1.14 0 0 1 .166.885zm-17.181 0h22.5"></path>
                            <path d="M10.5 18.75a1.5 1.5 0 1 0 3 0a1.5 1.5 0 0 0-3 0M8.445 2.78a6.85 6.85 0 0 0 4.93 2.095c.933 0 1.856-.19 2.713-.558"></path>
                            <path d="M7.875 4.875a4.125 4.125 0 1 0 8.25 0a4.125 4.125 0 0 0-8.25 0M17 12.75a6.675 6.675 0 0 0-10 0"></path>
                        </g>
                    </svg>
                </div>
            </Link>
            <Tooltip id="attendance-tooltip" className="custom-tooltip" />
        </Fragment>
    );
}