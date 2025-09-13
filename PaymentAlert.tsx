import React from 'react';

interface PaymentAlertProps {
  message: string;
  type: 'warning' | 'error';
}

const PaymentAlert: React.FC<PaymentAlertProps> = ({ message, type }) => {
  const baseClasses = "rounded-lg p-4 mb-8 flex items-center shadow-md";
  const typeClasses = {
    warning: "bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200 border-l-4 border-yellow-500",
    error: "bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200 border-l-4 border-red-500",
  };
  
  const Icon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  );

  return (
    <div className={`${baseClasses} ${typeClasses[type]}`} role="alert">
      <Icon />
      <span className="font-medium text-sm sm:text-base">{message}</span>
    </div>
  );
};

export default PaymentAlert;
