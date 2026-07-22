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
  Users
} from 'lucide-react';

interface HomeProps {
  onNavigate: (tab: 'dashboard' | 'pyqs' | 'subjects' | 'current-affairs' | 'about' | 'contact' | 'admin') => void;
  questionsCount: number;
  quizzesCount: number;
}

export default function Home({ onNavigate, questionsCount, quizzesCount }: HomeProps) {
  const successPoints = [
    {
      title: 'Master Core Concepts & Syllabus (पाठ्यक्रम पर मजबूत पकड़)',
      desc: 'सभी प्रतियोगी परीक्षाओं में सफलता की बुनियाद आपके वैचारिक ज्ञान (conceptual clarity) पर टिकी होती है। इतिहास, भूगोल, राजव्यवस्था और समसामयिकी विषयों का गहन अध्ययन करें और प्रत्येक अध्याय के नोट्स बनाएं।',
    },
    {
      title: 'Analyze Previous Years Questions - PYQs (विगत वर्षों के प्रश्न)',
      desc: 'पिछले 10 वर्षों के प्रश्न पत्रों का नियमित अभ्यास सबसे महत्वपूर्ण कदम है। इससे परीक्षा के पैटर्न, प्रश्नों के स्तर (difficulty level) और बार-बार पूछे जाने वाले विषयों (weightage) का सटीक अनुमान लगता है।',
    },
    {
      title: 'Regular Self-Evaluation & Mock Tests (समयबद्ध मॉक टेस्ट)',
      desc: 'केवल पढ़ना काफी नहीं है। परीक्षा हॉल जैसी स्थिति में, निर्धारित समय सीमा के भीतर प्रश्नों को हल करने का अभ्यास करें। यह आपकी गति (speed), सटीकता (accuracy) और निर्णय क्षमता को बढ़ाता है।',
    },
    {
      title: 'Active Recall & Mistakes Review Panel (गलतियों से सीखें)',
      desc: 'जब भी कोई प्रश्न गलत हो, उसके विस्तृत हिंदी समाधान (detailed Hindi explanation) को ध्यान से पढ़ें। हमारे Mistakes Tracker का उपयोग करें ताकि जिन प्रश्नों में आप पहले असफल रहे हैं, उन्हें दोबारा कभी गलत न करें।',
    },
    {
      title: 'Conceptual Mastery (संकल्पनात्मक दक्षता)',
      desc: 'प्रतियोगी परीक्षाओं में अक्सर संकल्पनाओं को स्पष्ट रूप से समझना महत्वपूर्ण होता है। हमारी टेस्ट सीरीज में प्रत्येक प्रश्न का हल अत्यंत स्पष्ट हिंदी भाषा में उपलब्ध कराया गया है ताकि आपकी समझ अटूट रहे।',
    }
  ];

  const objectives = [
    {
      title: 'Accessible Quality Prep (सुलभ और गुणवत्तापूर्ण तैयारी)',
      desc: 'सभी ग्रामीण और शहरी क्षेत्रों के स्व-अध्ययन करने वाले छात्रों तक शून्य आर्थिक बाधा के साथ बेहतरीन गुणवत्ता वाले प्रैक्टिस सेट और विस्तृत विश्लेषणात्मक परिणाम प्रदान करना।',
      icon: Compass,
      color: 'text-emerald-700 bg-emerald-50 border-emerald-100',
    },
    {
      title: '100% Verified Answer Explanations (सत्यापित उत्तर व्याख्या)',
      desc: 'सभी प्रश्नों को मानक पुस्तकों और आधिकारिक उत्तर कुंजियों के आधार पर तैयार किए गए अत्यंत स्पष्ट और त्रुटिहीन हिंदी स्पष्टीकरणों के साथ प्रस्तुत करना।',
      icon: Target,
      color: 'text-amber-700 bg-amber-50 border-amber-100',
    },
    {
      title: 'Data-Driven Smart Advice (डेटा-संचालित स्मार्ट मार्गदर्शक)',
      desc: 'आपके अभ्यास परिणामों का वास्तविक समय में मूल्यांकन कर आपके कमजोर विषयों को रेखांकित करना, ताकि आप अपने समय का सही दिशा में सदुपयोग कर सकें।',
      icon: TrendingUp,
      color: 'text-teal-700 bg-teal-50 border-teal-100',
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-12 font-sans fade-in" id="home-view-container">
      
      {/* Premium Animated Landing Hero with rich dark-to-emerald gradient */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-emerald-800 via-emerald-950 to-slate-950 text-white shadow-xl transform transition-transform duration-500 hover:scale-[1.005]">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:20px_20px]"></div>
        
        <div className="relative p-8 md:p-14 lg:p-18 max-w-4xl space-y-6">
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-300 bg-emerald-900/50 px-4 py-1.5 rounded-full border border-emerald-700/80 inline-block animate-pulse">
            Competitive Exams Preparation & Practice Portal
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-black tracking-tight leading-none">
            Your Path to Success in Exams, <br />Now Made Crystal Clear.
          </h1>
          <p className="text-sm md:text-base text-emerald-100/90 leading-relaxed max-w-2xl font-light">
            नवीनतम परीक्षा पैटर्न के अनुरूप प्रश्नों, विगत वर्ष के हल प्रश्न पत्रों (PYQs), और विस्तृत समसामयिकी (Current Affairs) के साथ अपनी सरकारी नौकरी की तैयारी को एक नया आयाम दें।
          </p>

          <div className="flex flex-wrap gap-4 pt-3">
            <button
              onClick={() => onNavigate('pyqs')}
              className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold px-6 py-3 rounded-xl text-xs transition-all duration-200 flex items-center gap-1.5 shadow-md shadow-emerald-950/20 transform hover:-translate-y-0.5"
            >
              Practice PYQs <Play className="h-3 w-3 fill-current" />
            </button>
            
            <button
              onClick={() => onNavigate('subjects')}
              className="bg-white/10 hover:bg-white/20 text-white font-extrabold px-6 py-3 rounded-xl text-xs transition-all border border-white/15 flex items-center gap-1 transform hover:-translate-y-0.5"
            >
              Start Subject Tests <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Stats Block (Pinterest style counter badges) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl">
              <BookOpen className="h-6 w-6" />
            </div>
            <div>
              <span className="text-2xl font-extrabold text-gray-900 block tracking-tight">{questionsCount > 0 ? questionsCount : '2,000+'}</span>
              <span className="text-[11px] text-gray-400 font-bold uppercase">Verified Practice MCQs</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-50 text-amber-700 rounded-xl">
              <Award className="h-6 w-6" />
            </div>
            <div>
              <span className="text-2xl font-extrabold text-gray-900 block tracking-tight">{quizzesCount > 0 ? quizzesCount : '30+'}</span>
              <span className="text-[11px] text-gray-400 font-bold uppercase">Mock Test Series Available</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-teal-50 text-teal-700 rounded-xl">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <span className="text-2xl font-extrabold text-gray-900 block tracking-tight">25,000+</span>
              <span className="text-[11px] text-gray-400 font-bold uppercase">Active Aspirants Nationwide</span>
            </div>
          </div>
        </div>
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
