import React, { useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Droplet,
    Calendar,
    HeartHandshake,
    LogOut,
    Hospital,
    Activity,
    AlertTriangle,
    X,
    Bell
} from 'lucide-react';
import axios from 'axios';

const Layout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const user = JSON.parse(localStorage.getItem('user'));

    const [donorInfo, setDonorInfo] = React.useState(null);
    const [lastRequestCount, setLastRequestCount] = React.useState(0);
    const [newRequest, setNewRequest] = React.useState(null);

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }

        // Admin has its own dashboard, redirect out of Layout
        if (user.role === 'ADMIN') {
            navigate('/admin-dashboard');
            return;
        }

        if (user.role === 'DONOR') {

            // Notification Polling for Donors
            const checkRequests = async () => {
                try {
                    // 1. Get donor profile (if not already fetched)
                    let currentDonor = donorInfo;
                    if (!currentDonor) {
                        const donorRes = await axios.get(`http://localhost:5000/api/auth/my-profile/${user.username}`);
                        currentDonor = donorRes.data;
                        setDonorInfo(currentDonor);
                    }

                    // 2. Check for matching requests
                    const requestsRes = await axios.get(`http://localhost:5000/api/matching-requests/${currentDonor.bloodGroup}`);
                    const requests = requestsRes.data;

                    // If we find more requests than before, show a notification
                    if (requests.length > lastRequestCount && lastRequestCount !== 0) {
                        setNewRequest(requests[0]); // Show the most recent one
                    }
                    setLastRequestCount(requests.length);
                } catch (err) {
                    console.error("Layout polling error:", err);
                }
            };

            checkRequests();
            const interval = setInterval(checkRequests, 7000);
            return () => clearInterval(interval);
        }
    }, [user?.username, lastRequestCount, donorInfo, location.pathname, navigate, user?.role]);

    const handleLogout = () => {
        localStorage.removeItem('user');
        navigate('/login');
    };

    // Define links with role restrictions
    const menuItems = [
        { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['HOSPITAL', 'DONOR'] },
        { name: 'Manage My Stock', path: '/manage-stock', icon: Activity, roles: ['HOSPITAL'] },
        { name: 'Blood Stock', path: '/stock', icon: Hospital, roles: ['HOSPITAL'] },
        { name: 'Emergency Requests', path: '/emergency-requests', icon: AlertTriangle, roles: ['DONOR'] },
        { name: 'Upcoming Camps', path: '/camps', icon: Calendar, roles: ['DONOR', 'HOSPITAL'] },
        { name: 'Donate Blood', path: '/donate', icon: HeartHandshake, roles: ['DONOR'] },
        { name: 'Request Blood', path: '/request', icon: Droplet, roles: ['HOSPITAL'] },
    ];

    // Filter items based on user role
    const filteredItems = menuItems.filter(item => item.roles.includes(user?.role));

    return (
        <div className="flex min-h-screen bg-gray-50">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-gray-200 flex flex-col shadow-sm">
                <div className="p-6 border-b border-gray-50">
                    <Link to="/" className="flex items-center space-x-3">
                        <div className="p-2 bg-red-100 rounded-lg">
                            <Droplet className="w-6 h-6 text-red-600 fill-current" />
                        </div>
                        <span className="text-xl font-black text-gray-800 tracking-tight">BloodLink</span>
                    </Link>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    {filteredItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex items-center space-x-3 p-3 rounded-xl transition-all duration-200 group ${isActive
                                    ? 'bg-red-50 text-red-600 shadow-sm border border-red-100'
                                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                                    }`}
                            >
                                <Icon className={`w-5 h-5 transition-transform duration-200 ${isActive ? 'scale-110 text-red-600' : 'text-gray-400 group-hover:scale-110'}`} />
                                <span className={`font-bold ${isActive ? 'text-red-600' : ''}`}>{item.name}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-gray-50">
                    <button
                        onClick={handleLogout}
                        className="flex items-center space-x-3 w-full p-3 text-gray-500 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all group"
                    >
                        <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        <span className="font-bold">Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col h-screen overflow-hidden">
                <header className="bg-white border-b border-gray-100 px-8 py-4 flex justify-between items-center shrink-0">
                    <h1 className="text-2xl font-black text-gray-800 capitalize tracking-tight">
                        {location.pathname.split('/')[1]?.replace('-', ' ') || 'Overview'}
                    </h1>
                    <div className="flex items-center space-x-6">
                        <div className="flex items-center space-x-3">
                            <div className="text-right">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">
                                    {user?.role}
                                </p>
                                <p className="text-sm font-black text-gray-800 leading-none">
                                    {user?.username}
                                </p>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center border-2 border-white shadow-sm overflow-hidden">
                                <img
                                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username}`}
                                    alt="avatar"
                                />
                            </div>
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    <div className="max-w-7xl mx-auto">
                        <Outlet />
                    </div>
                </div>
            </main>

            {/* Notification Popup */}
            {newRequest && (
                <div className="fixed bottom-8 right-8 z-50 animate-in slide-in-from-right-8 duration-500">
                    <div className="bg-red-600 text-white p-6 rounded-3xl shadow-2xl shadow-red-200 border border-white/20 max-w-sm relative">
                        <button
                            onClick={() => setNewRequest(null)}
                            className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="flex items-start space-x-4">
                            <div className="bg-white/20 p-3 rounded-2xl">
                                <Bell className="w-6 h-6 animate-bounce" />
                            </div>
                            <div className="space-y-3">
                                <div>
                                    <h4 className="font-black text-lg leading-tight">Emergency Matching Your Blood Group!</h4>
                                    <p className="text-white/80 text-sm font-medium mt-1">
                                        Someone needs <span className="font-black underline">{newRequest.bloodGroup}</span> blood immediately.
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-bold uppercase tracking-widest text-white/60">Location</p>
                                    <p className="text-sm font-black italic">{newRequest.hospitalName || 'BloodLink Hospital'}</p>
                                </div>
                                <Link
                                    to="/emergency-requests"
                                    onClick={() => setNewRequest(null)}
                                    className="block w-full text-center py-3 bg-white text-red-600 font-black rounded-xl hover:bg-gray-50 transition-colors"
                                >
                                    View Details & Contact
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Layout;
