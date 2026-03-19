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
    X
} from 'lucide-react';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const user = JSON.parse(sessionStorage.getItem('user'));

    const [activeTab, setActiveTab] = useState('overview');
    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState([]);
    const [donors, setDonors] = useState([]);
    const [hospitals, setHospitals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [deleteConfirm, setDeleteConfirm] = useState(null);
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
            const [statsRes, usersRes, donorsRes, hospitalsRes] = await Promise.all([
                axios.get('http://localhost:5000/api/stats'),
                axios.get('http://localhost:5000/api/auth/admin/users'),
                axios.get('http://localhost:5000/api/auth/admin/donors'),
                axios.get('http://localhost:5000/api/auth/admin/hospitals'),
            ]);
            setStats(statsRes.data);
            setUsers(usersRes.data);
            setDonors(donorsRes.data);
            setHospitals(hospitalsRes.data);
        } catch (err) {
            console.error('Admin fetch error:', err);
            showToast('Failed to load data', 'error');
        } finally {
            setLoading(false);
        }
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
        { id: 'users', label: 'Users', icon: Users },
        { id: 'donors', label: 'Donors', icon: HeartHandshake },
        { id: 'hospitals', label: 'Hospitals', icon: Hospital },
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
                                        {/* Stat Cards */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                            <button onClick={() => setActiveTab('users')} className="text-left w-full"><StatCard icon={Users} label="Total Users" value={users.length} trend="Registered" color="text-purple-600" bg="bg-purple-50" /></button>
                                            <button onClick={() => setActiveTab('donors')} className="text-left w-full"><StatCard icon={HeartHandshake} label="Total Donors" value={stats?.totalDonors || 0} trend="Active" color="text-red-600" bg="bg-red-50" /></button>
                                            <button onClick={() => setActiveTab('hospitals')} className="text-left w-full"><StatCard icon={Hospital} label="Hospitals" value={stats?.totalHospitals || 0} trend="Registered" color="text-blue-600" bg="bg-blue-50" /></button>
                                            <StatCard icon={AlertTriangle} label="Emergency Requests" value={stats?.emergencyRequests || 0} trend="Urgent" color="text-orange-600" bg="bg-orange-50" />
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <StatCard icon={Calendar} label="Upcoming Camps" value={stats?.upcomingCamps || 0} trend="Scheduled" color="text-emerald-600" bg="bg-emerald-50" />
                                        </div>

                                        {/* Role Breakdown */}
                                        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                                            <h2 className="text-lg font-black text-gray-800 mb-4">User Role Breakdown</h2>
                                            <div className="grid grid-cols-3 gap-4">
                                                {['DONOR', 'HOSPITAL', 'ADMIN'].map(role => {
                                                    const count = users.filter(u => u.role === role).length;
                                                    const colors = {
                                                        DONOR: { bar: 'bg-red-500', text: 'text-red-600', bg: 'bg-red-50' },
                                                        HOSPITAL: { bar: 'bg-blue-500', text: 'text-blue-600', bg: 'bg-blue-50' },
                                                        ADMIN: { bar: 'bg-purple-500', text: 'text-purple-600', bg: 'bg-purple-50' },
                                                    };
                                                    const pct = users.length ? Math.round((count / users.length) * 100) : 0;
                                                    return (
                                                        <div key={role} className={`${colors[role].bg} rounded-xl p-4`}>
                                                            <p className={`text-xs font-black uppercase tracking-widest ${colors[role].text} mb-2`}>{role}</p>
                                                            <p className={`text-3xl font-extrabold ${colors[role].text} mb-2`}>{count}</p>
                                                            <div className="w-full bg-white rounded-full h-2">
                                                                <div className={`${colors[role].bar} h-2 rounded-full transition-all`} style={{ width: `${pct}%` }} />
                                                            </div>
                                                            <p className="text-xs text-gray-500 font-bold mt-1">{pct}% of users</p>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* Recent Activity */}
                                        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                                            <div className="px-6 py-4 border-b border-gray-100">
                                                <h2 className="text-lg font-black text-gray-800">Recent Activity</h2>
                                            </div>
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
