import React, { useState } from 'react';
import { PropertyListing } from '../types';
import { 
  X, 
  MapPin, 
  CheckCircle, 
  Clock, 
  Phone, 
  MessageSquare, 
  Mail, 
  Layers, 
  Compass, 
  UserCheck, 
  Heart, 
  Map, 
  ChevronLeft, 
  ChevronRight, 
  Share2, 
  Check, 
  Camera, 
  Video, 
  FileText, 
  Lock, 
  Unlock, 
  Download, 
  ExternalLink, 
  Send, 
  Loader2, 
  ShieldCheck, 
  Zap, 
  Droplets, 
  Trees, 
  Sprout,
  Eye 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getListingImages, DEFAULT_FALLBACK_IMAGE } from './ListingCard';
import { ManaGruhamLogo } from './ManaGruhamLogo';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';

interface Landmark {
  name: string;
  teluguName: string;
  x: number;
  y: number;
  type: 'office' | 'road' | 'school' | 'temple' | 'shop';
}

interface AreaMapData {
  title: string;
  roads: { name: string; teluguName: string; path: string }[];
  landmarks: Landmark[];
  approxLocationText: string;
  distances: { label: string; value: string }[];
}

const getAreaMapData = (area: string, city: string): AreaMapData => {
  const normArea = area.toLowerCase();
  
  if (normArea.includes('turangi')) {
    return {
      title: 'తూరంగి విలేజ్ బ్లూప్రింట్ (Turangi Village Sketch)',
      approxLocationText: 'శివ రాఘవ ల్యాండ్స్ సమీపంలో (Near Siva Raghava Lands)',
      roads: [
        { name: 'Kakinada Bypass Road', teluguName: 'కాకినాడ బైపాస్ రోడ్డు', path: 'M 10 50 Q 250 80 490 50' },
        { name: 'Turangi Main Road', teluguName: 'తూరంగి మెయిన్ రోడ్డు', path: 'M 200 10 L 250 290' },
      ],
      landmarks: [
        { name: 'Siva Raghava Lands Office', teluguName: 'శివ రాఘవ ల్యాండ్స్', x: 260, y: 110, type: 'office' },
        { name: 'Turangi Junction', teluguName: 'తూరంగి జంక్షన్', x: 205, y: 65, type: 'road' },
        { name: 'Panchayat Office', teluguName: 'పంచాయితీ ఆఫీస్', x: 120, y: 150, type: 'office' },
        { name: 'Z.P. High School', teluguName: 'జిల్లా పరిషత్ హైస్కూల్', x: 380, y: 220, type: 'school' },
      ],
      distances: [
        { label: 'కాకినాడ బైపాస్ (Bypass)', value: 'సమీపంలో (200m)' },
        { label: 'మెయిన్ జంక్షన్ (Junction)', value: '5 నిమిషాలు' },
        { label: 'బస్ స్టేషన్ (Bus Stand)', value: '3.5 కి.మీ.' },
        { label: 'హాస్పిటల్ (Hospital)', value: '1.2 కి.మీ.' }
      ]
    };
  }

  if (normArea.includes('gorantla')) {
    return {
      title: 'గోరంట్ల నైబర్‌హుడ్ మ్యాప్ (Gorantla Area Map)',
      approxLocationText: 'గోరంట్ల ఇన్నర్ రింగ్ రోడ్ సమీపంలో (Near Guntur Inner Ring Road)',
      roads: [
        { name: 'Guntur Inner Ring Road', teluguName: 'ఇన్నర్ రింగ్ రోడ్డు', path: 'M 10 120 Q 250 120 490 120' },
        { name: 'Amaravati Link Road', teluguName: 'అమరావతి లింక్ రోడ్డు', path: 'M 300 10 L 300 290' },
      ],
      landmarks: [
        { name: 'Inner Ring Road Circle', teluguName: 'రింగ్ రోడ్ సర్కిల్', x: 300, y: 120, type: 'road' },
        { name: 'Vignan School', teluguName: 'విజ్ఞాన్ స్కూల్', x: 150, y: 60, type: 'school' },
        { name: 'Gorantla Temple', teluguName: 'గోరంట్ల ఆలయం', x: 380, y: 200, type: 'temple' },
        { name: 'D-Mart Guntur', teluguName: 'డి-మార్ట్ సూపర్ మార్కెట్', x: 120, y: 210, type: 'shop' },
      ],
      distances: [
        { label: 'ఇన్నర్ రింగ్ రోడ్డు (Ring Rd)', value: '150 మీటర్లు' },
        { label: 'అమరావతి హైవే (Highway)', value: '10 నిమిషాలు' },
        { label: 'రైల్వే స్టేషన్ (Railway Station)', value: '5.5 కి.మీ.' },
        { label: 'షాపింగ్ మాల్స్ (D-Mart)', value: '1 కి.మీ.' }
      ]
    };
  }

  return {
    title: `${area} ప్రాంతీయ స్కెచ్ (Regional Area Sketch)`,
    approxLocationText: 'ప్రధాన రోడ్డుకు సమీపంలో (Near Main Arterial Road)',
    roads: [
      { name: 'Main Road', teluguName: 'ప్రధాన రహదారి', path: 'M 10 150 Q 250 110 490 150' },
      { name: 'Sub Road', teluguName: 'కనెక్టింగ్ వీధి', path: 'M 250 10 L 220 290' },
    ],
    landmarks: [
      { name: 'Local Market', teluguName: 'స్థానిక మార్కెట్', x: 130, y: 110, type: 'shop' },
      { name: 'Bus Stop', teluguName: 'బస్సు స్టాప్', x: 250, y: 130, type: 'road' },
      { name: 'Green Park', teluguName: 'పార్క్ మైదానం', x: 380, y: 210, type: 'school' },
      { name: 'Government Clinic', teluguName: 'వైద్యశాల', x: 100, y: 220, type: 'office' },
    ],
    distances: [
      { label: 'ప్రధాన రహదారి (Main Rd)', value: '100 మీటర్లు' },
      { label: 'రవాణా సౌకర్యం (Transit)', value: 'నడక దూరం' },
      { label: 'టౌన్ సెంటర్ (Town Center)', value: '1.5 కి.మీ.' },
      { label: 'స్కూల్ & కాలేజ్ (Institutes)', value: '800 మీటర్లు' }
    ]
  };
};

interface ListingDetailsModalProps {
  property: PropertyListing | null;
  isBookmarked: boolean;
  onToggleBookmark: (id: string) => void;
  onClose: () => void;
  currentUser?: any;
  isAdminUser?: boolean;
}

export const ListingDetailsModal: React.FC<ListingDetailsModalProps> = ({
  property,
  isBookmarked,
  onToggleBookmark,
  onClose,
  currentUser,
  isAdminUser = false,
}) => {
  if (!property) return null;

  const [mapTab, setMapTab] = useState<'sketch' | 'google'>('sketch');
  const images = getListingImages(property);
  const [currentImageIdx, setCurrentImageIdx] = useState(0);

  // Inquiry form modal state
  const [showInquiryModal, setShowInquiryModal] = useState(false);
  const [inquiryName, setInquiryName] = useState(currentUser?.displayName || '');
  const [inquiryPhone, setInquiryPhone] = useState('');
  const [inquiryEmail, setInquiryEmail] = useState(currentUser?.email || '');
  const [inquiryMessage, setInquiryMessage] = useState('ఈ స్థిరాస్తిని పరిశీలించడానికి లేదా కొనుగోలు చేయడానికి ఆసక్తిగా ఉన్నాను. దయచేసి పూర్తి వివరాలు తెలియజేయండి.');
  const [inquirySubmitting, setInquirySubmitting] = useState(false);
  const [inquirySent, setInquirySent] = useState(false);
  const [inquiryError, setInquiryError] = useState('');

  const [shareFeedback, setShareFeedback] = useState<string | null>(null);

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIdx((prev) => (prev + 1) % images.length);
  };

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIdx((prev) => (prev - 1 + images.length) % images.length);
  };

  const rPhone = property.contactPhone || '8977776111';
  const rEmail = property.contactEmail || 'injarapusivaraghava@gmail.com';
  const isApproved = property.isApproved === 'Yes';
  const mapData = getAreaMapData(property.area, property.city);

  const isFarm = property.type === 'farm_land';
  const locationText = isFarm 
    ? `${property.village || ''}, ${property.mandal || ''}, ${property.district || ''} జిల్లా`
    : `${property.area}, ${property.city}`;

  const encodedMsg = encodeURIComponent(
    `హలో ${property.contactName || 'యజమాని గారు'}, నేను 'మన గృహం' యాప్ లో ఈ ప్రాపర్టీ వివరాలు చూశాను:\n\n🏡 *స్థిరాస్తి:* ${property.title}\n📍 *లొకేషన్:* ${locationText}\n💰 *ధర:* ₹ ${property.priceFormatted}\n📐 *విస్తీర్ణం:* ${property.size}\nదయచేసి పూర్తి వివరాలు తెలియజేయండి!`
  );
  const whatsappUrl = `https://wa.me/91${rPhone}?text=${encodedMsg}`;
  const googleMapsSearchUrl = property.googleMapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locationText + ', Andhra Pradesh, India')}`;

  // Check authorization for viewing sensitive ownership documents
  const isOwner = currentUser?.uid && (property.submittedBy === currentUser.uid || property.submittedBy === currentUser.email);
  const isAuthorizedToViewDocs = isOwner || isAdminUser || currentUser?.email === 'injarapusivaraghava@gmail.com';

  // Handle inquiry submit
  const handleSendInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    setInquiryError('');
    if (!inquiryName.trim()) {
      setInquiryError('దయచేసి మీ పేరు రాయండి.');
      return;
    }
    if (!inquiryPhone.trim()) {
      setInquiryError('దయచేసి మీ ఫోన్ నెంబర్ నమోదు చేయండి.');
      return;
    }

    setInquirySubmitting(true);
    const inquiryPayload = {
      listingId: property.id,
      listingTitle: property.title,
      ownerUid: property.submittedBy,
      senderName: inquiryName,
      senderPhone: inquiryPhone,
      senderEmail: inquiryEmail,
      message: inquiryMessage,
      createdAt: new Date().toISOString(),
    };

    try {
      // 1. Send to server endpoint
      await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inquiryPayload),
      });

      // 2. Also send to Firestore collection
      try {
        await addDoc(collection(db, 'inquiries'), {
          ...inquiryPayload,
          id: `inq-${Date.now()}`,
        });
      } catch (err) {
        console.warn('Firestore inquiry sync warning:', err);
      }

      setInquirySent(true);

      // Open WhatsApp chat directly
      const waMsg = encodeURIComponent(
        `హలో ${property.contactName || 'యజమాని గారు'}, నా పేరు ${inquiryName} (${inquiryPhone}). నేను మీ 'మన గృహం' లిస్టింగ్ "${property.title}" పై ఆసక్తిని నమోదు చేశాను. సందేశం: ${inquiryMessage}`
      );
      setTimeout(() => {
        window.open(`https://wa.me/91${rPhone}?text=${waMsg}`, '_blank');
      }, 800);
    } catch (err) {
      console.error('Inquiry error:', err);
      setInquiryError('సమర్పించడంలో సమస్య వచ్చింది. దయచేసి నేరుగా కాల్ లేదా వాట్సాప్ చేయండి.');
    } finally {
      setInquirySubmitting(false);
    }
  };

  // Native Share
  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}${window.location.pathname}?propertyId=${property.id}`;
    const shareTitle = `${property.title} | మన గృహం AP`;
    const shareText = `🏡 మన గృహం AP - స్థిరాస్తి వివరాలు:\n` +
      `*${property.title}*\n` +
      `📍 లొకేషన్: ${locationText}\n` +
      `💰 ధర: ₹ ${property.priceFormatted}\n` +
      `📐 విస్తీర్ణం: ${property.size}\n\n` +
      `పూర్తి వివరాలు మరియు ఫోటోలు ఇక్కడ చూడండి:\n${shareUrl}`;

    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
        setShareFeedback('షేర్ చేయబడింది! (Shared)');
        setTimeout(() => setShareFeedback(null), 3000);
        return;
      } catch (err: any) {
        if (err && (err.name === 'AbortError' || err.code === 20)) return;
      }
    }

    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = shareUrl;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setShareFeedback('లింక్ కాపీ అయింది! (Link Copied!)');
      setTimeout(() => setShareFeedback(null), 3500);
    } catch {
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`, '_blank');
    }
  };

  const hasNativeHeader =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('nativeHeader') === '1';

  return (
    <AnimatePresence>
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 ${
          hasNativeHeader ? '' : 'pt-[74px]'
        }`}
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal Panel */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className={`relative bg-white rounded-3xl w-full max-w-2xl ${
            hasNativeHeader ? 'max-h-[92vh]' : 'max-h-[calc(100vh-92px)]'
          } overflow-y-auto shadow-2xl flex flex-col z-10`}
        >
          {/* Sticky Top Brand Header (Official Logo + Mana Gruham visible on Property Details) */}
          <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-emerald-100 px-4 py-2.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <ManaGruhamLogo size={34} className="w-8 h-8 shrink-0" />
              <div className="flex flex-col min-w-0">
                <span className="font-display font-extrabold text-emerald-900 text-sm leading-none truncate">
                  Mana Gruham
                </span>
                <span className="text-[10px] font-bold text-emerald-700 leading-none mt-0.5 truncate">
                  ఆస్తి వివరాలు · 100% Verified Listings
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close property details"
              className="min-w-[40px] min-h-[40px] rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors cursor-pointer shrink-0"
            >
              <X className="w-4.5 h-4.5" />
            </button>
          </div>

          {/* Main Hero Photo Gallery */}
          <div className="relative h-64 md:h-80 w-full overflow-hidden bg-stone-100 flex-shrink-0 group/image-modal">
            <div className="w-full h-full relative">
              <AnimatePresence mode="wait">
                <motion.img
                  key={currentImageIdx}
                  src={images[currentImageIdx]}
                  alt={`${property.title} - Photo ${currentImageIdx + 1}`}
                  referrerPolicy="no-referrer"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.35 }}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (target.src !== DEFAULT_FALLBACK_IMAGE) {
                      target.src = DEFAULT_FALLBACK_IMAGE;
                    }
                  }}
                />
              </AnimatePresence>
            </div>

            {/* Photo Counter Pill */}
            <div className="absolute top-16 left-4 flex items-center gap-1.5 z-10 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-bold text-white shadow-md">
              <Camera className="w-3.5 h-3.5 text-amber-400" />
              <span>{currentImageIdx + 1} / {images.length} ఫొటోలు (Photos)</span>
            </div>

            {/* Carousel Arrows */}
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={handlePrevImage}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/40 backdrop-blur-md hover:bg-black/60 text-white rounded-full flex items-center justify-center transition-all z-10 cursor-pointer"
                  title="మునుపటి చిత్రం"
                >
                  <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
                </button>
                <button
                  type="button"
                  onClick={handleNextImage}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/40 backdrop-blur-md hover:bg-black/60 text-white rounded-full flex items-center justify-center transition-all z-10 cursor-pointer"
                  title="తదుపరి చిత్రం"
                >
                  <ChevronRight className="w-5 h-5 stroke-[2.5]" />
                </button>
              </>
            )}

            {/* Top Bar Actions */}
            <div className="absolute inset-x-0 top-0 bg-gradient-to-b from-black/60 to-transparent p-4 flex justify-between items-start z-10">
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 text-xs font-bold rounded-full text-white backdrop-blur-md shadow-xs ${
                  property.status === 'sale' ? 'bg-amber-600/95' : property.status === 'lease' ? 'bg-emerald-600/95' : 'bg-blue-600/95'
                }`}>
                  {property.status === 'sale' ? '🏷️ అమ్మకానికి (For Sale)' : property.status === 'lease' ? '🔄 లీజుకు (For Lease)' : '🛒 కొనుగోలు (Looking to Buy)'}
                </span>
                {property.availabilityStatus && (
                  <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-white/90 text-stone-900 shadow-xs">
                    {property.availabilityStatus}
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={handleShare}
                  className={`p-2 rounded-full backdrop-blur-md transition-all active:scale-95 cursor-pointer shadow-xs ${
                    shareFeedback ? 'bg-emerald-600 text-white' : 'bg-black/40 hover:bg-black/60 text-white'
                  }`}
                  title="లిస్టింగ్ షేర్ చేయండి"
                >
                  {shareFeedback ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                </button>

                <button
                  onClick={() => onToggleBookmark(property.id)}
                  className={`p-2 rounded-full backdrop-blur-md transition-all active:scale-95 cursor-pointer shadow-xs ${
                    isBookmarked ? 'bg-rose-600 text-white' : 'bg-black/40 hover:bg-black/60 text-white'
                  }`}
                  title={isBookmarked ? 'ఇష్టమైనవాటి నుండి తీసివేయి' : 'ఇష్టమైనవాటిలో చేర్చు (Favorite)'}
                >
                  <Heart className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
                </button>
                
                <button
                  onClick={onClose}
                  className="p-2 rounded-full bg-black/40 hover:bg-black/60 text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Price Badge Over Image Bottom */}
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-5 pt-10 flex justify-between items-end">
              <div>
                <span className="text-[11px] font-semibold text-amber-400 tracking-wider uppercase block mb-0.5">ప్రత్యేక ధర</span>
                <p className="text-2xl md:text-3xl font-display font-extrabold text-white font-mono">
                  ₹ {property.priceFormatted}
                </p>
                {property.pricePerAcre ? (
                  <span className="text-[11px] text-stone-300 font-semibold font-mono">
                    (₹{property.pricePerAcre.toLocaleString('en-IN')} / ఎకరానికి)
                  </span>
                ) : null}
              </div>
              
              <div>
                {isApproved ? (
                  <span className="flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full bg-emerald-500 text-white shadow-md">
                    <CheckCircle className="w-4 h-4" />
                    <span>వెరిఫైడ్ లిస్టింగ్</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full bg-amber-500 text-white shadow-md">
                    <Clock className="w-4 h-4" />
                    <span>అడ్మిన్ పరిశీలనలో ఉంది</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Photo Gallery Thumbnails Bar */}
          {images.length > 1 && (
            <div className="bg-stone-900 px-4 py-2 flex items-center gap-2 overflow-x-auto scrollbar-thin">
              <span className="text-[11px] font-bold text-stone-400 shrink-0 mr-1 flex items-center gap-1">
                <Camera className="w-3.5 h-3.5 text-amber-400" />
                <span>గ్యాలరీ:</span>
              </span>
              {images.map((imgUrl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCurrentImageIdx(idx)}
                  className={`relative w-12 h-9 rounded-lg overflow-hidden border transition-all shrink-0 cursor-pointer ${
                    currentImageIdx === idx ? 'border-amber-400 ring-2 ring-amber-400/50 scale-105' : 'border-stone-700 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={imgUrl} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Modal Content Body */}
          <div className="p-4 sm:p-6 space-y-6">
            {/* Title & Location Header */}
            <div className="space-y-1.5 border-b border-stone-150 pb-4">
              <h3 className="font-display font-extrabold text-stone-900 text-lg md:text-xl leading-tight">
                {property.title}
              </h3>
              <div className="flex flex-wrap items-center gap-2 text-xs text-stone-600">
                <span className="flex items-center gap-1 font-semibold text-stone-800">
                  <MapPin className="w-3.5 h-3.5 text-amber-600" />
                  <span>{locationText}</span>
                </span>
                <span>•</span>
                <span className="font-mono bg-stone-100 px-2 py-0.5 rounded text-[11px] font-bold text-stone-700">
                  {property.size}
                </span>
                {property.landType && (
                  <span className="bg-amber-50 text-amber-800 px-2 py-0.5 rounded text-[11px] font-bold">
                    {property.landType}
                  </span>
                )}
              </div>
            </div>

            {/* Quick Specs Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-stone-50 p-3.5 rounded-2xl border border-stone-150">
              <div className="space-y-0.5">
                <span className="text-[10px] text-stone-400 uppercase font-bold block">మొత్తం విస్తీర్ణం (Area)</span>
                <span className="font-bold text-stone-800 text-xs sm:text-sm font-mono">{property.size}</span>
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] text-stone-400 uppercase font-bold block">ధర (Price)</span>
                <span className="font-bold text-amber-700 text-xs sm:text-sm font-mono">₹{property.priceFormatted}</span>
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] text-stone-400 uppercase font-bold block">రోడ్డు సదుపాయం</span>
                <span className="font-bold text-stone-800 text-xs truncate block">{property.roadAccess || 'BT Road'}</span>
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] text-stone-400 uppercase font-bold block">లభ్యత స్థితి</span>
                <span className="font-bold text-emerald-700 text-xs block">{property.availabilityStatus || 'Available'}</span>
              </div>
            </div>

            {/* Property Video Player Section */}
            {property.videoUrl && (
              <div className="p-4 bg-stone-900 rounded-3xl text-white space-y-3 shadow-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Video className="w-5 h-5 text-rose-500" />
                    <div>
                      <h4 className="font-bold text-xs sm:text-sm">స్థిరాస్తి వీడియో (Property Video Player)</h4>
                      <p className="text-[10px] text-stone-400">భూమి సరిహద్దులు & నడక వీడియోను నేరుగా వీక్షించండి</p>
                    </div>
                  </div>
                  <a
                    href={property.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-amber-400 hover:underline flex items-center gap-1 font-bold"
                  >
                    <span>ఓపెన్ చేయండి</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div className="rounded-2xl overflow-hidden bg-black aspect-video flex items-center justify-center">
                  <video
                    src={property.videoUrl}
                    controls
                    playsInline
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
            )}

            {/* Full Property Description */}
            <div className="space-y-2">
              <h4 className="font-display font-bold text-stone-900 text-sm md:text-base border-b border-stone-100 pb-1">
                స్థిరాస్తి పూర్తి వివరణ (Property Description)
              </h4>
              <p className="text-stone-600 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">
                {property.description}
              </p>
            </div>

            {/* Facilities & Specifications Table */}
            <div className="space-y-3">
              <h4 className="font-display font-bold text-stone-900 text-sm md:text-base border-b border-stone-100 pb-1">
                సౌకర్యాలు & సాంకేతిక వివరాలు (Facilities & Specifications)
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {property.waterFacility && property.waterFacility.length > 0 && (
                  <div className="p-3 bg-stone-50 rounded-xl border border-stone-150 space-y-1">
                    <span className="text-[10px] font-bold text-stone-500 uppercase flex items-center gap-1">
                      <Droplets className="w-3.5 h-3.5 text-blue-600" />
                      <span>నీటి వసతులు (Water Facilities)</span>
                    </span>
                    <p className="font-bold text-stone-800">{property.waterFacility.join(', ')}</p>
                  </div>
                )}

                {property.electricity && (
                  <div className="p-3 bg-stone-50 rounded-xl border border-stone-150 space-y-1">
                    <span className="text-[10px] font-bold text-stone-500 uppercase flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5 text-amber-600" />
                      <span>విద్యుత్ సదుపాయం (Electricity)</span>
                    </span>
                    <p className="font-bold text-stone-800">{String(property.electricity)}</p>
                  </div>
                )}

                {property.roadAccess && (
                  <div className="p-3 bg-stone-50 rounded-xl border border-stone-150 space-y-1">
                    <span className="text-[10px] font-bold text-stone-500 uppercase">రోడ్డు కనెక్టివిటీ (Road Access)</span>
                    <p className="font-bold text-stone-800">{property.roadAccess}</p>
                  </div>
                )}

                {property.fencing && (
                  <div className="p-3 bg-stone-50 rounded-xl border border-stone-150 space-y-1">
                    <span className="text-[10px] font-bold text-stone-500 uppercase">కంచె / సరిహద్దులు (Fencing)</span>
                    <p className="font-bold text-stone-800">{property.fencing}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Documents Section (With Authorization / Permission Protection) */}
            <div className="p-4 bg-stone-50 rounded-3xl border border-stone-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-amber-700" />
                  <div>
                    <h4 className="font-bold text-xs sm:text-sm text-stone-900">యాజమాన్య పత్రాలు (Ownership Documents)</h4>
                    <p className="text-[10px] text-stone-500">పట్టాదారు పాస్‌బుక్, సేల్ డీడ్ & సర్వే పత్రాలు</p>
                  </div>
                </div>

                {isAuthorizedToViewDocs ? (
                  <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    <Unlock className="w-3 h-3" />
                    <span>ఆథరైజ్డ్ యాక్సెస్</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-stone-200 text-stone-700 text-[10px] font-bold">
                    <Lock className="w-3 h-3" />
                    <span>రక్షిత పత్రాలు</span>
                  </span>
                )}
              </div>

              {/* Document List */}
              {property.documents && property.documents.length > 0 ? (
                <div className="space-y-2">
                  {property.documents.map((docItem) => (
                    <div
                      key={docItem.id}
                      className="p-3 bg-white rounded-2xl border border-stone-200 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <div className="p-2 bg-amber-50 text-amber-700 rounded-xl">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="truncate">
                          <span className="font-bold text-stone-900 block truncate">{docItem.title}</span>
                          <span className="text-[10px] text-stone-400 font-mono">
                            {isAuthorizedToViewDocs ? docItem.fileName : '••••••••.pdf'}
                          </span>
                        </div>
                      </div>

                      {isAuthorizedToViewDocs ? (
                        <a
                          href={docItem.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs flex items-center gap-1 cursor-pointer transition-all shadow-xs"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>వీక్షించండి</span>
                        </a>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setInquiryMessage(`హలో, నేను మీ ఆస్తి "${property.title}" యొక్క పట్టాదారు పాస్‌బుక్ మరియు సేల్ డీడ్ పత్రాలను పరిశీలించాలనుకుంటున్నాను. దయచేసి అనుమతిని ఇవ్వండి.`);
                            setShowInquiryModal(true);
                          }}
                          className="px-3 py-1.5 bg-stone-100 hover:bg-amber-50 text-stone-700 hover:text-amber-700 rounded-xl font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-all border border-stone-200"
                        >
                          <Lock className="w-3 h-3 text-stone-400" />
                          <span>యాక్సెస్ అడగండి</span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 bg-white rounded-2xl border border-dashed border-stone-200 text-xs text-stone-500 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-stone-700">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>పట్టాదారు పాస్‌బుక్ & సేల్ డీడ్ రికార్డులు వెరిఫికేషన్‌లో ఉన్నాయి</span>
                  </div>
                  <p className="text-[11px]">
                    భూమి యజమాని యాజమాన్య పత్రాలను నేరుగా చూసేందుకు క్రింది బటన్ ద్వారా అనుమతిని కోరవచ్చు.
                  </p>
                </div>
              )}
            </div>

            {/* Location Map Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                <h4 className="font-display font-bold text-stone-900 text-sm md:text-base flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-amber-600" />
                  <span>స్థాన పటము (Location Map)</span>
                </h4>
                
                <div className="flex bg-stone-100 p-0.5 rounded-xl border border-stone-200/40">
                  <button
                    type="button"
                    onClick={() => setMapTab('sketch')}
                    className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                      mapTab === 'sketch' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500'
                    }`}
                  >
                    స్కెచ్ పటం
                  </button>
                  <button
                    type="button"
                    onClick={() => setMapTab('google')}
                    className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                      mapTab === 'google' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500'
                    }`}
                  >
                    గూగుల్ మ్యాప్
                  </button>
                </div>
              </div>

              {mapTab === 'sketch' ? (
                <div className="relative w-full rounded-2xl overflow-hidden border border-amber-200/50 bg-stone-50 h-56 flex items-center justify-center">
                  <svg className="w-full h-full p-4" viewBox="0 0 500 250">
                    {mapData.roads.map((road, index) => (
                      <g key={index}>
                        <path d={road.path} fill="none" stroke="#e7e5e4" strokeWidth="18" strokeLinecap="round" />
                        <path d={road.path} fill="none" stroke="#ffffff" strokeWidth="12" strokeLinecap="round" />
                      </g>
                    ))}
                    {mapData.landmarks.map((landmark, index) => (
                      <g key={index} transform={`translate(${landmark.x}, ${landmark.y})`}>
                        <circle r="5" fill="#3b82f6" />
                        <text x="8" y="3" className="text-[9px] font-bold fill-stone-600">{landmark.teluguName}</text>
                      </g>
                    ))}
                    <g transform="translate(250, 125)">
                      <circle r="15" className="fill-amber-500/20 animate-ping" />
                      <circle r="6" className="fill-amber-600" />
                    </g>
                  </svg>
                  <div className="absolute top-2 left-2 bg-stone-900/80 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg">
                    📍 {locationText}
                  </div>
                </div>
              ) : (
                <div className="relative w-full h-56 rounded-2xl overflow-hidden border border-stone-200">
                  <iframe
                    title="google-map"
                    src={`https://maps.google.com/maps?q=${encodeURIComponent(locationText + ', Andhra Pradesh')}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                    className="w-full h-full border-0"
                    loading="lazy"
                  />
                </div>
              )}
            </div>

            {/* Action Buttons: Call, WhatsApp, Google Maps, Favorite, Contact Owner */}
            <div className="space-y-3 pt-2">
              <p className="text-xs text-stone-500 text-center font-medium">
                యజమాని <strong className="text-stone-900">{property.contactName || 'శివ రాఘవ గారు'}</strong> సంప్రదింపు వివరాలు:
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {/* 1. Direct Call */}
                <a
                  id="direct-call-action"
                  href={`tel:${rPhone}`}
                  className="flex items-center justify-center gap-2 px-3 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-2xl font-bold text-xs shadow-md active:scale-95 transition-all cursor-pointer"
                >
                  <Phone className="w-4 h-4 shrink-0" />
                  <span>కాల్ (Call)</span>
                </a>

                {/* 2. WhatsApp Direct */}
                <a
                  id="direct-whatsapp-action"
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 px-3 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-xs shadow-md active:scale-95 transition-all cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4 shrink-0" />
                  <span>వాట్సాప్ (WhatsApp)</span>
                </a>

                {/* 3. Google Maps External Link */}
                <a
                  id="direct-maps-action"
                  href={googleMapsSearchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 px-3 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-xs shadow-md active:scale-95 transition-all cursor-pointer"
                >
                  <Compass className="w-4 h-4 shrink-0" />
                  <span>మ్యాప్స్ (Maps)</span>
                </a>

                {/* 4. Contact Owner / Interested Form Button */}
                <button
                  id="direct-interested-action"
                  onClick={() => setShowInquiryModal(true)}
                  className="flex items-center justify-center gap-2 px-3 py-3 bg-stone-900 hover:bg-stone-850 text-white rounded-2xl font-bold text-xs shadow-md active:scale-95 transition-all cursor-pointer"
                >
                  <Send className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>ఆసక్తి (Interested)</span>
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Interested / Contact Owner Inquiry Modal */}
        {showInquiryModal && (
          <div className={`fixed inset-0 z-[55] flex items-center justify-center p-4 ${hasNativeHeader ? '' : 'pt-[74px]'}`}>
            <div
              className="absolute inset-0 bg-black/70 backdrop-blur-xs"
              onClick={() => setShowInquiryModal(false)}
            />
            <div className="relative bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl z-10 space-y-4">
              <div className="flex items-center justify-between border-b border-stone-150 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-amber-100 text-amber-700 rounded-xl">
                    <Send className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-stone-900 text-sm">యజమానికి సందేశం పంపండి</h4>
                    <p className="text-[10px] text-stone-500">Contact Owner & Send Purchase Inquiry</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowInquiryModal(false)}
                  className="p-1 rounded-lg text-stone-400 hover:text-stone-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {inquirySent ? (
                <div className="text-center py-6 space-y-3">
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
                    <Check className="w-6 h-6 stroke-[3]" />
                  </div>
                  <h5 className="font-bold text-stone-900 text-sm">మీ ఆసక్తి విజయవంతంగా నమోదైంది!</h5>
                  <p className="text-xs text-stone-600 leading-relaxed">
                    మీ వివరాలు యజమానికి చేరాయి. కొద్ది క్షణాల్లో వాట్సాప్ ద్వారా కూడా నేరుగా చాట్ ప్రారంభమవుతుంది.
                  </p>
                  <button
                    onClick={() => {
                      setShowInquiryModal(false);
                      setInquirySent(false);
                    }}
                    className="px-6 py-2.5 bg-stone-900 text-white rounded-xl text-xs font-bold"
                  >
                    ముగించు (Close)
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSendInquiry} className="space-y-3">
                  {inquiryError && (
                    <p className="text-rose-600 text-xs font-semibold">{inquiryError}</p>
                  )}

                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-stone-600">మీ పేరు (Your Name) *</label>
                    <input
                      type="text"
                      value={inquiryName}
                      onChange={(e) => setInquiryName(e.target.value)}
                      placeholder="మీ పేరు"
                      className="w-full px-3 py-2 border border-stone-200 rounded-xl text-xs bg-stone-50 focus:bg-white focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-stone-600">మొబైల్ నెంబర్ (Mobile Number) *</label>
                    <input
                      type="text"
                      value={inquiryPhone}
                      onChange={(e) => setInquiryPhone(e.target.value)}
                      placeholder="ఉదా: 9848022338"
                      className="w-full px-3 py-2 border border-stone-200 rounded-xl text-xs bg-stone-50 font-mono focus:bg-white focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-stone-600">సందేశం (Message)</label>
                    <textarea
                      rows={3}
                      value={inquiryMessage}
                      onChange={(e) => setInquiryMessage(e.target.value)}
                      className="w-full px-3 py-2 border border-stone-200 rounded-xl text-xs bg-stone-50 focus:bg-white focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowInquiryModal(false)}
                      className="flex-1 py-2.5 bg-stone-100 text-stone-700 text-xs font-bold rounded-xl"
                    >
                      రద్దు (Cancel)
                    </button>
                    <button
                      type="submit"
                      disabled={inquirySubmitting}
                      className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {inquirySubmitting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>పంపండి (Submit)</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </AnimatePresence>
  );
};
