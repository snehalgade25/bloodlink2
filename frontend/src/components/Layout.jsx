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
    Bell,
    Users,
    CreditCard,
    MessageSquare
} from 'lucide-react';
import axios from 'axios';

const Layout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const user = JSON.parse(sessionStorage.getItem('user'));

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

        if (user.role === 'HOSPITAL') {
            const checkHospitalFeed = async () => {
                try {
                    // 1. Check for incoming volunteers for THEIR requests
                    let currentHospital = donorInfo; 
                    if (!currentHospital) {
                        const profRes = await axios.get(`http://localhost:5000/api/auth/my-stock/${user.username}`);
                        currentHospital = profRes.data;
                        setDonorInfo(currentHospital);
                    }

                    const volRes = await axios.get(`http://localhost:5000/api/my-requests/${currentHospital.name}`);
                    const myRequests = volRes.data;
                    const totalVolunteers = myRequests.reduce((acc, r) => acc + (r.volunteers?.length || 0), 0);
                    
                    if (totalVolunteers > lastRequestCount && lastRequestCount !== 0) {
                        const allVols = myRequests.flatMap(r => r.volunteers || []);
                        const sortedVols = allVols.sort((a,b) => new Date(b.registeredAt) - new Date(a.registeredAt));
                        if (sortedVols.length > 0) {
                            setNewRequest({ 
                                isVolunteer: true, 
                                username: sortedVols[0].username,
                                volunteerType: sortedVols[0].volunteerType,
                                hospitalName: sortedVols[0].volunteerType === 'HOSPITAL' ? 'Hospital Support Response!' : 'New Donor Spotted!'
                            });
                        }
                    }

                    // 2. Check for NEW broadcasts from OTHER hospitals
                    const broadcastRes = await axios.get(`http://localhost:5000/api/requests/all`);
                    const otherReqs = broadcastRes.data.filter(r => r.hospitalName !== currentHospital.name);
                    
                    // We need a separate count or state for this to avoid conflicts with 'lastRequestCount'
                    // For simplicity, let's just check if there's a very fresh one in the last 15 seconds
                    const latestReq = otherReqs[0];
                    if (latestReq) {
                        const created = new Date(latestReq.createdAt).getTime();
                        const now = new Date().getTime();
                        if (now - created < 15000 && location.pathname !== '/hospital-requests') {
                             setNewRequest({ ...latestReq, isNewBroadcast: true });
                        }
                    }

                    setLastRequestCount(totalVolunteers);
                } catch (err) {
                    console.error("Hospital feed error:", err);
                }
            };
            checkHospitalFeed();
            const interval = setInterval(checkHospitalFeed, 8000);
            return () => clearInterval(interval);
        }
    }, [user?.username, lastRequestCount, donorInfo, location.pathname, navigate, user?.role]);

    const handleLogout = () => {
        sessionStorage.removeItem('user');
        navigate('/login');
    };

    // Define links with role restrictions
    const menuItems = [
        { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['HOSPITAL', 'DONOR'] },
        { name: 'Manage My Stock', path: '/manage-stock', icon: Activity, roles: ['HOSPITAL'] },
        { name: 'Blood Stock', path: '/stock', icon: Hospital, roles: ['HOSPITAL'] },
        { name: 'Hospital Requests', path: '/hospital-requests', icon: MessageSquare, roles: ['HOSPITAL'] },
        { name: 'Emergency Requests', path: '/emergency-requests', icon: AlertTriangle, roles: ['DONOR'] },
        { name: 'Upcoming Camps', path: '/camps', icon: Calendar, roles: ['DONOR', 'HOSPITAL'] },
        { name: 'Donate Blood', path: '/donate', icon: HeartHandshake, roles: ['DONOR'] },
        { name: 'Request Blood', path: '/request', icon: Droplet, roles: ['HOSPITAL'] },
        { name: 'Volunteer & Support', path: '/volunteers', icon: Users, roles: ['HOSPITAL'] },
        { name: 'My Cards', path: '/cards', icon: CreditCard, roles: ['DONOR'] },
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
                <div className="fixed bottom-8 right-8 z-[100] bg-white rounded-[2rem] p-8 shadow-2xl border border-gray-100 max-w-sm animate-in slide-in-from-right-10 duration-500 overflow-hidden group">
                    <div className="absolute top-0 left-0 w-2 h-full bg-red-600"></div>
                    
                    <div className="flex justify-between items-start mb-4">
                        <div className="bg-red-50 p-3 rounded-2xl">
                            <Bell className="w-6 h-6 text-red-600 animate-bounce" />
                        </div>
                        <button onClick={() => setNewRequest(null)} className="text-gray-400 hover:text-gray-600 transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <h4 className="text-xl font-black text-gray-800 mb-2 leading-tight">
                        {newRequest.isVolunteer ? "New Response Received!" : 
                         newRequest.isNewBroadcast ? "New Hospital Request" : 
                         "Emergency Match Found!"}
                    </h4>
                    
                    <p className="text-gray-500 text-sm font-bold leading-relaxed mb-8">
                        {newRequest.isVolunteer 
                            ? <><span className="text-red-600 font-black">{newRequest.username}</span> {newRequest.hospitalName === 'Hospital Support Response!' ? 'from another hospital ' : ''}is ready to support your request.</>
                            : <><span className="text-red-600 font-black">{newRequest.bloodGroup}</span> blood is urgently needed at <span className="font-black italic underline">{newRequest.hospitalName || 'a nearby facility'}</span>.</>
                        }
                    </p>

                    <Link 
                        to={newRequest.isVolunteer ? `/volunteers?tab=${newRequest.volunteerType || 'DONOR'}` : (user.role === 'HOSPITAL' ? "/hospital-requests" : "/emergency-requests")}
                        onClick={() => setNewRequest(null)}
                        className="w-full flex items-center justify-center space-x-3 py-4 bg-gray-900 text-white rounded-xl font-black text-xs uppercase tracking-[0.2em] hover:bg-black transition-all shadow-lg active:scale-95 group"
                    >
                        <span>View Details</span>
                        <Activity className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                    </Link>
                </div>
            )}
        </div>
    );
};

export default Layout;
