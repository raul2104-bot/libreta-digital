import React, { useState, useMemo, useEffect } from 'react';
import { Member, Transaction, TransactionCategory } from './types';
import TransactionForm from './components/TransactionForm';
import DashboardCard from './components/DashboardCard';
import RegistrationForm from './components/RegistrationForm';
import { SavingsIcon, LoanIcon, ProtectionIcon, LogoutIcon, PlusCircleIcon, CsvIcon, WithdrawIcon, HistoryIcon, PencilIcon, ProtectionPlusIcon, CertificateIcon, CertificateCheckIcon } from './components/icons';
import PaymentAlert from './components/PaymentAlert';
import InitialSetupForm from './components/InitialSetupForm';
import NewLoanModal from './components/NewLoanModal';
import { LoginForm } from './components/LoginForm';
import WithdrawalModal from './components/WithdrawalModal';
import HistoryModal from './components/HistoryModal';
import AddProtectionIdModal from './components/AddProtectionIdModal';
import TransactionResult from './components/TransactionResult';
import EmailCsvModal from './components/EmailCsvModal';

const App: React.FC = () => {
  const [allMembers, setAllMembers] = useState<Member[]>([]);
  const [currentMember, setCurrentMember] = useState<Member | null>(null);
  const [authView, setAuthView] = useState<'login' | 'register'>('login');
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [ratesCache, setRatesCache] = useState<Record<string, number>>({});
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isNewLoanModalOpen, setIsNewLoanModalOpen] = useState(false);
  const [isAddProtectionIdModalOpen, setIsAddProtectionIdModalOpen] = useState(false);
  const [isWithdrawalModalOpen, setIsWithdrawalModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isEmailCsvModalOpen, setIsEmailCsvModalOpen] = useState(false);
  const [isEditingSetup, setIsEditingSetup] = useState(false);
  const [lastAddedGroup, setLastAddedGroup] = useState<Transaction[] | null>(null);
  const [lastUsedRate, setLastUsedRate] = useState<number | null>(null);


  // Load data from localStorage on initial render
  useEffect(() => {
    try {
      const savedMembers = localStorage.getItem('coopMembersList');
      const members: Member[] = savedMembers ? JSON.parse(savedMembers) : [];
      setAllMembers(members);

      if (members.length === 0) {
          setAuthView('register'); // If no members, force registration
      }

      const currentMemberIdStr = localStorage.getItem('currentCoopMemberId');
      if (currentMemberIdStr) {
          const currentMemberId = parseInt(currentMemberIdStr, 10);
          const member = members.find(m => m.id === currentMemberId);
          if (member) {
              setCurrentMember(member);
              const savedTransactions = localStorage.getItem(`coopTransactions_${member.id}`);
              setTransactions(savedTransactions ? JSON.parse(savedTransactions) : []);
          }
      }
      
      const savedRates = localStorage.getItem('coopRatesCache');
      if (savedRates) setRatesCache(JSON.parse(savedRates));
      
      const savedLastRate = localStorage.getItem('coopLastUsedRate');
      if (savedLastRate) setLastUsedRate(parseFloat(savedLastRate));

    } catch (error) {
        console.error("Failed to parse data from localStorage", error);
        localStorage.clear();
    }
  }, []);

  // Persist transaction and rates data
  useEffect(() => {
    if (currentMember) {
      localStorage.setItem(`coopTransactions_${currentMember.id}`, JSON.stringify(transactions));
    }
  }, [transactions, currentMember]);

  useEffect(() => {
    localStorage.setItem('coopMembersList', JSON.stringify(allMembers));
  }, [allMembers]);

  useEffect(() => {
    localStorage.setItem('coopRatesCache', JSON.stringify(ratesCache));
  }, [ratesCache]);

  // Dark mode handler
  useEffect(() => {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDarkMode(prefersDark);
    document.documentElement.classList.toggle('dark', prefersDark);
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
        setIsDarkMode(e.matches);
        document.documentElement.classList.toggle('dark', e.matches);
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const toggleDarkMode = () => {
    setIsDarkMode(prev => {
        const newIsDark = !prev;
        document.documentElement.classList.toggle('dark', newIsDark);
        return newIsDark;
    });
  };

  const handleLoginById = (savingsId: number): boolean => {
    const memberToLogin = allMembers.find(m => m.id === savingsId);
    if (memberToLogin) {
        setCurrentMember(memberToLogin);
        localStorage.setItem('currentCoopMemberId', String(savingsId));
        const savedTransactions = localStorage.getItem(`coopTransactions_${memberToLogin.id}`);
        setTransactions(savedTransactions ? JSON.parse(savedTransactions) : []);
        
        return true;
    }
    return false;
  };
  
  const handleRegisterNewMember = (newMember: Member): boolean => {
      if (allMembers.some(m => m.id === newMember.id)) {
          return false; // ID taken
      }
      setAllMembers(prev => [...prev, newMember]);
      setCurrentMember(newMember);
      localStorage.setItem('currentCoopMemberId', String(newMember.id));
      setTransactions([]); // Start with fresh transactions
      return true;
  };

  const handleLogout = () => {
    localStorage.removeItem('currentCoopMemberId');
    setCurrentMember(null);
    setTransactions([]);
    setAuthView('login');
  };

  const handleBackFromSetup = () => {
    if (isEditingSetup) {
        setIsEditingSetup(false);
        return;
    }
    if (!currentMember) return;
    // Remove the member that was just created but not set up
    setAllMembers(prev => prev.filter(m => m.id !== currentMember.id));
    localStorage.removeItem('currentCoopMemberId');
    setCurrentMember(null);
    setAuthView('register');
  };
  
  const handleSetupComplete = (setupData: Partial<Member>) => {
      if (!currentMember) return;
      const updatedMember = {
          ...currentMember,
          ...setupData,
          setupComplete: true,
      };
      setAllMembers(prev => prev.map(m => m.id === updatedMember.id ? updatedMember : m));
      setCurrentMember(updatedMember);
      if (!isEditingSetup) {
          setTransactions([]);
      }
      setIsEditingSetup(false);
  }
  
  const handleAddTransactions = (newTxs: Omit<Transaction, 'id' | 'memberId'>[], rate: number) => {
    if (!currentMember) return;
    const transactionsWithIds: Transaction[] = newTxs.map((tx, index) => ({
      ...tx,
      id: `tx${Date.now() + index}`,
      memberId: currentMember.id,
    }));
    setTransactions(prev => [...transactionsWithIds, ...prev]);

    if (newTxs.length > 0) {
        const date = newTxs[0].date;
        setRatesCache(prev => ({...prev, [date]: rate }));
        setLastUsedRate(rate);
        localStorage.setItem('coopLastUsedRate', String(rate));
        setLastAddedGroup(transactionsWithIds);
    }
  };

  const handleDeleteTransaction = (transactionId: string) => {
    if (window.confirm('¿Está seguro de que desea eliminar esta transacción? Esta acción no se puede deshacer.')) {
        setTransactions(prev => prev.filter(tx => tx.id !== transactionId));
    }
  };

  const handleWithdrawal = (withdrawalData: { amountUsd: number; date: string; rate: number; reference: string; description: string }) => {
    if (!currentMember) return;
    const { amountUsd, date, rate, reference, description } = withdrawalData;
    const amountBs = amountUsd * rate;

    const withdrawalTx: Omit<Transaction, 'id' | 'memberId'> = {
        date,
        category: TransactionCategory.SAVINGS,
        amountBs: -amountBs, // Negative amount for withdrawal
        reference,
        description: description || 'Retiro de ahorros'
    };

    const transactionsWithIds: Transaction[] = [{
      ...withdrawalTx,
      id: `tx${Date.now()}`,
      memberId: currentMember.id,
    }];

    setTransactions(prev => [...transactionsWithIds, ...prev]);
    setRatesCache(prev => ({ ...prev, [date]: rate }));
    setIsWithdrawalModalOpen(false);
  };
  
  const handleAddNewLoan = (newLoan: { amount: number; startDate: string; frequency: 'weekly' | 'biweekly' | 'monthly', installment: number }) => {
    if (!currentMember) return;
    const updatedMember = { ...currentMember };

    const currentLoanBalance = updatedMember.initialLoanUsd || 0;
    updatedMember.initialLoanUsd = currentLoanBalance + newLoan.amount;
    
    const lastLoanPayment = transactions
      .filter(tx => tx.category === TransactionCategory.LOAN)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
      
    const lastPaymentDate = lastLoanPayment ? new Date(lastLoanPayment.date) : new Date(0);
    const newLoanDate = new Date(newLoan.startDate);

    if (newLoanDate > lastPaymentDate) {
      updatedMember.loanStartDate = newLoan.startDate;
    }
    
    updatedMember.loanPaymentFrequency = newLoan.frequency;
    updatedMember.loanInstallmentUsd = newLoan.installment;
    
    setAllMembers(prev => prev.map(m => m.id === updatedMember.id ? updatedMember : m));
    setCurrentMember(updatedMember);
    setIsNewLoanModalOpen(false);
  };
  
  const handleAddProtectionId = (data: { id: string; lastProtectionPaymentDate: string; monthlyProtectionFeeUsd: number }) => {
    if (!currentMember) return;
    const updatedMember = { 
        ...currentMember, 
        socialProtectionId: data.id,
        lastProtectionPaymentDate: data.lastProtectionPaymentDate,
        monthlyProtectionFeeUsd: data.monthlyProtectionFeeUsd,
    };
    
    setAllMembers(prev => prev.map(m => m.id === updatedMember.id ? updatedMember : m));
    setCurrentMember(updatedMember);
    setIsAddProtectionIdModalOpen(false);
  };

  const calculateTotalUsd = (categories: TransactionCategory[]) =>
      transactions
          .filter(tx => categories.includes(tx.category))
          .reduce((acc, tx) => {
              const rate = ratesCache[tx.date];
              return (rate && rate > 0) ? acc + (tx.amountBs / rate) : acc;
          }, 0);

  const dashboardData = useMemo(() => {
    if (!currentMember) {
        return {
            savingsUsd: 0,
            loanBalanceUsd: 0,
            remainingInstallments: 0,
            loanCompletionDate: null,
        };
    }

    const savingsFromTx = calculateTotalUsd([TransactionCategory.SAVINGS]);
    const loanPaymentsFromTx = calculateTotalUsd([TransactionCategory.LOAN]);

    const loanBalanceUsd = (currentMember.initialLoanUsd || 0) - loanPaymentsFromTx;

    const remainingInstallments =
        (currentMember.loanInstallmentUsd && currentMember.loanInstallmentUsd > 0)
            ? Math.ceil(loanBalanceUsd / currentMember.loanInstallmentUsd)
            : 0;

    let loanCompletionDate: string | null = null;
    if (
        loanBalanceUsd > 0 &&
        currentMember.initialLoanUsd &&
        currentMember.initialLoanUsd > 0 &&
        currentMember.loanInstallmentUsd &&
        currentMember.loanInstallmentUsd > 0 &&
        currentMember.loanStartDate &&
        currentMember.loanPaymentFrequency
    ) {
        // Calculate total installments based on the *initial* loan amount for a stable end date
        const totalInstallments = Math.ceil(currentMember.initialLoanUsd / currentMember.loanInstallmentUsd);
        const startDate = new Date(currentMember.loanStartDate + 'T00:00:00');
        
        const completionDate = new Date(startDate);
        switch (currentMember.loanPaymentFrequency) {
            case 'weekly':
                completionDate.setDate(startDate.getDate() + totalInstallments * 7);
                break;
            case 'biweekly':
                completionDate.setDate(startDate.getDate() + totalInstallments * 14);
                break;
            case 'monthly':
                completionDate.setMonth(startDate.getMonth() + totalInstallments);
                break;
        }
        loanCompletionDate = completionDate.toLocaleDateString('es-VE', { month: 'short', year: 'numeric' }).replace('.', '');
    }

    return {
        savingsUsd: (currentMember.initialSavingsUsd || 0) + savingsFromTx,
        loanBalanceUsd,
        remainingInstallments: remainingInstallments > 0 ? remainingInstallments : 0,
        loanCompletionDate,
    };
}, [transactions, ratesCache, currentMember]);

  const certificateData = useMemo(() => {
    if (!currentMember || !currentMember.contributionCertificateTotal) {
      return { paid: 0, pending: 0, total: 0 };
    }
    const total = currentMember.contributionCertificateTotal;
    const paid = calculateTotalUsd([TransactionCategory.CONTRIBUTION_CERTIFICATE]);
    const pending = Math.max(0, total - paid);
    return { paid, pending, total };
  }, [transactions, ratesCache, currentMember]);

  const lastProtectionPaymentDate = useMemo(() => {
    if (!currentMember?.socialProtectionId?.trim() || !currentMember.lastProtectionPaymentDate) {
        return null;
    }

    const totalMonthsPaidFromTxs = transactions
        .filter(tx => tx.category === TransactionCategory.SOCIAL_PROTECTION && tx.monthsPaid && tx.monthsPaid > 0)
        .reduce((acc, tx) => acc + (tx.monthsPaid || 0), 0);

    const [initialYear, initialMonth] = currentMember.lastProtectionPaymentDate.split('-').map(Number);
    const lastPaidDate = new Date(initialYear, initialMonth - 1, 1);
    
    lastPaidDate.setMonth(lastPaidDate.getMonth() + totalMonthsPaidFromTxs);
    
    const year = lastPaidDate.getFullYear();
    const month = String(lastPaidDate.getMonth() + 1).padStart(2, '0');

    return `${year}-${month}`;
}, [transactions, currentMember]);

  const lastProtectionPaymentDisplay = useMemo(() => {
    if (!lastProtectionPaymentDate) return "Sin Pagos";

    const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const [year, month] = lastProtectionPaymentDate.split('-');
    return `${monthNames[parseInt(month) - 1]} ${year}`;
  }, [lastProtectionPaymentDate]);

  const protectionPaymentStatus = useMemo(() => {
    if (!currentMember?.socialProtectionId?.trim()) {
      return { status: 'not_applicable' as const };
    }

    if (!lastProtectionPaymentDate) {
        const now = new Date();
        return { status: 'pending' as const, month: now.toLocaleString('es-VE', { month: 'long' }) };
    }

    const [lastYear, lastMonth] = lastProtectionPaymentDate.split('-').map(Number);
    const lastPaidDateObj = new Date(lastYear, lastMonth - 1, 1); 

    const nextDueDate = new Date(lastPaidDateObj);
    nextDueDate.setMonth(nextDueDate.getMonth() + 1);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    if (nextDueDate > currentMonthStart) {
      return { status: 'paid' as const };
    }
    
    if (nextDueDate.getFullYear() === currentMonthStart.getFullYear() && nextDueDate.getMonth() === currentMonthStart.getMonth()) {
      return { status: 'pending' as const, month: today.toLocaleString('es-VE', { month: 'long' }) };
    }

    return { status: 'overdue' as const, month: nextDueDate.toLocaleString('es-VE', { month: 'long', year: 'numeric' }) };
    
  }, [lastProtectionPaymentDate, currentMember]);

  const loanPaymentStatus = useMemo(() => {
    if (!currentMember?.initialLoanUsd || currentMember.initialLoanUsd <= 0 || !currentMember.loanStartDate || !currentMember.loanPaymentFrequency) {
      return { status: 'no_loan' as const };
    }

    const lastLoanPayment = transactions
      .filter(tx => tx.category === TransactionCategory.LOAN)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
    
    const lastPaymentDate = lastLoanPayment ? new Date(lastLoanPayment.date + 'T00:00:00') : new Date(currentMember.loanStartDate + 'T00:00:00');
    
    const nextPaymentDate = new Date(lastPaymentDate);
    switch (currentMember.loanPaymentFrequency) {
      case 'weekly': nextPaymentDate.setDate(nextPaymentDate.getDate() + 7); break;
      case 'biweekly': nextPaymentDate.setDate(nextPaymentDate.getDate() + 14); break;
      case 'monthly': nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1); break;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const installment = currentMember.loanInstallmentUsd || 0;

    if (dashboardData.loanBalanceUsd <= 0) return { status: 'ok' as const }
    if (today >= nextPaymentDate) return { status: 'overdue' as const, date: nextPaymentDate.toLocaleDateString('es-VE'), amount: installment };
    
    const warningDate = new Date(nextPaymentDate);
    warningDate.setDate(warningDate.getDate() - 3);
    if (today >= warningDate) return { status: 'due_soon' as const, date: nextPaymentDate.toLocaleDateString('es-VE'), amount: installment };

    return { status: 'ok' as const };
}, [transactions, currentMember, dashboardData.loanBalanceUsd]);

  
  if (!currentMember) {
    const hasMembers = allMembers.length > 0;
    if (authView === 'login' && hasMembers) {
        return <LoginForm onLogin={handleLoginById} onNavigateToRegister={() => setAuthView('register')} />;
    }
    return <RegistrationForm onRegister={handleRegisterNewMember} onNavigateToLogin={() => setAuthView('login')} hasExistingMembers={hasMembers} />;
  }
  
  if (!currentMember.setupComplete || isEditingSetup) {
      return <InitialSetupForm member={currentMember} onComplete={handleSetupComplete} onBack={handleBackFromSetup} isEditing={isEditingSetup} />;
  }
  
  const hasSocialProtection = !!currentMember?.socialProtectionId?.trim();
  const hasCertificate = !!currentMember?.contributionCertificateTotal && currentMember.contributionCertificateTotal > 0;

  const loanSubtitleParts: string[] = [];
  if (dashboardData.loanBalanceUsd > 0 && dashboardData.remainingInstallments > 0) {
      loanSubtitleParts.push(`~${dashboardData.remainingInstallments} cuotas restantes`);
  }
  if (dashboardData.loanCompletionDate) {
      loanSubtitleParts.push(`Finaliza ${dashboardData.loanCompletionDate}`);
  }
  const loanSubtitle = loanSubtitleParts.length > 0 ? loanSubtitleParts.join(' - ') : undefined;

  const MainContent = () => {
    if (lastAddedGroup) {
      return (
        <TransactionResult 
          transactions={lastAddedGroup}
          ratesCache={ratesCache}
          member={currentMember}
          onNewTransaction={() => setLastAddedGroup(null)}
        />
      );
    }
    return (
      <TransactionForm 
        member={currentMember} 
        onAddTransactions={handleAddTransactions}
        certificatePendingAmount={certificateData.pending}
        initialRate={lastUsedRate}
      />
    );
  };


  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 font-sans transition-colors duration-300">
      <header className="bg-white dark:bg-gray-800 shadow-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
            <div className="flex items-center space-x-3">
                <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <div>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white">Libreta Cooperativa Digital</h1>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Cooperativa de Servicios Múltiples La Candelaria</p>
                </div>
            </div>
            <div className="flex items-center space-x-4">
                 <div className="text-right">
                    <p className="font-semibold text-gray-800 dark:text-gray-100">{currentMember.firstName} {currentMember.lastName}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">ID: {currentMember.savingsId}</p>
                 </div>
                 <button onClick={() => setIsEditingSetup(true)} className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" aria-label="Editar Saldos Iniciales">
                    <PencilIcon className="w-5 h-5" />
                 </button>
                <button onClick={handleLogout} className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" aria-label="Cerrar sesión">
                    <LogoutIcon className="w-6 h-6" />
                </button>
            </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 px-4">
        <div className="space-y-4 mb-8">
          {protectionPaymentStatus.status === 'pending' && <PaymentAlert type="warning" message={`El pago de protección social para ${protectionPaymentStatus.month} está pendiente.`} />}
          {protectionPaymentStatus.status === 'overdue' && <PaymentAlert type="error" message={`El pago de protección social para ${protectionPaymentStatus.month} está vencido.`} />}
          {loanPaymentStatus.status === 'due_soon' && <PaymentAlert type="warning" message={`Su cuota del préstamo de ${loanPaymentStatus.amount?.toLocaleString('es-VE', {style:'currency', currency:'USD'})} vence el ${loanPaymentStatus.date}.`} />}
          {loanPaymentStatus.status === 'overdue' && <PaymentAlert type="error" message={`Su cuota del préstamo de ${loanPaymentStatus.amount?.toLocaleString('es-VE', {style:'currency', currency:'USD'})} venció el ${loanPaymentStatus.date}.`} />}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <DashboardCard
            title="Saldo Actual de Ahorros"
            value={dashboardData.savingsUsd.toLocaleString('es-VE', {style: 'currency', currency: 'USD'})}
            icon={<SavingsIcon className="w-8 h-8 text-white" />}
            colorClass="bg-green-500"
          />
          <DashboardCard
            title="Saldo Deudor Préstamo"
            value={dashboardData.loanBalanceUsd.toLocaleString('es-VE', {style: 'currency', currency: 'USD'})}
            subtitle={loanSubtitle}
            icon={<LoanIcon className="w-8 h-8 text-white" />}
            colorClass="bg-red-500"
          />
          {hasSocialProtection && (
            <DashboardCard
                title="Último Mes Pagado"
                value={lastProtectionPaymentDisplay}
                subtitle={`ID: ${currentMember.socialProtectionId}`}
                icon={<ProtectionIcon className="w-8 h-8 text-white" />}
                colorClass="bg-blue-500"
            />
          )}
           {hasCertificate && (
            <DashboardCard
                title="Certificado de Aportación"
                value={certificateData.pending > 0 ? certificateData.pending.toLocaleString('es-VE', {style: 'currency', currency: 'USD'}) : 'Pagado'}
                subtitle={certificateData.pending > 0 ? `Pendiente de ${certificateData.total.toLocaleString('es-VE', {style: 'currency', currency: 'USD'})}`: `Total: ${certificateData.total.toLocaleString('es-VE', {style: 'currency', currency: 'USD'})}`}
                icon={certificateData.pending > 0 
                    ? <CertificateIcon className="w-8 h-8 text-white" />
                    : <CertificateCheckIcon className="w-8 h-8 text-white" />
                }
                colorClass={certificateData.pending > 0 ? 'bg-red-500' : 'bg-green-500'}
            />
          )}
        </div>
        
        <div className="flex flex-wrap gap-4 justify-center mb-8">
            <div className="inline-flex rounded-md shadow-sm" role="group">
                <button onClick={() => setIsWithdrawalModalOpen(true)} className="flex items-center justify-center px-5 py-2.5 text-sm font-medium text-gray-900 bg-white rounded-l-lg border border-gray-200 hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700 dark:focus:ring-blue-500 transition-colors">
                    <WithdrawIcon className="w-5 h-5 mr-2" /> Retirar Fondos
                </button>
                <button onClick={() => setIsHistoryModalOpen(true)} className="flex items-center justify-center px-5 py-2.5 text-sm font-medium text-gray-900 bg-white border-t border-b -ml-px border-gray-200 hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700 dark:focus:ring-blue-500 transition-colors">
                    <HistoryIcon className="w-5 h-5 mr-2" /> Ver Historial
                </button>
                <button onClick={() => setIsEmailCsvModalOpen(true)} disabled={transactions.length === 0} className="flex items-center justify-center px-5 py-2.5 text-sm font-medium text-gray-900 bg-white rounded-r-lg border border-gray-200 -ml-px hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700 dark:focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                    <CsvIcon className="w-5 h-5 mr-2" /> Exportar CSV
                </button>
            </div>
            <button onClick={() => setIsNewLoanModalOpen(true)} className="flex items-center justify-center px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 rounded-lg dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800">
                <PlusCircleIcon className="w-5 h-5 mr-2" /> Registrar Nuevo Préstamo
            </button>
             {!hasSocialProtection && (
                <button onClick={() => setIsAddProtectionIdModalOpen(true)} className="flex items-center justify-center px-5 py-2.5 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 focus:ring-4 focus:ring-teal-300 rounded-lg dark:bg-teal-600 dark:hover:bg-teal-700 focus:outline-none dark:focus:ring-teal-800">
                    <ProtectionPlusIcon className="w-5 h-5 mr-2" /> Agregar ID Protección Social
                </button>
             )}
        </div>

        <MainContent />

      </main>

      <NewLoanModal isOpen={isNewLoanModalOpen} onClose={() => setIsNewLoanModalOpen(false)} onSave={handleAddNewLoan} />
      <AddProtectionIdModal isOpen={isAddProtectionIdModalOpen} onClose={() => setIsAddProtectionIdModalOpen(false)} onSave={handleAddProtectionId} />
      <WithdrawalModal isOpen={isWithdrawalModalOpen} onClose={() => setIsWithdrawalModalOpen(false)} onSave={handleWithdrawal} currentBalance={dashboardData.savingsUsd} />
      <HistoryModal isOpen={isHistoryModalOpen} onClose={() => setIsHistoryModalOpen(false)} transactions={transactions} ratesCache={ratesCache} onDeleteTransaction={handleDeleteTransaction} />
      {currentMember && <EmailCsvModal isOpen={isEmailCsvModalOpen} onClose={() => setIsEmailCsvModalOpen(false)} member={currentMember} transactions={transactions} ratesCache={ratesCache} />}
    </div>
  );
};

export default App;