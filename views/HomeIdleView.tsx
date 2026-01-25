import React from 'react';
import { RecognitionMode } from '../types';
import { CameraIcon } from '../components/Icons';
import { WordCloudMarquee } from '../components/WordCloudMarquee';

interface Props {
  mode: RecognitionMode;
  onModeChange: (m: RecognitionMode) => void;
  onUpload: () => void;
  onShare: () => void;
  onDishClick: (dish: any) => void;
}

export const HomeIdleView: React.FC<Props> = ({ mode, onModeChange, onUpload, onShare, onDishClick }) => (
  <div className="animate-in fade-in duration-500">
    {/* Share Bonus Section */}
    <div className="max-w-xl mx-auto mb-10">
      <button onClick={onShare} className="w-full bg-emerald-50/50 border border-emerald-100 p-6 rounded-[2.5rem] flex items-center justify-between group hover:bg-emerald-50 transition-all">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-2xl shadow-sm">🎁</div>
          <div className="text-left">
            <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest">Share Bonus</p>
            <p className="text-sm font-bold text-slate-900">+5 Free Credits Daily</p>
          </div>
        </div>
        <span className="bg-emerald-600 text-white px-4 py-2 rounded-full text-[9px] font-bold">SHARE</span>
      </button>
    </div>

    {/* Mode Switcher */}
    <div className="flex justify-center mb-8">
      <div className="bg-slate-100/50 p-1.5 rounded-2xl flex gap-1 border border-slate-200/50">
        <button onClick={() => onModeChange(RecognitionMode.MENU)} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${mode === RecognitionMode.MENU ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-400'}`}>Menu</button>
        <button onClick={() => onModeChange(RecognitionMode.STREET)} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${mode === RecognitionMode.STREET ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-400'}`}>Street</button>
      </div>
    </div>

    {/* Upload Area */}
    <div className="bg-white border border-slate-100 p-12 md:p-20 text-center flex flex-col items-center shadow-xl mb-10 rounded-[3.5rem]">
      <button onClick={onUpload} className={`w-24 h-24 rounded-[2rem] flex items-center justify-center mb-10 shadow-2xl transition-transform active:scale-95 ${mode === RecognitionMode.MENU ? 'bg-rose-600' : 'bg-slate-900'}`}>
        <CameraIcon className="w-12 h-12 text-white" />
      </button>
      <h2 className="text-3xl font-bold text-slate-900 mb-6">{mode === RecognitionMode.MENU ? "Scan a Menu" : "Identify Storefront"}</h2>
      <button onClick={onUpload} className="w-full max-w-xs bg-slate-900 text-white font-bold py-5 rounded-full shadow-xl hover:bg-slate-800 transition-colors">START SCAN</button>
    </div>

    <WordCloudMarquee onShowDetail={onDishClick} />
  </div>
);