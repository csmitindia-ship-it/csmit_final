import React, { useState, useEffect } from 'react';
import API_BASE_URL from '../Config';
import ThemedModal from '../components/ThemedModal';
 
interface Pass {
    id: number;
    name: string;
    cost: number;
    pass_limit: number;
    description: string;
    accountId?: number;
}

interface Account {
    id: number;
    accountName: string;
    bankName: string;
    accountNumber: string;
}

const ManagePassesPage: React.FC = () => {
    const [passes, setPasses] = useState<Pass[]>([]);
    const [passName, setPassName] = useState('');
    const [passCost, setPassCost] = useState('');
    const [passLimit, setPassLimit] = useState('');
    const [passDescription, setPassDescription] = useState('');
    const [selectedAccountId, setSelectedAccountId] = useState<string>('');
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [isUpdating, setIsUpdating] = useState<Pass | null>(null);
    const [newLimit, setNewLimit] = useState('');
    const [newDescription, setNewDescription] = useState('');
    const [newAccountId, setNewAccountId] = useState<string>('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalTitle, setModalTitle] = useState('');
    const [modalMessage, setModalMessage] = useState('');

    useEffect(() => {
        fetchPasses();
        fetchAccounts();
    }, []);

    const fetchAccounts = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/accounts`);
            if (response.ok) {
                const data = await response.json();
                setAccounts(data);
            }
        } catch (error) {
            console.error('Error fetching accounts:', error);
        }
    };

    const fetchPasses = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/passes`);
            if (response.ok) {
                const data = await response.json();
                setPasses(data);
            }
        } catch (error) {
            console.error('Error fetching passes:', error);
        }
    };

    const handleCreatePass = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await fetch(`${API_BASE_URL}/passes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: passName, cost: passCost, pass_limit: passLimit, description: passDescription, accountId: selectedAccountId }),
            });
            if (response.ok) {
                fetchPasses();
                setPassName('');
                setPassCost('');
                setPassLimit('');
                setPassDescription('');
                setSelectedAccountId('');
                setModalTitle('Success');
                setModalMessage('Pass created successfully!');
                setIsModalOpen(true);
            } else {
                const errorData = await response.json();
                setModalTitle('Error');
                setModalMessage(errorData.message || 'Failed to create pass.');
                setIsModalOpen(true);
            }
        } catch (error) {
            console.error('Error creating pass:', error);
            setModalTitle('Error');
            setModalMessage('An unexpected error occurred.');
            setIsModalOpen(true);
        }
    };

    const handleUpdatePass = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isUpdating) return;

        try {
            const response = await fetch(`${API_BASE_URL}/passes/${isUpdating.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pass_limit: newLimit, description: newDescription, accountId: newAccountId }),
            });
            if (response.ok) {
                fetchPasses();
                setIsUpdating(null);
                setNewLimit('');
                setNewDescription('');
                setNewAccountId('');
                setModalTitle('Success');
                setModalMessage('Pass updated successfully!');
                setIsModalOpen(true);
            } else {
                const errorData = await response.json();
                setModalTitle('Error');
                setModalMessage(errorData.message || 'Failed to update pass.');
                setIsModalOpen(true);
            }
        } catch (error) {
            console.error('Error updating pass limit:', error);
            setModalTitle('Error');
            setModalMessage('An unexpected error occurred.');
            setIsModalOpen(true);
        }
    };

    const handleDeletePass = async (passId: number) => {
        if (window.confirm('Are you sure you want to delete this pass?')) {
            try {
                const response = await fetch(`${API_BASE_URL}/passes/${passId}`, {
                    method: 'DELETE',
                });
                if (response.ok) {
                    fetchPasses();
                    setModalTitle('Success');
                    setModalMessage('Pass deleted successfully!');
                    setIsModalOpen(true);
                } else {
                    const errorData = await response.json();
                    console.error('Error deleting pass:', errorData);
                    setModalTitle('Error');
                    setModalMessage(errorData.message || 'Failed to delete pass.');
                    setIsModalOpen(true);
                }
            } catch (error) {
                console.error('Error deleting pass:', error);
                setModalTitle('Error');
                setModalMessage('An unexpected error occurred.');
                setIsModalOpen(true);
            }
        }
    };

    return (
        <div className="container mx-auto p-4">
            <ThemedModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                title={modalTitle}
                message={modalMessage}
            />
            <h1 className="text-2xl font-bold mb-4">Manage Passes</h1>

            <div className="mb-8 p-6 bg-white rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4">Create New Pass</h2>
                <form onSubmit={handleCreatePass} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="form-group">
                        <label htmlFor="passName" className="block text-sm font-medium text-gray-700">Pass Name</label>
                        <input
                            type="text"
                            id="passName"
                            value={passName}
                            onChange={(e) => setPassName(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-gray-900 bg-white"
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="passCost" className="block text-sm font-medium text-gray-700">Pass Cost</label>
                        <input
                            type="number"
                            id="passCost"
                            value={passCost}
                            onChange={(e) => setPassCost(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-gray-900 bg-white"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="passLimit" className="block text-sm font-medium text-gray-700">Pass Limit</label>
                        <input
                            type="number"
                            id="passLimit"
                            value={passLimit}
                            onChange={(e) => setPassLimit(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-gray-900 bg-white"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="accountId" className="block text-sm font-medium text-gray-700">Account</label>
                        <select
                            id="accountId"
                            value={selectedAccountId}
                            onChange={(e) => setSelectedAccountId(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-gray-900 bg-white"
                            required
                        >
                            <option value="">Select an Account</option>
                            {accounts.map(account => (
                                <option key={account.id} value={account.id}>
                                    {`${account.accountName} - ${account.bankName} (****${account.accountNumber.slice(-4)})`}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group md:col-span-2">
                        <label htmlFor="passDescription" className="block text-sm font-medium text-gray-700">Pass Description</label>
                        <textarea
                            id="passDescription"
                            value={passDescription}
                            onChange={(e) => setPassDescription(e.target.value)}
                            rows={3}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-gray-900 bg-white"
                        />
                    </div>
                    <div className="md:col-span-2 flex justify-end">
                        <button
                            type="submit"
                            className="w-full md:w-auto bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            Create Pass
                        </button>
                    </div>
                </form>
            </div>

            <div>
                <h2 className="text-xl font-semibold mb-4">Existing Passes</h2>
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white rounded-lg shadow-md">
                        <thead className="bg-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pass Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Limit</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {passes.map((pass) => (
                                <tr key={pass.id} className="text-gray-900">
                                    <td className="px-6 py-4 whitespace-nowrap">{pass.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">₹{pass.cost}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{pass.pass_limit}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{accounts.find(acc => acc.id === pass.accountId)?.accountName || 'N/A'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap max-w-xs truncate">{pass.description}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <button 
                                            onClick={() => {
                                                setIsUpdating(pass);
                                                setNewLimit(String(pass.pass_limit));
                                                setNewDescription(pass.description || '');
                                                setNewAccountId(String(pass.accountId || ''));
                                            }}
                                            className="text-indigo-600 hover:text-indigo-900"
                                        >
                                            Update
                                        </button>
                                        <button 
                                            onClick={() => handleDeletePass(pass.id)}
                                            className="text-red-600 hover:text-red-900 ml-4"
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {isUpdating && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
                    <div className="bg-white p-8 rounded-lg shadow-xl">
                        <h2 className="text-xl font-bold mb-4">Update Pass for {isUpdating.name}</h2>
                        <form onSubmit={handleUpdatePass}>
                            <div className="mb-4">
                                <label htmlFor="newLimit" className="block text-sm font-medium text-gray-700">New Limit</label>
                                <input
                                    type="number"
                                    id="newLimit"
                                    value={newLimit}
                                    
                                    onChange={(e) => setNewLimit(e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-gray-900 bg-white" required
                                />
                            </div>
                            <div className="mb-4">
                                <label htmlFor="newAccountId" className="block text-sm font-medium text-gray-700">Account</label>
                                <select
                                    id="newAccountId"
                                    value={newAccountId}
                                    onChange={(e) => setNewAccountId(e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-gray-900 bg-white"
                                    required
                                >
                                    <option value="">Select an Account</option>
                                    {accounts.map(account => (
                                        <option key={account.id} value={account.id}>
                                            {`${account.accountName} - ${account.bankName} (****${account.accountNumber.slice(-4)})`}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="newDescription" className="block text-sm font-medium text-gray-700">New Description</label>
                                <textarea
                                    id="newDescription"
                                    value={newDescription}
                                    onChange={(e) => setNewDescription(e.target.value)}
                                    rows={3}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-gray-900 bg-white"
                                />
                            </div>
                            <div className="mt-6 flex justify-end gap-4">
                                <button type="button" onClick={() => setIsUpdating(null)} className="bg-gray-300 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-400">
                                    Cancel
                                </button>
                                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                                    Update
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManagePassesPage;