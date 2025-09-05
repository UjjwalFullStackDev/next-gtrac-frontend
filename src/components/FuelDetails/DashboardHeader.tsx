import React from 'react';

const DashboardHeader: React.FC = () => {
  return (
    <div className="flex-col justify-between gap-6 md:flex-row md:items-center">
        <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">Fuel Details</h1>
      <div className='flex gap-4'>
        <p className="mt-2 text-gray-600">Pending</p>
        <p className="mt-2 text-gray-600">Processing</p>
        <p className="mt-2 text-gray-600">Complete</p>
      </div>
    </div>
  );
};

export default DashboardHeader;