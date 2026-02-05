import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Workflow, LogIn, UserPlus } from 'lucide-react';
import { login, register } from '../utils/api';
import useAuthStore from '../store/authStore';
import useSopStore from '../store/sopStore';

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const setUser = useAuthStore(s => s.setUser);
  const addToast = useSopStore(s => s.addToast);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let data;
      if (isRegister) {
        data = await register(email, password, name);
      } else {
        data = await login(email, password);
      }
      setUser(data.token, data.user);
      addToast({ type: 'success', message: `Welcome, ${data.user.name}!` });
      navigate('/');
    } catch (err) {
      const msg = err.response?.data?.error || 'Authentication failed';
      addToast({ type: 'error', message: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Workflow className="w-8 h-8 text-synthia-500" />
            <span className="text-2xl font-bold text-white">SOP Builder</span>
          </div>
          <p className="text-sm text-slate-400">by Synthia</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-2xl">
          <h2 className="text-lg font-semibold text-white mb-4">
            {isRegister ? 'Create Account' : 'Sign In'}
          </h2>

          {isRegister && (
            <div className="mb-3">
              <label className="block text-sm text-slate-300 mb-1">Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Your name"
                required={isRegister}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-synthia-500 focus:border-transparent"
              />
            </div>
          )}

          <div className="mb-3">
            <label className="block text-sm text-slate-300 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-synthia-500 focus:border-transparent"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm text-slate-300 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-synthia-500 focus:border-transparent"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-synthia-600 hover:bg-synthia-700 rounded-lg transition-colors disabled:opacity-50 shadow-lg shadow-synthia-500/20"
          >
            {isRegister ? <UserPlus className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
            {loading ? 'Please wait...' : isRegister ? 'Create Account' : 'Sign In'}
          </button>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => setIsRegister(!isRegister)}
              className="text-sm text-synthia-400 hover:text-synthia-300 transition-colors"
            >
              {isRegister ? 'Already have an account? Sign in' : "Don't have an account? Register"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
