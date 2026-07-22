import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, MessageCircle, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';

export default function ContactUs() {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', queryType: 'General Inquiry', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      alert("Please fill in the required fields (Name, Email, and Message).");
      return;
    }
    
    setSubmitted(true);
    try {
      // Send data to the backend API endpoint to persist it in db.json
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        throw new Error("Failed to send enquiry");
      }

      // Automatically construct mailto link and trigger it as requested by user
      const subject = encodeURIComponent(`${formData.queryType} - From ${formData.name}`);
      const body = encodeURIComponent(
        `Name: ${formData.name}\n` +
        `Email: ${formData.email}\n` +
        `Phone: ${formData.phone || 'N/A'}\n\n` +
        `Message:\n${formData.message}`
      );
      
      // Trigger client mailto window to send directly to testarena2026@gmail.com
      window.location.href = `mailto:testarena2026@gmail.com?subject=${subject}&body=${body}`;

      setFormData({ name: '', email: '', phone: '', queryType: 'General Inquiry', message: '' });
      alert("Your message has been registered! Your email client will now open to send this mail to testarena2026@gmail.com.");
    } catch (error) {
      console.error("Error submitting contact form:", error);
      alert("Could not process your request at this moment. However, you can email us directly at testarena2026@gmail.com");
    } finally {
      setSubmitted(false);
    }
  };

  const faqs = [
    {
      q: 'How many years of Previous Year Questions (PYQs) are available?',
      a: 'The portal currently hosts authentic solved papers from CGPSC State Services Preliminary Exams spanning the last 5-10 years. We update our question library regularly with official answer keys.',
    },
    {
      q: 'Are solutions and explanations available after completing a test?',
      a: 'Yes, after submitting any quiz, you will immediately see a comprehensive diagnostic score screen with detailed bilingual (Hindi/English) explanations for every question.',
    },
    {
      q: 'How are new questions uploaded to the database?',
      a: 'Administrators can bulk upload questions by formatting them into a standard Excel/CSV spreadsheet template and uploading it directly through the Admin Panel. A downloadable spreadsheet template is provided there.',
    },
    {
      q: 'Where can I find my incorrect answers for review?',
      a: 'All questions you answer incorrectly during any practice or exam session are automatically compiled and preserved in your "Dashboard" under the "Mistakes Review Panel".',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12 font-sans fade-in" id="contact-us-container">
      
      {/* Top Header section */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <span className="text-xs font-bold text-teal-700 bg-teal-50 px-3.5 py-1.5 rounded-full uppercase tracking-wider">
          Support & Contact
        </span>
        <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight text-gray-900 leading-tight">
          Get in Touch — We are Here to Help
        </h1>
        <p className="text-xs md:text-sm text-gray-500 leading-relaxed">
          For exam-related queries, technical support, or suggestions, feel free to contact us. Our dedicated team usually responds within 24 hours.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Contact Info & Channels Card */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-teal-600" /> Contact Info
            </h2>
            
            <div className="space-y-5">
              <div className="flex gap-4 items-start">
                <div className="p-3 bg-teal-50 text-teal-700 rounded-xl shrink-0">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-xs text-gray-400 block font-medium">Email Support</span>
                  <a href="mailto:testarena2026@gmail.com" className="text-xs font-bold text-teal-700 hover:underline">
                    testarena2026@gmail.com
                  </a>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="p-3 bg-teal-50 text-teal-700 rounded-xl shrink-0">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-xs text-gray-400 block font-medium">Location Address</span>
                  <span className="text-xs text-gray-700 font-bold block leading-relaxed">
                    Raigarh, Chhattisgarh
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Additional note info banner */}
          <div className="p-5 bg-teal-900 text-teal-100 rounded-3xl space-y-2 shadow-inner">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Note for Aspirants:</h3>
            <p className="text-[11px] leading-relaxed text-teal-200">
              This is an independent self-study preparation portal. For official application forms, registration, or regulatory updates, please visit the official CGPSC website at <a href="https://psc.cg.gov.in" target="_blank" rel="noreferrer" className="underline text-white font-bold">psc.cg.gov.in</a>.
            </p>
          </div>
        </div>

        {/* Dynamic Interactive Inquiry Form */}
        <div className="lg:col-span-7">
          <form 
            onSubmit={handleSubmit} 
            className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-4"
          >
            <h2 className="text-lg font-bold text-gray-900">Enquiry & Feedback Form</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-600 block">Full Name <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  required
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-800"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-600 block">Email Address <span className="text-red-500">*</span></label>
                <input 
                  type="email" 
                  required
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-800"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-600 block">Phone Number</label>
                <input 
                  type="tel" 
                  placeholder="Enter 10-digit number"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-800"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-600 block">Inquiry Category</label>
                <select 
                  value={formData.queryType}
                  onChange={(e) => setFormData({ ...formData, queryType: e.target.value })}
                  className="w-full px-3 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-800"
                >
                  <option value="General Inquiry">General Inquiry</option>
                  <option value="Technical Issue">Technical Issue</option>
                  <option value="Question Corrections">Question Corrections</option>
                  <option value="Sponsorship/Mentorship">Mentorship & Feedback</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-600 block">Your Message <span className="text-red-500">*</span></label>
              <textarea 
                rows={4}
                required
                placeholder="Write your message here..."
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="w-full px-3 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-800"
              />
            </div>

            <button 
              type="submit" 
              disabled={submitted}
              className="w-full bg-teal-800 hover:bg-teal-900 text-white font-bold py-3 rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-sm"
            >
              {submitted ? "Sending message..." : "Send Message"} <Send className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>

      </div>

      {/* Accordion FAQ Area (Highly Professional Element) */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <HelpCircle className="h-5 w-5 text-teal-600" /> Frequently Asked Questions
        </h2>

        <div className="space-y-3">
          {faqs.map((faq, index) => {
            const isOpen = activeFaq === index;
            return (
              <div 
                key={index}
                className="border border-gray-100 rounded-xl overflow-hidden transition"
              >
                <button
                  onClick={() => setActiveFaq(isOpen ? null : index)}
                  className="w-full px-4 py-3.5 bg-gray-50/50 hover:bg-gray-50 flex justify-between items-center text-left transition"
                >
                  <span className="text-xs font-bold text-gray-800">{faq.q}</span>
                  {isOpen ? <ChevronUp className="h-4 w-4 text-gray-500" /> : <ChevronDown className="h-4 w-4 text-gray-500" />}
                </button>
                {isOpen && (
                  <div className="p-4 border-t border-gray-50 bg-white text-xs text-gray-600 leading-relaxed">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
