import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import {
    Droplet,
    Lock,
    User as UserIcon,
    Mail,
    Phone,
    HeartHandshake,
    Hospital as HospitalIcon,
    MapPin,
    Calendar,
    ArrowRight,
    ShieldCheck
} from 'lucide-react';

const Register = () => {
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        email: '',
        phone: '',
        role: 'DONOR',
        fullName: '',
        bloodGroup: '',
        age: '',
        location: '',
        adminKey: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const setRole = (newRole) => {
        setError('');
        setFormData({
            ...formData,
            role: newRole,
            // Clear role-specific fields when switching
            bloodGroup: '',
            age: '',
            location: '',
            adminKey: ''
        });
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');

        // Manual validation for role-specific required fields
        if (formData.role === 'DONOR') {
            if (!formData.bloodGroup) { setError('Please select your blood group.'); return; }
            if (!formData.age || Number(formData.age) < 18) { setError('You must be at least 18 years old to donate.'); return; }
        }
        if (formData.role === 'HOSPITAL') {
            if (!formData.location.trim()) { setError('Please enter the hospital location.'); return; }
        }
        if (formData.role === 'ADMIN') {
            if (formData.adminKey !== 'BLOODLINK_ADMIN') {
                setError('Invalid Admin Secret Key. Please contact the system administrator.');
                return;
            }
        }

        setLoading(true);
        try {
            await axios.post('http://localhost:5000/api/auth/register', formData);
            navigate('/login');
        } catch (err) {
            setError(err.response?.data?.error || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const roleColor = formData.role === 'DONOR' ? 'red' : formData.role === 'ADMIN' ? 'purple' : 'blue';
    const ringColor = { red: 'focus:ring-red-500', blue: 'focus:ring-blue-500', purple: 'focus:ring-purple-500' }[roleColor];
    const inputClasses = `appearance-none block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl bg-gray-50 placeholder-gray-400 focus:outline-none focus:ring-2 ${ringColor} transition-all font-medium`;
    const btnColor = { red: 'bg-red-600 hover:bg-red-700', blue: 'bg-blue-600 hover:bg-blue-700', purple: 'bg-purple-600 hover:bg-purple-700' }[roleColor];

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
            <div className="sm:mx-auto sm:w-full sm:max-w-2xl text-center">
                <div className="inline-flex p-3 bg-red-100 rounded-2xl mb-4 shadow-sm">
                    <Droplet className="h-10 w-10 text-red-600 fill-current" />
                </div>
                <h2 className="text-4xl font-black text-gray-900 tracking-tight">
                    Join <span className="text-red-600">BloodLink</span>
                </h2>
                <p className="mt-2 text-sm font-bold text-gray-500 uppercase tracking-widest">
                    Create your lifesaver profile
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-2xl">
                <div className="bg-white py-10 px-6 shadow-2xl rounded-3xl border border-gray-100">

                    {/* Role Selection Tabs */}
                    <div className="flex bg-gray-100 p-1.5 rounded-2xl mb-8">
                        <button
                            type="button"
                            onClick={() => setRole('DONOR')}
                            className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-xl font-bold transition-all duration-300 ${
                                formData.role === 'DONOR'
                                    ? 'bg-white text-red-600 shadow-md transform scale-[1.02]'
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            <HeartHandshake className="w-5 h-5" />
                            <span>Become a Donor</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setRole('HOSPITAL')}
                            className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-xl font-bold transition-all duration-300 ${
                                formData.role === 'HOSPITAL'
                                    ? 'bg-white text-blue-600 shadow-md transform scale-[1.02]'
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            <HospitalIcon className="w-5 h-5" />
                            <span>Hospital Portal</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setRole('ADMIN')}
                            className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-xl font-bold transition-all duration-300 ${
                                formData.role === 'ADMIN'
                                    ? 'bg-white text-purple-600 shadow-md transform scale-[1.02]'
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            <ShieldCheck className="w-5 h-5" />
                            <span>Admin Account</span>
                        </button>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-700 rounded-xl text-sm font-bold text-center animate-pulse">
                            {error}
                        </div>
                    )}

                    <form className="grid grid-cols-1 md:grid-cols-2 gap-6" onSubmit={handleRegister}>

                        {/* LEFT: Account Details — same for all roles */}
                        <div className="space-y-6">
                            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest border-b pb-2">Account Details</h3>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Username</label>
                                <div className="relative">
                                    <UserIcon className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                                    <input name="username" type="text" required value={formData.username} onChange={handleChange} className={inputClasses} placeholder="Choose username" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                                    <input name="email" type="email" required value={formData.email} onChange={handleChange} className={inputClasses} placeholder="your@email.com" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                                    <input name="password" type="password" required value={formData.password} onChange={handleChange} className={inputClasses} placeholder="••••••••" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Contact Number</label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                                    <input name="phone" type="text" required value={formData.phone} onChange={handleChange} className={inputClasses} placeholder="+91 XXXXX XXXXX" />
                                </div>
                            </div>
                        </div>

                        {/* RIGHT: Profile Details — changes per role */}
                        <div className="space-y-6">
                            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest border-b pb-2">Profile Details</h3>

                            {/* Full Name — all roles */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">
                                    {formData.role === 'DONOR' ? 'Full Name' : formData.role === 'ADMIN' ? 'Admin Full Name' : 'Hospital Name'}
                                </label>
                                <div className="relative">
                                    <UserIcon className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                                    <input
                                        name="fullName"
                                        type="text"
                                        required
                                        value={formData.fullName}
                                        onChange={handleChange}
                                        className={inputClasses}
                                        placeholder={
                                            formData.role === 'DONOR' ? 'As per ID'
                                            : formData.role === 'ADMIN' ? 'Your full name'
                                            : 'Legal hospital name'
                                        }
                                    />
                                </div>
                            </div>

                            {/* DONOR-specific */}
                            {formData.role === 'DONOR' && (
                                <>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Blood Group</label>
                                        <div className="relative">
                                            <Droplet className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                                            <select
                                                name="bloodGroup"
                                                value={formData.bloodGroup}
                                                onChange={handleChange}
                                                className={`${inputClasses} pl-10 cursor-pointer`}
                                            >
                                                <option value="">Select Group</option>
                                                {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(bg => (
                                                    <option key={bg} value={bg}>{bg}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Age</label>
                                        <div className="relative">
                                            <Calendar className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                                            <input
                                                name="age"
                                                type="number"
                                                min="18"
                                                max="65"
                                                value={formData.age}
                                                onChange={handleChange}
                                                className={inputClasses}
                                                placeholder="Min 18 yrs"
                                            />
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* HOSPITAL-specific */}
                            {formData.role === 'HOSPITAL' && (
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Hospital Location</label>
                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                                        <input
                                            name="location"
                                            type="text"
                                            value={formData.location}
                                            onChange={handleChange}
                                            className={inputClasses}
                                            placeholder="Area, City (e.g. Thane West)"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* ADMIN-specific */}
                            {formData.role === 'ADMIN' && (
                                <>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Admin Secret Key</label>
                                        <div className="relative">
                                            <ShieldCheck className="absolute left-3 top-3.5 h-5 w-5 text-purple-400" />
                                            <input
                                                name="adminKey"
                                                type="password"
                                                value={formData.adminKey}
                                                onChange={handleChange}
                                                className={inputClasses}
                                                placeholder="Enter admin secret key"
                                            />
                                        </div>
                                        <p className="mt-1.5 text-xs text-gray-400 font-medium">
                                            Required to create an admin account.
                                        </p>
                                    </div>
                                    <div className="p-4 bg-purple-50 border border-purple-100 rounded-xl">
                                        <p className="text-xs font-black text-purple-600 uppercase tracking-widest mb-1">Admin Access</p>
                                        <p className="text-xs text-purple-500 font-medium">
                                            Admin accounts have full access to manage users, donors, hospitals, and all system data.
                                        </p>
                                    </div>
                                </>
                            )}

                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className={`w-full flex items-center justify-center space-x-2 py-4 px-4 border border-transparent rounded-2xl shadow-xl text-white font-black text-lg transition-all transform hover:-translate-y-1 active:scale-95 ${btnColor} ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    {loading ? (
                                        <span>Saving...</span>
                                    ) : (
                                        <>
                                            <span>Complete Registration</span>
                                            <ArrowRight className="w-5 h-5" />
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </form>

                    <div className="mt-10 pt-8 border-t border-gray-100 text-center">
                        <p className="text-gray-500 font-medium">
                            Already have an account?{' '}
                            <Link to="/login" className="text-red-600 font-black hover:underline underline-offset-4">
                                Log in here
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
