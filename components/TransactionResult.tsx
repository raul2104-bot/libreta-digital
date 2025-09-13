import React, { useRef, useState } from 'react';
import { Member, Transaction } from '../types';
import TransactionReceipt from './TransactionReceipt';
import { PlusCircleIcon, ShareIcon } from './icons';
import * as htmlToImage from 'html-to-image';

interface TransactionResultProps {
  transactions: Transaction[];
  ratesCache: Record<string, number>;
  member: Member;
  onNewTransaction: () => void;
}

const TransactionResult: React.FC<TransactionResultProps> = ({ transactions, ratesCache, member, onNewTransaction }) => {
  const receiptRef = useRef<HTMLDivElement>(null);
  const [isSharing, setIsSharing] = useState(false);

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
          title: 'Recibo de Transacción',
          text: `Recibo de mi última transacción en la Cooperativa.`,
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
      alert("Ocurrió un error al intentar compartir la imagen. Se descargará en su lugar.");
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
    <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg mb-8 text-center animate-fade-in">
        <h2 className="text-2xl font-bold text-green-600 dark:text-green-400 mb-4">Transacción Registrada con Éxito</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">A continuación se muestra el comprobante del depósito realizado.</p>

        <div className="flex justify-center my-6">
            <TransactionReceipt ref={receiptRef} transactions={transactions} ratesCache={ratesCache} member={member} />
        </div>

        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mt-8">
            <button
                onClick={handleShare}
                disabled={isSharing}
                className="inline-flex w-full sm:w-auto items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors shadow-sm disabled:bg-gray-400"
            >
                {isSharing ? (
                    <svg className="animate-spin h-5 w-5 mr-2 -ml-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                ) : (
                    <ShareIcon className="w-5 h-5 mr-2 -ml-1"/>
                )}
                {isSharing ? 'Compartiendo...' : 'Compartir Recibo'}
            </button>
            <button
                onClick={onNewTransaction}
                className="inline-flex w-full sm:w-auto items-center justify-center px-6 py-3 border border-gray-300 dark:border-gray-500 text-base font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors shadow-sm"
            >
                <PlusCircleIcon className="w-5 h-5 mr-2 -ml-1"/>
                Registrar Nuevo Depósito
            </button>
        </div>
    </div>
  );
};

export default TransactionResult;