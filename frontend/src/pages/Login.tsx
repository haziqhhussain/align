import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  Layers,
  ArrowRight,
  Lock,
  Mail,
  Sparkles,
} from 'lucide-react';
import { ThemeToggle } from '../components/common/ThemeToggle';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      showToast('Please enter both email and password', 'warning');
      return;
    }
    setSubmitting(true);
    try {
      await login({ email, password });
      showToast('Welcome back to Align!', 'success');
      navigate('/');
    } catch (err: any) {
      showToast(err.message || 'Login failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemoLogin = async (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setSubmitting(true);
    try {
      await login({ email: demoEmail, password: demoPass });
      showToast(`Logged in as demo user`, 'success');
      navigate('/');
    } catch (err: any) {
      showToast(err.message || 'Demo login failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotPassword = (e: React.MouseEvent) => {
    e.preventDefault();
    showToast('Contact your organization admin to reset credentials', 'info');
  };

  return (
    <div className="min-h-screen bg-theme-bg text-theme-main flex flex-col md:flex-row transition-colors duration-200">
      {/* LEFT SIDE — BRANDING PANEL WITH FULL-BLEED HERO BACKGROUND */}
      <div className="w-full md:w-1/2 relative overflow-hidden min-h-[580px] md:min-h-screen p-8 sm:p-10 lg:p-12 flex flex-col justify-between border-b md:border-b-0 md:border-r border-theme-border">
        {/* Full-bleed Background Hero Image */}
        <img
          src="/align_login_hero.jpg"
          alt="Align Enterprise Workspace"
          className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none select-none"
        />

        {/* Dark/Neutral Gradient Overlay Layer for Theme Integration & Text Readability */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950/85 via-slate-900/80 to-slate-950/90 dark:from-black/90 dark:via-neutral-950/85 dark:to-black/95 backdrop-blur-[2px] pointer-events-none" />

        {/* Top Header Branding & Theme Toggle */}
        <div className="flex items-center justify-between z-10 relative">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-theme-primary text-white flex items-center justify-center font-bold text-sm shadow-md transition-transform group-hover:scale-105">
              <Layers className="w-4 h-4" />
            </div>
            <span className="font-extrabold text-lg text-white tracking-tight">Align</span>
          </Link>

          {/* Theme Selector Component */}
          <ThemeToggle />
        </div>

        {/* Hero Branding Content */}
        <div className="my-auto py-12 space-y-4 max-w-md w-full z-10 relative">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white/10 text-white backdrop-blur-md border border-white/15 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" /> Team Management Made Simple
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Plan. Assign. Track.
          </h1>
          <p className="text-sm text-slate-200/90 sm:text-base leading-relaxed max-w-sm font-normal">
            Bring your teams, tasks, and projects together in one clear workspace.
          </p>
        </div>

        {/* Footer Branding Info */}
        <div className="text-xs text-slate-300/70 pt-4 border-t border-white/15 z-10 relative flex items-center justify-between">
          <span>Align Workspace &copy; {new Date().getFullYear()}</span>
          <span>Enterprise SaaS</span>
        </div>
      </div>

      {/* RIGHT SIDE — LOGIN FORM */}
      <div className="w-full md:w-1/2 lg:w-[52%] p-6 sm:p-10 lg:p-14 flex flex-col justify-center my-auto max-w-lg mx-auto md:max-w-none">
        <div className="w-full max-w-md mx-auto space-y-6">
          {/* Header */}
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight text-theme-main">Welcome back</h2>
            <p className="text-xs text-theme-muted mt-1">Sign in to continue to your Align workspace.</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-theme-main mb-1.5">Email address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-theme-muted absolute left-3 top-2.5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@align.com"
                  className="w-full bg-theme-surface border border-theme-border rounded-lg pl-9 pr-3 py-2 text-xs text-theme-main placeholder:text-theme-muted focus:outline-none focus:border-theme-primary transition-colors"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-theme-main mb-1.5">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-theme-muted absolute left-3 top-2.5" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-theme-surface border border-theme-border rounded-lg pl-9 pr-3 py-2 text-xs text-theme-main placeholder:text-theme-muted focus:outline-none focus:border-theme-primary transition-colors"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-theme-main">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-theme-border text-theme-primary focus:ring-0 cursor-pointer"
                />
                <span>Remember me</span>
              </label>

              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-theme-primary hover:underline font-medium text-xs"
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-theme-primary hover:bg-theme-primary-hover text-white font-medium py-2.5 px-4 rounded-lg text-xs shadow-sm flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
            >
              {submitting ? 'Signing in...' : 'Sign In'}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Quick Demo Accounts */}
          <div className="border-t border-theme-border pt-4 space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs text-theme-muted font-medium">
              <Sparkles className="w-3.5 h-3.5 text-theme-primary" /> Quick Demo Accounts:
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <button
                type="button"
                onClick={() => handleDemoLogin('admin@align.com', 'admin123')}
                className="p-2.5 rounded-lg border border-theme-border bg-theme-surface hover:border-theme-primary/60 hover:bg-theme-surface-active text-left transition-colors"
              >
                <div className="font-semibold text-theme-main">Admin</div>
                <div className="text-[10px] text-theme-muted truncate">admin@align.com</div>
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('lead.frontend@align.com', 'lead123')}
                className="p-2.5 rounded-lg border border-theme-border bg-theme-surface hover:border-theme-primary/60 hover:bg-theme-surface-active text-left transition-colors"
              >
                <div className="font-semibold text-theme-main">Frontend Lead</div>
                <div className="text-[10px] text-theme-muted truncate">lead.frontend@align.com</div>
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('lead.backend@align.com', 'lead123')}
                className="p-2.5 rounded-lg border border-theme-border bg-theme-surface hover:border-theme-primary/60 hover:bg-theme-surface-active text-left transition-colors"
              >
                <div className="font-semibold text-theme-main">Backend Lead</div>
                <div className="text-[10px] text-theme-muted truncate">lead.backend@align.com</div>
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('dev.marcus@align.com', 'member123')}
                className="p-2.5 rounded-lg border border-theme-border bg-theme-surface hover:border-theme-primary/60 hover:bg-theme-surface-active text-left transition-colors"
              >
                <div className="font-semibold text-theme-main">Team Member</div>
                <div className="text-[10px] text-theme-muted truncate">dev.marcus@align.com</div>
              </button>
            </div>
          </div>

          {/* Footer Signup Link */}
          <p className="text-center text-xs text-theme-muted pt-2">
            Don't have an account?{' '}
            <Link to="/register" className="text-theme-primary font-semibold hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
