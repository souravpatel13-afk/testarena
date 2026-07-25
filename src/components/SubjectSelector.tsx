import React, { useState } from 'react';
import { 
  BookOpen, 
  Clock, 
  HelpCircle, 
  Play, 
  Search, 
  BookMarked,
  Grid,
  Layers,
  CheckCircle
} from 'lucide-react';
import { Quiz, Question } from '../types';
import { isSubjectTestQuestion } from '../utils/quizHelpers';

interface SubjectSelectorProps {
  quizzes: Quiz[];
  questions: Question[];
  onSelectQuiz: (quizId: string) => void;
  onStartDynamicQuiz: (title: string, type: 'pyq' | 'subject', questionIds: string[], subject?: string, topic?: string) => void;
}

export default function SubjectSelector({ quizzes, questions, onSelectQuiz, onStartDynamicQuiz }: SubjectSelectorProps) {
  const [subjectSubTab, setSubjectSubTab] = useState<'subject' | 'topic'>('subject');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter all questions to only those belonging in Subject Tests
  const subjectQuestionsFiltered = questions.filter(isSubjectTestQuestion);

  // Group questions by Subject (Entire Subject Test mode)
  const subjectGroups: Record<string, string[]> = {}; // Subject -> questionIds
  subjectQuestionsFiltered.forEach(q => {
    const sub = q.subject || "Chhattisgarh General Knowledge";
    if (!subjectGroups[sub]) {
      subjectGroups[sub] = [];
    }
    subjectGroups[sub].push(q.id);
  });

  // Group questions by Subject and Topic (Topicwise Quiz mode)
  const subjectTopicsGrouped: Record<string, Record<string, string[]>> = {}; // Subject -> Topic -> questionIds
  subjectQuestionsFiltered.forEach(q => {
    const sub = q.subject || "Chhattisgarh General Knowledge";
    const top = q.topic || "General Concept";
    if (!subjectTopicsGrouped[sub]) {
      subjectTopicsGrouped[sub] = {};
    }
    if (!subjectTopicsGrouped[sub][top]) {
      subjectTopicsGrouped[sub][top] = [];
    }
    subjectTopicsGrouped[sub][top].push(q.id);
  });

  const cardGradients = [
    'from-emerald-800 via-emerald-900 to-teal-950',
    'from-teal-800 via-teal-900 to-slate-950',
    'from-emerald-700 via-teal-850 to-emerald-950',
    'from-slate-800 via-slate-900 to-emerald-950',
    'from-emerald-900 via-teal-900 to-slate-900'
  ];

  const handleStartEntireSubjectTest = (subjectName: string, questionIds: string[]) => {
    if (questionIds.length === 0) {
      alert("इस विषय के अंतर्गत कोई प्रश्न उपलब्ध नहीं है।");
      return;
    }
    onStartDynamicQuiz(
      `${subjectName} - पूरा विषय टेस्ट (Entire Subject Test)`,
      'subject',
      questionIds,
      subjectName,
      undefined
    );
  };

  const handleStartTopicwiseQuiz = (subjectName: string, topicName: string, questionIds: string[]) => {
    if (questionIds.length === 0) {
      alert("इस टॉपिक के अंतर्गत कोई प्रश्न उपलब्ध नहीं है।");
      return;
    }
    onStartDynamicQuiz(
      `${subjectName}: ${topicName} (विशेष टॉपिक क्विज)`,
      'subject',
      questionIds,
      subjectName,
      topicName
    );
  };

  return (
    <div className="space-y-6 font-sans max-w-7xl mx-auto px-4 py-4 fade-in" id="subject-selector-main">
      
      {/* Premium Hero Banner (Subject Practice Theme) */}
      <div className="bg-gradient-to-br from-emerald-50/50 via-teal-50/30 to-white rounded-3xl border border-emerald-100/60 p-6 md:p-10 shadow-sm relative overflow-hidden">
        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none">
          <BookOpen className="h-64 w-64 text-emerald-800" />
        </div>
        
        <div className="max-w-2xl space-y-4">
          <span className="text-xs font-bold text-emerald-800 bg-emerald-100/60 px-3 py-1 rounded-full border border-emerald-200 uppercase tracking-wider inline-flex items-center gap-1 font-sans">
            <BookMarked className="h-3.5 w-3.5" /> Subject & Topic Practice (विषयवार एवं टॉपिकवाइज अभ्यास)
          </span>
          <h1 className="text-2xl md:text-4xl font-extrabold text-gray-900 tracking-tight leading-tight">
            Strengthen Your Concepts
          </h1>
          <p className="text-xs md:text-sm text-gray-600 leading-relaxed font-sans">
            विभिन्न विषयों एवं अध्यायों का विषय-वार व टॉपिक-वार अभ्यास करें।
          </p>

          {/* Filters & Subtab Row in Banner */}
          <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
            <div className="flex bg-gray-200/60 p-1 rounded-xl w-full sm:w-auto border border-gray-300/10">
              <button
                onClick={() => setSubjectSubTab('subject')}
                className={`flex-1 sm:flex-none text-xs font-bold px-4 py-2.5 rounded-lg transition flex items-center justify-center gap-1.5 ${subjectSubTab === 'subject' ? 'bg-white text-emerald-900 shadow font-sans' : 'text-gray-500 hover:text-gray-800 font-sans'}`}
              >
                <Layers className="h-3.5 w-3.5" /> पूरा विषय टेस्ट (Entire Subject Test)
              </button>
              <button
                onClick={() => setSubjectSubTab('topic')}
                className={`flex-1 sm:flex-none text-xs font-bold px-4 py-2.5 rounded-lg transition flex items-center justify-center gap-1.5 ${subjectSubTab === 'topic' ? 'bg-white text-emerald-900 shadow font-sans' : 'text-gray-500 hover:text-gray-800 font-sans'}`}
              >
                <Grid className="h-3.5 w-3.5" /> टॉपिकवाइज क्विज (Topicwise Quiz)
              </button>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder={subjectSubTab === 'subject' ? "Search subjects..." : "Search topics..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 w-full bg-white text-gray-800 font-medium font-sans"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Tabs Content rendering */}
      <div>
        {subjectSubTab === 'subject' ? (
          /* 1. ENTIRE SUBJECT TEST TAB CONTAINER */
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest">Select Subject to Practice</h2>
                <span className="text-xs bg-emerald-50 text-emerald-800 px-2.5 py-0.5 rounded-full font-bold font-sans">
                  {Object.keys(subjectGroups).length} Subjects Available
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.entries(subjectGroups)
                  .filter(([subName]) => subName.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map(([subjectName, qIds], idx) => {
                    const grad = cardGradients[idx % cardGradients.length];
                    return (
                      <div 
                        key={idx} 
                        className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 flex flex-col justify-between group"
                      >
                        {/* Gradient Top */}
                        <div className={`p-5 bg-gradient-to-tr ${grad} text-white relative`}>
                          <span className="text-[10px] bg-white/25 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider backdrop-blur-sm text-white font-sans">
                            Entire Subject Test
                          </span>
                          <div className="mt-8 mb-2">
                            <h3 className="text-base font-extrabold tracking-tight line-clamp-1">{subjectName}</h3>
                            <p className="text-[10px] text-white/80 mt-1 font-sans">कम्पलीट विषय टेस्ट (सभी टॉपिक शामिल)</p>
                          </div>
                        </div>

                        {/* Card Details */}
                        <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                              <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                              <span className="font-sans">विस्तृत व्याख्या सहित (Hindi Solutions)</span>
                            </div>
                            
                            <div className="flex items-center gap-4 pt-1 text-xs text-gray-500 font-sans">
                              <span className="flex items-center gap-1 bg-gray-50 px-2.5 py-1 rounded-lg">
                                <HelpCircle className="h-3.5 w-3.5 text-gray-400" /> {qIds.length} MCQs
                              </span>
                              <span className="flex items-center gap-1 bg-gray-50 px-2.5 py-1 rounded-lg">
                                <Clock className="h-3.5 w-3.5 text-gray-400" /> {Math.max(5, Math.ceil(qIds.length * 1.5))} Mins
                              </span>
                            </div>
                          </div>

                          <button
                            onClick={() => handleStartEntireSubjectTest(subjectName, qIds)}
                            className="w-full bg-emerald-800 text-white font-bold py-2.5 rounded-xl hover:bg-emerald-900 transition-colors text-xs flex items-center justify-center gap-1 shadow-sm cursor-pointer"
                          >
                            पूरा विषय टेस्ट शुरू करें <Play className="h-3.5 w-3.5 fill-white" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>


          </div>
        ) : (
          /* 2. TOPICWISE QUIZ TAB CONTAINER */
          <div className="space-y-8">
            {Object.entries(subjectTopicsGrouped).length === 0 ? (
              <div className="text-center py-12 bg-white border border-gray-100 rounded-3xl text-gray-500 text-xs font-semibold">
                No topic-wise practice questions available.
              </div>
            ) : (
              Object.entries(subjectTopicsGrouped).map(([subjectName, topics], sIdx) => {
                // Filter topics by search query
                const filteredTopics = Object.entries(topics).filter(([topicName]) => 
                  topicName.toLowerCase().includes(searchQuery.toLowerCase())
                );

                if (filteredTopics.length === 0) return null;

                const topicThemes = [
                  { headerBg: 'bg-blue-600', icon: '📘', badgeBg: 'bg-blue-50 text-blue-600 border-blue-100', btnBg: 'bg-blue-600 hover:bg-blue-700 text-white' },
                  { headerBg: 'bg-emerald-600', icon: '🌿', badgeBg: 'bg-emerald-50 text-emerald-600 border-emerald-100', btnBg: 'bg-emerald-600 hover:bg-emerald-700 text-white' },
                  { headerBg: 'bg-purple-600', icon: '🧠', badgeBg: 'bg-purple-50 text-purple-600 border-purple-100', btnBg: 'bg-purple-600 hover:bg-purple-700 text-white' },
                  { headerBg: 'bg-orange-600', icon: '🔥', badgeBg: 'bg-orange-50 text-orange-600 border-orange-100', btnBg: 'bg-orange-600 hover:bg-orange-700 text-white' },
                  { headerBg: 'bg-pink-600', icon: '🎯', badgeBg: 'bg-pink-50 text-pink-600 border-pink-100', btnBg: 'bg-pink-600 hover:bg-pink-700 text-white' },
                  { headerBg: 'bg-cyan-600', icon: '💡', badgeBg: 'bg-cyan-50 text-cyan-600 border-cyan-100', btnBg: 'bg-cyan-600 hover:bg-cyan-700 text-white' }
                ];

                return (
                  <div key={sIdx} className="space-y-5">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                      <h3 className="text-sm font-black text-gray-900 uppercase tracking-wide flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                        {subjectName}
                      </h3>
                      <span className="text-xs text-gray-400 font-bold">{filteredTopics.length} Topics</span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredTopics.map(([topicName, qIds], tIdx) => {
                        const theme = topicThemes[tIdx % topicThemes.length];
                        return (
                          <div 
                            key={tIdx} 
                            className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 flex flex-col justify-between"
                          >
                            {/* Colored Top Header Banner */}
                            <div className={`${theme.headerBg} p-6 text-white space-y-3 relative`}>
                              <div className="text-2xl">{theme.icon}</div>
                              <h4 className="text-xl font-extrabold tracking-tight text-white line-clamp-1">{topicName}</h4>
                            </div>

                            {/* Card Content Body */}
                            <div className="p-6 space-y-5 flex-1 flex flex-col justify-between">
                              <div className="space-y-3">
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${theme.badgeBg}`}>
                                  📄 {qIds.length} Questions
                                </span>
                                <p className="text-xs text-gray-500 leading-relaxed font-sans">
                                  Practice all questions from <strong className="text-gray-800">{topicName}</strong> and improve your score.
                                </p>
                              </div>

                              <button
                                onClick={() => handleStartTopicwiseQuiz(subjectName, topicName, qIds)}
                                className={`w-full py-3 px-4 font-bold rounded-2xl transition-all duration-200 text-xs flex items-center justify-center gap-1.5 shadow-sm cursor-pointer ${theme.btnBg}`}
                              >
                                <Play className="h-3.5 w-3.5 fill-current" /> Start Practice
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

    </div>
  );
}
