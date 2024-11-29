import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Login.css'; // Add a CSS file for styling

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null); // State to track errors
  const navigate = useNavigate(); // Initialize navigate

  const login = async (email, password) => {
    try {
      const response = await axios.post('http://localhost:5000/login', { email, password });
      console.log(response)
      // Save the user token
      const userToken = response.data.token;
      localStorage.setItem('userDetails', JSON.stringify(response));
      localStorage.setItem('user', userToken); // Store the token in localStorage
      
      // Set the default Authorization header for axios requests
     // axios.defaults.headers.common['Authorization'] = `Bearer ${userToken}`;
      
      return true; // Return true on successful login
    } catch (error) {
      console.error('Login failed:', error);
      return false; // Return false on error
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const success = await login(email, password); // Await login and check success
      if (success) {
        navigate('/dashboard'); // Redirect to dashboard on success
      } else {
        setError('Login failed. Please check your credentials.');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2 className="login-title">Login</h2>
        <form onSubmit={handleLogin} className="login-form">
          <input
            type="email"
            className="login-input"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            className="login-input"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit" className="login-button">Login</button>
        </form>
        {error && <p className="error-message">{error}</p>}
      </div>
    </div>
  );
};

export default Login;
