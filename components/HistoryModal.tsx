import React, { useState, useMemo } from 'react';
import { Member, Transaction, TransactionCategory } from '../types';
import TransactionTable from './TransactionTable';
import ShareReceiptModal from './ShareReceiptModal';

interface HistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    transactions: Transaction[];
    ratesCache: Record<string, number>;
    onDeleteTransactionGroup: (transactionGroup: Transaction[]) => void;
    onEditTransaction?: (transactionGroup: Transaction[]) => void;
    member: Member;
}

const HistoryModal: React.FC<HistoryModalProps> = ({ isOpen, onClose, transactions, ratesCache, onDeleteTransactionGroup, onEditTransaction, member }) => {
    const [shareableTxGroupInfo, setShareableTxGroupInfo] = useState<{ transactions: Transaction[], lastProtectionPaymentDisplayAfterTx?: string } | null>(null);

    const groupedTransactions = useMemo(() => {
        const groups: { [key: string]: Transaction[] } = {};
        
        const sorted = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime() || a.id.localeCompare(b.id));

        sorted.forEach(tx => {
            const key = (tx.reference && tx.reference !== '-') ? `${tx.date}-${tx.reference}` : tx.id;
            if (!groups[key]) {
                groups[key] = [];
            }
            groups[key].push(tx);
        });

        return Object.values(groups).sort((a, b) => {
            const dateA = new Date(a[0].date).getTime();
            const dateB = new Date(b[0].date).getTime();
            return dateB - dateA;
        });
    }, [transactions]);

    if (!isOpen) return null;

    const handleShareClick = (group: Transaction[]) => {
        if (group.length > 0) {
            const socialProtectionTxInGroup = group.find(tx => tx.category === TransactionCategory.SOCIAL_PROTECTION);
            let newLastPaidMonthDisplay: string | undefined = undefined;

            if (socialProtectionTxInGroup && member.lastProtectionPaymentDate) {
                const sortedTxs = [...transactions].sort((a, b) => a.id.localeCompare(b.id));
                let monthsPaidSoFar = 0;
                const targetTxId = socialProtectionTxInGroup.id;

                for (const tx of sortedTxs) {
                    if (tx.category === TransactionCategory.SOCIAL_PROTECTION && tx.monthsPaid) {
                        monthsPaidSoFar += tx.monthsPaid;
                    }
                    if (tx.id === targetTxId) break;
                }

                const [initialYear, initialMonth] = member.lastProtectionPaymentDate.split('-').map(Number);
                const lastPaidDate = new Date(initialYear, initialMonth - 1, 1);
                lastPaidDate.setMonth(lastPaidDate.getMonth() + monthsPaidSoFar);
                
                const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
                newLastPaidMonthDisplay = `${monthNames[lastPaidDate.getMonth()]} ${lastPaidDate.getFullYear()}`;
            }
            setShareableTxGroupInfo({ transactions: group, lastProtectionPaymentDisplayAfterTx: newLastPaidMonthDisplay });
        }
    };

    return (
        <>
            <div 
                className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4 transition-opacity duration-300"
                onClick={onClose}
                aria-modal="true"
                role="dialog"
            >
                <div 
                    className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-6xl h-[90vh] flex flex-col p-4 sm:p-6 transform transition-all duration-300"
                    onClick={e => e.stopPropagation()}
                >
                    <div className="flex justify-between items-center mb-4 sm:mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white" id="history-modal-title">Historial de Transacciones</h2>
                        <button 
                            onClick={onClose} 
                            className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                            aria-label="Cerrar"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>
                    <div className="flex-grow overflow-y-auto">
                        <TransactionTable 
                          transactionGroups={groupedTransactions}
                          ratesCache={ratesCache} 
                          onDeleteGroup={onDeleteTransactionGroup}
                          onShareGroup={handleShareClick}
                          onEditGroup={onEditTransaction}
                        />
                    </div>
                </div>
            </div>
            {shareableTxGroupInfo && (
                <ShareReceiptModal
                    isOpen={!!shareableTxGroupInfo}
                    onClose={() => setShareableTxGroupInfo(null)}
                    transactions={shareableTxGroupInfo.transactions}
                    ratesCache={ratesCache}
                    member={member}
                    lastProtectionPaymentDisplayAfterTx={shareableTxGroupInfo.lastProtectionPaymentDisplayAfterTx}
                />
            )}
        </>
    );
};

export default HistoryModal;
