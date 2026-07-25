import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Clock, 
  HelpCircle, 
  Flag, 
  Check, 
  ChevronLeft, 
  ChevronRight, 
  X, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  ArrowLeft,
  BookOpen,
  RotateCcw,
  Sparkles,
  Award,
  Timer
} from 'lucide-react';
import { Question, Quiz, Attempt } from '../types';
import { isPyq, isSubjectTestQuestion } from '../utils/quizHelpers';

interface QuizRunnerProps {
  quiz: Quiz | null; // Null means dynamic custom quiz
  dynamicQuizData?: { title: string; type: 'pyq' | 'subject'; questionIds: string[]; subject?: string; topic?: string };
  allQuestions: Question[];
  userId: string;
  onClose: () => void;
  onAttemptSubmitted: () => void;
}

export default function QuizRunner({ quiz, dynamicQuizData, allQuestions, userId, onClose, onAttemptSubmitted }: QuizRunnerProps) {
  // Resolve questions for this quiz
  const questionIds = quiz ? quiz.questionIds : (dynamicQuizData?.questionIds || []);
  const quizTitle = quiz ? quiz.title : (dynamicQuizData?.title || "Dynamic Quiz");
  const quizType = quiz ? quiz.type : (dynamicQuizData?.type || "pyq");

  const quizId = useMemo(() => {
    if (quiz) return quiz.id;
    return "dynamic-" + (dynamicQuizData?.questionIds?.slice(0, 5).join('-') || 'custom');
  }, [quiz, dynamicQuizData]);

  const rawQuestions = useMemo(() => {
    return questionIds.map(id => allQuestions.find(q => q.id === id)).filter(Boolean) as Question[];
  }, [questionIds, allQuestions]);

  const baseQuestions = useMemo(() => {
    return rawQuestions;
  }, [rawQuestions]);

  // Interactive Quiz Modes onboarding
  const [quizMode, setQuizMode] = useState<'practice' | 'exam' | null>(null);
  const [shuffledQuestions, setShuffledQuestions] = useState<Question[]>([]);

  const questions = shuffledQuestions.length > 0 ? shuffledQuestions : baseQuestions;

  const durationMinutes = quizMode === 'exam' 
    ? 120 
    : (quiz ? quiz.durationMinutes : Math.max(5, Math.ceil(questions.length * 1.5)));

  // Quiz states
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({}); // qId -> selectedIndex
  const [markedForReview, setMarkedForReview] = useState<Record<string, boolean>>({}); // qId -> boolean
  const [visited, setVisited] = useState<Record<string, boolean>>({});
  const [timeLeft, setTimeLeft] = useState<number>(120 * 60); // 2 hours countdown for exam
  const [elapsedTime, setElapsedTime] = useState<number>(0); // stopwatch for practice
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [attemptResult, setAttemptResult] = useState<Attempt | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Handle starting a mode
  const handleStartMode = (mode: 'practice' | 'exam') => {
    if (mode === 'exam') {
      const targetCount = Math.min(100, baseQuestions.length);
      const selected = baseQuestions.length > 100
        ? [...baseQuestions].sort(() => Math.random() - 0.5).slice(0, targetCount)
        : [...baseQuestions];
      setShuffledQuestions(selected);
      setTimeLeft(120 * 60); // 120 minutes = 7200 seconds
    } else {
      setShuffledQuestions([...baseQuestions].sort(() => Math.random() - 0.5));
      setElapsedTime(0);
    }
    setQuizMode(mode);
    setCurrentIdx(0);
    setAnswers({});
    setMarkedForReview({});
    setIsSubmitted(false);
  };

  // Mark first question as visited on start
  const firstQuestionId = questions[0]?.id;
  useEffect(() => {
    if (quizMode && firstQuestionId) {
      setVisited({ [firstQuestionId]: true });
    }
  }, [quizMode, firstQuestionId]);

  // Live Timer effect (runs continuously for both modes)
  useEffect(() => {
    if (!quizMode || isSubmitted) return;

    timerRef.current = setInterval(() => {
      if (quizMode === 'exam') {
        setTimeLeft(prev => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            handleSubmit(true); // auto-submit on timeout
            return 0;
          }
          return prev - 1;
        });
      } else if (quizMode === 'practice') {
        setElapsedTime(prev => prev + 1);
      }
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [quizMode, isSubmitted]);

  const handleSelectOption = (optionIndex: number) => {
    const q = questions[currentIdx];
    if (!q) return;

    // In practice mode, if already answered, freeze selection so they can't change it
    if (quizMode === 'practice' && answers[q.id] !== undefined) {
      return;
    }

    setAnswers(prev => ({
      ...prev,
      [q.id]: optionIndex
    }));
  };

  const handleClearSelection = () => {
    const q = questions[currentIdx];
    if (!q) return;
    
    // In practice mode, if they already committed the choice, do not allow clear
    if (quizMode === 'practice' && answers[q.id] !== undefined) {
      return;
    }

    setAnswers(prev => {
      const copy = { ...prev };
      delete copy[q.id];
      return copy;
    });
  };

  const handleMarkReview = () => {
    const q = questions[currentIdx];
    if (!q) return;
    setMarkedForReview(prev => ({
      ...prev,
      [q.id]: !prev[q.id]
    }));
  };

  const handleNavigate = (index: number) => {
    if (index >= 0 && index < questions.length) {
      setCurrentIdx(index);
      const q = questions[index];
      setVisited(prev => ({ ...prev, [q.id]: true }));
    }
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) {
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async (isAuto = false) => {
    if (isSubmitted) return;
    setShowSubmitModal(false);

    // Calculate outcomes
    let correct = 0;
    let wrong = 0;
    let skipped = 0;

    const finalAnswers: Record<string, number> = {};

    questions.forEach(q => {
      const ans = answers[q.id];
      if (ans === undefined) {
        skipped++;
        finalAnswers[q.id] = -1; // -1 represents skipped
      } else {
        if (ans === q.correctAnswer) {
          correct++;
        } else {
          wrong++;
        }
        finalAnswers[q.id] = ans;
      }
    });

    // Score calculation matching standard CGPSC Prelims paper style
    // CGPSC evaluation pattern: 2.0 marks for correct, -0.66 marks for wrong (1/3 of positive marks)
    const positiveMarks = correct * 2.0;
    const negativeMarks = wrong * 0.66;
    const score = parseFloat((positiveMarks - negativeMarks).toFixed(2));

    const timeTaken = quizMode === 'exam' ? Math.max(1, (120 * 60) - timeLeft) : Math.max(1, elapsedTime);

    const attemptPayload: Omit<Attempt, 'id'> = {
      quizId,
      quizTitle,
      quizType,
      userId,
      timestamp: new Date().toISOString(),
      score,
      totalQuestions: questions.length,
      correctCount: correct,
      wrongCount: wrong,
      skippedCount: skipped,
      answers: finalAnswers,
      durationSeconds: timeTaken
    };

    try {
      const response = await fetch('/api/attempts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(attemptPayload)
      });

      if (response.ok) {
        const savedAttempt = await response.json();
        setAttemptResult(savedAttempt);
        setIsSubmitted(true);
        if (isAuto) {
          alert("Time's up! Your quiz has been submitted automatically.");
        }
      } else {
        alert("Error: Failed to submit quiz results.");
      }
    } catch (error) {
      console.error("Submit error:", error);
      alert("Due to a network connection glitch, your results have been computed locally.");
      const mockSavedAttempt: Attempt = {
        id: "att-local-" + Date.now(),
        ...attemptPayload
      };
      setAttemptResult(mockSavedAttempt);
      setIsSubmitted(true);
    }
  };

  // Status mapping for question indicators
  const getQuestionStatus = (qId: string) => {
    const isAnswered = answers[qId] !== undefined;
    const isMarked = markedForReview[qId];
    const isVis = visited[qId];

    if (isMarked) return 'review';
    if (isAnswered) return 'answered';
    if (isVis) return 'unanswered';
    return 'unvisited';
  };

  // ONBOARDING SELECTION SCREEN
  if (!quizMode) {
    return (
      <div className="font-sans max-w-4xl mx-auto px-4 py-12 space-y-8 fade-in" id="quiz-onboarding-container">
        
        {/* Intro header block */}
        <div className="text-center space-y-3">
          <span className="text-xs font-bold text-amber-800 bg-amber-50 px-3.5 py-1.5 rounded-full border border-amber-200 uppercase tracking-wider inline-flex items-center gap-1">
            <Sparkles className="h-3.5 w-3.5 text-amber-600" /> Choose Your Mode
          </span>
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight">{quizTitle}</h1>
          <p className="text-sm text-gray-500 max-w-xl mx-auto leading-relaxed">
            Select a learning method suited for your current study level. Take tests under direct exam conditions or practice actively with immediate answers feedback.
          </p>
        </div>

        {/* Choice cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
          
          {/* Card 1: Practice Mode */}
          <div 
            onClick={() => handleStartMode('practice')}
            className="bg-white rounded-3xl border border-gray-100 hover:border-emerald-300 p-8 shadow-sm hover:shadow-lg transition duration-200 cursor-pointer flex flex-col justify-between space-y-6 group"
          >
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50 text-emerald-700 rounded-2xl w-fit group-hover:scale-105 transition">
                <Sparkles className="h-8 w-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-black text-gray-900">Practice Mode (Immediate Feedback)</h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Excellent for focused active study. Get immediate green/red feedback right after clicking an option. Read the explanation instantly to strengthen your concepts step-by-step.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-50 text-xs font-bold text-emerald-800 group-hover:text-emerald-950">
              <span>Launch Practice Mode</span>
              <ChevronRight className="h-4 w-4" />
            </div>
          </div>

          {/* Card 2: Exam Mode */}
          <div 
            onClick={() => handleStartMode('exam')}
            className="bg-white rounded-3xl border border-gray-100 hover:border-amber-300 p-8 shadow-sm hover:shadow-lg transition duration-200 cursor-pointer flex flex-col justify-between space-y-6 group"
          >
            <div className="space-y-4">
              <div className="p-4 bg-amber-50 text-amber-700 rounded-2xl w-fit group-hover:scale-105 transition">
                <Award className="h-8 w-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-black text-gray-900">Exam Mode (100 Qs / 2 Hours)</h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Best for real exam evaluation. Strictly timed 2 hours (120 Mins) environment with 100 questions. Submit your entire answer sheet at the end for detailed diagnostic scorecards and accuracy logs.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-50 text-xs font-bold text-amber-800 group-hover:text-amber-950">
              <span>Launch Exam Simulation (100 Qs / 120 Mins)</span>
              <ChevronRight className="h-4 w-4" />
            </div>
          </div>

        </div>

        {/* Info panel */}
        <div className="p-4 bg-gray-50 border border-gray-200/60 rounded-2xl text-center text-xs text-gray-500 font-medium flex flex-wrap justify-center items-center gap-3">
          <span>Question Pool: <strong className="text-gray-800">{baseQuestions.length} Questions</strong></span>
          <span className="hidden sm:inline">|</span>
          <span>Exam Mode: <strong className="text-amber-800 font-bold">100 Questions / 2 Hours (120 Mins)</strong></span>
          <span className="hidden sm:inline">|</span>
          <span>Practice Mode: <strong className="text-emerald-800 font-bold">Full Pool (No Time Limit)</strong></span>
        </div>

      </div>
    );
  }

  const activeQuestion = questions[currentIdx];

  // SUBMITTED RESULTS SCREEN
  if (isSubmitted && attemptResult) {
    return (
      <div className="font-sans max-w-5xl mx-auto px-1 sm:px-4 py-6 space-y-8 fade-in" id="quiz-results-container">
        {/* Results Card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-100 pb-5 gap-4">
            <div>
              <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-full uppercase tracking-wider inline-block">
                Quiz Results & Scoreboard
              </span>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mt-2">{quizTitle}</h1>
              <p className="text-xs text-gray-400 mt-1">
                Detailed evaluation of your answers. Negative marking of -0.66 applies for every incorrect answer.
              </p>
            </div>
            
            <button 
              onClick={() => { onAttemptSubmitted(); onClose(); }}
              className="px-4 py-2.5 bg-gray-950 text-white text-xs font-bold rounded-xl hover:bg-amber-600 transition flex items-center gap-1.5 shadow"
            >
              <ArrowLeft className="h-4 w-4" /> Return to Home
            </button>
          </div>

          {/* Scores Overview Matrix */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            
            <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-100 text-center">
              <span className="text-[10px] text-amber-800 font-bold uppercase tracking-wider block">Your Score</span>
              <h2 className="text-3xl font-black mt-1 text-amber-900">
                {attemptResult.score} <span className="text-xs text-gray-400 font-normal">/ {questions.length * 2}</span>
              </h2>
              <span className="text-[9px] text-amber-700 block mt-1 font-bold">Based on marking rules</span>
            </div>

            <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 text-center">
              <span className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider block">Correct Answers</span>
              <h2 className="text-3xl font-black mt-1 text-emerald-700">{attemptResult.correctCount}</h2>
              <span className="text-[9px] text-emerald-600 block mt-1 font-bold">Earned (+{attemptResult.correctCount * 2} Marks)</span>
            </div>

            <div className="bg-red-50/50 p-4 rounded-xl border border-red-100 text-center">
              <span className="text-[10px] text-red-800 font-bold uppercase tracking-wider block">Incorrect Answers</span>
              <h2 className="text-3xl font-black mt-1 text-red-700">{attemptResult.wrongCount}</h2>
              <span className="text-[9px] text-red-600 block mt-1 font-bold">Penalty (-{(attemptResult.wrongCount * 0.66).toFixed(2)} Marks)</span>
            </div>

            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-center">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Skipped Questions</span>
              <h2 className="text-3xl font-black mt-1 text-gray-700">{attemptResult.skippedCount}</h2>
              <span className="text-[9px] text-gray-400 block mt-1 font-bold">Out of {questions.length} total</span>
            </div>

          </div>

          {/* Graphical Feedback and summary notes */}
          <div className="bg-gray-50 rounded-xl p-4 sm:p-5 flex flex-col md:flex-row items-center gap-6 justify-between border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="relative flex items-center justify-center">
                <svg className="w-20 h-20 transform -rotate-90">
                  <circle cx="40" cy="40" r="32" className="stroke-gray-200" strokeWidth="6" fill="transparent" />
                  <circle 
                    cx="40" 
                    cy="40" 
                    r="32" 
                    className="stroke-amber-500" 
                    strokeWidth="6" 
                    fill="transparent" 
                    strokeDasharray={201}
                    strokeDashoffset={201 - (201 * (attemptResult.correctCount / questions.length))}
                  />
                </svg>
                <span className="absolute text-sm font-black text-gray-800">
                  {Math.round((attemptResult.correctCount / questions.length) * 100)}%
                </span>
              </div>
              <div>
                <h4 className="font-extrabold text-gray-800 text-xs uppercase tracking-wider">Practice Diagnostics</h4>
                <p className="text-xs text-gray-500 mt-0.5">
                  Time spent on this session: <span className="font-bold text-gray-800">{formatTime(attemptResult.durationSeconds)}</span>
                </p>
              </div>
            </div>
            
            <div className="text-xs bg-white border border-gray-200 rounded-xl p-3 max-w-sm">
              <p className="font-bold text-gray-700">Study Tip:</p>
              <p className="text-gray-500 mt-1">
                Review the bilingual solutions key below to pinpoint weak chapters and reinforce your concepts.
              </p>
            </div>
          </div>
        </div>

        {/* Detailed Solutions Review Keys list */}
        <div className="space-y-4" id="solutions-review-list">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-1.5">
            <BookOpen className="text-amber-600 h-5 w-5" />
            Verified Answer Key & Explanations
          </h2>

          <div className="space-y-6">
            {questions.map((q, idx) => {
              const userAnsIdx = attemptResult.answers[q.id];
              const isCorrect = userAnsIdx === q.correctAnswer;
              const isSkipped = userAnsIdx === -1;

              return (
                <div 
                  key={idx} 
                  className={`bg-white rounded-2xl border p-5 sm:p-6 space-y-4 transition ${
                    isCorrect ? 'border-emerald-200 bg-emerald-50/5' : isSkipped ? 'border-gray-200' : 'border-red-200 bg-red-50/5'
                  }`}
                >
                  {/* Subject details */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-50 pb-3">
                    <span className="text-[10px] bg-gray-100 text-gray-600 font-black px-2 py-0.5 rounded uppercase tracking-wider">
                      Question {idx + 1}
                    </span>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="bg-amber-50 text-amber-800 font-bold px-2 py-0.5 rounded text-[10px]">
                        {q.subject}
                      </span>
                      <span className="bg-blue-50 text-blue-800 font-bold px-2 py-0.5 rounded text-[10px]">
                        {q.topic}
                      </span>
                      {isCorrect ? (
                        <span className="text-emerald-700 font-bold flex items-center gap-0.5 bg-emerald-50 px-2.5 py-0.5 rounded-full text-[10px] border border-emerald-100">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Correct
                        </span>
                      ) : isSkipped ? (
                        <span className="text-gray-500 font-bold flex items-center gap-0.5 bg-gray-50 px-2.5 py-0.5 rounded-full text-[10px] border border-gray-100">
                          <AlertCircle className="h-3.5 w-3.5" /> Skipped
                        </span>
                      ) : (
                        <span className="text-red-700 font-bold flex items-center gap-0.5 bg-red-50 px-2.5 py-0.5 rounded-full text-[10px] border border-red-100">
                          <XCircle className="h-3.5 w-3.5" /> Incorrect
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Question content */}
                  <div className="space-y-2">
                    <h3 className="text-sm sm:text-base font-bold text-gray-900 leading-relaxed font-sans">
                      {q.text_hi}
                    </h3>
                  </div>

                  {/* Options render with tags */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                    {q.options_hi.slice(0, 4).map((optHi, optIdx) => {
                      const optEn = q.options_en?.[optIdx];
                      const isOptionCorrect = optIdx === q.correctAnswer;
                      const isOptionSelected = optIdx === userAnsIdx;

                      let optBorderClass = 'border-gray-100';
                      let optBgClass = 'bg-gray-50/50';
                      let labelBadge = '';

                      if (isOptionCorrect) {
                        optBorderClass = 'border-emerald-500 bg-emerald-50/20';
                        optBgClass = 'bg-emerald-50/30';
                        labelBadge = 'correct';
                      } else if (isOptionSelected) {
                        optBorderClass = 'border-red-500 bg-red-50/20';
                        optBgClass = 'bg-red-50/30';
                        labelBadge = 'selected';
                      }

                      return (
                        <div 
                          key={optIdx} 
                          className={`p-3 rounded-xl border text-xs flex justify-between items-center transition ${optBorderClass} ${optBgClass}`}
                        >
                          <div>
                            <span className="font-bold text-gray-500 mr-2 uppercase">{String.fromCharCode(65 + optIdx)}.</span>
                            <span className="font-semibold text-gray-800 font-sans">{optHi}</span>
                          </div>

                          {labelBadge === 'correct' && (
                            <span className="p-1 bg-emerald-100 text-emerald-800 rounded-full shrink-0">
                              <Check className="h-3.5 w-3.5" />
                            </span>
                          )}
                          {labelBadge === 'selected' && (
                            <span className="p-1 bg-red-100 text-red-800 rounded-full shrink-0">
                              <X className="h-3.5 w-3.5" />
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Explanation card */}
                  {q.explanation_hi && (
                    <div className="p-4 bg-amber-50/30 border border-amber-100 rounded-xl space-y-2 mt-4 shadow-inner">
                      <p className="text-xs font-bold text-amber-900 border-b border-amber-100 pb-1 flex items-center gap-1 uppercase tracking-wider">
                        <HelpCircle className="h-4 w-4" /> Explanation & Reference Solution
                      </p>
                      <p className="text-xs text-gray-700 leading-relaxed font-sans whitespace-pre-line">
                        {q.explanation_hi}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Back button at bottom */}
          <div className="text-center pt-6">
            <button 
              onClick={() => { onAttemptSubmitted(); onClose(); }}
              className="px-6 py-3 bg-gray-950 text-white hover:bg-amber-600 font-bold rounded-xl shadow transition duration-200 inline-flex items-center gap-1.5"
            >
              <RotateCcw className="h-4 w-4" /> Return to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ACTIVE INTERACTIVE QUIZ VIEW
  return (
    <div className="font-sans max-w-7xl mx-auto px-1 sm:px-4 py-4 grid grid-cols-1 lg:grid-cols-4 gap-6 fade-in" id="quiz-runner-container">
      
      {/* Middle/Left Column: Active Question panel */}
      <div className="lg:col-span-3 space-y-4">
        
         {/* Top Header Controls */}
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex justify-between items-center">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-gray-900 line-clamp-1 text-sm sm:text-base">{quizTitle}</h2>
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${quizMode === 'practice' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-amber-50 text-amber-700 border border-amber-100'}`}>
                {quizMode === 'practice' ? 'Practice Mode' : 'Exam Mode'}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              {quizMode === 'practice' ? 'No Time Limit (असीमित समय)' : `Duration limit: ${durationMinutes} mins`}
            </p>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            {/* Live Timer Display (Clock) */}
            <div className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border font-mono text-xs font-bold ${
              quizMode === 'exam' 
                ? (timeLeft < 120 ? 'bg-red-50 text-red-600 border-red-200 animate-pulse' : 'bg-amber-50 text-amber-800 border-amber-200')
                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
            }`}>
              <Clock className="h-4 w-4" /> 
              <span>{quizMode === 'exam' ? formatTime(timeLeft) : formatTime(elapsedTime)}</span>
            </div>

            <button 
              onClick={() => setShowSubmitModal(true)}
              className="bg-emerald-600 text-white font-bold px-4 py-1.5 rounded-xl hover:bg-emerald-700 text-xs transition shadow-sm"
            >
              Finish Quiz
            </button>
          </div>
        </div>

        {activeQuestion ? (
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
            
            {/* Active question index with action trackers */}
            <div className="flex items-center justify-between border-b border-gray-50 pb-3">
              <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-md">
                Question {currentIdx + 1} of {questions.length}
              </span>

              <div className="flex items-center gap-2">
                <button 
                  onClick={handleMarkReview}
                  className={`px-3 py-1.5 text-xs border rounded-xl flex items-center gap-1.5 transition select-none ${
                    markedForReview[activeQuestion.id] 
                      ? 'bg-purple-50 text-purple-700 border-purple-200 font-bold' 
                      : 'hover:bg-gray-50 border-gray-200 text-gray-600 font-medium'
                  }`}
                >
                  <Flag className="h-3.5 w-3.5" /> 
                  {markedForReview[activeQuestion.id] ? 'Marked for Review' : 'Mark for Review'}
                </button>
              </div>
            </div>

            {/* Question content */}
            <div className="space-y-3">
              <p className="text-sm sm:text-base font-bold text-gray-900 leading-relaxed font-sans">
                {activeQuestion.text_hi}
              </p>
            </div>

            {/* Option choices with immediate feedback if in practice mode */}
            <div className="space-y-3">
              {activeQuestion.options_hi.slice(0, 4).map((optHi, optIdx) => {
                const optEn = activeQuestion.options_en?.[optIdx];
                const isSelected = answers[activeQuestion.id] === optIdx;
                const isCorrect = optIdx === activeQuestion.correctAnswer;
                const hasBeenAnswered = answers[activeQuestion.id] !== undefined;

                let optBorderClass = 'border-gray-100';
                let optBgClass = 'bg-gray-50/20';
                let indicatorElement = null;

                if (quizMode === 'practice' && hasBeenAnswered) {
                  // Immediate feedback mode visual colors
                  if (isCorrect) {
                    optBorderClass = 'border-emerald-500 bg-emerald-50/30 ring-2 ring-emerald-500/10';
                    optBgClass = 'bg-emerald-50/40 text-emerald-900';
                    indicatorElement = (
                      <span className="p-1 bg-emerald-100 text-emerald-800 rounded-full shrink-0">
                        <Check className="h-3.5 w-3.5" />
                      </span>
                    );
                  } else if (isSelected) {
                    optBorderClass = 'border-red-500 bg-red-50/30 ring-2 ring-red-500/10';
                    optBgClass = 'bg-red-50/40 text-red-900';
                    indicatorElement = (
                      <span className="p-1 bg-red-100 text-red-800 rounded-full shrink-0">
                        <X className="h-3.5 w-3.5" />
                      </span>
                    );
                  }
                } else {
                  // Standard Exam choice visualization
                  if (isSelected) {
                    optBorderClass = 'border-amber-600 bg-amber-50/30 ring-2 ring-amber-500/10';
                    optBgClass = 'bg-amber-50/40 text-amber-900';
                  }
                }

                return (
                  <div 
                    key={optIdx}
                    onClick={() => handleSelectOption(optIdx)}
                    className={`p-4 rounded-xl border flex items-start justify-between cursor-pointer transition select-none ${optBorderClass} ${optBgClass}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="pt-0.5">
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                          isSelected 
                            ? (quizMode === 'practice' && hasBeenAnswered 
                                ? (isCorrect ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-red-600 bg-red-600 text-white')
                                : 'border-amber-600 bg-amber-600 text-white') 
                            : 'border-gray-300 bg-white'
                        }`}>
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white"></div>}
                        </div>
                      </div>

                      <div className="text-xs sm:text-sm">
                        <span className="font-bold text-gray-500 mr-2 uppercase">{String.fromCharCode(65 + optIdx)}.</span>
                        <span className="font-semibold text-gray-800 font-sans">{optHi}</span>
                      </div>
                    </div>

                    {indicatorElement}
                  </div>
                );
              })}
            </div>

            {/* Interactive explanation on active view for practice mode */}
            {quizMode === 'practice' && answers[activeQuestion.id] !== undefined && activeQuestion.explanation_hi && (
              <div className="p-4 bg-amber-50/30 border border-amber-100 rounded-xl space-y-2 mt-4 shadow-inner animate-in fade-in duration-200">
                <p className="text-xs font-bold text-amber-900 border-b border-amber-100 pb-1 flex items-center gap-1 uppercase tracking-wider">
                  <HelpCircle className="h-4 w-4" /> Explanation & Solution Key
                </p>
                <p className="text-xs text-gray-700 leading-relaxed font-sans whitespace-pre-line">
                  {activeQuestion.explanation_hi}
                </p>
              </div>
            )}

            {/* Button controllers at bottom of card */}
            <div className="flex flex-wrap justify-between items-center gap-3 pt-4 border-t border-gray-50">
              <button 
                onClick={handleClearSelection}
                className="text-xs text-red-600 hover:text-red-700 font-bold disabled:opacity-50"
                disabled={answers[activeQuestion.id] === undefined || (quizMode === 'practice' && answers[activeQuestion.id] !== undefined)}
              >
                Clear Choice
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleNavigate(currentIdx - 1)}
                  disabled={currentIdx === 0}
                  className="px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 text-xs text-gray-600 font-bold disabled:opacity-50 flex items-center gap-1"
                >
                  <ChevronLeft className="h-4 w-4" /> Previous
                </button>
                <button
                  onClick={() => handleNavigate(currentIdx + 1)}
                  disabled={currentIdx === questions.length - 1}
                  className="px-4 py-2 bg-gray-900 text-white rounded-xl hover:bg-amber-600 text-xs font-bold disabled:opacity-50 flex items-center gap-1"
                >
                  Next <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

          </div>
        ) : (
          <div className="bg-white p-8 rounded-xl text-center text-gray-500 font-bold text-xs">
            An error occurred while loading this quiz.
          </div>
        )}

      </div>

      {/* Right Column: Question Numbers Exam Grid Sidebar */}
      <div className="space-y-4">
        
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm space-y-4">
          <h3 className="font-bold text-gray-800 text-sm border-b border-gray-50 pb-2">Question Navigator</h3>
          
          {/* Legend indicator badges */}
          <div className="grid grid-cols-2 gap-2 text-[10px] font-bold text-gray-500">
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 bg-emerald-500 rounded text-white flex items-center justify-center text-[8px] font-bold">✓</span>
              <span>Answered ({Object.keys(answers).length})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 bg-purple-500 rounded text-white flex items-center justify-center text-[8px] font-bold">★</span>
              <span>Review ({Object.keys(markedForReview).length})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 bg-red-100 border border-red-200 rounded"></span>
              <span>Unanswered ({questions.length - Object.keys(answers).length})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 bg-gray-100 rounded"></span>
              <span>Not Visited</span>
            </div>
          </div>

          {/* Numbers palette container */}
          <div className="grid grid-cols-5 gap-2 pt-2">
            {questions.map((q, idx) => {
              const status = getQuestionStatus(q.id);
              let btnClass = 'bg-gray-100 text-gray-600';
              
              if (status === 'review') {
                btnClass = 'bg-purple-500 text-white font-bold';
              } else if (status === 'answered') {
                btnClass = 'bg-emerald-500 text-white font-bold';
              } else if (status === 'unanswered') {
                btnClass = 'bg-red-500 text-white font-bold';
              }

              const isCurrent = idx === currentIdx;

              return (
                <button
                  key={idx}
                  onClick={() => handleNavigate(idx)}
                  className={`h-9 w-full rounded-lg text-xs font-bold flex items-center justify-center transition border ${
                    isCurrent ? 'ring-2 ring-amber-500 border-amber-500 scale-105 shadow' : 'border-transparent'
                  } ${btnClass}`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          {/* Prompt warning of submission */}
          <div className="pt-2">
            <button 
              onClick={() => setShowSubmitModal(true)}
              className="w-full bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 font-bold py-2.5 rounded-xl text-xs transition"
            >
              Finish & Submit
            </button>
          </div>
        </div>

      </div>

      {/* Standard Submit Modal Drawer popover */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" id="submit-confirm-modal">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-6 shadow-xl animate-in fade-in zoom-in duration-150">
            
            <div>
              <h3 className="text-lg font-black text-gray-900">Submit Quiz Answer Sheet?</h3>
              <p className="text-xs text-gray-500 mt-1">
                Are you sure you want to finish and submit your quiz paper? You will not be able to change your selections after submitting.
              </p>
            </div>

            {/* Matrix count list details */}
            <div className="p-4 bg-gray-50 rounded-xl space-y-2 text-xs border border-gray-100 font-medium">
              <div className="flex justify-between items-center text-gray-600">
                <span>Total Questions:</span>
                <span className="font-extrabold text-gray-900">{questions.length}</span>
              </div>
              <div className="flex justify-between items-center text-emerald-600 font-bold">
                <span>Answered Questions:</span>
                <span>{Object.keys(answers).length}</span>
              </div>
              <div className="flex justify-between items-center text-purple-600 font-bold">
                <span>Marked for Review:</span>
                <span>{Object.keys(markedForReview).length}</span>
              </div>
              <div className="flex justify-between items-center text-red-600 font-bold">
                <span>Unanswered Questions:</span>
                <span>{questions.length - Object.keys(answers).length}</span>
              </div>
            </div>

            {/* Actions trigger */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-xs font-bold hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSubmit(false)}
                className="flex-1 bg-emerald-600 text-white py-2.5 rounded-xl text-xs font-bold hover:bg-emerald-700 transition shadow"
              >
                Submit Answers
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
