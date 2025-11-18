'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { topbarLinks } from '../constants/index'

export default function Navigation({ session }) {
  const pathname = usePathname()
  return (
    <nav className="navbar navbar-expand-md navbar-dark bg-primary shadow">
      <div className="container-fluid">
        <Link href="/" className="navbar-brand fs-5 fw-bold">Election System</Link>
        <div className="d-none d-md-flex me-auto ms-4">
          {topbarLinks.map(link => (
            <Link key={link.routes} href={link.routes} className={`nav-link px-3 ${pathname === link.routes ? 'active bg-primary bg-opacity-75 rounded' : ''}`}>
              {link.label}
            </Link>
          ))}
        </div>
        {session && (
          <div className="d-flex align-items-center gap-3">
            <small className="text-white-50">{session.user.name} (ID: {session.user.voterID})</small>
            <button onClick={() => signOut()} className="btn btn-danger btn-sm">Logout</button>
          </div>
        )}
      </div>
    </nav>
  )
}