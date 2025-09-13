import React, { useState, useMemo, useEffect } from 'react';
import { Member, Transaction, TransactionCategory } from '../types';
import CurrencyInput from './CurrencyInput';

interface TransactionFormProps {
  member: Member;
  onAddTransactions: (transactions: Omit<Transaction, 'id' | 'memberId'>[], rate: number) => void;
  certificatePendingAmount: number;
  initialRate?: number | null;
}

const TransactionForm: React.FC<TransactionFormProps> = ({ member, onAddTransactions, certificatePendingAmount, initialRate }) => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [rate, setRate] = useState(initialRate ? initialRate.toFixed(2) : '');
  const [rateError, setRateError] = useState<string | null>(null);
  const [totalAmountBs, setTotalAmountBs] = useState('');
  const [payProtection, setPayProtection] = useState(false);
  const [protectionMonths, setProtectionMonths] = useState('1');
  const [loanPaymentUsd, setLoanPaymentUsd] = useState('');
  const [certificatePaymentUsd, setCertificatePaymentUsd] = useState('');
  const [description, setDescription] = useState('');
  const [reference, setReference] = useState('');
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [certificateError, setCertificateError] = useState<string | null>(null);

  useEffect(() => {
    const payment = parseFloat(certificatePaymentUsd) || 0;
    if (certificatePendingAmount > 0 && payment > certificatePendingAmount) {
      setCertificateError(`El abono no puede exceder el saldo pendiente de ${certificatePendingAmount.toLocaleString('es-VE', { style: 'currency', currency: 'USD' })}.`);
    } else {
      setCertificateError(null);
    }
  }, [certificatePaymentUsd, certificatePendingAmount]);
  
  const handleRateChange = (value: string) => {
    setRate(value);

    if (!value) {
        setRateError(null);
        return;
    }

    const parsedRate = parseFloat(value);
    if (isNaN(parsedRate) || parsedRate <= 0) {
        setRateError('La tasa debe ser un número positivo.');
    } else {
        setRateError(null);
    }
  };

  const distribution = useMemo(() => {
    const totalBs = parseFloat(totalAmountBs) || 0;
    const effectiveRate = parseFloat(rate) || 0;
    const totalUsd = effectiveRate > 0 ? totalBs / effectiveRate : 0;
    
    const loanUsd = parseFloat(loanPaymentUsd) || 0;
    const certificateUsd = parseFloat(certificatePaymentUsd) || 0;
    const months = payProtection ? (parseInt(protectionMonths, 10) || 1) : 0;
    
    const protectionFeeUsd = (member.monthlyProtectionFeeUsd || 3) * months;
    const fundFeeUsd = (member.fundContributionUsd || 0.5) * months;
    const protectionTotalUsd = protectionFeeUsd + fundFeeUsd;
    
    const totalCostUsd = loanUsd + protectionTotalUsd + certificateUsd;
    const savingsUsd = totalUsd - totalCostUsd;

    let error: string | null = null;
    if (savingsUsd < 0) {
        const shortfall = Math.abs(savingsUsd);
        error = `El monto depositado es insuficiente. Faltan ${shortfall.toLocaleString('es-VE', {style: 'currency', currency: 'USD'})} para cubrir los pagos.`;
    }

    return {
      totalUsd,
      loanUsd,
      protectionFeeUsd,
      fundFeeUsd,
      certificatePaymentUsd: certificateUsd,
      savingsUsd,
      error,
    };

  }, [totalAmountBs, loanPaymentUsd, certificatePaymentUsd, payProtection, protectionMonths, rate, member]);

  const resetForm = () => {
    setDate(new Date().toISOString().split('T')[0]);
    setTotalAmountBs('');
    setPayProtection(false);
    setProtectionMonths('1');
    setLoanPaymentUsd('');
    setCertificatePaymentUsd('');
    setDescription('');
    setReference('');
    // No reseteamos la tasa para que persista
    // setRate('');
    setRateError(null);
    setError(null);
    setCertificateError(null);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    const effectiveRate = parseFloat(rate) || 0;

    if (effectiveRate <= 0) {
        setError("Se requiere una tasa de cambio válida para registrar la transacción.");
        return;
    }
    
    if (distribution.error) {
        setError(distribution.error);
        return;
    }
    
    const total = parseFloat(totalAmountBs) || 0;
    if (total <= 0) {
      setError("El monto total debe ser un número positivo.");
      return;
    }

    setIsProcessing(true);
    const newTransactions: Omit<Transaction, 'id' | 'memberId'>[] = [];
    const monthsToPay = payProtection ? (parseInt(protectionMonths, 10) || 1) : 0;

    if (distribution.savingsUsd > 0) {
      newTransactions.push({ date, category: TransactionCategory.SAVINGS, amountBs: distribution.savingsUsd * effectiveRate, description: description || `Aporte a ahorros`, reference });
    }
    if (distribution.loanUsd > 0) {
       newTransactions.push({ date, category: TransactionCategory.LOAN, amountBs: distribution.loanUsd * effectiveRate, description: description || 'Abono a préstamo', reference });
    }
     if (distribution.certificatePaymentUsd > 0) {
       newTransactions.push({ date, category: TransactionCategory.CONTRIBUTION_CERTIFICATE, amountBs: distribution.certificatePaymentUsd * effectiveRate, description: description || 'Abono a certificado', reference });
    }
    if (monthsToPay > 0 && member.socialProtectionId?.trim()) {
        newTransactions.push({ 
            date, 
            category: TransactionCategory.SOCIAL_PROTECTION, 
            amountBs: distribution.protectionFeeUsd * effectiveRate, 
            description: description || `Pago de ${monthsToPay} mes(es)`, 
            reference, 
            monthsPaid: monthsToPay 
        });
        newTransactions.push({ date, category: TransactionCategory.FUND, amountBs: distribution.fundFeeUsd * effectiveRate, description: `Aporte a Fondo por ${monthsToPay} mes(es)`, reference, monthsPaid: monthsToPay });
    }
    
    if (newTransactions.length > 0) {
        onAddTransactions(newTransactions, effectiveRate);
    } else {
        setError("No se especificó ningún monto o el total es cero.")
    }

    setIsProcessing(false);
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg mb-8">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Registrar Nuevo Depósito</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Fecha del Depósito</label>
                <input type="date" id="date" value={date} onChange={e => setDate(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900 dark:text-white"/>
            </div>
             <div>
                <label htmlFor="reference" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Referencia Bancaria</label>
                <input type="text" id="reference" value={reference} onChange={e => setReference(e.target.value)} placeholder="Ej: 00123456" className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900 dark:text-white"/>
            </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          <div>
              <label htmlFor="totalAmountBs" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Monto Total Depositado (Bs)</label>
              <CurrencyInput id="totalAmountBs" value={totalAmountBs} onChange={setTotalAmountBs} placeholder="2000,00" required />
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <label htmlFor="rate" className="block text-sm font-bold text-blue-800 dark:text-blue-300">Tasa de Cambio (Bs. por $)</label>
            <p className="text-xs text-blue-600 dark:text-blue-400 mb-2">Esencial para la conversión a dólares.</p>
            <CurrencyInput 
                id="rate" 
                value={rate} 
                onChange={handleRateChange} 
                placeholder="36,50" 
                required
            />
            {rateError && <p className="text-red-500 text-xs mt-1">{rateError}</p>}
          </div>
        </div>


        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <div className="flex justify-between items-baseline mb-4">
                <h3 className="text-lg font-medium text-gray-800 dark:text-white">Distribuir Aporte</h3>
                <span className="text-lg font-bold text-blue-600 dark:text-blue-400">Total: {distribution.totalUsd.toLocaleString('es-VE', {style: 'currency', currency: 'USD'})}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {member.socialProtectionId?.trim() && (
                     <div className="space-y-2">
                        <div className="flex items-center space-x-3">
                            <input
                                type="checkbox"
                                id="payProtection"
                                checked={payProtection}
                                onChange={e => setPayProtection(e.target.checked)}
                                className="h-5 w-5 rounded border-gray-300 dark:border-gray-500 text-blue-600 focus:ring-blue-500 bg-transparent"
                            />
                            <label htmlFor="payProtection" className="block text-sm font-medium text-gray-700 dark:text-gray-300 select-none">Pagar Protección Social</label>
                        </div>
                        {payProtection && (
                           <div className="pl-8">
                               <label htmlFor="protectionMonths" className="block text-xs font-medium text-gray-600 dark:text-gray-400">Cantidad de Meses</label>
                               <input
                                   type="number"
                                   step="1"
                                   min="1"
                                   id="protectionMonths"
                                   value={protectionMonths}
                                   onChange={e => setProtectionMonths(e.target.value)}
                                   className="no-spinners mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900 dark:text-white"
                               />
                           </div>
                        )}
                    </div>
                )}
                <div>
                    <label htmlFor="loanPaymentUsd" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Abono a Préstamo ($)</label>
                    <CurrencyInput id="loanPaymentUsd" value={loanPaymentUsd} onChange={setLoanPaymentUsd} placeholder="0,00" />
                </div>
                 {member.contributionCertificateTotal && member.contributionCertificateTotal > 0 && certificatePendingAmount > 0 && (
                    <div>
                        <label htmlFor="certificatePaymentUsd" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Abono a Certificado ($)</label>
                        <CurrencyInput id="certificatePaymentUsd" value={certificatePaymentUsd} onChange={setCertificatePaymentUsd} placeholder="0,00" />
                        {certificateError && <p className="text-red-500 text-xs mt-1">{certificateError}</p>}
                    </div>
                 )}
            </div>

            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg space-y-2 text-sm">
                <h4 className="font-semibold text-gray-800 dark:text-white mb-2">Resumen de Distribución ($):</h4>
                {member.socialProtectionId?.trim() && (
                    <>
                        <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-300">Protección Social:</span>
                            <span className="font-medium text-gray-800 dark:text-white">{distribution.protectionFeeUsd.toLocaleString('es-VE', {style: 'currency', currency: 'USD'})}</span>
                        </div>
                         <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-300">Fondo Especial:</span>
                            <span className="font-medium text-gray-800 dark:text-white">{distribution.fundFeeUsd.toLocaleString('es-VE', {style: 'currency', currency: 'USD'})}</span>
                        </div>
                    </>
                )}
                <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Abono a Préstamo:</span>
                    <span className="font-medium text-gray-800 dark:text-white">{distribution.loanUsd.toLocaleString('es-VE', {style: 'currency', currency: 'USD'})}</span>
                </div>
                {member.contributionCertificateTotal && member.contributionCertificateTotal > 0 && (
                    <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-300">Abono a Certificado:</span>
                        <span className="font-medium text-gray-800 dark:text-white">{distribution.certificatePaymentUsd.toLocaleString('es-VE', {style: 'currency', currency: 'USD'})}</span>
                    </div>
                 )}
                 <div className="border-t border-gray-200 dark:border-gray-600 my-2"></div>
                <div className="flex justify-between font-bold">
                    <span className="text-gray-800 dark:text-white">Restante para Ahorros:</span>
                    <span className={distribution.savingsUsd < 0 ? 'text-red-500' : 'text-green-600'}>{distribution.savingsUsd.toLocaleString('es-VE', {style: 'currency', currency: 'USD'})}</span>
                </div>
            </div>

        </div>

        <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Descripción General (Opcional)</label>
            <input type="text" id="description" value={description} onChange={e => setDescription(e.target.value)} placeholder="Ej: Pago de la primera quincena" className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900 dark:text-white"/>
        </div>

        {(error || distribution.error) && <p className="text-red-500 text-sm mt-2">{error || distribution.error}</p>}

        <div className="flex justify-end space-x-4">
            <button type="button" onClick={resetForm} disabled={isProcessing} className="inline-flex justify-center py-3 px-6 border border-gray-300 dark:border-gray-500 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:bg-gray-200 dark:disabled:bg-gray-600 disabled:cursor-not-allowed">
                Cancelar
            </button>
            <button type="submit" disabled={isProcessing || !!distribution.error || !!rateError || !!certificateError} className="inline-flex justify-center py-3 px-6 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed">
                {isProcessing ? 'Procesando...' : 'Agregar Transacciones'}
            </button>
        </div>
      </form>
    </div>
  );
};

export default TransactionForm;