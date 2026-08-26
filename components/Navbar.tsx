'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Menu, X, Search } from 'lucide-react';

const navLinks = [
  { href: '/articles',   label: 'Articles'  },
  { href: '/yadav-kings', label: 'Yadav Kings'  },
  { href: '/historical-places', label: 'Historical Places' },
  { href: '/contribute', label: 'Contribute' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 w-full bg-[#dedad7] border-b border-black/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          
          {/* Logo / Home Link */}
          <Link href="/" className="flex-shrink-0 flex items-center gap-2 group">
            <span className="text-sm font-black uppercase tracking-widest text-black group-hover:opacity-70 transition-opacity leading-tight">
              Yadav<br />History
            </span>
            <span className="hidden sm:block w-px h-6 bg-black/30" />
            <span className="hidden sm:block text-[10px] font-bold uppercase tracking-widest text-gray-500 group-hover:opacity-70 transition-opacity">
              India
            </span>
          </Link>

          {/* Mobile hamburger */}
          <div className="md:hidden">
            <button
              onClick={() => setOpen(!open)}
              className="p-2 rounded-lg text-gray-700 hover:text-black transition-colors"
              aria-label="Toggle menu"
            >
              {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {/* Desktop Links (Centered) */}
          <div className="hidden md:flex flex-1 justify-center items-center gap-8">
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="text-sm font-bold text-gray-700 hover:text-black transition-colors tracking-wide"
              >
                {label}
              </Link>
            ))}
          </div>

          {/* Right side items */}
          <div className="hidden md:flex items-center gap-4">
            <button className="text-gray-700 hover:text-black transition-colors">
              <Search className="h-5 w-5" />
            </button>
            <Link
              href="/admin"
              className="text-sm font-bold bg-black text-white px-4 py-1.5 rounded-full hover:bg-gray-800 transition-colors"
            >
              Admin
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-[#dedad7] border-t border-black/10 px-4 pb-6 pt-4 flex flex-col gap-4">
          <Link
            href="/"
            onClick={() => setOpen(false)}
            className="text-base font-bold text-black hover:opacity-70 transition-opacity"
          >
            Home
          </Link>
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className="text-base font-bold text-gray-700 hover:text-black transition-colors"
            >
              {label}
            </Link>
          ))}
          <Link
            href="/admin"
            onClick={() => setOpen(false)}
            className="inline-block text-center font-bold bg-black text-white px-5 py-2 rounded-full hover:bg-gray-800 transition-colors mt-2"
          >
            Admin
          </Link>
        </div>
      )}
    </nav>
  );
}
