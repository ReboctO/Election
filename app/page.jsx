'use client'

import { useSession } from 'next-auth/react'
import Link from 'next/link'
import Navigation from '../components/navigation'

export default function Home() {
  const { data: session } = useSession()

  const links = [
    { href: '/login', title: 'Voter Login', desc: 'Login to cast your vote in the election' },
    { href: '/admin/positions', title: 'Positions', desc: 'Manage election positions' },
    { href: '/admin/candidates', title: 'Candidates', desc: 'Manage candidate registrations' },
    { href: '/admin/voters', title: 'Voters', desc: 'Manage voter registrations' },
    { href: '/admin/results', title: 'Results', desc: 'View election results and statistics' },
    { href: '/admin/winners', title: 'Winners', desc: 'View election winners' }
  ]

  return (
    <div className="min-vh-100 bg-light">
      <Navigation session={session} />
      <main className="container py-5">
        <div className="text-center mb-5">
          <h1 className="display-4 fw-bold">Philippine National Election System</h1>
        </div>
        <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
          {links.map(({ href, title, desc }) => (
            <div key={href} className="col">
              <Link href={href} className="text-decoration-none">
                <div className="card h-100 shadow-sm hover-shadow">
                  <div className="card-body">
                    <h3 className="card-title h5 fw-semibold mb-2">{title}</h3>
                    <p className="card-text text-muted mb-0">{desc}</p>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}