import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
    Calendar,
    MapPin,
    Clock,
    Users,
    X,
    PlusCircle,
    Loader2,
    Hospital,
    CheckCircle,
    UserPlus,
    UserMinus
} from 'lucide-react';

const Camps = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    const [camps, setCamps] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [registering, setRegistering] = useState(null); // campId being processed
    const [toast, setToast] = useState(null);

    const [hospitalProfile, setHospitalProfile] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        date: '',
        time: '',
        venue: '',
        organizer: user?.username || 'Unknown'
    });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchCamps();
        // Fetch hospital profile to get real name for organizer
        if (user?.role === 'HOSPITAL') {
            axios.get(`http://localhost:5000/api/auth/my-stock/${user.username}`)
                .then(res => {
                    setHospitalProfile(res.data);
                    setFormData(prev => ({ ...prev, organizer: res.data.name || user.username }));
                })
                .catch(() => {}); // silently fail, username fallback is fine
        }
    }, []);

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    const fetchCamps = async () => {
        try {
            setLoading(true);
            const res = await axios.get('http://localhost:5000/api/camps');
            setCamps(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const isRegistered = (camp) => camp.registeredDonors?.includes(user?.username);

    const handleRegister = async (camp) => {
        if (user?.role !== 'DONOR') return;
        setRegistering(camp._id);
        try {
            if (isRegistered(camp)) {
                await axios.delete(`http://localhost:5000/api/camps/${camp._id}/register`, {
                    data: { username: user.username }
                });
                showToast('You have unregistered from this camp.');
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

    const handleOrganize = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await axios.post('http://localhost:5000/api/camps', formData);
            setShowModal(false);
            setFormData({ name: '', date: '', time: '', venue: '', organizer: hospitalProfile?.name || user?.username || 'Unknown' });
            fetchCamps();
            showToast('Camp organized successfully!');
        } catch (err) {
            showToast(err.response?.data?.error || 'Error creating camp.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                <div>
                    <h2 className="text-3xl font-black text-gray-800 tracking-tight leading-none mb-2">Blood Donation Camps</h2>
                    <p className="text-gray-400 font-bold text-sm tracking-wide">Find and register for upcoming events in Thane</p>
                </div>
                {user?.role === 'HOSPITAL' && (
                    <button
                        onClick={() => setShowModal(true)}
                        className="flex items-center space-x-2 bg-red-600 text-white font-black px-8 py-4 rounded-2xl hover:bg-red-700 transition-all shadow-xl shadow-red-200 active:scale-95 transform"
                    >
                        <PlusCircle className="w-5 h-5" />
                        <span>Organize a Camp</span>
                    </button>
                )}
            </div>

            {/* Donor registration summary */}
            {user?.role === 'DONOR' && !loading && (
                <div className="bg-red-50 border border-red-100 rounded-2xl px-6 py-4 flex items-center space-x-4">
                    <CheckCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                    <p className="text-sm font-bold text-red-700">
                        You are registered for{' '}
                        <span className="font-black underline underline-offset-2">
                            {camps.filter(c => c.registeredDonors?.includes(user.username)).length}
                        </span>{' '}
                        camp(s). Click <span className="font-black">Register Now</span> on any camp below to sign up.
                    </p>
                </div>
            )}

            {loading ? (
                <div className="flex flex-col justify-center items-center h-96 space-y-4">
                    <Loader2 className="w-12 h-12 text-red-600 animate-spin" />
                    <p className="font-bold text-gray-400">Fetching live events...</p>
                </div>
            ) : camps.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                    <Calendar className="w-12 h-12 text-gray-200 mb-4" />
                    <p className="font-black text-gray-400 text-lg">No camps scheduled yet.</p>
                    {user?.role === 'HOSPITAL' && (
                        <p className="text-sm text-gray-400 mt-2">Click <span className="font-black">"Organize a Camp"</span> to create the first one.</p>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    {camps.map((camp) => {
                        const registered = isRegistered(camp);
                        const isProcessing = registering === camp._id;
                        const count = camp.registeredDonors?.length || 0;

                        return (
                            <div key={camp._id} className={`bg-white border rounded-[2rem] flex overflow-hidden hover:shadow-2xl transition-all group relative ${registered ? 'border-red-200 shadow-red-50 shadow-md' : 'border-gray-100'}`}>
                                <div className="w-32 md:w-44 bg-red-600 flex flex-col items-center justify-center text-white p-6 relative overflow-hidden flex-shrink-0">
                                    <div className="absolute top-0 left-0 w-full h-full opacity-10 blur-2xl bg-white rounded-full -translate-x-1/2 -translate-y-1/2"></div>
                                    <Calendar className="w-12 h-12 mb-3 opacity-90 relative z-10" />
                                    <span className="text-4xl font-black relative z-10 leading-none">{camp.date.split('-')[2]}</span>
                                    <span className="uppercase font-extrabold text-sm tracking-[0.2em] relative z-10">
                                        {new Date(camp.date + 'T00:00:00').toLocaleString('default', { month: 'short' })}
                                    </span>
                                </div>

                                <div className="flex-1 p-8 relative min-w-0">
                                    <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                                        <div className="flex items-center text-xs font-black text-red-600 uppercase tracking-widest">
                                            <div className="w-2.5 h-2.5 bg-red-600 rounded-full mr-2 animate-pulse shadow-[0_0_8px_rgba(220,38,38,0.5)]"></div>
                                            {registered ? 'You\'re Registered' : 'Open for Registration'}
                                        </div>
                                        {camp.organizer && (
                                            <div className="flex items-center text-[10px] font-black text-gray-400 uppercase tracking-tighter bg-gray-50 px-2 py-1 rounded-lg">
                                                <Hospital className="w-3 h-3 mr-1" />
                                                {camp.organizer}
                                            </div>
                                        )}
                                    </div>

                                    <h3 className="text-2xl font-black text-gray-800 mb-6 group-hover:text-red-600 transition-colors leading-tight">
                                        {camp.name}
                                    </h3>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="flex items-center text-gray-500 font-bold text-sm">
                                            <MapPin className="w-5 h-5 mr-3 text-red-400 flex-shrink-0" />
                                            <span className="truncate">{camp.venue}</span>
                                        </div>
                                        <div className="flex items-center text-gray-500 font-bold text-sm">
                                            <Clock className="w-5 h-5 mr-3 text-red-400 flex-shrink-0" />
                                            {camp.time}
                                        </div>
                                    </div>

                                    <div className="mt-8 flex items-center justify-between border-t border-gray-50 pt-6 flex-wrap gap-4">
                                        {/* Registered count */}
                                        <div className="flex items-center space-x-2">
                                            <Users className="w-4 h-4 text-gray-300" />
                                            <span className="text-xs font-black text-gray-400 uppercase tracking-widest">
                                                {count} donor{count !== 1 ? 's' : ''} registered
                                            </span>
                                        </div>

                                        {/* Action button — only for donors */}
                                        {user?.role === 'DONOR' && (
                                            <button
                                                onClick={() => handleRegister(camp)}
                                                disabled={isProcessing}
                                                className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl font-black text-sm transition-all active:scale-95 disabled:opacity-50 ${
                                                    registered
                                                        ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
                                                        : 'bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-100'
                                                }`}
                                            >
                                                {isProcessing ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : registered ? (
                                                    <><UserMinus className="w-4 h-4" /><span>Unregister</span></>
                                                ) : (
                                                    <><UserPlus className="w-4 h-4" /><span>Register Now</span></>
                                                )}
                                            </button>
                                        )}

                                        {user?.role === 'HOSPITAL' && (
                                            <span className="text-xs font-black text-gray-300 uppercase tracking-widest">
                                                {count} sign-up{count !== 1 ? 's' : ''}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Organize Camp Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-xl shadow-2xl overflow-hidden relative animate-in zoom-in-95 duration-500">
                        <div className="absolute top-6 right-6">
                            <button onClick={() => setShowModal(false)} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors">
                                <X className="w-6 h-6 text-gray-500" />
                            </button>
                        </div>

                        <div className="p-10">
                            <h2 className="text-3xl font-black text-gray-800 mb-2">Organize a Camp</h2>
                            <p className="text-gray-400 font-bold text-sm mb-10 tracking-wide uppercase">Add details of the upcoming blood drive</p>

                            <form onSubmit={handleOrganize} className="space-y-6">
                                <div className="space-y-4">
                                    <CampInput label="Event Name" placeholder="e.g. Summer Mega Blood Drive" value={formData.name} onChange={v => setFormData({ ...formData, name: v })} />
                                    <div className="grid grid-cols-2 gap-4">
                                        <CampInput type="date" label="Date" value={formData.date} onChange={v => setFormData({ ...formData, date: v })} />
                                        <CampInput label="Time Range" placeholder="e.g. 10 AM - 5 PM" value={formData.time} onChange={v => setFormData({ ...formData, time: v })} />
                                    </div>
                                    <CampInput label="Venue / Location" placeholder="Full address of the event" value={formData.venue} onChange={v => setFormData({ ...formData, venue: v })} />
                                </div>

                                <button
                                    disabled={submitting}
                                    className="w-full flex items-center justify-center space-x-3 py-5 bg-red-600 text-white rounded-2xl font-black text-xl shadow-2xl shadow-red-200 hover:bg-red-700 hover:-translate-y-1 transition-all disabled:opacity-50"
                                >
                                    {submitting ? <Loader2 className="w-6 h-6 animate-spin" /> : <span>Schedule Event</span>}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast */}
            {toast && (
                <div className={`fixed bottom-8 right-8 z-50 px-6 py-4 rounded-2xl shadow-xl text-white font-black text-sm animate-in slide-in-from-right-4 duration-300 ${toast.type === 'error' ? 'bg-red-600' : 'bg-emerald-600'}`}>
                    {toast.msg}
                </div>
            )}
        </div>
    );
};

const CampInput = ({ label, type = "text", placeholder, value, onChange }) => (
    <div className="space-y-2">
        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] pl-1">{label}</label>
        <input
            type={type}
            required
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl font-bold text-gray-700 focus:outline-none focus:ring-4 focus:ring-red-500 focus:ring-opacity-10 transition-all"
        />
    </div>
);

export default Camps;
