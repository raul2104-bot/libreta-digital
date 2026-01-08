import React, { useState } from 'react';
import { Member } from '../types';
import { PencilIcon, TrashIcon } from './icons';

interface ManageMembersModalProps {
    isOpen: boolean;
    onClose: () => void;
    members: Member[];
    onUpdateMember: (originalId: number, updatedData: { firstName: string, lastName: string, savingsId: number }) => { success: boolean; error?: string };
    onDeleteMember: (memberId: number) => void;
    currentMemberId: number;
}

const ManageMembersModal: React.FC<ManageMembersModalProps> = ({ isOpen, onClose, members, onUpdateMember, onDeleteMember, currentMemberId }) => {
    const [editingMember, setEditingMember] = useState<Member | null>(null);
    const [editForm, setEditForm] = useState({ firstName: '', lastName: '', savingsId: '' });
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleEditClick = (member: Member) => {
        setEditingMember(member);
        setEditForm({
            firstName: member.firstName,
            lastName: member.lastName,
            savingsId: String(member.savingsId),
        });
        setError('');
    };

    const handleCancelEdit = () => {
        setEditingMember(null);
        setError('');
    };

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEditForm({ ...editForm, [e.target.name]: e.target.value });
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        const savingsIdNum = parseInt(editForm.savingsId, 10);
        if (isNaN(savingsIdNum) || !editForm.firstName.trim() || !editForm.lastName.trim()) {
            setError('Todos los campos son obligatorios y el ID debe ser un número.');
            return;
        }

        if (!editingMember) return;

        const result = onUpdateMember(editingMember.id, {
            firstName: editForm.firstName.trim(),
            lastName: editForm.lastName.trim(),
            savingsId: savingsIdNum,
        });

        if (result.success) {
            setEditingMember(null);
            setError('');
        } else {
            setError(result.error || 'Ocurrió un error al guardar.');
        }
    };
    
    const inputClasses = "block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900 dark:text-white";

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4 transition-opacity duration-300"
            onClick={onClose}
            aria-modal="true"
            role="dialog"
        >
            <div 
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-2xl h-[90vh] flex flex-col p-4 sm:p-8 transform transition-all duration-300"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white" id="manage-members-title">Gestionar Asociados</h2>
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
                <div className="flex-grow overflow-y-auto pr-2 -mr-2">
                    <p className="text-gray-600 dark:text-gray-400 mb-6">Edite la información de los asociados o elimine registros. La eliminación de un asociado es permanente y borrará todos sus datos.</p>
                    <div className="space-y-4">
                        {members.map(member => (
                            <div key={member.id} className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl">
                                {editingMember?.id === member.id ? (
                                    <form onSubmit={handleSave} className="space-y-4 animate-fade-in">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                             <div>
                                                <label htmlFor="firstName" className="text-sm font-medium text-gray-700 dark:text-gray-300">Nombre</label>
                                                <input type="text" name="firstName" value={editForm.firstName} onChange={handleFormChange} className={`mt-1 ${inputClasses}`} />
                                            </div>
                                            <div>
                                                <label htmlFor="lastName" className="text-sm font-medium text-gray-700 dark:text-gray-300">Apellido</label>
                                                <input type="text" name="lastName" value={editForm.lastName} onChange={handleFormChange} className={`mt-1 ${inputClasses}`} />
                                            </div>
                                        </div>
                                        <div>
                                            <label htmlFor="savingsId" className="text-sm font-medium text-gray-700 dark:text-gray-300">ID de Ahorros</label>
                                            <input type="number" name="savingsId" value={editForm.savingsId} onChange={handleFormChange} className={`mt-1 no-spinners ${inputClasses}`} />
                                        </div>
                                        {error && <p className="text-red-500 text-sm">{error}</p>}
                                        <div className="flex justify-end space-x-3 pt-2">
                                            <button type="button" onClick={handleCancelEdit} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md hover:bg-gray-100 dark:hover:bg-gray-500">Cancelar</button>
                                            <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md">Guardar</button>
                                        </div>
                                    </form>
                                ) : (
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-semibold text-gray-800 dark:text-white">{member.firstName} {member.lastName}</p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">ID de Ahorros: {member.id}</p>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <button onClick={() => handleEditClick(member)} className="p-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-500 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/50" aria-label={`Editar a ${member.firstName}`}>
                                                <PencilIcon className="w-5 h-5" />
                                            </button>
                                            <button 
                                                onClick={() => onDeleteMember(member.id)} 
                                                disabled={member.id === currentMemberId} 
                                                className="p-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-500 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50 disabled:opacity-40 disabled:cursor-not-allowed"
                                                aria-label={`Eliminar a ${member.firstName}`}
                                            >
                                                <TrashIcon className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ManageMembersModal;