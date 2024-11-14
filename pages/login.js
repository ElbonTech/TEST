import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { useRouter } from 'next/router';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState(''); // For sign-up: store the user's name
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSignUp, setIsSignUp] = useState(false); // Toggle between sign-up and login form
  const router = useRouter();

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null); // Reset any previous error

    try {
      const result = await signIn('credentials', {
        email,
        password,
        name: isSignUp ? name : undefined, // Only send 'name' during sign-up
        signUp: isSignUp, // Toggle between login and signup
        redirect: false,
      });

      if (result?.ok) {
        router.push('/dashboard');
      } else {
        setError(isSignUp ? 'Email already exists or invalid details!' : 'Invalid email or password!');
      }
    } catch (err) {
      console.error('Authentication error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <form onSubmit={handleAuth} style={{ maxWidth: 400, width: '100%' }}>
        <h1>{isSignUp ? 'Sign Up' : 'Login'}</h1>
        
        {isSignUp && (
          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            style={{ width: '100%', marginBottom: 10, padding: 10 }}
          />
        )}

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ width: '100%', marginBottom: 10, padding: 10 }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ width: '100%', marginBottom: 10, padding: 10 }}
        />

        {error && <div style={{ color: 'red', marginBottom: 10 }}>{error}</div>} {/* Error message display */}

        <button type="submit" disabled={loading} style={{ width: '100%', padding: 10 }}>
          {loading ? (isSignUp ? 'Signing up...' : 'Logging in...') : isSignUp ? 'Sign Up' : 'Login'}
        </button>

        <div style={{ marginTop: 10, textAlign: 'center' }}>
          <button
            type="button"
            onClick={() => setIsSignUp((prev) => !prev)}
            style={{ background: 'none', border: 'none', color: 'blue', cursor: 'pointer' }}
          >
            {isSignUp ? 'Already have an account? Login' : 'Don’t have an account? Sign Up'}
          </button>
        </div>
      </form>
    </div>
  );
}
