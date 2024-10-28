import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

// Configure the NextAuth options
const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'example@mail.com' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and Password are required');
        }

        const { email, password } = credentials;

        // Mock user authentication
        if (email === 'user@mail.com' && password === 'password123') {
          return { id: 1, name: 'John Doe', email };
        }

        throw new Error('Invalid credentials');
      },
    }),
  ],
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
    signOut: '/',
  },
};

// Export the NextAuth handler
export default function handler(req, res) {
  console.log('Request Method:', req.method); // Log the request method
  console.log('Request Body:', req.body); // Log the request body
  console.log('Auth Options:', authOptions); // Log the auth options

  return NextAuth(req, res, authOptions);
}

