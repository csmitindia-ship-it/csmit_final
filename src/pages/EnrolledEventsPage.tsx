import React, { useEffect, useState } from 'react';
import Header from '../ui/Header';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/Loader';
import { Link } from 'react-router-dom';
import backgroundImage from '../Login_Sign/photo.jpeg';
import ThemedModal from '../components/ThemedModal';
import API_BASE_URL from '../Config'; // adjust path if needed

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
}

interface Registration {
  id: number;
  eventId: number;
  round1: -1 | 0 | 1;
  round2: -1 | 0 | 1;
  round3: -1 | 0 | 1;
  event?: Event;
}

const EnrolledEventsPage: React.FC = () => {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user, isLoggedIn, loading: authLoading } = useAuth();
  const [modal, setModal] = useState({ isOpen: false, title: '', message: '' });

  const showModal = (title: string, message: string) => {
    setModal({ isOpen: true, title, message });
  };

  useEffect(() => {
    const fetchEnrolledEvents = async () => {
      if (!user || !user.id) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const response = await fetch(`/api/registrations/user/${user.id}`);
        const data = await response.json();
        setRegistrations(Array.isArray(data) ? data : [data]);
      } catch (error) {
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
    const statusNum = Number(status);

    if (statusNum === 0) return <span className="text-red-400">Not selected for next round</span>;
    if (statusNum === 1) return <span className="text-green-400">Selected</span>;
    if (roundDate > now) {
      return <span className="text-gray-400">Yet to happen</span>;
    }
    return <span className="text-yellow-400">Not attended the event</span>;
  };

  if (isLoading || authLoading) {
    return <Loader />;
  }

  if (!isLoggedIn) {
    return (
      <div className="text-center p-8">
        <h2 className="text-2xl font-bold mb-4">Please Log In</h2>
        <p>You need to be logged in to view your enrolled events.</p>
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
        message={modal.message}
      />
      <div
        className="absolute inset-0 bg-cover bg-center bg-fixed"
        style={{
          backgroundImage: `url(${backgroundImage})`
        }}
      ></div>

      <div className="absolute inset-0 bg-black/70 z-0"></div>

      <Header setIsLoginModalOpen={() => {}} setIsSignUpModalOpen={() => {}} />
      <main className="relative z-10 pt-16">
        <div className="container mx-auto p-4 pt-20">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">My Enrolled Events</h2>
          {registrations.length === 0 ? (
            <p className="text-center text-xl text-gray-400 mt-10">You have not enrolled in any events yet, or none of your registrations have been verified.</p>
          ) : (
            <div className="max-w-7xl mx-auto flex flex-wrap justify-center gap-8">
              {registrations.map((registration) => {
                if (!registration.event) {
                  return null;
                }

                const hasBeenRejected = Number(registration.round1) === 0 || Number(registration.round2) === 0 || Number(registration.round3) === 0;
                
                let hasNotAttended = false;
                if (registration.event && registration.event.rounds) {
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
                  const rounds = [];
                  if (registration.event && registration.event.rounds) {
                    for (const round of registration.event.rounds) {
                      const roundStatus = registration[`round${round.roundNumber}` as 'round1' | 'round2' | 'round3'];
                      rounds.push(
                        <li key={round.roundNumber}>Round {round.roundNumber}: {getStatusText(roundStatus, new Date(round.roundDateTime))}</li>
                      );
                    }
                  }
                  return rounds;
                };

                return (
                  <div
                    key={registration.id}
                    className={`relative group overflow-hidden rounded-xl shadow-lg backdrop-blur-md w-full sm:w-96 transition-all duration-300 ${cardTheme}`}>
                    <div className="relative z-10 p-6 flex flex-col h-full">
                      {registration.event.posterUrl && (
                        <div className="mb-4">
                          <img
                            src={`${API_BASE_URL}${registration.event.posterUrl}`}
                            alt={registration.event.eventName}
                            className="w-full h-48 object-cover rounded-md mx-auto shadow-md"
                          />
                        </div>
                      )}
                      <h3 className="text-2xl font-extrabold text-white mb-1 leading-tight">{registration.event.eventName}</h3>
                      <p className="text-purple-300 text-sm font-medium mb-3">{registration.event.eventCategory}</p>
                      <p className="text-gray-300 text-base mb-4 flex-grow">{registration.event.eventDescription.substring(0, 100)}...</p>
                      
                      <div className={`mt-4 p-4 rounded-lg ${hasBeenRejected ? 'bg-red-900/30' : hasNotAttended ? 'bg-yellow-900/30' : 'bg-gray-900/50'}`}>
                        <h4 className="font-bold text-lg mb-2 text-white">Round Status</h4>
                        <ul className="space-y-1 text-gray-300">
                          {renderRoundStatus()}
                        </ul>
                      </div>

                      <Link to={`/events`}>
                        <button className="mt-4 inline-block px-4 py-2 font-semibold rounded-lg transition bg-purple-600 text-white hover:bg-purple-700">
                          View Event Details
                        </button>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default EnrolledEventsPage;