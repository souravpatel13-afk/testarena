import React from 'react';
import { Award, BookOpen, Users, Compass, CheckCircle, ShieldCheck } from 'lucide-react';

export default function AboutUs() {
  const stats = [
    { label: 'Active Learners', value: '15,000+', icon: Users, color: 'text-teal-600 bg-teal-50' },
    { label: 'Questions Solved', value: '2.5 Lakh+', icon: BookOpen, color: 'text-amber-600 bg-amber-50' },
    { label: 'Selection Rate', value: '18%', icon: Award, color: 'text-emerald-600 bg-emerald-50' },
    { label: 'Verified Practice MCQs', value: '5,000+', icon: ShieldCheck, color: 'text-blue-600 bg-blue-50' },
  ];

  const features = [
    {
      title: 'Previous Years Questions (PYQs) Archive',
      desc: 'We compile over 10 years of authentic question papers from CGPSC State Services, CG Vyapam, and other Chhattisgarh State Competitive Exams, allowing you to practice anytime, anywhere with complete confidence.',
    },
    {
      title: 'पूर्णतः हिंदी माध्यम समर्थन (Hindi Medium Support)',
      desc: 'सभी प्रश्न, विस्तृत समाधान और समसामयिकी (Current Affairs) पूर्ण रूप से शुद्ध एवं प्रामाणिक हिंदी भाषा में उपलब्ध कराए गए हैं ताकि आपकी तैयारी निर्बाध रहे।',
    },
    {
      title: 'Precision Performance Analytics',
      desc: 'Pinpoint your strengths and identify weak topics/subjects using our live analytical tracker. Know exactly where to focus to optimize your score.',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12 font-sans fade-in" id="about-us-container">
      
      {/* Hero Banner Section */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-teal-800 via-teal-900 to-emerald-950 text-white shadow-xl">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
        <div className="relative p-8 md:p-14 max-w-3xl space-y-4">
          <span className="text-xs font-bold uppercase tracking-widest text-teal-300 bg-teal-950/50 px-3.5 py-1.5 rounded-full border border-teal-800">
            Our Vision
          </span>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-tight">
            Dedicated Platform for CGPSC & Chhattisgarh State Competitive Exams
          </h1>
          <p className="text-sm md:text-base text-teal-100 leading-relaxed max-w-xl">
            Our prep website is committed to providing outstanding mock materials, verified answer explanations, and dynamic study trackers to every serious candidate aiming to crack state competitive exams.
          </p>
        </div>
      </div>

      {/* Numerical Highlights (Matching Pinterest mockup style) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div 
              key={idx} 
              className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition duration-200"
            >
              <div className={`p-4 rounded-xl ${stat.color} shrink-0`}>
                <Icon className="h-6 w-6" />
              </div>
              <div>
                <span className="text-2xl md:text-3xl font-extrabold text-gray-900 block tracking-tight">{stat.value}</span>
                <span className="text-xs text-gray-500 font-medium">{stat.label}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Core Values Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
        
         {/* Mission Content Column */}
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-teal-800">
              <Compass className="h-5 w-5 text-teal-600" />
              <h2 className="text-xl font-bold tracking-tight">Our Mission & Core Values</h2>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              We aim to bridge the gap between rural and urban learners. Moving beyond high-cost physical coaching academies, we empower self-studying aspirants with high-quality, verified, and accessible diagnostic tools.
            </p>
          </div>

          <div className="space-y-3.5">
            <div className="flex items-start gap-2.5">
              <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
              <span className="text-xs text-gray-700 font-medium">100% Authentic Answer Keys & Verified Explanations.</span>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
              <span className="text-xs text-gray-700 font-medium">Deep focused coverage of Chhattisgarh General Knowledge (CG GK).</span>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
              <span className="text-xs text-gray-700 font-medium">Full Progress Analytics featuring detailed Mistake Logs & Trackers.</span>
            </div>
          </div>
        </div>

        {/* Features list Column */}
        <div className="space-y-4 flex flex-col justify-between">
          {features.map((feat, idx) => (
            <div 
              key={idx} 
              className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:border-teal-100 transition flex gap-4 items-start"
            >
              <span className="bg-teal-50 text-teal-800 text-xs font-black h-8 w-8 rounded-full flex items-center justify-center shrink-0">
                0{idx + 1}
              </span>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-gray-900">{feat.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{feat.desc}</p>
              </div>
            </div>
          ))}
        </div>

      </div>

    </div>
  );
}
