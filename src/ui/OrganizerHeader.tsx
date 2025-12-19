import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiLogOut, FiMenu, FiX } from 'react-icons/fi';

const OrganizerHeader: React.FC = () => {
  const { logout, user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    setIsMobileMenuOpen(false);
    logout();
    navigate('/');
  };

  const navLinks = (
    <>
      <Link to="/organizer/registrations/view" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-purple-400 block py-2 md:py-0">View Registrations</Link>
      <Link to="/organizer/registration-status" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-purple-400 block py-2 md:py-0">Registration Status</Link>
      <Link to="/organizer/update-winners" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-purple-400 block py-2 md:py-0">Update Winners</Link>
    </>
  );

  return (
    <header 
      className="bg-gray-900 text-white p-4 sticky top-0 z-20"
      style={{ fontFamily: "'Poppins', sans-serif" }}
    >
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center">
          <Link to="/organizer" className="text-xl font-bold">Organizer Portal</Link>
        </div>
        <nav className="hidden md:flex flex-grow justify-center items-center space-x-6">
          {navLinks}
        </nav>
        <div className="hidden md:flex items-center">
          <span className="mr-4">Welcome, {user?.name}</span>
          <button onClick={handleLogout} className="flex items-center px-4 py-2 text-sm bg-gray-500 text-white rounded-md hover:bg-gray-600 transition">
            <FiLogOut className="mr-2" />
            Logout
          </button>
        </div>
        <div className="md:hidden">
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-white">
            {isMobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>
        </div>
      </div>
      {isMobileMenuOpen && (
        <div className="md:hidden bg-gray-900 absolute top-16 left-0 right-0 p-4">
          <nav className="flex flex-col space-y-4 mb-4">
            {navLinks}
          </nav>
          <div className="border-t border-gray-700 pt-4">
            <span className="block mb-2">Welcome, {user?.name}</span>
            <button onClick={handleLogout} className="flex items-center px-4 py-2 w-full text-left text-sm bg-gray-500 text-white rounded-md hover:bg-gray-600 transition">
              <FiLogOut className="mr-2" />
              Logout
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default OrganizerHeader;
