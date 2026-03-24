"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getToken, logout } from '../../services/api/auth';
import { getProfile, UserProfile } from '../../services/api/users';

export default function Header() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const token = getToken();
      setIsLoggedIn(!!token);
      if (token) {
        try {
          const data = await getProfile();
          setProfile(data.profile);
        } catch (e) {
          // Fail silently in header
        }
      } else {
        setProfile(null);
      }
    };
    
    checkAuth();
    window.addEventListener('auth-change', checkAuth);
    return () => window.removeEventListener('auth-change', checkAuth);
  }, []);

  const handleLogout = () => {
    logout();
    setProfile(null);
    setShowDropdown(false);
    router.push('/');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-olive-200 bg-white/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          {/* A simple leaf or plant icon */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-6 w-6 text-olive-600"
          >
            <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
            <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
          </svg>
          <span className="text-xl font-bold tracking-tighter text-olive-900 overflow-hidden">
            AgriSmart AI
          </span>
        </Link>
        <nav className="hidden md:flex items-center gap-6">
          <Link href="/#features" className="text-sm font-medium text-olive-700 hover:text-olive-900 transition-colors">
            Features
          </Link>
          <Link href="/#about" className="text-sm font-medium text-olive-700 hover:text-olive-900 transition-colors">
            About System
          </Link>
          {isLoggedIn && (
            <>
              <Link href="/dashboard" className="text-sm font-bold text-olive-700 hover:text-olive-900 transition-colors">
                Dashboard
              </Link>
              <Link href="/insights" className="text-sm font-bold text-olive-700 hover:text-olive-900 transition-colors">
                AI Insights
              </Link>
              <Link href="/history" className="text-sm font-bold text-olive-700 hover:text-olive-900 transition-colors">
                Plot History
              </Link>
            </>
          )}
        </nav>
        <div className="flex items-center gap-4">
          {isLoggedIn ? (
            <div className="relative">
              <button 
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-2 rounded-full border border-olive-200 bg-white p-1 pr-3 shadow-sm hover:shadow-md transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-olive-600"
              >
                <div className="h-8 w-8 rounded-full bg-olive-100 flex items-center justify-center overflow-hidden border border-olive-200">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
                  ) : (
                    <svg className="h-5 w-5 text-olive-600" fill="currentColor" viewBox="0 0 24 24"><path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
                  )}
                </div>
                <span className="text-sm font-bold text-olive-900">{profile?.username || 'Profile'}</span>
                <svg className="h-4 w-4 text-olive-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
              </button>

              {showDropdown && (
                <div className="absolute right-0 mt-2 w-48 rounded-xl bg-white shadow-xl border border-olive-100 overflow-hidden text-left z-[100]">
                  <Link 
                    href="/profile" 
                    onClick={() => setShowDropdown(false)}
                    className="block px-4 py-3 text-sm text-olive-700 hover:bg-olive-50 hover:text-olive-900 transition-colors border-b border-olive-50 font-medium"
                  >
                    Account Settings
                  </Link>
                  <button 
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors font-medium"
                  >
                    Log Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link 
              href="/login"
              className="rounded-full bg-olive-600 px-5 py-2 text-sm font-medium text-white shadow-sm hover:bg-olive-700 hover:shadow-md transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-olive-600 inline-block"
            >
              Log In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
