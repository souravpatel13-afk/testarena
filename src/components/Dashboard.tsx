import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Award, 
  TrendingUp, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  HelpCircle, 
  ChevronDown, 
  ChevronUp, 
  RefreshCw, 
  BookOpen, 
  Search,
  BookMarked,
  History
} from 'lucide-react';
import { SubjectStats, TopicStats, MistakeDetail } from '../types';

interface DashboardProps {
  userId: string;
  onSelectQuiz: (quizId: string) => void;
  activeQuizzes: any[];
}

export default function Dashboard({ userId, onSelectQuiz, activeQuizzes }: DashboardProps) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedMistake, setExpandedMistake] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState('All');
  const [showResetConfirmation, setShowResetConfirmation] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/stats');
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard statistics');
      }
      const data = await response.json();
      setStats(data);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [userId]);

  const handleResetDb = () => {
    setShowResetConfirmation(true);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20" id="dashboard-loading">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
        <p className="mt-4 text-gray-600 font-sans text-xs font-bold">Loading analysis dashboard... Please wait.</p>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-red-700 font-sans" id="dashboard-error">
        <h3 className="font-semibold text-lg mb-2">Error Loading Dashboard Statistics</h3>
        <p className="text-sm mb-4">{error || 'No data was retrieved.'}</p>
        <button onClick={fetchStats} className="px-4 py-2 bg-red-600 text-white rounded-md text-sm hover:bg-red-700 transition font-bold">
          Retry Loading
        </button>
      </div>
    );
  }

  const {
    totalQuizzesAttempted,
    totalQuestionsAnswered,
    totalCorrect,
    totalWrong,
    totalSkipped,
    overallAccuracy,
    subjectStats = [],
    topicStats = [],
    mistakes = []
  } = stats;

  // Subjects for filtering mistakes
  const subjects = ['All', ...new Set(subjectStats.map((s: any) => s.subject))];

  // Filter mistakes
  const filteredMistakes = mistakes.filter((m: MistakeDetail) => {
    const matchesSearch = m.questionText.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (m.questionTextEn && m.questionTextEn.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          m.topic.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubject = selectedSubjectFilter === 'All' || m.subject === selectedSubjectFilter;
    return matchesSearch && matchesSubject;
  });

  return (
    <div className="space-y-8 font-sans max-w-7xl mx-auto px-1 sm:px-4 py-4" id="dashboard-container">
      
      {/* Upper Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm" id="dashboard-header">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <LayoutDashboard className="text-amber-600 h-6 w-6" />
            Performance & Analytics
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            Review detailed visual performance insights, subject mastery breakdowns, and customized preparation priorities.
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={fetchStats}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition"
          >
            <RefreshCw className="h-4 w-4" /> Refresh Stats
          </button>
          <button 
            onClick={handleResetDb}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-red-600 border border-red-100 rounded-xl bg-red-50 hover:bg-red-100 transition"
          >
            Reset Progress
          </button>
        </div>
      </div>

      {/* 4 Cards Summary Panel */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" id="dashboard-summary-cards">
        
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-start gap-4">
          <div className="p-3 bg-amber-50 text-amber-700 rounded-xl">
            <Award className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Total Quizzes</p>
            <h3 className="text-2xl font-black text-gray-900 mt-1">{totalQuizzesAttempted}</h3>
            <p className="text-[10px] text-gray-400 font-bold">Completed Sets</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-start gap-4">
          <div className="p-3 bg-blue-50 text-blue-700 rounded-xl">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Overall Accuracy</p>
            <h3 className="text-2xl font-black text-gray-900 mt-1">{overallAccuracy}%</h3>
            {/* Simple accuracy track color bar */}
            <div className="w-24 bg-gray-100 h-1.5 rounded-full mt-2 overflow-hidden">
              <div 
                className={`h-full rounded-full ${overallAccuracy >= 75 ? 'bg-emerald-500' : overallAccuracy >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                style={{ width: `${overallAccuracy}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-start gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl">
            <CheckCircle className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Correct MCQs</p>
            <h3 className="text-2xl font-black text-emerald-600 mt-1">{totalCorrect}</h3>
            <p className="text-[10px] text-gray-400 font-bold">Solved Successfully</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-start gap-4">
          <div className="p-3 bg-red-50 text-red-700 rounded-xl">
            <XCircle className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Wrong MCQs</p>
            <h3 className="text-2xl font-black text-red-600 mt-1">{totalWrong}</h3>
            <p className="text-[10px] text-gray-400 font-bold">Skipped: {totalSkipped}</p>
          </div>
        </div>

      </div>

      {/* Main Analysis Sections (Subjects & Topic Breakdowns) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="dashboard-details-grid">
        
        {/* Left 2 Columns: Subjects & Topics Performance */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Subject-Wise Mastery Cards */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <BookOpen className="text-amber-600 h-5 w-5" />
              Subject Performance Review
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {subjectStats.length === 0 ? (
                <div className="col-span-2 text-center py-6 text-gray-500 text-xs font-semibold">
                  No practice stats recorded yet. Complete any quiz to start tracking subject metrics!
                </div>
              ) : (
                subjectStats.map((sub: SubjectStats, idx: number) => {
                  const isExcellent = sub.accuracy >= 75;
                  const isModerate = sub.accuracy >= 50 && sub.accuracy < 75;
                  
                  return (
                    <div key={idx} className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 flex flex-col justify-between space-y-3 hover:shadow-sm transition">
                      <div>
                        <span className="text-[9px] font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
                          Syllabus Subject
                        </span>
                        <h4 className="text-xs font-black text-gray-800 mt-2 line-clamp-1">{sub.subject}</h4>
                        <div className="flex items-baseline gap-2 mt-1">
                          <span className="text-xl font-extrabold text-gray-900">{sub.accuracy}%</span>
                          <span className="text-[10px] text-gray-400 font-bold">accuracy ({sub.totalSolved} solved)</span>
                        </div>
                      </div>

                      {/* Micro Progress Bar */}
                      <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${isExcellent ? 'bg-emerald-500' : isModerate ? 'bg-amber-500' : 'bg-red-500'}`}
                          style={{ width: `${sub.accuracy}%` }}
                        ></div>
                      </div>

                      {/* Weak Topics in this subject */}
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Needs Focus (Weak Topics):</p>
                        {sub.weakTopics.length > 0 ? (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {sub.weakTopics.map((wt, wIdx) => (
                              <span key={wIdx} className="text-[9px] font-bold bg-red-50 text-red-600 px-2 py-0.5 rounded-md border border-red-100/50 flex items-center gap-0.5">
                                <AlertTriangle className="h-2.5 w-2.5" /> {wt}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1 font-bold">
                            <CheckCircle className="h-3.5 w-3.5" /> Outstanding coverage!
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Detailed Topic Grid */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <BookMarked className="text-amber-600 h-5 w-5" />
              Topic Performance Analyzer
            </h2>
            {topicStats.length === 0 ? (
              <p className="text-xs text-gray-400 font-bold text-center py-6">No individual chapter data available yet. Solve questions to view topics tracking.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100 text-gray-400 text-[10px] font-bold uppercase tracking-wider bg-gray-50/50">
                      <th className="py-2.5 px-4 rounded-l-lg">Topic / Chapter</th>
                      <th className="py-2.5 px-4">Subject</th>
                      <th className="py-2.5 px-4 text-center">Solved</th>
                      <th className="py-2.5 px-4 text-center">Accuracy</th>
                      <th className="py-2.5 px-4 rounded-r-lg">Proficiency</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-xs">
                    {topicStats.map((top: TopicStats, idx: number) => {
                      let statusBadge = '';
                      let statusClass = '';
                      if (top.accuracy >= 75) {
                        statusBadge = 'Strong';
                        statusClass = 'bg-emerald-50 text-emerald-700 border-emerald-100';
                      } else if (top.accuracy >= 50) {
                        statusBadge = 'Average';
                        statusClass = 'bg-amber-50 text-amber-700 border-amber-100';
                      } else {
                        statusBadge = 'Weak';
                        statusClass = 'bg-red-50 text-red-700 border-red-100';
                      }

                      return (
                        <tr key={idx} className="hover:bg-gray-50/50 transition">
                          <td className="py-3 px-4 font-bold text-gray-800">{top.topic}</td>
                          <td className="py-3 px-4 text-gray-400 font-bold text-[10px] uppercase">
                            {top.subject}
                          </td>
                          <td className="py-3 px-4 text-center font-bold text-gray-700">{top.totalSolved}</td>
                          <td className="py-3 px-4 text-center">
                            <span className="font-extrabold text-gray-900">{top.accuracy}%</span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`text-[10px] px-2 py-0.5 rounded-md border font-bold uppercase tracking-wider ${statusClass}`}>
                              {statusBadge}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>

        {/* Right 1 Column: Recommended Practice Panel */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-amber-600 to-amber-700 text-white p-6 rounded-2xl shadow-md space-y-4">
            <h3 className="font-bold text-lg">Personal Study Advice</h3>
            <p className="text-amber-50 text-xs leading-relaxed">
              Based on your ongoing practice records, we recommend concentrating on these actionable strategies to elevate your score:
            </p>
            
            <div className="space-y-3 text-xs">
              <div className="bg-white/10 p-3 rounded-lg border border-white/10 flex items-start gap-2.5">
                <AlertTriangle className="h-4.5 w-4.5 shrink-0 text-amber-200" />
                <div>
                  <h4 className="font-bold mb-0.5 text-white">Target Your Weakest Topics</h4>
                  <p className="text-amber-100">Review core textbook concepts for any chapter holding an accuracy below 65% before retaking mock questions.</p>
                </div>
              </div>

              <div className="bg-white/10 p-3 rounded-lg border border-white/10 flex items-start gap-2.5">
                <History className="h-4.5 w-4.5 shrink-0 text-amber-200" />
                <div>
                  <h4 className="font-bold mb-0.5 text-white">Consistent PYQ Mastery</h4>
                  <p className="text-amber-100">Nearly 30-40% of preliminary examination questions trace closely back to previous years' themes or subtopics.</p>
                </div>
              </div>

              <div className="bg-white/10 p-3 rounded-lg border border-white/10 flex items-start gap-2.5">
                <XCircle className="h-4.5 w-4.5 shrink-0 text-amber-200" />
                <div>
                  <h4 className="font-bold mb-0.5 text-white">Tame the Negative Marking</h4>
                  <p className="text-amber-100">Always respect the 1/3 negative penalty! Under Exam Mode, skip uncertain answers instead of guessing randomly.</p>
                </div>
              </div>
            </div>

            {/* Quick action button */}
            <div className="pt-2">
              <p className="text-xs text-amber-100 mb-2">Practice tests are ready for selection:</p>
              {activeQuizzes.length > 0 ? (
                <button 
                  onClick={() => onSelectQuiz(activeQuizzes[0].id)}
                  className="w-full bg-white text-amber-700 font-bold py-2.5 rounded-xl hover:bg-amber-50 transition text-xs flex items-center justify-center gap-1.5 shadow"
                >
                  <BookOpen className="h-4 w-4" /> Start Recommended Practice
                </button>
              ) : null}
            </div>
          </div>

          {/* Quick Stats Summary Graphic */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
            <h3 className="font-bold text-gray-800 text-sm">Proficiency Ring</h3>
            <div className="flex flex-col items-center justify-center py-4 space-y-3">
              <div className="relative flex items-center justify-center">
                {/* SVG circular track progress */}
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="54"
                    className="stroke-gray-100"
                    strokeWidth="10"
                    fill="transparent"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="54"
                    className="stroke-amber-500 transition-all duration-1000 ease-out"
                    strokeWidth="10"
                    fill="transparent"
                    strokeDasharray={339}
                    strokeDashoffset={339 - (339 * overallAccuracy) / 100}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute text-center">
                  <span className="text-2xl font-black text-gray-900">{overallAccuracy}%</span>
                  <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Success Rate</p>
                </div>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500">Attempted Questions: <span className="font-bold text-gray-900">{totalQuestionsAnswered}</span></p>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Full-width Mistakes Tracker Section */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6" id="dashboard-mistakes-section">
        
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-100 pb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <XCircle className="text-red-500 h-5 w-5" />
              Mistakes Review Panel
            </h2>
            <p className="text-gray-500 text-xs mt-1">
              Your personalized collection of incorrectly answered questions. Read through their correct solutions and explanation keys to lock in concepts.
            </p>
          </div>

          {/* Filters for Mistakes */}
          <div className="flex flex-col sm:flex-row gap-2 shrink-0">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search mistakes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 w-full sm:w-48 bg-gray-50/50 text-gray-800 font-medium"
              />
            </div>
            {/* Subject Selector */}
            <select
              value={selectedSubjectFilter}
              onChange={(e) => setSelectedSubjectFilter(e.target.value)}
              className="px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-gray-50/50 text-gray-800 font-bold"
            >
              {subjects.map((sub, sIdx) => (
                <option key={sIdx} value={sub}>
                  {sub === 'All' ? 'All Subjects' : sub}
                </option>
              ))}
            </select>
          </div>
        </div>

        {filteredMistakes.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-gray-200 rounded-xl bg-gray-50/30">
            <CheckCircle className="h-10 w-10 text-emerald-500 mx-auto mb-3" />
            <h4 className="font-bold text-gray-800 text-sm">No recorded mistakes!</h4>
            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
              {searchQuery || selectedSubjectFilter !== 'All' 
                ? "No incorrect answers align with your current search parameters." 
                : "Outstanding work! You have solved all of your attempted practice questions correctly. Keep up the perfect streak!"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredMistakes.map((mistake: any, idx: number) => {
              const isExpanded = expandedMistake === mistake.questionId;
              return (
                <div 
                  key={idx} 
                  className={`border rounded-xl transition overflow-hidden ${isExpanded ? 'border-amber-200 bg-amber-50/10' : 'border-gray-100 hover:border-gray-200 bg-white'}`}
                >
                  {/* Collapsed Header Summary */}
                  <div 
                    onClick={() => setExpandedMistake(isExpanded ? null : mistake.questionId)}
                    className="p-4 flex items-start justify-between gap-4 cursor-pointer select-none"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-1.5 text-[9px] font-bold">
                        <span className="bg-red-50 text-red-600 px-2 py-0.5 rounded border border-red-100">
                          {mistake.subject}
                        </span>
                        <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                          {mistake.topic}
                        </span>
                        <span className="text-gray-400 font-medium">
                          {new Date(mistake.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                      
                      <h4 className="text-sm font-semibold text-gray-800 mt-1 leading-relaxed font-sans whitespace-pre-line">
                        {mistake.questionText}
                      </h4>
                    </div>

                    <div className="text-gray-400 hover:text-gray-600 shrink-0">
                      {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                    </div>
                  </div>

                  {/* Expanded Detail View */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-1 border-t border-gray-100 space-y-4 text-xs bg-gray-50/30">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-3 bg-red-50/50 rounded-lg border border-red-100">
                          <p className="text-[10px] text-red-700 font-bold flex items-center gap-1 uppercase">
                            <XCircle className="h-3.5 w-3.5" /> Your Selected Answer
                          </p>
                          <p className="font-bold text-gray-800 mt-1 font-sans whitespace-pre-line">{mistake.selectedOption}</p>
                        </div>

                        <div className="p-3 bg-emerald-50/50 rounded-lg border border-emerald-100">
                          <p className="text-[10px] text-emerald-700 font-bold flex items-center gap-1 uppercase">
                            <CheckCircle className="h-3.5 w-3.5" /> Correct Verified Answer
                          </p>
                          <p className="font-bold text-gray-800 mt-1 font-sans whitespace-pre-line">{mistake.correctOption}</p>
                        </div>
                      </div>

                      {/* Explanation */}
                      {mistake.explanation && (
                        <div className="p-4 bg-white rounded-lg border border-gray-100 shadow-inner">
                          <p className="text-xs text-amber-800 font-bold flex items-center gap-1 border-b border-gray-100 pb-1.5 mb-2 uppercase">
                            <HelpCircle className="h-3.5 w-3.5" /> Explanation & Solution
                          </p>
                          <p className="text-xs text-gray-700 leading-relaxed font-sans whitespace-pre-line">
                            {mistake.explanation}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CUSTOM RESET CONFIRMATION MODAL */}
      {showResetConfirmation && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 border border-gray-100 shadow-xl animate-in fade-in zoom-in-95 duration-150">
            <div className="text-center space-y-2">
              <div className="mx-auto w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-600 animate-bounce">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <h3 className="font-extrabold text-gray-950 text-base">प्रगति रीसेट करें? (Reset Progress?)</h3>
              <p className="text-xs text-gray-500 leading-relaxed font-sans">
                क्या आप सचमुच अपने अभ्यास की प्रगति, स्कोर और गलतियों के इतिहास को मिटाना चाहते हैं? इसे वापस नहीं लाया जा सकता।
              </p>
            </div>

            {resetSuccess ? (
              <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-xl text-center text-xs font-bold animate-pulse font-sans">
                सफलतापूर्वक प्रगति रीसेट हो गई है! रिफ्रेश किया जा रहा है...
              </div>
            ) : (
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowResetConfirmation(false)}
                  className="flex-1 py-2.5 px-3 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-xl text-xs font-bold transition font-sans cursor-pointer"
                >
                  रद्द करें (Cancel)
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const response = await fetch('/api/db/reset', { method: 'POST' });
                      if (response.ok) {
                        setResetSuccess(true);
                        setTimeout(() => {
                          setShowResetConfirmation(false);
                          window.location.reload();
                        }, 1200);
                      }
                    } catch (err) {
                      console.error(err);
                    }
                  }}
                  className="flex-1 py-2.5 px-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition font-sans cursor-pointer"
                >
                  हाँ, रीसेट करें (Yes)
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
