import { useEffect, useState } from 'react';
import { signOut, useSession, getSession } from 'next-auth/react';
import { useRouter } from 'next/router';


import styles from '../styles/Home.module.css'; // Import the CSS file

export async function getServerSideProps(context) {
  const session = await getSession(context);
  if (!session) {
    return {
      redirect: { destination: '/login', permanent: false },
    };
  }
  return { props: { session } };
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
      <p className={styles.welcomeText}>Welcome, {session.user.email}!</p>
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
