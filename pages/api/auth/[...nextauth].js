import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs'; // for password hashing
//import db from './db'; // import the database connection
import db from '../../../db'; // import the database connection

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

        // Check if user is signing up or logging in
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
};

// Export the NextAuth handler
export default function handler(req, res) {
  return NextAuth(req, res, authOptions);
}
