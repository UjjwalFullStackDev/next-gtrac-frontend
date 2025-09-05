'use client';

import Link from "next/link";
import { Fragment } from "react";
import { Tooltip } from "react-tooltip";
import 'react-tooltip/dist/react-tooltip.css';

export default function LiveAttendance () {
    return (
        <Fragment>
            <Link href={'/dashboard/attendance/live'}>
                <div data-tooltip-id="attendance-tooltip" data-tooltip-content="Live Attendance" data-tooltip-place="top">
                    <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24">
                        <g fill="none" stroke="currentColor" strokeWidth={1}>
                            <path d="M19 1.5H5a3 3 0 0 0-3 3v15a3 3 0 0 0 3 3h14a3 3 0 0 0 3-3v-15a3 3 0 0 0-3-3Z"></path>
                            <path strokeLinejoin="round" d="M19 6.5V20m-2.8-7.5V20M5 15.5V20m2.8-8.5V20m2.8-6v6m2.8-10.5V20"></path>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M7 4h10"></path>
                        </g>
                    </svg>
                </div>
            </Link>
            <Tooltip id="attendance-tooltip" className="custom-tooltip" />
        </Fragment>
    );
}