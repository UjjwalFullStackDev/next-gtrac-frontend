import React from 'react';

interface StatusBadgeProps {
  status: 'audit' | 'ok';
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  if (status === 'audit') {
    return (
      <span className="inline-flex items-center justify-center w-full px-6 py-1 rounded-md text-xs font-medium bg-red-700 text-white cursor-pointer">
        Audit
      </span>
    );
  }
  return (
    <span className="inline-flex items-center justify-center w-full px-3 py-1 rounded-md text-xs font-medium bg-blue-700 text-white cursor-pointer">
      Ok
    </span>
  );
};

export default StatusBadge;
