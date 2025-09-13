import React, { useState, useEffect } from 'react';
import CurrencyInput from './CurrencyInput';

interface AddProtectionIdModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: { id: string; lastProtectionPaymentDate: string; monthlyProtectionFeeUsd: number }) => void;
}

const AddProtectionIdModal: React.FC<AddProtectionIdModalProps> = ({ isOpen, onClose, onSave }) => {
    const [protectionId, setProtectionId] = useState('');
    const [lastProtectionPaymentDate, setLastProtectionPaymentDate] = useState('');
    const [monthlyProtectionFee, setMonthlyProtectionFee] = useState('3.00');
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            // Set default last paid date to the previous month
            const lastMonth = new Date();
            lastMonth.setMonth(lastMonth.getMonth() - 1);
            const year = lastMonth.getFullYear();
            const month = String(lastMonth.getMonth() + 1).padStart(2, '0');
            setLastProtectionPaymentDate(`${year}-${month}`);
            
            // Reset fields
            setProtectionId('');
            setMonthlyProtectionFee('3.00');
            setError('');
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        const trimmedId = protectionId.trim();
        if (!trimmedId) {
            setError('El ID de Protección Social es obligatorio.');
            return;
        }
        if (!lastProtectionPaymentDate) {
            setError('Debe seleccionar el último mes pagado.');
            return;
        }
        
        onSave({ 
            id: trimmedId, 
            lastProtectionPaymentDate,
            monthlyProtectionFeeUsd: parseFloat(monthlyProtectionFee) || 3
        });
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
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Agregar ID de Protección Social</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="protectionId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">ID de Protección Social</label>
                        <input
                            type="text"
                            id="protectionId"
                            value={protectionId}
                            onChange={e => setProtectionId(e.target.value)}
                            maxLength={8}
                            required
                            placeholder="Ingrese su ID alfanumérico de 8 caracteres"
                            className={inputClasses}
                        />
                    </div>
                    
                    <div>
                      <label htmlFor="modalLastProtectionPaymentDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Último Mes Pagado</label>
                      <input 
                        type="month" 
                        id="modalLastProtectionPaymentDate" 
                        value={lastProtectionPaymentDate} 
                        onChange={e => setLastProtectionPaymentDate(e.target.value)} 
                        className={inputClasses} 
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="modalMonthlyProtectionFee" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Cuota de Protección ($)</label>
                      <CurrencyInput 
                          id="modalMonthlyProtectionFee" 
                          value={monthlyProtectionFee} 
                          onChange={setMonthlyProtectionFee} 
                          placeholder="3,00"
                      />
                    </div>


                    {error && <p className="text-red-500 text-sm">{error}</p>}

                    <div className="flex justify-end space-x-4 pt-4">
                        <button type="button" onClick={onClose} className="px-6 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-500 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                            Cancelar
                        </button>
                        <button type="submit" className="inline-flex justify-center py-2 px-6 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                            Guardar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddProtectionIdModal;