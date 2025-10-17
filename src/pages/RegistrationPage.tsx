import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Header from '../ui/Header';
import LoginPage from '../Login_Sign/LoginPage';
import SignUpPage from '../Login_Sign/SignUpPage';
import ForgotPassword from '../Login_Sign/Forgot_Pass';
import backgroundImage from '../Login_Sign/photo.jpeg';
import { useSearchParams } from 'react-router-dom';
import GeneralRegistrationForm from './GeneralRegistrationForm';
import WorkshopRegistrationForm from './WorkshopRegistrationForm';
import axios from 'axios';

const RegistrationPage: React.FC = () => {
  const { user } = useAuth();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isSignUpModalOpen, setIsSignUpModalOpen] = useState(false);
  const [isForgotPasswordModalOpen, setIsForgotPasswordModalOpen] = useState(false);
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get('eventId');
  const symposium = searchParams.get('symposium');
  const [event, setEvent] = useState<any>(null);
  const [isRegistered, setIsRegistered] = useState(false);

  useEffect(() => {
    const fetchEventDetails = async () => {
      if (eventId && symposium) {
        try {
          const response = await axios.get(`/api/events/${eventId}?symposium=${symposium}`);
          setEvent(response.data);
        } catch (error) {
          console.error("Error fetching event details:", error);
        }
      }
    };

    const checkRegistrationStatus = async () => {
      if (user && user.email && eventId) {
        try {
          const response = await axios.get(`/api/registrations/${user.email}`);
          const registrations = response.data;
          const isAlreadyRegistered = registrations.some((reg: any) => reg.eventId === parseInt(eventId, 10));
          setIsRegistered(isAlreadyRegistered);
        } catch (error) {
          console.error("Error fetching registration status:", error);
        }
      }
    };

    fetchEventDetails();
    checkRegistrationStatus();
  }, [eventId, symposium, user]);

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

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8 flex flex-col items-center justify-center">
        <p className="text-xl mb-4">You need to be logged in to access this page.</p>
        <button
          onClick={() => setIsLoginModalOpen(true)}
          className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition"
        >
          Login
        </button>
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
      </div>
    );
  }

  return (
    <> 
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700&display=swap');
      `}</style>
      <div 
        className="relative min-h-screen font-sans text-gray-200 overflow-x-hidden"
        style={{
          fontFamily: "'Poppins', sans-serif",
        }}
      >
        <div
          className="absolute inset-0 bg-cover bg-center bg-fixed"
          style={{
            backgroundImage: `url(${backgroundImage})`
          }}
        ></div>

        <div className="absolute inset-0 bg-black/70 z-0"></div>

        <Header 
          setIsLoginModalOpen={setIsLoginModalOpen} 
          setIsSignUpModalOpen={setIsSignUpModalOpen} 
        />
        <div className="pt-20 p-8 relative z-10">
          <h1 className="text-3xl font-bold mb-6">Registration Page</h1>
          <div className="bg-gray-800/80 p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold mb-4">User Details:</h2>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Role:</strong> {user.role}</p>
            {user.name && <p><strong>Name:</strong> {user.name}</p>}
          </div>
          {event && (
            <>
              {symposium === 'Enigma' && event.eventCategory === 'Workshop' ? (
                <WorkshopRegistrationForm 
                  workshop={event}
                  userName={user.name || ''}
                  userEmail={user.email}
                  symposium={symposium}
                  eventId={eventId || ''}
                  registrationFee={event.registrationFees}
                />
              ) : (
                <GeneralRegistrationForm 
                  eventName={event.eventName}
                  userName={user.name || ''}
                  userEmail={user.email}
                  symposium={symposium || ''}
                  eventId={eventId || ''}
                  registrationFees={event.registrationFees}
                />
              )}
            </>
          )}
        </div>
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
      </div>
    </>
  );
};

export default RegistrationPage;
