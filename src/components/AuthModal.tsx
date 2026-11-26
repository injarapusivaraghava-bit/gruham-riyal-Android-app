import React, { useState, useEffect } from 'react';
import { X, LogIn, UserPlus, ShieldCheck, MapPin, Phone, User as UserIcon, CheckCircle2, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ManaGruhamLogo } from './ManaGruhamLogo';
import { AP_DISTRICTS } from '../data';
import { auth, googleProvider } from '../firebase';
import { signInWithPopup, signOut, User } from 'firebase/auth';

export interface LocalUserProfile {
  fullName: string;
  phone: string;
  district: string;
  accountRole: 'Buyer' | 'Owner' | 'Agent';
  updatedAt: string;
}

interface AuthModalProps {
  isOpen: boolean;
  initialMode?: 'login' | 'register';
  onClose: () => void;
  currentUser: User | null;
  isAdminUser: boolean;
}

const PROFILE_STORAGE_KEY = 'mana_gruham_user_profile_v1';

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  initialMode = 'login',
  onClose,
  currentUser,
  isAdminUser,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [district, setDistrict] = useState('Kakinada');
  const [accountRole, setAccountRole] = useState<'Buyer' | 'Owner' | 'Agent'>('Buyer');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    setMode(initialMode);
    setErrorMsg('');
    setSavedNotice(false);
  }, [initialMode, isOpen]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(PROFILE_STORAGE_KEY);
      if (saved) {
        const parsed: LocalUserProfile = JSON.parse(saved);
        setFullName(parsed.fullName || currentUser?.displayName || '');
        setPhone(parsed.phone || '');
        setDistrict(parsed.district || 'Kakinada');
        setAccountRole(parsed.accountRole || 'Buyer');
      } else if (currentUser?.displayName) {
        setFullName(currentUser.displayName);
      }
    } catch {
      // ignore storage errors
    }
  }, [currentUser, isOpen]);

  const handleGoogleAuth = async (isRegistration: boolean) => {
    setErrorMsg('');
    if (isRegistration && (!fullName.trim() || phone.trim().length < 10)) {
      setErrorMsg('దయచేసి మీ పూర్తి పేరు మరియు 10 అంకెల మొబైల్ నంబర్ నమోదు చేయండి.');
      return;
    }

    if (isRegistration) {
      const profile: LocalUserProfile = {
        fullName: fullName.trim(),
        phone: phone.trim(),
        district,
        accountRole,
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
    }

    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      setSavedNotice(true);
      setTimeout(() => {
        onClose();
      }, 650);
    } catch (err: any) {
      if (err?.code !== 'auth/popup-closed-by-user') {
        setErrorMsg('Google సైన్-ఇన్ పూర్తికాలేదు. దయచేసి మళ్లీ ప్రయత్నించండి.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfileOnly = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!fullName.trim() || phone.trim().length < 10) {
      setErrorMsg('పూర్తి పేరు మరియు సరైన 10 అంకెల మొబైల్ నంబర్ నమోదు చేయండి.');
      return;
    }
    const profile: LocalUserProfile = {
      fullName: fullName.trim(),
      phone: phone.trim(),
      district,
      accountRole,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className={`fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto ${
          typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('nativeHeader') === '1'
            ? ''
            : 'pt-[76px]'
        }`}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 16 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto"
        >
          {/* Colorful Top Accent Strip (Emerald + Gold + Blue + Purple) */}
          <div className="h-1.5 w-full bg-gradient-to-r from-emerald-600 via-amber-500 via-blue-600 to-purple-600" />

          {/* Header */}
          <div className="px-6 pt-5 pb-4 bg-gradient-to-br from-emerald-50/80 via-white to-blue-50/70 border-b border-slate-100 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <ManaGruhamLogo size={42} className="w-10 h-10 shrink-0" />
              <div>
                <h2 className="font-display font-extrabold text-lg text-emerald-950 leading-tight">
                  Mana Gruham
                </h2>
                <p className="text-xs font-semibold text-emerald-700">
                  మన గృహం రియల్ యాప్ · ప్రొఫైల్ & ఖాతా
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close account modal"
              className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-5">
            {currentUser ? (
              /* Signed-in Account & Profile Settings View */
              <div className="space-y-5">
                <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
                  {currentUser.photoURL ? (
                    <img
                      src={currentUser.photoURL}
                      alt={currentUser.displayName || 'User'}
                      referrerPolicy="no-referrer"
                      className="w-12 h-12 rounded-full border-2 border-white shadow-xs object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-emerald-700 text-white font-bold flex items-center justify-center text-lg">
                      {(currentUser.displayName || 'M').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="font-display font-bold text-slate-900 truncate">
                      {currentUser.displayName || 'మన గృహం వినియోగదారుడు'}
                    </div>
                    <div className="text-xs text-slate-600 truncate">{currentUser.email}</div>
                    <div className="text-[11px] font-bold text-emerald-700 mt-0.5 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>{isAdminUser ? 'Admin Verified Account' : 'Verified Member'}</span>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleSaveProfileOnly} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      పూర్తి పేరు (Full Name)
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="మీ పేరు నమోదు చేయండి"
                      className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        మొబైల్ నంబర్ (Mobile)
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="8977776111"
                        className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl font-mono focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        జిల్లా (District)
                      </label>
                      <select
                        value={district}
                        onChange={(e) => setDistrict(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                      >
                        {AP_DISTRICTS.map((d) => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {errorMsg && (
                    <p className="text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
                      {errorMsg}
                    </p>
                  )}
                  {savedNotice && (
                    <p className="text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>ప్రొఫైల్ వివరాలు సేవ్ చేయబడ్డాయి!</span>
                    </p>
                  )}

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <button
                      type="submit"
                      className="min-h-[44px] px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                    >
                      ప్రొఫైల్ సేవ్ చేయి
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        await signOut(auth);
                        onClose();
                      }}
                      className="min-h-[44px] px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-colors cursor-pointer inline-flex items-center justify-center gap-1.5"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>లాగ్ అవుట్ (Sign Out)</span>
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              /* Login / Register Mode Switcher */
              <>
                <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-xl">
                  <button
                    type="button"
                    id="auth-tab-login"
                    onClick={() => { setMode('login'); setErrorMsg(''); }}
                    className={`min-h-[42px] rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      mode === 'login'
                        ? 'bg-white text-emerald-800 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <LogIn className="w-4 h-4" />
                    <span>లాగిన్ (Login)</span>
                  </button>
                  <button
                    type="button"
                    id="auth-tab-register"
                    onClick={() => { setMode('register'); setErrorMsg(''); }}
                    className={`min-h-[42px] rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      mode === 'register'
                        ? 'bg-white text-purple-800 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>రిజిస్టర్ (Register)</span>
                  </button>
                </div>

                {mode === 'login' ? (
                  <div className="space-y-4">
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 via-white to-blue-50 border border-emerald-100 space-y-2">
                      <h3 className="font-display font-bold text-slate-900 text-base">
                        సులభంగా మీ ఖాతాలోకి ప్రవేశించండి
                      </h3>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        ఇళ్ళు, స్థలాలు పోస్ట్ చేయడానికి, మీ లిస్టింగ్స్ నిర్వహించడానికి మరియు డాక్యుమెంట్లు అప్‌లోడ్ చేయడానికి Google తో సైన్ ఇన్ చేయండి.
                      </p>
                    </div>

                    {errorMsg && (
                      <p className="text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
                        {errorMsg}
                      </p>
                    )}

                    <button
                      type="button"
                      id="auth-google-signin-btn"
                      disabled={loading}
                      onClick={() => handleGoogleAuth(false)}
                      className="w-full min-h-[48px] px-4 py-3 bg-gradient-to-r from-emerald-600 via-emerald-700 to-blue-700 hover:from-emerald-700 hover:to-blue-800 text-white font-bold text-sm rounded-xl shadow-md active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2.5 disabled:opacity-60"
                    >
                      <LogIn className="w-4 h-4" />
                      <span>{loading ? 'కనెక్ట్ అవుతోంది...' : 'Google తో లాగిన్ చేయండి (Sign In)'}</span>
                    </button>

                    <p className="text-center text-xs text-slate-500">
                      కొత్త వినియోగదారులా?{' '}
                      <button
                        type="button"
                        onClick={() => setMode('register')}
                        className="font-bold text-purple-700 hover:underline cursor-pointer"
                      >
                        ఇక్కడ రిజిస్టర్ అవ్వండి
                      </button>
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        మీ పూర్తి పేరు (Full Name) *
                      </label>
                      <div className="relative">
                        <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="ఉదా: శివ రాఘవ"
                          className="w-full pl-9 pr-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-purple-600"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          మొబైల్ నంబర్ (Mobile) *
                        </label>
                        <div className="relative">
                          <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="10 అంకెల నంబర్"
                            className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-200 rounded-xl font-mono focus:outline-hidden focus:ring-2 focus:ring-purple-600"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          జిల్లా (District)
                        </label>
                        <div className="relative">
                          <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <select
                            value={district}
                            onChange={(e) => setDistrict(e.target.value)}
                            className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-hidden focus:ring-2 focus:ring-purple-600"
                          >
                            {AP_DISTRICTS.map((d) => (
                              <option key={d} value={d}>{d}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        ఖాతా రకం (Account Type)
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {(['Buyer', 'Owner', 'Agent'] as const).map((role) => (
                          <button
                            key={role}
                            type="button"
                            onClick={() => setAccountRole(role)}
                            className={`min-h-[40px] px-2 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                              accountRole === role
                                ? 'bg-purple-600 border-purple-600 text-white shadow-xs'
                                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            {role === 'Buyer' ? 'కొనుగోలుదారు' : role === 'Owner' ? 'యజమాని' : 'ఏజెంట్'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {errorMsg && (
                      <p className="text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
                        {errorMsg}
                      </p>
                    )}

                    <button
                      type="button"
                      id="auth-google-register-btn"
                      disabled={loading}
                      onClick={() => handleGoogleAuth(true)}
                      className="w-full min-h-[48px] px-4 py-3 bg-gradient-to-r from-purple-600 via-blue-600 to-emerald-600 hover:from-purple-700 hover:to-emerald-700 text-white font-bold text-sm rounded-xl shadow-md active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>{loading ? 'నమోదు అవుతోంది...' : 'ఖాతా రిజిస్టర్ & Google సైన్ ఇన్'}</span>
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
