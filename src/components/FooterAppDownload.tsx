import React, { useEffect, useState } from 'react';
import {
  Download,
  ShieldCheck,
  MapPin,
  Home,
  Building2,
  Trees,
  CheckCircle2,
  PhoneCall,
  QrCode,
  Smartphone,
  FolderArchive,
  Star,
  Wifi,
  BatteryCharging,
  Signal,
  Search,
} from 'lucide-react';
import { motion } from 'motion/react';
import { ManaGruhamLogo } from './ManaGruhamLogo';
import propHouseImg from '../assets/images/prop_house_modern_1794718228623.jpg';
import propPlotImg from '../assets/images/prop_plot_farmland_1794718229886.jpg';
import propApartmentImg from '../assets/images/prop_apartment_luxury_1794718228639.jpg';

type MockupCategory = 'all' | 'houses' | 'plots' | 'apartments';
type MockupViewMode = 'home' | 'launcher';

interface ApkMetadata {
  available: boolean;
  fileName: string;
  downloadUrl: string;
  packageName: string;
  versionName: string;
  sizeBytes: number;
  sizeFormatted: string;
}

const AndroidRobotIcon: React.FC<{ className?: string }> = ({ className = 'w-7 h-7' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
    className={className}
  >
    <path d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.5511 0 .9993.4482.9993.9993.0001.5511-.4482.9997-.9993.9997m-11.046 0c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.5511 0 .9993.4482.9993.9993 0 .5511-.4482.9997-.9993.9997m11.4045-6.02l1.9973-3.4592a.416.416 0 00-.1521-.5676.416.416 0 00-.5676.1521l-2.0223 3.503C15.5902 8.2439 13.8533 7.8508 12 7.8508s-3.5902.3931-5.1367 1.0989L4.841 5.4467a.4161.4161 0 00-.5677-.1521.4157.4157 0 00-.1521.5676l1.9973 3.4592C2.6889 11.1867.3432 14.6589 0 18.761h24c-.3435-4.1021-2.6892-7.5743-6.1185-9.4396" />
  </svg>
);

const SHOWCASE_PROPERTIES = [
  {
    id: 'house',
    category: 'houses' as const,
    labelTe: 'స్వతంత్ర ఇళ్ళు',
    title: '3 BHK స్వతంత్ర ఇల్లు',
    location: 'తూరంగి, కాకినాడ',
    price: '₹65 లక్షలు',
    specs: '1850 చ.అ · 200 గజాలు',
    image: propHouseImg,
    gradientFallback: 'from-emerald-800 to-teal-900',
    accentBorder: 'border-emerald-300/60',
  },
  {
    id: 'plot',
    category: 'plots' as const,
    labelTe: 'ఓపెన్ ప్లాట్లు & భూమి',
    title: 'CRDA వెంచర్ ఓపెన్ ప్లాట్',
    location: 'గోరంట్ల, గుంటూరు',
    price: '₹28 లక్షలు',
    specs: '240 గజాలు · 100% వాస్తు',
    image: propPlotImg,
    gradientFallback: 'from-amber-700 to-orange-900',
    accentBorder: 'border-amber-300/60',
  },
  {
    id: 'apartment',
    category: 'apartments' as const,
    labelTe: 'లగ్జరీ అపార్ట్‌మెంట్లు',
    title: '3 BHK గేటెడ్ కమ్యూనిటీ ఫ్లాట్',
    location: 'బెంజ్ సర్కిల్, విజయవాడ',
    price: '₹54 లక్షలు',
    specs: '1540 చ.అ · కార్ పార్కింగ్',
    image: propApartmentImg,
    gradientFallback: 'from-indigo-800 to-purple-900',
    accentBorder: 'border-sky-300/60',
  },
];

export const FooterAppDownload: React.FC = () => {
  const [apkInfo, setApkInfo] = useState<ApkMetadata>({
    available: false,
    fileName: 'ManaGruham_RealApp.apk',
    downloadUrl: '/ManaGruham_AndroidProject.zip',
    packageName: 'com.managruham.realapp',
    versionName: '2.0.0',
    sizeBytes: 0,
    sizeFormatted: 'Android 7.0+',
  });
  const [downloadTriggered, setDownloadTriggered] = useState(false);
  const [mockupCategory, setMockupCategory] = useState<MockupCategory>('all');
  const [mockupView, setMockupView] = useState<MockupViewMode>('home');

  useEffect(() => {
    let active = true;
    fetch('/api/apk-info')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (active && data) {
          setApkInfo(data);
        }
      })
      .catch(() => {
        // Ignore network errors cleanly
      });
    return () => {
      active = false;
    };
  }, []);

  const visibleMockupCards =
    mockupCategory === 'all'
      ? SHOWCASE_PROPERTIES
      : SHOWCASE_PROPERTIES.filter((item) => item.category === mockupCategory);

  const originUrl =
    typeof window !== 'undefined'
      ? window.location.origin
      : 'https://ais-pre-h6q6uvhlkysrts2zjytsqs-130060079220.asia-southeast1.run.app';
  const apkDirectUrl = `${originUrl}/ManaGruham_RealApp.apk`;

  const handleDownloadClick = () => {
    setDownloadTriggered(true);
    setTimeout(() => setDownloadTriggered(false), 6000);
  };

  return (
    <section
      id="app-footer-qr-section"
      aria-labelledby="apk-download-heading"
      className="relative my-6 overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-950 via-teal-900 to-indigo-950 border border-emerald-400/25 shadow-2xl text-white"
    >
      {/* Top Emerald -> Gold -> Orange Decorative Accent Bar */}
      <div className="h-1.5 w-full bg-gradient-to-r from-emerald-400 via-amber-400 to-orange-500" />

      {/* Soft Ambient Color Glows */}
      <div className="pointer-events-none absolute -top-28 -left-24 h-80 w-80 rounded-full bg-emerald-400/20 blur-3xl" />
      <div className="pointer-events-none absolute top-1/3 right-1/4 h-72 w-72 rounded-full bg-amber-400/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 -right-20 h-80 w-80 rounded-full bg-orange-500/15 blur-3xl" />

      <div id="mana-gruham-apk-download-section" className="relative z-10 p-5 sm:p-8 lg:p-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          {/* LEFT COLUMN: Official House Logo + Green/Gold/Orange Brand Typography + DOWNLOAD APK Button + Real Property Showcase */}
          <div className="lg:col-span-7 flex flex-col items-center lg:items-start text-center lg:text-left space-y-6">
            {/* Brand Identity Lockup ABOVE the Download Button */}
            <div className="flex flex-col items-center lg:items-start space-y-4">
              {/* Prominent Official House Logo */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35 }}
                className="p-1.5 rounded-[28px] bg-gradient-to-br from-emerald-400 via-amber-300 to-orange-500 shadow-2xl shadow-emerald-950/60"
              >
                <div className="bg-white rounded-[23px] p-2.5 sm:p-3">
                  <ManaGruhamLogo size={88} className="w-20 h-20 sm:w-[88px] sm:h-[88px] block" />
                </div>
              </motion.div>

              {/* App Name in Green, Gold & Orange Typography + Telugu Subtitle + Verified Tagline */}
              <div className="space-y-1.5">
                <h2
                  id="apk-download-heading"
                  className="font-display font-extrabold text-4xl sm:text-5xl tracking-tight leading-none bg-gradient-to-r from-emerald-300 via-amber-300 to-orange-400 bg-clip-text text-transparent"
                  style={{ textWrap: 'balance' }}
                >
                  Mana Gruham
                </h2>

                <p className="text-xl sm:text-2xl font-extrabold text-amber-100 tracking-tight">
                  మన గృహం రియల్ యాప్
                </p>

                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 pt-1 text-xs sm:text-sm font-bold text-emerald-100">
                  <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
                  <span>100% Verified Listings</span>
                  <span aria-hidden="true" className="text-amber-300/70">·</span>
                  <span className="text-amber-200 font-mono tabular-nums">
                    v{apkInfo.versionName} APK
                  </span>
                  {apkInfo.sizeBytes > 0 && (
                    <>
                      <span aria-hidden="true" className="text-amber-300/70">·</span>
                      <span className="text-emerald-200 font-mono tabular-nums">
                        {apkInfo.sizeFormatted}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <p className="text-sm sm:text-base text-emerald-50/90 max-w-xl leading-relaxed">
              ఆంధ్రప్రదేశ్ అంతటా స్వతంత్ర ఇళ్ళు, ఓపెన్ ప్లాట్లు, అపార్ట్‌మెంట్లు & వ్యవసాయ భూములను మీ Android మొబైల్‌లో వేగంగా వెతకండి, డైరెక్ట్ యజమానికి కాల్ చేయండి.
            </p>

            {/* LARGE, ATTRACTIVE GREEN & GOLD DOWNLOAD APK BUTTON */}
            <div className="w-full sm:w-auto space-y-3">
              <a
                id="mana-gruham-download-apk-btn"
                href={apkInfo.available ? '/ManaGruham_RealApp.apk' : '/ManaGruham_AndroidProject.zip'}
                download={apkInfo.available ? 'ManaGruham_RealApp.apk' : 'ManaGruham_AndroidProject.zip'}
                onClick={handleDownloadClick}
                className="group w-full sm:w-auto min-h-[64px] px-7 sm:px-9 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-400 via-lime-300 to-amber-400 hover:from-emerald-300 hover:via-amber-300 hover:to-orange-300 text-emerald-950 font-black shadow-2xl shadow-black/40 border-2 border-amber-200 active:scale-[0.98] transition-all flex items-center justify-center gap-4 cursor-pointer"
              >
                <span className="w-11 h-11 rounded-xl bg-emerald-950/12 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <AndroidRobotIcon className="w-7 h-7 text-emerald-950" />
                </span>
                <span className="flex flex-col items-start text-left leading-tight">
                  <span className="text-lg sm:text-xl font-black tracking-wide whitespace-nowrap">
                    {apkInfo.available ? 'DOWNLOAD APK' : 'DOWNLOAD ANDROID APP'}
                  </span>
                  <span className="text-[11px] sm:text-xs font-bold text-emerald-900 whitespace-nowrap">
                    {apkInfo.available
                      ? `Official Android App · ${apkInfo.sizeFormatted}`
                      : 'Android Studio APK Project · 6.0 MB ZIP'}
                  </span>
                </span>
                <span className="w-10 h-10 rounded-xl bg-emerald-950 text-amber-300 flex items-center justify-center shrink-0 ml-1 group-hover:translate-y-0.5 transition-transform">
                  <Download className="w-5 h-5" />
                </span>
              </a>

              {downloadTriggered && (
                <div
                  role="status"
                  className="flex items-center justify-center lg:justify-start gap-2 text-xs sm:text-sm font-bold text-emerald-200"
                >
                  <ShieldCheck className="w-4 h-4 text-amber-300 shrink-0" />
                  <span>
                    {apkInfo.available
                      ? 'ManaGruham_RealApp.apk డౌన్‌లోడ్ ప్రారంభమైంది! పూర్తయ్యాక ఫైల్‌పై ట్యాప్ చేసి Install చేయండి.'
                      : 'ManaGruham_AndroidProject.zip డౌన్‌లోడ్ ప్రారంభమైంది! Android Studio లో Build APK చేయండి లేదా మొబైల్‌లో PWA Install నొక్కండి.'}
                  </span>
                </div>
              )}

              {/* Compact Secondary Utility Actions (Zero Pill Clutter) */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-x-5 gap-y-2 pt-1 text-xs font-semibold text-emerald-100/90">
                <a
                  href="/ManaGruham_AndroidProject.zip"
                  download="ManaGruham_AndroidProject.zip"
                  className="inline-flex items-center gap-1.5 hover:text-amber-300 transition-colors underline-offset-4 hover:underline min-h-[36px]"
                >
                  <FolderArchive className="w-3.5 h-3.5 text-amber-300" />
                  <span>Android Studio Source ZIP</span>
                </a>
                <a
                  href="tel:+918977776111"
                  className="inline-flex items-center gap-1.5 hover:text-amber-300 transition-colors font-mono tabular-nums underline-offset-4 hover:underline min-h-[36px]"
                >
                  <PhoneCall className="w-3.5 h-3.5 text-emerald-300" />
                  <span>+91 8977776111 (శివ రాఘవ)</span>
                </a>
              </div>
            </div>

            {/* PROPERTY IMAGES GALLERY: HOUSES, PLOTS & APARTMENTS */}
            <div className="w-full pt-2 space-y-2.5">
              <div className="flex items-center justify-between text-xs font-bold text-amber-200">
                <span>యాప్‌లో లభించే ప్రధాన ఆస్తులు (Houses, Plots & Apartments)</span>
                <span className="text-emerald-200 font-mono tabular-nums hidden sm:inline">100% Verified</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {SHOWCASE_PROPERTIES.map((prop) => (
                  <div
                    key={prop.id}
                    className={`group relative overflow-hidden rounded-2xl border ${prop.accentBorder} bg-gradient-to-br ${prop.gradientFallback} shadow-lg`}
                  >
                    <div className="relative aspect-[4/3] w-full overflow-hidden">
                      <img
                        src={prop.image}
                        alt={`${prop.title} - ${prop.location}`}
                        referrerPolicy="no-referrer"
                        loading="lazy"
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />
                      <div className="absolute inset-x-0 bottom-0 p-3 text-left">
                        <p className="text-[11px] font-bold text-amber-300 truncate">
                          {prop.labelTe}
                        </p>
                        <p className="text-xs font-extrabold text-white truncate">
                          {prop.title}
                        </p>
                        <div className="flex items-center justify-between text-[10px] text-emerald-100 mt-0.5 font-mono tabular-nums">
                          <span className="truncate">{prop.location}</span>
                          <span className="font-bold text-amber-200 shrink-0 ml-1">{prop.price}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Interactive Android Mobile Mockup with App Home Screen + Home Icon Preview + Scan QR */}
          <div className="lg:col-span-5 flex flex-col items-center space-y-4">
            {/* Switch between Live App Home Screen vs Phone Launcher Icon Preview */}
            <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-black/30 border border-white/15">
              <button
                type="button"
                onClick={() => setMockupView('home')}
                className={`min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  mockupView === 'home'
                    ? 'bg-gradient-to-r from-emerald-400 to-amber-400 text-emerald-950 shadow-sm'
                    : 'text-emerald-100 hover:text-white'
                }`}
              >
                యాప్ హోమ్ స్క్రీన్
              </button>
              <button
                type="button"
                onClick={() => setMockupView('launcher')}
                className={`min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  mockupView === 'launcher'
                    ? 'bg-gradient-to-r from-emerald-400 to-amber-400 text-emerald-950 shadow-sm'
                    : 'text-emerald-100 hover:text-white'
                }`}
              >
                మొబైల్ హోమ్ ఐకాన్
              </button>
            </div>

            {/* ANDROID MOBILE DEVICE FRAME */}
            <div className="relative w-full max-w-[318px] rounded-[42px] bg-slate-900 p-2.5 shadow-2xl border-[3px] border-amber-300/60 ring-1 ring-white/15">
              {/* Android Screen Inner Canvas */}
              <div className="relative rounded-[32px] overflow-hidden bg-slate-50 text-slate-900 shadow-inner min-h-[545px] flex flex-col">
                {/* Punch-Hole Camera & Android Status Bar */}
                <div className="relative flex items-center justify-between px-5 pt-2.5 pb-1.5 bg-emerald-700 text-white text-[10px] font-bold font-mono tabular-nums">
                  <span>9:41</span>
                  <div className="w-3 h-3 rounded-full bg-slate-950 border border-slate-700" aria-hidden="true" />
                  <div className="flex items-center gap-1">
                    <Signal className="w-3 h-3" />
                    <Wifi className="w-3 h-3" />
                    <BatteryCharging className="w-3.5 h-3.5 text-amber-300" />
                  </div>
                </div>

                {mockupView === 'home' ? (
                  <>
                    {/* Permanent Sticky App Header Inside Android Mockup */}
                    <div className="bg-white border-b border-emerald-100 px-3 py-2 flex items-center justify-between shadow-2xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="p-0.5 rounded-lg border border-emerald-200 bg-white shrink-0">
                          <ManaGruhamLogo size={28} className="w-7 h-7 block" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-display font-extrabold text-sm leading-none bg-gradient-to-r from-emerald-700 via-amber-500 to-red-600 bg-clip-text text-transparent truncate">
                            Mana Gruham
                          </div>
                          <div className="text-[9.5px] font-extrabold text-emerald-900 leading-none mt-0.5 truncate">
                            మన గృహం రియల్ యాప్
                          </div>
                        </div>
                      </div>
                      <span className="text-[9px] font-bold text-emerald-800 shrink-0">
                        ✓ Verified
                      </span>
                    </div>

                    {/* Vibrant Mini Hero & Search Bar Inside Phone */}
                    <div className="bg-gradient-to-br from-emerald-800 via-teal-800 to-indigo-900 px-3 py-3 text-white space-y-2">
                      <p className="text-xs font-extrabold leading-snug">
                        మీ కలల ఇల్లు, ప్లాట్ & ఫ్లాట్ సులభంగా వెతకండి
                      </p>
                      <div className="flex items-center gap-1.5 bg-white text-slate-600 rounded-lg px-2.5 py-1.5 text-[10px]">
                        <Search className="w-3 h-3 text-emerald-700 shrink-0" />
                        <span className="truncate">కాకినాడ, విజయవాడ, గుంటూరు...</span>
                      </div>
                    </div>

                    {/* Interactive Phone Filter Tabs */}
                    <div className="grid grid-cols-4 gap-1 p-2 bg-white border-b border-slate-100">
                      {[
                        { id: 'all', label: 'అన్నీ', icon: Star },
                        { id: 'houses', label: 'ఇళ్ళు', icon: Home },
                        { id: 'plots', label: 'ప్లాట్లు', icon: Trees },
                        { id: 'apartments', label: 'ఫ్లాట్లు', icon: Building2 },
                      ].map((tab) => {
                        const Icon = tab.icon;
                        const active = mockupCategory === tab.id;
                        return (
                          <button
                            key={tab.id}
                            type="button"
                            onClick={() => setMockupCategory(tab.id as MockupCategory)}
                            className={`min-h-[34px] rounded-lg px-1 py-1 text-[10px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer whitespace-nowrap ${
                              active
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'bg-slate-100 text-slate-700 hover:bg-emerald-50'
                            }`}
                          >
                            <Icon className="w-3 h-3 shrink-0" />
                            <span>{tab.label}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Property Feed Cards Inside Android Phone Screen */}
                    <div className="flex-1 p-2.5 space-y-2 bg-slate-50">
                      {visibleMockupCards.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-2.5 p-2 rounded-xl bg-white border border-slate-200/80 shadow-2xs"
                        >
                          <div className={`w-16 h-14 rounded-lg overflow-hidden shrink-0 bg-gradient-to-br ${item.gradientFallback}`}>
                            <img
                              src={item.image}
                              alt={item.title}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="min-w-0 flex-1 text-left">
                            <p className="text-[11px] font-extrabold text-slate-900 truncate">
                              {item.title}
                            </p>
                            <p className="text-[9.5px] text-slate-600 flex items-center gap-1 truncate mt-0.5">
                              <MapPin className="w-2.5 h-2.5 text-emerald-700 shrink-0" />
                              <span className="truncate">{item.location}</span>
                            </p>
                            <div className="flex items-center justify-between mt-1">
                              <span className="text-[11px] font-black text-emerald-700 font-mono tabular-nums">
                                {item.price}
                              </span>
                              <span className="text-[9px] font-semibold text-amber-700">
                                {item.specs}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Android Mockup Bottom Bar */}
                    <div className="px-4 py-2 bg-white border-t border-slate-200 flex items-center justify-between text-[10px] font-bold text-slate-600">
                      <span className="text-emerald-700">హోమ్</span>
                      <span>కొనుగోలు</span>
                      <span>అమ్మకం</span>
                      <span>ఖాతా</span>
                    </div>
                  </>
                ) : (
                  /* Phone Home Screen & App Drawer Launcher Icon Preview */
                  <div className="flex-1 bg-gradient-to-b from-emerald-900 via-teal-950 to-slate-950 text-white p-5 flex flex-col justify-between">
                    <div className="text-center space-y-1 pt-2">
                      <p className="text-3xl font-display font-bold tabular-nums">09:41</p>
                      <p className="text-[11px] text-emerald-200">Android Home Screen</p>
                    </div>

                    {/* App Icon Grid Highlighting Official Mana Gruham Launcher Icon */}
                    <div className="grid grid-cols-3 gap-4 py-6 items-start">
                      <div className="flex flex-col items-center gap-1.5 opacity-60">
                        <div className="w-12 h-12 rounded-2xl bg-sky-500/30 border border-white/20 flex items-center justify-center">
                          <PhoneCall className="w-5 h-5" />
                        </div>
                        <span className="text-[10px]">Phone</span>
                      </div>

                      {/* Highlighted Mana Gruham Official Launcher Icon */}
                      <div className="flex flex-col items-center gap-1.5">
                        <div className="p-1 rounded-[20px] bg-white shadow-xl ring-2 ring-amber-400">
                          <ManaGruhamLogo size={56} className="w-14 h-14 block rounded-2xl" />
                        </div>
                        <span className="text-[11px] font-extrabold text-amber-300 whitespace-nowrap">
                          Mana Gruham
                        </span>
                      </div>

                      <div className="flex flex-col items-center gap-1.5 opacity-60">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/30 border border-white/20 flex items-center justify-center">
                          <Smartphone className="w-5 h-5" />
                        </div>
                        <span className="text-[10px]">Play Store</span>
                      </div>
                    </div>

                    <div className="rounded-2xl bg-white/10 border border-white/15 p-3 text-center space-y-1">
                      <p className="text-xs font-bold text-amber-300">
                        ఒరిజినల్ గ్రీన్ & వైట్ ఇంటి లోగో
                      </p>
                      <p className="text-[10.5px] text-emerald-100 leading-snug">
                        APK ఇన్‌స్టాల్ చేసిన తర్వాత మీ ఫోన్ హోమ్ స్క్రీన్ & యాప్ డ్రాయర్‌లో ఇదే అధికారిక లోగో కనిపిస్తుంది.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Scan QR to Download APK Directly on Phone */}
            <div className="w-full max-w-[318px] flex items-center gap-3.5 rounded-2xl bg-slate-950/60 border border-white/15 p-3.5 backdrop-blur-md">
              <div className="bg-white p-1.5 rounded-xl shrink-0">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(apkDirectUrl)}&color=065f46&bgcolor=ffffff`}
                  alt="Scan QR to Download Mana Gruham APK"
                  referrerPolicy="no-referrer"
                  className="w-14 h-14 object-contain"
                  loading="lazy"
                />
              </div>
              <div className="text-left min-w-0">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                  <QrCode className="w-3.5 h-3.5 shrink-0" />
                  <span>QR స్కాన్ చేసి APK పొందండి</span>
                </div>
                <p className="text-[11px] text-emerald-100/90 leading-snug mt-0.5">
                  మొబైల్ కెమెరాతో స్కాన్ చేసి నేరుగా APK డౌన్‌లోడ్ చేసుకోండి.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
