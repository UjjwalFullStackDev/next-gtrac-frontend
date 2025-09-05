'use client';

import { Fuel } from "lucide-react";
import Link from "next/link";
import { Fragment } from "react";
import { Tooltip } from "react-tooltip";
import 'react-tooltip/dist/react-tooltip.css';

export default function FuelDetailsMenu () {
    return (
        <Fragment>
            <Link href={'/dashboard/fuel-details'}>
                <div data-tooltip-id="dashboard-tooltip" data-tooltip-content="Fuel Details" data-tooltip-place="top">
                    <Fuel className="text-gray-600 stroke-2"/>
                </div>
            </Link>
            <Tooltip id="dashboard-tooltip" className="custom-tooltip" />
        </Fragment>
    );
}