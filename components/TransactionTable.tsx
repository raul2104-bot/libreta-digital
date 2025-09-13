import React from 'react';
import { Transaction, TransactionCategory } from '../types';
import { CertificateIcon, FundIcon, LoanIcon, ProtectionIcon, SavingsIcon, ShareIcon, TrashIcon } from './icons';

interface TransactionTableProps {
  transactions: Transaction[];
  ratesCache: Record<string, number>;
  onDelete?: (transactionId: string) => void;
  onRowClick?: (transaction: Transaction) => void;
  onShare?: (transaction: Transaction) => void;
}

const TransactionTable: React.FC<TransactionTableProps> = ({ transactions, ratesCache, onDelete, onRowClick, onShare }) => {
  const formatCurrency = (amount: number, currency: 'bs' | 'usd') => {
    return new Intl.NumberFormat('es-VE', {
      style: 'currency',
      currency: currency === 'bs' ? 'VES' : 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };
  
  const sortedTransactions = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const renderCategoryWithIcon = (category: TransactionCategory) => {
    switch (category) {
      case TransactionCategory.SAVINGS:
        return (
          <div className="flex items-center space-x-2">
            <SavingsIcon className="w-5 h-5 text-green-500" />
            <span className="text-gray-900 dark:text-gray-100">{category}</span>
          </div>
        );
      case TransactionCategory.LOAN:
        return (
          <div className="flex items-center space-x-2">
            <LoanIcon className="w-5 h-5 text-red-500" />
            <span className="text-gray-900 dark:text-gray-100">{category}</span>
          </div>
        );
      case TransactionCategory.SOCIAL_PROTECTION:
        return (
          <div className="flex items-center space-x-2">
            <ProtectionIcon className="w-5 h-5 text-blue-500" />
            <span className="text-gray-900 dark:text-gray-100">{category}</span>
          </div>
        );
      case TransactionCategory.FUND:
        return (
          <div className="flex items-center space-x-2">
            <FundIcon className="w-5 h-5 text-yellow-500" />
            <span className="text-gray-900 dark:text-gray-100">{category}</span>
          </div>
        );
       case TransactionCategory.CONTRIBUTION_CERTIFICATE:
        return (
          <div className="flex items-center space-x-2">
            <CertificateIcon className="w-5 h-5 text-purple-500" />
            <span className="text-gray-900 dark:text-gray-100">{category}</span>
          </div>
        );
      default:
        return <span className="text-gray-900 dark:text-gray-100">{category}</span>;
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 lg:p-8 rounded-2xl shadow-lg">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Historial de Transacciones</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Fecha</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Categoría</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Descripción</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Referencia</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Monto (Bs)</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Monto ($)</th>
              {(onDelete || onShare) && <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Acciones</th>}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {sortedTransactions.length > 0 ? (
                sortedTransactions.map(tx => {
                  const rate = ratesCache[tx.date];
                  const amountUsd = rate && rate > 0 ? tx.amountBs / rate : 0;
                  const isWithdrawal = tx.category === TransactionCategory.SAVINGS && tx.amountBs < 0;
                  
                  return (
                    <tr 
                      key={tx.id} 
                      className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
                      onClick={() => onRowClick?.(tx)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{new Date(tx.date + 'T00:00:00').toLocaleDateString('es-VE')}</td>
                      <td className="px-6 py-4 text-sm">
                        {renderCategoryWithIcon(tx.category)}
                        {(tx.category === TransactionCategory.SOCIAL_PROTECTION || tx.category === TransactionCategory.FUND) && tx.monthsPaid && tx.monthsPaid > 0 && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                            ({tx.monthsPaid} {tx.monthsPaid === 1 ? 'mes' : 'meses'})
                        </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{tx.description || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{tx.reference || '-'}</td>
                      <td className={`px-6 py-4 whitespace-nowrap text-right text-sm ${isWithdrawal ? 'text-red-500' : 'text-gray-900 dark:text-gray-100'}`}>{formatCurrency(tx.amountBs, 'bs')}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold">
                        {rate && rate > 0 
                          ? <span className={isWithdrawal ? 'text-red-500' : 'text-green-600 dark:text-green-400'}>{formatCurrency(amountUsd, 'usd')}</span>
                          : <span className="text-gray-500 dark:text-gray-400">-</span>
                        }
                      </td>
                      {(onDelete || onShare) && (
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end space-x-1">
                                {tx.reference && onShare && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onShare(tx);
                                        }}
                                        className="p-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-500 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                                        aria-label={`Compartir comprobante de la transacción ${tx.id}`}
                                    >
                                        <ShareIcon className="w-5 h-5" />
                                    </button>
                                )}
                                {onDelete && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onDelete(tx.id);
                                        }}
                                        className="p-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-500 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
                                        aria-label={`Eliminar transacción ${tx.id}`}
                                    >
                                        <TrashIcon className="w-5 h-5" />
                                    </button>
                                )}
                            </div>
                        </td>
                      )}
                    </tr>
                  );
                })
            ) : (
                <tr>
                    <td colSpan={onDelete || onShare ? 7 : 6} className="px-6 py-12 text-center text-sm text-gray-500 dark:text-gray-400">
                        No hay transacciones registradas.
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TransactionTable;
