/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ShareOptions {
  type: 'website' | 'subject' | 'topic' | 'pyq' | 'daily-practice' | 'quiz-result';
  title?: string;
  subject?: string;
  topic?: string;
  exam?: string;
  year?: number | string;
  date?: string;
  category?: string;
  qCount?: number;
  score?: number | string;
  maxScore?: number | string;
  percentage?: number | string;
  correctCount?: number;
  wrongCount?: number;
  timeSpent?: string;
  customUrl?: string;
}

export function getBaseShareUrl(): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    // If running in development container or custom domain
    const host = window.location.host;
    if (host.includes('testarena.co.in')) {
      return 'https://testarena.co.in';
    }
    return window.location.origin;
  }
  return 'https://testarena.co.in';
}

export function generateShareUrl(options: ShareOptions): string {
  if (options.customUrl) return options.customUrl;
  
  const base = getBaseShareUrl();
  const params = new URLSearchParams();

  switch (options.type) {
    case 'subject':
      params.set('tab', 'subjects');
      if (options.subject) params.set('subject', options.subject);
      break;

    case 'topic':
      params.set('tab', 'subjects');
      if (options.subject) params.set('subject', options.subject);
      if (options.topic) params.set('topic', options.topic);
      break;

    case 'pyq':
      params.set('tab', 'pyqs');
      if (options.exam) params.set('exam', options.exam);
      if (options.year) params.set('year', String(options.year));
      break;

    case 'daily-practice':
      params.set('tab', 'daily-practice');
      if (options.date) params.set('date', options.date);
      break;

    case 'quiz-result':
    case 'website':
    default:
      params.set('tab', 'home');
      break;
  }

  const queryString = params.toString();
  return queryString ? `${base}?${queryString}` : base;
}

export function generateShareMessage(options: ShareOptions): { title: string; text: string; url: string } {
  const url = generateShareUrl(options);

  let title = 'TestArena - CGPSC & CG Vyapam Practice Portal';
  let messageBody = '';

  switch (options.type) {
    case 'topic':
      title = `🎯 टॉपिक टेस्ट: ${options.topic || 'महत्वपूर्ण प्रश्न'}`;
      messageBody = `🎯 *CGPSC & व्यापमं टॉपिक टेस्ट चैलेंज* 🎯
----------------------------------------
📚 *विषय:* ${options.subject || 'सामान्य अध्ययन'}
📝 *अध्याय / टॉपिक:* ${options.topic || 'महत्वपूर्ण टॉपिक'}
${options.qCount ? `📄 *कुल प्रश्न:* ${options.qCount} महत्वपूर्ण MCQs\n` : ''}✨ *विस्तृत हिंदी व्याख्या सहित*

⚡ क्या आप इस टॉपिक के सभी प्रश्नों का सही उत्तर दे सकते हैं? अभी टेस्ट देकर अपनी तैयारी परखें!

👉 *टेस्ट शुरू करने के लिए लिंक खोलें:*
${url}`;
      break;

    case 'subject':
      title = `📚 संपूर्ण विषय टेस्ट: ${options.subject || 'सामान्य ज्ञान'}`;
      messageBody = `🎯 *CGPSC & CG व्यापमं - संपूर्ण विषय टेस्ट* 🎯
----------------------------------------
📚 *विषय:* ${options.subject || 'छत्तीसगढ़ सामान्य ज्ञान'}
${options.qCount ? `📄 *कुल प्रश्न:* ${options.qCount} MCQs\n` : ''}⏱️ *नेगेटिव मार्किंग व रियल टाइमर आधारित*
✨ *100% प्रामाणिक व्याख्या (Hindi Solutions)*

🔥 आज ही यह विषय टेस्ट हल करें और अपनी तैयारी को और मजबूत बनाएं!

👉 *टेस्ट लिंक:*
${url}`;
      break;

    case 'pyq':
      title = `📖 विगत वर्ष प्रश्न: ${options.exam || 'CGPSC/व्यापमं'}`;
      messageBody = `📖 *CGPSC / व्यापमं - विगत वर्ष हल प्रश्न (Official PYQ)* 📖
----------------------------------------
🏛️ *परीक्षा:* ${options.exam || 'CGPSC Prelims'} ${options.year ? `(${options.year})` : ''}
${options.qCount ? `📄 *कुल प्रश्न:* ${options.qCount} हल प्रश्न\n` : ''}🔍 *विस्तृत व प्रामाणिक व्याख्या सहित*

🎯 आधिकारिक परीक्षा प्रश्नों को हल कर परीक्षा पैटर्न समझें!

👉 *हल करने के लिए यहाँ क्लिक करें:*
${url}`;
      break;

    case 'daily-practice':
      title = `🔥 डेली प्रैक्टिस क्विज़: ${options.title || 'आज का टेस्ट'}`;
      messageBody = `🔥 *TestArena - डेली प्रैक्टिस क्विज़ (शिक्षक एवं सहायक शिक्षक)* 🔥
----------------------------------------
📝 *शीर्षक:* ${options.title || 'डेली प्रैक्टिस सेट'}
${options.date ? `📅 *दिनांक:* ${options.date}\n` : ''}${options.category ? `📚 *श्रेणी:* ${options.category}\n` : ''}${options.qCount ? `📄 *कुल प्रश्न:* ${options.qCount} MCQs\n` : ''}⏱️ *समय:* 20 मिनट | 1/3 नेगेटिव मार्किंग

⚡ रोजाना नए प्रश्नों के साथ अभ्यास करें और अपनी रैंक सुधारें!

👉 *अभी टेस्ट देने के लिए लिंक खोलें:*
${url}`;
      break;

    case 'quiz-result':
      title = `🏆 क्विज़ परिणाम: ${options.title || 'TestArena Scorecard'}`;
      messageBody = `🏆 *TestArena - मेरा क्विज़ परिणाम स्कोरकार्ड* 🏆
----------------------------------------
📝 *टेस्ट:* ${options.title || 'CGPSC / व्यापमं मॉक टेस्ट'}
🎯 *प्राप्तांक:* ${options.score} / ${options.maxScore} (${options.percentage}% स्कोर)
✅ *सही उत्तर:* ${options.correctCount || 0}
❌ *गलत उत्तर:* ${options.wrongCount || 0}
${options.timeSpent ? `⏱️ *समय लिया:* ${options.timeSpent}\n` : ''}
🔥 क्या आप मुझसे बेहतर स्कोर कर सकते हैं? चुनौती स्वीकार करें और टेस्ट दें!

👉 *यहाँ टेस्ट दें:*
${url}`;
      break;

    case 'website':
    default:
      title = 'TestArena - CGPSC & CG Vyapam Free Online Test Portal';
      messageBody = `🎯 *TestArena (testarena.co.in) - CGPSC & व्यापमं टेस्ट पोर्टल* 🎯
----------------------------------------
📚 CGPSC, CG व्यापमं, शिक्षक एवं सहायक शिक्षक भर्ती परीक्षा की संपूर्ण व निःशुल्क तैयारी!

✨ *पोर्टल की मुख्य विशेषताएं:*
✅ छत्तीसगढ़ सामान्य ज्ञान एवं सभी विषयों के टॉपिक-वाइज टेस्ट
✅ पिछले वर्षों के हल प्रश्न पत्र (Official PYQs)
✅ शिक्षक एवं सहायक शिक्षक भर्ती स्पेशल डेली प्रैक्टिस सेट्स
✅ 100% प्रामाणिक व विस्तृत हिंदी व्याख्या (Hindi Solutions)
✅ रियल-एग्जाम टाइमर व नेगेटिव मार्किंग सिस्टम

👉 *आज ही फ्री टेस्ट देना शुरू करें:*
${url}`;
      break;
  }

  return { title, text: messageBody, url };
}

export function shareToWhatsApp(text: string): void {
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
  window.open(whatsappUrl, '_blank');
}

export function shareToTelegram(text: string, url: string): void {
  const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
  window.open(telegramUrl, '_blank');
}

export async function shareNative(data: { title: string; text: string; url: string }): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({
        title: data.title,
        text: data.text,
        url: data.url
      });
      return true;
    } catch (err: any) {
      // If user aborted or canceled share, don't trigger error
      if (err.name !== 'AbortError') {
        console.warn('Native share failed:', err);
      }
      return false;
    }
  }
  return false;
}
