import React from 'react';
import { MailIcon } from './icons';

interface HelpModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const FAQItem: React.FC<{ question: string; children: React.ReactNode }> = ({ question, children }) => (
    <details className="group border-b border-gray-200 dark:border-gray-700 py-4">
        <summary className="flex items-center justify-between w-full font-semibold text-lg text-gray-800 dark:text-gray-200 cursor-pointer list-none">
            {question}
            <span className="transition-transform duration-300 transform group-open:rotate-180">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
            </span>
        </summary>
        <div className="mt-4 text-gray-600 dark:text-gray-400 space-y-2 text-base leading-relaxed">
            {children}
        </div>
    </details>
);

const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;
    
    const contactEmail = 'candelariacooperativa@gmail.com';
    const mailtoLink = `mailto:${contactEmail}?subject=${encodeURIComponent('Consulta desde la Libreta Cooperativa Digital')}`;

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4 transition-opacity duration-300"
            onClick={onClose}
            aria-modal="true"
            role="dialog"
        >
            <div 
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-3xl h-[90vh] flex flex-col p-4 sm:p-8 transform transition-all duration-300"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white" id="help-modal-title">Centro de Ayuda</h2>
                    <button 
                        onClick={onClose} 
                        className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        aria-label="Cerrar"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
                <div className="flex-grow overflow-y-auto pr-4 -mr-4">
                    <p className="text-gray-600 dark:text-gray-300 mb-6">Encuentre respuestas a las preguntas más comunes sobre el uso de su libreta digital.</p>
                    
                    <div className="space-y-4">
                        <FAQItem question="Uso General">
                            <p><strong>¿Cómo me registro?</strong></p>
                            <p>En la pantalla de inicio, seleccione "No tengo una cuenta". Complete su nombre, apellido, ID de ahorros (su número de asociado) y, opcionalmente, su ID de protección social. Luego, complete la configuración inicial con sus saldos actuales.</p>
                            <p><strong>¿Para qué sirve la tasa de cambio?</strong></p>
                            <p>La tasa de cambio se usa para convertir los montos de sus depósitos en Bolívares (Bs) a Dólares ($). Esto permite mantener todos sus saldos (ahorros, préstamos) en un valor de referencia estable. Es crucial ingresarla correctamente en cada transacción.</p>
                             <p><strong>¿Cómo puedo exportar mi historial?</strong></p>
                            <p>Haga clic en el botón "Exportar CSV" en la pantalla principal. Podrá descargar un archivo CSV con todo su historial o enviarlo directamente a un correo electrónico.</p>
                        </FAQItem>

                        <FAQItem question="Protección Social">
                            <p><strong>¿Qué es la Protección Social y el Fondo Especial?</strong></p>
                            <p>La Protección Social es un servicio solidario ofrecido por la cooperativa. Al registrar un pago, se distribuye automáticamente el monto correspondiente a la cuota del servicio y al aporte del Fondo Especial, según lo configurado.</p>
                            <p><strong>¿Cómo se calcula el pago?</strong></p>
                            <p>Puede pagar varios meses a la vez. Simplemente seleccione "Pagar Protección Social" e indique la cantidad de meses. El sistema calculará el total a pagar (Cuota de Protección x Meses + Aporte a Fondo x Meses).</p>
                        </FAQItem>
                        
                        <FAQItem question="Préstamos">
                             <p><strong>¿Cómo registro un nuevo préstamo?</strong></p>
                            <p>Use el botón "Registrar Nuevo Préstamo". Ingrese el monto total que le fue otorgado, la fecha de inicio, la frecuencia de pago y el monto de cada cuota. Esto se sumará a su saldo deudor actual.</p>
                             <p><strong>¿Cómo se abona al préstamo?</strong></p>
                            <p>Al registrar un nuevo depósito, ingrese la cantidad que desea abonar en el campo "Abono a Préstamo ($)". Este monto se restará del total depositado, y el restante se irá a sus ahorros.</p>
                        </FAQItem>

                        <FAQItem question="Certificado de Aportación">
                             <p><strong>¿Qué es el Certificado de Aportación?</strong></p>
                            <p>Es un capital que cada asociado debe tener en la cooperativa. Durante la configuración inicial, puede establecer el valor total de su certificado. La aplicación le mostrará cuánto le falta por pagar.</p>
                            <p><strong>¿Cómo pago mi certificado?</strong></p>
                            <p>Al igual que con los préstamos, al registrar un depósito, puede destinar una parte del monto al "Abono a Certificado ($)". El sistema llevará el control de su saldo pendiente hasta que esté completamente pagado.</p>
                        </FAQItem>
                    </div>

                    <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 text-center">
                        <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-3">¿Necesitas más ayuda?</h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">Si no encontraste la respuesta a tu pregunta, no dudes en contactarnos.</p>
                        <a href={mailtoLink} className="inline-flex items-center justify-center px-5 py-2.5 text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 rounded-lg dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800 transition-colors">
                            <MailIcon className="w-5 h-5 mr-2" />
                            Contactar a la Cooperativa
                        </a>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default HelpModal;