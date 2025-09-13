import React from 'react';

interface CurrencyInputProps {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  placeholder?: string;
  required?: boolean;
}

const CurrencyInput: React.FC<CurrencyInputProps> = ({
  value,
  onChange,
  id,
  placeholder,
  required,
}) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const digits = inputValue.replace(/\D/g, ''); // Remove all non-digit characters

    if (digits === '') {
      onChange('0.00');
      return;
    }

    const numericValue = parseInt(digits, 10) / 100;
    onChange(numericValue.toFixed(2));
  };
  
  const formatForDisplay = (val: string): string => {
    if (!val || parseFloat(val) === 0) {
      return '';
    }
    // Convert '12.34' to '12,34' for display in es-VE locale
    return parseFloat(val).toLocaleString('es-VE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      useGrouping: false,
    });
  };

  return (
    <input
      type="text"
      inputMode="numeric"
      id={id}
      value={formatForDisplay(value)}
      onChange={handleInputChange}
      placeholder={placeholder || '0,00'}
      required={required}
      className="no-spinners mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900 dark:text-white"
    />
  );
};

export default CurrencyInput;