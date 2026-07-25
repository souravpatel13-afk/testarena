import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  BookOpen, 
  CheckCircle2, 
  Award, 
  Calendar, 
  ExternalLink, 
  Search, 
  GraduationCap, 
  HelpCircle, 
  ChevronRight,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { ExamInfo } from '../types';

interface AboutExamProps {
  exams: ExamInfo[];
  onNavigateToPractice?: (examName: string) => void;
}

export default function AboutExam({ exams, onNavigateToPractice }: AboutExamProps) {
  const [selectedExamId, setSelectedExamId] = useState<string>(exams[0]?.id || '');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredExams = exams.filter(exam => 
    exam.examName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    exam.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedExam = exams.find(e => e.id === selectedExamId) || filteredExams[0] || exams[0];

  if (!exams || exams.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm text-center space-y-4">
        <GraduationCap className="h-12 w-12 text-emerald-600 mx-auto" />
        <h3 className="text-lg font-bold text-gray-800">कोई परीक्षा जानकारी उपलब्ध नहीं है</h3>
        <p className="text-xs text-gray-500">एडमिन पैनल में जाकर नई परीक्षा और उसका सिलेबस जोड़ें।</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 font-sans fade-in" id="about-exam-section">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-lg border border-slate-800 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative space-y-3 max-w-3xl">
          <div className="flex items-center gap-2">
            <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-emerald-400" /> परीक्षा मार्गदर्शन व सिलेबस पोर्टल
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white leading-tight">
            प्रतियोगी परीक्षाओं की संपूर्ण जानकारी व नवीनतम सिलेबस
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-light">
            छत्तीसगढ़ लोक सेवा आयोग (CGPSC), व्यापमं (Vyapam), शिक्षक भर्ती व अन्य प्रतियोगी परीक्षाओं का सटीक एग्जाम पैटर्न, चयन प्रक्रिया, विस्तृत पाठ्यक्रम तथा आधिकारिक सिलेबस PDF यहाँ देखें।
          </p>
        </div>
      </div>

      {/* Exam Selection Pills & Search Bar */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-gray-100 shadow-sm">
          {/* Exam Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {exams.map(exam => {
              const isSelected = selectedExam?.id === exam.id;
              return (
                <button
                  key={exam.id}
                  onClick={() => setSelectedExamId(exam.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 shrink-0 ${
                    isSelected 
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20' 
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200/80'
                  }`}
                >
                  <BookOpen className={`h-3.5 w-3.5 ${isSelected ? 'text-white' : 'text-emerald-600'}`} />
                  {exam.examName}
                </button>
              );
            })}
          </div>

          {/* Quick Search */}
          <div className="relative min-w-[200px]">
            <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="परीक्षा खोजें..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
            />
          </div>
        </div>
      </div>

      {/* Main Selected Exam Content View */}
      {selectedExam && (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden space-y-0">
          
          {/* Exam Card Header */}
          <div className="p-6 sm:p-8 bg-gradient-to-b from-emerald-50/60 to-white border-b border-gray-100 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider">
                    {selectedExam.category || 'Competitive Exam'}
                  </span>
                  <span className="text-[11px] text-gray-400 font-medium flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> अपडेटेड: {selectedExam.updatedAt ? new Date(selectedExam.updatedAt).toLocaleDateString('hi-IN') : '2026'}
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                  {selectedExam.examName}
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 font-medium">
                  {selectedExam.shortTagline}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                {selectedExam.pdfUrl && (
                  <a
                    href={selectedExam.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-red-500 hover:bg-red-600 text-white font-extrabold px-4 py-2.5 rounded-xl text-xs transition-all flex items-center gap-2 shadow-sm hover:shadow"
                  >
                    <Download className="h-4 w-4" /> सिलेबस PDF <ExternalLink className="h-3 w-3 opacity-70" />
                  </a>
                )}

                {onNavigateToPractice && (
                  <button
                    onClick={() => onNavigateToPractice(selectedExam.examName)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-4 py-2.5 rounded-xl text-xs transition-all flex items-center gap-2 shadow-sm"
                  >
                    टेस्ट हल करें <ArrowRight className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

          </div>

          {/* Document Content Panel */}
          <div className="p-6 sm:p-8 space-y-6">
            <div className="bg-white border border-gray-200/90 rounded-3xl p-6 sm:p-10 shadow-xs max-w-none font-sans leading-relaxed text-gray-800 space-y-4">
              {selectedExam.richContent ? (
                <div 
                  className="prose prose-emerald max-w-none text-gray-800 text-xs sm:text-sm leading-relaxed space-y-4"
                  dangerouslySetInnerHTML={{ __html: selectedExam.richContent }}
                />
              ) : selectedExam.overview ? (
                <div className="space-y-4">
                  <div className="p-4 bg-emerald-50/80 border border-emerald-200/80 rounded-2xl text-xs text-emerald-900 font-medium">
                    📄 {selectedExam.examName} का सम्पूर्ण विवरण व गाइड नीचे दिया गया है:
                  </div>
                  <div className="text-xs text-gray-700 leading-relaxed bg-gray-50 p-5 rounded-2xl border border-gray-100 whitespace-pre-line font-medium">
                    {selectedExam.overview}
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-gray-400 italic text-xs">
                  इस परीक्षा की सामग्री सम्पादित की जा रही है। जल्द ही उपलब्ध होगी।
                </div>
              )}
            </div>
          </div>

        </div>
      )}

      {/* Grid of Other Exams for Quick Jump */}
      <div className="space-y-3">
        <h3 className="text-sm font-extrabold text-gray-900 flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-emerald-600" /> अन्य प्रतियोगी परीक्षाएं (Explore All Exams)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {exams.map(e => (
            <div
              key={e.id}
              onClick={() => {
                setSelectedExamId(e.id);
                window.scrollTo({ top: document.getElementById('about-exam-section')?.offsetTop || 0, behavior: 'smooth' });
              }}
              className={`p-4 rounded-2xl border cursor-pointer transition-all duration-200 group flex flex-col justify-between space-y-3 ${
                selectedExam?.id === e.id 
                  ? 'bg-emerald-50/80 border-emerald-300 ring-2 ring-emerald-500/20' 
                  : 'bg-white border-gray-100 hover:border-emerald-200 hover:shadow-sm'
              }`}
            >
              <div className="space-y-1">
                <span className="text-[10px] text-emerald-700 font-extrabold uppercase bg-emerald-100/80 px-2 py-0.5 rounded">
                  {e.category}
                </span>
                <h4 className="text-xs font-black text-gray-900 group-hover:text-emerald-700 transition-colors">
                  {e.examName}
                </h4>
                <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed">
                  {e.shortTagline}
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-gray-100/80 text-[11px] font-bold text-emerald-700">
                <span>विस्तार से देखें</span>
                <ChevronRight className="h-3.5 w-3.5 transform group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
