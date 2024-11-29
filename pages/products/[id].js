// pages/products/[id].js
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { parse } from 'cookie'; // Use the 'cookie' package to parse cookies
import jwt from 'jsonwebtoken';

export async function getServerSideProps(context) {
  const { req } = context;

  // Parse cookies from the request headers
  const cookies = parse(req.headers.cookie || '');

  // Get the auth_token cookie
  const token = cookies.auth_token;

  if (!token) {
    // Redirect to login if no token is found
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }

  try {
    // Verify the token
    const secretKey = process.env.JWT_SECRET; // Ensure this is set in your .env file
    const decoded = jwt.verify(token, secretKey);
    console.log(decoded)
    // Pass the decoded token and the raw token to the page as props
    return {
      props: {
        user: decoded,
        token, // Pass the raw token as a prop
      },
    };
  } catch (error) {
    console.error('Invalid token:', error);

    // Redirect to login if token verification fails
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }
}



const ProductPage = ({ user, token }) => {
  const router = useRouter();
  const { id } = router.query;  // This will give you the dynamic product ID (e.g., 107)

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);  // For the modal state

  useEffect(() => {
    if (id) {
      // Fetch product data from your API or server-side logic
      const fetchProduct = async () => {
        const response = await fetch(`/api/auth/products?id=${id}`);
        const data = await response.json();
        console.log(user)
        setProduct(data.product);  // Assuming the response contains a 'product' object
        setLoading(false);
      };

      fetchProduct();
    }
  }, [id]);

  const handleBuyNow = () => {
    // Open the modal when Buy Now is clicked
    setIsModalOpen(true);

    // Simulate a delay to process the purchase (e.g., API call)
    setTimeout(() => {
      setIsModalOpen(false); // Close the modal after processing
      alert(`${user.username}, You have successfully bought ${product.name}! order details has been sent to ${user.mail}`);
    }, 2000); // Simulate a 2-second delay for processing
  };

  if (loading) {
    return <div style={loadingStyle}>Loading...</div>;
  }

  return (
    <div style={pageStyle}>
      <h1>Welcome back, {user.username} </h1>
      <h1 style={titleStyle}>Product ID: {product.id}</h1>
      <p style={productNameStyle}><strong>Name:</strong> {product.name}</p>
      <p style={productPriceStyle}><strong>Price:</strong> ${product.price}</p>
      <p style={productCategoryStyle}><strong>Category:</strong> {product.category}</p>
      <p style={productMessageStyle}><strong>Message:</strong> {product.message}</p>

      <button onClick={handleBuyNow} style={buyNowButtonStyle}>
        Buy Now
      </button>

      {/* Modal to show that the product is being processed */}
      {isModalOpen && (
        <div style={modalBackdropStyle}>
          <div style={modalContentStyle}>
            <h2 style={modalTitleStyle}>Processing Your Order...</h2>
            <p style={modalMessageStyle}>Please wait while we process your purchase.</p>
          </div>
        </div>
      )}
    </div>
  );
};

// Styles for the page and components
const pageStyle = {
  padding: '20px',
  fontFamily: 'Arial, sans-serif',
  backgroundColor: '#f7f7f7',
  minHeight: '100vh',
};

const titleStyle = {
  textAlign: 'center',
  color: '#333',
  marginBottom: '20px',
};

const productNameStyle = {
  fontSize: '1.2rem',
  color: '#444',
};

const productPriceStyle = {
  fontSize: '1.2rem',
  color: '#28a745',
};

const productCategoryStyle = {
  fontSize: '1rem',
  color: '#007bff',
};

const productMessageStyle = {
  fontSize: '1rem',
  color: '#555',
  fontStyle: 'italic',
};

const buyNowButtonStyle = {
  display: 'block',
  width: '100%',
  padding: '15px',
  marginTop: '30px',
  backgroundColor: '#28a745',
  color: 'white',
  border: 'none',
  borderRadius: '8px',
  fontSize: '1.1rem',
  cursor: 'pointer',
  transition: 'background-color 0.3s',
};

const buyNowButtonHoverStyle = {
  backgroundColor: '#218838',
};

const modalBackdropStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.6)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 9999,
};

const modalContentStyle = {
  backgroundColor: '#fff',
  padding: '30px',
  borderRadius: '10px',
  textAlign: 'center',
  minWidth: '300px',
  boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
};

const modalTitleStyle = {
  fontSize: '1.5rem',
  color: '#333',
  marginBottom: '10px',
};

const modalMessageStyle = {
  fontSize: '1rem',
  color: '#555',
};

const loadingStyle = {
  textAlign: 'center',
  fontSize: '1.5rem',
  marginTop: '50px',
  color: '#333',
};

export default ProductPage;
