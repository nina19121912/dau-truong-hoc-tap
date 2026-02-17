
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Timer, CheckCircle2, XCircle, ChevronRight, Zap, Volume2, VolumeX, RefreshCw, Bot, User, Swords, Scan } from 'lucide-react';
import { Question, QuestionType, Difficulty } from '../types';
import { BASE_POINTS, TIME_BONUS_MULTIPLIER } from '../constants';
import katex from 'katex';

interface QuizEngineProps {
  questions: Question[];
  onComplete: (score: number, correctCount: number, aiScore?: number) => void;
  onExit: () => void;
  isAIMode?: boolean;
  timeLimit: number;
}

const SOUNDS = {
  CORRECT: 'https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3',
  WRONG: 'https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3',
  TICK: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3',
  BATTLE: 'https://assets.mixkit.co/active_storage/sfx/1168/1168-preview.mp3',
  SCAN: 'https://assets.mixkit.co/active_storage/sfx/2561/2561-preview.mp3'
};

/**
 * MathText Component: Tự động phát hiện và render công thức LaTeX giữa cặp dấu $
 */
const MathText: React.FC<{ text: string; className?: string }> = ({ text, className = "" }) => {
  if (!text) return null;

  const renderMath = (content: string) => {
    // Regex tìm các đoạn văn bản nằm giữa dấu $
    const parts = content.split(/(\$.*?\$)/g);
    
    return parts.map((part, index) => {
      if (part.startsWith('$') && part.endsWith('$')) {
        const formula = part.slice(1, -1);
        try {
          const html = katex.renderToString(formula, { 
            throwOnError: false, 
            displayMode: false,
            strict: false 
          });
          return <span key={index} dangerouslySetInnerHTML={{ __html: html }} className="inline-block px-1" />;
        } catch (e) {
          console.error("KaTeX Error:", e);
          return <span key={index} className="text-red-400">{part}</span>;
        }
      }
      return <span key={index}>{part}</span>;
    });
  };

  return <div className={className}>{renderMath(text)}</div>;
};

const QuizEngine: React.FC<QuizEngineProps> = ({ questions = [], onComplete, onExit, isAIMode = false, timeLimit }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [aiScore, setAiScore] = useState(0);
  const [aiCorrectCount, setAiCorrectCount] = useState(0);
  
  const [userResult, setUserResult] = useState<'correct' | 'wrong' | 'timeout' | null>(null);
  const [aiResult, setAiResult] = useState<'thinking' | 'revealing' | 'correct' | 'wrong' | null>(null);
  const [aiChoice, setAiChoice] = useState<string | null>(null);
  
  const [userInput, setUserInput] = useState<string>('');
  const [isMuted, setIsMuted] = useState(false);
  const [matchingState, setMatchingState] = useState<{
    selectedLeft: string | null;
    selectedRight: string | null;
    matchedPairs: string[];
  }>({ selectedLeft: null, selectedRight: null, matchedPairs: [] });

  const timerRef = useRef<number | null>(null);
  const audioRef = useRef<{ [key: string]: HTMLAudioElement }>({});
  const currentQuestion = questions[currentIndex];

  useEffect(() => {
    audioRef.current.correct = new Audio(SOUNDS.CORRECT);
    audioRef.current.wrong = new Audio(SOUNDS.WRONG);
    audioRef.current.tick = new Audio(SOUNDS.TICK);
    audioRef.current.battle = new Audio(SOUNDS.BATTLE);
    audioRef.current.scan = new Audio(SOUNDS.SCAN);
    audioRef.current.tick.volume = 0.3;
  }, []);

  const playSound = (type: keyof typeof SOUNDS | string) => {
    if (isMuted) return;
    const soundKey = type.toLowerCase();
    const sound = audioRef.current[soundKey];
    if (sound) {
      sound.currentTime = 0;
      sound.play().catch(() => {});
    }
  };

  const getAiAction = useCallback(() => {
    if (!currentQuestion) return { isCorrect: false, choice: 'N/A' };
    
    let intelligence = 0.85; 
    if (currentQuestion.difficulty === Difficulty.MEDIUM) intelligence = 0.7;
    if (currentQuestion.difficulty === Difficulty.HARD) intelligence = 0.55;

    const isCorrect = Math.random() < intelligence;
    let choice = '';

    if (isCorrect) {
      choice = Array.isArray(currentQuestion.answer) ? currentQuestion.answer[0] : String(currentQuestion.answer);
    } else {
      if (currentQuestion.type === QuestionType.MULTIPLE_CHOICE && currentQuestion.options) {
        const wrongs = currentQuestion.options.filter(o => o !== currentQuestion.answer);
        choice = wrongs[Math.floor(Math.random() * wrongs.length)] || 'Sai';
      } else if (currentQuestion.type === QuestionType.TRUE_FALSE) {
        choice = currentQuestion.answer === 'True' ? 'False' : 'True';
      } else {
        choice = 'Dữ liệu lỗi';
      }
    }

    return { isCorrect, choice };
  }, [currentQuestion]);

  const handleJudgement = useCallback((userIsCorrect: boolean, aiIsCorrect: boolean) => {
    if (userIsCorrect) {
      const timeBonus = timeLeft * TIME_BONUS_MULTIPLIER;
      setScore(prev => prev + BASE_POINTS + timeBonus);
      setCorrectCount(prev => prev + 1);
      playSound('correct');
    }
    
    if (aiIsCorrect) {
      setAiScore(prev => prev + BASE_POINTS);
      setAiCorrectCount(prev => prev + 1);
    }

    if (!userIsCorrect) playSound('wrong');
  }, [timeLeft]);

  const processBothAnswers = useCallback((userIsCorrect: boolean) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setUserResult(userIsCorrect ? 'correct' : 'wrong');
    
    if (isAIMode) {
      setAiResult('thinking');
      playSound('scan');
      
      const aiDecision = getAiAction();
      
      setTimeout(() => {
        setAiChoice(aiDecision.choice);
        setAiResult('revealing');
        
        setTimeout(() => {
          setAiResult(aiDecision.isCorrect ? 'correct' : 'wrong');
          handleJudgement(userIsCorrect, aiDecision.isCorrect);
          
          setTimeout(() => handleNext(), 2000);
        }, 1500);
      }, 2000);
    } else {
      if (userIsCorrect) {
        const timeBonus = timeLeft * TIME_BONUS_MULTIPLIER;
        setScore(prev => prev + BASE_POINTS + timeBonus);
        setCorrectCount(prev => prev + 1);
        playSound('correct');
      } else {
        playSound('wrong');
      }
      setTimeout(() => handleNext(), 1500);
    }
  }, [isAIMode, getAiAction, handleJudgement, timeLeft]);

  const handleNext = useCallback(() => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(prev => prev + 1);
      setTimeLeft(timeLimit);
      setUserResult(null);
      setAiResult(null);
      setAiChoice(null);
      setUserInput('');
      setMatchingState({ selectedLeft: null, selectedRight: null, matchedPairs: [] });
    } else {
      onComplete(score, correctCount, isAIMode ? aiScore : undefined);
    }
  }, [currentIndex, questions.length, score, correctCount, aiScore, isAIMode, onComplete, timeLimit]);

  useEffect(() => {
    if (userResult || !currentQuestion) return;

    timerRef.current = window.setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 5 && prev > 0) playSound('tick');
        if (prev <= 1) {
          processBothAnswers(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentIndex, userResult, currentQuestion, processBothAnswers]);

  const handleAnswer = (isCorrect: boolean) => {
    if (userResult) return;
    processBothAnswers(isCorrect);
  };

  const checkFillIn = () => {
    if (!currentQuestion || userResult) return;
    const isCorrect = userInput.trim().toLowerCase() === String(currentQuestion.answer).toLowerCase();
    handleAnswer(isCorrect);
  };

  const handleMatchingClick = (id: string, side: 'left' | 'right') => {
    if (userResult) return;
    if (side === 'left') {
      setMatchingState(prev => ({ ...prev, selectedLeft: id }));
    } else {
      setMatchingState(prev => ({ ...prev, selectedRight: id }));
    }
  };

  useEffect(() => {
    if (matchingState.selectedLeft && matchingState.selectedRight && currentQuestion) {
      const pairs = Array.isArray(currentQuestion.matchingPairs) ? currentQuestion.matchingPairs : [];
      const pair = pairs.find(p => p.id === matchingState.selectedLeft);
      if (pair && pair.id === matchingState.selectedRight) {
        setMatchingState(prev => ({
          ...prev,
          matchedPairs: [...prev.matchedPairs, pair.id],
          selectedLeft: null,
          selectedRight: null
        }));
      } else {
        setTimeout(() => {
          setMatchingState(prev => ({ ...prev, selectedLeft: null, selectedRight: null }));
        }, 300);
      }
    }
  }, [matchingState.selectedLeft, matchingState.selectedRight, currentQuestion]);

  useEffect(() => {
    if (!currentQuestion) return;
    const pairs = Array.isArray(currentQuestion.matchingPairs) ? currentQuestion.matchingPairs : [];
    if (currentQuestion.type === QuestionType.MATCHING && 
        pairs.length > 0 && 
        matchingState.matchedPairs.length === pairs.length) {
      handleAnswer(true);
    }
  }, [matchingState.matchedPairs, currentQuestion]);

  if (!currentQuestion) return null;

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden font-['Plus_Jakarta_Sans']">
      <div className="absolute top-0 -left-20 w-72 h-72 bg-emerald-500/10 rounded-full blur-[120px] animate-pulse"></div>
      <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] animate-pulse delay-1000"></div>

      <div className="fixed top-0 left-0 w-full h-1.5 bg-white/5 z-50">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${((currentIndex) / questions.length) * 100}%` }}
          className="h-full bg-gradient-to-r from-emerald-500 to-indigo-500 shadow-[0_0_20px_rgba(16,185,129,0.5)]"
        />
      </div>

      {isAIMode && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 flex items-center gap-10 glass-card px-10 py-4 rounded-[2rem] border-white/10 z-40 shadow-2xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
              <User size={24}/>
            </div>
            <div className="text-left">
              <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">PLAYER</p>
              <p className="text-2xl font-black text-white leading-none">{score}</p>
            </div>
          </div>
          <div className="flex flex-col items-center">
            <Swords className="text-slate-600 animate-pulse" size={28} />
            <span className="text-[8px] font-black text-slate-600 uppercase tracking-[0.4em] mt-1">VS</span>
          </div>
          <div className="flex items-center gap-4 text-right">
            <div className="text-right">
              <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">MATRIX AI</p>
              <p className="text-2xl font-black text-white leading-none">{aiScore}</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-purple-500/20 flex items-center justify-center text-purple-400 border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
              <Bot size={24}/>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-4xl w-full flex justify-between items-center mb-8 z-10 px-4">
        <div className="flex items-center gap-4">
          <span className="bg-white/5 border border-white/10 text-white px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl backdrop-blur-md">
            CÂU {currentIndex + 1} / {questions.length}
          </span>
          {!isAIMode && (
            <motion.span 
              key={score}
              initial={{ scale: 1.2, color: '#10b981' }}
              animate={{ scale: 1, color: '#34d399' }}
              className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl backdrop-blur-md flex items-center gap-2"
            >
              <Zap size={14} className="fill-current" />
              {score} XP
            </motion.span>
          )}
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => setIsMuted(!isMuted)} className="p-3 bg-white/5 border border-white/10 rounded-xl text-slate-400 hover:text-white transition-all">
            {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>
          <div className={`flex items-center gap-3 px-6 py-2.5 bg-white/5 border border-white/10 rounded-2xl font-mono text-xl font-black shadow-xl backdrop-blur-md ${timeLeft <= 5 ? 'text-red-500 animate-bounce' : 'text-emerald-400'}`}>
            <Timer size={22} />
            {timeLeft}s
          </div>
        </div>
      </div>

      <motion.div 
        key={currentIndex}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl w-full glass-card rounded-[3.5rem] p-10 md:p-16 z-10 relative overflow-hidden border-white/5"
      >
        <div className="absolute top-0 right-0 p-8 opacity-10">
           <Bot size={120} className="text-indigo-400" />
        </div>

        {/* CẬP NHẬT: Render câu hỏi bằng MathText */}
        <MathText 
          text={currentQuestion.text} 
          className="text-2xl md:text-4xl font-black mb-14 text-white leading-tight relative z-10" 
        />

        <div className="space-y-4 relative z-10">
          {currentQuestion.type === QuestionType.MULTIPLE_CHOICE && currentQuestion.options?.map((option, i) => (
            <button
              key={i}
              onClick={() => handleAnswer(option === currentQuestion.answer)}
              disabled={!!userResult}
              className={`w-full text-left p-6 rounded-3xl border-2 transition-all duration-300 group flex justify-between items-center ${
                userResult ? 'border-white/5 bg-white/5 opacity-50' : 'border-white/5 bg-white/5 hover:border-emerald-500/50 hover:bg-emerald-500/10 hover:translate-x-2'
              }`}
            >
              {/* CẬP NHẬT: Render phương án bằng MathText */}
              <MathText text={option} className="text-slate-300 font-bold text-xl group-hover:text-white transition-colors" />
              <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-slate-500 opacity-0 group-hover:opacity-100 transition-all">
                <ChevronRight />
              </div>
            </button>
          ))}

          {currentQuestion.type === QuestionType.TRUE_FALSE && (
            <div className="flex gap-6 h-40">
              <button
                onClick={() => handleAnswer('True' === currentQuestion.answer)}
                disabled={!!userResult}
                className="flex-1 rounded-[2.5rem] border-2 border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/20 hover:border-emerald-500/50 transition-all text-emerald-400 font-black text-3xl shadow-xl shadow-emerald-500/5 active:scale-95"
              >
                ĐÚNG
              </button>
              <button
                onClick={() => handleAnswer('False' === currentQuestion.answer)}
                disabled={!!userResult}
                className="flex-1 rounded-[2.5rem] border-2 border-red-500/20 bg-red-500/5 hover:bg-red-500/20 hover:border-red-500/50 transition-all text-red-400 font-black text-3xl shadow-xl shadow-red-500/5 active:scale-95"
              >
                SAI
              </button>
            </div>
          )}

          {currentQuestion.type === QuestionType.FILL_IN_BLANK && (
            <div className="space-y-6">
              <input
                type="text"
                autoFocus
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && checkFillIn()}
                placeholder="Nhập câu trả lời của bạn..."
                className="w-full p-8 rounded-[2rem] bg-white/5 border-2 border-white/10 focus:border-emerald-500 outline-none text-2xl font-black text-white shadow-inner"
              />
              <button
                onClick={checkFillIn}
                disabled={!userInput || !!userResult}
                className="w-full bg-emerald-600 text-white py-6 rounded-3xl font-black text-xl hover:bg-emerald-500 transition-all shadow-xl shadow-emerald-500/20 active:scale-95 uppercase tracking-widest"
              >
                XÁC NHẬN ĐÁP ÁN
              </button>
            </div>
          )}

          {currentQuestion.type === QuestionType.MATCHING && (
            <div className="grid grid-cols-2 gap-10">
              <div className="space-y-4">
                {Array.isArray(currentQuestion.matchingPairs) && currentQuestion.matchingPairs.map(pair => (
                  <button
                    key={pair.id}
                    onClick={() => handleMatchingClick(pair.id, 'left')}
                    disabled={matchingState.matchedPairs.includes(pair.id) || !!userResult}
                    className={`w-full p-5 rounded-2xl border-2 text-left transition-all font-black text-lg ${
                      matchingState.matchedPairs.includes(pair.id) ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400 opacity-50' :
                      matchingState.selectedLeft === pair.id ? 'bg-indigo-500/20 border-indigo-500 shadow-inner translate-x-2' : 'bg-white/5 border-white/5 hover:border-indigo-300'
                    }`}
                  >
                    <MathText text={pair.left} />
                  </button>
                ))}
              </div>
              <div className="space-y-4">
                {Array.isArray(currentQuestion.matchingPairs) && currentQuestion.matchingPairs.map(pair => (
                  <button
                    key={pair.id}
                    onClick={() => handleMatchingClick(pair.id, 'right')}
                    disabled={matchingState.matchedPairs.includes(pair.id) || !!userResult}
                    className={`w-full p-5 rounded-2xl border-2 text-left transition-all font-black text-lg ${
                      matchingState.matchedPairs.includes(pair.id) ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400 opacity-50' :
                      matchingState.selectedRight === pair.id ? 'bg-indigo-500/20 border-indigo-500 shadow-inner -translate-x-2' : 'bg-white/5 border-white/5 hover:border-indigo-300'
                    }`}
                  >
                    <MathText text={pair.right} />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>

      <AnimatePresence>
        {userResult && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-xl p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              className="max-w-5xl w-full glass-card rounded-[4rem] p-12 border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.5)] flex flex-col items-center gap-10"
            >
              <div className="text-center">
                <h3 className="text-4xl font-black uppercase tracking-[0.5em] text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-indigo-400 mb-2">MATRIX JUDGEMENT</h3>
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Hệ thống đang đối chiếu dữ liệu...</p>
              </div>
              
              <div className={`grid ${isAIMode ? 'grid-cols-2' : 'grid-cols-1'} gap-12 w-full`}>
                <div className="flex flex-col items-center gap-6 p-10 rounded-[3.5rem] bg-white/5 border border-white/10 relative overflow-hidden group">
                  <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="p-5 rounded-3xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.1)]"><User size={48}/></div>
                  <p className="text-xs font-black uppercase text-slate-400 tracking-[0.3em]">CHỦ THỂ</p>
                  {userResult === 'correct' ? (
                    <div className="text-center relative z-10">
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}>
                        <CheckCircle2 size={100} className="text-emerald-500 mb-4 filter drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
                      </motion.div>
                      <p className="text-emerald-400 font-black text-3xl uppercase tracking-tighter">SUCCESS</p>
                      <div className="mt-6 flex items-center justify-center gap-2 text-xl font-black text-emerald-400 bg-emerald-500/10 px-8 py-3 rounded-2xl border border-emerald-500/20">
                        <Zap size={20} className="fill-current" />
                        +{BASE_POINTS + (timeLeft * TIME_BONUS_MULTIPLIER)} XP
                      </div>
                    </div>
                  ) : (
                    <div className="text-center relative z-10">
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                        <XCircle size={100} className="text-red-500 mb-4 filter drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]" />
                      </motion.div>
                      <p className="text-red-400 font-black text-3xl uppercase tracking-tighter">FAILED</p>
                      <p className="text-slate-500 text-[10px] font-bold mt-4 uppercase tracking-widest">Hệ thống ghi nhận lỗi</p>
                    </div>
                  )}
                </div>

                {isAIMode && (
                  <div className="flex flex-col items-center gap-6 p-10 rounded-[3.5rem] bg-white/5 border border-white/10 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="p-5 rounded-3xl bg-purple-500/20 text-purple-400 border border-purple-500/30 shadow-[0_0_30px_rgba(168,85,247,0.1)]"><Bot size={48}/></div>
                    <p className="text-xs font-black uppercase text-slate-400 tracking-[0.3em]">MATRIX AI</p>
                    
                    <div className="w-full flex flex-col items-center">
                      {aiResult === 'thinking' ? (
                        <div className="flex flex-col items-center gap-6 py-10">
                          <div className="relative">
                            <RefreshCw size={64} className="text-purple-500 animate-spin" />
                            <Scan className="absolute inset-0 m-auto text-purple-300 animate-pulse" size={32} />
                          </div>
                          <p className="text-purple-400 font-black text-sm animate-pulse tracking-widest">ĐANG TRUY XUẤT...</p>
                        </div>
                      ) : (
                        <div className="text-center w-full">
                          <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-8 p-6 bg-purple-500/10 rounded-[2rem] border border-purple-500/20"
                          >
                            <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-2">AI ĐÃ CHỌN:</p>
                            {/* CẬP NHẬT: Render AI Choice bằng MathText */}
                            <MathText text={aiChoice || '...'} className="text-2xl font-black text-white uppercase" />
                          </motion.div>

                          <AnimatePresence>
                            {(aiResult === 'correct' || aiResult === 'wrong') && (
                              <motion.div 
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ type: 'spring', damping: 12 }}
                              >
                                {aiResult === 'correct' ? (
                                  <>
                                    <CheckCircle2 size={80} className="text-emerald-500 mx-auto mb-4 filter drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]" />
                                    <p className="text-emerald-400 font-black text-2xl uppercase">CHÍNH XÁC</p>
                                    <p className="text-slate-500 text-[10px] font-bold mt-2 uppercase">AI nhận +{BASE_POINTS} XP</p>
                                  </>
                                ) : (
                                  <>
                                    <XCircle size={80} className="text-red-500 mx-auto mb-4 filter drop-shadow-[0_0_15px_rgba(239,68,68,0.3)]" />
                                    <p className="text-red-400 font-black text-2xl uppercase">SAI LẦM</p>
                                    <p className="text-slate-500 text-[10px] font-bold mt-2 uppercase">Lỗi xử lý logic</p>
                                  </>
                                )}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <button 
        onClick={onExit}
        className="fixed bottom-8 left-8 bg-white/5 hover:bg-red-500/20 px-6 py-3 rounded-2xl text-slate-500 hover:text-red-400 transition-all font-black text-[10px] uppercase tracking-widest border border-white/5 no-print backdrop-blur-md"
      >
        DỪNG THI ĐẤU
      </button>
    </div>
  );
};

export default QuizEngine;
