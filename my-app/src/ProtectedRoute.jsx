import React, { useContext } from 'react';
import AuthContext from './AuthContext';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);

  const userToken = localStorage.getItem('user'); // Retrieve the token
  console.log('User Token:', userToken);


  if (loading) return <p>Loading...</p>;

  if (!userToken) {
    return <p>You must be logged in to access this page.</p>;
  }

  return children;
};

export default ProtectedRoute;
