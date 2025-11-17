'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { topbarLinks } from '../constants/index';

export default function Navigation({ session }) {
  const pathname = usePathname();
  return (
    <nav className="bg-blue-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <Link href="/" className="text-xl font-bold">
               Election System
            </Link>
            <div className="hidden md:flex space-x-4">
              {topbarLinks.map((link) => (
                <Link
                  key={link.routes}
                  href={link.routes}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                    pathname === link.routes
                      ? 'bg-blue-700'
                      : 'hover:bg-blue-500'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
          {session && (
            <div className="flex items-center space-x-4">
              <span className="text-sm">
                {session.user.name} (ID: {session.user.voterID})
              </span>
              <button
                onClick={() => signOut()}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 rounded-md text-sm font-medium transition"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}