import React, { useEffect, useState } from 'react';
import Header from '../ui/Header'; 
import backgroundImage from '../Login_Sign/photo.jpeg'; 
import LoginPage from '../Login_Sign/LoginPage'; 
import SignUpPage from '../Login_Sign/SignUpPage'; 
import Loader from '../components/Loader'; 
import { useAuth } from '../context/AuthContext'; 
import ThemedModal from '../components/ThemedModal';
import EventCountdown from '../components/EventCountdown'; 
import WorkshopRegistrationModal from '../components/WorkshopRegistrationModal';
import PassesDisplay from '../components/PassesDisplay';
import axios from 'axios';
import API_BASE_URL from '../Config'; // adjust path if needed
import { useLocation } from 'react-router-dom';

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
  open_to_non_mit?: boolean | number;
  posterImage?: string;
  discountPercentage?: number;
  discountReason?: string;
  mit_discount_percentage?: number;
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
  const [selectedWorkshopEvent] = useState<Event | null>(null);
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [isCartActionInProgress, setIsCartActionInProgress] = useState(false);
  const [symposiumStatus, setSymposiumStatus] = useState<any[]>([]);
  const [activePasses, setActivePasses] = useState<string[]>([]);

  const { user, isLoggedIn, loading: authLoading } = useAuth();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const symposium = params.get('symposium');
    if (symposium === 'Enigma' || symposium === 'Carteblanche') {
      setActiveSymposium(symposium);
    }
  }, [location.search]);

  const MIT_COLLEGE_NAME = "Madras Institute of Technology";

  const isMITStudentHelper = (collegeName?: string) => {
    if (!collegeName) return false;
    const lowerCaseCollege = collegeName.toLowerCase().trim();
    return lowerCaseCollege === "madras institute of technology" || lowerCaseCollege === "mit";
  };

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
      const response = await axios.get(`${API_BASE_URL}/events`);
      setEvents(response.data);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSymposiumStatus = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/symposium/status`);
      setSymposiumStatus(response.data.data);
    } catch (error) {
      console.error('Error fetching symposium status:', error);
    }
  };

  const fetchRegisteredEvents = async () => {
    if (!user || !user.email) return;
    try {
      const response = await axios.get(`${API_BASE_URL}/registrations/by-email/${user.email}`);
      setRegisteredEvents(response.data.map((reg: any) => reg.eventId));
    } catch (error) {
      console.error('Error fetching registered events:', error);
    }
  };

  const fetchCartItems = async () => {
    if (!user || !user.id) return;
    try {
      const response = await axios.get(`${API_BASE_URL}/cart/${user.id}`);
      setCartItems(response.data);
    } catch (error) {
      console.error('Error fetching cart items:', error);
    }
  };

  const fetchVerifiedPasses = async () => {
    if (!user || !user.id) return;
    try {
      const response = await axios.get(`${API_BASE_URL}/registrations/verified/${user.id}`);
      const passNames = response.data
        .filter((item: any) => item.passId !== null && item.passName)
        .map((item: any) => item.passName);
      setActivePasses(passNames);
    } catch (error) {
      console.error('Error fetching verified passes:', error);
    }
  };

  useEffect(() => {
    fetchEvents();
    fetchSymposiumStatus();
    if (isLoggedIn) {
      fetchRegisteredEvents();
      fetchCartItems();
      fetchVerifiedPasses();
    }

    const handleRegistrationComplete = () => {
      fetchRegisteredEvents();
      fetchVerifiedPasses();
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
  .filter(event => event.symposiumName === activeSymposium)
  .filter(event => (activeCategory ? event.eventCategory === activeCategory : true))
  .filter(event => {
    if (user && isMITStudentHelper(user.college)) {
      return true; // MIT students see all events
    }
    // For non-MIT students and non-logged-in users, show events that are not explicitly closed to them
    return event.open_to_non_mit !== false && event.open_to_non_mit !== 0;
  })
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
      await axios.post(`${API_BASE_URL}/cart`, {
        userEmail: user.email,
        eventId: event.id,
        symposiumName: activeSymposium,
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
      await axios.delete(`${API_BASE_URL}/cart/${cartItem.cartId}`, { data: { userEmail: user.email } });
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
      await axios.post(`${API_BASE_URL}/registrations/simple`, {
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

                const hasTechPass = activePasses.some(pass => pass.toLowerCase().includes('technical'));
                const hasNonTechPass = activePasses.some(pass => pass.toLowerCase().includes('non-technical'));
                const isTechnical = event.eventCategory.toLowerCase().includes('technical');
                const isNonTechnical = event.eventCategory.toLowerCase().includes('non-technical');
                const hasPassCoverage = (isTechnical && hasTechPass) || (isNonTechnical && hasNonTechPass);
                
                const isMITStudent = isMITStudentHelper(user?.college);
                let discountToShow;
                let reasonToShow;

                if (isMITStudent) {
                    discountToShow = event.mit_discount_percentage;
                    reasonToShow = '';
                } else {
                    discountToShow = event.discountPercentage;
                    reasonToShow = event.discountReason;
                }

                return (
                  <div
                    key={event.id}
                    className="relative group overflow-hidden rounded-xl shadow-lg border border-gray-700 bg-gray-800/70 backdrop-blur-md cursor-pointer transition-all duration-500 hover:scale-105 hover:border-blue-400 w-full sm:w-96"
                    onClick={() => handleViewDetails(event)}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-0"></div>

                    <div className="relative z-10 p-6 flex flex-col h-full">
                      {event.posterImage && (
                          <div className="mb-4 w-full bg-black/40 rounded-md shadow-md flex justify-center items-center overflow-hidden" style={{ aspectRatio: '4 / 5' }}>
                            <img
                              src={`data:image/jpeg;base64,${event.posterImage}`}
                              alt={event.eventName}
                              className="w-full h-full object-contain"
                            />
                          </div>
                        )}

                      <h3 className="text-2xl font-extrabold text-white mb-1 leading-tight">{event.eventName}</h3>
                      <p className="text-purple-300 text-sm font-medium mb-3">{event.eventCategory}</p>
                      <p className="text-gray-300 text-base mb-4 flex-grow">{event.eventDescription.substring(0, 100)}...</p>

                      {/* --- DISCOUNT PRICE DISPLAY IN CARD --- */}
                      {symposiumStarted && (
                        <div className="mb-4">
                           {discountToShow && discountToShow > 0 ? (
                             <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                  <span className="line-through text-red-400 text-sm">₹{event.registrationFees}</span>
                                  <span className="text-green-400 font-bold text-lg">
                                    ₹{Math.floor(event.registrationFees * (1 - discountToShow / 100))}
                                  </span>
                                </div>
                                {reasonToShow && (
                                  <span className="text-xs text-yellow-400 italic">
                                    {discountToShow}% OFF: {reasonToShow}
                                  </span>
                                )}
                             </div>
                           ) : (
                              event.registrationFees > 0 ? (
                                <p className="text-white font-bold">₹{event.registrationFees}</p>
                              ) : (
                                <p className="text-green-400 font-bold">Free</p>
                              )
                           )}
                        </div>
                      )}
                      {/* ------------------------------------- */}

                      {symposiumStarted && (
                        <>
                          <EventCountdown lastDateForRegistration={event.lastDateForRegistration} />

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (isRegistered || hasPassCoverage) return;
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
                            disabled={isRegistrationClosed || isCartActionInProgress || isRegistered || hasPassCoverage}
                            className={`mt-4 inline-block px-4 py-2 font-semibold rounded-lg transition ${
                              hasPassCoverage
                                ? 'bg-teal-600 text-white cursor-not-allowed'
                                : isRegistered
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
                            {hasPassCoverage
                              ? 'Pass Obtained'
                              : isRegistered
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

      <PassesDisplay />
      <LoginPage 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)} 
        onSwitchToSignUp={handleSwitchToSignUp} 
        onSwitchToForgotPassword={() => {}}
      />
      <ThemedModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedEvent(null);
        }}
        title={selectedEvent ? selectedEvent.eventName : modalContent.title}
      >
        {selectedEvent ? (
          <div className="text-white">
            <p className="text-purple-300 text-sm mb-3">{selectedEvent.eventCategory}</p>
            <p className="text-gray-300 text-base mb-4">{selectedEvent.eventDescription}</p>
            <p><strong>Rounds:</strong> {selectedEvent.numberOfRounds}</p>
            <p><strong>Type:</strong> {selectedEvent.teamOrIndividual}</p>
            <p><strong>Location:</strong> {selectedEvent.location}</p>
            
            {/* --- DISCOUNT PRICE DISPLAY IN MODAL --- */}
            <div className="mb-2">
              <strong>Registration Fees: </strong>
              {(() => {
                const isMITStudent = isMITStudentHelper(user?.college);
                const discountToShow = isMITStudent && selectedEvent.mit_discount_percentage ? selectedEvent.mit_discount_percentage : selectedEvent.discountPercentage;
                const reasonToShow = isMITStudent ? '' : selectedEvent.discountReason;

                if (discountToShow && discountToShow > 0) {
                  return (
                    <span className="inline-block ml-1">
                      <span className="line-through text-red-400 mr-2">
                        ₹{selectedEvent.registrationFees}
                      </span>
                      <span className="text-green-400 font-bold text-lg mr-2">
                        ₹{Math.floor(selectedEvent.registrationFees * (1 - discountToShow / 100))}
                      </span>
                      {reasonToShow && (
                        <span className="text-xs bg-yellow-600 text-white px-2 py-1 rounded-full">
                          {discountToShow}% OFF: {reasonToShow}
                        </span>
                      )}
                    </span>
                  );
                }
                return <span>₹{selectedEvent.registrationFees}</span>;
              })()}
            </div>
            {/* --------------------------------------- */}

            <p><strong>Coordinator:</strong> {selectedEvent.coordinatorName} ({selectedEvent.coordinatorContactNo})</p>
            <p><strong>Coordinator Email:</strong> {selectedEvent.coordinatorMail}</p>
            <p><strong>Last Date for Registration:</strong> {new Date(selectedEvent.lastDateForRegistration).toLocaleString()}</p>
            {selectedEvent.rounds && selectedEvent.rounds.map((round, index) => (
              <div key={index} className="ml-4 mt-2">
                <p><strong>Round {round.roundNumber}:</strong> {round.roundDetails}</p>
                <p>Date & Time: {new Date(round.roundDateTime).toLocaleString()}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-white">{modalContent.message}</p>
        )}
      </ThemedModal>
    </div>
  );
};

export default EventsPage;