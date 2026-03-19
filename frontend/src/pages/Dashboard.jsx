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
    Hospital,
    Award,
    AlertTriangle
} from 'lucide-react';
import { Link } from 'react-router-dom';

const Dashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [camps, setCamps] = useState([]);
    const [campsLoading, setCampsLoading] = useState(true);
    const [registering, setRegistering] = useState(null);
    const [toast, setToast] = useState(null);
    const [profile, setProfile] = useState(null);
    const [showCert, setShowCert] = useState(null);
    const [showLogModal, setShowLogModal] = useState(false);
    const [myRequests, setMyRequests] = useState([]);
    const [requestsLoading, setRequestsLoading] = useState(true);
    const [matchingRequests, setMatchingRequests] = useState([]);

    const user = JSON.parse(sessionStorage.getItem('user'));

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
            fetchProfile();
        } else if (user?.role === 'HOSPITAL') {
            fetchHospitalRequests();
        }
    }, [user?.username]);

    const fetchHospitalRequests = async () => {
        try {
            setRequestsLoading(true);
            // First get the hospital profile to get its real name
            const profileRes = await axios.get(`http://localhost:5000/api/auth/my-stock/${user.username}`);
            const hName = profileRes.data.name;
            setProfile(profileRes.data);
            
            const res = await axios.get(`http://localhost:5000/api/my-requests/${hName}`);
            setMyRequests(res.data);
        } catch (err) {
            console.error('Error fetching hospital requests:', err);
        } finally {
            setRequestsLoading(false);
        }
    };

    const updateVolunteerStatus = async (requestId, username, newStatus) => {
        try {
            await axios.patch(`http://localhost:5000/api/request/${requestId}/volunteer/${username}`, {
                status: newStatus
            });
            showToast(`Volunteer ${newStatus.toLowerCase()}!`);
            fetchHospitalRequests(); // Refresh data
        } catch (err) {
            showToast('Failed to update status', 'error');
        }
    };

    const fetchProfile = async () => {
        try {
            const res = await axios.get(`http://localhost:5000/api/auth/my-profile/${user.username}`);
            setProfile(res.data);
            
            // Also fetch matching requests for the dashboard
            const encodedBloodGroup = encodeURIComponent(res.data.bloodGroup);
            const matchingRes = await axios.get(`http://localhost:5000/api/matching-requests/${encodedBloodGroup}`);
            setMatchingRequests(matchingRes.data);
        } catch (err) {
            console.error('Error fetching profile/requests:', err);
        }
    };

    const handleVolunteer = async (requestId) => {
        try {
            await axios.post(`http://localhost:5000/api/request/${requestId}/volunteer`, {
                username: user.username
            });
            showToast('Volunteered successfully!');
            await fetchProfile(); // Refresh to update status
        } catch (err) {
            showToast(err.response?.data?.error || 'Failed to volunteer', 'error');
        }
    };

    const isVolunteered = (request) => request.volunteers?.some(v => v.username === user.username);
    const getVolunteerStatus = (request) => request.volunteers?.find(v => v.username === user.username)?.status;

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

    const handleLogDonation = async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        try {
            await axios.post('http://localhost:5000/api/donations/log', {
                username: user.username,
                hospitalName: fd.get('hospitalName'),
                date: fd.get('date')
            });
            showToast('Donation logged successfully!');
            setShowLogModal(false);
            fetchProfile(); // Refresh profile to get updated buffer/cert
        } catch (err) {
            showToast(err.response?.data?.error || 'Something went wrong.', 'error');
        }
    };

    const quickActions = [
        { name: 'Donate Blood', icon: PlusCircle, path: '/donate', color: 'bg-red-600', roles: ['DONOR'] },
        { name: 'View Camps', icon: Calendar, path: '/camps', color: 'bg-purple-600', roles: ['DONOR'] },
        { name: 'Emergency Feed', icon: Activity, path: '/emergency-requests', color: 'bg-orange-600', roles: ['DONOR'] },
        { name: 'Broadcast Need', icon: PlusCircle, path: '/request', color: 'bg-red-600', roles: ['HOSPITAL'] },
        { name: 'Manage Inventory', icon: Droplet, path: '/manage-stock', color: 'bg-blue-600', roles: ['HOSPITAL'] },
        { name: 'Schedule Camp', icon: Calendar, path: '/camps', color: 'bg-purple-600', roles: ['HOSPITAL'] },
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

        let isBufferActive = false;
        let bufferEndDate = null;
        let daysLeft = 0;
        let priorityHospitals = [];

        if (profile && profile.donations && profile.donations.length > 0) {
            const sorted = [...profile.donations].sort((a,b) => new Date(b.date) - new Date(a.date));
            const lastDate = new Date(sorted[0].date);
            bufferEndDate = new Date(lastDate.getTime() + 90 * 24 * 60 * 60 * 1000);
            if (new Date() < bufferEndDate) {
                isBufferActive = true;
                daysLeft = Math.ceil((bufferEndDate - new Date()) / (1000 * 60 * 60 * 24));
            }

            const hCounts = {};
            profile.donations.forEach(d => {
                if (d.hospitalName) {
                    hCounts[d.hospitalName] = (hCounts[d.hospitalName] || 0) + 1;
                }
            });
            priorityHospitals = Object.keys(hCounts).filter(h => hCounts[h] >= 2);
        }

        return (
            <div className="space-y-8 animate-in fade-in duration-500">
                {/* Buffer Period Warning */}
                {isBufferActive && (
                    <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-r-xl shadow-sm flex items-center justify-between">
                        <div>
                            <h3 className="text-orange-800 font-bold text-lg">Rest Period Active</h3>
                            <p className="text-orange-700 text-sm mt-1">
                                Thank you for your recent donation! To protect your health, you can donate again in <strong>{daysLeft} days</strong> (on {bufferEndDate.toLocaleDateString()}).
                            </p>
                        </div>
                        <Clock className="w-8 h-8 text-orange-400 opacity-80" />
                    </div>
                )}

                {/* Emergency Matching Requests */}
                {matchingRequests.length > 0 && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-gray-800 flex items-center space-x-2">
                                <AlertTriangle className="w-5 h-5 text-red-600 animate-pulse" />
                                <span>Emergency Needs for {profile?.bloodGroup}</span>
                            </h2>
                            <Link to="/emergency-requests" className="text-sm font-black text-red-600 hover:underline">
                                View Feed
                            </Link>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {matchingRequests.slice(0, 3).map(request => (
                                <div key={request._id} className="bg-white border-2 border-red-50 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-16 h-16 bg-red-50 rounded-bl-full -mr-4 -mt-4 opacity-50"></div>
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="bg-red-600 text-white p-2 rounded-xl">
                                            <Droplet className="w-5 h-5 fill-current" />
                                        </div>
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{new Date(request.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <h3 className="font-black text-gray-800 text-lg mb-1">{request.hospitalName || 'Quick Broadcast'}</h3>
                                    <p className="text-gray-500 text-xs font-bold mb-4 flex items-center"><MapPin className="w-3 h-3 mr-1" /> {request.location || 'Thane'}</p>
                                    
                                    <button
                                        disabled={isVolunteered(request) || isBufferActive}
                                        onClick={() => handleVolunteer(request._id)}
                                        title={isBufferActive ? `Rest period active (${daysLeft} days remaining)` : ''}
                                        className={`w-full py-3 rounded-xl font-black text-xs flex items-center justify-center space-x-2 transition-all active:scale-95 ${
                                            isVolunteered(request)
                                                ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                                : isBufferActive
                                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                                                : 'bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-100'
                                        }`}
                                    >
                                        <HeartHandshake className="w-4 h-4" />
                                        <span>
                                            {isVolunteered(request) 
                                                ? `Volunteered (${getVolunteerStatus(request)})` 
                                                : isBufferActive 
                                                ? 'Rest Period Active' 
                                                : 'Volunteer Now'}
                                        </span>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Donor Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Link to="/stock"><StatCard icon={Users} label="Total Donors" value={stats?.totalDonors || 0} trend="Active" color="text-blue-600" bg="bg-blue-50" /></Link>
                    <Link to="/camps"><StatCard icon={Calendar} label="Upcoming Camps" value={stats?.upcomingCamps || 0} trend="Scheduled" color="text-purple-600" bg="bg-purple-50" /></Link>
                    <Link to="/emergency-requests"><StatCard icon={Activity} label="Emergency Requests" value={stats?.emergencyRequests || 0} trend="Urgent" color="text-red-600" bg="bg-red-50" /></Link>
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

                {/* My Donations & Certificates */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-gray-800 flex items-center space-x-2">
                            <Award className="w-5 h-5 text-yellow-500" />
                            <span>My Donations & Certificates</span>
                        </h2>
                        <button 
                            onClick={() => setShowLogModal(true)}
                            className="bg-red-50 text-red-600 hover:bg-red-100 font-bold px-3 py-1.5 rounded-lg text-sm transition-colors flex items-center space-x-1"
                        >
                            <PlusCircle className="w-4 h-4" />
                            <span>Log Past Donation</span>
                        </button>
                    </div>
                    {profile?.donations?.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                            {profile.donations.map((donation, idx) => (
                                <div key={idx} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="bg-red-50 text-red-600 p-2 rounded-lg">
                                            <Droplet className="w-5 h-5" />
                                        </div>
                                        <span className="text-xs font-bold text-gray-400">
                                            {new Date(donation.date).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <h3 className="font-bold text-gray-800 mb-1">{donation.hospitalName}</h3>
                                    <p className="text-xs text-green-600 font-bold bg-green-50 w-fit px-2 py-1 rounded mb-4">Completed</p>
                                    <button 
                                        onClick={() => setShowCert(donation)}
                                        className="w-full py-2 bg-yellow-50 text-yellow-700 hover:bg-yellow-100 font-bold text-xs rounded-xl transition-colors flex items-center justify-center space-x-2"
                                    >
                                        <Award className="w-4 h-4" />
                                        <span>View Certificate</span>
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white border border-gray-100 rounded-2xl p-10 text-center">
                            <p className="font-bold text-gray-400 text-sm">No completed donations yet.</p>
                        </div>
                    )}
                </div>

                {/* Priority Cards */}
                {priorityHospitals.length > 0 && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-gray-800 flex items-center space-x-2">
                                <HeartHandshake className="w-5 h-5 text-purple-500" />
                                <span>My Priority Cards</span>
                            </h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {priorityHospitals.map((hospital, idx) => (
                                <div key={idx} className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden group">
                                    <div className="absolute -right-6 -top-6 rounded-full w-32 h-32 bg-white opacity-10 blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                                    <div className="flex justify-between items-center mb-6 relative z-10">
                                        <div>
                                            <p className="text-purple-200 text-xs font-black uppercase tracking-widest mb-1">Priority Donor</p>
                                            <h3 className="text-2xl font-black">{hospital}</h3>
                                        </div>
                                        <Award className="w-10 h-10 text-yellow-400" />
                                    </div>
                                    <div className="flex justify-between items-end relative z-10">
                                        <div>
                                            <p className="text-purple-200 text-xs mb-1">Card Holder</p>
                                            <p className="font-bold">{profile?.name || user.username}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-purple-200 text-xs mb-1">Status</p>
                                            <p className="font-bold text-yellow-400">Elite Member</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Toast */}
                {toast && (
                    <div className={`fixed bottom-8 right-8 z-50 px-6 py-4 rounded-2xl shadow-xl text-white font-black text-sm animate-in slide-in-from-right-4 duration-300 ${toast.type === 'error' ? 'bg-red-600' : 'bg-emerald-600'}`}>
                        {toast.msg}
                    </div>
                )}

                {/* Certificate Modal */}
                {showCert && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="bg-white rounded-3xl p-8 max-w-2xl w-full relative shadow-2xl border-8 border-double border-yellow-100 overflow-hidden">
                            <button 
                                onClick={() => setShowCert(null)}
                                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10"
                            >
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                            
                            {/* Decorative background elements */}
                            <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
                                <div className="absolute top-10 left-10 w-40 h-40 bg-yellow-400 rounded-full blur-3xl"></div>
                                <div className="absolute bottom-10 right-10 w-40 h-40 bg-red-400 rounded-full blur-3xl"></div>
                            </div>

                            <div className="text-center relative z-10 py-10">
                                <Award className="w-20 h-20 text-yellow-500 mx-auto mb-6 drop-shadow-md" />
                                <h4 className="text-4xl font-black text-gray-800 tracking-tight mb-2 uppercase" style={{ fontFamily: 'serif' }}>Certificate of Appreciation</h4>
                                <p className="text-gray-500 text-lg mb-8 italic">This certificate is proudly presented to</p>
                                <h3 className="text-3xl font-bold text-red-600 mb-8 border-b-2 border-red-100 pb-4 mx-12">
                                    {profile?.name || user.username}
                                </h3>
                                <p className="text-gray-600 text-lg leading-relaxed px-8">
                                    In recognition of your generous life-saving blood donation on <strong>{new Date(showCert.date).toLocaleDateString()}</strong> at <strong>{showCert.hospitalName}</strong>.<br/><br/>
                                    Your selflessness brings hope and healing to those in need.
                                </p>
                                
                                <div className="flex justify-between items-end mt-16 px-12">
                                    <div className="text-center">
                                        <div className="border-b border-gray-400 w-32 mx-auto mb-2"></div>
                                        <p className="text-sm font-bold text-gray-500">Authorized Signature</p>
                                    </div>
                                    <div className="text-center">
                                        <div className="w-24 h-24 border-4 border-yellow-500 rounded-full flex items-center justify-center transform rotate-12 opacity-80 mx-auto mb-2">
                                            <span className="text-yellow-600 font-bold uppercase text-[10px] tracking-widest text-center">Official<br/>Seal</span>
                                        </div>
                                    </div>
                                    <div className="text-center">
                                        <div className="border-b border-gray-400 w-32 mx-auto mb-2 font-bold text-gray-800">{new Date(showCert.date).toLocaleDateString()}</div>
                                        <p className="text-sm font-bold text-gray-500">Date</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Log Donation Modal */}
                {showLogModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="bg-white rounded-3xl p-8 max-w-md w-full relative shadow-2xl">
                            <button onClick={() => setShowLogModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                            <h3 className="text-2xl font-black text-gray-800 mb-6 flex items-center">
                                <PlusCircle className="w-6 h-6 text-red-600 mr-2" />
                                Log Past Donation
                            </h3>
                            <form onSubmit={handleLogDonation} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Hospital or Camp Name</label>
                                    <input type="text" name="hospitalName" required 
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl font-semibold focus:ring-2 disabled:opacity-50"
                                        placeholder="e.g. City Hospital" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Date</label>
                                    <input type="date" name="date" required 
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl font-semibold focus:ring-2 disabled:opacity-50" />
                                </div>
                                <button type="submit" className="w-full mt-4 bg-red-600 text-white font-black py-4 rounded-xl shadow-lg hover:bg-red-700 transition-colors">
                                    Save Record
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // ── HOSPITAL DASHBOARD ────────────────────────────────────────────────────
    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Link to="/stock"><StatCard icon={Users} label="Total Donors" value={stats?.totalDonors || 0} trend="Active" color="text-blue-600" bg="bg-blue-50" /></Link>
                <Link to="/emergency-requests"><StatCard icon={Droplet} label="Requests" value={stats?.emergencyRequests || 0} trend="Urgent" color="text-red-600" bg="bg-red-50" /></Link>
                <Link to="/camps"><StatCard icon={Calendar} label="Upc. Camps" value={stats?.upcomingCamps || 0} trend="Upcoming" color="text-purple-600" bg="bg-purple-50" /></Link>
                <Link to="/stock"><StatCard icon={Activity} label="Hospitals" value={stats?.totalHospitals || 0} trend="Registered" color="text-emerald-600" bg="bg-emerald-50" /></Link>
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
                    <h2 className="text-xl font-bold text-gray-800 flex items-center space-x-2">
                        <Users className="w-5 h-5 text-red-500" />
                        <span>Donor Volunteers (Emergency Requests)</span>
                    </h2>
                    
                    {requestsLoading ? (
                        <div className="flex justify-center p-12 bg-white rounded-xl border border-gray-100">
                            <Loader2 className="w-8 h-8 text-red-600 animate-spin" />
                        </div>
                    ) : myRequests.filter(r => r.volunteers?.length > 0).length === 0 ? (
                        <div className="bg-white border border-gray-100 rounded-xl p-12 text-center shadow-sm">
                            <p className="text-gray-400 font-bold">No active volunteers for your requests.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {myRequests.filter(r => r.volunteers?.length > 0).map(request => (
                                <div key={request._id} className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                                    <div className="bg-gray-50 px-6 py-3 border-b border-gray-100 flex justify-between items-center">
                                        <div className="flex items-center space-x-2">
                                            <span className="bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full">{request.bloodGroup}</span>
                                            <span className="text-sm font-bold text-gray-700">Request for {request.bloodGroup}</span>
                                        </div>
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                            {new Date(request.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <div className="divide-y divide-gray-50">
                                        {request.volunteers.map(volunteer => (
                                            <div key={volunteer.username} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                                <div className="flex items-center space-x-3">
                                                    <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                                                        <UserPlus className="w-5 h-5 text-red-600" />
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-gray-800">@{volunteer.username}</p>
                                                        <span className={`text-[10px] font-black uppercase tracking-widest ${
                                                            volunteer.status === 'Pending' ? 'text-orange-500' :
                                                            volunteer.status === 'Accepted' ? 'text-blue-500' :
                                                            volunteer.status === 'Completed' ? 'text-green-500' :
                                                            'text-gray-400'
                                                        }`}>
                                                            {volunteer.status}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    {volunteer.status === 'Pending' && (
                                                        <>
                                                            <button onClick={() => updateVolunteerStatus(request._id, volunteer.username, 'Accepted')} className="px-3 py-1.5 bg-blue-600 text-white text-xs font-black rounded-lg hover:bg-blue-700 shadow-md shadow-blue-100 transition-all">Accept</button>
                                                            <button onClick={() => updateVolunteerStatus(request._id, volunteer.username, 'Rejected')} className="px-3 py-1.5 bg-gray-100 text-gray-500 text-xs font-black rounded-lg hover:bg-gray-200 transition-all">Reject</button>
                                                        </>
                                                    )}
                                                    {volunteer.status === 'Accepted' && (
                                                        <button onClick={() => updateVolunteerStatus(request._id, volunteer.username, 'Completed')} className="px-3 py-1.5 bg-green-600 text-white text-xs font-black rounded-lg hover:bg-green-700 shadow-md shadow-green-100 transition-all">Mark as Donated</button>
                                                    )}
                                                    {volunteer.status === 'Completed' && (
                                                        <span className="flex items-center text-green-600 text-xs font-black bg-green-50 px-3 py-1.5 rounded-lg border border-green-100">
                                                            <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                                                            Recorded
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <h2 className="text-xl font-bold text-gray-800 pt-6">Recent Activity</h2>
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
