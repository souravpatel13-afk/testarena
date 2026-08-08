/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Question {
  id: string;
  text_hi: string; // Hindi text
  text_en?: string; // English text (optional)
  options_hi: string[]; // Hindi options
  options_en?: string[]; // English options (optional)
  correctAnswer: number; // 0-indexed index of correct option
  subject: string; // e.g., "Chhattisgarh General Knowledge", "Indian Constitution"
  topic: string; // e.g., "Tribes of CG", "Panchayati Raj"
  exam?: string; // e.g., "CGPSC Prelims 2023" (optional, empty means subject practice)
  year?: number; // e.g., 2023 (optional)
  explanation_hi?: string; // Hindi explanation
  explanation_en?: string; // English explanation
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  type: 'pyq' | 'subject';
  subject?: string;
  topic?: string;
  exam?: string;
  durationMinutes: number;
  questionIds: string[];
}

export interface Attempt {
  id: string;
  quizId: string;
  quizTitle: string;
  quizType: 'pyq' | 'subject';
  userId: string;
  timestamp: string;
  score: number; // standard score (e.g., 2 marks for correct, -0.66 for incorrect for CGPSC)
  totalQuestions: number;
  correctCount: number;
  wrongCount: number;
  skippedCount: number;
  answers: Record<string, number>; // questionId -> selectedOptionIndex (-1 for skipped)
  durationSeconds: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
}

// Stats structures for Dashboard analysis
export interface SubjectStats {
  subject: string;
  totalSolved: number;
  correctCount: number;
  accuracy: number;
  wrongCount: number;
  weakTopics: string[];
}

export interface TopicStats {
  topic: string;
  subject: string;
  totalSolved: number;
  correctCount: number;
  accuracy: number;
  wrongCount: number;
}

export interface MistakeDetail {
  questionId: string;
  questionText: string;
  questionTextEn?: string;
  selectedOption: string;
  correctOption: string;
  explanation?: string;
  explanationEn?: string;
  subject: string;
  topic: string;
  timestamp: string;
}

export interface CurrentAffairsItem {
  id: string;
  month: string; // e.g., "July 2026", "June 2026"
  title: string;
  category: string; // e.g., "National", "International", "State (CG)", "Sports", "Appointments"
  content_hi: string; // Hindi article details
  content_en?: string; // English article details (optional)
  createdAt: string;
}

export interface ExamPatternStage {
  stage: string; // e.g., "प्रारंभिक परीक्षा (Paper 1 & 2)"
  duration: string; // e.g., "2 घंटे प्रति प्रश्न पत्र"
  totalQuestions: string; // e.g., "100 प्रश्न"
  totalMarks: string; // e.g., "200 अंक"
  negativeMarking: string; // e.g., "1/3 माइनस मार्किंग (-0.66 अंक)"
}

export interface ExamSyllabusPaper {
  paperName: string; // e.g., "सामान्य अध्ययन (General Studies)"
  topics: string[]; // List of topics covered
}

export interface ExamInfo {
  id: string;
  examName: string; // e.g., "CGPSC Prelims"
  shortTagline: string; // e.g., "छत्तीसगढ़ लोक सेवा आयोग राज्य सेवा परीक्षा"
  category: string; // e.g., "PSC Exam", "Vyapam", "Teaching Exam"
  overview: string; // Overview description in Hindi
  eligibility: string; // Educational qualification & age limit
  selectionProcess: string; // Selection stages
  patterns: ExamPatternStage[];
  syllabus: ExamSyllabusPaper[];
  pdfUrl?: string; // Direct link to Syllabus PDF
  richContent?: string; // Full MS Word style HTML/Markdown content with tables, links, PDFs, etc.
  updatedAt: string;
}

export interface DailyPracticeQuestion {
  id: string;
  questionHtml: string; // HTML code or formatted text for question
  optionsHtml: string[]; // Array of 4 options HTML strings
  correctAnswer: number; // 0, 1, 2, 3
  explanationHtml?: string; // HTML code or detailed explanation
  subjectTag?: string; // e.g. "छत्तीसगढ़ इतिहास", "करंट अफेयर्स"
}

export interface DailyPracticeCategory {
  id: string;
  name: string; // e.g. "सहायक शिक्षक", "शिक्षक कृषि", "शिक्षक हिंदी"
  subLabel?: string; // e.g. "Assistant Teacher Exam"
  description?: string; // e.g. "सहायक शिक्षक भर्ती परीक्षा हेतु अभ्यास"
  badgeColor?: string; // e.g. "bg-amber-100 text-amber-900 border-amber-300"
  iconName?: string; // e.g. "UserCheck", "Sprout", "BookMarked", "Languages", "Calculator", "Atom", "Briefcase", "GraduationCap"
}

export interface DailyPracticeSet {
  id: string;
  date: string; // YYYY-MM-DD e.g. "2026-07-29"
  title: string; // e.g. "डेली प्रैक्टिस सेट - 29 जुलाई 2026"
  description?: string;
  subject: string; // e.g. "छत्तीसगढ़ सामान्य ज्ञान एवं समसामयिकी"
  category?: string; // e.g. "सहायक शिक्षक", "शिक्षक कृषि", "शिक्षक हिंदी", "शिक्षक अंग्रेजी", "शिक्षक गणित", "शिक्षक विज्ञान", "अन्य पद"
  targetExam?: string; // e.g. "CGPSC / व्यापमं / पुलिस भर्ती"
  durationMinutes: number; // e.g. 20
  rawHtmlContent?: string; // Full raw HTML block if uploaded/pasted directly
  questions: DailyPracticeQuestion[];
  createdAt: string;
  updatedAt: string;
}

