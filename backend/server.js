import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import mysql from "mysql2/promise";
import dotenv from "dotenv";
import cors from "cors";
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken";

dotenv.config();

const app = express();
const server = createServer(app);

app.use(cors());
app.use(express.json());

// Middleware to log visited routes
app.use((req, res, next) => {
  // Capture the original `send` function to hook into the response.
  const originalSend = res.send;
  
  // Overwrite `res.send` to capture the status code before sending the response.
  res.send = function (body) {
    console.log(`Visited Route: ${req.method} ${req.url} | Status Code: ${res.statusCode}`);
    // Call the original `send` function to actually send the response
    originalSend.call(this, body);
  };
  
  // Call the next middleware or route handler
  next();
});


const io = new Server(server, {
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


// Middleware to verify JWT tokens
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1]; // Bearer <token>
  if (!token) {
    return res.status(401).json({ error: "Access token is missing or invalid." });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: "Token is invalid or expired." });
    }
    req.user = decoded; // Attach decoded payload to the request object
    next();
  });
};
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    // Fetch the user from the database
    const [user] = await db.execute("SELECT id, email, password, username FROM users WHERE email = ?", [email]);

    if (user.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Check if the password matches
    const isPasswordCorrect = await bcrypt.compare(password, user[0].password);
    if (!isPasswordCorrect) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user[0].id, username: user[0].username },
      process.env.JWT_SECRET,
      { expiresIn: "1Y" } // Token expires in 1 hour
    );

    res.json({ token, user });
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).send("Error logging in.");
  }
});

// Example protected route
app.get("/protected", verifyToken, (req, res) => {
  res.status(200).json({ 
    message: `Hello, ${req.user.username}. This is a protected route.` 
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
    const otherPartyId = viewerId === buyerId ? sellerId : buyerId;

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
