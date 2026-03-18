import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Droplet, Phone, AlertCircle, CheckCircle, Loader2, MapPin, Hospital as HospitalIcon } from 'lucide-react';

const RequestBlood = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    const [hospitalProfile, setHospitalProfile] = useState(null);
    const [profileLoading, setProfileLoading] = useState(true);
    const [profileError, setProfileError] = useState('');

    const [formData, setFormData] = useState({
        bloodGroup: '',
        contactInfo: user?.phone || '',
        reason: '',
    });
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    // Fetch the hospital profile on mount to get name + location automatically
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                setProfileLoading(true);
                const res = await axios.get(`http://localhost:5000/api/auth/my-stock/${user.username}`);
                setHospitalProfile(res.data);
            } catch (err) {
                setProfileError('Could not load hospital profile. Please ensure your hospital is registered.');
            } finally {
                setProfileLoading(false);
            }
        };
        fetchProfile();
    }, [user.username]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!hospitalProfile) {
            setError('Hospital profile not loaded. Cannot submit request.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            await axios.post('http://localhost:5000/api/request', {
                ...formData,
                hospitalName: hospitalProfile.name,
                location: hospitalProfile.location,
            });
            setSuccess(true);
            setFormData({ bloodGroup: '', contactInfo: '', reason: '' });
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to broadcast request.');
        } finally {
            setLoading(false);
        }
    };

    if (profileLoading) return (
        <div className="flex flex-col items-center justify-center min-h-[400px]">
            <Loader2 className="w-10 h-10 text-red-600 animate-spin" />
            <p className="mt-4 font-bold text-gray-400">Loading hospital profile...</p>
        </div>
    );

    if (profileError) return (
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
            <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
            <p className="font-bold text-red-600">{profileError}</p>
        </div>
    );

    if (success) return (
        <div className="flex flex-col items-center justify-center py-12 text-center animate-in fade-in zoom-in-95 duration-500">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
                <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h2 className="text-3xl font-black text-gray-800 mb-2">Request Broadcasted!</h2>
            <p className="text-gray-500 max-w-md mx-auto mb-2">
                Your emergency request from <span className="font-black text-gray-700">{hospitalProfile?.name}</span> has been sent to all matching donors in Thane.
            </p>
            <p className="text-sm text-gray-400 font-medium mb-8">{hospitalProfile?.location}</p>
            <button
                onClick={() => setSuccess(false)}
                className="bg-red-600 text-white font-bold px-8 py-3 rounded-xl shadow-lg shadow-red-200 hover:bg-red-700 transition-all"
            >
                Post Another Request
            </button>
        </div>
    );

    return (
        <div className="max-w-2xl mx-auto py-8">
            <div className="text-center mb-10">
                <div className="inline-flex p-4 bg-red-100 rounded-2xl mb-4">
                    <AlertCircle className="w-10 h-10 text-red-600 animate-pulse" />
                </div>
                <h1 className="text-3xl font-black text-gray-800">Emergency Blood Request</h1>
                <p className="text-gray-500 mt-2">Broadcast your need to the entire BloodLink network instantly.</p>
            </div>

            {/* Auto-filled hospital info banner */}
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 mb-6 flex items-start space-x-4">
                <div className="p-2 bg-blue-100 rounded-xl flex-shrink-0">
                    <HospitalIcon className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-xs font-black text-blue-500 uppercase tracking-widest mb-1">Requesting Hospital (Auto-filled)</p>
                    <p className="font-black text-blue-900 text-lg leading-tight">{hospitalProfile?.name}</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                        <div className="flex items-center text-blue-600 text-sm font-bold">
                            <MapPin className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" />
                            {hospitalProfile?.location}
                        </div>
                        {user?.phone && (
                            <div className="flex items-center text-blue-600 text-sm font-bold">
                                <Phone className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" />
                                {user.phone}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-red-50 border border-red-100 p-6 rounded-2xl flex items-start space-x-4">
                    <Droplet className="w-6 h-6 text-red-600 mt-1 fill-current flex-shrink-0" />
                    <div>
                        <h4 className="font-bold text-red-900">Urgent Broadcast</h4>
                        <p className="text-sm text-red-700 leading-relaxed font-medium">
                            Information provided here will be visible to donors. Please ensure the contact details are correct.
                        </p>
                    </div>
                </div>

                {error && (
                    <div className="p-4 bg-red-50 border border-red-100 text-red-700 rounded-xl text-sm font-bold text-center">
                        {error}
                    </div>
                )}

                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700">Required Blood Group</label>
                            <select
                                required
                                className="form-input appearance-none bg-white"
                                value={formData.bloodGroup}
                                onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                            >
                                <option value="">Select Group</option>
                                {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(g => (
                                    <option key={g} value={g}>{g}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-bold text-gray-700">Contact Number</label>
                                {user?.phone && (
                                    <span className="text-xs font-bold text-green-600 bg-green-50 border border-green-100 px-2 py-0.5 rounded-full">
                                        ✓ Auto-filled from account
                                    </span>
                                )}
                            </div>
                            <div className="relative">
                                <input
                                    type="tel"
                                    required
                                    placeholder="Enter phone number"
                                    className="form-input"
                                    value={formData.contactInfo}
                                    onChange={(e) => setFormData({ ...formData, contactInfo: e.target.value })}
                                />
                                <Phone className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            </div>
                            <p className="text-xs text-gray-400 font-medium">From your hospital login · Edit if needed</p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700">Additional Details / Reason</label>
                        <textarea
                            rows="3"
                            className="form-input"
                            placeholder="Case priority, surgery details, etc."
                            value={formData.reason}
                            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                        ></textarea>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 bg-red-600 text-white font-black text-lg rounded-2xl shadow-xl shadow-red-200 hover:bg-red-700 transition-all active:scale-[0.98] disabled:opacity-50"
                >
                    {loading ? 'Broadcasting...' : 'Broadcast Emergency Request'}
                </button>
            </form>

            <style>{`
                .form-input {
                    width: 100%;
                    padding: 12px 16px;
                    border: 1px solid #e5e7eb;
                    border-radius: 12px;
                    outline: none;
                    transition: all 0.2s;
                    font-weight: 500;
                    color: #374151;
                }
                .form-input:focus {
                    border-color: #ef4444;
                    box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.1);
                }
            `}</style>
        </div>
    );
};

export default RequestBlood;
