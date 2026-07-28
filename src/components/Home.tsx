import React from 'react';
import { 
  Compass, 
  Target, 
  Award, 
  BookOpen, 
  Play, 
  TrendingUp, 
  ChevronRight,
  ShieldAlert,
  Users,
  GraduationCap
} from 'lucide-react';
import { ExamInfo, Question } from '../types';

interface HomeProps {
  onNavigate: (tab: 'dashboard' | 'pyqs' | 'subjects' | 'current-affairs' | 'about' | 'contact' | 'admin' | 'exam-info') => void;
  questionsCount: number;
  quizzesCount: number;
  exams?: ExamInfo[];
  questions?: Question[];
}

export default function Home({ onNavigate, questionsCount, quizzesCount, exams = [], questions = [] }: HomeProps) {
  const realQuestionsCount = questionsCount || questions.length || 0;
  
  const uniqueTopics = new Set(questions.map(q => q.topic).filter(Boolean));
  const realTopicsCount = uniqueTopics.size > 0 ? uniqueTopics.size : (quizzesCount || 0);

  const uniqueExams = new Set(questions.map(q => q.exam).filter(Boolean));
  const realExamsCount = exams.length > 0 ? exams.length : (uniqueExams.size > 0 ? uniqueExams.size : 0);

  const successPoints = [
    {
      title: 'Master Core Concepts & Syllabus',
      desc: 'अवधारणात्मक स्पष्टता और विषयों पर मज़बूत पकड़ के साथ अध्ययन करें।',
    },
    {
      title: 'Analyze Previous Years Questions (PYQs)',
      desc: 'विगत 10 वर्षों के प्रश्न पत्रों का नियमित अभ्यास कर परीक्षा पैटर्न समझें।',
    },
    {
      title: 'Timed Mock Tests & Self-Evaluation',
      desc: 'वास्तविक परीक्षा माहौल में हल कर अपनी गति और सटीकता बढ़ाएं।',
    },
    {
      title: 'Mistakes Tracker & Detailed Explanations',
      desc: 'गलत उत्तरों का विश्लेषणात्मक हिंदी हल देखकर अपनी कमियों में सुधार करें।',
    }
  ];

  const objectives = [
    {
      title: 'Quality Practice for All',
      desc: 'सभी अभ्यर्थियों के लिए निःशुल्क और उच्च गुणवत्ता वाले टेस्ट सेट।',
      icon: Compass,
      color: 'text-emerald-700 bg-emerald-50 border-emerald-100',
    },
    {
      title: '100% Verified Hindi Explanations',
      desc: 'मानक पुस्तकों व उत्तर कुंजियों पर आधारित प्रामाणिक व्याख्या।',
      icon: Target,
      color: 'text-amber-700 bg-amber-50 border-amber-100',
    },
    {
      title: 'Smart Progress Analytics',
      desc: 'वास्तविक समय में कमजोर विषयों का सटीक विश्लेषण।',
      icon: TrendingUp,
      color: 'text-teal-700 bg-teal-50 border-teal-100',
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-12 font-sans fade-in" id="home-view-container">
      
      {/* Hero Banner in Green Shade matched to Test Arena identity */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-emerald-800 via-emerald-900 to-teal-950 text-white shadow-2xl p-8 md:p-12 lg:p-16 border border-emerald-700/50">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Column Text & CTA */}
          <div className="lg:col-span-7 space-y-6">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-tight text-white">
              Crack Your Exam <br />
              <span className="text-yellow-300">With Smart Practice</span>
            </h1>

            <p className="text-base md:text-lg text-emerald-100/90 font-medium max-w-xl leading-relaxed">
              Practice thousands of questions, improve accuracy and achieve your goal.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={() => onNavigate('subjects')}
                className="bg-yellow-400 hover:bg-yellow-300 text-gray-950 font-black px-8 py-4 rounded-full text-sm shadow-xl transition-all transform hover:scale-105 flex items-center gap-2 cursor-pointer"
              >
                🚀 Start Practice
              </button>

              <button
                onClick={() => onNavigate('pyqs')}
                className="bg-white/10 hover:bg-white/20 text-white font-bold px-6 py-4 rounded-full text-sm backdrop-blur-md border border-white/20 transition cursor-pointer"
              >
                📖 Explore PYQs
              </button>
            </div>
          </div>

          {/* Right Column Floating Glass Card */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="bg-emerald-950/40 backdrop-blur-md border border-emerald-500/30 p-8 rounded-3xl text-center text-white shadow-2xl w-full max-w-sm space-y-4">
              <div className="w-20 h-20 bg-emerald-800/50 rounded-full flex items-center justify-center mx-auto text-4xl shadow-inner border border-emerald-400/30">
                👨‍🎓
              </div>
              <div>
                <h3 className="text-xl font-black text-white">Your Success Journey</h3>
                <p className="text-xs text-yellow-300 font-bold uppercase tracking-widest mt-1">
                  Learn • Practice • Improve
                </p>
              </div>
              <p className="text-xs text-emerald-100/90 leading-relaxed font-sans pt-1">
                CGPSC, व्यापमं व अन्य राज्यस्तरीय प्रतियोगी परीक्षाओं की पूर्ण व गुणवत्तापूर्ण तैयारी।
              </p>
            </div>
          </div>

        </div>

        {/* Hero Stats Row inside Banner - Real-Time Dynamic Counts */}
        <div className="mt-12 pt-8 border-t border-emerald-700/50 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-emerald-950/40 backdrop-blur-md border border-emerald-500/30 rounded-2xl p-4 text-center">
            <span className="text-2xl sm:text-3xl font-black text-yellow-300 block font-sans">{realQuestionsCount}</span>
            <span className="text-xs text-emerald-100 font-bold uppercase tracking-wider">Questions</span>
          </div>
          <div className="bg-emerald-950/40 backdrop-blur-md border border-emerald-500/30 rounded-2xl p-4 text-center">
            <span className="text-2xl sm:text-3xl font-black text-yellow-300 block font-sans">{realTopicsCount}</span>
            <span className="text-xs text-emerald-100 font-bold uppercase tracking-wider">Topics</span>
          </div>
          <div className="bg-emerald-950/40 backdrop-blur-md border border-emerald-500/30 rounded-2xl p-4 text-center">
            <span className="text-2xl sm:text-3xl font-black text-yellow-300 block font-sans">{realExamsCount}</span>
            <span className="text-xs text-emerald-100 font-bold uppercase tracking-wider">Exams</span>
          </div>
        </div>
      </div>

      {/* Sleek Dedicated Exam & Syllabus Teaser Card */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 rounded-3xl p-6 sm:p-8 text-white shadow-md flex flex-col md:flex-row items-center justify-between gap-6 border border-emerald-800/40">
        <div className="space-y-2 text-center md:text-left">
          <div className="inline-flex items-center gap-2 bg-emerald-800/60 text-emerald-300 text-[11px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
            <GraduationCap className="h-4 w-4" />
            परीक्षा गाइड व संपूर्ण विवरण (Exam Info)
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            CGPSC, व्यापमं व अन्य परीक्षाओं का सम्पूर्ण विवरण व परीक्षा जानकारी
          </h2>
          <p className="text-xs sm:text-sm text-emerald-100/80 leading-relaxed max-w-2xl font-light">
            परीक्षा की पात्रता (Eligibility), चयन प्रक्रिया, एग्जाम पैटर्न (Exam Pattern) और विस्तृत जानकारी के लिए समर्पित नया पेज देखें।
          </p>
        </div>
        <button
          onClick={() => onNavigate('exam-info')}
          className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold px-6 py-3.5 rounded-xl text-xs transition shadow-md flex items-center gap-2 shrink-0 cursor-pointer"
        >
          <GraduationCap className="h-4 w-4" />
          Exam Info पेज खोलें
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>


      {/* Main Section Grid: Strategy Guide vs Objectives */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Success Strategy Keys to Clear Competitive Exams */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full uppercase tracking-wider">
                Exam Preparation Strategy
              </span>
              <h2 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">
                Key Strategic Guidelines to Excel in Competitive Exams
              </h2>
              <p className="text-xs text-gray-500 leading-relaxed font-sans">
                सरकारी व सिविल सेवा परीक्षाओं की प्रतिस्पर्धा अत्यंत कठिन है। एक सुव्यवस्थित रणनीति, सटीक दिशा-निर्देश और नियमित मूल्यांकन ही आपकी सफलता के मुख्य आधार हैं:
              </p>
            </div>

            <div className="space-y-4">
              {successPoints.map((point, index) => (
                <div 
                  key={index} 
                  className="flex gap-4 items-start border-b border-gray-50 pb-4 last:border-0 last:pb-0 group hover:bg-emerald-50/20 p-2 rounded-xl transition-all duration-200"
                >
                  <span className="bg-emerald-50 text-emerald-800 text-xs font-black h-8 w-8 rounded-xl flex items-center justify-center shrink-0 border border-emerald-100 group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-200">
                    0{index + 1}
                  </span>
                  <div className="space-y-1">
                    <h3 className="text-xs font-bold text-gray-950 group-hover:text-emerald-900 transition-colors">{point.title}</h3>
                    <p className="text-xs text-gray-500 leading-relaxed font-sans">{point.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* General Competitive advisory alert block */}
          <div className="p-5 bg-amber-50 border border-amber-200/60 rounded-3xl flex items-start gap-4 transform transition hover:scale-[1.01]">
            <ShieldAlert className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="text-xs font-bold text-amber-900 block">General Exam Negative Marking Advisory</span>
              <p className="text-[11px] leading-relaxed text-amber-800 font-sans">
                अधिकांश प्रतियोगी परीक्षाओं में प्रत्येक गलत उत्तर के लिए **नकारात्मक अंकन (Negative Marking)** का प्रावधान होता है। अभ्यास के दौरान अनिश्चित विकल्पों पर तुक्का लगाने से बचें। परीक्षा जैसे वास्तविक माहौल को महसूस करें और संदिग्ध प्रश्नों को छोड़ना सीखें।
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Portal Objectives (5 Columns) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
            <div className="space-y-1">
              <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full uppercase tracking-wider">
                Our Vision & Mission
              </span>
              <h2 className="text-lg font-bold text-gray-900">
                Our Core Objectives
              </h2>
              <p className="text-xs text-gray-500 leading-relaxed font-sans">
                यह पोर्टल विशेष रूप से सभी गंभीर अभ्यर्थियों की स्व-अध्ययन शैली को मजबूत करने और उनका सही मार्गदर्शन करने हेतु तैयार किया गया है:
              </p>
            </div>

            <div className="space-y-6">
              {objectives.map((obj, index) => {
                const Icon = obj.icon;
                return (
                  <div key={index} className="flex gap-4 items-start group">
                    <div className={`p-3 rounded-xl border shrink-0 transition-transform duration-300 group-hover:scale-110 ${obj.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-xs font-bold text-gray-900">{obj.title}</h3>
                      <p className="text-xs text-gray-500 leading-relaxed font-sans">{obj.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick CTA to Personal Dashboard */}
          <div className="bg-gradient-to-tr from-emerald-600 via-teal-700 to-emerald-800 p-6 rounded-3xl text-white space-y-4 shadow-md hover:shadow-lg transition-all duration-300">
            <div className="space-y-1">
              <span className="text-[10px] bg-white/20 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">My Progress Insights</span>
              <h3 className="text-base font-extrabold tracking-tight">अपनी कमजोरियों का विश्लेषण करें</h3>
              <p className="text-xs text-emerald-50/90 leading-relaxed font-sans">
                जैसे-जैसे आप टेस्ट पूरा करेंगे, हमारा डेटा इंजन विषयवार आपकी त्रुटियों (mistakes) का विश्लेषण कर चार्ट्स और रिपोर्ट तैयार करेगा ताकि आप प्रत्येक अध्याय को अधिक प्रभावी ढंग से सुधार सकें।
              </p>
            </div>
            <button
              onClick={() => onNavigate('dashboard')}
              className="bg-white text-emerald-950 hover:bg-emerald-50 font-extrabold px-4 py-2.5 rounded-xl text-[11px] transition-all duration-200 inline-flex items-center gap-1 w-full justify-center shadow-inner"
            >
              Open Progress Dashboard <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
