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
  Edit
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Question } from '../types';
import { parseCorrectAnswer } from '../utils/quizHelpers';
import { auth, googleSignIn, logout, getAccessToken, setAccessToken } from '../lib/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';

interface AdminPanelProps {
  questions: Question[];
  onRefreshQuestions: () => void;
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

export default function AdminPanel({ questions, onRefreshQuestions }: AdminPanelProps) {
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

  // Navigation tabs for Admin
  const [activeSubTab, setActiveSubTab] = useState<'sheets' | 'excel' | 'manual' | 'list' | 'currentAffairs'>('sheets');
  
  // Search and view states for list
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);

  // Current Affairs States
  const [currentAffairs, setCurrentAffairs] = useState<any[]>([]);
  const [caLoading, setCaLoading] = useState(false);
  const [caMonth, setCaMonth] = useState('July 2026');
  const [caTitle, setCaTitle] = useState('');
  const [caCategory, setCaCategory] = useState('National');
  const [caContentHi, setCaContentHi] = useState('');
  const [caContentEn, setCaContentEn] = useState('');
  const [caSuccessMsg, setCaSuccessMsg] = useState<string | null>(null);
  const [caEditingId, setCaEditingId] = useState<string | null>(null);

  // Manual Form States
  const [textHi, setTextHi] = useState('');
  const [textEn, setTextEn] = useState('');
  const [optionsHi, setOptionsHi] = useState<string[]>(['', '', '', '']); // 4 options (A, B, C, D)
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

  const adminEmail = "souravpatel13@gmail.com";

  // Preset Subjects
  const subjectsPreset = [
    "Chhattisgarh General Knowledge",
    "Indian Polity & Constitution",
    "Indian History",
    "Language (Hindi & Chhattisgarhi)",
    "General Aptitude (CSAT)"
  ];

  // Sync with Firebase Auth state on mount
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      // Retrieve the current cached token from our helper
      const cachedToken = getAccessToken();
      if (cachedToken) {
        setToken(cachedToken);
      }
      setAuthLoading(false);
    });

    // Load active settings (like Spreadsheet ID) from server
    fetchSettings();
    fetchCurrentAffairs();

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
      title: caMonth, // Use month as title
      category: "General", // Use general as category
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

  const handleDeleteCurrentAffairs = async (id: string) => {
    if (!confirm("क्या आप वाकई इस करंट अफेयर्स को हटाना चाहते हैं?")) return;
    try {
      const res = await fetch(`/api/current-affairs/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        await fetchCurrentAffairs();
        onRefreshQuestions();
        alert("सफलतापूर्वक हटा दिया गया।");
      }
    } catch (err) {
      console.error(err);
      alert("त्रुटि हुई।");
    }
  };

  const handleEditCurrentAffairs = (item: any) => {
    setCaEditingId(item.id);
    setCaMonth(item.month);
    setCaTitle(item.title);
    setCaCategory(item.category);
    setCaContentHi(item.content_hi);
    setCaContentEn(item.content_en || '');
  };

  const handleLogin = async () => {
    setAuthLoading(true);
    try {
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
        setToken(res.accessToken);
        setAccessToken(res.accessToken);
        
        // Refresh settings on successful login
        await fetchSettings();
      }
    } catch (err: any) {
      alert("Login failed: " + err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    if (confirm("Are you sure you want to log out?")) {
      await logout();
      setUser(null);
      setToken(null);
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

  // Google Sheets APIs
  const createNewSheet = async (type: 'pyq' | 'subject' | 'ca') => {
    if (!token) {
      alert("सत्र समाप्त हो गया है या आप लॉग इन नहीं हैं। कृपया ऊपर दिए गए 'Google से लॉग इन करें' बटन से पुनः लॉग इन करें।");
      return;
    }
    setSheetSyncing(true);
    setSheetError(null);
    setSheetSuccess(null);

    const sheetTitles = {
      pyq: "CGPSC Quiz Portal - PYQ Practice Questions Database",
      subject: "CGPSC Quiz Portal - Subject Test Questions Database",
      ca: "CGPSC Quiz Portal - Current Affairs Database"
    };

    const tabTitle = type === 'ca' ? "CurrentAffairs" : "Questions";

    try {
      const res = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          properties: {
            title: sheetTitles[type]
          },
          sheets: [
            {
              properties: {
                title: tabTitle,
                gridProperties: {
                  rowCount: 2000,
                  columnCount: 13
                }
              }
            }
          ]
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message || "Failed to create Google Sheet");
      }

      const data = await res.json();
      const newId = data.spreadsheetId;

      const fieldName = type === 'pyq' ? 'spreadsheetIdPyq' : type === 'subject' ? 'spreadsheetIdSubject' : 'spreadsheetIdCurrentAffairs';
      const saved = await saveSettingField({ [fieldName]: newId });
      if (saved) {
        if (type === 'pyq') {
          setSpreadsheetIdPyq(newId);
          setInputPyq(newId);
          setSheetSuccess("नया पीवायक्यू गूगल शीट सफलतापूर्वक बनाया और कनेक्ट किया गया!");
          const pyqs = questions.filter(isPyq);
          await pushQuestionsToSheet(newId, pyqs, token, "Questions");
        } else if (type === 'subject') {
          setSpreadsheetIdSubject(newId);
          setInputSubject(newId);
          setSheetSuccess("नया सब्जेक्ट टेस्ट गूगल शीट सफलतापूर्वक बनाया और कनेक्ट किया गया!");
          const subs = questions.filter(q => !isPyq(q));
          await pushQuestionsToSheet(newId, subs, token, "Questions");
        } else {
          setSpreadsheetIdCA(newId);
          setInputCA(newId);
          setSheetSuccess("नया करंट अफेयर्स गूगल शीट सफलतापूर्वक बनाया और कनेक्ट किया गया!");
          await pushCurrentAffairsToSheet(newId, currentAffairs, token);
        }
      } else {
        throw new Error("Failed to save Spreadsheet ID on the server.");
      }
    } catch (err: any) {
      setSheetError(err.message || "An error occurred while creating the Google Sheet.");
    } finally {
      setSheetSyncing(false);
    }
  };

  const connectExistingSheet = async (type: 'pyq' | 'subject' | 'ca') => {
    const inputVal = type === 'pyq' ? inputPyq : type === 'subject' ? inputSubject : inputCA;
    if (!inputVal.trim()) {
      alert("कृपया एक वैध गूगल शीट आईडी दर्ज करें।");
      return;
    }
    setSheetSyncing(true);
    setSheetError(null);
    setSheetSuccess(null);

    try {
      if (!token) {
        // Force save without validating via Google API
        const fieldName = type === 'pyq' ? 'spreadsheetIdPyq' : type === 'subject' ? 'spreadsheetIdSubject' : 'spreadsheetIdCurrentAffairs';
        const saved = await saveSettingField({ [fieldName]: inputVal.trim() });
        if (saved) {
          if (type === 'pyq') {
            setSpreadsheetIdPyq(inputVal.trim());
          } else if (type === 'subject') {
            setSpreadsheetIdSubject(inputVal.trim());
          } else {
            setSpreadsheetIdCA(inputVal.trim());
          }
          setSheetSuccess("गूगल शीट आईडी सहेज ली गई है! शीट से डेटा सिंक (Pull/Push) करने के लिए कृपया ऊपर 'गूगल ड्राइव ऑथराइज़ करें' बटन दबाएं।");
        } else {
          throw new Error("सर्वर पर शीट आईडी सहेजने में विफल।");
        }
        return;
      }

      const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${inputVal.trim()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) {
        throw new Error("दर्ज की गई शीट आईडी अमान्य है या आपको इसे एक्सेस करने की अनुमति नहीं है।");
      }

      const fieldName = type === 'pyq' ? 'spreadsheetIdPyq' : type === 'subject' ? 'spreadsheetIdSubject' : 'spreadsheetIdCurrentAffairs';
      const saved = await saveSettingField({ [fieldName]: inputVal.trim() });
      if (saved) {
        if (type === 'pyq') {
          setSpreadsheetIdPyq(inputVal.trim());
        } else if (type === 'subject') {
          setSpreadsheetIdSubject(inputVal.trim());
        } else {
          setSpreadsheetIdCA(inputVal.trim());
        }
        setSheetSuccess("गूगल शीट सफलतापूर्वक कनेक्ट हो गई!");
      } else {
        throw new Error("सर्वर पर शीट आईडी सहेजने में विफल।");
      }
    } catch (err: any) {
      setSheetError(err.message || "गूगल शीट से कनेक्ट करने में असमर्थ।");
    } finally {
      setSheetSyncing(false);
    }
  };

  const disconnectSheet = async (type: 'pyq' | 'subject' | 'ca') => {
    if (confirm("क्या आप वाकई इस गूगल शीट को डिस्कनेक्ट करना चाहते हैं? इससे गूगल ड्राइव में आपकी शीट डिलीट नहीं होगी, लेकिन ऐप उससे डेटा सिंक करना बंद कर देगा।")) {
      setSheetSyncing(true);
      const fieldName = type === 'pyq' ? 'spreadsheetIdPyq' : type === 'subject' ? 'spreadsheetIdSubject' : 'spreadsheetIdCurrentAffairs';
      const saved = await saveSettingField({ [fieldName]: "" });
      if (saved) {
        if (type === 'pyq') {
          setSpreadsheetIdPyq("");
          setInputPyq("");
        } else if (type === 'subject') {
          setSpreadsheetIdSubject("");
          setInputSubject("");
        } else {
          setSpreadsheetIdCA("");
          setInputCA("");
        }
        setSheetSuccess("गूगल शीट सफलतापूर्वक डिस्कनेक्ट हो गई।");
      }
      setSheetSyncing(false);
    }
  };

  // Rewrite all database questions of a specific type to Google Sheet
  const pushQuestionsToSheet = async (id: string, qList: Question[], oauthToken: string, tabName: string = "Questions") => {
    try {
      const values = [
        [
          "ID", "Question_Hindi", 
          "OptionA_Hindi", "OptionB_Hindi", "OptionC_Hindi", "OptionD_Hindi",
          "CorrectAnswerIndex", "Subject", "Topic", "Exam", "Year", "Explanation_Hindi"
        ],
        ...qList.map(q => [
          q.id,
          q.text_hi,
          q.options_hi[0] || "",
          q.options_hi[1] || "",
          q.options_hi[2] || "",
          q.options_hi[3] || "",
          q.correctAnswer,
          q.subject,
          q.topic,
          q.exam || "",
          q.year || "",
          q.explanation_hi || ""
        ])
      ];

      const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${id}/values/${tabName}!A1:M2000?valueInputOption=USER_ENTERED`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${oauthToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          range: `${tabName}!A1:M2000`,
          majorDimension: "ROWS",
          values: values
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message || "Failed to write data to spreadsheet.");
      }

      return true;
    } catch (err: any) {
      console.error("Error pushing questions:", err);
      throw err;
    }
  };

  const pushCurrentAffairsToSheet = async (id: string, caList: any[], oauthToken: string) => {
    try {
      const values = [
        ["ID", "Month", "Content_Hindi"],
        ...caList.map(item => [
          item.id,
          item.month || "",
          item.content_hi || ""
        ])
      ];

      const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${id}/values/CurrentAffairs!A1:C2000?valueInputOption=USER_ENTERED`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${oauthToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          range: "CurrentAffairs!A1:C2000",
          majorDimension: "ROWS",
          values: values
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message || "Failed to write current affairs to spreadsheet.");
      }

      return true;
    } catch (err: any) {
      console.error("Error pushing current affairs:", err);
      throw err;
    }
  };

  const handlePush = async (type: 'pyq' | 'subject' | 'ca') => {
    const sId = type === 'pyq' ? spreadsheetIdPyq : type === 'subject' ? spreadsheetIdSubject : spreadsheetIdCA;
    if (!token) {
      alert("सत्र समाप्त हो गया है या आप लॉग इन नहीं हैं। कृपया ऊपर दिए गए 'Google से लॉग इन करें' बटन से पुनः लॉग इन करें।");
      return;
    }
    if (!sId) return;
    setSheetSyncing(true);
    setSheetError(null);
    setSheetSuccess(null);

    try {
      if (type === 'pyq') {
        const pyqs = questions.filter(isPyq);
        await pushQuestionsToSheet(sId, pyqs, token, "Questions");
        setSheetSuccess(`सफलतापूर्वक ${pyqs.length} PYQ प्रश्नों को गूगल शीट पर पुश/अपडेट कर दिया गया है!`);
      } else if (type === 'subject') {
        const subQuestions = questions.filter(q => !isPyq(q));
        await pushQuestionsToSheet(sId, subQuestions, token, "Questions");
        setSheetSuccess(`सफलतापूर्वक ${subQuestions.length} सब्जेक्ट टेस्ट प्रश्नों को गूगल शीट पर पुश/अपडेट कर दिया गया है!`);
      } else {
        await pushCurrentAffairsToSheet(sId, currentAffairs, token);
        setSheetSuccess(`सफलतापूर्वक ${currentAffairs.length} करंट अफेयर्स को गूगल शीट पर पुश/अपडेट कर दिया गया है!`);
      }
    } catch (err: any) {
      setSheetError("शीट पर डेटा पुश करने में असमर्थ: " + err.message);
    } finally {
      setSheetSyncing(false);
    }
  };

  const handlePull = async (type: 'pyq' | 'subject' | 'ca') => {
    const sId = type === 'pyq' ? spreadsheetIdPyq : type === 'subject' ? spreadsheetIdSubject : spreadsheetIdCA;
    if (!token) {
      alert("सत्र समाप्त हो गया है या आप लॉग इन नहीं हैं। कृपया ऊपर दिए गए 'Google से लॉग इन करें' बटन से पुनः लॉग इन करें।");
      return;
    }
    if (!sId) return;
    setSheetSyncing(true);
    setSheetError(null);
    setSheetSuccess(null);

    try {
      const tabName = type === 'ca' ? "CurrentAffairs" : "Questions";
      const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sId}/values/${tabName}!A1:M2000`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message || "Failed to fetch spreadsheet rows.");
      }

      const data = await res.json();
      const rows = data.values;
      if (!rows || rows.length <= 1) {
        throw new Error("गूगल शीट खाली है या कोई रिकॉर्ड मौजूद नहीं है।");
      }

      if (type === 'ca') {
        const parsedCA: any[] = [];
        for (let i = 1; i < rows.length; i++) {
          const r = rows[i];
          if (!r || !r[1] || r[1].trim() === "") continue;

          parsedCA.push({
            id: r[0] || `ca-sheet-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 3)}`,
            month: String(r[1]),
            title: String(r[1]),
            category: "General",
            content_hi: r[2] ? String(r[2]) : "",
            content_en: "",
            createdAt: new Date().toISOString()
          });
        }

        const replaceCA = await fetch('/api/current-affairs/replace', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(parsedCA)
        });

        if (replaceCA.ok) {
          setSheetSuccess(`सफलतापूर्वक गूगल शीट से ${parsedCA.length} करंट अफेयर्स को सिंक और लोड कर लिया गया है!`);
          await fetchCurrentAffairs();
          onRefreshQuestions();
        } else {
          throw new Error("सर्वर पर करंट अफेयर्स सिंक करने में विफल।");
        }
      } else {
        const headers = rows[0].map((h: any) => String(h).trim().toLowerCase());
        
        const findColIdx = (candidates: string[], fallback: number) => {
          const idx = headers.findIndex((h: string) => candidates.some(c => h.includes(c) || c.includes(h)));
          return idx !== -1 ? idx : fallback;
        };

        const idIdx = headers.indexOf("id") !== -1 ? headers.indexOf("id") : 0;
        const textIdx = findColIdx(["question_hindi", "question_hi", "question", "text_hi", "text", "प्रश्न", "प्रश्न_hi"], 1);
        const optAIdx = findColIdx(["optiona_hindi", "optiona", "option_hi_1", "option_1", "विकल्प_hi_1", "विकल्प_1", "विकल्पa"], 2);
        const optBIdx = findColIdx(["optionb_hindi", "optionb", "option_hi_2", "option_2", "विकल्प_hi_2", "विकल्प_2", "विकल्पb"], 3);
        const optCIdx = findColIdx(["optionc_hindi", "optionc", "option_hi_3", "option_3", "विकल्प_hi_3", "विकल्प_3", "विकल्पc"], 4);
        const optDIdx = findColIdx(["optiond_hindi", "optiond", "option_hi_4", "option_4", "विकल्प_hi_4", "विकल्प_4", "विकल्पd"], 5);
        const optEIdx = findColIdx(["optione_hindi", "optione", "option_hi_5", "option_5", "विकल्प_hi_5", "विकल्प_5", "विकल्पe"], 6);
        const correctIdx = findColIdx(["correctanswerindex", "correctanswer", "correct", "answer", "सही_उत्तर", "उत्तर"], 7);
        const subjectIdx = findColIdx(["subject", "विषय"], 8);
        const topicIdx = findColIdx(["topic", "टॉपिक", "अध्याय"], 9);
        const examIdx = findColIdx(["exam", "परीक्षा"], 10);
        const yearIdx = findColIdx(["year", "वर्ष"], 11);
        const explanationIdx = findColIdx(["explanation_hindi", "explanation_hi", "explanation", "व्याख्या", "स्पष्टीकरण"], 12);

        const parsedQuestions: Question[] = [];
        for (let i = 1; i < rows.length; i++) {
          const r = rows[i];
          if (!r || !r[textIdx] || String(r[textIdx]).trim() === "") continue;

          // Parse 4 options (Option A to D)
          const options_hi: string[] = [];
          const indices = [optAIdx, optBIdx, optCIdx, optDIdx];
          indices.forEach(idx => {
            if (r[idx] !== undefined && String(r[idx]).trim() !== "") {
              options_hi.push(String(r[idx]).trim());
            }
          });

          const rawExam = r[examIdx] !== undefined ? String(r[examIdx]) : undefined;
          const cleanedExam = cleanExamValue(rawExam);

          const subjectVal = (r[subjectIdx] !== undefined && String(r[subjectIdx]).trim() !== "")
            ? String(r[subjectIdx]).trim()
            : "Chhattisgarh General Knowledge";

          const topicVal = (r[topicIdx] !== undefined && String(r[topicIdx]).trim() !== "")
            ? String(r[topicIdx]).trim()
            : "General";

          parsedQuestions.push({
            id: (r[idIdx] !== undefined && String(r[idIdx]).trim() !== "") 
              ? String(r[idIdx]).trim() 
              : `q-sheet-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 3)}`,
            text_hi: String(r[textIdx]),
            options_hi: options_hi,
            correctAnswer: parseCorrectAnswer(r[correctIdx], options_hi),
            subject: subjectVal,
            topic: topicVal,
            exam: cleanedExam || (type === 'pyq' ? "CGPSC Prelims" : undefined),
            year: r[yearIdx] !== undefined ? cleanYearValue(r[yearIdx]) : undefined,
            explanation_hi: (r[explanationIdx] !== undefined && String(r[explanationIdx]).trim() !== "") 
              ? String(r[explanationIdx]).trim() 
              : undefined
          });
        }

        let finalMergedQuestions: Question[] = [];
        if (type === 'pyq') {
          const existingSubject = questions.filter(q => !isPyq(q));
          finalMergedQuestions = [...existingSubject, ...parsedQuestions];
        } else {
          const existingPyq = questions.filter(isPyq);
          finalMergedQuestions = [...existingPyq, ...parsedQuestions];
        }

        const replaceRes = await fetch('/api/questions/replace', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(finalMergedQuestions)
        });

        if (replaceRes.ok) {
          setSheetSuccess(`सफलतापूर्वक गूगल शीट से ${parsedQuestions.length} प्रश्नों को सिंक और लोड कर लिया गया है!`);
          onRefreshQuestions();
        } else {
          throw new Error("सर्वर पर प्रश्न डेटा सिंक करने में विफल।");
        }
      }
    } catch (err: any) {
      setSheetError("गूगल शीट से सिंक करने में असमर्थ: " + err.message);
    } finally {
      setSheetSyncing(false);
    }
  };

  // Helper to handle manual option text changes
  const handleOptionHiChange = (idx: number, val: string) => {
    const copy = [...optionsHi];
    copy[idx] = val;
    setOptionsHi(copy);
  };

  const handleOptionEnChange = (idx: number, val: string) => {
    const copy = [...optionsEn];
    copy[idx] = val;
    setOptionsEn(copy);
  };

  // Submit manual question
  const handleSubmitManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textHi || optionsHi.filter(o => o.trim()).length < 2) {
      alert("कृपया कम से कम हिंदी प्रश्न पाठ्य और 2 विकल्प प्रदान करें।");
      return;
    }

    setSubmittingManual(true);
    setManualSuccess(false);

    // Clean up options (keep only up to non-empty options)
    const validOptionsHi = optionsHi.filter(o => o.trim() !== '');
    const validOptionsEn = optionsEn.filter((_, idx) => optionsHi[idx]?.trim() !== '');

    const newId = "q-" + Date.now() + "-" + Math.random().toString(36).substr(2, 5);

    const payload: Question = {
      id: newId,
      text_hi: textHi,
      text_en: textEn.trim() ? textEn : undefined,
      options_hi: validOptionsHi,
      options_en: validOptionsEn.some(o => o.trim()) ? validOptionsEn : undefined,
      correctAnswer: Math.min(correctAnswer, validOptionsHi.length - 1),
      subject,
      topic: topic.trim() ? topic : "General",
      exam: cleanExamValue(exam),
      year: cleanYearValue(year),
      explanation_hi: explanationHi.trim() ? explanationHi : undefined,
      explanation_en: explanationEn.trim() ? explanationEn : undefined
    };

    try {
      const response = await fetch('/api/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
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
        
        // Auto Sync with Google Sheet if connected!
        const isQPyq = isPyq(payload);
        const sId = isQPyq ? spreadsheetIdPyq : spreadsheetIdSubject;
        if (sId && token) {
          const matchingQuestions = [...questions, payload].filter(q => isQPyq ? isPyq(q) : !isPyq(q));
          await pushQuestionsToSheet(sId, matchingQuestions, token, "Questions");
        }

        onRefreshQuestions();
      } else {
        alert("Error: Failed to save question.");
      }
    } catch (err) {
      console.error(err);
      alert("Connectivity problem occurred.");
    } finally {
      setSubmittingManual(false);
    }
  };

  // Delete Question from database and Google Sheet (if connected)
  const handleDeleteQuestion = async (id: string) => {
    if (!confirm("क्या आप वाकई इस प्रश्न को हटाना चाहते हैं? यह क्रिया पूर्ववत नहीं की जा सकती।")) return;

    try {
      const res = await fetch(`/api/questions/${id}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        // Auto Sync with Google Sheet if connected!
        const targetQ = questions.find(q => q.id === id);
        if (targetQ) {
          const isQPyq = isPyq(targetQ);
          const sId = isQPyq ? spreadsheetIdPyq : spreadsheetIdSubject;
          if (sId && token) {
            const updatedMatchingList = questions.filter(q => q.id !== id && (isQPyq ? isPyq(q) : !isPyq(q)));
            await pushQuestionsToSheet(sId, updatedMatchingList, token, "Questions");
          }
        }

        onRefreshQuestions();
        alert("प्रश्न सफलतापूर्वक हटा दिया गया है।");
      } else {
        alert("प्रश्न हटाने में विफल।");
      }
    } catch (err) {
      console.error("Delete failed:", err);
      alert("डेटाबेस से कनेक्ट करने में असमर्थ।");
    }
  };

  // Download Sample CSV Template
  const handleDownloadTemplate = () => {
    const csvContent = [
      "text_hi,option_hi_1,option_hi_2,option_hi_3,option_hi_4,option_hi_5,correctAnswer,subject,topic,exam,year,explanation_hi",
      `"छत्तीसगढ़ का राजकीय पशु कौन सा है?","वन भैंसा","बाघ","हाथी","शेर","हिरण",0,"Chhattisgarh General Knowledge","CG Basics","CGPSC Prelims",2021,"वन भैंसा छत्तीसगढ़ का राजकीय पशु है।"`,
      `"भारतीय संविधान का जनक किसे माना जाता है?","डॉ. बी.आर. अम्बेडकर","महात्मा गांधी","जवाहरलाल नेहरू","सरदार पटेल","राजेंद्र प्रसाद",0,"Indian Polity & Constitution","Constitution History","CGPSC Prelims",2019,"डॉ. भीमराव अम्बेडकर को भारतीय संविधान का जनक माना जाता है।"`
    ].join("\n");

    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "cgpsc_questions_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setUploadLoading(true);
    setUploadSuccessMsg(null);
    setUploadErrorMsg(null);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const workbook = XLSX.read(bstr, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawJson = XLSX.utils.sheet_to_json<any>(worksheet);

        if (rawJson.length === 0) {
          throw new Error("The uploaded sheet contains no rows of data.");
        }

        // Map and validate columns
        const mappedQuestions = rawJson.map((row, idx) => {
          const text_hi = row.text_hi || row.question_hi || row["प्रश्न_hi"] || row["प्रश्न"] || row.text;
          if (!text_hi) {
            throw new Error(`Row ${idx + 2} does not contain text_hi (Hindi Question Text) which is required.`);
          }

          const text_en = row.text_en || row.question_en || row["प्रश्न_en"];
          
          // Reconstruct option lists (strictly 4 options A, B, C, D)
          const options_hi: string[] = [];
          const options_en: string[] = [];

          for (let i = 1; i <= 4; i++) {
            const optHiVal = row[`option_hi_${i}`] || row[`विकल्प_hi_${i}`] || row[`विकल्प_${i}`];
            if (optHiVal !== undefined) {
              options_hi.push(String(optHiVal));
            }
            const optEnVal = row[`option_en_${i}`] || row[`विकल्प_en_${i}`];
            if (optEnVal !== undefined) {
              options_en.push(String(optEnVal));
            }
          }

          // Fallback options if columns not formatted like option_hi_X
          if (options_hi.length === 0) {
            if (row.options_hi) {
              options_hi.push(...String(row.options_hi).split(';').slice(0, 4));
            } else {
              // try keys A, B, C, D
              ['A', 'B', 'C', 'D'].forEach(key => {
                if (row[key] !== undefined) options_hi.push(String(row[key]));
              });
            }
          }

          if (options_en.length === 0 && row.options_en) {
            options_en.push(...String(row.options_en).split(';'));
          }

          if (options_hi.length < 2) {
            throw new Error(`Line ${idx + 2} must contain at least 2 choice options.`);
          }

           // Correct answer index (0-indexed or 1-indexed)
          let correctAnswer = 0;
          const rawAns = row.correctAnswer !== undefined ? row.correctAnswer : (row.correct_answer || row.correct_option || row["सही_उत्तर"]);
          if (rawAns !== undefined) {
            correctAnswer = parseCorrectAnswer(rawAns, options_hi);
          }

          return {
            id: row.id || "q-bulk-" + Date.now() + "-" + idx + "-" + Math.random().toString(36).substr(2, 4),
            text_hi,
            text_en: text_en ? String(text_en) : undefined,
            options_hi,
            options_en: options_en.length > 0 ? options_en : undefined,
            correctAnswer,
            subject: row.subject || row["विषय"] || "Chhattisgarh General Knowledge",
            topic: row.topic || row["टॉपिक"] || "General",
            exam: cleanExamValue(row.exam || row["परीक्षा"]),
            year: cleanYearValue(row.year),
            explanation_hi: row.explanation_hi || row.explanation || row["विवरण"] || undefined,
            explanation_en: row.explanation_en || undefined
          };
        });

        // Submit bulk questions to server API
        const response = await fetch('/api/questions/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(mappedQuestions)
        });

        if (response.ok) {
          const resData = await response.json();
          setUploadSuccessMsg(resData.message || `Successfully imported ${mappedQuestions.length} questions!`);
          
          // Auto Sync with Google Sheet if connected!
          if (token) {
            const allUpdated = [...questions, ...mappedQuestions];
            if (spreadsheetIdPyq) {
              const pyqs = allUpdated.filter(isPyq);
              await pushQuestionsToSheet(spreadsheetIdPyq, pyqs, token, "Questions");
            }
            if (spreadsheetIdSubject) {
              const subs = allUpdated.filter(q => !isPyq(q));
              await pushQuestionsToSheet(spreadsheetIdSubject, subs, token, "Questions");
            }
          }

          onRefreshQuestions();
        } else {
          const errData = await response.json();
          throw new Error(errData.error || "Server bulk import failed.");
        }

      } catch (err: any) {
        setUploadErrorMsg(err.message || "Failed to parse file. Make sure columns strictly align to our template sheet format.");
      } finally {
        setUploadLoading(false);
      }
    };

    reader.readAsBinaryString(file);
  };

  // Filter list of questions based on search query
  const filteredQuestions = questions.filter(q => {
    return q.text_hi.toLowerCase().includes(searchQuery.toLowerCase()) || 
           (q.text_en && q.text_en.toLowerCase().includes(searchQuery.toLowerCase())) ||
           q.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
           q.topic.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Auth Gate Screen
  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white border border-gray-100 rounded-3xl p-6 shadow-sm max-w-md mx-auto my-12 text-center space-y-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-600"></div>
        <p className="text-gray-500 font-semibold text-xs">सुरक्षा प्रमाणीकरण की जाँच की जा रही है...</p>
      </div>
    );
  }

  const isUserAdmin = user && user.email === adminEmail;

  if (!user || !isUserAdmin) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 bg-white border border-gray-100 rounded-3xl shadow-sm space-y-6 text-center">
        <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl mx-auto flex items-center justify-center shadow-inner">
          <Lock className="h-8 w-8" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">एडमिन पैनल लॉगिन</h1>
          <p className="text-xs text-gray-400 leading-relaxed font-sans">
            यह सेक्शन केवल व्यवस्थापक के लिए है। कृपया गूगल शीट और प्रश्नों को प्रबंधित करने के लिए अपने अधिकृत ईमेल आईडी से लॉगिन करें।
          </p>
        </div>

        {user && !isUserAdmin && (
          <div className="bg-red-50 border border-red-200 text-red-800 text-[11px] p-3.5 rounded-xl flex items-start gap-2 text-left leading-relaxed">
            <AlertCircle className="h-4.5 w-4.5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <strong>पहुंच अस्वीकृत!</strong> आप <code className="bg-red-100/50 px-1 py-0.5 rounded font-mono font-bold text-red-900">{user.email}</code> के रूप में लॉग इन हैं। केवल अधिकृत ईमेल <code className="bg-red-100/50 px-1 py-0.5 rounded font-mono font-bold text-red-900">{adminEmail}</code> ही एडमिन पैनल खोल सकता है।
            </div>
          </div>
        )}

        <button
          onClick={handleLogin}
          className="w-full flex items-center justify-center gap-2.5 bg-white border border-gray-200 hover:border-gray-300 py-3 rounded-xl shadow-sm text-xs font-bold text-gray-700 hover:bg-gray-50 transition cursor-pointer"
        >
          <svg className="h-4 w-4 shrink-0" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
          </svg>
          Google से लॉग इन करें
        </button>

        {user && (
          <button
            onClick={handleLogout}
            className="text-[11px] text-gray-400 hover:text-gray-600 underline font-medium"
          >
            साइन आउट करें
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans max-w-7xl mx-auto px-1 sm:px-4 py-4" id="admin-panel-container">
      
      {/* Title Header */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-amber-100 text-amber-800 text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
              ADMIN CONTROL
            </span>
            <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              लॉग इन: {user.email}
            </span>
          </div>
          <h1 className="text-xl font-extrabold text-gray-900 mt-1 flex items-center gap-2">
            <Database className="text-amber-600 h-5 w-5" />
            प्रबंधक डैशबोर्ड (Admin Panel)
          </h1>
          <p className="text-gray-500 text-xs leading-relaxed mt-0.5">
            प्रश्नों को सीधे गूगल शीट (Google Sheet) से सिंक करें, नए प्रश्न जोड़ें या वर्तमान डेटाबेस को प्रबंधित करें।
          </p>
        </div>

        {/* Panel Tabs Controls */}
        <div className="flex flex-wrap bg-gray-100 p-1 rounded-xl border border-gray-200 shrink-0 gap-1">
          <button
            onClick={() => setActiveSubTab('sheets')}
            className={`text-xs font-bold px-3.5 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer ${activeSubTab === 'sheets' ? 'bg-white text-amber-800 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
          >
            <FileSpreadsheet className="h-3.5 w-3.5 inline text-emerald-600" /> Google Sheet Sync
          </button>
          <button
            onClick={() => setActiveSubTab('excel')}
            className={`text-xs font-bold px-3.5 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer ${activeSubTab === 'excel' ? 'bg-white text-amber-800 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
          >
            <Download className="h-3.5 w-3.5 inline" /> Excel Import
          </button>
          <button
            onClick={() => setActiveSubTab('manual')}
            className={`text-xs font-bold px-3.5 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer ${activeSubTab === 'manual' ? 'bg-white text-amber-800 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
          >
            <PlusCircle className="h-3.5 w-3.5 inline" /> Manual Entry
          </button>
          <button
            onClick={() => setActiveSubTab('list')}
            className={`text-xs font-bold px-3.5 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer ${activeSubTab === 'list' ? 'bg-white text-amber-800 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
          >
            <BookOpen className="h-3.5 w-3.5 inline" /> Questions List ({questions.length})
          </button>
          <button
            onClick={() => setActiveSubTab('currentAffairs')}
            className={`text-xs font-bold px-3.5 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer ${activeSubTab === 'currentAffairs' ? 'bg-white text-amber-800 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
          >
            <Newspaper className="h-3.5 w-3.5 inline" /> Current Affairs ({currentAffairs.length})
          </button>
          <button
            onClick={handleLogout}
            className="text-xs font-bold px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-lg transition flex items-center gap-1 ml-auto cursor-pointer"
            title="लॉगआउट"
          >
            <LogOut className="h-3.5 w-3.5" /> Log Out
          </button>
        </div>
      </div>

      {/* RENDER ACTIVE TAB */}
      <div id="admin-subtab-contents">
        
        {/* GOOGLE SHEETS SYNC TAB */}
        {activeSubTab === 'sheets' && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8 space-y-8">
            <div className="border-b border-gray-100 pb-4">
              <h2 className="text-lg font-bold text-gray-800">गूगल शीट एकीकरण (Google Sheets Integration)</h2>
              <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                अपने प्रश्नों और करंट अफेयर्स को सुरक्षित रखने तथा सीधे गूगल शीट के माध्यम से अपडेट करने के लिए गूगल ड्राइव से कनेक्ट करें। प्रत्येक श्रेणी के लिए अलग-अलग शीट का उपयोग किया जाता है।
              </p>
            </div>

            {/* Google Drive Auth Status */}
            <div className={`p-5 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm transition ${token ? 'bg-emerald-50/60 border-emerald-100 text-emerald-900' : 'bg-amber-50/60 border-amber-100 text-amber-900'}`}>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${token ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`}></span>
                  <h3 className="font-extrabold text-xs tracking-wide uppercase">
                    {token ? "✅ गूगल ड्राइव सफलतापूर्वक अधिकृत (Authorized)" : "⚠️ गूगल ड्राइव प्रमाणीकरण आवश्यक (Authorization Required)"}
                  </h3>
                </div>
                <p className="text-[11px] leading-relaxed text-gray-500 max-w-2xl">
                  {token 
                    ? "आपका सुरक्षा सत्र सक्रिय है। आप गूगल शीट बना सकते हैं और प्रश्नों को सीधा पुल (Pull) और पुश (Push) कर सकते हैं।" 
                    : "सुरक्षा कारणों से पृष्ठ रीफ्रेश होने पर गूगल सत्र डिस्कनेक्ट हो जाता है। शीट से सीधे प्रश्न सिंक करने (डेटा लोड करने) के लिए कृपया गूगल ड्राइव ऑथराइज़ करें।"
                  }
                </p>
              </div>
              <button
                onClick={handleLogin}
                className={`px-4 py-2.5 rounded-xl font-bold text-[11px] flex items-center gap-1.5 transition shrink-0 shadow-sm cursor-pointer ${token ? 'bg-white text-emerald-800 border border-emerald-200 hover:bg-emerald-50' : 'bg-amber-600 text-white hover:bg-amber-700'}`}
              >
                <RefreshCw className={`h-3.5 w-3.5 ${sheetSyncing ? 'animate-spin' : ''}`} />
                {token ? "सत्र री-ऑथराइज़ करें" : "गूगल ड्राइव ऑथराइज़ करें (Authorize)"}
              </button>
            </div>

            {sheetSuccess && (
              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-emerald-800 text-xs flex items-start gap-2.5">
                <Check className="h-4.5 w-4.5 text-emerald-600 shrink-0 mt-0.5 animate-bounce" />
                <div>
                  <h4 className="font-bold">सफलता! (Success)</h4>
                  <p>{sheetSuccess}</p>
                </div>
              </div>
            )}

            {sheetError && (
              <div className="bg-red-50 border border-red-200 p-4 rounded-xl text-red-800 text-xs flex items-start gap-2.5">
                <AlertCircle className="h-4.5 w-4.5 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold">सिंक त्रुटि (Sync Error)</h4>
                  <p>{sheetError}</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* SECTION 1: PYQ PRACTICE */}
              <div className="border border-gray-100 rounded-2xl p-6 bg-gradient-to-br from-amber-50/10 to-amber-100/5 flex flex-col justify-between space-y-4 shadow-sm">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold">SECTION 1</span>
                    {spreadsheetIdPyq ? (
                      <span className="text-[9px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">सक्रिय (CONNECTED)</span>
                    ) : (
                      <span className="text-[9px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-bold">डिस्कनेक्टेड</span>
                    )}
                  </div>
                  <h3 className="text-sm font-extrabold text-gray-800 mt-2">पीवायक्यू प्रैक्टिस (PYQ Practice)</h3>
                  <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">
                    यह शीट विगत वर्षों की परीक्षाओं (PYQ) के प्रश्न सिंक करने हेतु है।
                  </p>

                  {spreadsheetIdPyq ? (
                    <div className="mt-4 space-y-3">
                      <div>
                        <span className="text-[10px] text-gray-400 font-bold">कनेक्टेड शीट आईडी:</span>
                        <code className="text-[10px] text-emerald-800 bg-emerald-50 px-2 py-1 rounded font-mono block max-w-full overflow-x-auto select-all mt-1">
                          {spreadsheetIdPyq}
                        </code>
                      </div>
                      <div className="flex gap-2">
                        <a
                          href={`https://docs.google.com/spreadsheets/d/${spreadsheetIdPyq}/edit`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 py-2 text-center bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-[10px] font-bold rounded-lg transition flex items-center justify-center gap-1 shadow-sm"
                        >
                          शीट खोलें <ExternalLink className="h-3 w-3 text-gray-400" />
                        </a>
                        <button
                          onClick={() => disconnectSheet('pyq')}
                          className="px-2.5 py-2 bg-red-50 hover:bg-red-100 text-red-600 text-[10px] font-bold rounded-lg transition"
                          title="डिस्कनेक्ट करें"
                        >
                          डिस्कनेक्ट
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 space-y-3">
                      <button
                        onClick={() => createNewSheet('pyq')}
                        disabled={sheetSyncing}
                        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-xl transition flex items-center justify-center gap-1 shadow shadow-emerald-600/10 cursor-pointer"
                      >
                        <PlusCircle className="h-3.5 w-3.5" /> नई शीट बनाकर कनेक्ट करें
                      </button>
                      <div className="relative flex py-1 items-center">
                        <div className="flex-grow border-t border-gray-100"></div>
                        <span className="flex-shrink mx-2 text-[10px] text-gray-300 font-bold">या</span>
                        <div className="flex-grow border-t border-gray-100"></div>
                      </div>
                      <div className="space-y-1.5">
                        <input
                          type="text"
                          placeholder="मौजूदा शीट आईडी दर्ज करें"
                          value={inputPyq}
                          onChange={(e) => setInputPyq(e.target.value)}
                          className="w-full p-2 text-[11px] border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
                        />
                        <button
                          onClick={() => connectExistingSheet('pyq')}
                          disabled={sheetSyncing || !inputPyq.trim()}
                          className="w-full py-2 bg-gray-800 hover:bg-gray-900 text-white font-bold rounded-lg text-[10px] transition cursor-pointer"
                        >
                          कनेक्ट करें
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {spreadsheetIdPyq && (
                  <div className="pt-3 border-t border-gray-100 space-y-2">
                    <button
                      onClick={() => handlePull('pyq')}
                      disabled={sheetSyncing}
                      className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg text-[11px] flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className={`h-3 w-3 ${sheetSyncing ? 'animate-spin' : ''}`} /> शीट से डेटा लोड करें (Pull)
                    </button>
                    <button
                      onClick={() => handlePush('pyq')}
                      disabled={sheetSyncing}
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[11px] flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Save className="h-3 w-3" /> शीट पर डेटा पुश करें (Push)
                    </button>
                  </div>
                )}
              </div>

              {/* SECTION 2: SUBJECT TEST */}
              <div className="border border-gray-100 rounded-2xl p-6 bg-gradient-to-br from-emerald-50/10 to-emerald-100/5 flex flex-col justify-between space-y-4 shadow-sm">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">SECTION 2</span>
                    {spreadsheetIdSubject ? (
                      <span className="text-[9px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">सक्रिय (CONNECTED)</span>
                    ) : (
                      <span className="text-[9px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-bold">डिस्कनेक्टेड</span>
                    )}
                  </div>
                  <h3 className="text-sm font-extrabold text-gray-800 mt-2">विषय टेस्ट (Subject Test)</h3>
                  <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">
                    यह शीट अध्यायवार/विषयवार टेस्ट के प्रश्नों के लिए उपयोग की जाती है।
                  </p>

                  {spreadsheetIdSubject ? (
                    <div className="mt-4 space-y-3">
                      <div>
                        <span className="text-[10px] text-gray-400 font-bold">कनेक्टेड शीट आईडी:</span>
                        <code className="text-[10px] text-emerald-800 bg-emerald-50 px-2 py-1 rounded font-mono block max-w-full overflow-x-auto select-all mt-1">
                          {spreadsheetIdSubject}
                        </code>
                      </div>
                      <div className="flex gap-2">
                        <a
                          href={`https://docs.google.com/spreadsheets/d/${spreadsheetIdSubject}/edit`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 py-2 text-center bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-[10px] font-bold rounded-lg transition flex items-center justify-center gap-1 shadow-sm"
                        >
                          शीट खोलें <ExternalLink className="h-3 w-3 text-gray-400" />
                        </a>
                        <button
                          onClick={() => disconnectSheet('subject')}
                          className="px-2.5 py-2 bg-red-50 hover:bg-red-100 text-red-600 text-[10px] font-bold rounded-lg transition"
                          title="डिस्कनेक्ट करें"
                        >
                          डिस्कनेक्ट
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 space-y-3">
                      <button
                        onClick={() => createNewSheet('subject')}
                        disabled={sheetSyncing}
                        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-xl transition flex items-center justify-center gap-1 shadow shadow-emerald-600/10 cursor-pointer"
                      >
                        <PlusCircle className="h-3.5 w-3.5" /> नई शीट बनाकर कनेक्ट करें
                      </button>
                      <div className="relative flex py-1 items-center">
                        <div className="flex-grow border-t border-gray-100"></div>
                        <span className="flex-shrink mx-2 text-[10px] text-gray-300 font-bold">या</span>
                        <div className="flex-grow border-t border-gray-100"></div>
                      </div>
                      <div className="space-y-1.5">
                        <input
                          type="text"
                          placeholder="मौजूदा शीट आईडी दर्ज करें"
                          value={inputSubject}
                          onChange={(e) => setInputSubject(e.target.value)}
                          className="w-full p-2 text-[11px] border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
                        />
                        <button
                          onClick={() => connectExistingSheet('subject')}
                          disabled={sheetSyncing || !inputSubject.trim()}
                          className="w-full py-2 bg-gray-800 hover:bg-gray-900 text-white font-bold rounded-lg text-[10px] transition cursor-pointer"
                        >
                          कनेक्ट करें
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {spreadsheetIdSubject && (
                  <div className="pt-3 border-t border-gray-100 space-y-2">
                    <button
                      onClick={() => handlePull('subject')}
                      disabled={sheetSyncing}
                      className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg text-[11px] flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className={`h-3 w-3 ${sheetSyncing ? 'animate-spin' : ''}`} /> शीट से डेटा लोड करें (Pull)
                    </button>
                    <button
                      onClick={() => handlePush('subject')}
                      disabled={sheetSyncing}
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[11px] flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Save className="h-3 w-3" /> शीट पर डेटा पुश करें (Push)
                    </button>
                  </div>
                )}
              </div>

              {/* SECTION 3: CURRENT AFFAIRS */}
              <div className="border border-gray-100 rounded-2xl p-6 bg-gradient-to-br from-blue-50/10 to-blue-100/5 flex flex-col justify-between space-y-4 shadow-sm">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-bold">SECTION 3</span>
                    {spreadsheetIdCA ? (
                      <span className="text-[9px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">सक्रिय (CONNECTED)</span>
                    ) : (
                      <span className="text-[9px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-bold">डिस्कनेक्टेड</span>
                    )}
                  </div>
                  <h3 className="text-sm font-extrabold text-gray-800 mt-2">करंत अफेयर्स (Current Affairs)</h3>
                  <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">
                    यह शीट मासिक करंट अफेयर्स के टॉपिक्स और सामग्री को सिंक करने के लिए है।
                  </p>

                  {spreadsheetIdCA ? (
                    <div className="mt-4 space-y-3">
                      <div>
                        <span className="text-[10px] text-gray-400 font-bold">कनेक्टेड शीट आईडी:</span>
                        <code className="text-[10px] text-emerald-800 bg-emerald-50 px-2 py-1 rounded font-mono block max-w-full overflow-x-auto select-all mt-1">
                          {spreadsheetIdCA}
                        </code>
                      </div>
                      <div className="flex gap-2">
                        <a
                          href={`https://docs.google.com/spreadsheets/d/${spreadsheetIdCA}/edit`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 py-2 text-center bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-[10px] font-bold rounded-lg transition flex items-center justify-center gap-1 shadow-sm"
                        >
                          शीट खोलें <ExternalLink className="h-3 w-3 text-gray-400" />
                        </a>
                        <button
                          onClick={() => disconnectSheet('ca')}
                          className="px-2.5 py-2 bg-red-50 hover:bg-red-100 text-red-600 text-[10px] font-bold rounded-lg transition"
                          title="डिस्कनेक्ट करें"
                        >
                          डिस्कनेक्ट
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 space-y-3">
                      <button
                        onClick={() => createNewSheet('ca')}
                        disabled={sheetSyncing}
                        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-xl transition flex items-center justify-center gap-1 shadow shadow-emerald-600/10 cursor-pointer"
                      >
                        <PlusCircle className="h-3.5 w-3.5" /> नई शीट बनाकर कनेक्ट करें
                      </button>
                      <div className="relative flex py-1 items-center">
                        <div className="flex-grow border-t border-gray-100"></div>
                        <span className="flex-shrink mx-2 text-[10px] text-gray-300 font-bold">या</span>
                        <div className="flex-grow border-t border-gray-100"></div>
                      </div>
                      <div className="space-y-1.5">
                        <input
                          type="text"
                          placeholder="मौजूदा शीट आईडी दर्ज करें"
                          value={inputCA}
                          onChange={(e) => setInputCA(e.target.value)}
                          className="w-full p-2 text-[11px] border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
                        />
                        <button
                          onClick={() => connectExistingSheet('ca')}
                          disabled={sheetSyncing || !inputCA.trim()}
                          className="w-full py-2 bg-gray-800 hover:bg-gray-900 text-white font-bold rounded-lg text-[10px] transition cursor-pointer"
                        >
                          कनेक्ट करें
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {spreadsheetIdCA && (
                  <div className="pt-3 border-t border-gray-100 space-y-2">
                    <button
                      onClick={() => handlePull('ca')}
                      disabled={sheetSyncing}
                      className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg text-[11px] flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className={`h-3 w-3 ${sheetSyncing ? 'animate-spin' : ''}`} /> शीट से डेटा लोड करें (Pull)
                    </button>
                    <button
                      onClick={() => handlePush('ca')}
                      disabled={sheetSyncing}
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[11px] flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Save className="h-3 w-3" /> शीट पर डेटा पुश करें (Push)
                    </button>
                  </div>
                )}
              </div>

            </div>

            <div className="p-5 bg-gray-50 border border-gray-100 rounded-2xl space-y-2.5 text-xs leading-relaxed text-gray-500 font-sans">
              <p className="font-bold text-gray-700">💡 यह कैसे कार्य करता है? (How it works?)</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>प्रश्नों और करंट अफेयर्स के डेटाबेस को अलग-अलग रखने से सिंक प्रक्रिया तेज़ और व्यवस्थित होती है।</li>
                <li>जब आप <strong>"डेटा लोड करें (Pull)"</strong> करते हैं, तो सर्वर डेटाबेस का वह विशिष्ट भाग शीट के रिकॉर्ड्स से अपडेट हो जाता है।</li>
                <li>जब आप <strong>"डेटा पुश करें (Push)"</strong> करते हैं, तो सर्वर का वर्तमान लाइव डेटा शीट पर री-राइट हो जाता है।</li>
              </ul>
            </div>
          </div>
        )}

        {activeSubTab === 'excel' && (
          /* EXCEL UPLOAD SECTION */
          <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8 space-y-6">
            <div className="flex justify-between items-start border-b border-gray-100 pb-4 flex-wrap gap-4">
              <div>
                <h2 className="text-lg font-bold text-gray-800">Bulk Question Importer</h2>
                <p className="text-xs text-gray-400 mt-1">
                  Upload an Excel spreadsheet (.xlsx, .xls) or comma-separated CSV matching our columns template to add hundreds of questions instantly.
                </p>
              </div>

              <button
                onClick={handleDownloadTemplate}
                className="px-4 py-2 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="h-4 w-4" /> Download Excel Template
              </button>
            </div>

            {/* Error & Success Messages */}
            {uploadSuccessMsg && (
              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-emerald-800 text-xs flex items-start gap-2.5">
                <Check className="h-4.5 w-4.5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold">Import Completed Successfully!</h4>
                  <p>{uploadSuccessMsg}</p>
                </div>
              </div>
            )}

            {uploadErrorMsg && (
              <div className="bg-red-50 border border-red-200 p-4 rounded-xl text-red-800 text-xs flex items-start gap-2.5">
                <AlertCircle className="h-4.5 w-4.5 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold">Parsing / Validation Failed</h4>
                  <p className="leading-relaxed whitespace-pre-wrap">{uploadErrorMsg}</p>
                </div>
              </div>
            )}

            {/* Drag & Drop File Upload Input */}
            <div className="border-2 border-dashed border-gray-200 rounded-2xl hover:border-amber-400 transition cursor-pointer p-8 text-center bg-gray-50/20">
              <input 
                type="file" 
                accept=".xlsx, .xls, .csv" 
                onChange={handleFileUpload}
                className="hidden" 
                id="excel-file-picker" 
              />
              <label htmlFor="excel-file-picker" className="cursor-pointer block space-y-4">
                <div className="p-4 bg-amber-50 text-amber-700 rounded-full w-14 h-14 mx-auto flex items-center justify-center">
                  <FileSpreadsheet className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-bold text-gray-800">
                    {uploadLoading ? 'Processing file... please wait' : 'Choose File or Drag it here'}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-1 font-mono">Supports Microsoft Excel (.xlsx, .xls) & standard UTF-8 CSV</p>
                </div>
              </label>
            </div>

            {/* Format Instructions Checklist */}
            <div className="bg-amber-50/20 border border-amber-100 rounded-xl p-5 space-y-3">
              <h4 className="text-xs font-bold text-amber-900 flex items-center gap-1.5 uppercase tracking-wider">
                <AlertCircle className="h-4.5 w-4.5" /> Spreadsheet Schema Blueprint
              </h4>
              <p className="text-xs text-gray-500 leading-relaxed font-sans">
                To guarantee zero import collision or indexing failures, your uploaded table must strictly match these exact column headers:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 text-[10px] font-semibold text-gray-600 font-sans">
                <div className="flex items-center gap-1 bg-white p-2 rounded-lg border border-gray-100">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0"></span>
                  <span>text_hi (Hindi Statement)*</span>
                </div>
                <div className="flex items-center gap-1 bg-white p-2 rounded-lg border border-gray-100">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0"></span>
                  <span>option_hi_1 to option_hi_5*</span>
                </div>
                <div className="flex items-center gap-1 bg-white p-2 rounded-lg border border-gray-100">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0"></span>
                  <span>correctAnswer (0 to 4)*</span>
                </div>
                <div className="flex items-center gap-1 bg-white p-2 rounded-lg border border-gray-100">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0"></span>
                  <span>subject / topic / exam / year</span>
                </div>
                <div className="flex items-center gap-1 bg-white p-2 rounded-lg border border-gray-100">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0"></span>
                  <span>explanation_hi (Explanation)</span>
                </div>
              </div>
              <p className="text-[10px] text-gray-400 italic">Fields marked with (*) are strictly required. Missing values will trigger parsing rejection.</p>
            </div>
          </div>
        )}

        {activeSubTab === 'manual' && (
          /* MANUAL ENTRY FORM SECTION */
          <form onSubmit={handleSubmitManual} className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8 space-y-6">
            <div className="border-b border-gray-100 pb-4">
              <h2 className="text-lg font-bold text-gray-800">Add Question Manually</h2>
              <p className="text-xs text-gray-400 mt-1">
                Manually key-in single bilingual MCQ practice items directly into the live quiz database.
              </p>
            </div>

            {manualSuccess && (
              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
                <Check className="h-5 w-5 text-emerald-600 shrink-0" />
                <span>Question saved and live successfully! You can add another below.</span>
              </div>
            )}

            {/* Question Hindi textarea */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-700 block">Question (Hindi)*</label>
              <textarea
                required
                value={textHi}
                onChange={(e) => setTextHi(e.target.value)}
                placeholder="उदा. छत्तीसगढ़ की सबसे ऊंची चोटी कौन सी है?"
                rows={4}
                className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs sm:text-sm leading-relaxed"
              />
            </div>

            {/* Options configuration */}
            <div className="space-y-3.5">
              <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Answer Choice Options</h3>
              <p className="text-[11px] text-gray-400 leading-none">Provide 4 options (Option A, B, C, D) for the question.</p>

              <div className="space-y-2">
                {optionsHi.map((_, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-gray-50/40 p-3 rounded-xl border border-gray-100">
                    <span className="font-sans text-xs font-bold bg-amber-100 text-amber-800 w-6 h-6 rounded-lg flex items-center justify-center shrink-0">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <input
                      type="text"
                      placeholder={`Option ${String.fromCharCode(65 + idx)} (Hindi)`}
                      value={optionsHi[idx]}
                      onChange={(e) => handleOptionHiChange(idx, e.target.value)}
                      className="w-full p-2.5 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Metadata (Subject, Correct Index, Exam etc) */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 pt-2">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-700 block">Correct Choice*</label>
                <select
                  value={correctAnswer}
                  onChange={(e) => setCorrectAnswer(Number(e.target.value))}
                  className="w-full p-2.5 border border-gray-200 rounded-xl focus:outline-none text-xs bg-white font-sans font-bold"
                >
                  {optionsHi.map((_, idx) => (
                    <option key={idx} value={idx}>Option {String.fromCharCode(65 + idx)}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold text-gray-700 block">Subject Classification*</label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full p-2.5 border border-gray-200 rounded-xl focus:outline-none text-xs bg-white font-sans font-semibold"
                >
                  {subjectsPreset.map(sub => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-700 block">Topic / Chapter*</label>
                <input
                  required
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g., Geographics, Rivers, Tribes"
                  className="w-full p-2.5 border border-gray-200 rounded-xl focus:outline-none text-xs"
                />
              </div>

              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-700">Exam</label>
                    <input
                      type="text"
                      value={exam}
                      onChange={(e) => setExam(e.target.value)}
                      placeholder="CGPSC Pre"
                      className="w-full p-2.5 border border-gray-200 rounded-xl focus:outline-none text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-700">Year</label>
                    <input
                      type="number"
                      value={year}
                      onChange={(e) => setYear(Number(e.target.value))}
                      className="w-full p-2.5 border border-gray-200 rounded-xl focus:outline-none text-xs font-sans"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Explanation Row */}
            <div className="space-y-2 pt-2">
              <label className="text-xs font-bold text-gray-700 block">Detailed Explanation (Hindi)</label>
              <textarea
                value={explanationHi}
                onChange={(e) => setExplanationHi(e.target.value)}
                placeholder="उदा. वीर नारायण सिंह सोनाखान के जमींदार थे और छत्तीसगढ़ के पहले शहीद हैं..."
                rows={3}
                className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs leading-relaxed font-sans"
              />
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <button
                type="submit"
                disabled={submittingManual}
                className="px-6 py-2.5 bg-amber-600 text-white hover:bg-amber-700 rounded-xl text-xs font-bold shadow transition flex items-center gap-1 cursor-pointer"
              >
                {submittingManual ? 'Saving...' : 'Add Question'}
              </button>
            </div>
          </form>
        )}

        {activeSubTab === 'list' && (
          /* QUESTION LIST VIEWER SECTION */
          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
            
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3 border-b border-gray-100 pb-4">
              <h2 className="text-base font-bold text-gray-800">All Questions in Database ({filteredQuestions.length})</h2>
              
              {/* Search Questions */}
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by question, subject, or topic..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 w-full"
                />
              </div>
            </div>

            {/* List Table Grid layout */}
            <div className="space-y-3">
              {filteredQuestions.map((q, qIdx) => {
                const isExpanded = expandedQuestion === q.id;
                return (
                  <div key={q.id} className="border border-gray-100 rounded-xl overflow-hidden bg-white hover:border-amber-200 transition">
                    
                    {/* Compact Item Header */}
                    <div 
                      className="p-4 flex items-start justify-between gap-4 cursor-pointer select-none"
                    >
                      <div className="space-y-1 flex-1" onClick={() => setExpandedQuestion(isExpanded ? null : q.id)}>
                        <div className="flex flex-wrap items-center gap-1.5 text-[9px] font-bold">
                          <span className="bg-amber-50 text-amber-800 px-2 py-0.5 rounded">
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
                        <h4 className="text-xs sm:text-sm font-semibold text-gray-800 line-clamp-1 leading-relaxed mt-1 font-sans">
                          {q.text_hi}
                        </h4>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <button
                          onClick={() => handleDeleteQuestion(q.id)}
                          className="p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-lg transition shrink-0 cursor-pointer"
                          title="हटाएं (Delete)"
                        >
                          <Trash className="h-4 w-4" />
                        </button>
                        <div className="text-gray-400 shrink-0" onClick={() => setExpandedQuestion(isExpanded ? null : q.id)}>
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </div>
                      </div>
                    </div>

                    {/* Detailed expandable card info */}
                    {isExpanded && (
                      <div className="px-4 pb-4 pt-1 border-t border-gray-100 bg-gray-50/20 space-y-4 text-xs">
                        {q.text_en && (
                          <div className="p-3 bg-white rounded-lg border border-gray-100 italic text-gray-500 font-sans">
                            {q.text_en}
                          </div>
                        )}

                        {/* Rendering Options list */}
                        <div className="space-y-2">
                          <p className="font-bold text-gray-600 uppercase tracking-wider text-[10px]">Options:</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {q.options_hi.slice(0, 4).map((optHi, optIdx) => {
                              const optEn = q.options_en?.[optIdx];
                              const isCorrect = optIdx === q.correctAnswer;
                              return (
                                <div 
                                  key={optIdx}
                                  className={`p-2 rounded-lg border text-[11px] flex items-center justify-between ${
                                    isCorrect ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-bold' : 'bg-white border-gray-100 text-gray-700'
                                  }`}
                                >
                                  <span className="font-sans">{String.fromCharCode(65 + optIdx)}. {optHi} {optEn ? `(${optEn})` : ''}</span>
                                  {isCorrect && <Check className="h-4.5 w-4.5 text-emerald-600" />}
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Solution card */}
                        {q.explanation_hi && (
                          <div className="p-3.5 bg-amber-50/20 border border-amber-100 rounded-lg">
                            <p className="font-bold text-amber-900 mb-1">Explanation / Solution:</p>
                            <p className="text-gray-600 leading-relaxed font-sans">{q.explanation_hi}</p>
                          </div>
                        )}
                      </div>
                    )}

                  </div>
                );
              })}

              {filteredQuestions.length === 0 && (
                <p className="text-center py-8 text-gray-400 text-xs">No questions found matching your search term.</p>
              )}
            </div>

          </div>
        )}

        {/* CURRENT AFFAIRS MANAGER SUBTAB */}
        {activeSubTab === 'currentAffairs' && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8 space-y-8 animate-in fade-in duration-200">
            <div className="border-b border-gray-100 pb-4">
              <h2 className="text-lg font-bold text-gray-800">करंट अफेयर्स प्रबंधन (Current Affairs Manager)</h2>
              <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                यहाँ से आप मासिक समसामयिकी (Monthly Current Affairs) आर्टिकल्स जोड़, संशोधित या हटा सकते हैं। ये सीधे यूज़र के करंट अफेयर्स सेक्शन में दिखेंगे।
              </p>
            </div>

            {caSuccessMsg && (
              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
                <Check className="h-4.5 w-4.5 text-emerald-600 shrink-0" />
                <p className="font-bold">{caSuccessMsg}</p>
              </div>
            )}

            {/* Current Affairs Submission Form */}
            <form onSubmit={handleSubmitCurrentAffairs} className="space-y-4 bg-gray-50/55 p-5 rounded-2xl border border-gray-100">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">
                {caEditingId ? "करंट अफेयर्स संपादित करें (Edit Article)" : "नया करंट अफेयर्स जोड़ें (Add New Article)"}
              </h3>
              
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wide block">माह (Month)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., July 2026"
                  value={caMonth}
                  onChange={(e) => setCaMonth(e.target.value)}
                  className="max-w-md w-full p-2.5 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-800 font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wide block">विवरण - हिंदी में (Content - Hindi) *</label>
                <textarea
                  required
                  rows={6}
                  placeholder="करंट अफेयर्स का विस्तृत विवरण हिंदी में दर्ज करें..."
                  value={caContentHi}
                  onChange={(e) => setCaContentHi(e.target.value)}
                  className="w-full p-2.5 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-800 font-sans"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  disabled={caLoading}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-6 py-2.5 rounded-xl text-xs transition flex items-center gap-1.5 shadow cursor-pointer shadow-amber-600/10"
                >
                  <Save className="h-4 w-4" />
                  {caLoading ? "सहेजा जा रहा है..." : caEditingId ? "अपडेट करें (Update)" : "जोड़ें (Add Article)"}
                </button>
                {caEditingId && (
                  <button
                    type="button"
                    onClick={() => {
                      setCaEditingId(null);
                      setCaContentHi('');
                    }}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold px-4 py-2.5 rounded-xl text-xs transition cursor-pointer"
                  >
                    रद्द करें (Cancel)
                  </button>
                )}
              </div>
            </form>

            {/* List of existing current affairs */}
            <div className="space-y-3">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">वर्तमान लेखों की सूची (Saved Articles List)</h3>
              
              <div className="grid grid-cols-1 gap-3">
                {currentAffairs.map((item) => (
                  <div key={item.id} className="border border-gray-100 rounded-xl bg-white hover:border-amber-200 transition p-4 flex items-start justify-between gap-4">
                    <div className="space-y-1 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5 text-[9px] font-bold">
                        <span className="bg-amber-50 text-amber-800 px-2.5 py-0.5 rounded-full font-bold">
                          {item.month}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 leading-relaxed font-sans pt-1 line-clamp-3">{item.content_hi}</p>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleEditCurrentAffairs(item)}
                        className="p-1.5 hover:bg-amber-50 text-gray-400 hover:text-amber-700 rounded-lg transition cursor-pointer"
                        title="संपादित करें (Edit)"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteCurrentAffairs(item.id)}
                        className="p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-lg transition cursor-pointer"
                        title="हटाएं (Delete)"
                      >
                        <Trash className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}

                {currentAffairs.length === 0 && (
                  <p className="text-center py-8 text-gray-400 text-xs">कोई करंट अफेयर्स लेख उपलब्ध नहीं है। नया लेख जोड़ने के लिए ऊपर दिए गए फॉर्म का उपयोग करें।</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
