import React, { useState, useEffect } from 'react';
import API_BASE_URL from '../Config';
import { useAuth } from '../context/AuthContext';

interface Accommodation {
  gender: 'male' | 'female';
  total_rooms: number;
  available_rooms: number;
  fees: number;
}

interface Booking {
  id: number;
  userId: number;
  gender: 'male' | 'female';
  status: 'pending' | 'confirmed' | 'cancelled';
  quantity: number;
  isVerified?: boolean;
}

const AccommodationBooking: React.FC = () => {
  const { user } = useAuth();
  console.log('user', user);
  const [accommodation, setAccommodation] = useState<Accommodation[]>([]);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [selectedGender, setSelectedGender] = useState<'male' | 'female' | ''>('');
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [isInCart, setIsInCart] = useState(false);

  useEffect(() => {
    if (!user) {
      setMessage('Please log in to view accommodation details.');
      setIsLoading(false);
      return;
    }

    const fetchDetails = async () => {
      setIsLoading(true);
      try {
        const accomResponse = await fetch(`${API_BASE_URL}/accommodation`);
        const accomData = await accomResponse.json();
        setAccommodation(accomData);

        const bookingResponse = await fetch(`${API_BASE_URL}/accommodation/bookings/${user.id}`);
        const bookingData = await bookingResponse.json();
        setBooking(bookingData);

        const cartResponse = await fetch(`${API_BASE_URL}/cart/${user.id}`);
        const cartData = await cartResponse.json();
        const accomInCart = cartData.find((item: any) => item.type === 'accommodation');
        if (accomInCart) {
          setIsInCart(true);
          setSelectedGender(accomInCart.gender);
          setQuantity(accomInCart.accommodationDetails?.quantity || 1);
        }

      } catch (error) {
        console.error('Failed to fetch details', error);
        setMessage('Could not load accommodation details.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDetails();
  }, [user]);

  const handleAddToCart = async () => {
    if (!user || !selectedGender) {
      setMessage('Please select a gender.');
      return;
    }
    if (quantity <= 0) {
      setMessage('Quantity must be greater than zero.');
      return;
    }
    setMessage('');
    try {
      const response = await fetch(`${API_BASE_URL}/accommodation/cart`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, gender: selectedGender, quantity }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to add to cart.');
      }
      setMessage('Accommodation added to cart!');
      setIsInCart(true);
    } catch (error: any) {
      setMessage(error.message);
    }
  };

  const handleRemoveFromCart = async () => {
    if (!user) return;
    setMessage('');
    try {
      const response = await fetch(`${API_BASE_URL}/accommodation/cart/${user.id}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to remove from cart.');
      }
      setMessage('Accommodation removed from cart.');
      setIsInCart(false);
      setSelectedGender('');
      setQuantity(1);
    } catch (error: any) {
      setMessage(error.message);
    }
  };

  if (isLoading) {
    return <div>Loading accommodation details...</div>;
  }

  if (!user) {
    return <div className="p-4 rounded-lg bg-yellow-900/50 text-yellow-300 border border-yellow-500/50">
      <h2 className="text-xl font-bold text-white">User Not Logged In</h2>
      <p>Please log in to view and book accommodation.</p>
    </div>;
  }

  if (booking) {
    return (
      <div className="p-4 rounded-lg bg-green-900/50 text-green-300 border border-green-500/50">
        <h2 className="text-xl font-bold text-white">Accommodation Booked</h2>
        <p>You have successfully booked accommodation for {booking.quantity > 1 ? `${booking.quantity} persons` : '1 person'}.</p>
        <p>Gender: {booking.gender}</p>
      </div>
    );
  }

  return (
    <>
      <h2 className="text-3xl font-bold text-white text-center mb-8">Book Accommodation</h2>
      {message && <p className="mb-4 text-center text-yellow-400">{message}</p>}

      <div className="space-y-6">
        <div>
          <label className="block font-semibold mb-2 text-gray-300">Choose Accommodation Type:</label>
          <select
            value={selectedGender}
            onChange={(e) => setSelectedGender(e.target.value as 'male' | 'female')}
            className="w-full px-4 py-3 bg-gray-700/60 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
            disabled={isInCart}
          >
            <option value="" disabled>Select Gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </div>

        <div>
          <label className="block font-semibold mb-2 text-gray-300">Number of Persons:</label>
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            className="w-full px-4 py-3 bg-gray-700/60 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
            min="1"
            disabled={isInCart}
          />
        </div>

        {selectedGender && accommodation.length > 0 && (
          <div className="p-4 bg-gray-800/70 rounded-lg border border-gray-700">
            {(() => {
              const details = accommodation.find(a => a.gender === selectedGender);
              if (!details) return null;
              return (
                <div className="text-gray-300 space-y-2">
                  <p><strong>Fees per person:</strong> <span className="text-purple-300">₹{details.fees}</span></p>
                  <p><strong>Total Fees:</strong> <span className="font-bold text-green-400">₹{details.fees * quantity}</span></p>
                  <p><strong>Available Rooms:</strong> {details.available_rooms}</p>
                </div>
              );
            })()}
          </div>
        )}

        {isInCart ? (
          <button
            onClick={handleRemoveFromCart}
            className="w-full px-4 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-transform duration-300"
          >
            Remove from Cart
          </button>
        ) : (
          <button
            onClick={handleAddToCart}
            disabled={!selectedGender || quantity <= 0}
            className="w-full px-4 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-transform duration-300"
          >
            Add to Cart
          </button>
        )}
      </div>
    </>
  );
};


export default AccommodationBooking;
