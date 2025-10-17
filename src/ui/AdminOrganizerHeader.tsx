import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiLogOut } from 'react-icons/fi';

const AdminOrganizerHeader: React.FC = () => {
  const { logout } = useAuth();

  return (
    <header className="bg-gray-900 text-white p-4 flex justify-between items-center">
      <div className="flex items-center">
        <Link to="/admin/organizer" className="text-xl font-bold">Organizer Portal</Link>
      </div>
      <nav className="flex items-center space-x-4">
        <Link to="/admin/organizer/registrations/view" className="hover:text-purple-400">View Registrations</Link>
        <Link to="/admin/organizer/registration-status" className="hover:text-purple-400">Registration Status</Link>
        <Link to="/admin/organizer/update-winners" className="hover:text-purple-400">Update Winners</Link>
        <button onClick={logout} className="flex items-center px-4 py-2 text-sm bg-gray-500 text-white rounded-md hover:bg-gray-600 transition">
          <FiLogOut className="mr-2" />
          Logout
        </button>
      </nav>
    </header>
  );
};

export default AdminOrganizerHeader;