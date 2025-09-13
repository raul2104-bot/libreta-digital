import React, { useState } from 'react';
import { Member, Transaction } from '../types';
import { MailIcon } from './icons';

interface EmailCsvModalProps {
    isOpen: boolean;
    onClose: () => void;
    member: Member;
    transactions: Transaction[];
    ratesCache: Record<string, number>;
}

const EmailCsvModal: React.FC<EmailCsvModalProps> = ({ isOpen, onClose, member, transactions, ratesCache }) => {
    const [email, setEmail] = useState('candelariacooperativa@gmail.com');
    const [isSending, setIsSending] = useState(false);

    if (!isOpen) return null;

    const generateCsvContent = (): string => {
        const headers = ["ID Transacción", "Fecha", "Categoría", "Descripción", "Referencia", "Monto (Bs)", "Tasa ($)", "Monto ($)"];
        const csvRows = [headers.join(',')];

        const sortedTxs = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        for (const tx of sortedTxs) {
            const rate = ratesCache[tx.date] || 0;
            const amountUsd = rate > 0 ? (tx.amountBs / rate).toFixed(2) : '0.00';
            const row = [
                tx.id,
                tx.date,
                `"${tx.category}"`,
                `"${(tx.description || '').replace(/"/g, '""')}"`,
                `"${tx.reference || ''}"`,
                tx.amountBs,
                rate,
                amountUsd
            ].join(',');
            csvRows.push(row);
        }
        return csvRows.join('\n');
    };

    const handleSendEmail = () => {
        setIsSending(true);
        try {
            const subject = `Historial de Transacciones - ${member.firstName} ${member.lastName} (ID: ${member.savingsId})`;
            const csvContent = generateCsvContent();
            const body = `Hola,\n\nEste es el historial de transacciones en formato CSV para el asociado ${member.firstName} ${member.lastName}.\n\n--- INICIO DE DATOS CSV ---\n\n${csvContent}\n\n--- FIN DE DATOS CSV ---`;

            const mailtoLink = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

            window.location.href = mailtoLink;
            onClose();

        } catch (error) {
            console.error("Error creating mailto link:", error);
            alert("Ocurrió un error al intentar abrir el cliente de correo.");
        } finally {
            setIsSending(false);
        }
    };

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
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Enviar Historial por Correo</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">El historial se adjuntará como texto CSV en un nuevo correo electrónico.</p>

                <div className="space-y-4">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Dirección de Correo del Destinatario
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
                    </div>
                </div>

                <div className="flex justify-end space-x-4 pt-6 mt-6 border-t border-gray-200 dark:border-gray-700">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-500 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        onClick={handleSendEmail}
                        disabled={isSending || !email}
                        className="inline-flex justify-center py-2 px-6 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        {isSending ? 'Preparando...' : 'Enviar Correo'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EmailCsvModal;
