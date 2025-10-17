import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import API_BASE_URL from './Config'; // adjust path if needed

interface Registration {
  id: number;
  userId: number;
  symposium: string;
  eventId: number;
  userName: string;
  userEmail: string;
  mobileNumber: string;
  transactionId: string;
  transactionUsername: string;
  transactionTime: string;
  transactionDate: string;
  transactionAmount: number;
  transactionScreenshot: { type: string; data: number[] };
  verified: boolean | null;
}

const RegistrationStatusPage: React.FC = () => {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [selectedRegistration, setSelectedRegistration] = useState<Registration | null>(null);

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

  const handleVerify = async (registration: Registration) => {
    if (!registration) return;
    try {
      await axios.post(`${API_BASE_URL}/verification`, { userId: registration.userId, eventId: registration.eventId, verified: true });
      alert('User verified successfully!');
      setSelectedRegistration(null);
      fetchRegistrations();
    } catch (error) {
      console.error('Error verifying user:', error);
      alert('Failed to verify user.');
    }
  };

  const handleReject = async (registration: Registration) => {
    if (!registration) return;
    try {
      await axios.post(`${API_BASE_URL}/verification`, { userId: registration.userId, eventId: registration.eventId, verified: false });
      alert('User rejected successfully!');
      setSelectedRegistration(null);
      fetchRegistrations();
    } catch (error) {
      console.error('Error rejecting user:', error);
      alert('Failed to reject user.');
    }
  };

  const bufferToImageUrl = (buffer: { type: string; data: number[] }) => {
    if (!buffer) return '';
    const blob = new Blob([new Uint8Array(buffer.data)], { type: 'image/jpeg' });
    return URL.createObjectURL(blob);
  };

  const getStatusText = (verified: boolean | null) => {
    if (verified == true) return <span className="text-green-500">Verified</span>;
    if (verified == false) return <span className="text-red-500">Rejected</span>;
    return <span className="text-yellow-500">Pending</span>;
  };

  return (
    <div className="container mx-auto p-4 text-black">
      <h1 className="text-2xl font-bold mb-4">Registration Status</h1>
      <table className="min-w-full bg-white">
        <thead>
          <tr>
            <th className="py-2">User Name</th>
            <th className="py-2">Event ID</th>
            <th className="py-2">Transaction ID</th>
            <th className="py-2">Amount</th>
            <th className="py-2">Status</th>
            <th className="py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {registrations.map((reg) => (
            <tr key={reg.id}>
              <td className="border px-4 py-2">{reg.userName}</td>
              <td className="border px-4 py-2">{reg.eventId}</td>
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
            <p><strong>Event ID:</strong> {selectedRegistration.eventId}</p>
            <p><strong>Transaction ID:</strong> {selectedRegistration.transactionId}</p>
            <p><strong>Transaction Amount:</strong> {selectedRegistration.transactionAmount}</p>
            <p><strong>Status:</strong> {getStatusText(selectedRegistration.verified)}</p>
            <div>
              <strong>Transaction Screenshot:</strong>
              <img src={bufferToImageUrl(selectedRegistration.transactionScreenshot)} alt="Transaction Screenshot" className="max-w-full h-auto" />
            </div>
            <div className="mt-4 flex justify-end gap-4">
              {selectedRegistration.verified != true && <button onClick={() => handleVerify(selectedRegistration)} className="bg-green-500 text-white px-4 py-2 rounded">Verify</button>}
              {selectedRegistration.verified != false && <button onClick={() => handleReject(selectedRegistration)} className="bg-red-500 text-white px-4 py-2 rounded">Reject</button>}
              <button onClick={() => setSelectedRegistration(null)} className="bg-gray-500 text-white px-4 py-2 rounded">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegistrationStatusPage;
