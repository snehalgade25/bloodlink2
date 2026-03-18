import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
    Search,
    Hospital,
    Droplet,
    ChevronRight,
    Building2,
    Users,
    Phone,
    MapPin,
    ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

const Stock = () => {
    const [activeTab, setActiveTab] = useState('hospitals');
    const [hospitals, setHospitals] = useState([]);
    const [bloodBanks, setBloodBanks] = useState([]);
    const [donors, setDonors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [hRes, bRes, dRes] = await Promise.all([
                    axios.get('http://localhost:5000/api/hospitals'),
                    axios.get('http://localhost:5000/api/bloodbanks'),
                    axios.get('http://localhost:5000/api/donors')
                ]);
                setHospitals(hRes.data);
                setBloodBanks(bRes.data);
                setDonors(dRes.data);
            } catch (err) {
                console.error("Error fetching data:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const filteredDonors = donors.filter(d =>
        d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.bloodGroup.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredHospitals = hospitals.filter(h =>
        h.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        h.location.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredBanks = bloodBanks.filter(b =>
        b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.location.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <Droplet className="w-12 h-12 text-red-600 animate-bounce fill-current" />
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header & Tabs */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                <div className="flex bg-gray-100 p-1 rounded-2xl w-fit">
                    <TabBtn active={activeTab === 'hospitals'} onClick={() => setActiveTab('hospitals')} icon={Hospital} label="Hospitals" />
                    <TabBtn active={activeTab === 'banks'} onClick={() => setActiveTab('banks')} icon={Building2} label="Blood Banks" />
                    <TabBtn active={activeTab === 'donors'} onClick={() => setActiveTab('donors')} icon={Users} label="Donors" />
                </div>

                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search by name, location or group..."
                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-500 transition-all font-medium"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Content Area */}
            <div className="min-h-[500px]">
                {activeTab === 'hospitals' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                        {filteredHospitals.map(hospital => (
                            <InventoryCard
                                key={hospital._id}
                                title={hospital.name}
                                location={hospital.location}
                                status={hospital.status}
                                stocks={{ A: hospital.unitsA, B: hospital.unitsB, O: hospital.unitsO, AB: hospital.unitsAB }}
                                link={`/hospital/${hospital._id}`}
                                icon={Hospital}
                            />
                        ))}
                    </div>
                )}

                {activeTab === 'banks' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                        {filteredBanks.map(bank => (
                            <InventoryCard
                                key={bank._id}
                                title={bank.name}
                                location={bank.location}
                                contact={bank.contact}
                                status={bank.status === 'Open' ? 'Stable' : 'Critical'}
                                stocks={{ A: bank.unitsA, B: bank.unitsB, O: bank.unitsO, AB: bank.unitsAB }}
                                icon={Building2}
                            />
                        ))}
                    </div>
                )}

                {activeTab === 'donors' && (
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 text-gray-400 text-xs font-black uppercase tracking-widest border-b border-gray-50">
                                <tr>
                                    <th className="px-8 py-5">Donor Profile</th>
                                    <th className="px-8 py-5 text-center">Blood Type</th>
                                    <th className="px-8 py-5">Age</th>
                                    <th className="px-8 py-5">Contact</th>
                                    <th className="px-8 py-5 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredDonors.map(donor => (
                                    <tr key={donor._id} className="group hover:bg-gray-50 transition-colors">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-600 font-black">
                                                    {donor.name[0]}
                                                </div>
                                                <span className="font-bold text-gray-800">{donor.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <span className="px-4 py-1.5 bg-red-600 text-white rounded-xl text-sm font-black shadow-sm">
                                                {donor.bloodGroup}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 font-bold text-gray-500">{donor.age} yrs</td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center space-x-2 text-gray-600 font-medium">
                                                <Phone className="w-4 h-4 text-gray-300" />
                                                <span>{donor.contactInfo}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <button className="p-2 bg-gray-100 text-gray-400 rounded-lg group-hover:bg-red-600 group-hover:text-white transition-all">
                                                <ArrowRight className="w-5 h-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

const TabBtn = ({ active, onClick, icon: Icon, label }) => (
    <button
        onClick={onClick}
        className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-black text-sm transition-all ${active
                ? 'bg-white text-red-600 shadow-md transform scale-[1.02] border border-gray-200'
                : 'text-gray-500 hover:text-gray-900'
            }`}
    >
        <Icon className={`w-5 h-5 ${active ? 'text-red-600' : 'text-gray-400'}`} />
        <span>{label}</span>
    </button>
);

const InventoryCard = ({ title, location, contact, status, stocks, link, icon: Icon }) => (
    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all group overflow-hidden relative">
        <div className={`absolute top-0 right-0 px-4 py-1.5 rounded-bl-2xl text-[10px] font-black uppercase tracking-widest ${status === 'Stable' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
            }`}>
            {status}
        </div>

        <div className="flex items-center space-x-4 mb-6">
            <div className="p-4 bg-gray-50 rounded-2xl group-hover:bg-red-50 group-hover:text-red-600 transition-colors">
                <Icon className="w-6 h-6" />
            </div>
            <div>
                <h3 className="font-black text-gray-800 tracking-tight leading-none mb-2">{title}</h3>
                <div className="flex items-center text-gray-400 text-sm font-bold">
                    <MapPin className="w-3.5 h-3.5 mr-1" />
                    {location}
                </div>
            </div>
        </div>

        <div className="grid grid-cols-4 gap-2 mb-6">
            {Object.entries(stocks).map(([type, value]) => (
                <div key={type} className="bg-gray-50 p-2 rounded-xl text-center border border-gray-100">
                    <div className="text-[10px] font-black text-gray-300 uppercase leading-none mb-1">{type}</div>
                    <div className="text-lg font-black text-gray-800 leading-none">{value}</div>
                </div>
            ))}
        </div>

        {link ? (
            <Link to={link} className="flex items-center justify-between w-full py-4 px-1 rounded-2xl group/btn">
                <span className="text-sm font-extrabold text-red-600 uppercase tracking-widest">Full Inventory</span>
                <ChevronRight className="w-5 h-5 text-red-600 group-hover/btn:translate-x-1 transition-transform" />
            </Link>
        ) : contact ? (
            <div className="flex items-center space-x-2 text-sm font-black text-gray-500 bg-gray-50 p-3 rounded-2xl border border-gray-100">
                <Phone className="w-4 h-4 text-red-500" />
                <span>{contact}</span>
            </div>
        ) : null}
    </div>
);

export default Stock;
