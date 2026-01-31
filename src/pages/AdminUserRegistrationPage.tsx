import React, { useState, useEffect } from 'react';
import API_BASE_URL from '../Config';

// Type definitions
type User = {
  id: number;
  fullName: string;
  email: string;
};

type Event = {
  id: number;
  eventName: string;
  symposiumName: 'Enigma' | 'Carteblanche';
};

type Pass = {
  id: number;
  name: string;
};

const AdminUserRegistrationPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [passes, setPasses] = useState<Pass[]>([]);
  
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedEventIds, setSelectedEventIds] = useState<number[]>([]);
  const [selectedPassIds, setSelectedPassIds] = useState<number[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [usersRes, eventsRes, passesRes] = await Promise.all([
          fetch(`${API_BASE_URL}/registrations/users`),
          fetch(`${API_BASE_URL}/events`),
          fetch(`${API_BASE_URL}/passes`),
        ]);
        
        if (!usersRes.ok || !eventsRes.ok || !passesRes.ok) {
          throw new Error('Failed to fetch initial data.');
        }
        
        const usersData = await usersRes.json();
        const eventsData = await eventsRes.json();
        const passesData = await passesRes.json();
        
        setUsers(usersData);
        setEvents(eventsData);
        setPasses(passesData);
        
      } catch (error) {
        setMessage({ type: 'error', text: 'Failed to load data. Please try again.' });
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleEventCheckboxChange = (eventId: number) => {
    setSelectedEventIds(prev =>
      prev.includes(eventId) ? prev.filter(id => id !== eventId) : [...prev, eventId]
    );
  };

  const handlePassCheckboxChange = (passId: number) => {
    setSelectedPassIds(prev =>
      prev.includes(passId) ? prev.filter(id => id !== passId) : [...prev, passId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) {
      setMessage({ type: 'error', text: 'Please select a user.' });
      return;
    }
    if (selectedEventIds.length === 0 && selectedPassIds.length === 0) {
      setMessage({ type: 'error', text: 'Please select at least one event or pass.' });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      const response = await fetch(`${API_BASE_URL}/registrations/admin-register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: parseInt(selectedUserId, 10),
          eventIds: selectedEventIds,
          passIds: selectedPassIds,
        }),
      });
      
      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to register user.');
      }
      
      setMessage({ type: 'success', text: responseData.message });
      setSelectedEventIds([]);
      setSelectedPassIds([]);
      setSelectedUserId('');

    } catch (error) {
        const err = error as Error;
      setMessage({ type: 'error', text: err.message });
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (isLoading) {
    return <div className="flex justify-center items-center h-full"><div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-500"></div></div>;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
          Register User for Events/Passes
        </h1>
        
        {message && (
          <div className={`p-4 mb-4 rounded-lg ${message.type === 'success' ? 'bg-green-800/50 text-green-300' : 'bg-red-800/50 text-red-300'}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-gray-800/50 p-6 rounded-lg border border-gray-700 space-y-6">
          <div>
            <label htmlFor="user-select" className="block text-sm font-medium text-gray-300 mb-2">Select User</label>
            <select
              id="user-select"
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              required
              className="w-full px-4 py-3 bg-gray-800/60 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="" disabled>-- Select a user --</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>{user.fullName} ({user.email})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-xl font-semibold mb-3">Events</h2>
              <div className="space-y-2 max-h-60 overflow-y-auto p-2 border border-gray-700 rounded-lg">
                {events.map(event => (
                  <div key={event.id} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`event-${event.id}`}
                      checked={selectedEventIds.includes(event.id)}
                      onChange={() => handleEventCheckboxChange(event.id)}
                      className="h-4 w-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500"
                    />
                    <label htmlFor={`event-${event.id}`} className="ml-3 text-sm">
                      {event.eventName} <span className="text-xs text-gray-400">({event.symposiumName})</span>
                    </label>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h2 className="text-xl font-semibold mb-3">Passes</h2>
              <div className="space-y-2 max-h-60 overflow-y-auto p-2 border border-gray-700 rounded-lg">
                {passes.map(pass => (
                  <div key={pass.id} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`pass-${pass.id}`}
                      checked={selectedPassIds.includes(pass.id)}
                      onChange={() => handlePassCheckboxChange(pass.id)}
                      className="h-4 w-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500"
                    />
                    <label htmlFor={`pass-${pass.id}`} className="ml-3 text-sm">{pass.name}</label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full px-6 py-3 bg-purple-600 rounded-lg font-bold hover:bg-purple-700 transition-colors disabled:bg-gray-500"
            >
              {isSubmitting ? 'Registering...' : 'Register User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminUserRegistrationPage;
