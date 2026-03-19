import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    AlertCircle, 
    Phone, 
    MapPin, 
    Clock, 
    Droplet, 
    Heart, 
    Loader2, 
    Hospital as HospitalIcon,
    ArrowRight,
    MessageSquare
} from 'lucide-react';
import { Link } from 'react-router-dom';

const HospitalRequests = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const user = JSON.parse(sessionStorage.getItem('user'));
    const [hospitalProfile, setHospitalProfile] = useState(null);
    const [toast, setToast] = useState(null);

    const showToast = (msg, isError = false) => {
        setToast({ msg, isError });
        setTimeout(() => setToast(null), 4000);
    };

    useEffect(() => {
        const fetchRequests = async () => {
            try {
                // 1. Fetch current hospital profile
                try {
                    const profileRes = await axios.get(`http://localhost:5000/api/auth/my-stock/${user.username}`);
                    setHospitalProfile(profileRes.data);
                } catch (pe) {
                    console.warn("Could not load hospital profile.", pe);
                }

                // 2. Fetch all broadcasts
                const res = await axios.get(`http://localhost:5000/api/requests/all?t=${Date.now()}`);
                setRequests(res.data);
            } catch (err) {
                console.error("Error fetching hospital requests:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchRequests();
        const interval = setInterval(fetchRequests, 12000); // Polling every 12s
        return () => clearInterval(interval);
    }, [user?.username]);

    // Show only active/open requests from OTHER hospitals
    const otherRequests = requests.filter(r => 
        r.status?.toLowerCase() !== 'completed' && 
        r.hospitalName !== hospitalProfile?.name &&
        !(r.volunteers?.some(v => v.username === user.username)) // Filter out if already volunteered
    );

    const handleDonate = async (request) => {
        // 1. Stability Check (Responsible Donation)
        const total = (hospitalProfile?.unitsA || 0) + (hospitalProfile?.unitsB || 0) + (hospitalProfile?.unitsO || 0) + (hospitalProfile?.unitsAB || 0);
        const hasLow = (hospitalProfile?.unitsA < 2 || hospitalProfile?.unitsB < 2 || hospitalProfile?.unitsO < 2 || hospitalProfile?.unitsAB < 2);
        const isStable = (total >= 10 && !hasLow);

        if (!isStable) {
            showToast("Action Denied: Inter-hospital donations are only allowed if your stock is 'Stable'.", true);
            return;
        }

        // 2. Specific Stock Check
        const group = request.bloodGroup;
        let hasGroupStock = false;
        if (group === 'A+') hasGroupStock = (hospitalProfile?.unitsA || 0) > 0;
        else if (group === 'B+') hasGroupStock = (hospitalProfile?.unitsB || 0) > 0;
        else if (group === 'O+') hasGroupStock = (hospitalProfile?.unitsO || 0) > 0;
        else if (group === 'AB+') hasGroupStock = (hospitalProfile?.unitsAB || 0) > 0;

        if (!hasGroupStock) {
            showToast(`Insufficient Stock: Your facility has 0 units of ${group}.`, true);
            return;
        }

        // 3. Process Volunteer
        try {
            const res = await axios.post(`http://localhost:5000/api/request/${request._id}/volunteer/hospital`, {
                username: user.username
            });
            
            showToast("Support Sent! 1 unit has been deducted from your inventory.");
            
            // Remove from local list immediately for better UX
            setRequests(prev => prev.filter(r => r._id !== request._id));
            
        } catch (err) {
            showToast(err.response?.data?.error || "Failed to initiate support.", true);
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[400px]">
             <Loader2 className="w-10 h-10 text-red-600 animate-spin" />
             <p className="mt-4 font-bold text-gray-400 uppercase tracking-widest text-xs">Scanning for broadcasts...</p>
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-800 flex items-center space-x-3">
                        <MessageSquare className="w-8 h-8 text-red-600" />
                        <span>Hospital Requests</span>
                    </h1>
                    <p className="text-gray-400 mt-1 text-sm font-bold leading-relaxed">
                        Monitor active blood requirements from other hospitals in the network.
                    </p>
                </div>
                <div className="bg-red-50 px-4 py-2 rounded-xl border border-red-100">
                    <span className="text-red-600 font-black text-xs uppercase tracking-widest flex items-center">
                         <span className="relative flex h-2 w-2 mr-2">
                             <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                             <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                         </span>
                         Live Network Feed
                    </span>
                </div>
            </div>

            {otherRequests.length === 0 ? (
                <div className="bg-white border-2 border-dashed border-gray-100 rounded-[2.5rem] p-20 text-center">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Droplet className="w-10 h-10 text-gray-200" />
                    </div>
                    <h3 className="text-xl font-black text-gray-400">No Active Broadcasts</h3>
                    <p className="text-gray-400 mt-2 max-w-sm mx-auto text-sm">
                        There are currently no active blood requirements from other hospitals in your region.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {otherRequests.map((request) => (
                        <div key={request._id} className="bg-white border border-gray-100 rounded-[2rem] p-8 shadow-sm hover:shadow-xl transition-all duration-300 relative overflow-hidden group">
                            {/* Accent line */}
                            <div className="absolute top-0 left-0 w-2 h-full bg-red-600 opacity-0 group-hover:opacity-100 transition-all"></div>
                            
                            <div className="flex justify-between items-start mb-6">
                                <div className="flex items-center space-x-4">
                                    <div className="w-14 h-14 bg-red-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-red-100 font-black text-xl">
                                        {request.bloodGroup}
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-gray-800">{request.hospitalName}</h3>
                                        <div className="flex items-center text-gray-400 text-xs font-bold mt-0.5 uppercase tracking-widest leading-none">
                                            <MapPin className="w-3 h-3 mr-1" />
                                            {request.location || 'BloodLink Network'}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] leading-none mb-1">BROADCASTED</p>
                                    <p className="font-bold text-gray-700">{new Date(request.createdAt).toLocaleDateString()}</p>
                                </div>
                            </div>

                            <div className="bg-gray-50 rounded-2xl p-6 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 leading-none">Requirement Note:</p>
                                    <p className="text-gray-700 font-bold italic text-sm leading-relaxed">
                                        "{request.reason || 'Urgent requirement at our facility for clinical procedures.'}"
                                    </p>
                                </div>
                                <div className="bg-red-50 px-5 py-3 rounded-2xl border border-red-100 min-w-[140px] text-center shrink-0">
                                    <p className="text-[9px] font-black text-red-400 uppercase tracking-widest mb-1 leading-none">Needed Group</p>
                                    <p className="text-2xl font-black text-red-600 leading-none">{request.bloodGroup}</p>
                                </div>
                            </div>

                            <div className="flex items-center justify-between mt-auto pt-6 border-t border-gray-50">
                                <div className="flex items-center space-x-4">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Contact Support</span>
                                        <span className="text-sm font-black text-gray-800 tracking-tight">{request.contactInfo || '+91 022 2548 9000'}</span>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => handleDonate(request)}
                                    className="px-8 py-3.5 bg-red-600 text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-xl hover:bg-black shadow-lg shadow-red-100 transition-all active:scale-95 flex items-center space-x-2"
                                >
                                    <Heart className="w-4 h-4 fill-current" />
                                    <span>Donate Now</span>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Network Info */}
            <div className="bg-gradient-to-br from-gray-900 via-gray-900 to-black rounded-[2.5rem] p-12 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-80 h-80 bg-red-600 opacity-20 rounded-full blur-[100px] -mr-40 -mt-40"></div>
                <div className="relative z-10">
                    <h3 className="text-2xl font-black mb-4 tracking-tight">Inter-Hospital Network Coordination</h3>
                    <p className="text-gray-400 text-sm max-w-3xl font-medium leading-relaxed">
                        This feed shows urgent blood requirements broadcasted by other hospitals in the network.
                        Hospitals can collaborate to transfer life-saving units between facilities during critical shortages.
                        Each donation logged here will be recorded as professional inter-hospital support.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
                         <div className="flex items-start space-x-4">
                             <div className="bg-white/10 p-2.5 rounded-xl">
                                 <AlertCircle className="w-5 h-5 text-red-500" />
                             </div>
                             <div>
                                 <h4 className="font-bold text-sm uppercase tracking-widest">Real-time Feed</h4>
                                 <p className="text-[11px] text-gray-500 mt-1 font-bold leading-relaxed">Updates periodically to show neighbors' needs.</p>
                             </div>
                         </div>
                         <div className="flex items-start space-x-4">
                             <div className="bg-white/10 p-2.5 rounded-xl">
                                 <Droplet className="w-5 h-5 text-red-500" />
                             </div>
                             <div>
                                 <h4 className="font-bold text-sm uppercase tracking-widest">Stock Sync</h4>
                                 <p className="text-[11px] text-gray-500 mt-1 font-bold leading-relaxed">Your available units are checked before volunteering.</p>
                             </div>
                         </div>
                         <div className="flex items-start space-x-4">
                             <div className="bg-white/10 p-2.5 rounded-xl">
                                 <MapPin className="w-5 h-5 text-red-500" />
                             </div>
                             <div>
                                 <h4 className="font-bold text-sm uppercase tracking-widest">Secure Transfer</h4>
                                 <p className="text-[11px] text-gray-500 mt-1 font-bold leading-relaxed">Coordinate unit transfers through verified channels.</p>
                             </div>
                         </div>
                    </div>
                </div>
            </div>

            {/* Toast System */}
            {toast && (
                <div className="fixed bottom-10 right-10 z-[100] animate-in slide-in-from-right-10 duration-500">
                    <div className={`px-8 py-5 rounded-[1.5rem] shadow-2xl flex items-center space-x-4 border-2 ${
                        toast.isError ? 'bg-red-50 border-red-200' : 'bg-gray-900 border-gray-800'
                    }`}>
                        <div className={`p-2 rounded-xl ${toast.isError ? 'bg-red-200' : 'bg-red-600'}`}>
                            {toast.isError ? <AlertCircle className="w-5 h-5 text-red-600" /> : <Heart className="w-5 h-5 text-white fill-current" />}
                        </div>
                        <p className={`font-black text-xs uppercase tracking-widest ${toast.isError ? 'text-red-600' : 'text-white'}`}>
                            {toast.msg}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HospitalRequests;
