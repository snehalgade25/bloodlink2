import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
    Droplet,
    Users,
    Hospital,
    Activity,
    LogOut,
    ShieldCheck,
    Trash2,
    Loader2,
    HeartHandshake,
    AlertTriangle,
    Calendar,
    RefreshCw,
    Search,
    X,
    Building2,
    Award,
    ArrowRightLeft,
    CheckCircle,
    XCircle,
    MapPin,
    Clock,
    Phone
} from 'lucide-react';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const user = JSON.parse(sessionStorage.getItem('user'));

    const [activeTab, setActiveTab] = useState('overview');
    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState([]);
    const [donors, setDonors] = useState([]);
    const [hospitals, setHospitals] = useState([]);
    const [requests, setRequests] = useState([]);
    const [camps, setCamps] = useState([]);
    const [bloodBanks, setBloodBanks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [campDeleteConfirm, setCampDeleteConfirm] = useState(null);
    const [toast, setToast] = useState(null);

    // Redirect if not admin
    useEffect(() => {
        if (!user || user.role !== 'ADMIN') {
            navigate('/login');
        }
    }, []);

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    const fetchAll = async () => {
        setLoading(true);
        try {
            const [statsRes, usersRes, donorsRes, hospitalsRes, reqsRes, campsRes, banksRes] = await Promise.all([
                axios.get('http://localhost:5000/api/stats'),
                axios.get('http://localhost:5000/api/auth/admin/users'),
                axios.get('http://localhost:5000/api/auth/admin/donors'),
                axios.get('http://localhost:5000/api/auth/admin/hospitals'),
                axios.get('http://localhost:5000/api/requests/all'),
                axios.get('http://localhost:5000/api/camps'),
                axios.get('http://localhost:5000/api/bloodbanks'),
            ]);
            setStats(statsRes.data);
            setUsers(usersRes.data);
            setDonors(donorsRes.data);
            setHospitals(hospitalsRes.data);
            setRequests(reqsRes.data);
            setCamps(campsRes.data);
            setBloodBanks(banksRes.data);
        } catch (err) {
            console.error('Admin fetch error:', err);
            showToast('Failed to load data', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleCloseRequest = async (id) => {
        try {
            await axios.patch(`http://localhost:5000/api/admin/request/${id}/status`, { status: 'Completed' });
            setRequests(prev => prev.map(r => r._id === id ? { ...r, status: 'Completed' } : r));
            showToast('Request marked as completed');
        } catch (err) { showToast('Failed to update', 'error'); }
    };

    const handleDeleteCamp = async (id) => {
        try {
            await axios.delete(`http://localhost:5000/api/admin/camps/${id}`);
            setCamps(prev => prev.filter(c => c._id !== id));
            setCampDeleteConfirm(null);
            showToast('Camp deleted successfully');
        } catch (err) { showToast('Failed to delete camp', 'error'); }
    };

    useEffect(() => {
        fetchAll();
    }, []);

    const handleDeleteUser = async (id) => {
        try {
            await axios.delete(`http://localhost:5000/api/auth/admin/users/${id}`);
            setUsers(prev => prev.filter(u => u._id !== id));
            setDeleteConfirm(null);
            showToast('User deleted successfully');
        } catch (err) {
            showToast('Failed to delete user', 'error');
        }
    };

    const handleLogout = () => {
        sessionStorage.removeItem('user');
        navigate('/login');
    };

    const filteredUsers = users.filter(u =>
        u.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.role?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const tabs = [
        { id: 'overview', label: 'Overview', icon: Activity },
        { id: 'requests', label: 'Requests', icon: AlertTriangle },
        { id: 'camps', label: 'Camps', icon: Calendar },
        { id: 'users', label: 'Users', icon: Users },
        { id: 'donors', label: 'Donors', icon: HeartHandshake },
        { id: 'hospitals', label: 'Hospitals', icon: Hospital },
        { id: 'bloodbanks', label: 'Blood Banks', icon: Building2 },
    ];

    const roleBadge = (role) => {
        const map = {
            DONOR: 'bg-red-100 text-red-600',
            HOSPITAL: 'bg-blue-100 text-blue-600',
            ADMIN: 'bg-purple-100 text-purple-600',
        };
        return map[role] || 'bg-gray-100 text-gray-600';
    };

    return (
        <div className="flex min-h-screen bg-gray-50">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-gray-200 flex flex-col shadow-sm">
                <div className="p-6 border-b border-gray-50">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-red-100 rounded-lg">
                            <Droplet className="w-6 h-6 text-red-600 fill-current" />
                        </div>
                        <span className="text-xl font-black text-gray-800 tracking-tight">BloodLink</span>
                    </div>
                    <div className="mt-3 flex items-center space-x-2">
                        <ShieldCheck className="w-4 h-4 text-purple-500" />
                        <span className="text-xs font-bold text-purple-600 uppercase tracking-widest">Admin Panel</span>
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full flex items-center space-x-3 p-3 rounded-xl transition-all duration-200 group ${
                                    isActive
                                        ? 'bg-purple-50 text-purple-600 shadow-sm border border-purple-100'
                                        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                                }`}
                            >
                                <Icon className={`w-5 h-5 transition-transform duration-200 ${isActive ? 'scale-110 text-purple-600' : 'text-gray-400 group-hover:scale-110'}`} />
                                <span className={`font-bold ${isActive ? 'text-purple-600' : ''}`}>{tab.label}</span>
                                {tab.id === 'users' && (
                                    <span className="ml-auto text-xs bg-gray-100 text-gray-500 font-bold px-2 py-0.5 rounded-full">
                                        {users.length}
                                    </span>
                                )}
                            </button>
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
                {/* Header */}
                <header className="bg-white border-b border-gray-100 px-8 py-4 flex justify-between items-center shrink-0">
                    <h1 className="text-2xl font-black text-gray-800 capitalize tracking-tight">
                        {tabs.find(t => t.id === activeTab)?.label || 'Admin Dashboard'}
                    </h1>
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={fetchAll}
                            className="flex items-center space-x-2 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-100 font-bold text-sm transition-all"
                        >
                            <RefreshCw className="w-4 h-4" />
                            <span>Refresh</span>
                        </button>
                        <div className="flex items-center space-x-3">
                            <div className="text-right">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">
                                    {user?.role}
                                </p>
                                <p className="text-sm font-black text-gray-800 leading-none">
                                    {user?.username}
                                </p>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center border-2 border-white shadow-sm overflow-hidden">
                                <img
                                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username}`}
                                    alt="avatar"
                                />
                            </div>
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-8">
                    <div className="max-w-7xl mx-auto space-y-8">

                        {loading ? (
                            <div className="flex items-center justify-center h-64">
                                <Loader2 className="w-12 h-12 text-purple-600 animate-spin" />
                            </div>
                        ) : (
                            <>
                                {/* OVERVIEW TAB */}
                                {activeTab === 'overview' && (
                                    <div className="space-y-8 animate-in fade-in duration-300">
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                            <button onClick={() => setActiveTab('users')} className="text-left w-full"><StatCard icon={Users} label="Total Users" value={users.filter(u=>u.role!=='ADMIN').length} trend="Registered" color="text-purple-600" bg="bg-purple-50" /></button>
                                            <button onClick={() => setActiveTab('donors')} className="text-left w-full"><StatCard icon={HeartHandshake} label="Total Donors" value={donors.length} trend="Active" color="text-red-600" bg="bg-red-50" /></button>
                                            <button onClick={() => setActiveTab('hospitals')} className="text-left w-full"><StatCard icon={Hospital} label="Hospitals" value={hospitals.length} trend="Registered" color="text-blue-600" bg="bg-blue-50" /></button>
                                            <button onClick={() => setActiveTab('requests')} className="text-left w-full"><StatCard icon={AlertTriangle} label="Emergency Requests" value={requests.length} trend={`${requests.filter(r=>r.status==='Open').length} Open`} color="text-orange-600" bg="bg-orange-50" /></button>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <button onClick={() => setActiveTab('camps')} className="text-left w-full"><StatCard icon={Calendar} label="Upcoming Camps" value={camps.length} trend="Scheduled" color="text-emerald-600" bg="bg-emerald-50" /></button>
                                            <button onClick={() => setActiveTab('bloodbanks')} className="text-left w-full"><StatCard icon={Building2} label="Blood Banks" value={bloodBanks.length} trend={`${bloodBanks.filter(b=>b.status==='Open').length} Open`} color="text-cyan-600" bg="bg-cyan-50" /></button>
                                        </div>

                                        {/* Role Breakdown + Blood Group Distribution */}
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                                                <h2 className="text-lg font-black text-gray-800 mb-4">User Role Breakdown</h2>
                                                <div className="grid grid-cols-2 gap-4">
                                                    {['DONOR', 'HOSPITAL'].map(role => {
                                                        const nonAdmin = users.filter(u => u.role !== 'ADMIN');
                                                        const count = users.filter(u => u.role === role).length;
                                                        const c = { DONOR: { bar: 'bg-red-500', text: 'text-red-600', bg: 'bg-red-50' }, HOSPITAL: { bar: 'bg-blue-500', text: 'text-blue-600', bg: 'bg-blue-50' } };
                                                        const pct = nonAdmin.length ? Math.round((count / nonAdmin.length) * 100) : 0;
                                                        return (
                                                            <div key={role} className={`${c[role].bg} rounded-xl p-4`}>
                                                                <p className={`text-xs font-black uppercase tracking-widest ${c[role].text} mb-2`}>{role}</p>
                                                                <p className={`text-3xl font-extrabold ${c[role].text} mb-2`}>{count}</p>
                                                                <div className="w-full bg-white rounded-full h-2"><div className={`${c[role].bar} h-2 rounded-full`} style={{ width: `${pct}%` }} /></div>
                                                                <p className="text-xs text-gray-500 font-bold mt-1">{pct}% of users</p>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                                                <h2 className="text-lg font-black text-gray-800 mb-4">Blood Group Distribution</h2>
                                                <div className="grid grid-cols-4 gap-3">
                                                    {['A+', 'B+', 'O+', 'AB+'].map(g => {
                                                        const count = donors.filter(d => d.bloodGroup === g).length;
                                                        const pct = donors.length ? Math.round((count / donors.length) * 100) : 0;
                                                        const colors = { 'A+': 'bg-red-500', 'B+': 'bg-blue-500', 'O+': 'bg-emerald-500', 'AB+': 'bg-purple-500' };
                                                        return (
                                                            <div key={g} className="text-center bg-gray-50 rounded-xl p-4">
                                                                <div className={`w-12 h-12 ${colors[g]} text-white rounded-full flex items-center justify-center mx-auto mb-2 font-black text-sm`}>{g}</div>
                                                                <p className="text-2xl font-extrabold text-gray-800">{count}</p>
                                                                <p className="text-[10px] font-bold text-gray-400 uppercase">{pct}% donors</p>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Network Stock Summary */}
                                        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                                            <h2 className="text-lg font-black text-gray-800 mb-4">Network Stock Summary</h2>
                                            <div className="grid grid-cols-4 gap-4">
                                                {[{l:'A+',k:'unitsA',c:'bg-red-600'},{l:'B+',k:'unitsB',c:'bg-blue-600'},{l:'O+',k:'unitsO',c:'bg-emerald-600'},{l:'AB+',k:'unitsAB',c:'bg-purple-600'}].map(({l,k,c}) => {
                                                    const total = hospitals.reduce((s,h) => s + (h[k]||0), 0);
                                                    return (
                                                        <div key={l} className="bg-gray-50 rounded-xl p-5 text-center border border-gray-100">
                                                            <div className={`w-10 h-10 ${c} text-white rounded-lg flex items-center justify-center mx-auto mb-3 font-black text-xs`}>{l}</div>
                                                            <p className="text-3xl font-extrabold text-gray-800">{total}</p>
                                                            <p className="text-[10px] font-bold text-gray-400 uppercase mt-1">Total Units</p>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* Top Donors + Inter-Hospital Transfers */}
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                                                <h2 className="text-lg font-black text-gray-800 mb-4 flex items-center space-x-2"><Award className="w-5 h-5 text-yellow-500" /><span>Top Donors</span></h2>
                                                {donors.filter(d=>d.donations?.length>0).sort((a,b)=>(b.donations?.length||0)-(a.donations?.length||0)).slice(0,5).length === 0 ? (
                                                    <p className="text-gray-400 text-sm italic text-center py-8">No completed donations yet.</p>
                                                ) : (
                                                    <div className="space-y-3">
                                                        {donors.filter(d=>d.donations?.length>0).sort((a,b)=>(b.donations?.length||0)-(a.donations?.length||0)).slice(0,5).map((d,i) => {
                                                            const tier = d.donations.length >= 8 ? '👑 Elite' : d.donations.length >= 5 ? '⭐ Gold' : d.donations.length >= 2 ? '🥈 Silver' : '🩸 Starter';
                                                            return (
                                                                <div key={d._id} className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
                                                                    <div className="flex items-center space-x-3">
                                                                        <span className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-black text-sm">#{i+1}</span>
                                                                        <div>
                                                                            <p className="font-bold text-gray-800 text-sm">{d.name}</p>
                                                                            <p className="text-[10px] text-gray-400 font-bold">{d.bloodGroup} · {tier}</p>
                                                                        </div>
                                                                    </div>
                                                                    <span className="text-lg font-black text-purple-600">{d.donations.length}</span>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                                                <h2 className="text-lg font-black text-gray-800 mb-4 flex items-center space-x-2"><ArrowRightLeft className="w-5 h-5 text-blue-500" /><span>Inter-Hospital Transfers</span></h2>
                                                {(() => {
                                                    const transfers = requests.flatMap(r => (r.volunteers||[]).filter(v=>v.volunteerType==='HOSPITAL').map(v => ({ from: v.username, to: r.hospitalName, group: r.bloodGroup, date: v.registeredAt, status: v.status })));
                                                    return transfers.length === 0 ? (
                                                        <p className="text-gray-400 text-sm italic text-center py-8">No hospital-to-hospital transfers yet.</p>
                                                    ) : (
                                                        <div className="space-y-3">{transfers.slice(0,5).map((t,i) => (
                                                            <div key={i} className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
                                                                <div className="flex items-center space-x-3">
                                                                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center"><ArrowRightLeft className="w-4 h-4 text-blue-600" /></div>
                                                                    <div>
                                                                        <p className="font-bold text-gray-800 text-sm">@{t.from} → {t.to}</p>
                                                                        <p className="text-[10px] text-gray-400 font-bold">{t.group} · {t.status}</p>
                                                                    </div>
                                                                </div>
                                                                <span className={`text-[10px] font-black px-2 py-1 rounded-full ${t.status==='Completed'?'bg-green-100 text-green-600':'bg-blue-100 text-blue-600'}`}>{t.status}</span>
                                                            </div>
                                                        ))}</div>
                                                    );
                                                })()}
                                            </div>
                                        </div>

                                        {/* Recent Activity */}
                                        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                                            <div className="px-6 py-4 border-b border-gray-100"><h2 className="text-lg font-black text-gray-800">Recent Activity</h2></div>
                                            <table className="w-full text-left">
                                                <thead className="bg-gray-50 border-b border-gray-100 font-bold text-gray-600 text-sm"><tr><th className="px-6 py-4">Activity Type</th><th className="px-6 py-4">User/Entity</th><th className="px-6 py-4">Status</th><th className="px-6 py-4">Time</th></tr></thead>
                                                <tbody className="divide-y divide-gray-100">
                                                    {stats?.activities?.length > 0 ? stats.activities.map((a, i) => (
                                                        <tr key={i} className="hover:bg-gray-50"><td className="px-6 py-4 font-medium text-gray-800">{a.type}</td><td className="px-6 py-4 text-gray-600">{a.entity}</td><td className="px-6 py-4"><span className={`px-2 py-1 rounded text-xs font-bold ${a.status==='Emergency'?'bg-red-100 text-red-600':a.status==='Completed'?'bg-green-100 text-green-600':'bg-blue-100 text-blue-600'}`}>{a.status}</span></td><td className="px-6 py-4 text-gray-400 text-sm">{a.time}</td></tr>
                                                    )) : (<tr><td colSpan="4" className="px-6 py-12 text-center text-gray-400 italic">No recent activities found.</td></tr>)}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                {/* REQUESTS TAB */}
                                {activeTab === 'requests' && (
                                    <div className="space-y-6 animate-in fade-in duration-300">
                                        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                                            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                                                <h2 className="text-lg font-black text-gray-800">All Emergency Requests</h2>
                                                <span className="text-sm font-bold text-gray-400">{requests.length} total · {requests.filter(r=>r.status==='Open').length} open</span>
                                            </div>
                                            <table className="w-full text-left">
                                                <thead className="bg-gray-50 border-b border-gray-100 text-sm font-bold text-gray-600">
                                                    <tr><th className="px-6 py-4">Blood Group</th><th className="px-6 py-4">Hospital</th><th className="px-6 py-4">Location</th><th className="px-6 py-4">Volunteers</th><th className="px-6 py-4">Status</th><th className="px-6 py-4">Date</th><th className="px-6 py-4 text-center">Actions</th></tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100">
                                                    {requests.length > 0 ? requests.map(r => (
                                                        <tr key={r._id} className="hover:bg-gray-50">
                                                            <td className="px-6 py-4"><span className="px-3 py-1 bg-red-100 text-red-600 font-black rounded-full text-sm">{r.bloodGroup}</span></td>
                                                            <td className="px-6 py-4 font-bold text-gray-800">{r.hospitalName || '—'}</td>
                                                            <td className="px-6 py-4 text-gray-600 text-sm">{r.location || '—'}</td>
                                                            <td className="px-6 py-4"><span className="px-2 py-1 bg-blue-50 text-blue-600 font-black rounded-lg text-xs">{r.volunteers?.length || 0} responses</span></td>
                                                            <td className="px-6 py-4"><span className={`px-3 py-1 rounded-full text-xs font-black ${r.status==='Completed'?'bg-green-100 text-green-600':'bg-orange-100 text-orange-600'}`}>{r.status || 'Open'}</span></td>
                                                            <td className="px-6 py-4 text-gray-400 text-sm">{new Date(r.createdAt).toLocaleDateString()}</td>
                                                            <td className="px-6 py-4 text-center">
                                                                {r.status !== 'Completed' && (
                                                                    <button onClick={() => handleCloseRequest(r._id)} className="px-3 py-1.5 bg-green-600 text-white text-xs font-black rounded-lg hover:bg-green-700 transition-all flex items-center space-x-1 mx-auto"><CheckCircle className="w-3 h-3" /><span>Complete</span></button>
                                                                )}
                                                                {r.status === 'Completed' && <span className="text-green-500 text-xs font-black flex items-center justify-center space-x-1"><CheckCircle className="w-3.5 h-3.5" /><span>Done</span></span>}
                                                            </td>
                                                        </tr>
                                                    )) : (<tr><td colSpan="7" className="px-6 py-12 text-center text-gray-400 italic">No requests found.</td></tr>)}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                {/* CAMPS TAB */}
                                {activeTab === 'camps' && (
                                    <div className="space-y-6 animate-in fade-in duration-300">
                                        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                                            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                                                <h2 className="text-lg font-black text-gray-800">All Donation Camps</h2>
                                                <span className="text-sm font-bold text-gray-400">{camps.length} camps</span>
                                            </div>
                                            <table className="w-full text-left">
                                                <thead className="bg-gray-50 border-b border-gray-100 text-sm font-bold text-gray-600">
                                                    <tr><th className="px-6 py-4">Camp Name</th><th className="px-6 py-4">Date</th><th className="px-6 py-4">Time</th><th className="px-6 py-4">Venue</th><th className="px-6 py-4">Organizer</th><th className="px-6 py-4">Registrations</th><th className="px-6 py-4 text-center">Actions</th></tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100">
                                                    {camps.length > 0 ? camps.map(c => (
                                                        <tr key={c._id} className="hover:bg-gray-50">
                                                            <td className="px-6 py-4 font-bold text-gray-800">{c.name}</td>
                                                            <td className="px-6 py-4 text-gray-600">{c.date}</td>
                                                            <td className="px-6 py-4 text-gray-600">{c.time}</td>
                                                            <td className="px-6 py-4 text-gray-600 text-sm">{c.venue}</td>
                                                            <td className="px-6 py-4 text-gray-600">{c.organizer || '—'}</td>
                                                            <td className="px-6 py-4"><span className="px-2 py-1 bg-purple-50 text-purple-600 font-black rounded-lg text-xs">{c.registeredDonors?.length || 0} donors</span></td>
                                                            <td className="px-6 py-4 text-center">
                                                                <button onClick={() => setCampDeleteConfirm(c)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all" title="Delete camp"><Trash2 className="w-4 h-4" /></button>
                                                            </td>
                                                        </tr>
                                                    )) : (<tr><td colSpan="7" className="px-6 py-12 text-center text-gray-400 italic">No camps found.</td></tr>)}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                {/* BLOOD BANKS TAB */}
                                {activeTab === 'bloodbanks' && (
                                    <div className="space-y-6 animate-in fade-in duration-300">
                                        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                                            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                                                <h2 className="text-lg font-black text-gray-800">All Blood Banks</h2>
                                                <span className="text-sm font-bold text-gray-400">{bloodBanks.length} banks · {bloodBanks.filter(b=>b.status==='Open').length} open</span>
                                            </div>
                                            <table className="w-full text-left">
                                                <thead className="bg-gray-50 border-b border-gray-100 text-sm font-bold text-gray-600">
                                                    <tr><th className="px-6 py-4">Name</th><th className="px-6 py-4">Location</th><th className="px-6 py-4">Contact</th><th className="px-6 py-4">Status</th><th className="px-6 py-4">Blood Stock</th></tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100">
                                                    {bloodBanks.length > 0 ? bloodBanks.map(b => (
                                                        <tr key={b._id} className="hover:bg-gray-50">
                                                            <td className="px-6 py-4 font-bold text-gray-800">{b.name}</td>
                                                            <td className="px-6 py-4 text-gray-600">{b.location}</td>
                                                            <td className="px-6 py-4 text-gray-600">{b.contact}</td>
                                                            <td className="px-6 py-4"><span className={`px-3 py-1 rounded-full text-xs font-black ${b.status==='Open'?'bg-green-100 text-green-600':'bg-red-100 text-red-600'}`}>{b.status}</span></td>
                                                            <td className="px-6 py-4">
                                                                <div className="flex space-x-2 text-xs font-bold">
                                                                    <span className="px-2 py-1 bg-red-50 text-red-500 rounded">A: {b.unitsA}</span>
                                                                    <span className="px-2 py-1 bg-blue-50 text-blue-500 rounded">B: {b.unitsB}</span>
                                                                    <span className="px-2 py-1 bg-purple-50 text-purple-500 rounded">O: {b.unitsO}</span>
                                                                    <span className="px-2 py-1 bg-emerald-50 text-emerald-500 rounded">AB: {b.unitsAB}</span>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )) : (<tr><td colSpan="5" className="px-6 py-12 text-center text-gray-400 italic">No blood banks found.</td></tr>)}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                {/* USERS TAB */}
                                {activeTab === 'users' && (
                                    <div className="space-y-6 animate-in fade-in duration-300">
                                        {/* Search */}
                                        <div className="relative">
                                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                            <input
                                                type="text"
                                                placeholder="Search by username, email or role..."
                                                value={searchTerm}
                                                onChange={e => setSearchTerm(e.target.value)}
                                                className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-200 font-medium text-gray-700"
                                            />
                                            {searchTerm && (
                                                <button onClick={() => setSearchTerm('')} className="absolute right-4 top-1/2 -translate-y-1/2">
                                                    <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                                                </button>
                                            )}
                                        </div>

                                        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                                            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                                                <h2 className="text-lg font-black text-gray-800">All Users</h2>
                                                <span className="text-sm font-bold text-gray-400">{filteredUsers.length} results</span>
                                            </div>
                                            <table className="w-full text-left">
                                                <thead className="bg-gray-50 border-b border-gray-100 text-sm font-bold text-gray-600">
                                                    <tr>
                                                        <th className="px-6 py-4">Username</th>
                                                        <th className="px-6 py-4">Email</th>
                                                        <th className="px-6 py-4">Phone</th>
                                                        <th className="px-6 py-4">Role</th>
                                                        <th className="px-6 py-4 text-center">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100">
                                                    {filteredUsers.length > 0 ? filteredUsers.map(u => (
                                                        <tr key={u._id} className="hover:bg-gray-50 transition-colors">
                                                            <td className="px-6 py-4">
                                                                <div className="flex items-center space-x-3">
                                                                    <img
                                                                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${u.username}`}
                                                                        alt=""
                                                                        className="w-8 h-8 rounded-lg bg-gray-100"
                                                                    />
                                                                    <span className="font-bold text-gray-800">{u.username}</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 text-gray-600">{u.email}</td>
                                                            <td className="px-6 py-4 text-gray-600">{u.phone}</td>
                                                            <td className="px-6 py-4">
                                                                <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wide ${roleBadge(u.role)}`}>
                                                                    {u.role}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4 text-center">
                                                                {u.role !== 'ADMIN' && (
                                                                    <button
                                                                        onClick={() => setDeleteConfirm(u)}
                                                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                                                        title="Delete user"
                                                                    >
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </button>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    )) : (
                                                        <tr>
                                                            <td colSpan="5" className="px-6 py-12 text-center text-gray-400 italic">No users found.</td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                {/* DONORS TAB */}
                                {activeTab === 'donors' && (
                                    <div className="space-y-6 animate-in fade-in duration-300">
                                        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                                            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                                                <h2 className="text-lg font-black text-gray-800">All Donors</h2>
                                                <span className="text-sm font-bold text-gray-400">{donors.length} donors</span>
                                            </div>
                                            <table className="w-full text-left">
                                                <thead className="bg-gray-50 border-b border-gray-100 text-sm font-bold text-gray-600">
                                                    <tr>
                                                        <th className="px-6 py-4">Name</th>
                                                        <th className="px-6 py-4">Username</th>
                                                        <th className="px-6 py-4">Blood Group</th>
                                                        <th className="px-6 py-4">Age</th>
                                                        <th className="px-6 py-4">Contact</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100">
                                                    {donors.length > 0 ? donors.map(d => (
                                                        <tr key={d._id} className="hover:bg-gray-50 transition-colors">
                                                            <td className="px-6 py-4 font-bold text-gray-800">{d.name}</td>
                                                            <td className="px-6 py-4 text-gray-600">{d.username}</td>
                                                            <td className="px-6 py-4">
                                                                <span className="px-3 py-1 bg-red-100 text-red-600 font-black rounded-full text-sm">
                                                                    {d.bloodGroup}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4 text-gray-600">{d.age}</td>
                                                            <td className="px-6 py-4 text-gray-600">{d.contactInfo}</td>
                                                        </tr>
                                                    )) : (
                                                        <tr>
                                                            <td colSpan="5" className="px-6 py-12 text-center text-gray-400 italic">No donors found.</td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                {/* HOSPITALS TAB */}
                                {activeTab === 'hospitals' && (
                                    <div className="space-y-6 animate-in fade-in duration-300">
                                        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                                            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                                                <h2 className="text-lg font-black text-gray-800">All Hospitals</h2>
                                                <span className="text-sm font-bold text-gray-400">{hospitals.length} hospitals</span>
                                            </div>
                                            <table className="w-full text-left">
                                                <thead className="bg-gray-50 border-b border-gray-100 text-sm font-bold text-gray-600">
                                                    <tr>
                                                        <th className="px-6 py-4">Hospital Name</th>
                                                        <th className="px-6 py-4">Username</th>
                                                        <th className="px-6 py-4">Location</th>
                                                        <th className="px-6 py-4">Status</th>
                                                        <th className="px-6 py-4">Blood Stock</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100">
                                                    {hospitals.length > 0 ? hospitals.map(h => (
                                                        <tr key={h._id} className="hover:bg-gray-50 transition-colors">
                                                            <td className="px-6 py-4 font-bold text-gray-800">{h.name}</td>
                                                            <td className="px-6 py-4 text-gray-600">{h.username}</td>
                                                            <td className="px-6 py-4 text-gray-600">{h.location}</td>
                                                            <td className="px-6 py-4">
                                                                <span className={`px-3 py-1 rounded-full text-xs font-black ${
                                                                    h.status === 'Critical' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                                                                }`}>
                                                                    {h.status}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <div className="flex space-x-2 text-xs font-bold">
                                                                    <span className="px-2 py-1 bg-red-50 text-red-500 rounded">A: {h.unitsA}</span>
                                                                    <span className="px-2 py-1 bg-blue-50 text-blue-500 rounded">B: {h.unitsB}</span>
                                                                    <span className="px-2 py-1 bg-purple-50 text-purple-500 rounded">O: {h.unitsO}</span>
                                                                    <span className="px-2 py-1 bg-emerald-50 text-emerald-500 rounded">AB: {h.unitsAB}</span>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )) : (
                                                        <tr>
                                                            <td colSpan="5" className="px-6 py-12 text-center text-gray-400 italic">No hospitals found.</td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </main>

            {/* Delete Confirm Modal */}
            {deleteConfirm && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                    <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full mx-4 border border-gray-100">
                        <div className="text-center space-y-4">
                            <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto">
                                <Trash2 className="w-8 h-8 text-red-500" />
                            </div>
                            <h3 className="text-xl font-black text-gray-800">Delete User?</h3>
                            <p className="text-gray-500 font-medium">
                                Are you sure you want to delete <span className="font-black text-gray-800">@{deleteConfirm.username}</span>? This action cannot be undone.
                            </p>
                            <div className="flex space-x-3 pt-2">
                                <button
                                    onClick={() => setDeleteConfirm(null)}
                                    className="flex-1 py-3 bg-gray-100 text-gray-700 font-black rounded-2xl hover:bg-gray-200 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleDeleteUser(deleteConfirm._id)}
                                    className="flex-1 py-3 bg-red-600 text-white font-black rounded-2xl hover:bg-red-700 transition-all"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Camp Delete Confirm Modal */}
            {campDeleteConfirm && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                    <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full mx-4 border border-gray-100">
                        <div className="text-center space-y-4">
                            <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto">
                                <Trash2 className="w-8 h-8 text-red-500" />
                            </div>
                            <h3 className="text-xl font-black text-gray-800">Delete Camp?</h3>
                            <p className="text-gray-500 font-medium">
                                Are you sure you want to delete <span className="font-black text-gray-800">{campDeleteConfirm.name}</span>? This action cannot be undone.
                            </p>
                            <div className="flex space-x-3 pt-2">
                                <button onClick={() => setCampDeleteConfirm(null)} className="flex-1 py-3 bg-gray-100 text-gray-700 font-black rounded-2xl hover:bg-gray-200 transition-all">Cancel</button>
                                <button onClick={() => handleDeleteCamp(campDeleteConfirm._id)} className="flex-1 py-3 bg-red-600 text-white font-black rounded-2xl hover:bg-red-700 transition-all">Delete</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast */}
            {toast && (
                <div className={`fixed bottom-8 right-8 z-50 px-6 py-4 rounded-2xl shadow-xl text-white font-black text-sm animate-in slide-in-from-right-4 duration-300 ${
                    toast.type === 'error' ? 'bg-red-600' : 'bg-emerald-600'
                }`}>
                    {toast.msg}
                </div>
            )}
        </div>
    );
};

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

export default AdminDashboard;
