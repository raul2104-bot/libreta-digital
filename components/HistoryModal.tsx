import React, { useState } from 'react';
import { Transaction } from '../types';
import TransactionTable from './TransactionTable';
import TransactionDetailModal from './TransactionDetailModal';

interface HistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    transactions: Transaction[];
    ratesCache: Record<string, number>;
    onDeleteTransaction: (transactionId: string) => void;
}

const HistoryModal: React.FC<HistoryModalProps> = ({ isOpen, onClose, transactions, ratesCache, onDeleteTransaction }) => {
    const [selectedTxGroup, setSelectedTxGroup] = useState<Transaction[] | null>(null);

    if (!isOpen) return null;

    const handleRowClick = (clickedTx: Transaction) => {
      let txGroup: Transaction[];
      // If a transaction has a reference, group all transactions with the same date and reference.
      // Otherwise (e.g., withdrawals), treat it as a single-transaction group.
      if (clickedTx.reference) {
          txGroup = transactions.filter(tx => tx.date === clickedTx.date && tx.reference === clickedTx.reference);
      } else {
          txGroup = [clickedTx];
      }
      setSelectedTxGroup(txGroup.length > 0 ? txGroup : [clickedTx]);
    };

    const handleCloseDetailModal = () => {
        setSelectedTxGroup(null);
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
                          transactions={transactions} 
                          ratesCache={ratesCache} 
                          onDelete={onDeleteTransaction}
                          onRowClick={handleRowClick}
                        />
                    </div>
                </div>
            </div>
            {selectedTxGroup && (
                <TransactionDetailModal
                    isOpen={!!selectedTxGroup}
                    onClose={handleCloseDetailModal}
                    transactionGroup={selectedTxGroup}
                    ratesCache={ratesCache}
                />
            )}
        </>
    );
};

export default HistoryModal;
