import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Import useAuth
import API_BASE_URL from '../Config';


interface LoginPageProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToSignUp: () => void;
  onSwitchToForgotPassword: () => void;
}

export default function LoginPage({ isOpen, onClose, onSwitchToSignUp, onSwitchToForgotPassword }: LoginPageProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSwitchToSignUp = (e: React.MouseEvent) => {
    e.preventDefault();
    onSwitchToSignUp();
  };

  const handleSwitchToForgotPassword = (e: React.MouseEvent) => {
    e.preventDefault();
    onSwitchToForgotPassword();
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email === 'csmitindia@gmail.com' && password === 'Csmit@2025') {
      login(null, email, 'admin');
      navigate('/admin/manage-events');
      onClose();
    } else {
      try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (response.ok) {
          if (data.user.role === 'organizer') {
            login(data.user.id, data.user.email, 'organizer', data.user.name, data.user.college);
            navigate('/organizer');
          } else {
            login(data.user.id, data.user.email, 'student', data.user.fullName, data.user.college);
            navigate('/');
          }
          onClose();
        } else {
          alert(data.message || 'Invalid credentials. Please try again.');
        }
      } catch (error) {
        console.error('Login failed:', error);
        alert('An error occurred during login. Please try again.');
      }
    }
  };

  // Fixed: Always return the modal div, hide it when not open
  return (
    <div
      className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-opacity duration-300 ${
        isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
      }`}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-gray-900/80 border border-purple-500/30 rounded-2xl p-8 shadow-2xl shadow-purple-500/20 z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-purple-400 transition-colors duration-300"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white">CSMIT</h2>
          <p className="text-purple-300">Member, Admin & Organizer Login</p>
        </div>

        <form className="space-y-6" onSubmit={handleLogin}>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Email Address</label>
            <input
              type="email"
              placeholder="you@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-gray-800/60 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300"
            />
          </div>

          <div className="relative">
            <label className="block text-sm font-medium text-gray-400 mb-2">Password</label>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-gray-800/60 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 top-7 pr-3 flex items-center text-gray-400 hover:text-purple-400"
            >
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.022 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  <path d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.022 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" />
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  <path d="M10 3a7 7 0 00-7 7c0 1.55.49 3 1.32 4.24L2.5 15.5a1 1 0 001.41 1.41L15.5 5.32A7 7 0 0010 3zm-1.9 8.9a2 2 0 01-2.82-2.82L7.18 7.17a4 4 0 005.66 5.66l-1.9-1.9z" />
                </svg>
              )}
            </button>
          </div>

          <div className="flex items-center justify-between">
            <a href="#" onClick={handleSwitchToForgotPassword} className="text-sm text-purple-400 hover:underline">
              Forgot Password?
            </a>
          </div>

          <div>
            <button type="submit" className="w-full px-8 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:scale-105 transition-transform duration-300 shadow-lg glow-button">
              Login
            </button>
          </div>
        </form>

        <p className="text-center text-sm text-gray-400 mt-8">
          Don't have an account?{' '}
          <a href="#" onClick={handleSwitchToSignUp} className="font-medium text-purple-400 hover:underline">
            Sign up
          </a>
        </p>
      </div>
    </div>
  );
}
