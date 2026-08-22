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
  Unlink,
  Star,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Sliders,
  Filter,
  Wand2,
  Layers,
  Settings2,
  Code2,
  BarChart3,
  Users,
  CheckSquare,
  Square,
  X
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Question, ExamInfo, DailyPracticeSet, DailyPracticeQuestion, DailyPracticeCategory } from '../types';
import { parseCorrectAnswer } from '../utils/quizHelpers';
import { RichTextRenderer } from './RichTextRenderer';
import AdminAnalyticsStats from './AdminAnalyticsStats';
import { auth, googleSignIn, logout, getAccessToken, setAccessToken } from '../lib/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';

interface AdminPanelProps {
  questions: Question[];
  onRefreshQuestions: (showLoading?: boolean) => void;
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

  // Passcode Auth state for custom domain support
  const [passcodeInput, setPasscodeInput] = useState('');
  const [passcodeError, setPasscodeError] = useState<string | null>(null);
  const [isPasscodeAdmin, setIsPasscodeAdmin] = useState<boolean>(() => {
    return typeof window !== 'undefined' && localStorage.getItem('admin_passcode_authed') === 'true';
  });
  const [passcodeVerifying, setPasscodeVerifying] = useState(false);

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
  const [activeSubTab, setActiveSubTab] = useState<'sheets' | 'excel' | 'manual' | 'list' | 'currentAffairs' | 'aboutExam' | 'proofread' | 'dailyPractice' | 'subjectWise' | 'pyq' | 'analytics' | 'studentLeads'>('dailyPractice');

  // Student Leads & Feedbacks State
  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(false);
  
  // Google Apps Script Webhook State
  const [googleAppsScriptUrl, setGoogleAppsScriptUrl] = useState<string>('');
  const [inputAppsScriptUrl, setInputAppsScriptUrl] = useState<string>('');
  const [isAppsScriptModalOpen, setIsAppsScriptModalOpen] = useState(false);
  const [appsScriptSaving, setAppsScriptSaving] = useState(false);
  const [appsScriptSuccess, setAppsScriptSuccess] = useState<string | null>(null);

  // Subject-Wise HTML Bulk & Manual Question States
  const [subSubject, setSubSubject] = useState('छत्तीसगढ़ सामान्य ज्ञान');
  const [subCustomSubject, setSubCustomSubject] = useState('');
  const [subTopic, setSubTopic] = useState('सामान्य परिचय एवं इतिहास');
  const [subInputMode, setSubInputMode] = useState<'bulkHtml' | 'manual' | 'importDp' | 'searchDelete'>('bulkHtml');
  const [subBulkHtmlText, setSubBulkHtmlText] = useState<string>('');
  const [subParsedQuestions, setSubParsedQuestions] = useState<Question[]>([]);
  const [subSuccessMsg, setSubSuccessMsg] = useState<string | null>(null);
  const [subErrorMsg, setSubErrorMsg] = useState<string | null>(null);
  const [subSaving, setSubSaving] = useState(false);
  const [subPreviewIndex, setSubPreviewIndex] = useState<number | null>(null);
  const [subSingleTextHi, setSubSingleTextHi] = useState('');
  const [subSingleTextEn, setSubSingleTextEn] = useState('');
  const [subSingleOptionsHi, setSubSingleOptionsHi] = useState<string[]>(['', '', '', '']);
  const [subSingleCorrectAnswer, setSubSingleCorrectAnswer] = useState<number>(0);
  const [subSingleExplanationHi, setSubSingleExplanationHi] = useState('');
  const [subDpImportSetId, setSubDpImportSetId] = useState<string>('');
  const [subDpImportLoading, setSubDpImportLoading] = useState<boolean>(false);

  // Subject-Wise Keyword Search & Bulk Delete States
  const [kwSearchQuery, setKwSearchQuery] = useState<string>('');
  const [kwSearchSubject, setKwSearchSubject] = useState<string>('all');
  const [kwSearchTopic, setKwSearchTopic] = useState<string>('all');
  const [kwSearchScope, setKwSearchScope] = useState<'all' | 'text' | 'topic' | 'explanation'>('all');
  const [kwSelectedIds, setKwSelectedIds] = useState<Set<string>>(new Set());
  const [kwDeleting, setKwDeleting] = useState<boolean>(false);
  const [kwExpandedId, setKwExpandedId] = useState<string | null>(null);
  const [kwModalConfirm, setKwModalConfirm] = useState<{ open: boolean; type: 'allKeyword' | 'selected' | 'single'; keyword?: string; count: number; ids?: string[] } | null>(null);

  // List tab multi-selection state
  const [listSelectedIds, setListSelectedIds] = useState<Set<string>>(new Set());

  // PYQ HTML Bulk & Manual Question States
  const [pyqExam, setPyqExam] = useState('CGPSC Prelims');
  const [pyqCustomExam, setPyqCustomExam] = useState('');
  const [pyqYear, setPyqYear] = useState<number>(2024);
  const [pyqSubject, setPyqSubject] = useState('छत्तीसगढ़ सामान्य ज्ञान');
  const [pyqTopic, setPyqTopic] = useState('विगत वर्ष प्रश्न');
  const [pyqInputMode, setPyqInputMode] = useState<'bulkHtml' | 'manual'>('bulkHtml');
  const [pyqBulkHtmlText, setPyqBulkHtmlText] = useState<string>('');
  const [pyqParsedQuestions, setPyqParsedQuestions] = useState<Question[]>([]);
  const [pyqSuccessMsg, setPyqSuccessMsg] = useState<string | null>(null);
  const [pyqErrorMsg, setPyqErrorMsg] = useState<string | null>(null);
  const [pyqSaving, setPyqSaving] = useState(false);
  const [pyqPreviewIndex, setPyqPreviewIndex] = useState<number | null>(null);
  const [pyqSingleTextHi, setPyqSingleTextHi] = useState('');
  const [pyqSingleTextEn, setPyqSingleTextEn] = useState('');
  const [pyqSingleOptionsHi, setPyqSingleOptionsHi] = useState<string[]>(['', '', '', '']);
  const [pyqSingleCorrectAnswer, setPyqSingleCorrectAnswer] = useState<number>(0);
  const [pyqSingleExplanationHi, setPyqSingleExplanationHi] = useState('');

  // Proofreading & Question Audit States
  const [auditType, setAuditType] = useState<'all' | 'pyq' | 'subject'>('all');
  const [auditStatus, setAuditStatus] = useState<'all' | 'unreviewed' | 'reviewed' | 'warning'>('all');
  const [auditSubject, setAuditSubject] = useState<string>('all');
  const [auditExam, setAuditExam] = useState<string>('all');
  const [auditSearch, setAuditSearch] = useState<string>('');
  const [auditCurrentIndex, setAuditCurrentIndex] = useState<number>(0);
  const [auditLayoutMode, setAuditLayoutMode] = useState<'focus' | 'table'>('focus');
  const [auditEditingQuestion, setAuditEditingQuestion] = useState<any | null>(null);
  const [auditSaving, setAuditSaving] = useState(false);
  const [auditSaveMsg, setAuditSaveMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  
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

  // Daily Practice States & Handlers
  const [dpList, setDpList] = useState<DailyPracticeSet[]>([]);
  const [dpLoading, setDpLoading] = useState(false);
  const [dpEditingId, setDpEditingId] = useState<string | null>(null);
  const [dpDate, setDpDate] = useState(new Date().toISOString().split('T')[0]);
  const [dpTitle, setDpTitle] = useState('');
  const [dpDescription, setDpDescription] = useState('');
  const [dpSubject, setDpSubject] = useState('छत्तीसगढ़ सामान्य ज्ञान एवं समसामयिकी');
  const [dpCategory, setDpCategory] = useState<string>('');
  const [dpTargetExam, setDpTargetExam] = useState('CGPSC / व्यापमं');
  const [dpDuration, setDpDuration] = useState<number>(20);
  const [dpQuestions, setDpQuestions] = useState<DailyPracticeQuestion[]>([]);
  const [dpBulkHtmlText, setDpBulkHtmlText] = useState<string>('');
  const [dpInputMode, setDpInputMode] = useState<'form' | 'bulkHtml'>('form');
  const [dpSuccessMsg, setDpSuccessMsg] = useState<string | null>(null);
  const [dpErrorMsg, setDpErrorMsg] = useState<string | null>(null);
  const [dpSaving, setDpSaving] = useState(false);
  const [dpPreviewQuestionIndex, setDpPreviewQuestionIndex] = useState<number | null>(null);

  // Daily Practice to Subject-Wise Sync States
  const [dpAlsoAddToSubjectWise, setDpAlsoAddToSubjectWise] = useState<boolean>(true);
  const [dpSyncSubject, setDpSyncSubject] = useState<string>('छत्तीसगढ़ सामान्य ज्ञान');
  const [dpCustomSyncSubject, setDpCustomSyncSubject] = useState<string>('');
  const [dpSyncTopic, setDpSyncTopic] = useState<string>('');
  const [dpBatchSyncing, setDpBatchSyncing] = useState<boolean>(false);
  const [dpSyncModalSet, setDpSyncModalSet] = useState<DailyPracticeSet | null>(null);
  const [dpSyncModalSubject, setDpSyncModalSubject] = useState<string>('छत्तीसगढ़ सामान्य ज्ञान');
  const [dpSyncModalCustomSubject, setDpSyncModalCustomSubject] = useState<string>('');
  const [dpSyncModalTopic, setDpSyncModalTopic] = useState<string>('');
  const [dpSyncModalSaving, setDpSyncModalSaving] = useState<boolean>(false);

  // Daily Practice Categories States & Handlers
  const [dpCategories, setDpCategories] = useState<DailyPracticeCategory[]>([]);
  const [catName, setCatName] = useState('');
  const [catSubLabel, setCatSubLabel] = useState('');
  const [catDescription, setCatDescription] = useState('');
  const [catIconName, setCatIconName] = useState('GraduationCap');
  const [catBadgeColor, setCatBadgeColor] = useState('bg-emerald-100 text-emerald-900 border-emerald-300');
  const [catSaving, setCatSaving] = useState(false);
  const [showCatModal, setShowCatModal] = useState(false);

  const fetchDpCategories = async () => {
    try {
      const res = await fetch('/api/daily-practice-categories');
      if (res.ok) {
        const data: DailyPracticeCategory[] = await res.json();
        setDpCategories(data);
        if (data && data.length > 0) {
          setDpCategory(prev => {
            if (!prev || !data.some(c => c.name === prev)) {
              return data[0].name;
            }
            return prev;
          });
        }
      }
    } catch (err) {
      console.error("Failed to fetch daily practice categories:", err);
    }
  };

  const handleSaveCategory = async () => {
    const trimmedCatName = catName.trim();
    if (!trimmedCatName) {
      alert("कृपया विषय / पद श्रेणी का नाम दर्ज करें।");
      return;
    }
    setCatSaving(true);
    try {
      const res = await fetch('/api/daily-practice-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: trimmedCatName,
          subLabel: catSubLabel.trim() || 'Exam Practice Sector',
          description: catDescription.trim() || `${trimmedCatName} परीक्षा हेतु विशेष प्रश्नोत्तरी एवं अभ्यास सेट`,
          iconName: catIconName,
          badgeColor: catBadgeColor
        })
      });
      if (res.ok) {
        const updatedCats = await res.json();
        setDpCategories(updatedCats);
        setDpCategory(trimmedCatName); // Instantly set as active category for adding practice sets
        setCatName('');
        setCatSubLabel('');
        setCatDescription('');
        setShowCatModal(false);
        setDpSuccessMsg(`नई विषय/पद श्रेणी "${trimmedCatName}" सफलतापूर्वक जुड़ गई है! नीचे दिए फॉर्म से इसके लिए प्रश्न सेट सहेजें।`);
      } else {
        alert("श्रेणी कार्ड सहेजने में विफल।");
      }
    } catch (err: any) {
      alert("त्रुटि: " + err.message);
    } finally {
      setCatSaving(false);
    }
  };

  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'category' | 'allCategories' | 'dpSet'; id?: string; name?: string } | null>(null);

  const handleDeleteCategory = async (catId: string, name: string) => {
    try {
      const targetId = catId || name;
      const res = await fetch(`/api/daily-practice-categories/${encodeURIComponent(targetId)}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        const updatedCats: DailyPracticeCategory[] = await res.json();
        setDpCategories(updatedCats);
        if (updatedCats.length > 0) {
          setDpCategory(updatedCats[0].name);
        } else {
          setDpCategory('');
        }
        setDpSuccessMsg(`श्रेणी कार्ड "${name}" सफलतापूर्वक हटा दिया गया है!`);
      } else {
        setDpErrorMsg("श्रेणी हटाने में विफल।");
      }
    } catch (err: any) {
      setDpErrorMsg("त्रुटि: " + err.message);
    }
  };

  const handleDeleteAllCategories = async () => {
    try {
      const res = await fetch('/api/daily-practice-categories-all', {
        method: 'DELETE'
      });
      if (res.ok) {
        setDpCategories([]);
        setDpCategory('');
        setDpSuccessMsg("सभी विषय/पद श्रेणी कार्ड्स सफलतापूर्वक हटा दिए गए हैं!");
      } else {
        setDpErrorMsg("श्रेणी हटाने में विफल।");
      }
    } catch (err: any) {
      setDpErrorMsg("त्रुटि: " + err.message);
    }
  };

  const fetchDailyPractice = async () => {
    setDpLoading(true);
    try {
      const res = await fetch('/api/daily-practice');
      if (res.ok) {
        const data = await res.json();
        setDpList(data);
      }
    } catch (err) {
      console.error("Failed to fetch daily practice sets:", err);
    } finally {
      setDpLoading(false);
    }
  };

  const handleResetDpForm = () => {
    setDpEditingId(null);
    setDpDate(new Date().toISOString().split('T')[0]);
    setDpTitle('');
    setDpDescription('');
    setDpSubject('छत्तीसगढ़ सामान्य ज्ञान एवं समसामयिकी');
    if (dpCategories.length > 0) {
      setDpCategory(dpCategories[0].name);
    } else {
      setDpCategory('');
    }
    setDpTargetExam('CGPSC / व्यापमं');
    setDpDuration(20);
    setDpQuestions([]);
    setDpBulkHtmlText('');
    setDpSuccessMsg(null);
    setDpErrorMsg(null);
  };

  const handleEditDpSet = (set: DailyPracticeSet) => {
    setDpEditingId(set.id);
    setDpDate(set.date || new Date().toISOString().split('T')[0]);
    setDpTitle(set.title || '');
    setDpDescription(set.description || '');
    setDpSubject(set.subject || 'छत्तीसगढ़ सामान्य ज्ञान एवं समसामयिकी');
    setDpCategory(set.category || (dpCategories.length > 0 ? dpCategories[0].name : ''));
    setDpTargetExam(set.targetExam || 'CGPSC / व्यापमं');
    setDpDuration(set.durationMinutes || 20);
    setDpQuestions(set.questions || []);
    setDpBulkHtmlText('');
    setDpInputMode('form');
    setDpSuccessMsg(null);
    setDpErrorMsg(null);
    const el = document.getElementById('dp-set-form');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 300, behavior: 'smooth' });
    }
  };

  const handleDeleteDpSet = async (id: string) => {
    try {
      const res = await fetch(`/api/daily-practice/${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (res.ok) {
        setDpList(prev => prev.filter(item => item.id !== id));
        setDpSuccessMsg("डेली प्रैक्टिस सेट सफलतापूर्वक हटा दिया गया है!");
        if (dpEditingId === id) {
          handleResetDpForm();
        }
      } else {
        setDpErrorMsg("सेट हटाने में विफल।");
      }
    } catch (err: any) {
      setDpErrorMsg("त्रुटि: " + err.message);
    }
  };

  const handleAddDpQuestion = () => {
    const qCount = dpQuestions.length + 1;
    const newQ: DailyPracticeQuestion = {
      id: `dpq-${Date.now()}-${qCount}`,
      questionHtml: `<b>प्रश्न ${qCount}:</b> यहाँ प्रश्न का एचटीएमएल (HTML) या प्लेन टेक्स्ट लिखें...`,
      optionsHtml: ["विकल्प A", "विकल्प B", "विकल्प C", "विकल्प D"],
      correctAnswer: 0,
      explanationHtml: `<b>व्याख्या:</b> उत्तर की विस्तृत व्याख्या यहाँ लिखें...`
    };
    setDpQuestions([...dpQuestions, newQ]);
  };

  const handleRemoveDpQuestion = (idx: number) => {
    const updated = dpQuestions.filter((_, i) => i !== idx);
    setDpQuestions(updated);
  };

  const handleUpdateDpQuestion = (idx: number, field: keyof DailyPracticeQuestion, value: any) => {
    const updated = [...dpQuestions];
    updated[idx] = { ...updated[idx], [field]: value };
    setDpQuestions(updated);
  };

  const handleUpdateDpOption = (qIdx: number, optIdx: number, value: string) => {
    const updated = [...dpQuestions];
    const opts = [...(updated[qIdx].optionsHtml || ['', '', '', ''])];
    opts[optIdx] = value;
    updated[qIdx] = { ...updated[qIdx], optionsHtml: opts };
    setDpQuestions(updated);
  };

  const handleSaveDpSet = async () => {
    if (!dpTitle.trim()) {
      setDpErrorMsg("कृपया डेली प्रैक्टिस सेट का शीर्षक (Title) दर्ज करें।");
      return;
    }
    if (dpQuestions.length === 0) {
      setDpErrorMsg("कम से कम 1 प्रश्न जोड़ना अनिवार्य है।");
      return;
    }

    setDpSaving(true);
    setDpSuccessMsg(null);
    setDpErrorMsg(null);

    const payload: Partial<DailyPracticeSet> = {
      id: dpEditingId || undefined,
      date: dpDate,
      title: dpTitle,
      description: dpDescription,
      subject: dpSubject,
      category: dpCategory,
      targetExam: dpTargetExam,
      durationMinutes: dpDuration,
      questions: dpQuestions,
      updatedAt: new Date().toISOString()
    };

    try {
      const url = dpEditingId ? `/api/daily-practice/${dpEditingId}` : '/api/daily-practice';
      const method = dpEditingId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const savedData = await res.json().catch(() => ({}));
        let syncNotice = "";

        // Automatically sync to Subject-Wise Question Bank if checked
        if (dpAlsoAddToSubjectWise && dpQuestions.length > 0) {
          const finalSub = (dpSyncSubject === '__custom__' ? dpCustomSyncSubject.trim() : dpSyncSubject.trim()) || dpSubject || 'छत्तीसगढ़ सामान्य ज्ञान';
          const finalTop = dpSyncTopic.trim() || dpTitle.trim() || 'डेली प्रैक्टिस क्विज';
          try {
            const syncRes = await fetch('/api/daily-practice/sync-to-subjectwise', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                setId: dpEditingId || savedData.id || payload.id,
                targetSubject: finalSub,
                targetTopic: finalTop,
                questions: dpQuestions
              })
            });
            if (syncRes.ok) {
              syncNotice = ` ➔ साथ ही इसके ${dpQuestions.length} प्रश्न विषय-वार बैंक (${finalSub} > ${finalTop}) में भी तुरंत सुरक्षित कर दिए गए हैं!`;
            }
          } catch (syncErr) {
            console.error("Auto sync to subjectwise error:", syncErr);
          }
        }

        setDpSuccessMsg(`डेली प्रैक्टिस सेट सफलतापूर्वक सहेजा एवं लाइव कर दिया गया है!${syncNotice}`);
        fetchDailyPractice();
        if (onRefreshQuestions) onRefreshQuestions();
      } else {
        const errJson = await res.json();
        setDpErrorMsg(errJson.error || "डेली प्रैक्टिस सेट सहेजने में विफल।");
      }
    } catch (err: any) {
      setDpErrorMsg("सर्वर त्रुटि: " + err.message);
    } finally {
      setDpSaving(false);
    }
  };

  const handleSyncSetToSubjectWise = async (set: DailyPracticeSet, targetSubject?: string, targetTopic?: string) => {
    const finalSub = (targetSubject === '__custom__' ? dpSyncModalCustomSubject.trim() : (targetSubject || set.subject || 'छत्तीसगढ़ सामान्य ज्ञान')).trim();
    const finalTop = (targetTopic || set.title || 'डेली प्रैक्टिस क्विज').trim();
    
    setDpSyncModalSaving(true);
    try {
      const res = await fetch('/api/daily-practice/sync-to-subjectwise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          setId: set.id,
          targetSubject: finalSub,
          targetTopic: finalTop,
          questions: set.questions
        })
      });

      if (res.ok) {
        const data = await res.json();
        setDpSuccessMsg(`सफलतापूर्वक '${set.title}' के ${data.count || set.questions?.length || 0} प्रश्न विषय-वार बैंक (${finalSub} ➔ ${finalTop}) में जोड़ दिए गए हैं!`);
        setDpSyncModalSet(null);
        if (onRefreshQuestions) onRefreshQuestions();
        return true;
      } else {
        const errJson = await res.json();
        setDpErrorMsg(errJson.error || "विषय-वार में जोड़ने में विफल।");
        return false;
      }
    } catch (err: any) {
      setDpErrorMsg("सर्वर त्रुटि: " + err.message);
      return false;
    } finally {
      setDpSyncModalSaving(false);
    }
  };

  const handleSyncAllDailyPracticeToSubjectWise = async () => {
    if (dpList.length === 0) {
      alert("कोई डेली प्रैक्टिस सेट उपलब्ध नहीं है।");
      return;
    }
    if (!confirm(`क्या आप सभी ${dpList.length} डेली प्रैक्टिस सेट्स के प्रश्नों को विषय-वार प्रश्न बैंक में सिंक करना चाहते हैं?`)) {
      return;
    }
    setDpBatchSyncing(true);
    let totalSynced = 0;
    try {
      for (const item of dpList) {
        if (item.questions && item.questions.length > 0) {
          const res = await fetch('/api/daily-practice/sync-to-subjectwise', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              setId: item.id,
              targetSubject: item.subject || 'छत्तीसगढ़ सामान्य ज्ञान',
              targetTopic: item.title || 'डेली प्रैक्टिस क्विज',
              questions: item.questions
            })
          });
          if (res.ok) {
            const d = await res.json();
            totalSynced += d.count || item.questions.length;
          }
        }
      }
      setDpSuccessMsg(`सफलतापूर्वक कुल ${totalSynced} डेली क्विज प्रश्न विषय-वार प्रश्न बैंक में सिंक कर दिए गए हैं!`);
      if (onRefreshQuestions) onRefreshQuestions();
    } catch (err: any) {
      setDpErrorMsg("सिंक त्रुटि: " + err.message);
    } finally {
      setDpBatchSyncing(false);
    }
  };

  const handleLoadDpSetIntoSubjectWise = (setId: string) => {
    const set = dpList.find(s => s.id === setId);
    if (!set || !set.questions || set.questions.length === 0) {
      setSubErrorMsg("चयनित डेली प्रैक्टिस सेट में कोई प्रश्न नहीं मिले।");
      return;
    }

    const targetSub = subSubject === '__custom__' ? (subCustomSubject.trim() || 'छत्तीसगढ़ सामान्य ज्ञान') : subSubject;
    const targetTop = subTopic.trim() || set.title || 'डेली प्रैक्टिस क्विज';

    const converted: Question[] = set.questions.map((q, idx) => {
      let opts = q.optionsHtml || ["विकल्प A", "विकल्प B", "विकल्प C", "विकल्प D"];
      return {
        id: `q-sub-dp-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 4)}`,
        text_hi: q.questionHtml || `प्रश्न ${idx + 1}`,
        options_hi: opts,
        correctAnswer: typeof q.correctAnswer === 'number' ? q.correctAnswer : 0,
        subject: targetSub,
        topic: targetTop,
        exam: undefined,
        year: undefined,
        explanation_hi: q.explanationHtml || ''
      };
    });

    setSubParsedQuestions(converted);
    setSubSuccessMsg(`सफलतापूर्वक '${set.title}' से ${converted.length} प्रश्न लोड कर लिए गए हैं! आप नीचे समीक्षा/संपादन करके 'डेटाबेस में सहेजें' पर क्लिक करें।`);
    setSubErrorMsg(null);
  };

  const handleLoadSampleHtml = () => {
    const sampleHtml = `<div class="question-block">
  <p><b>प्रश्न 1:</b> छत्तीसगढ़ में <i>'भारत छोड़ो आंदोलन'</i> (1942) के समय रायपुर डायनामाइट कांड के मुख्य नायक कौन थे?</p>
  <div class="options">
    <p>A. परसराम सोनी</p>
    <p>B. ईश्वरी चरण शुक्ल</p>
    <p>C. ठाकुर प्यारेलाल सिंह</p>
    <p>D. खूबचंद बघेल</p>
  </div>
  <p class="answer">B</p>
  <div class="explanation"><b>विस्तृत समाधान:</b> रायपुर डायनामाइट कांड के मुख्य सूत्रधार ईश्वरी चरण शुक्ल थे। इसमें रायपुर जेल की दीवार को उड़ाकर सेनानियों को बाहर निकालने की योजना थी।</div>
</div>

<div class="question-block">
  <p><b>प्रश्न 2:</b> छत्तीसगढ़ की सबसे लंबी सीमा छूने वाला पड़ोसी राज्य कौन सा है?</p>
  <div class="options">
    <p>A. मध्य प्रदेश</p>
    <p>B. ओडिशा</p>
    <p>C. महाराष्ट्र</p>
    <p>D. उत्तर प्रदेश</p>
  </div>
  <p class="answer">B</p>
  <div class="explanation"><b>व्याख्या:</b> ओडिशा राज्य के साथ छत्तीसगढ़ की सबसे लंबी भू-सीमा साझा होती है (लगभग 8 जिले सीमा बनाते हैं)।</div>
</div>`;
    setDpBulkHtmlText(sampleHtml);
  };

  const handleParseBulkHtml = () => {
    if (!dpBulkHtmlText.trim()) {
      setDpErrorMsg("कृपया पहले एचटीएमएल कोड बॉक्स में प्रश्न/कोड दर्ज करें।");
      return;
    }
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(dpBulkHtmlText, 'text/html');
      const blocks = doc.querySelectorAll('.question-block, .dp-question, .question, .item');
      
      const parsedList: DailyPracticeQuestion[] = [];

      if (blocks.length > 0) {
        blocks.forEach((b, i) => {
          const qEl = b.querySelector('p, h3, h4, b') || b;
          const optsEls = Array.from(b.querySelectorAll('.options p, .options li, .option, li'));
          const ansEl = b.querySelector('.answer, .ans');
          const expEl = b.querySelector('.explanation, .exp, .sol');

          let ansIdx = 0;
          if (ansEl) {
            const txt = ansEl.textContent?.trim().toUpperCase() || '';
            if (txt.includes('B') || txt === '2' || txt === '1') ansIdx = 1;
            else if (txt.includes('C') || txt === '3' || txt === '2') ansIdx = 2;
            else if (txt.includes('D') || txt === '4' || txt === '3') ansIdx = 3;
          }

          let opts = optsEls.map(o => o.innerHTML);
          if (opts.length < 4) {
            opts = ["विकल्प A", "विकल्प B", "विकल्प C", "विकल्प D"];
          }

          parsedList.push({
            id: `dpq-parse-${Date.now()}-${i}`,
            questionHtml: qEl.innerHTML,
            optionsHtml: opts.slice(0, 4),
            correctAnswer: ansIdx,
            explanationHtml: expEl ? expEl.innerHTML : ''
          });
        });
      } else {
        // Text block fallback
        const items = dpBulkHtmlText.split(/(?:<div|\n\s*\n)/i).filter(x => x.trim().length > 15);
        items.forEach((item, i) => {
          parsedList.push({
            id: `dpq-parse-${Date.now()}-${i}`,
            questionHtml: `<b>प्रश्न ${i + 1}:</b> ` + item.substring(0, 150),
            optionsHtml: ["विकल्प A", "विकल्प B", "विकल्प C", "विकल्प D"],
            correctAnswer: 0,
            explanationHtml: item
          });
        });
      }

      if (parsedList.length > 0) {
        setDpQuestions(parsedList);
        setDpInputMode('form');
        setDpSuccessMsg(`सफलतापूर्वक ${parsedList.length} प्रश्न एचटीएमएल कोड से निकाल लिए गए हैं! आप प्रत्येक प्रश्न की जांच एवं संपादन कर सकते हैं।`);
      } else {
        setDpErrorMsg("एचटीएमएल पार्स नहीं हो सका। कृपया दिए गए नमूना HTML कोड टेम्पलेट का पालन करें।");
      }
    } catch (err: any) {
      setDpErrorMsg("पार्सिंग त्रुटि: " + err.message);
    }
  };

  // --- SUBJECT-WISE QUESTION HANDLERS ---
  const handleLoadSubjectSampleHtml = () => {
    const sampleHtml = `<div class="question-block">
  <p><b>प्रश्न 1:</b> छत्तीसगढ़ राज्य का कुल भौगोलिक क्षेत्रफल कितना है?</p>
  <div class="options">
    <p>A. 1,35,192 वर्ग किमी</p>
    <p>B. 1,45,210 वर्ग किमी</p>
    <p>C. 1,28,340 वर्ग किमी</p>
    <p>D. 1,52,000 वर्ग किमी</p>
  </div>
  <p class="answer">A</p>
  <div class="explanation"><b>व्याख्या:</b> छत्तीसगढ़ का कुल क्षेत्रफल 1,35,192 वर्ग किमी है, जो भारत के कुल क्षेत्रफल का लगभग 4.11% है।</div>
</div>

<div class="question-block">
  <p><b>प्रश्न 2:</b> 'मिनीमाता (हसदेव बांगो) बांध' छत्तीसगढ़ के किस जिले में स्थित है?</p>
  <div class="options">
    <p>A. बिलासपुर</p>
    <p>B. कोरबा</p>
    <p>C. जांजगीर-चांपा</p>
    <p>D. रायगढ़</p>
  </div>
  <p class="answer">B</p>
  <div class="explanation"><b>व्याख्या:</b> मिनीमाता (हसदेव बांगो) बांध कोरबा जिले में हसदेव नदी पर निर्मित है। यह छत्तीसगढ़ का सबसे ऊंचा बांध (87 मीटर) है।</div>
</div>

<div class="question-block">
  <p><b>प्रश्न 3:</b> छत्तीसगढ़ की प्रसिद्ध 'गोंचा पर्व' किस माह में मनाया जाता है?</p>
  <div class="options">
    <p>A. चैत्र माह</p>
    <p>B. आषाढ़ माह</p>
    <p>C. सावन माह</p>
    <p>D. क्वांर माह</p>
  </div>
  <p class="answer">B</p>
  <div class="explanation"><b>व्याख्या:</b> बस्तर का गोंचा पर्व आषाढ़ शुक्ल द्वितीया (रथयात्रा) के अवसर पर आयोजित होता है। इसमें तुपकी का प्रयोग किया जाता है।</div>
</div>`;
    setSubBulkHtmlText(sampleHtml);
    setSubSuccessMsg("नमूना विषयवार HTML कोड लोड कर दिया गया है।");
  };

  const handleParseSubjectBulkHtml = () => {
    if (!subBulkHtmlText.trim()) {
      setSubErrorMsg("कृपया पहले बॉक्स में HTML कोड दर्ज करें।");
      return;
    }
    try {
      const activeSub = subSubject === '__custom__' ? (subCustomSubject.trim() || 'छत्तीसगढ़ सामान्य ज्ञान') : subSubject;
      const activeTop = subTopic.trim() || 'सामान्य ज्ञान';
      
      const parser = new DOMParser();
      const doc = parser.parseFromString(subBulkHtmlText, 'text/html');
      const blocks = doc.querySelectorAll('.question-block, .dp-question, .question, .item, .q-card, .card, .ques');
      
      const cleanOption = (txt: string) => {
        return txt
          .replace(/^[\s(]*[A-Ea-e1-5क-ङ][\s).:\-–—]+/, '')
          .replace(/^<b>\s*[A-Ea-e1-5क-ङ][\s).:\-–—]*<\/b>/i, '')
          .trim();
      };
      const parseAns = (txt: string) => {
        const t = txt.trim().toUpperCase();
        if (t.includes('A') || t === '1' || t.includes('क')) return 0;
        if (t.includes('B') || t === '2' || t.includes('ख')) return 1;
        if (t.includes('C') || t === '3' || t.includes('ग')) return 2;
        if (t.includes('D') || t === '4' || t.includes('घ')) return 3;
        if (t.includes('E') || t === '5' || t.includes('ङ')) return 4;
        return 0;
      };

      const parsed: Question[] = [];

      if (blocks.length > 0) {
        blocks.forEach((b, i) => {
          const qEl = b.querySelector('.question-text, .q-text, h3, h4, b, p') || b;
          const optEls = Array.from(b.querySelectorAll('.options p, .options li, .options div, .option, li, .opt'));
          const ansEl = b.querySelector('.answer, .ans, .correct, .key, [data-answer]');
          const expEl = b.querySelector('.explanation, .exp, .solution, .sol, .vyakhya');

          let opts: string[] = [];
          if (optEls.length >= 2) {
            opts = optEls.map(el => cleanOption(el.innerHTML?.trim() || el.textContent || ''));
          } else {
            const rawText = b.textContent || '';
            const m = rawText.match(/(?:[A-D][\.\)])\s*([^\n\r]+)/g);
            if (m && m.length >= 2) opts = m.map(cleanOption);
            else opts = ["विकल्प A", "विकल्प B", "विकल्प C", "विकल्प D"];
          }

          let ansIdx = 0;
          if (ansEl) {
            ansIdx = parseAns(ansEl.getAttribute('data-answer') || ansEl.textContent || '');
          }

          let qText = qEl.innerHTML ? qEl.innerHTML.replace(/^<b>\s*प्रश्न\s*\d+\s*[:\-–]?\s*<\/b>/i, '').replace(/^प्रश्न\s*\d+\s*[:\-–]?\s*/i, '').trim() : qEl.textContent || '';
          if (!qText) qText = qEl.textContent || `प्रश्न ${i + 1}`;

          const expText = expEl 
            ? (expEl.innerHTML 
                ? expEl.innerHTML.replace(/^<b>\s*व्याख्या\s*[:\-–]?\s*<\/b>/i, '').replace(/^व्याख्या\s*[:\-–]?\s*/i, '').trim() 
                : expEl.textContent?.replace(/^व्याख्या\s*[:\-–]?\s*/i, '').trim() || '')
            : '';

          parsed.push({
            id: `q-sub-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 4)}`,
            text_hi: qText,
            options_hi: opts.length >= 4 ? opts.slice(0, 5) : [...opts, "विकल्प C", "विकल्प D"].slice(0, 4),
            correctAnswer: ansIdx,
            subject: activeSub,
            topic: activeTop,
            exam: undefined,
            year: undefined,
            explanation_hi: expText || ''
          });
        });
      } else {
        // Line-by-line fallback
        const lines = subBulkHtmlText.split(/(?:<div|\n\s*\n)/i).filter(x => x.trim().length > 15);
        lines.forEach((item, i) => {
          parsed.push({
            id: `q-sub-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 4)}`,
            text_hi: item.substring(0, 150),
            options_hi: ["विकल्प A", "विकल्प B", "विकल्प C", "विकल्प D"],
            correctAnswer: 0,
            subject: activeSub,
            topic: activeTop,
            exam: undefined,
            year: undefined,
            explanation_hi: item
          });
        });
      }

      if (parsed.length > 0) {
        setSubParsedQuestions(parsed);
        setSubSuccessMsg(`सफलतापूर्वक ${parsed.length} विषयवार प्रश्न पार्स कर लिए गए हैं! नीचे समीक्षा करें और "डेटाबेस में सहेजें" पर क्लिक करें।`);
        setSubErrorMsg(null);
      } else {
        setSubErrorMsg("एचटीएमएल पार्स नहीं हो सका। कृपया नमूना HTML प्रारूप का पालन करें।");
      }
    } catch (err: any) {
      setSubErrorMsg("पार्सिंग त्रुटि: " + err.message);
    }
  };

  const handleSaveSubjectQuestions = async (mode: 'append' | 'replace' = 'append') => {
    if (subParsedQuestions.length === 0) {
      setSubErrorMsg("सहेजने के लिए कोई प्रश्न नहीं हैं। कृपया पहले HTML पार्स करें।");
      return;
    }
    setSubSaving(true);
    setSubSuccessMsg(null);
    setSubErrorMsg(null);
    try {
      const activeSub = subSubject === '__custom__' ? (subCustomSubject.trim() || 'छत्तीसगढ़ सामान्य ज्ञान') : subSubject;
      const activeTop = subTopic.trim() || 'सामान्य ज्ञान';
      
      const payload = subParsedQuestions.map(q => ({
        ...q,
        subject: activeSub,
        topic: activeTop,
        exam: undefined,
        year: undefined
      }));

      const endpoint = mode === 'replace' ? '/api/questions/replace' : '/api/questions/bulk';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setSubSuccessMsg(`सफलतापूर्वक ${payload.length} विषयवार प्रश्न डेटाबेस में सहेजे गए और तुरंत लाइव कर दिए गए!`);
        setSubParsedQuestions([]);
        setSubBulkHtmlText('');
        if (onRefreshQuestions) onRefreshQuestions();
      } else {
        const errJson = await res.json();
        setSubErrorMsg(errJson.error || "प्रश्न सहेजने में विफल।");
      }
    } catch (err: any) {
      setSubErrorMsg("सर्वर त्रुटि: " + err.message);
    } finally {
      setSubSaving(false);
    }
  };

  const handleSaveSingleSubjectQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subSingleTextHi.trim()) {
      setSubErrorMsg("कृपया प्रश्न का विवरण दर्ज करें।");
      return;
    }
    const validOpts = subSingleOptionsHi.filter(o => o.trim() !== '');
    if (validOpts.length < 2) {
      setSubErrorMsg("कम से कम 2 विकल्प दर्ज करना अनिवार्य है।");
      return;
    }

    setSubSaving(true);
    setSubSuccessMsg(null);
    setSubErrorMsg(null);
    try {
      const activeSub = subSubject === '__custom__' ? (subCustomSubject.trim() || 'छत्तीसगढ़ सामान्य ज्ञान') : subSubject;
      const activeTop = subTopic.trim() || 'सामान्य ज्ञान';

      const newQ: Question = {
        id: `q-sub-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        text_hi: subSingleTextHi.trim(),
        text_en: subSingleTextEn.trim() || undefined,
        options_hi: subSingleOptionsHi.map((o, idx) => o.trim() || `विकल्प ${String.fromCharCode(65 + idx)}`),
        correctAnswer: subSingleCorrectAnswer,
        subject: activeSub,
        topic: activeTop,
        explanation_hi: subSingleExplanationHi.trim() || undefined
      };

      const res = await fetch('/api/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newQ)
      });

      if (res.ok) {
        setSubSuccessMsg("1 नया विषयवार प्रश्न सफलतापूर्वक डेटाबेस में जोड़ दिया गया!");
        setSubSingleTextHi('');
        setSubSingleTextEn('');
        setSubSingleOptionsHi(['', '', '', '']);
        setSubSingleExplanationHi('');
        setSubSingleCorrectAnswer(0);
        if (onRefreshQuestions) onRefreshQuestions();
      } else {
        const errJson = await res.json();
        setSubErrorMsg(errJson.error || "प्रश्न जोड़ने में विफल।");
      }
    } catch (err: any) {
      setSubErrorMsg("सर्वर त्रुटि: " + err.message);
    } finally {
      setSubSaving(false);
    }
  };

  // --- PYQ (PREVIOUS YEAR QUESTIONS) HANDLERS ---
  const handleLoadPyqSampleHtml = () => {
    const sampleHtml = `<div class="question-block">
  <p><b>प्रश्न 1:</b> प्राचीन काल में छत्तीसगढ़ क्षेत्र को किस नाम से जाना जाता था? <span class="badge">[CGPSC Prelims 2021]</span></p>
  <div class="options">
    <p>A. उत्तर कोशल</p>
    <p>B. दक्षिण कोशल</p>
    <p>C. महाकांतार</p>
    <p>D. चेदि देश</p>
  </div>
  <p class="answer">B</p>
  <div class="explanation"><b>व्याख्या:</b> रामायण कालीन एवं प्राचीन साहित्यों में छत्तीसगढ़ क्षेत्र को 'दक्षिण कोशल' कहा गया है जिसकी राजधानी कुशावती थी।</div>
</div>

<div class="question-block">
  <p><b>प्रश्न 2:</b> छत्तीसगढ़ के प्रसिद्ध 'बस्तर दशहरा' में किस देवी की पूजा मुख्य रूप से की जाती है? <span class="badge">[CG Vyapam 2023]</span></p>
  <div class="options">
    <p>A. मां बम्लेश्वरी</p>
    <p>B. मां दंतेश्वरी</p>
    <p>C. महामाया देवी</p>
    <p>D. मां चंद्रहासिनी</p>
  </div>
  <p class="answer">B</p>
  <div class="explanation"><b>व्याख्या:</b> बस्तर का दशहरा 75 दिनों तक चलने वाला विश्व प्रसिद्ध पर्व है, जो मां दंतेश्वरी देवी को समर्पित है।</div>
</div>

<div class="question-block">
  <p><b>प्रश्न 3:</b> छत्तीसगढ़ की प्रथम महिला सांसद कौन थीं? <span class="badge">[CGPSC 2019]</span></p>
  <div class="options">
    <p>A. मिनीमाता (मीनाक्षी देवी)</p>
    <p>B. पद्मावती देवी</p>
    <p>C. करुणा शुक्ला</p>
    <p>D. रेणुका सिंह</p>
  </div>
  <p class="answer">A</p>
  <div class="explanation"><b>व्याख्या:</b> मिनीमाता छत्तीसगढ़ की प्रथम महिला सांसद (लोकसभा सदस्य) थीं। वे सारंगढ़ और जांजगीर क्षेत्र से चुनी गई थीं।</div>
</div>`;
    setPyqBulkHtmlText(sampleHtml);
    setPyqSuccessMsg("नमूना PYQ HTML कोड लोड कर दिया गया है।");
  };

  const handleParsePyqBulkHtml = () => {
    if (!pyqBulkHtmlText.trim()) {
      setPyqErrorMsg("कृपया पहले बॉक्स में HTML कोड दर्ज करें।");
      return;
    }
    try {
      const activeExam = pyqExam === '__custom__' ? (pyqCustomExam.trim() || 'CGPSC Prelims') : pyqExam;
      const activeSub = pyqSubject.trim() || 'छत्तीसगढ़ सामान्य ज्ञान';
      const activeTop = pyqTopic.trim() || 'विगत वर्ष प्रश्न';
      
      const parser = new DOMParser();
      const doc = parser.parseFromString(pyqBulkHtmlText, 'text/html');
      const blocks = doc.querySelectorAll('.question-block, .dp-question, .question, .item, .q-card, .card, .ques');
      
      const cleanOption = (txt: string) => {
        return txt
          .replace(/^[\s(]*[A-Ea-e1-5क-ङ][\s).:\-–—]+/, '')
          .replace(/^<b>\s*[A-Ea-e1-5क-ङ][\s).:\-–—]*<\/b>/i, '')
          .trim();
      };
      const parseAns = (txt: string) => {
        const t = txt.trim().toUpperCase();
        if (t.includes('A') || t === '1' || t.includes('क')) return 0;
        if (t.includes('B') || t === '2' || t.includes('ख')) return 1;
        if (t.includes('C') || t === '3' || t.includes('ग')) return 2;
        if (t.includes('D') || t === '4' || t.includes('घ')) return 3;
        if (t.includes('E') || t === '5' || t.includes('ङ')) return 4;
        return 0;
      };

      const parsed: Question[] = [];

      if (blocks.length > 0) {
        blocks.forEach((b, i) => {
          const qEl = b.querySelector('.question-text, .q-text, h3, h4, b, p') || b;
          const optEls = Array.from(b.querySelectorAll('.options p, .options li, .options div, .option, li, .opt'));
          const ansEl = b.querySelector('.answer, .ans, .correct, .key, [data-answer]');
          const expEl = b.querySelector('.explanation, .exp, .solution, .sol, .vyakhya');

          let opts: string[] = [];
          if (optEls.length >= 2) {
            opts = optEls.map(el => cleanOption(el.innerHTML?.trim() || el.textContent || ''));
          } else {
            const rawText = b.textContent || '';
            const m = rawText.match(/(?:[A-D][\.\)])\s*([^\n\r]+)/g);
            if (m && m.length >= 2) opts = m.map(cleanOption);
            else opts = ["विकल्प A", "विकल्प B", "विकल्प C", "विकल्प D"];
          }

          let ansIdx = 0;
          if (ansEl) {
            ansIdx = parseAns(ansEl.getAttribute('data-answer') || ansEl.textContent || '');
          }

          let qText = qEl.innerHTML ? qEl.innerHTML.replace(/^<b>\s*प्रश्न\s*\d+\s*[:\-–]?\s*<\/b>/i, '').replace(/^प्रश्न\s*\d+\s*[:\-–]?\s*/i, '').trim() : qEl.textContent || '';
          if (!qText) qText = qEl.textContent || `प्रश्न ${i + 1}`;

          const expText = expEl 
            ? (expEl.innerHTML 
                ? expEl.innerHTML.replace(/^<b>\s*व्याख्या\s*[:\-–]?\s*<\/b>/i, '').replace(/^व्याख्या\s*[:\-–]?\s*/i, '').trim() 
                : expEl.textContent?.replace(/^व्याख्या\s*[:\-–]?\s*/i, '').trim() || '')
            : '';

          parsed.push({
            id: `q-pyq-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 4)}`,
            text_hi: qText,
            options_hi: opts.length >= 4 ? opts.slice(0, 5) : [...opts, "विकल्प C", "विकल्प D"].slice(0, 4),
            correctAnswer: ansIdx,
            subject: activeSub,
            topic: activeTop,
            exam: activeExam,
            year: pyqYear || undefined,
            explanation_hi: expText || ''
          });
        });
      } else {
        // Line-by-line fallback
        const lines = pyqBulkHtmlText.split(/(?:<div|\n\s*\n)/i).filter(x => x.trim().length > 15);
        lines.forEach((item, i) => {
          parsed.push({
            id: `q-pyq-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 4)}`,
            text_hi: item.substring(0, 150),
            options_hi: ["विकल्प A", "विकल्प B", "विकल्प C", "विकल्प D"],
            correctAnswer: 0,
            subject: activeSub,
            topic: activeTop,
            exam: activeExam,
            year: pyqYear || undefined,
            explanation_hi: item
          });
        });
      }

      if (parsed.length > 0) {
        setPyqParsedQuestions(parsed);
        setPyqSuccessMsg(`सफलतापूर्वक ${parsed.length} विगत वर्ष के प्रश्न (PYQ) पार्स कर लिए गए हैं! नीचे समीक्षा करें और "डेटाबेस में सहेजें" पर क्लिक करें।`);
        setPyqErrorMsg(null);
      } else {
        setPyqErrorMsg("एचटीएमएल पार्स नहीं हो सका। कृपया नमूना HTML प्रारूप का पालन करें।");
      }
    } catch (err: any) {
      setPyqErrorMsg("पार्सिंग त्रुटि: " + err.message);
    }
  };

  const handleSavePyqQuestions = async (mode: 'append' | 'replace' = 'append') => {
    if (pyqParsedQuestions.length === 0) {
      setPyqErrorMsg("सहेजने के लिए कोई प्रश्न नहीं हैं। कृपया पहले HTML पार्स करें।");
      return;
    }
    setPyqSaving(true);
    setPyqSuccessMsg(null);
    setPyqErrorMsg(null);
    try {
      const activeExam = pyqExam === '__custom__' ? (pyqCustomExam.trim() || 'CGPSC Prelims') : pyqExam;
      const activeSub = pyqSubject.trim() || 'छत्तीसगढ़ सामान्य ज्ञान';
      const activeTop = pyqTopic.trim() || 'विगत वर्ष प्रश्न';
      
      const payload = pyqParsedQuestions.map(q => ({
        ...q,
        exam: activeExam,
        year: pyqYear || undefined,
        subject: activeSub,
        topic: activeTop
      }));

      const endpoint = mode === 'replace' ? '/api/questions/replace' : '/api/questions/bulk';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setPyqSuccessMsg(`सफलतापूर्वक ${payload.length} विगत वर्ष के प्रश्न (PYQ) डेटाबेस में सहेजे गए और तुरंत लाइव कर दिए गए!`);
        setPyqParsedQuestions([]);
        setPyqBulkHtmlText('');
        if (onRefreshQuestions) onRefreshQuestions();
      } else {
        const errJson = await res.json();
        setPyqErrorMsg(errJson.error || "PYQ प्रश्न सहेजने में विफल।");
      }
    } catch (err: any) {
      setPyqErrorMsg("सर्वर त्रुटि: " + err.message);
    } finally {
      setPyqSaving(false);
    }
  };

  const handleSaveSinglePyqQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pyqSingleTextHi.trim()) {
      setPyqErrorMsg("कृपया प्रश्न का विवरण दर्ज करें।");
      return;
    }
    const validOpts = pyqSingleOptionsHi.filter(o => o.trim() !== '');
    if (validOpts.length < 2) {
      setPyqErrorMsg("कम से कम 2 विकल्प दर्ज करना अनिवार्य है।");
      return;
    }

    setPyqSaving(true);
    setPyqSuccessMsg(null);
    setPyqErrorMsg(null);
    try {
      const activeExam = pyqExam === '__custom__' ? (pyqCustomExam.trim() || 'CGPSC Prelims') : pyqExam;
      const activeSub = pyqSubject.trim() || 'छत्तीसगढ़ सामान्य ज्ञान';
      const activeTop = pyqTopic.trim() || 'विगत वर्ष प्रश्न';

      const newQ: Question = {
        id: `q-pyq-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        text_hi: pyqSingleTextHi.trim(),
        text_en: pyqSingleTextEn.trim() || undefined,
        options_hi: pyqSingleOptionsHi.map((o, idx) => o.trim() || `विकल्प ${String.fromCharCode(65 + idx)}`),
        correctAnswer: pyqSingleCorrectAnswer,
        exam: activeExam,
        year: pyqYear || undefined,
        subject: activeSub,
        topic: activeTop,
        explanation_hi: pyqSingleExplanationHi.trim() || undefined
      };

      const res = await fetch('/api/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newQ)
      });

      if (res.ok) {
        setPyqSuccessMsg("1 नया विगत वर्ष प्रश्न (PYQ) सफलतापूर्वक डेटाबेस में जोड़ दिया गया!");
        setPyqSingleTextHi('');
        setPyqSingleTextEn('');
        setPyqSingleOptionsHi(['', '', '', '']);
        setPyqSingleExplanationHi('');
        setPyqSingleCorrectAnswer(0);
        if (onRefreshQuestions) onRefreshQuestions();
      } else {
        const errJson = await res.json();
        setPyqErrorMsg(errJson.error || "PYQ प्रश्न जोड़ने में विफल।");
      }
    } catch (err: any) {
      setPyqErrorMsg("सर्वर त्रुटि: " + err.message);
    } finally {
      setPyqSaving(false);
    }
  };

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
    fetchDailyPractice();
    fetchDpCategories();
    fetchStudentLeads();

    return () => unsubscribe();
  }, []);

  const fetchStudentLeads = async () => {
    setLoadingLeads(true);
    try {
      const [subRes, fbRes] = await Promise.all([
        fetch('/api/admin/students/subscribers'),
        fetch('/api/admin/feedbacks')
      ]);
      if (subRes.ok) {
        const subData = await subRes.json();
        setSubscribers(subData);
      }
      if (fbRes.ok) {
        const fbData = await fbRes.json();
        setFeedbacks(fbData);
      }
    } catch (err) {
      console.error("Failed to fetch student leads:", err);
    } finally {
      setLoadingLeads(false);
    }
  };

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

        setGoogleAppsScriptUrl(data.googleAppsScriptUrl || '');
        setInputAppsScriptUrl(data.googleAppsScriptUrl || '');
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
  // --- Proofreading & Audit System Logic ---
  
  // Filtered Questions Memo for Proofreading
  const filteredAuditQuestions = React.useMemo(() => {
    return questions.filter((q) => {
      // Type Filter (PYQ vs Subject)
      if (auditType === 'pyq' && (!q.exam || !q.exam.trim())) return false;
      if (auditType === 'subject' && q.exam && q.exam.trim()) return false;

      // Subject Filter
      if (auditSubject !== 'all' && q.subject !== auditSubject) return false;

      // Exam Filter
      if (auditExam !== 'all' && q.exam !== auditExam) return false;

      // Status Filter
      if (auditStatus === 'reviewed' && !(q as any).reviewed) return false;
      if (auditStatus === 'unreviewed' && (q as any).reviewed) return false;
      if (auditStatus === 'warning') {
        const hasWarning =
          !q.text_hi ||
          q.text_hi.trim().length < 5 ||
          !q.options_hi ||
          q.options_hi.length < 4 ||
          q.options_hi.some((opt) => !opt || !opt.trim()) ||
          q.text_hi.includes('  ') ||
          (q.explanation_hi && q.explanation_hi.includes('  '));
        if (!hasWarning) return false;
      }

      // Search Filter
      if (auditSearch.trim()) {
        const term = auditSearch.toLowerCase();
        const matchesText = q.text_hi?.toLowerCase().includes(term);
        const matchesId = q.id?.toLowerCase().includes(term);
        const matchesSub = q.subject?.toLowerCase().includes(term);
        const matchesExam = q.exam?.toLowerCase().includes(term);
        const matchesTopic = q.topic?.toLowerCase().includes(term);
        if (!matchesText && !matchesId && !matchesSub && !matchesExam && !matchesTopic) return false;
      }

      return true;
    });
  }, [questions, auditType, auditSubject, auditExam, auditStatus, auditSearch]);

  // Keep active editing question in sync with current index
  useEffect(() => {
    if (filteredAuditQuestions.length > 0) {
      const idx = Math.min(Math.max(0, auditCurrentIndex), filteredAuditQuestions.length - 1);
      const target = filteredAuditQuestions[idx];
      if (target) {
        setAuditEditingQuestion({
          ...target,
          options_hi: target.options_hi ? [...target.options_hi] : ['', '', '', ''],
        });
      }
    } else {
      setAuditEditingQuestion(null);
    }
  }, [auditCurrentIndex, filteredAuditQuestions]);

  // Reset index when filters change
  useEffect(() => {
    setAuditCurrentIndex(0);
  }, [auditType, auditSubject, auditExam, auditStatus, auditSearch]);

  // Keyboard shortcut listener for fast editing (Alt+S or Ctrl+S to save & next)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeSubTab !== 'proofread') return;
      if ((e.ctrlKey || e.altKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSaveAuditQuestion(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeSubTab, auditEditingQuestion, auditCurrentIndex, filteredAuditQuestions]);

  // Unique list of subjects and exams for audit dropdown filters
  const availableAuditSubjects = React.useMemo(() => {
    const set = new Set<string>();
    questions.forEach((q) => {
      if (q.subject) set.add(q.subject);
    });
    return Array.from(set);
  }, [questions]);

  const availableAuditExams = React.useMemo(() => {
    const set = new Set<string>();
    questions.forEach((q) => {
      if (q.exam && q.exam.trim()) set.add(q.exam);
    });
    return Array.from(set);
  }, [questions]);

  // Review status stats
  const reviewedCount = React.useMemo(() => {
    return questions.filter((q) => (q as any).reviewed).length;
  }, [questions]);

  // Save current question logic
  const handleSaveAuditQuestion = async (advanceNext = false) => {
    if (!auditEditingQuestion || !auditEditingQuestion.id) return;

    setAuditSaving(true);
    setAuditSaveMsg(null);

    try {
      const payload = {
        ...auditEditingQuestion,
        reviewed: auditEditingQuestion.reviewed ?? true
      };

      const res = await fetch(`/api/questions/${encodeURIComponent(auditEditingQuestion.id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok && data.success) {
        if (onRefreshQuestions) onRefreshQuestions(false);

        let statusText = "सफलतापूर्वक सहेजा गया!";
        if (data.sheetSynced) {
          statusText += " (गूगल शीट लाइव अपडेट हुआ ✓)";
        } else if (googleAppsScriptUrl) {
          statusText += " (वेबसाइट डेटाबेस सहेजा गया - गूगल शीट वेबहुक सिंक चेतावनी)";
        } else {
          statusText += " (वेबसाइट डेटाबेस अपडेट हुआ)";
        }

        setAuditSaveMsg({ type: 'success', text: statusText });

        if (advanceNext) {
          if (auditStatus === 'unreviewed') {
            if (auditCurrentIndex >= filteredAuditQuestions.length - 1 && auditCurrentIndex > 0) {
              setAuditCurrentIndex((prev) => prev - 1);
            }
          } else {
            if (auditCurrentIndex < filteredAuditQuestions.length - 1) {
              setAuditCurrentIndex((prev) => prev + 1);
            }
          }
        }
      } else {
        setAuditSaveMsg({ type: 'error', text: data.error || "प्रश्न सहेजा नहीं जा सका।" });
      }
    } catch (err: any) {
      setAuditSaveMsg({ type: 'error', text: err.message || "सर्वर से कनेक्ट करने में त्रुटि।" });
    } finally {
      setAuditSaving(false);
    }
  };

  // Quick formatting helpers
  const handleCleanExtraSpaces = () => {
    if (!auditEditingQuestion) return;
    const cleanStr = (s: string) => (s || '').replace(/[ \t]+/g, ' ').trim();
    setAuditEditingQuestion({
      ...auditEditingQuestion,
      text_hi: cleanStr(auditEditingQuestion.text_hi),
      options_hi: (auditEditingQuestion.options_hi || []).map(cleanStr),
      explanation_hi: cleanStr(auditEditingQuestion.explanation_hi || '')
    });
  };

  const handleAddLineBreakToQuestion = () => {
    if (!auditEditingQuestion) return;
    setAuditEditingQuestion({
      ...auditEditingQuestion,
      text_hi: (auditEditingQuestion.text_hi || '') + '\n'
    });
  };

  const handleSaveAppsScriptUrl = async () => {
    setAppsScriptSaving(true);
    setAppsScriptSuccess(null);
    const ok = await saveSettingField({ googleAppsScriptUrl: inputAppsScriptUrl.trim() });
    if (ok) {
      setGoogleAppsScriptUrl(inputAppsScriptUrl.trim());
      setAppsScriptSuccess("गूगल एप्स स्क्रिप्ट (Google Apps Script) वेबहुक URL सफलतापूर्वक सहेजा गया!");
    }
    setAppsScriptSaving(false);
  };

  const handleExportCSV = () => {
    const header = ['ID', 'Text_HI', 'Option_A', 'Option_B', 'Option_C', 'Option_D', 'Correct_Index_1_4', 'Explanation_HI', 'Subject_Or_Exam', 'Topic'];
    const rows = filteredAuditQuestions.map((q) => [
      q.id,
      `"${(q.text_hi || '').replace(/"/g, '""')}"`,
      `"${(q.options_hi?.[0] || '').replace(/"/g, '""')}"`,
      `"${(q.options_hi?.[1] || '').replace(/"/g, '""')}"`,
      `"${(q.options_hi?.[2] || '').replace(/"/g, '""')}"`,
      `"${(q.options_hi?.[3] || '').replace(/"/g, '""')}"`,
      (q.correctAnswer ?? 0) + 1,
      `"${(q.explanation_hi || '').replace(/"/g, '""')}"`,
      `"${(q.exam || q.subject || '').replace(/"/g, '""')}"`,
      `"${(q.topic || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [header.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `TestArena_Corrected_Questions_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };
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

  const handleDisconnectSheets = async () => {
    if (!confirm("क्या आप वाकई सभी गूगल शीट्स (Google Sheets) के लिंक एवं IDs को डिस्कनेक्ट करना चाहते हैं?")) {
      return;
    }
    setSheetSyncing(true);
    setSheetError(null);
    setSheetSuccess(null);

    const ok = await saveSettingField({
      spreadsheetIdPyq: '',
      spreadsheetIdSubject: '',
      spreadsheetIdCurrentAffairs: '',
      spreadsheetId: ''
    });

    if (ok) {
      setInputPyq('');
      setInputSubject('');
      setInputCA('');
      setSpreadsheetIdPyq('');
      setSpreadsheetIdSubject('');
      setSpreadsheetIdCA('');
      setSheetPreviewData([]);
      setSheetSuccess("सभी गूगल शीट लिंक/IDs सफलतापूर्वक डिस्कनेक्ट कर दिए गए हैं!");
    } else {
      setSheetError("गूगल शीट डिस्कनेक्ट करने में त्रुटि हुई।");
    }
    setSheetSyncing(false);
  };

  const handleDisconnectSingleSheet = async (type: 'pyq' | 'subject' | 'currentAffairs') => {
    setSheetSyncing(true);
    setSheetError(null);
    setSheetSuccess(null);

    let fieldsToSave: Record<string, string> = {};
    if (type === 'pyq') fieldsToSave = { spreadsheetIdPyq: '' };
    else if (type === 'subject') fieldsToSave = { spreadsheetIdSubject: '' };
    else if (type === 'currentAffairs') fieldsToSave = { spreadsheetIdCurrentAffairs: '' };

    const ok = await saveSettingField(fieldsToSave);
    if (ok) {
      if (type === 'pyq') {
        setInputPyq('');
        setSpreadsheetIdPyq('');
      } else if (type === 'subject') {
        setInputSubject('');
        setSpreadsheetIdSubject('');
      } else if (type === 'currentAffairs') {
        setInputCA('');
        setSpreadsheetIdCA('');
      }
      setSheetSuccess("गूगल शीट सफलतापूर्वक डिस्कनेक्ट हो गई!");
    } else {
      setSheetError("डिस्कनेक्ट करने में त्रुटि हुई।");
    }
    setSheetSyncing(false);
  };

  const handleDisconnectAppsScript = async () => {
    if (!confirm("क्या आप वाकई गूगल ऐप्स स्क्रिप्ट (Google Apps Script) वेबहुक URL को डिस्कनेक्ट करना चाहते हैं?")) {
      return;
    }
    setAppsScriptSaving(true);
    setAppsScriptSuccess(null);
    const ok = await saveSettingField({ googleAppsScriptUrl: '' });
    if (ok) {
      setGoogleAppsScriptUrl('');
      setInputAppsScriptUrl('');
      setAppsScriptSuccess("गूगल ऐप्स स्क्रिप्ट URL सफलतापूर्वक डिस्कनेक्ट कर दिया गया है!");
    } else {
      alert("डिस्कनेक्ट करने में त्रुटि हुई।");
    }
    setAppsScriptSaving(false);
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

  const handlePasscodeLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passcodeInput.trim()) return;
    setPasscodeVerifying(true);
    setPasscodeError(null);
    try {
      const res = await fetch('/api/admin/verify-passcode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode: passcodeInput.trim() })
      });
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        setPasscodeError("AWS सर्वर पर बैकएंड कोड अपडेट नहीं हुआ है! कृपया AWS पर 'git pull' करके प्रोजेक्ट री-बिल्ड (npm run build) और सर्वर रिस्टार्ट (pm2 restart) करें।");
        return;
      }
      const data = await res.json();
      if (res.ok && data.success) {
        setIsPasscodeAdmin(true);
        if (typeof window !== 'undefined') {
          localStorage.setItem('admin_passcode_authed', 'true');
        }
      } else {
        setPasscodeError(data.error || "गलत पासकोड!");
      }
    } catch (err: any) {
      setPasscodeError("सर्वर त्रुटि: " + (err.message || String(err)));
    } finally {
      setPasscodeVerifying(false);
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
      setIsPasscodeAdmin(false);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('admin_passcode_authed');
      }
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

  const handleDeleteAllQuestions = async () => {
    if (questions.length === 0) {
      alert("डेटाबेस में कोई प्रश्न मौजूद नहीं है।");
      return;
    }
    if (!confirm(`क्या आप वाकई डेटाबेस के सभी (${questions.length}) प्रश्नों को डिलीट करना चाहते हैं?\n\nयह क्रिया वापस नहीं ली जा सकती!`)) return;

    try {
      const res = await fetch('/api/questions/all', { method: 'DELETE' });
      if (res.ok) {
        alert("सभी प्रश्न सफलतापूर्वक डिलीट कर दिए गए हैं।");
        onRefreshQuestions();
      } else {
        alert("सभी प्रश्न डिलीट करने में विफलता।");
      }
    } catch (err: any) {
      console.error("Delete all error:", err);
      alert("सर्वर त्रुटि: " + (err.message || String(err)));
    }
  };

  // Keyword Bulk Delete Handler for Subject-Wise / General Questions
  const handleDeleteByKeyword = async (keywordToDel: string, subjectToFilter: string, onlySubWise: boolean) => {
    const trimmedKw = keywordToDel.trim();
    if (!trimmedKw) {
      alert("कृपया डिलीट करने हेतु शब्द / कीवर्ड दर्ज करें।");
      return;
    }
    setKwDeleting(true);
    try {
      const res = await fetch('/api/questions/delete-by-keyword', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword: trimmedKw,
          subject: subjectToFilter !== 'all' ? subjectToFilter : undefined,
          topic: kwSearchTopic !== 'all' ? kwSearchTopic : undefined,
          onlySubjectWise: onlySubWise,
          matchField: kwSearchScope
        })
      });
      const data = await res.json();
      if (res.ok) {
        setSubSuccessMsg(`सफलता: ${data.message}`);
        setKwSearchQuery('');
        setKwSelectedIds(new Set());
        setKwModalConfirm(null);
        if (onRefreshQuestions) onRefreshQuestions();
      } else {
        alert("डिलीट करने में विफलता: " + (data.error || "अज्ञात त्रुटि"));
      }
    } catch (err: any) {
      alert("सर्वर त्रुटि: " + err.message);
    } finally {
      setKwDeleting(false);
    }
  };

  // Batch Delete Selected IDs Handler
  const handleBulkDeleteSelectedIds = async (idsArray: string[]) => {
    if (idsArray.length === 0) {
      alert("कृपया कम से कम एक प्रश्न चुनें।");
      return;
    }
    if (!confirm(`क्या आप वाकई चयनित ${idsArray.length} प्रश्नों को हमेशा के लिए डिलीट करना चाहते हैं?\n\nयह क्रिया वापस नहीं ली जा सकती!`)) {
      return;
    }
    setKwDeleting(true);
    try {
      const res = await fetch('/api/questions/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: idsArray })
      });
      const data = await res.json();
      if (res.ok) {
        setSubSuccessMsg(`सफलता: ${data.message}`);
        setKwSelectedIds(new Set());
        setListSelectedIds(new Set());
        setKwModalConfirm(null);
        if (onRefreshQuestions) onRefreshQuestions();
      } else {
        alert("डिलीट करने में विफलता: " + (data.error || "अज्ञात त्रुटि"));
      }
    } catch (err: any) {
      alert("सर्वर त्रुटि: " + err.message);
    } finally {
      setKwDeleting(false);
    }
  };

  // Helper to highlight matching keyword in text
  const renderHighlightedText = (text: string, keyword: string) => {
    if (!keyword || !keyword.trim() || !text) return text;
    try {
      const escaped = keyword.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(${escaped})`, 'gi');
      const parts = text.split(regex);
      return parts.map((part, i) =>
        part.toLowerCase() === keyword.trim().toLowerCase() ? (
          <mark key={i} className="bg-amber-300 text-slate-900 font-extrabold px-1 rounded-xs">
            {part}
          </mark>
        ) : (
          part
        )
      );
    } catch (e) {
      return text;
    }
  };

  // Subject-wise existing subjects list with question counts
  const existingSubjectWiseSubjects = React.useMemo(() => {
    const counts: Record<string, number> = {};
    questions.forEach(q => {
      if (!q.exam || q.exam.trim() === '') {
        const s = (q.subject || '').trim();
        if (s) {
          counts[s] = (counts[s] || 0) + 1;
        }
      }
    });
    return Object.keys(counts)
      .sort((a, b) => a.localeCompare(b, 'hi'))
      .map(name => ({ name, count: counts[name] }));
  }, [questions]);

  // Subject-wise unique subjects list (names only)
  const availableSubSubjects = React.useMemo(() => {
    return existingSubjectWiseSubjects.map(s => s.name);
  }, [existingSubjectWiseSubjects]);

  // Helper to get existing topics for any given subject
  const getTopicsForSubject = React.useCallback((subjectName: string) => {
    if (!subjectName || subjectName === '__custom__') return [];
    const tops = new Set<string>();
    questions.forEach(q => {
      if (!q.exam || q.exam.trim() === '') {
        if (q.subject === subjectName && q.topic && q.topic.trim()) {
          tops.add(q.topic.trim());
        }
      }
    });
    return Array.from(tops).sort((a, b) => a.localeCompare(b, 'hi'));
  }, [questions]);

  // Subject-wise unique topics for the selected subject
  const availableSubTopics = React.useMemo(() => {
    const tops = new Set<string>();
    questions.forEach(q => {
      if (!q.exam || q.exam.trim() === '') {
        if (kwSearchSubject === 'all' || q.subject === kwSearchSubject) {
          if (q.topic && q.topic.trim()) tops.add(q.topic.trim());
        }
      }
    });
    return Array.from(tops).sort();
  }, [questions, kwSearchSubject]);

  // Subject-Wise questions matched by keyword search
  const matchedSubjectQuestions = React.useMemo(() => {
    const term = kwSearchQuery.trim().toLowerCase();
    return questions.filter(q => {
      // Must be Subject-wise (no exam tag)
      if (q.exam && q.exam.trim() !== '') return false;

      // Subject filter
      if (kwSearchSubject !== 'all' && q.subject !== kwSearchSubject) return false;

      // Topic filter
      if (kwSearchTopic !== 'all' && kwSearchTopic.trim() && q.topic !== kwSearchTopic) return false;

      // Keyword filter
      if (!term) return true;

      const text = (q.text_hi || '').toLowerCase();
      const topicText = (q.topic || '').toLowerCase();
      const subText = (q.subject || '').toLowerCase();
      const exp = (q.explanation_hi || '').toLowerCase();
      const opts = Array.isArray(q.options_hi) ? q.options_hi.join(' ').toLowerCase() : '';

      if (kwSearchScope === 'text') {
        return text.includes(term);
      } else if (kwSearchScope === 'topic') {
        return topicText.includes(term);
      } else if (kwSearchScope === 'explanation') {
        return exp.includes(term);
      } else {
        return text.includes(term) || topicText.includes(term) || subText.includes(term) || exp.includes(term) || opts.includes(term);
      }
    });
  }, [questions, kwSearchQuery, kwSearchSubject, kwSearchTopic, kwSearchScope]);

  const filteredQuestions = questions.filter(q => 
    q.text_hi.toLowerCase().includes(searchQuery.toLowerCase()) ||
    q.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    q.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (q.exam && q.exam.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const ADMIN_EMAIL = 'souravpatel13@gmail.com';
  const isAuthorizedAdmin = isPasscodeAdmin || (user && user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase());

  if (authLoading) {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center space-y-3 max-w-md mx-auto my-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
        <p className="text-xs font-bold text-gray-600">ऑथेंटिकेशन स्थिति की जाँच हो रही है...</p>
      </div>
    );
  }

  if (!isAuthorizedAdmin) {
    return (
      <div className="max-w-md mx-auto my-12 bg-white border border-gray-200 rounded-2xl p-8 shadow-sm text-center space-y-6">
        <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto border border-emerald-200">
          <Lock className="h-7 w-7" />
        </div>
        
        <div>
          <h2 className="text-base font-extrabold text-gray-900">प्रशासकीय लॉगिन (Admin Panel Access)</h2>
          <p className="text-xs text-gray-500 font-medium mt-1 leading-relaxed">
            सुरक्षा के लिए पासकोड या गूगल खाते से लॉगिन करें।
          </p>
        </div>

        {/* Option 1: Passcode Login (Recommended for testarena.co.in custom domain) */}
        <form onSubmit={handlePasscodeLogin} className="space-y-3 text-left border-t border-b border-gray-100 py-5">
          <label className="block text-xs font-bold text-gray-800">
            🔐 एडमिन पासकोड / सिक्योरिटी पिन (Admin PIN)
          </label>
          <div className="relative">
            <input
              type="password"
              value={passcodeInput}
              onChange={(e) => setPasscodeInput(e.target.value)}
              placeholder="एडमिन पासकोड दर्ज करें..."
              className="w-full text-xs bg-gray-50 border border-gray-300 rounded-xl px-3.5 py-2.5 focus:bg-white focus:border-emerald-500 focus:outline-hidden font-mono"
            />
          </div>

          {passcodeError && (
            <p className="text-[11px] font-bold text-red-600 bg-red-50 border border-red-200 p-2.5 rounded-lg">
              ⚠️ {passcodeError}
            </p>
          )}

          <button
            type="submit"
            disabled={passcodeVerifying || !passcodeInput.trim()}
            className="w-full bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-xs font-bold py-2.5 rounded-xl transition flex items-center justify-center gap-2 shadow-xs cursor-pointer"
          >
            {passcodeVerifying ? "सत्यापित हो रहा है..." : "पासकोड से लॉगिन करें (Log In)"}
          </button>
        </form>

        {/* Option 2: Google Sign-In */}
        <div className="space-y-2">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">या (OR)</p>
          <button
            type="button"
            onClick={handleLogin}
            disabled={authLoading}
            className="w-full bg-white hover:bg-gray-50 text-gray-800 border border-gray-300 text-xs font-bold py-2.5 rounded-xl transition flex items-center justify-center gap-2 shadow-2xs cursor-pointer"
          >
            <Lock className="h-4 w-4 text-emerald-600" /> Google खाते से लॉगिन करें
          </button>
        </div>

        {user && !isAuthorizedAdmin && (
          <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-left text-xs text-amber-900 space-y-2">
            <p className="font-bold">वर्तमान गूगल खाता: {user.email}</p>
            <p className="text-[11px] text-amber-800">
              यह गूगल खाता अधिकृत लिस्ट (souravpatel13@gmail.com) में नहीं है। एडमिन पैनल खोलने के लिए ऊपर एडमिन पासकोड से लॉगिन करें।
            </p>
            <button
              onClick={handleLogout}
              className="text-[11px] font-bold text-red-600 hover:underline cursor-pointer"
            >
              लॉग आउट करें
            </button>
          </div>
        )}
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
          {isAuthorizedAdmin && (
            <button
              onClick={handleLogout}
              className="bg-gray-100 hover:bg-red-50 text-gray-700 hover:text-red-600 text-xs font-bold px-4 py-2.5 rounded-xl transition flex items-center gap-2 cursor-pointer border border-gray-200"
            >
              <LogOut className="h-4 w-4" /> लॉग आउट (Logout)
            </button>
          )}
        </div>
      </div>

      {/* Main Subtab Navigation */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-gray-200 pb-3">
        <button
          onClick={() => setActiveSubTab('dailyPractice')}
          className={`px-3.5 py-2.5 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 cursor-pointer ${
            activeSubTab === 'dailyPractice'
              ? 'bg-emerald-700 text-white shadow-md ring-2 ring-emerald-300'
              : 'bg-emerald-50 text-emerald-900 hover:bg-emerald-100 border border-emerald-200'
          }`}
        >
          <Sparkles className="h-4 w-4 text-amber-500 animate-bounce" />
          ⚡ सहायक शिक्षक डेली प्रैक्टिस
        </button>

        <button
          onClick={() => setActiveSubTab('subjectWise')}
          className={`px-3.5 py-2.5 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 cursor-pointer ${
            activeSubTab === 'subjectWise'
              ? 'bg-teal-700 text-white shadow-md ring-2 ring-teal-300'
              : 'bg-white text-gray-700 hover:bg-teal-50 border border-gray-200'
          }`}
        >
          <BookOpen className="h-4 w-4 text-teal-600" />
          📚 विषय-वार प्रश्न (HTML बल्क + फॉर्म)
        </button>

        <button
          onClick={() => setActiveSubTab('pyq')}
          className={`px-3.5 py-2.5 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 cursor-pointer ${
            activeSubTab === 'pyq'
              ? 'bg-indigo-700 text-white shadow-md ring-2 ring-indigo-300'
              : 'bg-white text-gray-700 hover:bg-indigo-50 border border-gray-200'
          }`}
        >
          <Database className="h-4 w-4 text-indigo-600" />
          🏛️ विगत वर्ष प्रश्न / PYQ (HTML बल्क + फॉर्म)
        </button>

        <button
          onClick={() => setActiveSubTab('list')}
          className={`px-3.5 py-2.5 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 cursor-pointer ${
            activeSubTab === 'list'
              ? 'bg-emerald-800 text-white shadow-sm'
              : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <Search className="h-4 w-4 text-gray-500" />
          📋 प्रश्न बैंक सूची ({questions.length})
        </button>

        <button
          onClick={() => setActiveSubTab('proofread')}
          className={`px-3.5 py-2.5 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 cursor-pointer ${
            activeSubTab === 'proofread'
              ? 'bg-amber-800 text-white shadow-sm'
              : 'bg-white text-gray-700 hover:bg-amber-50 border border-gray-200'
          }`}
        >
          <Wand2 className="h-4 w-4 text-amber-600" />
          🔍 त्रुटि सुधार व ऑडिट
        </button>

        <button
          onClick={() => setActiveSubTab('excel')}
          className={`px-3.5 py-2.5 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 cursor-pointer ${
            activeSubTab === 'excel'
              ? 'bg-emerald-800 text-white shadow-sm'
              : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
          📊 एक्सेल / CSV अपलोड
        </button>

        <button
          onClick={() => setActiveSubTab('aboutExam')}
          className={`px-3.5 py-2.5 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 cursor-pointer ${
            activeSubTab === 'aboutExam'
              ? 'bg-emerald-800 text-white shadow-sm'
              : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <GraduationCap className="h-4 w-4 text-purple-600" />
          🎓 परीक्षा जानकारी (Word सम्पादक)
        </button>

        <button
          onClick={() => setActiveSubTab('sheets')}
          className={`px-3.5 py-2.5 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 cursor-pointer ${
            activeSubTab === 'sheets'
              ? 'bg-emerald-800 text-white shadow-sm'
              : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <RefreshCw className="h-4 w-4 text-blue-600" />
          🔄 गूगल शीट सिंक
        </button>

        <button
          onClick={() => setActiveSubTab('analytics')}
          className={`px-3.5 py-2.5 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 cursor-pointer ${
            activeSubTab === 'analytics'
              ? 'bg-indigo-800 text-white shadow-md ring-2 ring-indigo-300'
              : 'bg-indigo-50 text-indigo-900 hover:bg-indigo-100 border border-indigo-200'
          }`}
        >
          <BarChart3 className="h-4 w-4 text-indigo-600" />
          📈 इनबिल्ट यूज़र स्टैट्स व टाइम स्पेंड
        </button>

        <button
          onClick={() => {
            setActiveSubTab('studentLeads');
            fetchStudentLeads();
          }}
          className={`px-3.5 py-2.5 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 cursor-pointer ${
            activeSubTab === 'studentLeads'
              ? 'bg-indigo-700 text-white shadow-md ring-2 ring-indigo-300'
              : 'bg-indigo-50 text-indigo-900 hover:bg-indigo-100 border border-indigo-200'
          }`}
        >
          <Users className="h-4 w-4 text-indigo-600" />
          👥 विद्यार्थी संपर्क व फीडबैक ({subscribers.length + feedbacks.length})
        </button>
      </div>

      {/* Tab Panels */}
      <div className="space-y-6">

        {/* DAILY PRACTICE MANAGER TAB */}
        {activeSubTab === 'dailyPractice' && (
          <div className="space-y-8 animate-fadeIn">
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-900 text-white p-6 rounded-3xl shadow-md border border-emerald-700/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[11px] font-extrabold text-amber-300 bg-amber-400/20 px-3 py-1 rounded-full border border-amber-300/30 inline-flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-amber-300" /> सहायक शिक्षक भर्ती परीक्षा डेली प्रैक्टिस
                </span>
                <h2 className="text-xl font-extrabold text-white">
                  डेली प्रैक्टिस सेट सम्पादक (Daily Practice Manager)
                </h2>
                <p className="text-xs text-emerald-100 font-medium max-w-2xl leading-relaxed">
                  वेबसाइट कोड को अपडेट किए बिना यहाँ से सहायक शिक्षक भर्ती परीक्षा के नए वस्तुनिष्ठ प्रश्न एचटीएमएल कोड (HTML) या सीधे फॉर्म द्वारा जोड़ें एवं तुरंत लाइव करें।
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleResetDpForm}
                  className="bg-white/10 hover:bg-white/20 text-white font-extrabold px-4 py-2.5 rounded-xl text-xs transition border border-white/20 cursor-pointer flex items-center gap-1.5"
                >
                  <PlusCircle className="h-4 w-4 text-emerald-300" /> नया सेट बनाएं
                </button>
              </div>
            </div>

            {/* Status Alert Messages */}
            {dpSuccessMsg && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-4 rounded-2xl text-xs font-bold flex items-center justify-between gap-2 shadow-2xs">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />
                  <span>{dpSuccessMsg}</span>
                </div>
                <button onClick={() => setDpSuccessMsg(null)} className="text-emerald-700 hover:text-emerald-950 text-xs">✕</button>
              </div>
            )}

            {dpErrorMsg && (
              <div className="bg-red-50 border border-red-200 text-red-900 p-4 rounded-2xl text-xs font-bold flex items-center justify-between gap-2 shadow-2xs">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
                  <span>{dpErrorMsg}</span>
                </div>
                <button onClick={() => setDpErrorMsg(null)} className="text-red-700 hover:text-red-950 text-xs">✕</button>
              </div>
            )}

            {/* SUBJECT CARDS MANAGEMENT SECTION */}
            <div className="bg-white rounded-3xl border border-emerald-200 p-6 shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
                <div>
                  <h3 className="text-sm font-extrabold text-emerald-950 flex items-center gap-2">
                    <Layers className="h-4 w-4 text-emerald-600" />
                    विषय एवं परीक्षा पद कार्ड प्रबंधन (Subject & Exam Post Cards Manager)
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    यहाँ से डेली प्रैक्टिस पेज पर दिखने वाले विषय/परीक्षा कार्ड्स को जोड़ें या डिलीट करें ({dpCategories.length} कार्ड्स उपलब्ध):
                  </p>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  {dpCategories.length > 0 && (
                    <button
                      onClick={handleDeleteAllCategories}
                      className="bg-red-50 hover:bg-red-100 text-red-700 font-bold px-3 py-2 rounded-xl text-xs border border-red-200 transition cursor-pointer flex items-center gap-1"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> सभी कार्ड्स हटाएं
                    </button>
                  )}
                  <button
                    onClick={() => setShowCatModal(!showCatModal)}
                    className="bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold px-4 py-2 rounded-xl text-xs transition shadow-sm cursor-pointer flex items-center gap-1.5"
                  >
                    <PlusCircle className="h-4 w-4 text-emerald-300" /> {showCatModal ? "फॉर्म बंद करें" : "+ नया सब्जेक्ट कार्ड जोड़ें"}
                  </button>
                </div>
              </div>

              {/* Add Category Form Modal / Panel */}
              {showCatModal && (
                <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 space-y-4 animate-fadeIn">
                  <div className="flex items-center justify-between border-b border-emerald-200/60 pb-2">
                    <h4 className="text-xs font-extrabold text-emerald-900 flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-amber-500" /> नया विषय/पद कार्ड जोड़ें
                    </h4>
                    <button onClick={() => setShowCatModal(false)} className="text-xs font-bold text-gray-500 hover:text-gray-800">✕</button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div>
                      <label className="font-bold text-gray-700 block mb-1">पद / विषय का नाम*</label>
                      <input
                        type="text"
                        value={catName}
                        onChange={(e) => setCatName(e.target.value)}
                        placeholder="उदा. शिक्षक सामाजिक विज्ञान / पटवारी"
                        className="w-full p-2.5 font-bold border border-emerald-300 rounded-xl bg-white focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-gray-700 block mb-1">उप-शीर्षक (English Tag/Sublabel)</label>
                      <input
                        type="text"
                        value={catSubLabel}
                        onChange={(e) => setCatSubLabel(e.target.value)}
                        placeholder="उदा. Social Science Exam"
                        className="w-full p-2.5 font-semibold border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-gray-700 block mb-1">आइकॉन चुनें (Icon)</label>
                      <select
                        value={catIconName}
                        onChange={(e) => setCatIconName(e.target.value)}
                        className="w-full p-2.5 font-bold border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="GraduationCap">🎓 GraduationCap</option>
                        <option value="UserCheck">👨‍🏫 UserCheck (शिक्षक)</option>
                        <option value="Sprout">🌱 Sprout (कृषि)</option>
                        <option value="BookMarked">📖 BookMarked (हिंदी)</option>
                        <option value="Languages">🔤 Languages (अंग्रेजी)</option>
                        <option value="Calculator">🔢 Calculator (गणित)</option>
                        <option value="Atom">⚛️ Atom (विज्ञान)</option>
                        <option value="Briefcase">💼 Briefcase (अन्य/सामान्य)</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-gray-700 block mb-1">बैज रंग थीम (Badge Style)</label>
                      <select
                        value={catBadgeColor}
                        onChange={(e) => setCatBadgeColor(e.target.value)}
                        className="w-full p-2.5 font-bold border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="bg-emerald-100 text-emerald-900 border-emerald-300">🟢 Emerald Green</option>
                        <option value="bg-amber-100 text-amber-900 border-amber-300">🟠 Amber Orange</option>
                        <option value="bg-blue-100 text-blue-900 border-blue-300">🔵 Blue Accent</option>
                        <option value="bg-rose-100 text-rose-900 border-rose-300">🔴 Rose Red</option>
                        <option value="bg-purple-100 text-purple-900 border-purple-300">🟣 Purple Magic</option>
                        <option value="bg-cyan-100 text-cyan-900 border-cyan-300">🩵 Cyan Sky</option>
                        <option value="bg-slate-100 text-slate-900 border-slate-300">⚪ Slate Neutral</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-gray-700 block mb-1 text-xs">विवरण (Short Description)</label>
                    <input
                      type="text"
                      value={catDescription}
                      onChange={(e) => setCatDescription(e.target.value)}
                      placeholder="उदा. शिक्षक सामाजिक विज्ञान पद हेतु इतिहास, भूगोल, अर्थशास्त्र एवं नागरिक शास्त्र अभ्यास"
                      className="w-full p-2.5 text-xs font-semibold border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      onClick={() => setShowCatModal(false)}
                      className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-200 rounded-xl cursor-pointer"
                    >
                      रद्द करें
                    </button>
                    <button
                      onClick={handleSaveCategory}
                      disabled={catSaving}
                      className="bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold px-5 py-2 rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5 shadow-sm"
                    >
                      <Save className="h-4 w-4" /> {catSaving ? "सहेजा जा रहा है..." : "कार्ड सहेजें & लाइव करें"}
                    </button>
                  </div>
                </div>
              )}

              {/* Active Subject Cards Grid */}
              {dpCategories.length === 0 ? (
                <div className="bg-gray-50 border border-dashed border-gray-200 rounded-2xl p-6 text-center space-y-2">
                  <p className="text-xs font-bold text-gray-600">कोई भी सब्जेक्ट कार्ड एक्टिव नहीं है।</p>
                  <p className="text-[11px] text-gray-400">ऊपर दिए गए "+ नया सब्जेक्ट कार्ड जोड़ें" बटन पर क्लिक करके नए कार्ड्स बनाएं।</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {dpCategories.map((cat) => {
                    const isSelected = dpCategory === cat.name;
                    return (
                      <div
                        key={cat.id || cat.name}
                        className={`rounded-2xl p-3.5 flex flex-col justify-between space-y-2.5 transition ${
                          isSelected
                            ? 'bg-emerald-100/70 border-2 border-emerald-600 shadow-xs ring-2 ring-emerald-300/50'
                            : 'bg-emerald-50/40 border border-emerald-200/80 hover:border-emerald-400'
                        }`}
                      >
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md border ${cat.badgeColor || 'bg-emerald-100 text-emerald-900 border-emerald-300'}`}>
                                {cat.name}
                              </span>
                              {cat.subLabel && (
                                <p className="text-[10px] font-bold text-gray-400 uppercase mt-1">{cat.subLabel}</p>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteConfirm({ type: 'category', id: cat.id || cat.name, name: cat.name });
                              }}
                              title="श्रेणी कार्ड हटाएं"
                              className="p-1.5 text-red-500 hover:bg-red-50 hover:text-red-700 rounded-lg transition cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>

                          <p className="text-[11px] text-gray-600 font-medium line-clamp-2 leading-relaxed">
                            {cat.description || `${cat.name} परीक्षा हेतु वस्तुनिष्ठ प्रश्न`}
                          </p>
                        </div>

                        <button
                          onClick={() => {
                            setDpCategory(cat.name);
                            const el = document.getElementById('dp-set-form');
                            if (el) el.scrollIntoView({ behavior: 'smooth' });
                          }}
                          className={`w-full py-1.5 px-2 rounded-xl text-[11px] font-extrabold transition cursor-pointer flex items-center justify-center gap-1 ${
                            isSelected
                              ? 'bg-emerald-800 text-white shadow-xs'
                              : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          }`}
                        >
                          <PlusCircle className="h-3.5 w-3.5 text-amber-300" />
                          {isSelected ? '✓ चयनित (प्रश्न जोड़ें)' : '+ इस कार्ड में प्रश्न जोड़ें'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Set Details Form */}
            <div id="dp-set-form" className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm space-y-6">
              <div className="border-b border-gray-100 pb-4 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-extrabold text-gray-900 flex items-center gap-2">
                    <Edit3 className="h-4 w-4 text-emerald-600" />
                    {dpEditingId ? "दैनिक अभ्यास सेट संशोधित करें (Edit Set)" : "नया दैनिक अभ्यास सेट बनाएं (Create Daily Set)"}
                  </h3>
                  <p className="text-xs text-emerald-800 font-bold mt-1 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-lg inline-block">
                    🎯 यह प्रश्न सेट <b>[{dpCategory || 'कोई श्रेणी नहीं'}]</b> कार्ड के अंतर्गत सेव होगा।
                  </p>
                </div>
                {dpEditingId && (
                  <span className="text-xs text-amber-800 bg-amber-50 px-2.5 py-1 rounded-md font-mono font-bold border border-amber-200">
                    संशोधित हो रहा है: {dpEditingId}
                  </span>
                )}
              </div>

              {/* Set Metadata Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">दिनांक (Date)*</label>
                  <input
                    type="date"
                    value={dpDate}
                    onChange={(e) => setDpDate(e.target.value)}
                    className="w-full p-2.5 text-xs font-semibold border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 bg-gray-50/50"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-emerald-900 block mb-1">पद / परीक्षा श्रेणी (Category)*</label>
                  {dpCategories.length > 0 ? (
                    <select
                      value={dpCategory}
                      onChange={(e) => setDpCategory(e.target.value)}
                      className="w-full p-2.5 text-xs font-bold border border-emerald-300 rounded-xl focus:ring-2 focus:ring-emerald-500 bg-emerald-50 text-emerald-950"
                    >
                      {dpCategories.map((cat) => (
                        <option key={cat.id || cat.name} value={cat.name}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={dpCategory}
                      onChange={(e) => setDpCategory(e.target.value)}
                      placeholder="उदा. सहायक शिक्षक / सामान्य"
                      className="w-full p-2.5 text-xs font-bold border border-emerald-300 rounded-xl focus:ring-2 focus:ring-emerald-500 bg-emerald-50 text-emerald-950"
                    />
                  )}
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">लक्ष्य परीक्षा (Target Exam)</label>
                  <input
                    type="text"
                    value={dpTargetExam}
                    onChange={(e) => setDpTargetExam(e.target.value)}
                    placeholder="उदा. CGPSC Prelims / व्यापमं"
                    className="w-full p-2.5 text-xs font-semibold border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 bg-gray-50/50"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">विषय (Subject)</label>
                  <input
                    type="text"
                    value={dpSubject}
                    onChange={(e) => setDpSubject(e.target.value)}
                    placeholder="उदा. छत्तीसगढ़ सामान्य ज्ञान"
                    className="w-full p-2.5 text-xs font-semibold border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 bg-gray-50/50"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">समय सीमा (Minutes)</label>
                  <input
                    type="number"
                    value={dpDuration}
                    onChange={(e) => setDpDuration(parseInt(e.target.value) || 20)}
                    className="w-full p-2.5 text-xs font-semibold border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 bg-gray-50/50"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">सेट का शीर्षक (Set Title)*</label>
                <input
                  type="text"
                  value={dpTitle}
                  onChange={(e) => setDpTitle(e.target.value)}
                  placeholder="उदा. डेली प्रैक्टिस सेट - 29 जुलाई 2026 (छत्तीसगढ़ सामान्य ज्ञान एवं समसामयिकी 25 प्रश्न)"
                  className="w-full p-3 text-xs sm:text-sm font-bold border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">विवरण (Short Description)</label>
                <input
                  type="text"
                  value={dpDescription}
                  onChange={(e) => setDpDescription(e.target.value)}
                  placeholder="उदा. आज के इस सेट में छत्तीसगढ़ इतिहास, जनजातियां एवं करंट अफेयर्स के 25 महत्वपूर्ण वस्तुनिष्ठ प्रश्न शामिल हैं..."
                  className="w-full p-2.5 text-xs font-medium border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Input Mode Selector Tabs */}
              <div className="pt-2 border-t border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs font-extrabold text-gray-800 uppercase tracking-wider">
                    प्रश्न जोड़ने का तरीका (Question Entry Mode):
                  </p>
                  <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setDpInputMode('form')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition cursor-pointer flex items-center gap-1.5 ${
                        dpInputMode === 'form' 
                          ? 'bg-emerald-600 text-white shadow-2xs' 
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <List className="h-3.5 w-3.5" /> प्रश्न-दर-प्रश्न सम्पादक ({dpQuestions.length} प्रश्न)
                    </button>
                    <button
                      type="button"
                      onClick={() => setDpInputMode('bulkHtml')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition cursor-pointer flex items-center gap-1.5 ${
                        dpInputMode === 'bulkHtml' 
                          ? 'bg-emerald-600 text-white shadow-2xs' 
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <Code2 className="h-3.5 w-3.5" /> बल्क HTML कोड पार्सर
                    </button>
                  </div>
                </div>

                {/* MODE 1: BULK HTML CODE PARSER */}
                {dpInputMode === 'bulkHtml' && (
                  <div className="bg-slate-900 text-white rounded-2xl p-5 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div>
                        <h4 className="text-xs font-extrabold text-emerald-400 flex items-center gap-1.5">
                          <FileCode className="h-4 w-4" /> बल्क HTML कोड पेस्ट एवं पार्सर
                        </h4>
                        <p className="text-[11px] text-slate-400">
                          अपने प्रश्नों का HTML कोड नीचे बॉक्स में पेस्ट करें और "पार्स करें" पर क्लिक करें।
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleLoadSampleHtml}
                          className="bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 text-xs font-bold px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1"
                        >
                          <Copy className="h-3.5 w-3.5" /> नमूना HTML कोड लोड करें
                        </button>
                      </div>
                    </div>

                    <textarea
                      rows={12}
                      value={dpBulkHtmlText}
                      onChange={(e) => setDpBulkHtmlText(e.target.value)}
                      placeholder="यहाँ अपना HTML प्रश्न कोड पेस्ट करें..."
                      className="w-full p-4 font-mono text-xs bg-slate-950 text-emerald-300 border border-slate-800 rounded-xl focus:ring-2 focus:ring-emerald-500 leading-relaxed"
                    />

                    <div className="flex items-center justify-between pt-2">
                      <span className="text-[11px] text-slate-400">
                        टिप: नमूना कोड लोड करके प्रारूप समझें।
                      </span>
                      <button
                        type="button"
                        onClick={handleParseBulkHtml}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold px-6 py-2.5 rounded-xl text-xs transition flex items-center gap-2 cursor-pointer shadow-md"
                      >
                        <Wand2 className="h-4 w-4 text-amber-300 animate-pulse" /> एचटीएमएल कोड से प्रश्न निकालें (Parse HTML)
                      </button>
                    </div>
                  </div>
                )}

                {/* MODE 2: STEP-BY-STEP QUESTION FORM BUILDER */}
                {dpInputMode === 'form' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                      <div>
                        <span className="text-xs font-extrabold text-emerald-900 block">
                          सेट में कुल प्रश्न संख्या: {dpQuestions.length}
                        </span>
                        <span className="text-[11px] text-emerald-700">
                          (प्रत्येक प्रश्न में आप H1, H2, Bold, Table, Image या HTML टैग उपयोग कर सकते हैं)
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={handleAddDpQuestion}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-4 py-2 rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <PlusCircle className="h-4 w-4" /> नया प्रश्न जोड़ें (+ Add Question)
                      </button>
                    </div>

                    {dpQuestions.length === 0 ? (
                      <div className="text-center py-10 bg-gray-50 border border-dashed border-gray-300 rounded-2xl space-y-3">
                        <BookOpen className="h-10 w-10 text-gray-300 mx-auto" />
                        <p className="text-xs font-bold text-gray-600">
                          अभी इस सेट में कोई प्रश्न नहीं है।
                        </p>
                        <button
                          type="button"
                          onClick={handleAddDpQuestion}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition cursor-pointer"
                        >
                          + पहला प्रश्न जोड़ें
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {dpQuestions.map((q, qIdx) => (
                          <div 
                            key={q.id || qIdx}
                            className="bg-gray-50/70 border border-gray-200 rounded-2xl p-5 space-y-4 relative group hover:border-emerald-300 transition"
                          >
                            {/* Question Header Controls */}
                            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                              <span className="text-xs font-extrabold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-200">
                                प्रश्न क्रमांक #{qIdx + 1}
                              </span>

                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => setDpPreviewQuestionIndex(dpPreviewQuestionIndex === qIdx ? null : qIdx)}
                                  className="text-xs font-bold text-gray-700 hover:bg-gray-200 px-2.5 py-1 rounded-lg border border-gray-300 transition flex items-center gap-1 cursor-pointer"
                                >
                                  <Eye className="h-3.5 w-3.5 text-emerald-600" />
                                  {dpPreviewQuestionIndex === qIdx ? 'संपादन विधा' : 'लाइव प्रिव्यू'}
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleRemoveDpQuestion(qIdx)}
                                  className="text-xs font-bold text-red-600 hover:bg-red-50 p-1.5 rounded-lg border border-red-200 transition cursor-pointer"
                                  title="यह प्रश्न हटाएँ"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>

                            {/* Live Render Preview Card */}
                            {dpPreviewQuestionIndex === qIdx ? (
                              <div className="bg-white p-4 rounded-xl border border-emerald-200 space-y-3">
                                <p className="text-xs font-extrabold text-emerald-800 uppercase">एचटीएमएल पूर्वावलोकन (Live Rendered View):</p>
                                <div 
                                  className="text-sm font-bold text-gray-900 leading-relaxed prose max-w-none"
                                  dangerouslySetInnerHTML={{ __html: q.questionHtml }}
                                />
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                                  {q.optionsHtml.map((opt, oIdx) => (
                                    <div 
                                      key={oIdx}
                                      className={`p-2.5 rounded-lg border text-xs font-medium flex items-center gap-2 ${
                                        q.correctAnswer === oIdx 
                                          ? 'bg-emerald-50 border-emerald-500 font-bold text-emerald-900' 
                                          : 'bg-gray-50 border-gray-200'
                                      }`}
                                    >
                                      <span className="font-bold">{String.fromCharCode(65 + oIdx)}.</span>
                                      <div dangerouslySetInnerHTML={{ __html: opt }} />
                                    </div>
                                  ))}
                                </div>
                                {q.explanationHtml && (
                                  <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-xs text-amber-950 font-medium">
                                    <p className="font-bold text-amber-900 mb-1">व्याख्या:</p>
                                    <div dangerouslySetInnerHTML={{ __html: q.explanationHtml }} />
                                  </div>
                                )}
                              </div>
                            ) : (
                              /* Editable Question Form Fields */
                              <div className="space-y-4">
                                {/* Question HTML Input */}
                                <div>
                                  <label className="text-xs font-bold text-gray-700 block mb-1">
                                    प्रश्न सामग्री / HTML कोड*
                                  </label>
                                  <textarea
                                    rows={3}
                                    value={q.questionHtml}
                                    onChange={(e) => handleUpdateDpQuestion(qIdx, 'questionHtml', e.target.value)}
                                    placeholder="यहाँ प्रश्न लिखें या HTML टैग उपयोग करें..."
                                    className="w-full p-3 text-xs sm:text-sm font-semibold border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 bg-white"
                                  />
                                </div>

                                {/* Options A, B, C, D */}
                                <div className="space-y-2">
                                  <label className="text-xs font-bold text-gray-700 block">
                                    विकल्प (Options) एवं सही उत्तर का चयन करें:*
                                  </label>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {['A', 'B', 'C', 'D'].map((optLabel, oIdx) => (
                                      <div key={oIdx} className="flex items-center gap-2">
                                        <button
                                          type="button"
                                          onClick={() => handleUpdateDpQuestion(qIdx, 'correctAnswer', oIdx)}
                                          className={`px-3 py-2 rounded-xl text-xs font-extrabold border transition cursor-pointer shrink-0 ${
                                            q.correctAnswer === oIdx
                                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                                              : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-100'
                                          }`}
                                          title="सही उत्तर घोषित करें"
                                        >
                                          {optLabel}. {q.correctAnswer === oIdx ? '✓ सही' : ''}
                                        </button>
                                        <input
                                          type="text"
                                          value={q.optionsHtml[oIdx] || ''}
                                          onChange={(e) => handleUpdateDpOption(qIdx, oIdx, e.target.value)}
                                          placeholder={`विकल्प ${optLabel}...`}
                                          className="w-full p-2 text-xs font-medium border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 bg-white"
                                        />
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {/* Explanation HTML Input */}
                                <div>
                                  <label className="text-xs font-bold text-gray-700 block mb-1">
                                    व्याख्या एवं सॉल्यूशन (Solution / Explanation HTML)
                                  </label>
                                  <textarea
                                    rows={2}
                                    value={q.explanationHtml || ''}
                                    onChange={(e) => handleUpdateDpQuestion(qIdx, 'explanationHtml', e.target.value)}
                                    placeholder="उत्तर का कारण एवं विस्तृत व्याख्या दर्ज करें..."
                                    className="w-full p-2.5 text-xs font-medium border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 bg-white"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Auto Sync to Subject-Wise Box */}
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-300/80 rounded-2xl p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="flex items-center gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={dpAlsoAddToSubjectWise}
                      onChange={(e) => setDpAlsoAddToSubjectWise(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 rounded border-emerald-300 focus:ring-emerald-500 cursor-pointer"
                    />
                    <span className="text-xs font-extrabold text-emerald-950 flex items-center gap-1.5">
                      <BookOpen className="h-4 w-4 text-emerald-700" />
                      इन सभी प्रश्नों को 'विषय-वार प्रश्न बैंक' (Subject-Wise Bank) में भी स्वतः जोड़ें
                    </span>
                  </label>
                  <span className="text-[11px] font-extrabold px-2.5 py-1 bg-emerald-200/80 text-emerald-900 rounded-lg w-fit">
                    {dpQuestions.length} प्रश्न विषय-वार में जाएंगे
                  </span>
                </div>

                {dpAlsoAddToSubjectWise && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-emerald-200/60">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-gray-700 block">
                        लक्षित विषय (Target Subject):*
                      </label>
                      <select
                        value={dpSyncSubject}
                        onChange={(e) => {
                          const val = e.target.value;
                          setDpSyncSubject(val);
                          if (val !== '__custom__' && val) {
                            const tops = getTopicsForSubject(val);
                            if (tops.length > 0 && !dpSyncTopic) {
                              setDpSyncTopic(tops[0]);
                            }
                          }
                        }}
                        className="w-full p-2.5 text-xs font-bold bg-white border-2 border-emerald-300 rounded-xl focus:ring-2 focus:ring-emerald-500 shadow-xs"
                      >
                        {existingSubjectWiseSubjects.length > 0 ? (
                          existingSubjectWiseSubjects.map(sub => (
                            <option key={sub.name} value={sub.name}>
                              📚 {sub.name} ({sub.count} प्रश्न पहले से उपलब्ध)
                            </option>
                          ))
                        ) : (
                          <option value="छत्तीसगढ़ सामान्य ज्ञान">📚 छत्तीसगढ़ सामान्य ज्ञान</option>
                        )}
                        <option value="__custom__">➕ अन्य नया विषय दर्ज करें (Custom Subject)...</option>
                      </select>
                      {dpSyncSubject === '__custom__' && (
                        <div className="mt-1.5 space-y-1">
                          <label className="text-[10px] font-extrabold text-emerald-900 block">नया विषय का नाम:*</label>
                          <input
                            type="text"
                            placeholder="नया विषय का नाम लिखें (उदा. कृषि विज्ञान, कंप्यूटर)..."
                            value={dpCustomSyncSubject}
                            onChange={(e) => setDpCustomSyncSubject(e.target.value)}
                            className="w-full p-2 text-xs font-bold bg-white border-2 border-emerald-400 rounded-xl focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-gray-700 block">
                        लक्षित टॉपिक / अध्याय (Target Topic):
                      </label>
                      <input
                        type="text"
                        placeholder={dpTitle || "उदा. पर्यावरण एवं बाल विकास"}
                        value={dpSyncTopic}
                        onChange={(e) => setDpSyncTopic(e.target.value)}
                        className="w-full p-2 text-xs font-bold bg-white border border-emerald-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                      />
                      {/* Quick suggestions of existing topics for this subject */}
                      {dpSyncSubject !== '__custom__' && getTopicsForSubject(dpSyncSubject).length > 0 && (
                        <div className="flex flex-wrap items-center gap-1 pt-1">
                          <span className="text-[10px] font-bold text-emerald-900">मौजूदा टॉपिक:</span>
                          {getTopicsForSubject(dpSyncSubject).slice(0, 8).map(top => (
                            <button
                              key={top}
                              type="button"
                              onClick={() => setDpSyncTopic(top)}
                              className={`text-[10px] px-2 py-0.5 rounded-md border font-semibold cursor-pointer transition ${
                                dpSyncTopic === top
                                  ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
                                  : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                              }`}
                            >
                              {top}
                            </button>
                          ))}
                        </div>
                      )}
                      <p className="text-[10px] text-emerald-800 font-medium">खाली छोड़ने पर सेट का शीर्षक ("{dpTitle || 'डेली प्रैक्टिस क्विज'}") उपयोग होगा।</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Save Button */}
              <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleResetDpForm}
                  className="px-4 py-2.5 text-xs font-bold text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-xl transition cursor-pointer"
                >
                  रीसेट करें (Reset Form)
                </button>

                <button
                  type="button"
                  disabled={dpSaving}
                  onClick={handleSaveDpSet}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold px-8 py-3 rounded-xl text-xs transition flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
                >
                  <Save className="h-4 w-4 text-amber-300" />
                  {dpSaving ? "सहेजा जा रहा है..." : "सहेजें एवं लाइव करें (Save & Publish Set)"}
                </button>
              </div>
            </div>

            {/* List of Existing Saved Sets */}
            <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
                <h3 className="text-sm font-extrabold text-gray-900 flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-emerald-600" />
                  सहेजे गए डेली प्रैक्टिस सेट ({dpList.length})
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={dpBatchSyncing || dpList.length === 0}
                    onClick={handleSyncAllDailyPracticeToSubjectWise}
                    className="text-xs font-extrabold text-teal-900 bg-teal-100 hover:bg-teal-200 px-3 py-1.5 rounded-lg transition border border-teal-300 cursor-pointer flex items-center gap-1.5 shadow-2xs disabled:opacity-50"
                    title="सभी डेली प्रैक्टिस सेट्स के प्रश्नों को विषय-वार बैंक में सिंक करें"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${dpBatchSyncing ? 'animate-spin' : ''}`} />
                    {dpBatchSyncing ? "सिंक हो रहा है..." : "⚡ सभी सेट्स विषय-वार में सिंक करें"}
                  </button>
                  <button
                    onClick={fetchDailyPractice}
                    className="text-xs font-bold text-emerald-700 hover:bg-emerald-50 px-2.5 py-1.5 rounded-lg transition border border-emerald-200 cursor-pointer flex items-center gap-1"
                  >
                    <RefreshCw className="h-3.5 w-3.5" /> रिफ्रेश
                  </button>
                </div>
              </div>

              {dpList.length === 0 ? (
                <p className="text-xs text-gray-500 text-center py-6">कोई डेली प्रैक्टिस सेट उपलब्ध नहीं है।</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-gray-50 text-gray-700 border-b border-gray-200">
                        <th className="p-3 font-extrabold">दिनांक</th>
                        <th className="p-3 font-extrabold">श्रेणी (Category)</th>
                        <th className="p-3 font-extrabold">शीर्षक</th>
                        <th className="p-3 font-extrabold">लक्ष्य परीक्षा</th>
                        <th className="p-3 font-extrabold">प्रश्न संख्या</th>
                        <th className="p-3 font-extrabold text-right">कार्रवाई</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {dpList.map((item) => (
                        <tr key={item.id} className="hover:bg-emerald-50/30 transition">
                          <td className="p-3 font-bold text-emerald-800 whitespace-nowrap">
                            {item.date}
                          </td>
                          <td className="p-3 font-bold whitespace-nowrap">
                            <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 px-2.5 py-1 rounded-md text-[11px]">
                              {item.category || 'सहायक शिक्षक'}
                            </span>
                          </td>
                          <td className="p-3 font-extrabold text-gray-900">
                            {item.title}
                          </td>
                          <td className="p-3 font-medium text-gray-600">
                            {item.targetExam || '-'}
                          </td>
                          <td className="p-3 font-bold text-emerald-700">
                            {item.questions?.length || 0} प्रश्न
                          </td>
                          <td className="p-3 text-right whitespace-nowrap space-x-1.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDpSyncModalSet(item);
                                setDpSyncModalSubject(item.subject || 'छत्तीसगढ़ सामान्य ज्ञान');
                                setDpSyncModalTopic(item.title);
                              }}
                              className="bg-teal-50 text-teal-800 hover:bg-teal-100 px-2.5 py-1.5 rounded-lg font-extrabold border border-teal-300 transition cursor-pointer inline-flex items-center gap-1 text-[11px]"
                              title="इस सेट के सभी प्रश्न विषय-वार बैंक में जोड़ें"
                            >
                              <BookOpen className="h-3 w-3 text-teal-600" />
                              विषय-वार में जोड़ें
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditDpSet(item);
                              }}
                              className="bg-emerald-50 text-emerald-800 hover:bg-emerald-100 px-2.5 py-1.5 rounded-lg font-bold border border-emerald-200 transition cursor-pointer text-[11px]"
                            >
                              संपादित करें
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteConfirm({ type: 'dpSet', id: item.id, name: item.title });
                              }}
                              className="bg-red-50 text-red-700 hover:bg-red-100 px-2.5 py-1.5 rounded-lg font-bold border border-red-200 transition cursor-pointer text-[11px]"
                            >
                              हटाएं
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Quick Subject-Wise Sync Modal */}
            {dpSyncModalSet && (
              <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
                <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-teal-100 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center gap-3 text-teal-700 border-b border-gray-100 pb-3">
                    <div className="p-2.5 bg-teal-50 rounded-2xl border border-teal-200">
                      <BookOpen className="h-6 w-6 text-teal-700" />
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-gray-900">विषय-वार प्रश्न बैंक में जोड़ें</h3>
                      <p className="text-[11px] text-teal-700 font-bold">Daily Quiz Questions to Subject-Wise Sync</p>
                    </div>
                  </div>

                  <div className="bg-teal-50/70 p-3.5 rounded-2xl border border-teal-100 space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-500 font-bold">क्विज शीर्षक:</span>
                      <span className="font-extrabold text-gray-900">{dpSyncModalSet.title}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 font-bold">दिनांक व श्रेणी:</span>
                      <span className="font-bold text-gray-700">{dpSyncModalSet.date} | {dpSyncModalSet.category || 'सहायक शिक्षक'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 font-bold">कुल प्रश्न संख्या:</span>
                      <span className="font-black text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">{dpSyncModalSet.questions?.length || 0} प्रश्न</span>
                    </div>
                  </div>

                  <div className="space-y-3 pt-1">
                    <div>
                      <label className="text-xs font-bold text-gray-700 block mb-1">
                        लक्षित विषय (Target Subject):*
                      </label>
                      <select
                        value={dpSyncModalSubject}
                        onChange={(e) => {
                          const val = e.target.value;
                          setDpSyncModalSubject(val);
                          if (val !== '__custom__') {
                            const tops = getTopicsForSubject(val);
                            if (tops.length > 0) {
                              setDpSyncModalTopic(tops[0]);
                            }
                          }
                        }}
                        className="w-full p-2.5 text-xs font-bold bg-white border border-teal-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:bg-white shadow-xs"
                      >
                        {existingSubjectWiseSubjects.length > 0 ? (
                          existingSubjectWiseSubjects.map(sub => (
                            <option key={sub.name} value={sub.name}>
                              📚 {sub.name} ({sub.count} प्रश्न पहले से उपलब्ध)
                            </option>
                          ))
                        ) : (
                          <option value="छत्तीसगढ़ सामान्य ज्ञान">📚 छत्तीसगढ़ सामान्य ज्ञान</option>
                        )}
                        <option value="__custom__">➕ अन्य नया विषय दर्ज करें (Custom Subject)...</option>
                      </select>
                      {dpSyncModalSubject === '__custom__' && (
                        <div className="mt-2 space-y-1">
                          <label className="text-[10px] font-extrabold text-teal-900 block">नया विषय का नाम दर्ज करें:*</label>
                          <input
                            type="text"
                            placeholder="नया विषय का नाम दर्ज करें (उदा. छत्तीसगढ़ी भाषा)..."
                            value={dpSyncModalCustomSubject}
                            onChange={(e) => setDpSyncModalCustomSubject(e.target.value)}
                            className="w-full p-2.5 text-xs font-bold bg-white border-2 border-teal-400 rounded-xl focus:ring-2 focus:ring-teal-500 shadow-xs"
                          />
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="text-xs font-bold text-gray-700 block mb-1">
                        लक्षित अध्याय / टॉपिक (Target Topic):*
                      </label>
                      <input
                        type="text"
                        value={dpSyncModalTopic}
                        onChange={(e) => setDpSyncModalTopic(e.target.value)}
                        placeholder={dpSyncModalSet.title || "उदा. पर्यावरण अध्ययन या टॉपिक का नाम"}
                        className="w-full p-2.5 text-xs font-bold bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:bg-white"
                      />
                      {/* Existing topics suggestion chips */}
                      {dpSyncModalSubject !== '__custom__' && getTopicsForSubject(dpSyncModalSubject).length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 pt-2">
                          <span className="text-[10px] font-bold text-teal-900">मौजूदा टॉपिक:</span>
                          {getTopicsForSubject(dpSyncModalSubject).map(top => (
                            <button
                              key={top}
                              type="button"
                              onClick={() => setDpSyncModalTopic(top)}
                              className={`text-[10px] px-2 py-0.5 rounded-md border font-semibold cursor-pointer transition ${
                                dpSyncModalTopic === top
                                  ? 'bg-teal-700 text-white border-teal-800 shadow-xs'
                                  : 'bg-teal-50 text-teal-800 border-teal-200 hover:bg-teal-100'
                              }`}
                            >
                              {top}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => setDpSyncModalSet(null)}
                      className="px-4 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition cursor-pointer"
                    >
                      रद्द करें
                    </button>
                    <button
                      type="button"
                      disabled={dpSyncModalSaving}
                      onClick={() => handleSyncSetToSubjectWise(dpSyncModalSet, dpSyncModalSubject, dpSyncModalTopic)}
                      className="px-6 py-2.5 text-xs font-extrabold text-white bg-teal-700 hover:bg-teal-800 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-md disabled:opacity-50"
                    >
                      <Save className="h-4 w-4 text-amber-300" />
                      {dpSyncModalSaving ? "सिंक किया जा रहा है..." : `हाँ, ${dpSyncModalSet.questions?.length || 0} प्रश्न विषय-वार में जोड़ें`}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Custom Confirmation Modal for Deletions */}
            {deleteConfirm && (
              <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
                <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center gap-3 text-red-600 border-b border-gray-100 pb-3">
                    <div className="p-2.5 bg-red-100/80 rounded-2xl">
                      <Trash2 className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-gray-900">डिलीट करने की पुष्टि करें</h3>
                      <p className="text-[11px] text-gray-400 font-bold">Confirmation Required</p>
                    </div>
                  </div>

                  <p className="text-xs text-gray-700 font-bold leading-relaxed bg-red-50/50 p-3.5 rounded-2xl border border-red-100">
                    {deleteConfirm.type === 'category' && `क्या आप वाकई "${deleteConfirm.name}" विषय/पद श्रेणी कार्ड को हटाना चाहते हैं?`}
                    {deleteConfirm.type === 'allCategories' && `क्या आप वाकई सभी विषय/पद श्रेणी कार्ड्स को हटाना चाहते हैं?`}
                    {deleteConfirm.type === 'dpSet' && `क्या आप वाकई "${deleteConfirm.name || 'इस अभ्यास सेट'}" को हटाना चाहते हैं?`}
                  </p>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setDeleteConfirm(null)}
                      className="px-4 py-2.5 rounded-xl text-xs font-extrabold text-gray-600 hover:bg-gray-100 transition cursor-pointer border border-gray-200"
                    >
                      रद्द करें (Cancel)
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        const target = deleteConfirm;
                        setDeleteConfirm(null);
                        if (target.type === 'category' && target.id && target.name) {
                          await handleDeleteCategory(target.id, target.name);
                        } else if (target.type === 'allCategories') {
                          await handleDeleteAllCategories();
                        } else if (target.type === 'dpSet' && target.id) {
                          await handleDeleteDpSet(target.id);
                        }
                      }}
                      className="px-5 py-2.5 rounded-xl text-xs font-extrabold text-white bg-red-600 hover:bg-red-700 transition cursor-pointer shadow-md flex items-center gap-1.5"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      हाँ, हटाएं (Yes, Delete)
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* SUBJECT-WISE QUESTION MANAGEMENT TAB */}
        {activeSubTab === 'subjectWise' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-teal-800 via-emerald-800 to-teal-950 text-white p-6 rounded-3xl shadow-md border border-teal-700/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 bg-teal-500/20 text-teal-200 border border-teal-400/30 px-3 py-0.5 rounded-full text-[11px] font-bold">
                  <BookOpen className="h-3.5 w-3.5 text-teal-300" /> Subject-Wise Question Bank & Bulk HTML Importer
                </div>
                <h2 className="text-xl font-extrabold text-white">
                  📚 विषय-वार प्रश्न प्रबंधन (Subject-Wise Questions)
                </h2>
                <p className="text-xs text-teal-100/90 max-w-2xl font-medium leading-relaxed">
                  यहाँ से आप किसी भी विषय (जैसे छत्तीसगढ़ सामान्य ज्ञान, संविधान, इतिहास, भूगोल आदि) के प्रश्नों को <strong>बल्क में HTML कोड</strong> या <strong>सिंगल प्रश्न फॉर्म</strong> के माध्यम से सीधे डेटाबेस में जोड़ सकते हैं।
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-2 self-stretch md:self-auto">
                <button
                  type="button"
                  onClick={() => setSubInputMode('searchDelete')}
                  className="bg-red-500/20 hover:bg-red-500/30 text-red-200 border border-red-400/30 px-3.5 py-2.5 rounded-2xl text-xs font-extrabold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Trash2 className="h-4 w-4 text-red-300" />
                  🔍 कीवर्ड सर्च व बल्क डिलीट
                </button>
                <div className="bg-white/10 backdrop-blur-xs border border-white/20 px-4 py-3 rounded-2xl text-center self-stretch md:self-auto min-w-[150px]">
                  <span className="text-[11px] font-bold text-teal-200 block uppercase tracking-wider">कुल विषयवार प्रश्न</span>
                  <span className="text-2xl font-black text-white">
                    {questions.filter(q => !q.exam || q.exam.trim() === '').length}
                  </span>
                  <span className="text-[10px] text-teal-200/80 block mt-0.5">डेटाबेस में सुरक्षित</span>
                </div>
              </div>
            </div>

            {/* Notifications */}
            {subSuccessMsg && (
              <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center justify-between gap-3 text-emerald-900 text-xs font-bold shadow-xs">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />
                  <span>{subSuccessMsg}</span>
                </div>
                <button onClick={() => setSubSuccessMsg(null)} className="text-emerald-700 hover:text-emerald-900 text-xs font-black cursor-pointer">✕</button>
              </div>
            )}

            {subErrorMsg && (
              <div className="p-4 bg-red-50 border border-red-300 rounded-2xl flex items-center justify-between gap-3 text-red-900 text-xs font-bold shadow-xs">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
                  <span>{subErrorMsg}</span>
                </div>
                <button onClick={() => setSubErrorMsg(null)} className="text-red-700 hover:text-red-900 text-xs font-black cursor-pointer">✕</button>
              </div>
            )}

            {/* Settings & Mode Switcher */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Subject Selector */}
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-gray-800 flex items-center gap-1.5">
                    <BookOpen className="h-4 w-4 text-teal-600" />
                    विषय चुनें (Select Subject)*
                  </label>
                  <select
                    value={subSubject}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSubSubject(val);
                      if (val !== '__custom__') {
                        const tops = getTopicsForSubject(val);
                        if (tops.length > 0) {
                          setSubTopic(tops[0]);
                        }
                      }
                    }}
                    className="w-full p-2.5 text-xs font-bold bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:bg-white"
                  >
                    {existingSubjectWiseSubjects.length > 0 ? (
                      existingSubjectWiseSubjects.map(sub => (
                        <option key={sub.name} value={sub.name}>
                          📚 {sub.name} ({sub.count} प्रश्न पहले से मौजूद)
                        </option>
                      ))
                    ) : (
                      <option value="छत्तीसगढ़ सामान्य ज्ञान">📚 छत्तीसगढ़ सामान्य ज्ञान</option>
                    )}
                    <option value="__custom__">➕ अन्य नया विषय दर्ज करें (Custom Subject)...</option>
                  </select>

                  {subSubject === '__custom__' && (
                    <div className="mt-2 space-y-1">
                      <label className="text-[10px] font-extrabold text-teal-900 block">नया विषय का नाम दर्ज करें:*</label>
                      <input
                        type="text"
                        placeholder="नया विषय का नाम लिखें (उदा. कृषि विज्ञान, अर्थशास्त्र)..."
                        value={subCustomSubject}
                        onChange={(e) => setSubCustomSubject(e.target.value)}
                        className="w-full p-2.5 text-xs font-bold bg-white border-2 border-teal-400 rounded-xl focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                  )}
                </div>

                {/* Topic Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-gray-800 flex items-center gap-1.5">
                    <Layers className="h-4 w-4 text-teal-600" />
                    अध्याय / टॉपिक का नाम (Topic Name)*
                  </label>
                  <input
                    type="text"
                    placeholder="उदा. छत्तीसगढ़ की जनजातियां / मौलिक अधिकार / सिंधु सभ्यता"
                    value={subTopic}
                    onChange={(e) => setSubTopic(e.target.value)}
                    className="w-full p-2.5 text-xs font-bold bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:bg-white"
                  />
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {subSubject !== '__custom__' && getTopicsForSubject(subSubject).length > 0 ? (
                      <>
                        <span className="text-[10px] font-bold text-gray-500">मौजूदा टॉपिक:</span>
                        {getTopicsForSubject(subSubject).slice(0, 10).map(tag => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => setSubTopic(tag)}
                            className={`text-[10px] px-2 py-0.5 rounded-md border font-semibold cursor-pointer transition ${
                              subTopic === tag
                                ? 'bg-teal-700 text-white border-teal-800 shadow-xs'
                                : 'bg-teal-50 text-teal-800 border-teal-200 hover:bg-teal-100'
                            }`}
                          >
                            {tag}
                          </button>
                        ))}
                      </>
                    ) : (
                      ["सामान्य परिचय", "इतिहास व संस्कृति", "प्रशासनिक ढांचा", "भौगोलिक परिदृश्य", "प्रमुख तथ्य"].map(tag => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => setSubTopic(tag)}
                          className="text-[10px] bg-teal-50 text-teal-800 border border-teal-200 px-2 py-0.5 rounded-md hover:bg-teal-100 cursor-pointer font-semibold"
                        >
                          +{tag}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Mode Toggle Buttons */}
              <div className="flex items-center justify-between border-t border-gray-100 pt-3 flex-wrap gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-gray-600">प्रश्न इनपुट मोड:</span>
                  <button
                    type="button"
                    onClick={() => setSubInputMode('bulkHtml')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 cursor-pointer ${
                      subInputMode === 'bulkHtml'
                        ? 'bg-teal-700 text-white shadow-xs'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Code2 className="h-4 w-4" />
                    ⚡ बल्क HTML कोड पार्सर (HTML Parser)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSubInputMode('importDp')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 cursor-pointer ${
                      subInputMode === 'importDp'
                        ? 'bg-teal-700 text-white shadow-xs'
                        : 'bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100'
                    }`}
                  >
                    <BookOpen className="h-4 w-4 text-emerald-600" />
                    📥 डेली क्विज से आयात करें (Import from Daily Quiz)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSubInputMode('manual')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 cursor-pointer ${
                      subInputMode === 'manual'
                        ? 'bg-teal-700 text-white shadow-xs'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <PlusCircle className="h-4 w-4" />
                    📝 सिंगल प्रश्न फॉर्म (Manual Form)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSubInputMode('searchDelete')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 cursor-pointer ${
                      subInputMode === 'searchDelete'
                        ? 'bg-red-600 text-white shadow-xs ring-2 ring-red-300'
                        : 'bg-red-50 text-red-800 border border-red-200 hover:bg-red-100'
                    }`}
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                    🗑️ शब्द/कीवर्ड सर्च व बल्क डिलीट
                  </button>
                </div>
              </div>
            </div>

            {/* IMPORT FROM DAILY PRACTICE SECTION */}
            {subInputMode === 'importDp' && (
              <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-gray-100">
                  <div>
                    <h3 className="text-sm font-extrabold text-gray-900 flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-teal-600" />
                      डेली क्विज सेट से प्रश्न आयात करें (Import from Daily Quiz Set)
                    </h3>
                    <p className="text-[11px] text-gray-500 font-medium mt-0.5">
                      डेली प्रैक्टिस में बनाए गए किसी भी क्विज सेट के प्रश्नों को सीधे विषय-वार बैंक में जोड़ें या लोड करके एडिट करें।
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={fetchDailyPractice}
                    className="text-xs font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-3 py-1.5 rounded-xl transition flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="h-3.5 w-3.5" /> सेट्स रिफ्रेश करें
                  </button>
                </div>

                {dpList.length === 0 ? (
                  <div className="p-8 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-300 space-y-2">
                    <BookOpen className="h-8 w-8 text-gray-400 mx-auto" />
                    <p className="text-xs font-bold text-gray-600">कोई डेली प्रैक्टिस सेट उपलब्ध नहीं है।</p>
                    <p className="text-[11px] text-gray-400 font-medium">कृपया पहले 'डेली प्रैक्टिस क्विज' टैब में जाकर क्विज सेट बनाएं।</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-extrabold text-gray-800 block">
                        डेली प्रैक्टिस सेट चुनें (Select Daily Practice Set)*
                      </label>
                      <select
                        value={subDpImportSetId}
                        onChange={(e) => {
                          const selectedId = e.target.value;
                          setSubDpImportSetId(selectedId);
                          const found = dpList.find(s => s.id === selectedId);
                          if (found) {
                            if (found.subject && subSubject === 'छत्तीसगढ़ सामान्य ज्ञान') setSubSubject(found.subject);
                            if (found.title) setSubTopic(found.title);
                          }
                        }}
                        className="w-full p-2.5 text-xs font-bold bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:bg-white"
                      >
                        <option value="">-- डेली प्रैक्टिस सेट चुनें --</option>
                        {dpList.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.date} | {s.category || 'सहायक शिक्षक'} | {s.title} ({s.questions?.length || 0} प्रश्न)
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Selected Set Details & Action Buttons */}
                    {subDpImportSetId && (() => {
                      const selectedSet = dpList.find(s => s.id === subDpImportSetId);
                      if (!selectedSet) return null;
                      const qCount = selectedSet.questions?.length || 0;

                      return (
                        <div className="p-4 bg-teal-50/70 border border-teal-200 rounded-2xl space-y-3">
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-teal-200/60 pb-2.5">
                            <div>
                              <h4 className="text-xs font-extrabold text-teal-950">{selectedSet.title}</h4>
                              <p className="text-[11px] text-teal-800 font-medium">
                                दिनांक: {selectedSet.date} • श्रेणी: {selectedSet.category || 'सहायक शिक्षक'} • लक्ष्य: {selectedSet.targetExam || 'CGPSC/व्यापमं'}
                              </p>
                            </div>
                            <span className="text-xs font-black text-teal-900 bg-teal-200/80 px-3 py-1 rounded-xl">
                              {qCount} प्रश्न
                            </span>
                          </div>

                          <div className="text-[11px] text-teal-900 font-medium">
                            👉 ये {qCount} प्रश्न <strong>'{subSubject === '__custom__' ? subCustomSubject : subSubject}'</strong> विषय के <strong>'{subTopic || selectedSet.title}'</strong> टॉपिक में जोड़े जाएंगे।
                          </div>

                          <div className="flex flex-wrap items-center gap-3 pt-1">
                            <button
                              type="button"
                              disabled={subDpImportLoading || qCount === 0}
                              onClick={async () => {
                                const finalSub = (subSubject === '__custom__' ? subCustomSubject.trim() : subSubject.trim()) || selectedSet.subject || 'छत्तीसगढ़ सामान्य ज्ञान';
                                const finalTop = subTopic.trim() || selectedSet.title;
                                setSubDpImportLoading(true);
                                await handleSyncSetToSubjectWise(selectedSet, finalSub, finalTop);
                                setSubDpImportLoading(false);
                                setSubSuccessMsg(`सफलतापूर्वक '${selectedSet.title}' के ${qCount} प्रश्न विषय-वार बैंक (${finalSub} > ${finalTop}) में सुरक्षित कर दिए गए हैं!`);
                              }}
                              className="px-5 py-2.5 rounded-xl text-xs font-extrabold text-white bg-teal-700 hover:bg-teal-800 transition flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
                            >
                              <Save className="h-4 w-4 text-amber-300" />
                              {subDpImportLoading ? "जोड़ा जा रहा है..." : `⚡ सीधे विषय-वार बैंक में सहेजें (${qCount} प्रश्न)`}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleLoadDpSetIntoSubjectWise(selectedSet.id)}
                              className="px-5 py-2.5 rounded-xl text-xs font-extrabold text-teal-900 bg-white border border-teal-300 hover:bg-teal-100 transition flex items-center gap-2 cursor-pointer shadow-xs"
                            >
                              <Eye className="h-4 w-4 text-teal-700" />
                              📋 नीचे लोड करें एवं रिव्यू करें (Load to Parser)
                            </button>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            )}

            {/* BULK HTML PARSER SECTION */}
            {subInputMode === 'bulkHtml' && (
              <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-gray-100">
                  <div>
                    <h3 className="text-sm font-extrabold text-gray-900 flex items-center gap-2">
                      <Code2 className="h-4 w-4 text-teal-600" />
                      HTML कोड बॉक्स में प्रश्न पेस्ट करें (Paste Questions HTML)
                    </h3>
                    <p className="text-[11px] text-gray-500 font-medium mt-0.5">
                      आप किसी भी वर्ड/वेबसाइट से फॉर्मेट किया हुआ HTML कोड यहाँ पेस्ट करके एक क्लिक में पार्स कर सकते हैं।
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleLoadSubjectSampleHtml}
                      className="text-xs font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-3 py-1.5 rounded-xl transition flex items-center gap-1 cursor-pointer"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                      नमूना HTML कोड लोड करें
                    </button>
                    {subBulkHtmlText && (
                      <button
                        type="button"
                        onClick={() => { setSubBulkHtmlText(''); setSubParsedQuestions([]); }}
                        className="text-xs font-bold text-red-600 hover:bg-red-50 px-2.5 py-1.5 rounded-xl transition cursor-pointer"
                      >
                        साफ करें
                      </button>
                    )}
                  </div>
                </div>

                <div className="relative">
                  <textarea
                    rows={9}
                    value={subBulkHtmlText}
                    onChange={(e) => setSubBulkHtmlText(e.target.value)}
                    placeholder={`यहाँ HTML कोड पेस्ट करें, उदाहरण:\n<div class="question-block">\n  <p><b>प्रश्न 1:</b> छत्तीसगढ़ राज्य का गठन कब हुआ था?</p>\n  <div class="options">\n    <p>A. 1 नवंबर 2000</p>\n    <p>B. 1 दिसंबर 2000</p>\n    <p>C. 9 नवंबर 2000</p>\n    <p>D. 15 नवंबर 2000</p>\n  </div>\n  <p class="answer">A</p>\n  <div class="explanation"><b>व्याख्या:</b> छत्तीसगढ़ 1 नवंबर 2000 को भारत का 26वां राज्य बना।</div>\n</div>`}
                    className="w-full p-3.5 text-xs font-mono bg-slate-900 text-teal-300 rounded-xl border border-slate-700 focus:ring-2 focus:ring-teal-500 focus:outline-none leading-relaxed"
                  />
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleParseSubjectBulkHtml}
                    className="w-full sm:w-auto px-6 py-3 rounded-xl text-xs font-extrabold text-white bg-teal-700 hover:bg-teal-800 transition flex items-center justify-center gap-2 cursor-pointer shadow-md"
                  >
                    <Wand2 className="h-4 w-4 text-amber-300" />
                    ⚡ HTML कोड पार्स करें व पूर्वावलोकन देखें (Parse & Preview)
                  </button>

                  {subParsedQuestions.length > 0 && (
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button
                        type="button"
                        disabled={subSaving}
                        onClick={() => handleSaveSubjectQuestions('append')}
                        className="flex-1 sm:flex-none px-6 py-3 rounded-xl text-xs font-extrabold text-white bg-emerald-700 hover:bg-emerald-800 transition flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
                      >
                        <Save className="h-4 w-4" />
                        {subSaving ? "सहेजा जा रहा है..." : `💾 ${subParsedQuestions.length} प्रश्न बैंक में सुरक्षित करें (Save)`}
                      </button>
                    </div>
                  )}
                </div>

                {/* PARSED PREVIEW ACCORDION */}
                {subParsedQuestions.length > 0 && (
                  <div className="mt-6 space-y-3 pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between bg-teal-50 p-3.5 rounded-xl border border-teal-200">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-teal-700" />
                        <span className="text-xs font-extrabold text-teal-900">
                          पार्स किए गए प्रश्न ({subParsedQuestions.length}) — लाइव पूर्वावलोकन
                        </span>
                      </div>
                      <span className="text-[11px] text-teal-700 font-bold">
                        विषय: {subSubject === '__custom__' ? subCustomSubject : subSubject} | टॉपिक: {subTopic || "सामान्य"}
                      </span>
                    </div>

                    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                      {subParsedQuestions.map((q, idx) => (
                        <div
                          key={q.id || idx}
                          className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs hover:border-teal-300 transition"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-2.5 flex-1">
                              <span className="shrink-0 w-6 h-6 rounded-lg bg-teal-100 text-teal-900 text-xs font-black flex items-center justify-center">
                                {idx + 1}
                              </span>
                              <div className="space-y-2 flex-1">
                                <RichTextRenderer
                                  content={q.text_hi}
                                  as="div"
                                  className="text-xs font-bold text-gray-900"
                                />
                                
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                                  {q.options_hi.map((opt, optIdx) => (
                                    <div
                                      key={optIdx}
                                      className={`p-2 rounded-lg text-xs font-medium border flex items-start gap-2 ${
                                        q.correctAnswer === optIdx
                                          ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold'
                                          : 'bg-gray-50 border-gray-200 text-gray-700'
                                      }`}
                                    >
                                      <span className={`w-4 h-4 rounded-full text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5 ${
                                        q.correctAnswer === optIdx
                                          ? 'bg-emerald-600 text-white'
                                          : 'bg-gray-200 text-gray-600'
                                      }`}>
                                        {String.fromCharCode(65 + optIdx)}
                                      </span>
                                      <RichTextRenderer content={opt} as="span" className="flex-1" />
                                      {q.correctAnswer === optIdx && (
                                        <Check className="h-3.5 w-3.5 text-emerald-600 ml-auto shrink-0 mt-0.5" />
                                      )}
                                    </div>
                                  ))}
                                </div>

                                {q.explanation_hi && (
                                  <div className="bg-amber-50/70 border border-amber-200 rounded-lg p-2.5 text-[11px] text-amber-900 font-medium">
                                    <span className="font-bold text-amber-950 block mb-1">व्याख्या: </span>
                                    <RichTextRenderer content={q.explanation_hi} as="div" />
                                  </div>
                                )}
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => setSubParsedQuestions(subParsedQuestions.filter((_, i) => i !== idx))}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                              title="हटाएं"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* MANUAL SINGLE QUESTION FORM */}
            {subInputMode === 'manual' && (
              <form onSubmit={handleSaveSingleSubjectQuestion} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs space-y-4">
                <div className="pb-2 border-b border-gray-100">
                  <h3 className="text-sm font-extrabold text-gray-900 flex items-center gap-2">
                    <PlusCircle className="h-4 w-4 text-teal-600" />
                    सिंगल प्रश्न जोड़ें (Add Single Question)
                  </h3>
                  <p className="text-[11px] text-gray-500 font-medium mt-0.5">
                    विषय: <strong>{subSubject === '__custom__' ? subCustomSubject : subSubject}</strong> | टॉपिक: <strong>{subTopic || "सामान्य"}</strong>
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700 block">प्रश्न (हिन्दी में)*</label>
                  <textarea
                    rows={3}
                    required
                    value={subSingleTextHi}
                    onChange={(e) => setSubSingleTextHi(e.target.value)}
                    placeholder="प्रश्न का संपूर्ण विवरण यहाँ लिखें..."
                    className="w-full p-2.5 text-xs font-bold bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:bg-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {subSingleOptionsHi.map((opt, optIdx) => (
                    <div key={optIdx} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-gray-700">
                          विकल्प {String.fromCharCode(65 + optIdx)}*
                        </label>
                        <label className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-700 cursor-pointer">
                          <input
                            type="radio"
                            name="subCorrectAnswer"
                            checked={subSingleCorrectAnswer === optIdx}
                            onChange={() => setSubSingleCorrectAnswer(optIdx)}
                            className="text-teal-600 focus:ring-teal-500"
                          />
                          सही उत्तर (Correct)
                        </label>
                      </div>
                      <input
                        type="text"
                        required={optIdx < 2}
                        value={opt}
                        onChange={(e) => {
                          const updated = [...subSingleOptionsHi];
                          updated[optIdx] = e.target.value;
                          setSubSingleOptionsHi(updated);
                        }}
                        placeholder={`विकल्प ${String.fromCharCode(65 + optIdx)} का टेक्स्ट`}
                        className={`w-full p-2.5 text-xs font-bold rounded-xl border focus:ring-2 focus:ring-teal-500 ${
                          subSingleCorrectAnswer === optIdx
                            ? 'bg-emerald-50 border-emerald-300'
                            : 'bg-gray-50 border-gray-300'
                        }`}
                      />
                    </div>
                  ))}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700 block">विस्तृत व्याख्या / समाधान (Explanation)</label>
                  <textarea
                    rows={2}
                    value={subSingleExplanationHi}
                    onChange={(e) => setSubSingleExplanationHi(e.target.value)}
                    placeholder="प्रश्न के सही उत्तर का संक्षिप्त विवरण एवं संदर्भ..."
                    className="w-full p-2.5 text-xs bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:bg-white"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={subSaving}
                    className="px-6 py-2.5 rounded-xl text-xs font-extrabold text-white bg-teal-700 hover:bg-teal-800 transition flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
                  >
                    <Save className="h-4 w-4" />
                    {subSaving ? "सहेजा जा रहा है..." : "डेटाबेस में प्रश्न सुरक्षित करें (Save Question)"}
                  </button>
                </div>
              </form>
            )}

            {/* KEYWORD SEARCH & BULK DELETE SECTION */}
            {subInputMode === 'searchDelete' && (
              <div className="bg-white rounded-3xl border-2 border-red-200 p-6 shadow-sm space-y-6">
                {/* Header Title */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-red-100">
                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-1.5 bg-red-100 text-red-800 px-3 py-0.5 rounded-full text-[11px] font-extrabold">
                      <Trash2 className="h-3.5 w-3.5 text-red-600" /> बल्क डिलीट टूल (Bulk Delete Tool)
                    </div>
                    <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                      🔍 शब्द / कीवर्ड सर्च करके एक साथ प्रश्न डिलीट करें
                    </h3>
                    <p className="text-xs text-gray-600 font-medium leading-relaxed max-w-3xl">
                      यहाँ किसी भी शब्द (जैसे <em>'कालिदास'</em>, <em>'कवर्धा'</em>, <em>'बस्तर'</em>, <em>'1942'</em> आदि) को खोजें। उससे संबंधित सभी प्रश्न तुरंत फिल्टर होकर सामने आ जाएंगे और आप <strong>1-क्लिक में उन सभी को एक साथ डिलीट</strong> कर सकते हैं।
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setKwSearchQuery('');
                      setKwSearchSubject('all');
                      setKwSearchTopic('all');
                      setKwSelectedIds(new Set());
                    }}
                    className="text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-xl transition flex items-center gap-1 self-start cursor-pointer"
                  >
                    <RefreshCw className="h-3.5 w-3.5" /> रीसेट करें
                  </button>
                </div>

                {/* Filters Row */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-red-50/40 p-4 rounded-2xl border border-red-100">
                  {/* Keyword Input */}
                  <div className="md:col-span-2 space-y-1">
                    <label className="text-xs font-extrabold text-gray-800 flex items-center gap-1.5">
                      <Search className="h-3.5 w-3.5 text-red-600" />
                      सर्च शब्द / कीवर्ड लिखें (Search Keyword)*
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="उदा. कालिदास, बस्तर, कवर्धा, डायनामाइट, 1942..."
                        value={kwSearchQuery}
                        onChange={(e) => {
                          setKwSearchQuery(e.target.value);
                          setKwSelectedIds(new Set());
                        }}
                        className="w-full pl-3.5 pr-9 py-2.5 text-xs font-extrabold bg-white border-2 border-red-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 shadow-xs"
                      />
                      {kwSearchQuery && (
                        <button
                          type="button"
                          onClick={() => setKwSearchQuery('')}
                          className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-700 cursor-pointer"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Subject Filter */}
                  <div className="space-y-1">
                    <label className="text-xs font-extrabold text-gray-800 flex items-center gap-1.5">
                      <BookOpen className="h-3.5 w-3.5 text-red-600" />
                      विषय (Subject Filter)
                    </label>
                    <select
                      value={kwSearchSubject}
                      onChange={(e) => {
                        setKwSearchSubject(e.target.value);
                        setKwSearchTopic('all');
                        setKwSelectedIds(new Set());
                      }}
                      className="w-full p-2.5 text-xs font-bold bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500"
                    >
                      <option value="all">सभी विषय (All Subjects)</option>
                      {availableSubSubjects.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  {/* Topic Filter */}
                  <div className="space-y-1">
                    <label className="text-xs font-extrabold text-gray-800 flex items-center gap-1.5">
                      <Layers className="h-3.5 w-3.5 text-red-600" />
                      टॉपिक (Topic Filter)
                    </label>
                    <select
                      value={kwSearchTopic}
                      onChange={(e) => {
                        setKwSearchTopic(e.target.value);
                        setKwSelectedIds(new Set());
                      }}
                      className="w-full p-2.5 text-xs font-bold bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500"
                    >
                      <option value="all">सभी टॉपिक्स (All Topics)</option>
                      {availableSubTopics.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Scope selector & Suggestions */}
                <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-gray-700 text-xs">खोज का दायरा:</span>
                    {(['all', 'text', 'topic', 'explanation'] as const).map(sc => (
                      <button
                        key={sc}
                        type="button"
                        onClick={() => setKwSearchScope(sc)}
                        className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition cursor-pointer ${
                          kwSearchScope === sc
                            ? 'bg-red-600 text-white shadow-xs'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {sc === 'all' && 'पूरा प्रश्न व व्याख्या (All)'}
                        {sc === 'text' && 'केवल प्रश्न (Question Only)'}
                        {sc === 'topic' && 'केवल टॉपिक (Topic Only)'}
                        {sc === 'explanation' && 'केवल व्याख्या (Explanation Only)'}
                      </button>
                    ))}
                  </div>

                  <div className="text-[11px] font-bold text-gray-500">
                    मिलान परिणाम: <span className="text-red-700 font-extrabold text-xs">{matchedSubjectQuestions.length}</span> प्रश्न
                  </div>
                </div>

                {/* Action Bar (Prominent Deletion Buttons) */}
                <div className="bg-gradient-to-r from-red-50 via-rose-50 to-orange-50 border-2 border-red-300 p-4 rounded-2xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        if (kwSelectedIds.size === matchedSubjectQuestions.length) {
                          setKwSelectedIds(new Set());
                        } else {
                          setKwSelectedIds(new Set(matchedSubjectQuestions.map(q => q.id)));
                        }
                      }}
                      className="flex items-center gap-1.5 text-xs font-extrabold text-gray-800 bg-white border border-gray-300 hover:border-gray-400 px-3 py-2 rounded-xl transition cursor-pointer shadow-xs"
                    >
                      {kwSelectedIds.size === matchedSubjectQuestions.length && matchedSubjectQuestions.length > 0 ? (
                        <>
                          <CheckSquare className="h-4 w-4 text-red-600" />
                          सभी अनचयनित करें
                        </>
                      ) : (
                        <>
                          <Square className="h-4 w-4 text-gray-400" />
                          सभी चुनें ({matchedSubjectQuestions.length})
                        </>
                      )}
                    </button>

                    {kwSelectedIds.size > 0 && (
                      <span className="text-xs font-black text-red-700 bg-red-100 px-2.5 py-1 rounded-lg">
                        {kwSelectedIds.size} प्रश्न चयनित
                      </span>
                    )}
                  </div>

                  {/* Execution Delete Buttons */}
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Delete Selected Button */}
                    <button
                      type="button"
                      disabled={kwDeleting || kwSelectedIds.size === 0}
                      onClick={() => {
                        const idsArr = Array.from(kwSelectedIds);
                        setKwModalConfirm({
                          open: true,
                          type: 'selected',
                          count: idsArr.length,
                          ids: idsArr
                        });
                      }}
                      className="px-4 py-2 rounded-xl text-xs font-extrabold text-red-700 bg-white border-2 border-red-400 hover:bg-red-50 transition cursor-pointer shadow-xs disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
                    >
                      <Trash className="h-4 w-4" />
                      चयनित ({kwSelectedIds.size}) डिलीट करें
                    </button>

                    {/* Delete ALL Matching Keyword Button */}
                    <button
                      type="button"
                      disabled={kwDeleting || matchedSubjectQuestions.length === 0 || !kwSearchQuery.trim()}
                      onClick={() => {
                        setKwModalConfirm({
                          open: true,
                          type: 'allKeyword',
                          keyword: kwSearchQuery.trim(),
                          count: matchedSubjectQuestions.length
                        });
                      }}
                      className="px-5 py-2.5 rounded-xl text-xs font-black text-white bg-red-600 hover:bg-red-700 transition cursor-pointer shadow-md disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      {kwDeleting ? "डिलीट हो रहा है..." : `🚨 '${kwSearchQuery.trim() || "शब्द"}' वाले सभी ${matchedSubjectQuestions.length} प्रश्न एक साथ डिलीट करें`}
                    </button>
                  </div>
                </div>

                {/* List of Matching Questions */}
                <div className="space-y-3">
                  {matchedSubjectQuestions.length === 0 ? (
                    <div className="p-12 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-300 space-y-2">
                      <Search className="h-8 w-8 text-gray-400 mx-auto" />
                      <p className="text-xs font-extrabold text-gray-700">
                        {kwSearchQuery.trim() ? `'${kwSearchQuery}' से संबंधित कोई विषयवार प्रश्न नहीं मिला।` : "कृपया ऊपर किसी शब्द या कीवर्ड को टाइप करें।"}
                      </p>
                      <p className="text-[11px] text-gray-500 font-medium">
                        आप विषय या टॉपिक फिल्टर भी बदल कर देख सकते हैं।
                      </p>
                    </div>
                  ) : (
                    matchedSubjectQuestions.map((q, idx) => {
                      const isSelected = kwSelectedIds.has(q.id);
                      const isExp = kwExpandedId === q.id;

                      return (
                        <div
                          key={q.id || idx}
                          className={`rounded-2xl border-2 transition p-4 space-y-3 ${
                            isSelected
                              ? 'bg-red-50/50 border-red-400 shadow-xs'
                              : 'bg-white border-gray-200 hover:border-red-200'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            {/* Checkbox and Question Body */}
                            <div className="flex items-start gap-3 flex-1">
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = new Set(kwSelectedIds);
                                  if (updated.has(q.id)) {
                                    updated.delete(q.id);
                                  } else {
                                    updated.add(q.id);
                                  }
                                  setKwSelectedIds(updated);
                                }}
                                className="mt-0.5 cursor-pointer text-red-600 hover:opacity-80"
                              >
                                {isSelected ? (
                                  <CheckSquare className="h-5 w-5 text-red-600" />
                                ) : (
                                  <Square className="h-5 w-5 text-gray-400" />
                                )}
                              </button>

                              <div className="space-y-1.5 flex-1">
                                <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-extrabold">
                                  <span className="bg-teal-50 text-teal-800 border border-teal-200 px-2 py-0.5 rounded-md">
                                    {renderHighlightedText(q.subject, kwSearchQuery)}
                                  </span>
                                  <span className="bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 rounded-md">
                                    {renderHighlightedText(q.topic, kwSearchQuery)}
                                  </span>
                                  <span className="text-gray-400 font-mono text-[10px]">
                                    #{idx + 1}
                                  </span>
                                </div>

                                <h4 className="text-xs sm:text-sm font-bold text-gray-900 leading-relaxed font-sans">
                                  {renderHighlightedText(q.text_hi, kwSearchQuery)}
                                </h4>
                              </div>
                            </div>

                            {/* Actions on this question */}
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => setKwExpandedId(isExp ? null : q.id)}
                                className="text-[11px] font-bold text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 px-2.5 py-1.5 rounded-lg transition cursor-pointer"
                              >
                                {isExp ? "कम देखें ▴" : "विकल्प देखें ▾"}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteQuestion(q.id)}
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                                title="यह सिंगल प्रश्न डिलीट करें"
                              >
                                <Trash className="h-4 w-4" />
                              </button>
                            </div>
                          </div>

                          {/* Options and Explanation Accordion */}
                          {isExp && (
                            <div className="pt-3 border-t border-gray-100 space-y-2 bg-gray-50/70 p-3 rounded-xl mt-1 text-xs">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {q.options_hi.map((opt, oIdx) => (
                                  <div
                                    key={oIdx}
                                    className={`p-2 rounded-lg border text-xs ${
                                      oIdx === q.correctAnswer
                                        ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold'
                                        : 'bg-white border-gray-200 text-gray-700'
                                    }`}
                                  >
                                    <span className="font-mono mr-1">{String.fromCharCode(65 + oIdx)}.</span>
                                    {renderHighlightedText(opt, kwSearchQuery)}
                                    {oIdx === q.correctAnswer && ' ✓ (सही उत्तर)'}
                                  </div>
                                ))}
                              </div>

                              {q.explanation_hi && (
                                <div className="text-xs text-gray-700 bg-amber-50/60 border border-amber-200 p-2.5 rounded-lg mt-1 leading-relaxed">
                                  <strong className="text-amber-900">💡 व्याख्या: </strong>
                                  {renderHighlightedText(q.explanation_hi, kwSearchQuery)}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* PYQ (PREVIOUS YEAR QUESTIONS) MANAGEMENT TAB */}
        {activeSubTab === 'pyq' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-indigo-900 via-blue-900 to-slate-950 text-white p-6 rounded-3xl shadow-md border border-indigo-700/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 bg-indigo-500/20 text-indigo-200 border border-indigo-400/30 px-3 py-0.5 rounded-full text-[11px] font-bold">
                  <Database className="h-3.5 w-3.5 text-indigo-300" /> PYQs Bank & Bulk HTML Importer
                </div>
                <h2 className="text-xl font-extrabold text-white">
                  🏛️ विगत वर्ष प्रश्न प्रबंधन (Previous Year Questions)
                </h2>
                <p className="text-xs text-indigo-100/90 max-w-2xl font-medium leading-relaxed">
                  विभिन्न प्रतियोगी परीक्षाओं (<strong>CGPSC Prelims, CG Vyapam छात्रावास अधीक्षक, CG TET, RI, पटवारी</strong> आदि) के पूर्व वर्षों के प्रश्न <strong>HTML कोड</strong> या <strong>फॉर्म</strong> से डेटाबेस में जोड़ें।
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-xs border border-white/20 px-4 py-3 rounded-2xl text-center self-stretch md:self-auto min-w-[150px]">
                <span className="text-[11px] font-bold text-indigo-200 block uppercase tracking-wider">कुल PYQ प्रश्न</span>
                <span className="text-2xl font-black text-white">
                  {questions.filter(q => q.exam && q.exam.trim() !== '').length}
                </span>
                <span className="text-[10px] text-indigo-200/80 block mt-0.5">डेटाबेस में सुरक्षित</span>
              </div>
            </div>

            {/* Notifications */}
            {pyqSuccessMsg && (
              <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center justify-between gap-3 text-emerald-900 text-xs font-bold shadow-xs">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />
                  <span>{pyqSuccessMsg}</span>
                </div>
                <button onClick={() => setPyqSuccessMsg(null)} className="text-emerald-700 hover:text-emerald-900 text-xs font-black cursor-pointer">✕</button>
              </div>
            )}

            {pyqErrorMsg && (
              <div className="p-4 bg-red-50 border border-red-300 rounded-2xl flex items-center justify-between gap-3 text-red-900 text-xs font-bold shadow-xs">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
                  <span>{pyqErrorMsg}</span>
                </div>
                <button onClick={() => setPyqErrorMsg(null)} className="text-red-700 hover:text-red-900 text-xs font-black cursor-pointer">✕</button>
              </div>
            )}

            {/* Settings & Mode Switcher */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {/* Exam Selector */}
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-gray-800 flex items-center gap-1.5">
                    <GraduationCap className="h-4 w-4 text-indigo-600" />
                    परीक्षा का नाम (Exam)*
                  </label>
                  <select
                    value={pyqExam}
                    onChange={(e) => setPyqExam(e.target.value)}
                    className="w-full p-2.5 text-xs font-bold bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  >
                    <option value="CGPSC Prelims">CGPSC Prelims (राज्य सेवा)</option>
                    <option value="CG Vyapam छात्रावास अधीक्षक">CG Vyapam छात्रावास अधीक्षक (Hostel Warden)</option>
                    <option value="CG TET">CG TET (शिक्षक पात्रता परीक्षा)</option>
                    <option value="CG सहायक शिक्षक भर्ती">CG सहायक शिक्षक भर्ती (Assistant Teacher)</option>
                    <option value="CG Vyapam राजस्व निरीक्षक (RI)">CG Vyapam राजस्व निरीक्षक (RI)</option>
                    <option value="CG Vyapam पटवारी">CG Vyapam पटवारी (Patwari)</option>
                    <option value="CG Vyapam मंडी निरीक्षक">CG Vyapam मंडी निरीक्षक (Mandi Nirikshak)</option>
                    <option value="CG Police सब इंस्पेक्टर (SI)">CG Police सब इंस्पेक्टर (SI Exam)</option>
                    <option value="CG Vyapam ADO">CG Vyapam ADO (सहायक विकास विस्तार अधिकारी)</option>
                    <option value="CG Forest Guard">CG Forest Guard (वनरक्षक)</option>
                    <option value="__custom__">➕ अन्य परीक्षा का नाम लिखें (Custom)...</option>
                  </select>

                  {pyqExam === '__custom__' && (
                    <input
                      type="text"
                      placeholder="परीक्षा का नाम लिखें"
                      value={pyqCustomExam}
                      onChange={(e) => setPyqCustomExam(e.target.value)}
                      className="w-full mt-2 p-2.5 text-xs font-bold bg-white border border-indigo-400 rounded-xl focus:ring-2 focus:ring-indigo-500"
                    />
                  )}
                </div>

                {/* Exam Year */}
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-gray-800 flex items-center gap-1.5">
                    वर्ष (Exam Year)*
                  </label>
                  <select
                    value={pyqYear}
                    onChange={(e) => setPyqYear(parseInt(e.target.value) || 2024)}
                    className="w-full p-2.5 text-xs font-bold bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  >
                    {[2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015, 2014, 2013, 2012].map(yr => (
                      <option key={yr} value={yr}>{yr}</option>
                    ))}
                  </select>
                </div>

                {/* Subject for PYQ */}
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-gray-800 flex items-center gap-1.5">
                    <BookOpen className="h-4 w-4 text-indigo-600" />
                    विषय (Subject)*
                  </label>
                  <select
                    value={pyqSubject}
                    onChange={(e) => setPyqSubject(e.target.value)}
                    className="w-full p-2.5 text-xs font-bold bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  >
                    <option value="छत्तीसगढ़ सामान्य ज्ञान">छत्तीसगढ़ सामान्य ज्ञान</option>
                    <option value="सामान्य अध्ययन (GS Paper 1)">सामान्य अध्ययन (GS Paper 1)</option>
                    <option value="भारतीय संविधान एवं राजव्यवस्था">भारतीय संविधान एवं राजव्यवस्था</option>
                    <option value="भारतीय इतिहास">भारतीय इतिहास</option>
                    <option value="भूगोल (भारत एवं छत्तीसगढ़)">भूगोल (भारत एवं छत्तीसगढ़)</option>
                    <option value="सामान्य विज्ञान एवं प्रौद्योगिकी">सामान्य विज्ञान एवं प्रौद्योगिकी</option>
                    <option value="हिन्दी भाषा">हिन्दी भाषा</option>
                    <option value="छत्तीसगढ़ी भाषा">छत्तीसगढ़ी भाषा</option>
                    <option value="कंप्यूटर ज्ञान">कंप्यूटर ज्ञान</option>
                    <option value="गणित एवं रीजनिंग">गणित एवं रीजनिंग</option>
                  </select>
                </div>

                {/* Topic for PYQ */}
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-gray-800 flex items-center gap-1.5">
                    <Layers className="h-4 w-4 text-indigo-600" />
                    टॉपिक / भाग (Topic)
                  </label>
                  <input
                    type="text"
                    placeholder="उदा. पेपर 1 / भाग 1 / इतिहास"
                    value={pyqTopic}
                    onChange={(e) => setPyqTopic(e.target.value)}
                    className="w-full p-2.5 text-xs font-bold bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  />
                </div>
              </div>

              {/* Mode Toggle Buttons */}
              <div className="flex items-center justify-between border-t border-gray-100 pt-3 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-600">प्रश्न इनपुट मोड:</span>
                  <button
                    type="button"
                    onClick={() => setPyqInputMode('bulkHtml')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 cursor-pointer ${
                      pyqInputMode === 'bulkHtml'
                        ? 'bg-indigo-700 text-white shadow-xs'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Code2 className="h-4 w-4" />
                    ⚡ बल्क HTML कोड पार्सर (HTML Parser)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPyqInputMode('manual')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 cursor-pointer ${
                      pyqInputMode === 'manual'
                        ? 'bg-indigo-700 text-white shadow-xs'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <PlusCircle className="h-4 w-4" />
                    📝 सिंगल PYQ फॉर्म (Manual Form)
                  </button>
                </div>
              </div>
            </div>

            {/* BULK HTML PARSER SECTION FOR PYQ */}
            {pyqInputMode === 'bulkHtml' && (
              <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-gray-100">
                  <div>
                    <h3 className="text-sm font-extrabold text-gray-900 flex items-center gap-2">
                      <Code2 className="h-4 w-4 text-indigo-600" />
                      PYQ प्रश्नों का HTML कोड पेस्ट करें (Paste PYQ HTML)
                    </h3>
                    <p className="text-[11px] text-gray-500 font-medium mt-0.5">
                      परीक्षा: <strong>{pyqExam === '__custom__' ? pyqCustomExam : pyqExam} ({pyqYear})</strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleLoadPyqSampleHtml}
                      className="text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-3 py-1.5 rounded-xl transition flex items-center gap-1 cursor-pointer"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                      नमूना PYQ HTML लोड करें
                    </button>
                    {pyqBulkHtmlText && (
                      <button
                        type="button"
                        onClick={() => { setPyqBulkHtmlText(''); setPyqParsedQuestions([]); }}
                        className="text-xs font-bold text-red-600 hover:bg-red-50 px-2.5 py-1.5 rounded-xl transition cursor-pointer"
                      >
                        साफ करें
                      </button>
                    )}
                  </div>
                </div>

                <div className="relative">
                  <textarea
                    rows={9}
                    value={pyqBulkHtmlText}
                    onChange={(e) => setPyqBulkHtmlText(e.target.value)}
                    placeholder={`यहाँ PYQ HTML कोड दर्ज करें...`}
                    className="w-full p-3.5 text-xs font-mono bg-slate-900 text-indigo-300 rounded-xl border border-slate-700 focus:ring-2 focus:ring-indigo-500 focus:outline-none leading-relaxed"
                  />
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleParsePyqBulkHtml}
                    className="w-full sm:w-auto px-6 py-3 rounded-xl text-xs font-extrabold text-white bg-indigo-700 hover:bg-indigo-800 transition flex items-center justify-center gap-2 cursor-pointer shadow-md"
                  >
                    <Wand2 className="h-4 w-4 text-amber-300" />
                    ⚡ HTML पार्स करें व पूर्वावलोकन देखें (Parse & Preview)
                  </button>

                  {pyqParsedQuestions.length > 0 && (
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button
                        type="button"
                        disabled={pyqSaving}
                        onClick={() => handleSavePyqQuestions('append')}
                        className="flex-1 sm:flex-none px-6 py-3 rounded-xl text-xs font-extrabold text-white bg-emerald-700 hover:bg-emerald-800 transition flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
                      >
                        <Save className="h-4 w-4" />
                        {pyqSaving ? "सहेजा जा रहा है..." : `💾 ${pyqParsedQuestions.length} PYQ प्रश्न बैंक में सुरक्षित करें (Save)`}
                      </button>
                    </div>
                  )}
                </div>

                {/* PARSED PREVIEW ACCORDION FOR PYQ */}
                {pyqParsedQuestions.length > 0 && (
                  <div className="mt-6 space-y-3 pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between bg-indigo-50 p-3.5 rounded-xl border border-indigo-200">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-indigo-700" />
                        <span className="text-xs font-extrabold text-indigo-900">
                          पार्स किए गए PYQ प्रश्न ({pyqParsedQuestions.length}) — लाइव पूर्वावलोकन
                        </span>
                      </div>
                      <span className="text-[11px] text-indigo-700 font-bold">
                        परीक्षा: {pyqExam === '__custom__' ? pyqCustomExam : pyqExam} ({pyqYear})
                      </span>
                    </div>

                    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                      {pyqParsedQuestions.map((q, idx) => (
                        <div
                          key={q.id || idx}
                          className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs hover:border-indigo-300 transition"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-2.5 flex-1">
                              <span className="shrink-0 w-6 h-6 rounded-lg bg-indigo-100 text-indigo-900 text-xs font-black flex items-center justify-center">
                                {idx + 1}
                              </span>
                              <div className="space-y-2 flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-black bg-indigo-100 text-indigo-900 px-2 py-0.5 rounded-md">
                                    {q.exam} - {q.year}
                                  </span>
                                  <span className="text-[10px] text-gray-500 font-bold">
                                    {q.subject}
                                  </span>
                                </div>
                                <RichTextRenderer
                                  content={q.text_hi}
                                  as="div"
                                  className="text-xs font-bold text-gray-900"
                                />
                                
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                                  {q.options_hi.map((opt, optIdx) => (
                                    <div
                                      key={optIdx}
                                      className={`p-2 rounded-lg text-xs font-medium border flex items-start gap-2 ${
                                        q.correctAnswer === optIdx
                                          ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold'
                                          : 'bg-gray-50 border-gray-200 text-gray-700'
                                      }`}
                                    >
                                      <span className={`w-4 h-4 rounded-full text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5 ${
                                        q.correctAnswer === optIdx
                                          ? 'bg-emerald-600 text-white'
                                          : 'bg-gray-200 text-gray-600'
                                      }`}>
                                        {String.fromCharCode(65 + optIdx)}
                                      </span>
                                      <RichTextRenderer content={opt} as="span" className="flex-1" />
                                      {q.correctAnswer === optIdx && (
                                        <Check className="h-3.5 w-3.5 text-emerald-600 ml-auto shrink-0 mt-0.5" />
                                      )}
                                    </div>
                                  ))}
                                </div>

                                {q.explanation_hi && (
                                  <div className="bg-amber-50/70 border border-amber-200 rounded-lg p-2.5 text-[11px] text-amber-900 font-medium">
                                    <span className="font-bold text-amber-950 block mb-1">व्याख्या: </span>
                                    <RichTextRenderer content={q.explanation_hi} as="div" />
                                  </div>
                                )}
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => setPyqParsedQuestions(pyqParsedQuestions.filter((_, i) => i !== idx))}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                              title="हटाएं"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* MANUAL SINGLE PYQ FORM */}
            {pyqInputMode === 'manual' && (
              <form onSubmit={handleSaveSinglePyqQuestion} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs space-y-4">
                <div className="pb-2 border-b border-gray-100">
                  <h3 className="text-sm font-extrabold text-gray-900 flex items-center gap-2">
                    <PlusCircle className="h-4 w-4 text-indigo-600" />
                    सिंगल विगत वर्ष प्रश्न जोड़ें (Add Single PYQ)
                  </h3>
                  <p className="text-[11px] text-gray-500 font-medium mt-0.5">
                    परीक्षा: <strong>{pyqExam === '__custom__' ? pyqCustomExam : pyqExam} ({pyqYear})</strong> | विषय: <strong>{pyqSubject}</strong>
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700 block">प्रश्न (हिन्दी में)*</label>
                  <textarea
                    rows={3}
                    required
                    value={pyqSingleTextHi}
                    onChange={(e) => setPyqSingleTextHi(e.target.value)}
                    placeholder="PYQ प्रश्न का संपूर्ण विवरण यहाँ लिखें..."
                    className="w-full p-2.5 text-xs font-bold bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {pyqSingleOptionsHi.map((opt, optIdx) => (
                    <div key={optIdx} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-gray-700">
                          विकल्प {String.fromCharCode(65 + optIdx)}*
                        </label>
                        <label className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 cursor-pointer">
                          <input
                            type="radio"
                            name="pyqCorrectAnswer"
                            checked={pyqSingleCorrectAnswer === optIdx}
                            onChange={() => setPyqSingleCorrectAnswer(optIdx)}
                            className="text-indigo-600 focus:ring-indigo-500"
                          />
                          सही उत्तर (Correct)
                        </label>
                      </div>
                      <input
                        type="text"
                        required={optIdx < 2}
                        value={opt}
                        onChange={(e) => {
                          const updated = [...pyqSingleOptionsHi];
                          updated[optIdx] = e.target.value;
                          setPyqSingleOptionsHi(updated);
                        }}
                        placeholder={`विकल्प ${String.fromCharCode(65 + optIdx)} का टेक्स्ट`}
                        className={`w-full p-2.5 text-xs font-bold rounded-xl border focus:ring-2 focus:ring-indigo-500 ${
                          pyqSingleCorrectAnswer === optIdx
                            ? 'bg-emerald-50 border-emerald-300'
                            : 'bg-gray-50 border-gray-300'
                        }`}
                      />
                    </div>
                  ))}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700 block">विस्तृत व्याख्या / समाधान (Explanation)</label>
                  <textarea
                    rows={2}
                    value={pyqSingleExplanationHi}
                    onChange={(e) => setPyqSingleExplanationHi(e.target.value)}
                    placeholder="प्रश्न के सही उत्तर का संक्षिप्त विवरण एवं संदर्भ..."
                    className="w-full p-2.5 text-xs bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={pyqSaving}
                    className="px-6 py-2.5 rounded-xl text-xs font-extrabold text-white bg-indigo-700 hover:bg-indigo-800 transition flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
                  >
                    <Save className="h-4 w-4" />
                    {pyqSaving ? "सहेजा जा रहा है..." : "डेटाबेस में PYQ सुरक्षित करें (Save PYQ)"}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* PROOFREADING & QUESTION AUDIT TAB */}
        {activeSubTab === 'proofread' && (
          <div className="space-y-6">
            {/* Realtime Status Header Card */}
            <div className="bg-gradient-to-r from-amber-900 via-amber-800 to-amber-950 text-white rounded-3xl p-6 shadow-md border border-amber-700/50">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                <div className="space-y-2 max-w-2xl">
                  <div className="inline-flex items-center gap-2 bg-amber-500/20 text-amber-200 border border-amber-400/30 px-3 py-1 rounded-full text-[11px] font-bold">
                    <Wand2 className="h-3.5 w-3.5 text-amber-300" /> Fast Audit & Single-Question Proofreader
                  </div>
                  <h2 className="text-lg sm:text-xl font-extrabold text-white">
                    2,000+ प्रश्नोत्तर समीक्षा व त्रुटि निवारण केंद्र
                  </h2>
                  <p className="text-xs text-amber-100/90 leading-relaxed font-medium">
                    यहाँ से आप <strong>PYQ (प्रतियोगी परीक्षा प्रश्न)</strong> और <strong>विषयवार अभ्यास (Subject-wise)</strong> के सभी प्रश्नों को एक-एक करके चेक, एडिट व फॉर्मेट कर सकते हैं।
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
                  {/* Google Sheets Sync Badge */}
                  <button
                    onClick={() => setIsAppsScriptModalOpen(true)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer border ${
                      googleAppsScriptUrl
                        ? 'bg-emerald-500/20 text-emerald-200 border-emerald-400/40 hover:bg-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-200 border-amber-400/40 hover:bg-amber-500/30'
                    }`}
                  >
                    <Code2 className="h-4 w-4" />
                    {googleAppsScriptUrl ? "🟢 गूगल शीट लाइव ऑटो-सिंक सक्रिय" : "⚙️ गूगल शीट ऑटो-सिंक सेटअप"}
                  </button>

                  <button
                    onClick={() => setIsExportModalOpen(true)}
                    className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer"
                  >
                    <Download className="h-4 w-4 text-amber-300" /> Excel / CSV निर्यात
                  </button>

                  <button
                    onClick={handleDeleteAllQuestions}
                    disabled={questions.length === 0}
                    className="bg-red-500/20 hover:bg-red-500/30 text-red-200 border border-red-400/30 px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    title="डेटाबेस के सभी प्रश्न डिलीट करें"
                  >
                    <Trash2 className="h-4 w-4 text-red-300" /> सभी प्रश्न डिलीट करें
                  </button>
                </div>
              </div>

              {/* Progress Summary Stats Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-amber-700/50 text-xs">
                <div className="bg-amber-950/40 p-3 rounded-2xl border border-amber-700/30">
                  <span className="text-amber-300/80 text-[10px] font-bold block uppercase">कुल डेटाबेस प्रश्न</span>
                  <span className="text-lg font-black text-white">{questions.length}</span>
                </div>
                <div className="bg-amber-950/40 p-3 rounded-2xl border border-amber-700/30">
                  <span className="text-emerald-300/80 text-[10px] font-bold block uppercase">समीक्षित प्रश्न</span>
                  <span className="text-lg font-black text-emerald-300">{reviewedCount}</span>
                </div>
                <div className="bg-amber-950/40 p-3 rounded-2xl border border-amber-700/30">
                  <span className="text-blue-300/80 text-[10px] font-bold block uppercase">फिल्टर परिणाम</span>
                  <span className="text-lg font-black text-blue-300">{filteredAuditQuestions.length}</span>
                </div>
                <div className="bg-amber-950/40 p-3 rounded-2xl border border-amber-700/30">
                  <span className="text-amber-200/80 text-[10px] font-bold block uppercase">शॉर्टकट की</span>
                  <span className="text-xs font-bold text-amber-200">Alt + S (Save & Next)</span>
                </div>
              </div>
            </div>

            {/* Filter & Toolbar Bar */}
            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                {/* Section Filter */}
                <div>
                  <label className="text-[11px] font-bold text-gray-700 block mb-1">1. वर्ग चुनें (Section)</label>
                  <select
                    value={auditType}
                    onChange={(e) => setAuditType(e.target.value as any)}
                    className="w-full p-2 text-xs font-bold border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 bg-gray-50 cursor-pointer"
                  >
                    <option value="all">सभी वर्ग (PYQ + Subject-wise)</option>
                    <option value="pyq">PYQs (प्रतियोगी परीक्षा प्रश्न)</option>
                    <option value="subject">विषयवार अभ्यास (Subject Practice)</option>
                  </select>
                </div>

                {/* Subject Filter */}
                <div>
                  <label className="text-[11px] font-bold text-gray-700 block mb-1">2. विषय चुनें (Subject)</label>
                  <select
                    value={auditSubject}
                    onChange={(e) => setAuditSubject(e.target.value)}
                    className="w-full p-2 text-xs font-bold border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 bg-gray-50 cursor-pointer"
                  >
                    <option value="all">सभी विषय ({availableAuditSubjects.length})</option>
                    {availableAuditSubjects.map((sub) => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                </div>

                {/* Exam Filter */}
                <div>
                  <label className="text-[11px] font-bold text-gray-700 block mb-1">3. परीक्षा चुनें (Exam)</label>
                  <select
                    value={auditExam}
                    onChange={(e) => setAuditExam(e.target.value)}
                    className="w-full p-2 text-xs font-bold border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 bg-gray-50 cursor-pointer"
                  >
                    <option value="all">सभी परीक्षाएं ({availableAuditExams.length})</option>
                    {availableAuditExams.map((ex) => (
                      <option key={ex} value={ex}>{ex}</option>
                    ))}
                  </select>
                </div>

                {/* Status Filter */}
                <div>
                  <label className="text-[11px] font-bold text-gray-700 block mb-1">4. समीक्षा स्थिति (Status)</label>
                  <select
                    value={auditStatus}
                    onChange={(e) => setAuditStatus(e.target.value as any)}
                    className="w-full p-2 text-xs font-bold border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 bg-gray-50 cursor-pointer"
                  >
                    <option value="all">सभी प्रश्न</option>
                    <option value="unreviewed">असमरक्षित (Unreviewed)</option>
                    <option value="reviewed">समीक्षित (Reviewed)</option>
                    <option value="warning">⚠️ सम्भावित त्रुटि (Formatting Issue)</option>
                  </select>
                </div>

                {/* Search Bar */}
                <div>
                  <label className="text-[11px] font-bold text-gray-700 block mb-1">5. खोजें (Search Text/ID)</label>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="शब्द या ID..."
                      value={auditSearch}
                      onChange={(e) => setAuditSearch(e.target.value)}
                      className="pl-8 pr-3 py-1.5 w-full text-xs font-medium border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 bg-gray-50"
                    />
                  </div>
                </div>
              </div>

              {/* View Layout Mode Switcher */}
              <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs">
                <div className="flex items-center gap-2 text-gray-600 font-bold">
                  <span>लेआउट मोड:</span>
                  <button
                    onClick={() => setAuditLayoutMode('focus')}
                    className={`px-3 py-1 rounded-lg transition cursor-pointer font-bold flex items-center gap-1.5 ${
                      auditLayoutMode === 'focus'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Edit3 className="h-3.5 w-3.5" /> सिंगल प्रश्न सम्पादक (Split View)
                  </button>
                  <button
                    onClick={() => setAuditLayoutMode('table')}
                    className={`px-3 py-1 rounded-lg transition cursor-pointer font-bold flex items-center gap-1.5 ${
                      auditLayoutMode === 'table'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <List className="h-3.5 w-3.5" /> सम्पूर्ण सूची ग्रिड (Table)
                  </button>
                </div>

                <div className="text-gray-500 text-[11px] font-semibold">
                  कुल परिणाम: <span className="font-extrabold text-amber-700">{filteredAuditQuestions.length}</span> प्रश्न मिले
                </div>
              </div>
            </div>

            {/* FOCUS SINGLE QUESTION SPLIT SCREEN EDITOR */}
            {auditLayoutMode === 'focus' && (
              <div>
                {filteredAuditQuestions.length === 0 ? (
                  <div className="bg-white p-12 text-center rounded-2xl border border-gray-200 space-y-3">
                    <Search className="h-10 w-10 text-gray-300 mx-auto" />
                    <p className="text-sm font-bold text-gray-700">चुने गए फिल्टर के आधार पर कोई प्रश्न नहीं मिला।</p>
                    <p className="text-xs text-gray-500">कृपया ऊपर से फिल्टर या सर्च बदलें।</p>
                  </div>
                ) : auditEditingQuestion ? (
                  <div className="space-y-4">
                    {/* Pagination Header Bar */}
                    <div className="bg-amber-50 p-3.5 rounded-2xl border border-amber-200 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <button
                          disabled={auditCurrentIndex === 0}
                          onClick={() => setAuditCurrentIndex((prev) => Math.max(0, prev - 1))}
                          className="px-3 py-1.5 bg-white hover:bg-gray-100 disabled:opacity-40 border border-gray-200 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                        >
                          <ChevronLeft className="h-4 w-4" /> पिछला
                        </button>

                        <span className="text-xs font-extrabold text-amber-900 bg-amber-100/80 px-3 py-1 rounded-lg border border-amber-300">
                          प्रश्न {auditCurrentIndex + 1} / {filteredAuditQuestions.length}
                        </span>

                        <button
                          disabled={auditCurrentIndex >= filteredAuditQuestions.length - 1}
                          onClick={() => setAuditCurrentIndex((prev) => Math.min(filteredAuditQuestions.length - 1, prev + 1))}
                          className="px-3 py-1.5 bg-white hover:bg-gray-100 disabled:opacity-40 border border-gray-200 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                        >
                          अगला <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Quick Clean Spaces Button */}
                        <button
                          onClick={handleCleanExtraSpaces}
                          className="px-3 py-1.5 bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                          title="अतिरिक्त स्पेस साफ करें"
                        >
                          <Wand2 className="h-3.5 w-3.5 text-amber-600" /> स्पेस साफ करें
                        </button>

                        {/* Save Only */}
                        <button
                          disabled={auditSaving}
                          onClick={() => handleSaveAuditQuestion(false)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                          title="सहेजें (उसी प्रश्न पर रहें)"
                        >
                          <Save className="h-3.5 w-3.5" />
                          {auditSaving ? "सहेजा..." : "सहेजें"}
                        </button>

                        {/* Save & Next Action */}
                        <button
                          disabled={auditSaving}
                          onClick={() => handleSaveAuditQuestion(true)}
                          className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                          title="सहेजें और अगला प्रश्न (Alt+S)"
                        >
                          <CheckCircle className="h-3.5 w-3.5" />
                          {auditSaving ? "सहेजा..." : "सहेजें और अगला (Alt+S)"}
                        </button>
                      </div>
                    </div>

                    {/* Status Alert Message */}
                    {auditSaveMsg && (
                      <div className={`p-3 rounded-xl text-xs font-bold border flex items-center justify-between gap-2 ${
                        auditSaveMsg.type === 'success'
                          ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                          : 'bg-red-50 text-red-900 border-red-200'
                      }`}>
                        <span>{auditSaveMsg.text}</span>
                        <button onClick={() => setAuditSaveMsg(null)} className="text-gray-400 hover:text-gray-600 text-xs">✕</button>
                      </div>
                    )}

                    {/* Main Dual Pane Grid: Form (Left) vs Live Preview (Right) */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                      {/* LEFT PANE: EDITING FORM */}
                      <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4 shadow-2xs">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                          <h3 className="text-xs font-extrabold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                            <Edit3 className="h-4 w-4 text-amber-600" /> प्रश्न सम्पादक (Edit Question Data)
                          </h3>
                          <span className="text-[10px] font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-600">
                            ID: {auditEditingQuestion.id}
                          </span>
                        </div>

                        {/* Classification Info */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="text-[11px] font-bold text-gray-700 block mb-1">विषय (Subject)*</label>
                            <input
                              type="text"
                              value={auditEditingQuestion.subject || ''}
                              onChange={(e) => setAuditEditingQuestion({ ...auditEditingQuestion, subject: e.target.value })}
                              className="w-full p-2 text-xs font-semibold border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 bg-gray-50/50"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] font-bold text-gray-700 block mb-1">टॉपिक (Topic)</label>
                            <input
                              type="text"
                              value={auditEditingQuestion.topic || ''}
                              onChange={(e) => setAuditEditingQuestion({ ...auditEditingQuestion, topic: e.target.value })}
                              className="w-full p-2 text-xs font-semibold border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 bg-gray-50/50"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] font-bold text-gray-700 block mb-1">परीक्षा नाम (Exam Name - for PYQ)</label>
                            <input
                              type="text"
                              placeholder="उदा. CGPSC Prelims 2023"
                              value={auditEditingQuestion.exam || ''}
                              onChange={(e) => setAuditEditingQuestion({ ...auditEditingQuestion, exam: e.target.value })}
                              className="w-full p-2 text-xs font-semibold border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 bg-gray-50/50"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] font-bold text-gray-700 block mb-1">वर्ष (Year)</label>
                            <input
                              type="number"
                              placeholder="2023"
                              value={auditEditingQuestion.year || ''}
                              onChange={(e) => setAuditEditingQuestion({ ...auditEditingQuestion, year: parseInt(e.target.value) || undefined })}
                              className="w-full p-2 text-xs font-semibold border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 bg-gray-50/50"
                            />
                          </div>
                        </div>

                        {/* Question Text Hindi */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <label className="text-[11px] font-bold text-gray-700 block">प्रश्न सामग्री (Hindi Text)*</label>
                            <button
                              type="button"
                              onClick={handleAddLineBreakToQuestion}
                              className="text-[10px] font-bold text-amber-700 hover:bg-amber-50 px-2 py-0.5 rounded border border-amber-200 transition cursor-pointer"
                            >
                              + नई पंक्ति (\n Enter) जोड़ें
                            </button>
                          </div>
                          <textarea
                            rows={4}
                            value={auditEditingQuestion.text_hi || ''}
                            onChange={(e) => setAuditEditingQuestion({ ...auditEditingQuestion, text_hi: e.target.value })}
                            className="w-full p-3 text-xs sm:text-sm font-semibold border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 leading-relaxed font-sans"
                            placeholder="यहाँ प्रश्न लिखें..."
                          />
                        </div>

                        {/* Options A, B, C, D */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-[11px] font-bold text-gray-700 block">विकल्प (Options A, B, C, D) व सही उत्तर चुनिए*</label>
                            <span className="text-[10px] text-emerald-700 font-extrabold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              सही उत्तर: विकल्प {String.fromCharCode(65 + (auditEditingQuestion.correctAnswer ?? 0))}
                            </span>
                          </div>

                          {['A', 'B', 'C', 'D'].map((optLabel, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              {/* Radio selector for correct answer */}
                              <label className={`p-2 rounded-xl border flex items-center gap-1.5 cursor-pointer text-xs font-extrabold transition ${
                                (auditEditingQuestion.correctAnswer ?? 0) === idx
                                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                                  : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                              }`}>
                                <input
                                  type="radio"
                                  name="correctOptionRadio"
                                  checked={(auditEditingQuestion.correctAnswer ?? 0) === idx}
                                  onChange={() => setAuditEditingQuestion({ ...auditEditingQuestion, correctAnswer: idx })}
                                  className="hidden"
                                />
                                <span>{optLabel}.</span>
                              </label>

                              {/* Option Text Input */}
                              <input
                                type="text"
                                value={auditEditingQuestion.options_hi?.[idx] || ''}
                                onChange={(e) => {
                                  const updatedOpts = [...(auditEditingQuestion.options_hi || ['', '', '', ''])];
                                  updatedOpts[idx] = e.target.value;
                                  setAuditEditingQuestion({ ...auditEditingQuestion, options_hi: updatedOpts });
                                }}
                                className={`w-full p-2.5 text-xs font-semibold border rounded-xl focus:ring-2 focus:ring-amber-500 font-sans ${
                                  (auditEditingQuestion.correctAnswer ?? 0) === idx
                                    ? 'border-emerald-300 bg-emerald-50/30'
                                    : 'border-gray-200 bg-white'
                                }`}
                                placeholder={`विकल्प ${optLabel}...`}
                              />
                            </div>
                          ))}
                        </div>

                        {/* Explanation Hindi */}
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-gray-700 block">व्याख्या (Hindi Explanation)</label>
                          <textarea
                            rows={3}
                            value={auditEditingQuestion.explanation_hi || ''}
                            onChange={(e) => setAuditEditingQuestion({ ...auditEditingQuestion, explanation_hi: e.target.value })}
                            className="w-full p-2.5 text-xs font-medium border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 font-sans"
                            placeholder="यहाँ उत्तर की व्याख्या/सॉल्यूशन लिखें..."
                          />
                        </div>

                        {/* Reviewed Toggle & Actions */}
                        <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-4">
                          <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-gray-800">
                            <input
                              type="checkbox"
                              checked={Boolean(auditEditingQuestion.reviewed)}
                              onChange={(e) => setAuditEditingQuestion({ ...auditEditingQuestion, reviewed: e.target.checked })}
                              className="h-4 w-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500"
                            />
                            <span>✓ यह प्रश्न समीक्षित (Verified) मार्क करें</span>
                          </label>

                          <button
                            type="button"
                            onClick={() => {
                              if (confirm('क्या आप इस प्रश्न को हटाना चाहते हैं?')) {
                                handleDeleteQuestion(auditEditingQuestion.id);
                              }
                            }}
                            className="text-xs text-red-600 hover:text-red-800 font-bold hover:underline cursor-pointer flex items-center gap-1"
                          >
                            <Trash className="h-3.5 w-3.5" /> हटाएं
                          </button>
                        </div>
                      </div>

                      {/* RIGHT PANE: LIVE STUDENT PREVIEW */}
                      <div className="bg-slate-900 text-white rounded-2xl border border-slate-800 p-5 space-y-4 shadow-md sticky top-6">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                          <h3 className="text-xs font-extrabold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                            <Eye className="h-4 w-4 text-amber-400" /> छात्र स्क्रीन लाइव पूर्वावलोकन (Candidate Live View)
                          </h3>
                          <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-bold border border-emerald-500/30">
                            Realtime
                          </span>
                        </div>

                        {/* Candidate Rendered Card */}
                        <div className="bg-white text-gray-900 p-5 rounded-2xl space-y-4 shadow-sm border border-gray-200">
                          {/* Tags Header */}
                          <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-extrabold">
                            <span className="bg-emerald-100 text-emerald-900 px-2.5 py-0.5 rounded-md">
                              {auditEditingQuestion.subject || 'विषय'}
                            </span>
                            {auditEditingQuestion.topic && (
                              <span className="bg-blue-100 text-blue-900 px-2.5 py-0.5 rounded-md">
                                {auditEditingQuestion.topic}
                              </span>
                            )}
                            {auditEditingQuestion.exam && (
                              <span className="bg-purple-100 text-purple-900 px-2.5 py-0.5 rounded-md">
                                {auditEditingQuestion.exam} {auditEditingQuestion.year ? `(${auditEditingQuestion.year})` : ''}
                              </span>
                            )}
                          </div>

                          {/* Question Text */}
                          <h4 className="text-sm sm:text-base font-bold text-gray-900 leading-relaxed font-sans whitespace-pre-line border-b border-gray-100 pb-3">
                            {auditEditingQuestion.text_hi || 'यहाँ प्रश्न दिखाई देगा...'}
                          </h4>

                          {/* Options Grid */}
                          <div className="space-y-2">
                            {(auditEditingQuestion.options_hi || []).map((opt: string, oIdx: number) => {
                              const isCorrect = (auditEditingQuestion.correctAnswer ?? 0) === oIdx;
                              return (
                                <div
                                  key={oIdx}
                                  className={`p-3 rounded-xl border text-xs sm:text-sm font-semibold transition flex items-center justify-between ${
                                    isCorrect
                                      ? 'bg-emerald-50 border-emerald-400 text-emerald-900 ring-1 ring-emerald-300 font-bold'
                                      : 'bg-gray-50 border-gray-200 text-gray-800'
                                  }`}
                                >
                                  <div className="flex items-start gap-2">
                                    <span className="font-extrabold text-gray-500 uppercase">{String.fromCharCode(65 + oIdx)}.</span>
                                    <span className="whitespace-pre-line font-sans">{opt || '(खाली विकल्प)'}</span>
                                  </div>
                                  {isCorrect && (
                                    <span className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                                      <Check className="h-3 w-3" /> सही
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>

                          {/* Explanation Card */}
                          {auditEditingQuestion.explanation_hi && (
                            <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3.5 space-y-1 text-xs">
                              <span className="font-extrabold text-amber-900 block flex items-center gap-1">
                                💡 व्याख्या / उत्तर कुंजी (Explanation Key):
                              </span>
                              <p className="text-gray-800 leading-relaxed font-sans whitespace-pre-line font-medium">
                                {auditEditingQuestion.explanation_hi}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* BOTTOM PRIMARY ACTION & NAVIGATION BAR */}
                    <div className="bg-slate-900 text-white p-4 rounded-2xl border border-slate-800 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4 sticky bottom-4 z-40 mt-6">
                      {/* Prev / Counter / Next Navigation */}
                      <div className="flex items-center gap-2.5 w-full md:w-auto justify-between md:justify-start">
                        <button
                          disabled={auditCurrentIndex === 0}
                          onClick={() => setAuditCurrentIndex((prev) => Math.max(0, prev - 1))}
                          className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white disabled:opacity-30 border border-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                        >
                          <ChevronLeft className="h-4 w-4" /> पिछला प्रश्न
                        </button>

                        <span className="text-xs font-black text-amber-400 bg-slate-950/90 px-3.5 py-1.5 rounded-xl border border-amber-500/30">
                          प्रश्न {auditCurrentIndex + 1} / {filteredAuditQuestions.length}
                        </span>

                        <button
                          disabled={auditCurrentIndex >= filteredAuditQuestions.length - 1}
                          onClick={() => setAuditCurrentIndex((prev) => Math.min(filteredAuditQuestions.length - 1, prev + 1))}
                          className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white disabled:opacity-30 border border-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                        >
                          अगला प्रश्न <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>

                      {/* Action Buttons: Clean, Save, Save & Next */}
                      <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
                        <button
                          onClick={handleCleanExtraSpaces}
                          className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                          title="अतिरिक्त स्पेस साफ करें"
                        >
                          <Wand2 className="h-3.5 w-3.5 text-amber-400" /> स्पेस साफ करें
                        </button>

                        <button
                          disabled={auditSaving}
                          onClick={() => handleSaveAuditQuestion(false)}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                          title="इसी प्रश्न पर रहें और सहेजें"
                        >
                          <Save className="h-4 w-4" />
                          {auditSaving ? "सहेजा जा रहा है..." : "केवल सहेजें (Save)"}
                        </button>

                        <button
                          disabled={auditSaving}
                          onClick={() => handleSaveAuditQuestion(true)}
                          className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                          title="सहेजें और अगला प्रश्न (Alt+S)"
                        >
                          <CheckCircle className="h-4 w-4" />
                          {auditSaving ? "सहेजा जा रहा है..." : "सहेजें और अगला (Save & Next - Alt+S) ►"}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            )}

            {/* TABLE BATCH GRID VIEW */}
            {auditLayoutMode === 'table' && (
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-gray-100 text-gray-800 font-extrabold border-b border-gray-200">
                        <th className="p-3 w-12 text-center">क्र.</th>
                        <th className="p-3">वर्ग / विषय</th>
                        <th className="p-3 max-w-md">प्रश्न (Hindi Text)</th>
                        <th className="p-3">सही उत्तर</th>
                        <th className="p-3">स्थिति</th>
                        <th className="p-3 text-right">कार्रवाई</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredAuditQuestions.map((q, idx) => {
                        const isSelected = auditEditingQuestion && auditEditingQuestion.id === q.id;
                        return (
                          <tr
                            key={q.id}
                            className={`hover:bg-amber-50/50 transition ${isSelected ? 'bg-amber-100/60 font-medium' : ''}`}
                          >
                            <td className="p-3 text-center font-bold text-gray-500">{idx + 1}</td>
                            <td className="p-3">
                              <span className="font-bold text-gray-800 block">{q.subject}</span>
                              <span className="text-[10px] text-gray-500">{q.exam || q.topic}</span>
                            </td>
                            <td className="p-3 max-w-md">
                              <p className="line-clamp-2 font-semibold text-gray-900 font-sans whitespace-pre-line">
                                {q.text_hi}
                              </p>
                            </td>
                            <td className="p-3">
                              <span className="bg-emerald-100 text-emerald-900 font-extrabold px-2 py-0.5 rounded text-[11px]">
                                {String.fromCharCode(65 + (q.correctAnswer ?? 0))}
                              </span>
                            </td>
                            <td className="p-3">
                              {(q as any).reviewed ? (
                                <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-bold">
                                  ✓ समीक्षित
                                </span>
                              ) : (
                                <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-[10px] font-semibold">
                                  असमरक्षित
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-right">
                              <button
                                onClick={() => {
                                  setAuditCurrentIndex(idx);
                                  setAuditLayoutMode('focus');
                                }}
                                className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                              >
                                सम्पादित करें
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

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

                <button
                  type="button"
                  onClick={handleDisconnectSheets}
                  disabled={sheetSyncing || (!inputPyq && !inputSubject && !inputCA && !spreadsheetIdPyq && !spreadsheetIdSubject && !spreadsheetIdCA)}
                  className="bg-red-50 hover:bg-red-100 text-red-700 disabled:opacity-40 font-bold px-3.5 py-2.5 rounded-xl text-xs transition cursor-pointer border border-red-200 flex items-center gap-1.5"
                  title="सभी गूगल शीट लिंक्स को डिस्कनेक्ट करें"
                >
                  <Unlink className="h-4 w-4 text-red-600" /> डिस्कनेक्ट करें (Disconnect)
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
                  <span className="text-[10px] text-gray-500 flex items-center justify-between">
                    <span>सहेजी गई ID: <code className="font-mono bg-white px-1 py-0.5 rounded border border-gray-200">{spreadsheetIdPyq || 'खाली'}</code></span>
                    {(extractSheetId(inputPyq) || spreadsheetIdPyq) && (
                      <button
                        type="button"
                        onClick={() => handleDisconnectSingleSheet('pyq')}
                        className="text-[10px] font-bold text-red-600 hover:text-red-800 hover:underline flex items-center gap-0.5 cursor-pointer"
                        title="इस गूगल शीट को डिस्कनेक्ट करें"
                      >
                        <Unlink className="h-3 w-3" /> डिस्कनेक्ट
                      </button>
                    )}
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
                  <span className="text-[10px] text-gray-500 flex items-center justify-between">
                    <span>सहेजी गई ID: <code className="font-mono bg-white px-1 py-0.5 rounded border border-gray-200">{spreadsheetIdSubject || 'खाली'}</code></span>
                    {(extractSheetId(inputSubject) || spreadsheetIdSubject) && (
                      <button
                        type="button"
                        onClick={() => handleDisconnectSingleSheet('subject')}
                        className="text-[10px] font-bold text-red-600 hover:text-red-800 hover:underline flex items-center gap-0.5 cursor-pointer"
                        title="इस गूगल शीट को डिस्कनेक्ट करें"
                      >
                        <Unlink className="h-3 w-3" /> डिस्कनेक्ट
                      </button>
                    )}
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
                  <span className="text-[10px] text-gray-500 flex items-center justify-between">
                    <span>सहेजी गई ID: <code className="font-mono bg-white px-1 py-0.5 rounded border border-gray-200">{spreadsheetIdCA || 'खाली'}</code></span>
                    {(extractSheetId(inputCA) || spreadsheetIdCA) && (
                      <button
                        type="button"
                        onClick={() => handleDisconnectSingleSheet('currentAffairs')}
                        className="text-[10px] font-bold text-red-600 hover:text-red-800 hover:underline flex items-center gap-0.5 cursor-pointer"
                        title="इस गूगल शीट को डिस्कनेक्ट करें"
                      >
                        <Unlink className="h-3 w-3" /> डिस्कनेक्ट
                      </button>
                    )}
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

              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                <button
                  type="button"
                  onClick={handleDownloadExcelTemplate}
                  className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-extrabold text-xs px-4 py-2.5 rounded-xl transition flex items-center gap-2 cursor-pointer"
                >
                  <Download className="h-4 w-4" /> नमूना (Template) एक्सेल डाउनलोड करें
                </button>
                <button
                  type="button"
                  onClick={handleDeleteAllQuestions}
                  disabled={questions.length === 0}
                  className="bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl transition flex items-center gap-2 cursor-pointer shadow-xs"
                  title="डेटाबेस के सभी पुराने प्रश्न हटाएं"
                >
                  <Trash2 className="h-4 w-4" /> सभी प्रश्न डिलीट करें ({questions.length})
                </button>
              </div>
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
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 pb-4 border-b border-gray-100">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                  <Search className="h-5 w-5 text-emerald-600" /> प्रश्न सूची प्रबंधक ({questions.length})
                </h2>
                {questions.length > 0 && (
                  <button
                    type="button"
                    onClick={handleDeleteAllQuestions}
                    className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-extrabold px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                    title="डेटाबेस के सभी प्रश्न एक बार में हटाएं"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> सभी प्रश्न डिलीट करें
                  </button>
                )}
              </div>

              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="प्रश्न, विषय, टॉपिक या कीवर्ड खोजें..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setListSelectedIds(new Set());
                  }}
                  className="pl-9 pr-8 py-2 text-xs border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 w-full font-medium"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setListSelectedIds(new Set());
                    }}
                    className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-700 cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Quick Action Bar for Filtered Search */}
            <div className="bg-gray-50 p-3 rounded-2xl border border-gray-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    if (listSelectedIds.size === filteredQuestions.length && filteredQuestions.length > 0) {
                      setListSelectedIds(new Set());
                    } else {
                      setListSelectedIds(new Set(filteredQuestions.map(q => q.id)));
                    }
                  }}
                  className="flex items-center gap-1.5 text-xs font-extrabold text-gray-700 bg-white border border-gray-300 px-3 py-1.5 rounded-xl transition cursor-pointer hover:bg-gray-100"
                >
                  {listSelectedIds.size === filteredQuestions.length && filteredQuestions.length > 0 ? (
                    <>
                      <CheckSquare className="h-4 w-4 text-emerald-600" />
                      सभी अनचयनित करें
                    </>
                  ) : (
                    <>
                      <Square className="h-4 w-4 text-gray-400" />
                      सूची के सभी चुनें ({filteredQuestions.length})
                    </>
                  )}
                </button>

                {listSelectedIds.size > 0 && (
                  <span className="text-xs font-bold text-red-700 bg-red-100 px-2.5 py-1 rounded-lg">
                    {listSelectedIds.size} चयनित
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {listSelectedIds.size > 0 && (
                  <button
                    type="button"
                    onClick={() => handleBulkDeleteSelectedIds(Array.from(listSelectedIds))}
                    className="bg-red-600 hover:bg-red-700 text-white text-xs font-extrabold px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Trash className="h-3.5 w-3.5" /> चयनित ({listSelectedIds.size}) डिलीट करें
                  </button>
                )}

                {searchQuery.trim() && filteredQuestions.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setKwModalConfirm({
                        open: true,
                        type: 'allKeyword',
                        keyword: searchQuery.trim(),
                        count: filteredQuestions.length
                      });
                    }}
                    className="bg-red-600 hover:bg-red-700 text-white text-xs font-black px-3.5 py-1.5 rounded-xl transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    🚨 '{searchQuery.trim()}' के सभी ({filteredQuestions.length}) प्रश्न एक साथ डिलीट करें
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-3">
              {filteredQuestions.map((q, qIndex) => {
                const isExpanded = expandedQuestion === q.id;
                const isSelected = listSelectedIds.has(q.id);
                return (
                  <div key={q.id || qIndex} className={`border-2 rounded-xl p-4 transition space-y-2 ${isSelected ? 'bg-red-50/40 border-red-300' : 'bg-white border-gray-200 hover:border-emerald-300'}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1">
                        <button
                          type="button"
                          onClick={() => {
                            const updated = new Set(listSelectedIds);
                            if (updated.has(q.id)) {
                              updated.delete(q.id);
                            } else {
                              updated.add(q.id);
                            }
                            setListSelectedIds(updated);
                          }}
                          className="mt-0.5 cursor-pointer text-red-600 hover:opacity-80"
                        >
                          {isSelected ? (
                            <CheckSquare className="h-5 w-5 text-red-600" />
                          ) : (
                            <Square className="h-5 w-5 text-gray-400" />
                          )}
                        </button>

                        <div className="space-y-1 flex-1 cursor-pointer" onClick={() => setExpandedQuestion(isExpanded ? null : q.id)}>
                          <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-bold">
                            <span className="bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded">
                              {renderHighlightedText(q.subject, searchQuery)}
                            </span>
                            <span className="bg-blue-50 text-blue-800 px-2 py-0.5 rounded">
                              {renderHighlightedText(q.topic, searchQuery)}
                            </span>
                            {q.exam && (
                              <span className="bg-purple-50 text-purple-800 px-2 py-0.5 rounded">
                                {renderHighlightedText(q.exam, searchQuery)} {q.year ? `(${q.year})` : ''}
                              </span>
                            )}
                            <span className="text-gray-400 font-mono text-[10px]">
                              #{qIndex + 1}
                            </span>
                          </div>
                          <h4 className="text-xs sm:text-sm font-semibold text-gray-800 leading-relaxed mt-1 font-sans whitespace-pre-line">
                            {renderHighlightedText(q.text_hi, searchQuery)}
                          </h4>
                        </div>
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
                            <div key={oIdx} className={`p-2 rounded-lg border text-xs whitespace-pre-line ${oIdx === q.correctAnswer ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold' : 'bg-white border-gray-200 text-gray-700'}`}>
                              {String.fromCharCode(65 + oIdx)}. {renderHighlightedText(opt, searchQuery)} {oIdx === q.correctAnswer && '✓'}
                            </div>
                          ))}
                        </div>
                        {q.explanation_hi && (
                          <div className="text-xs text-gray-600 pt-1 whitespace-pre-line">
                            <strong>व्याख्या:</strong> {renderHighlightedText(q.explanation_hi, searchQuery)}
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

        {/* INBUILT ANALYTICS & USER ENGAGEMENT TAB */}
        {activeSubTab === 'analytics' && (
          <AdminAnalyticsStats />
        )}

        {/* STUDENT LEADS & FEEDBACK TAB */}
        {activeSubTab === 'studentLeads' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Header Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-xs border border-gray-200">
              <div>
                <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
                  <Users className="h-6 w-6 text-indigo-600" />
                  विद्यार्थी संपर्क डेटा एवं टेस्ट फीडबैक हब
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  यहाँ उन सभी छात्रों की सूची है जिन्होंने WhatsApp अलर्ट के लिए सब्सक्राइब किया है या टेस्ट का फीडबैक व रेटिंग दी है।
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (subscribers.length === 0) {
                      alert("डाउनलोड के लिए कोई विद्यार्थी डेटा उपलब्ध नहीं है।");
                      return;
                    }
                    const headers = "ID,Name,Mobile,TargetExam,District,Source,Date\n";
                    const rows = subscribers.map(s => 
                      `"${s.id}","${s.name}","${s.mobile}","${s.targetExam || ''}","${s.district || ''}","${s.source || ''}","${new Date(s.createdAt).toLocaleString('hi-IN')}"`
                    ).join("\n");
                    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `Students_Leads_${new Date().toISOString().slice(0,10)}.csv`;
                    a.click();
                  }}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-xs flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Download className="h-4 w-4" />
                  Excel / CSV डाउनलोड ({subscribers.length})
                </button>

                <button
                  onClick={fetchStudentLeads}
                  disabled={loadingLeads}
                  className="px-3 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1"
                  title="रिफ्रेश करें"
                >
                  <RefreshCw className={`h-4 w-4 ${loadingLeads ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 p-4 rounded-2xl">
                <div className="text-xs font-bold text-indigo-700">कुल पंजीकृत विद्यार्थी (WhatsApp Leads)</div>
                <div className="text-2xl font-black text-indigo-950 mt-1">{subscribers.length}</div>
                <div className="text-[11px] text-indigo-600 mt-0.5">नए टेस्ट/नोटिफिकेशन के लिए सीधे संपर्क योग्य</div>
              </div>
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 p-4 rounded-2xl">
                <div className="text-xs font-bold text-amber-700">कुल टेस्ट रेटिंग्स व फीडबैक</div>
                <div className="text-2xl font-black text-amber-950 mt-1">{feedbacks.length}</div>
                <div className="text-[11px] text-amber-600 mt-0.5">
                  औसत रेटिंग: {feedbacks.length > 0 ? (feedbacks.reduce((a, b) => a + (b.rating || 5), 0) / feedbacks.length).toFixed(1) : '5.0'} / 5.0 ⭐
                </div>
              </div>
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 p-4 rounded-2xl">
                <div className="text-xs font-bold text-emerald-700">व्हाट्सएप संपर्क सुविधा</div>
                <div className="text-sm font-black text-emerald-950 mt-1">1-क्लिक WhatsApp चैट</div>
                <div className="text-[11px] text-emerald-600 mt-0.5">नंबर पर क्लिक करके सीधे संदेश भेजें</div>
              </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left 7 Cols: Subscribers Table */}
              <div className="lg:col-span-7 bg-white rounded-2xl shadow-xs border border-gray-200 p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <h3 className="font-extrabold text-sm text-gray-800 flex items-center gap-2">
                    <Users className="h-4 w-4 text-indigo-600" />
                    विद्यार्थी संपर्क सूची ({subscribers.length})
                  </h3>
                  <span className="text-xs text-gray-400 font-medium">WhatsApp / Mobile</span>
                </div>

                {subscribers.length === 0 ? (
                  <div className="text-center py-12 text-gray-400 text-xs font-medium space-y-2">
                    <Users className="h-8 w-8 text-gray-300 mx-auto" />
                    <p>अभी तक किसी छात्र ने संपर्क फॉर्म नहीं भरा है।</p>
                    <p className="text-[11px] text-gray-400">होमपेज या क्विज़ रिजल्ट पेज पर फॉर्म भरने पर यहाँ दिखेगा।</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto pr-1">
                    {subscribers.map((sub: any) => (
                      <div key={sub.id} className="py-3 flex items-start justify-between gap-3 hover:bg-gray-50/70 p-2.5 rounded-xl transition">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-gray-900">{sub.name}</span>
                            {sub.district && (
                              <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-bold">
                                {sub.district}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs flex-wrap">
                            <a
                              href={`https://wa.me/91${sub.mobile.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`नमस्ते ${sub.name}, TestArena Website पर आपका स्वागत है!`)}`}
                              target="_blank"
                              rel="noreferrer"
                              className="font-black text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-200 flex items-center gap-1 transition"
                            >
                              📱 {sub.mobile}
                            </a>
                            <span className="text-gray-600 font-medium bg-gray-100 px-2 py-0.5 rounded text-[11px]">
                              🎯 {sub.targetExam || 'General'}
                            </span>
                          </div>
                          <div className="text-[10px] text-gray-400">
                            पंजीकरण: {new Date(sub.createdAt).toLocaleString('hi-IN')} ({sub.source || 'Website'})
                          </div>
                        </div>

                        <button
                          onClick={async () => {
                            if (!confirm("क्या आप इस छात्र का रिकॉर्ड हटाना चाहते हैं?")) return;
                            await fetch(`/api/admin/students/subscribers/${sub.id}`, { method: 'DELETE' });
                            fetchStudentLeads();
                          }}
                          className="p-1.5 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                          title="हटाएं"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Right 5 Cols: Test Feedback & Reviews */}
              <div className="lg:col-span-5 bg-white rounded-2xl shadow-xs border border-gray-200 p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <h3 className="font-extrabold text-sm text-gray-800 flex items-center gap-2">
                    <Star className="h-4 w-4 text-amber-500 fill-amber-400" />
                    प्राप्त टेस्ट रेटिंग्स व फीडबैक ({feedbacks.length})
                  </h3>
                  <span className="text-xs text-gray-400 font-medium">Student Reviews</span>
                </div>

                {feedbacks.length === 0 ? (
                  <div className="text-center py-12 text-gray-400 text-xs font-medium space-y-2">
                    <Star className="h-8 w-8 text-gray-300 mx-auto" />
                    <p>अभी तक कोई टेस्ट फीडबैक प्राप्त नहीं हुआ है।</p>
                    <p className="text-[11px] text-gray-400">छात्रों द्वारा टेस्ट पूरा करने पर दी गई रेटिंग यहाँ दिखेगी।</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                    {feedbacks.map((fb: any) => (
                      <div key={fb.id} className="p-3.5 bg-gray-50/80 rounded-xl border border-gray-200 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-3.5 w-3.5 ${
                                  i < (fb.rating || 5) ? 'text-amber-400 fill-amber-400' : 'text-gray-300'
                                }`}
                              />
                            ))}
                            <span className="text-xs font-bold text-gray-700 ml-1">{fb.rating}/5</span>
                          </div>
                          <span className="text-[10px] text-gray-400 font-medium">
                            {new Date(fb.createdAt).toLocaleDateString('hi-IN')}
                          </span>
                        </div>

                        {fb.comment && (
                          <p className="text-xs text-gray-800 font-medium bg-white p-2.5 rounded-lg border border-gray-100">
                            "{fb.comment}"
                          </p>
                        )}

                        <div className="flex items-center justify-between text-[11px] text-gray-500 pt-1">
                          <span className="font-bold text-gray-700">{fb.studentName || 'अनाम परीक्षार्थी'}</span>
                          <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-bold text-[10px]">
                            {fb.testTitle || 'टेस्ट'}
                          </span>
                        </div>
                        {fb.studentMobile && (
                          <div className="text-[11px] text-emerald-700 font-bold">
                            📱 संपर्क: {fb.studentMobile}
                          </div>
                        )}
                        {fb.scoreInfo && (
                          <div className="text-[10px] text-gray-400">
                            स्कोर: {fb.scoreInfo}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </div>

      {/* GOOGLE APPS SCRIPT SETUP MODAL */}
      {isAppsScriptModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-5 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center gap-2">
                <Code2 className="h-6 w-6 text-emerald-600" />
                <h3 className="text-base font-black text-gray-900">
                  गूगल शीट्स ऑटो-सिंक वेबहुक सेटअप (Google Apps Script)
                </h3>
              </div>
              <button
                onClick={() => setIsAppsScriptModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 font-bold p-1 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs text-gray-700 leading-relaxed font-medium">
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-1">
                <p className="font-extrabold text-emerald-900 flex items-center gap-1.5">
                  <CheckCircle className="h-4 w-4 text-emerald-600" />
                  यह क्या करता है?
                </p>
                <p>
                  जब आप TestArena में किसी प्रश्न को सम्पादित (Edit) करके सहेजेंगे, तो यह कोड आपके गूगल शीट में उस प्रश्न वाली पंक्ति (Row) को <strong>स्वचालित रूप से रियल-टाइम में अपडेट</strong> कर देगा! आपको गूगल शीट में प्रश्न खोजने की ज़रूरत नहीं पड़ेगी।
                </p>
              </div>

              {/* Step by step guide */}
              <div className="space-y-2 bg-gray-50 p-4 rounded-2xl border border-gray-200">
                <h4 className="font-extrabold text-gray-900">सेटअप निर्देश (3 आसान स्टेप्स):</h4>
                <ol className="list-decimal list-inside space-y-1 text-gray-800">
                  <li>अपने गूगल शीट (Google Sheet) में जाएँ और ऊपर मेनू से <strong>Extensions &gt; Apps Script</strong> पर क्लिक करें।</li>
                  <li>वहाँ मौजूद कोड को हटाकर, नीचे दिया गया पूरा कोड कॉपी करके चिपकाएँ और <strong>Ctrl + S</strong> दबाएँ।</li>
                  <li>ऊपर दाएँ कोने में <strong>Deploy &gt; New deployment</strong> पर क्लिक करें।</li>
                  <li>Type में <strong>"Web app"</strong> चुनें, Execute as: <strong>"Me"</strong> और Who has access: <strong>"Anyone"</strong> सेट करके <strong>Deploy</strong> दबाएँ।</li>
                  <li>प्राप्त <strong>Web App URL</strong> को नीचे इनपुट बॉक्स में पेस्ट करके सहेजें।</li>
                </ol>
              </div>

              {/* Ready to copy Apps Script code */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-gray-900">कॉपी करने हेतु Apps Script कोड:</label>
                  <button
                    onClick={() => {
                      const code = `function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    if (data.action === 'UPDATE_QUESTION') {
      var q = data.question;
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var sheetName = (data.sheetType === 'pyq' || q.exam) ? 'PYQ' : 'Subject';
      var sheet = ss.getSheetByName(sheetName) || ss.getSheets()[0];
      var rows = sheet.getDataRange().getValues();
      
      var targetRow = -1;
      for (var i = 1; i < rows.length; i++) {
        var rowId = String(rows[i][0] || '').trim();
        var rowText = String(rows[i][1] || '').trim();
        if ((q.id && rowId === String(q.id).trim()) || (q.text_hi && rowText.substring(0, 30) === String(q.text_hi).substring(0, 30))) {
          targetRow = i + 1;
          break;
        }
      }
      
      if (targetRow > 0) {
        var optA = (q.options_hi && q.options_hi[0]) || '';
        var optB = (q.options_hi && q.options_hi[1]) || '';
        var optC = (q.options_hi && q.options_hi[2]) || '';
        var optD = (q.options_hi && q.options_hi[3]) || '';
        var correctVal = (q.correctAnswer !== undefined) ? (q.correctAnswer + 1) : 1;
        
        sheet.getRange(targetRow, 1, 1, 10).setValues([[
          q.id || '',
          q.text_hi || '',
          optA,
          optB,
          optC,
          optD,
          correctVal,
          q.explanation_hi || '',
          q.exam || q.subject || '',
          q.topic || ''
        ]]);
        return ContentService.createTextOutput(JSON.stringify({ status: 'success', row: targetRow })).setMimeType(ContentService.MimeType.JSON);
      }
    }
    return ContentService.createTextOutput(JSON.stringify({ status: 'not_found' })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', error: err.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}`;
                      navigator.clipboard.writeText(code);
                      alert('Apps Script कोड क्लिपबोर्ड पर कॉपी हो गया!');
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-3 py-1 rounded-lg text-[11px] flex items-center gap-1 transition cursor-pointer"
                  >
                    <Copy className="h-3.5 w-3.5" /> कोड कॉपी करें
                  </button>
                </div>
                <textarea
                  readOnly
                  rows={8}
                  className="w-full p-3 bg-slate-900 text-emerald-400 font-mono text-[11px] rounded-2xl border border-slate-800 leading-relaxed"
                  value={`function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    if (data.action === 'UPDATE_QUESTION') {
      var q = data.question;
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var sheetName = (data.sheetType === 'pyq' || q.exam) ? 'PYQ' : 'Subject';
      var sheet = ss.getSheetByName(sheetName) || ss.getSheets()[0];
      var rows = sheet.getDataRange().getValues();
      
      var targetRow = -1;
      for (var i = 1; i < rows.length; i++) {
        var rowId = String(rows[i][0] || '').trim();
        var rowText = String(rows[i][1] || '').trim();
        if ((q.id && rowId === String(q.id).trim()) || (q.text_hi && rowText.substring(0, 30) === String(q.text_hi).substring(0, 30))) {
          targetRow = i + 1;
          break;
        }
      }
      
      if (targetRow > 0) {
        var optA = (q.options_hi && q.options_hi[0]) || '';
        var optB = (q.options_hi && q.options_hi[1]) || '';
        var optC = (q.options_hi && q.options_hi[2]) || '';
        var optD = (q.options_hi && q.options_hi[3]) || '';
        var correctVal = (q.correctAnswer !== undefined) ? (q.correctAnswer + 1) : 1;
        
        sheet.getRange(targetRow, 1, 1, 10).setValues([[
          q.id || '',
          q.text_hi || '',
          optA,
          optB,
          optC,
          optD,
          correctVal,
          q.explanation_hi || '',
          q.exam || q.subject || '',
          q.topic || ''
        ]]);
        return ContentService.createTextOutput(JSON.stringify({ status: 'success', row: targetRow })).setMimeType(ContentService.MimeType.JSON);
      }
    }
    return ContentService.createTextOutput(JSON.stringify({ status: 'not_found' })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', error: err.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}`}
                />
              </div>

              {/* WebApp URL Save input */}
              <div className="space-y-2 pt-2 border-t border-gray-200">
                <label className="font-bold text-gray-900 block">Deploy किया हुआ Google Apps Script Web App URL यहाँ दर्ज करें:</label>
                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    placeholder="https://script.google.com/macros/s/AKfycbx.../exec"
                    value={inputAppsScriptUrl}
                    onChange={(e) => setInputAppsScriptUrl(e.target.value)}
                    className="flex-1 p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-xs focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    disabled={appsScriptSaving}
                    onClick={handleSaveAppsScriptUrl}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-5 py-2.5 rounded-xl text-xs transition cursor-pointer shadow-xs flex items-center gap-1.5 shrink-0"
                  >
                    <Save className="h-4 w-4" />
                    {appsScriptSaving ? "सहेजा जा रहा है..." : "URL सहेजें"}
                  </button>
                  {(googleAppsScriptUrl || inputAppsScriptUrl) && (
                    <button
                      type="button"
                      disabled={appsScriptSaving}
                      onClick={handleDisconnectAppsScript}
                      className="bg-red-50 hover:bg-red-100 text-red-700 font-extrabold px-4 py-2.5 rounded-xl text-xs transition cursor-pointer border border-red-200 flex items-center gap-1.5 shrink-0"
                      title="गूगल एप्स स्क्रिप्ट URL डिस्कनेक्ट करें"
                    >
                      <Unlink className="h-4 w-4 text-red-600" />
                      डिस्कनेक्ट करें
                    </button>
                  )}
                </div>
                {appsScriptSuccess && (
                  <p className="text-xs text-emerald-800 font-bold bg-emerald-50 p-2 rounded-xl border border-emerald-200">
                    {appsScriptSuccess}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* BULK KEYWORD DELETE CONFIRMATION MODAL */}
      {kwModalConfirm && kwModalConfirm.open && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl border-2 border-red-200">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-red-100 text-red-700 rounded-2xl flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-gray-900">
                    बल्क डिलीट पुष्टि (Confirm Bulk Delete)
                  </h3>
                  <p className="text-[11px] text-red-600 font-bold">चेतावनी: यह क्रिया वापस नहीं ली जा सकती!</p>
                </div>
              </div>
              <button
                onClick={() => setKwModalConfirm(null)}
                className="text-gray-400 hover:text-gray-600 font-bold p-1 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-gray-700 leading-relaxed">
              <p className="font-semibold text-gray-800">
                क्या आप वाकई निम्नलिखित प्रश्नों को डेटाबेस से <strong>हमेशा के लिए हटाना</strong> चाहते हैं?
              </p>

              <div className="bg-red-50 border border-red-200 p-3.5 rounded-2xl space-y-1.5 font-medium text-xs">
                {kwModalConfirm.type === 'allKeyword' && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-600">सर्च कीवर्ड:</span>
                      <span className="font-extrabold text-red-700 font-mono">"{kwModalConfirm.keyword}"</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">विषय दायरा:</span>
                      <span className="font-bold text-gray-900">{kwSearchSubject === 'all' ? 'सभी विषय' : kwSearchSubject}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between border-t border-red-100 pt-1.5 font-bold">
                  <span className="text-gray-700">कुल डिलीट होने वाले प्रश्न:</span>
                  <span className="text-red-700 font-black text-sm">{kwModalConfirm.count} प्रश्न</span>
                </div>
              </div>

              <p className="text-[11px] text-gray-500 italic">
                डिलीट करने के बाद इन प्रश्नों से संबंधित टेस्ट और दैनिक क्विज के संदर्भ भी सुरक्षित रूप से अपडेट हो जाएंगे।
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setKwModalConfirm(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition cursor-pointer"
              >
                रद्द करें (Cancel)
              </button>

              <button
                type="button"
                disabled={kwDeleting}
                onClick={async () => {
                  if (kwModalConfirm.type === 'allKeyword' && kwModalConfirm.keyword) {
                    await handleDeleteByKeyword(
                      kwModalConfirm.keyword,
                      kwSearchSubject,
                      activeSubTab === 'subjectWise'
                    );
                  } else if (kwModalConfirm.type === 'selected' && kwModalConfirm.ids) {
                    await handleBulkDeleteSelectedIds(kwModalConfirm.ids);
                  }
                }}
                className="px-5 py-2.5 rounded-xl text-xs font-extrabold text-white bg-red-600 hover:bg-red-700 transition cursor-pointer shadow-md flex items-center gap-1.5 disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
                {kwDeleting ? "हटाया जा रहा है..." : "हाँ, हमेशा के लिए डिलीट करें"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EXPORT CLEAN DATA MODAL */}
      {isExportModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-5 shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center gap-2">
                <Download className="h-6 w-6 text-amber-600" />
                <h3 className="text-base font-black text-gray-900">
                  संशोधित प्रश्नों का CSV / Excel निर्यात
                </h3>
              </div>
              <button
                onClick={() => setIsExportModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 font-bold p-1 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs text-gray-700 leading-relaxed font-medium">
              <p>
                आपने जिन प्रश्नों के स्पेलिंग, उत्तर या पंक्तियों को सुधारा है, आप उन सभी <strong>{filteredAuditQuestions.length}</strong> संशोधित प्रश्नों की पूरी क्लीन लिस्ट को 1-क्लिक में डाउनलोड कर सकते हैं:
              </p>

              <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl space-y-3">
                <button
                  onClick={handleExportCSV}
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white font-extrabold p-3 rounded-xl transition cursor-pointer shadow-xs flex items-center justify-center gap-2"
                >
                  <Download className="h-4 w-4" /> शुद्ध प्रश्नों की CSV फाइल डाउनलोड करें (.CSV File)
                </button>
                <p className="text-[11px] text-amber-900 font-semibold text-center">
                  इस CSV को आप सीधे अपने Google Sheet में <strong>File &gt; Import &gt; Replace Sheet</strong> करके एक बार में सभी त्रुटिहीन प्रश्नों से अपडेट कर सकते हैं।
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
