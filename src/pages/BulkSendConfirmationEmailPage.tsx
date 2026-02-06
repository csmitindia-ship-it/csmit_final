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
  const [includeSent, setIncludeSent] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [subject, setSubject] = useState('Event Registration Confirmation');
  const [emailContent, setEmailContent] = useState('Your registration has been confirmed. Please find the details of your registered events below.');

  useEffect(() => {
    fetchUnconfirmedUsers();
  }, [includeSent]);

  const fetchUnconfirmedUsers = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/email/unconfirmed-users?includeSent=${includeSent}`);
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
    const matchesSymposium = filterSymposium === 'All' || user.symposiums?.includes(filterSymposium);
    const matchesSearch = user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSymposium && matchesSearch;
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAttachment(e.target.files[0]);
    } else {
      setAttachment(null);
    }
  };

  const handleSendEmails = async () => {
    if (selectedUsers.length === 0) {
      setMessage('Please select at least one user to send an email.');
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      const formData = new FormData();
      formData.append('userIds', JSON.stringify(selectedUsers));
      formData.append('subject', subject);
      formData.append('emailContent', emailContent);
      formData.append('symposium', filterSymposium);
      formData.append('forceResend', includeSent.toString());
      if (attachment) {
        formData.append('attachment', attachment);
      }

      const response = await fetch(`${API_BASE_URL}/email/bulk-send-confirmation`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to send emails.');
      }

      setMessage(result.message);
      fetchUnconfirmedUsers(); // Refresh the list
      setSelectedUsers([]); // Clear selection
      setAttachment(null); // Clear attachment
    } catch (error: any) {
      setMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="p-4 max-w-4xl mx-auto text-black">
        <h1 className="text-2xl font-bold mb-6">Bulk Send Confirmation Emails</h1>

        <div className="mb-4">
          <label htmlFor="subject" className="block text-sm font-medium text-gray-700">Subject</label>
          <input
            type="text"
            id="subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="mt-1 block w-full p-2 border rounded-md text-black focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="mb-6">
          <label htmlFor="emailContent" className="block text-sm font-medium text-gray-700">Email Body</label>
          <textarea
            id="emailContent"
            rows={5}
            value={emailContent}
            onChange={(e) => setEmailContent(e.target.value)}
            className="mt-1 block w-full p-2 border rounded-md text-black focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter your custom message here. The list of registered events will be automatically added."
          />
        </div>

        {/* Attachment Section */}
        <div className="mb-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <label className="block text-sm font-medium text-blue-800 mb-2 font-bold">
            Attach Image or PDF (Optional)
          </label>
          <input
            type="file"
            accept="image/*,application/pdf"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-600 file:text-white
              hover:file:bg-blue-700 cursor-pointer"
          />
          {attachment && (
            <p className="mt-2 text-sm text-blue-700 font-bold">
              Selected: {attachment.name} ({(attachment.size / 1024).toFixed(1)} KB)
            </p>
          )}
        </div>

        {/* Filter Controls and Send Button */}
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4 p-4 bg-white rounded-lg shadow-sm border">
          <div>
            <span className="font-semibold block mb-2 text-gray-700">Filter by Symposium:</span>
            <div className="flex gap-4">
              <label className="inline-flex items-center cursor-pointer">
                <input
                  type="radio"
                  value="All"
                  checked={filterSymposium === 'All'}
                  onChange={(e) => setFilterSymposium(e.target.value as any)}
                  className="form-radio text-blue-600"
                />
                <span className="ml-2 text-gray-700">All</span>
              </label>
              <label className="inline-flex items-center cursor-pointer">
                <input
                  type="radio"
                  value="Enigma"
                  checked={filterSymposium === 'Enigma'}
                  onChange={(e) => setFilterSymposium(e.target.value as any)}
                  className="form-radio text-purple-600"
                />
                <span className="ml-2 text-gray-700">Enigma</span>
              </label>
              <label className="inline-flex items-center cursor-pointer">
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
          </div>

          <div className="flex flex-col items-end gap-2">
            <label className="inline-flex items-center cursor-pointer mb-2">
              <input
                type="checkbox"
                checked={includeSent}
                onChange={(e) => setIncludeSent(e.target.checked)}
                className="form-checkbox h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="ml-2 text-gray-700 font-medium select-none">Include already sent users</span>
            </label>
            <button
              onClick={handleSendEmails}
              disabled={isLoading || selectedUsers.length === 0}
              className="px-8 py-3 bg-blue-600 text-white font-bold rounded shadow-lg hover:bg-blue-700 disabled:bg-gray-400 transition-all hover:scale-105"
            >
              {isLoading ? 'Sending...' : `Send to ${selectedUsers.length} Users`}
            </button>
          </div>
        </div>

        {message && (
          <div className={`mb-6 p-3 rounded-lg font-medium border ${message.includes('Sent') ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200'}`}>
            {message}
          </div>
        )}

        {/* Search Bar - Above User List */}
        <div className="mb-4">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              id="search"
              placeholder="Search students by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-lg placeholder-gray-400"
            />
          </div>
        </div>

        {/* User Table */}
        <div className="overflow-x-auto shadow-xl rounded-xl">
          <table className="min-w-full bg-white border-collapse">
            <thead className="bg-gray-100 text-gray-800">
              <tr>
                <th className="p-4 border-b text-center">
                  <input
                    type="checkbox"
                    className="w-5 h-5 cursor-pointer rounded text-blue-600 focus:ring-blue-500"
                    onChange={handleSelectAll}
                    checked={filteredUsers.length > 0 && filteredUsers.every(u => selectedUsers.includes(u.id))}
                  />
                </th>
                <th className="p-4 border-b text-left font-bold text-sm uppercase tracking-wider">Student Name</th>
                <th className="p-4 border-b text-left font-bold text-sm uppercase tracking-wider">Email Address</th>
                <th className="p-4 border-b text-center font-bold text-sm uppercase tracking-wider">Pending Items</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {isLoading && users.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center p-12 text-gray-500 animate-pulse text-lg">Loading users...</td>
                </tr>
              )}
              {!isLoading && filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center p-12 text-gray-500 text-lg">
                    {users.length === 0 ? "No users with unconfirmed registrations found." : "No users match your filters."}
                  </td>
                </tr>
              )}
              {filteredUsers.map(user => (
                <tr key={user.id} className="hover:bg-blue-50/50 transition-colors">
                  <td className="p-4 text-center">
                    <input
                      type="checkbox"
                      className="w-5 h-5 cursor-pointer rounded text-blue-600 focus:ring-blue-500"
                      checked={selectedUsers.includes(user.id)}
                      onChange={() => handleSelectUser(user.id)}
                    />
                  </td>
                  <td className="p-4">
                    <div className="font-bold text-gray-900">{user.fullName}</div>
                    <div className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full inline-block mt-1">
                      {user.symposiums || 'General'}
                    </div>
                  </td>
                  <td className="p-4 text-sm text-gray-600">{user.email}</td>
                  <td className="p-4 text-center">
                    <span className="bg-orange-100 text-orange-800 text-sm font-bold px-3 py-1 rounded-full">
                      {user.unconfirmedItems}
                    </span>
                  </td>
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
