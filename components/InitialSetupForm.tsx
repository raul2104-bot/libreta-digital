import React, { useState, useEffect } from 'react';
import { Member } from '../types';
import CurrencyInput from './CurrencyInput';

interface InitialSetupFormProps {
  member: Member;
  onComplete: (setupData: Partial<Member>) => void;
  onBack: () => void;
  isEditing?: boolean;
}

const InitialSetupForm: React.FC<InitialSetupFormProps> = ({ member, onComplete, onBack, isEditing = false }) => {
  const [initialSavings, setInitialSavings] = useState('0');
  const [initialLoan, setInitialLoan] = useState('0');
  const [loanStartDate, setLoanStartDate] = useState('');
  const [loanFrequency, setLoanFrequency] = useState<'weekly' | 'biweekly' | 'monthly'>('monthly');
  const [loanInstallment, setLoanInstallment] = useState('0');
  
  const [lastProtectionPaymentDate, setLastProtectionPaymentDate] = useState('');
  const [monthlyProtectionFee, setMonthlyProtectionFee] = useState('3.00');
  const [fundContribution, setFundContribution] = useState('0.50');
  const [contributionCertificate, setContributionCertificate] = useState('10.00');


  useEffect(() => {
    if (isEditing) {
      setInitialSavings(member.initialSavingsUsd?.toFixed(2) || '0.00');
      setInitialLoan(member.initialLoanUsd?.toFixed(2) || '0.00');
      setLoanStartDate(member.loanStartDate || '');
      setLoanFrequency(member.loanPaymentFrequency || 'monthly');
      setLoanInstallment(member.loanInstallmentUsd?.toFixed(2) || '0.00');
      setLastProtectionPaymentDate(member.lastProtectionPaymentDate || '');
      setMonthlyProtectionFee(member.monthlyProtectionFeeUsd?.toFixed(2) || '3.00');
      setFundContribution(member.fundContributionUsd?.toFixed(2) || '0.50');
      setContributionCertificate(member.contributionCertificateTotal?.toFixed(2) || '10.00');
    } else {
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        const year = lastMonth.getFullYear();
        const month = String(lastMonth.getMonth() + 1).padStart(2, '0');
        setLastProtectionPaymentDate(`${year}-${month}`);
        setFundContribution(member.fundContributionUsd?.toFixed(2) || '0.50');
    }
  }, [isEditing, member]);


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const setupData: Partial<Member> = {
      initialSavingsUsd: parseFloat(initialSavings) || 0,
      initialLoanUsd: parseFloat(initialLoan) || 0,
      loanStartDate: parseFloat(initialLoan) > 0 ? loanStartDate : undefined,
      loanPaymentFrequency: parseFloat(initialLoan) > 0 ? loanFrequency : undefined,
      loanInstallmentUsd: parseFloat(initialLoan) > 0 ? (parseFloat(loanInstallment) || 0) : undefined,
      lastProtectionPaymentDate: member.socialProtectionId ? lastProtectionPaymentDate : undefined,
      monthlyProtectionFeeUsd: member.socialProtectionId ? (parseFloat(monthlyProtectionFee) || 3) : undefined,
      fundContributionUsd: member.socialProtectionId ? (parseFloat(fundContribution) || 0.5) : undefined,
      contributionCertificateTotal: parseFloat(contributionCertificate) || 0,
    };
    
    onComplete(setupData);
  };
  
  const inputClasses = "mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900 dark:text-white";

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-lg">
        <div className="bg-white dark:bg-gray-800 shadow-2xl rounded-2xl p-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-2">{isEditing ? 'Editar Saldos Iniciales' : 'Configuración Inicial'}</h1>
          <p className="text-gray-500 dark:text-gray-400 mb-6 text-center">{isEditing ? 'Ajuste los saldos y detalles del préstamo según sea necesario.' : 'Ingrese sus saldos actuales para comenzar.'}</p>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="initialSavings" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Saldo Inicial de Ahorros ($)</label>
              <CurrencyInput id="initialSavings" value={initialSavings} onChange={setInitialSavings} />
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <label htmlFor="initialLoan" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Saldo Deudor Préstamo ($)</label>
              <CurrencyInput id="initialLoan" value={initialLoan} onChange={setInitialLoan} />
            </div>

            {parseFloat(initialLoan) > 0 && (
                <div className="space-y-4 pl-4 border-l-2 border-blue-500">
                    <div>
                        <label htmlFor="loanStartDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Fecha de Inicio del Préstamo</label>
                        <input type="date" id="loanStartDate" value={loanStartDate} onChange={e => setLoanStartDate(e.target.value)} required className={inputClasses} />
                    </div>
                    <div>
                        <label htmlFor="loanFrequency" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Frecuencia de Pago</label>
                        <select id="loanFrequency" value={loanFrequency} onChange={e => setLoanFrequency(e.target.value as any)} className={inputClasses}>
                            <option value="weekly">Semanal</option>
                            <option value="biweekly">Quincenal</option>
                            <option value="monthly">Mensual</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="loanInstallment" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Monto de la Cuota ($)</label>
                        <CurrencyInput 
                            id="loanInstallment" 
                            value={loanInstallment} 
                            onChange={setLoanInstallment} 
                            required 
                            placeholder="50,00"
                        />
                    </div>
                </div>
            )}

            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-2">Certificado de Aportación</h3>
                 <div>
                    <label htmlFor="contributionCertificate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Valor del Certificado de Aportación ($)</label>
                    <CurrencyInput 
                        id="contributionCertificate" 
                        value={contributionCertificate} 
                        onChange={setContributionCertificate} 
                        placeholder="10,00"
                    />
                </div>
            </div>
            
            {member.socialProtectionId && (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                  <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-2">Configuración de Protección Social</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Indique el último mes que fue cancelado para llevar un registro correcto.</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                          <label htmlFor="lastProtectionPaymentDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Último Mes Pagado</label>
                          <input 
                            type="month" 
                            id="lastProtectionPaymentDate" 
                            value={lastProtectionPaymentDate} 
                            onChange={e => setLastProtectionPaymentDate(e.target.value)} 
                            className={inputClasses} 
                          />
                      </div>
                      <div>
                          <label htmlFor="monthlyProtectionFee" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Cuota de Protección ($)</label>
                          <CurrencyInput 
                              id="monthlyProtectionFee" 
                              value={monthlyProtectionFee} 
                              onChange={setMonthlyProtectionFee} 
                              placeholder="3,00"
                          />
                      </div>
                      <div className="md:col-span-2">
                          <label htmlFor="fundContribution" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Aporte a Fondo Especial ($)</label>
                          <CurrencyInput 
                              id="fundContribution" 
                              value={fundContribution} 
                              onChange={setFundContribution} 
                              placeholder="0,50"
                          />
                      </div>
                  </div>
              </div>
            )}


            <div className="flex justify-between items-center pt-4">
              <button type="button" onClick={onBack} className="px-6 py-3 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-500 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                {isEditing ? 'Cancelar' : 'Regresar'}
              </button>
              <button type="submit" className="inline-flex justify-center py-3 px-6 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed">
                {isEditing ? 'Guardar Cambios' : 'Guardar y Continuar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default InitialSetupForm;