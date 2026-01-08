
import React, { useState, useMemo, useEffect } from 'react';
import { Member, Transaction, TransactionCategory } from '../types';
import CurrencyInput from './CurrencyInput';
import { CalendarIcon, HashIcon } from './icons';

interface TransactionFormProps {
  member: Member;
  onAddTransactions?: (transactions: Omit<Transaction, 'id' | 'memberId'>[], rate: number) => void;
  certificatePendingAmount: number;
  loanBalanceUsd: number;
  transactionGroupToEdit?: Transaction[] | null;
  onUpdateTransactions?: (oldGroup: Transaction[], newTxs: Omit<Transaction, 'id' | 'memberId'>[], rate: number) => void;
  onCancelEdit?: () => void;
  ratesCache?: Record<string, number>;
  initialRate?: number | null;
}

const TransactionForm: React.FC<TransactionFormProps> = ({ member, onAddTransactions, certificatePendingAmount, loanBalanceUsd, transactionGroupToEdit, onUpdateTransactions, onCancelEdit, ratesCache, initialRate }) => {
  const isEditMode = !!transactionGroupToEdit;
  const [step, setStep] = useState(1);
  
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [rate, setRate] = useState(initialRate && !isEditMode ? initialRate.toFixed(2) : '');
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
    if (isEditMode && transactionGroupToEdit && ratesCache) {
        const firstTx = transactionGroupToEdit[0];
        if (!firstTx) return;

        const rateForTx = ratesCache[firstTx.date] || 0;
        const totalBs = transactionGroupToEdit.reduce((sum, tx) => sum + tx.amountBs, 0);

        const loanTx = transactionGroupToEdit.find(tx => tx.category === TransactionCategory.LOAN);
        const loanPayment = loanTx && rateForTx > 0 ? (loanTx.amountBs / rateForTx) : 0;

        const certTx = transactionGroupToEdit.find(tx => tx.category === TransactionCategory.CONTRIBUTION_CERTIFICATE);
        const certPayment = certTx && rateForTx > 0 ? (certTx.amountBs / rateForTx) : 0;

        const protectionTx = transactionGroupToEdit.find(tx => tx.category === TransactionCategory.SOCIAL_PROTECTION);
        const monthsPaid = protectionTx?.monthsPaid || 0;
        
        const generalDescription = transactionGroupToEdit.find(tx => 
            tx.description && 
            !tx.description.startsWith('Aporte a') &&
            !tx.description.startsWith('Abono a') &&
            !tx.description.startsWith('Pago de')
        )?.description || '';

        setDate(firstTx.date);
        setReference(firstTx.reference || '');
        setRate(rateForTx.toFixed(2));
        setTotalAmountBs(totalBs.toFixed(2));
        setDescription(generalDescription);
        setLoanPaymentUsd(loanPayment > 0 ? loanPayment.toFixed(2) : '');
        setCertificatePaymentUsd(certPayment > 0 ? certPayment.toFixed(2) : '');
        setPayProtection(monthsPaid > 0);
        setProtectionMonths(String(monthsPaid > 0 ? monthsPaid : '1'));
    }
  }, [transactionGroupToEdit, ratesCache, isEditMode]);

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
    const parsedRate = parseFloat(value);
    if (!value || isNaN(parsedRate) || parsedRate <= 0) {
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
    // Solo mostrar error de insuficiencia en el paso 2
    if (savingsUsd < -0.01 && step === 2) {
        const shortfall = Math.abs(savingsUsd);
        error = `El monto depositado es insuficiente. Faltan ${shortfall.toLocaleString('es-VE', {style: 'currency', currency: 'USD'})} para cubrir los pagos.`;
    }

    return {
      totalUsd, loanUsd, protectionFeeUsd, fundFeeUsd,
      certificatePaymentUsd: certificateUsd, savingsUsd, error,
    };
  }, [totalAmountBs, loanPaymentUsd, certificatePaymentUsd, payProtection, protectionMonths, rate, member, step]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // LÓGICA DE NAVEGACIÓN ENTRE PASOS
    if (step === 1) {
        const total = parseFloat(totalAmountBs) || 0;
        const effectiveRate = parseFloat(rate) || 0;
        
        if (total <= 0) {
            setError("Por favor, ingrese un monto total válido.");
            return;
        }
        if (effectiveRate <= 0 || rateError) {
            setError("Por favor, ingrese una tasa de cambio válida.");
            return;
        }

        // Si todo está bien, simplemente avanzamos al paso 2 y detenemos aquí
        setStep(2);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
    }

    // LÓGICA DE GUARDADO (Paso 2)
    if (distribution.error) {
      setError(distribution.error);
      return;
    }

    setIsProcessing(true);
    const effectiveRate = parseFloat(rate) || 0;
    const newTransactions: Omit<Transaction, 'id' | 'memberId'>[] = [];
    const monthsToPay = payProtection ? (parseInt(protectionMonths, 10) || 1) : 0;
    
    if (distribution.savingsUsd > 0.009) {
        newTransactions.push({ 
            date, 
            category: TransactionCategory.SAVINGS, 
            amountBs: distribution.savingsUsd * effectiveRate, 
            description: description || `Aporte a ahorros`, 
            reference 
        });
    }
    
    if (distribution.loanUsd > 0) {
        newTransactions.push({ 
            date, 
            category: TransactionCategory.LOAN, 
            amountBs: distribution.loanUsd * effectiveRate, 
            description: description || 'Abono a préstamo', 
            reference 
        });
    }
    
    if (distribution.certificatePaymentUsd > 0) {
        newTransactions.push({ 
            date, 
            category: TransactionCategory.CONTRIBUTION_CERTIFICATE, 
            amountBs: distribution.certificatePaymentUsd * effectiveRate, 
            description: description || 'Abono a certificado', 
            reference 
        });
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
      newTransactions.push({ 
          date, 
          category: TransactionCategory.FUND, 
          amountBs: distribution.fundFeeUsd * effectiveRate, 
          description: `Aporte a Fondo por ${monthsToPay} mes(es)`, 
          reference, 
          monthsPaid: monthsToPay 
      });
    }
    
    if (newTransactions.length > 0) {
        if (isEditMode) {
            onUpdateTransactions?.(transactionGroupToEdit!, newTransactions, effectiveRate);
        } else {
            onAddTransactions?.(newTransactions, effectiveRate);
        }
    } else {
      setError("No se ha distribuido ningún monto para guardar.");
      setIsProcessing(false);
    }
  };
  
  const handleGoBack = () => {
    setStep(1);
    setError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const inputBaseClasses = "block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900 dark:text-white";
  
  const isStep1Valid = parseFloat(totalAmountBs) > 0 && parseFloat(rate) > 0 && !rateError;

  return (
    <div className="animate-fade-in max-w-2xl mx-auto pb-10">
      {/* Indicador de Progreso */}
      <div className="mb-6 flex items-center justify-between px-2">
        <div className="flex items-center space-x-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${step === 1 ? 'bg-blue-600 text-white' : 'bg-green-500 text-white'}`}>
                {step === 1 ? '1' : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>}
            </div>
            <div className={`h-1 w-10 sm:w-20 rounded ${step === 2 ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-700'}`}></div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${step === 2 ? 'bg-blue-600 text-white' : 'bg-gray-300 dark:bg-gray-700 text-gray-500'}`}>2</div>
        </div>
        <span className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            {step === 1 ? 'Paso 1: Depósito' : 'Paso 2: Distribución'}
        </span>
      </div>

      <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white mb-2 text-center">
        {isEditMode ? 'Editar Operación' : step === 1 ? 'Detalles del Depósito' : 'Distribuir Aporte'}
      </h2>
      <p className="text-center text-sm text-gray-500 dark:text-gray-400 mb-8 px-4">
        {step === 1 
            ? 'Ingrese los datos básicos de su comprobante bancario.' 
            : 'Indique cuánto dinero desea asignar a cada compromiso.'}
      </p>

      <form onSubmit={handleSubmit} className="space-y-6 px-1">
        {step === 1 ? (
          <div className="bg-white dark:bg-gray-800 p-5 sm:p-6 rounded-2xl shadow-lg space-y-6 animate-fade-in border border-gray-100 dark:border-gray-700">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                    <label htmlFor="date" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Fecha de la Operación</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><CalendarIcon className="h-5 w-5 text-gray-400" /></div>
                        <input type="date" id="date" value={date} onChange={e => setDate(e.target.value)} required className={`${inputBaseClasses} pl-10 h-11`} />
                    </div>
                </div>
                <div>
                    <label htmlFor="reference" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Referencia</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><HashIcon className="h-5 w-5 text-gray-400" /></div>
                        <input type="text" id="reference" value={reference} onChange={e => setReference(e.target.value)} placeholder="Ej: 123456" className={`${inputBaseClasses} pl-10 h-11`} />
                    </div>
                </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                    <label htmlFor="totalAmountBs" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Monto Depositado (Bs)</label>
                    <div className="h-11">
                        <CurrencyInput id="totalAmountBs" value={totalAmountBs} onChange={setTotalAmountBs} placeholder="0,00" required />
                    </div>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800/30">
                    <label htmlFor="rate" className="block text-sm font-bold text-blue-800 dark:text-blue-300 mb-1">Tasa de Cambio ($)</label>
                    <div className="h-11">
                        <CurrencyInput id="rate" value={rate} onChange={handleRateChange} placeholder="0,00" required />
                    </div>
                    {rateError && <p className="text-red-500 text-[10px] mt-1 font-medium">{rateError}</p>}
                </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6 animate-fade-in">
            {/* Resumen dinámico del monto */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-5 rounded-2xl shadow-lg flex justify-between items-center">
                <div>
                    <p className="text-xs opacity-80 font-medium uppercase tracking-wider">Total a Distribuir</p>
                    <p className="text-2xl font-black">{distribution.totalUsd.toLocaleString('es-VE', {style: 'currency', currency: 'USD'})}</p>
                </div>
                <div className="bg-white/20 p-2 rounded-lg">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-5 sm:p-6 rounded-2xl shadow-lg space-y-6 border border-gray-100 dark:border-gray-700">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {member.socialProtectionId?.trim() && (
                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Protección Social</label>
                            <div className="flex items-center space-x-3 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-xl border border-gray-100 dark:border-gray-600">
                                <input type="checkbox" id="payProtection" checked={payProtection} onChange={e => setPayProtection(e.target.checked)} className="h-6 w-6 rounded border-gray-300 dark:border-gray-500 text-blue-600 focus:ring-blue-500 bg-transparent transition-all cursor-pointer" />
                                <label htmlFor="payProtection" className="text-sm font-medium text-gray-700 dark:text-gray-300 select-none cursor-pointer">Pagar cuota mes</label>
                            </div>
                            {payProtection && (
                                <div className="mt-3 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl border border-blue-100 dark:border-blue-900/30 animate-fade-in">
                                    <label htmlFor="protectionMonths" className="block text-xs font-bold text-blue-700 dark:text-blue-300 mb-1">¿Cuántos meses?</label>
                                    <input type="number" step="1" min="1" id="protectionMonths" value={protectionMonths} onChange={e => setProtectionMonths(e.target.value)} className={`no-spinners h-10 ${inputBaseClasses}`} />
                                </div>
                            )}
                        </div>
                    )}
                    {loanBalanceUsd > 0.01 && (
                      <div>
                          <label htmlFor="loanPaymentUsd" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Abono a Préstamo ($)</label>
                          <div className="h-11">
                            <CurrencyInput id="loanPaymentUsd" value={loanPaymentUsd} onChange={setLoanPaymentUsd} placeholder="0,00" />
                          </div>
                          <p className="text-[10px] font-medium text-red-500 mt-1.5 flex items-center">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500 mr-1.5"></span>
                              Deuda pendiente: {loanBalanceUsd.toLocaleString('es-VE', {style:'currency', currency:'USD'})}
                          </p>
                      </div>
                    )}
                    {member.contributionCertificateTotal && member.contributionCertificateTotal > 0 && certificatePendingAmount > 0.01 && (
                        <div>
                            <label htmlFor="certificatePaymentUsd" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Certificado ($)</label>
                            <div className="h-11">
                                <CurrencyInput id="certificatePaymentUsd" value={certificatePaymentUsd} onChange={setCertificatePaymentUsd} placeholder="0,00" />
                            </div>
                            {certificateError ? (
                                <p className="text-red-500 text-[10px] mt-1.5 font-bold">{certificateError}</p>
                            ) : (
                                <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 mt-1.5 flex items-center">
                                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mr-1.5"></span>
                                    Pendiente: {certificatePendingAmount.toLocaleString('es-VE', {style:'currency', currency:'USD'})}
                                </p>
                            )}
                        </div>
                    )}
                </div>

                <div className="bg-gray-50 dark:bg-gray-900/40 p-5 rounded-2xl space-y-3 border border-gray-100 dark:border-gray-700/50">
                    <h3 className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest border-b border-gray-200 dark:border-gray-700 pb-2 mb-3">Resumen del Aporte</h3>
                    
                    {payProtection && (
                        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300">
                            <span>Protección + Fondo:</span>
                            <span className="font-bold text-gray-900 dark:text-white">{(distribution.protectionFeeUsd + distribution.fundFeeUsd).toLocaleString('es-VE', {style:'currency', currency:'USD'})}</span>
                        </div>
                    )}
                    {parseFloat(loanPaymentUsd) > 0 && (
                        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300">
                            <span>Abono Préstamo:</span>
                            <span className="font-bold text-gray-900 dark:text-white">{distribution.loanUsd.toLocaleString('es-VE', {style:'currency', currency:'USD'})}</span>
                        </div>
                    )}
                    {parseFloat(certificatePaymentUsd) > 0 && (
                        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300">
                            <span>Abono Certificado:</span>
                            <span className="font-bold text-gray-900 dark:text-white">{distribution.certificatePaymentUsd.toLocaleString('es-VE', {style:'currency', currency:'USD'})}</span>
                        </div>
                    )}
                    
                    <div className="pt-3 mt-2 border-t border-gray-200 dark:border-gray-700 flex justify-between items-end">
                        <div>
                            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wide">Para Ahorros</span>
                            <p className={`text-2xl font-black leading-none mt-1 ${distribution.savingsUsd < -0.01 ? 'text-red-500' : 'text-green-600 dark:text-green-400'}`}>
                                {distribution.savingsUsd.toLocaleString('es-VE', {style:'currency', currency:'USD'})}
                            </p>
                        </div>
                        <div className="text-right">
                            <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium italic">Se sumará a su saldo actual</span>
                        </div>
                    </div>
                </div>

                <div>
                    <label htmlFor="description" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Descripción (Opcional)</label>
                    <input type="text" id="description" value={description} onChange={e => setDescription(e.target.value)} placeholder="Ej: Pago quincenal" className={`h-11 ${inputBaseClasses}`} />
                </div>
            </div>
          </div>
        )}

        {/* Mensajes de Error Generales */}
        {error && (
            <div className="animate-bounce bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded-r-xl flex items-center space-x-3">
                <svg className="w-5 h-5 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                <p className="text-sm font-bold text-red-700 dark:text-red-400">{error}</p>
            </div>
        )}

        {/* Botonera Principal */}
        <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
            {step === 1 ? (
                <>
                    <button 
                        type="button" 
                        onClick={isEditMode ? onCancelEdit : () => { setTotalAmountBs(''); setReference(''); setError(null); }} 
                        className="sm:flex-1 py-3.5 px-6 text-sm font-bold rounded-xl text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition-all active:scale-95"
                    >
                        {isEditMode ? 'Cancelar' : 'Limpiar'}
                    </button>
                    <button 
                        type="submit" 
                        disabled={!isStep1Valid} 
                        className="sm:flex-1 py-3.5 px-6 text-sm font-bold rounded-xl text-white bg-blue-600 hover:bg-blue-700 transition-all disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed shadow-lg shadow-blue-200 dark:shadow-none active:scale-95"
                    >
                        Continuar
                    </button>
                </>
            ) : (
                <>
                    <button 
                        type="button" 
                        onClick={handleGoBack} 
                        className="sm:flex-1 py-3.5 px-6 text-sm font-bold rounded-xl text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-100 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-all active:scale-95"
                    >
                        Regresar
                    </button>
                    <button 
                        type="submit" 
                        disabled={isProcessing || !!distribution.error || !!certificateError} 
                        className="sm:flex-1 py-3.5 px-6 text-sm font-bold rounded-xl text-white bg-green-600 hover:bg-green-700 transition-all disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed shadow-lg shadow-green-200 dark:shadow-none active:scale-95"
                    >
                        {isProcessing ? (
                            <div className="flex items-center justify-center space-x-2">
                                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                <span>Guardando...</span>
                            </div>
                        ) : isEditMode ? 'Guardar Cambios' : 'Finalizar Registro'}
                    </button>
                </>
            )}
        </div>
      </form>
    </div>
  );
};

export default TransactionForm;
