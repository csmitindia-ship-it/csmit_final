import React, { useEffect, useState } from 'react';
import Header from '../ui/Header';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/Loader';
import backgroundImage from '../Login_Sign/photo.jpeg';
import ThemedModal from '../components/ThemedModal';
import API_BASE_URL from '../Config';

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
  discountPercentage?: number;
  discountReason?: string;
}

interface Pass {
  id: number;
  name: string;
  cost: number;
  description: string;
}

interface Registration {
  id: number | string;
  itemType: 'event' | 'pass';
  eventId?: number;
  passId?: number;
  round1: -1 | 0 | 1;
  round2: -1 | 0 | 1;
  round3: -1 | 0 | 1;
  event?: Event;
  pass?: Pass;
}

const EnrolledEventsPage: React.FC = () => {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user, isLoggedIn, loading: authLoading } = useAuth();
  const [modal, setModal] = useState({ isOpen: false, title: '', message: '' });
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  const showModal = (title: string, message: string) => {
    setModal({ isOpen: true, title, message });
  };

  const handleViewDetails = (event: Event) => {
    setSelectedEvent(event);
    setIsEventModalOpen(true);
  };

  useEffect(() => {
    const fetchEnrolledEvents = async () => {
      if (!user || !user.id) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/registrations/user/${user.id}`);
        if (!response.ok) {
          if (response.status === 404) {
            setRegistrations([]);
          } else {
            throw new Error('Server error');
          }
        } else {
          const data = await response.json();
          setRegistrations(Array.isArray(data) ? data : [data]);
        }
      } catch (error) {
        console.error("Detailed error in fetchEnrolledEvents:", error);
        showModal('Error', 'Error fetching enrolled events.');
      } finally {
        setIsLoading(false);
      }
    };

    if (isLoggedIn) {
      fetchEnrolledEvents();
    } else {
      setIsLoading(false);
    }
  }, [isLoggedIn, user]);

  const getStatusText = (status: any, roundDate: Date) => {
    const now = new Date();

    if (status === 1) return <span className="text-green-400">Selected</span>;
    if (status === 0) return <span className="text-red-400">Not selected</span>;

    if (roundDate > now) {
      return <span className="text-gray-400">Yet to happen</span>;
    }

    if (status === null || status === -1) return <span className="text-yellow-400">Not attended</span>;

    return <span className="text-gray-400">Status unknown</span>;
  };

  if (isLoading || authLoading) {
    return <Loader />;
  }

  if (!isLoggedIn) {
    return (
      <div className="text-center p-8">
        <h2 className="text-2xl font-bold mb-4">Please Log In</h2>
        <p>You need to be logged in to view your enrolled items.</p>
      </div>
    );
  }

  return (
    <div
      className="relative min-h-screen font-sans text-gray-200 overflow-x-hidden"
      style={{
        fontFamily: "'Poppins', sans-serif",
      }}
    >
      <ThemedModal
        isOpen={modal.isOpen}
        onClose={() => setModal({ isOpen: false, title: '', message: '' })}
        title={modal.title}
      >
        <p>{modal.message}</p>
      </ThemedModal>
      <ThemedModal
        isOpen={isEventModalOpen}
        onClose={() => {
          setIsEventModalOpen(false);
          setSelectedEvent(null);
        }}
        title={selectedEvent ? selectedEvent.eventName : ''}
      >
        {selectedEvent ? (
          <div className="text-white">
            <p className="text-purple-300 text-sm mb-3">{selectedEvent.eventCategory}</p>
            <p className="text-gray-300 text-base mb-4">{selectedEvent.eventDescription}</p>
            <p><strong>Rounds:</strong> {selectedEvent.numberOfRounds}</p>
            <p><strong>Type:</strong> {selectedEvent.teamOrIndividual}</p>
            <p><strong>Location:</strong> {selectedEvent.location}</p>
            <div className="mb-2">
              <strong>Registration Fees: </strong>
              {selectedEvent.discountPercentage && selectedEvent.discountPercentage > 0 ? (
                <span className="inline-block ml-1">
                  <span className="line-through text-red-400 mr-2">
                    ₹{selectedEvent.registrationFees}
                  </span>
                  <span className="text-green-400 font-bold text-lg mr-2">
                    ₹{Math.floor(selectedEvent.registrationFees * (1 - selectedEvent.discountPercentage / 100))}
                  </span>
                  <span className="text-xs bg-yellow-600 text-white px-2 py-1 rounded-full">
                    {selectedEvent.discountPercentage}% OFF: {selectedEvent.discountReason}
                  </span>
                </span>
              ) : (
                <span>₹{selectedEvent.registrationFees}</span>
              )}
            </div>
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
          <p className="text-white">No event details to display.</p>
        )}
      </ThemedModal>
      <div
        className="absolute inset-0 bg-cover bg-center bg-fixed"
        style={{ backgroundImage: `url(${backgroundImage})` }}
      ></div>
      <div className="absolute inset-0 bg-black/70 z-0"></div>

      <Header setIsLoginModalOpen={() => { }} setIsSignUpModalOpen={() => { }} />
      <main className="relative z-10 pt-16">
        <div className="container mx-auto p-4 pt-20">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">My Enrollments</h2>
          {registrations.length === 0 ? (
            <p className="text-center text-xl text-gray-400 mt-10">You have not enrolled in any events or purchased any passes yet, or they have not been verified.</p>
          ) : (
            <div className="max-w-7xl mx-auto flex flex-wrap justify-center gap-8">
              {registrations.map((registration) => {
                if (registration.itemType === 'event' && registration.event) {
                  const hasBeenRejected = (Number(registration.round1) === 0 || Number(registration.round2) === 0 || Number(registration.round3) === 0);
                  let hasNotAttended = false;
                  if (registration.event.rounds) {
                    hasNotAttended = registration.event.rounds.some(round => {
                      const roundStatus = Number(registration[`round${round.roundNumber}` as 'round1' | 'round2' | 'round3']);
                      const roundDate = new Date(round.roundDateTime);
                      const now = new Date();
                      return roundDate < now && roundStatus === -1;
                    });
                  }
                  const cardTheme = hasBeenRejected
                    ? 'border-red-500/50 bg-red-900/20'
                    : hasNotAttended
                      ? 'border-yellow-500/50 bg-yellow-900/20'
                      : 'border-gray-700 bg-gray-800/70';

                  const renderRoundStatus = () => {
                    return registration.event?.rounds?.map(round => (
                      <li key={round.roundNumber}>Round {round.roundNumber}: {getStatusText(registration[`round${round.roundNumber}` as 'round1' | 'round2' | 'round3'], new Date(round.roundDateTime))}</li>
                    ));
                  };

                  return (
                    <div key={`event-${registration.id}`} className={`relative group overflow-hidden rounded-xl shadow-lg backdrop-blur-md w-full sm:w-96 transition-all duration-300 ${cardTheme} cursor-pointer`} onClick={() => registration.event && handleViewDetails(registration.event)}>
                      <div className="relative z-10 p-6 flex flex-col h-full">
                        {registration.event.posterUrl && (
                          <div className="mb-4">
                            <img src={`${API_BASE_URL}${registration.event.posterUrl}`} alt={registration.event.eventName} className="w-full h-48 object-cover rounded-md mx-auto shadow-md" />
                          </div>
                        )}
                        <h3 className="text-2xl font-extrabold text-white mb-1 leading-tight">{registration.event.eventName}</h3>
                        <p className="text-purple-300 text-sm font-medium mb-3">{registration.event.eventCategory}</p>
                        <p className="text-gray-300 text-base mb-4 flex-grow">{registration.event.eventDescription.substring(0, 100)}...</p>

                        <div className="mb-4">
                          {registration.event.discountPercentage && registration.event.discountPercentage > 0 ? (
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2">
                                <span className="line-through text-red-400 text-sm">₹{registration.event.registrationFees}</span>
                                <span className="text-green-400 font-bold text-lg">
                                  ₹{Math.floor(registration.event.registrationFees * (1 - registration.event.discountPercentage / 100))}
                                </span>
                              </div>
                              <span className="text-xs text-yellow-400 italic">
                                {registration.event.discountPercentage}% OFF: {registration.event.discountReason}
                              </span>
                            </div>
                          ) : (
                            registration.event.registrationFees > 0 ? (
                              <p className="text-white font-bold">₹{registration.event.registrationFees}</p>
                            ) : (
                              <p className="text-green-400 font-bold">Free</p>
                            )
                          )}
                        </div>

                        <div className={`mt-4 p-4 rounded-lg ${hasBeenRejected ? 'bg-red-900/30' : hasNotAttended ? 'bg-yellow-900/30' : 'bg-gray-900/50'}`}>
                          <h4 className="font-bold text-lg mb-2 text-white">Round Status</h4>
                          <ul className="space-y-1 text-gray-300">{renderRoundStatus()}</ul>
                        </div>


                      </div>
                    </div>
                  );
                } else if (registration.itemType === 'pass' && registration.pass) {
                  return (
                    <div key={`pass-${registration.id}`} className="relative group overflow-hidden rounded-xl shadow-lg backdrop-blur-md w-full sm:w-96 transition-all duration-300 border-green-500/50 bg-green-900/20">
                      <div className="relative z-10 p-6 flex flex-col h-full">
                        <h3 className="text-2xl font-extrabold text-white mb-1 leading-tight">{registration.pass.name}</h3>
                        <p className="text-gray-300 text-base mb-4 flex-grow">{registration.pass.description}</p>
                        <div className="mt-auto">
                          <p className="text-2xl font-bold text-green-400">₹{registration.pass.cost}</p>
                          <p className="text-green-300 text-sm">Verified and Active</p>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default EnrolledEventsPage;