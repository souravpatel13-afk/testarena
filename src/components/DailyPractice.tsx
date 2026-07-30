import React, { useState, useEffect } from 'react';
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
  HelpCircle
} from 'lucide-react';
import { DailyPracticeSet, DailyPracticeQuestion } from '../types';

interface DailyPracticeProps {
  onBackToHome?: () => void;
}

export default function DailyPractice({ onBackToHome }: DailyPracticeProps) {
  const [sets, setSets] = useState<DailyPracticeSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Active Practice State
  const [activeSet, setActiveSet] = useState<DailyPracticeSet | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [showExplanations, setShowExplanations] = useState<Record<number, boolean>>({});
  const [instantMode, setInstantMode] = useState<boolean>(true); // Immediate feedback mode
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const [timerSeconds, setTimerSeconds] = useState<number>(0);

  const fetchDailyPracticeSets = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/daily-practice');
      if (res.ok) {
        const data = await res.json();
        setSets(data);
      } else {
        throw new Error('Failed to load daily practice sets');
      }
    } catch (err: any) {
      setError(err.message || 'Error fetching data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDailyPracticeSets();
  }, []);

  const [copiedShare, setCopiedShare] = useState(false);

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

  const handleStartSet = (set: DailyPracticeSet) => {
    setActiveSet(set);
    setCurrentIndex(0);
    setSelectedAnswers({});
    setShowExplanations({});
    setIsFinished(false);
    setTimerSeconds(0);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
    // Show all explanations on review
    const allExp: Record<number, boolean> = {};
    activeSet?.questions.forEach((_, idx) => {
      allExp[idx] = true;
    });
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
    if (!activeSet) return { correct: 0, wrong: 0, skipped: 0, score: 0, maxScore: 0, percentage: '0.0' };
    let correct = 0;
    let wrong = 0;
    let skipped = 0;

    const totalQuestions = activeSet.questions.length;
    const marksPerQuestion = 2; // CGPSC / Vyapam pattern: 2 marks per question
    const negativeMark = 0.66; // 1/3 negative marking

    activeSet.questions.forEach((q, idx) => {
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
              onClick={() => setActiveSet(null)}
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
            )}
          </div>
        </div>

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
                  onClick={handleShareResultWhatsApp}
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs transition flex items-center gap-2 shadow-md cursor-pointer transform hover:scale-105"
                >
                  <Share2 className="h-4 w-4 text-slate-950" />
                  व्हाट्सएप पर टेस्ट शेयर करें (Share Test)
                </button>

                <button
                  onClick={handleCopyResultLink}
                  className="bg-white/10 hover:bg-white/20 text-white font-bold px-3 py-2.5 rounded-xl text-xs transition border border-white/20 cursor-pointer flex items-center gap-1.5"
                >
                  {copiedShare ? "✓ लिंक कॉपी हो गया!" : "लिंक कॉपी करें"}
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
              const isCorrect = isFinished && selectedAnswers[idx] === questions[idx].correctAnswer;
              const isWrong = isFinished && isAnswered && selectedAnswers[idx] !== questions[idx].correctAnswer;

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
                dangerouslySetInnerHTML={{ __html: currentQuestion.questionHtml }}
              />
            </div>

            {/* Options List */}
            <div className="space-y-3">
              <p className="text-xs font-extrabold text-gray-500 uppercase tracking-wider">
                विकल्प चुनें (Select Option):
              </p>
              <div className="grid grid-cols-1 gap-2.5">
                {currentQuestion.optionsHtml.map((optHtml, oIdx) => {
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
            <div className="flex items-center justify-between pt-4 border-t border-gray-100 gap-2">
              <button
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex(prev => prev - 1)}
                className="bg-gray-100 hover:bg-gray-200 disabled:opacity-40 text-gray-700 font-bold px-4 py-2.5 rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
              >
                <ArrowLeft className="h-4 w-4" /> पिछला प्रश्न
              </button>

              {!isFinished ? (
                currentIndex === questions.length - 1 ? (
                  <button
                    onClick={handleFinishPractice}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-6 py-2.5 rounded-xl text-xs transition flex items-center gap-2 cursor-pointer shadow-xs"
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

  // List of Available Daily Practice Sets
  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-900 text-white rounded-3xl p-6 sm:p-10 shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 opacity-10 pointer-events-none transform translate-x-12 -translate-y-6">
          <BookOpen className="w-80 h-80 text-white" />
        </div>

        <div className="relative z-10 space-y-4 max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-amber-400/20 text-amber-300 px-3.5 py-1.5 rounded-full text-xs font-extrabold border border-amber-400/30">
            <Sparkles className="h-4 w-4 text-amber-300" /> डेली 20-25 वस्तुनिष्ठ अभ्यास
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight">
            डेली प्रैक्टिस ज़ोन (Daily Practice Zone)
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100 font-medium leading-relaxed">
            CGPSC प्रारंभिक परीक्षा, व्यापमं, पटवारी, शिक्षक एवं पुलिस भर्ती परीक्षाओं के लिए प्रतिदिन 20 से 25 महत्वपूर्ण प्रश्नों का अभ्यास करें। प्रत्येक प्रश्न की विस्तृत व्याख्या और त्वरित उत्तर जाँच उपलब्ध है।
          </p>

          <div className="flex flex-wrap gap-4 pt-2 text-xs font-bold text-emerald-200">
            <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-xl border border-white/10">
              <Calendar className="h-4 w-4 text-emerald-300" /> रोज नए अपडेट
            </span>
            <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-xl border border-white/10">
              <Zap className="h-4 w-4 text-amber-300" /> तत्काल व्याख्या एवं उत्तर
            </span>
            <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-xl border border-white/10">
              <FileText className="h-4 w-4 text-emerald-300" /> HTML समृद्ध प्रश्न
            </span>
          </div>
        </div>
      </div>

      {/* Available Daily Practice Sets Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-gray-200 pb-3">
          <h2 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-emerald-600" /> दैनिक अभ्यास सेट सूची (Daily Practice Sets)
          </h2>
          <span className="text-xs font-extrabold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            कुल सेट उपलब्ध: {sets.length}
          </span>
        </div>

        {sets.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-10 text-center space-y-3">
            <BookOpen className="h-12 w-12 text-gray-300 mx-auto" />
            <p className="text-sm font-bold text-gray-600">अभी कोई डेली प्रैक्टिस सेट उपलब्ध नहीं है।</p>
            <p className="text-xs text-gray-400">एडमिन क्षेत्र से जल्द ही नए प्रश्न जोड़े जाएंगे।</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {sets.map((set, idx) => {
              const qCount = set.questions?.length || 0;
              const isToday = idx === 0;

              return (
                <div 
                  key={set.id}
                  className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-md transition space-y-4 flex flex-col justify-between group hover:border-emerald-300"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200 flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-emerald-600" /> {set.date}
                      </span>
                      {isToday && (
                        <span className="text-[10px] font-extrabold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-md animate-pulse">
                          🔥 आज का सेट
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-extrabold text-gray-900 group-hover:text-emerald-700 transition leading-snug pt-1">
                      {set.title}
                    </h3>
                  </div>

                  <button
                    onClick={() => handleStartSet(set)}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3 rounded-xl text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-xs group-hover:bg-emerald-700 mt-2"
                  >
                    <Zap className="h-4 w-4 text-amber-300" /> प्रैक्टिस शुरू करें (Start Practice)
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
