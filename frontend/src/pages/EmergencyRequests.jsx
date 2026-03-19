import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { AlertCircle, Phone, MapPin, Clock, Droplet, Heart, Loader2 } from 'lucide-react';

const EmergencyRequests = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [donorInfo, setDonorInfo] = useState(null);
    const user = JSON.parse(sessionStorage.getItem('user'));

    useEffect(() => {
        const fetchDonorAndRequests = async () => {
            if (!user?.username) return;
            
            try {
                // 1. Fetch donor profile
                try {
                    const donorRes = await axios.get(`http://localhost:5000/api/auth/my-profile/${user.username}`);
                    setDonorInfo(donorRes.data);
                } catch (pe) {
                    console.warn("Could not load donor profile details.", pe);
                }

                // 2. Fetch ALL open requests
                // Using /api/requests/all since that's what we defined in main.js
                // Added ?refresh=true to avoid potential caching
                const requestsRes = await axios.get(`http://localhost:5000/api/requests/all?t=${Date.now()}`);
                console.log("Fetched requests:", requestsRes.data.length);
                setRequests(requestsRes.data);
            } catch (err) {
                console.error("Error fetching requests:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchDonorAndRequests();
        const interval = setInterval(fetchDonorAndRequests, 5000);
        return () => clearInterval(interval);
    }, [user?.username]);

    // Calculate rest period
    let isBufferActive = false;
    let bufferEndDate = null;
    let daysLeft = 0;

    if (donorInfo && donorInfo.donations && donorInfo.donations.length > 0) {
        const sortedD = [...donorInfo.donations].sort((a,b) => new Date(b.date) - new Date(a.date));
        const lastDate = new Date(sortedD[0].date);
        bufferEndDate = new Date(lastDate.getTime() + 90 * 24 * 60 * 60 * 1000);
        if (new Date() < bufferEndDate) {
            isBufferActive = true;
            daysLeft = Math.ceil((bufferEndDate - new Date()) / (1000 * 60 * 60 * 24));
        }
    }

    const handleVolunteer = async (requestId) => {
        try {
            await axios.post(`http://localhost:5000/api/request/${requestId}/volunteer`, {
                username: user.username
            });
            setRequests(prev => prev.map(r => 
                r._id === requestId 
                    ? { ...r, volunteers: [...(r.volunteers || []), { username: user.username, status: 'Pending' }] }
                    : r
            ));
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to volunteer');
        }
    };

    const isVolunteered = (request) => request.volunteers?.some(v => v.username.toLowerCase() === user?.username.toLowerCase());
    const getVolunteerStatus = (request) => request.volunteers?.find(v => v.username.toLowerCase() === user?.username.toLowerCase())?.status;

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
                <Loader2 className="w-10 h-10 text-red-600 animate-spin" />
                <p className="text-gray-500 font-medium tracking-tight">Syncing with live blood broadcasts...</p>
            </div>
        );
    }

    // Prepare requests (sort them so matches go to the top, filter out volunteered ones)
    const filteredRequests = requests.filter(r => !isVolunteered(r));
    const sortedRequests = [...filteredRequests].sort((a, b) => {
        const bloodA = a.bloodGroup || '';
        const bloodB = b.bloodGroup || '';
        const donorBlood = donorInfo?.bloodGroup || '';
        
        const matchA = bloodA.toLowerCase() === donorBlood.toLowerCase();
        const matchB = bloodB.toLowerCase() === donorBlood.toLowerCase();
        
        if (matchA && !matchB) return -1;
        if (!matchA && matchB) return 1;
        
        // Secondary sort by date
        return new Date(b.createdAt) - new Date(a.createdAt);
    });

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-800">Emergency Broadcasts</h1>
                    <p className="text-gray-500 mt-1">
                        {donorInfo?.bloodGroup 
                            ? `Live feed for group ${donorInfo.bloodGroup} · Showing all active broadcasts`
                            : "Showing all active emergency broadcasts"
                        }
                    </p>
                </div>
                <div className="bg-red-50 px-4 py-2 rounded-xl border border-red-100 flex items-center space-x-2">
                    <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
                    <span className="text-sm font-bold text-red-700 uppercase tracking-widest">Live Updates</span>
                </div>
            </div>

            {sortedRequests.length === 0 ? (
                <div className="bg-white border-2 border-dashed border-gray-100 rounded-[2.5rem] p-16 text-center shadow-sm">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Heart className="w-10 h-10 text-gray-200" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-400">No active emergencies found</h3>
                    <p className="text-gray-400 mt-2 max-w-xs mx-auto">Either the broadcasts reached their limit or the system reached peak stability. Great job!</p>
                </div>
            ) : (
                <div className="grid gap-6">
                    {sortedRequests.map((request) => {
                        const donorBlood = donorInfo?.bloodGroup || '';
                        const requestBlood = request.bloodGroup || '';
                        const isMatch = requestBlood.toLowerCase() === donorBlood.toLowerCase();
                        
                        return (
                            <div key={request._id} className={`group bg-white border-2 rounded-[2.5rem] p-8 shadow-sm hover:shadow-xl transition-all duration-300 relative overflow-hidden ${
                                isMatch ? 'border-red-500 bg-red-50/10' : 'border-gray-50 hover:border-red-100'
                            }`}>
                                <div className="absolute top-0 right-0 w-40 h-40 bg-red-50 -mr-20 -mt-20 rounded-full opacity-50 group-hover:scale-110 transition-transform"></div>

                                <div className="flex flex-col md:flex-row gap-8 relative">
                                    <div className="flex-shrink-0">
                                        <div className={`w-20 h-20 rounded-3xl flex flex-col items-center justify-center text-white shadow-xl ${isMatch ? 'bg-red-600' : 'bg-gray-400'}`}>
                                            <Droplet className="w-8 h-8 fill-current" />
                                            <span className="text-sm font-black mt-1 leading-none">{request.bloodGroup}</span>
                                        </div>
                                    </div>

                                    <div className="flex-grow space-y-5">
                                        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                                            <div>
                                                <h3 className="text-2xl font-black text-gray-800">
                                                    {isMatch ? "Urgent Match Available" : "Emergency Requirement"}
                                                </h3>
                                                <div className="flex items-center text-gray-400 mt-1 space-x-4">
                                                    <div className="flex items-center text-sm font-bold">
                                                        <Clock className="w-4 h-4 mr-2 text-gray-400" />
                                                        {new Date(request.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                    <div className="w-1.5 h-1.5 bg-gray-200 rounded-full"></div>
                                                    <div className="flex items-center text-sm font-bold">
                                                        {new Date(request.createdAt).toLocaleDateString()}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                {isMatch && (
                                                    <span className="bg-red-600 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] animate-pulse">Your Group</span>
                                                )}
                                                <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.1em] ${isMatch ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-400'}`}>
                                                    Live Broadcast
                                                </span>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100/50 flex items-center space-x-3">
                                                <div className="p-2.5 bg-white rounded-xl shadow-sm text-red-500">
                                                    <MapPin className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest leading-none mb-1">Location</p>
                                                    <p className="font-black text-gray-800 text-sm truncate max-w-[150px]">{request.hospitalName || 'Blood Bank'}</p>
                                                    <p className="text-xs text-gray-500 font-medium">{request.location || 'Thane'}</p>
                                                </div>
                                            </div>
                                            <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100/50 flex items-center space-x-3">
                                                <div className="p-2.5 bg-white rounded-xl shadow-sm text-emerald-500">
                                                    <Phone className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest leading-none mb-1">Contact</p>
                                                    <p className="font-black text-gray-800 text-sm">{request.contactInfo}</p>
                                                    <p className="text-xs text-green-600 font-bold uppercase tracking-tighter">Verified Link</p>
                                                </div>
                                            </div>
                                        </div>

                                        {request.reason && (
                                            <div className="bg-white border-2 border-gray-50 p-5 rounded-2xl">
                                                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-2">Requirement Note</p>
                                                <p className="text-gray-600 text-sm italic font-medium">"{request.reason}"</p>
                                            </div>
                                        )}

                                        <div className="pt-2 flex flex-col sm:flex-row gap-4">
                                            <button
                                                onClick={() => window.open(`tel:${request.contactInfo}`)}
                                                className="flex-1 px-8 py-4 bg-white border-2 border-red-600 text-red-600 font-black rounded-2xl hover:bg-red-50 transition-all flex items-center justify-center space-x-3 active:scale-95 cursor-pointer shadow-sm"
                                            >
                                                <Phone className="w-5 h-5" />
                                                <span>Connect Now</span>
                                            </button>

                                            <button
                                                disabled={isVolunteered(request) || isBufferActive}
                                                onClick={() => handleVolunteer(request._id)}
                                                title={isBufferActive ? `Rest period active (${daysLeft} days remaining)` : ''}
                                                className={`flex-1 px-8 py-4 font-black rounded-2xl shadow-xl transition-all flex items-center justify-center space-x-3 active:scale-95 cursor-pointer ${
                                                    isVolunteered(request)
                                                        ? 'bg-emerald-50 text-emerald-600 border-2 border-emerald-100'
                                                        : isBufferActive
                                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-2 border-gray-100'
                                                        : 'bg-red-600 text-white hover:bg-red-700 shadow-red-100'
                                                }`}
                                            >
                                                <Heart className={`w-5 h-5 ${isVolunteered(request) ? 'fill-current text-emerald-500' : ''}`} />
                                                <span>
                                                    {isVolunteered(request) 
                                                        ? `Volunteered (${getVolunteerStatus(request)})` 
                                                        : isBufferActive
                                                        ? 'Buffer Period Active'
                                                        : 'Volunteer to Help'
                                                    }
                                                </span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default EmergencyRequests;
