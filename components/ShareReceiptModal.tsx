import React, { useRef, useState } from 'react';
import { Member, Transaction } from '../types';
import TransactionReceipt from './TransactionReceipt';
import { ShareIcon } from './icons';
import * as htmlToImage from 'html-to-image';

interface ShareReceiptModalProps {
    isOpen: boolean;
    onClose: () => void;
    transactions: Transaction[];
    ratesCache: Record<string, number>;
    member: Member;
}

const ShareReceiptModal: React.FC<ShareReceiptModalProps> = ({ isOpen, onClose, transactions, ratesCache, member }) => {
    const receiptRef = useRef<HTMLDivElement>(null);
    const [isSharing, setIsSharing] = useState(false);

    if (!isOpen) return null;

    const handleShare = async () => {
        if (!receiptRef.current || !transactions || transactions.length === 0) {
            alert("No hay transacción para compartir.");
            return;
        }
        setIsSharing(true);
        try {
            const dataUrl = await htmlToImage.toPng(receiptRef.current, { cacheBust: true, pixelRatio: 2 });
            const blob = await (await fetch(dataUrl)).blob();
            
            const reference = transactions[0].reference;
            const fileId = reference ? `ref_${reference}` : transactions[0].id;
    
            const file = new File([blob], `recibo_${fileId}.png`, { type: 'image/png' });
    
            if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    title: 'Comprobante de Depósito',
                    text: `Comprobante de depósito para ${member.firstName} ${member.lastName}.`,
                    files: [file],
                });
            } else {
                const link = document.createElement('a');
                link.download = `recibo_${fileId}.png`;
                link.href = dataUrl;
                link.click();
            }
        } catch (error) {
            console.error('Error al compartir la imagen:', error);
            alert("Ocurrió un error al intentar compartir. Se descargará el archivo en su lugar.");
            if (receiptRef.current) {
                const dataUrl = await htmlToImage.toPng(receiptRef.current);
                const link = document.createElement('a');
                const reference = transactions[0].reference;
                const fileId = reference ? `ref_${reference}` : transactions[0].id;
                link.download = `recibo_${fileId}.png`;
                link.href = dataUrl;
                link.click();
            }
        } finally {
            setIsSharing(false);
        }
    };

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-60 z-[70] flex justify-center items-center p-4 transition-opacity duration-300" 
            onClick={onClose}
            aria-modal="true"
            role="dialog"
        >
            <div 
                className="bg-gray-50 dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-sm p-6 sm:p-8 transform transition-all text-center" 
                onClick={e => e.stopPropagation()}
                aria-labelledby="share-receipt-modal-title"
            >
                <h2 id="share-receipt-modal-title" className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Compartir Comprobante</h2>
                
                <div className="flex justify-center my-6">
                    <TransactionReceipt ref={receiptRef} transactions={transactions} ratesCache={ratesCache} member={member} />
                </div>
                
                <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mt-6">
                     <button
                        type="button"
                        onClick={onClose}
                        className="w-full sm:w-auto inline-flex justify-center px-6 py-3 border border-gray-300 dark:border-gray-500 text-base font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-sm"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleShare}
                        disabled={isSharing}
                        className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors shadow-sm disabled:bg-gray-400"
                    >
                        {isSharing ? (
                            <svg className="animate-spin h-5 w-5 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : (
                            <ShareIcon className="w-5 h-5 mr-2 -ml-1"/>
                        )}
                        {isSharing ? 'Compartiendo...' : 'Compartir'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ShareReceiptModal;
