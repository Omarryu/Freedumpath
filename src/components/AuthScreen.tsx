import { useState } from 'react';
import { Rocket, Mail, Lock, User as UserIcon, ArrowRight, AlertCircle, Loader2, KeyRound, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { sfx } from '../sfx';

interface Props {
  onAuthed: () => void;
}

export default function AuthScreen({ onAuthed }: Props) {
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || (mode !== 'forgot' && !password.trim())) {
      setError(mode === 'forgot' ? 'Please enter your email.' : 'Please enter your email and password.');
      return;
    }
    if (mode !== 'forgot' && password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    try {
      if (mode === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: window.location.origin,
        });
        if (error) throw error;
        setInfo('Password reset link sent! Check your email to reset your password, then sign in.');
        setMode('signin');
      } else if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { display_name: name.trim() || email.split('@')[0] } },
        });
        if (error) throw error;
        // If session is returned immediately (email confirmation off), proceed
        if (data.session) {
          sfx.success();
          onAuthed();
          return;
        }
        // Otherwise show a message
        setError('Account created! Please sign in.');
        setMode('signin');
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        if (data.session) {
          sfx.success();
          onAuthed();
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <img
          src="https://images.pexels.com/photos/1486222/pexels-photo-1486222.jpeg?auto=compress&cs=tinysrgb&w=1600"
          alt=""
          className="w-full h-full object-cover opacity-20"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-950/80 to-amber-950/30" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="mb-4 text-5xl inline-block animate-bounce">🚀</div>
          <h1 className="text-4xl font-black text-white tracking-tight">
            Freedom<span className="text-amber-400">Path</span>
          </h1>
          <p className="text-slate-400 text-sm mt-2">Life Strategy Game — Build Your Freedom</p>
        </div>

        {/* Auth card */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl">
          {/* Tab switch */}
          <div className="flex gap-1 p-1 bg-slate-950/60 rounded-2xl mb-6">
            <button
              onClick={() => { setMode('signin'); setError(''); sfx.click(); }}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
                mode === 'signin'
                  ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setMode('signup'); setError(''); sfx.click(); }}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
                mode === 'signup'
                  ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-slate-400 text-xs font-medium mb-1.5">Display Name</label>
                <div className="relative">
                  <UserIcon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Your name"
                    maxLength={24}
                    className="w-full bg-white/5 border border-white/12 rounded-xl pl-10 pr-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-amber-500/60 focus:bg-white/8 transition-all text-sm"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-slate-400 text-xs font-medium mb-1.5">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                  className="w-full bg-white/5 border border-white/12 rounded-xl pl-10 pr-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-amber-500/60 focus:bg-white/8 transition-all text-sm"
                />
              </div>
            </div>

            {mode !== 'forgot' && (
              <div>
                <label className="block text-slate-400 text-xs font-medium mb-1.5">Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                    required
                    className="w-full bg-white/5 border border-white/12 rounded-xl pl-10 pr-12 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-amber-500/60 focus:bg-white/8 transition-all text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => { setShowPassword(s => !s); sfx.click(); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-amber-400 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            )}

            {info && (
              <div className="flex items-start gap-2 bg-emerald-500/10 border border-emerald-500/25 rounded-xl px-3 py-2.5" style={{ animation: 'slideUp 0.2s ease-out' }}>
                <AlertCircle size={15} className="text-emerald-400 mt-0.5 flex-shrink-0" />
                <p className="text-emerald-300 text-xs leading-relaxed">{info}</p>
              </div>
            )}

            {error && (
              <div className="flex items-start gap-2 bg-rose-500/10 border border-rose-500/25 rounded-xl px-3 py-2.5" style={{ animation: 'slideUp 0.2s ease-out' }}>
                <AlertCircle size={15} className="text-rose-400 mt-0.5 flex-shrink-0" />
                <p className="text-rose-300 text-xs leading-relaxed">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-slate-950 font-black text-sm rounded-2xl transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-amber-500/30 disabled:scale-100"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  {mode === 'signin' ? 'Signing in...' : mode === 'signup' ? 'Creating account...' : 'Sending reset link...'}
                </>
              ) : (
                <>
                  <Rocket size={16} />
                  {mode === 'signin' ? 'Sign In & Play' : mode === 'signup' ? 'Register & Play' : 'Send Reset Link'}
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-slate-600 text-xs mt-5">
            {mode === 'signin' && (
              <>
                <button
                  onClick={() => { setMode('forgot'); setError(''); setInfo(''); sfx.click(); }}
                  className="text-amber-400/80 font-semibold hover:text-amber-300 transition-colors inline-flex items-center gap-1"
                >
                  <KeyRound size={11} /> Forgot password?
                </button>
                <span className="block mt-3">Don't have an account?{' '}
                  <button
                    onClick={() => { setMode('signup'); setError(''); setInfo(''); sfx.click(); }}
                    className="text-amber-400 font-bold hover:text-amber-300 transition-colors"
                  >
                    Register here
                  </button>
                </span>
              </>
            )}
            {mode === 'signup' && (
              <>
                Already have an account?{' '}
                <button
                  onClick={() => { setMode('signin'); setError(''); setInfo(''); sfx.click(); }}
                  className="text-amber-400 font-bold hover:text-amber-300 transition-colors"
                >
                  Sign in here
                </button>
              </>
            )}
            {mode === 'forgot' && (
              <>
                Remembered it?{' '}
                <button
                  onClick={() => { setMode('signin'); setError(''); setInfo(''); sfx.click(); }}
                  className="text-amber-400 font-bold hover:text-amber-300 transition-colors"
                >
                  Back to sign in
                </button>
              </>
            )}
          </p>
        </div>

        <footer className="mt-8 text-center">
          <p className="text-slate-600 text-xs">
            &copy; {new Date().getFullYear()} Omara Alexander Morgan. All rights reserved.
          </p>
        </footer>
      </div>
    </div>
  );
}
