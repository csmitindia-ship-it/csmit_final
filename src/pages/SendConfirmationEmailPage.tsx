import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API_BASE_URL from '../Config';
import AdminHeader from '../ui/AdminHeader';

interface UserDetails {
  email: string;
  name: string;
}

interface RegisteredEvent {
  eventName: string;
}

type RegisteredItem = {
  event?: { eventName: string };
  pass?: { name: string };
};

const SendConfirmationEmailPage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [registeredEvents, setRegisteredEvents] = useState<RegisteredEvent[]>([]);
  const [emailContent, setEmailContent] = useState('');
  const [subject, setSubject] = useState('Event Registration Confirmation');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Fetch user details and registered events
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch user details
        const userRes = await fetch(`${API_BASE_URL}/registrations/user-details/${userId}`);
        if (!userRes.ok) throw new Error('Failed to fetch user details.');
        const userData = await userRes.json();
        setUserDetails(userData);

        // Fetch registered events
        const eventsRes = await fetch(`${API_BASE_URL}/registrations/user/${userId}`);
        if (!eventsRes.ok) throw new Error('Failed to fetch registered events.');
        const itemsData: RegisteredItem[] = await eventsRes.json();

        const formattedEvents = itemsData.map(item => {
          if (item.event) {
            return { eventName: item.event.eventName };
          }
          if (item.pass) {
            return { eventName: item.pass.name };
          }
          return null;
        }).filter((item): item is RegisteredEvent => item !== null);

        setRegisteredEvents(formattedEvents);

      } catch (error: any) {
        setMessage(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    if (userId) {
      fetchData();
    }
  }, [userId]);

  const handleSendEmail = async () => {
    if (!userId || !userDetails) {
      setMessage('User details not loaded.');
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      const response = await fetch(`${API_BASE_URL}/email/send-confirmation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          subject,
          emailContent,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to send email.');
      }

      setMessage('Email sent successfully!');
      setTimeout(() => navigate('/verify-transaction'), 2000); // Redirect after 2s
    } catch (error: any) {
      setMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && !userDetails) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div className="p-4 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Send Confirmation Email</h1>
        {userDetails && (
          <div className="mb-4">
            <p><strong>To:</strong> {userDetails.email}</p>
            <p><strong>User:</strong> {userDetails.name}</p>
          </div>
        )}

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
            rows={10}
            value={emailContent}
            onChange={(e) => setEmailContent(e.target.value)}
            className="mt-1 block w-full p-2 border rounded-md text-black"
            placeholder="Enter your custom message here. The list of registered events will be automatically added."
          />
        </div>

        <div className="mb-4">
          <h3 className="font-semibold">Registered Events:</h3>
          {registeredEvents.length > 0 ? (
            <ul className="list-disc list-inside bg-gray-50 p-2 rounded">
              {registeredEvents.map((event, index) => (
                <li key={index}>{event.eventName}</li>
              ))}
            </ul>
          ) : (
            <p>No registered events found.</p>
          )}
        </div>

        <button
          onClick={handleSendEmail}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
        >
          {isLoading ? 'Sending...' : 'Send Email'}
        </button>

        {message && (
          <p className={`mt-4 p-2 rounded ${message.includes('successfully') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
};

export default SendConfirmationEmailPage;
