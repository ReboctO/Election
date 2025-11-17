'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Navigation from '../components/navigation';

export default function Home() {
  const { data: session } = useSession();

  return (
    <div className="min-h-screen bg-gray-100">
      <Navigation session={session} />
      <main className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-800 mb-4">
            Philippine National Election System
          </h1>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
          <Link href="/login" className="block">
            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition">
              <h3 className="text-xl font-semibold mb-2">Voter Login</h3>
              <p className="text-gray-600">
                Login to cast your vote in the election
              </p>
            </div>
          </Link>
          <Link href="/admin/positions" className="block">
            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition">
              <h3 className="text-xl font-semibold mb-2">Positions</h3>
              <p className="text-gray-600">
                Manage election positions
              </p>
            </div>
          </Link>
          <Link href="/admin/candidates" className="block">
            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition">
              <h3 className="text-xl font-semibold mb-2">Candidates</h3>
              <p className="text-gray-600">
                Manage candidate registrations
              </p>
            </div>
          </Link>

          <Link href="/admin/voters" className="block">
            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition">
              <h3 className="text-xl font-semibold mb-2">Voters</h3>
              <p className="text-gray-600">
                Manage voter registrations
              </p>
            </div>
          </Link>

          <Link href="/admin/results" className="block">
            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition">
              <h3 className="text-xl font-semibold mb-2">Results</h3>
              <p className="text-gray-600">
                View election results and statistics
              </p>
            </div>
          </Link>

          <Link href="/admin/winners" className="block">
            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition">
              <h3 className="text-xl font-semibold mb-2">Winners</h3>
              <p className="text-gray-600">
                View election winners
              </p>
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
}