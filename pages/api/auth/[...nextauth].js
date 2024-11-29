import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs'; // for password hashing
import db from '../../../db'; // import the database connection
import Cors from 'cors';

// Initialize CORS middleware
const cors = Cors({
  origin: '*', // Allow your frontend origin
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Allowed HTTP methods
});

// Helper function to run CORS middleware
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

// Configure the NextAuth options
const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'example@mail.com' },
        password: { label: 'Password', type: 'password' },
        signUp: { label: 'Sign Up', type: 'checkbox' }, // New sign-up field
      },
      async authorize(credentials) {
        const { email, password, signUp } = credentials;

        if (!email || !password) {
          throw new Error('Email and Password are required');
        }

        if (signUp) {
          // Sign up logic
          const [rows] = await db.promise().query('SELECT * FROM users WHERE email = ?', [email]);

          if (rows.length > 0) {
            throw new Error('Email already exists');
          }

          // Hash the password before saving
          const hashedPassword = await bcrypt.hash(password, 10);

          // Insert the new user into the database
          const result = await db.promise().query(
            'INSERT INTO users (email, password, username) VALUES (?, ?, ?)',
            [email, hashedPassword, email] // You can customize the `name` field as needed
          );

          // Return the newly created user
          return { id: result[0].insertId, name: email, email };
        } else {
          // Login logic
          const [rows] = await db.promise().query('SELECT * FROM users WHERE email = ?', [email]);

          if (rows.length === 0) {
            throw new Error('User not found');
          }

          const user = rows[0];

          // Compare the hashed password with the one stored in the DB
          const isPasswordCorrect = await bcrypt.compare(password, user.password);
          if (!isPasswordCorrect) {
            throw new Error('Invalid credentials');
          }

          // Return the user data for session
          return { id: user.id, name: user.username, email: user.email };
        }
      },
    }),
  ],
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login', // Your custom login page
    signOut: '/',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.name = user.username;
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.name = token.username;
      session.user.email = token.email;
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET, // Add your JWT secret here
};

export default async function handler(req, res) {
  // Run CORS middleware before handling the request
  await runMiddleware(req, res, cors);

  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173');
    res.status(204).end(); // No content for OPTIONS request
    return;
  }

  // Pass the request to NextAuth
  return NextAuth(req, res, authOptions);
}
