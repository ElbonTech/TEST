// pages/index.js
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { parse } from 'cookie'; // Use the 'cookie' package to parse cookies
import jwt from 'jsonwebtoken';


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

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard'); // Replace so the back button doesn’t take users back to `/`
  }, [router]);

  return null; // Optionally, you could return a loader/spinner while redirecting.
}
