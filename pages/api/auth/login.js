import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../../../db'; // Replace with your database connection
import Cors from 'cors';

// Initialize CORS middleware
const cors = Cors({
  methods: ['POST', 'OPTIONS'], // Specify allowed methods
  origin: '*', // Allow all origins (replace '*' with your domain for more security)
  credentials: true, // Allow credentials if needed
});

// Helper to run middleware
function runMiddleware(req, res, fn) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
}

// JWT token validation middleware (for protected routes)
export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Get token from "Bearer <token>"

  if (!token) {
    return res.status(401).json({ message: 'Access token missing or invalid' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }

    req.user = user; // Attach the parsed user to the request
    next();
  });
}

export default async function handler(req, res) {
  // Run CORS middleware
  await runMiddleware(req, res, cors);

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { email, password, token, redirectUrl } = req.body;

  try {
    const secretKey = process.env.JWT_SECRET; // Ensure this is set in your environment variables

    // If a token is provided, validate it and retrieve the user
    if (token) {
      const decoded = jwt.verify(token, secretKey);
      if (!decoded || !decoded.id) {
        return res.status(401).json({ message: 'Invalid or expired token' });
      }

      // Retrieve the user by ID
      const [rows] = await db.promise().query('SELECT * FROM users WHERE id = ?', [decoded.id]);
      if (rows.length === 0) {
        return res.status(404).json({ message: 'User not found' });
      }

      const user = rows[0];

      // Return the user data
      return res.status(200).json({
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
        },
        redirectUrl: redirectUrl || null,
      });
    }

    // Fallback to email/password login if token is not provided
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find the user in the database
    const [rows] = await db.promise().query('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = rows[0];

    // Compare the password
    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, username: user.username },
      secretKey,
      { expiresIn: '1h' } // Token valid for 1 hour
    );

    // Return the token and optionally a redirect
    return res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
      redirectUrl: redirectUrl || null,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Something went wrong' });
  }
}
