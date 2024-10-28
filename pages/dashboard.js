// pages/dashboard.js
import { signOut, useSession, getSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

export async function getServerSideProps(context) {
    const session = await getSession(context);
    if (!session) {
        return {
            redirect: { destination: '/login', permanent: false },
        };
    }
    return { props: { session } };
}

export default function Dashboard({ session }) {
    const router = useRouter();

    const handleLogout = async () => {
        await signOut();
        router.push('/login'); // Redirect to login page after logout
    };

    return (
        <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
            <h1 className="text-3xl font-bold mb-4">Dashboard</h1>
            <p className="text-lg mb-4">Welcome, {session.user.email}!</p>
            <button
                onClick={handleLogout}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition duration-200"
            >
                Logout
            </button>
        </div>
    );
}
