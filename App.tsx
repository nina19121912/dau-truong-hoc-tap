import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sword, Trophy, Users, Shield, Heart, LogOut, ChevronRight, Lock, 
  Sparkles, Award, Eye, EyeOff, Medal, ChevronLeft, Zap, RefreshCw, 
  AlertCircle, Trash2, RefreshCcw, Star, CheckCircle, BarChart3, 
  Palette, Users2, User as UserIcon, Info, Binary, Atom, FlaskConical, 
  Dna, Cpu, Monitor, History, Globe2, Gavel, BookText, Languages, PenTool,
  BookOpen, Bot, Swords, User, Flag, Clock, MessageCircle, X, Smile, SearchX, Cloud
} from 'lucide-react';
import { User as UserType, UserRole, Difficulty, Question, Account, QuestionType, QuizResult } from './types';
import { INITIAL_QUESTIONS, INITIAL_ACCOUNTS, getRandomAvatar, XP_PER_LEVEL, MAX_SUB_LEVELS } from './constants';
import Avatar from './components/Avatar';
import QuizEngine from './components/QuizEngine';
import AdminDashboard from './components/AdminDashboard';
import Certificate from './components/Certificate';
import { supabase } from './supabaseClient';

type View = 'LANDING' | 'LOGIN' | 'CHARACTER_SELECT' | 'SUBJECT_SELECT' | 'TIME_SELECT' | 'ARENA' | 'QUIZ' | 'RESULT' | 'ADMIN' | 'CERTIFICATE' | 'LEADERBOARD';
type MatchMode = 'SOLO' | 'TEAM' | 'AI';

const VICTORY_SOUND = 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3';

const AVATAR_STYLES = [
  'pixel-art', 'bottts', 'adventurer', 'avataaars', 'big-smile', 'fun-emoji'
];

const SUBJECTS = [
  { id: 'math', name: 'Toán', icon: Binary, color: 'from-blue-500 to-cyan-400' },
  { id: 'physics', name: 'Lý', icon: Atom, color: 'from-purple-500 to-indigo-400' },
  { id: 'chemistry', name: 'Hóa', icon: FlaskConical, color: 'from-pink-500 to-rose-400' },
  { id: 'biology', name: 'Sinh', icon: Dna, color: 'from-emerald-500 to-teal-400' },
  { id: 'technology', name: 'Công nghệ', icon: Cpu, color: 'from-slate-500 to-gray-400' },
  { id: 'it', name: 'Tin học', icon: Monitor, color: 'from-indigo-500 to-blue-400' },
  { id: 'history', name: 'Sử', icon: History, color: 'from-amber-600 to-orange-400' },
  { id: 'geography', name: 'Địa', icon: Globe2, color: 'from-cyan-600 to-blue-400' },
  { id: 'civics', name: 'GDKT-PL', icon: Gavel, color: 'from-red-600 to-crimson-400' },
  { id: 'literature', name: 'Ngữ Văn', icon: BookText, color: 'from-orange-500 to-yellow-400' },
  { id: 'english', name: 'Tiếng Anh', icon: Languages, color: 'from-sky-500 to-blue-300' },
  { id: 'khmer', name: 'Khmer', icon: PenTool, color: 'from-yellow-500 to-amber-300' },
];

const TIME_OPTIONS = [
  { label: '30 Giây', value: 30, icon: Zap, color: 'from-emerald-500 to-teal-400' },
  { label: '1 Phút', value: 60, icon: Clock, color: 'from-blue-500 to-indigo-400' },
  { label: '3 Phút', value: 180, icon: Clock, color: 'from-purple-500 to-pink-400' },
  { label: '5 Phút', value: 300, icon: Clock, color: 'from-amber-500 to-orange-400' },
];

const GROUPS = ['Nhóm 1', 'Nhóm 2', 'Nhóm 3', 'Nhóm 4', 'Nhóm 5', 'Nhóm 6', 'Nhóm 7', 'Nhóm 8'];

const CHEER_MESSAGES = [
  "Tuyệt đỉnh! Matrix tự hào về bạn!",
  "Sức mạnh kiến thức của bạn thật đáng nể!",
  "Bạn đã sẵn sàng cho thử thách tiếp theo chưa?",
  "Tiếp tục đà chiến thắng này nhé, chiến binh!",
  "Không gì có thể cản bước bạn lúc này!",
  "Hệ thống ghi nhận chỉ số IQ của bạn đang tăng vọt!",
  "Bạn vừa mở khóa sức mạnh mới, hãy tận dụng nó!",
  "Càng chơi càng hay, đúng là cao thủ Matrix!",
];

const INITIAL_PROGRESS = {
  xp: 0,
  totalScore: 0,
  unlockedLevels: {
    [Difficulty.EASY]: 1,
    [Difficulty.MEDIUM]: 1,
    [Difficulty.HARD]: 1
  }
};

const App: React.FC = () => {
  const [user, setUser] = useState<UserType | null>(() => {
    try {
      const saved = localStorage.getItem('arena_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const [questions, setQuestions] = useState<Question[]>(INITIAL_QUESTIONS);
  const [accounts, setAccounts] = useState<Account[]>(INITIAL_ACCOUNTS);
  const [stats, setStats] = useState<QuizResult[]>([]);

  const [view, setView] = useState<View>('LANDING');
  const [activeQuiz, setActiveQuiz] = useState<{ difficulty: Difficulty; level: number } | null>(null);
  const [lastQuizResult, setLastQuizResult] = useState<{ score: number; correctCount: number; aiScore?: number } | null>(null);
  const [selectedTimeLimit, setSelectedTimeLimit] = useState<number>(30);
  const [showCheer, setShowCheer] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [isDbConnected, setIsDbConnected] = useState(false);
  
  const victoryAudioRef = useRef<HTMLAudioElement | null>(null);

  // Lọc câu hỏi từ State (đã được fetch từ DB)
  const currentQuestions = useMemo(() => {
    if (!activeQuiz || !user?.subject) return [];
    
    // Lọc CHÍNH XÁC theo: Môn học + Độ khó + Cấp độ
    const filtered = questions.filter(q => 
      String(q.subject).toLowerCase() === String(user.subject).toLowerCase() && 
      q.difficulty === activeQuiz.difficulty && 
      q.level === activeQuiz.level
    );

    // Xáo trộn ngẫu nhiên
    return filtered.sort(() => Math.random() - 0.5);
  }, [questions, activeQuiz, user?.subject]);

  // LOAD DỮ LIỆU TỪ SUPABASE KHI MỞ APP
  const loadDataFromSupabase = async () => {
    setIsLoading(true);
    try {
      // 1. Load Questions
      const { data: qData, error: qError } = await supabase.from('questions').select('*');
      if (qData) {
        setQuestions(qData as Question[]);
      } else if (qError) {
        console.warn("Supabase Questions Empty/Error, using initial:", qError);
      }

      // 2. Load Accounts
      const { data: aData, error: aError } = await supabase.from('accounts').select('*');
      if (aData) {
        setAccounts(aData as Account[]);
      }

      // 3. Load Stats (Results)
      const { data: sData, error: sError } = await supabase.from('quiz_results').select('*').order('id', { ascending: false });
      if (sData) {
        setStats(sData as QuizResult[]);
      }

      setIsDbConnected(true);
    } catch (err) {
      console.error("Critical Supabase Load Error:", err);
      setSyncError("Không thể kết nối Supabase. Kiểm tra lại mạng.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDataFromSupabase();
    victoryAudioRef.current = new Audio(VICTORY_SOUND);
  }, []);

  useEffect(() => { if (user) localStorage.setItem('arena_user', JSON.stringify(user)); }, [user]);

  // PARSE CSV cho Google Sheet Sync
  const parseCSV = (csv: string) => {
    const lines = [];
    let currentLine = [];
    let currentCell = '';
    let inQuotes = false;

    for (let i = 0; i < csv.length; i++) {
      const char = csv[i];
      const nextChar = csv[i + 1];

      if (char === '"' && inQuotes && nextChar === '"') {
        currentCell += '"';
        i++;
      } else if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        currentLine.push(currentCell.trim());
        currentCell = '';
      } else if ((char === '\n' || char === '\r') && !inQuotes) {
        if (currentCell !== '' || currentLine.length > 0) {
          currentLine.push(currentCell.trim());
          lines.push(currentLine);
          currentLine = [];
          currentCell = '';
        }
        if (char === '\r' && nextChar === '\n') i++;
      } else {
        currentCell += char;
      }
    }
    if (currentCell !== '' || currentLine.length > 0) {
      currentLine.push(currentCell.trim());
      lines.push(currentLine);
    }

    if (lines.length === 0) return [];
    const headers = lines[0].map(h => h.toLowerCase());
    return lines.slice(1).map(line => {
      const obj: any = {};
      headers.forEach((header, i) => {
        obj[header] = line[i] || '';
      });
      return obj;
    });
  };

  // HÀM SYNC DỮ LIỆU TỪ GOOGLE SHEET LÊN SUPABASE
  const performSync = async () => {
    const sheetId = localStorage.getItem('arena_sheet_id')?.trim();
    if (!sheetId || sheetId.length < 10) return;

    setIsLoading(true);
    setSyncError(null);
    
    try {
      const fetchTab = async (tabName: string) => {
        const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${tabName}`;
        const res = await fetch(url, { mode: 'cors' });
        if (!res.ok) return null;
        return await res.text();
      };

      // 1. Sync Questions
      const qData = await fetchTab('Questions');
      if (qData) {
        const parsedQuestions = parseCSV(qData).map((q: any) => ({
          id: q.id || `q-${Math.random().toString(36).substr(2,9)}`,
          level: parseInt(q.level) || 1,
          options: q.options ? q.options.split('|').map((o: string) => o.trim()) : [],
          type: (q.type as QuestionType) || QuestionType.MULTIPLE_CHOICE,
          difficulty: (q.difficulty as Difficulty) || Difficulty.EASY,
          subject: q.subject || 'Khác',
          text: q.text,
          answer: q.answer
        })).filter(q => q.text);
        
        if (parsedQuestions.length > 0) {
          // Xóa cũ insert mới hoặc upsert
          const { error } = await supabase.from('questions').upsert(parsedQuestions, { onConflict: 'id' });
          if (error) console.error("Error syncing questions:", error);
          else setQuestions(parsedQuestions);
        }
      }

      // 2. Sync Accounts
      const aData = await fetchTab('Accounts');
      if (aData) {
        const parsedAccounts = parseCSV(aData).map((a: any) => ({
          id: a.id || `acc-${a.username}`,
          username: a.username,
          password: a.password,
          role: (a.role?.toUpperCase() === 'TEACHER' ? UserRole.TEACHER : UserRole.PLAYER),
          created_at: a.createdat || new Date().toISOString(),
          xp: 0,
          total_score: 0,
          unlocked_levels: { "Dễ": 1, "Trung bình": 1, "Khó": 1 }
        })).filter(a => a.username);

        if (parsedAccounts.length > 0) {
          const { error } = await supabase.from('accounts').upsert(parsedAccounts, { onConflict: 'username' });
          if (error) console.error("Error syncing accounts:", error);
          else {
             // Reload accounts to get merged data (including existing XP)
             const { data } = await supabase.from('accounts').select('*');
             if (data) setAccounts(data as Account[]);
          }
        }
      }
      
      // Refresh Data
      await loadDataFromSupabase();

    } catch (e: any) {
      console.error("Sync Error:", e);
      setSyncError('Lỗi kết nối Matrix. Vui lòng kiểm tra ID Sheet!');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = (selectedRole: UserRole, username: string, password?: string) => {
    const cleanUsername = username.trim();
    const cleanPassword = (password || '').trim();
    
    // Tìm tài khoản trong danh sách đã tải từ DB
    const account = accounts.find(a => a.username.toLowerCase() === cleanUsername.toLowerCase());

    if (!account) {
      if (selectedRole === UserRole.TEACHER) {
        alert(`LỖI: Tài khoản "${username}" không tồn tại trong hệ thống!`);
      } else {
        // Tạo tài khoản khách tạm thời (Nếu muốn lưu DB thì bỏ logic này và insert vào DB)
        // Ở đây ta cho phép chơi ngay nhưng cảnh báo
        const newGuest: Account = {
           id: `guest-${Date.now()}`,
           username: username,
           password: cleanPassword || '123',
           role: UserRole.PLAYER,
           createdAt: new Date().toISOString()
        };
        // Lưu tạm vào state (không lưu DB để tránh rác)
        loginSuccess(newGuest); 
      }
      return;
    }

    if (String(account.password) !== cleanPassword) {
      alert('LỖI: Mật khẩu không chính xác!');
      return;
    }

    if (account.role !== selectedRole) {
      alert(`LỖI: Tài khoản này không thuộc vai trò ${selectedRole === UserRole.TEACHER ? 'GIÁO VIÊN' : 'NGƯỜI CHƠI'}!`);
      return;
    }

    loginSuccess(account);
  };

  const loginSuccess = (account: Account) => {
    const newUser: UserType = {
      username: account.username,
      role: account.role,
      avatar: getRandomAvatar(account.username),
      // Load progress from DB account if available
      // @ts-ignore
      xp: account.xp || 0,
      // @ts-ignore
      totalScore: account.total_score || 0,
      // @ts-ignore
      unlockedLevels: account.unlocked_levels || INITIAL_PROGRESS.unlockedLevels
    };
    setUser(newUser);
    setView(account.role === UserRole.TEACHER ? 'ADMIN' : 'CHARACTER_SELECT');
  };

  const handleCharacterReady = (groupName: string, avatarUrl: string, groupAvatar?: string) => {
    if (!user) return;
    setUser({
      ...user,
      groupName,
      avatar: avatarUrl,
      groupAvatar: groupAvatar,
    });
    setView('SUBJECT_SELECT');
  };

  const handleSubjectSelect = (subjectName: string) => {
    if (!user) return;
    setUser({ ...user, subject: subjectName });
    setView('TIME_SELECT');
  };

  const handleTimeSelect = (seconds: number) => {
    setSelectedTimeLimit(seconds);
    setView('ARENA');
  };

  const handleQuizComplete = async (score: number, correctCount: number, aiScore?: number) => {
    if (!user || !activeQuiz) return;
    const isPassed = correctCount >= 5;
    setLastQuizResult({ score, correctCount, aiScore });

    const newResult = {
      username: user.username,
      group_name: user.groupName,
      group_avatar: user.groupAvatar,
      subject: user.subject,
      difficulty: activeQuiz.difficulty,
      level: activeQuiz.level,
      score: score,
      correct_count: correctCount,
      timestamp: new Date().toLocaleString('vi-VN')
    };

    // 1. Lưu kết quả vào DB
    const { error: insertError } = await supabase.from('quiz_results').insert([newResult]);
    if (insertError) console.error("Error saving result:", insertError);
    else {
        // Update local stats for immediate feedback
        setStats(prev => [{...newResult, groupName: newResult.group_name, groupAvatar: newResult.group_avatar, correctCount: newResult.correct_count } as any, ...prev]);
    }

    // 2. Tính toán Level Unlock và XP mới
    const nextUnlocked = { ...user.unlockedLevels };
    if (isPassed && activeQuiz.level === user.unlockedLevels[activeQuiz.difficulty] && activeQuiz.level < MAX_SUB_LEVELS) {
      nextUnlocked[activeQuiz.difficulty] = activeQuiz.level + 1;
    }
    
    const xpGained = isPassed ? score : Math.floor(score / 4);
    const newXP = user.xp + xpGained;
    const newTotalScore = user.totalScore + xpGained;

    // 3. Cập nhật User State
    setUser({
      ...user,
      xp: newXP,
      totalScore: newTotalScore,
      unlockedLevels: nextUnlocked
    });

    // 4. Cập nhật Account trong DB (Lưu tiến độ)
    // Chỉ cập nhật nếu user tồn tại trong accounts (không phải khách)
    const isRealAccount = accounts.some(a => a.username === user.username);
    if (isRealAccount) {
        await supabase.from('accounts').update({
            xp: newXP,
            total_score: newTotalScore,
            unlocked_levels: nextUnlocked
        }).eq('username', user.username);
    }
    
    if (isPassed) {
      victoryAudioRef.current?.play().catch(() => {});
      // @ts-ignore
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
    }
    setView('RESULT');
  };

  const handleContinueFromResults = () => {
    if (lastQuizResult && lastQuizResult.correctCount >= 5) {
      setShowCheer(true);
    }
    setView('ARENA');
  };

  const handleArenaStart = (d: Difficulty, l: number) => {
    const hasQuestions = questions.some(q => 
      String(q.subject).toLowerCase() === String(user?.subject).toLowerCase() && 
      q.difficulty === d && 
      q.level === l
    );

    if (!hasQuestions) {
      alert(`MATRIX CẢNH BÁO: Hiện chưa có câu hỏi nào cho môn ${user?.subject} ở cấp độ ${d} (Level ${l}). Vui lòng báo cho Giáo viên cập nhật dữ liệu!`);
      return;
    }

    setActiveQuiz({ difficulty: d, level: l }); 
    setView('QUIZ');
  };

  return (
    <div className="min-h-screen font-['Plus_Jakarta_Sans'] overflow-x-hidden">
      <AnimatePresence mode="wait">
        {view === 'LANDING' && (
          <div className="min-h-screen flex flex-col text-white relative">
            <AnimatePresence>{isLoading && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/90 z-[100] flex flex-col items-center justify-center backdrop-blur-xl">
                <RefreshCw className="text-emerald-400 animate-spin mb-4" size={64} />
                <p className="text-emerald-400 font-black tracking-widest uppercase text-sm">Đang kết nối Supabase Cloud...</p>
              </motion.div>
            )}</AnimatePresence>
            <nav className="p-6 flex justify-between items-center relative z-20">
              <div className="flex items-center gap-2"><Sword className="text-emerald-400" /><span className="text-xl font-black tracking-tighter">ARENA.EDU</span></div>
              <div className="flex items-center gap-4">
                {isDbConnected ? 
                   <span className="text-[10px] text-emerald-400 font-black uppercase flex items-center gap-1"><Cloud size={12}/> DB Online</span> :
                   <span className="text-[10px] text-red-400 font-black uppercase flex items-center gap-1"><AlertCircle size={12}/> DB Offline</span>
                }
                <button onClick={() => setView('LOGIN')} className="bg-white/5 hover:bg-white/10 px-6 py-2 rounded-full font-bold border border-white/10 transition-all">ĐĂNG NHẬP</button>
              </div>
            </nav>
            <main className="flex-1 flex flex-col items-center justify-center p-6 text-center z-10">
              {syncError && <div className="bg-red-500/20 border border-red-500/50 p-4 rounded-2xl mb-8 text-red-400 text-xs font-bold uppercase flex items-center gap-2"><AlertCircle size={16}/> {syncError}</div>}
              <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="text-6xl md:text-8xl font-black mb-8 leading-tight uppercase tracking-tighter">ĐẤU TRƯỜNG <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-indigo-400">HỌC TẬP</span></h1>
                <p className="text-lg text-slate-400 mb-12 max-w-2xl font-medium">Hệ thống giáo dục thông minh v3.1 - Powered by Supabase</p>
                <div className="flex flex-col md:flex-row gap-6 items-center justify-center">
                  <button onClick={() => setView('LOGIN')} className="bg-emerald-600 hover:bg-emerald-500 text-white px-12 py-5 rounded-full font-black text-lg shadow-[0_0_30px_rgba(16,185,129,0.3)] flex items-center gap-3 transition-all active:scale-95">KHÁM PHÁ NGAY <ChevronRight size={20} /></button>
                  <button onClick={() => setView('LEADERBOARD')} className="bg-white/5 border border-white/10 px-12 py-5 rounded-full font-bold text-lg flex items-center gap-3 hover:bg-white/10 transition-all"><Trophy size={20} className="text-amber-400" /> XẾP HẠNG</button>
                </div>
              </motion.div>
            </main>
          </div>
        )}
        {view === 'LOGIN' && (
          <div className="min-h-screen flex flex-col items-center justify-center p-6 text-white relative">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="max-w-md w-full glass-card p-12 rounded-[3rem] shadow-2xl border-white/5 relative z-10">
              <div className="text-center mb-10"><h2 className="text-3xl font-black uppercase tracking-tighter">TIẾN VÀO ĐẤU TRƯỜNG</h2></div>
              <LoginUI onLogin={handleLogin} onBack={() => setView('LANDING')} />
            </motion.div>
          </div>
        )}
        {view === 'CHARACTER_SELECT' && user && (
          <CharacterSelectView 
            user={user} 
            onReady={handleCharacterReady} 
            stats={stats} 
            onBack={() => { setUser(null); setView('LOGIN'); }}
          />
        )}
        {view === 'SUBJECT_SELECT' && user && (
          <SubjectSelectView user={user} onSelect={handleSubjectSelect} onBack={() => setView('CHARACTER_SELECT')} />
        )}
        {view === 'TIME_SELECT' && user && (
          <TimeSelectView onSelect={handleTimeSelect} onBack={() => setView('SUBJECT_SELECT')} />
        )}
        {view === 'ARENA' && user && (
          <ArenaView 
            user={user} 
            showCheer={showCheer}
            onCheerClose={() => setShowCheer(false)}
            onStart={handleArenaStart} 
            onLogout={() => { setUser(null); setView('LANDING'); }} 
            onBack={() => setView('TIME_SELECT')} 
          />
        )}
        {view === 'QUIZ' && activeQuiz && currentQuestions.length > 0 && (
          <QuizEngine 
            questions={currentQuestions} 
            onComplete={handleQuizComplete} 
            onExit={() => setView('ARENA')} 
            isAIMode={user?.groupName === 'Đấu với AI'}
            timeLimit={selectedTimeLimit}
          />
        )}
        {view === 'RESULT' && lastQuizResult && activeQuiz && user && <ResultView result={lastQuizResult} activeQuiz={activeQuiz} onContinue={handleContinueFromResults} onCertificate={() => setView('CERTIFICATE')} />}
        {view === 'ADMIN' && <AdminDashboard questions={questions} accounts={accounts} stats={stats} onUpdateQuestions={setQuestions} onUpdateAccounts={setAccounts} onSync={performSync} onExit={() => { setUser(null); setView('LANDING'); }} />}
        {view === 'CERTIFICATE' && user && activeQuiz && lastQuizResult && (
          <div className="min-h-screen p-8 flex flex-col items-center relative">
            <button onClick={() => setView('RESULT')} className="mb-10 text-slate-500 font-black hover:text-white uppercase text-[10px] tracking-widest relative z-10">← QUAY LẠI</button>
            <Certificate user={user} level={activeQuiz.level} difficulty={activeQuiz.difficulty} score={lastQuizResult.score} />
          </div>
        )}
        {view === 'LEADERBOARD' && <LeaderboardView stats={stats} onBack={() => setView('LANDING')} />}
      </AnimatePresence>
    </div>
  );
};

const LoginUI = ({ onLogin, onBack }: { onLogin: (role: UserRole, u: string, p?: string) => void, onBack: () => void }) => {
  const [role, setRole] = useState<UserRole>(UserRole.PLAYER);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex bg-slate-900/50 p-1 rounded-2xl border border-white/10">
        <button
          onClick={() => setRole(UserRole.PLAYER)}
          className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${role === UserRole.PLAYER ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500'}`}
        >
          Người chơi
        </button>
        <button
          onClick={() => setRole(UserRole.TEACHER)}
          className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${role === UserRole.TEACHER ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500'}`}
        >
          Giáo viên
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest block mb-2 px-1">Tên truy cập</label>
          <div className="relative">
            <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl outline-none focus:border-indigo-500 text-white font-bold transition-all"
              placeholder="Nhập tên của bạn..."
            />
          </div>
        </div>

        <div>
          <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest block mb-2 px-1">Mật mã Matrix</label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-12 pr-12 py-4 bg-white/5 border border-white/10 rounded-2xl outline-none focus:border-indigo-500 text-white font-bold transition-all"
              placeholder="Nhập mật khẩu..."
            />
            <button
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>
      </div>

      <div className="pt-4 space-y-4">
        <button
          onClick={() => onLogin(role, username, password)}
          disabled={!username}
          className="w-full bg-emerald-600 hover:bg-emerald-500 py-5 rounded-2xl font-black text-lg uppercase shadow-[0_0_20px_rgba(16,185,129,0.2)] transition-all active:scale-95 disabled:opacity-50 disabled:grayscale"
        >
          Xác nhận truy cập
        </button>
        <button
          onClick={onBack}
          className="w-full text-slate-500 hover:text-white font-bold text-[10px] uppercase tracking-[0.4em] transition-colors"
        >
          Quay lại trang chủ
        </button>
      </div>
    </div>
  );
};

const CharacterSelectView = ({ user, onReady, stats, onBack }: { user: UserType, onReady: (group: string, avatar: string, groupAvatar?: string) => void, stats: any[], onBack: () => void }) => {
  const [mode, setMode] = useState<MatchMode>('SOLO');
  const [groupName, setGroupName] = useState('');
  const [avatarStyle, setAvatarStyle] = useState(AVATAR_STYLES[0]);
  const [seed, setSeed] = useState(user.username);
  
  const currentAvatar = `https://api.dicebear.com/7.x/${avatarStyle}/svg?seed=${seed}`;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-white relative">
      <button 
        onClick={onBack}
        className="absolute top-6 left-6 px-6 py-3 bg-white/5 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-2xl transition-all border border-white/10 flex items-center gap-3 font-black text-[10px] uppercase tracking-widest z-50 backdrop-blur-md"
      >
        <LogOut size={16} /> Thoát
      </button>

      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl w-full glass-card p-10 md:p-14 rounded-[4rem] border-white/5 z-10">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-black uppercase tracking-tighter mb-4">THIẾT LẬP CHIẾN BINH</h2>
          <p className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.4em]">Tùy chỉnh nhân diện của bạn trong Matrix</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="flex flex-col items-center space-y-8">
            <div className="relative group">
              <div className="absolute inset-0 bg-indigo-500/20 rounded-[3rem] blur-2xl group-hover:bg-indigo-500/40 transition-all" />
              <div className="relative w-56 h-56 bg-slate-900 rounded-[3rem] border-4 border-indigo-500/30 flex items-center justify-center p-4 overflow-hidden">
                <img src={currentAvatar} alt="Avatar" className="w-full h-full object-contain" />
              </div>
              <button 
                onClick={() => setSeed(Math.random().toString())}
                className="absolute -bottom-4 -right-4 p-4 bg-indigo-600 rounded-2xl shadow-xl hover:bg-indigo-500 transition-all active:rotate-180 duration-500"
              >
                <RefreshCw size={24} />
              </button>
            </div>
            
            <div className="flex flex-wrap justify-center gap-3">
              {AVATAR_STYLES.map(style => (
                <button
                  key={style}
                  onClick={() => setAvatarStyle(style)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase border transition-all ${avatarStyle === style ? 'bg-white text-black border-white' : 'bg-white/5 text-slate-400 border-white/10 hover:border-white/30'}`}
                >
                  {style.replace('-', ' ')}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-8">
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest block px-1">Chế độ thi đấu</label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'SOLO', label: 'Cá nhân', icon: <UserIcon size={16}/> },
                  { id: 'TEAM', label: 'Đội nhóm', icon: <Users2 size={16}/> },
                  { id: 'AI', label: 'Đấu AI', icon: <Bot size={16}/> }
                ].map(m => (
                  <button
                    key={m.id}
                    onClick={() => setMode(m.id as MatchMode)}
                    className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 transition-all ${mode === m.id ? 'bg-indigo-600/20 border-indigo-500 text-white' : 'bg-white/5 border-white/5 text-slate-500 hover:border-white/20'}`}
                  >
                    {m.icon}
                    <span className="text-[10px] font-black uppercase">{m.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {mode === 'TEAM' && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-4">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest block px-1">Tên liên minh / Nhóm</label>
                <div className="grid grid-cols-2 gap-3">
                  {GROUPS.map(g => (
                    <button
                      key={g}
                      onClick={() => setGroupName(g)}
                      className={`p-3 rounded-xl border text-xs font-bold transition-all ${groupName === g ? 'bg-emerald-600 border-emerald-400 text-white' : 'bg-white/5 border-white/5 text-slate-500 hover:border-white/20'}`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            <button
              onClick={() => onReady(mode === 'SOLO' ? 'Cá nhân' : mode === 'AI' ? 'Đấu với AI' : groupName, currentAvatar)}
              disabled={mode === 'TEAM' && !groupName}
              className="w-full bg-indigo-600 hover:bg-indigo-500 p-6 rounded-[2rem] font-black text-xl uppercase shadow-2xl transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 mt-8"
            >
              SẴN SÀNG NHẬP CUỘC <ChevronRight />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const SubjectSelectView = ({ user, onSelect, onBack }: { user: UserType, onSelect: (s: string) => void, onBack: () => void }) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-white relative bg-[#020617]">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-6xl w-full z-10">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-black uppercase tracking-tighter mb-4 text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-indigo-400">CHỌN PHÂN KHU KIẾN THỨC</h2>
          <p className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.5em]">Lựa chọn môn học bạn muốn chinh phục</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {SUBJECTS.map((subject, idx) => (
            <motion.button
              key={subject.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              whileHover={{ scale: 1.05, y: -5 }}
              onClick={() => onSelect(subject.name)}
              className="relative group h-48 rounded-[3rem] overflow-hidden flex flex-col items-center justify-center gap-4 transition-all"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${subject.color} opacity-10 group-hover:opacity-20 transition-opacity`} />
              <div className="relative p-5 rounded-3xl bg-white/5 border border-white/10 group-hover:bg-white/10 group-hover:border-white/20 transition-all group-hover:shadow-[0_0_30px_rgba(255,255,255,0.05)]">
                <subject.icon size={40} className="text-white opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all" />
              </div>
              <span className="relative font-black text-xl uppercase tracking-wider">{subject.name}</span>
            </motion.button>
          ))}
        </div>

        <button onClick={onBack} className="mt-16 w-full text-slate-500 font-black uppercase text-[10px] hover:text-white transition-colors tracking-[0.5em]">
          ← QUAY LẠI THIẾT LẬP NHÂN VẬT
        </button>
      </motion.div>
    </div>
  );
};

const TimeSelectView = ({ onSelect, onBack }: { onSelect: (seconds: number) => void, onBack: () => void }) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-white bg-[#020617] relative">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }} 
        animate={{ opacity: 1, scale: 1 }} 
        className="max-w-4xl w-full glass-card p-10 md:p-14 rounded-[3.5rem] border-white/5 z-10"
      >
        <div className="text-center mb-12">
          <h2 className="text-5xl font-black uppercase tracking-tighter mb-4 text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-indigo-400 to-purple-500">
            THỜI GIAN THỬ THÁCH
          </h2>
          <p className="text-slate-400 font-bold text-sm uppercase tracking-[0.4em] flex items-center justify-center gap-3">
            <Clock className="text-indigo-400" size={18} /> Chọn thời gian cho mỗi câu hỏi
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {TIME_OPTIONS.map((option, idx) => (
            <motion.button
              key={option.value}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onSelect(option.value)}
              className="relative group h-32 rounded-[2.5rem] overflow-hidden flex items-center px-8 gap-6 transition-all duration-300"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${option.color} opacity-10 group-hover:opacity-20 transition-opacity`} />
              <div className={`absolute inset-0 border-2 border-white/5 group-hover:border-white/20 rounded-[2.5rem] transition-all`} />
              
              <div className={`p-4 rounded-2xl bg-white/5 group-hover:bg-white/10 group-hover:shadow-[0_0_30px_rgba(255,255,255,0.1)] transition-all`}>
                <option.icon className="group-hover:animate-pulse" size={32} />
              </div>
              
              <div className="text-left relative z-10">
                <span className="font-black text-2xl uppercase tracking-wider block">
                  {option.label}
                </span>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  mỗi câu hỏi
                </span>
              </div>

              <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden rounded-[2.5rem]">
                <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-gradient-to-r from-transparent via-white/5 to-transparent rotate-45 transform translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
              </div>
            </motion.button>
          ))}
        </div>

        <button 
          onClick={onBack}
          className="mt-12 w-full text-slate-500 font-black uppercase text-[10px] hover:text-white transition-colors tracking-[0.5em] flex items-center justify-center gap-2"
        >
          <ChevronLeft size={14} /> QUAY LẠI CHỌN MÔN THI
        </button>
      </motion.div>
    </div>
  );
};

const ArenaView = ({ user, onStart, onLogout, onBack, showCheer, onCheerClose }: any) => {
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.EASY);
  const currentUnlocked = user.unlockedLevels[difficulty] || 1;

  useEffect(() => {
    if (showCheer) {
      const timer = setTimeout(() => {
        onCheerClose();
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [showCheer, onCheerClose]);

  const randomCheer = useMemo(() => 
    CHEER_MESSAGES[Math.floor(Math.random() * CHEER_MESSAGES.length)], 
  []);

  return (
    <div className="min-h-screen flex flex-col relative">
      <header className="glass-hud px-8 py-5 flex justify-between items-center sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <Avatar src={user.avatar} xp={user.xp} size="md" />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-black text-xl uppercase tracking-tighter">{user.username}</h2>
              <span className="px-3 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 text-[9px] font-black uppercase border border-indigo-500/30 tracking-widest">{user.subject}</span>
            </div>
            <p className="text-[10px] text-emerald-400 font-black uppercase tracking-widest">
              {user.groupName === 'Cá nhân' ? 'Chiến binh độc lập' : 
               user.groupName === 'Đấu với AI' ? 'Thách đấu AI Matrix' : 
               user.groupName || 'Học viên Matrix'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-3 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-xl transition-all border border-white/10 flex items-center gap-2 px-4"><BookOpen size={18} /> THAY ĐỔI</button>
          <button onClick={onLogout} className="p-3 bg-white/5 hover:bg-red-500/20 text-slate-500 hover:text-red-400 rounded-xl transition-all border border-white/10"><LogOut size={20}/></button>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto p-8 w-full flex-1 flex flex-col items-center z-10">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-black uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-indigo-400">ĐẤU TRƯỜNG {user.subject}</h1>
          <p className="text-slate-500 text-[10px] font-black uppercase mt-2 tracking-[0.3em]">Chọn thử thách để chinh phục</p>
        </div>

        <div className="flex bg-slate-900/80 p-1.5 rounded-full border border-white/5 mb-16 shadow-2xl">
          {[Difficulty.EASY, Difficulty.MEDIUM, Difficulty.HARD].map(d => (
            <button key={d} onClick={() => setDifficulty(d)} className={`px-10 py-3 rounded-full font-black text-[10px] uppercase tracking-widest transition-all ${difficulty === d ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>{d}</button>
          ))}
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-10 md:gap-16">
          {Array.from({ length: MAX_SUB_LEVELS }).map((_, i) => {
            const level = i + 1;
            const isUnlocked = level <= currentUnlocked;
            const isNext = level === currentUnlocked;
            return (
              <motion.button key={level} onClick={() => isUnlocked && onStart(difficulty, level)} disabled={!isUnlocked} whileHover={isUnlocked ? { scale: 1.1 } : {}} className={`relative w-24 h-24 md:w-32 md:h-32 rounded-[2.5rem] flex flex-col items-center justify-center transition-all duration-500 ${isNext ? 'bg-gradient-to-br from-indigo-500 to-indigo-800 border-4 border-indigo-300 next-level-glow' : isUnlocked ? 'bg-emerald-500/20 border-2 border-emerald-500/30' : 'bg-slate-900/40 border-2 border-white/5 opacity-40 grayscale cursor-not-allowed'}`}>
                {isUnlocked ? <><p className="text-[10px] font-black uppercase mb-1 opacity-60">Level</p><span className="text-3xl md:text-5xl font-black">{level}</span></> : <Lock size={32} className="text-slate-600" />}
              </motion.button>
            );
          })}
        </div>
      </main>

      {/* AI Cheerleader Toast */}
      <AnimatePresence>
        {showCheer && (
          <motion.div 
            initial={{ opacity: 0, x: 100, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.8 }}
            className="fixed bottom-12 right-12 z-[60] flex items-end gap-6"
          >
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative glass-card p-8 rounded-[3rem] border-emerald-500/30 shadow-[0_0_50px_rgba(16,185,129,0.2)] max-w-sm mb-12"
            >
              <button onClick={onCheerClose} className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors">
                <X size={18} />
              </button>
              <div className="flex items-start gap-4">
                <div className="p-3 bg-emerald-500/20 rounded-2xl shrink-0">
                  <Smile size={24} className="text-emerald-400" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-emerald-500 tracking-[0.2em] mb-2">MATRIX CHEER</p>
                  <p className="text-base font-bold leading-relaxed text-slate-100 pr-6">
                    "{randomCheer}"
                  </p>
                </div>
              </div>
              <div className="absolute -bottom-3 right-16 w-6 h-6 bg-[#030712] rotate-45 border-r border-b border-emerald-500/20"></div>
            </motion.div>

            <motion.div 
              animate={{ 
                y: [0, -20, 0],
                rotate: [0, 8, -8, 0]
              }}
              transition={{ 
                duration: 2.5, 
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="bg-gradient-to-br from-emerald-400 to-indigo-600 p-6 rounded-[2.5rem] shadow-[0_0_40px_rgba(52,211,153,0.5)] border border-white/20 relative group"
            >
              <Bot size={64} className="text-white group-hover:scale-110 transition-transform" />
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center border-2 border-slate-950 animate-bounce">
                <Sparkles size={12} className="text-slate-900" />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="p-8 text-center text-slate-600 font-bold text-[10px] uppercase tracking-[0.5em] z-10">@thaydat-NiNa</footer>
    </div>
  );
};

const ResultView = ({ result, activeQuiz, onContinue, onCertificate }: { result: { score: number; correctCount: number; aiScore?: number }, activeQuiz: { difficulty: Difficulty; level: number }, onContinue: () => void, onCertificate: () => void }) => {
  const isWin = result.correctCount >= 5;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-white relative bg-[#020617]">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="max-w-2xl w-full glass-card p-12 rounded-[3rem] border-white/5 text-center relative z-10">
        <div className="mb-8">
          {isWin ? (
            <div className="relative inline-block">
               <Trophy size={80} className="text-yellow-400 mx-auto mb-4 animate-bounce" />
               <Sparkles size={40} className="text-yellow-200 absolute -top-2 -right-6 animate-pulse" />
            </div>
          ) : (
            <LogOut size={80} className="text-slate-500 mx-auto mb-4" />
          )}
          <h2 className="text-4xl font-black uppercase tracking-tighter mb-2 text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-indigo-400">
            {isWin ? 'THỬ THÁCH HOÀN THÀNH!' : 'THỬ THÁCH THẤT BẠI'}
          </h2>
          <p className="text-slate-400 font-bold text-sm uppercase tracking-[0.3em]">
            {activeQuiz.difficulty} • Level {activeQuiz.level}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-12">
          <div className="p-6 bg-emerald-500/10 rounded-3xl border border-emerald-500/20">
            <p className="text-emerald-400 font-black text-4xl">{result.score}</p>
            <p className="text-[10px] font-black uppercase text-slate-500 mt-2 tracking-wider">XP Nhận được</p>
          </div>
          <div className="p-6 bg-indigo-500/10 rounded-3xl border border-indigo-500/20">
            <p className="text-indigo-400 font-black text-4xl">{result.correctCount}/10</p>
            <p className="text-[10px] font-black uppercase text-slate-500 mt-2 tracking-wider">Câu trả lời đúng</p>
          </div>
          {result.aiScore !== undefined && (
            <div className="col-span-2 p-6 bg-purple-500/10 rounded-3xl border border-purple-500/20 flex items-center justify-between px-10">
              <div className="text-left">
                 <p className="text-[10px] font-black uppercase text-purple-400 tracking-wider mb-1">MATRIX AI</p>
                 <p className="text-purple-300 font-bold text-xs">Đối thủ máy</p>
              </div>
              <p className="text-purple-400 font-black text-4xl">{result.aiScore} XP</p>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <button onClick={onContinue} className="w-full bg-emerald-600 hover:bg-emerald-500 py-5 rounded-2xl font-black text-lg uppercase shadow-[0_0_30px_rgba(16,185,129,0.3)] transition-all active:scale-95 flex items-center justify-center gap-2">
            TIẾP TỤC HÀNH TRÌNH <ChevronRight size={20} />
          </button>
          {isWin && (
            <button onClick={onCertificate} className="w-full bg-white/5 hover:bg-white/10 py-5 rounded-2xl font-black text-xs uppercase border border-white/10 transition-all flex items-center justify-center gap-2 tracking-widest text-slate-300 hover:text-white">
              <Award size={18} className="text-yellow-400" /> NHẬN CHỨNG CHỈ VINH DANH
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};

const LeaderboardView = ({ stats, onBack }: { stats: QuizResult[], onBack: () => void }) => {
  const topStats = useMemo(() => {
    return [...stats].sort((a, b) => b.score - a.score).slice(0, 10);
  }, [stats]);

  return (
    <div className="min-h-screen bg-[#020617] text-white p-4 md:p-8 relative overflow-hidden font-['Plus_Jakarta_Sans'] flex flex-col items-center">
      <div className="max-w-5xl w-full relative z-10">
        <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-6">
                <button onClick={onBack} className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 transition-all active:scale-90">
                    <ChevronLeft size={24} />
                </button>
                <div>
                    <h1 className="text-3xl font-black uppercase tracking-tighter flex items-center gap-3 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-600">
                        <Trophy className="text-yellow-400" size={32} /> BẢNG XẾP HẠNG
                    </h1>
                    <p className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.4em]">Top 10 Chiến binh xuất sắc nhất Matrix</p>
                </div>
            </div>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-[2.5rem] border-white/5 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-900/80 text-[10px] font-black uppercase tracking-widest text-slate-500">
                <tr>
                  <th className="px-8 py-6">Hạng</th>
                  <th className="px-8 py-6">Chiến Binh</th>
                  <th className="px-8 py-6">Thành Tích</th>
                  <th className="px-8 py-6">Điểm XP</th>
                  <th className="px-8 py-6">Thời Gian</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {topStats.map((s, i) => (
                  <tr key={i} className="hover:bg-white/5 transition-colors group">
                    <td className="px-8 py-6">
                       {i === 0 ? <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center text-yellow-400 border border-yellow-500/30 text-xl">🥇</div> : 
                        i === 1 ? <div className="w-10 h-10 rounded-xl bg-slate-400/20 flex items-center justify-center text-slate-300 border border-slate-400/30 text-xl">🥈</div> : 
                        i === 2 ? <div className="w-10 h-10 rounded-xl bg-amber-600/20 flex items-center justify-center text-amber-500 border border-amber-600/30 text-xl">🥉</div> : 
                        <span className="text-slate-500 font-black text-lg ml-3">#{i + 1}</span>}
                    </td>
                    <td className="px-8 py-6 font-bold text-white">
                        <div className="flex items-center gap-4">
                            {s.groupAvatar ? (
                                <img src={s.groupAvatar} className="w-10 h-10 rounded-xl bg-slate-800 object-cover border border-white/10" alt="avatar" />
                            ) : (
                                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 border border-indigo-500/20"><UserIcon size={20}/></div>
                            )}
                            <div>
                                <p className="font-black text-sm">{s.username}</p>
                                {s.groupName && <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">{s.groupName}</p>}
                            </div>
                        </div>
                    </td>
                    <td className="px-8 py-6">
                        <span className="px-3 py-1 rounded-lg bg-slate-800 text-slate-300 text-[10px] font-black uppercase tracking-wider border border-white/5 mr-2">{s.subject}</span>
                        <span className="text-xs font-bold text-slate-400">{s.difficulty} • LV.{s.level}</span>
                    </td>
                    <td className="px-8 py-6">
                        <span className="text-emerald-400 font-black text-xl">+{s.score.toLocaleString()}</span>
                    </td>
                    <td className="px-8 py-6 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                      {s.timestamp}
                    </td>
                  </tr>
                ))}
                {topStats.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-20 text-center">
                        <Trophy size={48} className="text-slate-700 mx-auto mb-4" />
                        <p className="text-slate-500 font-bold text-sm uppercase tracking-widest">Chưa có dữ liệu bảng xếp hạng</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default App;