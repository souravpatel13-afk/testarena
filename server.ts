import express from 'express';
import path from 'path';
import fs from 'fs';
import * as XLSX from 'xlsx';
import compression from 'compression';
import { createServer as createViteServer } from 'vite';

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

const initialDailyPractice = [
  {
    id: "dp-2026-07-29",
    date: "2026-07-29",
    title: "डेली प्रैक्टिस सेट - 29 जुलाई 2026 (CGPSC/व्यापमं स्पेशल 20 प्रश्न)",
    description: "छत्तीसगढ़ राज्य सामान्य ज्ञान, समसामयिकी (Current Affairs), भारतीय संविधान व भूगोल के 20 अति-महत्वपूर्ण प्रश्न।",
    subject: "छत्तीसगढ़ सामान्य ज्ञान एवं समसामयिकी",
    targetExam: "CGPSC Prelims / CG Vyapam / CG Police",
    durationMinutes: 20,
    questions: [
      {
        id: "dpq-1",
        questionHtml: "<b>प्रश्न 1:</b> छत्तीसगढ़ में <i>'भारत छोड़ो आंदोलन'</i> (1942) के दौरान रायपुर में <b>'डायनामाइट कांड'</b> के प्रमुख योजनाकार कौन थे?",
        optionsHtml: ["परसराम सोनी", "ईश्वरी चरण शुक्ल", "ठाकुर प्यारेलाल सिंह", "बिलख नारायण अग्रवाल"],
        correctAnswer: 1,
        explanationHtml: "<b>विस्तृत समाधान:</b><br/>रायपुर डायनामाइट कांड 1942 में हुआ था। इसके मुख्य योजनाकार <b>ईश्वरी चरण शुक्ल</b> थे। इसमें जय नारायण पांडे, बिलख नारायण अग्रवाल, परसराम सोनी एवं अन्य क्रांतिकारी भी शामिल थे। इसका उद्देश्य रायपुर जेल की दीवार तोड़कर क्रांतिकारियों को छुड़ाना था।"
      },
      {
        id: "dpq-2",
        questionHtml: "<b>प्रश्न 2:</b> छत्तीसगढ़ राज्य के किस जिले में प्रसिद्ध <i>'तीरथगढ़ जलप्रपात'</i> स्थित है?",
        optionsHtml: ["कांकेर", "बस्तर", "दंतेवाड़ा", "सुकमा"],
        correctAnswer: 1,
        explanationHtml: "<b>विस्तृत समाधान:</b><br/>तीरथगढ़ जलप्रपात छत्तीसगढ़ के <b>बस्तर जिले</b> में कांगेर घाटी राष्ट्रीय उद्यान के पास <b>मुंगाबहार नदी</b> पर स्थित है। यह लगभग 300 फीट ऊंचा एक आकर्षक सीढ़ीदार प्रपात है।"
      },
      {
        id: "dpq-3",
        questionHtml: "<b>प्रश्न 3:</b> छत्तीसगढ़ की निम्नलिखित जनजातियों और उनके मुख्य लोक नृत्य का सही मिलान करें:<br/><table class='w-full border text-xs my-2 bg-emerald-50/50'><tr><th class='border p-1 bg-emerald-100/80'>जनजाति</th><th class='border p-1 bg-emerald-100/80'>लोक नृत्य</th></tr><tr><td class='border p-1'>1. माड़िया</td><td class='border p-1'>A. गौर नृत्य</td></tr><tr><td class='border p-1'>2. उरांव</td><td class='border p-1'>B. सरहुल नृत्य</td></tr><tr><td class='border p-1'>3. बैगा</td><td class='border p-1'>C. बिलमा / परधोनी</td></tr></table>",
        optionsHtml: ["1-A, 2-B, 3-C", "1-B, 2-A, 3-C", "1-C, 2-B, 3-A", "1-A, 2-C, 3-B"],
        correctAnswer: 0,
        explanationHtml: "<b>सही सुमेलित:</b><br/>• माड़िया जनजाति: <b>गौर (Bison Horn) नृत्य</b><br/>• उरांव जनजाति: <b>सरहुल नृत्य</b> (साल वृक्ष में फूल आने पर)<br/>• बैगा जनजाति: <b>बिलमा एवं परधोनी नृत्य</b>"
      },
      {
        id: "dpq-4",
        questionHtml: "<b>प्रश्न 4:</b> हाल ही में घोषित छत्तीसगढ़ की नई औद्योगिक नीति के तहत किस क्षेत्र को <i>'विशेष प्राथमिकता'</i> दी गई है?",
        optionsHtml: ["रायपुर-बिलासपुर औद्योगिक गलियारा एवं एग्रो प्रोसेसिंग", "केवल लौह अयस्क निर्यात", "कोयला खनन", "हस्तशिल्प केवल"],
        correctAnswer: 0,
        explanationHtml: "<b>समाधान:</b> नई राज्य औद्योगिक नीति में खाद्य प्रसंस्करण (Agro Processing), इलेक्ट्रॉनिक्स तथा रायपुर-बिलासपुर औद्योगिक कॉरिडोर को विशेष प्रोत्साहन व सब्सिडी का प्रावधान किया गया है।"
      },
      {
        id: "dpq-5",
        questionHtml: "<b>प्रश्न 5:</b> कलचुरी राजवंश की रतनपुर शाखा के संस्थापक कौन थे?",
        optionsHtml: ["कलिंगराज", "कमलराज", "रत्नदेव प्रथम", "पृथ्वीदेव प्रथम"],
        correctAnswer: 2,
        explanationHtml: "<b>विस्तृत व्याख्या:</b> कलचुरी वंश के शासक <b>रत्नदेव प्रथम</b> ने लगभग 1050 ईस्वी में रतनपुर नगर की स्थापना की तथा अपनी राजधानी तुम्माण से रतनपुर स्थानांतरित की।"
      },
      {
        id: "dpq-6",
        questionHtml: "<b>प्रश्न 6:</b> छत्तीसगढ़ राज्य का सबसे ऊंचा भाग <b>'गौरलाटा'</b> चोटी (1225 मीटर) किस पाट प्रदेश में स्थित है?",
        optionsHtml: ["मैनपाट", "जसपुर पाट", "सामरी पाट", "जारंग पाट"],
        correctAnswer: 2,
        explanationHtml: "<b>व्याख्या:</b> छत्तीसगढ़ की सर्वोच्च पर्वत चोटी <b>गौरलाटा (1225 मीटर)</b> बलरामपुर जिले के <b>सामरी पाट</b> क्षेत्र में स्थित है।"
      },
      {
        id: "dpq-7",
        questionHtml: "<b>प्रश्न 7:</b> छत्तीसगढ़ में पंथी नृत्य मुख्य रूप से किस समुदाय द्वारा गुरु घासीदास जी के संदेशों के प्रचार हेतु किया जाता है?",
        optionsHtml: ["कंवर", "सतनामी समुदाय", "हल्बा", "गोंड"],
        correctAnswer: 1,
        explanationHtml: "<b>व्याख्या:</b> पंथी नृत्य <b>सतनामी समुदाय</b> का आध्यात्मिक लोक नृत्य है, जो गुरु घासीदास जी के सत्य एवं अहिंसा के उपदेशों पर आधारित होता है।"
      },
      {
        id: "dpq-8",
        questionHtml: "<b>प्रश्न 8:</b> भारतीय संविधान का कौन सा अनुच्छेद <b>'ग्राम पंचायतों के गठन'</b> का राज्य को निर्देश देता है?",
        optionsHtml: ["अनुच्छेद 39", "अनुच्छेद 40", "अनुच्छेद 44", "अनुच्छेद 50"],
        correctAnswer: 1,
        explanationHtml: "<b>व्याख्या:</b> संविधान के नीति निर्देशक तत्वों के तहत <b>अनुच्छेद 40</b> राज्यों को ग्राम पंचायतों के संगठन एवं स्वायत्त शासन की इकाइयाँ बनाने का निर्देश देता है।"
      },
      {
        id: "dpq-9",
        questionHtml: "<b>प्रश्न 9:</b> मणिकर्णिका घाट और कबीरचौरा का संबंध किस ऐतिहासिक शहर से है?",
        optionsHtml: ["प्रयागराज", "वाराणसी", "हरिद्वार", "अयोध्या"],
        correctAnswer: 1,
        explanationHtml: "<b>समाधान:</b> मणिकर्णिका घाट और कबीरचौरा प्रसिद्ध सांस्कृतिक व आध्यात्मिक नगर <b>वाराणसी (काशी)</b> में स्थित हैं।"
      },
      {
        id: "dpq-10",
        questionHtml: "<b>प्रश्न 10:</b> छत्तीसगढ़ की मुख्य नदी 'महानदी' का उद्गम स्थल कौन सा है?",
        optionsHtml: ["सिहावा पर्वत (धमतरी)", "मैनपाट (सरगुजा)", "मैकल श्रेणी (कबीरधाम)", "कोरिया पहाड़ी"],
        correctAnswer: 0,
        explanationHtml: "<b>व्याख्या:</b> महानदी का उद्गम धमतरी जिले के <b>सिहावा पर्वत (फरसिया गांव)</b> से होता है। इसकी कुल लंबाई 858 किमी है जिसमें से 286 किमी छत्तीसगढ़ में बहती है।"
      },
      {
        id: "dpq-11",
        questionHtml: "<b>प्रश्न 11:</b> भोरमदेव मंदिर का निर्माण किस राजवंश के शासनकाल में हुआ था?",
        optionsHtml: ["सोमवंश", "फणिनागवंश", "छिंदक नागवंश", "काकतीय वंश"],
        correctAnswer: 1,
        explanationHtml: "<b>व्याख्या:</b> कबीरधाम (कवर्धा) स्थित भोरमदेव मंदिर का निर्माण 11वीं शताब्दी में <b>फणिनागवंश</b> के राजा गोपालदेव / रामचंद्र द्वारा कराया गया था। इसे 'छत्तीसगढ़ का खजुराहो' भी कहा जाता है।"
      },
      {
        id: "dpq-12",
        questionHtml: "<b>प्रश्न 12:</b> छत्तीसगढ़ में <i>'मिनीमाता'</i> के नाम से प्रसिद्ध महिला स्वतंत्रता सेनानी का वास्तविक नाम क्या था?",
        optionsHtml: ["मीनाक्षी देवी", "माता राजमोहिनी", "मीनाक्षी अग्रहरि", "मीनाक्षी देवी (सत्यभामा)"],
        correctAnswer: 3,
        explanationHtml: "<b>व्याख्या:</b> छत्तीसगढ़ की प्रथम महिला सांसद <b>मिनीमाता</b> का वास्तविक नाम <b>मीनाक्षी देवी (सत्यभामा)</b> था। इन्होंने दलितों के उत्थान और बाल विवाह उन्मूलन हेतु ऐतिहासिक कार्य किए।"
      },
      {
        id: "dpq-13",
        questionHtml: "<b>प्रश्न 13:</b> 'चित्रकोट जलप्रपात' को भारत का नाइग्रा प्रपात कहा जाता है, यह किस नदी पर निर्मित है?",
        optionsHtml: ["इंद्रावती नदी", "शबरी नदी", "कोलाब नदी", "महानदी"],
        correctAnswer: 0,
        explanationHtml: "<b>व्याख्या:</b> बस्तर जिले में स्थित <b>चित्रकोट जलप्रपात</b> <b>इंद्रावती नदी</b> पर स्थित है। यह भारत का सबसे चौड़ा (लगभग 300 मीटर) जलप्रपात है।"
      },
      {
        id: "dpq-14",
        questionHtml: "<b>प्रश्न 14:</b> छत्तीसगढ़ विधानसभा भवन का नामकरण किसके नाम पर किया गया है?",
        optionsHtml: ["पंडित रविशंकर शुक्ल", "मिनीमाता", "स्वामी आत्मानंद", "वीर नारायण सिंह"],
        correctAnswer: 1,
        explanationHtml: "<b>व्याख्या:</b> छत्तीसगढ़ विधानसभा भवन का नामकरण राज्य की पहली महिला सांसद <b>मिनीमाता</b> के सम्मान में रखा गया है, जबकि मंत्रालय भवन का नाम <b>महानदी</b> तथा अध्यक्षीय निवास का नाम <b>करुणा</b> है।"
      },
      {
        id: "dpq-15",
        questionHtml: "<b>प्रश्न 15:</b> नीति आयोग के वर्तमान उपाध्यक्ष कौन हैं?",
        optionsHtml: ["सुमन बेरी", "बी.वी.आर. सुब्रमण्यम", "अमिताभ कांत", "अरविंद पनगड़िया"],
        correctAnswer: 0,
        explanationHtml: "<b>व्याख्या:</b> नीति आयोग के पदेन अध्यक्ष देश के प्रधानमंत्री होते हैं तथा वर्तमान उपाध्यक्ष <b>डॉ. सुमन बेरी</b> हैं।"
      },
      {
        id: "dpq-16",
        questionHtml: "<b>प्रश्न 16:</b> 'माधवराव सप्रे' द्वारा 1900 ईस्वी में पेंड्रा रोड से छत्तीसगढ़ की किस पहली पत्रिका का प्रकाशन प्रारंभ किया गया था?",
        optionsHtml: ["छत्तीसगढ़ मित्र", "महाकोशल", "अरुणोदय", "प्रजा हितैषी"],
        correctAnswer: 0,
        explanationHtml: "<b>व्याख्या:</b> सन 1900 में पंडित माधवराव सप्रे ने वामनराव लाखे और रामराव चिंचोलकर के सहयोग से <b>'छत्तीसगढ़ मित्र'</b> मासिक पत्रिका का प्रकाशन प्रारंभ किया था।"
      },
      {
        id: "dpq-17",
        questionHtml: "<b>प्रश्न 17:</b> राज्य नीति के निर्देशक सिद्धांतों को भारतीय संविधान में किस देश के संविधान से लिया गया है?",
        optionsHtml: ["संयुक्त राज्य अमेरिका", "आयरलैंड", "ब्रिटेन", "कनाडा"],
        correctAnswer: 1,
        explanationHtml: "<b>व्याख्या:</b> भारतीय संविधान के भाग 4 (अनुच्छेद 36-51) में शामिल <b>नीति निर्देशक तत्व (DPSP)</b> <b>आयरलैंड</b> के संविधान से प्रेरित हैं।"
      },
      {
        id: "dpq-18",
        questionHtml: "<b>प्रश्न 18:</b> 'तातापानी' उष्ण जल स्रोत (Hot Spring) छत्तीसगढ़ के किस जिले में स्थित है?",
        optionsHtml: ["बलरामपुर", "सूरजपुर", "सरगुजा", "कोरिया"],
        correctAnswer: 0,
        explanationHtml: "<b>व्याख्या:</b> बलरामपुर-रामानुजगंज जिले में स्थित <b>तातापानी</b> प्राकृतिक रूप से निरंतर उबलते हुए सल्फरयुक्त जल स्रोत हेतु प्रसिद्ध है। यहाँ भू-तापीय ऊर्जा (Geothermal Energy) संयंत्र भी स्थापित किया जा रहा है।"
      },
      {
        id: "dpq-19",
        questionHtml: "<b>प्रश्न 19:</b> कांगेर घाटी राष्ट्रीय उद्यान (बस्तर) की स्थापना किस वर्ष की गई थी?",
        optionsHtml: ["1978", "1982", "1985", "1990"],
        correctAnswer: 1,
        explanationHtml: "<b>व्याख्या:</b> बस्तर स्थित <b>कांगेर घाटी राष्ट्रीय उद्यान</b> की स्थापना <b>1982</b> में हुई थी। यह लगभग 200 वर्ग किमी क्षेत्र में फैला छत्तीसगढ़ का सबसे छोटा राष्ट्रीय उद्यान है।"
      },
      {
        id: "dpq-20",
        questionHtml: "<b>प्रश्न 20:</b> छत्तीसगढ़ी भाषा का प्रथम व्याकरण ग्रंथ (1885 ई.) किसके द्वारा लिखा गया था?",
        optionsHtml: ["हीरालाल काव्योपाध्याय", "ग्रियर्सन", "लोचन प्रसाद पांडेय", "मुकुटधर पांडेय"],
        correctAnswer: 0,
        explanationHtml: "<b>व्याख्या:</b> <b>हीरालाल काव्योपाध्याय</b> ने सन 1885 में छत्तीसगढ़ी भाषा का पहला व्याकरण रचा था, जिसे सर जॉर्ज ग्रियर्सन ने 1890 में रॉयल एशियाटिक सोसाइटी की पत्रिका में प्रकाशित कराया था।"
      }
    ],
    createdAt: new Date().toISOString(),
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
        if (!db.currentAffairs || db.currentAffairs.length === 0) {
          db.currentAffairs = initialCurrentAffairs;
          dirty = true;
        }
        if (!db.examInfo || db.examInfo.length === 0) {
          db.examInfo = initialExamInfo;
          dirty = true;
        }
        if (!db.dailyPractice || db.dailyPractice.length === 0) {
          db.dailyPractice = initialDailyPractice;
          dirty = true;
        }
        if (!db.dailyPracticeCategories || db.dailyPracticeCategories.length === 0) {
          db.dailyPracticeCategories = [
            {
              id: "cat-default-1",
              name: "सहायक शिक्षक",
              subLabel: "Teacher Sector",
              description: "सहायक शिक्षक परीक्षा हेतु विशेष वस्तुनिष्ठ प्रश्नोत्तरी एवं अभ्यास सेट",
              iconName: "GraduationCap",
              badgeColor: "bg-emerald-100 text-emerald-900 border-emerald-300"
            }
          ];
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
    dailyPractice: initialDailyPractice,
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
  let syncError = null;

  // Attempt Google Apps Script Webhook Sync if URL configured
  const appsScriptUrl = db.settings && db.settings.googleAppsScriptUrl;
  if (appsScriptUrl && appsScriptUrl.trim()) {
    try {
      const isPyq = Boolean(mergedQ.exam && mergedQ.exam.trim());
      const response = await fetch(appsScriptUrl.trim(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'UPDATE_QUESTION',
          sheetType: isPyq ? 'pyq' : 'subject',
          question: mergedQ
        })
      });
      if (response.ok) {
        sheetSynced = true;
      } else {
        syncError = `HTTP ${response.status}`;
      }
    } catch (err: any) {
      console.error("Google Apps Script Sync error:", err);
      syncError = err.message || "Failed to trigger Apps Script Webhook";
    }
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
  const appsScriptUrl = (db.settings && db.settings.googleAppsScriptUrl) || req.body.appsScriptUrl;

  if (!appsScriptUrl || !appsScriptUrl.trim()) {
    return res.status(400).json({ error: "Google Apps Script URL is not configured in Settings." });
  }

  const { question, questions } = req.body;
  const itemsToSync = questions || (question ? [question] : []);

  if (!itemsToSync.length) {
    return res.status(400).json({ error: "No question provided to sync." });
  }

  try {
    let successCount = 0;
    for (const q of itemsToSync) {
      const isPyq = Boolean(q.exam && q.exam.trim());
      const response = await fetch(appsScriptUrl.trim(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'UPDATE_QUESTION',
          sheetType: isPyq ? 'pyq' : 'subject',
          question: q
        })
      });
      if (response.ok) {
        successCount++;
      }
    }

    res.json({
      success: true,
      syncedCount: successCount,
      totalCount: itemsToSync.length,
      message: `Successfully synced ${successCount} question(s) to Google Sheets!`
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to reach Google Apps Script Webhook." });
  }
});

// Delete ALL questions
app.delete('/api/questions/all', (req, res) => {
  const db = loadDatabase();
  const deletedCount = (db.questions || []).length;
  db.questions = [];
  saveDatabase(db);
  res.json({ message: "All questions deleted successfully", deletedCount });
});

app.delete('/api/questions', (req, res) => {
  const db = loadDatabase();
  const deletedCount = (db.questions || []).length;
  db.questions = [];
  saveDatabase(db);
  res.json({ message: "All questions deleted successfully", deletedCount });
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

// Bulk append questions (Used by Subject-Wise HTML Parser, PYQ Importer & Daily Practice Sync)
app.post('/api/questions/bulk', (req, res) => {
  try {
    const db = loadDatabase();
    const newQuestions = req.body;
    if (!Array.isArray(newQuestions)) {
      return res.status(400).json({ error: "Request body must be an array of questions." });
    }

    db.questions = db.questions || [];
    const formattedQuestions = newQuestions.map((q: any, idx: number) => {
      const qId = q.id || `q-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 5)}`;
      return {
        ...q,
        id: qId,
        text_hi: (q.text_hi || q.text || q.questionHtml || '').toString().trim(),
        text_en: (q.text_en || '').toString().trim(),
        options_hi: Array.isArray(q.options_hi) ? q.options_hi : (Array.isArray(q.optionsHtml) ? q.optionsHtml : (q.options || ["विकल्प A", "विकल्प B", "विकल्प C", "विकल्प D"])),
        options_en: Array.isArray(q.options_en) ? q.options_en : undefined,
        correctAnswer: typeof q.correctAnswer === 'number' ? q.correctAnswer : (typeof q.correct_answer === 'number' ? q.correct_answer : 0),
        subject: (q.subject || 'छत्तीसगढ़ सामान्य ज्ञान').toString().trim(),
        topic: (q.topic || 'सामान्य परिचय').toString().trim(),
        exam: q.exam ? q.exam.toString().trim() : undefined,
        year: q.year ? Number(q.year) : undefined,
        explanation_hi: (q.explanation_hi || q.explanationHtml || '').toString().trim(),
        explanation_en: (q.explanation_en || '').toString().trim(),
        createdAt: q.createdAt || new Date().toISOString()
      };
    }).filter((q: any) => q.text_hi.length > 0);

    if (formattedQuestions.length === 0) {
      return res.status(400).json({ error: "कोई वैध प्रश्न नहीं मिले।" });
    }

    db.questions.push(...formattedQuestions);
    saveDatabase(db);

    console.log(`[Bulk Questions Added] Appended ${formattedQuestions.length} questions. Total questions now: ${db.questions.length}`);

    res.status(201).json({
      success: true,
      message: `सफलतापूर्वक ${formattedQuestions.length} प्रश्न डेटाबेस में जोड़ दिए गए हैं!`,
      count: formattedQuestions.length,
      questions: formattedQuestions
    });
  } catch (err: any) {
    console.error("Error in bulk questions:", err);
    res.status(500).json({ error: "प्रश्नों को बल्क में जोड़ने में त्रुटि: " + err.message });
  }
});

// Sync questions from Daily Practice Set directly into Subject-Wise Question Bank
app.post('/api/daily-practice/sync-to-subjectwise', (req, res) => {
  try {
    const db = loadDatabase();
    const { setId, targetSubject, targetTopic, questions: customQuestions } = req.body;

    let sourceQuestions: any[] = [];
    let defaultSub = targetSubject || 'छत्तीसगढ़ सामान्य ज्ञान';
    let defaultTop = targetTopic || 'डेली प्रैक्टिस क्विज';

    if (setId) {
      const set = (db.dailyPractice || []).find((s: any) => s.id === setId);
      if (!set) {
        return res.status(404).json({ error: "डेली प्रैक्टिस सेट नहीं मिला।" });
      }
      sourceQuestions = set.questions || [];
      if (!targetSubject) defaultSub = set.subject || 'छत्तीसगढ़ सामान्य ज्ञान';
      if (!targetTopic) defaultTop = set.title || 'डेली प्रैक्टिस क्विज';
    } else if (Array.isArray(customQuestions) && customQuestions.length > 0) {
      sourceQuestions = customQuestions;
    } else {
      return res.status(400).json({ error: "setId या questions सूची प्रदान करना अनिवार्य है।" });
    }

    if (!sourceQuestions.length) {
      return res.status(400).json({ error: "इस सेट में कोई प्रश्न उपलब्ध नहीं है।" });
    }

    db.questions = db.questions || [];

    const convertedQuestions = sourceQuestions.map((q: any, idx: number) => {
      // Clean question text and extract HTML content
      const rawQ = q.questionHtml || q.text_hi || q.text || '';
      const rawExp = q.explanationHtml || q.explanation_hi || '';
      const rawOpts = q.optionsHtml || q.options_hi || ["विकल्प A", "विकल्प B", "विकल्प C", "विकल्प D"];
      const correctAns = typeof q.correctAnswer === 'number' ? q.correctAnswer : 0;

      return {
        id: `q-sub-dp-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 4)}`,
        text_hi: rawQ.trim(),
        text_en: '',
        options_hi: rawOpts,
        correctAnswer: correctAns,
        subject: defaultSub.trim(),
        topic: defaultTop.trim(),
        exam: undefined, // undefined makes it eligible for Subject Tests
        year: undefined,
        explanation_hi: rawExp.trim(),
        explanation_en: '',
        dailyPracticeSetId: setId || undefined,
        createdAt: new Date().toISOString()
      };
    }).filter((q: any) => q.text_hi.length > 0);

    db.questions.push(...convertedQuestions);
    saveDatabase(db);

    console.log(`[Daily Practice Synced to Subjectwise] Added ${convertedQuestions.length} questions under subject: "${defaultSub}" -> topic: "${defaultTop}".`);

    res.status(201).json({
      success: true,
      message: `सफलतापूर्वक ${convertedQuestions.length} डेली क्विज प्रश्न '${defaultSub}' विषय के '${defaultTop}' टॉपिक में जोड़ दिए गए हैं!`,
      count: convertedQuestions.length,
      questions: convertedQuestions
    });
  } catch (err: any) {
    console.error("Error syncing daily practice to subjectwise:", err);
    res.status(500).json({ error: "विषय-वार में सिंक करने में त्रुटि: " + err.message });
  }
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
    const correctAnswer = parseCorrectAnswerServer(ansRaw, options_hi);

    let defaultSub = 'Chhattisgarh General Knowledge';
    if (sheetType === 'subject') defaultSub = 'Chhattisgarh General Knowledge';

    const subject = getVal(['subject', 'Subject', 'विषय']) || defaultSub;
    const topic = getVal(['topic', 'Topic', 'विषय-वस्तु', 'टॉपिक']) || 'सामान्य परिचय';
    const exam = getVal(['exam', 'Exam', 'परीक्षा']) || (sheetType === 'pyq' ? 'CGPSC Prelims' : '');
    const yearRaw = getVal(['year', 'Year', 'वर्ष']);
    const year = yearRaw ? parseInt(String(yearRaw)) : undefined;

    const explanation_hi = getVal(['explanation_hi', 'Explanation (HI)', 'Explanation', 'व्याख्या', 'व्याख्या (हिन्दी)']);
    const explanation_en = getVal(['explanation_en', 'Explanation (EN)', 'व्याख्या (अंग्रेजी)']);

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

// Student WhatsApp Subscriptions & Exam Alert Leads
app.post('/api/students/subscribe', (req, res) => {
  try {
    const db = loadDatabase();
    const { name, mobile, targetExam, district, source } = req.body;
    
    if (!name || !name.trim() || !mobile || !mobile.trim()) {
      return res.status(400).json({ error: "नाम (Name) एवं WhatsApp मोबाइल नंबर दर्ज करना अनिवार्य है।" });
    }

    const cleanMobile = mobile.trim();
    const cleanName = name.trim();
    const cleanExam = (targetExam && targetExam.trim()) || 'CGPSC Pre & CG Vyapam';
    const cleanDistrict = (district && district.trim()) || '';
    const cleanSource = (source && source.trim()) || 'WhatsApp Notification Section';

    db.subscribers = db.subscribers || [];
    
    // Check if user already registered with this mobile number
    const existingIdx = db.subscribers.findIndex((s: any) => 
      s.mobile && s.mobile.replace(/[^0-9]/g, '') === cleanMobile.replace(/[^0-9]/g, '')
    );

    let savedSub: any;
    if (existingIdx > -1) {
      // Update existing lead
      savedSub = {
        ...db.subscribers[existingIdx],
        name: cleanName,
        mobile: cleanMobile,
        targetExam: cleanExam,
        district: cleanDistrict || db.subscribers[existingIdx].district,
        source: cleanSource,
        updatedAt: new Date().toISOString()
      };
      db.subscribers[existingIdx] = savedSub;
    } else {
      // Create new lead at top
      savedSub = {
        id: "sub-" + Date.now() + "-" + Math.random().toString(36).substr(2, 5),
        name: cleanName,
        mobile: cleanMobile,
        targetExam: cleanExam,
        district: cleanDistrict,
        source: cleanSource,
        createdAt: new Date().toISOString()
      };
      db.subscribers.unshift(savedSub);
    }

    saveDatabase(db);
    console.log(`[Student Lead Received] Name: ${cleanName}, Mobile: ${cleanMobile}, Exam: ${cleanExam}`);

    res.status(201).json({
      success: true,
      message: "सफलतापूर्वक WhatsApp अलर्ट हेतु पंजीकरण हो गया है!",
      subscriber: savedSub
    });
  } catch (err: any) {
    console.error("Error saving subscriber:", err);
    res.status(500).json({ error: "सब्सक्राइबर सहेजने में विफल: " + err.message });
  }
});

// Admin get student subscribers
app.get('/api/admin/students/subscribers', (req, res) => {
  const db = loadDatabase();
  const list = (db.subscribers || []).sort((a: any, b: any) => {
    const timeA = new Date(a.createdAt || a.updatedAt || 0).getTime();
    const timeB = new Date(b.createdAt || b.updatedAt || 0).getTime();
    return timeB - timeA;
  });
  res.json(list);
});

// Admin delete student subscriber
app.delete('/api/admin/students/subscribers/:id', (req, res) => {
  const db = loadDatabase();
  const { id } = req.params;
  db.subscribers = (db.subscribers || []).filter((s: any) => s.id !== id);
  saveDatabase(db);
  res.json({ success: true, message: "विद्यार्थी रिकॉर्ड सफलतापूर्वक हटा दिया गया है।" });
});

// Admin get all feedbacks / reviews
app.get('/api/admin/feedbacks', (req, res) => {
  const db = loadDatabase();
  const list = (db.feedbacks || []).sort((a: any, b: any) => {
    const timeA = new Date(a.createdAt || a.timestamp || 0).getTime();
    const timeB = new Date(b.createdAt || b.timestamp || 0).getTime();
    return timeB - timeA;
  });
  res.json(list);
});

// Admin delete feedback
app.delete('/api/admin/feedbacks/:id', (req, res) => {
  const db = loadDatabase();
  const { id } = req.params;
  db.feedbacks = (db.feedbacks || []).filter((f: any) => f.id !== id);
  saveDatabase(db);
  res.json({ success: true, message: "फीडबैक रिकॉर्ड सफलतापूर्वक हटा दिया गया है।" });
});

// Feedback / Enquiry Endpoint
app.post('/api/feedback', (req, res) => {
  const db = loadDatabase();
  const { name, email, phone, queryType, message, rating, comment, studentName, studentMobile, testTitle, scoreInfo } = req.body;
  
  const finalName = name || studentName || 'अनाम परीक्षार्थी';
  const finalMessage = message || comment || '';
  
  if (!finalName && !finalMessage) {
    return res.status(400).json({ error: "Name and Message/Comment are required." });
  }

  const newFeedback = {
    id: "fb-" + Date.now() + "-" + Math.random().toString(36).substr(2, 5),
    name: finalName,
    studentName: finalName,
    email: email || '',
    phone: phone || studentMobile || '',
    studentMobile: phone || studentMobile || '',
    queryType: queryType || 'General Inquiry',
    testTitle: testTitle || queryType || 'सामान्य पूछताछ',
    message: finalMessage,
    comment: finalMessage,
    rating: typeof rating === 'number' ? rating : 5,
    scoreInfo: scoreInfo || '',
    createdAt: new Date().toISOString(),
    timestamp: new Date().toISOString()
  };

  db.feedbacks = db.feedbacks || [];
  db.feedbacks.unshift(newFeedback);
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

// Daily Practice Endpoints
app.get('/api/daily-practice-categories', (req, res) => {
  const db = loadDatabase();
  if (!db.dailyPracticeCategories || db.dailyPracticeCategories.length === 0) {
    db.dailyPracticeCategories = [
      {
        id: "cat-default-1",
        name: "सहायक शिक्षक",
        subLabel: "Teacher Sector",
        description: "सहायक शिक्षक परीक्षा हेतु विशेष वस्तुनिष्ठ प्रश्नोत्तरी एवं अभ्यास सेट",
        iconName: "GraduationCap",
        badgeColor: "bg-emerald-100 text-emerald-900 border-emerald-300"
      }
    ];
    saveDatabase(db);
  }
  res.json(db.dailyPracticeCategories);
});

app.post('/api/daily-practice-categories', (req, res) => {
  const db = loadDatabase();
  const newCat = req.body;
  if (!newCat.name) {
    return res.status(400).json({ error: "Category name is required" });
  }
  if (!newCat.id) {
    newCat.id = "cat-" + Date.now();
  }
  if (!db.dailyPracticeCategories) {
    db.dailyPracticeCategories = [];
  }
  
  const idx = db.dailyPracticeCategories.findIndex((c: any) => c.id === newCat.id || c.name === newCat.name);
  if (idx > -1) {
    db.dailyPracticeCategories[idx] = { ...db.dailyPracticeCategories[idx], ...newCat };
  } else {
    db.dailyPracticeCategories.push(newCat);
  }
  
  saveDatabase(db);
  res.json(db.dailyPracticeCategories);
});

app.delete('/api/daily-practice-categories/:id', (req, res) => {
  const db = loadDatabase();
  const rawId = req.params.id;
  const target = decodeURIComponent(rawId).trim().toLowerCase();
  
  if (!db.dailyPracticeCategories) {
    db.dailyPracticeCategories = [];
  }
  
  db.dailyPracticeCategories = db.dailyPracticeCategories.filter((c: any) => {
    const cId = (c.id || '').toString().trim().toLowerCase();
    const cName = (c.name || '').toString().trim().toLowerCase();
    return cId !== target && cName !== target;
  });
  
  saveDatabase(db);
  res.json(db.dailyPracticeCategories);
});

app.delete('/api/daily-practice-categories-all', (req, res) => {
  const db = loadDatabase();
  db.dailyPracticeCategories = [];
  saveDatabase(db);
  res.json([]);
});

app.get('/api/daily-practice', (req, res) => {
  const db = loadDatabase();
  const rawSets = db.dailyPractice || [];
  const sets = Array.isArray(rawSets) ? [...rawSets] : [];
  // Sort by date descending safely
  sets.sort((a: any, b: any) => {
    const timeA = (a && a.date) ? new Date(a.date).getTime() : 0;
    const timeB = (b && b.date) ? new Date(b.date).getTime() : 0;
    const safeA = isNaN(timeA) ? 0 : timeA;
    const safeB = isNaN(timeB) ? 0 : timeB;
    return safeB - safeA;
  });
  res.json(sets);
});

app.get('/api/daily-practice/:id', (req, res) => {
  const db = loadDatabase();
  const { id } = req.params;
  const set = (db.dailyPractice || []).find((item: any) => item.id === id);
  if (!set) {
    return res.status(404).json({ error: "Daily practice set not found" });
  }
  res.json(set);
});

app.post('/api/daily-practice', (req, res) => {
  const db = loadDatabase();
  const newItem = req.body;
  if (!newItem.id) {
    newItem.id = "dp-" + (newItem.date || new Date().toISOString().split('T')[0]) + "-" + Math.random().toString(36).substr(2, 4);
  }
  newItem.createdAt = newItem.createdAt || new Date().toISOString();
  newItem.updatedAt = new Date().toISOString();
  
  db.dailyPractice = db.dailyPractice || [];
  const existingIdx = db.dailyPractice.findIndex((item: any) => item.id === newItem.id);
  if (existingIdx > -1) {
    db.dailyPractice[existingIdx] = newItem;
  } else {
    db.dailyPractice.unshift(newItem);
  }
  
  saveDatabase(db);
  res.status(201).json(newItem);
});

app.put('/api/daily-practice/:id', (req, res) => {
  const db = loadDatabase();
  const { id } = req.params;
  const updatedItem = req.body;
  updatedItem.id = id;
  updatedItem.updatedAt = new Date().toISOString();

  db.dailyPractice = db.dailyPractice || [];
  const existingIdx = db.dailyPractice.findIndex((item: any) => item.id === id);
  if (existingIdx > -1) {
    db.dailyPractice[existingIdx] = updatedItem;
  } else {
    db.dailyPractice.unshift(updatedItem);
  }

  saveDatabase(db);
  res.json(updatedItem);
});

app.delete('/api/daily-practice/:id', (req, res) => {
  const db = loadDatabase();
  const { id } = req.params;
  db.dailyPractice = db.dailyPractice || [];
  db.dailyPractice = db.dailyPractice.filter((item: any) => item.id !== id);
  saveDatabase(db);
  res.json({ message: "Daily practice set deleted successfully", id });
});


// User Engagement Tracking Beacon (Records page views, duration & interactions)
app.post('/api/track/engagement', (req, res) => {
  const db = loadDatabase();
  const { tab, path, durationSeconds, device, referrer, timestamp, clientId, userName, userMobile } = req.body;
  
  if (!db.engagementLogs) {
    db.engagementLogs = [];
  }

  const safeDuration = Math.min(Math.max(Number(durationSeconds) || 0, 1), 7200); // capped at 2 hours
  const safeTab = tab || 'home';
  const safeDevice = device || 'mobile';
  const safeClientId = clientId || 'anon-' + Math.random().toString(36).substr(2, 9);

  db.engagementLogs.push({
    id: 'eng-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
    tab: safeTab,
    path: path || `/?tab=${safeTab}`,
    durationSeconds: safeDuration,
    device: safeDevice,
    referrer: referrer || '',
    clientId: safeClientId,
    userName: userName || '',
    userMobile: userMobile || '',
    timestamp: timestamp || new Date().toISOString()
  });

  // Keep last 2500 records to prevent db bloating
  if (db.engagementLogs.length > 2500) {
    db.engagementLogs = db.engagementLogs.slice(-2500);
  }

  saveDatabase(db);
  res.json({ status: 'ok' });
});

// Clear engagement tracking logs (Reset to 0)
app.post('/api/admin/engagement-stats/reset', (req, res) => {
  const db = loadDatabase();
  db.engagementLogs = [];
  saveDatabase(db);
  res.json({ message: "Analytics logs reset to 0 successfully", status: "ok" });
});

// Admin Engagement Statistics Summary Endpoint
app.get('/api/admin/engagement-stats', (req, res) => {
  const db = loadDatabase();
  const logs: any[] = db.engagementLogs || [];
  const attempts: any[] = db.attempts || [];
  const questions: any[] = db.questions || [];
  const students: any[] = db.students || [];

  const timeRange = (req.query.range as string) || 'all';
  const now = Date.now();

  // Filter logs by selected timeRange
  const filteredLogs = logs.filter(log => {
    const logTime = new Date(log.timestamp).getTime();
    if (isNaN(logTime)) return true;
    if (timeRange === 'today') {
      return (now - logTime) <= 24 * 60 * 60 * 1000;
    }
    if (timeRange === '7days') {
      return (now - logTime) <= 7 * 24 * 60 * 60 * 1000;
    }
    return true;
  });

  // Filter test attempts by selected timeRange
  const filteredAttempts = attempts.filter(att => {
    const attTime = new Date(att.completedAt || att.timestamp || att.createdAt).getTime();
    if (isNaN(attTime)) return true;
    if (timeRange === 'today') {
      return (now - attTime) <= 24 * 60 * 60 * 1000;
    }
    if (timeRange === '7days') {
      return (now - attTime) <= 7 * 24 * 60 * 60 * 1000;
    }
    return true;
  });

  // Filter students/registered leads by selected timeRange
  const filteredStudents = students.filter(st => {
    const stTime = new Date(st.createdAt || st.timestamp).getTime();
    if (isNaN(stTime)) return true;
    if (timeRange === 'today') {
      return (now - stTime) <= 24 * 60 * 60 * 1000;
    }
    if (timeRange === '7days') {
      return (now - stTime) <= 7 * 24 * 60 * 60 * 1000;
    }
    return true;
  });

  // 1. Calculate Realtime Active Users (within last 3 minutes / 180 seconds)
  const activeCutoff = now - (3 * 60 * 1000);
  const activeClientSet = new Set<string>();
  logs.forEach(log => {
    const logTime = new Date(log.timestamp).getTime();
    if (logTime >= activeCutoff) {
      activeClientSet.add(log.clientId || log.id);
    }
  });
  const realtimeActiveUsers = activeClientSet.size;

  // 2. Calculate Unique Users for the selected time range
  const uniqueClientSet = new Set<string>();
  filteredLogs.forEach(log => {
    if (log.clientId) uniqueClientSet.add(log.clientId);
  });
  filteredStudents.forEach((s: any) => {
    if (s.mobile) uniqueClientSet.add(s.mobile);
  });
  filteredAttempts.forEach((a: any) => {
    if (a.studentName) uniqueClientSet.add(a.studentName);
  });
  const totalUniqueUsers = uniqueClientSet.size;

  const tabMetadata: Record<string, { label: string; path: string; icon: string }> = {
    'daily-practice': { label: 'डेली प्रैक्टिस (Daily Practice)', path: '/?tab=daily-practice', icon: 'Sparkles' },
    'current-affairs': { label: 'करंट अफेयर्स (Current Affairs)', path: '/?tab=current-affairs', icon: 'Newspaper' },
    'pyqs': { label: 'विगत वर्ष प्रश्न (PYQs Exam Bank)', path: '/?tab=pyqs', icon: 'Database' },
    'subjects': { label: 'विषय-वार क्विज़ (Subject MCQs)', path: '/?tab=subjects', icon: 'BookOpen' },
    'home': { label: 'होमपेज (Landing & Search)', path: '/', icon: 'Home' },
    'exam-info': { label: 'परीक्षा विवरण व सिलेबस (About Exam)', path: '/?tab=exam-info', icon: 'GraduationCap' },
    'dashboard': { label: 'विद्यार्थी डैशबोर्ड (Student Dashboard)', path: '/?tab=dashboard', icon: 'User' }
  };

  const pageAggregates: Record<string, { views: number; totalDuration: number }> = {};
  Object.keys(tabMetadata).forEach(k => {
    pageAggregates[k] = { views: 0, totalDuration: 0 };
  });

  let mobileCount = 0;
  let desktopCount = 0;

  filteredLogs.forEach(log => {
    const tabKey = log.tab || 'home';
    if (!pageAggregates[tabKey]) {
      pageAggregates[tabKey] = { views: 0, totalDuration: 0 };
    }
    pageAggregates[tabKey].views += 1;
    pageAggregates[tabKey].totalDuration += (log.durationSeconds || 0);

    if (log.device === 'desktop') {
      desktopCount++;
    } else {
      mobileCount++;
    }
  });

  // Calculate real metrics from filtered test attempts
  const totalAttempts = filteredAttempts.length;
  let totalQuestionsAnswered = 0;
  filteredAttempts.forEach(a => {
    totalQuestionsAnswered += (a.totalQuestions || 0);
  });

  let totalPageViews = filteredLogs.length;
  let totalTimeSpent = 0;

  const pageStats = Object.entries(pageAggregates).map(([tabKey, recorded]) => {
    const meta = tabMetadata[tabKey] || { label: tabKey, path: `/?tab=${tabKey}`, icon: 'Compass' };
    const views = recorded.views;
    const totalDuration = recorded.totalDuration;
    const avgDuration = views > 0 ? Math.round(totalDuration / views) : 0;

    totalTimeSpent += totalDuration;

    return {
      tab: tabKey,
      label: meta.label,
      path: meta.path,
      views: views,
      totalDurationSeconds: totalDuration,
      avgDurationSeconds: avgDuration,
      sharePercent: 0,
      icon: meta.icon
    };
  });

  // Calculate percentages
  pageStats.forEach(p => {
    p.sharePercent = totalTimeSpent > 0 ? Math.round((p.totalDurationSeconds / totalTimeSpent) * 100) : 0;
  });

  // Sort pages by views / time spent descending
  pageStats.sort((a, b) => b.totalDurationSeconds - a.totalDurationSeconds);

  // Popular Tests dynamically calculated from filtered test attempts
  const testAttemptCounts: Record<string, { title: string; type: string; count: number; totalScore: number }> = {};
  
  filteredAttempts.forEach((att: any) => {
    const title = att.title || att.quizTitle || att.testTitle || 'अभ्यास क्विज़';
    const type = att.type === 'pyq' ? 'PYQ Exam Paper' : att.type === 'dailyPractice' ? 'Daily Practice' : 'Subject Quiz';
    const key = title;
    if (!testAttemptCounts[key]) {
      testAttemptCounts[key] = { title, type, count: 0, totalScore: 0 };
    }
    testAttemptCounts[key].count += 1;
    const scorePct = att.totalQuestions > 0 ? Math.round(((att.correctCount || 0) / att.totalQuestions) * 100) : (att.score || 0);
    testAttemptCounts[key].totalScore += scorePct;
  });

  const popularTests = Object.entries(testAttemptCounts).map(([key, data], idx) => ({
    id: `test-real-${idx}`,
    title: data.title,
    type: data.type,
    attempts: data.count,
    avgScore: data.count > 0 ? Math.round(data.totalScore / data.count) : 0
  })).sort((a, b) => b.attempts - a.attempts).slice(0, 5);

  const totalDev = (mobileCount + desktopCount);
  const mobPercent = totalDev > 0 ? Math.round((mobileCount / totalDev) * 100) : 0;
  const deskPercent = totalDev > 0 ? (100 - mobPercent) : 0;

  // Real recent activity from filtered logs with active user identification
  const recentActivity = filteredLogs.slice(-25).reverse().map(l => {
    const logTime = new Date(l.timestamp).getTime();
    const isCurrentlyActive = (now - logTime) <= (5 * 60 * 1000); // active in last 5 minutes
    
    // Find if user has a registered name/phone
    const matchedStudent = students.find(s => s.mobile === l.userMobile || s.clientId === l.clientId);
    const matchedAttempt = attempts.find(a => a.studentMobile === l.userMobile || a.studentName === l.userName);
    const displayName = l.userName || matchedStudent?.name || matchedAttempt?.studentName || '';

    return {
      tab: l.tab,
      label: tabMetadata[l.tab]?.label || l.tab,
      durationSeconds: l.durationSeconds,
      device: l.device,
      userName: displayName,
      isCurrentlyActive,
      timestamp: l.timestamp
    };
  });

  res.json({
    summary: {
      realtimeActiveUsers,
      totalUniqueUsers,
      totalPageViews,
      totalActiveSessions: totalPageViews > 0 ? Math.max(1, Math.round(totalPageViews / 2.5)) : 0,
      totalTimeSpentSeconds: totalTimeSpent,
      avgTimePerSessionSeconds: totalPageViews > 0 ? Math.round(totalTimeSpent / totalPageViews) : 0,
      totalQuizzesAttempted: totalAttempts,
      totalQuestionsAnswered: totalQuestionsAnswered
    },
    deviceBreakdown: {
      mobile: mobPercent,
      desktop: deskPercent
    },
    pageStats,
    recentActivity,
    popularTests
  });
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
    <loc>${baseUrl}/?tab=daily-practice</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.95</priority>
  </url>
  <url>
    <loc>${baseUrl}/?tab=syllabus</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.85</priority>
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
