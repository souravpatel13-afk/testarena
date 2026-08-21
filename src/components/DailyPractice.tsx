import React, { useState, useEffect, useMemo, Component } from 'react';
import { 
  Calendar, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Award, 
  RotateCcw, 
  ArrowLeft, 
  ArrowRight, 
  Eye, 
  Zap, 
  Sparkles,
  BookOpen,
  Share2,
  FileText,
  HelpCircle,
  GraduationCap,
  UserCheck,
  Sprout,
  BookMarked,
  Languages,
  Calculator,
  Atom,
  Briefcase,
  ChevronRight,
  Filter,
  Layers,
  Play,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import { DailyPracticeSet, DailyPracticeQuestion, DailyPracticeCategory } from '../types';
import ShareModal from './ShareModal';
import { ShareOptions } from '../utils/shareUtils';

export const DAILY_PRACTICE_PROGRESS_KEY = 'testarena_daily_practice_saved_session';

export interface SavedDailySession {
  setId: string;
  setDate: string;
  setTitle: string;
  category?: string;
  subject?: string;
  currentIndex: number;
  selectedAnswers: Record<number, number>;
  showExplanations: Record<number, boolean>;
  instantMode: boolean;
  timerSeconds: number;
  savedAt: number;
}

interface DailyPracticeProps {
  onBackToHome?: () => void;
}

const getCategoryIcon = (iconName?: string) => {
  switch (iconName) {
    case 'UserCheck': return UserCheck;
    case 'Sprout': return Sprout;
    case 'BookMarked': return BookMarked;
    case 'Languages': return Languages;
    case 'Calculator': return Calculator;
    case 'Atom': return Atom;
    case 'Briefcase': return Briefcase;
    case 'GraduationCap': return GraduationCap;
    default: return BookOpen;
  }
};

function DailyPracticeContent({ onBackToHome }: DailyPracticeProps) {
  const [sets, setSets] = useState<DailyPracticeSet[]>([]);
  const [categories, setCategories] = useState<DailyPracticeCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [shareConfig, setShareConfig] = useState<ShareOptions | null>(null);

  // Active Practice State
  const [activeSet, setActiveSet] = useState<DailyPracticeSet | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [showExplanations, setShowExplanations] = useState<Record<number, boolean>>({});
  const [instantMode, setInstantMode] = useState<boolean>(true); // Immediate feedback mode
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const [timerSeconds, setTimerSeconds] = useState<number>(0);
  const [showSubmitModal, setShowSubmitModal] = useState<boolean>(false);

  // Resume Test Session State
  const [savedSession, setSavedSession] = useState<SavedDailySession | null>(null);

  // Check and read saved incomplete session from localStorage
  const checkSavedSession = () => {
    try {
      const raw = localStorage.getItem(DAILY_PRACTICE_PROGRESS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && (parsed.setId || parsed.setDate)) {
          setSavedSession(parsed);
          return;
        }
      }
    } catch (e) {
      console.error("Error reading saved practice session:", e);
    }
    setSavedSession(null);
  };

  useEffect(() => {
    checkSavedSession();
  }, [activeSet]);

  // Real-time Auto-save while practice test is active and not finished
  useEffect(() => {
    if (activeSet && !isFinished) {
      try {
        const sessionData: SavedDailySession = {
          setId: activeSet.id,
          setDate: activeSet.date,
          setTitle: activeSet.title,
          category: activeSet.category || activeSet.subject,
          subject: activeSet.subject,
          currentIndex,
          selectedAnswers,
          showExplanations,
          instantMode,
          timerSeconds,
          savedAt: Date.now()
        };
        localStorage.setItem(DAILY_PRACTICE_PROGRESS_KEY, JSON.stringify(sessionData));
      } catch (err) {
        console.error("Error saving daily practice session:", err);
      }
    }
  }, [activeSet, currentIndex, selectedAnswers, showExplanations, instantMode, timerSeconds, isFinished]);

  const fetchDailyPracticeSets = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/daily-practice');
      if (res.ok) {
        const data = await res.json();
        setSets(Array.isArray(data) ? data : []);
      } else {
        throw new Error('Failed to load daily practice sets');
      }
    } catch (err: any) {
      console.error("Error fetching daily practice sets:", err);
      setError(err.message || 'Error fetching data');
      setSets([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/daily-practice-categories');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setCategories(data);
        }
      }
    } catch (err) {
      console.error("Failed to fetch daily practice categories:", err);
    }
  };

  useEffect(() => {
    fetchDailyPracticeSets();
    fetchCategories();
  }, []);

  const [copiedShare, setCopiedShare] = useState(false);

  // Combine explicit categories with auto-detected categories from sets (ensuring 'सहायक शिक्षक' and existing sets always have a card)
  const effectiveCategories = useMemo(() => {
    const list = Array.isArray(categories) ? [...categories] : [];
    if (Array.isArray(sets)) {
      sets.forEach(set => {
        if (!set) return;
        const catName = (set.category || set.subject || 'सहायक शिक्षक').trim();
        if (catName && !list.some(c => c && c.name && c.name.trim().toLowerCase() === catName.toLowerCase())) {
          list.push({
            id: 'auto-' + catName,
            name: catName,
            subLabel: 'Teacher Sector',
            description: `${catName} परीक्षा हेतु विशेष प्रश्नोत्तरी एवं अभ्यास सेट`,
            iconName: 'GraduationCap',
            badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300'
          });
        }
      });
    }
    if (list.length === 0) {
      list.push({
        id: 'cat-default-1',
        name: 'सहायक शिक्षक',
        subLabel: 'Teacher Sector',
        description: 'सहायक शिक्षक परीक्षा हेतु विशेष वस्तुनिष्ठ प्रश्नोत्तरी एवं अभ्यास सेट',
        iconName: 'GraduationCap',
        badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300'
      });
    }
    return list;
  }, [categories, sets]);

  // Timer Effect
  useEffect(() => {
    let interval: any = null;
    if (activeSet && !isFinished) {
      interval = setInterval(() => {
        setTimerSeconds(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [activeSet, isFinished]);

  // Initial check from URL hash
  useEffect(() => {
    try {
      const hash = window.location.hash.replace('#', '');
      const parts = hash.split('/');
      if (parts[0] === 'daily-practice' && parts[1]) {
        setSelectedCategory(decodeURIComponent(parts[1]));
      }
    } catch (e) {
      console.error("Error reading daily practice URL:", e);
    }
  }, []);

  // PopState (Mobile Back Button) Listener inside Daily Practice
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      // 0. Close submit modal if open
      if (showSubmitModal) {
        setShowSubmitModal(false);
        return;
      }

      // 1. Close share modal if open
      if (shareConfig) {
        setShareConfig(null);
        return;
      }

      // 2. If user is currently running a practice test set
      if (activeSet) {
        if (!isFinished) {
          const confirmExit = window.confirm("क्या आप दैनिक अभ्यास टेस्ट से बाहर जाना चाहते हैं?\n\nआपकी प्रगति (हल किए गए प्रश्न व समय) सुरक्षित कर ली गई है। आप इसे बाद में कभी भी 'Resume Test' से जारी रख सकते हैं।");
          if (confirmExit) {
            setActiveSet(null);
            setIsFinished(false);
            checkSavedSession();
          } else {
            // Re-push test state so history stays synchronized
            window.history.pushState(
              { tab: 'daily-practice', category: selectedCategory, setDate: activeSet.date, view: 'daily-test' }, 
              '', 
              `#daily-practice/test/${encodeURIComponent(activeSet.date)}`
            );
          }
        } else {
          // Finished viewing scorecard -> return to category sets list
          setActiveSet(null);
          setIsFinished(false);
          checkSavedSession();
        }
        return;
      }

      // 3. If viewing a specific category sets list
      const stateCat = event.state?.category;
      const hashParts = window.location.hash.replace('#', '').split('/');
      const hashCat = hashParts[0] === 'daily-practice' && hashParts[1] && hashParts[1] !== 'test'
        ? decodeURIComponent(hashParts[1]) 
        : null;

      if (stateCat || hashCat) {
        setSelectedCategory(stateCat || hashCat);
      } else if (selectedCategory) {
        setSelectedCategory(null);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [showSubmitModal, shareConfig, activeSet, isFinished, selectedCategory]);

  const handleSelectCategory = (catName: string) => {
    setSelectedCategory(catName);
    window.history.pushState(
      { tab: 'daily-practice', category: catName, view: 'daily-category' }, 
      '', 
      `#daily-practice/${encodeURIComponent(catName)}`
    );
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToCategories = () => {
    setSelectedCategory(null);
    setActiveSet(null);
    checkSavedSession();
    window.history.pushState({ tab: 'daily-practice', view: 'tab' }, '', '#daily-practice');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStartSet = (set: DailyPracticeSet) => {
    // If there is saved progress for this set, prompt user
    if (savedSession && (savedSession.setId === set.id || savedSession.setDate === set.date)) {
      const answeredCount = Object.keys(savedSession.selectedAnswers || {}).length;
      const resumeChoice = window.confirm(`इस टेस्ट में आपकी पहले की प्रगति सुरक्षित है (${answeredCount} प्रश्न हल किए गए)।\n\nक्या आप वहीं से टेस्ट जारी (Resume) रखना चाहते हैं?\n\n[OK] = टेस्ट जारी रखें (Resume)\n[Cancel] = नया टेस्ट शुरू करें (Start Fresh)`);
      if (resumeChoice) {
        handleResumeSession(savedSession);
        return;
      }
    }

    setActiveSet(set);
    setCurrentIndex(0);
    setSelectedAnswers({});
    setShowExplanations({});
    setIsFinished(false);
    setTimerSeconds(0);
    window.history.pushState(
      { tab: 'daily-practice', category: selectedCategory, setDate: set.date, view: 'daily-test' }, 
      '', 
      `#daily-practice/test/${encodeURIComponent(set.date)}`
    );
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleResumeSession = (targetSession?: SavedDailySession | null) => {
    const session = targetSession || savedSession;
    if (!session) return;

    // Match set by ID or date from loaded sets
    let matchedSet = sets.find(s => s.id === session.setId || s.date === session.setDate);
    if (!matchedSet) {
      alert("यह टेस्ट सेट वर्तमान में लोड नहीं हो सका। कृपया पुनः प्रयास करें।");
      return;
    }

    setActiveSet(matchedSet);
    const validQuestionsCount = matchedSet.questions?.length || 1;
    setCurrentIndex(Math.min(session.currentIndex || 0, validQuestionsCount - 1));
    setSelectedAnswers(session.selectedAnswers || {});
    setShowExplanations(session.showExplanations || {});
    setInstantMode(session.instantMode !== undefined ? session.instantMode : true);
    setTimerSeconds(session.timerSeconds || 0);
    setIsFinished(false);
    setShowSubmitModal(false);

    if (session.category) {
      setSelectedCategory(session.category);
    }

    window.history.pushState(
      { tab: 'daily-practice', category: session.category || selectedCategory, setDate: matchedSet.date, view: 'daily-test' }, 
      '', 
      `#daily-practice/test/${encodeURIComponent(matchedSet.date)}`
    );
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDiscardSavedSession = () => {
    if (window.confirm("क्या आप सहेजे गए अधूरे टेस्ट को हटाना चाहते हैं?")) {
      try {
        localStorage.removeItem(DAILY_PRACTICE_PROGRESS_KEY);
        setSavedSession(null);
      } catch (e) {
        console.error("Error clearing saved session:", e);
      }
    }
  };

  const handleExitSet = () => {
    if (!isFinished) {
      if (confirm("क्या आप टेस्ट से बाहर जाना चाहते हैं?\n\nआपकी प्रगति (हल किए गए प्रश्न व समय) सुरक्षित कर ली गई है। आप इसे बाद में कभी भी 'Resume' कर सकते हैं।")) {
        setActiveSet(null);
        checkSavedSession();
        if (selectedCategory) {
          window.history.pushState(
            { tab: 'daily-practice', category: selectedCategory, view: 'daily-category' }, 
            '', 
            `#daily-practice/${encodeURIComponent(selectedCategory)}`
          );
        } else {
          window.history.pushState({ tab: 'daily-practice', view: 'tab' }, '', '#daily-practice');
        }
      }
    } else {
      setActiveSet(null);
      setIsFinished(false);
      checkSavedSession();
      if (selectedCategory) {
        window.history.pushState(
          { tab: 'daily-practice', category: selectedCategory, view: 'daily-category' }, 
          '', 
          `#daily-practice/${encodeURIComponent(selectedCategory)}`
        );
      } else {
        window.history.pushState({ tab: 'daily-practice', view: 'tab' }, '', '#daily-practice');
      }
    }
  };

  const handleOptionSelect = (qIndex: number, optIndex: number) => {
    if (isFinished) return;
    setSelectedAnswers(prev => ({ ...prev, [qIndex]: optIndex }));
    if (instantMode) {
      setShowExplanations(prev => ({ ...prev, [qIndex]: true }));
    }
  };

  const handleFinishPractice = () => {
    setIsFinished(true);
    setShowSubmitModal(false);

    // Clear saved session from storage upon completion
    try {
      localStorage.removeItem(DAILY_PRACTICE_PROGRESS_KEY);
      setSavedSession(null);
    } catch (e) {
      console.error("Error removing saved session:", e);
    }

    // Show all explanations on review
    const allExp: Record<number, boolean> = {};
    if (activeSet && Array.isArray(activeSet.questions)) {
      activeSet.questions.forEach((_, idx) => {
        allExp[idx] = true;
      });
    }
    setShowExplanations(allExp);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m} मिनट ${s < 10 ? '0' : ''}${s} से०`;
  };

  // Calculate Results
  const calculateScore = () => {
    if (!activeSet || !Array.isArray(activeSet.questions) || activeSet.questions.length === 0) {
      return { correct: 0, wrong: 0, skipped: 0, score: 0, maxScore: 0, percentage: '0.0' };
    }
    let correct = 0;
    let wrong = 0;
    let skipped = 0;

    const totalQuestions = activeSet.questions.length;
    const marksPerQuestion = 2; // CGPSC / Vyapam pattern: 2 marks per question
    const negativeMark = 0.66; // 1/3 negative marking

    activeSet.questions.forEach((q, idx) => {
      if (!q) return;
      const ans = selectedAnswers[idx];
      if (ans === undefined) {
        skipped++;
      } else if (ans === q.correctAnswer) {
        correct++;
      } else {
        wrong++;
      }
    });

    const maxScore = totalQuestions * marksPerQuestion;
    const rawScore = (correct * marksPerQuestion) - (wrong * negativeMark);
    const score = rawScore < 0 ? 0 : rawScore;
    const percentage = maxScore > 0 ? ((score / maxScore) * 100).toFixed(1) : '0.0';

    return {
      correct,
      wrong,
      skipped,
      score,
      maxScore,
      percentage
    };
  };

  // Share Test Handlers
  const getShareMessage = () => {
    if (!activeSet) return '';
    return `🎯 *TestArena - डेली प्रैक्टिस क्विज़ (CGPSC / व्यापमं)* 🎯
---------------------------------------
📝 *विषय:* ${activeSet.title}
📅 *दिनांक:* ${activeSet.date}

🔥 आप भी आज का यह निःशुल्क डेली प्रैक्टिस टेस्ट दें और अपनी तैयारी बेहतर करें!
👉 *अभी टेस्ट देने के लिए लिंक खोलें:* https://testarena.co.in`;
  };

  const handleShareResultWhatsApp = () => {
    const text = getShareMessage();
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleCopyResultLink = () => {
    const text = getShareMessage();
    navigator.clipboard.writeText(text);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2500);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center py-12 px-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600"></div>
        <p className="mt-3 text-xs font-bold text-emerald-800">डेली प्रैक्टिस सेट लोड हो रहे हैं...</p>
      </div>
    );
  }

  // Active Practice View
  if (activeSet) {
    const questions = activeSet.questions || [];
    const currentQuestion: DailyPracticeQuestion | undefined = questions[currentIndex];
    const stats = calculateScore();

    return (
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Top Header Controls */}
        <div className="bg-white rounded-2xl border border-emerald-100 p-4 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={handleExitSet}
              className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl transition cursor-pointer flex items-center gap-1 text-xs font-bold"
            >
              <ArrowLeft className="h-4 w-4" /> वापस सूची
            </button>
            <div>
              <h2 className="text-sm font-extrabold text-gray-900 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-500" /> {activeSet.title}
              </h2>
              <p className="text-[11px] text-gray-500 font-medium">
                तारीख: {activeSet.date} | विषय: {activeSet.subject}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-800 px-3 py-1.5 rounded-xl text-xs font-bold border border-emerald-200">
              <Clock className="h-3.5 w-3.5 text-emerald-600" />
              <span>{formatTime(timerSeconds)}</span>
            </div>

            {!isFinished && (
              <>
                <button
                  onClick={() => setInstantMode(!instantMode)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border cursor-pointer ${
                    instantMode 
                      ? 'bg-amber-50 text-amber-800 border-amber-300' 
                      : 'bg-gray-100 text-gray-700 border-gray-300'
                  }`}
                  title="तुरंत उत्तर व व्याख्या देखने के लिए टॉगल करें"
                >
                  <Zap className={`h-3.5 w-3.5 ${instantMode ? 'text-amber-500 fill-amber-400' : 'text-gray-400'}`} />
                  {instantMode ? 'तत्काल व्याख्या चालू' : 'टेस्ट मोड'}
                </button>

                <button
                  onClick={() => setShowSubmitModal(true)}
                  className="bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-extrabold px-3.5 py-1.5 rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer border border-amber-600/30"
                  title="क्विज़ समाप्त करें और स्कोरकार्ड देखें"
                >
                  <CheckCircle className="h-3.5 w-3.5" />
                  <span>सबमिट करें</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Submit Confirmation Modal */}
        {showSubmitModal && !isFinished && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-5 animate-scaleUp">
              <div className="flex items-center gap-3.5">
                <div className="h-12 w-12 rounded-2xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
                  <CheckCircle className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-gray-900">क्विज़ सबमिट करना चाहते हैं?</h3>
                  <p className="text-xs text-gray-500 font-medium">सबमिट करने के बाद आपका स्कोरकार्ड व सभी प्रश्नों की व्याख्या दिखेगी।</p>
                </div>
              </div>

              {/* Status Summary */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 grid grid-cols-3 gap-2 text-center text-xs">
                <div className="bg-white p-2.5 rounded-xl border border-slate-100">
                  <p className="text-[10px] text-gray-500 font-bold uppercase">कुल प्रश्न</p>
                  <p className="text-lg font-black text-gray-900">{questions.length}</p>
                </div>
                <div className="bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-200/50">
                  <p className="text-[10px] text-emerald-700 font-bold uppercase">हल किए (Answered)</p>
                  <p className="text-lg font-black text-emerald-700">{Object.keys(selectedAnswers).length}</p>
                </div>
                <div className="bg-amber-50/70 p-2.5 rounded-xl border border-amber-200/50">
                  <p className="text-[10px] text-amber-700 font-bold uppercase">छूटे हुए (Left)</p>
                  <p className="text-lg font-black text-amber-700">{Math.max(0, questions.length - Object.keys(selectedAnswers).length)}</p>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-gray-600 bg-gray-50 px-3.5 py-2 rounded-xl border border-gray-200 font-medium">
                <span className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-emerald-600" /> समय लिया गया:
                </span>
                <span className="font-bold text-gray-900">{formatTime(timerSeconds)}</span>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  नहीं, टेस्ट जारी रखें
                </button>
                <button
                  type="button"
                  onClick={handleFinishPractice}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <CheckCircle className="h-4 w-4" /> हाँ, सबमिट करें
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Finished Result Banner */}
        {isFinished && (
          <div className="bg-gradient-to-br from-emerald-800 via-teal-900 to-emerald-950 text-white p-6 sm:p-7 rounded-3xl shadow-xl space-y-5 border border-emerald-700/60">
            <div className="flex flex-wrap items-center justify-between border-b border-emerald-600/40 pb-4 gap-2">
              <div className="space-y-1">
                <span className="text-[10px] font-extrabold text-amber-300 bg-amber-400/20 px-3 py-1 rounded-full border border-amber-300/30 uppercase tracking-wider">
                  परीक्षा परिणाम कार्ड (Scorecard)
                </span>
                <h3 className="text-base sm:text-lg font-black flex items-center gap-2">
                  <Award className="h-5 w-5 text-amber-300" /> डेली प्रैक्टिस परिणाम (Practice Summary)
                </h3>
              </div>
              <span className="bg-white/10 border border-white/20 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-amber-300" /> समय लिया: {formatTime(timerSeconds)}
              </span>
            </div>

            {/* Metrics Breakdown Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
              <div className="bg-white/10 backdrop-blur-xs p-3 rounded-2xl border border-white/10 flex flex-col justify-between">
                <p className="text-[10px] text-emerald-200 font-bold uppercase">कुल प्रश्न</p>
                <p className="text-xl font-black">{questions.length}</p>
                <p className="text-[10px] text-emerald-300 font-medium">{questions.length * 2} कुल अंक</p>
              </div>

              <div className="bg-emerald-500/20 backdrop-blur-xs p-3 rounded-2xl border border-emerald-400/30 flex flex-col justify-between">
                <p className="text-[10px] text-emerald-200 font-bold uppercase">सही उत्तर (+2 अंक)</p>
                <p className="text-xl font-black text-emerald-200">{stats.correct}</p>
                <p className="text-[10px] text-emerald-300 font-bold">+{stats.correct * 2} अंक</p>
              </div>

              <div className="bg-red-500/20 backdrop-blur-xs p-3 rounded-2xl border border-red-400/30 flex flex-col justify-between">
                <p className="text-[10px] text-red-200 font-bold uppercase">गलत उत्तर (-0.66)</p>
                <p className="text-xl font-black text-red-200">{stats.wrong}</p>
                <p className="text-[10px] text-red-300 font-bold">-{ (stats.wrong * 0.66).toFixed(2) } अंक</p>
              </div>

              <div className="bg-slate-800/40 backdrop-blur-xs p-3 rounded-2xl border border-slate-700/50 flex flex-col justify-between">
                <p className="text-[10px] text-slate-300 font-bold uppercase">छोड़े गए</p>
                <p className="text-xl font-black text-slate-200">{stats.skipped}</p>
                <p className="text-[10px] text-slate-400 font-medium">0 अंक</p>
              </div>

              <div className="bg-amber-500/20 backdrop-blur-xs p-3 rounded-2xl border border-amber-400/40 col-span-2 sm:col-span-1 flex flex-col justify-between">
                <p className="text-[10px] text-amber-200 font-bold uppercase">कुल प्राप्तांक</p>
                <p className="text-xl font-black text-amber-300">{stats.score.toFixed(2)} / {stats.maxScore}</p>
                <p className="text-[10px] text-amber-200 font-bold">{stats.percentage}% शुद्धता</p>
              </div>
            </div>

            {/* Marking Rules Explanatory Box */}
            <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-emerald-700/40 text-[11px] text-emerald-100 flex items-start gap-2.5">
              <HelpCircle className="h-4.5 w-4.5 text-amber-300 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="font-extrabold text-amber-300">मार्किंग नियम (CGPSC / व्यापमं पैटर्न):</p>
                <p className="text-emerald-100/90 leading-relaxed">
                  प्रत्येक सही उत्तर हेतु <b>+2 अंक</b> प्रदान किए जाते हैं तथा गलत उत्तर देने पर <b>1/3 ऋणात्मक अंक (-0.66 अंक)</b> काटा जाता है।
                </p>
              </div>
            </div>

            {/* Action Bar: Share Test & Retake */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-emerald-700/40">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setShareConfig({
                    type: 'result',
                    quizTitle: activeSet.title,
                    score: stats.score,
                    maxScore: stats.maxScore,
                    percentage: stats.percentage,
                    correct: stats.correct,
                    wrong: stats.wrong
                  })}
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs transition flex items-center gap-2 shadow-md cursor-pointer transform hover:scale-105"
                >
                  <Share2 className="h-4 w-4 text-slate-950" />
                  स्कोरकार्ड शेयर करें (Share Result)
                </button>

                <button
                  onClick={() => setShareConfig({
                    type: 'daily',
                    date: activeSet.date,
                    subject: activeSet.title
                  })}
                  className="bg-white/10 hover:bg-white/20 text-white font-bold px-3 py-2.5 rounded-xl text-xs transition border border-white/20 cursor-pointer flex items-center gap-1.5"
                >
                  <Share2 className="h-3.5 w-3.5" /> टेस्ट शेयर करें
                </button>
              </div>

              <button
                onClick={() => {
                  setSelectedAnswers({});
                  setShowExplanations({});
                  setIsFinished(false);
                  setTimerSeconds(0);
                  setCurrentIndex(0);
                }}
                className="bg-white text-emerald-900 hover:bg-emerald-50 font-black px-4 py-2.5 rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <RotateCcw className="h-3.5 w-3.5" /> पुनः टेस्ट दें
              </button>
            </div>
          </div>
        )}

        {/* Question Counter Grid */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
              <BookOpen className="h-4 w-4 text-emerald-600" /> प्रश्न नेविगेटर ({currentIndex + 1}/{questions.length})
            </span>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
              हल किए गए: {Object.keys(selectedAnswers).length}/{questions.length}
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1">
            {questions.map((_, idx) => {
              const isCurrent = idx === currentIndex;
              const isAnswered = selectedAnswers[idx] !== undefined;
              const qItem = questions[idx];
              const isCorrect = isFinished && qItem && selectedAnswers[idx] === qItem.correctAnswer;
              const isWrong = isFinished && isAnswered && qItem && selectedAnswers[idx] !== qItem.correctAnswer;

              let btnBg = "bg-gray-100 text-gray-700 hover:bg-gray-200";
              if (isFinished) {
                if (isCorrect) btnBg = "bg-emerald-600 text-white font-bold";
                else if (isWrong) btnBg = "bg-red-500 text-white font-bold";
                else btnBg = "bg-gray-200 text-gray-500";
              } else if (isAnswered) {
                btnBg = "bg-emerald-500 text-white font-bold";
              }

              return (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-8 w-8 rounded-lg text-xs font-extrabold transition cursor-pointer flex items-center justify-center border ${
                    isCurrent ? 'ring-2 ring-emerald-600 ring-offset-1 border-emerald-600 scale-105 z-10' : 'border-transparent'
                  } ${btnBg}`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
        </div>

        {/* Current Question Display */}
        {currentQuestion && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-6">
            {/* Question Header & HTML Content */}
            <div className="space-y-3 border-b border-gray-100 pb-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  प्रश्न क्रमांक #{currentIndex + 1}
                </span>
                {currentQuestion.subjectTag && (
                  <span className="text-[11px] font-bold text-gray-500 bg-gray-100 px-2.5 py-0.5 rounded-md">
                    {currentQuestion.subjectTag}
                  </span>
                )}
              </div>

              {/* HTML Rendered Question Text */}
              <div 
                className="text-base sm:text-lg font-bold text-gray-900 leading-relaxed space-y-2 prose prose-emerald max-w-none"
                dangerouslySetInnerHTML={{ __html: currentQuestion?.questionHtml || '' }}
              />
            </div>

            {/* Options List */}
            <div className="space-y-3">
              <p className="text-xs font-extrabold text-gray-500 uppercase tracking-wider">
                विकल्प चुनें (Select Option):
              </p>
              <div className="grid grid-cols-1 gap-2.5">
                {(Array.isArray(currentQuestion?.optionsHtml) ? currentQuestion.optionsHtml : []).map((optHtml, oIdx) => {
                  const isSelected = selectedAnswers[currentIndex] === oIdx;
                  const isAnswered = selectedAnswers[currentIndex] !== undefined;
                  const isCorrectAnswer = currentQuestion.correctAnswer === oIdx;
                  // Feedback is shown ONLY if the test is finished, OR if the question has been answered and instantMode/explanation is enabled
                  const showFeedback = isFinished || (isAnswered && (instantMode || showExplanations[currentIndex]));

                  let optClass = "border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/40 text-gray-800 bg-white";
                  let optionBadge = "bg-gray-100 text-gray-700";

                  if (showFeedback) {
                    if (isCorrectAnswer) {
                      optClass = "border-emerald-500 bg-emerald-50 text-emerald-900 font-extrabold ring-2 ring-emerald-500/20";
                      optionBadge = "bg-emerald-600 text-white font-bold";
                    } else if (isSelected && !isCorrectAnswer) {
                      optClass = "border-red-400 bg-red-50 text-red-900 font-bold";
                      optionBadge = "bg-red-500 text-white font-bold";
                    }
                  } else if (isSelected) {
                    optClass = "border-emerald-600 bg-emerald-50 text-emerald-900 font-bold ring-2 ring-emerald-500/20";
                    optionBadge = "bg-emerald-600 text-white font-bold";
                  }

                  const optionLetters = ['A', 'B', 'C', 'D', 'E'];

                  return (
                    <button
                      key={oIdx}
                      onClick={() => handleOptionSelect(currentIndex, oIdx)}
                      className={`w-full text-left p-4 rounded-xl border transition flex items-start gap-3 cursor-pointer ${optClass}`}
                    >
                      <span className={`h-6 w-6 rounded-lg text-xs font-extrabold flex items-center justify-center shrink-0 mt-0.5 ${optionBadge}`}>
                        {optionLetters[oIdx] || oIdx + 1}
                      </span>
                      <div 
                        className="text-sm font-medium leading-normal prose max-w-none flex-1"
                        dangerouslySetInnerHTML={{ __html: optHtml }}
                      />
                      {showFeedback && isCorrectAnswer && (
                        <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                      )}
                      {showFeedback && isSelected && !isCorrectAnswer && (
                        <XCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Explanation / Solution Section */}
            {(isFinished || (selectedAnswers[currentIndex] !== undefined && (instantMode || showExplanations[currentIndex]))) && currentQuestion.explanationHtml && (
              <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 sm:p-5 space-y-2 animate-fadeIn">
                <div className="flex items-center gap-2 text-amber-900 font-extrabold text-xs">
                  <HelpCircle className="h-4 w-4 text-amber-600" />
                  <span>उत्तर की विस्तृत व्याख्या एवं विश्लेषण:</span>
                </div>
                <div 
                  className="text-xs sm:text-sm text-amber-950 leading-relaxed font-medium prose max-w-none"
                  dangerouslySetInnerHTML={{ __html: currentQuestion.explanationHtml }}
                />
              </div>
            )}

            {/* Bottom Controls */}
            <div className="flex flex-wrap items-center justify-between pt-4 border-t border-gray-100 gap-2">
              <button
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex(prev => prev - 1)}
                className="bg-gray-100 hover:bg-gray-200 disabled:opacity-40 text-gray-700 font-bold px-4 py-2.5 rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
              >
                <ArrowLeft className="h-4 w-4" /> पिछला प्रश्न
              </button>

              {!isFinished && (
                <button
                  onClick={() => setShowSubmitModal(true)}
                  className="bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-extrabold px-4 py-2.5 rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer shadow-xs border border-amber-600/30"
                >
                  <CheckCircle className="h-4 w-4" /> सबमिट करें (Submit Test)
                </button>
              )}

              {!isFinished ? (
                currentIndex === questions.length - 1 ? (
                  <button
                    onClick={() => setShowSubmitModal(true)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-5 sm:px-6 py-2.5 rounded-xl text-xs transition flex items-center gap-2 cursor-pointer shadow-xs"
                  >
                    <CheckCircle className="h-4 w-4" /> प्रैक्टिस समाप्त करें
                  </button>
                ) : (
                  <button
                    onClick={() => setCurrentIndex(prev => prev + 1)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-5 py-2.5 rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    अगला प्रश्न <ArrowRight className="h-4 w-4" />
                  </button>
                )
              ) : (
                <button
                  onClick={() => setCurrentIndex(prev => (prev < questions.length - 1 ? prev + 1 : 0))}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-5 py-2.5 rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  अगला प्रश्न समीक्षा <ArrowRight className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center py-12 px-4 text-center space-y-4">
        <div className="p-3 bg-red-100 text-red-600 rounded-full">
          <HelpCircle className="h-8 w-8" />
        </div>
        <h3 className="text-base font-bold text-gray-800">डेली प्रैक्टिस सेट लोड करने में समस्या आई</h3>
        <p className="text-xs text-gray-500 max-w-md">{error}</p>
        <button
          onClick={() => {
            fetchDailyPracticeSets();
            fetchCategories();
          }}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs transition cursor-pointer"
        >
          पुनः प्रयास करें (Retry)
        </button>
      </div>
    );
  }

  // Filter Sets by Selected Category
  const filteredSets = (Array.isArray(sets) ? sets : []).filter(set => {
    if (!set) return false;
    if (!selectedCategory || selectedCategory === 'all') return true;
    const targetCat = (selectedCategory || '').trim().toLowerCase();
    const setCat = (set.category || set.subject || 'सहायक शिक्षक').trim().toLowerCase();
    return setCat === targetCat;
  });

  // Current selected category details
  const activeCategoryObj = effectiveCategories.find(c => c.name === selectedCategory || c.id === selectedCategory);

  // List of Available Daily Practice Sets or Category Cards
  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-900 text-white rounded-3xl p-6 sm:p-10 shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 opacity-10 pointer-events-none transform translate-x-12 -translate-y-6">
          <BookOpen className="w-80 h-80 text-white" />
        </div>

        <div className="relative z-10 space-y-4 max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-amber-400/20 text-amber-300 px-3.5 py-1.5 rounded-full text-xs font-extrabold border border-amber-400/30">
            <Sparkles className="h-4 w-4 text-amber-300" /> डेली प्रैक्टिस (शिक्षक एवं सहायक शिक्षक)
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight">
            {selectedCategory && activeCategoryObj 
              ? `${activeCategoryObj.name} - डेली प्रैक्टिस` 
              : 'डेली प्रैक्टिस (शिक्षक एवं सहायक शिक्षक)'}
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100 font-medium leading-relaxed">
            सहायक शिक्षक, शिक्षक कृषि, शिक्षक हिंदी, शिक्षक अंग्रेजी, शिक्षक गणित, शिक्षक विज्ञान आदि भर्ती परीक्षाओं के लिए अपने विषय के अनुसार डेली प्रैक्टिस प्रश्न हल करें।
          </p>

          <div className="flex flex-wrap gap-4 pt-2 text-xs font-bold text-emerald-200">
            <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-xl border border-white/10">
              <Calendar className="h-4 w-4 text-emerald-300" /> विषयवार एवं पदवार प्रश्न
            </span>
            <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-xl border border-white/10">
              <Zap className="h-4 w-4 text-amber-300" /> तत्काल उत्तर व व्याख्या
            </span>
            <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-xl border border-white/10">
              <FileText className="h-4 w-4 text-emerald-300" /> 100% निःशुल्क टेस्ट
            </span>
          </div>
        </div>
      </div>

      {/* RESUME INCOMPLETE TEST BANNER (If a saved session exists) */}
      {savedSession && (
        <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-emerald-700 text-white rounded-3xl p-5 sm:p-6 shadow-xl border-2 border-amber-300/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative overflow-hidden animate-fadeIn">
          <div className="flex items-center gap-4 relative z-10">
            <div className="h-12 w-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/30 text-amber-100 shadow-inner">
              <RotateCcw className="h-6 w-6 animate-spin-slow" />
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="bg-white/25 text-white font-black text-[10px] uppercase px-2.5 py-0.5 rounded-full tracking-wider border border-white/40">
                  अधूरा टेस्ट सहेजा गया है (Unfinished Test)
                </span>
                <span className="text-[11px] text-amber-100 font-bold bg-black/20 px-2 py-0.5 rounded-md">
                  दिनांक: {savedSession.setDate}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-extrabold text-white leading-snug">
                {savedSession.setTitle}
              </h3>
              <p className="text-xs text-amber-100 font-medium">
                हल किए गए प्रश्न: <b className="text-white font-extrabold">{Object.keys(savedSession.selectedAnswers || {}).length}</b> | समय लिया: <b className="text-white font-extrabold">{formatTime(savedSession.timerSeconds || 0)}</b>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full md:w-auto justify-end relative z-10 pt-2 md:pt-0 border-t md:border-t-0 border-white/20">
            <button
              onClick={handleDiscardSavedSession}
              className="px-3.5 py-2.5 bg-black/25 hover:bg-black/40 text-amber-100 hover:text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border border-white/20"
              title="सहेजे गए टेस्ट को हटाएं"
            >
              <Trash2 className="h-4 w-4" /> हटाएं
            </button>
            <button
              onClick={() => handleResumeSession(savedSession)}
              className="flex-1 md:flex-none px-5 py-2.5 bg-white hover:bg-amber-50 text-slate-900 font-extrabold rounded-xl text-xs shadow-lg transition flex items-center justify-center gap-2 cursor-pointer transform hover:scale-105 active:scale-95"
            >
              <Play className="h-4 w-4 fill-slate-900 text-slate-900" /> टेस्ट जारी रखें (Resume Test)
            </button>
          </div>
        </div>
      )}

      {/* VIEW 1: CATEGORY CARDS VIEW (When no category is selected) */}
      {!selectedCategory && (
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-gray-200 pb-3">
            <div>
              <h2 className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
                <Layers className="h-5 w-5 text-emerald-600" /> अपना पद / विषय चुनें (Select Subject Sector)
              </h2>
              <p className="text-xs text-gray-500 mt-1 font-medium">
                जिस परीक्षा की आप तैयारी कर रहे हैं उस कार्ड पर क्लिक करके विषयवार डेली प्रैक्टिस सेट हल करें:
              </p>
            </div>
            <span className="hidden sm:inline-flex text-xs font-extrabold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              कुल सेट: {sets.length}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {effectiveCategories.map(cat => {
              const count = sets.filter(s => {
                const setCat = (s.category || s.subject || 'सहायक शिक्षक').trim().toLowerCase();
                const catName = cat.name.trim().toLowerCase();
                return setCat === catName;
              }).length;
              const IconComp = getCategoryIcon(cat.iconName);

              return (
                <div
                  key={cat.id || cat.name}
                  onClick={() => handleSelectCategory(cat.name)}
                  className="bg-white rounded-2xl border-2 border-emerald-100 hover:border-emerald-400 hover:shadow-lg p-6 transition-all duration-200 flex flex-col justify-between cursor-pointer group transform hover:-translate-y-1"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="p-3 rounded-2xl bg-emerald-600 text-white shadow-sm group-hover:scale-110 transition-transform">
                        <IconComp className="h-6 w-6" />
                      </div>
                      <span className={`text-xs font-extrabold px-3 py-1 rounded-full border ${cat.badgeColor || 'bg-emerald-100 text-emerald-900 border-emerald-300'}`}>
                        {count} अभ्यास सेट
                      </span>
                    </div>

                    <div>
                      <h3 className="text-lg font-extrabold text-gray-900 group-hover:text-emerald-700 transition">
                        {cat.name}
                      </h3>
                      {cat.subLabel && (
                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">
                          {cat.subLabel}
                        </p>
                      )}
                    </div>

                    <p className="text-xs text-gray-600 leading-relaxed font-medium">
                      {cat.description || `${cat.name} परीक्षा हेतु महत्वपूर्ण अभ्यास सेट`}
                    </p>
                  </div>

                  <div className="pt-4 mt-4 border-t border-gray-100 flex items-center justify-between text-xs font-extrabold text-emerald-700 group-hover:text-emerald-800">
                    <span>डेली प्रैक्टिस सेट देखें</span>
                    <div className="bg-emerald-50 group-hover:bg-emerald-600 group-hover:text-white p-1.5 rounded-lg transition">
                      <ChevronRight className="h-4 w-4" />
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Combined All Categories Card */}
            <div
              onClick={() => handleSelectCategory('all')}
              className="bg-gradient-to-br from-teal-900 to-emerald-950 text-white rounded-2xl border-2 border-teal-700 hover:border-amber-400 p-6 transition-all duration-200 shadow-md hover:shadow-xl flex flex-col justify-between cursor-pointer group transform hover:-translate-y-1"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="p-3 rounded-2xl bg-amber-400 text-gray-950 shadow-sm group-hover:scale-110 transition-transform">
                    <GraduationCap className="h-6 w-6" />
                  </div>
                  <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-300/40">
                    {sets.length} कुल सेट
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-extrabold text-white group-hover:text-amber-300 transition">
                    सभी विषय / पद सेट (All Sets)
                  </h3>
                  <p className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider mt-0.5">
                    Combined Practice Repository
                  </p>
                </div>

                <p className="text-xs text-emerald-100 leading-relaxed font-medium">
                  शिक्षक एवं सहायक शिक्षक परीक्षा के सभी विषयों व तिथियों के डेली प्रैक्टिस सेट एक साथ देखें।
                </p>
              </div>

              <div className="pt-4 mt-4 border-t border-white/10 flex items-center justify-between text-xs font-extrabold text-amber-300">
                <span>सभी टेस्ट देखें</span>
                <div className="bg-white/10 group-hover:bg-amber-400 group-hover:text-gray-950 p-1.5 rounded-lg transition">
                  <ChevronRight className="h-4 w-4" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: DATE-WISE PRACTICE SETS VIEW (When a category card is selected) */}
      {selectedCategory && (
        <div className="space-y-6">
          {/* Back Button & Category Info Header Bar */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
            <button
              onClick={handleBackToCategories}
              className="bg-white hover:bg-emerald-100 text-emerald-900 font-extrabold px-4 py-2.5 rounded-xl text-xs border border-emerald-300 transition flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <ArrowLeft className="h-4 w-4 text-emerald-700" /> ← अन्य विषय / पद श्रेणियां देखें
            </button>

            <div className="flex items-center gap-2">
              <span className="text-xs text-emerald-800 font-bold hidden sm:inline">चयनित श्रेणी:</span>
              <span className={`text-xs font-extrabold px-3.5 py-1.5 rounded-xl border shadow-2xs ${activeCategoryObj?.badgeColor || 'bg-emerald-100 text-emerald-900 border-emerald-300'}`}>
                {activeCategoryObj?.name || (selectedCategory === 'all' ? 'सभी पद (All Sets)' : selectedCategory)}
              </span>
              <span className="text-xs font-extrabold text-emerald-900 bg-white px-3 py-1.5 rounded-xl border border-emerald-200">
                {filteredSets.length} सेट उपलब्ध
              </span>
            </div>
          </div>

          {/* Secondary Quick Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-[11px] font-extrabold text-gray-500 whitespace-nowrap flex items-center gap-1">
              <Filter className="h-3.5 w-3.5" /> पद बदलें:
            </span>
            {categories.map(cat => {
              const isActive = selectedCategory === cat.name;
              return (
                <button
                  key={cat.id || cat.name}
                  onClick={() => handleSelectCategory(cat.name)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-extrabold whitespace-nowrap transition cursor-pointer ${
                    isActive
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'bg-white text-gray-700 border border-gray-200 hover:bg-emerald-50 hover:border-emerald-300'
                  }`}
                >
                  {cat.name}
                </button>
              );
            })}
            <button
              onClick={() => handleSelectCategory('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold whitespace-nowrap transition cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-teal-800 text-white shadow-xs'
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-teal-50 hover:border-teal-300'
              }`}
            >
              सभी पद (All)
            </button>
          </div>

          {/* Sets Grid */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <h2 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-emerald-600" /> {activeCategoryObj?.name || (selectedCategory === 'all' ? 'सभी पद' : selectedCategory)} - डेट वाइज प्रैक्टिस सेट सूची
              </h2>
            </div>

            {filteredSets.length === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-10 text-center space-y-4">
                <BookOpen className="h-12 w-12 text-gray-300 mx-auto" />
                <div className="space-y-1">
                  <p className="text-sm font-bold text-gray-700">
                    "{activeCategoryObj?.name || selectedCategory}" श्रेणी में अभी कोई प्रैक्टिस सेट उपलब्ध नहीं है।
                  </p>
                  <p className="text-xs text-gray-500">
                    एडमिन द्वारा जल्द ही इस विषय के नए वस्तुनिष्ठ प्रश्न लाइव किए जाएंगे।
                  </p>
                </div>
                <button
                  onClick={handleBackToCategories}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-5 py-2.5 rounded-xl text-xs transition inline-flex items-center gap-2 cursor-pointer"
                >
                  <ArrowLeft className="h-4 w-4" /> अन्य पद / विषय श्रेणियां देखें
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredSets.map((set, idx) => {
                  const qCount = set.questions?.length || 0;
                  const isSavedForThisSet = savedSession && (savedSession.setId === set.id || savedSession.setDate === set.date);
                  const savedAnsweredCount = isSavedForThisSet ? Object.keys(savedSession?.selectedAnswers || {}).length : 0;

                  return (
                    <div 
                      key={set.id}
                      className={`bg-white rounded-2xl border p-5 hover:shadow-md transition space-y-4 flex flex-col justify-between group ${
                        isSavedForThisSet 
                          ? 'border-amber-300 ring-2 ring-amber-400/20 bg-amber-50/20' 
                          : 'border-gray-200 hover:border-emerald-300'
                      }`}
                    >
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-xs font-extrabold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200 flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-emerald-600" /> {set.date}
                          </span>
                          
                          {isSavedForThisSet ? (
                            <span className="text-[11px] font-extrabold text-amber-900 bg-amber-100 px-2.5 py-1 rounded-lg border border-amber-300 flex items-center gap-1 animate-pulse">
                              <RotateCcw className="h-3 w-3 text-amber-700" /> प्रगति सहेजी गई ({savedAnsweredCount}/{qCount})
                            </span>
                          ) : (
                            <span className="text-[11px] font-extrabold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200">
                              {set.category || set.subject || 'सामान्य'}
                            </span>
                          )}
                        </div>

                        <h3 className="text-base font-extrabold text-gray-900 group-hover:text-emerald-700 transition leading-snug pt-1">
                          {set.title}
                        </h3>
                        
                        {set.description && (
                          <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                            {set.description}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs text-gray-500 font-bold px-1">
                          <span>{qCount} महत्वपूर्ण प्रश्न</span>
                          <span>{set.durationMinutes || 20} मिनट</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {isSavedForThisSet ? (
                            <button
                              onClick={() => handleResumeSession(savedSession)}
                              className="flex-1 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-extrabold py-3 rounded-xl text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-md"
                            >
                              <Play className="h-4 w-4 fill-white" /> टेस्ट जारी रखें (Resume Practice)
                            </button>
                          ) : (
                            <button
                              onClick={() => handleStartSet(set)}
                              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3 rounded-xl text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-xs group-hover:bg-emerald-700"
                            >
                              <Zap className="h-4 w-4 text-amber-300" /> प्रैक्टिस शुरू करें (Start Practice)
                            </button>
                          )}
                          <button
                            onClick={() => setShareConfig({
                              type: 'daily',
                              date: set.date,
                              subject: set.title,
                              qCount: qCount
                            })}
                            title="डेली प्रैक्टिस शेयर करें"
                            className="p-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl transition border border-emerald-200 cursor-pointer"
                          >
                            <Share2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Share Modal */}
      <ShareModal 
        isOpen={!!shareConfig}
        onClose={() => setShareConfig(null)}
        options={shareConfig || { type: 'daily' }}
      />

    </div>
  );
}

class DailyPracticeErrorBoundary extends (Component as any) {
  state = {
    hasError: false,
    error: null as Error | null
  };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error("DailyPractice Error Boundary Caught Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[50vh] flex flex-col items-center justify-center py-12 px-4 text-center space-y-4">
          <div className="p-3 bg-amber-100 text-amber-800 rounded-full">
            <HelpCircle className="h-8 w-8" />
          </div>
          <h3 className="text-base font-bold text-gray-800">डेली प्रैक्टिस प्रदर्शित करने में त्रुटि हुई</h3>
          <p className="text-xs text-gray-500 max-w-md">
            {this.state.error?.message || "कृपया पेज को पुनः रिफ्रेश करें"}
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs transition cursor-pointer"
          >
            पेज रिफ्रेश करें (Reload)
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function DailyPractice(props: DailyPracticeProps) {
  return (
    <DailyPracticeErrorBoundary>
      <DailyPracticeContent {...props} />
    </DailyPracticeErrorBoundary>
  );
}
