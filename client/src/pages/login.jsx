import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, Loader, Key } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { loginUser } from '../services/apiServices';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');

        if (!email || !password) {
            setError('Please enter both email and password.');
            return;
        }
        
        setIsLoading(true);

        try {
            // Call the correct login endpoint on your FastAPI server
            const data = await loginUser(email, password);

            if (!data) {
                // Use the 'detail' key from FastAPI's HTTPException
                throw new Error(data.detail || 'An unexpected error occurred.');
            }
            
            // --- SUCCESS! ---
            // Save the token and redirect to the dashboard.
            console.log("Login successful! Token:", data.access_token);
            localStorage.setItem('accessToken', data.access_token);
            
            // Navigate to the dashboard upon successful login
            window.location.href = '/designer';
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen w-full bg-black text-white font-sans flex items-center justify-center p-4 overflow-hidden">
            {/* Background Effects matching the rest of the app */}
            <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#1a1a1a_1px,transparent_1px),linear-gradient(to_bottom,#1a1a1a_1px,transparent_1px)]"
                 style={{ backgroundSize: "3rem 3rem", maskImage: "radial-gradient(ellipse 60% 60% at 50% 50%, #000 40%, transparent 100%)" }} />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full -z-10"
                 style={{ background: `radial-gradient(circle, hsl(210, 60%, 20%, 0.4) 0%, transparent 60%)`, filter: 'blur(120px)' }} />

            <div className="relative z-10 w-full max-w-md">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="bg-gray-950/80 border border-gray-600/50 rounded-2xl backdrop-blur-lg p-8 shadow-2xl shadow-blue-500/10">
                        <div className="text-center mb-8">
                            <Key className="mx-auto h-8 w-8 text-blue-400 mb-4" />
                            <h1 className="text-3xl font-light text-white">Welcome Back</h1>
                            <p className="text-gray-400 mt-2">Log in to access your FastDB Console.</p>
                        </div>

                        <form onSubmit={handleLogin} className="space-y-6">
                            {/* Email Input */}
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                                <input
                                    type="email"
                                    placeholder="your@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg pl-12 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                />
                            </div>
                            
                            {/* Password Input */}
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg pl-12 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                />
                            </div>

                            {error && <p className="text-sm text-red-400 text-center">{error}</p>}

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-500 disabled:bg-blue-800 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 active:scale-100"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader className="animate-spin h-5 w-5" />
                                        Logging In...
                                    </>
                                ) : (
                                    "Log In"
                                )}
                            </button>
                        </form>
                        <p className="text-center text-xs text-gray-500 mt-6">
                            Don't have an account? <a href="/signup" className="text-blue-400 hover:underline">Sign Up</a>
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default LoginPage;