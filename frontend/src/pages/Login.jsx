import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { Droplet, Lock, User as UserIcon, HeartHandshake, Hospital as HospitalIcon, ArrowRight, ShieldCheck } from 'lucide-react';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('DONOR'); // Default to Donor
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await axios.post('http://localhost:5000/api/auth/login', { username, password });
            const user = res.data.user;

            // Optional: Strict check if user role matches the selected toggle
            if (user.role !== role) {
                setError(`This account is registered as a ${user.role}. Please select the correct login type.`);
                setLoading(false);
                return;
            }

            localStorage.setItem('user', JSON.stringify(user));
            if (user.role === 'DONOR') navigate('/camps');
            else if (user.role === 'ADMIN') navigate('/admin-dashboard');
            else navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.error || 'Invalid Username or Password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
            <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
                <div className="inline-flex p-3 bg-red-100 rounded-2xl mb-4 shadow-sm animate-bounce">
                    <Droplet className="h-10 w-10 text-red-600 fill-current" />
                </div>
                <h2 className="text-4xl font-black text-gray-900 tracking-tight">
                    BloodLink <span className="text-red-600">Thane</span>
                </h2>
                <p className="mt-2 text-sm font-bold text-gray-500 uppercase tracking-widest">
                    Sign in to your portal
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-10 px-4 shadow-2xl sm:rounded-3xl sm:px-10 border border-gray-100 mx-4 sm:mx-0">

                    {/* Role Selection Tabs */}
                    <div className="flex bg-gray-100 p-1.5 rounded-2xl mb-8">
                        <button
                            onClick={() => { setRole('DONOR'); setError(''); }}
                            className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-xl font-bold transition-all duration-300 ${role === 'DONOR'
                                    ? 'bg-white text-red-600 shadow-md transform scale-[1.02]'
                                    : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            <HeartHandshake className="w-5 h-5" />
                            <span>Donor Login</span>
                        </button>
                        <button
                            onClick={() => { setRole('HOSPITAL'); setError(''); }}
                            className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-xl font-bold transition-all duration-300 ${role === 'HOSPITAL'
                                    ? 'bg-white text-blue-600 shadow-md transform scale-[1.02]'
                                    : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            <HospitalIcon className="w-5 h-5" />
                            <span>Hospital Login</span>
                        </button>
                        <button
                            onClick={() => { setRole('ADMIN'); setError(''); }}
                            className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-xl font-bold transition-all duration-300 ${role === 'ADMIN'
                                    ? 'bg-white text-purple-600 shadow-md transform scale-[1.02]'
                                    : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            <ShieldCheck className="w-5 h-5" />
                            <span>Admin Login</span>
                        </button>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-700 rounded-xl text-sm font-bold animate-pulse text-center">
                            {error}
                        </div>
                    )}

                    <form className="space-y-6" onSubmit={handleLogin}>
                        <div>
                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Username</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <UserIcon className={`h-5 w-5 transition-colors ${role === 'DONOR' ? 'text-red-400' : role === 'ADMIN' ? 'text-purple-400' : 'text-blue-400'}`} />
                                </div>
                                <input
                                    type="text"
                                    required
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="appearance-none block w-full pl-12 pr-4 py-4 border border-gray-200 rounded-2xl bg-gray-50 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all font-medium"
                                    style={{ '--tw-ring-color': role === 'DONOR' ? '#ef4444' : role === 'ADMIN' ? '#9333ea' : '#3b82f6' }}
                                    placeholder="Enter your username"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Password</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Lock className={`h-5 w-5 transition-colors ${role === 'DONOR' ? 'text-red-400' : role === 'ADMIN' ? 'text-purple-400' : 'text-blue-400'}`} />
                                </div>
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="appearance-none block w-full pl-12 pr-4 py-4 border border-gray-200 rounded-2xl bg-gray-50 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all font-medium"
                                    style={{ '--tw-ring-color': role === 'DONOR' ? '#ef4444' : role === 'ADMIN' ? '#9333ea' : '#3b82f6' }}
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full flex items-center justify-center space-x-2 py-4 px-4 border border-transparent rounded-2xl shadow-xl text-white font-black text-lg transition-all transform hover:-translate-y-1 active:scale-95 ${role === 'DONOR' ? 'bg-red-600 hover:bg-red-700' : role === 'ADMIN' ? 'bg-purple-600 hover:bg-purple-700' : 'bg-blue-600 hover:bg-blue-700'
                                } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {loading ? (
                                <span>Authenticating...</span>
                            ) : (
                                <>
                                    <span>Sign In</span>
                                    <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-10 pt-8 border-t border-gray-100 text-center">
                        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">New to BloodLink?</p>
                        <Link
                            to="/register"
                            className={`inline-flex items-center space-x-2 font-black text-lg underline decoration-2 underline-offset-4 transition-colors ${role === 'DONOR' ? 'text-red-600 hover:text-red-700' : role === 'ADMIN' ? 'text-purple-600 hover:text-purple-700' : 'text-blue-600 hover:text-blue-700'
                                }`}
                        >
                            <span>Create an account</span>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
