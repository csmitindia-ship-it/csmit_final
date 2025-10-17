import React, { useState, useEffect } from 'react';
import ThemedModal from './ThemedModal';
import { useAuth } from '../context/AuthContext'; // Corrected import
import API_BASE_URL from './Config'; // adjust path if needed

interface WorkshopRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: any; // TODO: Define a proper interface for event
  isRegistered: boolean;
}

const WorkshopRegistrationModal: React.FC<WorkshopRegistrationModalProps> = ({ // Force recompile
  isOpen,
  onClose,
  event,
  isRegistered,
}) => {
  const { user } = useAuth(); // Corrected usage
  const [transactionId, setTransactionId] = useState<string>('');
  const [transactionUsername, setTransactionUsername] = useState<string>('');
  const [transactionTime, setTransactionTime] = useState<string>('');
  const [transactionDate, setTransactionDate] = useState<string>('');
  const [transactionAmount, setTransactionAmount] = useState<number | ''>(0);
  const [accountDetails, setAccountDetails] = useState<any>(null); // TODO: Define interface
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && event?.id) {
      fetchAccountDetails(event.id);
    }
  }, [isOpen, event?.id]);

  const fetchAccountDetails = async (eventId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/events/${eventId}/accounts`); // Absolute URL
      const responseText = await response.text(); // Consume body as text once

      if (!response.ok) {
        console.error('Failed to fetch account details. Response (not ok):', responseText);
        throw new Error(`Failed to fetch account details: ${response.status} ${response.statusText}. Details: ${responseText.substring(0, 100)}`);
      }
      
      let data;
      try {
        data = JSON.parse(responseText); // Parse the consumed text
      } catch (jsonError: any) {
        console.error('Failed to parse JSON for account details. Raw response:', responseText, jsonError);
        throw new Error(`Failed to parse account details: ${jsonError.message}. Raw response: ${responseText.substring(0, 100)}`);
      }
      if (data.length > 0) {
        setAccountDetails(data[0]); // Assuming one account per event for now
      } else {
        setAccountDetails(null);
        setError('No account details found for this event.');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegistration = async () => {
    if (!user?.id) {
      setError('User not logged in.');
      return;
    }
    if (!transactionId || !transactionUsername || !transactionTime || !transactionDate || transactionAmount === '') {
      setError('Please fill in all transaction details.');
      return;
    }

    if (Number(transactionAmount) !== event.registrationFees) {
      setError(`The entered amount (₹${transactionAmount}) does not match the registration fees (₹${event.registrationFees}).`);
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // First, check if transaction ID is already used
      const checkResponse = await fetch(`${API_BASE_URL}/registrations/check-transaction/${transactionId}`); // Absolute URL
      const checkResponseText = await checkResponse.text(); // Consume body as text once

      if (!checkResponse.ok) {
        console.error('Failed to check transaction ID. Response (not ok):', checkResponseText);
        throw new Error(`Failed to check transaction ID: ${checkResponse.status} ${checkResponse.statusText}. Details: ${checkResponseText.substring(0, 100)}`);
      }
      let checkData;
      try {
        checkData = JSON.parse(checkResponseText); // Parse the consumed text
      } catch (jsonError: any) {
        console.error('Failed to parse JSON for transaction ID check. Raw response:', checkResponseText, jsonError);
        throw new Error(`Failed to parse transaction ID check: ${jsonError.message}. Raw response: ${checkResponseText.substring(0, 100)}`);
      }
      if (checkData.exists) {
        setError('This transaction ID has already been used.');
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/registrations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          eventId: event.id,
          transactionId,
          transactionUsername,
          transactionTime,
          transactionDate,
          transactionAmount: Number(transactionAmount), // Ensure it's a number
        }),
      });

      const responseText = await response.text(); // Consume body as text once

      if (!response.ok) {
        console.error('Failed to register. Response (not ok):', responseText);
        throw new Error(`Registration failed: ${response.status} ${response.statusText}. Details: ${responseText.substring(0, 100)}`);
      }
      let data;
      try {
        data = JSON.parse(responseText); // Parse the consumed text
      } catch (jsonError: any) {
        console.error('Failed to parse JSON for registration. Raw response:', responseText, jsonError);
        throw new Error(`Failed to parse registration: ${jsonError.message}. Raw response: ${responseText.substring(0, 100)}`);
      }

      setSuccess(data.message || 'Registration successful!');
      setTransactionId(''); // Clear input
      setTransactionUsername('');
      setTransactionTime('');
      setTransactionDate('');
      setTransactionAmount(0);
      // onClose(); // Optionally close modal on success
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Register for ${event?.eventName || 'Workshop'}`}
      className="max-w-md" // Changed from default (likely larger) to md
      hideDefaultFooter={true} // Hide default footer buttons
    >
      {loading && <p className="text-white">Loading...</p>}
      {error && <p className="text-red-500">Error: {error}</p>}
      {success && <p className="text-green-500">Success: {success}</p>}

      {isRegistered && (
        <p className="text-green-500 text-center text-lg font-semibold mb-4">You are already registered for this workshop!</p>
      )}

      {!loading && !error && accountDetails && (
        <div className="mb-6 p-5 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl shadow-lg border border-purple-700">
          <h3 className="text-2xl font-bold text-purple-300 mb-4 border-b border-purple-600 pb-2">Payment Details</h3>
          <p className="text-gray-200 text-xl mb-4"><strong className="text-purple-400">Amount to Transfer:</strong> ₹{event.registrationFees}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-lg">
            <p className="text-gray-200"><strong className="text-purple-400">Bank Name:</strong> {accountDetails.bankName}</p>
            <p className="text-gray-200"><strong className="text-purple-400">Account Name:</strong> {accountDetails.accountName}</p>
            <p className="text-gray-200"><strong className="text-purple-400">Account Number:</strong> {accountDetails.accountNumber}</p>
            <p className="text-gray-200"><strong className="text-purple-400">IFSC Code:</strong> {accountDetails.ifscCode}</p>
          </div>
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
            disabled={loading || isRegistered}
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
            disabled={loading || isRegistered}
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
              disabled={loading || isRegistered}
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
              disabled={loading || isRegistered}
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
            disabled={loading || isRegistered}
          />
        </div>
      </div>

      <div className="flex justify-end space-x-4 mt-6">
        <button
          onClick={handleRegistration}
          className="px-5 py-2 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors"
          disabled={loading || isRegistered || !transactionId || !transactionUsername || !transactionTime || !transactionDate || transactionAmount === '' || !accountDetails}
        >
          Register
        </button>
        <button
          onClick={onClose}
          className="px-5 py-2 bg-gray-500 text-white font-semibold rounded-lg hover:bg-gray-600 transition-colors"
          disabled={loading || isRegistered}
        >
          Cancel
        </button>
      </div>
    </ThemedModal>
  );
};

export default WorkshopRegistrationModal;