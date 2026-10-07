import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ThemeToggle } from '../common/ThemeToggle';
import { Layers, Menu, X, ArrowRight } from 'lucide-react';

export const LandingNavbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: 'Features', href: '#features' },
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'Roles', href: '#roles' },
    { label: 'Why Align', href: '#why-align' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-theme-bg/90 backdrop-blur-md border-b border-theme-border transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-theme-primary text-white flex items-center justify-center font-bold text-sm shadow-sm transition-transform group-hover:scale-105">
            <Layers className="w-4.5 h-4.5" />
          </div>
          <span className="font-extrabold text-base sm:text-lg tracking-tight text-theme-main">
            Align
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-theme-secondary">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="hover:text-theme-main transition-colors py-1"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Desktop Right Controls (Auth & Theme) */}
        <div className="hidden md:flex items-center gap-3">
          <ThemeToggle />

          <Link
            to="/login"
            className="text-xs font-semibold text-theme-main hover:text-theme-primary px-3 py-2 transition-colors"
          >
            Sign In
          </Link>
          <Link
            to="/register"
            className="bg-theme-primary hover:bg-theme-primary-hover text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-sm flex items-center gap-1.5 transition"
          >
            Get Started
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Mobile Controls */}
        <div className="flex md:hidden items-center gap-2">
          <ThemeToggle />
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-theme-muted hover:text-theme-main hover:bg-theme-surface rounded-lg border border-theme-border transition"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-theme-border bg-theme-surface px-4 py-5 space-y-4 animate-in fade-in slide-in-from-top-2">
          <div className="flex flex-col space-y-3">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm font-medium text-theme-secondary hover:text-theme-main py-1"
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="pt-4 border-t border-theme-border flex flex-col gap-2.5">
            <Link
              to="/register"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full bg-theme-primary hover:bg-theme-primary-hover text-white text-xs font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2 transition"
            >
              Get Started
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center border border-theme-border text-xs font-semibold text-theme-main hover:bg-theme-surface-active py-2.5 rounded-lg transition"
            >
              Sign In
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
