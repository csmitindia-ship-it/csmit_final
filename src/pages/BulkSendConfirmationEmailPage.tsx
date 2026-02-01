import React, { useState, useEffect } from 'react';
import API_BASE_URL from '../Config';
import AdminHeader from '../ui/AdminHeader';

interface UnconfirmedUser {
  id: number;
  fullName: string;
  email: string;
  unconfirmedItems: number;
  symposiums?: string;
}

const BulkSendConfirmationEmailPage: React.FC = () => {
  const [users, setUsers] = useState<UnconfirmedUser[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [filterSymposium, setFilterSymposium] = useState<'All' | 'Enigma' | 'Carteblanche'>('All');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [subject, setSubject] = useState('Event Registration Confirmation');
  const [emailContent, setEmailContent] = useState('Your registration has been confirmed. Please find the details of your registered events below.');

  useEffect(() => {
    fetchUnconfirmedUsers();
  }, []);

  const fetchUnconfirmedUsers = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/email/unconfirmed-users`);
      if (!response.ok) {
        throw new Error('Failed to fetch unconfirmed users.');
      }
      const data = await response.json();
      setUsers(data);
    } catch (error: any) {
      setMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    if (filterSymposium === 'All') return true;
    return user.symposiums?.includes(filterSymposium);
  });

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedUsers(filteredUsers.map(u => u.id));
    } else {
      setSelectedUsers([]);
    }
  };

  const handleSelectUser = (userId: number) => {
    setSelectedUsers(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const handleSendEmails = async () => {
    if (selectedUsers.length === 0) {
      setMessage('Please select at least one user to send an email.');
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      const response = await fetch(`${API_BASE_URL}/email/bulk-send-confirmation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userIds: selectedUsers,
          subject,
          emailContent,
          symposium: filterSymposium,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to send emails.');
      }

      setMessage(result.message);
      fetchUnconfirmedUsers(); // Refresh the list
      setSelectedUsers([]); // Clear selection
    } catch (error: any) {
      setMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="p-4 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Bulk Send Confirmation Emails</h1>

        {/* Filter Controls */}
        <div className="mb-6 p-4 bg-white rounded-lg shadow-sm border">
          <span className="font-semibold mr-4 text-gray-700">Filter by Symposium:</span>
          <label className="inline-flex items-center mr-4">
            <input
              type="radio"
              value="All"
              checked={filterSymposium === 'All'}
              onChange={(e) => setFilterSymposium(e.target.value as any)}
              className="form-radio text-blue-600"
            />
            <span className="ml-2 text-gray-700">All</span>
          </label>
          <label className="inline-flex items-center mr-4">
            <input
              type="radio"
              value="Enigma"
              checked={filterSymposium === 'Enigma'}
              onChange={(e) => setFilterSymposium(e.target.value as any)}
              className="form-radio text-purple-600"
            />
            <span className="ml-2 text-gray-700">Enigma</span>
          </label>
          <label className="inline-flex items-center">
            <input
              type="radio"
              value="Carteblanche"
              checked={filterSymposium === 'Carteblanche'}
              onChange={(e) => setFilterSymposium(e.target.value as any)}
              className="form-radio text-pink-600"
            />
            <span className="ml-2 text-gray-700">Carteblanche</span>
          </label>
        </div>

        <div className="mb-4">
          <label htmlFor="subject" className="block text-sm font-medium text-gray-700">Subject</label>
          <input
            type="text"
            id="subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="mt-1 block w-full p-2 border rounded-md text-black"
          />
        </div>

        <div className="mb-4">
          <label htmlFor="emailContent" className="block text-sm font-medium text-gray-700">Email Body</label>
          <textarea
            id="emailContent"
            rows={5}
            value={emailContent}
            onChange={(e) => setEmailContent(e.target.value)}
            className="mt-1 block w-full p-2 border rounded-md text-black"
            placeholder="Enter your custom message here. The list of registered events will be automatically added."
          />
        </div>

        <div className="flex justify-between items-center mb-4">
          <button
            onClick={handleSendEmails}
            disabled={isLoading || selectedUsers.length === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
          >
            {isLoading ? 'Sending...' : `Send to ${selectedUsers.length} Users`}
          </button>
          {message && (
            <p className={`p-2 rounded ${message.includes('success') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {message}
            </p>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border">
            <thead className="bg-gray-50 text-gray-800">
              <tr>
                <th className="p-2 border-b">
                  <input
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={filteredUsers.length > 0 && selectedUsers.length === filteredUsers.length}
                  />
                </th>
                <th className="p-2 border-b text-left">Name</th>
                <th className="p-2 border-b text-left">Email</th>
                <th className="p-2 border-b text-center">Unconfirmed Items</th>
              </tr>
            </thead>
            <tbody className="text-gray-700">
              {isLoading && (
                <tr>
                  <td colSpan={4} className="text-center p-4">Loading...</td>
                </tr>
              )}
              {!isLoading && users.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center p-4">No users with unconfirmed registrations found.</td>
                </tr>
              )}
              {filteredUsers.map(user => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="p-2 border-b text-center">
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user.id)}
                      onChange={() => handleSelectUser(user.id)}
                    />
                  </td>
                  <td className="p-2 border-b">
                    {user.fullName}
                    <div className="text-xs text-gray-500">{user.symposiums || 'Unknown'}</div>
                  </td>
                  <td className="p-2 border-b">{user.email}</td>
                  <td className="p-2 border-b text-center">{user.unconfirmedItems}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default BulkSendConfirmationEmailPage;
