
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Trash2, Edit2, ChevronLeft, Save, X, UserCircle, UserCog, User as UserIcon,
  Database, Shield, Users, AlertTriangle, Lock, CheckCircle2, 
  Zap, Activity, Cpu, Search, RefreshCw, Link, Info, ExternalLink, AlertCircle,
  Globe, BarChart3, Clock, TrendingUp, Cloud, Binary, Atom, FlaskConical, 
  Dna, Monitor, History, Globe2, Gavel, BookText, Languages, PenTool, LayoutGrid, Check, AlertCircle as AlertIcon, Sigma
} from 'lucide-react';
import { Question, QuestionType, Difficulty, Account, UserRole, QuizResult } from '../types';

interface AdminDashboardProps {
  questions: Question[];
  accounts: Account[];
  stats: QuizResult[];
  onUpdateQuestions: React.Dispatch<React.SetStateAction<Question[]>>;
  onUpdateAccounts: React.Dispatch<React.SetStateAction<Account[]>>;
  onSync: () => Promise<void>;
  onExit: () => void;
}

const SUBJECT_CONFIG = [
  { id: 'math', name: 'Toán', icon: Binary, color: 'text-blue-400' },
  { id: 'physics', name: 'Lý', icon: Atom, color: 'text-purple-400' },
  { id: 'chemistry', name: 'Hóa', icon: FlaskConical, color: 'text-pink-400' },
  { id: 'biology', name: 'Sinh', icon: Dna, color: 'text-emerald-400' },
  { id: 'technology', name: 'Công nghệ', icon: Cpu, color: 'text-slate-400' },
  { id: 'it', name: 'Tin học', icon: Monitor, color: 'text-indigo-400' },
  { id: 'history', name: 'Sử', icon: History, color: 'text-amber-500' },
  { id: 'geography', name: 'Địa', icon: Globe2, color: 'text-cyan-500' },
  { id: 'civics', name: 'GDKT-PL', icon: Gavel, color: 'text-red-500' },
  { id: 'literature', name: 'Ngữ Văn', icon: BookText, color: 'text-orange-400' },
  { id: 'english', name: 'Tiếng Anh', icon: Languages, color: 'text-sky-400' },
  { id: 'khmer', name: 'Khmer', icon: PenTool, color: 'text-yellow-400' },
];

const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  questions = [], 
  accounts = [], 
  stats = [],
  onUpdateQuestions, 
  onUpdateAccounts, 
  onSync,
  onExit 
}) => {
  const [activeTab, setActiveTab] = useState<'QUESTIONS' | 'ACCOUNTS' | 'SYNC' | 'STATS'>('QUESTIONS');
  const [searchTerm, setSearchTerm] = useState('');
  const [webhookInput, setWebhookInput] = useState(localStorage.getItem('arena_webhook_url') || '');
  const [sheetInput, setSheetInput] = useState(localStorage.getItem('arena_sheet_id') || '');
  const [isSyncing, setIsSyncing] = useState(false);

  const filteredStats = useMemo(() => {
    return stats.filter(s => 
      s.username.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [stats, searchTerm]);

  const subjectStats = useMemo(() => {
    return SUBJECT_CONFIG.map(sub => {
      const count = questions.filter(q => String(q.subject).toLowerCase() === sub.name.toLowerCase()).length;
      return { ...sub, count };
    });
  }, [questions]);

  const aggregateStats = useMemo(() => {
    const totalXP = stats.reduce((acc, curr) => acc + curr.score, 0);
    const avgScore = stats.length > 0 ? (totalXP / stats.length).toFixed(0) : 0;
    const bestPlayer = stats.length > 0 ? stats.reduce((prev, curr) => prev.score > curr.score ? prev : curr).username : "N/A";
    return { totalXP, avgScore, bestPlayer, totalSessions: stats.length };
  }, [stats]);

  const handleSaveConfig = async () => {
    localStorage.setItem('arena_webhook_url', webhookInput);
    localStorage.setItem('arena_sheet_id', sheetInput);
    setIsSyncing(true);
    await onSync();
    setIsSyncing(false);
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white p-4 md:p-8 relative overflow-hidden font-['Plus_Jakarta_Sans']">
      <div className="max-w-7xl mx-auto relative z-10">
        <header className="flex flex-col lg:flex-row justify-between items-center gap-6 mb-12 glass-card p-6 rounded-[2.5rem] border-white/5">
          <div className="flex items-center gap-6">
            <button onClick={onExit} className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 transition-all active:scale-90"><ChevronLeft size={24} /></button>
            <div>
              <h1 className="text-3xl font-black uppercase flex items-center gap-3"><Shield className="text-emerald-400" /> QUẢN TRỊ VIÊN</h1>
              <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.4em]">Hệ thống Matrix v3.2 • {questions.length} Câu hỏi đang hoạt động</p>
            </div>
          </div>
          <div className="flex bg-slate-900/80 p-1.5 rounded-2xl border border-white/10 overflow-x-auto max-w-full">
            <button onClick={() => setActiveTab('QUESTIONS')} className={`px-6 py-3 rounded-xl font-black text-xs flex items-center gap-2 transition-all shrink-0 ${activeTab === 'QUESTIONS' ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}><Database size={16}/> KHO CÂU HỎI</button>
            <button onClick={() => setActiveTab('STATS')} className={`px-6 py-3 rounded-xl font-black text-xs flex items-center gap-2 transition-all shrink-0 ${activeTab === 'STATS' ? 'bg-amber-600 text-white' : 'text-slate-500'}`}><BarChart3 size={16}/> HỌC SINH</button>
            <button onClick={() => setActiveTab('ACCOUNTS')} className={`px-6 py-3 rounded-xl font-black text-xs flex items-center gap-2 transition-all shrink-0 ${activeTab === 'ACCOUNTS' ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}><Users size={16}/> TÀI KHOẢN</button>
            <button onClick={() => setActiveTab('SYNC')} className={`px-6 py-3 rounded-xl font-black text-xs flex items-center gap-2 transition-all shrink-0 ${activeTab === 'SYNC' ? 'bg-emerald-600 text-white' : 'text-slate-500'}`}><Cloud size={16}/> ĐỒNG BỘ CLOUD</button>
          </div>
        </header>

        {activeTab === 'STATS' ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="glass-card p-6 rounded-3xl border-white/5"><p className="text-emerald-400 font-black text-3xl">{aggregateStats.totalXP.toLocaleString()}</p><p className="text-[10px] font-black uppercase text-slate-500 mt-2">Tổng XP Toàn Hệ Thống</p></div>
              <div className="glass-card p-6 rounded-3xl border-white/5"><p className="text-indigo-400 font-black text-3xl">{aggregateStats.totalSessions}</p><p className="text-[10px] font-black uppercase text-slate-500 mt-2">Tổng Lượt Thử Thách</p></div>
              <div className="glass-card p-6 rounded-3xl border-white/5"><p className="text-amber-400 font-black text-3xl">{aggregateStats.avgScore}</p><p className="text-[10px] font-black uppercase text-slate-500 mt-2">Điểm Trung Bình / Lượt</p></div>
              <div className="glass-card p-6 rounded-3xl border-white/5"><p className="text-purple-400 font-black text-2xl truncate">{aggregateStats.bestPlayer}</p><p className="text-[10px] font-black uppercase text-slate-500 mt-2">Chiến Binh Xuất Sắc</p></div>
            </div>

            <div className="glass-card rounded-[2.5rem] border-white/5 overflow-hidden shadow-2xl">
               <div className="p-8 border-b border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 bg-white/5">
                  <h3 className="text-xl font-black uppercase tracking-tight flex items-center gap-2"><TrendingUp className="text-emerald-400" /> Nhật ký Matrix</h3>
                  <div className="relative w-full md:w-80">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input type="text" placeholder="Tìm kiếm chiến binh..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-slate-900/50 border border-white/10 rounded-2xl outline-none focus:border-emerald-500 text-sm transition-all" />
                  </div>
               </div>
               <div className="overflow-x-auto">
                 <table className="w-full text-left">
                   <thead className="bg-slate-900/80 text-[10px] font-black uppercase tracking-widest text-slate-500">
                     <tr>
                       <th className="px-8 py-5">Tên Chiến Binh</th>
                       <th className="px-8 py-5">Môn Học</th>
                       <th className="px-8 py-5">Độ Khó</th>
                       <th className="px-8 py-5">Cấp Độ</th>
                       <th className="px-8 py-5">XP Nhận Được</th>
                       <th className="px-8 py-5">Thời Điểm</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-white/5">
                     {filteredStats.map((s, i) => (
                       <tr key={i} className="hover:bg-white/5 transition-colors group">
                         <td className="px-8 py-6 font-bold text-white flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 border border-indigo-500/20 group-hover:scale-110 transition-transform"><UserIcon size={14}/></div>
                            {s.username}
                         </td>
                         <td className="px-8 py-6">
                            <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-[10px] font-black uppercase tracking-tighter">{s.subject}</span>
                         </td>
                         <td className="px-8 py-6 text-sm uppercase text-slate-400 font-bold">{s.difficulty}</td>
                         <td className="px-8 py-6 text-sm font-black">Level {s.level}</td>
                         <td className="px-8 py-6 text-xl font-black text-emerald-400">+{s.score}</td>
                         <td className="px-8 py-6 text-[10px] text-slate-500 uppercase font-bold">{s.timestamp}</td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
            </div>
          </motion.div>
        ) : activeTab === 'SYNC' ? (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1 space-y-6">
                <div className="glass-card p-8 rounded-[2.5rem] border-emerald-500/20 shadow-2xl">
                  <h3 className="text-xl font-black text-emerald-400 mb-6 uppercase flex items-center gap-3"><Cloud /> Đẩy Dữ Liệu Lên Cloud</h3>
                  <div className="space-y-6">
                    <div>
                      <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest block mb-2 px-1">Mã Google Sheet (ID)</label>
                      <input type="text" value={sheetInput} onChange={e => setSheetInput(e.target.value)} className="w-full p-4 bg-slate-900 border-2 border-white/10 rounded-2xl outline-none focus:border-emerald-500 font-bold text-sm" placeholder="ID từ link Google Sheet..."/>
                    </div>
                    <button onClick={handleSaveConfig} disabled={isSyncing} className="w-full bg-emerald-600 hover:bg-emerald-500 p-5 rounded-2xl font-black text-lg uppercase transition-all shadow-[0_0_30px_rgba(16,185,129,0.3)] flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50">
                      {isSyncing ? <RefreshCw className="animate-spin" /> : <RefreshCw />} {isSyncing ? 'ĐANG NẠP LÊN SUPABASE...' : 'ĐỒNG BỘ SUPABASE'}
                    </button>
                    <p className="text-[10px] text-slate-500 italic text-center px-4">
                      Hành động này sẽ đọc dữ liệu từ Google Sheet của bạn và ghi đè/cập nhật vào cơ sở dữ liệu Supabase.
                    </p>
                  </div>
                </div>

                {/* HƯỚNG DẪN VIẾT CÔNG THỨC TOÁN HỌC */}
                <div className="p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-[2rem] space-y-4">
                  <div className="flex items-center gap-3 text-emerald-400">
                    <Sigma size={20}/>
                    <span className="font-black text-xs uppercase tracking-widest">Viết công thức toán học</span>
                  </div>
                  <div className="text-[11px] text-slate-400 space-y-3 leading-relaxed">
                    <p>Sử dụng cặp dấu <span className="text-white font-bold">$...$</span> để bọc công thức LaTeX:</p>
                    <ul className="space-y-2 text-emerald-200 font-mono">
                      <li>• <code className="bg-black/30 p-1 rounded">{"$\\frac{a}{b}$"}</code> : Phân số</li>
                      <li>• <code className="bg-black/30 p-1 rounded">{"$\\sqrt{x}$"}</code> : Căn bậc hai</li>
                      <li>• <code className="bg-black/30 p-1 rounded">{"$x^2$"}</code> : Số mũ</li>
                      <li>• <code className="bg-black/30 p-1 rounded">{"$\\int_{a}^{b}$"}</code> : Tích phân</li>
                    </ul>
                    <p className="italic text-slate-500 mt-2">VD: "Giải phương trình $x^2 + 2x + 1 = 0$"</p>
                  </div>
                </div>

                <div className="p-6 bg-indigo-500/10 border border-indigo-500/20 rounded-[2rem] space-y-4">
                  <div className="flex items-center gap-3 text-indigo-400">
                    <Info size={20}/>
                    <span className="font-black text-xs uppercase tracking-widest">Hướng dẫn Tab Questions</span>
                  </div>
                  <div className="text-[11px] text-slate-400 space-y-3 leading-relaxed">
                    <p>Google Sheet của bạn cần có tab tên <span className="text-white font-bold">"Questions"</span> với các cột sau:</p>
                    <ul className="grid grid-cols-2 gap-2 text-indigo-200 font-mono">
                      <li>• subject</li>
                      <li>• text</li>
                      <li>• answer</li>
                      <li>• options</li>
                      <li>• difficulty</li>
                      <li>• level</li>
                    </ul>
                    <p className="italic text-slate-500">* Cột 'options' cách nhau bởi dấu gạch đứng | (Ví dụ: A|B|C|D)</p>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-2 space-y-6">
                <div className="glass-card p-8 rounded-[2.5rem] border-white/5">
                  <div className="flex justify-between items-center mb-8">
                    <h3 className="text-xl font-black text-white uppercase flex items-center gap-3"><LayoutGrid className="text-indigo-400" /> Trạng Thái Dữ Liệu 12 Môn Học</h3>
                    <div className="px-4 py-1.5 bg-indigo-500/10 rounded-full border border-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-widest">
                      Tổng: {questions.length} CH
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {subjectStats.map((sub) => (
                      <div key={sub.id} className="p-5 rounded-3xl bg-slate-900/50 border border-white/5 hover:border-white/10 transition-all group relative overflow-hidden">
                        <div className={`absolute top-0 right-0 w-20 h-20 -mr-6 -mt-6 bg-current opacity-5 rounded-full blur-2xl ${sub.color}`} />
                        <div className="flex items-center gap-3 mb-4">
                           <div className={`p-2.5 rounded-xl bg-slate-800 ${sub.color} border border-white/5`}>
                             <sub.icon size={20} />
                           </div>
                           <span className="font-black text-xs uppercase tracking-tight">{sub.name}</span>
                        </div>
                        <div className="flex justify-between items-end">
                           <div>
                             <p className="text-2xl font-black leading-none mb-1">{sub.count}</p>
                             <p className="text-[9px] font-bold text-slate-500 uppercase">Câu hỏi</p>
                           </div>
                           {sub.count > 0 ? (
                             <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
                               <Check size={12}/>
                             </div>
                           ) : (
                             <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 border border-amber-500/20 animate-pulse">
                               <AlertIcon size={12}/>
                             </div>
                           )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="glass-card p-8 rounded-[2.5rem] bg-indigo-600/5 border-indigo-500/10 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                       <Cloud size={28}/>
                    </div>
                    <div>
                      <h4 className="font-black uppercase text-sm tracking-tight">Trạng Thái Hệ Thống Cloud</h4>
                      <p className="text-xs text-slate-500 font-medium">Supabase Database Connected</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-400">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></div>
                    <span className="text-[10px] font-black uppercase tracking-widest">Trực Tuyến</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="glass-card rounded-[2.5rem] border-white/5 p-12 text-center opacity-40">
            <Database size={64} className="mx-auto mb-6 text-slate-600" />
            <p className="text-xl font-bold text-slate-500 uppercase tracking-widest">Dữ liệu tài khoản đang được quản lý từ Google Sheet</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
