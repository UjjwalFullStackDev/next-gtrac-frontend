'use client';

import Link from "next/link";
import { Fragment } from "react";
import { Tooltip } from "react-tooltip";
import 'react-tooltip/dist/react-tooltip.css';

export default function DashboardMenu () {
    return (
        <Fragment>
            <Link href={'/dashboard'}>
                <div data-tooltip-id="dashboard-tooltip" data-tooltip-content="Dashboard" data-tooltip-place="top">
                    <svg className="cursor-pointer" width="23" height="23" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M33 16.35V6.15C33 3.9 32.04 3 29.655 3H23.595C21.21 3 20.25 3.9 20.25 6.15V16.35C20.25 18.6 21.21 19.5 23.595 19.5H29.655C32.04 19.5 33 18.6 33 16.35Z" stroke="#1E293B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M33 29.85V27.15C33 24.9 32.04 24 29.655 24H23.595C21.21 24 20.25 24.9 20.25 27.15V29.85C20.25 32.1 21.21 33 23.595 33H29.655C32.04 33 33 32.1 33 29.85Z" stroke="#1E293B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M15.75 19.65V29.85C15.75 32.1 14.79 33 12.405 33H6.345C3.96 33 3 32.1 3 29.85V19.65C3 17.4 3.96 16.5 6.345 16.5H12.405C14.79 16.5 15.75 17.4 15.75 19.65Z" stroke="#1E293B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M15.75 6.15V8.85C15.75 11.1 14.79 12 12.405 12H6.345C3.96 12 3 11.1 3 8.85V6.15C3 3.9 3.96 3 6.345 3H12.405C14.79 3 15.75 3.9 15.75 6.15Z" stroke="#1E293B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                </div>
            </Link>
            <Tooltip id="dashboard-tooltip" className="custom-tooltip" />
        </Fragment>
    );
}