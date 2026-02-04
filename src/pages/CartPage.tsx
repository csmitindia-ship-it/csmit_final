import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import Header from "../ui/Header";
import LoginPage from '../Login_Sign/LoginPage';
import SignUpPage from '../Login_Sign/SignUpPage';
import ForgotPassword from '../Login_Sign/Forgot_Pass';
import backgroundImage from '../Login_Sign/photo.jpeg';
import WorkshopRegistrationForm from './WorkshopRegistrationForm';
import ThemedModal from '../components/ThemedModal';
import API_BASE_URL from '../Config'; // adjust path if needed

const CartPage: React.FC = () => {
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isSignUpModalOpen, setIsSignUpModalOpen] = useState(false);
  const [isForgotPasswordModalOpen, setIsForgotPasswordModalOpen] = useState(false);
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const [modal, setModal] = useState({ isOpen: false, title: '', message: '' });

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

  interface CartItem {
    cartId: number;
    type: 'event' | 'pass' | 'accommodation';
    eventDetails?: {
      eventName: string;
      eventCategory: string;
      eventDescription: string;
      registrationFees: number;
      lastDateForRegistration: string;
      coordinatorName: string;
      coordinatorContactNo: string;
      discountPercentage?: number;
      mit_discount_percentage?: number;
      discountReason?: string;
    };
    passDetails?: {
      name: string;
      cost: number;
      description: string;
    };
    accommodationDetails?: {
      name: string;
      cost: number;
      quantity: number;
    };
    // Common fields
    eventId?: number;
    symposiumName?: string;
    passId?: number;
    gender?: 'male' | 'female';
  }

  const showModal = (title: string, message: string) => {
    setModal({ isOpen: true, title, message });
  };

  useEffect(() => {
    const fetchCartItems = async () => {
      if (!user) {
        setCartItems([]);
        setLoading(false);
        showModal('Login Required', 'Please log in to view your cart.');
        return;
      }
      setLoading(true);
      try {
        const response = await axios.get(`${API_BASE_URL}/cart/${user.id}`);
        setCartItems(response.data || []);
      } catch (error) {
        showModal('Error', 'Error fetching cart items.');
        console.error('Failed to fetch cart items:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCartItems();
  }, [user]);

  const handleRemoveFromCart = async (item: CartItem) => {
    if (!user || !item) return;
    try {
      if (item.type === 'event') {
        await axios.delete(`${API_BASE_URL}/cart/${item.cartId}`, {
          data: { userEmail: user.email },
        });
      } else if (item.type === 'pass') {
        await axios.delete(`${API_BASE_URL}/pass-cart/${item.cartId}`);
      } else if (item.type === 'accommodation') {
        await axios.delete(`${API_BASE_URL}/accommodation/cart/${user.id}`);
      }
      setCartItems(cartItems.filter((i) => i.cartId !== item.cartId || i.type !== item.type));
    } catch (error) {
      showModal('Error', 'Error removing item from cart.');
    }
  };

  const handleRegisterAll = async () => {
    if (!user) {
      showModal('Login Required', 'Please log in to register for events.');
      return;
    }

    const eventItems = cartItems.filter(item => item && item.type === 'event');

    const hasPaidItems = cartItems.some(item => {
      if (item.type === 'pass') return (item.passDetails?.cost || 0) > 0;
      if (item.type === 'event' && item.eventDetails) {
        const fee = item.eventDetails.registrationFees;
        const mitDiscount = item.eventDetails.mit_discount_percentage || 0;
        const genDiscount = item.eventDetails.discountPercentage || 0;

        let discount = 0;
        if (user && user.college && (user.college.toLowerCase().includes('mit') || user.college.toLowerCase().includes('madras institute of technology'))) {
          discount = mitDiscount || genDiscount;
        } else {
          discount = genDiscount;
        }

        const finalPrice = Math.floor(fee * (1 - discount / 100));
        return finalPrice > 0;
      }
      if (item.type === 'accommodation' && item.accommodationDetails) {
        return (item.accommodationDetails.cost * item.accommodationDetails.quantity) > 0;
      }
      return false;
    });

    if (hasPaidItems) {
      setShowRegistrationForm(true);
    } else {
      // Handle only free events if no paid items are in the cart
      for (const item of eventItems) {
        if (item && item.eventDetails) {
          try {
            await axios.post(`${API_BASE_URL}/registrations/simple`, {
              userEmail: user.email,
              eventId: item.eventId,
            });
            setCartItems(prevItems => prevItems.filter(i => i.cartId !== item.cartId || i.type !== 'event'));
          } catch (error) {
            showModal('Error', `Failed to register for ${item.eventDetails.eventName}. You might be already registered.`);
          }
        }
      }
      if (eventItems.length > 0) {
        window.dispatchEvent(new CustomEvent('registrationComplete'));
        showModal('Success', 'Successfully registered for all free events!');
      }
    }
  };


  const handleRegistrationSuccess = async () => {
    if (!user) return;

    const itemsToRemove = [...cartItems];

    setCartItems([]);
    setShowRegistrationForm(false);
    window.dispatchEvent(new CustomEvent('registrationComplete'));
    showModal('Success', 'Registration successful for all items!');

    try {
      for (const item of itemsToRemove) {
        if (item.type === 'event') {
          await axios.delete(`${API_BASE_URL}/cart/${item.cartId}`, {
            data: { userEmail: user.email },
          });
        } else if (item.type === 'pass') {
          await axios.delete(`${API_BASE_URL}/pass-cart/${item.cartId}`);
        } else if (item.type === 'accommodation') {
          await axios.delete(`${API_BASE_URL}/accommodation/cart/${user.id}`);
        }
      }
    } catch (error) {
      console.error('Failed to clear some items from cart on backend:', error);
    }
  };

  const totalAmount = (cartItems || []).reduce((total, item) => {
    let price = 0;
    if (item.type === 'event' && item.eventDetails) {
      const original = item.eventDetails.registrationFees;
      const mitDiscount = item.eventDetails.mit_discount_percentage || 0;
      const genDiscount = item.eventDetails.discountPercentage || 0;

      let discount = 0;
      if (user && user.college && (user.college.toLowerCase().includes('mit') || user.college.toLowerCase().includes('madras institute of technology'))) {
        discount = mitDiscount || genDiscount;
      } else {
        discount = genDiscount;
      }

      price = Math.floor(original * (1 - discount / 100));
    } else if (item.type === 'pass' && item.passDetails) {
      price = item.passDetails.cost;
    } else if (item.type === 'accommodation' && item.accommodationDetails) {
      price = item.accommodationDetails.cost * item.accommodationDetails.quantity;
    }
    return total + price;
  }, 0);

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

        <Header setIsLoginModalOpen={setIsLoginModalOpen} setIsSignUpModalOpen={setIsSignUpModalOpen} />

        <main className="relative z-10 flex items-center justify-center min-h-screen pt-16">
          <div className="container mx-auto p-4 bg-gray-900/70 backdrop-blur-md border border-purple-500/30 rounded-lg">
            {showRegistrationForm ? (
              <WorkshopRegistrationForm
                cartItems={cartItems}
                onRegistrationSuccess={handleRegistrationSuccess}
                onCancel={() => setShowRegistrationForm(false)}
              />
            ) : (
              <>
                <h1 className="text-2xl font-bold mb-4 text-center">Your Cart</h1>
                {loading ? (
                  <div>Loading...</div>
                ) : !Array.isArray(cartItems) || cartItems.length === 0 ? (
                  <p className="text-center">Your cart is empty.</p>
                ) : (
                  <div>
                    <div className="flex flex-wrap gap-4 justify-center">
                      {Array.isArray(cartItems) && cartItems.map((item) => (
                        <div key={`${item.type}-${item.cartId}`} className="bg-gray-800/80 p-6 rounded-lg w-full sm:w-96 border border-gray-700">
                          {item.type === 'event' && item.eventDetails && (
                            <>
                              <h2 className="text-xl font-semibold mb-1">{item.eventDetails.eventName}</h2>
                              <p className="text-sm text-gray-400 mb-2">{item.eventDetails.eventCategory}</p>
                              <p className="mb-3 text-sm">{item.eventDetails.eventDescription}</p>

                              <div className="mt-2">
                                <strong>Fee: </strong>
                                {(() => {
                                  const mitDiscount = item.eventDetails.mit_discount_percentage || 0;
                                  const genDiscount = item.eventDetails.discountPercentage || 0;

                                  const isMIT = user && user.college && (user.college.toLowerCase().includes('mit') || user.college.toLowerCase().includes('madras institute of technology'));

                                  let discountToShow = 0;
                                  let reasonToShow = '';

                                  if (isMIT) {
                                    if (mitDiscount > 0) {
                                      discountToShow = mitDiscount;
                                      reasonToShow = 'MIT Student Special Discount';
                                    } else if (genDiscount > 0) {
                                      discountToShow = genDiscount;
                                      reasonToShow = item.eventDetails.discountReason || 'Special Discount';
                                    }
                                  } else {
                                    discountToShow = genDiscount;
                                    reasonToShow = item.eventDetails.discountReason || '';
                                  }

                                  if (discountToShow > 0) {
                                    return (
                                      <span>
                                        <span className="line-through text-red-400 mr-2">₹{item.eventDetails.registrationFees}</span>
                                        <span className="text-green-400 font-bold text-lg">
                                          ₹{Math.floor(item.eventDetails.registrationFees * (1 - discountToShow / 100))}
                                        </span>
                                        <div className="text-xs text-yellow-500 mt-1">
                                          {discountToShow}% OFF: {reasonToShow}
                                        </div>
                                      </span>
                                    );
                                  }
                                  return <span>₹{item.eventDetails.registrationFees}</span>;
                                })()}
                              </div>
                            </>
                          )}
                          {item.type === 'pass' && item.passDetails && (
                            <>
                              <h2 className="text-xl font-semibold">{item.passDetails.name}</h2>
                              <p>{item.passDetails.description}</p>
                              <p className="mt-2"><strong>Cost:</strong> ₹{item.passDetails.cost}</p>
                            </>
                          )}
                          {item.type === 'accommodation' && item.accommodationDetails && (
                            <>
                              <h2 className="text-xl font-semibold">{item.accommodationDetails.name}</h2>
                              <p className="mt-2"><strong>Quantity:</strong> {item.accommodationDetails.quantity}</p>
                              <p className="mt-2"><strong>Cost:</strong> ₹{item.accommodationDetails.cost * item.accommodationDetails.quantity} (₹{item.accommodationDetails.cost} each)</p>
                            </>
                          )}
                          <button
                            onClick={() => handleRemoveFromCart(item)}
                            className="mt-4 px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 transition w-full"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-col items-center mt-8">
                      <div className="text-xl font-bold mb-4 p-4 bg-gray-800 rounded-lg border border-purple-500/50">
                        Total Amount: <span className="text-green-400">₹{totalAmount}</span>
                      </div>

                      <button
                        onClick={handleRegisterAll}
                        className="px-6 py-3 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 transition disabled:bg-gray-500 disabled:cursor-not-allowed shadow-lg"
                        disabled={cartItems.length === 0}
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
        >
          <p>{modal.message}</p>
        </ThemedModal>

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

export default CartPage;
