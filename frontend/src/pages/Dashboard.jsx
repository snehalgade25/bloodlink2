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

    const [externalRequestsCount, setExternalRequestsCount] = useState(0);

    const fetchHospitalRequests = async () => {
        try {
            setRequestsLoading(true);
            const profileRes = await axios.get(`http://localhost:5000/api/auth/my-stock/${user.username}`);
            const hName = profileRes.data.name;
            setProfile(profileRes.data);
            
            // 1. Fetch MY requests (to show volunteers for my broadcasts)
            const myRes = await axios.get(`http://localhost:5000/api/my-requests/${hName}`);
            setMyRequests(myRes.data);

            // 2. Fetch ALL broadcasts (to count requirements from OTHER hospitals)
            const allRes = await axios.get(`http://localhost:5000/api/requests/all`);
            const others = allRes.data.filter(r => 
                r.hospitalName !== hName && 
                r.status?.toLowerCase() !== 'completed' &&
                !(r.volunteers?.some(v => v.username === user.username))
            );
            setExternalRequestsCount(others.length);
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
            const matchingRes = await axios.get('http://localhost:5000/api/requests/all');
            const allRequests = matchingRes.data || [];
            
            // Filter by matching blood group AND not already volunteered
            const matching = allRequests.filter(r => 
                r.bloodGroup === res.data.bloodGroup && 
                !r.volunteers?.some(v => v.username === user.username)
            );
            setMatchingRequests(matching);
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

    const isVolunteered = (request) => request.volunteers?.some(v => v.username.toLowerCase() === user.username.toLowerCase());
    const getVolunteerStatus = (request) => request.volunteers?.find(v => v.username.toLowerCase() === user.username.toLowerCase())?.status;

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
        let priorityCards = [];

        // Generate unique card number from username + hospital
        const generateCardNumber = (username, hospital) => {
            let hash = 0;
            const str = `${username}-${hospital}-BLOODLINK`;
            for (let i = 0; i < str.length; i++) {
                const char = str.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash = hash & hash;
            }
            const num = Math.abs(hash);
            const part1 = String(num).slice(0, 4).padStart(4, '0');
            const part2 = String(num).slice(4, 8).padStart(4, '0');
            const part3 = String(num).slice(8, 12).padStart(4, '0');
            const checkDigit = (parseInt(part1) + parseInt(part2) + parseInt(part3)) % 97;
            return `BL-${part1}-${part2}-${part3}-${String(checkDigit).padStart(2, '0')}`;
        };

        const getCardTier = (count) => {
            if (count >= 8) return { tier: 'Elite', color: 'from-purple-600 via-violet-500 to-indigo-600', textColor: 'text-purple-900', discount: '15%', icon: '👑', bgAccent: 'bg-purple-300/20', labelColor: 'text-purple-200', borderColor: 'border-purple-300/30' };
            if (count >= 5) return { tier: 'Gold', color: 'from-yellow-600 via-amber-500 to-orange-500', textColor: 'text-yellow-900', discount: '10%', icon: '⭐', bgAccent: 'bg-orange-300/20', labelColor: 'text-orange-200', borderColor: 'border-orange-300/30' };
            if (count >= 2) return { tier: 'Silver', color: 'from-slate-400 via-gray-300 to-slate-500', textColor: 'text-slate-800', discount: '5%', icon: '🥈', bgAccent: 'bg-white/20', labelColor: 'text-slate-200', borderColor: 'border-white/30' };
            return null;
        };

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
            
            // Build priority cards based on donation count per hospital
            Object.entries(hCounts).forEach(([hospital, count]) => {
                const tierInfo = getCardTier(count);
                if (tierInfo) {
                    priorityCards.push({
                        hospital,
                        count,
                        ...tierInfo,
                        cardNumber: generateCardNumber(user.username, hospital),
                        holderName: profile?.name || user.username,
                        bloodGroup: profile?.bloodGroup || 'N/A',
                        issueDate: sorted.find(d => d.hospitalName === hospital)?.date || new Date()
                    });
                }
            });
            
            // Sort: Elite first, then Gold, then Silver
            priorityCards.sort((a, b) => {
                const order = { 'Elite': 3, 'Gold': 2, 'Silver': 1 };
                return (order[b.tier] || 0) - (order[a.tier] || 0);
            });
        }

        // Download card as PNG
        const downloadCard = (card) => {
            const canvas = document.createElement('canvas');
            canvas.width = 600;
            canvas.height = 340;
            const ctx = canvas.getContext('2d');

            // Background gradient
            const colors = {
                'Elite': ['#7C3AED', '#8B5CF6', '#4C1D95'],
                'Gold': ['#EAB308', '#F97316', '#C2410C'],
                'Silver': ['#94A3B8', '#CBD5E1', '#64748B']
            };
            const [c1, c2, c3] = colors[card.tier] || colors['Silver'];
            const grad = ctx.createLinearGradient(0, 0, 600, 340);
            grad.addColorStop(0, c1);
            grad.addColorStop(0.5, c2);
            grad.addColorStop(1, c3);
            ctx.fillStyle = grad;
            ctx.roundRect(0, 0, 600, 340, 20);
            ctx.fill();

            // Subtle pattern overlay
            ctx.fillStyle = 'rgba(255,255,255,0.05)';
            for (let i = 0; i < 600; i += 30) {
                ctx.beginPath();
                ctx.arc(i, 170, 80, 0, Math.PI * 2);
                ctx.fill();
            }

            // Top: BLOODLINK logo
            ctx.fillStyle = 'rgba(255,255,255,0.9)';
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'left';
            ctx.fillText('BLOODLINK', 30, 40);

            // Priority Donor badge
            ctx.fillStyle = 'rgba(255,255,255,0.7)';
            ctx.font = '10px Arial';
            ctx.textAlign = 'right';
            ctx.fillText('PRIORITY DONOR CARD', 570, 35);
            ctx.fillStyle = 'rgba(255,255,255,0.9)';
            ctx.font = 'bold 22px Arial';
            ctx.fillText(`${card.tier.toUpperCase()} TIER`, 570, 58);

            // Hospital name
            ctx.fillStyle = 'rgba(255,255,255,1)';
            ctx.font = 'bold 24px Arial';
            ctx.textAlign = 'left';
            ctx.fillText(card.hospital, 30, 90);

            // Card number
            ctx.fillStyle = 'rgba(255,255,255,0.8)';
            ctx.font = '16px monospace';
            ctx.fillText(card.cardNumber, 30, 140);

            // Holder details
            ctx.fillStyle = 'rgba(255,255,255,0.6)';
            ctx.font = '10px Arial';
            ctx.fillText('CARD HOLDER', 30, 190);
            ctx.fillStyle = 'rgba(255,255,255,1)';
            ctx.font = 'bold 18px Arial';
            ctx.fillText(card.holderName, 30, 212);

            // Blood group
            ctx.fillStyle = 'rgba(255,255,255,0.6)';
            ctx.font = '10px Arial';
            ctx.fillText('BLOOD GROUP', 300, 190);
            ctx.fillStyle = 'rgba(255,255,255,1)';
            ctx.font = 'bold 18px Arial';
            ctx.fillText(card.bloodGroup, 300, 212);

            // Donations
            ctx.fillStyle = 'rgba(255,255,255,0.6)';
            ctx.font = '10px Arial';
            ctx.fillText('DONATIONS', 450, 190);
            ctx.fillStyle = 'rgba(255,255,255,1)';
            ctx.font = 'bold 18px Arial';
            ctx.fillText(`${card.count}`, 450, 212);

            // Benefits bar
            ctx.fillStyle = 'rgba(0,0,0,0.15)';
            ctx.roundRect(20, 250, 560, 70, 12);
            ctx.fill();

            ctx.fillStyle = 'rgba(255,255,255,0.9)';
            ctx.font = 'bold 11px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`✦ ${card.discount} Discount on Emergency Services  ·  Priority Treatment  ·  Fast-Track Access`, 300, 275);
            ctx.fillStyle = 'rgba(255,255,255,0.5)';
            ctx.font = '9px Arial';
            ctx.fillText(`Valid from ${new Date(card.issueDate).toLocaleDateString()} · Verified by BloodLink`, 300, 298);

            const link = document.createElement('a');
            link.download = `BloodLink_${card.tier}_Card_${card.holderName.replace(/\s+/g, '_')}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        };

        return (
            <div className="space-y-8 animate-in fade-in duration-500">
                {/* Hero Profile Card */}
                <div className="bg-gradient-to-br from-red-700 via-red-600 to-rose-700 rounded-3xl p-8 text-white relative overflow-hidden">
                    <div className="absolute -right-16 -top-16 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                    <div className="absolute -left-10 -bottom-10 w-48 h-48 bg-red-900/30 rounded-full blur-2xl"></div>
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                        <div className="flex items-center space-x-5">
                            <div className="w-16 h-16 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center backdrop-blur-sm overflow-hidden">
                                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username}`} alt="" className="w-full h-full" />
                            </div>
                            <div>
                                <p className="text-white/60 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Welcome Back</p>
                                <h1 className="text-2xl font-black tracking-tight">{profile?.name || user?.username}</h1>
                                <p className="text-white/70 text-sm font-bold mt-0.5">Donor · {profile?.bloodGroup || 'N/A'}</p>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-4">
                            <div className="bg-white/15 backdrop-blur-sm border border-white/15 rounded-2xl px-5 py-3 text-center min-w-[100px]">
                                <p className="text-2xl font-black">{profile?.donations?.length || 0}</p>
                                <p className="text-[10px] text-white/60 font-bold uppercase tracking-wider">Donations</p>
                            </div>
                            <div className="bg-white/15 backdrop-blur-sm border border-white/15 rounded-2xl px-5 py-3 text-center min-w-[100px]">
                                <p className="text-2xl font-black">{myRegistered.length}</p>
                                <p className="text-[10px] text-white/60 font-bold uppercase tracking-wider">Camps</p>
                            </div>
                            <div className="bg-white/15 backdrop-blur-sm border border-white/15 rounded-2xl px-5 py-3 text-center min-w-[100px]">
                                <p className="text-2xl font-black">{matchingRequests.length}</p>
                                <p className="text-[10px] text-white/60 font-bold uppercase tracking-wider">Alerts</p>
                            </div>
                            <div className={`backdrop-blur-sm border rounded-2xl px-5 py-3 text-center min-w-[100px] ${isBufferActive ? 'bg-yellow-400/20 border-yellow-300/30' : 'bg-emerald-400/25 border-emerald-300/30'}`}>
                                <p className="text-2xl font-black">{isBufferActive ? `${daysLeft}d` : '✓'}</p>
                                <p className="text-[10px] text-white/60 font-bold uppercase tracking-wider">{isBufferActive ? 'Rest Left' : 'Eligible'}</p>
                            </div>
                        </div>
                    </div>
                    {isBufferActive && (
                        <div className="relative z-10 mt-5 bg-white/10 border border-white/15 rounded-xl px-5 py-3 flex items-center justify-between">
                            <p className="text-white/90 text-sm font-bold"><Clock className="w-4 h-4 inline mr-2 opacity-70" />Rest period active — you can donate again on <strong className="text-white">{bufferEndDate.toLocaleDateString()}</strong></p>
                        </div>
                    )}
                </div>

                {/* Emergency Matching Requests */}
                {matchingRequests.filter(r => !isVolunteered(r)).length > 0 && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-black text-gray-800 flex items-center space-x-2">
                                <AlertTriangle className="w-5 h-5 text-red-600 animate-pulse" />
                                <span>Emergency Needs for {profile?.bloodGroup}</span>
                            </h2>
                            <Link to="/emergency-requests" className="text-sm font-black text-red-600 hover:underline">View All →</Link>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {matchingRequests.filter(r => !isVolunteered(r)).slice(0, 3).map(request => (
                                <div key={request._id} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-lg transition-all relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-red-50 to-transparent rounded-bl-full opacity-80"></div>
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="bg-red-600 text-white p-2.5 rounded-xl shadow-lg shadow-red-100">
                                            <Droplet className="w-5 h-5 fill-current" />
                                        </div>
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 px-2 py-1 rounded-lg">{new Date(request.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <h3 className="font-black text-gray-800 text-base mb-1">{request.hospitalName || 'Quick Broadcast'}</h3>
                                    <p className="text-gray-400 text-xs font-bold mb-5 flex items-center"><MapPin className="w-3 h-3 mr-1" /> {request.location || 'Thane'}</p>
                                    <button
                                        disabled={isVolunteered(request) || isBufferActive}
                                        onClick={() => handleVolunteer(request._id)}
                                        title={isBufferActive ? `Rest period active (${daysLeft} days remaining)` : ''}
                                        className={`w-full py-3 rounded-xl font-black text-xs flex items-center justify-center space-x-2 transition-all active:scale-95 ${
                                            isVolunteered(request) ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                            : isBufferActive ? 'bg-gray-50 text-gray-400 cursor-not-allowed border border-gray-100'
                                            : 'bg-gray-900 text-white hover:bg-black shadow-lg'
                                        }`}
                                    >
                                        <HeartHandshake className="w-4 h-4" />
                                        <span>{isVolunteered(request) ? `Volunteered (${getVolunteerStatus(request)})` : isBufferActive ? 'Rest Period Active' : 'Volunteer Now'}</span>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

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
                                <div key={idx} className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all group">
                                    <div className="bg-gradient-to-r from-red-600 to-red-500 px-5 py-3 flex items-center justify-between">
                                        <div className="flex items-center space-x-2">
                                            <Droplet className="w-4 h-4 text-white/80 fill-current" />
                                            <span className="text-white/80 text-xs font-black uppercase tracking-widest">Donation #{profile.donations.length - idx}</span>
                                        </div>
                                        <span className="text-white/70 text-xs font-bold">
                                            {new Date(donation.date).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <div className="p-5">
                                        <div className="flex items-center space-x-3 mb-4">
                                            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                                                <Hospital className="w-5 h-5 text-red-500" />
                                            </div>
                                            <div>
                                                <h3 className="font-black text-gray-800 text-sm">{donation.hospitalName}</h3>
                                                <p className="text-xs text-green-600 font-bold flex items-center space-x-1">
                                                    <CheckCircle className="w-3 h-3" />
                                                    <span>Verified Donation</span>
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex space-x-2">
                                            <button 
                                                onClick={() => setShowCert(donation)}
                                                className="flex-1 py-2.5 bg-gradient-to-r from-yellow-50 to-amber-50 text-amber-700 hover:from-yellow-100 hover:to-amber-100 font-black text-xs rounded-xl transition-colors flex items-center justify-center space-x-2 border border-yellow-100"
                                            >
                                                <Award className="w-4 h-4" />
                                                <span>View Certificate</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white border-2 border-dashed border-gray-100 rounded-2xl p-12 text-center">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Award className="w-8 h-8 text-gray-200" />
                            </div>
                            <p className="font-bold text-gray-400 text-sm">No completed donations yet.</p>
                            <p className="text-gray-300 text-xs mt-1">Your donation history will appear here.</p>
                        </div>
                    )}
                </div>

                {/* Priority Cards */}
                {priorityCards.length > 0 && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-gray-800 flex items-center space-x-2">
                                <HeartHandshake className="w-5 h-5 text-purple-500" />
                                <span>My Priority Cards</span>
                            </h2>
                            <div className="flex items-center space-x-2 text-xs font-bold text-gray-400">
                                <span className="px-2 py-1 bg-slate-100 rounded-lg">🥈 2+ Silver</span>
                                <span className="px-2 py-1 bg-yellow-100 rounded-lg">⭐ 5+ Gold</span>
                                <span className="px-2 py-1 bg-purple-100 rounded-lg">👑 8+ Elite</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {priorityCards.map((card, idx) => (
                                <div key={idx} className={`bg-gradient-to-br ${card.color} rounded-3xl p-6 text-white shadow-xl relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300`}>
                                    <div className="absolute -right-10 -top-10 rounded-full w-40 h-40 bg-white opacity-10 blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                                    <div className="absolute -left-5 -bottom-5 rounded-full w-32 h-32 bg-white opacity-5 blur-xl"></div>
                                    <div className="absolute top-4 left-0 w-full h-px bg-white/10"></div>
                                    <div className="flex justify-between items-start mb-1 relative z-10">
                                        <div>
                                            <p className={`${card.labelColor} text-[10px] font-black uppercase tracking-[0.2em] mb-0.5`}>BLOODLINK · Priority Donor</p>
                                            <h3 className="text-xl font-black drop-shadow-sm">{card.hospital}</h3>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-3xl drop-shadow-md">{card.icon}</span>
                                            <p className={`text-[10px] font-black uppercase tracking-wider ${card.labelColor}`}>{card.tier} Tier</p>
                                        </div>
                                    </div>
                                    <div className={`${card.bgAccent} backdrop-blur-sm border ${card.borderColor} rounded-xl px-4 py-2 mb-4 inline-block`}>
                                        <p className="font-mono text-sm font-bold tracking-wider drop-shadow-sm">{card.cardNumber}</p>
                                    </div>
                                    <div className="grid grid-cols-3 gap-4 mb-4 relative z-10">
                                        <div>
                                            <p className={`${card.labelColor} text-[9px] font-black uppercase tracking-widest mb-0.5`}>Card Holder</p>
                                            <p className="font-bold text-sm drop-shadow-sm">{card.holderName}</p>
                                        </div>
                                        <div>
                                            <p className={`${card.labelColor} text-[9px] font-black uppercase tracking-widest mb-0.5`}>Blood Group</p>
                                            <p className="font-bold text-sm drop-shadow-sm">{card.bloodGroup}</p>
                                        </div>
                                        <div>
                                            <p className={`${card.labelColor} text-[9px] font-black uppercase tracking-widest mb-0.5`}>Donations</p>
                                            <p className="font-bold text-sm drop-shadow-sm">{card.count} Completed</p>
                                        </div>
                                    </div>
                                    <div className="bg-black/15 backdrop-blur-sm rounded-xl px-4 py-3 mb-4 relative z-10">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-4 text-[10px] font-bold">
                                                <span>✦ {card.discount} Emergency Discount</span>
                                                <span>·</span>
                                                <span>Priority Treatment</span>
                                                <span>·</span>
                                                <span>Fast-Track Access</span>
                                            </div>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => downloadCard(card)}
                                        className="w-full py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center space-x-2 border border-white/20"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                        <span>Download Card</span>
                                    </button>
                                </div>
                            ))}
                            {/* About Priority Cards — fills the right column beside card */}
                            {priorityCards.length % 2 !== 0 && (
                                <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-100 rounded-2xl p-6 flex flex-col justify-center">
                                    <h4 className="font-black text-gray-700 text-sm mb-4 flex items-center space-x-2">
                                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                                        <span>About Priority Cards</span>
                                    </h4>
                                    <div className="space-y-4 text-xs">
                                        <div className="flex items-start space-x-3">
                                            <span className="text-xl">🥈</span>
                                            <div>
                                                <p className="font-bold text-gray-700">Silver Card (2+ Donations)</p>
                                                <p className="text-gray-400">5% discount on emergency services. Basic priority in queue.</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start space-x-3">
                                            <span className="text-xl">⭐</span>
                                            <div>
                                                <p className="font-bold text-gray-700">Gold Card (5+ Donations)</p>
                                                <p className="text-gray-400">10% discount on all services. Priority treatment access.</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start space-x-3">
                                            <span className="text-xl">👑</span>
                                            <div>
                                                <p className="font-bold text-gray-700">Elite Card (8+ Donations)</p>
                                                <p className="text-gray-400">15% discount + fast-track access. Highest priority in emergencies.</p>
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-gray-400 mt-4 font-bold uppercase tracking-wider">Present your card at the hospital for priority benefits.</p>
                                </div>
                            )}
                        </div>
                        {/* Show info below if even number of cards */}
                        {priorityCards.length % 2 === 0 && (
                            <div className="bg-gradient-to-r from-gray-50 to-white border border-gray-100 rounded-2xl p-5">
                                <h4 className="font-black text-gray-700 text-sm mb-3 flex items-center space-x-2">
                                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                                    <span>About Priority Cards</span>
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                                    <div className="flex items-start space-x-2">
                                        <span className="text-lg">🥈</span>
                                        <div>
                                            <p className="font-bold text-gray-700">Silver Card (2+ Donations)</p>
                                            <p className="text-gray-400">5% discount on emergency services. Basic priority in queue.</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start space-x-2">
                                        <span className="text-lg">⭐</span>
                                        <div>
                                            <p className="font-bold text-gray-700">Gold Card (5+ Donations)</p>
                                            <p className="text-gray-400">10% discount on all services. Priority treatment access.</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start space-x-2">
                                        <span className="text-lg">👑</span>
                                        <div>
                                            <p className="font-bold text-gray-700">Elite Card (8+ Donations)</p>
                                            <p className="text-gray-400">15% discount + fast-track access. Highest priority in emergencies.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

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
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {quickActions.map((action) => {
                        const Icon = action.icon;
                        return (
                            <Link key={action.name} to={action.path} className="group flex items-center space-x-4 p-4 bg-white border border-gray-100 rounded-2xl hover:shadow-md transition-all hover:border-gray-200">
                                <div className={`p-3 rounded-xl text-white ${action.color} shadow-lg`}><Icon className="w-5 h-5" /></div>
                                <div className="flex-1">
                                    <p className="font-black text-gray-800 text-sm">{action.name}</p>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Go →</p>
                                </div>
                            </Link>
                        );
                    })}
                </div>

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

                                <button 
                                    onClick={() => {
                                        const canvas = document.createElement('canvas');
                                        canvas.width = 800;
                                        canvas.height = 600;
                                        const ctx = canvas.getContext('2d');
                                        ctx.fillStyle = '#FFFFFF';
                                        ctx.fillRect(0, 0, 800, 600);
                                        ctx.strokeStyle = '#D4AF37';
                                        ctx.lineWidth = 8;
                                        ctx.strokeRect(20, 20, 760, 560);
                                        ctx.strokeStyle = '#F0D78C';
                                        ctx.lineWidth = 2;
                                        ctx.strokeRect(30, 30, 740, 540);
                                        ctx.fillStyle = '#D4AF37';
                                        ctx.font = '48px serif';
                                        ctx.textAlign = 'center';
                                        ctx.fillText('🏆', 400, 80);
                                        ctx.fillStyle = '#1a1a1a';
                                        ctx.font = 'bold 32px Georgia, serif';
                                        ctx.fillText('CERTIFICATE OF APPRECIATION', 400, 140);
                                        ctx.fillStyle = '#888';
                                        ctx.font = 'italic 16px Georgia, serif';
                                        ctx.fillText('This certificate is proudly presented to', 400, 180);
                                        ctx.fillStyle = '#DC2626';
                                        ctx.font = 'bold 28px Georgia, serif';
                                        ctx.fillText(profile?.name || user.username, 400, 240);
                                        ctx.strokeStyle = '#FEE2E2';
                                        ctx.lineWidth = 2;
                                        ctx.beginPath();
                                        ctx.moveTo(200, 255);
                                        ctx.lineTo(600, 255);
                                        ctx.stroke();
                                        ctx.fillStyle = '#444';
                                        ctx.font = '15px Georgia, serif';
                                        ctx.fillText(`In recognition of your generous life-saving blood donation on`, 400, 310);
                                        ctx.font = 'bold 15px Georgia, serif';
                                        ctx.fillText(`${new Date(showCert.date).toLocaleDateString()} at ${showCert.hospitalName}.`, 400, 340);
                                        ctx.font = '15px Georgia, serif';
                                        ctx.fillText('Your selflessness brings hope and healing to those in need.', 400, 390);
                                        ctx.strokeStyle = '#999';
                                        ctx.lineWidth = 1;
                                        ctx.beginPath();
                                        ctx.moveTo(100, 500);
                                        ctx.lineTo(260, 500);
                                        ctx.stroke();
                                        ctx.fillStyle = '#888';
                                        ctx.font = '12px sans-serif';
                                        ctx.textAlign = 'center';
                                        ctx.fillText('Authorized Signature', 180, 520);
                                        ctx.strokeStyle = '#D4AF37';
                                        ctx.lineWidth = 3;
                                        ctx.beginPath();
                                        ctx.arc(400, 490, 35, 0, Math.PI * 2);
                                        ctx.stroke();
                                        ctx.fillStyle = '#D4AF37';
                                        ctx.font = 'bold 9px sans-serif';
                                        ctx.fillText('OFFICIAL', 400, 487);
                                        ctx.fillText('SEAL', 400, 500);
                                        ctx.strokeStyle = '#999';
                                        ctx.lineWidth = 1;
                                        ctx.beginPath();
                                        ctx.moveTo(540, 500);
                                        ctx.lineTo(700, 500);
                                        ctx.stroke();
                                        ctx.fillStyle = '#1a1a1a';
                                        ctx.font = 'bold 13px sans-serif';
                                        ctx.fillText(new Date(showCert.date).toLocaleDateString(), 620, 496);
                                        ctx.fillStyle = '#888';
                                        ctx.font = '12px sans-serif';
                                        ctx.fillText('Date', 620, 520);
                                        const link = document.createElement('a');
                                        link.download = `Certificate_${(profile?.name || user.username).replace(/\s+/g, '_')}_${new Date(showCert.date).toLocaleDateString().replace(/\//g, '-')}.png`;
                                        link.href = canvas.toDataURL('image/png');
                                        link.click();
                                    }}
                                    className="mt-8 mx-auto flex items-center space-x-2 px-8 py-3 bg-red-600 text-white font-black rounded-xl hover:bg-red-700 transition-all active:scale-95 shadow-lg shadow-red-100"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                    <span>Download Certificate</span>
                                </button>
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
                <Link to="/stock?tab=donors"><StatCard icon={Users} label="Total Donors" value={stats?.totalDonors || 0} trend="Active" color="text-blue-600" bg="bg-blue-50" /></Link>
                <Link to="/hospital-requests"><StatCard icon={Droplet} label="Network Needs" value={externalRequestsCount} trend="Urgent" color="text-red-600" bg="bg-red-50" /></Link>
                <Link to="/camps"><StatCard icon={Calendar} label="Upc. Camps" value={stats?.upcomingCamps || 0} trend="Upcoming" color="text-purple-600" bg="bg-purple-50" /></Link>
                <Link to="/stock?tab=hospitals"><StatCard icon={Activity} label="Hospitals" value={stats?.totalHospitals || 0} trend="Registered" color="text-emerald-600" bg="bg-emerald-50" /></Link>
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
