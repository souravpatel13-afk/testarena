/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  Share2, 
  Send, 
  ExternalLink, 
  MessageSquare,
  Sparkles
} from 'lucide-react';
import { 
  ShareOptions, 
  generateShareMessage, 
  shareToWhatsApp, 
  shareToTelegram, 
  shareNative 
} from '../utils/shareUtils';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  options: ShareOptions;
}

export default function ShareModal({ isOpen, onClose, options }: ShareModalProps) {
  const [copiedType, setCopiedType] = useState<'message' | 'link' | null>(null);

  if (!isOpen) return null;

  const { title, text, url } = generateShareMessage(options);
  const canNativeShare = typeof navigator !== 'undefined' && !!navigator.share;

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedType('message');
      setTimeout(() => setCopiedType(null), 2500);
    } catch (e) {
      console.error('Failed to copy text', e);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedType('link');
      setTimeout(() => setCopiedType(null), 2500);
    } catch (e) {
      console.error('Failed to copy URL', e);
    }
  };

  const handleWhatsApp = () => {
    shareToWhatsApp(text);
  };

  const handleTelegram = () => {
    shareToTelegram(text, url);
  };

  const handleNative = async () => {
    await shareNative({ title, text, url });
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-5 animate-in zoom-in-95 duration-200 text-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-100">
              <Share2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 leading-tight">
                मित्रों व ग्रुप्स में शेयर करें
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Share this test with pre-typed message
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Pre-typed message preview box */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" /> फॉरवर्ड होने वाला संदेश (Message Preview):
            </span>
            <span className="text-[10px] bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded-md border border-emerald-100">
              Auto-Typed
            </span>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 max-h-48 overflow-y-auto font-sans text-xs text-slate-700 whitespace-pre-wrap leading-relaxed select-text shadow-inner">
            {text}
          </div>
        </div>

        {/* Action Buttons Grid */}
        <div className="space-y-3 pt-1">
          {/* Quick Sharing Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* WhatsApp */}
            <button
              onClick={handleWhatsApp}
              className="bg-[#25D366] hover:bg-[#20bd5a] text-white font-extrabold py-3 px-4 rounded-2xl text-xs flex items-center justify-center gap-2 transition shadow-sm cursor-pointer hover:shadow-md transform active:scale-98"
            >
              <svg className="h-4 w-4 fill-white shrink-0" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
              </svg>
              WhatsApp पर भेजें
            </button>

            {/* Telegram */}
            <button
              onClick={handleTelegram}
              className="bg-[#229ED9] hover:bg-[#1f8fc4] text-white font-extrabold py-3 px-4 rounded-2xl text-xs flex items-center justify-center gap-2 transition shadow-sm cursor-pointer hover:shadow-md transform active:scale-98"
            >
              <Send className="h-4 w-4 fill-white shrink-0" />
              Telegram पर भेजें
            </button>
          </div>

          {/* Native Share & Copy Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              onClick={handleCopyMessage}
              className={`py-3 px-4 rounded-2xl text-xs font-bold transition flex items-center justify-center gap-2 border cursor-pointer ${
                copiedType === 'message'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
              }`}
            >
              {copiedType === 'message' ? (
                <>
                  <Check className="h-4 w-4 text-emerald-600" /> पूरा मैसेज कॉपी हो गया!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 text-slate-500" /> पूरा मैसेज कॉपी करें
                </>
              )}
            </button>

            {canNativeShare ? (
              <button
                onClick={handleNative}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-4 rounded-2xl text-xs flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Share2 className="h-4 w-4" /> अन्य ऐप्स में शेयर करें
              </button>
            ) : (
              <button
                onClick={handleCopyLink}
                className={`py-3 px-4 rounded-2xl text-xs font-bold transition flex items-center justify-center gap-2 border cursor-pointer ${
                  copiedType === 'link'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                {copiedType === 'link' ? (
                  <>
                    <Check className="h-4 w-4 text-emerald-600" /> लिंक कॉपी हो गया!
                  </>
                ) : (
                  <>
                    <ExternalLink className="h-4 w-4 text-slate-500" /> केवल लिंक कॉपी करें
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Feedback helper note */}
        <p className="text-[11px] text-center text-slate-400 font-medium">
          💡 आप इस मैसेज को सीधे किसी भी WhatsApp ग्रुप या Telegram चैनल में भेज सकते हैं।
        </p>

      </div>
    </div>
  );
}
