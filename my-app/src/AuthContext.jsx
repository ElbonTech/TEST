
import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext); // This will allow you to consume the context
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Add an Authorization header to Axios if the user is logged in
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
  
        // Set default Authorization header
        axios.defaults.headers.common['Authorization'] = `Bearer ${user}`;
      } catch (error) {
        console.error('Failed to parse user data:', error);
      }
    }
    setLoading(false);
  }, []);
  

  const login = async (email, password) => {
    try {
      const response = await axios.post('http://localhost:3000/api/auth/login', { email, password });

      // Save the user data and token
      const userData = response.data;
      setUser(response.data.token);
      console.log(response.data.token)

      // Store the user data in localStorage
      localStorage.setItem('user', user);
      
      // Set the default Authorization header
      axios.defaults.headers.common['Authorization'] = `Bearer ${user}`;
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');

    // Remove Authorization header
    delete axios.defaults.headers.common['Authorization'];
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
