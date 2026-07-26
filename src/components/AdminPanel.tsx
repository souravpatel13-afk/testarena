import React, { useState, useEffect } from 'react';
import { 
  PlusCircle, 
  FileSpreadsheet, 
  Download, 
  Check, 
  AlertCircle, 
  HelpCircle, 
  Database,
  Search,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Trash2,
  Lock,
  LogOut,
  RefreshCw,
  ExternalLink,
  Save,
  Trash,
  Newspaper,
  Edit,
  GraduationCap,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  Table,
  Link,
  FileCode,
  Eye,
  Edit3,
  Sparkles,
  Copy,
  FileText,
  Layout,
  CheckCircle2,
  UploadCloud,
  ArrowUp,
  ArrowDown,
  Star
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Question, ExamInfo } from '../types';
import { parseCorrectAnswer } from '../utils/quizHelpers';
import { auth, googleSignIn, logout, getAccessToken, setAccessToken } from '../lib/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';

interface AdminPanelProps {
  questions: Question[];
  onRefreshQuestions: () => void;
  exams?: ExamInfo[];
  onRefreshExams?: () => void;
}

const cleanExamValue = (val: any): string | undefined => {
  if (val === undefined || val === null) return undefined;
  const str = String(val).trim();
  const lower = str.toLowerCase();
  if (
    lower === '' || 
    lower === 'undefined' || 
    lower === 'null' || 
    lower === 'none' || 
    lower === 'nan' || 
    lower === 'n/a'
  ) {
    return undefined;
  }
  return str;
};

const cleanYearValue = (val: any): number | undefined => {
  if (val === undefined || val === null || String(val).trim() === '') return undefined;
  const parsed = parseInt(String(val), 10);
  if (isNaN(parsed) || parsed <= 1900 || parsed > 2100) return undefined;
  return parsed;
};

const isPyq = (q: Question): boolean => {
  return !!(q.exam && q.exam.trim() !== '');
};

export default function AdminPanel({ questions, onRefreshQuestions, exams, onRefreshExams }: AdminPanelProps) {
  // Auth state
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Sheet configuration state for three separate sheets
  const [spreadsheetIdPyq, setSpreadsheetIdPyq] = useState<string>('');
  const [spreadsheetIdSubject, setSpreadsheetIdSubject] = useState<string>('');
  const [spreadsheetIdCA, setSpreadsheetIdCA] = useState<string>('');

  const [inputPyq, setInputPyq] = useState<string>('');
  const [inputSubject, setInputSubject] = useState<string>('');
  const [inputCA, setInputCA] = useState<string>('');

  const [sheetSyncing, setSheetSyncing] = useState<boolean>(false);
  const [sheetError, setSheetError] = useState<string | null>(null);
  const [sheetSuccess, setSheetSuccess] = useState<string | null>(null);

  // New state for Google Sheet Pull & Preview
  const [sheetPreviewData, setSheetPreviewData] = useState<any[]>([]);
  const [sheetPreviewType, setSheetPreviewType] = useState<'pyq' | 'subject' | 'currentAffairs'>('pyq');
  const [sheetPullingType, setSheetPullingType] = useState<'pyq' | 'subject' | 'currentAffairs' | null>(null);

  // Navigation tabs for Admin
  const [activeSubTab, setActiveSubTab] = useState<'sheets' | 'excel' | 'manual' | 'list' | 'currentAffairs' | 'aboutExam'>('sheets');
  
  // Search and view states for list
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);

  // Current Affairs States
  const [currentAffairs, setCurrentAffairs] = useState<any[]>([]);
  const [caLoading, setCaLoading] = useState(false);
  const [caMonth, setCaMonth] = useState('July 2026');
  const [caTitle, setCaTitle] = useState('');
  const [caCategory, setCaCategory] = useState('General');
  const [caContentHi, setCaContentHi] = useState('');
  const [caContentEn, setCaContentEn] = useState('');
  const [caSuccessMsg, setCaSuccessMsg] = useState<string | null>(null);
  const [caEditingId, setCaEditingId] = useState<string | null>(null);

  // Exam Info (About Exam) States
  const [examsList, setExamsList] = useState<ExamInfo[]>([]);
  const [examLoading, setExamLoading] = useState(false);
  const [examEditingId, setExamEditingId] = useState<string | null>(null);
  
  const [examName, setExamName] = useState('');
  const [examCategory, setExamCategory] = useState('PSC Exams');
  const [examRichContent, setExamRichContent] = useState('');
  const [editorTab, setEditorTab] = useState<'visual' | 'code' | 'preview'>('visual');

  // Manual Form States
  const [textHi, setTextHi] = useState('');
  const [textEn, setTextEn] = useState('');
  const [optionsHi, setOptionsHi] = useState<string[]>(['', '', '', '']);
  const [optionsEn, setOptionsEn] = useState<string[]>(['', '', '', '']);
  const [correctAnswer, setCorrectAnswer] = useState<number>(0);
  const [subject, setSubject] = useState('Chhattisgarh General Knowledge');
  const [topic, setTopic] = useState('');
  const [exam, setExam] = useState('');
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [explanationHi, setExplanationHi] = useState('');
  const [explanationEn, setExplanationEn] = useState('');

  const [submittingManual, setSubmittingManual] = useState(false);
  const [manualSuccess, setManualSuccess] = useState(false);

  // Excel Upload States
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState<string | null>(null);
  const [uploadErrorMsg, setUploadErrorMsg] = useState<string | null>(null);
  const [parsedExcelQuestions, setParsedExcelQuestions] = useState<any[]>([]);

  // Preset Subjects
  const subjectsPreset = [
    "Chhattisgarh General Knowledge",
    "Indian Polity & Constitution",
    "Indian History",
    "Geography of India & CG",
    "Indian Economy",
    "General Science & Tech",
    "Language (Hindi & Chhattisgarhi)",
    "General Aptitude (CSAT)"
  ];

  // Sync with Firebase Auth state on mount
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const storedToken = getAccessToken();
        setToken(storedToken);
      } else {
        setToken(null);
      }
      setAuthLoading(false);
    });

    fetchSettings();
    fetchCurrentAffairs();
    fetchExams();

    return () => unsubscribe();
  }, []);

  const fetchCurrentAffairs = async () => {
    try {
      const res = await fetch('/api/current-affairs');
      if (res.ok) {
        const data = await res.json();
        setCurrentAffairs(data);
      }
    } catch (err) {
      console.error("Failed to fetch current affairs:", err);
    }
  };

  const fetchExams = async () => {
    try {
      const res = await fetch('/api/exam-info');
      if (res.ok) {
        const data = await res.json();
        setExamsList(data);
      }
    } catch (err) {
      console.error("Failed to fetch exam info:", err);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        setSpreadsheetIdPyq(data.spreadsheetIdPyq || '');
        setInputPyq(data.spreadsheetIdPyq || '');

        setSpreadsheetIdSubject(data.spreadsheetIdSubject || '');
        setInputSubject(data.spreadsheetIdSubject || '');

        setSpreadsheetIdCA(data.spreadsheetIdCurrentAffairs || data.spreadsheetIdCA || '');
        setInputCA(data.spreadsheetIdCurrentAffairs || data.spreadsheetIdCA || '');
      }
    } catch (err) {
      console.error("Failed to fetch settings:", err);
    }
  };

  const saveSettingField = async (fields: Record<string, string>) => {
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields)
      });
      if (res.ok) {
        return true;
      }
    } catch (err) {
      console.error("Failed to save settings:", err);
    }
    return false;
  };

  const extractSheetId = (inputStr: string): string => {
    if (!inputStr) return '';
    const trimmed = inputStr.trim();
    const match = trimmed.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (match && match[1]) {
      return match[1];
    }
    return trimmed;
  };

  // Google Sheet Save & Sync Handlers
  const handleSaveSheetIds = async () => {
    const pyqId = extractSheetId(inputPyq);
    const subjectId = extractSheetId(inputSubject);
    const caId = extractSheetId(inputCA);

    setSheetSyncing(true);
    setSheetError(null);
    setSheetSuccess(null);

    const ok = await saveSettingField({
      spreadsheetIdPyq: pyqId,
      spreadsheetIdSubject: subjectId,
      spreadsheetIdCurrentAffairs: caId
    });

    if (ok) {
      setSpreadsheetIdPyq(pyqId);
      setSpreadsheetIdSubject(subjectId);
      setSpreadsheetIdCA(caId);
      setSheetSuccess("गूगल शीट आईडी सर्वर पर सफलतापूर्वक सहेजी गईं!");
    } else {
      setSheetError("शीट आईडी सहेजने में त्रुटि हुई।");
    }
    setSheetSyncing(false);
  };

  const handlePullSheet = async (
    sheetInputVal: string,
    type: 'pyq' | 'subject' | 'currentAffairs',
    action: 'preview' | 'import_append' | 'import_replace'
  ) => {
    if (!sheetInputVal || !sheetInputVal.trim()) {
      setSheetError("कृपया एक गूगल शीट ID या URL दर्ज करें।");
      return;
    }

    setSheetSyncing(true);
    setSheetPullingType(type);
    setSheetError(null);
    setSheetSuccess(null);

    try {
      await handleSaveSheetIds();

      const res = await fetch('/api/pull-sheet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sheetInput: sheetInputVal,
          sheetType: type,
          action: action,
          accessToken: token || undefined
        })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSheetSuccess(data.message);
        setSheetPreviewData(data.items || []);
        setSheetPreviewType(type);

        if (action !== 'preview') {
          onRefreshQuestions();
          if (type === 'currentAffairs') {
            fetchCurrentAffairs();
          }
        }
      } else {
        setSheetError(data.error || "गूगल शीट से डेटा खींचने में त्रुटि हुई।");
      }
    } catch (err: any) {
      setSheetError("कनेक्टिविटी समस्या: " + (err.message || String(err)));
    } finally {
      setSheetSyncing(false);
      setSheetPullingType(null);
    }
  };

  const handleSyncAllSheets = async () => {
    setSheetSyncing(true);
    setSheetError(null);
    setSheetSuccess(null);

    try {
      await handleSaveSheetIds();
      let totalSynced = 0;
      let syncMessages: string[] = [];

      if (inputPyq.trim()) {
        const res = await fetch('/api/pull-sheet', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sheetInput: inputPyq, sheetType: 'pyq', action: 'import_append', accessToken: token || undefined })
        });
        const data = await res.json();
        if (res.ok && data.success) {
          totalSynced += data.count || 0;
          syncMessages.push(`PYQ: ${data.count} प्रश्न`);
          setSheetPreviewData(data.items || []);
          setSheetPreviewType('pyq');
        } else if (data.error) {
          syncMessages.push(`PYQ त्रुटि: ${data.error}`);
        }
      }

      if (inputSubject.trim()) {
        const res = await fetch('/api/pull-sheet', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sheetInput: inputSubject, sheetType: 'subject', action: 'import_append', accessToken: token || undefined })
        });
        const data = await res.json();
        if (res.ok && data.success) {
          totalSynced += data.count || 0;
          syncMessages.push(`विषय-वार: ${data.count} प्रश्न`);
        } else if (data.error) {
          syncMessages.push(`विषय-वार त्रुटि: ${data.error}`);
        }
      }

      if (inputCA.trim()) {
        const res = await fetch('/api/pull-sheet', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sheetInput: inputCA, sheetType: 'currentAffairs', action: 'import_append', accessToken: token || undefined })
        });
        const data = await res.json();
        if (res.ok && data.success) {
          totalSynced += data.count || 0;
          syncMessages.push(`करंट अफेयर्स: ${data.count} मदें`);
          fetchCurrentAffairs();
        } else if (data.error) {
          syncMessages.push(`करंट अफेयर्स त्रुटि: ${data.error}`);
        }
      }

      if (totalSynced > 0) {
        setSheetSuccess(`सिंक सफल! (${syncMessages.join(' | ')})`);
        onRefreshQuestions();
      } else if (syncMessages.length > 0) {
        setSheetError(syncMessages.join(' | '));
      } else {
        setSheetError("कृपया कम से कम एक गूगल शीट ID या URL दर्ज करें।");
      }
    } catch (err: any) {
      setSheetError("सिंक त्रुटि: " + (err.message || String(err)));
    } finally {
      setSheetSyncing(false);
    }
  };

  // Excel File Handlers
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadLoading(true);
    setUploadErrorMsg(null);
    setUploadSuccessMsg(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data: any[] = XLSX.utils.sheet_to_json(ws);

        const questionsParsed = data.map((r, idx) => {
          const cleanStr = (val: any) => {
            if (val === undefined || val === null) return '';
            return String(val).replace(/\u00a0/g, ' ').trim();
          };

          const getV = (patterns: (string | RegExp)[]) => {
            const keys = Object.keys(r);
            for (const pat of patterns) {
              for (const k of keys) {
                const val = cleanStr(r[k]);
                if (!val) continue;

                const keyTrim = k.replace(/\u00a0/g, ' ').trim();
                const keyNorm = keyTrim.toLowerCase().replace(/[\s\-_()]/g, '');

                if (typeof pat === 'string') {
                  const patNorm = pat.toLowerCase().replace(/[\s\-_()]/g, '');
                  if (keyNorm === patNorm || keyTrim === pat) {
                    return val;
                  }
                } else if (pat.test(keyTrim) || pat.test(keyNorm)) {
                  return val;
                }
              }
            }
            return '';
          };

          const textHi = getV(['text_hi', 'question_hi', 'Question (HI)', 'Question', 'Question (Hindi)', 'text', 'प्रश्न', 'प्रश्न (हिन्दी)']);
          const textEn = getV(['text_en', 'question_en', 'Question (EN)', 'Question (English)', 'प्रश्न (अंग्रेजी)']);

          const opt1 = getV([
            'option_hi_1', 'option_hi_a', 'option_1', 'option_a', 'option1', 'optiona',
            'Option A', 'Option A (HI)', 'Option 1', 'OptionA', 'विकल्प A', 'विकल्प 1', 'A', 'a', '(A)', '(a)', 'Ans A'
          ]);
          const opt2 = getV([
            'option_hi_2', 'option_hi_b', 'option_2', 'option_b', 'option2', 'optionb',
            'Option B', 'Option B (HI)', 'Option 2', 'OptionB', 'विकल्प B', 'विकल्प 2', 'B', 'b', '(B)', '(b)', 'Ans B'
          ]);
          const opt3 = getV([
            'option_hi_3', 'option_hi_c', 'option_3', 'option_c', 'option3', 'optionc',
            'Option C', 'Option C (HI)', 'Option 3', 'OptionC', 'विकल्प C', 'विकल्प 3', 'C', 'c', '(C)', '(c)', 'Ans C'
          ]);
          const opt4 = getV([
            'option_hi_4', 'option_hi_d', 'option_4', 'option_d', 'option4', 'optiond',
            'Option D', 'Option D (HI)', 'Option 4', 'OptionD', 'विकल्प D', 'विकल्प 4', 'D', 'd', '(D)', '(d)', 'Ans D'
          ]);
          const opt5 = getV([
            'option_hi_5', 'option_hi_e', 'option_5', 'option_e', 'option5', 'optione',
            'Option E', 'Option E (HI)', 'Option 5', 'OptionE', 'विकल्प E', 'विकल्प 5', 'E', 'e', '(E)', '(e)', 'Ans E'
          ]);

          const options_hi = [opt1, opt2, opt3, opt4, opt5].filter(Boolean);
          const ansRaw = getV(['correctAnswer', 'Correct Answer', 'Answer', 'correct_answer', 'CorrectAnswer', 'उत्तर', 'सही उत्तर']) || '1';

          return {
            id: `q-excel-${Date.now()}-${idx}`,
            text_hi: textHi,
            text_en: textEn,
            options_hi,
            options_en: [],
            correctAnswer: parseCorrectAnswer(ansRaw, options_hi),
            subject: getV(['subject', 'Subject', 'विषय']) || 'Chhattisgarh General Knowledge',
            topic: getV(['topic', 'Topic', 'विषय-वस्तु', 'टॉपिक']) || 'सामान्य परिचय',
            exam: getV(['exam', 'Exam', 'परीक्षा']) || '',
            year: getV(['year', 'Year', 'वर्ष']) ? parseInt(getV(['year', 'Year', 'वर्ष'])) : undefined,
            explanation_hi: getV(['explanation_hi', 'Explanation (HI)', 'Explanation', 'व्याख्या']),
            explanation_en: getV(['explanation_en', 'Explanation (EN)'])
          };
        }).filter(q => q.text_hi.trim() !== '');

        if (questionsParsed.length === 0) {
          setUploadErrorMsg("एक्सेल फाइल में कोई वैध प्रश्न नहीं मिला। कृपया कॉलम हेडिंग जांचें।");
        } else {
          setParsedExcelQuestions(questionsParsed);
          setUploadSuccessMsg(`एक्सेल फाइल से ${questionsParsed.length} प्रश्न सफलतापूर्वक पढ़े गए! डेटाबेस में सहेजने के लिए नीचे बटन दबाएं।`);
        }
      } catch (err: any) {
        setUploadErrorMsg("एक्सेल फाइल पढ़ने में विफल: " + err.message);
      } finally {
        setUploadLoading(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleSaveBulkQuestions = async (mode: 'append' | 'replace') => {
    if (parsedExcelQuestions.length === 0) return;
    setUploadLoading(true);
    setUploadErrorMsg(null);
    setUploadSuccessMsg(null);

    try {
      const endpoint = mode === 'replace' ? '/api/questions/replace' : '/api/questions/bulk';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsedExcelQuestions)
      });

      if (res.ok) {
        setUploadSuccessMsg(mode === 'replace' 
          ? `सभी पुराने प्रश्न हटाकर ${parsedExcelQuestions.length} नए प्रश्न सफलतापूर्वक सहेजे गए!`
          : `${parsedExcelQuestions.length} प्रश्न डेटाबेस में सफलतापूर्वक जोड़े गए!`
        );
        setParsedExcelQuestions([]);
        onRefreshQuestions();
      } else {
        setUploadErrorMsg("प्रश्नों को सहेजने में विफल।");
      }
    } catch (err: any) {
      setUploadErrorMsg("सर्वर त्रुटि: " + err.message);
    } finally {
      setUploadLoading(false);
    }
  };

  const handleDownloadExcelTemplate = () => {
    const sampleData = [
      {
        "Question (HI)": "छत्तीसगढ़ की राजधानी कौन सी है?",
        "Question (EN)": "What is the capital of Chhattisgarh?",
        "Option A": "बिलासपुर",
        "Option B": "रायपुर",
        "Option C": "दुर्ग",
        "Option D": "रायगढ़",
        "Correct Answer": "B",
        "Subject": "Chhattisgarh General Knowledge",
        "Topic": "सामान्य परिचय",
        "Exam": "CGPSC Prelims",
        "Year": 2024,
        "Explanation (HI)": "छत्तीसगढ़ की वर्तमान प्रशासनिक राजधानी रायपुर (नवा रायपुर) है।"
      },
      {
        "Question (HI)": "भारतीय संविधान के जनक किसे माना जाता है?",
        "Question (EN)": "Who is known as the father of Indian Constitution?",
        "Option A": "महात्मा गांधी",
        "Option B": "डॉ. बी. आर. अम्बेडकर",
        "Option C": "पंडित जवाहरलाल नेहरू",
        "Option D": "डॉ. राजेन्द्र प्रसाद",
        "Correct Answer": "B",
        "Subject": "Indian Polity & Constitution",
        "Topic": "संविधान सभा",
        "Exam": "CG Vyapam Patwari",
        "Year": 2023,
        "Explanation (HI)": "डॉ. बी. आर. अम्बेडकर प्रारूप समिति के अध्यक्ष थे।"
      }
    ];

    const ws = XLSX.utils.json_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "QuestionsTemplate");
    XLSX.writeFile(wb, "Questions_Upload_Template.xlsx");
  };

  // Manual Question Submit Handler
  const handleSubmitManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textHi.trim()) {
      alert("कृपया प्रश्न (हिन्दी) अवश्य दर्ज करें।");
      return;
    }
    if (optionsHi.filter(o => o.trim()).length < 2) {
      alert("कम से कम 2 विकल्प दर्ज करना अनिवार्य है।");
      return;
    }

    setSubmittingManual(true);
    setManualSuccess(false);

    const newQuestion = {
      text_hi: textHi,
      text_en: textEn,
      options_hi: optionsHi,
      options_en: optionsEn,
      correctAnswer: correctAnswer,
      subject: subject || "Chhattisgarh General Knowledge",
      topic: topic || "General",
      exam: exam || "",
      year: year ? Number(year) : undefined,
      explanation_hi: explanationHi,
      explanation_en: explanationEn
    };

    try {
      const res = await fetch('/api/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newQuestion)
      });

      if (res.ok) {
        setManualSuccess(true);
        setTextHi('');
        setTextEn('');
        setOptionsHi(['', '', '', '']);
        setOptionsEn(['', '', '', '']);
        setCorrectAnswer(0);
        setTopic('');
        setExam('');
        setExplanationHi('');
        setExplanationEn('');
        onRefreshQuestions();
        setTimeout(() => setManualSuccess(false), 4000);
      } else {
        alert("प्रश्न सहेजने में विफलता।");
      }
    } catch (err: any) {
      alert("सर्वर त्रुटि: " + err.message);
    } finally {
      setSubmittingManual(false);
    }
  };

  // Exam Info handlers
  const resetExamForm = () => {
    setExamEditingId(null);
    setExamName('');
    setExamCategory('PSC Exams');
    setExamRichContent('');
  };

  const appendToRichContent = (htmlSnippet: string) => {
    setExamRichContent(prev => prev ? prev + '\n\n' + htmlSnippet : htmlSnippet);
  };

  const handleInsertTable = () => {
    const rowsStr = prompt("तालिका में कितनी पंक्तियाँ (Rows) चाहिए? (उदा. 3)", "3");
    if (!rowsStr) return;
    const colsStr = prompt("तालिका में कितने कॉलम (Columns) चाहिए? (उदा. 4)", "4");
    if (!colsStr) return;
    
    const rows = parseInt(rowsStr) || 3;
    const cols = parseInt(colsStr) || 4;

    let tableHtml = `<div class="overflow-x-auto my-4"><table class="w-full border-collapse border border-gray-300 text-xs"><thead><tr class="bg-emerald-800 text-white font-bold">`;
    for (let c = 1; c <= cols; c++) {
      tableHtml += `<th class="border border-gray-300 p-2 text-left">कॉलम ${c}</th>`;
    }
    tableHtml += `</tr></thead><tbody>`;
    for (let r = 1; r <= rows; r++) {
      tableHtml += `<tr class="${r % 2 === 0 ? 'bg-gray-50' : 'bg-white'}">`;
      for (let c = 1; c <= cols; c++) {
        tableHtml += `<td class="border border-gray-300 p-2">डेटा ${r}.${c}</td>`;
      }
      tableHtml += `</tr>`;
    }
    tableHtml += `</tbody></table></div>`;
    appendToRichContent(tableHtml);
  };

  const handleInsertLink = () => {
    const text = prompt("लिंक का नाम दर्ज करें (Link Text):", "यहाँ क्लिक करें");
    if (!text) return;
    const url = prompt("वेबसाइट / लिंक URL दर्ज करें (Link URL):", "https://");
    if (!url) return;
    appendToRichContent(`<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-emerald-600 underline font-extrabold hover:text-emerald-800">${text} ↗</a>`);
  };

  const handleInsertPdfBtn = () => {
    const title = prompt("PDF बटन का नाम:", "आधिकारिक सिलेबस PDF डाउनलोड करें");
    if (!title) return;
    const url = prompt("PDF लिंक (PDF URL):", "https://");
    if (!url) return;
    appendToRichContent(`<div class="my-4"><a href="${url}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-extrabold px-5 py-2.5 rounded-xl text-xs shadow-sm transition">📄 ${title} (PDF) ↗</a></div>`);
  };

  const handleInsertCallout = () => {
    const note = prompt("महत्वपूर्ण सूचना / टिप दर्ज करें:", "परीक्षा में 1/3 माइनस मार्किंग (-0.66) लागू रहेगी।");
    if (!note) return;
    appendToRichContent(`<div class="bg-amber-50/90 border-l-4 border-amber-500 p-4 my-4 rounded-r-2xl text-xs text-amber-950 space-y-1 shadow-xs"><strong>📌 महत्वपूर्ण सूचना (Note):</strong><p class="mt-1">${note}</p></div>`);
  };

  const handleInsertTemplate = (type: 'cgpsc' | 'vyapam' | 'teacher') => {
    if (type === 'cgpsc') {
      appendToRichContent(`
<div class="space-y-6">
  <h2 class="text-lg font-black text-gray-900 border-b border-gray-200 pb-2">CGPSC राज्य सेवा परीक्षा - विस्तृत विवरण व गाइड</h2>
  <p class="text-xs text-gray-700 leading-relaxed">छत्तीसगढ़ लोक सेवा आयोग (CGPSC) द्वारा आयोजित राज्य सेवा परीक्षा की सम्पूर्ण जानकारी, विषयसूची व दिशा-निर्देश नीचे दिए गए हैं:</p>
</div>
      `.trim());
    } else if (type === 'vyapam') {
      appendToRichContent(`
<div class="space-y-6">
  <h2 class="text-lg font-black text-gray-900 border-b border-gray-200 pb-2">छत्तीसगढ़ व्यापमं (CG Vyapam) परीक्षा निर्देश व गाइड</h2>
  <p class="text-xs text-gray-700 leading-relaxed">व्यापमं द्वारा आयोजित परीक्षाओं का सम्पूर्ण विवरण, पैटर्न और सिलेबस निर्देश यहाँ लिखें:</p>
</div>
      `.trim());
    } else if (type === 'teacher') {
      appendToRichContent(`
<div class="space-y-6">
  <h2 class="text-lg font-black text-gray-900 border-b border-gray-200 pb-2">शिक्षक भर्ती परीक्षा विवरण व सिलेबस गाइड</h2>
  <p class="text-xs text-gray-700 leading-relaxed">शिक्षक भर्ती परीक्षा का सम्पूर्ण विवरण, अंक विभाजन व सिलेबस निर्देश:</p>
</div>
      `.trim());
    }
  };

  const handleSubmitExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!examName.trim()) {
      alert("कृपया परीक्षा का नाम अवश्य दर्ज करें।");
      return;
    }

    setExamLoading(true);

    const payload = {
      id: examEditingId || undefined,
      examName,
      category: examCategory,
      richContent: examRichContent,
      shortTagline: '',
      overview: examRichContent,
      eligibility: '',
      selectionProcess: '',
      patterns: [],
      syllabus: [],
      pdfUrl: ''
    };

    try {
      const method = examEditingId ? 'PUT' : 'POST';
      const url = examEditingId ? `/api/exam-info/${examEditingId}` : '/api/exam-info';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        alert(examEditingId ? "परीक्षा जानकारी सफलतापूर्वक अपडेट की गई!" : "नई परीक्षा सफलतापूर्वक जोड़ी गई!");
        resetExamForm();
        await fetchExams();
        if (onRefreshExams) onRefreshExams();
      } else {
        alert("सहेजने में त्रुटि हुई।");
      }
    } catch (err) {
      console.error(err);
      alert("सर्वर से संपर्क करने में समस्या हुई।");
    } finally {
      setExamLoading(false);
    }
  };

  const handleEditExam = (item: ExamInfo) => {
    setExamEditingId(item.id);
    setExamName(item.examName || '');
    setExamCategory(item.category || 'PSC Exams');
    setExamRichContent(item.richContent || item.overview || '');

    const el = document.getElementById('exam-form-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const handleDeleteExam = async (id: string) => {
    if (!confirm("क्या आप वाकई इस परीक्षा की जानकारी हटाना चाहते हैं?")) return;
    try {
      const res = await fetch(`/api/exam-info/${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchExams();
        if (onRefreshExams) onRefreshExams();
        alert("सफलतापूर्वक हटा दिया गया।");
      } else {
        alert("हटाने में विफल।");
      }
    } catch (err) {
      console.error(err);
      alert("हटाने में त्रुटि हुई।");
    }
  };

  const saveExamsSequence = async (newList: ExamInfo[]) => {
    setExamsList(newList);
    try {
      const res = await fetch('/api/exam-info-reorder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newList)
      });
      if (res.ok && onRefreshExams) {
        onRefreshExams();
      }
    } catch (err) {
      console.error("Failed to reorder exams:", err);
    }
  };

  const handleMoveExamUp = (index: number) => {
    if (index <= 0) return;
    const newList = [...examsList];
    const temp = newList[index];
    newList[index] = newList[index - 1];
    newList[index - 1] = temp;
    saveExamsSequence(newList);
  };

  const handleMoveExamDown = (index: number) => {
    if (index >= examsList.length - 1) return;
    const newList = [...examsList];
    const temp = newList[index];
    newList[index] = newList[index + 1];
    newList[index + 1] = temp;
    saveExamsSequence(newList);
  };

  const handleSetDefaultExam = (index: number) => {
    if (index === 0) return;
    const newList = [...examsList];
    const [target] = newList.splice(index, 1);
    newList.unshift(target);
    saveExamsSequence(newList);
  };

  // Current Affairs handlers
  const handleSubmitCurrentAffairs = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caContentHi.trim() || !caMonth.trim()) {
      alert("कृपया माह और विवरण (Hindi) अवश्य भरें।");
      return;
    }
    setCaLoading(true);
    setCaSuccessMsg(null);

    const payload = {
      id: caEditingId || undefined,
      month: caMonth,
      title: caMonth,
      category: "General",
      content_hi: caContentHi,
      content_en: ""
    };

    try {
      const res = await fetch('/api/current-affairs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setCaSuccessMsg(caEditingId ? "करंट अफेयर्स सफलतापूर्वक अपडेट किया गया!" : "करंट अफेयर्स सफलतापूर्वक जोड़ा गया!");
        setCaContentHi('');
        setCaEditingId(null);
        await fetchCurrentAffairs();
        onRefreshQuestions();
      } else {
        alert("सहेजने में त्रुटि हुई।");
      }
    } catch (err) {
      console.error(err);
      alert("कनेक्टिविटी समस्या।");
    } finally {
      setCaLoading(false);
    }
  };

  const handleEditCurrentAffairs = (item: any) => {
    setCaEditingId(item.id);
    setCaMonth(item.month || 'July 2026');
    setCaContentHi(item.content_hi || '');
  };

  const handleDeleteCurrentAffairs = async (id: string) => {
    if (!confirm("क्या आप वाकई इस करंट अफेयर्स को हटाना चाहते हैं?")) return;
    try {
      const res = await fetch(`/api/current-affairs/${encodeURIComponent(id)}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        await fetchCurrentAffairs();
        onRefreshQuestions();
        alert("सफलतापूर्वक हटा दिया गया।");
      } else {
        alert("हटाने में विफल।");
      }
    } catch (err) {
      console.error(err);
      alert("त्रुटि हुई।");
    }
  };

  const handleLogin = async () => {
    setAuthLoading(true);
    try {
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
        setToken(res.accessToken);
        setAccessToken(res.accessToken);
        await fetchSettings();
      }
    } catch (err: any) {
      alert("Login failed: " + err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      setAuthLoading(true);
      await logout();
      setUser(null);
      setToken(null);
    } catch (err: any) {
      console.error("Logout error:", err);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    if (!confirm("क्या आप वाकई इस प्रश्न को हटाना चाहते हैं?")) return;
    try {
      const res = await fetch(`/api/questions/${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (res.ok) {
        onRefreshQuestions();
      } else {
        alert("प्रश्न हटाने में विफलता।");
      }
    } catch (err) {
      console.error(err);
      alert("सर्वर त्रुटि।");
    }
  };

  const filteredQuestions = questions.filter(q => 
    q.text_hi.toLowerCase().includes(searchQuery.toLowerCase()) ||
    q.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    q.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (q.exam && q.exam.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const ADMIN_EMAIL = 'souravpatel13@gmail.com';
  const isAuthorizedAdmin = user && user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  if (authLoading) {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center space-y-3 max-w-md mx-auto my-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
        <p className="text-xs font-bold text-gray-600">ऑथेंटिकेशन स्थिति की जाँच हो रही है...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto my-12 bg-white border border-gray-200 rounded-2xl p-8 shadow-sm text-center space-y-5">
        <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto border border-emerald-200">
          <Lock className="h-7 w-7" />
        </div>
        <div>
          <h2 className="text-base font-extrabold text-gray-900">प्रशासकीय लॉगिन (Admin Login Required)</h2>
          <p className="text-xs text-gray-500 font-medium mt-1 leading-relaxed">
            यह नियंत्रण कक्ष केवल अधिकृत प्रशासक (Authorized Admin) के लिए सुरक्षित है।
          </p>
        </div>
        <button
          onClick={handleLogin}
          disabled={authLoading}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 shadow-xs cursor-pointer"
        >
          <Lock className="h-4 w-4" /> Google से लॉगिन करें
        </button>
      </div>
    );
  }

  if (!isAuthorizedAdmin) {
    return (
      <div className="max-w-md mx-auto my-12 bg-white border border-red-200 rounded-2xl p-8 shadow-sm text-center space-y-5">
        <div className="w-14 h-14 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto border border-red-200">
          <AlertCircle className="h-7 w-7" />
        </div>
        <div>
          <h2 className="text-base font-extrabold text-gray-900">अनुमति नहीं है (Access Restricted)</h2>
          <p className="text-xs text-gray-600 font-medium mt-2 leading-relaxed">
            आप <span className="font-bold text-gray-900">{user.email}</span> के रूप में लॉग-इन हैं।
          </p>
          <p className="text-xs text-red-600 font-semibold mt-1">
            केवल अधिकृत प्रशासक खाता ही Admin Panel का उपयोग कर सकता है।
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="w-full bg-gray-100 hover:bg-red-50 text-gray-700 hover:text-red-600 text-xs font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer border border-gray-200"
        >
          <LogOut className="h-4 w-4" /> लॉग आउट करें
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner / Header */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-100">
            <Lock className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-base font-extrabold text-gray-900">
              प्रशासकीय नियंत्रण कक्ष (Admin Panel)
            </h1>
            <p className="text-xs text-gray-500 font-medium mt-0.5">
              {user ? `लॉग-इन खाता: ${user.email}` : "प्रश्नों, करंट अफेयर्स व परीक्षा जानकारी को प्रबंधित करें"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!user ? (
            <button
              onClick={handleLogin}
              disabled={authLoading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition flex items-center gap-2 shadow-xs cursor-pointer"
            >
              <Lock className="h-4 w-4" /> Google से लॉग इन करें
            </button>
          ) : (
            <button
              onClick={handleLogout}
              className="bg-gray-100 hover:bg-red-50 text-gray-700 hover:text-red-600 text-xs font-bold px-4 py-2.5 rounded-xl transition flex items-center gap-2 cursor-pointer border border-gray-200"
            >
              <LogOut className="h-4 w-4" /> लॉग आउट
            </button>
          )}
        </div>
      </div>

      {/* Main Subtab Navigation */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-gray-200 pb-3">
        <button
          onClick={() => setActiveSubTab('sheets')}
          className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'sheets'
              ? 'bg-emerald-800 text-white shadow-sm'
              : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <Database className="h-4 w-4" /> गूगल शीट सिंक
        </button>

        <button
          onClick={() => setActiveSubTab('excel')}
          className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'excel'
              ? 'bg-emerald-800 text-white shadow-sm'
              : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <FileSpreadsheet className="h-4 w-4" /> एक्सेल अपलोड
        </button>

        <button
          onClick={() => setActiveSubTab('manual')}
          className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'manual'
              ? 'bg-emerald-800 text-white shadow-sm'
              : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <PlusCircle className="h-4 w-4" /> प्रश्न जोड़ें
        </button>

        <button
          onClick={() => setActiveSubTab('list')}
          className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'list'
              ? 'bg-emerald-800 text-white shadow-sm'
              : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <Search className="h-4 w-4" /> प्रश्न सूची ({questions.length})
        </button>

        {/* Current Affairs subtab temporarily hidden until ready */}

        <button
          onClick={() => setActiveSubTab('aboutExam')}
          className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'aboutExam'
              ? 'bg-emerald-800 text-white shadow-sm'
              : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <GraduationCap className="h-4 w-4" /> परीक्षा जानकारी (Word सम्पादक)
        </button>
      </div>

      {/* Tab Panels */}
      <div className="space-y-6">

        {/* GOOGLE SHEETS SYNC TAB */}
        {activeSubTab === 'sheets' && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-6">
            <div className="border-b border-gray-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                  <Database className="h-5 w-5 text-emerald-600" /> गूगल शीट लाइव सिंक एवं डेटा पुल (Google Sheets Sync & Data Pull)
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  अपनी गूगल शीट ID या डायरेक्ट शेयरिंग URL दर्ज करें। आप हर शीट को लाइव चेक करके डेटा डेटाबेस में पुल कर सकते हैं।
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleSyncAllSheets}
                  disabled={sheetSyncing}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold px-4 py-2.5 rounded-xl text-xs transition flex items-center gap-2 shadow-sm cursor-pointer"
                >
                  <RefreshCw className={`h-4 w-4 ${sheetSyncing ? 'animate-spin' : ''}`} />
                  {sheetSyncing ? "सिंक हो रहा है..." : "सभी शीट्स ऑटो-सिंक करें (Sync All)"}
                </button>

                <button
                  type="button"
                  onClick={handleSaveSheetIds}
                  disabled={sheetSyncing}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold px-3.5 py-2.5 rounded-xl text-xs transition cursor-pointer border border-gray-200"
                >
                  केवल IDs सहेजें
                </button>
              </div>
            </div>

            {/* Notification Banners */}
            {sheetSuccess && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs font-bold flex items-center justify-between gap-2 shadow-xs">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>{sheetSuccess}</span>
                </div>
                {sheetPreviewData.length > 0 && (
                  <span className="bg-emerald-200 text-emerald-900 text-[10px] font-mono font-extrabold px-2.5 py-1 rounded-full">
                    {sheetPreviewData.length} रिकॉर्ड मिले
                  </span>
                )}
              </div>
            )}
            {sheetError && (
              <div className="p-4 bg-red-50 border border-red-200 text-red-900 rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs">
                <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
                <span>{sheetError}</span>
              </div>
            )}

            {/* Three Dedicated Google Sheet Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              
              {/* CARD 1: PYQ SHEET */}
              <div className="bg-emerald-50/40 border border-emerald-200/80 p-4 rounded-2xl flex flex-col justify-between space-y-3.5 shadow-2xs">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-extrabold text-emerald-900 flex items-center gap-1.5">
                      <GraduationCap className="h-4 w-4 text-emerald-700" /> 1. PYQ / परीक्षा प्रश्न शीट
                    </label>
                    {extractSheetId(inputPyq) && (
                      <a
                        href={`https://docs.google.com/spreadsheets/d/${extractSheetId(inputPyq)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] font-bold text-emerald-700 hover:underline flex items-center gap-1"
                      >
                        शीट खोलें <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                  <input
                    type="text"
                    placeholder="गूगल शीट लिंक (URL) या Sheet ID दर्ज करें..."
                    value={inputPyq}
                    onChange={(e) => setInputPyq(e.target.value)}
                    className="w-full p-2.5 text-xs bg-white border border-emerald-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono shadow-2xs"
                  />
                  <span className="text-[10px] text-gray-500 block">
                    सहेजी गई ID: <code className="font-mono bg-white px-1 py-0.5 rounded border border-gray-200">{spreadsheetIdPyq || 'खाली'}</code>
                  </span>
                </div>

                <div className="space-y-1.5 pt-1 border-t border-emerald-100">
                  <span className="text-[10px] font-extrabold text-emerald-900 block">डेटा पुल एवं इम्पोर्ट विकल्प:</span>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      onClick={() => handlePullSheet(inputPyq, 'pyq', 'preview')}
                      disabled={sheetSyncing}
                      className="bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold py-2 rounded-lg text-[10px] transition flex items-center justify-center gap-1 cursor-pointer"
                      title="गूगल शीट से प्रश्नों को पढ़कर केवल नीचे टेबल में दिखाएं"
                    >
                      <Search className="h-3 w-3" /> जांचें
                    </button>

                    <button
                      type="button"
                      onClick={() => handlePullSheet(inputPyq, 'pyq', 'import_append')}
                      disabled={sheetSyncing}
                      className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-2 rounded-lg text-[10px] transition flex items-center justify-center gap-1 cursor-pointer"
                      title="पुराने डेटा को बिना मिटाए नए प्रश्न जोड़ें"
                    >
                      <PlusCircle className="h-3 w-3" /> पुल व जोड़ें
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (confirm("क्या आप वाकई गूगल शीट के प्रश्नों से पुराने प्रश्नों को रिप्लेस करना चाहते हैं?")) {
                          handlePullSheet(inputPyq, 'pyq', 'import_replace');
                        }
                      }}
                      disabled={sheetSyncing}
                      className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold py-2 rounded-lg text-[10px] transition flex items-center justify-center gap-1 cursor-pointer"
                      title="पुराने सभी प्रश्न हटाकर नया डेटा सेट करें"
                    >
                      <RefreshCw className="h-3 w-3" /> बदलें
                    </button>
                  </div>
                </div>
              </div>

              {/* CARD 2: SUBJECT-WISE SHEET */}
              <div className="bg-blue-50/40 border border-blue-200/80 p-4 rounded-2xl flex flex-col justify-between space-y-3.5 shadow-2xs">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-extrabold text-blue-900 flex items-center gap-1.5">
                      <FileSpreadsheet className="h-4 w-4 text-blue-700" /> 2. विषय-वार प्रश्न शीट
                    </label>
                    {extractSheetId(inputSubject) && (
                      <a
                        href={`https://docs.google.com/spreadsheets/d/${extractSheetId(inputSubject)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] font-bold text-blue-700 hover:underline flex items-center gap-1"
                      >
                        शीट खोलें <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                  <input
                    type="text"
                    placeholder="गूगल शीट लिंक (URL) या Sheet ID दर्ज करें..."
                    value={inputSubject}
                    onChange={(e) => setInputSubject(e.target.value)}
                    className="w-full p-2.5 text-xs bg-white border border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono shadow-2xs"
                  />
                  <span className="text-[10px] text-gray-500 block">
                    सहेजी गई ID: <code className="font-mono bg-white px-1 py-0.5 rounded border border-gray-200">{spreadsheetIdSubject || 'खाली'}</code>
                  </span>
                </div>

                <div className="space-y-1.5 pt-1 border-t border-blue-100">
                  <span className="text-[10px] font-extrabold text-blue-900 block">डेटा पुल एवं इम्पोर्ट विकल्प:</span>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      onClick={() => handlePullSheet(inputSubject, 'subject', 'preview')}
                      disabled={sheetSyncing}
                      className="bg-white hover:bg-blue-100 text-blue-800 border border-blue-300 font-bold py-2 rounded-lg text-[10px] transition flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Search className="h-3 w-3" /> जांचें
                    </button>

                    <button
                      type="button"
                      onClick={() => handlePullSheet(inputSubject, 'subject', 'import_append')}
                      disabled={sheetSyncing}
                      className="bg-blue-700 hover:bg-blue-800 text-white font-bold py-2 rounded-lg text-[10px] transition flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <PlusCircle className="h-3 w-3" /> पुल व जोड़ें
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (confirm("क्या आप वाकई विषय-वार गूगल शीट के प्रश्नों से पुराना डेटा बदलना चाहते हैं?")) {
                          handlePullSheet(inputSubject, 'subject', 'import_replace');
                        }
                      }}
                      disabled={sheetSyncing}
                      className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold py-2 rounded-lg text-[10px] transition flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className="h-3 w-3" /> बदलें
                    </button>
                  </div>
                </div>
              </div>

              {/* CARD 3: CURRENT AFFAIRS SHEET */}
              <div className="bg-amber-50/40 border border-amber-200/80 p-4 rounded-2xl flex flex-col justify-between space-y-3.5 shadow-2xs">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-extrabold text-amber-900 flex items-center gap-1.5">
                      <Newspaper className="h-4 w-4 text-amber-700" /> 3. करंट अफेयर्स शीट
                    </label>
                    {extractSheetId(inputCA) && (
                      <a
                        href={`https://docs.google.com/spreadsheets/d/${extractSheetId(inputCA)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] font-bold text-amber-700 hover:underline flex items-center gap-1"
                      >
                        शीट खोलें <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                  <input
                    type="text"
                    placeholder="गूगल शीट लिंक (URL) या Sheet ID दर्ज करें..."
                    value={inputCA}
                    onChange={(e) => setInputCA(e.target.value)}
                    className="w-full p-2.5 text-xs bg-white border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono shadow-2xs"
                  />
                  <span className="text-[10px] text-gray-500 block">
                    सहेजी गई ID: <code className="font-mono bg-white px-1 py-0.5 rounded border border-gray-200">{spreadsheetIdCA || 'खाली'}</code>
                  </span>
                </div>

                <div className="space-y-1.5 pt-1 border-t border-amber-100">
                  <span className="text-[10px] font-extrabold text-amber-900 block">डेटा पुल एवं इम्पोर्ट विकल्प:</span>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      onClick={() => handlePullSheet(inputCA, 'currentAffairs', 'preview')}
                      disabled={sheetSyncing}
                      className="bg-white hover:bg-amber-100 text-amber-800 border border-amber-300 font-bold py-2 rounded-lg text-[10px] transition flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Search className="h-3 w-3" /> जांचें
                    </button>

                    <button
                      type="button"
                      onClick={() => handlePullSheet(inputCA, 'currentAffairs', 'import_append')}
                      disabled={sheetSyncing}
                      className="bg-amber-700 hover:bg-amber-800 text-white font-bold py-2 rounded-lg text-[10px] transition flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <PlusCircle className="h-3 w-3" /> पुल व जोड़ें
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (confirm("क्या आप वाकई करंट अफेयर्स शीट के डेटा से पुराना करंट अफेयर्स बदलना चाहते हैं?")) {
                          handlePullSheet(inputCA, 'currentAffairs', 'import_replace');
                        }
                      }}
                      disabled={sheetSyncing}
                      className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold py-2 rounded-lg text-[10px] transition flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className="h-3 w-3" /> बदलें
                    </button>
                  </div>
                </div>
              </div>

            </div>

            {/* PREVIEW & PULLED DATA TABLE */}
            {sheetPreviewData.length > 0 && (
              <div className="border border-emerald-200 rounded-2xl bg-emerald-50/20 p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-100 pb-3">
                  <div>
                    <h3 className="text-sm font-extrabold text-emerald-950 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" /> गूगल शीट से खिंचा गया डेटा ({sheetPreviewData.length} आइटम)
                    </h3>
                    <p className="text-xs text-gray-600 mt-0.5">
                      नीचे गूगल शीट से पढ़े गए प्रश्नों / करंट अफेयर्स का पूर्वावलोकन (Preview) देखें:
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const targetInput = sheetPreviewType === 'pyq' ? inputPyq : sheetPreviewType === 'subject' ? inputSubject : inputCA;
                        handlePullSheet(targetInput, sheetPreviewType, 'import_append');
                      }}
                      className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-3.5 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <PlusCircle className="h-3.5 w-3.5" /> डेटाबेस में शामिल करें (Append)
                    </button>

                    <button
                      type="button"
                      onClick={() => setSheetPreviewData([])}
                      className="bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 text-xs font-bold px-2.5 py-1.5 rounded-lg transition cursor-pointer"
                    >
                      बंद करें
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto max-h-80 overflow-y-auto rounded-xl border border-gray-200 bg-white">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-gray-100/80 text-gray-800 border-b border-gray-200 font-extrabold sticky top-0">
                        <th className="p-3 w-12 text-center">#</th>
                        {sheetPreviewType === 'currentAffairs' ? (
                          <>
                            <th className="p-3">माह / शीर्षक</th>
                            <th className="p-3">विवरण (Content HI)</th>
                          </>
                        ) : (
                          <>
                            <th className="p-3">प्रश्न (Hindi)</th>
                            <th className="p-3">विकल्प (Options)</th>
                            <th className="p-3">सही उत्तर</th>
                            <th className="p-3">विषय / परीक्षा</th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-gray-800">
                      {sheetPreviewData.map((item, idx) => (
                        <tr key={idx} className="hover:bg-emerald-50/40 transition">
                          <td className="p-3 font-mono text-gray-400 text-center font-bold">{idx + 1}</td>
                          {sheetPreviewType === 'currentAffairs' ? (
                            <>
                              <td className="p-3 font-bold text-emerald-900 whitespace-nowrap">
                                <div>{item.month || item.title}</div>
                                <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded mt-0.5 inline-block font-normal">
                                  {item.category || 'General'}
                                </span>
                              </td>
                              <td className="p-3 text-gray-700 max-w-md line-clamp-2">{item.content_hi}</td>
                            </>
                          ) : (
                            <>
                              <td className="p-3 font-medium max-w-xs">{item.text_hi}</td>
                              <td className="p-3 text-[11px] text-gray-600 max-w-xs">
                                {Array.isArray(item.options_hi) && item.options_hi.map((opt: string, oIdx: number) => (
                                  <span key={oIdx} className={`inline-block mr-1.5 mb-1 px-1.5 py-0.5 rounded border text-[10px] ${oIdx === item.correctAnswer ? 'bg-emerald-100 border-emerald-300 font-bold text-emerald-900' : 'bg-gray-50 border-gray-200'}`}>
                                    {String.fromCharCode(65 + oIdx)}: {opt}
                                  </span>
                                ))}
                              </td>
                              <td className="p-3 font-bold text-emerald-700 whitespace-nowrap">
                                Option {String.fromCharCode(65 + (item.correctAnswer || 0))}
                              </td>
                              <td className="p-3 text-[11px] whitespace-nowrap">
                                <span className="bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 rounded font-bold">
                                  {item.subject}
                                </span>
                                {item.exam && (
                                  <span className="ml-1 bg-purple-50 text-purple-800 border border-purple-200 px-2 py-0.5 rounded font-bold">
                                    {item.exam} {item.year ? `(${item.year})` : ''}
                                  </span>
                                )}
                              </td>
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Troubleshooting & Guide Section (Collapsible for Clean Look) */}
            <details className="bg-blue-50/60 hover:bg-blue-50 border border-blue-200/80 rounded-2xl transition group">
              <summary className="p-4 font-extrabold text-blue-950 text-xs flex items-center justify-between cursor-pointer select-none">
                <span className="flex items-center gap-2">
                  <HelpCircle className="h-4.5 w-4.5 text-blue-600" />
                  गूगल शीट सिंक गाइड एवं ट्रबलशूटिंग सहायता (Sync & Troubleshooting Guide)
                </span>
                <span className="text-[11px] text-blue-700 bg-white px-2.5 py-1 rounded-lg border border-blue-200 group-open:hidden font-bold">
                  गाइड देखें ▼
                </span>
                <span className="text-[11px] text-blue-700 bg-white px-2.5 py-1 rounded-lg border border-blue-200 hidden group-open:inline font-bold">
                  छिपाएं ▲
                </span>
              </summary>

              <div className="px-5 pb-5 pt-1 space-y-3 border-t border-blue-100">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs pt-1">
                  <div className="bg-white p-3 rounded-xl border border-blue-200/80 space-y-1">
                    <span className="font-extrabold text-blue-900 text-[11px] flex items-center gap-1">
                      <span className="bg-blue-600 text-white rounded-full w-4 h-4 inline-flex items-center justify-center text-[10px]">1</span>
                      शेयर अनुमति (Share Setting):
                    </span>
                    <p className="text-gray-600 text-[11px] leading-relaxed">
                      गूगल शीट में ऊपर कोने में <strong>"Share"</strong> पर क्लिक करें और <strong>"Anyone with the link can view"</strong> चुनें।
                    </p>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-blue-200/80 space-y-1">
                    <span className="font-extrabold text-blue-900 text-[11px] flex items-center gap-1">
                      <span className="bg-blue-600 text-white rounded-full w-4 h-4 inline-flex items-center justify-center text-[10px]">2</span>
                      शीर्ष पंक्ति हेडर (Headers):
                    </span>
                    <p className="text-gray-600 text-[11px] leading-relaxed">
                      पहली पंक्ति में हेडर रखें: <code className="bg-gray-100 px-1 py-0.5 font-mono text-[10px]">Question (HI)</code>, <code className="bg-gray-100 px-1 py-0.5 font-mono text-[10px]">Option A</code>, <code className="bg-gray-100 px-1 py-0.5 font-mono text-[10px]">Option B</code>, <code className="bg-gray-100 px-1 py-0.5 font-mono text-[10px]">Correct Answer</code>, <code className="bg-gray-100 px-1 py-0.5 font-mono text-[10px]">Subject</code>।
                    </p>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-blue-200/80 space-y-1">
                    <span className="font-extrabold text-blue-900 text-[11px] flex items-center gap-1">
                      <span className="bg-blue-600 text-white rounded-full w-4 h-4 inline-flex items-center justify-center text-[10px]">3</span>
                      "पुल व जोड़ें" बटन:
                    </span>
                    <p className="text-gray-600 text-[11px] leading-relaxed">
                      शीट का URL दर्ज करने के बाद कार्ड के नीचे <strong>"जांचें"</strong> या <strong>"पुल व जोड़ें"</strong> बटन दबाएं।
                    </p>
                  </div>
                </div>

                {/* Column Format Pill Checklist */}
                <div className="pt-2 border-t border-blue-200/60 flex flex-wrap items-center gap-1.5 text-[10px]">
                  <span className="font-bold text-blue-900 mr-1">स्वीकृत हेडर नाम:</span>
                  <span className="bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded font-mono font-bold">Question (HI) / प्रश्न</span>
                  <span className="bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded font-mono font-bold">Option A</span>
                  <span className="bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded font-mono font-bold">Option B</span>
                  <span className="bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded font-mono font-bold">Option C</span>
                  <span className="bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded font-mono font-bold">Option D</span>
                  <span className="bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded font-mono font-bold">Correct Answer / उत्तर</span>
                  <span className="bg-blue-100 text-blue-900 px-2 py-0.5 rounded font-mono font-bold">Subject / विषय</span>
                  <span className="bg-purple-100 text-purple-900 px-2 py-0.5 rounded font-mono font-bold">Exam / परीक्षा</span>
                  <span className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded font-mono font-bold">Month / Title / Content (HI)</span>
                </div>
              </div>
            </details>
          </div>
        )}

        {/* EXCEL UPLOAD TAB */}
        {activeSubTab === 'excel' && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-6">
            <div className="border-b border-gray-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5 text-emerald-600" /> एक्सेल बल्क प्रश्न अपलोड (.xlsx / .xls)
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  अपने कम्प्यूटर से एक्सेल शीट अपलोड करके एक साथ सैकड़ों प्रश्न जोड़ें।
                </p>
              </div>

              <button
                type="button"
                onClick={handleDownloadExcelTemplate}
                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-extrabold text-xs px-4 py-2.5 rounded-xl transition flex items-center gap-2 shrink-0 cursor-pointer"
              >
                <Download className="h-4 w-4" /> नमूना (Template) एक्सेल डाउनलोड करें
              </button>
            </div>

            {/* Banners */}
            {uploadSuccessMsg && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
                <Check className="h-4 w-4 shrink-0" />
                {uploadSuccessMsg}
              </div>
            )}
            {uploadErrorMsg && (
              <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs font-bold flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {uploadErrorMsg}
              </div>
            )}

            {/* Upload Area */}
            <div className="border-2 border-dashed border-gray-300 hover:border-emerald-500 rounded-2xl p-8 text-center bg-gray-50/50 hover:bg-emerald-50/20 transition cursor-pointer relative">
              <input
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="space-y-3 pointer-events-none">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto">
                  <UploadCloud className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-extrabold text-gray-800">
                    यहाँ क्लिक करें या अपनी एक्सेल फाइल (.xlsx / .xls) ड्रॉप करें
                  </p>
                  <p className="text-[11px] text-gray-500 mt-1">
                    Excel/CSV फाइलें समर्थित हैं।
                  </p>
                </div>
              </div>
            </div>

            {/* Parsed Preview Table */}
            {parsedExcelQuestions.length > 0 && (
              <div className="space-y-4 pt-2 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-gray-800 uppercase tracking-wider">
                    अपलोड हेतु तैयार प्रश्न ({parsedExcelQuestions.length})
                  </h3>
                </div>

                <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-xl text-xs">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-100 text-gray-700 font-bold sticky top-0">
                      <tr>
                        <th className="p-2.5 border-b">#</th>
                        <th className="p-2.5 border-b">प्रश्न (Hindi)</th>
                        <th className="p-2.5 border-b">विषय</th>
                        <th className="p-2.5 border-b">उत्तर</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-medium">
                      {parsedExcelQuestions.slice(0, 10).map((pq, pIdx) => (
                        <tr key={pIdx} className="hover:bg-gray-50">
                          <td className="p-2.5 text-gray-400 font-bold">{pIdx + 1}</td>
                          <td className="p-2.5 text-gray-800 max-w-xs truncate">{pq.text_hi}</td>
                          <td className="p-2.5 text-emerald-700 font-bold">{pq.subject}</td>
                          <td className="p-2.5 font-bold text-gray-900">
                            {['A', 'B', 'C', 'D'][pq.correctAnswer] || pq.correctAnswer}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {parsedExcelQuestions.length > 10 && (
                    <div className="p-2 bg-gray-50 text-center text-[11px] text-gray-500 border-t font-medium">
                      और {parsedExcelQuestions.length - 10} अन्य प्रश्न...
                    </div>
                  )}
                </div>

                {/* Bulk Save Actions */}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => handleSaveBulkQuestions('append')}
                    disabled={uploadLoading}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-6 py-3 rounded-xl text-xs transition flex items-center gap-2 shadow-sm cursor-pointer"
                  >
                    <PlusCircle className="h-4 w-4" />
                    {uploadLoading ? "सहेजा जा रहा है..." : "मौजूदा प्रश्नों में जोड़ें (Append)"}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (confirm("चेतावनी: इससे पहले से मौजूद सभी प्रश्न हट जाएंगे। क्या आप आगे बढ़ना चाहते हैं?")) {
                        handleSaveBulkQuestions('replace');
                      }
                    }}
                    disabled={uploadLoading}
                    className="bg-red-600 hover:bg-red-700 text-white font-extrabold px-6 py-3 rounded-xl text-xs transition flex items-center gap-2 shadow-sm cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                    {uploadLoading ? "सहेजा जा रहा है..." : "सभी पुराने प्रश्न बदलकर नए रखें (Replace All)"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* MANUAL QUESTION ADD TAB */}
        {activeSubTab === 'manual' && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-6">
            <div className="border-b border-gray-100 pb-3">
              <h2 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                <PlusCircle className="h-5 w-5 text-emerald-600" /> नया प्रश्न manualmente जोड़ें (Add Manual Question)
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                निचले फॉर्म के माध्यम से एक-एक करके नए प्रश्न एवं उनकी व्याख्या जोड़ें।
              </p>
            </div>

            {manualSuccess && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
                <Check className="h-4 w-4 shrink-0" />
                प्रश्न सफलतापूर्वक डेटाबेस में जोड़ दिया गया!
              </div>
            )}

            <form onSubmit={handleSubmitManual} className="space-y-5 bg-gray-50/60 p-6 rounded-2xl border border-gray-200">
              {/* Subject, Topic, Exam, Year Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-700 block">विषय (Subject)*</label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full p-2.5 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                  >
                    {subjectsPreset.map((sub, idx) => (
                      <option key={idx} value={sub}>{sub}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-700 block">टॉपिक / अध्याय (Topic)*</label>
                  <input
                    type="text"
                    required
                    placeholder="उदा. भौतिक भूगोल, पंचायती राज"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="w-full p-2.5 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-700 block">परीक्षा का नाम (Exam Name)</label>
                  <input
                    type="text"
                    placeholder="उदा. CGPSC Prelims"
                    value={exam}
                    onChange={(e) => setExam(e.target.value)}
                    className="w-full p-2.5 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-700 block">वर्ष (Year)</label>
                  <input
                    type="number"
                    value={year}
                    onChange={(e) => setYear(parseInt(e.target.value) || new Date().getFullYear())}
                    className="w-full p-2.5 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                  />
                </div>
              </div>

              {/* Question Text */}
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-700 block">प्रश्न सामग्री (Hindi)*</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="यहाँ प्रश्न का पूरा पाठ हिन्दी में दर्ज करें..."
                    value={textHi}
                    onChange={(e) => setTextHi(e.target.value)}
                    className="w-full p-3 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium leading-relaxed"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-500 block">Question Text (English - optional)</label>
                  <input
                    type="text"
                    placeholder="Optional English translation..."
                    value={textEn}
                    onChange={(e) => setTextEn(e.target.value)}
                    className="w-full p-2.5 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                  />
                </div>
              </div>

              {/* Options */}
              <div className="space-y-2 pt-2 border-t border-gray-200">
                <label className="text-xs font-black text-gray-800 block">विकल्प (Options) एवं सही उत्तर चुनें*</label>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {['A', 'B', 'C', 'D'].map((label, optIdx) => (
                    <div key={optIdx} className="bg-white p-3 rounded-xl border border-gray-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-emerald-800">विकल्प {label}</span>
                        <label className="inline-flex items-center gap-1.5 cursor-pointer text-xs font-bold text-gray-700">
                          <input
                            type="radio"
                            name="correctOpt"
                            checked={correctAnswer === optIdx}
                            onChange={() => setCorrectAnswer(optIdx)}
                            className="text-emerald-600 focus:ring-emerald-500"
                          />
                          सही उत्तर (Correct)
                        </label>
                      </div>

                      <input
                        type="text"
                        required
                        placeholder={`विकल्प ${label} (Hindi)`}
                        value={optionsHi[optIdx] || ''}
                        onChange={(e) => {
                          const newOpts = [...optionsHi];
                          newOpts[optIdx] = e.target.value;
                          setOptionsHi(newOpts);
                        }}
                        className="w-full p-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Explanation */}
              <div className="space-y-1 pt-2 border-t border-gray-200">
                <label className="text-[11px] font-bold text-gray-700 block">व्याख्या / स्पष्टीकरण (Hindi Explanation)</label>
                <textarea
                  rows={3}
                  placeholder="प्रश्न का सही उत्तर क्यों है, इसकी विस्तृत व्याख्या यहाँ लिखें..."
                  value={explanationHi}
                  onChange={(e) => setExplanationHi(e.target.value)}
                  className="w-full p-3 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium leading-relaxed"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submittingManual}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-6 py-3 rounded-xl text-xs transition flex items-center gap-2 shadow-sm cursor-pointer"
              >
                <Save className="h-4 w-4" />
                {submittingManual ? "सहेजा जा रहा है..." : "प्रश्न सहेजें (Save Question)"}
              </button>
            </form>
          </div>
        )}

        {/* QUESTIONS LIST TAB */}
        {activeSubTab === 'list' && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-3 border-b border-gray-100">
              <h2 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                <Search className="h-5 w-5 text-emerald-600" /> प्रश्न सूची प्रबंधक
              </h2>
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="प्रश्न, विषय या परीक्षा खोजें..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 w-full font-medium"
                />
              </div>
            </div>

            <div className="space-y-3">
              {filteredQuestions.map((q) => {
                const isExpanded = expandedQuestion === q.id;
                return (
                  <div key={q.id} className="border border-gray-200 rounded-xl p-4 bg-white hover:border-emerald-300 transition space-y-2">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1 flex-1 cursor-pointer" onClick={() => setExpandedQuestion(isExpanded ? null : q.id)}>
                        <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-bold">
                          <span className="bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded">
                            {q.subject}
                          </span>
                          <span className="bg-blue-50 text-blue-800 px-2 py-0.5 rounded">
                            {q.topic}
                          </span>
                          {q.exam && (
                            <span className="bg-purple-50 text-purple-800 px-2 py-0.5 rounded">
                              {q.exam} {q.year ? `(${q.year})` : ''}
                            </span>
                          )}
                        </div>
                        <h4 className="text-xs sm:text-sm font-semibold text-gray-800 leading-relaxed mt-1 font-sans">
                          {q.text_hi}
                        </h4>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteQuestion(q.id)}
                        className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition cursor-pointer"
                        title="हटाएं"
                      >
                        <Trash className="h-4 w-4" />
                      </button>
                    </div>

                    {isExpanded && (
                      <div className="pt-3 border-t border-gray-100 text-xs space-y-2 bg-gray-50/50 p-3 rounded-xl mt-2">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {q.options_hi.map((opt, oIdx) => (
                            <div key={oIdx} className={`p-2 rounded-lg border text-xs ${oIdx === q.correctAnswer ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold' : 'bg-white border-gray-200 text-gray-700'}`}>
                              {String.fromCharCode(65 + oIdx)}. {opt} {oIdx === q.correctAnswer && '✓'}
                            </div>
                          ))}
                        </div>
                        {q.explanation_hi && (
                          <div className="text-xs text-gray-600 pt-1">
                            <strong>व्याख्या:</strong> {q.explanation_hi}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {filteredQuestions.length === 0 && (
                <p className="text-center text-xs text-gray-400 py-8">कोई प्रश्न नहीं मिला।</p>
              )}
            </div>
          </div>
        )}

        {/* CURRENT AFFAIRS TAB */}
        {activeSubTab === 'currentAffairs' && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-6">
            <div className="border-b border-gray-100 pb-3">
              <h2 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                <Newspaper className="h-5 w-5 text-emerald-600" /> करंट अफेयर्स प्रबंधक
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                यहाँ से आप मासिक या दैनिक करंट अफेयर्स जोड़ व सम्पादित कर सकते हैं।
              </p>
            </div>

            <form onSubmit={handleSubmitCurrentAffairs} className="space-y-4 bg-gray-50 p-5 rounded-2xl border border-gray-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-700 block">माह / तिथि (Month/Date)*</label>
                  <input
                    type="text"
                    required
                    placeholder="उदा. July 2026"
                    value={caMonth}
                    onChange={(e) => setCaMonth(e.target.value)}
                    className="w-full p-2.5 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-700 block">करंट अफेयर्स सामग्री (Hindi)*</label>
                <textarea
                  rows={6}
                  required
                  placeholder="यहाँ करंट अफेयर्स का पूरा विवरण (बुलेट पॉइंट्स या पैराग्राफ) लिखें..."
                  value={caContentHi}
                  onChange={(e) => setCaContentHi(e.target.value)}
                  className="w-full p-3 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium leading-relaxed"
                />
              </div>

              {caSuccessMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold">
                  {caSuccessMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={caLoading}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-6 py-2.5 rounded-xl text-xs transition flex items-center gap-2 shadow-xs cursor-pointer"
              >
                <Save className="h-4 w-4" />
                {caLoading ? "सहेजा जा रहा है..." : caEditingId ? "अपडेट करें" : "करंट अफेयर्स सहेजें"}
              </button>
            </form>

            <div className="space-y-3">
              <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest">
                सहेजे गए करंट अफेयर्स ({currentAffairs.length})
              </h3>
              {currentAffairs.map((item) => (
                <div key={item.id} className="border border-gray-200 rounded-xl p-4 bg-white flex items-start justify-between gap-4">
                  <div className="space-y-1 flex-1">
                    <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded uppercase">
                      {item.month}
                    </span>
                    <p className="text-xs text-gray-700 line-clamp-3 leading-relaxed font-medium mt-1">
                      {item.content_hi}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleEditCurrentAffairs(item)}
                      className="p-1.5 hover:bg-emerald-50 text-emerald-700 rounded-lg transition"
                      title="संपादित करें"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteCurrentAffairs(item.id)}
                      className="p-1.5 hover:bg-red-50 text-red-600 rounded-lg transition"
                      title="हटाएं"
                    >
                      <Trash className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ABOUT EXAM & WORD EDITOR MANAGER TAB */}
        {activeSubTab === 'aboutExam' && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 space-y-8" id="exam-form-section">
            <div className="border-b border-gray-100 pb-4">
              <h2 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-emerald-600" />
                परीक्षा जानकारी व वर्ड सम्पादक (Exam Info & Word Editor)
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                यहाँ परीक्षा का नाम चुनें/लिखें और वर्ड स्टाइल सम्पादक में सम्पूर्ण जानकारी, सिलेबस व तालिका दर्ज करें।
              </p>
            </div>

            {/* Exam Add/Edit Form */}
            <form onSubmit={handleSubmitExam} className="space-y-6 bg-gray-50/70 p-6 rounded-2xl border border-gray-200">
              <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                <h3 className="text-xs font-black text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Save className="h-4 w-4 text-emerald-600" />
                  {examEditingId ? "परीक्षा जानकारी सम्पादित करें (Edit Exam)" : "नई परीक्षा की जानकारी जोड़ें (Add New Exam)"}
                </h3>
                {examEditingId && (
                  <button
                    type="button"
                    onClick={resetExamForm}
                    className="text-xs font-bold text-red-600 hover:bg-red-50 px-3 py-1 rounded-lg transition"
                  >
                    नया फॉर्म खोलें (Reset Form)
                  </button>
                )}
              </div>

              {/* Basic Fields Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-700 block">परीक्षा का नाम (Exam Name)*</label>
                  <input
                    type="text"
                    required
                    placeholder="उदा. CGPSC State Services (Prelims & Mains)"
                    value={examName}
                    onChange={(e) => setExamName(e.target.value)}
                    className="w-full p-2.5 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-700 block">श्रेणी (Category)</label>
                  <select
                    value={examCategory}
                    onChange={(e) => setExamCategory(e.target.value)}
                    className="w-full p-2.5 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                  >
                    <option value="PSC Exams">PSC Exams (CGPSC)</option>
                    <option value="Vyapam Exams">Vyapam Exams (व्यापमं)</option>
                    <option value="Teaching Exams">Teaching Exams (शिक्षक भर्ती)</option>
                    <option value="Police / Defence">Police & Defence Exams</option>
                    <option value="Other Competitive Exams">Other Competitive Exams</option>
                  </select>
                </div>
              </div>

              {/* MS Word-Style Rich Document Editor Section */}
              <div className="space-y-3 pt-2 border-t border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="text-xs font-black text-gray-800 flex items-center gap-1.5">
                    <FileText className="h-4 w-4 text-emerald-600" />
                    वर्ड सम्पादक - परीक्षा विवरण व सम्पूर्ण गाइड (Word / Document Editor)
                  </label>

                  {/* View Modes */}
                  <div className="flex items-center gap-1 bg-gray-200/80 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setEditorTab('visual')}
                      className={`px-3 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1 cursor-pointer ${
                        editorTab === 'visual' ? 'bg-white text-emerald-900 shadow-2xs' : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <Edit3 className="h-3 w-3" /> वर्ड मोड
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditorTab('code')}
                      className={`px-3 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1 cursor-pointer ${
                        editorTab === 'code' ? 'bg-white text-emerald-900 shadow-2xs' : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <FileCode className="h-3 w-3" /> HTML कोड
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditorTab('preview')}
                      className={`px-3 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1 cursor-pointer ${
                        editorTab === 'preview' ? 'bg-white text-emerald-900 shadow-2xs' : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <Eye className="h-3 w-3" /> पूर्वावलोकन (Preview)
                    </button>
                  </div>
                </div>

                {/* Quick Toolbar */}
                <div className="bg-white border border-gray-200 rounded-xl p-2.5 flex flex-wrap items-center gap-1.5 shadow-2xs">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider pr-1">त्वरित उपकरण:</span>
                  
                  <button
                    type="button"
                    onClick={handleInsertTable}
                    className="p-1.5 bg-gray-100 hover:bg-emerald-50 text-gray-700 hover:text-emerald-800 rounded-lg text-xs font-bold transition flex items-center gap-1 border border-gray-200"
                  >
                    <Table className="h-3.5 w-3.5" /> + तालिका (Table)
                  </button>

                  <button
                    type="button"
                    onClick={handleInsertLink}
                    className="p-1.5 bg-gray-100 hover:bg-emerald-50 text-gray-700 hover:text-emerald-800 rounded-lg text-xs font-bold transition flex items-center gap-1 border border-gray-200"
                  >
                    <Link className="h-3.5 w-3.5" /> + लिंक (URL)
                  </button>

                  <button
                    type="button"
                    onClick={handleInsertPdfBtn}
                    className="p-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-xs font-bold transition flex items-center gap-1 border border-red-200"
                  >
                    <Download className="h-3.5 w-3.5" /> + PDF बटन
                  </button>

                  <button
                    type="button"
                    onClick={handleInsertCallout}
                    className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg text-xs font-bold transition flex items-center gap-1 border border-amber-200"
                  >
                    <AlertCircle className="h-3.5 w-3.5" /> + सूचना बॉक्स
                  </button>

                  <div className="h-4 w-px bg-gray-200 mx-1"></div>

                  <button
                    type="button"
                    onClick={() => handleInsertTemplate('cgpsc')}
                    className="p-1.5 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 rounded-lg text-[11px] font-bold transition flex items-center gap-1 border border-emerald-200"
                  >
                    <Sparkles className="h-3 w-3 text-emerald-600" /> CGPSC टेम्पलेट
                  </button>

                  <button
                    type="button"
                    onClick={() => handleInsertTemplate('vyapam')}
                    className="p-1.5 bg-blue-50 text-blue-800 hover:bg-blue-100 rounded-lg text-[11px] font-bold transition flex items-center gap-1 border border-blue-200"
                  >
                    <Sparkles className="h-3 w-3 text-blue-600" /> व्यापमं टेम्पलेट
                  </button>
                </div>

                {/* Editor Content Box */}
                {editorTab === 'visual' || editorTab === 'code' ? (
                  <div className="space-y-1">
                    <textarea
                      rows={14}
                      placeholder="यहाँ आप परीक्षा का पूरा विवरण, एग्जाम पैटर्न, पात्रता एवं विस्तृत सिलेबस अपने अनुसार लिखें या पेस्ट करें..."
                      value={examRichContent}
                      onChange={(e) => setExamRichContent(e.target.value)}
                      className="w-full p-4 text-xs sm:text-sm bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono leading-relaxed"
                    />
                  </div>
                ) : (
                  <div className="p-6 bg-white border border-gray-200 rounded-2xl min-h-[300px] prose prose-emerald max-w-none text-xs sm:text-sm leading-relaxed space-y-3">
                    {examRichContent ? (
                      <div dangerouslySetInnerHTML={{ __html: examRichContent }} />
                    ) : (
                      <p className="text-gray-400 italic">पूर्वावलोकन देखने के लिए सम्पादक में सामग्री लिखें...</p>
                    )}
                  </div>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center gap-3 pt-3">
                <button
                  type="submit"
                  disabled={examLoading}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-6 py-3 rounded-xl text-xs transition flex items-center gap-2 shadow-sm cursor-pointer"
                >
                  <Save className="h-4 w-4" />
                  {examLoading ? "सहेजा जा रहा है..." : examEditingId ? "अपडेट करें (Update Exam)" : "सहेजें (Save Exam Info)"}
                </button>
                {examEditingId && (
                  <button
                    type="button"
                    onClick={resetExamForm}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold px-4 py-3 rounded-xl text-xs transition cursor-pointer"
                  >
                    रद्द करें (Cancel)
                  </button>
                )}
              </div>
            </form>

            {/* List of Saved Exams */}
            <div className="space-y-4 pt-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest">
                  वर्तमान में उपलब्ध परीक्षाएं ({examsList.length}) - अनुक्रम (Sequence) प्रबंधक
                </h3>
                <span className="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg font-medium">
                  💡 पहला (Top) परीक्षा डिफ़ॉल्ट रूप से चुनी जाती है।
                </span>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {examsList.map((item, index) => {
                  const isDefault = index === 0;
                  return (
                    <div 
                      key={item.id} 
                      className={`border rounded-2xl bg-white transition p-5 space-y-3 shadow-2xs ${
                        isDefault ? 'border-amber-400/80 ring-2 ring-amber-400/20 bg-amber-50/20' : 'border-gray-200 hover:border-emerald-300'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            {isDefault ? (
                              <span className="text-[10px] font-extrabold bg-amber-500 text-white px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-2xs">
                                <Star className="h-3 w-3 fill-white" /> डिफ़ॉल्ट (पहला क्रम)
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                                क्रम #{index + 1}
                              </span>
                            )}
                            <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded uppercase">
                              {item.category}
                            </span>
                          </div>
                          <h4 className="text-sm font-extrabold text-gray-900 mt-1">
                            {item.examName}
                          </h4>
                        </div>

                        {/* Actions & Reordering Controls */}
                        <div className="flex items-center gap-1.5 flex-wrap shrink-0">
                          {!isDefault && (
                            <button
                              type="button"
                              onClick={() => handleSetDefaultExam(index)}
                              className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                              title="इसे पहला/डिफ़ॉल्ट बनाएं"
                            >
                              <Star className="h-3.5 w-3.5 text-amber-600" /> डिफ़ॉल्ट बनाएं
                            </button>
                          )}

                          <div className="flex items-center bg-gray-100 p-0.5 rounded-lg border border-gray-200">
                            <button
                              type="button"
                              onClick={() => handleMoveExamUp(index)}
                              disabled={index === 0}
                              className="p-1.5 text-gray-700 hover:bg-white rounded transition disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                              title="ऊपर लाएं (Move Up)"
                            >
                              <ArrowUp className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveExamDown(index)}
                              disabled={index === examsList.length - 1}
                              className="p-1.5 text-gray-700 hover:bg-white rounded transition disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                              title="नीचे ले जाएं (Move Down)"
                            >
                              <ArrowDown className="h-3.5 w-3.5" />
                            </button>
                          </div>

                          <div className="h-4 w-px bg-gray-200 mx-0.5"></div>

                          <button
                            type="button"
                            onClick={() => handleEditExam(item)}
                            className="p-2 hover:bg-emerald-50 text-emerald-700 rounded-lg transition cursor-pointer"
                            title="संपादित करें"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteExam(item.id)}
                            className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition cursor-pointer"
                            title="हटाएं"
                          >
                            <Trash className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      <div className="text-xs text-gray-600 line-clamp-2 leading-relaxed font-sans">
                        {item.richContent ? item.richContent.replace(/<[^>]*>?/gm, ' ').slice(0, 160) + '...' : item.overview || 'कोई विवरण नहीं'}
                      </div>
                    </div>
                  );
                })}

                {examsList.length === 0 && (
                  <div className="text-center py-8 text-gray-400 text-xs">
                    कोई परीक्षा जानकारी उपलब्ध नहीं है। ऊपर दिए गए फॉर्म से नई परीक्षा जोड़ें।
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
