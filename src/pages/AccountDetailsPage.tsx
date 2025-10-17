import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import ThemedModal from '../components/ThemedModal';

interface AccountDetail {
  id: number;
  accountName: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
}

const AccountDetailsPage: React.FC = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [accountDetails, setAccountDetails] = useState<AccountDetail[]>([]);
  const [form, setForm] = useState({
    accountName: '',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
  });
  const [qrCodePdf, setQrCodePdf] = useState<File | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [modal, setModal] = useState({ isOpen: false, title: '', message: '' });

  const showModal = (title: string, message: string) => {
    setModal({ isOpen: true, title, message });
  };

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    fetchAccountDetails();
  }, []);

  const fetchAccountDetails = async () => {
    try {
      const response = await axios.get('/api/admin/accounts');
      setAccountDetails(response.data);
    } catch (err) {
      showModal('Error', 'Failed to fetch account details. Please try again later.');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('accountName', form.accountName);
    formData.append('bankName', form.bankName);
    formData.append('accountNumber', form.accountNumber);
    formData.append('ifscCode', form.ifscCode);
    if (qrCodePdf) {
      formData.append('qrCodePdf', qrCodePdf);
    }

    try {
      const url = editingId
        ? `/api/admin/accounts/${editingId}`
        : '/api/admin/accounts';
      const method = editingId ? 'put' : 'post';

      await axios[method](url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      showModal('Success', `Account details ${editingId ? 'updated' : 'added'} successfully!`);
      setForm({ accountName: '', bankName: '', accountNumber: '', ifscCode: '' });
      setQrCodePdf(null);
      setEditingId(null);
      fetchAccountDetails();
    } catch (err) {
      showModal('Error', 'Failed to save account details.');
    }
  };

  const handleEdit = (account: AccountDetail) => {
    setForm({ accountName: account.accountName, bankName: account.bankName, accountNumber: account.accountNumber, ifscCode: account.ifscCode });
    setEditingId(account.id);
  };

  const handleDelete = (id: number) => {
    setDeletingId(id);
    setModal({
      isOpen: true,
      title: 'Confirm Deletion',
      message: 'Are you sure you want to delete this account detail?'
    });
  };

  const confirmDelete = async () => {
    if (deletingId === null) return;
    try {
      await axios.delete(`/api/admin/accounts/${deletingId}`);
      showModal('Success', 'Account details deleted successfully!');
      fetchAccountDetails();
    } catch (err) {
      showModal('Error', 'Failed to delete account details.');
    }
    setModal({ isOpen: false, title: '', message: '' });
    setDeletingId(null);
  };


  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-3xl font-bold mb-6">Manage Account Details</h1>

      <ThemedModal
        isOpen={modal.isOpen}
        onClose={() => setModal({ isOpen: false, title: '', message: '' })}
        title={modal.title}
        message={modal.message}
        onConfirm={modal.title === 'Confirm Deletion' ? confirmDelete : undefined}
        showConfirmButton={modal.title === 'Confirm Deletion'}
      />

      <div className="bg-gray-800 p-6 rounded-lg shadow-lg mb-8">
        <h2 className="text-xl font-semibold mb-4">{editingId ? 'Edit Account Detail' : 'Add New Account Detail'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="accountName" className="block text-sm font-medium text-gray-300">Account Name</label>
            <input
              type="text"
              id="accountName"
              name="accountName"
              value={form.accountName}
              onChange={handleChange}
              className="mt-1 block w-full p-2 border border-gray-600 rounded-md bg-gray-200 text-black"
              required
            />
          </div>
          <div>
            <label htmlFor="bankName" className="block text-sm font-medium text-gray-300">Bank Name</label>
            <input
              type="text"
              id="bankName"
              name="bankName"
              value={form.bankName}
              onChange={handleChange}
              className="mt-1 block w-full p-2 border border-gray-600 rounded-md bg-gray-200 text-black"
              required
            />
          </div>
          <div>
            <label htmlFor="accountNumber" className="block text-sm font-medium text-gray-300">Account Number</label>
            <input
              type="text"
              id="accountNumber"
              name="accountNumber"
              value={form.accountNumber}
              onChange={handleChange}
              className="mt-1 block w-full p-2 border border-gray-600 rounded-md bg-gray-200 text-black"
              required
            />
          </div>
          <div>
            <label htmlFor="ifscCode" className="block text-sm font-medium text-gray-300">IFSC Code</label>
            <input
              type="text"
              id="ifscCode"
              name="ifscCode"
              value={form.ifscCode}
              onChange={handleChange}
              className="mt-1 block w-full p-2 border border-gray-600 rounded-md bg-gray-200 text-black"
              required
            />
          </div>
          <div>
            <label htmlFor="qrCodePdf" className="block text-sm font-medium text-gray-300">QR Code PDF</label>
            <input
                type="file"
                id="qrCodePdf"
                name="qrCodePdf"
                onChange={(e) => setQrCodePdf(e.target.files ? e.target.files[0] : null)}
                className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                accept="application/pdf"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
          >
            {editingId ? 'Update Account' : 'Add Account'}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={() => { setEditingId(null); setForm({ accountName: '', bankName: '', accountNumber: '', ifscCode: '' }); }}
              className="ml-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition"
            >
              Cancel
            </button>
          )}
        </form>
      </div>

      <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
        <h2 className="text-xl font-semibold mb-4">Existing Account Details</h2>
        {accountDetails.length === 0 ? (
          <p>No account details added yet.</p>
        ) : (
          <ul className="space-y-4">
            {accountDetails.map((account) => (
              <li key={account.id} className="bg-gray-700 p-4 rounded-md flex justify-between items-center">
                <div>
                  <p className="font-semibold">{account.accountName} ({account.bankName})</p>
                  <p className="text-sm text-gray-300">Account No: {account.accountNumber}</p>
                  <p className="text-sm text-gray-300">IFSC: {account.ifscCode}</p>
                </div>
                <div>
                  <button
                    onClick={() => handleEdit(account)}
                    className="px-3 py-1 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(account.id)}
                    className="ml-2 px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 transition text-sm"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default AccountDetailsPage;