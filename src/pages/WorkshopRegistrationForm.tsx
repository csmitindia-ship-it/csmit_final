import React, { useState, useEffect } from 'react';
import API_BASE_URL from '../Config'; // adjust path if needed
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

interface CartItem {
  cartId: number;
  type: 'event' | 'pass' | 'accommodation';
  eventId?: number;
  passId?: number;
  symposiumName?: string;
  eventDetails?: {
    eventName: string;
    eventCategory: string;
    eventDescription: string;
    registrationFees: number;
    lastDateForRegistration: string;
    coordinatorName: string;
    coordinatorContactNo: string;
    discountPercentage?: number;
    discountReason?: string;
  };
  passDetails?: {
    name: string;
    cost: number;
    description: string;
  };
  accommodationDetails?: {
    name: string;
    cost: number;
    quantity: number;
  };
  gender?: 'male' | 'female';
}

interface AccountDetails {
  accountName: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  qrCodePdf?: { type: 'Buffer', data: number[] };
}

interface WorkshopRegistrationFormProps {
  cartItems: CartItem[]; // Updated prop name to match CartPage
  onRegistrationSuccess: () => void;
  onCancel: () => void;
}

const WorkshopRegistrationForm: React.FC<WorkshopRegistrationFormProps> = ({
  cartItems,
  onRegistrationSuccess,
  onCancel
}) => {
  const { user } = useAuth();
  const [transactionId, setTransactionId] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [transactionDate, setTransactionDate] = useState('');
  const [transactionTime, setTransactionTime] = useState('');
  const [transactionScreenshot, setTransactionScreenshot] = useState<File | null>(null);
  const [accountDetails, setAccountDetails] = useState<AccountDetails | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Calculate Total Amount with Discount
  const totalAmount = (cartItems || []).reduce((sum, item) => {
    if (item.type === 'event' && item.eventDetails) {
      const original = item.eventDetails.registrationFees;
      const discount = item.eventDetails.discountPercentage || 0;
      const discountedPrice = Math.floor(original * (1 - discount / 100));
      return sum + discountedPrice;
    } else if (item.type === 'pass' && item.passDetails) {
      return sum + item.passDetails.cost;
    } else if (item.type === 'accommodation' && item.accommodationDetails) {
      return sum + (item.accommodationDetails.cost * item.accommodationDetails.quantity);
    }
    return sum;
  }, 0);

  useEffect(() => {
    const fetchAccountDetails = async () => {
      if (!cartItems || cartItems.length === 0) return;
      const accommodationItem = cartItems.find(item => item.type === 'accommodation');
      const events = cartItems.filter(item => item.type === 'event' && item.eventDetails);
      const passes = cartItems.filter(item => item.type === 'pass' && item.passDetails);
      let accountIdToFetch: number | undefined;

      if (accommodationItem) {
        try {
          const accomResponse = await axios.get(`${API_BASE_URL}/accommodation`);
          const accomData = accomResponse.data;
          const genderAccommodation = accomData.find((a: any) => a.gender === accommodationItem.gender);
          if (genderAccommodation && genderAccommodation.accountId) {
            accountIdToFetch = genderAccommodation.accountId;
          }
        } catch (error) {
          console.error('Error fetching accommodation details:', error);
        }
      }

      if (!accountIdToFetch && events.length > 0) {
        const eventWithHighestFee = events.reduce((max, event) => {
          const maxFee = max.eventDetails?.registrationFees || 0;
          const currFee = event.eventDetails?.registrationFees || 0;
          return currFee > maxFee ? event : max;
        }, events[0]);
        if (eventWithHighestFee && eventWithHighestFee.eventId) {
          const response = await axios.get(`${API_BASE_URL}/accounts/event/${eventWithHighestFee.eventId}`);
          if (response.data) {
            setAccountDetails(response.data);
          }
          return;
        }
      }

      // Check for Passes if no accommodation or events priority
      if (!accountIdToFetch && passes.length > 0) {
        const pass = passes[0];
        if (pass.passId) {
          try {
            const response = await axios.get(`${API_BASE_URL}/accounts/pass/${pass.passId}`);
            if (response.data) {
              setAccountDetails(response.data);
            }
            return;
          } catch (error) {
            console.error('Error fetching pass account details:', error);
          }
        }
      }

      if (accountIdToFetch) {
        try {
          const response = await axios.get(`${API_BASE_URL}/accounts/${accountIdToFetch}`);
          if (response.data) {
            setAccountDetails(response.data);
          } else {
            setError('Could not fetch account details for accommodation.');
          }
        } catch (error) {
          console.error('Error fetching account details for accommodation:', error);
          setError('Could not fetch account details for accommodation.');
        }
      } else if (events.length === 0 && passes.length === 0) {
        setError('No account details could be fetched. Please add an event, pass, or accommodation with an associated account to your cart.');
      }
    };

    fetchAccountDetails();
  }, [cartItems]);

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

    if (!user || !user.id) {
      alert('You must be logged in to register.');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('userId', user.id.toString());

      const eventIds = cartItems.filter(item => item.type === 'event').map(item => item.eventId);
      const passIds = cartItems.filter(item => item.type === 'pass').map(item => item.passId);
      const accommodationItem = cartItems.find(item => item.type === 'accommodation');

      if (accommodationItem) {
        formData.append('accommodation', JSON.stringify(accommodationItem));
      }

      formData.append('eventIds', JSON.stringify(eventIds));
      formData.append('passIds', JSON.stringify(passIds));

      formData.append('transactionId', transactionId);
      formData.append('transactionTime', transactionTime);
      formData.append('transactionDate', transactionDate);
      formData.append('transactionAmount', totalAmount.toString());
      formData.append('mobileNumber', mobileNumber);
      formData.append('transactionScreenshot', transactionScreenshot);

      // Main registration for events and passes
      await axios.post(`${API_BASE_URL}/registrations`, formData, {
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
    <div className="p-8 rounded-2xl">
      <h2 className="text-3xl font-bold text-white text-center mb-8">Registration</h2>
      {error && <p className="text-red-500 text-center mb-4">{error}</p>}
      <div className="grid md:grid-cols-2 gap-8">
        {/* Left Column: Order Summary */}
        <div className="bg-gray-800/70 p-6 rounded-lg">
          <h3 className="text-xl font-semibold text-purple-300 mb-4">Order Summary</h3>
          <div className="space-y-4 mb-4">
            {cartItems && cartItems.map(item => {
              if (item.type === 'event' && item.eventDetails) {
                const originalPrice = item.eventDetails.registrationFees;
                const discount = item.eventDetails.discountPercentage || 0;
                const discountedPrice = Math.floor(originalPrice * (1 - discount / 100));

                return (
                  <div key={item.cartId} className="flex justify-between items-center text-gray-300 border-b border-gray-700 pb-2 last:border-0">
                    <div>
                      <span className="block font-medium">{item.eventDetails.eventName}</span>
                      {discount > 0 && (
                        <span className="text-xs text-yellow-500">{discount}% Off Applied</span>
                      )}
                    </div>
                    <div className="text-right">
                      {discount > 0 ? (
                        <>
                          <span className="block text-xs line-through text-red-400">₹{originalPrice}</span>
                          <span className="block text-green-400 font-bold">₹{discountedPrice}</span>
                        </>
                      ) : (
                        <span>₹{originalPrice}</span>
                      )}
                    </div>
                  </div>
                );
              } else if (item.type === 'pass' && item.passDetails) {
                return (
                  <div key={item.cartId} className="flex justify-between items-center text-gray-300 border-b border-gray-700 pb-2 last:border-0">
                    <span className="font-medium">{item.passDetails.name}</span>
                    <span>₹{item.passDetails.cost}</span>
                  </div>
                );
              } else if (item.type === 'accommodation' && item.accommodationDetails) {
                return (
                  <div key={item.cartId} className="flex justify-between items-center text-gray-300 border-b border-gray-700 pb-2 last:border-0">
                    <div>
                      <span className="font-medium">{item.accommodationDetails.name}</span>
                      <span className="block text-xs text-gray-400">Quantity: {item.accommodationDetails.quantity}</span>
                    </div>
                    <span>₹{item.accommodationDetails.cost * item.accommodationDetails.quantity}</span>
                  </div>
                );
              }
              return null;
            })}
          </div>
          <hr className="border-gray-700 my-4" />
          <div className="flex justify-between text-white font-bold text-lg">
            <span>Total Amount</span>
            <span className="text-green-400">₹{totalAmount}</span>
          </div>
        </div>

        {/* Right Column: Payment and Registration */}
        <div className="bg-gray-800/70 p-6 rounded-lg">
          {accountDetails ? (
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-purple-300 mb-4">Payment Information</h3>
              <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700 text-sm">
                <p><strong>Account Name:</strong> {accountDetails.accountName}</p>
                <p><strong>Bank Name:</strong> {accountDetails.bankName}</p>
                <p><strong>Account Number:</strong> {accountDetails.accountNumber}</p>
                <p><strong>IFSC Code:</strong> {accountDetails.ifscCode}</p>
              </div>
              {qrCodeUrl && (
                <div className="mt-4 flex justify-center">
                  <object data={qrCodeUrl} type="application/pdf" width="200px" height="200px" className="rounded-lg overflow-hidden border border-white">
                    <p>Your browser does not support PDFs. <a href={qrCodeUrl} target="_blank" rel="noreferrer" className="text-blue-400 underline">View QR Code</a></p>
                  </object>
                </div>
              )}

              <p className="text-sm text-gray-400 mt-4 bg-yellow-900/20 p-2 rounded border border-yellow-700/50">
                Please transfer <strong>₹{totalAmount}</strong> to the account above and upload the screenshot below.
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-center h-40">
              <p className="text-gray-400 animate-pulse">Loading account details...</p>
            </div>
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
                placeholder="Enter your mobile number"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="transactionDate" className="block text-sm font-medium text-gray-400 mb-2">
                  Transaction Date
                </label>
                <input
                  type="date"
                  id="transactionDate"
                  className="w-full px-4 py-3 bg-gray-700/60 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300"
                  value={transactionDate}
                  onChange={(e) => setTransactionDate(e.target.value)}
                  required
                />
              </div>
              <div>
                <label htmlFor="transactionTime" className="block text-sm font-medium text-gray-400 mb-2">
                  Transaction Time
                </label>
                <input
                  type="time"
                  id="transactionTime"
                  className="w-full px-4 py-3 bg-gray-700/60 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300"
                  value={transactionTime}
                  onChange={(e) => setTransactionTime(e.target.value)}
                  required
                />
              </div>
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
                placeholder="Enter UPI / Bank Transaction ID"
              />
            </div>
            <div className="mb-6">
              <label htmlFor="transactionScreenshot" className="block text-sm font-medium text-gray-400 mb-2">Transaction Screenshot (Limit: 5MB)</label>
              <input
                type="file"
                id="transactionScreenshot"
                onChange={handleFileChange}
                className="w-full px-4 py-3 bg-gray-700/60 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300"
                accept="image/jpeg,image/png,application/pdf"
                required
              />
            </div>
            <div className="flex gap-4">
              <button type="button" onClick={onCancel} className="w-1/3 px-4 py-3 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition-transform duration-300">
                Cancel
              </button>
              <button type="submit" className="w-2/3 px-4 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-transform duration-300 shadow-lg glow-button">
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
