import React from 'react';

interface DashboardCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  colorClass: string;
}

const DashboardCard: React.FC<DashboardCardProps> = ({ title, value, subtitle, icon, colorClass }) => {
  return (
    <div 
      className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 flex items-center space-x-6 text-left w-full"
    >
      <div className={`p-4 rounded-full ${colorClass}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
        <p className="text-2xl font-bold text-gray-800 dark:text-white">{value}</p>
        {subtitle && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{subtitle}</p>}
      </div>
    </div>
  );
};

export default DashboardCard;