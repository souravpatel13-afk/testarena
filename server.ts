import express from 'express';
import path from 'path';
import fs from 'fs';
import * as XLSX from 'xlsx';
import compression from 'compression';

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Enable Gzip/Brotli compression for fast mobile loading
app.use(compression());

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Ensure data directory exists
const DATA_DIR = path.join(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_FILE = path.join(DATA_DIR, 'db.json');

// Initial seed data
const initialQuestions: any[] = [];
const initialQuizzes: any[] = [];
const initialAttempts: any[] = [];

const initialCurrentAffairs = [
  {
    id: "ca-1",
    month: "July 2026",
    content_hi: "केंद्रीय बजट 2026-27 और छत्तीसगढ़ औद्योगिक गलियारा विकास:\n\nवित्त मंत्री ने वर्ष 2026-27 के लिए केंद्रीय बजट पेश किया है। इसमें शिक्षा, कृषि और बुनियादी ढांचे के विकास पर विशेष बल दिया गया है। आयकर स्लैब में भी कुछ महत्वपूर्ण बदलाव किए गए हैं ताकि मध्यम वर्ग को राहत मिल सके। डिजिटल अर्थव्यवस्था और हरित ऊर्जा के विकास के लिए नई राष्ट्रीय योजनाओं की घोषणा की गई है।\n\nछत्तीसगढ़ राज्य के संदर्भ में, राज्य सरकार ने विनिर्माण गतिविधियों को बढ़ावा देने के लिए एक नवीन रायपुर-बिलासपुर औद्योगिक गलियारे के विकास की घोषणा की है। इस महत्वाकांक्षी परियोजना से राज्य भर में 50,000 से अधिक प्रत्यक्ष व अप्रत्यक्ष रोजगार के नए अवसर सृजित होने की उम्मीद है, जिसमें विभिन्न बहुराष्ट्रीय कंपनियां निवेश कर रही हैं।",
    createdAt: new Date().toISOString()
  },
  {
    id: "ca-3",
    month: "June 2026",
    content_hi: "आदित्य-L1 सौर मिशन की बड़ी वैज्ञानिक खोज:\n\nभारतीय अंतरिक्ष अनुसंधान संगठन (ISRO) के सौर अन्वेषण मिशन आदित्य-L1 ने सूर्य के कोरोना (corona) बाहरी वायुमंडल क्षेत्र से अत्यंत महत्वपूर्ण डेटा एकत्र किया है। वैज्ञानिकों ने सूर्य की चुंबकीय गतिविधियों और सौर तूफानों के निर्माण के पैटर्न के बारे में नई वैज्ञानिक जानकारी प्राप्त की है। यह महत्वपूर्ण शोध अंतरिक्ष मौसम के पूर्वानुमान और पृथ्वी की परिक्रमा कर रहे उपग्रहों को सौर विकिरण से सुरक्षित रखने में बेहद मददगार साबित होगा।",
    createdAt: new Date().toISOString()
  }
];

const initialExamInfo = [
  {
    id: "exam-cgpsc-pre",
    examName: "CGPSC State Services (Prelims)",
    shortTagline: "छत्तीसगढ़ लोक सेवा आयोग (CGPSC) राज्य सेवा प्रारंभिक परीक्षा",
    category: "PSC Exams",
    overview: "CGPSC राज्य सेवा परीक्षा छत्तीसगढ़ राज्य शासन के विभिन्न प्रशासनिक पदों (उप जिलाधिकारी, पुलिस अधीक्षक, वित्त सेवा, आदि) हेतु आयोजित की जाती है। प्रारंभिक परीक्षा एक छंटनी परीक्षा (Screening Test) है, जिसमें बहुविकल्पीय वस्तुनिष्ठ प्रश्न (MCQs) पूछे जाते हैं।",
    eligibility: "1. शैक्षणिक योग्यता: भारत में किसी मान्यता प्राप्त विश्वविद्यालय से स्नातक (Graduation) की उपाधि।\n2. आयु सीमा: 21 वर्ष से 28/35 वर्ष (छत्तीसगढ़ के मूल निवासियों एवं आरक्षित वर्गों को नियमानुसार आयु सीमा में छूट)।",
    selectionProcess: "1. प्रारंभिक परीक्षा (Prelims - Objective)\n2. मुख्य परीक्षा (Mains - Written Descriptive)\n3. साक्षात्कार (Interview - Personality Test)",
    patterns: [
      {
        stage: "प्रश्न पत्र - I: सामान्य अध्ययन (GS Paper 1)",
        duration: "2 घंटे (120 मिनट)",
        totalQuestions: "100 प्रश्न",
        totalMarks: "200 अंक",
        negativeMarking: "1/3 नकारात्मक अंकन (-0.66 अंक)"
      },
      {
        stage: "प्रश्न पत्र - II: योग्यता परीक्षा (Aptitude Test Paper 2)",
        duration: "2 घंटे (120 मिनट)",
        totalQuestions: "100 प्रश्न",
        totalMarks: "200 अंक (केवल अर्हकारी - 33% उत्तीर्ण अंक)",
        negativeMarking: "1/3 नकारात्मक अंकन (-0.66 अंक)"
      }
    ],
    syllabus: [
      {
        paperName: "प्रश्न पत्र - 1: सामान्य अध्ययन (General Studies)",
        topics: [
          "भाग 1: भारत का इतिहास एवं स्वतंत्रता आंदोलन, भारत का भौतिक, सामाजिक व आर्थिक भूगोल, भारतीय संविधान एवं राजव्यवस्था, भारतीय अर्थव्यवस्था, सामान्य विज्ञान व प्रौद्योगिकी, दर्शन, कला व संस्कृति।",
          "भाग 2: छत्तीसगढ़ का सामान्य ज्ञान - छत्तीसगढ़ का इतिहास व स्वतंत्रता आंदोलन में योगदान, छत्तीसगढ़ का भूगोल, जलवायु, नदियां, मिट्टी, जलप्रपात, छत्तीसगढ़ की जनजातियां, तीज-त्यौहार, लोक नृत्य व कला, छत्तीसगढ़ का प्रशासनिक ढांचा, पंचायती राज व स्थानीय शासन, छत्तीसगढ़ की अर्थव्यवस्था, वन व कृषि।"
        ]
      },
      {
        paperName: "प्रश्न पत्र - 2: योग्यता परीक्षा (Aptitude Test)",
        topics: [
          "संचार कौशल सहित अंतर-व्यक्तिगत कौशल, तार्किक तर्कशक्ति और विश्लेषणात्मक क्षमता, निर्णय लेने की क्षमता और समस्या निवारण, सामान्य मानसिक योग्यता, मूल संख्यात्मक कार्य (दसवीं कक्षा का स्तर), आंकड़ों का निर्वचन, हिंदी भाषा एवं छत्तीसगढ़ी भाषा का ज्ञान।"
        ]
      }
    ],
    pdfUrl: "https://psc.cg.gov.in/pdf/SYLLABUS/STATE_SERVICE_EXAM.pdf",
    updatedAt: new Date().toISOString()
  },
  {
    id: "exam-cg-vyapam",
    examName: "CG Vyapam (व्यापमं प्रतियोगी परीक्षाएं)",
    shortTagline: "छत्तीसगढ़ व्यावसायिक परीक्षा मंडल (CG Vyapam) भर्ती परीक्षाएं",
    category: "Vyapam Exams",
    overview: "CG Vyapam द्वारा राज्य शासन के विभिन्न विभागों जैसे हॉस्टल अधीक्षक (Hostel Warden), राजस्व निरीक्षक (RI), पटवारी (Patwari), सहायक ग्रेड-3, डाटा एंट्री ऑपरेटर आदि के पदों पर सीधी भर्ती हेतु वस्तुनिष्ठ परीक्षाएं आयोजित की जाती हैं।",
    eligibility: "1. शैक्षणिक योग्यता: पद अनुसार 12वीं उत्तीर्ण / कंप्यूटर डिप्लोमा / स्नातक (Graduation)।\n2. आयु सीमा: 18 वर्ष से 35/40 वर्ष (छत्तीसगढ़ निवासियों को नियमानुसार छूट)।",
    selectionProcess: "1. एकल चरण वस्तुनिष्ठ लिखित परीक्षा (Single Stage Written MCQ Test)\n2. कौशल परीक्षा / दस्तावेज सत्यापन (Skill Test / Document Verification - पद अनुसार)",
    patterns: [
      {
        stage: "संयुक्त लिखित परीक्षा (Written Competitive Test)",
        duration: "3 घंटे (180 मिनट)",
        totalQuestions: "150 प्रश्न",
        totalMarks: "150 अंक",
        negativeMarking: "1/4 नकारात्मक अंकन (-0.25 अंक)"
      }
    ],
    syllabus: [
      {
        paperName: "सामान्य प्रश्न पत्र भाग (Combined Paper)",
        topics: [
          "कंप्यूटर का सामान्य ज्ञान (30-50 अंक): कंप्यूटर का उपयोग, ऑपरेटिंग सिस्टम, MS Office, इंटरनेट, एंटीवायरस, सर्च इंजन व मल्टीमीडिया।",
          "छत्तीसगढ़ का सामान्य ज्ञान (20-30 अंक): छत्तीसगढ़ का इतिहास, भूगोल, संस्कृति, जनजातियां, नदियां व समसामयिकी।",
          "सामान्य अध्ययन (25-35 अंक): भारतीय इतिहास, राजव्यवस्था, भूगोल, सामान्य विज्ञान, अर्थव्यवस्था।",
          "सामान्य हिंदी व अंग्रेजी व्याकरण (15-20 अंक): स्वर, व्यंजन, संधि, समास, तद्भव-तत्सम, मुहावरे, Grammar, Vocabulary.",
          "सामान्य गणित व मानसिक योग्यता (20-30 अंक): संख्या पद्धति, प्रतिशत, लाभ-हानि, अनुपात, साधारण व चक्रवृद्धि ब्याज, समय-दूरी, कोडिंग-डिकोडिंग, रीजनिंग।"
        ]
      }
    ],
    pdfUrl: "https://vyapam.cgstate.gov.in/",
    updatedAt: new Date().toISOString()
  },
  {
    id: "exam-cg-teacher",
    examName: "छत्तीसगढ़ शिक्षक व सहायक शिक्षक भर्ती",
    shortTagline: "स्कूल शिक्षा विभाग शिक्षक, सहायक शिक्षक एवं व्याख्याता भर्ती परीक्षा",
    category: "Teaching Exams",
    overview: "छत्तीसगढ़ शासन के स्कूल शिक्षा विभाग द्वारा प्राथमिक (कक्षा 1 से 5) एवं उच्च प्राथमिक (कक्षा 6 से 8) शालाओं हेतु सहायक शिक्षक, शिक्षक एवं व्याख्याता के पदों पर भर्ती व्यापमं द्वारा की जाती है।",
    eligibility: "1. सहायक शिक्षक (वर्ग-3): 12वीं में न्यूनतम 50% अंक + D.El.Ed/D.Ed + CG TET (प्राथमिक स्तर उत्तीर्ण)।\n2. शिक्षक (वर्ग-2): संबंधित विषय में स्नातक + B.Ed / D.El.Ed + CG TET (उच्च प्राथमिक स्तर उत्तीर्ण)।",
    selectionProcess: "1. लिखित वस्तुनिष्ठ परीक्षा (Written Examination)\n2. मेरिट सूची एवं दस्तावेज सत्यापन (Merit & Document Verification)",
    patterns: [
      {
        stage: "लिखित परीक्षा (Written Competitive Test)",
        duration: "2 घंटे 30 मिनट (150 मिनट)",
        totalQuestions: "150 प्रश्न",
        totalMarks: "150 अंक",
        negativeMarking: "1/4 नकारात्मक अंकन (-0.25 अंक)"
      }
    ],
    syllabus: [
      {
        paperName: "परीक्षा पाठ्यक्रम (Syllabus Units)",
        topics: [
          "बाल विकास एवं शिक्षाशास्त्र (Child Development & Pedagogy) - 30 अंक",
          "सामान्य हिंदी (General Hindi) - 25 अंक",
          "सामान्य अंग्रेजी (General English) - 25 अंक",
          "गणित एवं विज्ञान / सामाजिक अध्ययन (Subject Specific) - 30 अंक",
          "कंप्यूटर संबंधी सामान्य ज्ञान (General Computer Knowledge) - 10 अंक",
          "सामान्य ज्ञान व छत्तीसगढ़ का सामान्य ज्ञान (General Knowledge & CG GK) - 10-30 अंक"
        ]
      }
    ],
    pdfUrl: "https://vyapam.cgstate.gov.in/",
    updatedAt: new Date().toISOString()
  }
];

// Database Loader / Saver Helpers
let cachedDbInMemory: any = null;

function loadDatabase() {
  if (cachedDbInMemory) {
    return cachedDbInMemory;
  }

  const BACKUP_FILE = path.join(DATA_DIR, 'db.json.bak');

  if (fs.existsSync(DB_FILE)) {
    try {
      const data = fs.readFileSync(DB_FILE, 'utf8');
      if (data && data.trim()) {
        const db = JSON.parse(data);
        let dirty = false;
        if (!db.currentAffairs) {
          db.currentAffairs = initialCurrentAffairs;
          dirty = true;
        }
        if (!db.examInfo) {
          db.examInfo = initialExamInfo;
          dirty = true;
        }
        if (!db.user || db.user.name === "Sourav Patel") {
          db.user = {
            id: "guest-user",
            name: "Aspirant",
            email: "aspirant@testarena.co.in",
            role: "aspirant"
          };
          dirty = true;
        }
        if (dirty) {
          saveDatabase(db);
        }
        cachedDbInMemory = db;
        return db;
      }
    } catch (error) {
      console.error("Error reading primary database file:", error);
      if (fs.existsSync(BACKUP_FILE)) {
        try {
          const bakData = fs.readFileSync(BACKUP_FILE, 'utf8');
          if (bakData && bakData.trim()) {
            const db = JSON.parse(bakData);
            console.log("Successfully restored database from backup file.");
            saveDatabase(db);
            cachedDbInMemory = db;
            return db;
          }
        } catch (bakError) {
          console.error("Error reading backup database file:", bakError);
        }
      }
    }
  }

  // Seeding default database
  const defaultDb = {
    questions: initialQuestions,
    quizzes: initialQuizzes,
    attempts: initialAttempts,
    currentAffairs: initialCurrentAffairs,
    examInfo: initialExamInfo,
    user: {
      id: "guest-user",
      name: "Aspirant",
      email: "aspirant@testarena.co.in",
      role: "aspirant"
    }
  };
  saveDatabase(defaultDb);
  cachedDbInMemory = defaultDb;
  return defaultDb;
}

function saveDatabase(data: any) {
  cachedDbInMemory = data;
  try {
    const TEMP_FILE = path.join(DATA_DIR, 'db.json.tmp');
    const BACKUP_FILE = path.join(DATA_DIR, 'db.json.bak');
    const jsonString = JSON.stringify(data, null, 2);

    // Write to temporary file first
    fs.writeFileSync(TEMP_FILE, jsonString, 'utf8');

    // Create a backup of existing valid db before replacing
    if (fs.existsSync(DB_FILE)) {
      try {
        fs.copyFileSync(DB_FILE, BACKUP_FILE);
      } catch (copyErr) {
        // Non-critical if backup copy fails
      }
    }

    // Atomic replace temp file -> main db file
    fs.renameSync(TEMP_FILE, DB_FILE);
    return true;
  } catch (error) {
    console.error("Error writing database file:", error);
    return false;
  }
}

// REST API Endpoints

// Get current questions
app.get('/api/questions', (req, res) => {
  const db = loadDatabase();
  res.json(db.questions || []);
});

// Create single question
app.post('/api/questions', (req, res) => {
  const db = loadDatabase();
  const newQuestion = req.body;
  if (!newQuestion.id) {
    newQuestion.id = "q-" + Date.now() + "-" + Math.random().toString(36).substr(2, 5);
  }
  db.questions = db.questions || [];
  db.questions.push(newQuestion);
  saveDatabase(db);
  res.status(201).json(newQuestion);
});

// Helper to get correct Google Apps Script Webhook URL for a question
function getAppsScriptUrlForQuestion(db: any, q?: any): string {
  const isPyq = q ? Boolean(q.exam && String(q.exam).trim()) : false;
  const pyqUrl = db.settings?.googleAppsScriptUrlPyq?.trim();
  const subjectUrl = db.settings?.googleAppsScriptUrlSubject?.trim();
  const generalUrl = db.settings?.googleAppsScriptUrl?.trim();

  if (isPyq) {
    return pyqUrl || generalUrl || subjectUrl || '';
  } else {
    return subjectUrl || generalUrl || pyqUrl || '';
  }
}

// Helper to post to Google Apps Script Webhook
async function callGoogleAppsScriptWebhook(targetUrl: string, payload: any): Promise<{ success: boolean; error?: string }> {
  try {
    const bodyString = JSON.stringify(payload);
    
    // Execute POST with redirect: 'follow' (Node fetch automatically follows 302 to script.googleusercontent.com)
    let response = await fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: bodyString,
      redirect: 'follow'
    });

    if (!response.ok) {
      return { success: false, error: `Google Apps Script returned HTTP ${response.status}` };
    }

    const resText = await response.text();
    try {
      const resJson = JSON.parse(resText);
      if (resJson.status === 'success' || resJson.status === 'ok') {
        return { success: true };
      } else if (resJson.status === 'not_found') {
        return { success: false, error: "गूगल शीट में यह प्रश्न (ID/टेक्स्ट) नहीं मिला।" };
      } else {
        return { success: false, error: resJson.error || "गूगल एप्स स्क्रिप्ट से प्रतिक्रिया में त्रुटि मिली।" };
      }
    } catch (parseErr) {
      if (resText.includes('HTML') || resText.includes('<!DOCTYPE') || resText.includes('<html')) {
        return { success: false, error: "Apps Script से HTML मिला। वेब एप 'Deploy -> New deployment -> Who has access: Anyone' सेट किया गया होना चाहिए।" };
      }
      if (resText.toLowerCase().includes('success') || resText.toLowerCase().includes('ok')) {
        return { success: true };
      }
      return { success: false, error: `प्रतिक्रिया: ${resText.substring(0, 100)}` };
    }
  } catch (err: any) {
    return { success: false, error: err.message || "Apps Script वेबहुक तक पहुँचने में विफल।" };
  }
}

// Create single question
app.post('/api/questions', async (req, res) => {
  const db = loadDatabase();
  const newQuestion = req.body;
  if (!newQuestion.id) {
    newQuestion.id = "q-" + Date.now() + "-" + Math.random().toString(36).substr(2, 5);
  }
  db.questions = db.questions || [];
  db.questions.push(newQuestion);
  saveDatabase(db);

  let sheetSynced = false;
  let syncError: string | null = null;
  const targetAppsScriptUrl = getAppsScriptUrlForQuestion(db, newQuestion);
  if (targetAppsScriptUrl) {
    const isPyq = Boolean(newQuestion.exam && String(newQuestion.exam).trim());
    const syncRes = await callGoogleAppsScriptWebhook(targetAppsScriptUrl, {
      action: 'UPDATE_QUESTION',
      sheetType: isPyq ? 'pyq' : 'subject',
      question: newQuestion
    });
    sheetSynced = syncRes.success;
    syncError = syncRes.error || null;
  }

  res.status(201).json({
    ...newQuestion,
    sheetSynced,
    syncError
  });
});

// Update single question by ID
app.put('/api/questions/:id', async (req, res) => {
  const db = loadDatabase();
  const qId = req.params.id;
  db.questions = db.questions || [];
  
  const qIndex = db.questions.findIndex((q: any) => q.id === qId);
  if (qIndex === -1) {
    return res.status(404).json({ error: "Question not found" });
  }

  const updatedData = req.body;
  const existingQ = db.questions[qIndex];
  
  const mergedQ = {
    ...existingQ,
    ...updatedData,
    id: qId, // preserve original ID
    lastEditedAt: new Date().toISOString()
  };

  db.questions[qIndex] = mergedQ;
  saveDatabase(db);

  let sheetSynced = false;
  let syncError: string | null = null;

  // Attempt Google Apps Script Webhook Sync if URL configured
  const isPyq = Boolean(mergedQ.exam && String(mergedQ.exam).trim());
  const targetAppsScriptUrl = getAppsScriptUrlForQuestion(db, mergedQ);

  if (targetAppsScriptUrl) {
    const syncRes = await callGoogleAppsScriptWebhook(targetAppsScriptUrl, {
      action: 'UPDATE_QUESTION',
      sheetType: isPyq ? 'pyq' : 'subject',
      question: mergedQ,
      oldQuestion: existingQ
    });

    sheetSynced = syncRes.success;
    syncError = syncRes.error || null;
  }

  res.json({
    success: true,
    message: "Question updated successfully",
    question: mergedQ,
    sheetSynced,
    syncError
  });
});

// Manual trigger to sync a question or list of questions to Google Apps Script
app.post('/api/sync-question-to-sheet', async (req, res) => {
  const db = loadDatabase();
  const { question, questions, appsScriptUrl: reqUrl } = req.body;
  const itemsToSync = questions || (question ? [question] : []);

  if (!itemsToSync.length) {
    return res.status(400).json({ error: "सिंक करने के लिए कोई प्रश्न नहीं मिला।" });
  }

  try {
    let successCount = 0;
    let lastError: string | null = null;

    for (const q of itemsToSync) {
      const targetUrl = reqUrl?.trim() || getAppsScriptUrlForQuestion(db, q);
      if (!targetUrl) {
        lastError = "गूगल एप्स स्क्रिप्ट URL सेटिंग्स में दर्ज नहीं है।";
        continue;
      }

      const isPyq = Boolean(q.exam && String(q.exam).trim());
      const resSync = await callGoogleAppsScriptWebhook(targetUrl, {
        action: 'UPDATE_QUESTION',
        sheetType: isPyq ? 'pyq' : 'subject',
        question: q
      });

      if (resSync.success) {
        successCount++;
      } else if (resSync.error) {
        lastError = resSync.error;
      }
    }

    if (successCount > 0) {
      res.json({
        success: true,
        syncedCount: successCount,
        totalCount: itemsToSync.length,
        message: `सफलतापूर्वक ${successCount} प्रश्न गूगल शीट में सिंक/अपडेट हो गए!`
      });
    } else {
      res.status(400).json({
        error: lastError || "गूगल शीट में डेटा सिंक नहीं हो सका। कृपया Webhook URL जांचें।"
      });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Apps Script वेबहुक तक पहुँचने में विफल।" });
  }
});

// Full Bulk Sync endpoint to push all questions directly to Google Apps Script
app.post('/api/sync-all-to-sheet', async (req, res) => {
  const db = loadDatabase();
  const { sheetType = 'pyq' } = req.body;
  const isPyq = sheetType === 'pyq';

  const dummyQ = { exam: isPyq ? 'PYQ' : '' };
  const targetAppsScriptUrl = getAppsScriptUrlForQuestion(db, dummyQ);

  if (!targetAppsScriptUrl) {
    return res.status(400).json({ error: "कृपया सेटिंग्स में गूगल एप्स स्क्रिप्ट वेबहुक URL सहेजें।" });
  }

  const allQuestions = db.questions || [];
  const questionsToSync = allQuestions.filter((q: any) => {
    if (isPyq) return Boolean(q.exam && String(q.exam).trim());
    return !q.exam || !q.exam.trim();
  });

  if (questionsToSync.length === 0) {
    return res.status(400).json({ error: "गूगल शीट में सिंक करने के लिए कोई प्रश्न नहीं मिले।" });
  }

  const syncRes = await callGoogleAppsScriptWebhook(targetAppsScriptUrl, {
    action: 'SYNC_ALL_QUESTIONS',
    sheetType: isPyq ? 'pyq' : 'subject',
    questions: questionsToSync
  });

  if (syncRes.success) {
    return res.json({
      success: true,
      count: questionsToSync.length,
      message: `सफलतापूर्वक सभी ${questionsToSync.length} प्रश्नों को गूगल शीट में सिंक/अपडेट कर दिया गया!`
    });
  } else {
    return res.status(500).json({
      error: syncRes.error || "गूगल शीट में डेटा पुश करने में विफलता।"
    });
  }
});

// Delete single question
app.delete('/api/questions/:id', async (req, res) => {
  const db = loadDatabase();
  const qId = req.params.id;
  db.questions = db.questions || [];
  
  const targetQ = db.questions.find((q: any) => q.id === qId);
  if (!targetQ) {
    return res.status(404).json({ error: "Question not found" });
  }

  db.questions = db.questions.filter((q: any) => q.id !== qId);
  saveDatabase(db);

  // Sync deletion to Google Sheet if Webhook configured
  const targetAppsScriptUrl = getAppsScriptUrlForQuestion(db, targetQ);
  if (targetAppsScriptUrl) {
    const isPyq = Boolean(targetQ.exam && String(targetQ.exam).trim());
    callGoogleAppsScriptWebhook(targetAppsScriptUrl, {
      action: 'UPDATE_QUESTION',
      sheetType: isPyq ? 'pyq' : 'subject',
      question: { ...targetQ, is_deleted: true, text_hi: (targetQ.text_hi || '') + ' (DELETED)' }
    }).catch(() => {});
  }

  res.json({ message: "Question deleted successfully", id: qId });
});

// Replace all questions (full sync from Google Sheet)
app.post('/api/questions/replace', (req, res) => {
  const db = loadDatabase();
  const newQuestions = req.body;
  if (!Array.isArray(newQuestions)) {
    return res.status(400).json({ error: "Request body must be an array of questions" });
  }
  
  db.questions = newQuestions;
  saveDatabase(db);
  res.json({ message: "Questions replaced successfully", count: newQuestions.length });
});

// Get settings
app.get('/api/settings', (req, res) => {
  const db = loadDatabase();
  res.json(db.settings || { spreadsheetId: "", spreadsheetIdPyq: "", spreadsheetIdSubject: "", spreadsheetIdCurrentAffairs: "", googleAppsScriptUrl: "", adminPasscode: "Kitkatisbest" });
});

// Update settings
app.post('/api/settings', (req, res) => {
  const db = loadDatabase();
  db.settings = { ...db.settings, ...req.body };
  saveDatabase(db);
  res.json(db.settings);
});

// Verify Admin Passcode for login on custom domains (e.g., testarena.co.in)
app.post('/api/admin/verify-passcode', (req, res) => {
  const { passcode } = req.body;
  const db = loadDatabase();
  const currentPasscode = (db.settings && db.settings.adminPasscode) || "Kitkatisbest";

  if (passcode && passcode.trim() === currentPasscode.trim()) {
    return res.json({ success: true, message: "लॉगिन सफल!", email: "souravpatel13@gmail.com" });
  } else {
    return res.status(401).json({ success: false, error: "गलत पासकोड (Incorrect Passcode)! कृपया सही एडमिन पासवर्ड दर्ज करें।" });
  }
});

function parseCorrectAnswerServer(rawVal: any, options: string[]): number {
  if (rawVal === undefined || rawVal === null) return 0;
  const valStr = String(rawVal).trim();
  if (valStr === '') return 0;

  if (
    valStr.includes('*') ||
    /^(star|vifopit|wilopit|deleted|invalidated|cancelled|विलोपित|स्टार)$/i.test(valStr)
  ) {
    return -1;
  }

  if (/^[a-eA-E]$/.test(valStr)) {
    return valStr.toUpperCase().charCodeAt(0) - 65;
  }

  const exactMatchIdx = options.findIndex(opt => opt && opt.trim() === valStr);
  if (exactMatchIdx !== -1) return exactMatchIdx;

  const lowerMatchIdx = options.findIndex(opt => opt && opt.trim().toLowerCase() === valStr.toLowerCase());
  if (lowerMatchIdx !== -1) return lowerMatchIdx;

  const parsed = parseInt(valStr, 10);
  if (!isNaN(parsed)) {
    if (parsed >= 1 && parsed <= Math.max(4, options.length)) {
      return parsed - 1;
    }
    if (parsed >= 0 && parsed < Math.max(4, options.length)) {
      return parsed;
    }
  }
  return 0;
}

function processParsedRows(rawJsonRows: any[], sheetType: string, action: string, res: express.Response) {
  const db = loadDatabase();

  if (sheetType === 'currentAffairs') {
    const parsedCA = rawJsonRows.map((r, idx) => {
      const month = r['Month'] || r['month'] || r['माह'] || r['महीना'] || 'July 2026';
      const title = r['Title'] || r['title'] || r['शीर्षक'] || month;
      const category = r['Category'] || r['category'] || r['श्रेणी'] || 'General';
      const content_hi = r['Content (HI)'] || r['Content'] || r['content_hi'] || r['विवरण'] || r['खबर'] || '';
      const content_en = r['Content (EN)'] || r['content_en'] || '';

      return {
        id: `ca-sheet-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 4)}`,
        month: String(month).trim(),
        title: String(title).trim(),
        category: String(category).trim(),
        content_hi: String(content_hi).trim(),
        content_en: String(content_en).trim(),
        createdAt: new Date().toISOString()
      };
    }).filter(ca => ca.content_hi.length > 0 || ca.title.length > 0);

    if (parsedCA.length === 0) {
      return res.status(400).json({ error: "करंट अफेयर्स शीट में कोई मान्य पंक्तियाँ नहीं मिलीं। कृपया ध्यान दें कि विवरण (Content HI) कॉलम में सामग्री होनी चाहिए।" });
    }

    if (action === 'import_replace') {
      db.currentAffairs = parsedCA;
      saveDatabase(db);
      return res.json({
        success: true,
        message: `सफलतापूर्वक सभी पुराने डेटा को बदलकर ${parsedCA.length} नए करंट अफेयर्स आइटम सहेजे गए!`,
        count: parsedCA.length,
        items: parsedCA
      });
    } else if (action === 'import_append') {
      db.currentAffairs = db.currentAffairs || [];
      db.currentAffairs.push(...parsedCA);
      saveDatabase(db);
      return res.json({
        success: true,
        message: `सफलतापूर्वक ${parsedCA.length} नए करंट अफेयर्स आइटम डेटाबेस में जोड़े गए!`,
        count: parsedCA.length,
        items: parsedCA
      });
    } else {
      return res.json({
        success: true,
        message: `सफलतापूर्वक ${parsedCA.length} करंट अफेयर्स पंक्तियाँ पढ़ी गईं!`,
        count: parsedCA.length,
        items: parsedCA
      });
    }
  }

  // Question parsing for PYQ or Subject
  const parsedQuestions = rawJsonRows.map((r, idx) => {
    const cleanStr = (val: any) => {
      if (val === undefined || val === null) return '';
      return String(val).replace(/\u00a0/g, ' ').trim();
    };

    const getVal = (patterns: (string | RegExp)[]) => {
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

    const textHi = getVal([
      'text_hi', 'question_hi', 'Question (HI)', 'Question', 'Question (Hindi)', 'text', 'प्रश्न', 'प्रश्न (हिन्दी)', /^text_hi$/i, /^question_hi$/i
    ]);
    const textEn = getVal([
      'text_en', 'question_en', 'Question (EN)', 'Question (English)', 'प्रश्न (अंग्रेजी)', /^text_en$/i, /^question_en$/i
    ]);

    const opt1 = getVal([
      'option_hi_1', 'option_hi_a', 'option_1', 'option_a', 'option1', 'optiona',
      'Option A', 'Option A (HI)', 'Option 1', 'OptionA', 'विकल्प A', 'विकल्प 1',
      'A', 'a', '(A)', '(a)', 'Ans A', 'ans_a', /^option_hi_1$/i, /^option_1$/i, /^option_a$/i
    ]);
    const opt2 = getVal([
      'option_hi_2', 'option_hi_b', 'option_2', 'option_b', 'option2', 'optionb',
      'Option B', 'Option B (HI)', 'Option 2', 'OptionB', 'विकल्प B', 'विकल्प 2',
      'B', 'b', '(B)', '(b)', 'Ans B', 'ans_b', /^option_hi_2$/i, /^option_2$/i, /^option_b$/i
    ]);
    const opt3 = getVal([
      'option_hi_3', 'option_hi_c', 'option_3', 'option_c', 'option3', 'optionc',
      'Option C', 'Option C (HI)', 'Option 3', 'OptionC', 'विकल्प C', 'विकल्प 3',
      'C', 'c', '(C)', '(c)', 'Ans C', 'ans_c', /^option_hi_3$/i, /^option_3$/i, /^option_c$/i
    ]);
    const opt4 = getVal([
      'option_hi_4', 'option_hi_d', 'option_4', 'option_d', 'option4', 'optiond',
      'Option D', 'Option D (HI)', 'Option 4', 'OptionD', 'विकल्प D', 'विकल्प 4',
      'D', 'd', '(D)', '(d)', 'Ans D', 'ans_d', /^option_hi_4$/i, /^option_4$/i, /^option_d$/i
    ]);
    const opt5 = getVal([
      'option_hi_5', 'option_hi_e', 'option_5', 'option_e', 'option5', 'optione',
      'Option E', 'Option E (HI)', 'Option 5', 'OptionE', 'विकल्प E', 'विकल्प 5',
      'E', 'e', '(E)', '(e)', 'Ans E', 'ans_e', /^option_hi_5$/i, /^option_5$/i, /^option_e$/i
    ]);

    const options_hi = [opt1, opt2, opt3, opt4, opt5].filter(Boolean);

    const ansRaw = getVal(['correctAnswer', 'Correct Answer', 'Answer', 'correct_answer', 'CorrectAnswer', 'उत्तर', 'सही उत्तर']) || '1';
    const deletedRaw = getVal(['is_deleted', 'is_invalidated', 'vifopit', 'wilopit', 'is_vifopit', 'विलोपित', 'deleted', 'cancelled', 'is_deleted_question']);

    const isDeletedQuestion = Boolean(
      (ansRaw && (ansRaw.includes('*') || /^(star|vifopit|wilopit|deleted|invalidated|cancelled|विलोपित|स्टार)$/i.test(ansRaw.trim()))) ||
      (deletedRaw && (deletedRaw.includes('*') || /^(true|1|yes|vifopit|wilopit|deleted|invalidated|cancelled|विलोपित|हाँ|star)$/i.test(deletedRaw.trim())))
    );

    const correctAnswer = isDeletedQuestion ? -1 : parseCorrectAnswerServer(ansRaw, options_hi);

    let defaultSub = 'Chhattisgarh General Knowledge';
    if (sheetType === 'subject') defaultSub = 'Chhattisgarh General Knowledge';

    const subject = getVal(['subject', 'Subject', 'विषय']) || defaultSub;
    const topic = getVal(['topic', 'Topic', 'विषय-वस्तु', 'टॉपिक']) || 'सामान्य परिचय';
    const exam = getVal(['exam', 'Exam', 'परीक्षा']) || (sheetType === 'pyq' ? 'CGPSC Prelims' : '');
    const yearRaw = getVal(['year', 'Year', 'वर्ष']);
    const year = yearRaw ? parseInt(String(yearRaw)) : undefined;

    const explanation_hi = getVal(['explanation_hi', 'Explanation (HI)', 'Explanation', 'व्याख्या', 'व्याख्या (हिन्दी)']);
    const explanation_en = getVal(['explanation_en', 'Explanation (EN)', 'व्याख्या (अंग्रेजी)']);

    const idVal = getVal(['id', 'ID', 'Id', 'S.No', 'Sr.No', 's_no', 'sr_no']);
    const idToUse = idVal ? String(idVal).trim() : `q-sheet-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 4)}`;

    return {
      id: idToUse,
      sheetRowNumber: idx + 2,
      text_hi: String(textHi).trim(),
      text_en: String(textEn).trim(),
      options_hi,
      options_en: [],
      correctAnswer,
      is_deleted: isDeletedQuestion,
      subject: String(subject).trim(),
      topic: String(topic).trim(),
      exam: String(exam || '').trim(),
      year: (year && !isNaN(year)) ? year : undefined,
      explanation_hi: String(explanation_hi).trim(),
      explanation_en: String(explanation_en).trim()
    };
  }).filter(q => q.text_hi.length > 0);

  if (parsedQuestions.length === 0) {
    return res.status(400).json({ error: "शीट में कोई मान्य प्रश्न नहीं मिले। कृपया सुनिश्चित करें कि पहली पंक्ति में 'Question (HI)', 'Option A', 'Option B', 'Correct Answer' हेडर मौजूद हैं।" });
  }

  if (action === 'import_replace') {
    db.questions = parsedQuestions;
    saveDatabase(db);
    return res.json({
      success: true,
      message: `सफलतापूर्वक सभी पुराने प्रश्नों को बदलकर ${parsedQuestions.length} नए प्रश्न सहेजे गए!`,
      count: parsedQuestions.length,
      items: parsedQuestions
    });
  } else if (action === 'import_append') {
    db.questions = db.questions || [];
    db.questions.push(...parsedQuestions);
    saveDatabase(db);
    return res.json({
      success: true,
      message: `सफलतापूर्वक ${parsedQuestions.length} नए प्रश्न डेटाबेस में जोड़े गए!`,
      count: parsedQuestions.length,
      items: parsedQuestions
    });
  } else {
    return res.json({
      success: true,
      message: `सफलतापूर्वक ${parsedQuestions.length} प्रश्न पढ़े गए!`,
      count: parsedQuestions.length,
      items: parsedQuestions
    });
  }
}

// Pull & Sync Google Sheet Endpoint
app.post('/api/pull-sheet', async (req, res) => {
  try {
    const { sheetInput, sheetType = 'pyq', action = 'preview', accessToken } = req.body;
    if (!sheetInput || typeof sheetInput !== 'string' || !sheetInput.trim()) {
      return res.status(400).json({ error: "कृपया एक वैध गूगल शीट ID या URL दर्ज करें।" });
    }

    const trimmed = sheetInput.trim();
    const matchId = trimmed.match(/\/d\/([a-zA-Z0-9-_]+)/);
    const sheetId = matchId ? matchId[1] : trimmed;
    
    const matchGid = trimmed.match(/[?&]gid=([0-9]+)/);
    const gid = matchGid ? matchGid[1] : null;

    let csvText = '';
    let fetchedOk = false;

    // Method 1: OAuth token if present
    if (accessToken) {
      try {
        const range = 'A1:Z1000';
        const googleApiUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}`;
        const gRes = await fetch(googleApiUrl, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        if (gRes.ok) {
          const gData = await gRes.json();
          const rows = gData.values || [];
          if (rows.length > 1) {
            const headers = rows[0];
            const dataRows = rows.slice(1);
            const jsonObjects = dataRows.map((r: any) => {
              const obj: any = {};
              headers.forEach((h: string, i: number) => {
                obj[h] = r[i] !== undefined ? r[i] : '';
              });
              return obj;
            });
            return processParsedRows(jsonObjects, sheetType, action, res);
          }
        }
      } catch (err) {
        console.warn("Google Sheets API fetch failed, trying export URLs:", err);
      }
    }

    // Method 2: Public CSV Export URLs from server
    const exportUrls = [
      `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv${gid ? '&gid=' + gid : ''}`,
      `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv${gid ? '&gid=' + gid : ''}`,
      `https://docs.google.com/spreadsheets/d/${sheetId}/pub?output=csv${gid ? '&gid=' + gid : ''}`
    ];

    for (const url of exportUrls) {
      try {
        const fetchRes = await fetch(url, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
        });
        if (fetchRes.ok) {
          const text = await fetchRes.text();
          if (text && !text.includes('<!DOCTYPE html>') && !text.includes('<html')) {
            csvText = text;
            fetchedOk = true;
            break;
          }
        }
      } catch (e) {
        console.warn(`Failed fetch from ${url}:`, e);
      }
    }

    if (!fetchedOk || !csvText) {
      return res.status(400).json({
        error: "गूगल शीट से कनेक्ट नहीं हो सका। कृपया सुनिश्चित करें कि गूगल शीट की शेयर सेटिंग्स में 'Anyone with link can view' (कोई भी व्यक्ति जिसके पास लिंक है वो देख सकता है) चुना गया है।"
      });
    }

    const workbook = XLSX.read(csvText, { type: 'string' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const rawJsonRows: any[] = XLSX.utils.sheet_to_json(worksheet);

    if (!rawJsonRows || rawJsonRows.length === 0) {
      return res.status(400).json({ error: "गूगल शीट खाली मिली या पंक्तियाँ पढ़ी नहीं जा सकीं।" });
    }

    return processParsedRows(rawJsonRows, sheetType, action, res);
  } catch (err: any) {
    console.error("Error in /api/pull-sheet:", err);
    return res.status(500).json({ error: "शीट प्रोसेस करने में त्रुटि: " + (err.message || String(err)) });
  }
});

// Bulk upload questions (JSON array)
app.post('/api/questions/bulk', (req, res) => {
  const db = loadDatabase();
  const questionsArray = req.body;
  if (!Array.isArray(questionsArray)) {
    return res.status(400).json({ error: "Request body must be an array of questions" });
  }

  db.questions = db.questions || [];
  
  const processedQuestions = questionsArray.map((q, idx) => {
    return {
      id: q.id || "q-bulk-" + Date.now() + "-" + idx + "-" + Math.random().toString(36).substr(2, 4),
      text_hi: q.text_hi || q.question_hi || q.text || "",
      text_en: q.text_en || q.question_en || "",
      options_hi: Array.isArray(q.options_hi) ? q.options_hi : (q.options ? q.options : ["A", "B", "C", "D", "E"]),
      options_en: Array.isArray(q.options_en) ? q.options_en : [],
      correctAnswer: typeof q.correctAnswer === 'number' ? q.correctAnswer : (parseInt(q.correct_answer) || 0),
      subject: q.subject || "General Studies",
      topic: q.topic || "Miscellaneous",
      exam: q.exam || "",
      year: q.year ? parseInt(q.year) : undefined,
      explanation_hi: q.explanation_hi || q.explanation || "",
      explanation_en: q.explanation_en || ""
    };
  });

  db.questions.push(...processedQuestions);

  // Auto-generate a quiz matching these newly added questions if they are part of a specific exam or subject
  // Group by exam to make it convenient
  const exams = [...new Set(processedQuestions.map(q => q.exam).filter(Boolean))];
  const subjects = [...new Set(processedQuestions.map(q => q.subject).filter(Boolean))];

  db.quizzes = db.quizzes || [];

  exams.forEach(examName => {
    const examQuestions = processedQuestions.filter(q => q.exam === examName);
    if (examQuestions.length > 0) {
      db.quizzes.push({
        id: "quiz-auto-exam-" + Date.now() + "-" + Math.random().toString(36).substr(2, 4),
        title: `${examName} Practice Quiz`,
        description: `Auto-generated practice quiz containing ${examQuestions.length} questions from ${examName}.`,
        type: "pyq",
        exam: examName,
        durationMinutes: Math.max(5, Math.ceil(examQuestions.length * 1.5)),
        questionIds: examQuestions.map(q => q.id)
      });
    }
  });

  // If no exam, but we have subjects, create subject quizzes
  if (exams.length === 0) {
    subjects.forEach(subjectName => {
      const subQuestions = processedQuestions.filter(q => q.subject === subjectName);
      if (subQuestions.length >= 2) {
        db.quizzes.push({
          id: "quiz-auto-sub-" + Date.now() + "-" + Math.random().toString(36).substr(2, 4),
          title: `${subjectName} practice set`,
          description: `Practice quiz with ${subQuestions.length} questions of ${subjectName}.`,
          type: "subject",
          subject: subjectName,
          durationMinutes: Math.max(5, Math.ceil(subQuestions.length * 1.5)),
          questionIds: subQuestions.map(q => q.id)
        });
      }
    });
  }

  saveDatabase(db);
  res.status(201).json({ 
    message: `Successfully imported ${processedQuestions.length} questions!`, 
    count: processedQuestions.length 
  });
});

// Get quizzes
app.get('/api/quizzes', (req, res) => {
  const db = loadDatabase();
  res.json(db.quizzes || []);
});

// Create quiz
app.post('/api/quizzes', (req, res) => {
  const db = loadDatabase();
  const newQuiz = req.body;
  if (!newQuiz.id) {
    newQuiz.id = "quiz-" + Date.now() + "-" + Math.random().toString(36).substr(2, 5);
  }
  db.quizzes = db.quizzes || [];
  db.quizzes.push(newQuiz);
  saveDatabase(db);
  res.status(201).json(newQuiz);
});

// Get attempts
app.get('/api/attempts', (req, res) => {
  const db = loadDatabase();
  res.json(db.attempts || []);
});

// Create attempt (Submit quiz results)
app.post('/api/attempts', (req, res) => {
  const db = loadDatabase();
  const newAttempt = req.body;
  if (!newAttempt.id) {
    newAttempt.id = "att-" + Date.now() + "-" + Math.random().toString(36).substr(2, 5);
  }
  newAttempt.timestamp = newAttempt.timestamp || new Date().toISOString();
  db.attempts = db.attempts || [];
  db.attempts.push(newAttempt);
  saveDatabase(db);
  res.status(201).json(newAttempt);
});

// Get User Profile
app.get('/api/user', (req, res) => {
  const db = loadDatabase();
  res.json(db.user || { id: "guest-user", name: "Aspirant", email: "aspirant@testarena.co.in", role: "aspirant" });
});

// Update User Profile
app.post('/api/user', (req, res) => {
  const db = loadDatabase();
  db.user = { ...db.user, ...req.body };
  saveDatabase(db);
  res.json(db.user);
});

// Get detailed analysis stats
app.get('/api/stats', (req, res) => {
  const db = loadDatabase();
  const attempts = db.attempts || [];
  const questions = db.questions || [];

  // Index questions for quick lookup
  const questionsMap = new Map();
  questions.forEach(q => questionsMap.set(q.id, q));

  // 1. Basic Stats
  const totalQuizzesAttempted = attempts.length;
  let totalQuestionsAnswered = 0;
  let totalCorrect = 0;
  let totalWrong = 0;
  let totalSkipped = 0;

  // Track subject accuracy & wrong responses
  const subjectMap: Record<string, { total: number; correct: number; wrong: number; topics: Record<string, { total: number; correct: number; wrong: number }> }> = {};
  
  // Track specific mistake details
  const mistakes: any[] = [];

  attempts.forEach(att => {
    totalQuestionsAnswered += att.totalQuestions;
    totalCorrect += att.correctCount;
    totalWrong += att.wrongCount;
    totalSkipped += att.skippedCount;

    // Process individual answers
    Object.entries(att.answers || {}).forEach(([qId, ansVal]) => {
      const ansIdx = Number(ansVal);
      const q = questionsMap.get(qId);
      if (!q) return;

      const sub = q.subject || "General Studies";
      const top = q.topic || "Miscellaneous";

      if (!subjectMap[sub]) {
        subjectMap[sub] = { total: 0, correct: 0, wrong: 0, topics: {} };
      }
      if (!subjectMap[sub].topics[top]) {
        subjectMap[sub].topics[top] = { total: 0, correct: 0, wrong: 0 };
      }

      const isCorrect = ansIdx === q.correctAnswer;
      const isSkipped = ansIdx === -1;

      if (!isSkipped) {
        subjectMap[sub].total += 1;
        subjectMap[sub].topics[top].total += 1;

        if (isCorrect) {
          subjectMap[sub].correct += 1;
          subjectMap[sub].topics[top].correct += 1;
        } else {
          subjectMap[sub].wrong += 1;
          subjectMap[sub].topics[top].wrong += 1;

          // Record as mistake
          mistakes.push({
            questionId: q.id,
            questionText: q.text_hi,
            questionTextEn: q.text_en,
            selectedOption: ansIdx >= 0 ? (q.options_hi[ansIdx] + (q.options_en?.[ansIdx] ? ` (${q.options_en[ansIdx]})` : '')) : "Not Answered",
            correctOption: q.options_hi[q.correctAnswer] + (q.options_en?.[q.correctAnswer] ? ` (${q.options_en[q.correctAnswer]})` : ''),
            explanation: q.explanation_hi,
            explanationEn: q.explanation_en,
            subject: sub,
            topic: top,
            timestamp: att.timestamp
          });
        }
      }
    });
  });

  // Calculate subject-wise accuracy and collect weak topics (accuracy < 60%)
  const subjectStats: any[] = [];
  const topicStats: any[] = [];

  Object.entries(subjectMap).forEach(([subName, sData]) => {
    const accuracy = sData.total > 0 ? Math.round((sData.correct / sData.total) * 100) : 100;
    const weakTopics: string[] = [];

    Object.entries(sData.topics).forEach(([topName, tData]) => {
      const tAccuracy = tData.total > 0 ? Math.round((tData.correct / tData.total) * 100) : 100;
      
      topicStats.push({
        topic: topName,
        subject: subName,
        totalSolved: tData.total,
        correctCount: tData.correct,
        wrongCount: tData.wrong,
        accuracy: tAccuracy
      });

      // Topic is weak if accuracy is below 65% and solved at least once
      if (tAccuracy < 65 && tData.total > 0) {
        weakTopics.push(topName);
      }
    });

    subjectStats.push({
      subject: subName,
      totalSolved: sData.total,
      correctCount: sData.correct,
      wrongCount: sData.wrong,
      accuracy,
      weakTopics
    });
  });

  res.json({
    totalQuizzesAttempted,
    totalQuestionsAnswered,
    totalCorrect,
    totalWrong,
    totalSkipped,
    overallAccuracy: totalQuestionsAnswered > 0 ? Math.round((totalCorrect / (totalCorrect + totalWrong)) * 100) : 0,
    subjectStats,
    topicStats,
    mistakes: mistakes.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()) // sorted by recent
  });
});

// Database reset endpoint
app.post('/api/db/reset', (req, res) => {
  const db = loadDatabase();
  db.attempts = []; // Reset all progress/attempts stats, keeping custom questions and settings intact
  saveDatabase(db);
  res.json({ message: "Database reset to initial seed data successfully!", db });
});

// Feedback / Enquiry Endpoint
app.post('/api/feedback', (req, res) => {
  const db = loadDatabase();
  const { name, email, phone, queryType, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ error: "Name, Email, and Message are required." });
  }

  const newFeedback = {
    id: "fb-" + Date.now() + "-" + Math.random().toString(36).substr(2, 5),
    name,
    email,
    phone: phone || '',
    queryType: queryType || 'General Inquiry',
    message,
    timestamp: new Date().toISOString()
  };

  db.feedbacks = db.feedbacks || [];
  db.feedbacks.push(newFeedback);
  saveDatabase(db);

  console.log(`[Feedback/Enquiry] Target: testarena2026@gmail.com`, newFeedback);

  res.json({ 
    message: "Feedback logged successfully.",
    feedback: newFeedback
  });
});

// Current Affairs Endpoints
app.get('/api/current-affairs', (req, res) => {
  const db = loadDatabase();
  res.json(db.currentAffairs || []);
});

app.post('/api/current-affairs', (req, res) => {
  const db = loadDatabase();
  const newItem = req.body;
  if (!newItem.id) {
    newItem.id = "ca-" + Date.now() + "-" + Math.random().toString(36).substr(2, 5);
  }
  newItem.createdAt = newItem.createdAt || new Date().toISOString();
  db.currentAffairs = db.currentAffairs || [];
  
  // check if item already exists to update it, else push
  const existingIdx = db.currentAffairs.findIndex((item) => item.id === newItem.id);
  if (existingIdx > -1) {
    db.currentAffairs[existingIdx] = newItem;
  } else {
    db.currentAffairs.push(newItem);
  }
  
  saveDatabase(db);
  res.status(201).json(newItem);
});

app.delete('/api/current-affairs/:id', (req, res) => {
  const db = loadDatabase();
  const { id } = req.params;
  db.currentAffairs = db.currentAffairs || [];
  db.currentAffairs = db.currentAffairs.filter((item) => item.id !== id);
  saveDatabase(db);
  res.json({ message: "Current affairs item deleted successfully" });
});

// Replace all current affairs (full sync from Google Sheet)
app.post('/api/current-affairs/replace', (req, res) => {
  const db = loadDatabase();
  const newCA = req.body;
  if (!Array.isArray(newCA)) {
    return res.status(400).json({ error: "Request body must be an array of current affairs items" });
  }
  db.currentAffairs = newCA;
  saveDatabase(db);
  res.json({ message: "Current affairs replaced successfully", count: newCA.length });
});

// Exam Info Endpoints (About Exam & Syllabus Section)
app.get('/api/exam-info', (req, res) => {
  const db = loadDatabase();
  res.json(db.examInfo || []);
});

app.post('/api/exam-info', (req, res) => {
  const db = loadDatabase();
  const newItem = req.body;
  if (!newItem.id) {
    newItem.id = "exam-" + Date.now() + "-" + Math.random().toString(36).substr(2, 5);
  }
  newItem.updatedAt = new Date().toISOString();
  db.examInfo = db.examInfo || [];
  
  const existingIdx = db.examInfo.findIndex((item: any) => item.id === newItem.id);
  if (existingIdx > -1) {
    db.examInfo[existingIdx] = newItem;
  } else {
    db.examInfo.push(newItem);
  }
  
  saveDatabase(db);
  res.status(201).json(newItem);
});

app.put('/api/exam-info/:id', (req, res) => {
  const db = loadDatabase();
  const { id } = req.params;
  const updatedItem = req.body;
  updatedItem.id = id;
  updatedItem.updatedAt = new Date().toISOString();

  db.examInfo = db.examInfo || [];
  const existingIdx = db.examInfo.findIndex((item: any) => item.id === id);
  if (existingIdx > -1) {
    db.examInfo[existingIdx] = updatedItem;
  } else {
    db.examInfo.push(updatedItem);
  }

  saveDatabase(db);
  res.json(updatedItem);
});

app.delete('/api/exam-info/:id', (req, res) => {
  const db = loadDatabase();
  const { id } = req.params;
  db.examInfo = db.examInfo || [];
  db.examInfo = db.examInfo.filter((item: any) => item.id !== id);
  saveDatabase(db);
  res.json({ message: "Exam info deleted successfully", id });
});

app.put('/api/exam-info-reorder', (req, res) => {
  const db = loadDatabase();
  const newExamsList = req.body;
  if (!Array.isArray(newExamsList)) {
    return res.status(400).json({ error: "Request body must be an array of exams" });
  }
  db.examInfo = newExamsList;
  saveDatabase(db);
  res.json({ message: "Exam sequence reordered successfully", count: newExamsList.length });
});

// SEO Route: robots.txt
app.get('/robots.txt', (req, res) => {
  const robotsTxt = `User-agent: *
Allow: /
Disallow: /api/
Disallow: /?tab=admin

# Google & Bing Crawler Directive
User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /

Sitemap: https://testarena.co.in/sitemap.xml
`;
  res.type('text/plain');
  res.send(robotsTxt);
});

// SEO Route: sitemap.xml
app.get('/sitemap.xml', (req, res) => {
  const baseUrl = 'https://testarena.co.in';
  const today = new Date().toISOString().split('T')[0];

  const db = loadDatabase();
  const subjects = Array.from(new Set(db.questions.map(q => q.subject))).filter(Boolean);

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/?tab=subjects</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${baseUrl}/?tab=pyqs</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${baseUrl}/?tab=current-affairs</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.95</priority>
  </url>
  <url>
    <loc>${baseUrl}/?tab=dashboard</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>${baseUrl}/?tab=about</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>${baseUrl}/?tab=contact</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>${baseUrl}/?tab=privacy</loc>
    <lastmod>${today}</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>
  <url>
    <loc>${baseUrl}/?tab=terms</loc>
    <lastmod>${today}</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>
  <url>
    <loc>${baseUrl}/?tab=disclaimer</loc>
    <lastmod>${today}</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>`;

  subjects.forEach(subj => {
    const encodedSubj = encodeURIComponent(String(subj));
    xml += `
  <url>
    <loc>${baseUrl}/?tab=subjects&amp;subject=${encodedSubj}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
  });

  xml += `
</urlset>`;

  res.type('application/xml');
  res.send(xml);
});

// Setup Vite & Static Assets serving
async function startServer() {
  const distPath = path.join(process.cwd(), 'dist');
  const isProduction = process.env.NODE_ENV === "production";

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(distPath, {
      maxAge: '1d',
      etag: true
    }));
    // SPA fallback
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] Running in ${isProduction ? 'production' : 'development'} mode on http://0.0.0.0:${PORT}`);
  });
}

startServer();
