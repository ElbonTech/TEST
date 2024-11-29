import jwt from 'jsonwebtoken';
import db from '../../../db'; // Replace with your database connection
import Cors from 'cors';
import cookie from 'cookie'; // Import the cookie package

// Initialize CORS middleware
const cors = Cors({
  methods: ['GET', 'OPTIONS'],
  origin: '*',
  credentials: true,
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

export default async function handler(req, res) {
  // Run CORS middleware
  await runMiddleware(req, res, cors);

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { token, redirectUrl } = req.query;

  if (!token) {
    return res.status(400).json({ message: 'Token is required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log(decoded);
    if (!decoded || !decoded.userId) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    const [rows] = await db.promise().query('SELECT * FROM users WHERE id = ?', [decoded.userId]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = rows[0];

    // Set the JWT token as a cookie

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
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
}
