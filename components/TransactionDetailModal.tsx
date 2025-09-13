import React from 'react';
import { Transaction, TransactionCategory } from '../types';
import { CertificateIcon, FundIcon, LoanIcon, ProtectionIcon, SavingsIcon } from './icons';

interface TransactionDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    transactionGroup: Transaction[];
    ratesCache: Record<string, number>;
}

const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({ isOpen, onClose, transactionGroup, ratesCache }) => {
    if (!isOpen || transactionGroup.length === 0) return null;

    const firstTx = transactionGroup[0];
    const rate = ratesCache[firstTx.date] || 0;

    const formatCurrency = (amount: number, currency: 'bs' | 'usd') => {
        return new Intl.NumberFormat('es-VE', {
            style: 'currency',
            currency: currency === 'bs' ? 'VES' : 'USD',
            minimumFractionDigits: 2,
        }).format(amount);
    };

    const totalBs = transactionGroup.reduce((acc, tx) => acc + tx.amountBs, 0);
    const totalUsd = rate > 0 ? totalBs / rate : 0;
    
    const isWithdrawal = transactionGroup.length === 1 && transactionGroup[0].category === TransactionCategory.SAVINGS && transactionGroup[0].amountBs < 0;
    const title = isWithdrawal ? "Detalle de Retiro" : "Detalle de Depósito";

    const getCategoryIcon = (category: TransactionCategory) => {
        switch (category) {
            case TransactionCategory.SAVINGS: return <SavingsIcon className="w-6 h-6 text-green-500" />;
            case TransactionCategory.LOAN: return <LoanIcon className="w-6 h-6 text-red-500" />;
            case TransactionCategory.SOCIAL_PROTECTION: return <ProtectionIcon className="w-6 h-6 text-blue-500" />;
            case TransactionCategory.FUND: return <FundIcon className="w-6 h-6 text-yellow-500" />;
            case TransactionCategory.CONTRIBUTION_CERTIFICATE: return <CertificateIcon className="w-6 h-6 text-purple-500" />;
            default: return null;
        }
    };

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-60 z-[60] flex justify-center items-center p-4 transition-opacity duration-300" 
            onClick={onClose}
            aria-modal="true"
            role="dialog"
        >
            <div 
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg p-6 sm:p-8 transform transition-all" 
                onClick={e => e.stopPropagation()}
                aria-labelledby="detail-modal-title"
            >
                <h2 id="detail-modal-title" className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{title}</h2>
                <div className="border-t border-b border-gray-200 dark:border-gray-700 py-3 my-3 space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Fecha:</span><span className="font-medium">{new Date(firstTx.date + 'T00:00:00').toLocaleDateString('es-VE')}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Referencia:</span><span className="font-medium">{firstTx.reference || 'N/A'}</span></div>
                    {rate > 0 && <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Tasa de Cambio:</span><span className="font-medium">Bs. {rate.toLocaleString('es-VE', { minimumFractionDigits: 2 })} / $</span></div>}
                </div>
                
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">Desglose de la Operación</h3>
                <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                    {transactionGroup.map(tx => {
                        const amountUsd = rate > 0 ? tx.amountBs / rate : 0;
                        return (
                            <div key={tx.id} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                                <div className="flex items-center space-x-3">
                                    {getCategoryIcon(tx.category)}
                                    <div>
                                        <p className="font-semibold text-gray-800 dark:text-gray-100">{tx.category}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{tx.description}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className={`font-bold ${tx.amountBs < 0 ? 'text-red-500' : 'text-green-600 dark:text-green-400'}`}>{formatCurrency(amountUsd, 'usd')}</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-300">{formatCurrency(tx.amountBs, 'bs')}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
                
                 <div className="border-t border-gray-200 dark:border-gray-700 mt-4 pt-4">
                    <div className="flex justify-between font-bold text-xl">
                        <span>Total:</span>
                         <div className="text-right">
                            <span className={`block ${totalBs < 0 ? 'text-red-600' : 'text-blue-600 dark:text-blue-400'}`}>{formatCurrency(totalUsd, 'usd')}</span>
                            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{formatCurrency(totalBs, 'bs')}</span>
                        </div>
                    </div>
                </div>

                <div className="mt-6 flex justify-end">
                    <button onClick={onClose} className="px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TransactionDetailModal;
