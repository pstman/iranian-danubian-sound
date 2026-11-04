/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { Header } from './components/Header';
import { CartographicCanvas } from './components/CartographicCanvas';
import { MicrotonalSynthesizer } from './components/MicrotonalSynthesizer';
import { AksakRhythmPlayer } from './components/AksakRhythmPlayer';
import { PairedInstrumentsModal } from './components/PairedInstrumentsModal';
import { NodeDetailDrawer } from './components/NodeDetailDrawer';
import { ScholarlyTreatiseModal } from './components/ScholarlyTreatiseModal';
import {
  CartographicNode,
  TRANSMISSION_ROUTES,
  PAIRED_INSTRUMENT_STUDIES,
} from './utils/acousticMath';
import { audioEngine } from './utils/audioEngine';

export default function App() {
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>('romani-diaspora');
  const [selectedNode, setSelectedNode] = useState<CartographicNode | null>(null);
  const [activeInstrumentPlate, setActiveInstrumentPlate] = useState<string | null>(null);
  const [isTreatiseOpen, setIsTreatiseOpen] = useState(false);
  const [isAudioActive, setIsAudioActive] = useState(false);
  const [activeSynthSystemId, setActiveSynthSystemId] = useState<string>('dastgah-shur');

  const mapSectionRef = useRef<HTMLDivElement | null>(null);
  const synthSectionRef = useRef<HTMLDivElement | null>(null);
  const instrumentsSectionRef = useRef<HTMLDivElement | null>(null);
  const aksakSectionRef = useRef<HTMLDivElement | null>(null);

  const selectedRoute = TRANSMISSION_ROUTES.find(r => r.id === selectedRouteId);

  const handleToggleMasterAudio = () => {
    if (isAudioActive) {
      audioEngine.stopAll();
      setIsAudioActive(false);
    } else {
      setIsAudioActive(true);
      audioEngine.playScaleDemonstration('dastgah-shur', undefined, () => {
        setIsAudioActive(false);
      });
    }
  };

  const scrollToSection = (ref: React.RefObject<HTMLDivElement | null>) => {
    if (ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#181310] text-[#EDE0C8] flex flex-col font-persian selection:bg-[#8B2635] selection:text-[#FFF5E6] text-right" dir="rtl">
      {/* 3-Zone Top Bar Navigation */}
      <Header
        onOpenTreatise={() => setIsTreatiseOpen(true)}
        onOpenSynthesizer={() => scrollToSection(synthSectionRef)}
        onOpenInstruments={() => scrollToSection(instrumentsSectionRef)}
        onOpenAksak={() => scrollToSection(aksakSectionRef)}
        onScrollToMap={() => scrollToSection(mapSectionRef)}
        isAudioPlaying={isAudioActive}
        onToggleAudio={handleToggleMasterAudio}
      />

      {/* Main Reading & Artwork Canvas Area */}
      <main className="flex-1 w-full max-w-[1560px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-10">
        {/* Curatorial Hero Header in Persian */}
        <section className="text-center max-w-4xl mx-auto space-y-2 pt-2">
          <div className="flex items-center justify-center gap-2 text-xs tracking-widest uppercase text-[#D97706] font-bold">
            <span>اثر کارتوگرافی تاریخی و آکادمیک</span>
            <span aria-hidden="true">·</span>
            <span>سبک رنسانس و باروک</span>
            <span aria-hidden="true">·</span>
            <span>قالب عریض ۲۱:۹</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#F5EEDB] tracking-wide" style={{ textWrap: 'balance' }}>
            پیوستار آکوستیک: جهان صوتی ایران تا دانوب
          </h1>

          <p className="text-base sm:text-lg text-[#C4B59D]" style={{ textWrap: 'balance' }}>
            ردیابی مهاجرت‌های مدال، ارگانولوژی سازها و اوزان لنگ از فلات کهن ایران، از مسیر آناتولی و بالکان، تا حوضه کارپات و دانوب (رومانی)
          </p>

          <p className="text-xs text-[#1E555C] tracking-wide pt-1">
            از اصفهان، ری و شیراز تا قسطنطنیه، تسالونیکی، سارایوو، بخارست، یاش و مارامورش
          </p>
        </section>

        {/* 1. Master 21:9 Cartographic Canvas Section */}
        <section ref={mapSectionRef} className="space-y-4">
          <div className="flex items-center justify-between border-b border-[#594234]/40 pb-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-[#F5EEDB]">
                ۱. نقشه کارتوگرافی پیوستار (قالب عریض ۲۱:۹)
              </span>
              <span className="text-xs text-[#C4B59D] hidden sm:inline">
                · روی ایستگاه‌ها کلیک کنید یا خطوط درخشان را برای روشن‌شدن شاهراه‌ها انتخاب نمایید
              </span>
            </div>
            <div className="text-xs text-[#D97706]">
              مقیاس: ۱:۳,۵۰۰,۰۰۰ تصویر مرکاتور رنسانس
            </div>
          </div>

          {/* Canvas Rendering */}
          <CartographicCanvas
            selectedRouteId={selectedRouteId}
            onSelectRoute={setSelectedRouteId}
            selectedNode={selectedNode}
            onSelectNode={setSelectedNode}
            onOpenInstrumentPlate={setActiveInstrumentPlate}
            isPlayingAudio={isAudioActive}
          />

          {/* Active Route Narrative Banner in Persian */}
          {selectedRoute && (
            <div className="p-4 bg-[#1F1915] border border-[#594234]/60 rounded-xl shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full inline-block"
                    style={{ backgroundColor: selectedRoute.color }}
                  />
                  <h3 className="text-base font-bold text-[#F5EEDB]">
                    {selectedRoute.persianName}
                  </h3>
                  <span className="text-xs text-[#C4B59D]">
                    ({selectedRoute.epoch})
                  </span>
                </div>
                <p className="text-xs text-[#C4B59D] leading-relaxed max-w-4xl">
                  {selectedRoute.historicalNarrative}
                </p>
                <div className="text-xs text-[#E5A836]">
                  <strong>میراث و دستاورد موسیقایی: </strong>
                  {selectedRoute.musicalContributions}
                </div>
              </div>

              <button
                onClick={() => setSelectedRouteId(null)}
                className="px-3 py-1.5 bg-[#2C221C] hover:bg-[#781D22] text-[#EDE0C8] text-xs rounded transition whitespace-nowrap"
              >
                پاک‌کردن فیلتر مسیر
              </button>
            </div>
          )}
        </section>

        {/* 2. Paired Instrument Organology Studies Section */}
        <section ref={instrumentsSectionRef} className="space-y-4 pt-4">
          <div className="border-b border-[#594234]/40 pb-2">
            <h2 className="text-xl font-bold text-[#F5EEDB]">
              ۲. سازهای جفت در امتداد شاهراه‌های فرهنگی
            </h2>
            <p className="text-xs text-[#C4B59D] mt-0.5">
              سازشناسی تطبیقی که نشان می‌دهد سازهای زهی و بادی چگونه با گذر از مرزهای کهن امپراتوری‌ها دگرگون و بارور گشتند
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PAIRED_INSTRUMENT_STUDIES.map(study => (
              <div
                key={study.id}
                className="bg-[#1F1915] border border-[#594234]/60 rounded-xl p-5 shadow-xl flex flex-col justify-between hover:border-[#D97706]/70 transition-all group"
              >
                <div>
                  <span className="text-[10.5px] uppercase tracking-wider font-bold text-[#D97706]">
                    جفت سازهای پیوستار
                  </span>
                  <h3 className="text-lg font-bold text-[#F5EEDB] group-hover:text-[#D97706] transition-colors mt-1">
                    {study.persianTitle}
                  </h3>
                  <p className="text-xs text-[#C4B59D] mt-0.5">
                    {study.persianSubtitle}
                  </p>

                  <div className="mt-3 text-xs text-[#C4B59D] space-y-1.5 border-t border-[#594234]/30 pt-3">
                    <div>
                      <strong className="text-[#F5EEDB]">شرق: </strong>
                      {study.instrumentEast.name} ({study.instrumentEast.culture})
                    </div>
                    <div>
                      <strong className="text-[#F5EEDB]">غرب (دانوب): </strong>
                      {study.instrumentWest.name} ({study.instrumentWest.culture})
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[#594234]/30 flex items-center gap-2">
                  <button
                    onClick={() => setActiveInstrumentPlate(study.id)}
                    aria-label={`بررسی تابلوی کنده‌کاری ${study.persianTitle}`}
                    className="flex-1 py-2 px-3 bg-[#781D22] hover:bg-[#8B2635] text-[#F5EEDB] rounded text-xs font-bold tracking-wider transition text-center shadow"
                  >
                    بررسی تابلوی کنده‌کاری
                  </button>
                  <button
                    onClick={() => {
                      setActiveSynthSystemId(study.audioModeId);
                      scrollToSection(synthSectionRef);
                    }}
                    aria-label={`تنظیم مقام ${study.persianTitle} در سینتی‌سایزر`}
                    className="py-2 px-3 bg-[#2A6F78] hover:bg-[#1E555C] text-[#F5EEDB] rounded text-xs font-bold transition shadow"
                    title="بارگذاری مقام در سینتی‌سایزر"
                  >
                    کوک
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 3. Microtonal Synthesizer & Monochord Section */}
        <section ref={synthSectionRef} className="space-y-4 pt-4">
          <div className="border-b border-[#594234]/40 pb-2">
            <h2 className="text-xl font-bold text-[#F5EEDB]">
              ۳. سینتی‌سایزر آکوستیک و فواصل میکروتنال
            </h2>
            <p className="text-xs text-[#C4B59D] mt-0.5">
              شنیدن دقیق ریزپرده‌ها: کُرُن ایرانی (۵۰- سنت)، کمای عثمانی (۲۲.۶- سنت) و فواصل ریزپرده‌ای دوئینای کارپاتی رومانی
            </p>
          </div>

          <MicrotonalSynthesizer
            initialSystemId={activeSynthSystemId}
            onPlayingStateChange={setIsAudioActive}
          />
        </section>

        {/* 4. Aksak Rhythms & Metric Structures */}
        <section ref={aksakSectionRef} className="space-y-4 pt-4">
          <div className="border-b border-[#594234]/40 pb-2">
            <h2 className="text-xl font-bold text-[#F5EEDB]">
              ۴. ایقاعات لنگ (آکساک): پیوستار متریک و ریتمیک
            </h2>
            <p className="text-xs text-[#C4B59D] mt-0.5">
              تجربه اوزان ریتمیک نامتقارن (۷/۸، ۵/۸، ۹/۸) که رقص‌های آناتولی و دربار عثمانی را به ژامپاراله و رقص‌های دانوب پیوند می‌دهد
            </p>
          </div>

          <AksakRhythmPlayer />
        </section>
      </main>

      {/* Popups & Drawers */}
      <PairedInstrumentsModal
        studyId={activeInstrumentPlate}
        onClose={() => setActiveInstrumentPlate(null)}
      />

      <NodeDetailDrawer
        node={selectedNode}
        onClose={() => setSelectedNode(null)}
        onOpenSynthesizerForNode={(systemId) => {
          setActiveSynthSystemId(systemId);
          setSelectedNode(null);
          scrollToSection(synthSectionRef);
        }}
      />

      <ScholarlyTreatiseModal
        isOpen={isTreatiseOpen}
        onClose={() => setIsTreatiseOpen(false)}
      />

      {/* Archival Editorial Footer */}
      <footer className="mt-16 border-t border-[#594234]/40 bg-[#120E0C] py-8 px-6 text-center text-xs text-[#C4B59D] space-y-2">
        <p className="font-bold tracking-wide text-[#D97706]">
          پیوستار آکوستیک • آکادمی پژوهش‌های موسیقی‌شناسی دانوب و ایران
        </p>
        <p className="text-[#8C7A68]">
          مبتنی بر رسالات و پژوهش‌های صفی‌الدین ارموی، شاهزاده دیمیتری کانتمیر، بلا بارتوک و کنستانتین برائیلویو.
        </p>
        <div className="flex items-center justify-center gap-4 text-[11px] text-[#594234] pt-2">
          <span>کارتوگرافی رنسانس و خط پارسی</span>
          <span aria-hidden="true">·</span>
          <span>موتور صوتی فواصل میکروتنال</span>
          <span aria-hidden="true">·</span>
          <span>قالب عریض ۲۱:۹</span>
        </div>
      </footer>
    </div>
  );
}
