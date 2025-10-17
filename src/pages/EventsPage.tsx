import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../ui/Header'; 
import backgroundImage from '../Login_Sign/photo.jpeg'; 
import LoginPage from '../Login_Sign/LoginPage'; 
import SignUpPage from '../Login_Sign/SignUpPage'; 
import Loader from '../components/Loader'; 
import { useAuth } from '../context/AuthContext'; 
import ThemedModal from '../components/ThemedModal';
import EventCountdown from '../components/EventCountdown'; 
import WorkshopRegistrationModal from '../components/WorkshopRegistrationModal';
import axios from 'axios';

interface Round {
  roundNumber: number;
  roundDetails: string;
  roundDateTime: string;
}

interface Event {
  id: number;
  eventName: string;
  eventCategory: string;
  eventDescription: string;
  numberOfRounds: number;
  teamOrIndividual: 'Team' | 'Individual';
  location: string;
  registrationFees: number;
  coordinatorName: string;
  coordinatorContactNo: string;
  coordinatorMail: string;
  lastDateForRegistration: string;
  symposiumName: 'Enigma' | 'Carteblanche';
  rounds?: Round[];
  posterUrl?: string; 
  registrationLink?: string;
}

const EventsPage: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [activeSymposium, setActiveSymposium] = useState<'Enigma' | 'Carteblanche'>('Enigma');
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isSignUpModalOpen, setIsSignUpModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [registeredEvents, setRegisteredEvents] = useState<number[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState({ title: '', message: '' });
  const [eventCategories, setEventCategories] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isWorkshopModalOpen, setIsWorkshopModalOpen] = useState(false);
  const [selectedWorkshopEvent, setSelectedWorkshopEvent] = useState<Event | null>(null);
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [isCartActionInProgress, setIsCartActionInProgress] = useState(false);
  const [symposiumStatus, setSymposiumStatus] = useState<any[]>([]);

  const { user, isLoggedIn, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const MIT_COLLEGE_NAME = "Madras Institute of Technology";

  const isSymposiumOpen = (symposiumName: 'Enigma' | 'Carteblanche') => {
    const symposium = symposiumStatus.find(s => s.symposiumName === symposiumName);
    return symposium ? symposium.isOpen === 1 : false;
  };

  const handleViewDetails = (event: Event) => {
    if (!isSymposiumOpen(activeSymposium)) {
      setModalContent({
        title: 'Not Yet Started',
        message: 'This symposium has not started yet. Full details will be available soon.',
      });
      setIsModalOpen(true);
      return;
    }
    setSelectedEvent(event);
    setIsModalOpen(true);
  };

  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get('/api/events');
      setEvents(response.data);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSymposiumStatus = async () => {
    try {
      const response = await axios.get('/api/symposium/status');
      setSymposiumStatus(response.data.data);
    } catch (error) {
      console.error('Error fetching symposium status:', error);
    }
  };

  const fetchRegisteredEvents = async () => {
    if (!user || !user.email) return;
    try {
      const response = await axios.get(`/api/registrations/by-email/${user.email}`);
      setRegisteredEvents(response.data.map((reg: any) => reg.eventId));
    } catch (error) {
      console.error('Error fetching registered events:', error);
    }
  };

  const fetchCartItems = async () => {
    if (!user || !user.id) return;
    try {
      const response = await axios.get(`/api/cart/${user.id}`);
      setCartItems(response.data);
    } catch (error) {
      console.error('Error fetching cart items:', error);
    }
  };

  useEffect(() => {
    fetchEvents();
    fetchSymposiumStatus();
    if (isLoggedIn) {
      fetchRegisteredEvents();
      fetchCartItems();
    }

    const handleRegistrationComplete = () => {
      fetchRegisteredEvents();
    };

    window.addEventListener('registrationComplete', handleRegistrationComplete);

    return () => {
      window.removeEventListener('registrationComplete', handleRegistrationComplete);
    };
  }, [isLoggedIn, user]);

  useEffect(() => {
    const symposiumFilteredEvents = events.filter(event => event.symposiumName === activeSymposium);

    if (symposiumFilteredEvents.length > 0) {
      const categories = Array.from(new Set(symposiumFilteredEvents.map(event => event.eventCategory)));
      setEventCategories(categories);
      if (!activeCategory || !categories.includes(activeCategory)) {
        setActiveCategory(categories[0] || null);
      }
    } else {
      setEventCategories([]);
      setActiveCategory(null);
    }
  }, [events, activeSymposium]);

  useEffect(() => {
    if (isCartActionInProgress) {
      setIsCartActionInProgress(false);
    }
  }, [cartItems]);

  const filteredEvents = events
    .filter(event => {
      if (user && user.college !== MIT_COLLEGE_NAME) {
        return event.symposiumName === 'Carteblanche';
      }
      return true;
    })
    .filter(event => event.symposiumName === activeSymposium)
    .filter(event => activeCategory ? event.eventCategory === activeCategory : true)
    .sort((a, b) => a.eventCategory.localeCompare(b.eventCategory));

  const handleSwitchToSignUp = () => {
    setIsLoginModalOpen(false);
    setIsSignUpModalOpen(true);
  };

  const handleSwitchToLogin = () => {
    setIsSignUpModalOpen(false);
    setIsLoginModalOpen(true);
  };

  const handleAddToCart = async (event: Event) => {
    if (!isLoggedIn) {
      setIsLoginModalOpen(true);
      return;
    }

    if (!user || !user.email) {
      setModalContent({ title: 'Error', message: 'Could not identify user. Please try logging in again.' });
      setIsModalOpen(true);
      return;
    }

    setIsCartActionInProgress(true);
    try {
      const response = await axios.post('/api/cart', {
        userEmail: user.email,
        eventId: event.id,
        symposiumName: event.symposiumName,
      });

      setModalContent({ title: 'Success', message: 'Event added to cart successfully!' });
      await fetchCartItems();
      setIsModalOpen(true);
    } catch (error: any) {
      setModalContent({ title: 'Error', message: error.response?.data?.message || 'Failed to add event to cart.' });
      setIsModalOpen(true);
      setIsCartActionInProgress(false);
    }
  };

  const handleRemoveFromCart = async (eventId: number) => {
    if (!user || !user.email) return;

    const cartItem = cartItems.find(item => item.eventId === eventId);
    if (!cartItem) return;

    setIsCartActionInProgress(true);
    try {
      await axios.delete(`/api/cart/${cartItem.cartId}`, { data: { userEmail: user.email } });
      setModalContent({ title: 'Success', message: 'Event removed from cart successfully!' });
      await fetchCartItems();
      setIsModalOpen(true);
      setTimeout(() => setIsModalOpen(false), 2000);
    } catch (error: any) {
      setModalContent({ title: 'Error', message: error.response?.data?.message || 'Failed to remove event from cart.' });
      setIsModalOpen(true);
      setTimeout(() => setIsModalOpen(false), 2000);
      setIsCartActionInProgress(false);
    }
  };

  const handleFreeRegistration = async (event: Event) => {
    if (!user) return;

    try {
      await axios.post('/api/registrations/simple', {
        userEmail: user.email,
        eventId: event.id,
        userName: user.name,
        email: user.email,
        college: user.college,
      });
      setRegisteredEvents([...registeredEvents, event.id]);
      setModalContent({ title: 'Registration Successful', message: `You have successfully registered for ${event.eventName}.` });
      setIsModalOpen(true);
    } catch (error: any) {
      setModalContent({ title: 'Registration Failed', message: error.response?.data?.message || 'An error occurred during registration.' });
      setIsModalOpen(true);
    }
  };

  return (
    <div 
      className="relative min-h-screen font-sans text-gray-200 overflow-x-hidden" 
      style={{ fontFamily: "'Poppins', sans-serif" }}
    >
      <div
        className="absolute inset-0 bg-cover bg-center bg-fixed"
        style={{ backgroundImage: `url(${backgroundImage})` }}
      ></div>

      <div className="absolute inset-0 bg-black/70 z-0"></div>

      <Header
        setIsLoginModalOpen={setIsLoginModalOpen}
        setIsSignUpModalOpen={setIsSignUpModalOpen}
      />

      {isLoading || authLoading ? (
        <Loader />
      ) : (
        <div className="container mx-auto p-4 pt-20 relative z-10">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">Events</h2>

          <div className="flex justify-center items-center gap-4 mb-8">
            { (user?.college === MIT_COLLEGE_NAME || !isLoggedIn) &&
            <button
              onClick={() => setActiveSymposium('Enigma')}
              className={`px-6 py-3 font-semibold rounded-lg transition-all duration-300 ${
                activeSymposium === 'Enigma'
                  ? 'bg-purple-600 text-white scale-105 shadow-lg'
                  : 'bg-gray-800/60 text-gray-300 hover:bg-purple-500/50'
              }`}
            >
              Enigma
            </button>
            }
            <button
              onClick={() => setActiveSymposium('Carteblanche')}
              className={`px-6 py-3 font-semibold rounded-lg transition-all duration-300 ${
                activeSymposium === 'Carteblanche'
                  ? 'bg-purple-600 text-white scale-105 shadow-lg'
                  : 'bg-gray-800/60 text-gray-300 hover:bg-purple-500/50'
              }`}
            >
              Carteblanche
            </button>
          </div>

          {eventCategories.length > 0 && (
            <div className="flex flex-wrap justify-center border-b border-gray-700 mb-8">
              {eventCategories.map(category => (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={`px-6 py-3 text-sm font-medium transition ${
                    activeCategory === category
                      ? 'text-purple-400 border-b-2 border-purple-400'
                      : 'text-gray-400 hover:text-purple-300'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          )}

          {filteredEvents.length === 0 ? (
            <p className="text-center text-xl text-gray-400 mt-10">Events haven't started yet.</p>
          ) : (
<div className="max-w-7xl mx-auto flex flex-wrap justify-center gap-8">
              {filteredEvents.map((event) => {
                const isRegistrationClosed = new Date() > new Date(event.lastDateForRegistration);
                const isRegistered = registeredEvents.includes(event.id);
                const isInCart = cartItems.some(item => item.eventId === event.id);
                const symposiumStarted = isSymposiumOpen(activeSymposium);

                return (
                  <div
                    key={event.id}
                    className="relative group overflow-hidden rounded-xl shadow-lg border border-gray-700 bg-gray-800/70 backdrop-blur-md cursor-pointer transition-all duration-500 hover:scale-105 hover:border-blue-400 w-full sm:w-96"
                    onClick={() => handleViewDetails(event)}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-0"></div>

                    <div className="relative z-10 p-6 flex flex-col h-full">
                      {event.posterUrl && (
                        <div className="mb-4">
                          <img
                            src={`/api/${event.posterUrl}`}
                            alt={event.eventName}
                            className="w-full h-48 object-cover rounded-md mx-auto shadow-md"
                          />
                        </div>
                      )}

                      <h3 className="text-2xl font-extrabold text-white mb-1 leading-tight">{event.eventName}</h3>
                      <p className="text-purple-300 text-sm font-medium mb-3">{event.eventCategory}</p>
                      <p className="text-gray-300 text-base mb-4 flex-grow">{event.eventDescription.substring(0, 100)}...</p>

                      {symposiumStarted && (
                        <>
                          <EventCountdown lastDateForRegistration={event.lastDateForRegistration} />

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (isRegistered) return;
                              if (event.registrationFees === 0) {
                                handleFreeRegistration(event);
                              } else {
                                if (isInCart) {
                                  handleRemoveFromCart(event.id);
                                } else {
                                  handleAddToCart(event);
                                }
                              }
                            }}
                            disabled={isRegistrationClosed || isCartActionInProgress || isRegistered}
                            className={`mt-4 inline-block px-4 py-2 font-semibold rounded-lg transition ${
                              isRegistered
                                ? 'bg-gray-600 text-white cursor-not-allowed'
                                : isRegistrationClosed
                                ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                                : event.registrationFees === 0
                                ? 'bg-green-600 text-white hover:bg-green-700'
                                : isInCart
                                ? 'bg-red-600 text-white hover:bg-red-700'
                                : 'bg-purple-600 text-white hover:bg-purple-700'
                            }`}
                          >
                            {isRegistered
                              ? 'Registered'
                              : isRegistrationClosed
                              ? 'Registration Closed'
                              : event.registrationFees === 0
                              ? 'Register for Free'
                              : isInCart
                              ? 'Remove from Cart'
                              : 'Add to Cart'}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      <LoginPage 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)} 
        onSwitchToSignUp={handleSwitchToSignUp} 
        onSwitchToForgotPassword={() => {}}
      />
      <SignUpPage 
        isOpen={isSignUpModalOpen} 
        onClose={() => setIsSignUpModalOpen(false)} 
        onSwitchToLogin={handleSwitchToLogin} 
      />

      <ThemedModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedEvent(null);
          setModalContent({ title: '', message: '' });
        }}
        title={selectedEvent ? selectedEvent.eventName : modalContent.title}
      >
        {selectedEvent ? (
          <div className="text-left max-h-[70vh] overflow-y-auto pr-2 p-4 bg-gray-700/30 rounded-lg shadow-inner">
            {selectedEvent.posterUrl && (
              <div className="mb-6">
                <img
                  src={`/api/${selectedEvent.posterUrl}`}
                  alt={selectedEvent.eventName}
                  className="w-full max-h-80 object-contain rounded-lg shadow-md mx-auto"
                />
              </div>
            )}

            <h3 className="text-2xl font-bold text-white mb-4 border-b border-gray-600 pb-2">{selectedEvent.eventName}</h3>

            <div className="space-y-3 mb-6">
              <p className="text-gray-200 text-lg"><strong className="text-purple-300">Category:</strong> {selectedEvent.eventCategory}</p>
              <p className="text-gray-300 leading-relaxed"><strong className="text-purple-300">Description:</strong> {selectedEvent.eventDescription}</p>
              <div className="grid grid-cols-2 gap-y-2">
                <p className="text-gray-200"><strong className="text-purple-300">Rounds:</strong> {selectedEvent.numberOfRounds}</p>
                <p className="text-gray-200"><strong className="text-purple-300">Type:</strong> {selectedEvent.teamOrIndividual}</p>
                <p className="text-gray-200"><strong className="text-purple-300">Location:</strong> {selectedEvent.location}</p>
                <p className="text-gray-200"><strong className="text-purple-300">Fees:</strong> ₹{selectedEvent.registrationFees}</p>
                <p className="text-gray-200 col-span-2"><strong className="text-purple-300">Last Date:</strong> {new Date(selectedEvent.lastDateForRegistration).toLocaleDateString()}</p>
              </div>
            </div>

            <div className="mb-6 border-t border-gray-600 pt-4">
              <h4 className="text-xl font-semibold text-white mb-3">Coordinator Details:</h4>
              <p className="text-gray-200"><strong className="text-purple-300">Name:</strong> {selectedEvent.coordinatorName}</p>
              <p className="text-gray-200"><strong className="text-purple-300">Contact:</strong> {selectedEvent.coordinatorContactNo}</p>
              <p className="text-gray-200"><strong className="text-purple-300">Email:</strong> {selectedEvent.coordinatorMail}</p>
            </div>

            {selectedEvent.rounds && selectedEvent.rounds.length > 0 && (
              <div className="mb-6 border-t border-gray-600 pt-4">
                <h4 className="text-xl font-semibold text-white mb-3">Rounds:</h4>
                <div className="space-y-3">
                  {selectedEvent.rounds.map((round, index) => (
                    <div key={index} className="p-3 bg-gray-800/50 rounded-md border border-gray-600">
                      <p className="text-gray-200 font-medium"><strong>Round {round.roundNumber}:</strong> {round.roundDetails}</p>
                      <p className="text-gray-400 text-sm mt-1">Date/Time: {new Date(round.roundDateTime).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedEvent.registrationLink && (
              <div className="text-center mt-6 border-t border-gray-600 pt-4">
                <a
                  href={selectedEvent.registrationLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block px-6 py-3 font-bold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  External Registration Link
                </a>
              </div>
            )}
          </div>
        ) : (
          <p className="text-gray-300 mb-6">{modalContent.message}</p>
        )}
      </ThemedModal>

      {selectedWorkshopEvent && (
        <WorkshopRegistrationModal
          isOpen={isWorkshopModalOpen}
          onClose={() => setIsWorkshopModalOpen(false)}
          event={selectedWorkshopEvent}
          isRegistered={registeredEvents.includes(selectedWorkshopEvent.id)}
        />
      )}
    </div>
  );
};

export default EventsPage;
