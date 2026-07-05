import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Lock } from 'lucide-react';
import { motion } from 'framer-motion';

const API_BASE_URL = 'http://localhost:5000/api';

export default function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/admin/login`, { username, password });
      if (response.data.success) {
        localStorage.setItem('admin_token', response.data.token);
        navigate('/admin/dashboard');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-4">
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel p-8 rounded-2xl border border-white/5"
      >
        <div className="flex flex-col items-center mb-6">
          <div className="p-3 bg-[#7c6fff]/10 rounded-full border border-[#7c6fff]/20 text-[#7c6fff] mb-2">
            <Lock size={28} />
          </div>
          <h2 className="text-2xl font-bold font-heading bg-gradient-to-r from-white to-indigo-300 bg-clip-text text-transparent">
            Admin Gateway
          </h2>
          <p className="text-xs text-gray-400 font-mono mt-1">Authorized researchers only</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest font-heading mb-1.5">
              Username
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Enter admin username"
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-[#7c6fff] focus:ring-1 focus:ring-[#7c6fff] text-sm transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest font-heading mb-1.5">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-[#7c6fff] focus:ring-1 focus:ring-[#7c6fff] text-sm transition-all"
            />
          </div>

          {error && (
            <p className="text-xs text-red-400 font-semibold bg-red-500/10 border border-red-500/25 p-3 rounded-xl">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full btn py-3 rounded-xl font-heading text-sm font-semibold transition-all duration-300 bg-gradient-to-r from-[#7c6fff] to-[#4fd1ff] text-black shadow-lg shadow-indigo-500/15 hover:shadow-[#7c6fff]/30 hover:-translate-y-0.5"
          >
            {loading ? 'Logging in...' : 'Sign In'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
