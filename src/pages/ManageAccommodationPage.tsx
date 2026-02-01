import React, { useState, useEffect } from 'react';
import API_BASE_URL from '../Config';

interface Accommodation {
  gender: 'male' | 'female';
  total_rooms: number;
  available_rooms: number;
  fees: number;
  accountId?: number;
}

interface Account {
  id: number;
  accountName: string;
}

interface Booking {
  id: number;
  userId: number;
  gender: 'male' | 'female';
  quantity: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  isVerified: boolean;
  fullName: string;
  email: string;
  mobile: string;
  createdAt: string;
}

const ManageAccommodationPage: React.FC = () => {
  const [maleAccommodation, setMaleAccommodation] = useState<Accommodation>({
    gender: 'male',
    total_rooms: 0,
    available_rooms: 0,
    fees: 0,
    accountId: undefined,
  });
  const [femaleAccommodation, setFemaleAccommodation] = useState<Accommodation>({
    gender: 'female',
    total_rooms: 0,
    available_rooms: 0,
    fees: 0,
    accountId: undefined,
  });
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState('');

  const [error, setError] = useState<string | null>(null);

  const fetchDetails = async () => {
    setIsLoading(true);
    try {
      const [accomResponse, accountsResponse, bookingsResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/accommodation`),
        fetch(`${API_BASE_URL}/accounts`),
        fetch(`${API_BASE_URL}/accommodation/bookings/all`),
      ]);

      if (!accomResponse.ok) {
        throw new Error('Failed to fetch accommodation details');
      }
      if (!accountsResponse.ok) {
        throw new Error('Failed to fetch accounts');
      }
      if (!bookingsResponse.ok) {
        throw new Error('Failed to fetch accommodation bookings.');
      }

      const accomData: Accommodation[] = await accomResponse.json();
      const accountsData: Account[] = await accountsResponse.json();
      const bookingsData: Booking[] = await bookingsResponse.json();

      setAccounts(accountsData);
      setBookings(bookingsData || []);

      const maleData = accomData.find(item => item.gender === 'male');
      const femaleData = accomData.find(item => item.gender === 'female');

      if (maleData) {
        setMaleAccommodation(maleData);
      }
      if (femaleData) {
        setFemaleAccommodation(femaleData);
      }
    } catch (error: unknown) {
      console.error(error);
      setMessage('Error fetching details.');
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('An unknown error occurred.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, []);

  const handleInputChange = (gender: 'male' | 'female', field: keyof Accommodation, value: string) => {
    const numValue = (field === 'accountId' && value === '') ? undefined : Number(value);
    if (gender === 'male') {
      setMaleAccommodation(prev => ({ ...prev, [field]: numValue }));
    } else {
      setFemaleAccommodation(prev => ({ ...prev, [field]: numValue }));
    }
  };

  const handleSaveChanges = async () => {
    setIsLoading(true);
    setMessage('');
    try {
      const response = await fetch(`${API_BASE_URL}/accommodation`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          male: maleAccommodation,
          female: femaleAccommodation,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update accommodation details');
      }

      setMessage('Accommodation details updated successfully!');
    } catch (error: unknown) {
      console.error(error);
      setMessage('Error updating accommodation details.');
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('An unknown error occurred while saving.');
      }
    } finally {
      setIsLoading(false);
    }
  };



  return (
    <div className="text-white">
      <h1 className="text-2xl font-bold mb-4">Manage Accommodation</h1>
      {isLoading && <p>Loading...</p>}
      {message && <p className="mb-4">{message}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Male Accommodation */}
        <div className="p-4 border rounded">
          <h2 className="text-xl font-semibold mb-2">Male Accommodation</h2>
          <div className="space-y-4">
            <div>
              <label className="block">Total Rooms</label>
              <input
                type="number"
                value={maleAccommodation.total_rooms}
                onChange={(e) => handleInputChange('male', 'total_rooms', e.target.value)}
                className="w-full p-2 border rounded text-black"
              />
            </div>
            <div>
              <label className="block">Available Rooms</label>
              <input
                type="number"
                value={maleAccommodation.available_rooms}
                onChange={(e) => handleInputChange('male', 'available_rooms', e.target.value)}
                className="w-full p-2 border rounded text-black"
              />
            </div>
            <div>
              <label className="block">Fees</label>
              <input
                type="number"
                value={maleAccommodation.fees}
                onChange={(e) => handleInputChange('male', 'fees', e.target.value)}
                className="w-full p-2 border rounded text-black"
              />
            </div>
            <div>
              <label className="block">Assign Account</label>
              <select
                value={maleAccommodation.accountId || ''}
                onChange={(e) => handleInputChange('male', 'accountId', e.target.value)}
                className="w-full p-2 border rounded text-black"
              >
                <option value="">No account assigned</option>
                {accounts.map(account => (
                  <option key={account.id} value={account.id}>{account.accountName}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Female Accommodation */}
        <div className="p-4 border rounded">
          <h2 className="text-xl font-semibold mb-2">Female Accommodation</h2>
          <div className="space-y-4">
            <div>
              <label className="block">Total Rooms</label>
              <input
                type="number"
                value={femaleAccommodation.total_rooms}
                onChange={(e) => handleInputChange('female', 'total_rooms', e.target.value)}
                className="w-full p-2 border rounded text-black"
              />
            </div>
            <div>
              <label className="block">Available Rooms</label>
              <input
                type="number"
                value={femaleAccommodation.available_rooms}
                onChange={(e) => handleInputChange('female', 'available_rooms', e.target.value)}
                className="w-full p-2 border rounded text-black"
              />
            </div>
            <div>
              <label className="block">Fees</label>
              <input
                type="number"
                value={femaleAccommodation.fees}
                onChange={(e) => handleInputChange('female', 'fees', e.target.value)}
                className="w-full p-2 border rounded text-black"
              />
            </div>
            <div>
              <label className="block">Assign Account</label>
              <select
                value={femaleAccommodation.accountId || ''}
                onChange={(e) => handleInputChange('female', 'accountId', e.target.value)}
                className="w-full p-2 border rounded text-black"
              >
                <option value="">No account assigned</option>
                {accounts.map(account => (
                  <option key={account.id} value={account.id}>{account.accountName}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <button
          onClick={handleSaveChanges}
          disabled={isLoading}
          className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:bg-gray-400"
        >
          {isLoading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Accommodation Bookings</h2>
        <p className="mb-4 text-gray-400">This section is for verifying accommodation bookings. For general pass and event registration payments, please use the 'Verify Transaction' page.</p>
        {isLoading && <p>Loading bookings...</p>}
        {error && <p className="text-red-500">{error}</p>}
        <div className="overflow-x-auto">
          <table className="min-w-full bg-gray-800 border border-gray-700">
            <thead>
              <tr>
                <th className="py-2 px-4 border-b border-gray-700">User Name</th>
                <th className="py-2 px-4 border-b border-gray-700">Email</th>
                <th className="py-2 px-4 border-b border-gray-700">Mobile</th>
                <th className="py-2 px-4 border-b border-gray-700">Gender</th>
                <th className="py-2 px-4 border-b border-gray-700">Quantity</th>
                <th className="py-2 px-4 border-b border-gray-700">Status</th>
                <th className="py-2 px-4 border-b border-gray-700">Booked At</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => (
                <tr key={booking.id}>
                  <td className="py-2 px-4 border-b border-gray-700">{booking.fullName}</td>
                  <td className="py-2 px-4 border-b border-gray-700">{booking.email}</td>
                  <td className="py-2 px-4 border-b border-gray-700">{booking.mobile}</td>
                  <td className="py-2 px-4 border-b border-gray-700">{booking.gender}</td>
                  <td className="py-2 px-4 border-b border-gray-700">{booking.quantity}</td>
                  <td className="py-2 px-4 border-b border-gray-700">{booking.status}</td>
                  <td className="py-2 px-4 border-b border-gray-700">{new Date(booking.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ManageAccommodationPage;
