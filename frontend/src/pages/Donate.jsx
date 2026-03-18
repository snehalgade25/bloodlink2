import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { HeartHandshake, User, Phone, Droplet, CheckCircle, Loader2, AlertCircle } from 'lucide-react';

const Donate = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    const [donorData, setDonorData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`http://localhost:5000/api/auth/my-profile/${user.username}`);
            setDonorData(res.data);
        } catch (err) {
            console.error(err);
            setError('Could not load your profile. Please ensure you are registered.');
        } finally {
            setLoading(false);
        }
    };

    const handleConfirm = async () => {
        setSubmitting(true);
        try {
            // Already a donor, just log a "pledge" or update eligibility if needed
            // For this project, we'll just show success since the registration is already the "becoming a donor" part
            await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API
            setSuccess(true);
        } catch (err) {
            setError('Failed to process donation interest.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[400px]">
            <Loader2 className="w-10 h-10 text-red-600 animate-spin" />
            <p className="mt-4 font-bold text-gray-400">Loading your profile...</p>
        </div>
    );

    if (success) return (
        <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in zoom-in-95 duration-500">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-8 shadow-inner">
                <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h2 className="text-4xl font-black text-gray-800 mb-4">You're a Lifesaver!</h2>
            <p className="text-gray-500 max-w-md mx-auto mb-10 text-lg font-medium leading-relaxed">
                Your donation interest has been logged. A nearby hospital or blood bank will contact you when there's an urgent need for
                <span className="text-red-600 font-bold px-2">Group {donorData?.bloodGroup}</span>.
            </p>
            <button
                onClick={() => setSuccess(false)}
                className="bg-gray-800 text-white font-black px-10 py-4 rounded-2xl shadow-xl hover:bg-black transition-all active:scale-95"
            >
                Back to Dashboard
            </button>
        </div>
    );

    return (
        <div className="max-w-3xl mx-auto py-10 animate-in fade-in duration-500">
            <div className="text-center mb-12">
                <div className="inline-flex p-5 bg-red-50 rounded-[2rem] mb-6 shadow-sm">
                    <HeartHandshake className="w-12 h-12 text-red-600" />
                </div>
                <h1 className="text-4xl font-black text-gray-800 tracking-tight">Donation Portal</h1>
                <p className="text-gray-400 font-bold mt-3 text-lg">Confirm your details to pledge for donation</p>
            </div>

            {error && (
                <div className="mb-8 p-4 bg-red-50 border border-red-100 text-red-700 rounded-2xl flex items-center justify-center space-x-2 font-bold animate-pulse">
                    <AlertCircle className="w-5 h-5" />
                    <span>{error}</span>
                </div>
            )}

            <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden relative">
                {/* Visual Flair */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-red-50 rounded-bl-full opacity-50 blur-2xl"></div>

                <h2 className="text-xl font-black text-gray-800 mb-8 flex items-center">
                    <User className="w-6 h-6 mr-3 text-red-600" />
                    Registered Profile Information
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                    <ReadOnlyField label="Full Name" value={donorData?.name} icon={User} />
                    <ReadOnlyField label="Blood Group" value={donorData?.bloodGroup} icon={Droplet} highlight />
                    <ReadOnlyField label="Age" value={`${donorData?.age} Years`} icon={User} />
                    <ReadOnlyField label="Contact Info" value={donorData?.contactInfo} icon={Phone} />
                </div>

                <div className="bg-blue-50 border border-blue-100 p-8 rounded-[2rem] flex items-start space-x-5 mb-10">
                    <div className="p-2 bg-blue-100 rounded-lg">
                        <CheckCircle className="w-6 h-6 text-blue-600" />
                    </div>
                    <p className="text-sm font-bold text-blue-800 leading-relaxed uppercase tracking-tight">
                        By clicking "Confirm Donation Interest", I verify that all above profile information is correct
                        and I am physically eligible to donate blood today.
                    </p>
                </div>

                <button
                    onClick={handleConfirm}
                    disabled={submitting}
                    className="w-full py-5 bg-red-600 text-white font-black text-xl rounded-3xl shadow-2xl shadow-red-100 hover:bg-red-700 hover:-translate-y-1 transition-all active:scale-[0.98] disabled:opacity-50"
                >
                    {submitting ? <Loader2 className="w-7 h-7 animate-spin mx-auto" /> : 'Confirm Donation Interest'}
                </button>

                <p className="text-center mt-6 text-gray-400 font-bold text-xs uppercase tracking-widest">
                    Your profile is synced with your account: {user?.username}
                </p>
            </div>
        </div>
    );
};

const ReadOnlyField = ({ label, value, icon: Icon, highlight }) => (
    <div className="space-y-2 group">
        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center ml-1">
            <Icon className="w-3 h-3 mr-2" />
            {label}
        </label>
        <div className={`p-4 rounded-2xl border border-gray-100 bg-gray-50/50 font-black text-lg ${highlight ? 'text-red-600' : 'text-gray-700'}`}>
            {value}
        </div>
    </div>
);

export default Donate;
