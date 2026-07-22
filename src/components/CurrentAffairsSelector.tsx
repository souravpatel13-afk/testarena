import React, { useState } from 'react';
import { 
  Newspaper, 
  Calendar, 
  BookOpen, 
  ChevronRight,
  CheckCircle2
} from 'lucide-react';
import { CurrentAffairsItem } from '../types';

interface CurrentAffairsSelectorProps {
  items: CurrentAffairsItem[];
}

export default function CurrentAffairsSelector({ items }: CurrentAffairsSelectorProps) {
  const [selectedMonth, setSelectedMonth] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  // Group months
  const months = ['All', ...new Set(items.map(item => item.month).filter(Boolean))];

  // Filter items (only one article per month)
  const filteredItems = items.filter(item => {
    const matchesMonth = selectedMonth === 'All' || item.month === selectedMonth;
    const matchesSearch = item.content_hi.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.month.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesMonth && matchesSearch;
  });

  return (
    <div className="space-y-6 font-sans max-w-7xl mx-auto px-4 py-4 fade-in" id="current-affairs-main">
      {/* Banner */}
      <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-white rounded-3xl border border-emerald-100 p-6 md:p-10 shadow-sm relative overflow-hidden">
        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none">
          <Newspaper className="h-64 w-64 text-emerald-800" />
        </div>
        
        <div className="max-w-2xl space-y-4">
          <span className="text-xs font-bold text-emerald-800 bg-emerald-100/60 px-3 py-1 rounded-full border border-emerald-200 uppercase tracking-wider inline-flex items-center gap-1">
            <Newspaper className="h-3.5 w-3.5" /> मासिक समसामयिकी (Monthly Current Affairs)
          </span>
          <h1 className="text-2xl md:text-4xl font-extrabold text-gray-900 tracking-tight leading-tight">
            समसामयिकी एवं महत्वपूर्ण खबरें (Current Affairs)
          </h1>
          <p className="text-xs md:text-sm text-gray-600 leading-relaxed">
            सभी प्रतियोगी परीक्षाओं के लिए नवीनतम राष्ट्रीय, अंतर्राष्ट्रीय और छत्तीसगढ़ राज्य के महत्वपूर्ण करेंट अफेयर्स का मासिक संकलन। अपनी तैयारी को अपडेट रखने के लिए नियमित रूप से अध्ययन करें।
          </p>

          {/* Filters & Search Row */}
          <div className="flex flex-col sm:flex-row items-center gap-4 pt-2 w-full">
            <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-gray-200 w-full sm:w-auto shrink-0">
              <span className="text-xs font-bold text-gray-400 flex items-center gap-1 shrink-0">
                <Calendar className="h-3.5 w-3.5" /> माह (Month):
              </span>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="text-xs bg-transparent focus:outline-none text-gray-800 font-bold pr-4 cursor-pointer border-0"
              >
                {months.map((month, idx) => (
                  <option key={idx} value={month}>
                    {month === 'All' ? 'सभी महीने' : month}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative w-full sm:w-64">
              <input
                type="text"
                placeholder="खोजें (Search current affairs...)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-4 pr-4 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 w-full bg-white text-gray-800 font-medium"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid List grouped by Month */}
      <div className="space-y-8">
        <div className="flex items-center justify-between border-b border-gray-100 pb-2">
          <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest">महत्वपूर्ण समसामयिकी लेख</h2>
          <span className="text-xs bg-emerald-50 text-emerald-800 px-2.5 py-0.5 rounded-full font-bold">
            {filteredItems.length} मासिक लेख
          </span>
        </div>

        {(() => {
          // Group the filtered items by month
          const groupedFilteredItems: Record<string, CurrentAffairsItem[]> = {};
          filteredItems.forEach(item => {
            const m = item.month || "Other";
            if (!groupedFilteredItems[m]) {
              groupedFilteredItems[m] = [];
            }
            groupedFilteredItems[m].push(item);
          });

          // Sort months by order of appearance in the original items list
          const monthsWithItems = Object.keys(groupedFilteredItems).sort((a, b) => {
            const idxA = items.findIndex(item => item.month === a);
            const idxB = items.findIndex(item => item.month === b);
            return idxA - idxB;
          });

          return monthsWithItems.map((monthName) => {
            const monthItems = groupedFilteredItems[monthName];
            return (
              <div key={monthName} className="space-y-4">
                {/* Month Section Header */}
                <div className="flex items-center gap-3 border-l-4 border-emerald-600 pl-3">
                  <h3 className="text-base font-extrabold text-gray-800 uppercase tracking-wide">
                    {monthName}
                  </h3>
                  <span className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-100 px-2 py-0.5 rounded-md font-bold font-sans">
                    {monthItems.length} Articles
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {monthItems.map((item) => {
                    const isExpanded = expandedItem === item.id;
                    return (
                      <div 
                        key={item.id}
                        className={`bg-white rounded-2xl border transition duration-200 p-5 space-y-4 shadow-sm hover:shadow-md ${
                          isExpanded ? 'border-emerald-300 ring-1 ring-emerald-500/10' : 'border-gray-100'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                          <div className="space-y-1">
                            <h4 
                              className="text-sm font-extrabold text-gray-800 hover:text-emerald-800 transition cursor-pointer" 
                              onClick={() => setExpandedItem(isExpanded ? null : item.id)}
                            >
                              {item.month} - मासिक समसामयिकी विवरण
                            </h4>
                          </div>

                          <button
                            onClick={() => setExpandedItem(isExpanded ? null : item.id)}
                            className="text-xs text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-0.5 shrink-0 select-none self-start sm:self-auto"
                          >
                            {isExpanded ? 'संक्षिप्त करें' : 'विस्तार से पढ़ें'}
                            <ChevronRight className={`h-4 w-4 transition ${isExpanded ? 'rotate-90' : ''}`} />
                          </button>
                        </div>

                        {isExpanded && (
                          <div className="pt-2 border-t border-gray-100 space-y-4 animate-in fade-in duration-200">
                            {/* Hindi Content */}
                            <div className="space-y-1">
                              <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap font-sans">
                                {item.content_hi}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          });
        })()}

        {filteredItems.length === 0 && (
          <div className="text-center py-12 bg-white border border-gray-100 rounded-3xl text-gray-400 text-xs font-semibold">
            चयनित माह में कोई समसामयिकी लेख उपलब्ध नहीं है।
          </div>
        )}
      </div>
    </div>
  );
}
