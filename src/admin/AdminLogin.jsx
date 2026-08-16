import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, User, Sparkles, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { adminLogin } from '../api/comicApi';

export default function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleLogin(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await adminLogin(username, password);
      localStorage.setItem('dhuaa_admin_token', res.data.token);
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Check credentials.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50 to-amber-50 flex items-center justify-center px-4 relative overflow-hidden">

      {/* Decorative background blobs */}
      <div className="absolute top-[-80px] right-[-80px] w-96 h-96 bg-orange-200/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-60px] left-[-60px] w-80 h-80 bg-amber-200/50 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/4 w-48 h-48 bg-yellow-100/60 rounded-full blur-2xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 32, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md relative z-10"
      >
        {/* Card */}
        <div className="bg-white/80 backdrop-blur-xl border border-white/60 rounded-3xl shadow-2xl shadow-orange-100/60 overflow-hidden">

          {/* Top banner */}
          <div className="bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 px-8 py-8 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxIDAgNiAyLjY5IDYgNnMtMi42OSA2LTYgNi02LTIuNjktNi02IDIuNjktNiA2LTZ6IiBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsMC4xNSkiLz48L2c+PC9zdmc+')] opacity-30" />
            <div className="relative">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl mb-3 shadow-lg">
                <span className="text-2xl">✍️</span>
              </div>
              <h1 className="text-white font-black text-2xl tracking-tight">Writer's Portal</h1>
              <p className="text-white/70 text-sm mt-1 hindi-text">धुआँ Comic Studio</p>
            </div>
          </div>

          {/* Form area */}
          <div className="px-8 py-8 flex flex-col gap-5">
            <div className="text-center">
              <h2 className="text-gray-800 font-bold text-lg">Welcome back, Karan</h2>
              <p className="text-gray-400 text-sm mt-0.5">Sign in to manage your comic</p>
            </div>

            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              {/* Username field */}
              <div className="flex flex-col gap-1.5">
                <label className="text-gray-600 text-xs font-semibold uppercase tracking-wide">Username</label>
                <div className="relative group">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 w-4 h-4 transition-colors" />
                  <input
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder="Enter your username"
                    className="w-full bg-gray-50 border border-gray-200 focus:border-orange-400 focus:bg-white text-gray-800 pl-10 pr-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/20 transition-all placeholder:text-gray-300"
                    autoFocus
                    autoComplete="username"
                  />
                </div>
              </div>

              {/* Password field */}
              <div className="flex flex-col gap-1.5">
                <label className="text-gray-600 text-xs font-semibold uppercase tracking-wide">Password</label>
                <div className="relative group">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 w-4 h-4 transition-colors" />
                  <input
                    type={show ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full bg-gray-50 border border-gray-200 focus:border-orange-400 focus:bg-white text-gray-800 pl-10 pr-11 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/20 transition-all placeholder:text-gray-300"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShow(v => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-0.5"
                  >
                    {show ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl"
                >
                  <span className="text-base">⚠️</span>
                  {error}
                </motion.div>
              )}

              {/* Submit */}
              <motion.button
                type="submit"
                disabled={loading || !username || !password}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-all text-sm shadow-lg shadow-orange-200 flex items-center justify-center gap-2 mt-1"
              >
                {loading ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Signing in...</>
                ) : (
                  <>Enter Portal <ArrowRight size={15} /></>
                )}
              </motion.button>
            </form>

            <div className="flex items-center gap-2 text-center">
              <div className="flex-1 h-px bg-gray-100" />
              <span className="text-gray-300 text-xs flex items-center gap-1"><Sparkles size={10} /> Secure Access</span>
              <div className="flex-1 h-px bg-gray-100" />
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-400 text-xs mt-5">
          धुआँ Comic Studio · Writer's only portal
        </p>
      </motion.div>
    </div>
  );
}
