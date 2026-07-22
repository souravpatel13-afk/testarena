import React from 'react';
import { Shield, FileText, AlertTriangle, ArrowLeft } from 'lucide-react';

interface LegalPageProps {
  onBackToHome: () => void;
}

export function PrivacyPolicy({ onBackToHome }: LegalPageProps) {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-in fade-in duration-200">
      <button
        onClick={onBackToHome}
        className="mb-6 flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 px-4 py-2 rounded-xl border border-slate-200/80 shadow-sm transition"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Home
      </button>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        {/* Header Visual banner */}
        <div className="bg-gradient-to-tr from-slate-900 to-slate-800 p-8 text-white relative">
          <div className="absolute top-6 right-6 p-3 bg-white/10 rounded-2xl backdrop-blur-sm text-yellow-400">
            <Shield className="h-8 w-8" />
          </div>
          <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full font-bold uppercase tracking-wider font-sans">
            Legal & Security
          </span>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight mt-4">Privacy Policy</h1>
          <p className="text-xs text-slate-300 mt-1.5 font-sans">Effective Date: July 21, 2026 | Last Updated: July 2026</p>
        </div>

        {/* Content */}
        <div className="p-6 md:p-10 space-y-8 text-slate-700 text-xs md:text-sm leading-relaxed font-sans">
          <section className="space-y-3">
            <h2 className="text-base font-extrabold text-slate-900 border-b pb-1.5 border-slate-100 flex items-center gap-2">
              <span className="bg-emerald-100 text-emerald-800 w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold">1</span>
              Introduction (परिचय)
            </h2>
            <p>
              Welcome to <strong>TestArena</strong> (accessible at testarena.co.in). We are highly committed to protecting your personal information and your privacy. This Privacy Policy documents the types of information we collect, how we use it, and the security measures applied to safeguard your identity while preparing for Chhattisgarh State competitive examinations like CGPSC and CG Vyapam.
            </p>
            <p className="text-slate-500 italic">
              TestArena (testarena.co.in) में आपका स्वागत है। हम आपकी व्यक्तिगत जानकारी और गोपनीयता की रक्षा करने के लिए पूरी तरह प्रतिबद्ध हैं। यह गोपनीयता नीति हमारे द्वारा एकत्र की जाने वाली जानकारी के प्रकार, उसके उपयोग और छत्तीसगढ़ लोक सेवा आयोग (CGPSC) एवं व्यास परीक्षा (CG Vyapam) जैसी परीक्षाओं की तैयारी के दौरान सुरक्षा उपायों का विवरण देती है।
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-extrabold text-slate-900 border-b pb-1.5 border-slate-100 flex items-center gap-2">
              <span className="bg-emerald-100 text-emerald-800 w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold">2</span>
              Information We Collect (एकत्रित की जाने वाली जानकारी)
            </h2>
            <p>
              We only collect information that is strictly necessary to provide and improve our mock examination services:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600">
              <li><strong>Account Credentials:</strong> Basic information such as your name, email address (e.g., testarena2026@gmail.com), phone number, and state of residence.</li>
              <li><strong>Practice Metrics:</strong> Scorecards, question response times, streak details, subject test histories, and attempt counts.</li>
              <li><strong>Technical Data:</strong> IP address, browser type, device information, and interaction history to prevent automated scraping or abuse of our authentic questions database.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-extrabold text-slate-900 border-b pb-1.5 border-slate-100 flex items-center gap-2">
              <span className="bg-emerald-100 text-emerald-800 w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold">3</span>
              How We Use Your Information (जानकारी का उपयोग)
            </h2>
            <p>
              Your data is utilized for the following purposes:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600">
              <li>To provide comprehensive performance tracking, weak area analysis, and custom dashboard metrics.</li>
              <li>To maintain secure leaderboard statistics and ensure honest practice across state competitors.</li>
              <li>To handle your support requests, inquiries, or feedback submitted through our feedback portal, routing queries directly to <strong>testarena2026@gmail.com</strong>.</li>
              <li>To prevent unauthorized duplication, automated crawling, or unauthorized commercialization of our bilingual question banks.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-extrabold text-slate-900 border-b pb-1.5 border-slate-100 flex items-center gap-2">
              <span className="bg-emerald-100 text-emerald-800 w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold">4</span>
              Data Protection & Retention (डेटा सुरक्षा एवं संरक्षण)
            </h2>
            <p>
              We employ robust administrative and digital safeguards to prevent unauthorized access, modification, or exposure of your mock records. We do not sell, lease, or distribute your email addresses or preparation metrics to third-party commercial marketing entities. Data is retained only as long as your account remains active, allowing you to access historic performance analytics over multiple competitive cycles.
            </p>
          </section>

          <section className="space-y-3 text-slate-500 text-xs">
            <p className="border-t pt-4 border-slate-100">
              If you have any questions or require clarification regarding our data protection policies, please contact us directly at <strong>testarena2026@gmail.com</strong>. We value your trust.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

export function TermsConditions({ onBackToHome }: LegalPageProps) {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-in fade-in duration-200">
      <button
        onClick={onBackToHome}
        className="mb-6 flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 px-4 py-2 rounded-xl border border-slate-200/80 shadow-sm transition"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Home
      </button>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        {/* Header Visual banner */}
        <div className="bg-gradient-to-tr from-slate-900 to-slate-800 p-8 text-white relative">
          <div className="absolute top-6 right-6 p-3 bg-white/10 rounded-2xl backdrop-blur-sm text-yellow-400">
            <FileText className="h-8 w-8" />
          </div>
          <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full font-bold uppercase tracking-wider font-sans">
            User Agreement
          </span>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight mt-4">Terms & Conditions</h1>
          <p className="text-xs text-slate-300 mt-1.5 font-sans">Effective Date: July 21, 2026 | Last Updated: July 2026</p>
        </div>

        {/* Content */}
        <div className="p-6 md:p-10 space-y-8 text-slate-700 text-xs md:text-sm leading-relaxed font-sans">
          <section className="space-y-3">
            <h2 className="text-base font-extrabold text-slate-900 border-b pb-1.5 border-slate-100 flex items-center gap-2">
              <span className="bg-emerald-100 text-emerald-800 w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold">1</span>
              Acceptance of Terms (नियमों की स्वीकृति)
            </h2>
            <p>
              By accessing, browsing, registering, or practicing on <strong>TestArena</strong> (testarena.co.in), you acknowledge that you have read, understood, and agreed to be legally bound by these Terms and Conditions. If you do not agree with any part of these terms, you must immediately cease using the platform.
            </p>
            <p className="text-slate-500 italic">
              TestArena (testarena.co.in) का उपयोग, पंजीकरण या अभ्यास करके, आप स्वीकार करते हैं कि आपने इन नियमों और शर्तों को पढ़ और समझ लिया है तथा आप इनसे कानूनी रूप से बाध्य होने के लिए सहमत हैं। यदि आप इन नियमों से असहमत हैं, तो कृपया पोर्टल का उपयोग तुरंत बंद कर दें।
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-extrabold text-slate-900 border-b pb-1.5 border-slate-100 flex items-center gap-2">
              <span className="bg-emerald-100 text-emerald-800 w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold">2</span>
              Educational Use & Content Ownership (शैक्षणिक उपयोग एवं बौद्धिक संपदा)
            </h2>
            <p>
              All materials hosted on TestArena—including database question pools, verified Hindi solutions, bilingual explanations, scoring logic, custom graphs, and UI designs—are the exclusive intellectual property of TestArena.
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600">
              <li>Users are granted a non-exclusive, non-transferable, revocable license to access and practice questions for personal, non-commercial educational purposes only.</li>
              <li>You are strictly prohibited from copying, compiling, commercializing, republishing, or redistributing our curated database, compiled answer keys, or platform assets without explicit written consent.</li>
              <li>Unauthorized scraping, API reverse-engineering, or heavy automated downloads will result in permanent account termination and legal action under intellectual property laws.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-extrabold text-slate-900 border-b pb-1.5 border-slate-100 flex items-center gap-2">
              <span className="bg-emerald-100 text-emerald-800 w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold">3</span>
              Account Accountability & Code of Conduct (खाता उत्तरदायित्व और आचरण)
            </h2>
            <p>
              To maintain fair competition, users must adhere to ethical preparation rules:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600">
              <li>You are responsible for safeguarding your credentials and maintaining the confidentiality of your practice account.</li>
              <li>You agree to provide true, current, and accurate information when registering or submitting feedback to <strong>testarena2026@gmail.com</strong>.</li>
              <li>Cheating, exploit exploitation, or using scripts/crawlers to skew practice rankings, leaderboard stats, or score timelines is strictly banned.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-extrabold text-slate-900 border-b pb-1.5 border-slate-100 flex items-center gap-2">
              <span className="bg-emerald-100 text-emerald-800 w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold">4</span>
              Modifications of Services (सेवाओं में संशोधन)
            </h2>
            <p>
              TestArena reserves the right to modify, suspend, update, or discontinue any feature, question set, subject test category, or previous years papers selection at any time without prior notice. This includes adapting our state exam focus parameters as official syllabi shift over time.
            </p>
          </section>

          <section className="space-y-3 text-slate-500 text-xs">
            <p className="border-t pt-4 border-slate-100">
              For any licensing issues, partnership opportunities, or administrative queries, please connect with us at <strong>testarena2026@gmail.com</strong>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

export function Disclaimer({ onBackToHome }: LegalPageProps) {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-in fade-in duration-200">
      <button
        onClick={onBackToHome}
        className="mb-6 flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 px-4 py-2 rounded-xl border border-slate-200/80 shadow-sm transition"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Home
      </button>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        {/* Header Visual banner */}
        <div className="bg-gradient-to-tr from-slate-900 to-slate-800 p-8 text-white relative">
          <div className="absolute top-6 right-6 p-3 bg-white/10 rounded-2xl backdrop-blur-sm text-yellow-400">
            <AlertTriangle className="h-8 w-8" />
          </div>
          <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full font-bold uppercase tracking-wider font-sans">
            Important Information
          </span>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight mt-4">Disclaimer</h1>
          <p className="text-xs text-slate-300 mt-1.5 font-sans">Effective Date: July 21, 2026 | Last Updated: July 2026</p>
        </div>

        {/* Content */}
        <div className="p-6 md:p-10 space-y-8 text-slate-700 text-xs md:text-sm leading-relaxed font-sans">
          <section className="space-y-3">
            <h2 className="text-base font-extrabold text-slate-900 border-b pb-1.5 border-slate-100 flex items-center gap-2">
              <span className="bg-emerald-100 text-emerald-800 w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold">1</span>
              Non-Affiliation with Government Bodies (सरकारी निकायों से असंबद्धता)
            </h2>
            <p>
              <strong>TestArena (testarena.co.in) is an independent, private educational and self-practice portal.</strong> It has no official affiliation, authorization, endorsement, or direct association with the Chhattisgarh Public Service Commission (CGPSC), CG Vyapam, or any government department, administrative agency, or ministry of the Chhattisgarh State Government or Government of India.
            </p>
            <p className="text-slate-500 italic">
              TestArena (testarena.co.in) एक स्वतंत्र, निजी शैक्षणिक और स्व-अभ्यास पोर्टल है। इसका छत्तीसगढ़ लोक सेवा आयोग (CGPSC), छत्तीसगढ़ व्यावसायिक परीक्षा मंडल (CG Vyapam), या छत्तीसगढ़ राज्य सरकार अथवा भारत सरकार के किसी भी सरकारी विभाग, प्रशासनिक एजेंसी या मंत्रालय के साथ कोई आधिकारिक संबंध, प्राधिकरण, समर्थन या सीधा जुड़ाव नहीं है।
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-extrabold text-slate-900 border-b pb-1.5 border-slate-100 flex items-center gap-2">
              <span className="bg-emerald-100 text-emerald-800 w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold">2</span>
              Accuracy of Questions & Model Answers (प्रश्नों और उत्तरों की सटीकता)
            </h2>
            <p>
              While our administrative team makes every effort to ensure that the Previous Years Questions (PYQs), answers, explanation sheets, and current affairs topics listed on our portal are fully verified, authentic, and accurately transcribed from official archives:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600">
              <li>Slight transcription or translation discrepancies may occasionally occur. If any error is spotted, users should notify us at <strong>testarena2026@gmail.com</strong> for swift corrections.</li>
              <li>Official question lists, final keys, and official answers issued by CGPSC or CG Vyapam during respective examination cycles remain the sole legally absolute standard of truth.</li>
              <li>TestArena shall not be held liable for any real-world competitive score deficits, selection decisions, or ranking deviations based on practice analytics generated within this training software.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-extrabold text-slate-900 border-b pb-1.5 border-slate-100 flex items-center gap-2">
              <span className="bg-emerald-100 text-emerald-800 w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold">3</span>
              Practice Mock Nature of Platform (अभ्यास पोर्टल की प्रकृति)
            </h2>
            <p>
              All performance ratings, percentage scores, weak-subject breakdowns, and streak trackers provided on TestArena are mock training indicators intended solely for guidance and improvement. They do not guarantee identical performance, selection success, or guaranteed administrative placements in real-world CGPSC state exams.
            </p>
          </section>

          <section className="space-y-3 text-slate-500 text-xs">
            <p className="border-t pt-4 border-slate-100">
              If you require any clarification regarding this disclaimer or would like to submit formal inquiries, please drop us an email at <strong>testarena2026@gmail.com</strong>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
