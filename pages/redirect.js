// File: /pages/api/redirect.js
import jwt from 'jsonwebtoken';

export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { token, page } = req.query;

  if (!token || !page) {
    return res.status(400).json({ message: 'Token and page are required' });
  }

  try {
    // Verify the JWT token
    const secretKey = process.env.JWT_SECRET; // Ensure you set this in your .env file
    const decoded = jwt.verify(token, secretKey);

    // Check for page validation if necessary (optional, add allowed pages list)
    const allowedPages = ['dashboard', 'profile', 'settings']; // Example allowed pages
    if (!allowedPages.includes(page)) {
      return res.status(400).json({ message: 'Invalid page' });
    }

    // Redirect to the specified page
    const redirectUrl = `/${page}`;
    res.writeHead(307, { Location: redirectUrl });
    return res.end();
  } catch (error) {
    console.error(error);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}
