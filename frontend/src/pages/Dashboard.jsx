import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
    Users,
    Droplet,
    Calendar,
    Activity,
    ArrowRight,
    PlusCircle,
    FileText,
    Loader2,
    HeartHandshake,
    MapPin,
    Clock,
    CheckCircle,
    UserPlus,
    UserMinus,
    Hospital
} from 'lucide-react';
import { Link } from 'react-router-dom';

const Dashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [camps, setCamps] = useState([]);
    const [campsLoading, setCampsLoading] = useState(true);
    const [registering, setRegistering] = useState(null);
    const [toast, setToast] = useState(null);

    const user = JSON.parse(localStorage.getItem('user'));

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await axios.get('http://localhost:5000/api/stats');
                setStats(response.data);
            } catch (err) {
                console.error('Error fetching stats:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
        const interval = setInterval(fetchStats, 5000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (user?.role === 'DONOR') {
            fetchCamps();
        }
    }, []);

    const fetchCamps = async () => {
        try {
            setCampsLoading(true);
            const res = await axios.get('http://localhost:5000/api/camps');
            setCamps(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setCampsLoading(false);
        }
    };

    const isRegistered = (camp) => camp.registeredDonors?.includes(user?.username);

    const handleRegister = async (camp) => {
        setRegistering(camp._id);
        try {
            if (isRegistered(camp)) {
                await axios.delete(`http://localhost:5000/api/camps/${camp._id}/register`, {
                    data: { username: user.username }
                });
                showToast('Unregistered from camp.');
            } else {
                await axios.post(`http://localhost:5000/api/camps/${camp._id}/register`, {
                    username: user.username
                });
                showToast('Successfully registered for the camp!');
            }
            fetchCamps();
        } catch (err) {
            showToast(err.response?.data?.error || 'Something went wrong.', 'error');
        } finally {
            setRegistering(null);
        }
    };

    const quickActions = [
        { name: 'Donate Blood', icon: PlusCircle, path: '/donate', color: 'bg-green-500', roles: ['DONOR'] },
        { name: 'Request Blood', icon: FileText, path: '/request', color: 'bg-red-500', roles: ['HOSPITAL'] },
        { name: 'View Stocks', icon: Activity, path: '/stock', color: 'bg-blue-500', roles: ['HOSPITAL'] },
    ].filter(action => action.roles.includes(user?.role));

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <Loader2 className="w-12 h-12 text-red-600 animate-spin" />
        </div>
    );

    // ── DONOR DASHBOARD ──────────────────────────────────────────────────────
    if (user?.role === 'DONOR') {
        const myRegistered = camps.filter(c => c.registeredDonors?.includes(user.username));
        const upcoming = camps.filter(c => !c.registeredDonors?.includes(user.username));

        return (
            <div className="space-y-8 animate-in fade-in duration-500">
                {/* Donor Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatCard icon={Users} label="Total Donors" value={stats?.totalDonors || 0} trend="Active" color="text-blue-600" bg="bg-blue-50" />
                    <StatCard icon={Calendar} label="Upcoming Camps" value={stats?.upcomingCamps || 0} trend="Scheduled" color="text-purple-600" bg="bg-purple-50" />
                    <StatCard icon={Activity} label="Emergency Requests" value={stats?.emergencyRequests || 0} trend="Urgent" color="text-red-600" bg="bg-red-50" />
                </div>

                {/* My Registered Camps */}
                {myRegistered.length > 0 && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-gray-800 flex items-center space-x-2">
                                <CheckCircle className="w-5 h-5 text-green-500" />
                                <span>My Registered Camps</span>
                            </h2>
                            <span className="text-xs font-black bg-green-100 text-green-600 px-3 py-1 rounded-full uppercase tracking-wide">
                                {myRegistered.length} signed up
                            </span>
                        </div>
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                            {myRegistered.map(camp => (
                                <CampCard key={camp._id} camp={camp} user={user} registered={true}
                                    onRegister={handleRegister} isProcessing={registering === camp._id} />
                            ))}
                        </div>
                    </div>
                )}

                {/* All Upcoming Camps */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-gray-800">Upcoming Camps</h2>
                        <Link to="/camps" className="text-sm font-black text-red-600 hover:underline underline-offset-4 flex items-center space-x-1">
                            <span>View All</span>
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>

                    {campsLoading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
                        </div>
                    ) : upcoming.length === 0 && myRegistered.length === 0 ? (
                        <div className="bg-white border border-gray-100 rounded-2xl p-12 text-center">
                            <Calendar className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                            <p className="font-black text-gray-400">No camps scheduled yet.</p>
                        </div>
                    ) : upcoming.length === 0 ? (
                        <div className="bg-white border border-gray-100 rounded-2xl p-8 text-center">
                            <p className="font-bold text-gray-400 text-sm">You're registered for all available camps!</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                            {upcoming.slice(0, 4).map(camp => (
                                <CampCard key={camp._id} camp={camp} user={user} registered={false}
                                    onRegister={handleRegister} isProcessing={registering === camp._id} />
                            ))}
                        </div>
                    )}
                </div>

                {/* Quick Actions */}
                <div className="space-y-4">
                    <h2 className="text-xl font-bold text-gray-800">Quick Actions</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {quickActions.map((action) => {
                            const Icon = action.icon;
                            return (
                                <Link key={action.name} to={action.path}
                                    className="group flex items-center justify-between p-4 bg-white border border-gray-100 rounded-xl hover:shadow-md transition-all"
                                >
                                    <div className="flex items-center space-x-4">
                                        <div className={`p-2 rounded-lg text-white ${action.color}`}>
                                            <Icon className="w-6 h-6" />
                                        </div>
                                        <span className="font-bold text-gray-700">{action.name}</span>
                                    </div>
                                    <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-red-500 transform group-hover:translate-x-1 transition-all" />
                                </Link>
                            );
                        })}
                    </div>
                </div>

                {/* Toast */}
                {toast && (
                    <div className={`fixed bottom-8 right-8 z-50 px-6 py-4 rounded-2xl shadow-xl text-white font-black text-sm animate-in slide-in-from-right-4 duration-300 ${toast.type === 'error' ? 'bg-red-600' : 'bg-emerald-600'}`}>
                        {toast.msg}
                    </div>
                )}
            </div>
        );
    }

    // ── HOSPITAL DASHBOARD ────────────────────────────────────────────────────
    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard icon={Users} label="Total Donors" value={stats?.totalDonors || 0} trend="Active" color="text-blue-600" bg="bg-blue-50" />
                <StatCard icon={Droplet} label="Requests" value={stats?.emergencyRequests || 0} trend="Urgent" color="text-red-600" bg="bg-red-50" />
                <StatCard icon={Calendar} label="Upc. Camps" value={stats?.upcomingCamps || 0} trend="Upcoming" color="text-purple-600" bg="bg-purple-50" />
                <StatCard icon={Activity} label="Hospitals" value={stats?.totalHospitals || 0} trend="Registered" color="text-emerald-600" bg="bg-emerald-50" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 space-y-6">
                    <h2 className="text-xl font-bold text-gray-800">Quick Actions</h2>
                    <div className="space-y-4">
                        {quickActions.map((action) => {
                            const Icon = action.icon;
                            return (
                                <Link key={action.name} to={action.path}
                                    className="group flex items-center justify-between p-4 bg-white border border-gray-100 rounded-xl hover:shadow-md transition-all"
                                >
                                    <div className="flex items-center space-x-4">
                                        <div className={`p-2 rounded-lg text-white ${action.color}`}>
                                            <Icon className="w-6 h-6" />
                                        </div>
                                        <span className="font-bold text-gray-700">{action.name}</span>
                                    </div>
                                    <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-red-500 transform group-hover:translate-x-1 transition-all" />
                                </Link>
                            );
                        })}
                    </div>
                </div>

                <div className="lg:col-span-2 space-y-6">
                    <h2 className="text-xl font-bold text-gray-800">Recent Activity</h2>
                    <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b border-gray-100 font-bold text-gray-600 text-sm">
                                <tr>
                                    <th className="px-6 py-4">Activity Type</th>
                                    <th className="px-6 py-4">User/Entity</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Time</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {stats?.activities?.length > 0 ? (
                                    stats.activities.map((activity, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 font-medium text-gray-800">{activity.type}</td>
                                            <td className="px-6 py-4 text-gray-600">{activity.entity}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded text-xs font-bold ${
                                                    activity.status === 'Emergency' ? 'bg-red-100 text-red-600' :
                                                    activity.status === 'Completed' ? 'bg-green-100 text-green-600' :
                                                    activity.status === 'Interested' ? 'bg-blue-100 text-blue-600' :
                                                    'bg-gray-100 text-gray-600'
                                                }`}>
                                                    {activity.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-gray-400 text-sm">{activity.time}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-12 text-center text-gray-400 italic">No recent activities found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Camp card used in Donor Dashboard
const CampCard = ({ camp, user, registered, onRegister, isProcessing }) => (
    <div className={`bg-white border rounded-2xl flex overflow-hidden hover:shadow-md transition-all ${registered ? 'border-green-200' : 'border-gray-100'}`}>
        <div className="w-24 bg-red-600 flex flex-col items-center justify-center text-white p-4 flex-shrink-0">
            <Calendar className="w-7 h-7 mb-2 opacity-90" />
            <span className="text-2xl font-black leading-none">{camp.date.split('-')[2]}</span>
            <span className="uppercase font-extrabold text-[10px] tracking-widest">
                {new Date(camp.date + 'T00:00:00').toLocaleString('default', { month: 'short' })}
            </span>
        </div>
        <div className="flex-1 p-5 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="font-black text-gray-800 text-base leading-tight truncate">{camp.name}</h3>
                {registered && <span className="flex-shrink-0 text-[10px] font-black bg-green-100 text-green-600 px-2 py-0.5 rounded-full uppercase">Registered</span>}
            </div>
            <div className="space-y-1 mb-4">
                <div className="flex items-center text-gray-400 text-xs font-bold">
                    <MapPin className="w-3.5 h-3.5 mr-1.5 text-red-400 flex-shrink-0" />
                    <span className="truncate">{camp.venue}</span>
                </div>
                <div className="flex items-center text-gray-400 text-xs font-bold">
                    <Clock className="w-3.5 h-3.5 mr-1.5 text-red-400 flex-shrink-0" />
                    {camp.time}
                </div>
                {camp.organizer && (
                    <div className="flex items-center text-gray-400 text-xs font-bold">
                        <Hospital className="w-3.5 h-3.5 mr-1.5 text-gray-300 flex-shrink-0" />
                        {camp.organizer}
                    </div>
                )}
            </div>
            <button
                onClick={() => onRegister(camp)}
                disabled={isProcessing}
                className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl font-black text-xs transition-all active:scale-95 disabled:opacity-50 ${
                    registered
                        ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-100'
                        : 'bg-red-600 text-white hover:bg-red-700 shadow-md shadow-red-100'
                }`}
            >
                {isProcessing ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : registered ? (
                    <><UserMinus className="w-3.5 h-3.5" /><span>Unregister</span></>
                ) : (
                    <><UserPlus className="w-3.5 h-3.5" /><span>Register Now</span></>
                )}
            </button>
        </div>
    </div>
);

const StatCard = ({ icon: Icon, label, value, trend, color, bg }) => (
    <div className="p-6 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-xl ${bg} ${color}`}>
                <Icon className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{trend}</span>
        </div>
        <div className="text-3xl font-extrabold text-gray-800 mb-1 leading-none">{value}</div>
        <div className="text-sm font-medium text-gray-500">{label}</div>
    </div>
);

export default Dashboard;
