import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    Award, 
    Loader2, 
    CreditCard, 
    Star, 
    Shield,
    Zap,
    Heart,
    Droplet,
    CheckCircle
} from 'lucide-react';

const Cards = () => {
    const user = JSON.parse(sessionStorage.getItem('user'));
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await axios.get(`http://localhost:5000/api/auth/my-profile/${user.username}`);
                setProfile(res.data);
            } catch (err) {
                console.error('Error fetching profile:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [user.username]);

    // Generate unique card number from username + hospital
    const generateCardNumber = (username, hospital) => {
        let hash = 0;
        const str = `${username}-${hospital}-BLOODLINK`;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        const num = Math.abs(hash);
        const part1 = String(num).slice(0, 4).padStart(4, '0');
        const part2 = String(num).slice(4, 8).padStart(4, '0');
        const part3 = String(num).slice(8, 12).padStart(4, '0');
        const checkDigit = (parseInt(part1) + parseInt(part2) + parseInt(part3)) % 97;
        return `BL-${part1}-${part2}-${part3}-${String(checkDigit).padStart(2, '0')}`;
    };

    const getCardTier = (count) => {
        if (count >= 8) return { tier: 'Elite', color: 'from-purple-600 via-violet-500 to-indigo-600', discount: '15%', icon: '👑', bgAccent: 'bg-purple-300/20', labelColor: 'text-purple-200', borderColor: 'border-purple-300/30' };
        if (count >= 5) return { tier: 'Gold', color: 'from-yellow-600 via-amber-500 to-orange-500', discount: '10%', icon: '⭐', bgAccent: 'bg-orange-300/20', labelColor: 'text-orange-200', borderColor: 'border-orange-300/30' };
        if (count >= 2) return { tier: 'Silver', color: 'from-slate-400 via-gray-300 to-slate-500', discount: '5%', icon: '🥈', bgAccent: 'bg-white/20', labelColor: 'text-slate-200', borderColor: 'border-white/30' };
        return null;
    };

    // Build cards from profile
    let priorityCards = [];
    let totalDonations = profile?.donations?.length || 0;
    let nextTierInfo = null;

    if (profile?.donations?.length > 0) {
        const hCounts = {};
        profile.donations.forEach(d => {
            if (d.hospitalName) {
                hCounts[d.hospitalName] = (hCounts[d.hospitalName] || 0) + 1;
            }
        });

        const sorted = [...profile.donations].sort((a,b) => new Date(b.date) - new Date(a.date));

        Object.entries(hCounts).forEach(([hospital, count]) => {
            const tierInfo = getCardTier(count);
            if (tierInfo) {
                priorityCards.push({
                    hospital,
                    count,
                    ...tierInfo,
                    cardNumber: generateCardNumber(user.username, hospital),
                    holderName: profile?.name || user.username,
                    bloodGroup: profile?.bloodGroup || 'N/A',
                    issueDate: sorted.find(d => d.hospitalName === hospital)?.date || new Date()
                });
            }
        });

        priorityCards.sort((a, b) => {
            const order = { 'Elite': 3, 'Gold': 2, 'Silver': 1 };
            return (order[b.tier] || 0) - (order[a.tier] || 0);
        });

        // Calculate next tier progress
        const maxCount = Math.max(...Object.values(hCounts));
        if (maxCount < 2) nextTierInfo = { next: 'Silver', need: 2 - maxCount, current: maxCount };
        else if (maxCount < 5) nextTierInfo = { next: 'Gold', need: 5 - maxCount, current: maxCount };
        else if (maxCount < 8) nextTierInfo = { next: 'Elite', need: 8 - maxCount, current: maxCount };
    }

    // Download card as PNG
    const downloadCard = (card) => {
        const canvas = document.createElement('canvas');
        canvas.width = 600;
        canvas.height = 340;
        const ctx = canvas.getContext('2d');

        const colors = {
            'Elite': ['#7C3AED', '#8B5CF6', '#4C1D95'],
            'Gold': ['#EAB308', '#F97316', '#C2410C'],
            'Silver': ['#94A3B8', '#CBD5E1', '#64748B']
        };
        const [c1, c2, c3] = colors[card.tier] || colors['Silver'];
        const grad = ctx.createLinearGradient(0, 0, 600, 340);
        grad.addColorStop(0, c1);
        grad.addColorStop(0.5, c2);
        grad.addColorStop(1, c3);
        ctx.fillStyle = grad;
        ctx.roundRect(0, 0, 600, 340, 20);
        ctx.fill();

        ctx.fillStyle = 'rgba(255,255,255,0.05)';
        for (let i = 0; i < 600; i += 30) {
            ctx.beginPath();
            ctx.arc(i, 170, 80, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('BLOODLINK', 30, 40);

        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.font = '10px Arial';
        ctx.textAlign = 'right';
        ctx.fillText('PRIORITY DONOR CARD', 570, 35);
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.font = 'bold 22px Arial';
        ctx.fillText(`${card.tier.toUpperCase()} TIER`, 570, 58);

        ctx.fillStyle = 'rgba(255,255,255,1)';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(card.hospital, 30, 90);

        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.font = '16px monospace';
        ctx.fillText(card.cardNumber, 30, 140);

        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.font = '10px Arial';
        ctx.fillText('CARD HOLDER', 30, 190);
        ctx.fillStyle = 'rgba(255,255,255,1)';
        ctx.font = 'bold 18px Arial';
        ctx.fillText(card.holderName, 30, 212);

        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.font = '10px Arial';
        ctx.fillText('BLOOD GROUP', 300, 190);
        ctx.fillStyle = 'rgba(255,255,255,1)';
        ctx.font = 'bold 18px Arial';
        ctx.fillText(card.bloodGroup, 300, 212);

        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.font = '10px Arial';
        ctx.fillText('DONATIONS', 450, 190);
        ctx.fillStyle = 'rgba(255,255,255,1)';
        ctx.font = 'bold 18px Arial';
        ctx.fillText(`${card.count}`, 450, 212);

        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.roundRect(20, 250, 560, 70, 12);
        ctx.fill();

        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.font = 'bold 11px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`✦ ${card.discount} Discount on Emergency Services  ·  Priority Treatment  ·  Fast-Track Access`, 300, 275);
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.font = '9px Arial';
        ctx.fillText(`Valid from ${new Date(card.issueDate).toLocaleDateString()} · Verified by BloodLink`, 300, 298);

        const link = document.createElement('a');
        link.download = `BloodLink_${card.tier}_Card_${card.holderName.replace(/\s+/g, '_')}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <Loader2 className="w-10 h-10 text-red-600 animate-spin" />
                <p className="mt-4 font-bold text-gray-400">Loading your cards...</p>
            </div>
        );
    }

    // Tier showcase card previews
    const tierShowcase = [
        {
            tier: 'Silver',
            icon: '🥈',
            donations: '2+',
            discount: '5%',
            gradient: 'from-slate-400 via-gray-300 to-slate-500',
            benefits: ['5% discount on emergency services', 'Basic priority queue access', 'Digital donor card'],
            labelColor: 'text-slate-200',
            bgAccent: 'bg-white/20',
            borderColor: 'border-white/30',
            sampleName: profile?.name || 'Donor Name',
            sampleBlood: profile?.bloodGroup || 'O+',
            sampleNumber: 'BL-XXXX-XXXX-XXXX-XX'
        },
        {
            tier: 'Gold',
            icon: '⭐',
            donations: '5+',
            discount: '10%',
            gradient: 'from-yellow-600 via-amber-500 to-orange-500',
            benefits: ['10% discount on all hospital services', 'Priority treatment access', 'Dedicated helpline support'],
            labelColor: 'text-orange-200',
            bgAccent: 'bg-orange-300/20',
            borderColor: 'border-orange-300/30',
            sampleName: profile?.name || 'Donor Name',
            sampleBlood: profile?.bloodGroup || 'O+',
            sampleNumber: 'BL-XXXX-XXXX-XXXX-XX'
        },
        {
            tier: 'Elite',
            icon: '👑',
            donations: '8+',
            discount: '15%',
            gradient: 'from-purple-600 via-violet-500 to-indigo-600',
            benefits: ['15% discount + fast-track access', 'Highest priority in emergencies', 'VIP treatment & dedicated care'],
            labelColor: 'text-purple-200',
            bgAccent: 'bg-purple-300/20',
            borderColor: 'border-purple-300/30',
            sampleName: profile?.name || 'Donor Name',
            sampleBlood: profile?.bloodGroup || 'O+',
            sampleNumber: 'BL-XXXX-XXXX-XXXX-XX'
        }
    ];

    return (
        <div className="space-y-10 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-800 flex items-center space-x-3">
                        <CreditCard className="w-8 h-8 text-amber-500" />
                        <span>My Priority Cards</span>
                    </h1>
                    <p className="text-gray-400 mt-1 text-sm font-bold">
                        Earn cards by donating at the same hospital. Higher tiers unlock better benefits.
                    </p>
                </div>
                <div className="flex items-center space-x-3">
                    <div className="bg-white rounded-2xl px-5 py-3 border border-gray-100 shadow-sm text-center">
                        <p className="text-2xl font-black text-gray-800">{totalDonations}</p>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Donations</p>
                    </div>
                    <div className="bg-white rounded-2xl px-5 py-3 border border-gray-100 shadow-sm text-center">
                        <p className="text-2xl font-black text-amber-500">{priorityCards.length}</p>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Active Cards</p>
                    </div>
                </div>
            </div>

            {/* Next Tier Progress */}
            {nextTierInfo && (
                <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="font-black text-gray-700 text-sm flex items-center space-x-2">
                            <Zap className="w-4 h-4 text-amber-500" />
                            <span>Next Tier: {nextTierInfo.next}</span>
                        </h3>
                        <span className="text-xs font-bold text-gray-400">{nextTierInfo.need} more donation{nextTierInfo.need > 1 ? 's' : ''} needed at the same hospital</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                        <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                                nextTierInfo.next === 'Silver' ? 'bg-slate-400' :
                                nextTierInfo.next === 'Gold' ? 'bg-yellow-500' : 'bg-purple-500'
                            }`}
                            style={{ width: `${(nextTierInfo.current / (nextTierInfo.current + nextTierInfo.need)) * 100}%` }}
                        ></div>
                    </div>
                </div>
            )}

            {/* My Active Cards */}
            {priorityCards.length > 0 ? (
                <div className="space-y-4">
                    <h2 className="text-lg font-black text-gray-700 flex items-center space-x-2">
                        <Shield className="w-5 h-5 text-green-500" />
                        <span>Your Active Cards</span>
                        <span className="ml-2 bg-green-50 text-green-600 px-2 py-0.5 rounded-full text-xs font-black">{priorityCards.length} ACTIVE</span>
                    </h2>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {priorityCards.map((card, idx) => (
                            <div key={idx} className="space-y-3">
                                {/* Card */}
                                <div className={`bg-gradient-to-br ${card.color} rounded-3xl p-6 text-white shadow-xl relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300`}>
                                    <div className="absolute -right-10 -top-10 rounded-full w-40 h-40 bg-white opacity-10 blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                                    <div className="absolute -left-5 -bottom-5 rounded-full w-32 h-32 bg-white opacity-5 blur-xl"></div>
                                    <div className="absolute top-4 left-0 w-full h-px bg-white/10"></div>
                                    
                                    <div className="flex justify-between items-start mb-1 relative z-10">
                                        <div>
                                            <p className={`${card.labelColor} text-[10px] font-black uppercase tracking-[0.2em] mb-0.5`}>BLOODLINK · Priority Donor</p>
                                            <h3 className="text-xl font-black drop-shadow-sm">{card.hospital}</h3>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-3xl drop-shadow-md">{card.icon}</span>
                                            <p className={`text-[10px] font-black uppercase tracking-wider ${card.labelColor}`}>{card.tier} Tier</p>
                                        </div>
                                    </div>
                                    
                                    <div className={`${card.bgAccent} backdrop-blur-sm border ${card.borderColor} rounded-xl px-4 py-2 mb-4 inline-block`}>
                                        <p className="font-mono text-sm font-bold tracking-wider drop-shadow-sm">{card.cardNumber}</p>
                                    </div>
                                    
                                    <div className="grid grid-cols-3 gap-4 mb-4 relative z-10">
                                        <div>
                                            <p className={`${card.labelColor} text-[9px] font-black uppercase tracking-widest mb-0.5`}>Card Holder</p>
                                            <p className="font-bold text-sm drop-shadow-sm">{card.holderName}</p>
                                        </div>
                                        <div>
                                            <p className={`${card.labelColor} text-[9px] font-black uppercase tracking-widest mb-0.5`}>Blood Group</p>
                                            <p className="font-bold text-sm drop-shadow-sm">{card.bloodGroup}</p>
                                        </div>
                                        <div>
                                            <p className={`${card.labelColor} text-[9px] font-black uppercase tracking-widest mb-0.5`}>Donations</p>
                                            <p className="font-bold text-sm drop-shadow-sm">{card.count} Completed</p>
                                        </div>
                                    </div>
                                    
                                    <div className="bg-black/15 backdrop-blur-sm rounded-xl px-4 py-3 relative z-10">
                                        <div className="flex items-center space-x-4 text-[10px] font-bold">
                                            <span>✦ {card.discount} Emergency Discount</span>
                                            <span>·</span>
                                            <span>Priority Treatment</span>
                                            <span>·</span>
                                            <span>Fast-Track Access</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Download Button Only */}
                                <button 
                                    onClick={() => downloadCard(card)}
                                    className="w-full py-3 bg-white border border-gray-200 text-gray-700 font-black text-xs uppercase tracking-widest rounded-xl hover:bg-gray-50 transition-all active:scale-95 flex items-center justify-center space-x-2"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                    <span>Download Card</span>
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="bg-white border-2 border-dashed border-gray-100 rounded-[2.5rem] p-16 text-center">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CreditCard className="w-10 h-10 text-gray-200" />
                    </div>
                    <h3 className="text-xl font-black text-gray-400">No Priority Cards Yet</h3>
                    <p className="text-gray-400 mt-2 max-w-sm mx-auto text-sm">
                        Donate at least 2 times at the same hospital to unlock your first Silver card!
                    </p>
                </div>
            )}

            {/* All Card Tiers - Full Card Previews */}
            <div className="space-y-5">
                <h2 className="text-lg font-black text-gray-700 flex items-center space-x-2">
                    <Star className="w-5 h-5 text-yellow-500" />
                    <span>All Card Tiers</span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {tierShowcase.map((t, idx) => {
                        const isUnlocked = priorityCards.some(c => c.tier === t.tier);
                        return (
                            <div key={idx} className={`space-y-4 transition-all duration-300 ${isUnlocked ? '' : 'opacity-75 hover:opacity-100'}`}>
                                {/* Full card preview */}
                                <div className={`relative rounded-3xl overflow-hidden ${isUnlocked ? 'ring-2 ring-green-400 ring-offset-2' : ''}`}>
                                    {/* Lock overlay for locked tiers */}
                                    {!isUnlocked && (
                                        <div className="absolute inset-0 z-20 bg-black/10 backdrop-blur-[1px] flex items-center justify-center">
                                            <div className="bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg flex items-center space-x-2">
                                                <span className="text-lg">🔒</span>
                                                <span className="font-black text-gray-600 text-xs uppercase tracking-widest">{t.donations} Donations to unlock</span>
                                            </div>
                                        </div>
                                    )}
                                    {isUnlocked && (
                                        <div className="absolute top-3 right-3 z-20 bg-green-500 text-white text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center space-x-1 shadow-lg">
                                            <CheckCircle className="w-3 h-3" />
                                            <span>Unlocked</span>
                                        </div>
                                    )}
                                    
                                    <div className={`bg-gradient-to-br ${t.gradient} rounded-3xl p-5 text-white relative overflow-hidden`}>
                                        <div className="absolute -right-8 -top-8 rounded-full w-32 h-32 bg-white opacity-10 blur-2xl"></div>
                                        <div className="absolute -left-4 -bottom-4 rounded-full w-24 h-24 bg-white opacity-5 blur-xl"></div>
                                        
                                        <div className="flex justify-between items-start mb-1 relative z-10">
                                            <div>
                                                <p className={`${t.labelColor} text-[8px] font-black uppercase tracking-[0.2em] mb-0.5`}>BLOODLINK · Priority Donor</p>
                                                <h3 className="text-base font-black drop-shadow-sm">Hospital Name</h3>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-2xl drop-shadow-md">{t.icon}</span>
                                                <p className={`text-[8px] font-black uppercase tracking-wider ${t.labelColor}`}>{t.tier} Tier</p>
                                            </div>
                                        </div>
                                        
                                        <div className={`${t.bgAccent} backdrop-blur-sm border ${t.borderColor} rounded-lg px-3 py-1.5 mb-3 inline-block`}>
                                            <p className="font-mono text-xs font-bold tracking-wider drop-shadow-sm">{t.sampleNumber}</p>
                                        </div>
                                        
                                        <div className="grid grid-cols-3 gap-3 mb-3 relative z-10">
                                            <div>
                                                <p className={`${t.labelColor} text-[7px] font-black uppercase tracking-widest mb-0.5`}>Card Holder</p>
                                                <p className="font-bold text-xs drop-shadow-sm">{t.sampleName}</p>
                                            </div>
                                            <div>
                                                <p className={`${t.labelColor} text-[7px] font-black uppercase tracking-widest mb-0.5`}>Blood Group</p>
                                                <p className="font-bold text-xs drop-shadow-sm">{t.sampleBlood}</p>
                                            </div>
                                            <div>
                                                <p className={`${t.labelColor} text-[7px] font-black uppercase tracking-widest mb-0.5`}>Donations</p>
                                                <p className="font-bold text-xs drop-shadow-sm">{t.donations}</p>
                                            </div>
                                        </div>
                                        
                                        <div className="bg-black/15 backdrop-blur-sm rounded-lg px-3 py-2 relative z-10">
                                            <p className="text-[8px] font-bold text-center">✦ {t.discount} Emergency Discount · Priority Treatment · Fast-Track</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Benefits list */}
                                <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                                    <div className="flex items-center space-x-2 mb-3">
                                        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${t.gradient} flex items-center justify-center text-white text-xs font-black`}>
                                            {t.discount}
                                        </div>
                                        <div>
                                            <span className="font-black text-gray-700 text-sm">{t.tier} Card</span>
                                            <p className="text-[10px] text-gray-400 font-bold">{t.donations} donations at same hospital</p>
                                        </div>
                                    </div>
                                    <ul className="space-y-2">
                                        {t.benefits.map((b, i) => (
                                            <li key={i} className="flex items-center space-x-2 text-sm text-gray-600">
                                                <Heart className="w-3 h-3 text-red-400 fill-current flex-shrink-0" />
                                                <span className="font-medium">{b}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* How It Works */}
            <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-100 rounded-3xl p-8">
                <h3 className="text-lg font-black text-gray-700 mb-6 flex items-center space-x-2">
                    <Award className="w-5 h-5 text-amber-500" />
                    <span>How Priority Cards Work</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {[
                        { step: '01', title: 'Donate Blood', desc: 'Volunteer for emergency requests and donate at partner hospitals.', icon: Droplet },
                        { step: '02', title: 'Earn Cards', desc: 'Donate 2+ times at the same hospital to unlock your Silver card.', icon: CreditCard },
                        { step: '03', title: 'Upgrade Tiers', desc: 'Keep donating! 5 = Gold, 8 = Elite. Better benefits at each tier.', icon: Star },
                        { step: '04', title: 'Use Benefits', desc: 'Present your card at the hospital for priority treatment & discounts.', icon: Shield }
                    ].map((s, i) => {
                        const Icon = s.icon;
                        return (
                            <div key={i} className="text-center space-y-3">
                                <div className="w-14 h-14 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center mx-auto">
                                    <Icon className="w-6 h-6 text-red-500" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">Step {s.step}</p>
                                    <h4 className="font-black text-gray-800 text-sm mt-1">{s.title}</h4>
                                    <p className="text-gray-400 text-xs mt-1 font-medium">{s.desc}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
                <div className="mt-6 pt-5 border-t border-gray-100">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider text-center">
                        Each card has a unique verification number to prevent fraud. Priority cards are automatically emailed to you when unlocked. Present your card at the hospital for priority benefits.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Cards;
