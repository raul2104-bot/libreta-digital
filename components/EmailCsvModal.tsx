import React, { useState, useEffect } from 'react';
import { Member, Transaction, TransactionCategory } from '../types';
import { MailIcon, DownloadIcon } from './icons';

interface EmailCsvModalProps {
    isOpen: boolean;
    onClose: () => void;
    member: Member;
    transactions: Transaction[];
    ratesCache: Record<string, number>;
}

const EMAIL_STORAGE_KEY = 'coopLastExportEmail';
const DEFAULT_COOP_EMAIL = 'candelariacooperativa31@gmail.com';

const EmailCsvModal: React.FC<EmailCsvModalProps> = ({ isOpen, onClose, member, transactions, ratesCache }) => {
    const [email, setEmail] = useState(DEFAULT_COOP_EMAIL);
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        if (isOpen) {
            const savedEmail = localStorage.getItem(EMAIL_STORAGE_KEY);
            setEmail(savedEmail || DEFAULT_COOP_EMAIL);
        }
    }, [isOpen]);

    const generateCsvContent = (): string => {
        const headers = [
            "Fecha", "Nombre", "Apellido", "ID de Ahorros",
            "Abono a Ahorros ($)", "Saldo de Ahorros ($)",
            "Abono a Prestamo ($)", "Saldo de Prestamo ($)",
            "Tasa del Día", "Abono a Certificado ($)", "Referencia",
            "Monto Fondo Especial (Bs)", "ID Proteccion Social",
            "Meses Pagados Prot. Soc.", "Monto Prot. Soc. (Bs)"
        ];
        const csvRows = [headers.join(',')];

        const sortedTxs = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        let runningSavingsBalanceUsd = member.initialSavingsUsd || 0;
        let runningLoanBalanceUsd = member.initialLoanUsd || 0;

        for (const tx of sortedTxs) {
            const rate = ratesCache[tx.date] || 0;
            const amountUsd = rate > 0 ? tx.amountBs / rate : 0;

            let savingsDeposit = 0;
            let loanPayment = 0;
            let certificatePayment = 0;
            let fundAmountBs = 0;
            let protectionAmountBs = 0;
            let protectionMonthsPaid = 0;

            switch (tx.category) {
                case TransactionCategory.SAVINGS:
                    runningSavingsBalanceUsd += amountUsd;
                    // Only record positive amounts as deposits, withdrawals are reflected in the balance.
                    if (amountUsd > 0) savingsDeposit = amountUsd;
                    break;
                case TransactionCategory.LOAN:
                    runningLoanBalanceUsd -= amountUsd;
                    loanPayment = amountUsd;
                    break;
                case TransactionCategory.CONTRIBUTION_CERTIFICATE:
                    certificatePayment = amountUsd;
                    break;
                case TransactionCategory.FUND:
                    fundAmountBs = tx.amountBs;
                    break;
                case TransactionCategory.SOCIAL_PROTECTION:
                    protectionAmountBs = tx.amountBs;
                    protectionMonthsPaid = tx.monthsPaid || 0;
                    break;
            }

            const row = [
                tx.date,
                `"${member.firstName}"`,
                `"${member.lastName}"`,
                member.savingsId,
                savingsDeposit.toFixed(2),
                runningSavingsBalanceUsd.toFixed(2),
                loanPayment.toFixed(2),
                runningLoanBalanceUsd.toFixed(2),
                rate.toFixed(2),
                certificatePayment.toFixed(2),
                `"${tx.reference || ''}"`,
                fundAmountBs,
                `"${member.socialProtectionId || ''}"`,
                protectionMonthsPaid,
                protectionAmountBs
            ].join(',');
            csvRows.push(row);
        }
        return csvRows.join('\n');
    };
    
    const handleDownload = () => {
        setIsProcessing(true);
        try {
            const csvContent = generateCsvContent();
            const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            const fileName = `historial_${member.firstName}_${member.lastName}_${member.id}.csv`;
            link.setAttribute('download', fileName);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            onClose();
        } catch (error) {
            console.error("Error downloading CSV:", error);
            alert("Ocurrió un error al intentar descargar el archivo.");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleSendEmail = () => {
        setIsProcessing(true);
        try {
            localStorage.setItem(EMAIL_STORAGE_KEY, email);
            const subject = `Historial de Transacciones - ${member.firstName} ${member.lastName} (ID: ${member.savingsId})`;
            const csvContent = generateCsvContent();
            const body = `Hola,\n\nAdjunto el historial de transacciones en formato CSV para el asociado ${member.firstName} ${member.lastName}.\n\n(Puede copiar el siguiente texto y guardarlo como un archivo .csv)\n\n--- INICIO DE DATOS CSV ---\n\n${csvContent}\n\n--- FIN DE DATOS CSV ---`;

            const mailtoLink = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
            window.location.href = mailtoLink;
            onClose();
        } catch (error) {
            console.error("Error creating mailto link:", error);
            alert("Ocurrió un error al intentar abrir el cliente de correo.");
        } finally {
            setIsProcessing(false);
        }
    };
    
    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4"
            onClick={onClose}
            aria-modal="true"
            role="dialog"
        >
            <div
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md p-8 transform transition-all"
                onClick={e => e.stopPropagation()}
            >
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Exportar Historial Detallado</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">Elija cómo desea exportar el historial de transacciones.</p>

                <div className="space-y-6">
                    <div className="text-center">
                        <button
                            type="button"
                            onClick={handleDownload}
                            disabled={isProcessing}
                            className="w-full inline-flex items-center justify-center py-3 px-6 border border-transparent shadow-sm text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            <DownloadIcon className="w-5 h-5 mr-2" />
                            {isProcessing ? 'Procesando...' : 'Descargar Archivo'}
                        </button>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Guarda el archivo CSV directamente en su dispositivo.</p>
                    </div>

                    <div>
                        <div className="relative my-4">
                            <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                <div className="w-full border-t border-gray-300 dark:border-gray-600" />
                            </div>
                            <div className="relative flex justify-center">
                                <span className="bg-white dark:bg-gray-800 px-2 text-sm text-gray-500 dark:text-gray-400">O</span>
                            </div>
                        </div>

                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Enviar por Correo Electrónico
                        </label>
                        <div className="mt-1 relative rounded-md shadow-sm">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <MailIcon className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="email"
                                name="email"
                                id="email"
                                className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="ejemplo@correo.com"
                            />
                        </div>
                        <button
                            type="button"
                            onClick={handleSendEmail}
                            disabled={isProcessing || !email}
                            className="mt-3 w-full inline-flex items-center justify-center py-3 px-6 border border-transparent shadow-sm text-base font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            <MailIcon className="w-5 h-5 mr-2" />
                            {isProcessing ? 'Enviando...' : 'Enviar Correo'}
                        </button>
                    </div>
                </div>

                <div className="flex justify-end pt-6 mt-6 border-t border-gray-200 dark:border-gray-700">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-500 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EmailCsvModal;