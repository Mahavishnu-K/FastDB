import { motion } from 'framer-motion';
import {
  AlertTriangle,
  Eye,
  EyeOff,
  Loader,
  Lock,
  Mail
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import * as api from '../services/apiServices';
import { initializeApiClient } from '../services/apiServices';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }
    setIsLoading(true);
    try {
      const data = await api.loginUser(email, password);

      if (!data.access_token) {
        throw new Error('Login failed: No access token received from server.');
      }

      localStorage.setItem('accessToken', data.access_token);
      initializeApiClient(data.access_token);

      toast.success('Login Successful!');
      navigate('/query');
    } catch (err) {
      localStorage.removeItem('accessToken');
      const errorMessage =
        err.response?.data?.detail || err.message || 'An unexpected error occurred.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 flex items-center justify-center p-4 overflow-hidden">
      <div className="absolute inset-0 z-0 opacity-40 dark:opacity-50">
        <div className="absolute inset-0 bg-grid-slate-500/[0.07] dark:bg-grid-slate-100/[0.05] [mask-image:radial-gradient(ellipse_at_center,white,transparent_85%)]"></div>
        <motion.div
          animate={{
            backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
          }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          style={{
            backgroundImage:
              'radial-gradient(at 27% 37%, hsla(215, 98%, 61%, 0.1) 0px, transparent 50%), radial-gradient(at 97% 21%, hsla(125, 98%, 72%, 0.1) 0px, transparent 50%), radial-gradient(at 52% 99%, hsla(355, 98%, 61%, 0.1) 0px, transparent 50%)'
          }}
          className="absolute inset-0"
        />
      </div>

      <div className="relative z-10 w-full max-w-sm">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl backdrop-blur-lg overflow-hidden"
        >
          <div className="p-8">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-medium text-slate-800 dark:text-slate-100">FastDB</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                The Intelligent Database GUI
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md pl-10 pr-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition"
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md pl-10 pr-10 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {error && (
                <div className="flex items-center justify-center gap-2 text-xs text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-500/10 p-2 rounded-md">
                  <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                id="login-button"
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white font-semibold py-2 rounded-md hover:bg-blue-500 dark:hover:bg-blue-400 disabled:bg-blue-300 dark:disabled:bg-blue-700/40 disabled:cursor-not-allowed transition-all"
              >
                {isLoading ? (
                  <>
                    <Loader className="animate-spin h-5 w-5" />
                    <span>Logging In...</span>
                  </>
                ) : (
                  'Log In'
                )}
              </button>
            </form>
          </div>

          <div className="bg-slate-100 dark:bg-slate-800/50 p-4 text-center text-sm">
            <p className="text-slate-600 dark:text-slate-400">
              Don’t have an account?{' '}
              <a
                href="#"
                className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300"
              >
                Sign Up
              </a>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage;
