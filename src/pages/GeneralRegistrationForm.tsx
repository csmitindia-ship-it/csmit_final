import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

interface GeneralRegistrationFormProps {
  eventName: string;
  userName: string;
  userEmail: string;
  symposium: string;
  eventId: string;
  registrationFees: number;
}

const GeneralRegistrationForm: React.FC<GeneralRegistrationFormProps> = ({ eventName, userName, userEmail, symposium, eventId, registrationFees }) => {
  const { user } = useAuth();
  const [transactionId, setTransactionId] = useState<string>('');
  const [transactionUsername, setTransactionUsername] = useState<string>('');
  const [transactionTime, setTransactionTime] = useState<string>('');
  const [transactionDate, setTransactionDate] = useState<string>('');
  const [transactionAmount, setTransactionAmount] = useState<number | ''>(0);
  const [accountDetails, setAccountDetails] = useState<any>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (eventId) {
      fetchAccountDetails(eventId);
    }
  }, [eventId]);

  useEffect(() => {
    if (accountDetails && accountDetails.qrCodePdf) {
      const buffer = new Uint8Array(accountDetails.qrCodePdf.data);
      const blob = new Blob([buffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setQrCodeUrl(url);

      return () => {
        URL.revokeObjectURL(url);
      };
    }
  }, [accountDetails]);

  const fetchAccountDetails = async (eventId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`/api/admin/accounts/event/${eventId}`);
      if (response.data) {
        setAccountDetails(response.data);
      } else {
        setAccountDetails(null);
        setError('No account details found for this event.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.email) {
      setError('User not logged in.');
      return;
    }
    if (!transactionId || !transactionUsername || !transactionTime || !transactionDate || transactionAmount === '') {
      setError('Please fill in all transaction details.');
      return;
    }

    if (Number(transactionAmount) !== registrationFees) {
      setError(`The entered amount (₹${transactionAmount}) does not match the registration fees (₹${registrationFees}).`);
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const checkResponse = await axios.get(`/api/registrations/check-transaction/${transactionId}`);
      if (checkResponse.data.exists) {
        setError('This transaction ID has already been used.');
        setLoading(false);
        return;
      }

      const response = await axios.post('/api/registrations', {
        userEmail: user.email,
        eventId: eventId,
        transactionId,
        transactionUsername,
        transactionTime,
        transactionDate,
        transactionAmount: Number(transactionAmount),
      });

      setSuccess(response.data.message || 'Registration successful!');
      setTransactionId('');
      setTransactionUsername('');
      setTransactionTime('');
      setTransactionDate('');
      setTransactionAmount(0);
      alert(response.data.message);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message);
      alert('An error occurred during registration. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-8 bg-gray-800/80 p-6 rounded-lg shadow-lg">
      <h2 className="text-xl font-semibold mb-4">Register for {eventName}</h2>
      <div className="mb-4">
        <p><strong>Name:</strong> {userName}</p>
        <p><strong>Email:</strong> {userEmail}</p>
      </div>

      {loading && <p className="text-white">Loading...</p>}
      {error && <p className="text-red-500">Error: {error}</p>}
      {success && <p className="text-green-500">Success: {success}</p>}

      {!loading && !error && accountDetails && (
        <div className="mb-6 p-5 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl shadow-lg border border-purple-700">
          <h3 className="text-2xl font-bold text-purple-300 mb-4 border-b border-purple-600 pb-2">Payment Details</h3>
          <p className="text-gray-200 text-xl mb-4"><strong className="text-purple-400">Amount to Transfer:</strong> ₹{registrationFees}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-lg">
            <p className="text-gray-200"><strong className="text-purple-400">Bank Name:</strong> {accountDetails.bankName}</p>
            <p className="text-gray-200"><strong className="text-purple-400">Account Name:</strong> {accountDetails.accountName}</p>
            <p className="text-gray-200"><strong className="text-purple-400">Account Number:</strong> {accountDetails.accountNumber}</p>
            <p className="text-gray-200"><strong className="text-purple-400">IFSC Code:</strong> {accountDetails.ifscCode}</p>
          </div>
          {qrCodeUrl && (
            <div className="mt-4">
                <a href={qrCodeUrl} target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline">
                    View QR Code PDF
                </a>
            </div>
          )}
          <p className="text-gray-300 mt-4 text-sm italic">Please make the payment to the above account and enter the transaction details below.</p>
        </div>
      )}

      {!loading && !accountDetails && !error && (
        <p className="text-yellow-500 text-center">No payment account details available for this event. Please contact event coordinator.</p>
      )}

      <div className="space-y-4 mt-4">
        <div>
          <label htmlFor="transactionId" className="block text-white text-sm font-bold mb-2">
            Transaction ID:
          </label>
          <input
            type="text"
            id="transactionId"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-gray-700 border-gray-600 text-white"
            value={transactionId}
            onChange={(e) => setTransactionId(e.target.value)}
            placeholder="Enter your transaction ID"
            disabled={loading}
          />
        </div>
        <div>
          <label htmlFor="transactionUsername" className="block text-white text-sm font-bold mb-2">
            Transaction Username:
          </label>
          <input
            type="text"
            id="transactionUsername"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-gray-700 border-gray-600 text-white"
            value={transactionUsername}
            onChange={(e) => setTransactionUsername(e.target.value)}
            placeholder="Name on transaction"
            disabled={loading}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="transactionDate" className="block text-white text-sm font-bold mb-2">
              Transaction Date:
            </label>
            <input
              type="date"
              id="transactionDate"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-gray-700 border-gray-600 text-white"
              value={transactionDate}
              onChange={(e) => setTransactionDate(e.target.value)}
              disabled={loading}
            />
          </div>
          <div>
            <label htmlFor="transactionTime" className="block text-white text-sm font-bold mb-2">
              Transaction Time:
            </label>
            <input
              type="time"
              id="transactionTime"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-gray-700 border-gray-600 text-white"
              value={transactionTime}
              onChange={(e) => setTransactionTime(e.target.value)}
              disabled={loading}
            />
          </div>
        </div>
        <div>
          <label htmlFor="transactionAmount" className="block text-white text-sm font-bold mb-2">
            Transaction Amount:
          </label>
          <input
            type="number"
            id="transactionAmount"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-gray-700 border-gray-600 text-white"
            value={transactionAmount}
            onChange={(e) => setTransactionAmount(Number(e.target.value))}
            placeholder="Enter amount paid"
            disabled={loading}
          />
        </div>
      </div>

      <button type="submit" className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition mt-4">
        Register
      </button>
    </form>
  );
};

export default GeneralRegistrationForm;