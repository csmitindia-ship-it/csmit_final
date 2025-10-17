import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiLogOut } from 'react-icons/fi';

const OrganizerHeader: React.FC = () => {
  const { logout, user } = useAuth();

  return (
    <header 
      className="bg-gray-900 text-white p-4 flex justify-between items-center"
      style={{ fontFamily: "'Poppins', sans-serif" }}
    >
      <div className="flex items-center">
        <Link to="/organizer" className="text-xl font-bold">Organizer Portal</Link>
      </div>
      <nav className="flex-grow flex justify-center items-center space-x-6">
        <Link to="/organizer/registrations/view" className="hover:text-purple-400">View Registrations</Link>
        <Link to="/organizer/registration-status" className="hover:text-purple-400">Registration Status</Link>
        <Link to="/organizer/update-winners" className="hover:text-purple-400">Update Winners</Link>
      </nav>
      <div className="flex items-center">
        <span className="mr-4">Welcome, {user?.name}</span>
        <button onClick={logout} className="flex items-center px-4 py-2 text-sm bg-gray-500 text-white rounded-md hover:bg-gray-600 transition">
          <FiLogOut className="mr-2" />
          Logout
        </button>
      </div>
    </header>
  );
};

export default OrganizerHeader;
