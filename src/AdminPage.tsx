import React, { useState } from 'react';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import backgroundImage from './Login_Sign/photo.jpeg';
import TimerControl from './components/TimerControl';

const AdminPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showTimer, setShowTimer] = useState(false);

  const getButtonClass = (path: string) => {
    return `px-6 py-3 font-semibold rounded-lg transition-all duration-300 ${
      location.pathname.includes(path)
        ? 'bg-purple-600 text-white scale-105 shadow-lg'
        : 'bg-gray-800/60 text-gray-300 hover:bg-purple-500/50'
    }`;
  };

  return (
    <div
      className="relative min-h-screen font-sans text-gray-200 bg-cover bg-center bg-fixed"
      style={{
        fontFamily: "'Poppins', sans-serif",
        backgroundImage: `url(${backgroundImage})`
      }}
    >
      <div className="absolute inset-0 bg-black/70 z-0"></div>

      <main className="relative z-10 py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-gray-900/70 backdrop-blur-md border border-purple-500/30 p-8 rounded-lg">
            <button 
              onClick={() => setShowTimer(!showTimer)}
              className="px-6 py-3 font-semibold rounded-lg transition-all duration-300 bg-gray-800/60 text-gray-300 hover:bg-purple-500/50 mb-4"
            >
              {showTimer ? 'Hide Timer' : 'Show Timer'}
            </button>
            {showTimer && (
              <>
                <TimerControl />
                <hr className="my-8 border-purple-500/30" />
              </>
            )}
            <Outlet /> {/* ✅ admin nested routes */}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminPage;
