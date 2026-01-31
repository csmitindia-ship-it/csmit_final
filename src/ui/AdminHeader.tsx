import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FiLogOut, FiUserPlus, FiSettings, FiMenu, FiX } from 'react-icons/fi';
import AddOrganizerModal from '../components/AddOrganizerModal';
import Dropdown from '../components/Dropdown';
import SymposiumControlModal from '../components/SymposiumControlModal';

const AdminHeader: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isAddOrganizerModalOpen, setIsAddOrganizerModalOpen] = useState(false);
  const [isSymposiumModalOpen, setIsSymposiumModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    if (isMobileMenuOpen) setIsMobileMenuOpen(false);
    logout();
    navigate('/');
  };

  const managementItems = [
    { label: 'Manage Events', onClick: () => { navigate('/admin/manage-events'); setIsMobileMenuOpen(false); } },
    { label: 'Manage Accommodation', onClick: () => { navigate('/admin/manage-accommodation'); setIsMobileMenuOpen(false); } },
    { label: 'View Events', onClick: () => { navigate('/admin/events-display'); setIsMobileMenuOpen(false); } },
    { label: 'Pending Experiences', onClick: () => { navigate('/admin/pending-experiences'); setIsMobileMenuOpen(false); } },
    { label: 'Approved Experiences', onClick: () => { navigate('/admin/approved-experiences'); setIsMobileMenuOpen(false); } },
    { label: 'Account Details', onClick: () => { navigate('/admin/account-details'); setIsMobileMenuOpen(false); } },
    { label: 'View Registrations', onClick: () => { navigate('/admin/view-registrations'); setIsMobileMenuOpen(false); } },
    { label: 'Registration Status', onClick: () => { navigate('/admin/registration-status'); setIsMobileMenuOpen(false); } },
    { label: 'Update Winners', onClick: () => { navigate('/admin/update-winners'); setIsMobileMenuOpen(false); } },
    { label: 'Registered Users', onClick: () => { navigate('/admin/registered-users'); setIsMobileMenuOpen(false); } },
    { label: 'View Organizers', onClick: () => { navigate('/admin/view-organizers'); setIsMobileMenuOpen(false); } },
    { label: 'Manage Passes', onClick: () => { navigate('/admin/manage-passes'); setIsMobileMenuOpen(false); } },
    { label: 'Register User', onClick: () => { navigate('/admin/register-user'); setIsMobileMenuOpen(false); } },
    { label: 'Verify Transaction', onClick: () => { navigate('/admin/verify-transaction'); setIsMobileMenuOpen(false); } },
  ];

  const desktopMenu = (
    <div className="hidden md:flex items-center gap-4">
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
  );

  const mobileMenu = (
    <div className="md:hidden">
      <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-white">
        {isMobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
      </button>
      {isMobileMenuOpen && (
        <div className="absolute top-16 left-0 right-0 bg-black p-4 z-30">
          <div className="flex flex-col gap-4">
            <span className="text-sm">Welcome, {user?.name || user?.email}</span>
            {user?.role === 'admin' && (
              <>
                <Dropdown
                  buttonText="Management"
                  items={managementItems}
                />
                <button
                  onClick={() => { setIsSymposiumModalOpen(true); setIsMobileMenuOpen(false); }}
                  className="flex items-center px-4 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition"
                >
                  <FiSettings className="mr-2" />
                  Symposium Control
                </button>
                <button
                  onClick={() => { setIsAddOrganizerModalOpen(true); setIsMobileMenuOpen(false); }}
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
        </div>
      )}
    </div>
  );

  return (
    <>
      <header className="bg-black text-white p-4 flex justify-between items-center sticky top-0 z-20">
        <h1 className="text-xl font-bold">
          {user?.role === 'admin' ? 'Admin Dashboard' : `Organizer Dashboard`}
        </h1>
        {desktopMenu}
        {mobileMenu}
      </header>
      <AddOrganizerModal isOpen={isAddOrganizerModalOpen} onClose={() => setIsAddOrganizerModalOpen(false)} />
      <SymposiumControlModal isOpen={isSymposiumModalOpen} onClose={() => setIsSymposiumModalOpen(false)} />
    </>
  );
};

export default AdminHeader;