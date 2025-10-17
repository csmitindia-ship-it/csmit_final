import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Loader from '../components/Loader';
import { useAuth } from '../context/AuthContext';
import ThemedModal from '../components/ThemedModal';
import API_BASE_URL from './Config'; // adjust path if needed

interface Event {
  id: string; // Changed from number to string
  eventName: string;
  eventDate: string;
  lastDateForRegistration: string;
  symposiumName: string;
  // Add other event properties as needed
}

const AdminViewRegistrationsOverviewPage: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modal, setModal] = useState({ isOpen: false, title: '', message: '' });
  const navigate = useNavigate();
  const { user } = useAuth();

  const showModal = (title: string, message: string) => {
    setModal({ isOpen: true, title, message });
  };

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/events`);
        const data = await response.json();
        setEvents(data);
      } catch (err) {
        showModal('Error', 'Error fetching events. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const handleViewRegistrations = (eventId: string, symposiumName: string) => { // eventId type changed to string
    if (!eventId || !symposiumName) {
      showModal('Error', 'Attempted to view registrations for an event with an invalid ID or symposium name.');
      return;
    }
    if (user?.role === 'organizer') {
      navigate(`/organizer/events/registrations/${eventId}?symposium=${symposiumName}`);
    } else {
      navigate(`/admin/events/registrations/${eventId}?symposium=${symposiumName}`);
    }
  };

  if (isLoading) {
    return <Loader />;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 pt-20">
      <ThemedModal
        isOpen={modal.isOpen}
        onClose={() => setModal({ isOpen: false, title: '', message: '' })}
        title={modal.title}
        message={modal.message}
      />
      <div className="container mx-auto">
        <h1 className="text-3xl font-bold text-white mb-6 text-center">
          View Event Registrations
        </h1>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-gray-800 rounded-lg">
            <thead>
              <tr className="bg-gray-700">
                <th className="py-3 px-4 text-left">Event Name</th>
                <th className="py-3 px-4 text-left">Event Date</th>
                <th className="py-3 px-4 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr key={event.id} className="border-b border-gray-700">
                  <td className="py-3 px-4">{event.eventName}</td>
                  <td className="py-3 px-4">{new Date(event.lastDateForRegistration).toLocaleDateString()}</td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => handleViewRegistrations(event.id, event.symposiumName)}
                      className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded"
                    >
                      View Registrations
                    </button>
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

export default AdminViewRegistrationsOverviewPage;
