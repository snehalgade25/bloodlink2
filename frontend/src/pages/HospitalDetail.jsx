import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import {
    Hospital as HospitalIcon,
    MapPin,
    Phone,
    Clock,
    ArrowLeft,
    Droplet,
    ShieldCheck,
    AlertTriangle,
    HeartHandshake,
    CheckCircle,
    Loader2
} from 'lucide-react';

const HospitalDetail = () => {
    const { id } = useParams();
    const [h, setH] = useState(null);
    const [loading, setLoading] = useState(true);
    const [requests, setRequests] = useState([]);
    const [donorProfile, setDonorProfile] = useState(null);
    const user = JSON.parse(localStorage.getItem('user'));


    useEffect(() => {
        fetchHospital();
    }, [id]);

    const fetchHospital = async () => {
        try {
            const res = await axios.get(`http://localhost:5000/api/hospital/${id}`);
            setH(res.data);
            
            // Also fetch active requests for this hospital
            const requestsRes = await axios.get(`http://localhost:5000/api/my-requests/${res.data.name}`);
            // Only show requests that match user blood group (if donor) and are Open
            if (user?.role === 'DONOR') {
                const profileRes = await axios.get(`http://localhost:5000/api/auth/my-profile/${user.username}`);
                setDonorProfile(profileRes.data);
                setRequests(requestsRes.data.filter(r => 
                    r.status === 'Open' && 
                    r.bloodGroup.toLowerCase() === profileRes.data.bloodGroup.toLowerCase()
                ));
            } else {
                setRequests(requestsRes.data.filter(r => r.status === 'Open'));
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleVolunteer = async (requestId) => {
        try {
            await axios.post(`http://localhost:5000/api/request/${requestId}/volunteer`, {
                username: user.username
            });
            // Refresh to update status
            fetchHospital();
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to volunteer');
        }
    };

    const isVolunteered = (request) => request.volunteers?.some(v => v.username === user?.username);
    const getVolunteerStatus = (request) => request.volunteers?.find(v => v.username === user?.username)?.status;


    if (loading) return (
        <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
        </div>
    );

    if (!h) return <div>Hospital not found</div>;

    return (
        <div className="space-y-8">
            <Link to="/stock" className="inline-flex items-center text-gray-500 hover:text-red-600 font-medium transition-colors">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Stock List
            </Link>

            <div className="flex flex-col md:flex-row gap-8">
                <div className="flex-1 space-y-6">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="p-4 bg-red-600 text-white rounded-2xl shadow-lg shadow-red-200">
                                <HospitalIcon className="w-10 h-10" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-extrabold text-gray-800">{h.name}</h1>
                                <div className="flex items-center text-gray-500 mt-1">
                                    <MapPin className="w-4 h-4 mr-1 text-red-500" />
                                    {h.location}, Thane
                                </div>
                            </div>
                        </div>
                        <span className={`px-4 py-2 rounded-full text-sm font-bold ${h.status === 'Critical' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                            }`}>
                            {h.status} Mode
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 border border-gray-100 rounded-xl flex items-center space-x-4">
                            <Phone className="w-5 h-5 text-gray-400" />
                            <div>
                                <div className="text-xs font-bold text-gray-400 uppercase">Emergency Contact</div>
                                <div className="text-gray-700 font-bold">+91 022 2548 9000</div>
                            </div>
                        </div>
                        <div className="p-4 border border-gray-100 rounded-xl flex items-center space-x-4">
                            <Clock className="w-5 h-5 text-gray-400" />
                            <div>
                                <div className="text-xs font-bold text-gray-400 uppercase">Available</div>
                                <div className="text-gray-700 font-bold">24 / 7 Operations</div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-50 p-6 rounded-2xl">
                        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                            <ShieldCheck className="w-5 h-5 mr-2 text-green-600" />
                            Safety Guidelines
                        </h3>
                        <ul className="text-gray-600 text-sm space-y-2 list-disc pl-5">
                            <li>All blood units are tested for HIV, Hepatitis B & C, and Malaria.</li>
                            <li>Strict storage temperatures maintained between 2°C to 6°C.</li>
                            <li>Last inspection completed on 15 Feb 2024.</li>
                        </ul>
                    </div>
                </div>

                <div className="w-full md:w-80">
                    <div className="bg-white border-2 border-red-50 rounded-2xl p-6 shadow-sm">
                        <h3 className="text-xl font-extrabold text-gray-800 mb-6 flex items-center">
                            <Droplet className="w-6 h-6 mr-2 text-red-600" />
                            Blood Stock
                        </h3>
                        <div className="space-y-4">
                            <DetailedStock label="A Positive" value={h.unitsA} />
                            <DetailedStock label="B Positive" value={h.unitsB} />
                            <DetailedStock label="O Positive" value={h.unitsO} />
                            <DetailedStock label="AB Positive" value={h.unitsAB} />
                        </div>

                        <Link to="/request" className="w-full mt-8 bg-red-600 text-white font-bold py-3 rounded-xl hover:bg-red-700 transition-all shadow-lg shadow-red-200 flex items-center justify-center">
                            Request from this Hospital
                        </Link>
                    </div>

                    {/* Active Emergency Requests for this Hospital */}
                    {requests.length > 0 && (
                        <div className="mt-8 space-y-4">
                            <h3 className="text-xl font-extrabold text-gray-800 flex items-center">
                                <AlertTriangle className="w-6 h-6 mr-2 text-red-600 animate-pulse" />
                                Active Emergencies
                            </h3>
                            <div className="space-y-4">
                                {requests.map(request => (
                                    <div key={request._id} className="bg-white border-2 border-red-50 rounded-2xl p-5 shadow-md relative overflow-hidden">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="bg-red-600 text-white px-3 py-1 rounded-lg text-xs font-black">
                                                {request.bloodGroup}
                                            </div>
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{new Date(request.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        <p className="text-sm text-gray-600 font-bold mb-4 line-clamp-2">{request.reason || 'Urgent requirement at our facility.'}</p>
                                        
                                        {user?.role === 'DONOR' ? (
                                            <button
                                                disabled={isVolunteered(request)}
                                                onClick={() => handleVolunteer(request._id)}
                                                className={`w-full py-3 rounded-xl font-black text-xs flex items-center justify-center space-x-2 transition-all active:scale-95 ${
                                                    isVolunteered(request)
                                                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                                        : 'bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-100'
                                                }`}
                                            >
                                                {isVolunteered(request) ? (
                                                    <><CheckCircle className="w-4 h-4" /><span>Volunteered ({getVolunteerStatus(request)})</span></>
                                                ) : (
                                                    <><HeartHandshake className="w-4 h-4" /><span>Volunteer Now</span></>
                                                )}
                                            </button>
                                        ) : (
                                            <div className="text-xs font-black text-red-500 uppercase tracking-tighter text-center bg-red-50 py-2 rounded-lg">
                                                Match needed: {request.bloodGroup}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const DetailedStock = ({ label, value }) => (
    <div className="flex justify-between items-center p-3 bg-red-50/50 rounded-xl">
        <span className="font-bold text-gray-700">{label}</span>
        <div className="flex items-center">
            <span className={`text-lg font-black mr-2 ${value < 5 ? 'text-red-600' : 'text-gray-800'}`}>
                {value}
            </span>
            <span className="text-xs font-medium text-gray-400">units</span>
        </div>
    </div>
);

export default HospitalDetail;
