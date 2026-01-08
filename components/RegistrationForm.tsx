import React, { useState } from 'react';
import { Member } from '../types';

interface RegistrationFormProps {
  onRegister: (member: Member) => boolean;
  onNavigateToLogin: () => void;
  hasExistingMembers: boolean;
}

const RegistrationForm: React.FC<RegistrationFormProps> = ({ onRegister, onNavigateToLogin, hasExistingMembers }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [savingsId, setSavingsId] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!firstName || !lastName || !savingsId) {
      setError('Nombre, Apellido y ID de Ahorros son obligatorios.');
      return;
    }

    const newMember: Member = {
      id: parseInt(savingsId, 10),
      firstName,
      lastName,
      savingsId: parseInt(savingsId, 10),
      setupComplete: false,
      monthlyProtectionFeeUsd: 3,
      fundContributionUsd: 0.5,
    };

    const success = onRegister(newMember);
    if (!success) {
        setError('El ID de Ahorros ya está en uso. Por favor, intente ingresar.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-800 shadow-2xl rounded-2xl p-8 mb-4">
          <div className="flex flex-col items-center mb-6">
            <svg className="w-14 h-14 text-green-600 dark:text-green-400 mb-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="currentColor">
              <path d="M46,10 L60,34 L50,34 L58,54 L34,54 L42,34 L32,34 L46,10 Z" />
              <path d="M24,18 L38,42 L28,42 L36,62 L12,62 L20,42 L10,42 L24,18 Z" opacity="0.7"/>
            </svg>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white text-center">Registro de Asociado</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1 text-center">Cree su cuenta para la libreta digital</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nombre</label>
              <input type="text" id="firstName" value={firstName} onChange={e => setFirstName(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900 dark:text-white"/>
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Apellido</label>
              <input type="text" id="lastName" value={lastName} onChange={e => setLastName(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900 dark:text-white"/>
            </div>
            <div>
              <label htmlFor="savingsId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">ID de Ahorros</label>
              <input 
                type="number" 
                id="savingsId" 
                value={savingsId} 
                onChange={e => {
                  if (e.target.value.length <= 4) {
                    setSavingsId(e.target.value)
                  }
                }} 
                required 
                className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900 dark:text-white no-spinners"
              />
            </div>

            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            
            <div className="flex justify-center pt-2">
              <button type="submit" className="w-full inline-flex justify-center py-3 px-6 border border-transparent shadow-sm text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">
                Registrarse y Continuar
              </button>
            </div>
          </form>

          {hasExistingMembers && (
            <div className="text-center mt-6">
                <button onClick={onNavigateToLogin} className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">
                    ¿Ya tiene una cuenta? Ingrese aquí
                </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RegistrationForm;