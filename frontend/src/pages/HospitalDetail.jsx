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
    ShieldCheck
} from 'lucide-react';

const HospitalDetail = () => {
    const { id } = useParams();
    const [h, setH] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchHospital();
    }, [id]);

    const fetchHospital = async () => {
        try {
            const res = await axios.get(`http://localhost:5000/api/hospital/${id}`);
            setH(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

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

                        <Link to="/request" className="w-full mt-8 bg-red-600 text-white font-bold py-3 rounded-xl hover:bg-red-700 transition-colors shadow-lg shadow-red-200 flex items-center justify-center">
                            Request from this Hospital
                        </Link>
                    </div>
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
