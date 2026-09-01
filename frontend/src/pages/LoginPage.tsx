import React, { useState } from 'react';
import { Eye, EyeOff, Shield, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('admin@caterpillar.com');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [selectedRole, setSelectedRole] = useState<UserRole>('ADMIN');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      await login(email, password);
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication failed. Please verify email and password.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectQuickPersona = (role: UserRole, demoEmail: string) => {
    setSelectedRole(role);
    setEmail(demoEmail);
    setPassword('password123');
    setErrorMessage(null);
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center lg:justify-end lg:pr-24 px-4 py-8 overflow-hidden bg-slate-950 font-sans select-none">
      {/* Cinematic Excavator Background */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-1000 scale-105"
        style={{
          backgroundImage: `url('/cat_excavator_bg.jpg')`,
        }}
      >
        {/* Dark Vignette & Industrial Overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-black/85"></div>
        <div className="absolute inset-0 bg-radial-gradient from-transparent via-black/40 to-black/90"></div>
      </div>

      {/* Top Left System Indicator */}
      <div className="absolute top-6 left-6 z-20 flex items-center gap-2.5">
        <div className="w-6 h-6 rounded-full bg-amber-400 text-black font-black text-xs flex items-center justify-center shadow-lg shadow-amber-400/20">
          1
        </div>
        <span className="text-xs font-black tracking-widest text-white uppercase drop-shadow-md">
          Database Login
        </span>
      </div>

      {/* Main Frosted Glass Login Card */}
      <div className="relative z-10 w-full max-w-[420px] rounded-3xl bg-slate-950/80 backdrop-blur-2xl border border-white/10 shadow-2xl p-7 sm:p-8 space-y-6 text-white animate-fade-in">
        {/* Brand Header */}
        <div className="space-y-3 text-center">
          {/* Caterpillar Iconic Logo */}
          <div className="inline-flex items-center justify-center">
            <div className="relative flex items-center justify-center font-black tracking-tighter text-4xl text-white font-sans">
              <span>C</span>
              <span className="relative">
                A
                {/* Yellow triangle chevron under 'A' */}
                <span
                  className="absolute bottom-[-3px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[8px] border-b-amber-400"
                  aria-hidden="true"
                ></span>
              </span>
              <span>T</span>
            </div>
          </div>

          <div>
            <h1 className="text-lg font-black tracking-wide">
              <span className="text-amber-400">SMARTRENT</span>{' '}
              <span className="text-white">INTELLIGENCE</span>
            </h1>
            <p className="text-xs text-gray-400 tracking-wider uppercase font-medium mt-0.5">
              Apex Infrastructure & Mining
            </p>
          </div>

          <div className="pt-2">
            <h2 className="text-sm font-bold text-gray-200">System Authentication</h2>
            <p className="text-xs text-gray-400">Sign in with your enterprise credentials</p>
          </div>
        </div>

        {/* Error Alert Message */}
        {errorMessage && (
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs animate-shake">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="leading-snug">{errorMessage}</div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email / Username Field */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-300 block">Email or Username</label>
            <div className="relative">
              <input
                type="text"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email or username"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all font-mono"
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-300 block">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-slate-900/90 border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 transition-colors p-1"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Remember Me & Password Hint */}
          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-gray-300 hover:text-white">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-3.5 h-3.5 rounded bg-slate-800 border-gray-600 text-amber-400 focus:ring-0 focus:ring-offset-0 cursor-pointer"
              />
              <span>Remember me</span>
            </label>
            <span className="text-gray-500 text-[11px]">
              Default pass: <code className="text-amber-400 font-mono">password123</code>
            </span>
          </div>

          {/* Primary Sign In Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-xl bg-amber-400 hover:bg-amber-300 active:scale-[0.99] text-black font-black text-xs tracking-wider uppercase transition-all duration-200 shadow-lg shadow-amber-400/20 flex items-center justify-center gap-2 disabled:opacity-75 cursor-pointer mt-2"
          >
            {isLoading ? (
              <span className="inline-block w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>

        {/* Quick Demo Persona Credentials Selectors */}
        <div className="pt-2 border-t border-white/10 space-y-2">
          <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block text-center">
            Populate Demo Credentials
          </span>
          <div className="grid grid-cols-3 gap-1.5">
            <button
              type="button"
              onClick={() => handleSelectQuickPersona('ADMIN', 'admin@caterpillar.com')}
              className={`p-2 rounded-lg text-left transition-all border ${
                selectedRole === 'ADMIN'
                  ? 'bg-amber-400/20 border-amber-400/60 text-amber-300'
                  : 'bg-slate-900/60 border-white/5 text-gray-400 hover:bg-slate-800'
              }`}
            >
              <div className="text-[11px] font-bold">Admin</div>
              <div className="text-[9px] text-gray-500">admin@caterpillar.com</div>
            </button>

            <button
              type="button"
              onClick={() => handleSelectQuickPersona('MANAGER', 'manager@caterpillar.com')}
              className={`p-2 rounded-lg text-left transition-all border ${
                selectedRole === 'MANAGER'
                  ? 'bg-amber-400/20 border-amber-400/60 text-amber-300'
                  : 'bg-slate-900/60 border-white/5 text-gray-400 hover:bg-slate-800'
              }`}
            >
              <div className="text-[11px] font-bold">Manager</div>
              <div className="text-[9px] text-gray-500">manager@caterpillar.com</div>
            </button>

            <button
              type="button"
              onClick={() => handleSelectQuickPersona('VIEWER', 'viewer@caterpillar.com')}
              className={`p-2 rounded-lg text-left transition-all border ${
                selectedRole === 'VIEWER'
                  ? 'bg-amber-400/20 border-amber-400/60 text-amber-300'
                  : 'bg-slate-900/60 border-white/5 text-gray-400 hover:bg-slate-800'
              }`}
            >
              <div className="text-[11px] font-bold">Viewer</div>
              <div className="text-[9px] text-gray-500">viewer@caterpillar.com</div>
            </button>
          </div>
        </div>

        {/* Security & Privacy Tagline */}
        <div className="text-center">
          <p className="text-[10px] text-gray-500 flex items-center justify-center gap-1">
            <Shield className="w-3 h-3 text-amber-400/80" />
            <span>Encrypted Privacy-First Fleet Telematics Engine</span>
          </p>
        </div>
      </div>
    </div>
  );
};
