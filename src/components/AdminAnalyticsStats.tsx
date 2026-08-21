import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Clock, 
  Users, 
  Eye, 
  TrendingUp, 
  Smartphone, 
  Monitor, 
  RefreshCw, 
  Layers, 
  BookOpen, 
  Sparkles, 
  CheckCircle, 
  Flame, 
  Calendar,
  Compass,
  ArrowUpRight,
  Activity,
  Award,
  Globe
} from 'lucide-react';

interface EngagementStats {
  summary: {
    totalPageViews: number;
    totalActiveSessions: number;
    totalTimeSpentSeconds: number;
    avgTimePerSessionSeconds: number;
    totalQuizzesAttempted: number;
    totalQuestionsAnswered: number;
  };
  deviceBreakdown: {
    mobile: number;
    desktop: number;
  };
  pageStats: Array<{
    tab: string;
    label: string;
    path: string;
    views: number;
    totalDurationSeconds: number;
    avgDurationSeconds: number;
    sharePercent: number;
    icon: string;
  }>;
  recentActivity: Array<{
    tab: string;
    label: string;
    durationSeconds: number;
    device: string;
    timestamp: string;
  }>;
  popularTests: Array<{
    id: string;
    title: string;
    type: string;
    attempts: number;
    avgScore: number;
  }>;
}

export default function AdminAnalyticsStats() {
  const [stats, setStats] = useState<EngagementStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'today' | '7days' | 'all'>('all');

  const fetchEngagementStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/engagement-stats?range=${timeRange}`);
      if (!res.ok) throw new Error("Failed to load engagement stats");
      const data = await res.json();
      setStats(data);
    } catch (err: any) {
      setError(err.message || "Failed to load statistics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEngagementStats();
  }, [timeRange]);

  const formatSecondsToReadable = (seconds: number) => {
    if (!seconds || seconds <= 0) return '0s';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    if (m === 0) return `${s} सेकंड`;
    return `${m} मिनट ${s} सेकंड`;
  };

  const formatShortTime = (seconds: number) => {
    if (!seconds || seconds <= 0) return '0s';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    if (m === 0) return `${s}s`;
    return `${m}m ${s}s`;
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Title Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-3xl shadow-lg border border-indigo-800/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-300 px-2.5 py-0.5 rounded-full border border-indigo-400/30 flex items-center gap-1">
              <Activity className="h-3 w-3 text-emerald-400 animate-pulse" />
              लाइव यूजर एंगेजमेंट एनालिटिक्स (Realtime Inbuilt Traffic Stats)
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5 pt-1">
            <BarChart3 className="h-6 w-6 text-amber-400" />
            वेबसाइट यूज़र एक्टिविटी व टाइम स्पेंड रिपोर्ट
          </h2>
          <p className="text-xs text-slate-300 font-medium max-w-2xl leading-relaxed">
            देखें कि छात्र किस पेज/टेस्ट पर सबसे ज्यादा समय बिता रहे हैं, औसत समय (Average Time Spent) कितना है और कौन से प्रश्न सबसे ज्यादा पढ़े जा रहे हैं।
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          {/* Time Range Selector */}
          <div className="bg-white/10 p-1 rounded-xl border border-white/20 flex items-center text-xs font-bold">
            <button
              onClick={() => setTimeRange('today')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                timeRange === 'today' ? 'bg-amber-400 text-slate-950 font-extrabold shadow-xs' : 'text-slate-200 hover:text-white'
              }`}
            >
              आज (Today)
            </button>
            <button
              onClick={() => setTimeRange('7days')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                timeRange === '7days' ? 'bg-amber-400 text-slate-950 font-extrabold shadow-xs' : 'text-slate-200 hover:text-white'
              }`}
            >
              7 दिन (7 Days)
            </button>
            <button
              onClick={() => setTimeRange('all')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                timeRange === 'all' ? 'bg-amber-400 text-slate-950 font-extrabold shadow-xs' : 'text-slate-200 hover:text-white'
              }`}
            >
              कुल (All Time)
            </button>
          </div>

          <button
            onClick={fetchEngagementStats}
            disabled={loading}
            className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition border border-emerald-500 cursor-pointer"
            title="रिफ्रेश करें"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>रिफ्रेश</span>
          </button>
        </div>
      </div>

      {loading && !stats && (
        <div className="bg-white rounded-3xl p-12 border border-gray-100 shadow-sm flex flex-col items-center justify-center gap-3 text-center">
          <div className="h-10 w-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-bold text-gray-600">यूज़र एंगेजमेंट और टाइम स्पेंड आँकड़े लोड हो रहे हैं...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-xs font-bold text-red-800 flex items-center justify-between">
          <span>त्रुटि: {error}</span>
          <button onClick={fetchEngagementStats} className="underline text-red-950">पुनः प्रयास करें</button>
        </div>
      )}

      {stats && (
        <>
          {/* 4 KEY METRIC CARDS */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Metric 1: Avg Time per Session */}
            <div className="bg-gradient-to-br from-amber-500 to-amber-600 text-white p-5 rounded-3xl shadow-sm space-y-2 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider text-amber-100">
                  औसत समय (Avg Time)
                </span>
                <Clock className="h-5 w-5 text-amber-200" />
              </div>
              <div className="text-2xl sm:text-3xl font-black tracking-tight">
                {formatSecondsToReadable(stats.summary.avgTimePerSessionSeconds)}
              </div>
              <p className="text-[11px] text-amber-100 font-medium">
                प्रति छात्र वेबसाइट पर बिताया गया औसत समय
              </p>
            </div>

            {/* Metric 2: Total Page Views */}
            <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white p-5 rounded-3xl shadow-sm space-y-2 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider text-emerald-100">
                  कुल पेज व्यूज (Total Views)
                </span>
                <Eye className="h-5 w-5 text-emerald-200" />
              </div>
              <div className="text-2xl sm:text-3xl font-black tracking-tight">
                {stats.summary.totalPageViews.toLocaleString()}
              </div>
              <p className="text-[11px] text-emerald-100 font-medium">
                कुल देखे गए पेजों की संख्या
              </p>
            </div>

            {/* Metric 3: Total Tests Given */}
            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 text-white p-5 rounded-3xl shadow-sm space-y-2 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider text-indigo-100">
                  टेस्ट अटेम्प्ट्स (Quizzes)
                </span>
                <Award className="h-5 w-5 text-indigo-200" />
              </div>
              <div className="text-2xl sm:text-3xl font-black tracking-tight">
                {stats.summary.totalQuizzesAttempted.toLocaleString()}
              </div>
              <p className="text-[11px] text-indigo-100 font-medium">
                {stats.summary.totalQuestionsAnswered.toLocaleString()} कुल प्रश्न छात्रों ने हल किए
              </p>
            </div>

            {/* Metric 4: Device Split */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-950 text-white p-5 rounded-3xl shadow-sm space-y-2 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-300">
                  उपकरण विभाजन (Devices)
                </span>
                <Smartphone className="h-5 w-5 text-slate-300" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black text-amber-400">
                  {stats.deviceBreakdown.mobile}%
                </span>
                <span className="text-xs text-slate-300 font-bold">मोबाइल</span>
                <span className="text-sm text-slate-400 font-normal">|</span>
                <span className="text-lg font-extrabold text-slate-200">
                  {stats.deviceBreakdown.desktop}%
                </span>
                <span className="text-xs text-slate-400 font-bold">डेस्कटॉप</span>
              </div>
              <p className="text-[11px] text-slate-300 font-medium">
                छात्र सबसे ज्यादा मोबाइल से अभ्यास कर रहे हैं
              </p>
            </div>
          </div>

          {/* PAGE-WISE TIME SPENT & POPULARITY TABLE */}
          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-4">
              <div>
                <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-emerald-600" />
                  पेज-वार टाइम स्पेंड एवं छात्र रुझान (Time Spent per Page)
                </h3>
                <p className="text-xs text-gray-500 font-medium mt-0.5">
                  कौन से सेक्शन में छात्र सबसे अधिक समय बिता रहे हैं (रैंकिंग अनुसार):
                </p>
              </div>
              <span className="text-xs font-bold text-gray-500 bg-gray-100 px-3 py-1 rounded-xl">
                कुल {stats.pageStats.length} सक्रिय सेक्शन्स
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-500 font-extrabold uppercase text-[11px] bg-slate-50/80">
                    <th className="py-3 px-4 rounded-l-xl">पेज / सेक्शन का नाम</th>
                    <th className="py-3 px-4">URL पाथ</th>
                    <th className="py-3 px-4 text-center">व्यूज (Views)</th>
                    <th className="py-3 px-4 text-center">औसत समय (Avg Time)</th>
                    <th className="py-3 px-4 text-center">कुल समय (Total Time)</th>
                    <th className="py-3 px-4 rounded-r-xl">एंगेजमेंट शेयर</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {stats.pageStats.map((page, idx) => (
                    <tr key={page.tab} className="hover:bg-slate-50/80 transition group">
                      <td className="py-3.5 px-4 font-extrabold text-gray-900 flex items-center gap-2.5">
                        <span className="h-6 w-6 rounded-lg bg-emerald-100 text-emerald-800 text-[11px] font-black flex items-center justify-center shrink-0">
                          #{idx + 1}
                        </span>
                        <span>{page.label}</span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-gray-500">
                        {page.path}
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-gray-900">
                        <span className="bg-gray-100 px-2.5 py-1 rounded-lg">
                          {page.views.toLocaleString()}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-black text-emerald-700">
                        <span className="bg-emerald-50 border border-emerald-200/60 px-2.5 py-1 rounded-lg">
                          {formatShortTime(page.avgDurationSeconds)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-gray-700">
                        {formatSecondsToReadable(page.totalDurationSeconds)}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2 min-w-[120px]">
                          <div className="flex-1 bg-gray-100 h-2.5 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${
                                idx === 0 ? 'bg-amber-500' : idx === 1 ? 'bg-emerald-600' : 'bg-indigo-500'
                              }`}
                              style={{ width: `${Math.max(5, page.sharePercent)}%` }}
                            ></div>
                          </div>
                          <span className="text-[11px] font-extrabold text-gray-700 w-9 text-right">
                            {page.sharePercent}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* TWO COLUMN SUMMARY: POPULAR TESTS & RECENT LIVE ENGAGEMENT */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Top Popular Test Categories & Sets */}
            <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h3 className="text-sm font-extrabold text-gray-900 flex items-center gap-2">
                  <Flame className="h-4 w-4 text-amber-500 fill-amber-400" />
                  सबसे ज्यादा दिए जाने वाले टेस्ट (Most Popular Tests)
                </h3>
                <span className="text-[11px] text-gray-500 font-bold">लाइव अटेम्प्ट्स</span>
              </div>

              <div className="space-y-3">
                {stats.popularTests.length === 0 ? (
                  <div className="text-center py-8 text-xs text-gray-400 font-medium">
                    अभी तक कोई टेस्ट अटेम्प्ट दर्ज नहीं हुआ है। छात्रों द्वारा टेस्ट पूरा करने पर यहाँ रैंकिंग दिखेगी।
                  </div>
                ) : (
                  stats.popularTests.map((t, i) => (
                    <div key={t.id} className="p-3.5 rounded-2xl border border-gray-100 bg-slate-50/60 hover:bg-emerald-50/50 hover:border-emerald-200 transition flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="h-7 w-7 rounded-xl bg-amber-100 text-amber-900 font-black text-xs flex items-center justify-center shrink-0">
                          {i + 1}
                        </span>
                        <div>
                          <h4 className="text-xs font-extrabold text-gray-900 leading-snug line-clamp-1">{t.title}</h4>
                          <span className="text-[10px] font-bold text-gray-500 bg-white px-2 py-0.5 rounded border border-gray-200 mt-1 inline-block">
                            {t.type}
                          </span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-black text-emerald-700">{t.attempts} अटेम्प्ट्स</p>
                        <p className="text-[10px] font-bold text-gray-500">औसत: {t.avgScore}%</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Recent Live Activity Stream */}
            <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h3 className="text-sm font-extrabold text-gray-900 flex items-center gap-2">
                  <Activity className="h-4 w-4 text-emerald-600" />
                  हालिया गतिविधि स्ट्रीम (Recent User Actions)
                </h3>
                <span className="text-[11px] text-emerald-700 font-black bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Realtime
                </span>
              </div>

              <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                {stats.recentActivity.length === 0 ? (
                  <div className="text-center py-8 text-xs text-gray-400 font-medium">
                    कोई हालिया गतिविधि नहीं। छात्र जैसे ही वेबसाइट पर आएंगे, उनका लाइव टाइम यहाँ दिखेगा।
                  </div>
                ) : (
                  stats.recentActivity.map((act, i) => (
                    <div key={i} className="p-3 rounded-2xl bg-gray-50/80 border border-gray-100 flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2.5">
                        <div className="h-2 w-2 rounded-full bg-emerald-500 shrink-0 animate-ping"></div>
                        <div>
                          <span className="font-extrabold text-gray-900 block leading-tight">{act.label}</span>
                          <span className="text-[10px] text-gray-400 font-medium flex items-center gap-1.5 mt-0.5">
                            <span>{act.device === 'mobile' ? '📱 Mobile' : '💻 Desktop'}</span> • <span>{new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </span>
                        </div>
                      </div>
                      <span className="text-[11px] font-black text-amber-700 bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200 shrink-0">
                        ⏱️ {formatShortTime(act.durationSeconds)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

          {/* GOOGLE ANALYTICS (GA4) INTEGRATION HELPER CARD */}
          <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-md border border-slate-800 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-amber-400/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-400/30">
                <Globe className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-white">
                  गूगल एनालिटिक्स (GA4) और इनबिल्ट एनालिटिक्स का अंतर
                </h3>
                <p className="text-xs text-slate-400 font-medium">
                  आपकी वेबसाइट का इनबिल्ट सिस्टम सीधे डेटाबेस से टेस्ट हल करने और टाइम स्पेंड ट्रैक करता है।
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700/60 space-y-1.5">
                <span className="font-bold text-amber-300 flex items-center gap-1">
                  <CheckCircle className="h-3.5 w-3.5" /> इनबिल्ट डैशबोर्ड (जो आप अभी देख रहे हैं)
                </span>
                <p className="text-slate-300 leading-relaxed">
                  100% रीयल-टाइम डेटा, किस छात्र ने कितने प्रश्न हल किए, किस विषय में सबसे ज्यादा टेस्ट दिए गए, और प्रत्येक पेज पर औसत कितना समय बिताया गया।
                </p>
              </div>
              <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700/60 space-y-1.5">
                <span className="font-bold text-emerald-300 flex items-center gap-1">
                  <CheckCircle className="h-3.5 w-3.5" /> Google Analytics GA4 (Google Console के साथ)
                </span>
                <p className="text-slate-300 leading-relaxed">
                  Google सर्च से किस शहर/राज्य से कितने छात्र आए, सर्च कीवर्ड्स क्या थे, और बाउंस रेट क्या है। (GA4 ID जोड़ने के लिए एडमिन सेटिंग्स का उपयोग करें)।
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
