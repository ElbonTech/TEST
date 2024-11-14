// server.js
const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const mysql = require("mysql2/promise");
require("dotenv").config();

const app = express();
const server = http.createServer(app);
const cors = require("cors");
app.use(cors());
app.use(express.json()); 

// Middleware to log visited routes
app.use((req, res, next) => {
  console.log(`Visited Route: ${req.method} ${req.url}`);
  next();
});


const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// MySQL connection pool
const db = mysql.createPool({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
});

// WebSocket setup
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("joinRoom", ({ buyerId, sellerId }) => {
    const room = `${buyerId}-${sellerId}`;
    socket.join(room);
    console.log(`User joined room: ${room}`);
  });

  socket.on("sendMessage", async ({ senderId, receiverId, content }) => {
    try {
      if (!senderId || !receiverId || !content) {
        console.error("Invalid data received:", { senderId, receiverId, content });
        return;
      }

      // Save message to database
      const [result] = await db.execute(
        "INSERT INTO messages (sender_id, receiver_id, content) VALUES (?, ?, ?)",
        [senderId, receiverId, content]
      );

      const message = {
        id: result.insertId,
        senderId,
        receiverId,
        content,
        timestamp: new Date(),
      };

      const room = `${senderId}-${receiverId}`;
      io.to(room).emit("receiveMessage", message);
    } catch (error) {
      console.error("Database error:", error);
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// Fetch last 10 users
app.get("/users/last10", async (req, res) => {
  try {
    const [users] = await db.execute("SELECT id, username, email, created_at FROM users ORDER BY created_at DESC LIMIT 10");
    res.json(users);
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).send("Error fetching users");
  }
});

// Fetch chat history between a buyer and seller
app.get("/chat/history", async (req, res) => {
  const { buyerId, sellerId } = req.query;

  if (!buyerId || !sellerId) {
    return res.status(400).json({ error: "Both buyerId and sellerId are required." });
  }

  try {
    const [messages] = await db.execute(
      `SELECT id, sender_id AS senderId, receiver_id AS receiverId, content, timestamp, read_status
       FROM messages
       WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)
       ORDER BY timestamp ASC`,
      [buyerId, sellerId, sellerId, buyerId]
    );

    res.json(messages);
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).send("Error fetching chat history");
  }
});

// Fetch all chat messages for a specific user
app.get("/chats/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const [messages] = await db.execute(
      `SELECT id, sender_id AS senderId, receiver_id AS receiverId, content, timestamp
       FROM messages
       WHERE sender_id = ? OR receiver_id = ?
       ORDER BY timestamp ASC`,
      [userId, userId]
    );

    res.json(messages);
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).send("Error fetching chats for the user");
  }
});

// Mark messages as read between buyer and seller
app.put("/chat/markAsRead", async (req, res) => {
  const { buyerId, sellerId, viewerId } = req.body;

  if (!buyerId || !sellerId || !viewerId) {
    return res.status(400).json({ error: "buyerId, sellerId, and viewerId are required." });
  }

  try {
    // Determine the sender based on the viewer's role in the conversation
    const otherPartyId = viewerId === buyerId ? sellerId : buyerId;

    // Update the read status of all messages where the viewer is the receiver
    await db.execute(
      `UPDATE messages
       SET read_status = 1
       WHERE receiver_id = ?
       AND sender_id = ?
       AND read_status = 0`,
      [otherPartyId, viewerId]
    );

    res.json({ message: "Messages marked as read." });
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).send("Error updating read status.");
  }
});



// Fetch unread messages for a specific user
app.get("/chat/unread/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const [unreadMessages] = await db.execute(
      `SELECT id, sender_id AS senderId, receiver_id AS receiverId, content, timestamp
       FROM messages
       WHERE receiver_id = ? AND read_status = 0
       ORDER BY timestamp ASC`,
      [userId]
    );

    res.json(unreadMessages);
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).send("Error fetching unread messages.");
  }
});


const PORT = 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
