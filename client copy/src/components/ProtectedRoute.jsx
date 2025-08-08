import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

/**
 * A route guard that redirects unauthenticated users to the login page.
 * It preserves the user's intended location to redirect back after login.
 * @param {object} props - Component props.
 * @param {React.ReactNode} props.children - The child components to render if the user is authenticated.
 * @returns {React.ReactNode} The children or a Navigate component.
 */
const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  const accessToken = localStorage.getItem('accessToken');

  if (!accessToken) {
    // Redirect them to the /login page, but save the current location they were
    // trying to go to. This allows us to send them along to that page after a
    // successful login.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;