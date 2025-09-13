import React, { useState } from 'react';
import CurrencyInput from './CurrencyInput';

interface NewLoanModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (newLoan: { amount: number; startDate: string; frequency: 'weekly' | 'biweekly' | 'monthly', installment: number }) => void;
}

const NewLoanModal: React.FC<NewLoanModalProps> = ({ isOpen, onClose, onSave }) => {
    const [amount, setAmount] = useState('');
    const [installment, setInstallment] = useState('');
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [frequency, setFrequency] = useState<'weekly' | 'biweekly' | 'monthly'>('monthly');
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        const loanAmount = parseFloat(amount);
        if (isNaN(loanAmount) || loanAmount <= 0) {
            setError('El monto del préstamo debe ser un número positivo.');
            return;
        }
        const installmentAmount = parseFloat(installment);
        if (isNaN(installmentAmount) || installmentAmount <= 0) {
            setError('La cuota del préstamo debe ser un número positivo.');
            return;
        }
        if (!startDate) {
            setError('Por favor, seleccione la fecha de inicio del préstamo.');
            return;
        }
        onSave({ amount: loanAmount, startDate, frequency, installment: installmentAmount });
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
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Registrar Nuevo Préstamo</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="loanAmount" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Monto del Préstamo ($)</label>
                        <CurrencyInput
                            id="loanAmount"
                            value={amount}
                            onChange={setAmount}
                            required
                            placeholder="500,00"
                        />
                    </div>
                    <div>
                        <label htmlFor="loanInstallment" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Cuota del Préstamo ($)</label>
                        <CurrencyInput
                            id="loanInstallment"
                            value={installment}
                            onChange={setInstallment}
                            required
                            placeholder="50,00"
                        />
                    </div>
                    <div>
                        <label htmlFor="loanStartDateModal" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Fecha de Inicio</label>
                        <input
                            type="date"
                            id="loanStartDateModal"
                            value={startDate}
                            onChange={e => setStartDate(e.target.value)}
                            required
                            className={inputClasses}
                        />
                    </div>
                    <div>
                        <label htmlFor="loanFrequencyModal" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Frecuencia de Pago</label>
                        <select
                            id="loanFrequencyModal"
                            value={frequency}
                            onChange={e => setFrequency(e.target.value as any)}
                            className={inputClasses}
                        >
                            <option value="monthly">Mensual</option>
                            <option value="biweekly">Quincenal</option>
                            <option value="weekly">Semanal</option>
                        </select>
                    </div>

                    {error && <p className="text-red-500 text-sm">{error}</p>}

                    <div className="flex justify-end space-x-4 pt-4">
                        <button type="button" onClick={onClose} className="px-6 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-500 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                            Cancelar
                        </button>
                        <button type="submit" className="inline-flex justify-center py-2 px-6 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                            Guardar Préstamo
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default NewLoanModal;
