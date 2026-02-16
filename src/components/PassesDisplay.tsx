import React, { useState, useEffect, useCallback } from 'react';
import API_BASE_URL from '../Config';
import { FiTag, FiX } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { useModal } from '../context/ModalContext'; // Import useModal
import { useNavigate } from 'react-router-dom';
import ThemedModal from './ThemedModal';

interface Pass {
    id: number;
    name: string;
    cost: number;
    description: string;
    accountId?: number;
}

interface CartItem {
    id: number;
    passId: number;
}

interface PassesDisplayProps {
    onCartUpdate?: () => void;
}

const PassesDisplay: React.FC<PassesDisplayProps> = ({ onCartUpdate }) => {
    const [passes, setPasses] = useState<Pass[]>([]);
    const [selectedPass, setSelectedPass] = useState<Pass | null>(null);
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [verifiedPassIds, setVerifiedPassIds] = useState<number[]>([]);
    const { user, isLoggedIn } = useAuth();
    const { openLoginModal } = useModal(); // Use opensLoginModal from context
    const navigate = useNavigate();
    const [modal, setModal] = useState({ isOpen: false, title: '', message: '', type: 'info' });

    const fetchCartItems = useCallback(async () => {
        if (!user) return;
        try {
            const response = await fetch(`${API_BASE_URL}/pass-cart/${user.id}`);
            if (response.ok) {
                const data = await response.json();
                if (Array.isArray(data)) {
                    setCartItems(data);
                } else {
                    console.error("Cart items data is not an array:", data);
                    setCartItems([]);
                }
            }
        } catch (error) {
            console.error('Error fetching cart items:', error);
        }
    }, [user]);

    const fetchVerifiedPasses = useCallback(async () => {
        if (!user) return;
        try {
            const response = await fetch(`${API_BASE_URL}/registrations/verified/${user.id}`);
            if (response.ok) {
                const data = await response.json();
                if (Array.isArray(data)) {
                    const passIds = data.map((item: any) => item.passId).filter((id: any) => id !== null);
                    setVerifiedPassIds(passIds);
                } else {
                    console.error("Verified passes data is not an array:", data);
                    setVerifiedPassIds([]);
                }
            }
        } catch (error) {
            console.error('Error fetching verified passes:', error);
        }
    }, [user]);

    useEffect(() => {
        const fetchPasses = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/passes`);
                if (response.ok) {
                    const data = await response.json();
                    if (Array.isArray(data)) {
                        setPasses(data);
                    } else {
                        console.error("Passes data is not an array:", data);
                        setPasses([]);
                    }
                }
            } catch (error) {
                console.error('Error fetching passes:', error);
            }
        };

        fetchPasses();
    }, []);

    useEffect(() => {
        if (isLoggedIn) {
            fetchCartItems();
            fetchVerifiedPasses();
        }
    }, [isLoggedIn, fetchCartItems, fetchVerifiedPasses]);

    const handleAddToCart = async (pass: Pass) => {
        if (!isLoggedIn) {
            openLoginModal(); // Use openLoginModal
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/pass-cart`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userId: user?.id, passId: pass.id }),
            });

            if (response.ok) {
                setModal({ isOpen: true, title: 'Success', message: `${pass.name} added to cart!`, type: 'success' });
                fetchCartItems();
                if (onCartUpdate) onCartUpdate();
                setSelectedPass(null);
            } else {
                const errorData = await response.json();
                setModal({ isOpen: true, title: 'Error', message: errorData.message || 'Failed to add item to cart.', type: 'error' });
            }
        } catch (error) {
            console.error('Failed to add to cart:', error);
            setModal({ isOpen: true, title: 'Error', message: 'An unexpected error occurred.', type: 'error' });
        }
    };

    const handleRemoveFromCart = async (passId: number) => {
        const cartItem = getCartItemForPass(passId);
        if (!cartItem) {
            console.error("Cart item not found for passId:", passId);
            setModal({ isOpen: true, title: 'Error', message: 'Could not find item to remove.', type: 'error' });
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/pass-cart/${cartItem.id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                setModal({ isOpen: true, title: 'Success', message: 'Pass removed from cart.', type: 'info' });
                fetchCartItems();
                if (onCartUpdate) onCartUpdate();
                setSelectedPass(null);
            } else {

                const errorData = await response.json();
                setModal({ isOpen: true, title: 'Error', message: errorData.message || 'Failed to remove item from cart.', type: 'error' });
            }
        } catch (error) {
            console.error('Failed to remove from cart:', error);
            setModal({ isOpen: true, title: 'Error', message: 'An unexpected error occurred.', type: 'error' });
        }
    };

    const getCartItemForPass = (passId: number): CartItem | undefined => {
        return cartItems.find(item => item.passId === passId);
    };

    const isPassVerified = (passId: number): boolean => {
        return verifiedPassIds.includes(passId);
    }

    if (passes.length === 0) {
        return null;
    }

    return (
        <>
            <ThemedModal
                isOpen={modal.isOpen}
                onClose={() => setModal(prev => ({ ...prev, isOpen: false }))}
                title={modal.title}
                hideDefaultFooter={modal.type === 'success'}
            >
                <p className="text-white">{modal.message}</p>
                {modal.type === 'success' && (
                    <div className="flex justify-end space-x-4 mt-6">
                        <button
                            onClick={() => setModal(prev => ({ ...prev, isOpen: false }))}
                            className="px-5 py-2 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition-colors"
                        >
                            Continue Shopping
                        </button>
                        <button
                            onClick={() => {
                                setModal(prev => ({ ...prev, isOpen: false }));
                                navigate('/cart');
                            }}
                            className="px-5 py-2 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors"
                        >
                            Go to Cart
                        </button>
                    </div>
                )}
            </ThemedModal>
            <div className="fixed bottom-4 right-4 flex flex-col items-end gap-3 z-20">
                {passes.map((pass) => (
                    <div key={pass.id} className="flex flex-col items-center">
                        <button
                            onClick={() => setSelectedPass(pass)}
                            className="p-3 bg-gradient-to-br from-purple-500 to-indigo-600 text-white rounded-full shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-transform hover:scale-125 animate-zoom-in-out"
                            title={`View details for ${pass.name}`}
                        >
                            <FiTag size={24} />
                        </button>
                        <span className="text-white text-sm mt-1 bg-black/50 rounded px-2 py-1">{pass.name}</span>
                    </div>
                ))}
            </div>

            {selectedPass && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-800 border border-purple-500/50 rounded-lg shadow-xl max-w-sm w-full relative text-white">
                        <button
                            onClick={() => setSelectedPass(null)}
                            className="absolute top-2 right-2 text-gray-400 hover:text-white"
                        >
                            <FiX size={24} />
                        </button>
                        <div className="p-8">
                            <h2 className="text-2xl font-bold text-purple-400 mb-2">{selectedPass.name}</h2>
                            <p className="text-3xl font-bold mb-4">₹{selectedPass.cost}</p>
                            <p className="text-gray-300 mb-6">{selectedPass.description}</p>
                            {isLoggedIn ? (
                                isPassVerified(selectedPass.id) ? (
                                    <button
                                        disabled
                                        className="w-full bg-green-600 text-white py-2 rounded-lg cursor-not-allowed"
                                    >
                                        Pass is Active
                                    </button>
                                ) : getCartItemForPass(selectedPass.id) ? (
                                    <button
                                        onClick={() => handleRemoveFromCart(selectedPass.id)}
                                        className="w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition-colors"
                                    >
                                        Remove from Cart
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => handleAddToCart(selectedPass)}
                                        className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition-colors"
                                    >
                                        Add to Cart
                                    </button>
                                )
                            ) : (
                                <button
                                    onClick={() => openLoginModal()} // Use openLoginModal
                                    className="w-full bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700 transition-colors"
                                >
                                    Log in to Purchase
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default PassesDisplay;