import { useEffect, useState } from 'react';
import { signOut, useSession, getSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { parse } from 'cookie'; // Use the 'cookie' package to parse cookies
import jwt from 'jsonwebtoken';



import styles from '../styles/Home.module.css'; // Import the CSS file

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

export default function Dashboard({ session }) {
  const router = useRouter();
  const [allUsers, setAllUsers] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch("http://localhost:5000/users/last10");
        const data = await response.json();
        setAllUsers(data);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };
    fetchUsers();
  }, []);

  const handleUserSelection = (userId) => {
    router.push(`/chat/${userId}`); // Navigate to the chat page for the selected user
  };

  const handleLogout = async () => {
    await signOut();
    router.push('/login');
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Dashboard</h1>
      <p className={styles.welcomeText}>Welcome, {user.email}!</p>
      <button onClick={handleLogout} className={styles.logoutButton}>
        Logout
      </button>

      <div className={styles.userListContainer}>
        <h2 className={styles.userListTitle}>All Users</h2>
        <ul className={styles.userList}>
          {allUsers.map((user) => (
            <li
              key={user.id}
              onClick={() => handleUserSelection(user.id)}
              className={styles.userItem}
            >
              <span>{user.email}</span>
              <div className={styles.userItemIcon}>🗨️</div> {/* Add a message icon */}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
