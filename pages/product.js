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
    console.log(decoded)

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

export default function Page({ user, token }) {
  return (
    <div>
      <h1>Welcome, {user.username}!</h1>
      <p>Your token is: <code>{token}</code></p>
      <p>You are now authenticated on the Next.js site!</p>
      <a href='http://localhost:5173/dashboard'>Go back to WebApp</a>
    </div>
  );
}
