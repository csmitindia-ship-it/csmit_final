import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import Header from "../ui/Header";
import backgroundImage from '../Login_Sign/photo.jpeg';
import WorkshopRegistrationForm from './WorkshopRegistrationForm';
import ThemedModal from '../components/ThemedModal';

interface CartItem {
  cartId: number;
  eventId: number;
  symposiumName: string;
  eventDetails: {
    eventName: string;
    eventCategory: string;
    eventDescription: string;
    registrationFees: number;
    lastDateForRegistration: string;
    coordinatorName: string;
    coordinatorContactNo: string;
  };
}

const CartPage: React.FC = () => {
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isSignUpModalOpen, setIsSignUpModalOpen] = useState(false);
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const [modal, setModal] = useState({ isOpen: false, title: '', message: '' });

  const showModal = (title: string, message: string) => {
    setModal({ isOpen: true, title, message });
  };

  useEffect(() => {
    const fetchCartItems = async () => {
      if (!user) return;
      try {
        const response = await axios.get(`/api/cart/${user.id}`);
        setCartItems(response.data);
      } catch (error) {
        showModal('Error', 'Error fetching cart items.');
      }
      setLoading(false);
    };

    fetchCartItems();
  }, [user]);

  const handleRemoveFromCart = async (cartId: number) => {
    if (!user) return;
    try {
      await axios.delete(`/api/cart/${cartId}`, {
        data: { userEmail: user.email },
      });
      setCartItems(cartItems.filter((item) => item.cartId !== cartId));
    } catch (error) {
      showModal('Error', 'Error removing item from cart.');
    }
  };

  const handleRegisterAll = async () => {
    if (!user) return;

    const freeEvents = cartItems.filter(item => item.eventDetails.registrationFees === 0);
    const paidEvents = cartItems.filter(item => item.eventDetails.registrationFees > 0);

    if (paidEvents.length > 0) {
      setShowRegistrationForm(true);
    } else {
      for (const item of freeEvents) {
        try {
          await axios.post(`/api/registrations/simple`, {
            userEmail: user.email,
            eventId: item.eventId,
          });
          setCartItems(prevItems => prevItems.filter(i => i.cartId !== item.cartId));
        } catch (error) {
          showModal('Error', `Failed to register for ${item.eventDetails.eventName}. You might be already registered.`);
        }
      }
      if (cartItems.length > 0 && freeEvents.length === cartItems.length) {
        window.dispatchEvent(new CustomEvent('registrationComplete'));
        showModal('Success', 'Successfully registered for all free events!');
      }
    }
  };

  const handleRegistrationSuccess = async () => {
    if (!user) return;

    const freeEvents = cartItems.filter(item => item.eventDetails.registrationFees === 0);
    for (const item of freeEvents) {
      try {
        await axios.post(`/api/registrations/simple`, {
          userEmail: user.email,
          eventId: item.eventId,
        });
      } catch (error) {
        showModal('Error', `Error registering for free event ${item.eventId}.`);
      }
    }

    for (const item of cartItems) {
      try {
        await axios.delete(`/api/cart/${item.cartId}`, {
          data: { userEmail: user.email },
        });
      } catch (error) {
        showModal('Error', `Error removing item from cart ${item.cartId}.`);
      }
    }
    setCartItems([]);
    setShowRegistrationForm(false);
    window.dispatchEvent(new CustomEvent('registrationComplete'));
    showModal('Success', 'Registration successful for all events!');
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700&display=swap');
        
        .glow-button:hover { box-shadow: 0 0 15px 2px rgba(167, 139, 250, 0.6); }

        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-100%); }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
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

        <Header setIsLoginModalOpen={setIsLoginModalOpen} setIsSignUpModalOpen={setIsSignUpModalOpen}  />

        <main className="relative z-10 flex items-center justify-center min-h-screen pt-16">
            <div className="container mx-auto p-4 bg-gray-900/70 backdrop-blur-md border border-purple-500/30 rounded-lg">
              {showRegistrationForm ? (
                <WorkshopRegistrationForm 
                  userId={user.id}
                  userName={user.name || ""}
                  userEmail={user.email}
                  paidEvents={cartItems.filter(item => item.eventDetails.registrationFees > 0)}
                  onRegistrationSuccess={handleRegistrationSuccess}
                  onCancel={() => setShowRegistrationForm(false)}
                />
              ) : (
                <>
                  <h1 className="text-2xl font-bold mb-4 text-center">Your Cart</h1>
                  {loading ? (
                    <div>Loading...</div>
                  ) : cartItems.length === 0 ? (
                    <p className="text-center">Your cart is empty.</p>
                  ) : (
                    <div>
                      <div className="flex flex-wrap gap-4 justify-center">
                        {cartItems.map((item) => (
                          <div key={item.cartId} className="bg-gray-800/80 p-6 rounded-lg w-full sm:w-96">
                            <h2 className="text-xl font-semibold">{item.eventDetails.eventName}</h2>
                            <p>{item.eventDetails.eventDescription}</p>
                            <p><strong>Fee:</strong> {item.eventDetails.registrationFees}</p>
                            <button
                              onClick={() => handleRemoveFromCart(item.cartId)}
                              className="mt-2 px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 transition"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-center mt-4">
                        <button
                          onClick={handleRegisterAll}
                          className="px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 transition"
                        >
                          Register for All Events
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
        </main>
        <ThemedModal 
          isOpen={modal.isOpen} 
          onClose={() => setModal({ isOpen: false, title: '', message: '' })} 
          title={modal.title} 
          message={modal.message} 
        />
      </div>
    </>
  );
};

export default CartPage;
