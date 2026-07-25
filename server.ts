import express from 'express';
import path from 'path';
import fs from 'fs';
import * as XLSX from 'xlsx';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Ensure data directory exists
const DATA_DIR = path.join(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_FILE = path.join(DATA_DIR, 'db.json');

// Initial seed data
const initialQuestions = [
  {
    id: "q1",
    text_hi: "छत्तीसगढ़ के किस जिले में 'तातापानी' गरम पानी का चश्मा स्थित है?",
    text_en: "In which district of Chhattisgarh is 'Tatapani' hot water spring located?",
    options_hi: ["सरगुजा", "बलरामपुर", "सूरजपुर", "जशपुर", "कांकेर"],
    options_en: ["Surguja", "Balrampur", "Surajpur", "Jashpur", "Kanker"],
    correctAnswer: 1, // Balrampur
    subject: "Chhattisgarh General Knowledge",
    topic: "CG Geography & Rivers",
    exam: "CGPSC Prelims",
    year: 2022,
    explanation_hi: "तातापानी बलरामपुर जिले में स्थित है। यह अपने गर्म पानी के चश्मे (Hydrogen sulfide rich hot spring) के लिए प्रसिद्ध है, जिसमें वर्ष भर गर्म पानी बहता रहता है।",
    explanation_en: "Tatapani is located in Balrampur district. It is famous for its natural hot springs (rich in Hydrogen sulfide), flowing continuously throughout the year."
  },
  {
    id: "q2",
    text_hi: "चक्रधर समारोह छत्तीसगढ़ के किस शहर में आयोजित किया जाता है?",
    text_en: "Chakradhar Samaroh is organized in which city of Chhattisgarh?",
    options_hi: ["बिलासपुर", "रायपुर", "रायगढ़", "खैरागढ़", "जगदलपुर"],
    options_en: ["Bilaspur", "Raipur", "Raigarh", "Khairagarh", "Jagdalpur"],
    correctAnswer: 2, // Raigarh
    subject: "Chhattisgarh General Knowledge",
    topic: "CG Tribes & Culture",
    exam: "CGPSC Prelims",
    year: 2023,
    explanation_hi: "रायगढ़ में गणेश चतुर्थी के अवसर पर हर साल चक्रधर समारोह आयोजित किया जाता है। यह संगीत सम्राट राजा चक्रधर सिंह की स्मृति में मनाया जाता है।",
    explanation_en: "Chakradhar Samaroh is organized annually in Raigarh on the occasion of Ganesh Chaturthi. It is held in memory of the great music maestro King Chakradhar Singh."
  },
  {
    id: "q3",
    text_hi: "छत्तीसगढ़ की सबसे बड़ी जनजाति कौन सी है?",
    text_en: "Which is the largest tribe of Chhattisgarh?",
    options_hi: ["उरांव", "गोंड", "बैगा", "हलबा", "कवर"],
    options_en: ["Oraon", "Gond", "Baiga", "Halba", "Kawar"],
    correctAnswer: 1, // Gond
    subject: "Chhattisgarh General Knowledge",
    topic: "CG Tribes & Culture",
    exam: "CGPSC Prelims",
    year: 2021,
    explanation_hi: "गोंड छत्तीसगढ़ की सबसे बड़ी जनजाति है। छत्तीसगढ़ की कुल जनजातीय जनसंख्या में इनका प्रतिशत सर्वाधिक है।",
    explanation_en: "Gond is the largest tribe in Chhattisgarh. They constitute the highest percentage among the total tribal population of the state."
  },
  {
    id: "q4",
    text_hi: "छत्तीसगढ़ राज्य का गठन किस वर्ष हुआ था?",
    text_en: "In which year was the state of Chhattisgarh formed?",
    options_hi: ["1998", "2000", "2001", "2002", "1995"],
    options_en: ["1998", "2000", "2001", "2002", "1995"],
    correctAnswer: 1, // 2000
    subject: "Chhattisgarh General Knowledge",
    topic: "CG History & Dynasty",
    exam: "CGPSC Prelims",
    year: 2018,
    explanation_hi: "छत्तीसगढ़ राज्य का गठन 1 नवंबर 2000 को मध्य प्रदेश से अलग होकर भारत के 26वें राज्य के रूप में हुआ था।",
    explanation_en: "The state of Chhattisgarh was carved out of Madhya Pradesh on 1 November 2000, becoming the 26th state of India."
  },
  {
    id: "q5",
    text_hi: "भारतीय संविधान के किस अनुच्छेद में 'समानता का अधिकार' वर्णित है?",
    text_en: "Which Article of the Indian Constitution describes the 'Right to Equality'?",
    options_hi: ["अनुच्छेद 12", "अनुच्छेद 14", "अनुच्छेद 19", "अनुच्छेद 21", "अनुच्छेद 32"],
    options_en: ["Article 12", "Article 14", "Article 19", "Article 21", "Article 32"],
    correctAnswer: 1, // Article 14
    subject: "Indian Polity & Constitution",
    topic: "Fundamental Rights & Duties",
    exam: "CGPSC Prelims",
    year: 2020,
    explanation_hi: "भारतीय संविधान के अनुच्छेद 14 से 18 तक समानता का अधिकार दिया गया है। अनुच्छेद 14 कानून के समक्ष समानता सुनिश्चित करता है।",
    explanation_en: "The Right to Equality is guaranteed under Articles 14 to 18 of the Indian Constitution. Article 14 guarantees equality before the law."
  },
  {
    id: "q6",
    text_hi: "छत्तीसगढ़ में 'पंचायती राज अधिनियम' कब लागू हुआ था?",
    text_en: "When was the 'Panchayati Raj Act' implemented in Chhattisgarh?",
    options_hi: ["1993", "1994", "2000", "2001", "1995"],
    options_en: ["1993", "1994", "2000", "2001", "1995"],
    correctAnswer: 1, // 1994
    subject: "Chhattisgarh General Knowledge",
    topic: "Panchayati Raj in CG",
    exam: "CGPSC Prelims",
    year: 2019,
    explanation_hi: "छत्तीसगढ़ में मध्य प्रदेश पंचायती राज अधिनियम 1993 को ही अनुकूलन आदेश 2001 के तहत अपनाया गया है। मूल अधिनियम मध्य प्रदेश में 1994 में लागू हुआ था।",
    explanation_en: "In Chhattisgarh, the Madhya Pradesh Panchayati Raj Act 1993 was adopted under the adaptation order 2001. The original act came into effect in 1994."
  },
  {
    id: "q7",
    text_hi: "छत्तीसगढ़ के प्रथम शहीद वीर नारायण सिंह किस जमींदारी के थे?",
    text_en: "To which zamindari did the first martyr of Chhattisgarh, Veer Narayan Singh, belong?",
    options_hi: ["सोनाखान", "धमतरी", "सक्ती", "सारंगढ़", "गुंडरदेही"],
    options_en: ["Sonakhan", "Dhamtari", "Sakti", "Sarangarh", "Gunderdehi"],
    correctAnswer: 0, // Sonakhan
    subject: "Chhattisgarh General Knowledge",
    topic: "CG History & Dynasty",
    exam: "CGPSC Prelims",
    year: 2022,
    explanation_hi: "वीर नारायण सिंह सोनाखान के जमींदार थे। उन्होंने 1857 के स्वतंत्रता संग्राम में छत्तीसगढ़ का नेतृत्व किया और उन्हें छत्तीसगढ़ का प्रथम शहीद माना जाता है। उन्हें 10 दिसंबर 1857 को रायपुर के जयस्तंभ चौक पर फांसी दी गई थी।",
    explanation_en: "Veer Narayan Singh was the landlord of Sonakhan. He led the 1857 freedom struggle in Chhattisgarh and is considered the state's first martyr. He was executed at Jaistambh Chowk, Raipur, on 10 December 1857."
  },
  {
    id: "q8",
    text_hi: "सिंधु घाटी सभ्यता का प्रसिद्ध बंदरगाह 'लोथल' कहाँ स्थित है?",
    text_en: "Where is 'Lothal', the famous port of Indus Valley Civilization, located?",
    options_hi: ["राजस्थान", "पंजाब", "गुजरात", "हरियाणा", "उत्तर प्रदेश"],
    options_en: ["Rajasthan", "Punjab", "Gujarat", "Haryana", "Uttar Pradesh"],
    correctAnswer: 2, // Gujarat
    subject: "Indian History",
    topic: "Indus Valley Civilization",
    exam: "CGPSC Prelims",
    year: 2021,
    explanation_hi: "लोथल गुजरात के भाल क्षेत्र में स्थित सिंधु घाटी सभ्यता का एकमात्र प्राचीन बंदरगाह है। इसकी खोज 1954 में एस. आर. राव ने की थी।",
    explanation_en: "Lothal is the ancient port city of the Indus Valley Civilization, located in the Bhal region of Gujarat. It was discovered in 1954 by S. R. Rao."
  },
  {
    id: "q9",
    text_hi: "छत्तीसगढ़ राज्य की सीमा कितने राज्यों को स्पर्श करती है?",
    text_en: "The boundary of Chhattisgarh state touches how many states?",
    options_hi: ["5", "6", "7", "8", "9"],
    options_en: ["5", "6", "7", "8", "9"],
    correctAnswer: 2, // 7 states
    subject: "Chhattisgarh General Knowledge",
    topic: "CG Geography & Rivers",
    exam: "CGPSC Prelims",
    year: 2023,
    explanation_hi: "छत्तीसगढ़ की सीमा भारत के 7 राज्यों को स्पर्श करती है: उत्तर प्रदेश, झारखंड, ओडिशा, आंध्र प्रदेश, तेलंगाना, महाराष्ट्र और मध्य प्रदेश।",
    explanation_en: "Chhattisgarh borders 7 states of India: Uttar Pradesh, Jharkhand, Odisha, Andhra Pradesh, Telangana, Maharashtra, and Madhya Pradesh."
  },
  {
    id: "q10",
    text_hi: "भारतीय संविधान का 'मैग्ना कार्टा' किस भाग को कहा जाता है?",
    text_en: "Which part of the Indian Constitution is called the 'Magna Carta'?",
    options_hi: ["भाग II", "भाग III", "भाग IV", "भाग IVA", "भाग V"],
    options_en: ["Part II", "Part III", "Part IV", "Part IVA", "Part V"],
    correctAnswer: 1, // Part III
    subject: "Indian Polity & Constitution",
    topic: "Fundamental Rights & Duties",
    exam: "CGPSC Prelims",
    year: 2019,
    explanation_hi: "संविधान के भाग III (अनुच्छेद 12 से 35) को भारत का मैग्ना कार्टा कहा जाता है, जिसमें मौलिक अधिकारों का उल्लेख है।",
    explanation_en: "Part III of the Constitution (Articles 12 to 35) is termed the Magna Carta of India. It contains the Fundamental Rights."
  }
];

const initialQuizzes = [
  {
    id: "quiz-pyq-cggk",
    title: "छत्तीसगढ़ सामान्य ज्ञान (CG GK) - PYQ",
    description: "सीजीपीएससी प्रारंभिक परीक्षाओं में पूछे गए छत्तीसगढ़ सामान्य ज्ञान के महत्वपूर्ण प्रश्न।",
    type: "pyq",
    subject: "Chhattisgarh General Knowledge",
    durationMinutes: 10,
    questionIds: ["q1", "q2", "q3", "q4", "q6", "q7", "q9"]
  },
  {
    id: "quiz-pyq-full-mock",
    title: "CGPSC प्रीलिम्स - मिनी मॉक टेस्ट (Bilingual)",
    description: "विगत वर्षों के इतिहास, भूगोल, राजव्यवस्था और छत्तीसगढ़ जीके के प्रश्नों का उत्कृष्ट संकलन।",
    type: "pyq",
    durationMinutes: 15,
    questionIds: ["q1", "q2", "q3", "q4", "q5", "q6", "q7", "q8", "q9", "q10"]
  }
];

// Seed initial attempts so Sourav Patel starts with a high-fidelity diagnostic dashboard
const initialAttempts = [
  {
    id: "att-1",
    quizId: "quiz-pyq-cggk",
    quizTitle: "छत्तीसगढ़ सामान्य ज्ञान (CG GK) - PYQ",
    quizType: "pyq",
    userId: "user-sourav",
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    score: 8.68, // 5 correct (+10), 2 incorrect (-1.32)
    totalQuestions: 7,
    correctCount: 5,
    wrongCount: 2,
    skippedCount: 0,
    answers: {
      "q1": 1, // correct
      "q2": 1, // wrong (selected Raipur instead of Raigarh)
      "q3": 1, // correct
      "q4": 1, // correct
      "q6": 2, // wrong (selected 2000 instead of 1994)
      "q7": 0, // correct
      "q9": 2  // correct
    },
    durationSeconds: 240
  }
];

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
function loadDatabase() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf8');
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
      if (dirty) {
        saveDatabase(db);
      }
      return db;
    }
  } catch (error) {
    console.error("Error reading database file, using defaults:", error);
  }

  // Seeding default database
  const defaultDb = {
    questions: initialQuestions,
    quizzes: initialQuizzes,
    attempts: initialAttempts,
    currentAffairs: initialCurrentAffairs,
    examInfo: initialExamInfo,
    user: {
      id: "user-sourav",
      name: "Sourav Patel",
      email: "souravpatel13@gmail.com",
      role: "admin" // Give admin privileges by default so user can test both sides!
    }
  };
  saveDatabase(defaultDb);
  return defaultDb;
}

function saveDatabase(data: any) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
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

// Delete single question
app.delete('/api/questions/:id', (req, res) => {
  const db = loadDatabase();
  const qId = req.params.id;
  db.questions = db.questions || [];
  
  const initialLength = db.questions.length;
  db.questions = db.questions.filter((q: any) => q.id !== qId);
  
  if (db.questions.length === initialLength) {
    return res.status(404).json({ error: "Question not found" });
  }
  
  saveDatabase(db);
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
  res.json(db.settings || { spreadsheetId: "", spreadsheetIdPyq: "", spreadsheetIdSubject: "", spreadsheetIdCurrentAffairs: "" });
});

// Update settings
app.post('/api/settings', (req, res) => {
  const db = loadDatabase();
  db.settings = { ...db.settings, ...req.body };
  saveDatabase(db);
  res.json(db.settings);
});

function parseCorrectAnswerServer(rawVal: any, options: string[]): number {
  if (rawVal === undefined || rawVal === null) return 0;
  const valStr = String(rawVal).trim();
  if (valStr === '') return 0;

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
    const textHi = r['Question (HI)'] || r['Question'] || r['Question (Hindi)'] || r['question_hi'] || r['text_hi'] || r['प्रश्न'] || r['प्रश्न (हिन्दी)'] || '';
    const textEn = r['Question (EN)'] || r['Question (English)'] || r['question_en'] || r['text_en'] || r['प्रश्न (अंग्रेजी)'] || '';

    const optA = r['Option A'] || r['Option A (HI)'] || r['Option 1'] || r['option_a'] || r['विकल्प A'] || r['विकल्प 1'] || '';
    const optB = r['Option B'] || r['Option B (HI)'] || r['Option 2'] || r['option_b'] || r['विकल्प B'] || r['विकल्प 2'] || '';
    const optC = r['Option C'] || r['Option C (HI)'] || r['Option 3'] || r['option_c'] || r['विकल्प C'] || r['विकल्प 3'] || '';
    const optD = r['Option D'] || r['Option D (HI)'] || r['Option 4'] || r['option_d'] || r['विकल्प D'] || r['विकल्प 4'] || '';

    const opts = [optA, optB, optC, optD].map(o => String(o || '').trim());
    const options_hi = opts.filter(Boolean).length >= 2 ? opts : ['विकल्प A', 'विकल्प B', 'विकल्प C', 'विकल्प D'];

    const ansRaw = r['Correct Answer'] || r['Answer'] || r['correct_answer'] || r['उत्तर'] || r['सही उत्तर'] || '0';
    const correctAnswer = parseCorrectAnswerServer(ansRaw, options_hi);

    let defaultSub = 'Chhattisgarh General Knowledge';
    if (sheetType === 'subject') defaultSub = 'Chhattisgarh General Knowledge';

    const subject = r['Subject'] || r['subject'] || r['विषय'] || defaultSub;
    const topic = r['Topic'] || r['topic'] || r['विषय-वस्तु'] || r['टॉपिक'] || 'सामान्य परिचय';
    const exam = r['Exam'] || r['exam'] || r['परीक्षा'] || (sheetType === 'pyq' ? 'CGPSC Prelims' : '');
    const yearRaw = r['Year'] || r['year'] || r['वर्ष'];
    const year = yearRaw ? parseInt(String(yearRaw)) : undefined;

    const explanation_hi = r['Explanation (HI)'] || r['Explanation'] || r['explanation_hi'] || r['व्याख्या'] || r['व्याख्या (हिन्दी)'] || '';
    const explanation_en = r['Explanation (EN)'] || r['explanation_en'] || r['व्याख्या (अंग्रेजी)'] || '';

    return {
      id: `q-sheet-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 4)}`,
      text_hi: String(textHi).trim(),
      text_en: String(textEn).trim(),
      options_hi,
      options_en: [],
      correctAnswer,
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
  res.json(db.user || { id: "user-sourav", name: "Sourav Patel", email: "souravpatel13@gmail.com", role: "admin" });
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
  const hasDist = fs.existsSync(path.join(distPath, 'index.html'));
  const isProduction = process.env.NODE_ENV === "production" || hasDist;

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(distPath));
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
