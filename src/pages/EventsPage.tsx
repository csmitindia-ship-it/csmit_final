import React, { useEffect, useState } from 'react';
import Header from '../ui/Header';
import backgroundImage from '../Login_Sign/photo.jpeg';
import LoginPage from '../Login_Sign/LoginPage';
import SignUpPage from '../Login_Sign/SignUpPage';
import ForgotPassword from '../Login_Sign/Forgot_Pass';
import Loader from '../components/Loader';
import { useAuth } from '../context/AuthContext';
import ThemedModal from '../components/ThemedModal';
import EventCountdown from '../components/EventCountdown';
import PassesDisplay from '../components/PassesDisplay';
import axios from 'axios';
import API_BASE_URL from '../Config'; // adjust path if needed
import { useLocation } from 'react-router-dom';
import OfferBanner from '../components/OfferBanner';

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
  const [isForgotPasswordModalOpen, setIsForgotPasswordModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [registeredEvents, setRegisteredEvents] = useState<number[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState({ title: '', message: '' });
  const [eventCategories, setEventCategories] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
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

  const isMITStudentHelper = (collegeName?: string) => {
    if (!collegeName) return false;
    const lowerCaseCollege = collegeName.toLowerCase().replace(/[^a-z0-9]/g, '');
    return lowerCaseCollege.includes('madrasinstituteoftechnology') || lowerCaseCollege === 'mit';
  };

  const isSymposiumOpen = (symposiumName: 'Enigma' | 'Carteblanche') => {
    // Safety check: symposiumStatus might be undefined initially
    if (!symposiumStatus) return false;
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
      if (Array.isArray(response.data)) {
        setRegisteredEvents(response.data.map((reg: any) => reg.eventId));
      } else {
        console.error('Expected array for registered events but got:', response.data);
        setRegisteredEvents([]);
      }
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

      // DEBUG: Log fetched passes
      console.log('[DEBUG] Fetched verified passes for user:', passNames);

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

    // Auto-switch symposium if the default one is empty
    const checkAndSwitchSymposium = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/events`);
        const allEvents: Event[] = response.data;
        if (Array.isArray(allEvents) && allEvents.length > 0) {
          const params = new URLSearchParams(location.search);
          if (!params.get('symposium')) {
            const hasEnigma = allEvents.some(e => e.symposiumName === 'Enigma');
            const hasCB = allEvents.some(e => e.symposiumName === 'Carteblanche');
            if (!hasEnigma && hasCB && activeSymposium === 'Enigma') {
              setActiveSymposium('Carteblanche');
            }
          }
        }
      } catch (err) {
        console.error('Error in auto-switch logic:', err);
      }
    };
    checkAndSwitchSymposium();

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
    if (!Array.isArray(events)) {
      setEventCategories([]);
      setActiveCategory(null);
      return;
    }
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

  const filteredEvents = Array.isArray(events) ? events
    .filter(event => event.symposiumName === activeSymposium)
    .filter(event => (activeCategory ? event.eventCategory === activeCategory : true))
    .filter(event => {
      // Show all events in the list for browsing
      // Restrictions will be handled at the registration button level
      return true;
    })
    .sort((a, b) => a.eventCategory.localeCompare(b.eventCategory)) : [];


  const handleSwitchToSignUp = () => {
    setIsLoginModalOpen(false);
    setIsSignUpModalOpen(true);
  };

  const handleSwitchToLogin = () => {
    setIsSignUpModalOpen(false);
    setIsForgotPasswordModalOpen(false);
    setIsLoginModalOpen(true);
  };

  const handleSwitchToForgotPassword = () => {
    setIsLoginModalOpen(false);
    setIsForgotPasswordModalOpen(true);
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
          <div className="fixed top-16 left-0 w-screen z-20">
            <OfferBanner />
          </div>
          <h2 className="text-3xl font-bold text-white mb-8 text-center mt-12">Events</h2>

          <div className="flex justify-center items-center gap-4 mb-8">
            <button
              onClick={() => setActiveSymposium('Enigma')}
              className={`px-6 py-3 font-semibold rounded-lg transition-all duration-300 ${activeSymposium === 'Enigma'
                ? 'bg-purple-600 text-white scale-105 shadow-lg'
                : 'bg-gray-800/60 text-gray-300 hover:bg-purple-500/50'
                }`}
            >
              Enigma
            </button>

            <button
              onClick={() => setActiveSymposium('Carteblanche')}
              className={`px-6 py-3 font-semibold rounded-lg transition-all duration-300 ${activeSymposium === 'Carteblanche'
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
                  className={`px-6 py-3 text-sm font-medium transition ${activeCategory === category
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

                // Check if user has tech or non-tech pass
                // Check if user has tech or non-tech pass
                const hasTechPass = activePasses.some(pass => {
                  const passLower = pass.toLowerCase();
                  return passLower.includes('tech') &&
                    !passLower.includes('non-tech') &&
                    !passLower.includes('nontech') &&
                    !passLower.includes('non tech');
                });
                const hasNonTechPass = activePasses.some(pass => {
                  const passLower = pass.toLowerCase();
                  return passLower.includes('non-tech') ||
                    passLower.includes('nontech') ||
                    passLower.includes('non tech');
                });

                // Check if event is technical or non-technical
                const isTechnicalEvent = event.eventCategory.toLowerCase().includes('technical') && !event.eventCategory.toLowerCase().includes('non');
                const isNonTechnicalEvent = event.eventCategory.toLowerCase().includes('non-technical') || event.eventCategory.toLowerCase().includes('non technical');

                const hasPassCoverage = (isTechnicalEvent && hasTechPass) || (isNonTechnicalEvent && hasNonTechPass);

                const isMITStudent = isMITStudentHelper(user?.college);

                // Use MIT discount if available and user is MIT student, otherwise fallback to general discount.
                // If user is NOT MIT student, use general discount only.
                const mitDiscount = event.mit_discount_percentage || 0;
                const genDiscount = event.discountPercentage || 0;

                let discountToShow = 0;
                let reasonToShow = '';

                if (isMITStudent) {
                  if (mitDiscount > 0) {
                    discountToShow = mitDiscount;
                    reasonToShow = 'MIT Student Special Discount';
                  } else if (genDiscount > 0) {
                    discountToShow = genDiscount;
                    reasonToShow = event.discountReason || 'Special Discount';
                  }
                } else {
                  discountToShow = genDiscount;
                  reasonToShow = event.discountReason || '';
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
                            disabled={isRegistrationClosed || isCartActionInProgress || isRegistered || hasPassCoverage || !isLoggedIn || (!isMITStudent && event.open_to_non_mit === 0)}
                            className={`mt-4 inline-block px-4 py-2 font-semibold rounded-lg transition ${hasPassCoverage
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
                                : !isLoggedIn
                                  ? 'Login to Register'
                                  : (!isMITStudent && event.open_to_non_mit === 0)
                                    ? 'MIT Only Event'
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
        onSwitchToForgotPassword={handleSwitchToForgotPassword}
      />
      <SignUpPage
        isOpen={isSignUpModalOpen}
        onClose={() => setIsSignUpModalOpen(false)}
        onSwitchToLogin={handleSwitchToLogin}
      />
      <ForgotPassword
        isOpen={isForgotPasswordModalOpen}
        onClose={() => setIsForgotPasswordModalOpen(false)}
        onSwitchToLogin={handleSwitchToLogin}
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
                const mitDiscount = selectedEvent.mit_discount_percentage || 0;
                const genDiscount = selectedEvent.discountPercentage || 0;

                let discountToShow = 0;
                let reasonToShow = '';

                if (isMITStudent) {
                  if (mitDiscount > 0) {
                    discountToShow = mitDiscount;
                    reasonToShow = 'MIT Student Special Discount';
                  } else if (genDiscount > 0) {
                    discountToShow = genDiscount;
                    reasonToShow = selectedEvent.discountReason || 'Special Discount';
                  }
                } else {
                  discountToShow = genDiscount;
                  reasonToShow = selectedEvent.discountReason || 'Special Discount';
                }

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