import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import './Dashboard.css';

const Dashboard = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const userToken = localStorage.getItem('user');
  const userDetails = JSON.parse(localStorage.getItem('userDetails'));
  const [products, setProducts] = useState([]); // State to store the products

  // Function to fetch products from the API
  const fetchProducts = async () => {
    const url = 'http://localhost:3000/api/auth/products';
  
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`, // Send token as Bearer in the Authorization header
        },
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const data = await response.json();
      console.log(data)
      setProducts(data.products); // Set products data to state
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  // Fetch products when the component mounts
  useEffect(() => {
    fetchProducts();
  }, []);

  const handleLogout = () => {
    // logout();
    // navigate('/login');
    console.log(userDetails.data.user[0].username);
  };

  const loginWithToken = async (productId) => {
    const redirectUrl = `product`;
    const url = `http://localhost:3000/api/auth/jwt?token=${userToken}&redirectUrl=${redirectUrl}`;
  
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`, // Send token as Bearer in the Authorization header
        },
      });
  
      console.log(response);
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const data = await response.json();
      console.log('Login successful:', data);
      
      // Redirect to product page
      window.location.href = `http://localhost:3000/api/auth/redirect?token=${data.token}&page=products/${productId}`;
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <div className="dashboard-container">
   <header className="dashboard-header">
        
        <h1>Welcome {userDetails?.data?.user[0]?.username} , to Your Dashboard!</h1>
        <p className="welcome-message">
          {userDetails?.data?.user[0]?.email}, You're successfully logged in. Explore the dashboard below.
        </p>
      </header> <header className="dashboard-header">
        
        <h1>Welcome {userDetails?.data?.user[0]?.username} , to Your Dashboard!</h1>
        <p className="welcome-message">
          {userDetails?.data?.user[0]?.email}, You're successfully logged in. Explore the dashboard below.
        </p>
      </header> <header className="dashboard-header">
        
        <h1>Welcome {userDetails?.data?.user[0]?.username} , to Your Dashboard!</h1>
        <p className="welcome-message">
          {userDetails?.data?.user[0]?.email}, You're successfully logged in. Explore the dashboard below.
        </p>
      </header> <header className="dashboard-header">
        
        <h1>Welcome {userDetails?.data?.user[0]?.username} , to Your Dashboard!</h1>
        <p className="welcome-message">
          {userDetails?.data?.user[0]?.email}, You're successfully logged in. Explore the dashboard below.
        </p>
      </header> <header className="dashboard-header">
        
        <h1>Welcome {userDetails?.data?.user[0]?.username} , to Your Dashboard!</h1>
        <p className="welcome-message">
          {userDetails?.data?.user[0]?.email}, You're successfully logged in. Explore the dashboard below.
        </p>
      </header> <header className="dashboard-header">
        
        <h1>Welcome {userDetails?.data?.user[0]?.username} , to Your Dashboard!</h1>
        <p className="welcome-message">
          {userDetails?.data?.user[0]?.email}, You're successfully logged in. Explore the dashboard below.
        </p>
      </header>
      <header className="dashboard-header">
        
        <h1>Welcome {userDetails?.data?.user[0]?.username} , to Your Dashboard!</h1>
        <p className="welcome-message">
          {userDetails?.data?.user[0]?.email}, You're successfully logged in. Explore the dashboard below.
        </p>
      </header>

      {/* E-commerce Products Section */}
      <section>
        <h2 className="section-title">Featured Products From NextJs</h2>
        <div className="product-grid">
          {products.length > 0 ? (
            products.map((product) => (
              <div key={product.id} className="product-card">
                <img
                  src={product.image || `https://via.placeholder.com/200x150?text=Product+${product.id}`}
                  alt={product.name}
                  className="product-image"
                />
                <h3>{product.name}</h3>
                <p className="product-price">${product.price}</p>
                <button
                  className="product-button"
                  onClick={() => loginWithToken(product.id)}
                >
                  View in site
                </button>
              </div>
            ))
          ) : (
            <p>Loading products...</p>
          )}
        </div>
      </section>

      {/* Featured Articles Section */}
      <section>
        <h2 className="section-title">Featured Articles</h2>
        <div className="article-list">
          {[{ title: 'How to Boost Your Productivity', summary: 'Discover the best tips and tricks to boost your productivity in the workplace.' }].map((article, index) => (
            <div key={index} className="article-card">
              <h3>{article.title}</h3>
              <p className="article-summary">{article.summary}</p>
              <a href="#" className="read-more">
                Read more...
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* Quick Links Section */}
      <section>
        <h2 className="section-title">Quick Links</h2>
        <ul className="quick-links">
          <li><a href="#">Profile Settings</a></li>
          <li><a href="#">Order History</a></li>
          <li><a href="#">Customer Support</a></li>
          <li><button onClick={handleLogout} className="logout-button">Logout</button></li>
        </ul>
      </section>
    </div>
  );
};

export default Dashboard;
