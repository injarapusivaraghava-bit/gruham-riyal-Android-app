import React, { useEffect, useState } from 'react';
import { Phone, MessageSquare, Mail, MapPin, Download, Copy, Check, Sparkles, Smartphone, ShieldCheck, QrCode } from 'lucide-react';
import { motion } from 'motion/react';
import { ManaGruhamLogo } from './ManaGruhamLogo';

export const ContactCard: React.FC = () => {
  const [copiedText, setCopiedText] = useState('');
  const [apkAvailable, setApkAvailable] = useState(false);

  useEffect(() => {
    let active = true;
    fetch('/api/apk-info')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (active && data?.available) {
          setApkAvailable(true);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const rPhone = '8977776111';
  const rEmail = 'injarapusivaraghava@gmail.com';
  const rAddress = 'Turangi, Kakinada, Andhra Pradesh - 533016';

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(type);
    setTimeout(() => setCopiedText(''), 2000);
  };

  const waUrl = `https://wa.me/91${rPhone}?text=${encodeURIComponent(
    'హలో శివ రాఘవ గారు, నేను మీ "మన గృహం" యాప్ ద్వారా సంప్రదిస్తున్నాను. రియల్ ఎస్టేట్ వివరాలు తెలుసుకోవాలనుకుంటున్నాను.'
  )}`;
  const mailUrl = `mailto:${rEmail}?subject=${encodeURIComponent('మన గృహం రియల్ ఎస్టేట్ విచారణ')}`;

  return (
    <div id="contact-portfolio-section" className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* 1. Direct Contact & Office Card */}
      <motion.div
        whileHover={{ y: -2 }}
        className="bg-white rounded-3xl border border-emerald-200/80 overflow-hidden shadow-sm flex flex-col justify-between"
      >
        <div className="h-1.5 w-full bg-gradient-to-r from-emerald-600 via-amber-400 to-blue-600" />
        <div className="p-6 space-y-5 flex-1 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-3.5">
              <ManaGruhamLogo size={48} className="w-12 h-12 shrink-0" />
              <div>
                <span className="text-[11px] text-emerald-700 font-bold uppercase tracking-wider block">
                  మమ్మల్ని సంప్రదించండి · Contact Desk
                </span>
                <h3 className="font-display font-extrabold text-slate-900 text-lg leading-tight">
                  ఇంజరాపు శివ రాఘవ (Siva Raghava)
                </h3>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              ఇళ్ళు, ఓపెన్ ప్లాట్లు, వ్యవసాయ పొలాలు & తోటల కొనుగోలు లేదా మీ ఆస్తిని యాప్‌లో ఉంచడానికి నేరుగా ఫోన్ లేదా వాట్సాప్‌లో సంప్రదించండి.
            </p>

            {/* Quick Contact Info */}
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between p-3.5 bg-emerald-50/70 hover:bg-emerald-50 rounded-2xl border border-emerald-100 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-white rounded-xl border border-emerald-200 text-emerald-700 shadow-2xs">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block text-[10px] text-emerald-800 font-bold uppercase">మొబైల్ & వాట్సాప్</span>
                    <a href={`tel:+91${rPhone}`} className="text-sm font-extrabold text-slate-900 font-mono tabular-nums hover:underline">
                      +91 {rPhone}
                    </a>
                  </div>
                </div>
                <button
                  id="copy-phone-btn"
                  type="button"
                  onClick={() => handleCopy(rPhone, 'phone')}
                  className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-slate-500 hover:text-emerald-700 hover:bg-white transition-colors cursor-pointer"
                  title="నెంబర్ కాపీ చేయండి"
                >
                  {copiedText === 'phone' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              <div className="flex items-center justify-between p-3.5 bg-blue-50/70 hover:bg-blue-50 rounded-2xl border border-blue-100 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2.5 bg-white rounded-xl border border-blue-200 text-blue-700 shadow-2xs shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="block text-[10px] text-blue-800 font-bold uppercase">ఈమెయిల్ (Official Email)</span>
                    <a href={mailUrl} className="text-xs sm:text-sm font-bold text-slate-900 truncate block hover:underline" title={rEmail}>
                      {rEmail}
                    </a>
                  </div>
                </div>
                <button
                  id="copy-email-btn"
                  type="button"
                  onClick={() => handleCopy(rEmail, 'email')}
                  className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-slate-500 hover:text-blue-700 hover:bg-white transition-colors cursor-pointer shrink-0"
                  title="ఈమెయిల్ కాపీ చేయండి"
                >
                  {copiedText === 'email' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              <div className="flex items-start gap-3 p-3.5 bg-purple-50/70 rounded-2xl border border-purple-100">
                <div className="p-2.5 bg-white rounded-xl border border-purple-200 text-purple-700 shadow-2xs shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <span className="block text-[10px] text-purple-800 font-bold uppercase">ప్రధాన కార్యాలయం (Office)</span>
                  <p className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                    {rAddress}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-5">
            <a
              id="contact-wa-link"
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-[46px] flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm active:scale-95 transition-all cursor-pointer"
            >
              <MessageSquare className="w-4 h-4" />
              <span>వాట్సాప్ చాట్</span>
            </a>

            <a
              id="contact-phone-link"
              href={`tel:+91${rPhone}`}
              className="min-h-[46px] flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-400 hover:bg-amber-500 text-slate-950 rounded-xl text-xs sm:text-sm font-extrabold shadow-sm active:scale-95 transition-all cursor-pointer"
            >
              <Phone className="w-4 h-4" />
              <span>కాల్ చేయండి</span>
            </a>
          </div>
        </div>
      </motion.div>

      {/* 2. Android APK Project & Mobile App Card */}
      <motion.div
        whileHover={{ y: -2 }}
        className="bg-gradient-to-br from-emerald-900 via-blue-950 to-purple-950 text-white rounded-3xl p-6 shadow-lg flex flex-col justify-between space-y-5 border border-emerald-700/40"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/10 border border-white/20 rounded-2xl text-amber-300">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-amber-300 font-bold uppercase tracking-wider block">
                ఆండ్రాయిడ్ మొబైల్ యాప్ · APK Build
              </span>
              <h3 className="font-display font-extrabold text-white text-lg leading-tight">
                Mana Gruham Android App
              </h3>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-blue-100 leading-relaxed">
            మన గృహం రియల్ యాప్‌ను నేరుగా Vivo / Android ఫోన్‌లో PWA గా ఇన్‌స్టాల్ చేసుకోవచ్చు లేదా పూర్తి Android Studio ప్రాజెక్ట్ ZIP డౌన్‌లోడ్ చేసి APK బిల్డ్ చేయవచ్చు.
          </p>

          <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/15 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-300" />
                <span className="text-xs font-bold text-white">com.managruham.realapp</span>
              </div>
              <span className="text-[10px] bg-emerald-400/20 text-emerald-200 font-bold px-2.5 py-0.5 rounded-full font-mono">
                v2.0 Color UI
              </span>
            </div>

            <div className="flex items-center gap-4 bg-slate-950/50 p-3 rounded-xl border border-white/10">
              <div className="bg-white p-1.5 rounded-xl shrink-0">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(window.location.origin)}`}
                  alt="App Open QR Code"
                  className="w-16 h-16 object-contain"
                />
              </div>
              <div className="text-left space-y-1">
                <div className="flex items-center gap-1 text-amber-300 text-xs font-bold">
                  <QrCode className="w-3.5 h-3.5" />
                  <span>మొబైల్ స్కాన్ QR</span>
                </div>
                <p className="text-[11px] text-slate-200 leading-snug">
                  మీ Android కెమెరాతో స్కాన్ చేసి యాప్‌ను ఓపెన్ చేసి "Install App" నొక్కండి.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3 pt-1">
          <div className="p-3 bg-emerald-500/15 border border-emerald-400/30 text-emerald-100 rounded-xl text-xs font-medium flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
            <span>అనిమేటెడ్ Splash Screen, కొత్త కలర్ UI & శాశ్వత టాప్ లోగోతో తాజా Android APK సిద్ధంగా ఉంది.</span>
          </div>

          <a
            id="android-apk-direct-download-btn"
            href={apkAvailable ? '/ManaGruham_RealApp.apk' : '/ManaGruham_AndroidProject.zip'}
            download={apkAvailable ? 'ManaGruham_RealApp.apk' : 'ManaGruham_AndroidProject.zip'}
            className="w-full min-h-[52px] flex items-center justify-center gap-2.5 px-5 py-3 bg-gradient-to-r from-emerald-400 via-lime-300 to-amber-400 hover:from-emerald-300 hover:to-amber-300 text-emerald-950 font-black rounded-xl text-sm cursor-pointer shadow-lg border border-amber-200 active:scale-95 transition-all"
          >
            <Smartphone className="w-4.5 h-4.5 text-emerald-950 shrink-0" />
            <span>{apkAvailable ? 'DOWNLOAD APK (ManaGruham_RealApp.apk)' : 'DOWNLOAD ANDROID APP (Project ZIP)'}</span>
            <Download className="w-4.5 h-4.5 text-emerald-950 shrink-0" />
          </a>

          <a
            id="android-studio-zip-download-btn"
            href="/ManaGruham_AndroidProject.zip"
            download="ManaGruham_AndroidProject.zip"
            className="w-full min-h-[40px] flex items-center justify-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/15 border border-white/20 text-amber-200 font-bold rounded-xl text-xs cursor-pointer transition-all"
          >
            <Download className="w-3.5 h-3.5 shrink-0" />
            <span>Android Studio Project ZIP డౌన్‌లోడ్</span>
          </a>
        </div>
      </motion.div>
    </div>
  );
};

