import React from 'react';
import { Member, Transaction, TransactionCategory } from '../types';

interface TransactionReceiptProps {
  transactions: Transaction[] | null;
  ratesCache: Record<string, number>;
  member: Member | null;
}

const TransactionReceipt = React.forwardRef<HTMLDivElement, TransactionReceiptProps>(
  ({ transactions, ratesCache, member }, ref) => {
  
  if (!transactions || transactions.length === 0 || !member) {
    return (
        <div ref={ref} className="bg-white p-6 rounded-lg shadow-md w-[350px] border border-gray-200 font-sans flex justify-center items-center h-[400px]">
            <p className="text-gray-500">No hay transacción para mostrar.</p>
        </div>
    );
  }

  const firstTransaction = transactions[0];
  const rate = ratesCache[firstTransaction.date] || 0;

  const formatCurrency = (amount: number, currency: 'bs' | 'usd') => {
    return new Intl.NumberFormat('es-VE', {
      style: 'currency',
      currency: currency === 'bs' ? 'VES' : 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const totalBs = transactions.reduce((sum, tx) => sum + tx.amountBs, 0);
  const totalUsd = rate > 0 ? totalBs / rate : 0;
  
  const categoryOrder = [
    TransactionCategory.LOAN,
    TransactionCategory.CONTRIBUTION_CERTIFICATE,
    TransactionCategory.SOCIAL_PROTECTION,
    TransactionCategory.FUND,
    TransactionCategory.SAVINGS,
  ];
  
  const sortedTransactions = [...transactions].sort((a, b) => {
      const orderA = categoryOrder.indexOf(a.category);
      const orderB = categoryOrder.indexOf(b.category);
      if(orderA !== -1 && orderB !== -1) return orderA - orderB;
      if(orderA !== -1) return -1;
      if(orderB !== -1) return 1;
      return 0;
  });

  return (
    <div ref={ref} className="bg-white p-6 rounded-lg w-[350px] border border-gray-200 font-sans text-gray-800 relative overflow-hidden">
      <div className="text-center mb-4">
        <h2 className="text-xl font-bold">Comprobante de Depósito</h2>
        <p className="text-sm text-gray-500">Libreta Cooperativa Digital</p>
        <p className="text-xs font-semibold text-gray-600 mt-1">Cooperativa de Servicios Múltiples La Candelaria</p>
      </div>
      <div className="border-t border-b border-gray-200 py-3 my-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Asociado:</span>
          <span className="font-medium">{`${member.firstName} ${member.lastName}`}</span>
        </div>
        <div className="flex justify-between text-sm mt-1">
          <span className="text-gray-600">ID Libreta:</span>
          <span className="font-medium">{member.savingsId}</span>
        </div>
      </div>
      <div className="space-y-1 text-sm mb-3">
        <div className="flex justify-between">
          <span className="text-gray-600">Fecha:</span>
          <span className="font-medium">{new Date(firstTransaction.date + 'T00:00:00').toLocaleDateString('es-VE')}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Referencia:</span>
          <span className="font-medium">{firstTransaction.reference || '-'}</span>
        </div>
         <div className="flex justify-between">
          <span className="text-gray-600">Tasa (Bs por $):</span>
          <span className="font-medium">{rate.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span>
        </div>
      </div>

      <div className="border-t border-dashed border-gray-300 pt-3">
        <h3 className="text-sm font-semibold text-center mb-2">Detalle de Operaciones</h3>
        {sortedTransactions.map((tx) => {
            const amountUsd = rate > 0 ? tx.amountBs / rate : 0;
            return (
                <div key={tx.id} className="text-sm mb-2">
                    <div className="flex justify-between items-center">
                        <span className="text-gray-600 font-medium">{tx.category}:</span>
                         <div className="text-right">
                            <span className="font-medium block">{formatCurrency(amountUsd, 'usd')}</span>
                            <span className="text-xs text-gray-500">{formatCurrency(tx.amountBs, 'bs')}</span>
                        </div>
                    </div>
                    {tx.description && !tx.description.startsWith('Aporte a Fondo') && !tx.description.startsWith('Pago de') && !tx.description.startsWith('Abono a') && (
                      <p className="text-xs text-gray-500 pl-2">- {tx.description}</p>
                    )}
                </div>
            );
        })}
      </div>
      
      <div className="border-t border-dashed border-gray-300 my-4"></div>
      
      <div className="space-y-2">
         <div className="flex justify-between font-bold text-lg">
          <span className="text-gray-800">Total Pagado:</span>
          <div className="text-right">
             <span className="text-blue-600 block">{formatCurrency(totalUsd, 'usd')}</span>
             <span className="text-sm text-gray-500 font-medium">{formatCurrency(totalBs, 'bs')}</span>
          </div>
        </div>
      </div>
      <div className="text-center mt-5">
         <p className="text-xs text-gray-400">Generado el {new Date().toLocaleString('es-VE')}</p>
      </div>
    </div>
  );
});

export default TransactionReceipt;