/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface HeaderProps {
  onOpenTreatise: () => void;
  onOpenSynthesizer: () => void;
  onOpenInstruments: () => void;
  onOpenAksak: () => void;
  onScrollToMap: () => void;
  isAudioPlaying: boolean;
  onToggleAudio: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenTreatise,
  onOpenSynthesizer,
  onOpenInstruments,
  onOpenAksak,
  onScrollToMap,
  isAudioPlaying,
  onToggleAudio,
}) => {
  return (
    <header className="flex items-center justify-between gap-8 px-6 py-4 border-b border-[#594234]/40 bg-[#16110E]/95 backdrop-blur-md sticky top-0 z-40 font-persian" dir="rtl">
      {/* Zone 1: Single text element wordmark */}
      <a
        href="#"
        onClick={(e) => {
          e.preventDefault();
          onScrollToMap();
        }}
        className="text-xl font-bold tracking-wide text-[#F5EEDB] hover:text-[#D97706] transition-colors whitespace-nowrap shrink-0"
      >
        پیوستار آکوستیک
      </a>

      {/* Zone 2: 4–5 clean single-line text navigation links */}
      <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-[#C4B59D]">
        <button
          onClick={onScrollToMap}
          className="hover:text-[#F5EEDB] transition-colors whitespace-nowrap shrink-0"
        >
          نقشه کارتوگرافی
        </button>
        <button
          onClick={onOpenInstruments}
          className="hover:text-[#F5EEDB] transition-colors whitespace-nowrap shrink-0"
        >
          سازهای جفت
        </button>
        <button
          onClick={onOpenSynthesizer}
          className="hover:text-[#F5EEDB] transition-colors whitespace-nowrap shrink-0"
        >
          سینتی‌سایزر ریزپرده‌ای
        </button>
        <button
          onClick={onOpenAksak}
          className="hover:text-[#F5EEDB] transition-colors whitespace-nowrap shrink-0"
        >
          ایقاعات لنگ (آکساک)
        </button>
        <button
          onClick={onOpenTreatise}
          className="hover:text-[#F5EEDB] transition-colors whitespace-nowrap shrink-0"
        >
          رساله پژوهشی
        </button>
      </nav>

      {/* Zone 3: 1 primary action */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onToggleAudio}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-2 shadow-sm ${
            isAudioPlaying
              ? 'bg-[#8B2635] text-white hover:bg-[#9E2A2B]'
              : 'bg-[#D97706] text-[#16110E] hover:bg-[#E5A836]'
          }`}
          aria-label={isAudioPlaying ? 'قطع صدای پیوستار' : 'پخش و شنیدن صدای پیوستار'}
        >
          <span>{isAudioPlaying ? '■ قطع صدای پیوستار' : '▶ شنیدن نوای پیوستار'}</span>
        </button>
      </div>
    </header>
  );
};
