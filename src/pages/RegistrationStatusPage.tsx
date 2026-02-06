import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import Papa from 'papaparse';
import API_BASE_URL from '../Config'; // adjust path if needed

interface Registration {
  id: number;
  userId: number;
  symposium: string | null;
  eventId: number | null;
  passId: number | null;
  itemName: string;
  itemType: 'event' | 'pass' | 'accommodation';
  userName: string;
  userEmail: string;
  mobileNumber: string;
  transactionId: string;
  transactionUsername: string;
  transactionTime: string;
  transactionDate: string;
  transactionAmount: number;
  transactionScreenshot: { type: string; data: number[] };
  verified: boolean | null | number;
}

const RegistrationStatusPage: React.FC = () => {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [selectedRegistration, setSelectedRegistration] = useState<Registration | null>(null);
  const [filter, setFilter] = useState('All'); // State for symposium filter
  const [csvData, setCsvData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRegistrations = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/registrations/all`);
      setRegistrations(response.data);
    } catch (error) {
      console.error('Error fetching registrations:', error);
    }
  }, []);

  useEffect(() => {
    fetchRegistrations();
  }, [fetchRegistrations]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          setCsvData(results.data);
        },
      });
    }
  };


  const handleVerify = async (registration: Registration, isBulk = false) => {
    if (!registration) return false;
    if (!registration.id) {
      alert('Invalid registration: ID is missing.');
      return false;
    }
    try {
      if (registration.itemType === 'accommodation') {
        await axios.put(`${API_BASE_URL}/accommodation/bookings/user/${registration.userId}/verify`);
      } else {
        await axios.post(`${API_BASE_URL}/verification/verify-transaction`, {
          transactionId: registration.transactionId,
        });
      }

      if (!isBulk) {
        alert('User verified successfully!');
        fetchRegistrations();
      }
      setSelectedRegistration(null);
      return true;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to verify user.';
      if (!isBulk) {
        alert(errorMessage);
      }
      return false;
    }
  };

  const handleReject = async (registration: Registration) => {
    if (!registration) return;
    if (!registration.id) {
      alert('Invalid registration: ID is missing.');
      return;
    }
    try {
      if (registration.itemType === 'accommodation') {
        await axios.delete(`${API_BASE_URL}/accommodation/bookings/user/${registration.userId}`);
      } else {
        const payload: { userId: number; verified: boolean; eventId?: number; passId?: number; transactionId: string } = {
          userId: registration.userId,
          verified: false,
          transactionId: registration.transactionId,
        };
        if (registration.itemType === 'event') {
          payload.eventId = registration.eventId!;
        } else if (registration.itemType === 'pass') {
          payload.passId = registration.passId!;
        }
        await axios.post(`${API_BASE_URL}/verification`, payload);
      }
      alert('User rejected successfully!');
      setSelectedRegistration(null);
      fetchRegistrations();
    } catch (error: any) {
      console.error('Error rejecting user:', error);
      const errorMessage = error.response?.data?.message || 'Failed to reject user.';
      alert(errorMessage);
    }
  };

  const bufferToImageUrl = (buffer: { type: string; data: number[] }) => {
    if (!buffer) return '';
    const blob = new Blob([new Uint8Array(buffer.data)], { type: 'image/jpeg' });
    return URL.createObjectURL(blob);
  };

  const getStatusText = (verified: boolean | null | number) => {
    if (verified == true) return <span className="text-green-500">Verified</span>;
    if (verified == false) return <span className="text-red-500">Rejected</span>;
    return <span className="text-yellow-500">Pending</span>;
  };

  const handleFilterChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setFilter(event.target.value);
  };

  const filteredRegistrations = registrations.filter(reg => {
    if (filter === 'All') {
      return true;
    }
    if (reg.itemType === 'pass') {
      return true; // Always show passes
    }
    return reg.symposium === filter;
  });

  return (
    <div className="container mx-auto p-4 text-black">
      <h1 className="text-2xl font-bold mb-4">Registration Status</h1>
      <div className="mb-4">
        <label htmlFor="symposium-filter" className="mr-2">Filter by Symposium:</label>
        <select id="symposium-filter" value={filter} onChange={handleFilterChange} className="p-2 rounded border">
          <option value="All">All</option>
          <option value="Enigma">Enigma</option>
          <option value="Carteblanche">Carte Blanche</option>
        </select>
      </div>

      {error && <div className="text-red-500 mb-4">{error}</div>}
      <table className="min-w-full bg-white">
        <thead>
          <tr>
            <th className="py-2">User Name</th>
            <th className="py-2">Item Name</th>
            <th className="py-2">Transaction ID</th>
            <th className="py-2">Amount</th>
            <th className="py-2">Status</th>
            <th className="py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredRegistrations.map((reg) => (
            <tr key={reg.id}>
              <td className="border px-4 py-2">{reg.userName}</td>
              <td className="border px-4 py-2">{reg.itemName}</td>
              <td className="border px-4 py-2">{reg.transactionId}</td>
              <td className="border px-4 py-2">{reg.transactionAmount}</td>
              <td className="border px-4 py-2">{getStatusText(reg.verified)}</td>
              <td className="border px-4 py-2">
                <button onClick={() => setSelectedRegistration(reg)} className="bg-blue-500 text-white px-2 py-1 rounded">View</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {selectedRegistration && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-8 rounded-lg max-w-2xl w-full">
            <h2 className="text-xl font-bold mb-4">Registration Details</h2>
            <p><strong>User Name:</strong> {selectedRegistration.userName}</p>
            <p><strong>User Email:</strong> {selectedRegistration.userEmail}</p>
            <p><strong>Mobile Number:</strong> {selectedRegistration.mobileNumber}</p>
            <p><strong>Item Name:</strong> {selectedRegistration.itemName}</p>
            <p><strong>Transaction ID:</strong> {selectedRegistration.transactionId}</p>
            <p><strong>Transaction Amount:</strong> {selectedRegistration.transactionAmount}</p>
            <p><strong>Status:</strong> {getStatusText(selectedRegistration.verified)}</p>
            <div>
              <strong>Transaction Screenshot:</strong>
              <img src={bufferToImageUrl(selectedRegistration.transactionScreenshot)} alt="Transaction Screenshot" className="max-w-full h-auto" />
            </div>
            <div className="mt-4 flex justify-end gap-4">
              {selectedRegistration.verified === null || selectedRegistration.verified === false || selectedRegistration.verified === 0 ? (
                <button onClick={() => handleVerify(selectedRegistration)} className="bg-green-500 text-white px-4 py-2 rounded">Verify</button>
              ) : null}
              {selectedRegistration.verified === null || selectedRegistration.verified === true || selectedRegistration.verified === 1 ? (
                <button onClick={() => handleReject(selectedRegistration)} className="bg-red-500 text-white px-4 py-2 rounded">Reject</button>
              ) : null}
              <button onClick={() => setSelectedRegistration(null)} className="bg-gray-500 text-white px-4 py-2 rounded">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegistrationStatusPage;