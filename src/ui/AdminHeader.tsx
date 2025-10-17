import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FiLogOut, FiUserPlus, FiSettings } from 'react-icons/fi';
import AddOrganizerModal from '../components/AddOrganizerModal';
import Dropdown from '../components/Dropdown';
import SymposiumControlModal from '../components/SymposiumControlModal';

const AdminHeader: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isAddOrganizerModalOpen, setIsAddOrganizerModalOpen] = useState(false);
  const [isSymposiumModalOpen, setIsSymposiumModalOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const managementItems = [
    { label: 'Manage Events', onClick: () => navigate('/admin/manage-events') },
    { label: 'View Events', onClick: () => navigate('/admin/events-display') },
    { label: 'Pending Experiences', onClick: () => navigate('/admin/pending-experiences') },
    { label: 'Approved Experiences', onClick: () => navigate('/admin/approved-experiences') },
    { label: 'Account Details', onClick: () => navigate('/admin/account-details') },
    { label: 'View Registrations', onClick: () => navigate('/admin/view-registrations') },
    { label: 'Registration Status', onClick: () => navigate('/admin/registration-status') },
    { label: 'Update Winners', onClick: () => navigate('/admin/update-winners') },
  ];

  return (
    <>
      <header className="bg-black text-white p-4 flex justify-between items-center sticky top-0 z-20">
        <h1 className="text-xl font-bold">
          {user?.role === 'admin' ? 'Admin Dashboard' : `Organizer Dashboard`}
        </h1>
        <div className="flex items-center gap-4">
          <span className="text-sm">Welcome, {user?.name || user?.email}</span>
          {user?.role === 'admin' && (
            <>
              <Dropdown
                buttonText="Management"
                items={managementItems}
              />
              <button
                onClick={() => setIsSymposiumModalOpen(true)}
                className="flex items-center px-4 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition"
              >
                <FiSettings className="mr-2" />
                Symposium Control
              </button>
              <button
                onClick={() => setIsAddOrganizerModalOpen(true)}
                className="flex items-center px-4 py-2 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700 transition"
              >
                <FiUserPlus className="mr-2" />
                Add Organizer
              </button>
            </>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center px-4 py-2 text-sm bg-gray-500 text-white rounded-md hover:bg-gray-600 transition"
          >
            <FiLogOut className="mr-2" />
            Logout
          </button>
        </div>
      </header>
      <AddOrganizerModal isOpen={isAddOrganizerModalOpen} onClose={() => setIsAddOrganizerModalOpen(false)} />
      <SymposiumControlModal isOpen={isSymposiumModalOpen} onClose={() => setIsSymposiumModalOpen(false)} />
    </>
  );
};

export default AdminHeader;