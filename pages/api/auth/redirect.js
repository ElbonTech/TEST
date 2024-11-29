import jwt from 'jsonwebtoken';
import { serialize } from 'cookie';

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

    // Split the 'page' parameter by '/' to separate the main route and the dynamic ID
    const pageSegments = page.split('/');

    // Ensure we have at least two segments (e.g., "products" and "106")
    if (pageSegments.length < 2) {
      return res.status(400).json({ message: 'Invalid page structure' });
    }

    const [mainPage, id] = pageSegments;

    // Define a list of allowed main pages (e.g., 'products')
    const allowedPages = ['products', 'profile', 'settings'];

    // Validate the main page (e.g., 'products')
    if (!allowedPages.includes(mainPage)) {
      return res.status(400).json({ message: 'Invalid page' });
    }

    // Optionally, validate the ID part for dynamic pages like 'products/106'
    if (mainPage === 'products' && isNaN(Number(id))) {
      return res.status(400).json({ message: 'Invalid product ID' });
    }

    // Set the token as a cookie to pass it to the page
    const cookie = serialize('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Ensure secure cookie in production
      maxAge: 60 * 60 * 24 * 7, // 1 week expiration
      path: '/',
    });

    // Set the cookie and redirect to the appropriate page (e.g., /products/106)
    res.setHeader('Set-Cookie', cookie);
    const redirectUrl = `/${page}`; // Use the entire `page` parameter for the redirect
    res.writeHead(307, { Location: redirectUrl });
    return res.end();
  } catch (error) {
    console.error(error);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}
