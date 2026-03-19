import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { AlertCircle, Phone, MapPin, Clock, Droplet, Heart, Loader2 } from 'lucide-react';

const EmergencyRequests = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [donorInfo, setDonorInfo] = useState(null);
    const user = JSON.parse(localStorage.getItem('user'));

    useEffect(() => {
        const fetchDonorAndRequests = async () => {
            try {
                // 1. Fetch donor profile
                const donorRes = await axios.get(`http://localhost:5000/api/auth/my-profile/${user.username}`);
                setDonorInfo(donorRes.data);

                // 2. Fetch matching requests
                const requestsRes = await axios.get(`http://localhost:5000/api/matching-requests/${donorRes.data.bloodGroup}`);
                setRequests(requestsRes.data);
            } catch (err) {
                console.error("Error fetching requests:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchDonorAndRequests();
        const interval = setInterval(fetchDonorAndRequests, 10000);
        return () => clearInterval(interval);
    }, [user.username]);

    const handleVolunteer = async (requestId) => {
        try {
            await axios.post(`http://localhost:5000/api/request/${requestId}/volunteer`, {
                username: user.username
            });
            // Update local state to reflect volunteering
            setRequests(prev => prev.map(r => 
                r._id === requestId 
                    ? { ...r, volunteers: [...(r.volunteers || []), { username: user.username, status: 'Pending' }] }
                    : r
            ));
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to volunteer');
        }
    };

    const isVolunteered = (request) => request.volunteers?.some(v => v.username === user.username);
    const getVolunteerStatus = (request) => request.volunteers?.find(v => v.username === user.username)?.status;

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
                <Loader2 className="w-10 h-10 text-red-600 animate-spin" />
                <p className="text-gray-500 font-medium">Scanning for emergency requests...</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-800">Emergency Requests</h1>
                    <p className="text-gray-500 mt-1">Live broadcasts matching your blood group: <span className="text-red-600 font-bold">{donorInfo?.bloodGroup}</span></p>
                </div>
                <div className="bg-red-50 px-4 py-2 rounded-xl border border-red-100 flex items-center space-x-2">
                    <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
                    <span className="text-sm font-bold text-red-700 uppercase tracking-wider">Live Updates</span>
                </div>
            </div>

            {requests.length === 0 ? (
                <div className="bg-white border-2 border-dashed border-gray-100 rounded-3xl p-16 text-center">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Heart className="w-10 h-10 text-gray-200" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-400">No matching emergencies found</h3>
                    <p className="text-gray-400 mt-2">You will be notified as soon as someone needs your blood type.</p>
                </div>
            ) : (
                <div className="grid gap-6">
                    {requests.map((request) => (
                        <div key={request._id} className="group bg-white border border-gray-100 rounded-3xl p-6 shadow-sm hover:shadow-xl hover:border-red-100 transition-all duration-300 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-red-50 -mr-16 -mt-16 rounded-full opacity-50 group-hover:scale-110 transition-transform"></div>

                            <div className="flex flex-col md:flex-row gap-6 relative">
                                <div className="flex-shrink-0">
                                    <div className="w-16 h-16 bg-red-600 rounded-2xl flex flex-col items-center justify-center text-white shadow-lg shadow-red-100">
                                        <Droplet className="w-6 h-6 fill-current" />
                                        <span className="text-xs font-black mt-0.5">{request.bloodGroup}</span>
                                    </div>
                                </div>

                                <div className="flex-grow space-y-4">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="text-xl font-black text-gray-800">Urgent Requirement</h3>
                                            <div className="flex items-center text-gray-500 mt-1 space-x-4">
                                                <div className="flex items-center text-sm font-medium">
                                                    <Clock className="w-4 h-4 mr-1.5" />
                                                    {new Date(request.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                                <div className="flex items-center text-sm font-medium leading-none">
                                                    <span className="w-1 h-1 bg-gray-300 rounded-full mr-4"></span>
                                                    {new Date(request.createdAt).toLocaleDateString()}
                                                </div>
                                            </div>
                                        </div>
                                        <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest">Emergency</span>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100/50">
                                        <div className="flex items-center space-x-3 text-gray-700">
                                            <div className="p-2 bg-white rounded-lg shadow-sm">
                                                <MapPin className="w-4 h-4 text-red-500" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-400 font-bold uppercase tracking-tighter">Location</p>
                                                <p className="font-bold text-sm">{request.hospitalName || 'Blood Bank'}, {request.location || 'Thane'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-3 text-gray-700">
                                            <div className="p-2 bg-white rounded-lg shadow-sm">
                                                <Phone className="w-4 h-4 text-emerald-500" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-400 font-bold uppercase tracking-tighter">Contact No.</p>
                                                <p className="font-bold text-sm">{request.contactInfo}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {request.reason && (
                                        <div className="bg-white border border-gray-100 p-4 rounded-2xl">
                                            <p className="text-xs text-gray-400 font-bold uppercase tracking-tighter mb-1">Additional Details</p>
                                            <p className="text-gray-600 text-sm italic">"{request.reason}"</p>
                                        </div>
                                    )}

                                    <div className="pt-2 flex flex-col md:flex-row gap-3">
                                        <button
                                            onClick={() => window.open(`tel:${request.contactInfo}`)}
                                            className="flex-1 px-8 py-3 bg-white border-2 border-red-600 text-red-600 font-black rounded-xl hover:bg-red-50 transition-all flex items-center justify-center space-x-2 active:scale-95"
                                        >
                                            <Phone className="w-4 h-4" />
                                            <span>Contact Hospital</span>
                                        </button>

                                        <button
                                            disabled={isVolunteered(request)}
                                            onClick={() => handleVolunteer(request._id)}
                                            className={`flex-1 px-8 py-3 font-black rounded-xl shadow-lg transition-all flex items-center justify-center space-x-2 active:scale-95 ${
                                                isVolunteered(request)
                                                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                                    : 'bg-red-600 text-white hover:bg-red-700 shadow-red-100'
                                            }`}
                                        >
                                            <Heart className={`w-4 h-4 ${isVolunteered(request) ? 'fill-current' : ''}`} />
                                            <span>
                                                {isVolunteered(request) 
                                                    ? `Volunteered (${getVolunteerStatus(request)})` 
                                                    : 'Volunteer to Donate'
                                                }
                                            </span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default EmergencyRequests;
