import React from 'react';
import { motion } from 'motion/react';
import { User, Mail, Shield, GraduationCap, Calendar, Lock, BrainCircuit, LogOut, ArrowLeft } from 'lucide-react';
import { UserProfile } from '../../types';

interface ProfileViewProps {
  userProfile: UserProfile | null;
  onLogout: () => void;
  onNavigate: (view: string) => void;
}

export default function ProfileView({ userProfile, onNavigate }: Omit<ProfileViewProps, 'onLogout'>) {
  if (!userProfile) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center space-y-6">
        <div className="w-20 h-20 bg-[#f0f2ff] rounded-3xl flex items-center justify-center mx-auto border border-[#e9ecef]">
          <User className="w-10 h-10 text-[#1a237e]" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-[#1a237e] uppercase tracking-tight">Academic Explorer</h2>
          <p className="text-[#636e72] font-bold text-xs mt-2 uppercase tracking-widest leading-relaxed">
            Welcome to the open-source Academic Portal.<br/>All features are accessible directly.
          </p>
        </div>
      </div>
    );
  }

  const detailItems = [
    { label: 'Identity', value: userProfile.fullName, icon: User },
    { label: 'Academic Role', value: userProfile.role?.toUpperCase(), icon: userProfile.role === 'teacher' ? Shield : GraduationCap },
    { label: 'Class & Section', value: `${userProfile.userClass || 'Not Assigned'} - ${userProfile.section || 'N/A'}`, icon: GraduationCap },
    { label: 'Session Start', value: new Date(userProfile.createdAt).toLocaleDateString(), icon: Calendar },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => onNavigate('home')}
            className="p-2 hover:bg-[#f0f2ff] rounded-xl transition-colors text-[#1a237e]"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-[#1a237e] uppercase tracking-tight">User Profile</h1>
            <p className="text-[#636e72] font-bold text-[10px] uppercase tracking-widest">Academic Identity Card</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white p-8 rounded-3xl border border-[#e9ecef] shadow-sm text-center space-y-4">
            <div className="w-24 h-24 bg-gradient-to-br from-[#1a237e] to-[#3949ab] rounded-3xl flex items-center justify-center mx-auto shadow-xl border-4 border-white text-3xl font-black text-white">
              {userProfile.fullName.charAt(0)}
            </div>
            <div>
              <h3 className="text-xl font-black text-[#1a237e] uppercase">{userProfile.fullName}</h3>
              <p className="text-[#636e72] text-[10px] font-bold uppercase tracking-widest mt-1">{userProfile.role}</p>
            </div>
          </div>
        </div>

        <div className="md:col-span-2">
          <div className="bg-white rounded-3xl border border-[#e9ecef] shadow-sm overflow-hidden">
            <div className="grid grid-cols-1 sm:grid-cols-2">
              {detailItems.map((item, idx) => (
                <div key={idx} className={`p-6 border-[#f1f3f5] ${idx % 2 === 0 ? 'sm:border-r' : ''} ${idx < 4 ? 'border-b' : ''}`}>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-[#f8f9fa] text-[#1a237e]">
                      <item.icon className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-black text-[#636e72] uppercase tracking-widest">{item.label}</span>
                  </div>
                  <p className="text-[#1a1a1a] font-black text-sm pl-11">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 p-6 bg-[#f0f2ff] rounded-3xl border border-[#1a237e]/10 flex items-center gap-4">
            <div className="p-3 bg-white rounded-2xl border border-[#e9ecef] text-[#1a237e]">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-xs font-black text-[#1a237e] uppercase tracking-widest">St Michael's Verified ID</h4>
              <p className="text-[#636e72] text-[10px] font-bold uppercase tracking-widest opacity-70">Authenticated through Academic Core Services</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
