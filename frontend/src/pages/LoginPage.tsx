import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Mail, Shield, CheckCircle2, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('admin@caterpillar.com');
  const [password, setPassword] = useState('••••••••••••');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [selectedRole, setSelectedRole] = useState<UserRole>('ADMIN');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      login(email || 'admin@caterpillar.com', selectedRole);
      setIsLoading(false);
    }, 600);
  };

  const handleSelectQuickPersona = (role: UserRole, demoEmail: string) => {
    setSelectedRole(role);
    setEmail(demoEmail);
    setPassword('••••••••••••');
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

      {/* Top Left Step / System Indicator */}
      <div className="absolute top-6 left-6 z-20 flex items-center gap-2.5">
        <div className="w-6 h-6 rounded-full bg-amber-400 text-black font-black text-xs flex items-center justify-center shadow-lg shadow-amber-400/20">
          1
        </div>
        <span className="text-xs font-black tracking-widest text-white uppercase drop-shadow-md">
          Login Screen
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
            <h2 className="text-sm font-bold text-gray-200">Welcome back!</h2>
            <p className="text-xs text-gray-400">Sign in to continue</p>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email Field */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-300 block">Email</label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
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
                placeholder="Enter your password"
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

          {/* Remember Me & Forgot Password */}
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
            <a
              href="#forgot"
              onClick={(e) => {
                e.preventDefault();
                alert('For demo access, choose any role persona below or click Sign In directly.');
              }}
              className="text-gray-400 hover:text-amber-400 transition-colors font-medium"
            >
              Forgot password?
            </a>
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

        {/* Quick Demo Persona Selectors */}
        <div className="pt-2 border-t border-white/10 space-y-2">
          <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block text-center">
            Quick Persona Switch
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
              <div className="text-[9px] text-gray-500">Full Access</div>
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
              <div className="text-[9px] text-gray-500">Operations</div>
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
              <div className="text-[9px] text-gray-500">Read-Only</div>
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
