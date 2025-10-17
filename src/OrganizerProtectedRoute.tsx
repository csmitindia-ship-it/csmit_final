import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

interface OrganizerProtectedRouteProps {
  children?: React.ReactElement;
}

const OrganizerProtectedRoute: React.FC<OrganizerProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();
  console.log('OrganizerProtectedRoute user:', user);

  if (loading) {
    return <div>Loading...</div>; // Or a spinner
  }

  if (!user || user.role !== 'organizer') {
    return <Navigate to="/" replace />;
  }

  return children ? children : <Outlet />;
};

export default OrganizerProtectedRoute;
