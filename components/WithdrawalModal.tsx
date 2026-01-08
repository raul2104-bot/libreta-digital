import React, { useState, useEffect } from 'react';
import CurrencyInput from './CurrencyInput';

interface WithdrawalModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (withdrawalData: { amountUsd: number; date: string; rate: number; reference: string; description: string }) => void;
    currentBalance: number;
    initialRate?: number | null;
}

const WithdrawalModal: React.FC<WithdrawalModalProps> = ({ isOpen, onClose, onSave, currentBalance, initialRate }) => {
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [rate, setRate] = useState('');
    const [reference, setReference] = useState('');
    const [description, setDescription] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            setAmount('');
            setDate(new Date().toISOString().split('T')[0]);
            setRate(initialRate ? initialRate.toFixed(2) : '');
            setReference('');
            setDescription('');
            setError('');
        }
    }, [isOpen, initialRate]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        const withdrawalAmount = parseFloat(amount);
        if (isNaN(withdrawalAmount) || withdrawalAmount <= 0) {
            setError('El monto a retirar debe ser un número positivo.');
            return;
        }
        if (withdrawalAmount > currentBalance) {
            setError('No puede retirar un monto mayor a su saldo actual.');
            return;
        }
        const exchangeRate = parseFloat(rate);
        if (isNaN(exchangeRate) || exchangeRate <= 0) {
            setError('La tasa de cambio debe ser un número positivo.');
            return;
        }
        onSave({ amountUsd: withdrawalAmount, date, rate: exchangeRate, reference, description });
    };
    
    const inputClasses = "mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900 dark:text-white";

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4"
            onClick={onClose}
        >
            <div 
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg p-8 transform transition-all"
                onClick={e => e.stopPropagation()}
            >
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Retirar Fondos de Ahorro</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Saldo actual: {currentBalance.toLocaleString('es-VE', { style: 'currency', currency: 'USD' })}</p>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="withdrawalAmount" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Monto a Retirar ($)</label>
                        <CurrencyInput
                            id="withdrawalAmount"
                            value={amount}
                            onChange={setAmount}
                            required
                            placeholder="100,00"
                        />
                    </div>
                     <div>
                        <label htmlFor="withdrawalDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Fecha del Retiro</label>
                        <input
                            type="date"
                            id="withdrawalDate"
                            value={date}
                            onChange={e => setDate(e.target.value)}
                            required
                            className={inputClasses}
                        />
                    </div>
                     <div>
                        <label htmlFor="withdrawalRate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tasa de Cambio (Bs por $)</label>
                        <CurrencyInput
                            id="withdrawalRate"
                            value={rate}
                            onChange={setRate}
                            required
                            placeholder="36,50"
                        />
                    </div>
                    <div>
                        <label htmlFor="withdrawalReference" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Referencia (Opcional)</label>
                        <input
                            type="text"
                            id="withdrawalReference"
                            value={reference}
                            onChange={e => setReference(e.target.value)}
                            className={inputClasses}
                        />
                    </div>
                     <div>
                        <label htmlFor="withdrawalDescription" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Descripción (Opcional)</label>
                        <input
                            type="text"
                            id="withdrawalDescription"
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            className={inputClasses}
                        />
                    </div>

                    {error && <p className="text-red-500 text-sm">{error}</p>}

                    <div className="flex justify-end space-x-4 pt-4">
                        <button type="button" onClick={onClose} className="px-6 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-500 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                            Cancelar
                        </button>
                        <button type="submit" className="inline-flex justify-center py-2 px-6 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                            Confirmar Retiro
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default WithdrawalModal;
