
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Member, Transaction, TransactionCategory, AppNotification } from './types';
import TransactionForm from './components/TransactionForm';
import DashboardCard from './components/DashboardCard';
import RegistrationForm from './components/RegistrationForm';
import { SavingsIcon, LoanIcon, ProtectionIcon, LogoutIcon, PlusCircleIcon, CsvIcon, WithdrawIcon, HistoryIcon, PencilIcon, ProtectionPlusIcon, CertificateIcon, CertificateCheckIcon, HelpCircleIcon, ChevronDownIcon, UserPlusIcon, UsersIcon, BellIcon } from './components/icons';
import PaymentAlert from './components/PaymentAlert';
import InitialSetupForm from './components/InitialSetupForm';
import NewLoanModal from './components/NewLoanModal';
import { LoginForm } from './components/LoginForm';
import WithdrawalModal from './components/WithdrawalModal';
import HistoryModal from './components/HistoryModal';
import AddProtectionIdModal from './components/AddProtectionIdModal';
import TransactionResult from './components/TransactionResult';
import EmailCsvModal from './components/EmailCsvModal';
import HelpModal from './components/HelpModal';
import ManageMembersModal from './components/ManageMembersModal';

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
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isManageMembersModalOpen, setIsManageMembersModalOpen] = useState(false);
  const [isEditingSetup, setIsEditingSetup] = useState(false);
  const [lastAddedGroup, setLastAddedGroup] = useState<Transaction[] | null>(null);
  const [lastUsedRate, setLastUsedRate] = useState<number | null>(null);
  const [isSwitchAccountOpen, setIsSwitchAccountOpen] = useState(false);
  const switchAccountRef = useRef<HTMLDivElement>(null);
  const [editingTxGroup, setEditingTxGroup] = useState<Transaction[] | null>(null);

  // Notifications state
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);


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

  // Click outside handler for dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (switchAccountRef.current && !switchAccountRef.current.contains(event.target as Node)) {
        setIsSwitchAccountOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [switchAccountRef, notificationsRef]);

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
        setLastAddedGroup(null);
        
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

  const handleNavigateToRegister = () => {
    localStorage.removeItem('currentCoopMemberId');
    setCurrentMember(null);
    setTransactions([]);
    setAuthView('register');
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
  
  const handleStartEditTransaction = (transactionGroup: Transaction[]) => {
    setEditingTxGroup(transactionGroup);
    setIsHistoryModalOpen(false);
  };

  const handleCancelEdit = () => {
    setEditingTxGroup(null);
  };
  
  const handleUpdateTransactions = (oldGroup: Transaction[], newTxs: Omit<Transaction, 'id' | 'memberId'>[], rate: number) => {
    if (!currentMember) return;
    
    const oldGroupIds = new Set(oldGroup.map(tx => tx.id));
    
    const transactionsWithIds: Transaction[] = newTxs.map((tx, index) => ({
      ...tx,
      id: `tx-edited-${Date.now() + index}`,
      memberId: currentMember.id,
    }));

    setTransactions(prev => {
        const filtered = prev.filter(tx => !oldGroupIds.has(tx.id));
        return [...transactionsWithIds, ...filtered];
    });

    if (newTxs.length > 0) {
        const date = newTxs[0].date;
        setRatesCache(prev => ({...prev, [date]: rate }));
        setLastUsedRate(rate);
        localStorage.setItem('coopLastUsedRate', String(rate));
        setLastAddedGroup(transactionsWithIds);
    }
    
    setEditingTxGroup(null);
  };

  const handleDeleteTransactionGroup = (groupToDelete: Transaction[]) => {
    if (window.confirm('¿Está seguro de que desea eliminar esta operación completa? Esta acción no se puede deshacer.')) {
      const groupIds = new Set(groupToDelete.map(tx => tx.id));
      setTransactions(prev => prev.filter(tx => !groupIds.has(tx.id)));
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

    const transactionWithId: Transaction = {
      ...withdrawalTx,
      id: `tx${Date.now()}`,
      memberId: currentMember.id,
    };
    
    const newTransactionGroup = [transactionWithId];

    setTransactions(prev => [...newTransactionGroup, ...prev]);
    setRatesCache(prev => ({ ...prev, [date]: rate }));
    setLastAddedGroup(newTransactionGroup); // Show receipt after withdrawal
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

    const handleUpdateMember = (originalId: number, updatedData: { firstName: string; lastName: string; savingsId: number }): { success: boolean; error?: string } => {
        const newId = updatedData.savingsId;

        if (newId !== originalId && allMembers.some(m => m.id === newId)) {
            return { success: false, error: 'El nuevo ID de Ahorros ya está en uso.' };
        }

        let memberToUpdate: Member | undefined;
        const updatedMembers = allMembers.map(m => {
            if (m.id === originalId) {
                memberToUpdate = { ...m, firstName: updatedData.firstName, lastName: updatedData.lastName, id: newId, savingsId: newId };
                return memberToUpdate;
            }
            return m;
        });
        setAllMembers(updatedMembers);

        if (newId !== originalId) {
            const oldTxKey = `coopTransactions_${originalId}`;
            const newTxKey = `coopTransactions_${newId}`;
            const transactionsJson = localStorage.getItem(oldTxKey);
            if (transactionsJson) {
                const memberTransactions: Transaction[] = JSON.parse(transactionsJson);
                const updatedTransactions = memberTransactions.map(tx => ({ ...tx, memberId: newId }));
                localStorage.setItem(newTxKey, JSON.stringify(updatedTransactions));
                localStorage.removeItem(oldTxKey);
            }
        }
        
        if (currentMember && currentMember.id === originalId) {
            setCurrentMember(memberToUpdate!);
            localStorage.setItem('currentCoopMemberId', String(newId));
             if(newId !== originalId) {
                const newTransactionsJson = localStorage.getItem(`coopTransactions_${newId}`);
                setTransactions(newTransactionsJson ? JSON.parse(newTransactionsJson) : []);
            }
        }
        
        return { success: true };
    };

    const handleDeleteMember = (memberId: number) => {
        if (!window.confirm(`¿Está seguro de que desea eliminar a este asociado? Se borrarán TODAS sus transacciones. Esta acción es irreversible.`)) {
            return;
        }

        setAllMembers(prev => prev.filter(m => m.id !== memberId));
        localStorage.removeItem(`coopTransactions_${memberId}`);

        if (currentMember && currentMember.id === memberId) {
            handleLogout();
        }
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

    const adjustedBalances = useMemo(() => {
        if (!editingTxGroup || !currentMember) {
            return { adjustedLoan: dashboardData.loanBalanceUsd, adjustedCert: certificateData.pending };
        }

        const rate = ratesCache[editingTxGroup[0].date] || 1;
        
        const loanPaymentInGroup = editingTxGroup
            .find(tx => tx.category === TransactionCategory.LOAN)?.amountBs || 0;
        const loanPaymentUsdInGroup = rate > 0 ? loanPaymentInGroup / rate : 0;
        
        const certPaymentInGroup = editingTxGroup
            .find(tx => tx.category === TransactionCategory.CONTRIBUTION_CERTIFICATE)?.amountBs || 0;
        const certPaymentUsdInGroup = rate > 0 ? certPaymentInGroup / rate : 0;
            
        return {
            adjustedLoan: dashboardData.loanBalanceUsd + loanPaymentUsdInGroup,
            adjustedCert: certificateData.pending + certPaymentUsdInGroup
        };
    }, [editingTxGroup, dashboardData.loanBalanceUsd, certificateData.pending, ratesCache, currentMember]);

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

  // Notification generation
  useEffect(() => {
    if (!currentMember) return;

    const dismissedNotifsKey = `dismissedNotifications_${currentMember.id}`;
    const dismissedIds: string[] = JSON.parse(localStorage.getItem(dismissedNotifsKey) || '[]');

    const newNotifications: AppNotification[] = [];

    // Loan notifications
    if (loanPaymentStatus.status === 'due_soon' || loanPaymentStatus.status === 'overdue') {
        const id = `loan-${loanPaymentStatus.date}`;
        if (!dismissedIds.includes(id)) {
            const message = loanPaymentStatus.status === 'due_soon'
                ? `Su cuota del préstamo de ${loanPaymentStatus.amount?.toLocaleString('es-VE', {style:'currency', currency:'USD'})} vence el ${loanPaymentStatus.date}.`
                : `Su cuota del préstamo de ${loanPaymentStatus.amount?.toLocaleString('es-VE', {style:'currency', currency:'USD'})} venció el ${loanPaymentStatus.date}.`;
            newNotifications.push({
                id,
                message,
                type: 'loan',
                level: loanPaymentStatus.status === 'overdue' ? 'error' : 'warning',
            });
        }
    }

    // Protection notifications
    if (protectionPaymentStatus.status === 'pending' || protectionPaymentStatus.status === 'overdue') {
        const id = `protection-${protectionPaymentStatus.month.replace(/\s/g, '-')}`;
         if (!dismissedIds.includes(id)) {
            const message = protectionPaymentStatus.status === 'pending'
                ? `El pago de protección para ${protectionPaymentStatus.month} está pendiente.`
                : `El pago de protección para ${protectionPaymentStatus.month} está vencido.`;
            newNotifications.push({
                id,
                message,
                type: 'protection',
                level: protectionPaymentStatus.status === 'overdue' ? 'error' : 'warning',
            });
        }
    }

    setNotifications(newNotifications);

  }, [loanPaymentStatus, protectionPaymentStatus, currentMember]);
  
  const handleDismissNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));

    if (currentMember) {
        const dismissedNotifsKey = `dismissedNotifications_${currentMember.id}`;
        const dismissedIds: string[] = JSON.parse(localStorage.getItem(dismissedNotifsKey) || '[]');
        if (!dismissedIds.includes(notificationId)) {
            localStorage.setItem(dismissedNotifsKey, JSON.stringify([...dismissedIds, ...dismissedIds.includes(notificationId) ? [] : [notificationId]]));
        }
    }
  };

  const handleDismissAllNotifications = () => {
    if (!currentMember) return;
    const dismissedNotifsKey = `dismissedNotifications_${currentMember.id}`;
    const dismissedIds: string[] = JSON.parse(localStorage.getItem(dismissedNotifsKey) || '[]');
    const newDismissedIds = notifications.map(n => n.id);
    const combinedIds = [...new Set([...dismissedIds, ...newDismissedIds])];
    localStorage.setItem(dismissedNotifsKey, JSON.stringify(combinedIds));
    setNotifications([]);
  };

  
  if (!currentMember) {
    const hasMembers = allMembers.length > 0;
    if (authView === 'login') {
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
          onNewTransaction={() => {
            setLastAddedGroup(null);
            setEditingTxGroup(null);
          }}
          lastProtectionPaymentDisplayAfterTx={lastProtectionPaymentDisplay}
        />
      );
    }
    
    if (editingTxGroup) {
        return (
            <TransactionForm 
                member={currentMember}
                transactionGroupToEdit={editingTxGroup}
                onUpdateTransactions={handleUpdateTransactions}
                onCancelEdit={handleCancelEdit}
                ratesCache={ratesCache}
                certificatePendingAmount={adjustedBalances.adjustedCert}
                loanBalanceUsd={adjustedBalances.adjustedLoan}
            />
        );
    }

    return (
      <TransactionForm 
        member={currentMember} 
        onAddTransactions={handleAddTransactions}
        certificatePendingAmount={certificateData.pending}
        loanBalanceUsd={dashboardData.loanBalanceUsd}
        initialRate={lastUsedRate}
      />
    );
  };


  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 font-sans transition-colors duration-300">
      <header className="bg-white dark:bg-gray-800 shadow-md sticky top-0 z-20">
        <div className="max-w-7xl mx-auto py-3 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
            {/* Título de la app para móviles y escritorio */}
            <div className="flex items-center space-x-2 shrink-0">
                <svg className="w-7 h-7 text-blue-600 dark:text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h1 className="hidden xs:block text-lg font-bold text-gray-900 dark:text-white leading-tight">Libreta</h1>
            </div>

            <div className="flex items-center space-x-1 sm:space-x-3">
                 {/* Selector de Cuentas Responsivo */}
                 <div className="relative" ref={switchAccountRef}>
                    <button 
                        onClick={() => setIsSwitchAccountOpen(prev => !prev)}
                        className="flex items-center space-x-1 sm:space-x-2 p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        aria-haspopup="true"
                        aria-expanded={isSwitchAccountOpen}
                    >
                        <div className="text-right">
                            <p className="font-semibold text-gray-800 dark:text-gray-100 text-xs sm:text-sm max-w-[100px] sm:max-w-[150px] truncate">
                                {currentMember.firstName} {currentMember.lastName}
                            </p>
                            <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">ID: {currentMember.savingsId}</p>
                        </div>
                        <ChevronDownIcon className={`w-4 h-4 sm:w-5 sm:h-5 text-gray-500 dark:text-gray-400 transition-transform duration-200 ${isSwitchAccountOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isSwitchAccountOpen && (
                        <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl z-30 border border-gray-200 dark:border-gray-700 animate-fade-in" style={{ animationDuration: '0.2s' }}>
                            <div className="p-2 font-semibold text-sm text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">Cambiar de cuenta</div>
                            <div className="py-1 max-h-60 overflow-y-auto">
                                {allMembers.filter(m => m.id !== currentMember.id).map(member => (
                                    <button
                                        key={member.id}
                                        onClick={() => {
                                            handleLoginById(member.id);
                                            setIsSwitchAccountOpen(false);
                                        }}
                                        className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/50"
                                    >
                                        <div>
                                            <p className="font-medium">{member.firstName} {member.lastName}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">ID: {member.id}</p>
                                        </div>
                                    </button>
                                ))}
                                {allMembers.length <= 1 && (
                                    <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">No hay otras cuentas.</div>
                                )}
                            </div>
                            <div className="border-t border-gray-200 dark:border-gray-700">
                                <button
                                    onClick={() => {
                                        handleNavigateToRegister();
                                        setIsSwitchAccountOpen(false);
                                    }}
                                    className="w-full text-left flex items-center px-4 py-3 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/50"
                                >
                                    <UserPlusIcon className="w-5 h-5 mr-3" />
                                    Agregar Nueva Cuenta
                                </button>
                            </div>
                        </div>
                    )}
                 </div>

                 {/* Botones de acción del cabezal */}
                 <button onClick={() => setIsEditingSetup(true)} className="p-1.5 sm:p-2 rounded-full text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors" aria-label="Editar Saldos Iniciales">
                    <PencilIcon className="w-5 h-5" />
                 </button>

                 <div className="relative" ref={notificationsRef}>
                    <button 
                        onClick={() => setIsNotificationsOpen(prev => !prev)}
                        className="relative p-1.5 sm:p-2 rounded-full text-yellow-500 dark:text-yellow-400 hover:bg-yellow-100 dark:hover:bg-yellow-900/50 transition-colors" 
                        aria-label="Ver notificaciones"
                    >
                        <BellIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                        {notifications.length > 0 && (
                            <span className="absolute top-1 right-1 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white dark:ring-gray-800"></span>
                        )}
                    </button>
                    {isNotificationsOpen && (
                        <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl z-30 border border-gray-200 dark:border-gray-700 animate-fade-in" style={{ animationDuration: '0.2s' }}>
                            <div className="p-3 font-bold text-gray-800 dark:text-white border-b border-gray-200 dark:border-gray-700">Notificaciones</div>
                            <div className="py-1 max-h-80 overflow-y-auto">
                                {notifications.length > 0 ? (
                                    notifications.map(notif => (
                                        <div key={notif.id} className="flex items-start px-3 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                            <div className="shrink-0 mr-3 mt-1">
                                                {notif.type === 'loan' && <LoanIcon className={`w-5 h-5 ${notif.level === 'error' ? 'text-red-500' : 'text-yellow-500'}`} />}
                                                {notif.type === 'protection' && <ProtectionIcon className={`w-5 h-5 ${notif.level === 'error' ? 'text-red-500' : 'text-blue-500'}`} />}
                                            </div>
                                            <div className="flex-grow">{notif.message}</div>
                                            <button onClick={() => handleDismissNotification(notif.id)} className="ml-2 p-1 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                            </button>
                                        </div>
                                    ))
                                ) : (
                                    <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 text-center">No tienes notificaciones nuevas.</div>
                                )}
                            </div>
                            {notifications.length > 0 && (
                                <div className="border-t border-gray-200 dark:border-gray-700">
                                    <button
                                        onClick={handleDismissAllNotifications}
                                        className="w-full text-center px-4 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/50"
                                    >
                                        Marcar todas como leídas
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                 </div>

                 <button onClick={() => setIsHelpModalOpen(true)} className="p-1.5 sm:p-2 rounded-full text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/50 transition-colors" aria-label="Centro de Ayuda">
                    <HelpCircleIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                 </button>
                <button onClick={handleLogout} className="p-1.5 sm:p-2 rounded-full text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors" aria-label="Cerrar sesión">
                    <LogoutIcon className="w-5 h-5 sm:w-6 sm:h-6" />
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
                <button onClick={() => setIsWithdrawalModalOpen(true)} className="flex items-center justify-center px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-medium text-gray-900 bg-white rounded-l-lg border border-gray-200 hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700 dark:focus:ring-blue-500 transition-colors">
                    <WithdrawIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" /> Retirar
                </button>
                <button onClick={() => setIsHistoryModalOpen(true)} className="flex items-center justify-center px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-medium text-gray-900 bg-white border-t border-b -ml-px border-gray-200 hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700 dark:focus:ring-blue-500 transition-colors">
                    <HistoryIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" /> Historial
                </button>
                <button onClick={() => setIsEmailCsvModalOpen(true)} disabled={transactions.length === 0} className="flex items-center justify-center px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-medium text-gray-900 bg-white rounded-r-lg border border-gray-200 -ml-px hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700 dark:focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                    <CsvIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" /> Exportar
                </button>
            </div>
             <button onClick={() => setIsManageMembersModalOpen(true)} className="flex items-center justify-center px-5 py-2.5 text-xs sm:text-sm font-medium text-white bg-gray-600 hover:bg-gray-700 focus:ring-4 focus:ring-gray-300 rounded-lg dark:bg-gray-600 dark:hover:bg-gray-700 focus:outline-none dark:focus:ring-gray-800">
                <UsersIcon className="w-5 h-5 mr-2" /> Gestionar Asociados
            </button>
            <button onClick={() => setIsNewLoanModalOpen(true)} className="flex items-center justify-center px-5 py-2.5 text-xs sm:text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 rounded-lg dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800">
                <PlusCircleIcon className="w-5 h-5 mr-2" /> Nuevo Préstamo
            </button>
             {!hasSocialProtection && (
                <button onClick={() => setIsAddProtectionIdModalOpen(true)} className="flex items-center justify-center px-5 py-2.5 text-xs sm:text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 focus:ring-4 focus:ring-teal-300 rounded-lg dark:bg-teal-600 dark:hover:bg-teal-700 focus:outline-none dark:focus:ring-teal-800">
                    <ProtectionPlusIcon className="w-5 h-5 mr-2" /> ID Protección Social
                </button>
             )}
        </div>

        <MainContent />

      </main>

      <NewLoanModal isOpen={isNewLoanModalOpen} onClose={() => setIsNewLoanModalOpen(false)} onSave={handleAddNewLoan} />
      <AddProtectionIdModal isOpen={isAddProtectionIdModalOpen} onClose={() => setIsAddProtectionIdModalOpen(false)} onSave={handleAddProtectionId} />
      <WithdrawalModal isOpen={isWithdrawalModalOpen} onClose={() => setIsWithdrawalModalOpen(false)} onSave={handleWithdrawal} currentBalance={dashboardData.savingsUsd} initialRate={lastUsedRate}/>
      {currentMember && <HistoryModal isOpen={isHistoryModalOpen} onClose={() => setIsHistoryModalOpen(false)} transactions={transactions} ratesCache={ratesCache} onDeleteTransactionGroup={handleDeleteTransactionGroup} member={currentMember} onEditTransaction={handleStartEditTransaction} />}
      {currentMember && <EmailCsvModal isOpen={isEmailCsvModalOpen} onClose={() => setIsEmailCsvModalOpen(false)} member={currentMember} transactions={transactions} ratesCache={ratesCache} />}
      <HelpModal isOpen={isHelpModalOpen} onClose={() => setIsHelpModalOpen(false)} />
      {currentMember && <ManageMembersModal isOpen={isManageMembersModalOpen} onClose={() => setIsManageMembersModalOpen(false)} members={allMembers} onUpdateMember={handleUpdateMember} onDeleteMember={handleDeleteMember} currentMemberId={currentMember.id} />}
    </div>
  );
};

export default App;
