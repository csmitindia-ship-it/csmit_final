import React, { useState } from 'react';

interface PaymentFormProps {
  totalAmount: number;
  onPaymentSuccess: () => void;
}

const PaymentForm: React.FC<PaymentFormProps> = ({ totalAmount, onPaymentSuccess }) => {
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');

  const handlePayment = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Payment Details:', { cardNumber, expiry, cvc, totalAmount });
    alert('Payment Successful!');
    onPaymentSuccess();
  };

  return (
    <div className="bg-gray-800/80 p-6 rounded-lg w-full max-w-md">
      <h2 className="text-xl font-semibold mb-4">Payment Details</h2>
      <p className="mb-4">Total Amount: <strong>₹{totalAmount}</strong></p>
      <form onSubmit={handlePayment}>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-400 mb-2">Card Number</label>
          <input 
            type="text" 
            value={cardNumber}
            onChange={(e) => setCardNumber(e.target.value)}
            className="w-full px-4 py-3 bg-gray-700/60 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="0000 0000 0000 0000"
          />
        </div>
        <div className="flex gap-4 mb-4">
          <div className="w-1/2">
            <label className="block text-sm font-medium text-gray-400 mb-2">Expiry Date</label>
            <input 
              type="text" 
              value={expiry}
              onChange={(e) => setExpiry(e.target.value)}
              className="w-full px-4 py-3 bg-gray-700/60 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="MM/YY"
            />
          </div>
          <div className="w-1/2">
            <label className="block text-sm font-medium text-gray-400 mb-2">CVC</label>
            <input 
              type="text" 
              value={cvc}
              onChange={(e) => setCvc(e.target.value)}
              className="w-full px-4 py-3 bg-gray-700/60 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="123"
            />
          </div>
        </div>
        <button type="submit" className="w-full px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 transition">
          Pay Now
        </button>
      </form>
    </div>
  );
};

export default PaymentForm;
