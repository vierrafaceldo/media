import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Download, Compass, User } from 'lucide-react';

export default function BottomNav() {
  const location = useLocation();

  // Mapping our current routes to the new app structure
  const navItems = [
    { path: '/', label: 'Beranda', icon: Home },
    { path: '/dashboard', label: 'Unduhan', icon: Download },
    { path: '/add', label: 'Browser', icon: Compass }
  ];

  return (
    <nav className="fixed bottom-0 w-full max-w-[480px] left-1/2 -translate-x-1/2 bg-white rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-50 pt-2 pb-4 px-2">
      <div className="flex justify-around items-center">
        {navItems.map((item) => {
          const Icon = item.icon;
          // Determine if tab is active (also keeps Home active if looking at a specific media detail)
          const isActive = location.pathname === item.path || (item.path === '/' && location.pathname.startsWith('/media'));

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center gap-1 min-w-[64px] no-underline transition-all duration-200 ${
                isActive ? 'text-brand-500' : 'text-app-muted hover:text-gray-500'
              }`}
            >
              <div className={`p-1.5 rounded-2xl transition-colors ${isActive ? 'bg-brand-50' : 'bg-transparent'}`}>
                <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className={`text-[10px] font-medium transition-colors ${isActive ? 'text-brand-600' : 'text-gray-400'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}