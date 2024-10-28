// pages/index.js
import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/login'); // Replace so the back button doesn’t take users back to `/`
  }, [router]);

  return null; // Optionally, you could return a loader/spinner while redirecting.
}
