import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Loader2 } from 'lucide-react';

const ManageMyStock = () => {
    const navigate = useNavigate();
    const user = JSON.parse(sessionStorage.getItem('user'));

    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [originalStock, setOriginalStock] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [stock, setStock] = useState({
        username: user?.username || '',
        name: '',
        unitsA: 0,
        unitsB: 0,
        unitsO: 0,
        unitsAB: 0
    });

    useEffect(() => {
        if (!user || user.role !== 'HOSPITAL') {
            navigate('/dashboard');
            return;
        }
        fetchStock();
    }, []);

    const fetchStock = async () => {
        try {
            setLoading(true);
            setError('');
            const res = await axios.get(`http://localhost:5000/api/auth/my-stock/${user.username}`);
            const data = {
                username: user.username,
                name: res.data.name,
                unitsA: res.data.unitsA,
                unitsB: res.data.unitsB,
                unitsO: res.data.unitsO,
                unitsAB: res.data.unitsAB
            };
            setStock(data);
            setOriginalStock(data);
        } catch (err) {
            console.error(err);
            setError('Error connecting to server. Please ensure the backend is running.');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setUpdating(true);
        setError('');
        setSuccess('');
        try {
            await axios.post('http://localhost:5000/api/auth/update-stock', stock);
            setOriginalStock(stock); // Update the left side display
            setSuccess('Inventory updated successfully!');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError('Failed to update inventory.');
        } finally {
            setUpdating(false);
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[400px]">
            <Loader2 className="w-10 h-10 text-red-600 animate-spin" />
            <p className="mt-4 text-gray-500 font-medium">Loading Inventory...</p>
        </div>
    );

    return (
        <div className="min-h-full py-10 bg-gray-50/50 flex items-center justify-center">
            <div className="max-w-5xl w-full px-6 flex flex-col lg:flex-row gap-8 items-start">
                
                {/* Current Stock Display Card */}
                <div className="w-full lg:w-1/3 bg-white p-8 rounded-2xl shadow-sm border border-gray-100 h-full">
                    <div className="mb-8">
                        <h2 className="text-xl font-black text-gray-800">Current Inventory</h2>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Live from Database</p>
                    </div>
                    
                    <div className="space-y-4">
                        <DisplayRow label="A Positive" value={originalStock?.unitsA} color="text-red-600" />
                        <DisplayRow label="B Positive" value={originalStock?.unitsB} color="text-red-600" />
                        <DisplayRow label="O Positive" value={originalStock?.unitsO} color="text-red-600" />
                        <DisplayRow label="AB Positive" value={originalStock?.unitsAB} color="text-red-600" />
                    </div>

                    <div className="mt-8 pt-6 border-t border-gray-50 text-center">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                            Last fetched: {new Date().toLocaleTimeString()}
                        </p>
                    </div>
                </div>

                {/* Edit Form Card */}
                <div className="flex-1 bg-white p-8 lg:p-12 rounded-2xl shadow-sm border border-gray-100">
                    <div className="mb-10">
                        <h1 className="text-3xl font-bold text-gray-800 mb-2 text-center lg:text-left">Update Inventory</h1>
                        <p className="text-gray-400 font-medium text-center lg:text-left">{stock.name || user.username} Hospital</p>
                    </div>

                    {error && (
                        <div className="mb-8 p-4 bg-red-50 border border-red-100 text-red-700 rounded-xl flex items-center justify-center space-x-2 text-sm font-bold">
                            <AlertCircle className="w-4 h-4" />
                            <span>{error}</span>
                        </div>
                    )}

                    {success && (
                        <div className="mb-8 p-4 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-xl text-sm font-bold text-center">
                            {success}
                        </div>
                    )}

                    <form onSubmit={handleSave} className="space-y-6">
                        <div className="space-y-4">
                            <Row label="Group A" value={stock.unitsA} onChange={(v) => setStock({ ...stock, unitsA: v })} />
                            <Row label="Group B" value={stock.unitsB} onChange={(v) => setStock({ ...stock, unitsB: v })} />
                            <Row label="Group O" value={stock.unitsO} onChange={(v) => setStock({ ...stock, unitsO: v })} />
                            <Row label="Group AB" value={stock.unitsAB} onChange={(v) => setStock({ ...stock, unitsAB: v })} />
                        </div>

                        <div className="pt-8 space-y-4">
                            <button
                                type="submit"
                                disabled={updating}
                                className="w-full py-4 bg-red-600 text-white rounded-xl font-bold text-lg shadow-lg hover:bg-red-700 transition-all flex items-center justify-center cursor-pointer"
                            >
                                {updating ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Save Changes'}
                            </button>

                            <button
                                type="button"
                                onClick={() => navigate('/dashboard')}
                                className="w-full text-gray-400 font-bold hover:text-gray-600 transition-colors py-2 text-sm cursor-pointer"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

const DisplayRow = ({ label, value, color }) => (
    <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl border border-gray-100/50">
        <span className="text-sm font-bold text-gray-500 uppercase tracking-tight">{label}</span>
        <div className="flex items-baseline space-x-1">
            <span className={`text-2xl font-black ${color}`}>{value || 0}</span>
            <span className="text-[10px] font-bold text-gray-400 uppercase">Units</span>
        </div>
    </div>
);

const Row = ({ label, value, onChange }) => (
    <div className="flex items-center justify-between">
        <label className="text-gray-700 font-bold text-sm tracking-wide">{label}</label>
        <div className="w-32">
            <input
                type="number"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full bg-white border border-gray-200 py-3 px-4 rounded-lg font-bold text-center text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
            />
        </div>
    </div>
);

export default ManageMyStock;
