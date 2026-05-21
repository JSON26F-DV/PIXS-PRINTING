import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

const AuthNavbar: React.FC = () => {
  return (
    <nav className="absolute top-0 left-0 w-full p-6 md:p-8 z-50 flex items-center">
      <Link
        to="/"
        className="text-slate-900"
        aria-label="Back to Landing Page"
      >
        <ArrowLeft size={24} />
      </Link>
    </nav>
  )
}

export default AuthNavbar
