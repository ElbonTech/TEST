import { useEffect, useState, useRef } from 'react';
import { useSession, getSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import io from 'socket.io-client';
import styles from '../../styles/Chat.module.css';

export async function getServerSideProps(context) {
  const session = await getSession(context);
  if (!session) {
    return {
      redirect: { destination: '/login', permanent: false },
    };
  }
  return { props: { session } };
}

export default function Chat({ session }) {
  const router = useRouter();
  const { userid } = router.query;
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const socketRef = useRef(null);
  const chatBoxRef = useRef(null);

  const buyerId = session.user.id;
  const sellerId = userid;

  useEffect(() => {
    const fetchChatHistory = async () => {
      try {
        const response = await fetch(`http://localhost:5000/chat/history?buyerId=${buyerId}&sellerId=${sellerId}`);
        const data = await response.json();
        setMessages(data);

        const unreadMessages = data.filter(msg => !msg.read && msg.receiverId === buyerId);
        if (unreadMessages.length > 0) {
          markMessagesAsRead(unreadMessages.map(msg => msg.id));
        }
      } catch (error) {
        console.error("Error fetching chat history:", error);
      }
    };

    fetchChatHistory();

    const markMessagesAsRead = async () => {
      try {
        const viewerId = userid;
        await fetch("http://localhost:5000/chat/markAsRead", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ buyerId, sellerId, viewerId }),
        });
      } catch (error) {
        console.error("Error marking messages as read:", error);
      }
    };
    markMessagesAsRead();
    const intervalId = setInterval(fetchChatHistory, 1000);
    return () => clearInterval(intervalId);
  }, [buyerId, sellerId]);

  useEffect(() => {
    if (!socketRef.current) {
      socketRef.current = io("http://localhost:5000");
      socketRef.current.emit("joinRoom", { buyerId, sellerId });

      socketRef.current.on("receiveMessage", (message) => {
        setMessages((prevMessages) => [...prevMessages, message]);
        if (message.receiverId === buyerId) {
          markMessagesAsRead([message.id]);
        }
      });
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [buyerId, sellerId]);

  const markMessagesAsRead = async (messageIds) => {
    try {
      await fetch('http://localhost:5000/chat/mark-as-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageIds }),
      });
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          messageIds.includes(msg.id) ? { ...msg, read: true } : msg
        )
      );
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  };

  const handleSendMessage = () => {
    if (message.trim() && socketRef.current) {
      const newMessage = {
        senderId: buyerId,
        receiverId: sellerId,
        content: message,
        read: false,
      };

      socketRef.current.emit("sendMessage", newMessage);
      setMessages((prevMessages) => [...prevMessages, newMessage]);
      setMessage("");
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span
          className={styles.backButton}
          onClick={() => router.back()}
        >
          ⬅️
        </span>
        <h3>Chat with {sellerId}</h3>
      </div>

      <div className={styles.chatBox} ref={chatBoxRef}>
        {messages.map((msg, index) => (
          <div
            key={index}
            className={msg.senderId === buyerId ? styles.messageSent : styles.messageReceived}
          >
            {msg.content}
            {msg.senderId === buyerId && (
              <span className={styles.readStatus}>
                {msg.read_status ? "✔️" : "🕓"}
              </span>
            )}
          </div>
        ))}
      </div>

      <div className={styles.inputContainer}>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className={styles.inputField}
          placeholder="Type your message..."
        />
        <button onClick={handleSendMessage} className={styles.sendButton}>
          Send
        </button>
      </div>
    </div>
  );
}
