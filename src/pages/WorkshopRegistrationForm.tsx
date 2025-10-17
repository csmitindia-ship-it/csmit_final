import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface CartItem {
  cartId: number;
  eventId: number;
  symposiumName: string;
  eventDetails: {
    eventName: string;
    eventCategory: string;
    eventDescription: string;
    registrationFees: number;
    lastDateForRegistration: string;
    coordinatorName: string;
    coordinatorContactNo: string;
  };
}

interface AccountDetails {
  accountName: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  qrCodePdf?: { type: 'Buffer', data: number[] };
}

interface WorkshopRegistrationFormProps {
  userId: number;
  userName: string;
  userEmail: string;
  paidEvents: CartItem[];
  onRegistrationSuccess: () => void;
  onCancel: () => void;
}

const WorkshopRegistrationForm: React.FC<WorkshopRegistrationFormProps> = ({ userId, userName, paidEvents, onRegistrationSuccess, onCancel }) => {
  const [transactionId, setTransactionId] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [transactionScreenshot, setTransactionScreenshot] = useState<File | null>(null);
  const [accountDetails, setAccountDetails] = useState<AccountDetails | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const totalAmount = paidEvents.reduce((sum, item) => sum + item.eventDetails.registrationFees, 0);

  useEffect(() => {
    const fetchAccountDetails = async () => {
      if (paidEvents.length === 0) return;

      const eventWithHighestFee = paidEvents.reduce((max, event) =>
        event.eventDetails.registrationFees > max.eventDetails.registrationFees ? event : max, paidEvents[0]
      );

      try {
        const response = await axios.get(`/api/admin/accounts/event/${eventWithHighestFee.eventId}`);
        if (response.data) {
          setAccountDetails(response.data);
        } else {
          setError('Could not fetch account details. Please make sure an account is associated with the event.');
        }
      } catch (error) {
        console.error('Error fetching account details:', error);
        setError('Could not fetch account details. Please make sure an account is associated with the event.');
      }
    };

    fetchAccountDetails();
  }, [paidEvents]);

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setTransactionScreenshot(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transactionScreenshot) {
      alert('Please upload a transaction screenshot.');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('userId', userId.toString());
      const eventIds = paidEvents.map(item => item.eventId);
      formData.append('eventIds', JSON.stringify(eventIds));
      formData.append('transactionId', transactionId);
      formData.append('transactionUsername', userName);
      formData.append('transactionTime', new Date().toLocaleTimeString());
      formData.append('transactionDate', new Date().toLocaleDateString());
      formData.append('transactionAmount', totalAmount.toString());
      formData.append('mobileNumber', mobileNumber);
      formData.append('transactionScreenshot', transactionScreenshot);

      await axios.post('/api/registrations', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      onRegistrationSuccess();
    } catch (error) {
      console.error('Registration failed:', error);
      alert(`An error occurred during registration. Please try again.`);
    }
  };

  return (
    <div className="bg-gray-900/80 p-8 rounded-2xl shadow-2xl shadow-purple-500/20 border border-purple-500/30">
      <h2 className="text-3xl font-bold text-white text-center mb-8">Workshop Registration</h2>
      {error && <p className="text-red-500 text-center mb-4">{error}</p>}
      <div className="grid md:grid-cols-2 gap-8">
        {/* Left Column: Event Details */}
        <div className="bg-gray-800/70 p-6 rounded-lg">
          <h3 className="text-xl font-semibold text-purple-300 mb-4">Order Summary</h3>
          <div className="space-y-2 mb-4">
            {paidEvents.map(item => (
              <div key={item.cartId} className="flex justify-between text-gray-300">
                <span>{item.eventDetails.eventName}</span>
                <span>₹{item.eventDetails.registrationFees}</span>
              </div>
            ))}
          </div>
          <hr className="border-gray-700 my-4" />
          <div className="flex justify-between text-white font-bold text-lg">
            <span>Total Amount</span>
            <span>₹{totalAmount}</span>
          </div>
        </div>

        {/* Right Column: Payment and Registration */}
        <div className="bg-gray-800/70 p-6 rounded-lg">
          {accountDetails ? (
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-purple-300 mb-4">Payment Information</h3>
              <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
                <p><strong>Account Name:</strong> {accountDetails.accountName}</p>
                <p><strong>Bank Name:</strong> {accountDetails.bankName}</p>
                <p><strong>Account Number:</strong> {accountDetails.accountNumber}</p>
                <p><strong>IFSC Code:</strong> {accountDetails.ifscCode}</p>
              </div>
              {qrCodeUrl && (
                <div className="mt-4">
                  <h4 className="text-lg font-semibold text-purple-300 mb-2">QR Code</h4>
                  <iframe src={qrCodeUrl} width="100%" height="500px" title="QR Code"></iframe>
                </div>
              )}

              <p className="text-sm text-gray-400 mt-2">Please transfer the total amount to this account and enter the transaction ID below.</p>
            </div>
          ) : (
            <p>Loading account details...</p>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="mobileNumber" className="block text-sm font-medium text-gray-400 mb-2">Mobile Number</label>
              <input
                type="text"
                id="mobileNumber"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
                className="w-full px-4 py-3 bg-gray-700/60 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300"
                required
              />
            </div>
            <div className="mb-4">
              <label htmlFor="transactionId" className="block text-sm font-medium text-gray-400 mb-2">Transaction ID</label>
              <input
                type="text"
                id="transactionId"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                className="w-full px-4 py-3 bg-gray-700/60 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300"
                required
              />
            </div>
            <div className="mb-4">
              <label htmlFor="transactionScreenshot" className="block text-sm font-medium text-gray-400 mb-2">Transaction Screenshot</label>
              <input
                type="file"
                id="transactionScreenshot"
                onChange={handleFileChange}
                className="w-full px-4 py-3 bg-gray-700/60 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300"
                accept="image/jpeg,image/png"
                required
              />
            </div>
            <div className="flex gap-4">
              <button type="button" onClick={onCancel} className="w-full px-4 py-3 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition-transform duration-300">
                Cancel
              </button>
              <button type="submit" className="w-full px-4 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-transform duration-300 shadow-lg glow-button">
                Complete Registration
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default WorkshopRegistrationForm;