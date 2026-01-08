
import React, { useState } from 'react';
import { Transaction, TransactionCategory } from '../types';
import { CertificateIcon, ChevronDownIcon, FundIcon, LoanIcon, PencilIcon, ProtectionIcon, SavingsIcon, ShareIcon, TrashIcon } from './icons';

interface TransactionTableProps {
  transactionGroups: Transaction[][];
  ratesCache: Record<string, number>;
  onDeleteGroup?: (group: Transaction[]) => void;
  onShareGroup?: (group: Transaction[]) => void;
  onEditGroup?: (group: Transaction[]) => void;
}

const getCategoryIcon = (category: TransactionCategory, className: string = "w-5 h-5") => {
    switch (category) {
      case TransactionCategory.SAVINGS: return <SavingsIcon className={`${className} text-green-500`} />;
      case TransactionCategory.LOAN: return <LoanIcon className={`${className} text-red-500`} />;
      case TransactionCategory.SOCIAL_PROTECTION: return <ProtectionIcon className={`${className} text-blue-500`} />;
      case TransactionCategory.FUND: return <FundIcon className={`${className} text-yellow-500`} />;
      case TransactionCategory.CONTRIBUTION_CERTIFICATE: return <CertificateIcon className={`${className} text-purple-500`} />;
      default: return null;
    }
};

const TransactionTable: React.FC<TransactionTableProps> = ({ transactionGroups, ratesCache, onDeleteGroup, onShareGroup, onEditGroup }) => {
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  const formatCurrency = (amount: number, currency: 'bs' | 'usd') => {
    return new Intl.NumberFormat('es-VE', {
      style: 'currency',
      currency: currency === 'bs' ? 'VES' : 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 lg:p-8 rounded-2xl shadow-lg">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Historial de Transacciones</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Fecha</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Categorías</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Descripción</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Referencia</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Monto Total</th>
              {(onDeleteGroup || onShareGroup || onEditGroup) && <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Acciones</th>}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {transactionGroups.length > 0 ? (
                transactionGroups.map(group => {
                  const firstTx = group[0];
                  const groupKey = (firstTx.reference && firstTx.reference !== '-') ? `${firstTx.date}-${firstTx.reference}` : firstTx.id;
                  const isExpanded = expandedKey === groupKey;

                  const totalBs = group.reduce((sum, tx) => sum + tx.amountBs, 0);
                  const rate = ratesCache[firstTx.date];
                  const totalUsd = rate && rate > 0 ? totalBs / rate : 0;
                  const isWithdrawal = group.length === 1 && firstTx.category === TransactionCategory.SAVINGS && firstTx.amountBs < 0;
                  // FIX: Use a robust method to get unique categories to avoid type inference issues with `Set`.
                  const categories = group
                    .map(tx => tx.category)
                    .filter((value, index, self) => self.indexOf(value) === index);
                  const description = isWithdrawal ? firstTx.description : group.length > 1 ? `Operación Múltiple (${categories.length})` : firstTx.description;
                  
                  return (
                    <React.Fragment key={groupKey}>
                      <tr 
                        onClick={() => setExpandedKey(isExpanded ? null : groupKey)}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                            <div className="flex items-center space-x-2">
                                <span>{new Date(firstTx.date + 'T00:00:00').toLocaleDateString('es-VE')}</span>
                                <ChevronDownIcon className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                            </div>
                        </td>
                        <td className="px-6 py-4 text-sm">
                            <div className="flex items-center space-x-1.5">
                                {categories.map(cat => <div key={cat} title={cat}>{getCategoryIcon(cat, "w-5 h-5")}</div>)}
                            </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{description || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{firstTx.reference || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                            <div className={`font-semibold ${isWithdrawal ? 'text-red-500' : 'text-green-600 dark:text-green-400'}`}>{formatCurrency(totalUsd, 'usd')}</div>
                            <div className={`text-xs ${isWithdrawal ? 'text-red-400' : 'text-gray-500 dark:text-gray-400'}`}>{formatCurrency(totalBs, 'bs')}</div>
                        </td>
                        {(onDeleteGroup || onShareGroup || onEditGroup) && (
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex items-center justify-end space-x-1">
                                  {onEditGroup && (
                                       <button onClick={(e) => { e.stopPropagation(); onEditGroup(group); }} className="p-2 text-gray-500 hover:text-blue-700 dark:text-gray-400 dark:hover:text-blue-400 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/50" aria-label="Editar operación"><PencilIcon className="w-5 h-5" /></button>
                                  )}
                                  {onShareGroup && (
                                      <button onClick={(e) => { e.stopPropagation(); onShareGroup(group); }} className="p-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-500 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/50" aria-label="Compartir comprobante"><ShareIcon className="w-5 h-5" /></button>
                                  )}
                                  {onDeleteGroup && (
                                      <button onClick={(e) => { e.stopPropagation(); onDeleteGroup(group); }} className="p-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-500 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50" aria-label="Eliminar operación"><TrashIcon className="w-5 h-5" /></button>
                                  )}
                              </div>
                          </td>
                        )}
                      </tr>
                      {isExpanded && (
                          <tr className="bg-gray-50 dark:bg-gray-900/50">
                              <td colSpan={(onDeleteGroup || onShareGroup || onEditGroup) ? 6 : 5} className="p-0">
                                  <div className="p-4 mx-4 my-2 border-l-4 border-blue-500">
                                      <h4 className="font-semibold text-gray-700 dark:text-gray-200 mb-2">Detalles de la Operación:</h4>
                                      <table className="min-w-full">
                                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                          {group.map(tx => {
                                            const amountUsd = rate && rate > 0 ? tx.amountBs / rate : 0;
                                            return (
                                              <tr key={tx.id}>
                                                <td className="py-2 pr-4">
                                                    <div className="flex items-center space-x-2 text-sm">
                                                        {getCategoryIcon(tx.category, "w-5 h-5 shrink-0")}
                                                        <div>
                                                            <span className="font-medium text-gray-800 dark:text-gray-100">{tx.category}</span>
                                                            {tx.monthsPaid && <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">({tx.monthsPaid} {tx.monthsPaid === 1 ? 'mes' : 'meses'})</span>}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-2 pr-4 text-sm text-gray-600 dark:text-gray-300">{tx.description}</td>
                                                <td className="py-2 pr-4 text-right text-sm text-gray-800 dark:text-gray-100">{formatCurrency(tx.amountBs, 'bs')}</td>
                                                <td className="py-2 text-right text-sm font-semibold text-gray-900 dark:text-white">{formatCurrency(amountUsd, 'usd')}</td>
                                              </tr>
                                            );
                                          })}
                                        </tbody>
                                      </table>
                                  </div>
                              </td>
                          </tr>
                      )}
                    </React.Fragment>
                  );
                })
            ) : (
                <tr>
                    <td colSpan={(onDeleteGroup || onShareGroup || onEditGroup) ? 6 : 5} className="px-6 py-12 text-center text-sm text-gray-500 dark:text-gray-400">
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
