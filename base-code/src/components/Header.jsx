import React from 'react';
import { Link } from 'react-router-dom';

export default function Header() {
  return (
    <header className="flex items-center gap-5 p-4 bg-gray-100 border-b border-gray-300">
      <h1 className="m-0 text-xl font-bold text-gray-900">💾 Mediasaver</h1>
      <nav className="flex items-center gap-4">
        <Link to="/" className="no-underline text-gray-800 font-bold hover:text-black">
          Home Gallery
        </Link>
        <Link to="/add" className="no-underline text-blue-600 font-bold hover:text-blue-700">
          + Import Media
        </Link>
        <Link to="/dashboard" className="no-underline text-gray-500 font-bold hover:text-gray-700">
          Dashboard
        </Link>
      </nav>
    </header>
  );
}