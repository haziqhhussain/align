import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Layers, ArrowRight, Lock, Mail, User } from 'lucide-react';
import { ThemeToggle } from '../components/common/ThemeToggle';

export const Register: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !password) {
      showToast('Please fill in all required fields', 'warning');
      return;
    }
    setSubmitting(true);
    try {
      await register({ full_name: fullName, email, password });
      showToast('Registration successful! Please log in.', 'success');
      navigate('/login');
    } catch (err: any) {
      showToast(err.message || 'Registration failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-theme-bg text-theme-main flex flex-col justify-between p-6 relative transition-colors duration-200">
      {/* Top Bar with Theme Toggle */}
      <div className="w-full max-w-6xl mx-auto flex justify-between items-center py-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-theme-primary flex items-center justify-center text-white font-bold text-sm">
            <Layers className="w-4 h-4" />
          </div>
          <span className="font-bold text-lg text-theme-main tracking-tight">Align</span>
        </div>
        <ThemeToggle />
      </div>

      {/* Main Container */}
      <div className="w-full max-w-md mx-auto my-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-theme-main">
            Create an Account
          </h1>
          <p className="text-xs text-theme-muted">
            Join Align to collaborate with your team and manage projects
          </p>
        </div>

        <div className="saas-panel p-6 space-y-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-theme-main mb-1.5">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-theme-muted absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Jane Doe"
                  className="w-full bg-theme-bg border border-theme-border rounded-lg pl-9 pr-3 py-2 text-sm text-theme-main placeholder-theme-muted/50 focus:outline-none focus:border-theme-primary transition-colors"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-theme-main mb-1.5">Email address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-theme-muted absolute left-3 top-2.5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jane@align.com"
                  className="w-full bg-theme-bg border border-theme-border rounded-lg pl-9 pr-3 py-2 text-sm text-theme-main placeholder-theme-muted/50 focus:outline-none focus:border-theme-primary transition-colors"
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
                  className="w-full bg-theme-bg border border-theme-border rounded-lg pl-9 pr-3 py-2 text-sm text-theme-main placeholder-theme-muted/50 focus:outline-none focus:border-theme-primary transition-colors"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-theme-primary hover:bg-theme-secondary text-white font-medium py-2.5 px-4 rounded-lg text-sm flex items-center justify-center gap-2 transition duration-150 disabled:opacity-50"
            >
              {submitting ? 'Creating Account...' : 'Register Account'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-theme-muted">
          Already have an account?{' '}
          <Link to="/login" className="text-theme-primary font-medium hover:underline">
            Sign In
          </Link>
        </p>
      </div>

      <div className="text-center py-2 text-[11px] text-theme-muted">
        Align &copy; {new Date().getFullYear()} &bull; Professional SaaS Team Management
      </div>
    </div>
  );
};

