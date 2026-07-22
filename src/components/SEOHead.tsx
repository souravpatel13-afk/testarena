import React, { useEffect } from 'react';

interface SEOHeadProps {
  activeTab: 'home' | 'dashboard' | 'pyqs' | 'subjects' | 'current-affairs' | 'about' | 'contact' | 'admin' | 'privacy' | 'terms' | 'disclaimer';
  selectedSubject?: string;
  selectedTopic?: string;
}

const tabMetadata: Record<string, { title: string; description: string; keywords: string; canonical: string }> = {
  home: {
    title: 'Test Arena | CGPSC, CG Vyapam & State PSC Mock Test & PYQ Portal in Hindi',
    description: 'Test Arena (testarena.co.in) - भारत एवं छत्तीसगढ़ राज्य की प्रतियोगी परीक्षाओं (CGPSC Prelims, CG Vyapam, UPSC, SSC, Railway) हेतु सर्वश्रेष्ठ निःशुल्क ऑनलाइन मॉक टेस्ट, पिछले वर्षों के प्रश्न पत्र (PYQ) तथा विषय-वार प्रैक्टिस पोर्टल।',
    keywords: 'CGPSC Mock Test, CG Vyapam Previous Year Questions, Chhattisgarh GK Quiz, CGPSC Online Test Series in Hindi, Test Arena, CGPSC Prelims Practice, Chhattisgarh Current Affairs',
    canonical: 'https://testarena.co.in/'
  },
  subjects: {
    title: 'विषय-वार टेस्ट सीरीज (Subject-wise Quiz) | CG General Knowledge, History, Polity - Test Arena',
    description: 'छत्तीसगढ़ सामान्य ज्ञान (CG GK), भारत का इतिहास, संविधान एवं भूगोल के विषय-वार महत्वपूर्ण प्रश्नों के उत्तर व्याख्या सहित अभ्यास करें। अपनी विषयवार तैयारी मजबूत करें।',
    keywords: 'Subject-wise Quiz, CG GK Subject Wise Test, Chhattisgarh History MCQ, Indian Polity Quiz in Hindi, CG Geography Practice',
    canonical: 'https://testarena.co.in/?tab=subjects'
  },
  pyqs: {
    title: 'पिछले वर्षों के प्रश्न पत्र (Previous Year Questions - PYQs) | CGPSC, CG Vyapam Solved Papers',
    description: 'CGPSC Prelims एवं CG Vyapam की विगत परीक्षाओं (2012-2025) में पूछे गए वास्तविक प्रश्नों का परीक्षा-वार एवं टॉपिक-वार अभ्यास मॉडल उत्तर एवं विस्तृत व्याख्या के साथ करें।',
    keywords: 'CGPSC Previous Year Questions, CG Vyapam PYQ Solved Papers, CGPSC Old Question Papers with Solutions, Topic wise PYQ Chhattisgarh',
    canonical: 'https://testarena.co.in/?tab=pyqs'
  },
  'current-affairs': {
    title: 'छत्तीसगढ़ एवं राष्ट्रीय समसामयिकी (Current Affairs 2026) | Daily & Monthly Quiz - Test Arena',
    description: 'छत्तीसगढ़ राज्य विशेष तथा राष्ट्रीय एवं अंतर्राष्ट्रीय समसामयिकी (Current Affairs) के सबसे सटीक वस्तुनिष्ठ प्रश्न एवं व्याख्या प्राप्त करें। सीजीपीएससी एवं व्यापम परीक्षाओं के लिए उपयोगी।',
    keywords: 'Chhattisgarh Current Affairs 2026, CG Daily Current Affairs Quiz, CGPSC Current Affairs MCQ in Hindi, National Current Affairs for CG Vyapam',
    canonical: 'https://testarena.co.in/?tab=current-affairs'
  },
  dashboard: {
    title: 'प्रगति एवं विश्लेषणात्मक डैशबोर्ड (Performance Dashboard) | Test Arena',
    description: 'अपनी तैयारी का विस्तृत विश्लेषण देखें - टेस्ट स्कोरकार्ड, कमजोर विषय विश्लेषण, गलत प्रश्नों का पुनराभ्यास (Wrong Questions) एवं बुकमार्क किए गए प्रश्नों की समीक्षा करें।',
    keywords: 'Test Arena Dashboard, Quiz Performance Analytics, CGPSC Progress Tracker, Weak Questions Practice',
    canonical: 'https://testarena.co.in/?tab=dashboard'
  },
  about: {
    title: 'हमारे बारे में (About Test Arena) | CG State Exams Online Preparation Portal',
    description: 'Test Arena (testarena.co.in) के बारे में जानें। हमारा लक्ष्य छत्तीसगढ़ के प्रतियोगी परीक्षार्थियों को उच्च गुणवत्तायुक्त, प्रामाणिक द्विभाषीय मॉक टेस्ट तथा अध्ययन सामग्री निःशुल्क उपलब्ध कराना है।',
    keywords: 'About Test Arena, CGPSC Preparation Portal, Chhattisgarh Online Test Platform, Test Arena Mission',
    canonical: 'https://testarena.co.in/?tab=about'
  },
  contact: {
    title: 'संपर्क करें (Contact Us) | Test Arena Support & Feedback',
    description: 'Test Arena टीम से संपर्क करें। किसी भी प्रश्न, फीडबैक, त्रुटि सुधार या सुझाव के लिए हमें testarena2026@gmail.com पर ईमेल करें या फॉर्म भरें।',
    keywords: 'Contact Test Arena, Test Arena Support Email, CGPSC Quiz Feedback, Test Arena Address',
    canonical: 'https://testarena.co.in/?tab=contact'
  },
  privacy: {
    title: 'गोपनीयता नीति (Privacy Policy) | Test Arena',
    description: 'Test Arena की गोपनीयता नीति। जानें कि हम उपयोगकर्ताओं के डेटा, गोपनीयता और सुरक्षा की रक्षा कैसे करते हैं।',
    keywords: 'Test Arena Privacy Policy, Data Protection Test Arena, Legal Privacy',
    canonical: 'https://testarena.co.in/?tab=privacy'
  },
  terms: {
    title: 'नियम एवं शर्तें (Terms & Conditions) | Test Arena',
    description: 'Test Arena पोर्टल के उपयोग की नियम और शर्तें। कृपया सेवा शर्तों को ध्यानपूर्वक पढ़ें।',
    keywords: 'Test Arena Terms and Conditions, User Agreement Test Arena',
    canonical: 'https://testarena.co.in/?tab=terms'
  },
  disclaimer: {
    title: 'अस्वीकरण (Disclaimer) | Non-Government Educational Portal - Test Arena',
    description: 'Test Arena एक गैर-सरकारी निजी शैक्षणिक पोर्टल है। इस पोर्टल का CGPSC, CG Vyapam या किसी सरकारी एजेंसी से सीधा संबंध नहीं है।',
    keywords: 'Test Arena Disclaimer, Non-government Portal Notice, Legal Disclaimer',
    canonical: 'https://testarena.co.in/?tab=disclaimer'
  },
  admin: {
    title: 'प्रशासक पैनल (Admin Panel) | Test Arena',
    description: 'Test Arena Admin Management Panel for Syncing Google Sheets questions and managing platform data.',
    keywords: 'Admin Panel, Test Arena Admin',
    canonical: 'https://testarena.co.in/?tab=admin'
  }
};

export const SEOHead: React.FC<SEOHeadProps> = ({ activeTab, selectedSubject, selectedTopic }) => {
  useEffect(() => {
    const meta = tabMetadata[activeTab] || tabMetadata.home;
    
    // Dynamic Custom Title for Subject / Topic if applicable
    let finalTitle = meta.title;
    let finalDescription = meta.description;

    if (activeTab === 'subjects' && selectedSubject) {
      finalTitle = `${selectedSubject} ऑनलाइन मॉक टेस्ट व महत्वपूर्ण प्रश्न | Test Arena`;
      finalDescription = `${selectedSubject} के सर्वश्रेष्ठ बहुविकल्पीय प्रश्न (MCQ) हिंदी में विस्तृत व्याख्या सहित हल करें। CGPSC और CG Vyapam के लिए उपयोगी।`;
    } else if (activeTab === 'pyqs' && selectedTopic) {
      finalTitle = `${selectedTopic} PYQ Solved Papers (विगत वर्षों के प्रश्न) | Test Arena`;
      finalDescription = `${selectedTopic} टॉपिक से CGPSC एवं CG Vyapam परीक्षाओं में पूर्व वर्षों में पूछे गए प्रश्नों का अभ्यास करें।`;
    }

    // Update document title
    document.title = finalTitle;

    // Helper to set or create meta tag
    const setMetaTag = (nameAttr: string, attrVal: string, contentVal: string) => {
      let element = document.querySelector(`meta[${nameAttr}="${attrVal}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(nameAttr, attrVal);
        document.head.appendChild(element);
      }
      element.setAttribute('content', contentVal);
    };

    // Helper to set canonical
    const setCanonical = (url: string) => {
      let linkElement = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
      if (!linkElement) {
        linkElement = document.createElement('link');
        linkElement.setAttribute('rel', 'canonical');
        document.head.appendChild(linkElement);
      }
      linkElement.setAttribute('href', url);
    };

    // Set Core Meta Tags
    setMetaTag('name', 'description', finalDescription);
    setMetaTag('name', 'keywords', meta.keywords);

    // Set Open Graph Tags
    setMetaTag('property', 'og:title', finalTitle);
    setMetaTag('property', 'og:description', finalDescription);
    setMetaTag('property', 'og:url', meta.canonical);
    setMetaTag('property', 'og:type', 'website');
    setMetaTag('property', 'og:locale', 'hi_IN');
    setMetaTag('property', 'og:site_name', 'Test Arena');
    setMetaTag('property', 'og:image', 'https://testarena.co.in/assets/og-image.jpg');

    // Set Twitter Cards
    setMetaTag('name', 'twitter:card', 'summary_large_image');
    setMetaTag('name', 'twitter:title', finalTitle);
    setMetaTag('name', 'twitter:description', finalDescription);
    setMetaTag('name', 'twitter:image', 'https://testarena.co.in/assets/og-image.jpg');

    // Set Canonical URL
    setCanonical(meta.canonical);

    // Inject Dynamic Breadcrumb JSON-LD
    let breadcrumbScript = document.getElementById('jsonld-breadcrumb');
    if (!breadcrumbScript) {
      breadcrumbScript = document.createElement('script');
      breadcrumbScript.id = 'jsonld-breadcrumb';
      breadcrumbScript.setAttribute('type', 'application/ld+json');
      document.head.appendChild(breadcrumbScript);
    }

    const breadcrumbSchema = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": "https://testarena.co.in/"
        },
        ...(activeTab !== 'home' ? [{
          "@type": "ListItem",
          "position": 2,
          "name": activeTab.toUpperCase(),
          "item": meta.canonical
        }] : [])
      ]
    };

    breadcrumbScript.textContent = JSON.stringify(breadcrumbSchema);

  }, [activeTab, selectedSubject, selectedTopic]);

  return null;
};

export default SEOHead;
