import React, { useState } from 'react';
import { 
  History, 
  Clock, 
  HelpCircle, 
  Play, 
  Search, 
  Calendar,
  Grid,
  CheckCircle,
  Star,
  Award,
  ArrowLeft,
  Share2
} from 'lucide-react';
import { Question } from '../types';
import { isPyq } from '../utils/quizHelpers';
import ShareModal from './ShareModal';
import { ShareOptions } from '../utils/shareUtils';

interface PyqSelectorProps {
  questions: Question[];
  onStartDynamicQuiz: (title: string, type: 'pyq' | 'subject', questionIds: string[], subject?: string, topic?: string) => void;
}

export default function PyqSelector({ questions, onStartDynamicQuiz }: PyqSelectorProps) {
  const [pyqSubTab, setPyqSubTab] = useState<'exam' | 'topic'>('exam');
  const [selectedExam, setSelectedExam] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [shareConfig, setShareConfig] = useState<ShareOptions | null>(null);

  // Popstate listener for mobile back button & modal handling
  React.useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      if (shareConfig) {
        setShareConfig(null);
        return;
      }
      if (selectedExam) {
        const stateExam = e.state?.exam;
        if (!stateExam) {
          setSelectedExam(null);
        }
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [shareConfig, selectedExam]);

  const handleSelectExam = (examName: string) => {
    setSelectedExam(examName);
    window.history.pushState({ tab: 'pyqs', exam: examName, view: 'pyq-years' }, '', `#pyqs/${encodeURIComponent(examName)}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToExams = () => {
    setSelectedExam(null);
    window.history.pushState({ tab: 'pyqs', view: 'tab' }, '', '#pyqs');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Group PYQ questions by Exam for the "Exam-wise PYQ" view
  const pyqExams = [...new Set(questions.filter(isPyq).map(q => q.exam).filter(Boolean))] as string[];

  // Find all available years for the selected exam
  const availableYears = selectedExam
    ? [...new Set(questions.filter(q => isPyq(q) && q.exam === selectedExam).map(q => q.year).filter(Boolean))] as number[]
    : [];
  availableYears.sort((a, b) => b - a);

  const hasNoYearQuestions = selectedExam
    ? questions.some(q => isPyq(q) && q.exam === selectedExam && !q.year)
    : false;

  // Group PYQ questions by Subject and Topic for the "Topic-wise PYQ" view
  const pyqTopicsGrouped: Record<string, Record<string, string[]>> = {}; // Subject -> Topic -> questionIds
  questions.forEach(q => {
    if (isPyq(q)) { // It is a PYQ
      const sub = q.subject || "General Studies";
      const top = q.topic || "Miscellaneous";
      if (!pyqTopicsGrouped[sub]) {
        pyqTopicsGrouped[sub] = {};
      }
      if (!pyqTopicsGrouped[sub][top]) {
        pyqTopicsGrouped[sub][top] = [];
      }
      pyqTopicsGrouped[sub][top].push(q.id);
    }
  });

  const handleStartExamYearPYQ = (examName: string, year: number | null) => {
    const examQuestions = questions.filter(q => 
      isPyq(q) && 
      q.exam === examName && 
      (year === null ? !q.year : q.year === year)
    ).map(q => q.id);

    if (examQuestions.length === 0) {
      alert("No questions are currently available for this selection.");
      return;
    }

    onStartDynamicQuiz(
      `${examName} (${year ? year : 'General'}) - Official Paper`,
      'pyq',
      examQuestions,
      undefined,
      undefined
    );
  };

  const handleStartTopicPYQ = (subjectName: string, topicName: string, questionIds: string[]) => {
    onStartDynamicQuiz(
      `PYQ Quiz: ${topicName} (${subjectName})`,
      'pyq',
      questionIds,
      subjectName,
      topicName
    );
  };

  const handleStartSubjectPYQ = (subjectName: string, questionIds: string[]) => {
    if (questionIds.length === 0) {
      alert("No questions available for this subject.");
      return;
    }
    onStartDynamicQuiz(
      `PYQ Quiz: ${subjectName} (Complete Subject)`,
      'pyq',
      questionIds,
      subjectName,
      undefined
    );
  };

  // Professional illustrations simulated through distinct colored badges/gradients
  const cardGradients = [
    'from-emerald-600 to-teal-700',
    'from-emerald-500 to-emerald-600',
    'from-teal-600 to-teal-700',
    'from-emerald-700 to-slate-800',
    'from-slate-700 to-emerald-950'
  ];

  return (
    <div className="space-y-6 font-sans max-w-7xl mx-auto px-4 py-4 fade-in" id="pyq-selector-main">
      
      {/* Premium Hero Banner (E-ONLINE Pinterest style) */}
      <div className="bg-gradient-to-br from-emerald-50/50 via-teal-50/30 to-white rounded-3xl border border-emerald-100/60 p-6 md:p-10 shadow-sm relative overflow-hidden">
        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none">
          <History className="h-64 w-64 text-emerald-800" />
        </div>
        
        <div className="max-w-2xl space-y-4">
          <span className="text-xs font-bold text-emerald-800 bg-emerald-100/60 px-3 py-1 rounded-full border border-emerald-200 uppercase tracking-wider inline-flex items-center gap-1 font-sans">
            <Award className="h-3.5 w-3.5" /> Official PYQs (विगत वर्ष के प्रश्न)
          </span>
          <h1 className="text-2xl md:text-4xl font-extrabold text-gray-900 tracking-tight leading-tight">
            Practice Official Exam Papers
          </h1>
          <p className="text-xs md:text-sm text-gray-600 leading-relaxed font-sans">
            विगत वर्षों के आधिकारिक प्रश्नों का परीक्षा-वार एवं टॉपिक-वार अभ्यास करें।
          </p>

          {/* Interactive Toggle Sub-tabs & Search in Banner */}
          <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
            <div className="flex bg-gray-200/60 p-1 rounded-xl w-full sm:w-auto">
              <button
                onClick={() => {
                  setPyqSubTab('exam');
                  setSelectedExam(null);
                }}
                className={`flex-1 sm:flex-none text-xs font-bold px-4 py-2 rounded-lg transition flex items-center justify-center gap-1 ${pyqSubTab === 'exam' ? 'bg-white text-emerald-900 shadow' : 'text-gray-500 hover:text-gray-800'}`}
              >
                <Calendar className="h-3.5 w-3.5" /> Exam-wise
              </button>
              <button
                onClick={() => {
                  setPyqSubTab('topic');
                  setSelectedExam(null);
                }}
                className={`flex-1 sm:flex-none text-xs font-bold px-4 py-2 rounded-lg transition flex items-center justify-center gap-1 ${pyqSubTab === 'topic' ? 'bg-white text-emerald-900 shadow' : 'text-gray-500 hover:text-gray-800'}`}
              >
                <Grid className="h-3.5 w-3.5" /> Topic-wise
              </button>
            </div>

            {pyqSubTab === 'exam' && (
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search exams..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 w-full bg-white text-gray-800 font-medium"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Grid rendering according to the sub-tab */}
      <div>
        {pyqSubTab === 'exam' ? (
          /* EXAM-WISE PYQS */
          selectedExam ? (
            /* YEAR SELECTION FOR THE SELECTED EXAM */
            <div className="space-y-6 animate-in fade-in duration-200" id="pyq-year-selector">
              <div className="flex items-center gap-3">
                <button
                  onClick={handleBackToExams}
                  className="p-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition cursor-pointer flex items-center justify-center"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <div>
                  <h2 className="text-lg font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
                    {selectedExam} - Select Year
                  </h2>
                  <p className="text-xs text-gray-500 font-sans">विगत वर्षों के प्रश्न पत्रों का वर्षवार अभ्यास करें (Practice official papers year-wise)</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Combined Practice Option (FIRST) */}
                <div 
                  className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 flex flex-col justify-between group border-dashed border-2 border-emerald-300"
                >
                  <div className="p-4 bg-gradient-to-tr from-emerald-600 to-teal-700 text-white relative">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] bg-white/20 text-white px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider font-sans backdrop-blur-sm">
                        All-in-One Mock
                      </span>
                      <span className="text-[10px] text-emerald-200 font-bold flex items-center gap-0.5 font-sans">
                        <Star className="h-3 w-3 fill-current" /> Combine All Years
                      </span>
                    </div>
                    <div className="mt-8 mb-4">
                      <h3 className="text-xl font-extrabold tracking-tight text-white">Combined mock (All Years)</h3>
                      <p className="text-[10px] text-emerald-100 mt-1 font-sans">Practice all loaded questions for {selectedExam} together</p>
                    </div>
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs text-gray-600 font-medium">
                        <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                        <span className="font-sans">सभी विगत वर्ष सम्मिलित (All PYQs Combined)</span>
                      </div>
                      
                      <div className="flex items-center gap-4 pt-1 text-xs text-gray-500 font-sans">
                        <span className="flex items-center gap-1 bg-gray-50 px-2.5 py-1 rounded-lg">
                          <HelpCircle className="h-3.5 w-3.5 text-gray-400" /> {questions.filter(q => isPyq(q) && q.exam === selectedExam).length} MCQs
                        </span>
                        <span className="flex items-center gap-1 bg-gray-50 px-2.5 py-1 rounded-lg">
                          <Clock className="h-3.5 w-3.5 text-gray-400" /> {Math.ceil(questions.filter(q => isPyq(q) && q.exam === selectedExam).length * 1.5)} Mins
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          const examQuestions = questions.filter(q => isPyq(q) && q.exam === selectedExam).map(q => q.id);
                          onStartDynamicQuiz(
                            `${selectedExam} - Full Combined Mock`,
                            'pyq',
                            examQuestions,
                            undefined,
                            undefined
                          );
                        }}
                        className="flex-1 bg-emerald-800 text-white font-bold py-2.5 rounded-xl hover:bg-emerald-900 transition-colors text-xs flex items-center justify-center gap-1 shadow-sm cursor-pointer"
                      >
                        Start Combined Paper <Play className="h-3.5 w-3.5 fill-white" />
                      </button>
                      <button
                        onClick={() => setShareConfig({
                          type: 'pyq',
                          exam: selectedExam,
                          qCount: questions.filter(q => isPyq(q) && q.exam === selectedExam).length
                        })}
                        title="संयुक्त पेपर शेयर करें"
                        className="p-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl transition border border-emerald-200 cursor-pointer"
                      >
                        <Share2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* YEAR-WISE PAPERS */}
                {availableYears.map((year, idx) => {
                  const yearQCount = questions.filter(q => isPyq(q) && q.exam === selectedExam && q.year === year).length;
                  const grad = cardGradients[(idx + 1) % cardGradients.length];
                  return (
                    <div 
                      key={year} 
                      className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 flex flex-col justify-between group"
                    >
                      <div className={`p-4 bg-gradient-to-tr ${grad} text-white relative`}>
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] bg-white/20 px-2.5 py-0.5 rounded-full font-bold text-white uppercase tracking-wider backdrop-blur-sm font-sans">
                            Year wise Paper
                          </span>
                          <span className="text-[10px] text-emerald-200 font-bold flex items-center gap-0.5 font-sans">
                            <Calendar className="h-3 w-3 fill-current" /> {year}
                          </span>
                        </div>
                        <div className="mt-8 mb-4">
                          <h3 className="text-2xl font-black tracking-tight">{year} Exam Paper</h3>
                          <p className="text-[10px] text-white/85 mt-1 font-sans">{selectedExam} Official Year {year} Questions</p>
                        </div>
                      </div>

                      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                            <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                            <span className="font-sans">विस्तृत व्याख्या सहित (Hindi Solutions)</span>
                          </div>
                          
                          <div className="flex items-center gap-4 pt-1 text-xs text-gray-500 font-sans">
                            <span className="flex items-center gap-1 bg-gray-50 px-2.5 py-1 rounded-lg">
                              <HelpCircle className="h-3.5 w-3.5 text-gray-400" /> {yearQCount} MCQs
                            </span>
                            <span className="flex items-center gap-1 bg-gray-50 px-2.5 py-1 rounded-lg">
                              <Clock className="h-3.5 w-3.5 text-gray-400" /> {Math.ceil(yearQCount * 1.5)} Mins
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleStartExamYearPYQ(selectedExam, year)}
                            className="flex-1 bg-emerald-800 text-white font-bold py-2.5 rounded-xl hover:bg-emerald-900 transition-colors text-xs flex items-center justify-center gap-1 shadow-sm cursor-pointer"
                          >
                            Start {year} Paper <Play className="h-3.5 w-3.5 fill-white" />
                          </button>
                          <button
                            onClick={() => setShareConfig({
                              type: 'pyq',
                              exam: selectedExam,
                              year: year,
                              qCount: yearQCount
                            })}
                            title="वर्ष पेपर शेयर करें"
                            className="p-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl transition border border-emerald-200 cursor-pointer"
                          >
                            <Share2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {hasNoYearQuestions && (
                  <div 
                    className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 flex flex-col justify-between group"
                  >
                    <div className="p-4 bg-gradient-to-tr from-slate-600 to-slate-800 text-white relative">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] bg-white/20 px-2.5 py-0.5 rounded-full font-bold text-white uppercase tracking-wider backdrop-blur-sm font-sans">
                          General Paper
                        </span>
                      </div>
                      <div className="mt-8 mb-4">
                        <h3 className="text-2xl font-black tracking-tight">Other/General</h3>
                        <p className="text-[10px] text-white/85 mt-1 font-sans">Questions with no specific year marked</p>
                      </div>
                    </div>

                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                          <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                          <span className="font-sans">विस्तृत व्याख्या सहित (Hindi Solutions)</span>
                        </div>
                        
                        <div className="flex items-center gap-4 pt-1 text-xs text-gray-500 font-sans">
                          <span className="flex items-center gap-1 bg-gray-50 px-2.5 py-1 rounded-lg">
                            <HelpCircle className="h-3.5 w-3.5 text-gray-400" /> {questions.filter(q => isPyq(q) && q.exam === selectedExam && !q.year).length} MCQs
                          </span>
                          <span className="flex items-center gap-1 bg-gray-50 px-2.5 py-1 rounded-lg">
                            <Clock className="h-3.5 w-3.5 text-gray-400" /> {Math.ceil(questions.filter(q => isPyq(q) && q.exam === selectedExam && !q.year).length * 1.5)} Mins
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleStartExamYearPYQ(selectedExam, null)}
                          className="flex-1 bg-slate-800 text-white font-bold py-2.5 rounded-xl hover:bg-slate-900 transition-colors text-xs flex items-center justify-center gap-1 shadow-sm cursor-pointer"
                        >
                          Start General Paper <Play className="h-3.5 w-3.5 fill-white" />
                        </button>
                        <button
                          onClick={() => setShareConfig({
                            type: 'pyq',
                            exam: selectedExam,
                            qCount: questions.filter(q => isPyq(q) && q.exam === selectedExam && !q.year).length
                          })}
                          title="पेपर शेयर करें"
                          className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition border border-slate-200 cursor-pointer"
                        >
                          <Share2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest">Official Exam Sheets</h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShareConfig({
                      type: 'website'
                    })}
                    className="text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold px-3 py-1 rounded-lg border border-emerald-200 flex items-center gap-1 cursor-pointer transition"
                  >
                    <Share2 className="h-3 w-3" /> PYQs शेयर करें
                  </button>
                  <span className="text-xs bg-emerald-50 text-emerald-800 px-2.5 py-0.5 rounded-full font-bold font-sans">
                    {pyqExams.length} Exam Papers
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pyqExams
                  .filter(exam => exam.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((examName, idx) => {
                    const examQCount = questions.filter(q => isPyq(q) && q.exam === examName).length;
                    const grad = cardGradients[idx % cardGradients.length];
                    return (
                      <div 
                        key={idx} 
                        className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 flex flex-col justify-between group"
                      >
                        {/* Top Cover Visual */}
                        <div className={`p-4 bg-gradient-to-tr ${grad} text-white relative`}>
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] bg-white/20 px-2.5 py-0.5 rounded-full font-bold text-white uppercase tracking-wider backdrop-blur-sm font-sans">
                              Official PYQ
                            </span>
                            <span className="text-[10px] text-emerald-200 font-bold flex items-center gap-0.5 font-sans">
                              <Star className="h-3 w-3 fill-current" /> Verified Paper
                            </span>
                          </div>
                          <div className="mt-8 mb-4">
                            <h3 className="text-base font-extrabold tracking-tight line-clamp-1">{examName}</h3>
                            <p className="text-[10px] text-white/85 mt-1 font-sans">Official Competitive Exam Question Sheet</p>
                          </div>
                        </div>

                        {/* Details & Info */}
                        <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                              <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                              <span className="font-sans">विस्तृत व्याख्या सहित (Hindi Solutions)</span>
                            </div>
                            
                            <div className="flex items-center gap-4 pt-1 text-xs text-gray-500 font-sans">
                              <span className="flex items-center gap-1 bg-gray-50 px-2.5 py-1 rounded-lg">
                                <HelpCircle className="h-3.5 w-3.5 text-gray-400" /> {examQCount} MCQs
                              </span>
                              <span className="flex items-center gap-1 bg-gray-50 px-2.5 py-1 rounded-lg">
                                <Clock className="h-3.5 w-3.5 text-gray-400" /> {Math.ceil(examQCount * 1.5)} Mins
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleSelectExam(examName)}
                              className="flex-1 bg-emerald-800 text-white font-bold py-2.5 rounded-xl hover:bg-emerald-900 transition-colors text-xs flex items-center justify-center gap-1 shadow-sm cursor-pointer"
                            >
                              Select Exam Year <Play className="h-3.5 w-3.5 fill-white" />
                            </button>
                            <button
                              onClick={() => setShareConfig({
                                type: 'pyq',
                                exam: examName,
                                qCount: examQCount
                              })}
                              title="परीक्षा PYQ शेयर करें"
                              className="p-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl transition border border-emerald-200 cursor-pointer"
                            >
                              <Share2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                {pyqExams.length === 0 && (
                  <div className="col-span-full text-center py-12 bg-white border border-gray-100 rounded-3xl text-gray-500 text-xs font-semibold">
                    No previous exam papers are currently loaded with complete exam and year information.
                  </div>
                )}
              </div>
            </div>
          )
        ) : (
          /* TOPIC-WISE PYQS */
          <div className="space-y-8">
            {Object.entries(pyqTopicsGrouped).length === 0 ? (
              <div className="text-center py-12 bg-white border border-gray-100 rounded-3xl text-gray-500 text-xs font-semibold">
                No topic-wise previous year questions found with complete exam & year parameters.
              </div>
            ) : (
              Object.entries(pyqTopicsGrouped).map(([subjectName, topics], sIdx) => {
                const allSubjectQIds = Object.values(topics).flat();
                return (
                  <div key={sIdx} className="space-y-4 bg-white/40 p-5 rounded-3xl border border-emerald-100/50">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-gray-100">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-extrabold text-gray-900 border-l-4 border-emerald-600 pl-3 uppercase tracking-wide">
                          {subjectName}
                        </h3>
                        <span className="text-[10px] bg-emerald-100 text-emerald-850 font-bold px-2.5 py-0.5 rounded-full font-sans">
                          {allSubjectQIds.length} PYQs
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setShareConfig({
                            type: 'pyq',
                            exam: `${subjectName} PYQs`,
                            qCount: allSubjectQIds.length
                          })}
                          className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold px-3 py-1.5 rounded-xl transition text-xs flex items-center justify-center gap-1 border border-emerald-200 cursor-pointer"
                        >
                          <Share2 className="h-3.5 w-3.5" /> शेयर करें
                        </button>
                        <button
                          onClick={() => handleStartSubjectPYQ(subjectName, allSubjectQIds)}
                          className="bg-emerald-800 hover:bg-emerald-900 text-white font-bold px-3.5 py-1.5 rounded-xl transition text-xs flex items-center justify-center gap-1.5 shadow-sm cursor-pointer self-start sm:self-auto"
                        >
                          <Play className="h-3.5 w-3.5 fill-white" /> संपूर्ण विषय क्विज ({allSubjectQIds.length} प्रश्न)
                        </button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {Object.entries(topics).map(([topicName, qIds], tIdx) => (
                        <div 
                          key={tIdx} 
                          className="bg-white p-4 rounded-2xl border border-gray-100 hover:border-emerald-200 transition-all flex items-center justify-between shadow-sm group hover:shadow-md"
                        >
                          <div className="space-y-1 pr-2">
                            <h4 className="text-xs font-bold text-gray-800 group-hover:text-emerald-800 transition line-clamp-1">{topicName}</h4>
                            <p className="text-[10px] text-gray-400 font-bold font-sans">{qIds.length} Topic PYQs</p>
                          </div>
                          
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => setShareConfig({
                                type: 'topic',
                                subject: subjectName,
                                topic: topicName,
                                qCount: qIds.length
                              })}
                              className="p-2.5 bg-gray-50 hover:bg-gray-100 text-gray-600 hover:text-emerald-800 rounded-xl transition border border-gray-200 cursor-pointer"
                              title="Share Topic PYQs"
                            >
                              <Share2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleStartTopicPYQ(subjectName, topicName, qIds)}
                              className="p-2.5 bg-emerald-50 hover:bg-emerald-700 hover:text-white text-emerald-800 rounded-xl transition cursor-pointer"
                              title="Start Topic Quiz"
                            >
                              <Play className="h-4 w-4 fill-current" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Share Modal */}
      <ShareModal 
        isOpen={!!shareConfig}
        onClose={() => setShareConfig(null)}
        options={shareConfig || { type: 'website' }}
      />

    </div>
  );
}
