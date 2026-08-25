import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, User, Sparkles, ArrowRight, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { adminLogin } from '../api/comicApi';
import './AdminLogin.css';

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
    <div className="admin-login">
      <div className="admin-login__blob admin-login__blob--tr" />
      <div className="admin-login__blob admin-login__blob--bl" />
      <div className="admin-login__blob admin-login__blob--mid" />

      <motion.div
        className="admin-login__shell"
        initial={{ opacity: 0, y: 32, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="admin-login__card">
          <div className="admin-login__banner">
            <div className="admin-login__banner-inner">
              <div className="admin-login__icon">✍️</div>
              <h1 className="admin-login__title">Writer's Portal</h1>
              <p className="admin-login__subtitle hindi-text">धुआँ Comic Studio</p>
            </div>
          </div>

          <div className="admin-login__body">
            <div className="admin-login__welcome">
              <h2>Welcome back, Karan</h2>
              <p>Sign in to manage your comic</p>
            </div>

            <form className="admin-login__form" onSubmit={handleLogin}>
              <div className="admin-login__field">
                <label htmlFor="admin-username">Username</label>
                <div className="admin-login__control">
                  <User />
                  <input
                    id="admin-username"
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder="Enter your username"
                    autoFocus
                    autoComplete="username"
                  />
                </div>
              </div>

              <div className="admin-login__field">
                <label htmlFor="admin-password">Password</label>
                <div className="admin-login__control admin-login__control--password">
                  <Lock />
                  <input
                    id="admin-password"
                    type={show ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="admin-login__toggle"
                    onClick={() => setShow(v => !v)}
                    aria-label={show ? 'Hide password' : 'Show password'}
                  >
                    {show ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {error && (
                <motion.div
                  className="admin-login__error"
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <AlertCircle size={16} />
                  {error}
                </motion.div>
              )}

              <motion.button
                type="submit"
                className="admin-login__submit"
                disabled={loading || !username || !password}
                whileTap={{ scale: 0.98 }}
              >
                {loading ? (
                  <>
                    <span className="admin-login__spinner" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Enter Portal <ArrowRight size={15} />
                  </>
                )}
              </motion.button>
            </form>

            <div className="admin-login__secure">
              <span><Sparkles size={10} /> Secure Access</span>
            </div>
          </div>
        </div>

        <p className="admin-login__footer">
          धुआँ Comic Studio · Writer's only portal
        </p>
      </motion.div>
    </div>
  );
}
