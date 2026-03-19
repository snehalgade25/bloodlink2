import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    Users, 
    CheckCircle, 
    XCircle, 
    Clock, 
    Droplet, 
    Loader2,
    Heart,
    Award,
    Hospital as HospitalIcon
} from 'lucide-react';

const Volunteers = () => {
    const user = JSON.parse(sessionStorage.getItem('user'));
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [hospitalProfile, setHospitalProfile] = useState(null);
    const [supportType, setSupportType] = useState('DONOR');
    const [filter, setFilter] = useState('all');
    const [toast, setToast] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const profRes = await axios.get(`http://localhost:5000/api/auth/my-stock/${user.username}`);
                setHospitalProfile(profRes.data);

                const reqRes = await axios.get(`http://localhost:5000/api/my-requests/${profRes.data.name}`);
                setRequests(reqRes.data);
            } catch (err) {
                console.error("Error loading volunteers:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
        const interval = setInterval(fetchData, 10000);
        return () => clearInterval(interval);
    }, [user.username]);

    const showToast = (msg) => {
        setToast(msg);
        setTimeout(() => setToast(null), 4000);
    };

    const updateStatus = async (requestId, donorUsername, newStatus, vType) => {
        try {
            await axios.patch(`http://localhost:5000/api/request/${requestId}/volunteer/${donorUsername}`, {
                status: newStatus
            });
            // Update local UI
            setRequests(prev => prev.map(r => {
                if (r._id === requestId) {
                    return {
                        ...r,
                        volunteers: r.volunteers.map(v => 
                            v.username === donorUsername ? { ...v, status: newStatus } : v
                        )
                    };
                }
                return r;
            }));

            if (newStatus === 'Accepted') {
                showToast(`✅ Accepted ${donorUsername}! Notification sent.`);
            } else if (newStatus === 'Completed') {
                const msg = vType === 'HOSPITAL' 
                    ? `🏆 Transfer from ${donorUsername} marked as completed!` 
                    : `🏆 Donation logged for ${donorUsername}! Certificate emailed.`;
                showToast(msg);
            } else if (newStatus === 'Rejected') {
                showToast(`Support offer from ${donorUsername} has been rejected.`);
            }
        } catch (err) {
            alert("Failed to update status");
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <Loader2 className="w-10 h-10 text-red-600 animate-spin" />
                <p className="mt-4 font-bold text-gray-400">Loading your support feed...</p>
            </div>
        );
    }

    // Filter requests that have volunteers of the CURRENT supportType
    const filteredRequests = requests.map(r => ({
        ...r,
        volunteers: (r.volunteers || []).filter(v => 
            v.volunteerType === supportType && 
            (filter === 'all' || v.status.toLowerCase() === filter)
        )
    })).filter(r => r.volunteers.length > 0);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-gray-800">Volunteer & Support Feed</h1>
                    <p className="text-gray-500 mt-1 uppercase text-[10px] font-black tracking-widest leading-relaxed">
                        Manage lifesavers and hospital partners responding to your emergency broadcasts
                    </p>
                </div>
                
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Support Type Tabs */}
                    <div className="flex bg-gray-100 rounded-2xl p-1 shadow-inner">
                        {[
                            { id: 'DONOR', label: 'Individual Donors', icon: Users },
                            { id: 'HOSPITAL', label: 'Hospital Support', icon: HospitalIcon }
                        ].map((t) => (
                            <button
                                key={t.id}
                                onClick={() => setSupportType(t.id)}
                                className={`flex items-center space-x-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                                    supportType === t.id 
                                        ? 'bg-white text-gray-900 shadow-md' 
                                        : 'text-gray-400 hover:text-gray-600'
                                }`}
                            >
                                <t.icon className="w-4 h-4" />
                                <span>{t.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Status Filter */}
                    <div className="flex bg-white rounded-2xl p-1 shadow-sm border border-gray-100">
                        {['all', 'pending', 'accepted', 'completed'].map((t) => (
                            <button
                                key={t}
                                onClick={() => setFilter(t)}
                                className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                    filter === t 
                                        ? 'bg-red-600 text-white shadow-md shadow-red-100' 
                                        : 'text-gray-400 hover:text-gray-600'
                                }`}
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {filteredRequests.length === 0 ? (
                <div className="bg-white border-2 border-dashed border-gray-100 rounded-[2.5rem] p-20 text-center">
                    <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        {supportType === 'HOSPITAL' ? <HospitalIcon className="w-12 h-12 text-gray-200" /> : <Users className="w-12 h-12 text-gray-200" />}
                    </div>
                    <h3 className="text-2xl font-black text-gray-400 uppercase tracking-widest">No {supportType === 'HOSPITAL' ? 'Hospital' : 'Donor'} {filter === 'all' ? '' : filter} Responses</h3>
                    <p className="text-gray-400 mt-2 max-w-xs mx-auto text-sm font-bold">
                        {supportType === 'HOSPITAL' 
                            ? "Once another facility offers to supply blood units, they will appear here." 
                            : "Once a donor volunteers for your emergency, they will appear here."}
                    </p>
                </div>
            ) : (
                <div className="grid gap-8">
                    {filteredRequests.map((request) => (
                        <div key={request._id} className="bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden shadow-sm">
                            <div className="bg-gray-50 px-8 py-4 flex flex-col md:flex-row justify-between items-center border-b border-gray-100 gap-4">
                                <div className="flex items-center space-x-4">
                                    <div className="p-2 bg-red-100 rounded-xl">
                                        <Droplet className="w-5 h-5 text-red-600 fill-current" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-red-600 uppercase tracking-[0.2em] leading-none mb-1">Emergency Group</p>
                                        <h4 className="font-black text-lg text-gray-800">{request.bloodGroup} Blood Required</h4>
                                    </div>
                                </div>
                                <div className="flex items-center text-gray-400 text-xs font-bold">
                                    <Clock className="w-4 h-4 mr-2" />
                                    Posted on {new Date(request.createdAt).toLocaleDateString()}
                                </div>
                            </div>

                            <div className="p-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {request.volunteers
                                        .map((volunteer) => (
                                            <div key={volunteer.username} className="bg-gray-50 rounded-3xl p-6 border border-gray-100 group hover:border-red-200 transition-all hover:shadow-md">
                                                <div className="flex items-center space-x-4 mb-4">
                                                    <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center border-2 border-white shadow-sm overflow-hidden text-red-600">
                                                        {volunteer.volunteerType === 'HOSPITAL' ? (
                                                            <HospitalIcon className="w-6 h-6" />
                                                        ) : (
                                                            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${volunteer.username}`} alt="avatar" />
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h5 className="font-black text-gray-800 truncate">{volunteer.username}</h5>
                                                        <div className="flex flex-wrap gap-1">
                                                            <div className={`text-[9px] font-black uppercase tracking-widest inline-flex px-2 py-0.5 rounded-full ${
                                                                volunteer.status === 'Accepted' ? 'bg-green-100 text-green-600' :
                                                                volunteer.status === 'Rejected' ? 'bg-red-100 text-red-600' :
                                                                volunteer.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' :
                                                                'bg-blue-100 text-blue-600'
                                                            }`}>
                                                                {volunteer.status}
                                                            </div>
                                                            {volunteer.volunteerType === 'HOSPITAL' && (
                                                                <div className="text-[9px] font-black uppercase tracking-widest inline-flex px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-600">
                                                                    Inter-Hospital Support
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center text-gray-500 text-xs font-bold mb-6">
                                                    <Clock className="w-3.5 h-3.5 mr-2" />
                                                    Responded {new Date(volunteer.registeredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>

                                                <div className="space-y-3">
                                                    {volunteer.status === 'Pending' && (
                                                        <div className="flex space-x-2">
                                                            <button 
                                                                onClick={() => updateStatus(request._id, volunteer.username, 'Accepted', volunteer.volunteerType)}
                                                                className="flex-1 flex items-center justify-center space-x-2 py-2.5 bg-green-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-green-700 transition-all active:scale-95"
                                                            >
                                                                <CheckCircle className="w-4 h-4" />
                                                                <span>Accept</span>
                                                            </button>
                                                            <button 
                                                                onClick={() => updateStatus(request._id, volunteer.username, 'Rejected', volunteer.volunteerType)}
                                                                className="px-4 py-2.5 bg-white border border-gray-200 text-red-600 rounded-xl hover:bg-red-50 transition-all active:scale-95"
                                                            >
                                                                <XCircle className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    )}

                                                    {volunteer.status === 'Accepted' && (
                                                        <button 
                                                            onClick={() => updateStatus(request._id, volunteer.username, 'Completed', volunteer.volunteerType)}
                                                            className="w-full flex items-center justify-center space-x-2 py-2.5 bg-red-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-700 transition-all active:scale-95 shadow-md shadow-red-100"
                                                        >
                                                            <Heart className="w-4 h-4" />
                                                            <span>{volunteer.volunteerType === 'HOSPITAL' ? 'Confirm Transfer Received' : 'Mark as Donated'}</span>
                                                        </button>
                                                    )}

                                                    {volunteer.status === 'Completed' && (
                                                        <div className="w-full text-center py-2.5 border-2 border-dashed border-green-200 bg-green-50 rounded-xl text-green-600 font-black text-xs uppercase tracking-widest">
                                                            <span className="flex items-center justify-center space-x-2">
                                                                <Award className="w-4 h-4" />
                                                                <span>
                                                                    {volunteer.volunteerType === 'HOSPITAL' 
                                                                        ? 'Transfer Completed ✓' 
                                                                        : 'Donation Logged · Certificate Sent ✓'}
                                                                </span>
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Toast */}
            {toast && (
                <div className="fixed bottom-8 right-8 z-50 px-6 py-4 rounded-2xl shadow-xl text-white font-black text-sm animate-in slide-in-from-right-4 duration-300 bg-emerald-600 max-w-sm">
                    {toast}
                </div>
            )}
        </div>
    );
};

export default Volunteers;
