import { useEffect, useState } from 'react';
import { signOut, getSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import styles from '../styles/Dashboard.module.css'; // Import the CSS module

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
    if (session) {
      const fetchAllChatsforUser = async () => {
        try {
          const response = await fetch(`http://localhost:5000/chats/${session.user.id}`);
          const data = await response.json();

          // Filter for unique conversations by receiverId
          const uniqueConversations = Object.values(
            data.reduce((acc, message) => {
              acc[message.receiverId] = message;
              return acc;
            }, {})
          );

          setAllUsers(uniqueConversations);
        } catch (error) {
          console.error("Error fetching users:", error);
        }
      };
      fetchAllChatsforUser();
    }
  }, [session]);

  const handleUserSelection = (userId) => {
    router.push(`/chat/${userId}`);
  };

  const handleLogout = async () => {
    await signOut();
    router.push('/login');
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.header}>Previous Chats</h1>
      <p className={styles.subHeader}>Welcome, {session.user.email}!</p>
      <button
        onClick={handleLogout}
        className={styles.button}
      >
        Logout
      </button>

      <div className={styles.contentContainer}>
        <h2 className="text-xl font-semibold mb-2">All Users</h2>
        <ul className={styles.userList}>
          {allUsers.map((user) => (
            <li
              key={user.receiverId}
              onClick={() => handleUserSelection(user.receiverId)}
              className={styles.userItem}
            >
              {user.content} - {new Date(user.timestamp).toLocaleString()}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
