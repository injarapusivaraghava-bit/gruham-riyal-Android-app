import React, { useState } from 'react';
import { PropertyListing, isOrchardProperty } from '../types';
import { PROPERTY_IMAGES } from '../propertyImages';
import { MapPin, CheckCircle2, Clock, Eye, MessageSquare, PhoneCall, Heart, GitCompare, Share2, Check, QrCode, X, Printer, Download, ChevronLeft, ChevronRight, Mail, Camera, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const DEFAULT_FALLBACK_IMAGE = PROPERTY_IMAGES.house;

export const getListingImages = (property: PropertyListing): string[] => {
  if (property.images && property.images.length > 0) {
    const valid = property.images.filter(img => Boolean(img && img.trim()));
    if (valid.length > 0) return valid;
  }

  switch (property.type) {
    case 'house':
      return [
        property.imageUrl || PROPERTY_IMAGES.house,
        PROPERTY_IMAGES.apartment,
        PROPERTY_IMAGES.plotFarmland,
      ];
    case 'apartment':
      return [
        property.imageUrl || PROPERTY_IMAGES.apartment,
        PROPERTY_IMAGES.house,
        PROPERTY_IMAGES.commercial,
      ];
    case 'plot':
      return [
        property.imageUrl || PROPERTY_IMAGES.plotFarmland,
        PROPERTY_IMAGES.orchard,
        PROPERTY_IMAGES.house,
      ];
    case 'commercial':
      return [
        property.imageUrl || PROPERTY_IMAGES.commercial,
        PROPERTY_IMAGES.apartment,
        PROPERTY_IMAGES.plotFarmland,
      ];
    case 'farm_land':
      if (isOrchardProperty(property)) {
        return [
          property.imageUrl || PROPERTY_IMAGES.orchard,
          PROPERTY_IMAGES.plotFarmland,
        ];
      }
      return [
        property.imageUrl || PROPERTY_IMAGES.plotFarmland,
        PROPERTY_IMAGES.orchard,
      ];
    default:
      return [property.imageUrl || DEFAULT_FALLBACK_IMAGE];
  }
};

interface ListingCardProps {
  property: PropertyListing;
  isBookmarked: boolean;
  onToggleBookmark: (id: string) => void;
  onViewDetails: (property: PropertyListing) => void;
  onContactWhatsApp: (property: PropertyListing) => void;
  isComparing?: boolean;
  onToggleCompare?: (property: PropertyListing) => void;
}

export const ListingCard: React.FC<ListingCardProps> = ({
  property,
  isBookmarked,
  onToggleBookmark,
  onViewDetails,
  onContactWhatsApp,
  isComparing = false,
  onToggleCompare,
}) => {
  const isApproved = property.isApproved === 'Yes';
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);
  const [showQrModal, setShowQrModal] = useState(false);
  const [isQrLoading, setIsQrLoading] = useState(true);
  const [imgFailed, setImgFailed] = useState(false);

  // Carousel Image Slider State and Handlers
  const images = getListingImages(property);
  const [currentImageIdx, setCurrentImageIdx] = useState(0);

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setImgFailed(false);
    setCurrentImageIdx((prev) => (prev + 1) % images.length);
  };

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setImgFailed(false);
    setCurrentImageIdx((prev) => (prev - 1 + images.length) % images.length);
  };

  const downloadQrCode = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}${window.location.pathname}?propertyId=${property.id}`;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(shareUrl)}`;
    try {
      const response = await fetch(qrCodeUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `ManaGruham_QR_${property.id}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('Failed to download QR code directly, opening in new tab:', err);
      window.open(qrCodeUrl, '_blank');
    }
  };

  const printQrCode = (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}${window.location.pathname}?propertyId=${property.id}`;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(shareUrl)}`;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>ప్రింట్ క్యూఆర్ కోడ్ - మన గృహం రియల్ యాప్</title>
            <style>
              body {
                font-family: system-ui, -apple-system, sans-serif;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 100vh;
                margin: 0;
                background-color: #fff;
                color: #0f172a;
                text-align: center;
                padding: 20px;
              }
              .container {
                border: 2px solid #d1fae5;
                padding: 40px;
                border-radius: 24px;
                max-width: 400px;
                box-shadow: 0 4px 12px rgba(6, 95, 70, 0.1);
              }
              .logo {
                font-size: 24px;
                font-weight: 800;
                color: #065f46;
                margin-bottom: 5px;
              }
              .sublogo {
                font-size: 11px;
                text-transform: uppercase;
                letter-spacing: 1px;
                color: #64748b;
                margin-bottom: 25px;
              }
              img {
                width: 250px;
                height: 250px;
                border: 1px solid #e2e8f0;
                border-radius: 12px;
                margin-bottom: 20px;
              }
              .title {
                font-size: 18px;
                font-weight: 700;
                margin-bottom: 8px;
              }
              .details {
                font-size: 14px;
                color: #334155;
                margin-bottom: 15px;
              }
              .footer {
                font-size: 12px;
                color: #94a3b8;
                margin-top: 20px;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="logo">మన గృహం రియల్ యాప్</div>
              <div class="sublogo">Mana Gruham Real App</div>
              <img src="${qrCodeUrl}" alt="QR Code" />
              <div class="title">${property.title}</div>
              <div class="details">${property.area}, ${property.city} | ధర: ₹ ${property.priceFormatted}</div>
              <p style="font-size: 13px; font-weight: 500; color: #059669; max-width: 300px; margin: 10px auto;">ఈ క్యూఆర్ కోడ్‌ను స్కాన్ చేసి స్మార్ట్‌ఫోన్‌లో పూర్తి ఆస్తి వివరాలు మరియు ఫోటోలు వీక్షించండి.</p>
              <div class="footer">రియల్ ఎస్టేట్ సేవలు: +91 8977776111</div>
            </div>
            <script>
              window.onload = function() {
                window.print();
                setTimeout(function() { window.close(); }, 500);
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const copyPropertyUrl = async (textToCopy: string): Promise<boolean> => {
    if (typeof navigator !== 'undefined' && navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(textToCopy);
        return true;
      } catch (clipErr) {
        console.warn('navigator.clipboard write failed, attempting textarea fallback:', clipErr);
      }
    }
    try {
      const textArea = document.createElement('textarea');
      textArea.value = textToCopy;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      textArea.setAttribute('readonly', '');
      document.body.appendChild(textArea);
      textArea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textArea);
      return success;
    } catch (e) {
      console.error('execCommand copy failed:', e);
      return false;
    }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const isFarm = property.type === 'farm_land';
    const locationStr = isFarm
      ? `${property.village ? `${property.village}, ` : ''}${property.mandal ? `${property.mandal}, ` : ''}${property.district || property.city || ''}`
      : `${property.area}, ${property.city}`;

    const shareUrl = `${window.location.origin}${window.location.pathname}?propertyId=${property.id}`;
    const shareTitle = `${property.title} | మన గృహం AP`;
    const shareText = `🏡 మన గృహం రియల్ యాప్ లో ఆస్తి వివరాలు:\n` +
      `*${property.title}*\n` +
      `📍 లొకేషన్: ${locationStr}\n` +
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
        setShareFeedback('షేర్ చేయబడింది! (Shared!)');
        setTimeout(() => setShareFeedback(null), 3000);
        return;
      } catch (err: any) {
        if (err && (err.name === 'AbortError' || err.code === 20)) {
          return;
        }
        console.warn('Native Web Share failed, falling back to clipboard copy:', err);
      }
    }

    const copied = await copyPropertyUrl(shareUrl);
    if (copied) {
      setShareFeedback('లింక్ కాపీ అయింది! (Link Copied!)');
      setTimeout(() => setShareFeedback(null), 3500);
    } else {
      const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareText}`)}`;
      window.open(whatsappUrl, '_blank');
      setShareFeedback('వాట్సాప్‌లో ఓపెన్ అయింది');
      setTimeout(() => setShareFeedback(null), 3000);
    }
  };

  const handleEmailShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}${window.location.pathname}?propertyId=${property.id}`;
    const emailSubject = encodeURIComponent(`మన గృహం రియల్ ఎస్టేట్: ${property.title}`);
    const emailBody = encodeURIComponent(
      `🏡 మన గృహం రియల్ యాప్ లో అద్భుతమైన ఆస్తి లభ్యం!\n\nఆస్తి: ${property.title}\nలొకేషన్: ${property.area}, ${property.city}\nధర: ₹ ${property.priceFormatted}\n\nమరిన్ని వివరాలు మరియు ఫోటోలు ఇక్కడ చూడండి:\n${shareUrl}\n\nకృతజ్ఞతలు.`
    );
    window.location.href = `mailto:injarapusivaraghava@gmail.com?subject=${emailSubject}&body=${emailBody}`;
  };

  const topBarGradient =
    property.type === 'house'
      ? 'from-amber-400 via-amber-500 to-emerald-500'
      : property.type === 'apartment'
        ? 'from-blue-500 via-cyan-500 to-emerald-500'
        : property.type === 'commercial'
          ? 'from-purple-600 via-indigo-600 to-blue-600'
          : 'from-emerald-500 via-teal-500 to-amber-500';

  const statusTagStyle =
    property.status === 'sale'
      ? 'bg-emerald-700/95 text-white border border-emerald-400/40'
      : property.status === 'rent'
        ? 'bg-blue-700/95 text-white border border-blue-400/40'
        : 'bg-purple-700/95 text-white border border-purple-400/40';

  const statusTagLabel =
    property.status === 'sale'
      ? 'అమ్మకానికి · Sale'
      : property.status === 'rent'
        ? 'అద్దెకు · Rent'
        : 'లీజుకు · Lease';

  const typeLabel =
    property.type === 'house'
      ? 'స్వతంత్ర ఇల్లు'
      : property.type === 'apartment'
        ? 'అపార్ట్‌మెంట్'
        : property.type === 'plot'
          ? 'ఓపెన్ ప్లాట్'
          : property.type === 'farm_land'
            ? property.landType?.replace(/^[^\s]+\s+/, '') || 'వ్యవసాయ భూమి'
            : 'కమర్షియల్';

  return (
    <motion.div
      id={`property-card-${property.id}`}
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.25 }}
      className={`bg-white rounded-3xl overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col h-full border ${
        property.packageName === 'featured'
          ? 'border-amber-400 ring-2 ring-amber-400/25 shadow-amber-100/60'
          : 'border-slate-200/80 hover:border-emerald-300'
      }`}
    >
      {/* Subtle 3px Colorful Brand Accent Header Bar */}
      <div className={`h-1 w-full bg-gradient-to-r ${topBarGradient}`} />

      {/* Property Image Carousel */}
      <div className="relative aspect-16/10 w-full overflow-hidden bg-slate-100 group/image-container">
        <div
          onClick={() => onViewDetails(property)}
          className="w-full h-full cursor-pointer relative"
        >
          {imgFailed ? (
            <div className="w-full h-full bg-gradient-to-br from-emerald-800 via-blue-900 to-purple-900 flex flex-col items-center justify-center p-4 text-center text-white">
              <Camera className="w-8 h-8 text-amber-300 mb-1.5" />
              <span className="text-xs font-bold">{property.title}</span>
              <span className="text-[11px] text-emerald-200 mt-0.5">{property.area}, {property.city}</span>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.img
                key={currentImageIdx}
                src={images[currentImageIdx]}
                alt={`${property.title} - Photo ${currentImageIdx + 1}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="w-full h-full object-cover group-hover/image-container:scale-[1.03] transition-transform duration-500"
                onError={(e) => {
                  const target = e.currentTarget;
                  if (target.src !== DEFAULT_FALLBACK_IMAGE) {
                    target.src = DEFAULT_FALLBACK_IMAGE;
                  } else {
                    setImgFailed(true);
                  }
                }}
              />
            </AnimatePresence>
          )}

          {/* Photo count indicator */}
          <div className="absolute bottom-3 right-3 flex items-center gap-1 z-10 bg-slate-950/65 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] font-bold text-white border border-white/15">
            <Camera className="w-3 h-3 text-amber-400" />
            <span>{images.length}</span>
          </div>
        </div>

        {/* Carousel Arrow Controls */}
        {images.length > 1 && (
          <>
            <button
              type="button"
              id={`card-prev-img-${property.id}`}
              onClick={handlePrevImage}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/95 backdrop-blur-md rounded-full flex items-center justify-center text-slate-800 hover:text-emerald-700 hover:bg-white shadow-md active:scale-90 transition-all duration-200 z-10 cursor-pointer md:opacity-0 md:group-hover/image-container:opacity-100 opacity-90"
              title="మునుపటి చిత్రం (Previous Image)"
            >
              <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
            </button>
            <button
              type="button"
              id={`card-next-img-${property.id}`}
              onClick={handleNextImage}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/95 backdrop-blur-md rounded-full flex items-center justify-center text-slate-800 hover:text-emerald-700 hover:bg-white shadow-md active:scale-90 transition-all duration-200 z-10 cursor-pointer md:opacity-0 md:group-hover/image-container:opacity-100 opacity-90"
              title="తదుపరి చిత్రం (Next Image)"
            >
              <ChevronRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </>
        )}

        {/* Top-Left Compact Status Indicator */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 items-center z-10 max-w-[65%]">
          <span className={`px-2.5 py-1 text-[10px] font-extrabold rounded-lg backdrop-blur-md shadow-sm ${statusTagStyle}`}>
            {statusTagLabel}
          </span>
          {property.packageName === 'featured' && (
            <span className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-extrabold rounded-lg bg-amber-400 text-slate-950 shadow-sm">
              <Sparkles className="w-3 h-3" />
              <span>Featured</span>
            </span>
          )}
          {!isApproved && (
            <span className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold rounded-lg bg-amber-500 text-white shadow-sm">
              <Clock className="w-3 h-3" />
              <span>Pending</span>
            </span>
          )}
        </div>

        {/* Top-Right Quick Icons: Compare, Share, Favorite */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
          {onToggleCompare && (
            <button
              id={`compare-btn-${property.id}`}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleCompare(property);
              }}
              className={`w-9 h-9 rounded-full backdrop-blur-md transition-all active:scale-95 flex items-center justify-center cursor-pointer shadow-sm border ${
                isComparing
                  ? 'bg-purple-600 border-purple-500 text-white'
                  : 'bg-white/95 border-white/80 text-slate-700 hover:text-purple-700 hover:bg-white'
              }`}
              title={isComparing ? 'పోలికల నుండి తీసివేయి' : 'పోల్చండి (Compare)'}
            >
              <GitCompare className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            id={`card-top-share-btn-${property.id}`}
            onClick={handleShare}
            className={`w-9 h-9 rounded-full backdrop-blur-md transition-all active:scale-95 flex items-center justify-center cursor-pointer shadow-sm border ${
              shareFeedback
                ? 'bg-emerald-600 border-emerald-500 text-white'
                : 'bg-white/95 border-white/80 text-slate-700 hover:text-blue-700 hover:bg-white'
            }`}
            title="లిస్టింగ్ షేర్ చేయండి (Share)"
          >
            {shareFeedback ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
          </button>

          <button
            id={`bookmark-btn-${property.id}`}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleBookmark(property.id);
            }}
            className={`w-9 h-9 rounded-full backdrop-blur-md transition-all active:scale-95 flex items-center justify-center cursor-pointer shadow-sm border ${
              isBookmarked
                ? 'bg-rose-500 border-rose-500 text-white'
                : 'bg-white/95 border-white/80 text-slate-700 hover:text-rose-600 hover:bg-white'
            }`}
            title={isBookmarked ? 'ఇష్టమైనవాటి నుండి తీసివేయి' : 'ఇష్టమైనవాటిలో చేర్చు'}
          >
            <Heart className={`w-4 h-4 ${isBookmarked ? 'fill-current text-white' : ''}`} />
          </button>
        </div>

        {/* High-Contrast Price Scrim at Image Footer */}
        <div className="absolute bottom-0 inset-x-0 bg-linear-to-t from-slate-950/85 via-slate-900/35 to-transparent p-4 pt-12 pointer-events-none flex items-end justify-between">
          <div>
            <p className="font-display font-extrabold text-xl text-white tabular-nums tracking-tight drop-shadow-sm">
              ₹ {property.priceFormatted}
            </p>
            {isApproved && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-300 mt-0.5">
                <CheckCircle2 className="w-3 h-3" />
                <span>100% Verified Listing</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Card Body Content */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Location Row */}
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="flex items-center gap-1.5 text-emerald-700 font-bold text-xs truncate">
              <MapPin className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
              <span className="truncate">
                {property.type === 'farm_land' && property.village
                  ? `${property.village}, ${property.district}`
                  : `${property.area}, ${property.city}`}
              </span>
            </div>
            {property.age !== undefined && (
              <span className="text-[11px] font-semibold text-blue-700 shrink-0">
                {property.age === 0 ? 'కొత్త నిర్మాణం' : `${property.age} సం||లు`}
              </span>
            )}
          </div>

          {/* Property Title */}
          <h3
            onClick={() => onViewDetails(property)}
            className="font-display font-bold text-base sm:text-[17px] text-slate-900 leading-snug line-clamp-2 hover:text-emerald-700 transition-colors cursor-pointer"
            title={property.title}
          >
            {property.title}
          </h3>

          {/* Concise Description */}
          <p className="text-xs text-slate-500 line-clamp-2 mt-1.5 leading-relaxed">
            {property.description}
          </p>

          {/* Unboxed Clean Key Specifications */}
          <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-700">
            <span className="font-bold text-purple-800">{typeLabel}</span>
            <span className="text-slate-300">·</span>
            <span className="font-semibold text-slate-800 tabular-nums">{property.size}</span>
            <span className="text-slate-300">·</span>
            <span className="font-medium text-amber-700">
              {property.type === 'farm_land'
                ? property.availabilityStatus || 'Available'
                : `${property.facing || 'East'} ఫేసింగ్`}
            </span>
          </div>
        </div>

        {/* Contact & Interactive Action Footer */}
        <div className="space-y-2.5 mt-4 border-t border-slate-100 pt-3 relative">
          {/* Owner / Agent Line */}
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="truncate">
              యజమాని: <strong className="text-slate-800 font-bold">{property.contactName || 'శివ రాఘవ'}</strong>
            </span>
            <a
              id={`agent-phone-link-${property.id}`}
              href={`tel:${(property.contactPhone || '8977776111').replace(/[^\d+]/g, '')}`}
              onClick={(e) => e.stopPropagation()}
              className="font-mono text-emerald-700 font-bold hover:underline shrink-0 flex items-center gap-1 tabular-nums"
            >
              <PhoneCall className="w-3 h-3 text-emerald-600" />
              <span>{property.contactPhone || '8977776111'}</span>
            </a>
          </div>

          {/* Primary Colorful Action Row (44px mobile touch targets) */}
          <div className="grid grid-cols-3 gap-2">
            <button
              id={`view-details-${property.id}`}
              type="button"
              onClick={() => onViewDetails(property)}
              className="min-h-[42px] inline-flex items-center justify-center gap-1 px-2 text-xs font-bold text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-all active:scale-95 cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5 shrink-0 text-blue-600" />
              <span className="truncate">వివరాలు</span>
            </button>

            <a
              id={`click-to-call-${property.id}`}
              href={`tel:${(property.contactPhone || '8977776111').replace(/[^\d+]/g, '')}`}
              onClick={(e) => e.stopPropagation()}
              className="min-h-[42px] inline-flex items-center justify-center gap-1 px-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-500 rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
              title={`కాల్ చేయండి: ${property.contactPhone || '8977776111'}`}
            >
              <PhoneCall className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">కాల్ (Call)</span>
            </a>

            <button
              id={`whatsapp-contact-${property.id}`}
              type="button"
              onClick={() => onContactWhatsApp(property)}
              className="min-h-[42px] inline-flex items-center justify-center gap-1 px-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">వాట్సాప్</span>
            </button>
          </div>

          {/* Secondary Utility Actions */}
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              id={`share-btn-${property.id}`}
              onClick={handleShare}
              className={`min-h-[38px] px-1.5 text-[11px] font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 border ${
                shareFeedback
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                  : 'bg-slate-50 hover:bg-emerald-50 border-slate-200 text-slate-700 hover:text-emerald-800'
              }`}
              title="లిస్టింగ్ షేర్ చేయండి"
            >
              {shareFeedback ? (
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              ) : (
                <Share2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              )}
              <span className="truncate">{shareFeedback ? 'కాపీ!' : 'షేర్'}</span>
            </button>

            {property.type === 'farm_land' || property.googleMapsUrl ? (
              <a
                id={`maps-card-btn-${property.id}`}
                href={property.googleMapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((property.village || property.area) + ", " + (property.district || property.city) + ", Andhra Pradesh, India")}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="min-h-[38px] text-[11px] font-bold rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 transition-all cursor-pointer flex items-center justify-center gap-1"
                title="గూగుల్ మ్యాప్స్ లో చూడండి"
              >
                <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>మ్యాప్స్</span>
              </a>
            ) : (
              <button
                type="button"
                id={`email-share-btn-${property.id}`}
                onClick={handleEmailShare}
                className="min-h-[38px] text-[11px] font-bold rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 transition-all cursor-pointer flex items-center justify-center gap-1"
                title="ఈమెయిల్ ద్వారా షేర్ చేయండి"
              >
                <Mail className="w-3.5 h-3.5 shrink-0" />
                <span>ఈమెయిల్</span>
              </button>
            )}

            <button
              type="button"
              id={`qr-btn-${property.id}`}
              onClick={(e) => {
                e.stopPropagation();
                setIsQrLoading(true);
                setShowQrModal(true);
              }}
              className="min-h-[38px] text-[11px] font-bold rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 transition-all cursor-pointer flex items-center justify-center gap-1"
              title="క్యూఆర్ కోడ్ (QR Code)"
            >
              <QrCode className="w-3.5 h-3.5 shrink-0" />
              <span>క్యూఆర్</span>
            </button>
          </div>

          <AnimatePresence>
            {shareFeedback && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                className="absolute -top-10 left-1/2 -translate-x-1/2 z-10 bg-slate-900 text-white font-bold text-[10px] px-3 py-1 rounded-lg shadow-md whitespace-nowrap"
              >
                {shareFeedback}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* QR Code Popover Modal Overlay */}
      <AnimatePresence>
        {showQrModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => {
              e.stopPropagation();
              setShowQrModal(false);
            }}
            className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 30 }}
              transition={{ type: 'spring', damping: 22, stiffness: 280 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-[28px] border border-stone-200/80 p-6 max-w-[340px] w-full text-center relative shadow-2xl flex flex-col items-center space-y-4"
            >
              {/* Close Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowQrModal(false);
                }}
                className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 p-1.5 hover:bg-stone-100 rounded-full transition-all cursor-pointer"
              >
                <X className="w-4.5 h-4.5" />
              </button>

              {/* Tag and Title */}
              <div className="flex flex-col items-center space-y-1.5 pt-2">
                <span className="flex items-center gap-1.5 text-[10px] font-black text-purple-700 bg-purple-50 px-3 py-1 rounded-full border border-purple-200/40 uppercase tracking-widest">
                  <QrCode className="w-3 h-3" />
                  <span>ఆస్తి క్యూఆర్ కోడ్ (QR Code)</span>
                </span>
                <h3 className="text-sm font-extrabold text-stone-900 line-clamp-1">
                  {property.title}
                </h3>
              </div>

              {/* QR Image Box */}
              <div className="relative w-44 h-44 bg-stone-50 border border-stone-200/50 rounded-2xl flex items-center justify-center p-3.5 shadow-inner overflow-hidden">
                {isQrLoading && (
                  <div className="absolute inset-0 bg-stone-100 flex flex-col items-center justify-center space-y-2">
                    <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                    <span className="text-[10px] text-stone-500 font-bold">క్యూఆర్ తయారవుతోంది...</span>
                  </div>
                )}
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(`${window.location.origin}${window.location.pathname}?propertyId=${property.id}`)}`}
                  alt="Property QR Code"
                  className="w-full h-full object-contain rounded-lg"
                  onLoad={() => setIsQrLoading(false)}
                />
              </div>

              {/* Info Card */}
              <div className="text-xs leading-relaxed bg-stone-50 border border-stone-150 rounded-xl p-3 w-full text-stone-700">
                <div className="font-bold text-stone-800">{property.area}, {property.city}</div>
                <div className="text-amber-700 font-black mt-0.5">ధర: ₹ {property.priceFormatted}</div>
              </div>

              <p className="text-[10px] text-stone-500 leading-normal">
                భౌతిక ప్రదేశాల్లో సులభంగా భాగస్వామ్యం చేయడానికి ఈ క్యూఆర్ కోడ్‌ను మీ మొబైల్ కెమెరాతో స్కాన్ చేయండి.
              </p>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2 w-full pt-1">
                <button
                  type="button"
                  onClick={downloadQrCode}
                  className="flex items-center justify-center gap-1.5 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>డౌన్‌లోడ్</span>
                </button>
                <button
                  type="button"
                  onClick={printQrCode}
                  className="flex items-center justify-center gap-1.5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>ప్రింట్ చేయి</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
