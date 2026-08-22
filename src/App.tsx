/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  History, 
  BookOpen, 
  Settings, 
  GraduationCap, 
  User as UserIcon, 
  Menu, 
  X,
  AlertCircle,
  Info,
  Mail,
  Home as HomeIcon,
  Newspaper,
  LogOut,
  Sparkles,
  Share2
} from 'lucide-react';
import { Question, Quiz, User, CurrentAffairsItem, ExamInfo } from './types';
import Home from './components/Home';
import Dashboard from './components/Dashboard';
import PyqSelector from './components/PyqSelector';
import SubjectSelector from './components/SubjectSelector';
import CurrentAffairsSelector from './components/CurrentAffairsSelector';
import DailyPractice from './components/DailyPractice';
import AboutUs from './components/AboutUs';
import ContactUs from './components/ContactUs';
import QuizRunner from './components/QuizRunner';
import AdminPanel from './components/AdminPanel';
import AboutExam from './components/AboutExam';
import { PrivacyPolicy, TermsConditions, Disclaimer } from './components/LegalPages';
import SEOHead from './components/SEOHead';
import ShareModal from './components/ShareModal';
import { ShareOptions } from './utils/shareUtils';
import { auth, logout } from './lib/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';

export default function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'daily-practice' | 'exam-info' | 'dashboard' | 'pyqs' | 'subjects' | 'current-affairs' | 'about' | 'contact' | 'admin' | 'privacy' | 'terms' | 'disclaimer'>('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [fbUser, setFbUser] = useState<FirebaseUser | null>(null);
  const [shareModalConfig, setShareModalConfig] = useState<ShareOptions | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setFbUser(u);
    });
    return () => unsubscribe();
  }, []);
  
  // Data State
  const [questions, setQuestions] = useState<Question[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [currentAffairs, setCurrentAffairs] = useState<CurrentAffairsItem[]>([]);
  const [exams, setExams] = useState<ExamInfo[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Active Quiz State
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [dynamicQuizData, setDynamicQuizData] = useState<{
    title: string;
    type: 'pyq' | 'subject';
    questionIds: string[];
    subject?: string;
    topic?: string;
  } | undefined>(undefined);
  const [isQuizRunning, setIsQuizRunning] = useState(false);

  const loadData = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const [questionsRes, quizzesRes, userRes, caRes, examRes] = await Promise.all([
        fetch('/api/questions'),
        fetch('/api/quizzes'),
        fetch('/api/user'),
        fetch('/api/current-affairs'),
        fetch('/api/exam-info')
      ]);

      if (!questionsRes.ok || !quizzesRes.ok || !userRes.ok || !caRes.ok) {
        throw new Error("Unable to establish backend connection");
      }

      const qData = await questionsRes.json();
      const qzData = await quizzesRes.json();
      const uData = await userRes.json();
      const caData = await caRes.json();
      const examData = examRes.ok ? await examRes.json() : [];

      setQuestions(qData);
      setQuizzes(qzData);
      setCurrentUser(uData);
      setCurrentAffairs(caData);
      setExams(examData);
    } catch (err: any) {
      setError(err.message || "Failed to synchronise database records");
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const getTabFromLocation = (): any => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const tabParam = urlParams.get('tab');
      const hash = window.location.hash.replace('#', '').split('/')[0];
      const found = tabParam || hash;
      const validTabs = ['home', 'daily-practice', 'exam-info', 'dashboard', 'pyqs', 'subjects', 'current-affairs', 'about', 'contact', 'admin', 'privacy', 'terms', 'disclaimer'];
      if (found && validTabs.includes(found)) {
        return found;
      }
    } catch (e) {
      console.error("Error reading URL parameters:", e);
    }
    return null;
  };

  // Centralized navigation handler with history pushState
  const navigateTo = (tab: typeof activeTab, options: { pushHistory?: boolean; scrollToTop?: boolean } = {}) => {
    const { pushHistory = true, scrollToTop = true } = options;
    setActiveTab(tab);
    setIsQuizRunning(false);
    setMobileMenuOpen(false);
    setShareModalConfig(null);

    if (pushHistory) {
      const hash = tab === 'home' ? '' : `#${tab}`;
      const url = tab === 'home' ? window.location.pathname : `${window.location.pathname}${hash}`;
      window.history.pushState({ tab, view: 'tab' }, '', url);
    }

    if (scrollToTop) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Initial Load & URL Route Synchronisation
  useEffect(() => {
    const initialTab = getTabFromLocation() || 'home';
    setActiveTab(initialTab);
    const hash = initialTab === 'home' ? '' : `#${initialTab}`;
    const url = initialTab === 'home' ? window.location.pathname : `${window.location.pathname}${hash}`;
    window.history.replaceState({ tab: initialTab, view: 'tab' }, '', url);

    loadData();
  }, []);

  // Global PopState (Mobile Back Button & Browser Back) Handler
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      // 1. If Share modal is open, close it first without navigating away
      if (shareModalConfig) {
        setShareModalConfig(null);
        return;
      }

      // 2. If Mobile hamburger menu is open, close it first
      if (mobileMenuOpen) {
        setMobileMenuOpen(false);
        return;
      }

      // 3. If Quiz is actively in progress, ask for confirmation so user doesn't lose test progress accidentally
      if (isQuizRunning) {
        const confirmExit = window.confirm("क्या आप टेस्ट से बाहर निकलना चाहते हैं? आपकी वर्तमान प्रगति समाप्त हो जाएगी। (Are you sure you want to exit the quiz?)");
        if (confirmExit) {
          setIsQuizRunning(false);
          const targetTab = event.state?.tab || getTabFromLocation() || 'home';
          setActiveTab(targetTab);
        } else {
          // Re-push quiz state so history stack stays intact
          window.history.pushState({ tab: activeTab, view: 'quiz' }, '', '#quiz');
        }
        return;
      }

      // 4. Tab Navigation from History state or URL hash
      const stateTab = event.state?.tab;
      const hashTab = getTabFromLocation();
      const nextTab = stateTab || hashTab || 'home';
      const validTabs = ['home', 'daily-practice', 'exam-info', 'dashboard', 'pyqs', 'subjects', 'current-affairs', 'about', 'contact', 'admin', 'privacy', 'terms', 'disclaimer'];
      
      if (validTabs.includes(nextTab)) {
        setActiveTab(nextTab as any);
        setIsQuizRunning(false);
      } else {
        setActiveTab('home');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [shareModalConfig, mobileMenuOpen, isQuizRunning, activeTab]);

  // Client-side Page Time-Spent & Engagement Beacon Tracker
  useEffect(() => {
    // Exclude admin panel visits from end-user traffic stats
    if (activeTab === 'admin') return;

    let clientId = localStorage.getItem('cg_client_id');
    if (!clientId) {
      clientId = 'cli_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('cg_client_id', clientId);
    }

    const userName = localStorage.getItem('cg_student_name') || '';
    const userMobile = localStorage.getItem('cg_student_mobile') || '';

    let startTime = Date.now();
    const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
    const deviceType = isMobile ? 'mobile' : 'desktop';

    const sendEngagement = (overrideDuration?: number) => {
      const durationSeconds = overrideDuration !== undefined 
        ? overrideDuration 
        : Math.round((Date.now() - startTime) / 1000);

      if (durationSeconds >= 1) {
        const payload = JSON.stringify({
          tab: activeTab,
          path: `/?tab=${activeTab}`,
          durationSeconds,
          device: deviceType,
          clientId,
          userName: userName || undefined,
          userMobile: userMobile || undefined,
          referrer: document.referrer || '',
          timestamp: new Date().toISOString()
        });

        if (navigator.sendBeacon) {
          navigator.sendBeacon('/api/track/engagement', new Blob([payload], { type: 'application/json' }));
        } else {
          fetch('/api/track/engagement', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: payload,
            keepalive: true
          }).catch(() => {});
        }
      }
    };

    // Send initial page visit ping after 1 second so view count is recorded immediately
    const initialTimer = setTimeout(() => {
      sendEngagement(1);
      startTime = Date.now();
    }, 1000);

    // Periodic Heartbeat every 20 seconds to record continuous reading/practice time
    const interval = setInterval(() => {
      sendEngagement(20);
      startTime = Date.now();
    }, 20000);

    window.addEventListener('beforeunload', () => sendEngagement());
    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
      sendEngagement();
      window.removeEventListener('beforeunload', () => sendEngagement());
    };
  }, [activeTab]);

  const handleStartQuiz = (quizId: string) => {
    const selected = quizzes.find(q => q.id === quizId);
    if (selected) {
      setActiveQuiz(selected);
      setDynamicQuizData(undefined);
      setIsQuizRunning(true);
      setMobileMenuOpen(false);
      setShareModalConfig(null);
      window.history.pushState({ tab: activeTab, view: 'quiz', quizTitle: selected.title }, '', '#quiz');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleStartDynamicQuiz = (
    title: string, 
    type: 'pyq' | 'subject', 
    questionIds: string[], 
    subject?: string, 
    topic?: string
  ) => {
    setActiveQuiz(null);
    setDynamicQuizData({ title, type, questionIds, subject, topic });
    setIsQuizRunning(true);
    setMobileMenuOpen(false);
    setShareModalConfig(null);
    window.history.pushState({ tab: activeTab, view: 'quiz', quizTitle: title }, '', '#quiz');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAttemptSubmitted = () => {
    // Reload database metrics and stats on submission
    loadData();
  };

  const handleFooterNav = (tab: 'home' | 'daily-practice' | 'dashboard' | 'pyqs' | 'subjects' | 'current-affairs' | 'about' | 'contact' | 'admin' | 'privacy' | 'terms' | 'disclaimer') => {
    navigateTo(tab);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-emerald-50/40 flex flex-col items-center justify-center font-sans">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
        <p className="mt-4 text-emerald-800 font-semibold text-sm">Loading TestArena Website... Please wait</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-emerald-50/40 flex flex-col items-center justify-center font-sans p-4">
        <div className="bg-white p-6 max-w-md w-full rounded-2xl border border-red-100 shadow-sm text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
          <h2 className="text-lg font-bold text-gray-800">Server Connection Failed</h2>
          <p className="text-xs text-gray-500 leading-relaxed">
            Could not connect to the backend server. Please verify that the development server is running and try again.
          </p>
          <button 
            onClick={loadData}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-xl text-xs transition"
          >
            Retry Connecting
          </button>
        </div>
      </div>
    );
  }

  // Admin access validation (Strictly souravpatel13@gmail.com)
  const isAdmin = fbUser?.email?.toLowerCase() === 'souravpatel13@gmail.com';

  // Header Nav Lists
  const allNavigationItems = [
    { id: 'home', label: 'Home', icon: HomeIcon },
    { id: 'daily-practice', label: 'Daily Practice', icon: Sparkles },
    { id: 'exam-info', label: 'Exam Info', icon: GraduationCap },
    { id: 'pyqs', label: 'PYQs Practice', icon: History },
    { id: 'subjects', label: 'Subject Tests', icon: BookOpen },
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'about', label: 'About Us', icon: Info },
    { id: 'contact', label: 'Contact Us', icon: Mail },
    { id: 'admin', label: 'Admin Panel', icon: Settings },
  ] as const;

  // Header Nav Lists - Always include Admin Panel tab so admin can access login at all times
  const navigationItems = allNavigationItems;

  return (
    <div className="min-h-screen bg-emerald-50/30 flex flex-col font-sans text-gray-800">
      
      {/* Upper Global Navigation Header Bar (Dark Themed as requested) */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 shadow-md text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Logo Brand Brand Details */}
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-gradient-to-tr from-emerald-500 to-emerald-700 text-white rounded-xl shadow-inner">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <span className="text-base font-extrabold text-white tracking-tight block leading-none">TestArena</span>
              <span className="text-[10px] text-emerald-400 font-bold tracking-wider uppercase font-sans">testarena.co.in</span>
            </div>
          </div>

          {/* Desktop Nav Items Links */}
          <nav className="hidden md:flex items-center gap-1.5">
            {navigationItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id && !isQuizRunning;
              return (
                <button
                  key={item.id}
                  onClick={() => navigateTo(item.id)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition select-none ${
                    isActive 
                      ? 'bg-emerald-600 text-white shadow-sm' 
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Icon className="h-4 w-4" /> {item.label}
                </button>
              );
            })}
          </nav>

          {/* User badge identity details & Admin Login Button & Share Button */}
          <div className="hidden md:flex items-center gap-3 pl-4 border-l border-slate-800">
            <button
              onClick={() => setShareModalConfig({ type: 'website' })}
              title="Share Website"
              className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-extrabold px-3.5 py-2 rounded-xl transition shadow-xs cursor-pointer"
            >
              <Share2 className="h-3.5 w-3.5" /> <span>शेयर करें</span>
            </button>

            {fbUser ? (
              <>
                <div className="text-right">
                  <span className="text-xs font-bold text-white block leading-none">
                    {isAdmin 
                      ? "Sourav Patel" 
                      : (fbUser.displayName || fbUser.email?.split('@')[0] || "Student")}
                  </span>
                  <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-0.5 justify-end mt-0.5 font-sans">
                    <span className={`w-1.5 h-1.5 rounded-full ${isAdmin ? 'bg-emerald-400' : 'bg-blue-400'}`}></span> {isAdmin ? "Admin" : "Student"}
                  </span>
                </div>
                <div className="p-2 bg-slate-800 text-emerald-400 rounded-full border border-slate-700">
                  <UserIcon className="h-4 w-4" />
                </div>
                <button
                  onClick={async () => {
                    await logout();
                    if (activeTab === 'admin') navigateTo('home');
                  }}
                  title="Log out"
                  className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </>
            ) : (
              <button
                onClick={() => navigateTo('admin')}
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-bold px-3.5 py-2 rounded-xl transition border border-slate-700 cursor-pointer"
              >
                <Settings className="h-3.5 w-3.5" /> Admin Login
              </button>
            )}
          </div>

          {/* Mobile Hamburg Toggle Button */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={() => setShareModalConfig({ type: 'website' })}
              className="p-2 bg-emerald-600 text-white rounded-xl text-xs flex items-center gap-1 font-bold shadow-xs"
              title="Share"
            >
              <Share2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>

        </div>

        {/* Mobile menu panel dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-800 bg-slate-900 p-3 space-y-1 shadow-inner animate-in slide-in-from-top-4 duration-150 text-white">
            <div className="pb-2">
              <button
                onClick={() => {
                  setShareModalConfig({ type: 'website' });
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-xs cursor-pointer"
              >
                <Share2 className="h-4 w-4" /> वेबसाइट मित्रों के साथ शेयर करें (Share Website)
              </button>
            </div>

            {navigationItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id && !isQuizRunning;
              return (
                <button
                  key={item.id}
                  onClick={() => navigateTo(item.id)}
                  className={`w-full flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-bold transition ${
                    isActive 
                      ? 'bg-emerald-600 text-white' 
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <Icon className="h-4 w-4" /> {item.label}
                </button>
              );
            })}
            
            {/* Mobile User Tag */}
            <div className="border-t border-slate-800 pt-3 pb-1 px-4 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-white block">
                  {isAdmin 
                    ? "Sourav Patel" 
                    : (fbUser ? (fbUser.displayName || fbUser.email?.split('@')[0] || "Student") : "Aspirant")}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  {isAdmin 
                    ? "Admin Account" 
                    : (fbUser?.email || "TestArena Candidate")}
                </span>
              </div>
              <span className="text-[10px] bg-slate-800 text-emerald-400 px-2 py-0.5 rounded-md font-bold">
                {isAdmin ? "Admin" : (fbUser ? "Student" : "Candidate")}
              </span>
            </div>
          </div>
        )}
      </header>

      {/* Main Content Area Container */}
      <main className="flex-1 bg-emerald-50/20">
        <SEOHead activeTab={activeTab} />
        {isQuizRunning ? (
          /* ACTIVE TEST IN PROGRESS ENGINE CONTAINER */
          <div className="py-2" id="active-quiz-container">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-2 pb-2">
              <button 
                onClick={() => {
                  if (confirm("Are you sure you want to exit the quiz? Your current progress will not be saved.")) {
                    setIsQuizRunning(false);
                  }
                }}
                className="text-xs text-slate-100 hover:text-white font-bold flex items-center gap-1 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 shadow-sm"
              >
                ← Exit Quiz
              </button>
            </div>
            
            <QuizRunner 
              quiz={activeQuiz}
              dynamicQuizData={dynamicQuizData}
              allQuestions={questions}
              userId={currentUser?.id || "user-sourav"}
              onClose={() => setIsQuizRunning(false)}
              onAttemptSubmitted={handleAttemptSubmitted}
            />
          </div>
        ) : (
          /* STANDARD TAB SELECTIONS VIEW */
          <div className="py-2" id="tab-views-container">
            {activeTab === 'home' && (
              <Home 
                onNavigate={(tab) => navigateTo(tab as any)}
                questionsCount={questions.length}
                quizzesCount={quizzes.length}
                exams={exams}
                questions={questions}
              />
            )}

            {activeTab === 'daily-practice' && (
              <DailyPractice 
                onBackToHome={() => navigateTo('home')}
              />
            )}

            {activeTab === 'exam-info' && (
              <AboutExam 
                exams={exams} 
                onNavigateToPractice={(examName) => navigateTo('pyqs')} 
              />
            )}

            {activeTab === 'dashboard' && (
              <Dashboard 
                userId={currentUser?.id || "user-sourav"} 
                onSelectQuiz={handleStartQuiz}
                activeQuizzes={quizzes}
              />
            )}

            {activeTab === 'pyqs' && (
              <PyqSelector 
                questions={questions}
                onStartDynamicQuiz={handleStartDynamicQuiz}
              />
            )}

            {activeTab === 'subjects' && (
              <SubjectSelector 
                quizzes={quizzes}
                questions={questions}
                onSelectQuiz={handleStartQuiz}
                onStartDynamicQuiz={handleStartDynamicQuiz}
              />
            )}

            {activeTab === 'current-affairs' && (
              <CurrentAffairsSelector 
                items={currentAffairs}
              />
            )}

            {activeTab === 'about' && (
              <AboutUs />
            )}

            {activeTab === 'contact' && (
              <ContactUs />
            )}

            {activeTab === 'admin' && (
              <AdminPanel 
                questions={questions}
                onRefreshQuestions={loadData}
                exams={exams}
                onRefreshExams={loadData}
              />
            )}

            {activeTab === 'privacy' && (
              <PrivacyPolicy onBackToHome={() => handleFooterNav('home')} />
            )}

            {activeTab === 'terms' && (
              <TermsConditions onBackToHome={() => handleFooterNav('home')} />
            )}

            {activeTab === 'disclaimer' && (
              <Disclaimer onBackToHome={() => handleFooterNav('home')} />
            )}
          </div>
        )}
      </main>

      {/* Footer Branding Area exactly matching user's image */}
      <footer className="bg-[#0b1329] text-slate-400 border-t border-slate-900 font-sans">
        <div className="max-w-7xl mx-auto px-6 py-12 md:py-16 grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12 text-left">
          
          {/* Column 1: App Info */}
          <div className="space-y-4">
            <h3 className="text-[#facc15] text-xl font-black tracking-wider uppercase">
              TEST ARENA
            </h3>
            <p className="text-slate-400 text-xs md:text-sm leading-relaxed max-w-sm font-medium">
              Smart practice platform for competitive exam preparation. Learn, practice and improve your performance.
            </p>
          </div>

          {/* Column 2: Quick Links */}
          <div className="space-y-4">
            <h4 className="text-white font-extrabold text-sm md:text-base">
              Quick Links
            </h4>
            <div className="flex flex-col space-y-3">
              <button 
                onClick={() => handleFooterNav('home')}
                className="flex items-center gap-2 text-slate-400 hover:text-white transition text-xs md:text-sm text-left font-semibold w-fit"
              >
                <span className="text-base select-none">🏠</span> Home
              </button>
              <button 
                onClick={() => handleFooterNav('subjects')}
                className="flex items-center gap-2 text-slate-400 hover:text-white transition text-xs md:text-sm text-left font-semibold w-fit"
              >
                <span className="text-base select-none">📚</span> Subjects
              </button>
              <button 
                onClick={() => handleFooterNav('pyqs')}
                className="flex items-center gap-2 text-slate-400 hover:text-white transition text-xs md:text-sm text-left font-semibold w-fit"
              >
                <span className="text-base select-none">📜</span> Previous Year Questions
              </button>
              <button 
                onClick={() => handleFooterNav('dashboard')}
                className="flex items-center gap-2 text-slate-400 hover:text-white transition text-xs md:text-sm text-left font-semibold w-fit"
              >
                <span className="text-base select-none">📊</span> Dashboard
              </button>
              <button 
                onClick={() => handleFooterNav('admin')}
                className="flex items-center gap-2 text-slate-400 hover:text-white transition text-xs md:text-sm text-left font-semibold w-fit"
              >
                <span className="text-base select-none">⚙️</span> Admin Panel / Login
              </button>
              <button 
                onClick={() => handleFooterNav('privacy')}
                className="flex items-center gap-2 text-slate-400 hover:text-white transition text-xs md:text-sm text-left font-semibold w-fit"
              >
                <span className="text-base select-none">🔐</span> Privacy Policy
              </button>
            </div>
          </div>

          {/* Column 3: Why Test Arena? */}
          <div className="space-y-4">
            <h4 className="text-white font-extrabold text-sm md:text-base">
              Why Test Arena?
            </h4>
            <div className="flex flex-col space-y-3 text-slate-400 text-xs md:text-sm font-semibold">
              <div className="flex items-start gap-2 leading-tight">
                <span className="text-slate-400 font-bold select-none">✓</span> Thousands of Questions
              </div>
              <div className="flex items-start gap-2 leading-tight">
                <span className="text-slate-400 font-bold select-none">✓</span> Performance Tracking
              </div>
              <div className="flex items-start gap-2 leading-tight">
                <span className="text-slate-400 font-bold select-none">✓</span> Smart Practice System
              </div>
              <div className="flex items-start gap-2 leading-tight">
                <span className="text-slate-400 font-bold select-none">✓</span> Exam Focused Preparation
              </div>
            </div>
          </div>

          {/* Column 4: Legal */}
          <div className="space-y-4">
            <h4 className="text-white font-extrabold text-sm md:text-base">
              Legal
            </h4>
            <div className="flex flex-col space-y-3">
              <button 
                onClick={() => handleFooterNav('privacy')}
                className="flex items-center gap-2 text-slate-400 hover:text-white transition text-xs md:text-sm text-left font-semibold w-fit"
              >
                <span className="text-base select-none">🔐</span> Privacy Policy
              </button>
              <button 
                onClick={() => handleFooterNav('terms')}
                className="flex items-center gap-2 text-slate-400 hover:text-white transition text-xs md:text-sm text-left font-semibold w-fit"
              >
                <span className="text-base select-none">📄</span> Terms & Conditions
              </button>
              <button 
                onClick={() => handleFooterNav('disclaimer')}
                className="flex items-center gap-2 text-slate-400 hover:text-white transition text-xs md:text-sm text-left font-semibold w-fit"
              >
                <span className="text-base select-none">⚠️</span> Disclaimer
              </button>
              <button 
                onClick={() => handleFooterNav('contact')}
                className="flex items-center gap-2 text-slate-400 hover:text-white transition text-xs md:text-sm text-left font-semibold w-fit"
              >
                <span className="text-base select-none">📧</span> Contact Us
              </button>
            </div>
          </div>

        </div>

        {/* Bottom copyright line exactly matching user's image */}
        <div className="border-t border-slate-800/50 py-6 text-center">
          <p className="text-[11px] md:text-xs text-slate-500 font-bold tracking-wide">
            © 2026 TEST ARENA. All Rights Reserved.
          </p>
        </div>
      </footer>

      {/* Global Share Modal */}
      <ShareModal
        isOpen={!!shareModalConfig}
        onClose={() => setShareModalConfig(null)}
        options={shareModalConfig || { type: 'website' }}
      />

    </div>
  );
}
