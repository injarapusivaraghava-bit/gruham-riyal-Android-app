import React, { useState, useEffect, useRef } from 'react';
import { PropertyListing, PropertyType, ListingStatus, PropertyDocument, PropertyPhoto, DocumentType, PhotoSlotType } from '../types';
import { 
  X, 
  Plus, 
  AlertCircle, 
  Building, 
  Home, 
  MapPin, 
  MessageSquare, 
  Check, 
  CreditCard, 
  ShieldCheck, 
  ArrowRight, 
  Loader2, 
  Upload, 
  FileText, 
  Camera, 
  Video, 
  Trash2, 
  Eye, 
  Compass, 
  Play, 
  Square, 
  Sparkles, 
  Sprout, 
  Trees, 
  Layers,
  Phone,
  FileCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AVAILABLE_CITIES, AREAS_BY_CITY, AP_DISTRICTS, MANDALS_BY_DISTRICT, VILLAGES_BY_MANDAL } from '../data';
import { RazorpayModal } from './RazorpayModal';
import { ManaGruhamLogo } from './ManaGruhamLogo';
import { PROPERTY_IMAGES } from '../propertyImages';

interface AddListingModalProps {
  onClose: () => void;
  onSubmit: (newListing: PropertyListing) => void;
  initialPackageId?: 'basic' | 'premium' | 'featured';
  editListing?: PropertyListing;
  initialCategory?: 'house_plots' | 'agri_lands' | 'gardens' | 'houses' | 'apartments' | 'commercial';
  initialScrollToSection?: 'photos' | 'documents' | 'videos';
}

// Preset selection of crystal clear real estate photos for all categories
const PHOTO_TEMPLATES = [
  { id: 't1', label: '🏡 ఆధునిక ఇల్లు (Modern House)', url: PROPERTY_IMAGES.house },
  { id: 't2', label: '🏰 లగ్జరీ విల్లా (Luxury Villa)', url: PROPERTY_IMAGES.house },
  { id: 't3', label: '🏢 ప్రీమియం ఫ్లాట్ (Apartment Flat)', url: PROPERTY_IMAGES.apartment },
  { id: 't4', label: '📐 ఇళ్ల స్థలాలు / ప్లాట్ (House Plot)', url: PROPERTY_IMAGES.plotFarmland },
  { id: 't5', label: '🌾 పంట పొలం (Paddy Field / Farmland)', url: PROPERTY_IMAGES.plotFarmland },
  { id: 't6', label: '💧 సాగు భూమి (Irrigated Farmland)', url: PROPERTY_IMAGES.plotFarmland },
  { id: 't7', label: '🥥 కొబ్బరి తోట (Coconut Garden)', url: PROPERTY_IMAGES.orchard },
  { id: 't8', label: '🥭 మామిడి తోట (Mango Orchard)', url: PROPERTY_IMAGES.orchard },
  { id: 't9', label: '🌴 పామాయిల్ తోట (Palm Garden)', url: PROPERTY_IMAGES.orchard },
  { id: 't10', label: '🏢 కమర్షియల్ స్పేస్ (Commercial Space)', url: PROPERTY_IMAGES.commercial },
];

export interface ListingPackage {
  id: 'basic' | 'premium' | 'featured';
  name: string;
  price: number;
  validity: number;
  features: string[];
  tag?: string;
  badgeColor?: string;
}

export const PACKAGES: ListingPackage[] = [
  {
    id: 'basic',
    name: 'Basic Listing',
    price: 499,
    validity: 90,
    features: [
      'Property Listing',
      'Up to 10 Photos',
      'WhatsApp Contact',
      'Phone Contact',
      'Valid for 90 Days',
      'Normal Search Listing'
    ],
    tag: 'Standard',
    badgeColor: 'bg-stone-500 text-stone-100'
  },
  {
    id: 'premium',
    name: 'Premium Listing',
    price: 999,
    validity: 180,
    features: [
      'Property Listing',
      'Up to 25 Photos',
      'WhatsApp Contact',
      'Phone Contact',
      'Featured Badge',
      'Higher Search Ranking',
      'Valid for 180 Days',
      'Priority Approval'
    ],
    tag: 'Recommended',
    badgeColor: 'bg-amber-500 text-stone-950'
  },
  {
    id: 'featured',
    name: 'Featured Listing',
    price: 1999,
    validity: 365,
    features: [
      'Property Listing',
      'Unlimited Photos',
      'Featured Badge',
      'Homepage Banner Display',
      'Top Search Ranking',
      'WhatsApp Contact',
      'Phone Contact',
      'Priority Approval',
      'Valid for 365 Days',
      'Homepage Highlight'
    ],
    tag: 'Premium Luxury',
    badgeColor: 'bg-blue-600 text-white'
  }
];

const PHOTO_SLOTS: { slot: PhotoSlotType; title: string; telugu: string; desc: string }[] = [
  { slot: 'front_view', title: 'Front View', telugu: 'ముందు భాగం వ్యూ', desc: 'ఆస్తి లేదా పొలం ప్రవేశ మార్గం' },
  { slot: 'road_access', title: 'Road Access', telugu: 'రోడ్డు సదుపాయం', desc: 'బీటీ లేదా అప్రోచ్ రోడ్డు వ్యూ' },
  { slot: 'full_land_view', title: 'Full Land View', telugu: 'పూర్తి స్థలం / పొలం వ్యూ', desc: 'విశాలమైన భూమి దృశ్యం' },
  { slot: 'water_facilities', title: 'Water Facilities', telugu: 'నీటి వసతి', desc: 'బోరుబావి, మోటారు లేదా కాలువ' },
  { slot: 'boundary', title: 'Boundary Photos', telugu: 'సరిహద్దులు / కంచె', desc: 'హద్దు రాళ్ళు లేదా ఫెన్సింగ్' },
  { slot: 'garden_trees', title: 'Garden & Trees', telugu: 'తోట / చెట్లు', desc: 'మామిడి, కొబ్బరి, లేదా పంట' },
];

export const AddListingModal: React.FC<AddListingModalProps> = ({
  onClose,
  onSubmit,
  initialPackageId,
  editListing,
  initialCategory,
  initialScrollToSection,
}) => {
  const [step, setStep] = useState<'form' | 'package' | 'payment'>('form');
  const [selectedPkgId, setSelectedPkgId] = useState<'basic' | 'premium' | 'featured'>(editListing?.packageName || initialPackageId || 'basic');
  
  // Basic Info
  const [city, setCity] = useState(editListing?.city || 'Kakinada');
  const [area, setArea] = useState(editListing?.area || 'Turangi');
  const [title, setTitle] = useState(editListing?.title || '');
  const [description, setDescription] = useState(editListing?.description || '');
  const [price, setPrice] = useState<number>(editListing?.price || 4500000);
  const [priceText, setPriceText] = useState(editListing?.priceFormatted || '45 లక్షలు (45 Lakhs)');
  const [type, setType] = useState<PropertyType>(editListing?.type || (initialCategory === 'house_plots' ? 'plot' : initialCategory === 'agri_lands' || initialCategory === 'gardens' ? 'farm_land' : initialCategory === 'commercial' ? 'commercial' : initialCategory === 'apartments' ? 'apartment' : 'house'));
  const [status, setStatus] = useState<ListingStatus>((editListing?.status as any) || 'sale');
  
  // Specific category mode: House Plots / Agricultural Lands / Gardens & Orchards / etc.
  const [prominentCategory, setProminentCategory] = useState<'house_plots' | 'agri_lands' | 'gardens' | 'houses' | 'apartments' | 'commercial'>(() => {
    if (initialCategory) return initialCategory;
    if (editListing?.type === 'plot') return 'house_plots';
    if (editListing?.type === 'farm_land') {
      return (editListing?.gardenType && editListing.gardenType !== 'All') ? 'gardens' : 'agri_lands';
    }
    if (editListing?.type === 'apartment') return 'apartments';
    if (editListing?.type === 'commercial') return 'commercial';
    return 'houses';
  });

  // Specs
  const [beds, setBeds] = useState<number>(editListing?.beds || 2);
  const [baths, setBaths] = useState<number>(editListing?.baths || 2);
  const [size, setSize] = useState(editListing?.size || '1400 sqft');
  const [facing, setFacing] = useState<'East' | 'West' | 'North' | 'South' | 'North-East' | 'South-East' | 'North-West' | 'South-West'>(editListing?.facing || 'East');
  const [age, setAge] = useState<number>(editListing?.age || 0);
  const [contactName, setContactName] = useState(editListing?.contactName || '');
  const [contactPhone, setContactPhone] = useState(editListing?.contactPhone || '8977776111');
  const [contactEmail, setContactEmail] = useState(editListing?.contactEmail || 'injarapusivaraghava@gmail.com');

  // Agricultural & Land Specific Fields
  const [district, setDistrict] = useState(editListing?.district || 'Kakinada');
  const [mandal, setMandal] = useState(editListing?.mandal || '');
  const [village, setVillage] = useState(editListing?.village || '');
  const [exactLocation, setExactLocation] = useState(editListing?.exactLocation || '');
  const [googleMapsUrl, setGoogleMapsUrl] = useState(editListing?.googleMapsUrl || '');
  const [landAreaAcres, setLandAreaAcres] = useState<number>(editListing?.landAreaAcres || 1);
  const [landAreaCents, setLandAreaCents] = useState<number>(editListing?.landAreaCents || 0);
  const [squareYards, setSquareYards] = useState<number>(editListing?.squareYards || 0);
  const [landType, setLandType] = useState(editListing?.landType || '🌾 పంట పొలాలు');
  const [cropType, setCropType] = useState(editListing?.cropType || '');
  const [gardenType, setGardenType] = useState(editListing?.gardenType || '');
  const [waterFacilities, setWaterFacilities] = useState<string[]>(editListing?.waterFacility || ['బోరుబావి (Borewell)']);
  const [electricity, setElectricity] = useState<string>(typeof editListing?.electricity === 'string' ? editListing.electricity : '3-ఫేజ్ వ్యవసాయ విద్యుత్ (3-Phase)');
  const [roadAccess, setRoadAccess] = useState(editListing?.roadAccess || 'BT Road (బీటీ రోడ్డు)');
  const [pricePerAcre, setPricePerAcre] = useState<number>(editListing?.pricePerAcre || 2500000);
  const [whatsappContact, setWhatsappContact] = useState(editListing?.whatsappContact || '8977776111');
  const [availabilityStatus, setAvailabilityStatus] = useState<'Available' | 'Sold' | 'Leased' | 'Under Discussion'>(editListing?.availabilityStatus || 'Available');
  const [fencing, setFencing] = useState(editListing?.fencing || 'కంచె ఉంది (Fenced)');

  // Photos State
  const [slotPhotos, setSlotPhotos] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    if (editListing?.categorizedPhotos) {
      editListing.categorizedPhotos.forEach((p) => {
        map[p.slot] = p.url;
      });
    }
    return map;
  });
  const [selectedPhoto, setSelectedPhoto] = useState(editListing?.imageUrl || PHOTO_TEMPLATES[0].url);
  const [customPhotoUrl, setCustomPhotoUrl] = useState(editListing?.imageUrl || '');
  const [additionalPhotos, setAdditionalPhotos] = useState<string[]>(editListing?.images || []);
  const [uploadingSlot, setUploadingSlot] = useState<string | null>(null);

  // Documents State
  const [documents, setDocuments] = useState<PropertyDocument[]>(editListing?.documents || []);
  const [docTypeToUpload, setDocTypeToUpload] = useState<DocumentType>('pattadar_passbook');
  const [docUploading, setDocUploading] = useState<boolean>(false);
  const [docUploadProgress, setDocUploadProgress] = useState<number>(0);

  // Video & Live Camera State
  const [videoUrl, setVideoUrl] = useState<string>(editListing?.videoUrl || '');
  const [videoUploading, setVideoUploading] = useState<boolean>(false);
  const [videoProgress, setVideoProgress] = useState<number>(0);
  const [isLiveCameraActive, setIsLiveCameraActive] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const videoPreviewRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordIntervalRef = useRef<any>(null);

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [tempListing, setTempListing] = useState<PropertyListing | null>(null);
  const [paymentTxId, setPaymentTxId] = useState(editListing?.paymentId || '');

  // Synchronize category selection with types
  const handleSelectProminentCategory = (cat: 'house_plots' | 'agri_lands' | 'gardens' | 'houses' | 'apartments' | 'commercial') => {
    setProminentCategory(cat);
    if (cat === 'house_plots') {
      setType('plot');
      setLandType('📐 ఇళ్ల స్థలాలు / ఓపెన్ ప్లాట్లు');
    } else if (cat === 'agri_lands') {
      setType('farm_land');
      setLandType('🌾 పంట పొలాలు');
      setGardenType('');
    } else if (cat === 'gardens') {
      setType('farm_land');
      setLandType('🥭 మామిడి & కొబ్బరి తోటలు');
      setGardenType('మామిడి / కొబ్బరి తోట');
    } else if (cat === 'houses') {
      setType('house');
    } else if (cat === 'apartments') {
      setType('apartment');
    } else if (cat === 'commercial') {
      setType('commercial');
    }
  };

  // Dynamically update area list when city changes
  useEffect(() => {
    if (editListing) return;
    const areas = AREAS_BY_CITY[city] || [];
    const firstNonAllArea = areas.find((a) => a !== 'All') || 'Turangi';
    setArea(firstNonAllArea);
  }, [city, editListing]);

  // Synchronize agricultural location selects
  useEffect(() => {
    if (editListing) return;
    if (type === 'farm_land' || prominentCategory === 'agri_lands' || prominentCategory === 'gardens') {
      const mandals = MANDALS_BY_DISTRICT[district] || [];
      const firstMandal = mandals[0] || '';
      setMandal(firstMandal);
    }
  }, [district, type, prominentCategory, editListing]);

  useEffect(() => {
    if (editListing) return;
    if ((type === 'farm_land' || prominentCategory === 'agri_lands' || prominentCategory === 'gardens') && mandal) {
      const villages = VILLAGES_BY_MANDAL[mandal] || [];
      const firstVillage = villages[0] || '';
      setVillage(firstVillage);
    }
  }, [mandal, type, prominentCategory, editListing]);

  // Scroll to specified section if triggered via Upload Photos / Documents / Video buttons
  useEffect(() => {
    if (!initialScrollToSection) return;
    const timer = setTimeout(() => {
      const el = document.getElementById(`section-${initialScrollToSection}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [initialScrollToSection]);

  // Clean up media streams
  useEffect(() => {
    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (recordIntervalRef.current) {
        clearInterval(recordIntervalRef.current);
      }
    };
  }, []);

  // File Upload Helper to server endpoint
  const uploadFileToServer = async (file: File, onProgress?: (p: number) => void): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          if (onProgress) onProgress(35);
          const dataUrl = reader.result as string;
          const res = await fetch('/api/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              dataUrl,
              fileName: file.name,
              fileType: file.type,
            }),
          });
          if (onProgress) onProgress(75);
          if (res.ok) {
            const data = await res.json();
            if (onProgress) onProgress(100);
            resolve(data.url);
          } else {
            if (onProgress) onProgress(100);
            resolve(dataUrl); // Fallback to dataUrl
          }
        } catch (e) {
          if (onProgress) onProgress(100);
          resolve(reader.result as string);
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Upload Photo for specific category slot
  const handleSlotPhotoUpload = async (slot: PhotoSlotType, file: File) => {
    setUploadingSlot(slot);
    try {
      const url = await uploadFileToServer(file);
      setSlotPhotos((prev) => ({ ...prev, [slot]: url }));
      if (!selectedPhoto || selectedPhoto === PHOTO_TEMPLATES[0].url) {
        setSelectedPhoto(url);
      }
    } catch (err) {
      console.error('Slot photo upload error:', err);
    } finally {
      setUploadingSlot(null);
    }
  };

  // Document Upload Handler
  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setDocUploading(true);
    setDocUploadProgress(10);
    try {
      const url = await uploadFileToServer(file, (p) => setDocUploadProgress(p));
      const typeTitles: Record<DocumentType, string> = {
        pattadar_passbook: 'పట్టాదారు పాస్ పుస్తకం (Pattadar Passbook)',
        sale_deed: 'సేల్ డీడ్ / క్రయ పత్రం (Sale Deed)',
        registration_doc: 'రిజిస్ట్రేషన్ పత్రాలు (Registration Documents)',
        survey_map: 'సర్వే మ్యాప్ / FMB (Survey Documents)',
        other_ownership: 'ఇతర యాజమాన్య పత్రాలు (Ownership Document)',
      };

      const newDoc: PropertyDocument = {
        id: `doc-${Date.now()}`,
        type: docTypeToUpload,
        title: typeTitles[docTypeToUpload],
        fileName: file.name,
        fileUrl: url,
        fileSize: `${(file.size / 1024).toFixed(1)} KB`,
        uploadedAt: new Date().toISOString(),
        isVerified: true,
      };

      setDocuments((prev) => [...prev, newDoc]);
    } catch (err) {
      console.error('Doc upload error:', err);
      alert('పత్రం అప్‌లోడ్ చేయడంలో లోపం తలెత్తింది.');
    } finally {
      setDocUploading(false);
      setDocUploadProgress(0);
      e.target.value = '';
    }
  };

  // Video Upload Handler
  const handleVideoFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setVideoUploading(true);
    setVideoProgress(15);
    try {
      const url = await uploadFileToServer(file, (p) => setVideoProgress(p));
      setVideoUrl(url);
    } catch (err) {
      console.error('Video upload error:', err);
      alert('వీడియో అప్‌లోడ్ చేయడంలో లోపం తలెత్తింది.');
    } finally {
      setVideoUploading(false);
      setVideoProgress(0);
      e.target.value = '';
    }
  };

  // Live Camera Controls (Real browser camera stream)
  const startLiveCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true,
      });
      mediaStreamRef.current = stream;
      setIsLiveCameraActive(true);
      setTimeout(() => {
        if (videoPreviewRef.current) {
          videoPreviewRef.current.srcObject = stream;
          videoPreviewRef.current.play().catch(console.error);
        }
      }, 200);
    } catch (err: any) {
      console.error('Camera access error:', err);
      setCameraError('కెమెరా అందుబాటులో లేదు లేదా అనుమతి నిరాకరించబడింది (Camera permission denied).');
    }
  };

  const stopLiveCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (isRecording) {
      stopRecordingVideo();
    }
    setIsLiveCameraActive(false);
  };

  const startRecordingVideo = () => {
    if (!mediaStreamRef.current) return;
    recordedChunksRef.current = [];
    try {
      const recorder = new MediaRecorder(mediaStreamRef.current, { mimeType: 'video/webm' });
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };
      recorder.onstop = async () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const file = new File([blob], `recorded_land_${Date.now()}.webm`, { type: 'video/webm' });
        setVideoUploading(true);
        const url = await uploadFileToServer(file);
        setVideoUrl(url);
        setVideoUploading(false);
        stopLiveCamera();
      };
      recorder.start(1000);
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setRecordingSeconds(0);
      recordIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (e) {
      console.error('Recording start error:', e);
    }
  };

  const stopRecordingVideo = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordIntervalRef.current) {
        clearInterval(recordIntervalRef.current);
      }
    }
  };

  const takeCameraSnapshot = () => {
    if (!videoPreviewRef.current) return;
    const video = videoPreviewRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setSelectedPhoto(dataUrl);
      setSlotPhotos((prev) => ({ ...prev, front_view: dataUrl }));
      alert('కెమెరా ద్వారా ఫోటో తీయబడింది! (Photo snapshot captured successfully)');
    }
  };

  // Form submission
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!title.trim()) {
      setErrorMsg('దయచేసి ఆస్తి శీర్షిక రాయండి (Title is required).');
      return;
    }
    if (!description.trim()) {
      setErrorMsg('దయచేసి వివరణను టైప్ చేయండి (Description is required).');
      return;
    }
    if (!contactName.trim()) {
      setErrorMsg('దయచేసి మీ పేరు రాయండి (Your name is required).');
      return;
    }
    if (!contactPhone.trim()) {
      setErrorMsg('దయచేసి ఫోన్ నెంబర్ టైప్ చేయండి (Phone number is required).');
      return;
    }

    // Auto format price
    let formattedPrice = priceText;
    if (!priceText.trim()) {
      if (status === 'rent') {
        formattedPrice = `${price.toLocaleString('en-IN')} / నెల (Month)`;
      } else if (status === 'lease') {
        formattedPrice = `${price.toLocaleString('en-IN')} / లీజు (Lease)`;
      } else {
        if (price >= 10000000) {
          formattedPrice = `${(price / 10000000).toFixed(2)} కోట్లు (Crores)`;
        } else {
          formattedPrice = `${(price / 100000).toFixed(1)} లక్షలు (Lakhs)`;
        }
      }
    }

    const finalPhoto = customPhotoUrl.trim() 
      ? customPhotoUrl.trim() 
      : slotPhotos['front_view'] || selectedPhoto || PHOTO_TEMPLATES[0].url;

    const categorizedPhotosList: PropertyPhoto[] = Object.entries(slotPhotos)
      .filter(([_, url]) => Boolean(url))
      .map(([slotKey, url]) => ({
        slot: slotKey as PhotoSlotType,
        label: PHOTO_SLOTS.find((s) => s.slot === slotKey)?.telugu || 'ఫోటో',
        url: url as string,
      }));

    const allImagesList = Array.from(new Set([
      finalPhoto,
      ...Object.values(slotPhotos).filter(Boolean),
      ...additionalPhotos.filter(Boolean),
    ]));

    const computedSize = (type === 'farm_land' || prominentCategory === 'agri_lands' || prominentCategory === 'gardens')
      ? `${landAreaAcres} Acres ${landAreaCents} Cents`
      : prominentCategory === 'house_plots'
      ? `${squareYards || size} Sq. Yards`
      : size;

    const isAgriOrPlot = type === 'farm_land' || prominentCategory === 'house_plots' || prominentCategory === 'agri_lands' || prominentCategory === 'gardens';

    const partialListing: PropertyListing = {
      id: editListing ? editListing.id : `prop-user-${Date.now()}`,
      title,
      description,
      price,
      priceFormatted: formattedPrice,
      type,
      status: (status as any),
      city: isAgriOrPlot ? district : city,
      area: isAgriOrPlot ? (village ? `${village}, ${mandal}` : mandal) : area,
      beds: type === 'house' || type === 'apartment' ? beds : undefined,
      baths: type === 'house' || type === 'apartment' ? baths : undefined,
      size: computedSize,
      facing: isAgriOrPlot ? facing : facing,
      age: type !== 'plot' && type !== 'farm_land' ? age : undefined,
      imageUrl: finalPhoto,
      images: allImagesList,
      categorizedPhotos: categorizedPhotosList,
      documents,
      isApproved: 'Pending', // All new or edited submissions enter admin approval queue
      contactName,
      contactPhone,
      contactEmail,
      submittedBy: editListing ? editListing.submittedBy : 'యూజర్ సబ్మిషన్ (User Submission)',
      createdAt: editListing ? editListing.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      features: isAgriOrPlot ? waterFacilities : ['కార్ పార్కింగ్', 'నిరంతర మంచినీరు', 'వాస్తు ప్రకారం'],
      
      // Fields
      district,
      mandal,
      village,
      exactLocation,
      googleMapsUrl,
      landAreaAcres: type === 'farm_land' ? landAreaAcres : undefined,
      landAreaCents: type === 'farm_land' ? landAreaCents : undefined,
      squareYards: prominentCategory === 'house_plots' ? squareYards : undefined,
      landType,
      cropType,
      gardenType,
      waterFacility: waterFacilities,
      electricity,
      roadAccess,
      fencing,
      pricePerAcre: type === 'farm_land' ? pricePerAcre : undefined,
      whatsappContact,
      videoUrl,
      hasLiveCameraRecorded: Boolean(videoUrl),
      availabilityStatus,
    };

    if (editListing) {
      const completedListing: PropertyListing = {
        ...editListing,
        ...partialListing,
      };
      onSubmit(completedListing);
      setIsSubmitted(true);
    } else {
      setTempListing(partialListing);
      setStep('package');
    }
  };

  const handlePaymentSuccess = (paymentId: string) => {
    if (!tempListing) return;
    setPaymentTxId(paymentId);
    
    const selectedPkg = PACKAGES.find((p) => p.id === selectedPkgId) || PACKAGES[0];
    const now = new Date();
    const expiry = new Date();
    expiry.setDate(now.getDate() + selectedPkg.validity);

    const finalListing: PropertyListing = {
      ...tempListing,
      paymentId,
      paymentAmount: selectedPkg.price,
      packageName: selectedPkg.id,
      paymentStatus: 'success',
      paymentDate: now.toISOString(),
      startDate: now.toISOString(),
      expiryDate: expiry.toISOString(),
      isApproved: 'Pending', // Sent to Admin approval queue as requested
    };

    // Save Ownership to localStorage for User Panel
    const existingUserIds = JSON.parse(localStorage.getItem('mana_gruham_user_listing_ids') || '[]');
    localStorage.setItem('mana_gruham_user_listing_ids', JSON.stringify([...existingUserIds, finalListing.id]));

    // Submit listing to parent state & backend
    onSubmit(finalListing);
    setIsSubmitted(true);
  };

  return (
    <AnimatePresence>
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 ${
          typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('nativeHeader') === '1'
            ? ''
            : 'pt-[74px]'
        }`}
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={!isSubmitted && step !== 'payment' ? onClose : undefined}
          className="absolute inset-0 bg-black/60 backdrop-blur-xs"
        />

        {/* Modal panel */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className={`relative bg-white rounded-3xl w-full ${step === 'package' ? 'max-w-4xl' : 'max-w-2xl'} max-h-[calc(100vh-92px)] overflow-hidden shadow-2xl flex flex-col z-10 transition-all duration-350`}
        >
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-emerald-100 flex items-center justify-between bg-gradient-to-r from-emerald-50/90 via-white to-blue-50/60">
            <div className="flex items-center gap-3 min-w-0">
              <ManaGruhamLogo size={38} className="w-9 h-9 shrink-0" />
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-extrabold text-emerald-800 uppercase tracking-wide">
                    Mana Gruham
                  </span>
                </div>
                <h3 className="font-display font-bold text-stone-900 text-base md:text-lg leading-tight truncate">
                  {step === 'form' && (editListing ? 'ఆస్తి సవరణ (Edit Property)' : 'కొత్త స్థిరాస్తిని అప్‌లోడ్ చేయండి')}
                  {step === 'package' && 'ప్యాకేజీని ఎంచుకోండి (Choose Package)'}
                  {step === 'payment' && 'చెల్లింపు (Razorpay Payment)'}
                  {isSubmitted && 'సమర్పణ విజయవంతమైంది!'}
                </h3>
                <p className="text-[10px] text-stone-500 font-medium truncate">
                  తెలుగు + English సులభమైన లిస్టింగ్ ఫారం • లైవ్ మీడియా & పత్రాల భద్రత
                </p>
              </div>
            </div>
            {!isSubmitted && (
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Scrollable Container */}
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 max-h-[calc(92vh-130px)] space-y-6">
            {isSubmitted ? (
              /* Success screen */
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-6 space-y-5"
              >
                <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                  <Check className="w-8 h-8 stroke-[3]" />
                </div>
                <div className="space-y-2">
                  <h4 className="font-display font-black text-stone-950 text-lg">
                    {editListing ? 'సవరణ విజయవంతంగా నమోదైంది!' : 'ఆస్తి విజయవంతంగా సమర్పించబడింది!'}
                  </h4>
                  <p className="text-xs text-stone-600 max-w-md mx-auto leading-relaxed">
                    మీరు నమోదు చేసిన ఆస్తి సమాచారం, ఫోటోలు, వీడియో మరియు పత్రాలు సురక్షితంగా సేవ్ చేయబడ్డాయి.
                    ఈ లిస్టింగ్ ప్రస్తుతం <strong className="text-amber-700">అడ్మిన్ పరిశీలన (Admin Approval)</strong> లో ఉంది.
                    ఆమోదం పొందిన తర్వాత హోమ్ స్క్రీన్‌లో పబ్లిక్‌గా కనిపిస్తుంది.
                  </p>
                </div>

                <div className="max-w-md mx-auto p-4 bg-stone-50 rounded-2xl border border-stone-200 text-left space-y-2 font-mono text-[11px] text-stone-600">
                  <div className="flex justify-between border-b border-stone-150 pb-1.5">
                    <span>Listing Status:</span>
                    <span className="text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded">Pending Approval</span>
                  </div>
                  <div className="flex justify-between border-b border-stone-150 pb-1.5">
                    <span>Availability:</span>
                    <span className="text-stone-900 font-bold">{availabilityStatus}</span>
                  </div>
                  <div className="flex justify-between border-b border-stone-150 pb-1.5">
                    <span>Documents Uploaded:</span>
                    <span className="text-emerald-700 font-bold">{documents.length} Secured Documents</span>
                  </div>
                  {videoUrl && (
                    <div className="flex justify-between border-b border-stone-150 pb-1.5">
                      <span>Video Available:</span>
                      <span className="text-blue-700 font-bold">Yes (Recorded / Uploaded)</span>
                    </div>
                  )}
                  {paymentTxId && (
                    <div className="flex justify-between">
                      <span>Payment TXN:</span>
                      <span className="text-stone-900 font-bold">{paymentTxId}</span>
                    </div>
                  )}
                </div>

                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200/60 text-left text-xs text-amber-900 leading-relaxed max-w-md mx-auto space-y-1">
                  <p className="font-bold flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-amber-700" />
                    <span>తదుపరి దశ (Next Step):</span>
                  </p>
                  <p>
                    అడ్మిన్ (శివ రాఘవ గారు) ఈ లిస్టింగ్‌ను పరిశీలించి అప్రూవ్ చేయగానే ప్రజలందరికీ కనిపిస్తుంది.
                    మీరే అడ్మిన్ అయితే పాస్‌కోడ్ <code className="font-bold bg-white px-1.5 py-0.5 rounded border border-amber-300">raghava123</code> తో అడ్మిన్ ప్యానెల్‌లో వెంటనే అప్రూవ్ చేసుకోవచ్చు.
                  </p>
                </div>

                <button
                  id="close-success-btn"
                  onClick={onClose}
                  className="px-8 py-3 bg-stone-900 hover:bg-stone-850 text-white font-bold text-xs rounded-xl hover:shadow-lg active:scale-95 transition-all cursor-pointer"
                >
                  పూర్తయింది (Close)
                </button>
              </motion.div>
            ) : step === 'package' ? (
              /* Step 2: Package Selection View */
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div className="text-center max-w-md mx-auto space-y-2">
                  <h4 className="font-display font-bold text-stone-900 text-sm md:text-base">
                    స్థిరాస్తి ప్రకటన కోసం ప్యాకేజీని ఎంచుకోండి
                  </h4>
                  <p className="text-xs text-stone-500">
                    మీ ఆస్తిని వేగంగా అమ్మడానికి లేదా లీజుకు ఇవ్వడానికి తగిన ప్రమోషన్ ప్యాకేజీని ఎంచుకోండి.
                  </p>
                </div>

                {/* Package Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {PACKAGES.map((pkg) => {
                    const isSelected = selectedPkgId === pkg.id;
                    return (
                      <div
                        id={`pkg-card-${pkg.id}`}
                        key={pkg.id}
                        onClick={() => setSelectedPkgId(pkg.id)}
                        className={`relative rounded-2xl p-4 border transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'bg-stone-900 text-stone-100 border-stone-900 shadow-xl scale-[1.02]'
                            : 'bg-white text-stone-800 border-stone-200 hover:border-amber-500/40'
                        }`}
                      >
                        {pkg.tag && (
                          <div className={`absolute -top-2.5 right-4 text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${pkg.badgeColor || 'bg-stone-500 text-stone-100'} tracking-wider shadow-sm`}>
                            {pkg.tag}
                          </div>
                        )}

                        <div className="space-y-3">
                          <div>
                            <span className={`text-[10px] font-black uppercase tracking-wider block ${isSelected ? 'text-amber-400' : 'text-amber-600'}`}>
                              {pkg.name}
                            </span>
                            <h5 className="font-display font-black text-xl pt-1">
                              ₹{pkg.price} <span className="text-[10px] text-stone-400 font-semibold font-sans">/ {pkg.validity} Days</span>
                            </h5>
                          </div>

                          <div className={`border-t pt-3 space-y-1.5 ${isSelected ? 'border-stone-850' : 'border-stone-100'}`}>
                            {pkg.features.map((feat, idx) => (
                              <div key={idx} className="flex items-start gap-1.5 text-[11px]">
                                <Check className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${isSelected ? 'text-emerald-400' : 'text-emerald-600'}`} />
                                <span className={isSelected ? 'text-stone-300' : 'text-stone-600'}>{feat}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-dashed border-stone-200/20">
                          <span className={`w-full py-1.5 rounded-lg text-[10px] font-bold text-center block ${
                            isSelected 
                              ? 'bg-amber-600 text-white' 
                              : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                          }`}>
                            {isSelected ? 'ఎంచుకోబడింది (Selected)' : 'ఎంచుకోండి (Select)'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    id="back-to-details-btn"
                    onClick={() => setStep('form')}
                    className="flex-1 py-3 text-stone-600 bg-stone-100 hover:bg-stone-200 text-xs font-bold rounded-xl transition-all cursor-pointer"
                  >
                    వెనక్కి వెళ్ళండి (Back to Details)
                  </button>
                  <button
                    id="proceed-to-pay-btn"
                    onClick={() => setStep('payment')}
                    className="flex-1 py-3 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-md active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>చెల్లించండి ₹{PACKAGES.find((p) => p.id === selectedPkgId)?.price} (Pay & Submit)</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ) : step === 'payment' ? (
              /* Step 3: Razorpay Payment */
              <div className="py-12 text-center space-y-4">
                <Loader2 className="w-10 h-10 text-amber-600 animate-spin mx-auto" />
                <p className="text-xs text-stone-600 font-semibold">
                  దయచేసి నిరీక్షించండి... Razorpay పేమెంట్ గేట్‌వే ఓపెన్ చేయబడుతోంది...
                </p>
                <RazorpayModal
                  isOpen={step === 'payment'}
                  onClose={() => setStep('package')}
                  onSuccess={handlePaymentSuccess}
                  amount={PACKAGES.find((p) => p.id === selectedPkgId)?.price || 499}
                  propertyName={tempListing?.title || 'ప్రాపర్టీ లిస్టింగ్ రుసుము'}
                />
              </div>
            ) : (
              /* Step 1: Telugu + English Property Form */
              <form onSubmit={handleFormSubmit} className="space-y-6">
                {errorMsg && (
                  <div className="p-3 bg-rose-50 text-rose-800 rounded-xl text-xs flex items-center gap-2 border border-rose-100 font-medium">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* 1. Main Prominent Property Categories */}
                <div className="space-y-2">
                  <label className="block text-xs font-black text-stone-800 uppercase tracking-wide">
                    ప్రధాన కేటగిరీని ఎంచుకోండి (Select Main Category) <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => handleSelectProminentCategory('house_plots')}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        prominentCategory === 'house_plots'
                          ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-500/20'
                          : 'bg-white hover:bg-stone-50 border-stone-200 text-stone-800'
                      }`}
                    >
                      <MapPin className={`w-4 h-4 mb-1.5 ${prominentCategory === 'house_plots' ? 'text-white' : 'text-blue-600'}`} />
                      <div>
                        <div className="font-bold text-xs">1. ఇళ్ల స్థలాలు</div>
                        <div className={`text-[10px] ${prominentCategory === 'house_plots' ? 'text-blue-100' : 'text-stone-400'}`}>House Plots</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSelectProminentCategory('agri_lands')}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        prominentCategory === 'agri_lands'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-md ring-2 ring-emerald-500/20'
                          : 'bg-white hover:bg-stone-50 border-stone-200 text-stone-800'
                      }`}
                    >
                      <Sprout className={`w-4 h-4 mb-1.5 ${prominentCategory === 'agri_lands' ? 'text-white' : 'text-emerald-600'}`} />
                      <div>
                        <div className="font-bold text-xs">2. వ్యవసాయ పొలాలు</div>
                        <div className={`text-[10px] ${prominentCategory === 'agri_lands' ? 'text-emerald-100' : 'text-stone-400'}`}>Agricultural Lands</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSelectProminentCategory('gardens')}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        prominentCategory === 'gardens'
                          ? 'bg-amber-600 text-white border-amber-600 shadow-md ring-2 ring-amber-500/20'
                          : 'bg-white hover:bg-stone-50 border-stone-200 text-stone-800'
                      }`}
                    >
                      <Trees className={`w-4 h-4 mb-1.5 ${prominentCategory === 'gardens' ? 'text-white' : 'text-amber-600'}`} />
                      <div>
                        <div className="font-bold text-xs">3. తోటలు</div>
                        <div className={`text-[10px] ${prominentCategory === 'gardens' ? 'text-amber-100' : 'text-stone-400'}`}>Gardens & Orchards</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSelectProminentCategory('houses')}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        prominentCategory === 'houses'
                          ? 'bg-stone-900 text-white border-stone-900'
                          : 'bg-stone-50 hover:bg-stone-100 border-stone-200 text-stone-700'
                      }`}
                    >
                      <div className="font-bold text-xs">🏡 ఇళ్ళు (Houses & Villas)</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSelectProminentCategory('apartments')}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        prominentCategory === 'apartments'
                          ? 'bg-stone-900 text-white border-stone-900'
                          : 'bg-stone-50 hover:bg-stone-100 border-stone-200 text-stone-700'
                      }`}
                    >
                      <div className="font-bold text-xs">🏢 అపార్ట్‌మెంట్లు (Flats)</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSelectProminentCategory('commercial')}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        prominentCategory === 'commercial'
                          ? 'bg-stone-900 text-white border-stone-900'
                          : 'bg-stone-50 hover:bg-stone-100 border-stone-200 text-stone-700'
                      }`}
                    >
                      <div className="font-bold text-xs">🏬 కమర్షియల్ (Commercial)</div>
                    </button>
                  </div>
                </div>

                {/* 2. For Sale / Looking to Buy / For Lease Options */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-stone-700">
                    ఆస్తి లభ్యత విధానం (Availability Mode) <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2 bg-stone-100 p-1.5 rounded-2xl">
                    <button
                      type="button"
                      onClick={() => setStatus('sale')}
                      className={`py-2 px-3 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        status === 'sale'
                          ? 'bg-white text-stone-900 shadow-sm'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      <span>🏷️ అమ్మకానికి (For Sale)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatus('buy' as any)}
                      className={`py-2 px-3 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        status === 'buy'
                          ? 'bg-white text-stone-900 shadow-sm'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      <span>🛒 కొనుగోలుకు (Wanted to Buy)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatus('lease')}
                      className={`py-2 px-3 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        status === 'lease'
                          ? 'bg-white text-stone-900 shadow-sm'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      <span>🔄 లీజుకు (For Lease)</span>
                    </button>
                  </div>
                </div>

                {/* 3. Title & Description */}
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-stone-700">
                      ప్రాపర్టీ శీర్షిక / పేరు (Property Title) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="form-title-input"
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="ఉదా: తురంగి బైపాస్ రోడ్‌లో 3 ఎకరాల సారవంతమైన మామిడి తోట అమ్మకానికి"
                      className="w-full px-3.5 py-2.5 border border-stone-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-stone-700">
                      పూర్తి వివరణ (Property Description) <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      id="form-desc-input"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                      placeholder="పొలం సరిహద్దులు, నేల రకం, బోరు నీటి లభ్యత, కాలువ సౌకర్యం, మరియు రోడ్డు వివరాలు రాయండి..."
                      className="w-full px-3.5 py-2.5 border border-stone-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 bg-white"
                    />
                  </div>
                </div>

                {/* 4. Location: District, Mandal, Village, Full Location, Google Maps */}
                <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200/80 space-y-3">
                  <h4 className="text-xs font-black text-stone-800 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-amber-600" />
                    <span>ప్రాంత వివరాలు (District, Mandal, Village & Location)</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-stone-600">జిల్లా (District) *</label>
                      <select
                        value={district}
                        onChange={(e) => setDistrict(e.target.value)}
                        className="w-full px-3 py-2 border border-stone-200 rounded-xl text-xs bg-white font-medium focus:ring-2 focus:ring-amber-500"
                      >
                        {AP_DISTRICTS.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-stone-600">మండలం (Mandal) *</label>
                      <select
                        value={mandal}
                        onChange={(e) => setMandal(e.target.value)}
                        className="w-full px-3 py-2 border border-stone-200 rounded-xl text-xs bg-white font-medium focus:ring-2 focus:ring-amber-500"
                      >
                        {(MANDALS_BY_DISTRICT[district] || []).map((m) => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-stone-600">గ్రామం (Village) *</label>
                      <input
                        type="text"
                        value={village}
                        onChange={(e) => setVillage(e.target.value)}
                        placeholder="గ్రామం పేరు"
                        className="w-full px-3 py-2 border border-stone-200 rounded-xl text-xs bg-white font-medium focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-stone-600">పూర్తి లొకేషన్ / చిరునామా (Exact Location)</label>
                      <input
                        type="text"
                        value={exactLocation}
                        onChange={(e) => setExactLocation(e.target.value)}
                        placeholder="ఉదా: మెయిన్ రోడ్డు దగ్గర, సర్వే నం. 142/3"
                        className="w-full px-3 py-2 border border-stone-200 rounded-xl text-xs bg-white focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-stone-600">గూగుల్ మ్యాప్స్ లింక్ (Google Maps URL)</label>
                      <input
                        type="text"
                        value={googleMapsUrl}
                        onChange={(e) => setGoogleMapsUrl(e.target.value)}
                        placeholder="ఉదా: https://maps.app.goo.gl/..."
                        className="w-full px-3 py-2 border border-stone-200 rounded-xl text-xs bg-white focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  </div>
                </div>

                {/* 5. Land Area: Acres, Cents, Square Yards */}
                <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 space-y-3">
                  <h4 className="text-xs font-black text-emerald-900 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-emerald-600" />
                    <span>విస్తీర్ణం వివరాలు (Land Area: Acres, Cents & Square Yards)</span>
                  </h4>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-stone-700">ఎకరాలు (Acres)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        value={landAreaAcres}
                        onChange={(e) => setLandAreaAcres(Number(e.target.value))}
                        className="w-full px-3 py-2 border border-stone-200 rounded-xl text-xs bg-white font-mono font-bold focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-stone-700">సెంట్లు (Cents)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={landAreaCents}
                        onChange={(e) => setLandAreaCents(Number(e.target.value))}
                        className="w-full px-3 py-2 border border-stone-200 rounded-xl text-xs bg-white font-mono font-bold focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-stone-700">చదరపు గజాలు (Sq. Yards)</label>
                      <input
                        type="number"
                        min="0"
                        value={squareYards || (landAreaAcres * 4840 + landAreaCents * 48.4)}
                        onChange={(e) => setSquareYards(Number(e.target.value))}
                        className="w-full px-3 py-2 border border-stone-200 rounded-xl text-xs bg-white font-mono font-bold focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                </div>

                {/* 6. Pricing: Asking Price & Price Per Acre */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-stone-700">
                      మొత్తం అడిగే ధర (Asking Price in ₹) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={price}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setPrice(val);
                        if (val >= 10000000) {
                          setPriceText(`${(val / 10000000).toFixed(2)} కోట్లు`);
                        } else {
                          setPriceText(`${(val / 100000).toFixed(1)} లక్షలు`);
                        }
                      }}
                      className="w-full px-3.5 py-2.5 border border-stone-200 rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-amber-500 bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-stone-700">
                      ఎకరానికి / గజానికి ధర (Price Per Acre / Sq. Yd)
                    </label>
                    <input
                      type="number"
                      value={pricePerAcre}
                      onChange={(e) => setPricePerAcre(Number(e.target.value))}
                      placeholder="ఉదా: 25,00,000"
                      className="w-full px-3.5 py-2.5 border border-stone-200 rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-amber-500 bg-white"
                    />
                  </div>
                </div>

                {/* 7. Facilities: Water, Electricity, Road Access */}
                <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200/80 space-y-3">
                  <h4 className="text-xs font-black text-stone-800">నీరు, విద్యుత్ & రోడ్డు సదుపాయాలు (Facilities & Utilities)</h4>

                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-stone-600">నీటి వసతులు (Water Facilities):</label>
                    <div className="flex flex-wrap gap-2">
                      {['బోరుబావి (Borewell)', 'కాలువ నీరు (Canal Water)', 'ఓవర్‌హెడ్ ట్యాంక్ (Overhead Tank)', 'రైన్ వాటర్ / చెరువు (Pond)'].map((fac) => {
                        const isChecked = waterFacilities.includes(fac);
                        return (
                          <button
                            key={fac}
                            type="button"
                            onClick={() => {
                              setWaterFacilities((prev) =>
                                isChecked ? prev.filter((f) => f !== fac) : [...prev, fac]
                              );
                            }}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              isChecked
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-100'
                            }`}
                          >
                            {isChecked ? '✓ ' : '+ '} {fac}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-stone-600">విద్యుత్ సదుపాయం (Electricity)</label>
                      <select
                        value={electricity}
                        onChange={(e) => setElectricity(e.target.value)}
                        className="w-full px-3 py-2 border border-stone-200 rounded-xl text-xs bg-white font-medium"
                      >
                        <option value="3-ఫేజ్ వ్యవసాయ విద్యుత్ (3-Phase)">3-ఫేజ్ వ్యవసాయ విద్యుత్ (3-Phase Power)</option>
                        <option value="డొమెస్టిక్ కరెంట్ (Single Phase)">డొమెస్టిక్ కరెంట్ (Single Phase)</option>
                        <option value="ట్రాన్స్‌ఫార్మర్ సమీపంలో ఉంది">ట్రాన్స్‌ఫార్మర్ సమీపంలో ఉంది</option>
                        <option value="విద్యుత్ సదుపాయం లేదు">విద్యుత్ సదుపాయం లేదు</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-stone-600">రోడ్డు యాక్సెస్ (Road Access)</label>
                      <select
                        value={roadAccess}
                        onChange={(e) => setRoadAccess(e.target.value)}
                        className="w-full px-3 py-2 border border-stone-200 rounded-xl text-xs bg-white font-medium"
                      >
                        <option value="BT Road (బీటీ రోడ్డు)">BT Road (బీటీ రోడ్డు)</option>
                        <option value="CC Road (సిమెంట్ రోడ్డు)">CC Road (సిమెంట్ రోడ్డు)</option>
                        <option value="Soil / Tar Road (మట్టి రోడ్డు)">Soil / Tar Road (మట్టి రోడ్డు)</option>
                        <option value="హైవే ఫేసింగ్ (Highway Facing)">హైవే ఫేసింగ్ (Highway Facing)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* 8. Categorized Photo Upload Slots */}
                <div id="section-photos" className="p-4 bg-amber-50/40 rounded-2xl border border-amber-200/60 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-black text-amber-900 flex items-center gap-1.5">
                        <Camera className="w-4 h-4 text-amber-700" />
                        <span>స్థిరాస్తి ఫొటోల అప్‌లోడ్ (Clear Photo Upload)</span>
                      </h4>
                      <p className="text-[10px] text-stone-500">
                        ముందు భాగం, రోడ్డు, నీటి వసతి, మరియు హద్దుల ఫోటోలను అప్‌లోడ్ చేయండి.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {PHOTO_SLOTS.map((slotItem) => {
                      const photoUrl = slotPhotos[slotItem.slot];
                      const isUploadingThis = uploadingSlot === slotItem.slot;

                      return (
                        <div
                          key={slotItem.slot}
                          className="relative bg-white p-2.5 rounded-2xl border border-stone-200 flex flex-col justify-between overflow-hidden shadow-2xs group"
                        >
                          <div>
                            <span className="text-[11px] font-black text-stone-800 block truncate">{slotItem.telugu}</span>
                            <span className="text-[9px] text-stone-400 block mb-2">{slotItem.title}</span>
                          </div>

                          <div className="relative aspect-video rounded-xl bg-stone-100 overflow-hidden flex items-center justify-center border border-dashed border-stone-300">
                            {photoUrl ? (
                              <>
                                <img src={photoUrl} alt={slotItem.title} className="w-full h-full object-cover" />
                                <button
                                  type="button"
                                  onClick={() => setSlotPhotos((prev) => ({ ...prev, [slotItem.slot]: '' }))}
                                  className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full shadow-md hover:bg-red-700 cursor-pointer"
                                  title="ఫోటో తీసివేయండి"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </>
                            ) : isUploadingThis ? (
                              <Loader2 className="w-5 h-5 text-amber-600 animate-spin" />
                            ) : (
                              <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-stone-200/60 transition-colors p-2 text-center">
                                <Upload className="w-4 h-4 text-stone-400 mb-1" />
                                <span className="text-[9px] font-bold text-amber-700">+ అప్‌లోడ్</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleSlotPhotoUpload(slotItem.slot, file);
                                  }}
                                />
                              </label>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Preset Templates Alternative */}
                  <div className="pt-2">
                    <span className="text-[10px] font-bold text-stone-500 uppercase block mb-1.5">లేదా హై-క్వాలిటీ టెంప్లేట్ ఫొటో ఎంచుకోండి:</span>
                    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
                      {PHOTO_TEMPLATES.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            setSelectedPhoto(p.url);
                            setSlotPhotos((prev) => ({ ...prev, front_view: p.url }));
                          }}
                          className={`relative w-20 h-14 shrink-0 rounded-xl overflow-hidden border-2 cursor-pointer transition-all ${
                            selectedPhoto === p.url ? 'border-amber-600 scale-95 shadow-md' : 'border-stone-200 opacity-70 hover:opacity-100'
                          }`}
                        >
                          <img src={p.url} alt={p.label} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 9. Document Upload Section (Pattadar Passbook, Sale Deed, Survey Documents) */}
                <div id="section-documents" className="p-4 bg-blue-50/40 rounded-2xl border border-blue-200/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-black text-blue-900 flex items-center gap-1.5">
                        <FileCheck className="w-4 h-4 text-blue-700" />
                        <span>యాజమాన్య పత్రాల అప్‌లోడ్ (PDF & Document Upload)</span>
                      </h4>
                      <p className="text-[10px] text-stone-500">
                        సురక్షితంగా పట్టాదారు పాస్ పుస్తకం, సేల్ డీడ్, సర్వే రికార్డులను అప్‌లోడ్ చేయండి.
                      </p>
                    </div>
                  </div>

                  {/* Document Uploader Bar */}
                  <div className="flex flex-col sm:flex-row gap-2 bg-white p-2.5 rounded-xl border border-stone-200">
                    <select
                      value={docTypeToUpload}
                      onChange={(e) => setDocTypeToUpload(e.target.value as DocumentType)}
                      className="px-3 py-1.5 border border-stone-200 rounded-lg text-xs bg-stone-50 font-medium"
                    >
                      <option value="pattadar_passbook">పట్టాదారు పాస్ పుస్తకం (Pattadar Passbook)</option>
                      <option value="sale_deed">సేల్ డీడ్ / దస్తావేజు (Sale Deed)</option>
                      <option value="registration_doc">రిజిస్ట్రేషన్ పత్రాలు (Registration Docs)</option>
                      <option value="survey_map">సర్వే మ్యాప్ / FMB (Survey Documents)</option>
                      <option value="other_ownership">ఇతర యాజమాన్య పత్రాలు (Other Docs)</option>
                    </select>

                    <label className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold cursor-pointer transition-all active:scale-95 shadow-xs">
                      {docUploading ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>అప్‌లోడ్ అవుతోంది ({docUploadProgress}%)...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-3.5 h-3.5" />
                          <span>PDF / ఫోటో ఎంచుకోండి (+ Upload Document)</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="application/pdf,image/*"
                        className="hidden"
                        disabled={docUploading}
                        onChange={handleDocumentUpload}
                      />
                    </label>
                  </div>

                  {/* Uploaded Documents List */}
                  {documents.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      {documents.map((doc) => (
                        <div
                          key={doc.id}
                          className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-stone-200 text-xs"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                            <div className="truncate">
                              <span className="font-bold text-stone-800 block truncate">{doc.title}</span>
                              <span className="text-[10px] text-stone-400 font-mono">{doc.fileName} • {doc.fileSize}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <a
                              href={doc.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-md font-bold text-[10px] flex items-center gap-1 cursor-pointer"
                            >
                              <Eye className="w-3 h-3" />
                              <span>చూడండి</span>
                            </a>
                            <button
                              type="button"
                              onClick={() => setDocuments((prev) => prev.filter((d) => d.id !== doc.id))}
                              className="p-1 text-red-600 hover:bg-red-50 rounded-md cursor-pointer"
                              title="తీసివేయండి"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="text-[10px] text-stone-500 bg-blue-50/70 p-2 rounded-lg border border-blue-100 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>పత్రాల భద్రత: యజమాని మరియు నిర్వాహకులకు మాత్రమే పూర్తి పత్రాలు కనిపిస్తాయి.</span>
                  </div>
                </div>

                {/* 10. Video Upload & Live Camera Section */}
                <div id="section-videos" className="p-4 bg-rose-50/40 rounded-2xl border border-rose-200/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-black text-rose-900 flex items-center gap-1.5">
                        <Video className="w-4 h-4 text-rose-600" />
                        <span>వీడియో అప్‌లోడ్ & లైవ్ కెమెరా (Video & Live Camera)</span>
                      </h4>
                      <p className="text-[10px] text-stone-500">
                        భూమి, నీటి వసతులు, మరియు రోడ్డు సరిహద్దులను వీడియో తీసి అప్‌లోడ్ చేయండి.
                      </p>
                    </div>
                  </div>

                  {/* Video Actions */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {/* Live Camera Launch */}
                    <button
                      type="button"
                      onClick={isLiveCameraActive ? stopLiveCamera : startLiveCamera}
                      className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer shadow-xs ${
                        isLiveCameraActive
                          ? 'bg-rose-700 text-white'
                          : 'bg-white hover:bg-stone-50 text-stone-800 border border-stone-200'
                      }`}
                    >
                      <Camera className="w-4 h-4 text-rose-600" />
                      <span>{isLiveCameraActive ? 'కెమెరా ఆపండి (Stop Camera)' : 'లైవ్ కెమెరా ఆన్ చేయండి (Open Live Camera)'}</span>
                    </button>

                    {/* File Video Upload */}
                    <label className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white hover:bg-stone-50 text-stone-800 border border-stone-200 rounded-xl font-bold text-xs cursor-pointer transition-all shadow-xs">
                      {videoUploading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-rose-600" />
                          <span>అప్‌లోడ్ అవుతోంది ({videoProgress}%)...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 text-rose-600" />
                          <span>వీడియో ఫైల్ అప్‌లోడ్ (Upload Video File)</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="video/*"
                        className="hidden"
                        disabled={videoUploading}
                        onChange={handleVideoFileUpload}
                      />
                    </label>
                  </div>

                  {cameraError && (
                    <p className="text-[11px] font-semibold text-rose-700 bg-rose-100/60 p-2 rounded-lg">
                      ⚠️ {cameraError}
                    </p>
                  )}

                  {/* Live Camera Viewfinder Overlay */}
                  {isLiveCameraActive && (
                    <div className="relative rounded-2xl overflow-hidden bg-black border-2 border-rose-500 shadow-xl space-y-2">
                      <video
                        ref={videoPreviewRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full max-h-64 object-cover"
                      />

                      {/* Viewfinder Overlay Elements */}
                      <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-full text-white text-[10px] font-bold">
                        <span className={`w-2 h-2 rounded-full ${isRecording ? 'bg-red-500 animate-ping' : 'bg-emerald-400'}`} />
                        <span>{isRecording ? `REC 00:${recordingSeconds < 10 ? '0' : ''}${recordingSeconds}` : 'LIVE CAMERA VIEW'}</span>
                      </div>

                      {/* Controls Bar */}
                      <div className="absolute bottom-3 inset-x-0 flex items-center justify-center gap-3 px-4">
                        {!isRecording ? (
                          <>
                            <button
                              type="button"
                              onClick={startRecordingVideo}
                              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-full font-bold text-xs shadow-lg flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                            >
                              <Play className="w-3.5 h-3.5 fill-current" />
                              <span>రికార్డింగ్ ప్రారంభించండి</span>
                            </button>
                            <button
                              type="button"
                              onClick={takeCameraSnapshot}
                              className="px-3.5 py-2 bg-white/90 hover:bg-white text-stone-900 rounded-full font-bold text-xs shadow-lg flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                            >
                              <Camera className="w-3.5 h-3.5 text-stone-800" />
                              <span>ఫోటో తీయండి</span>
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={stopRecordingVideo}
                            className="px-5 py-2.5 bg-stone-900 text-white rounded-full font-black text-xs shadow-xl flex items-center gap-2 active:scale-95 cursor-pointer"
                          >
                            <Square className="w-3.5 h-3.5 fill-current text-red-500" />
                            <span>రికార్డింగ్ ఆపండి & సేవ్ చేయండి</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Video Player Preview if uploaded */}
                  {videoUrl && (
                    <div className="p-3 bg-white rounded-xl border border-stone-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                          <Check className="w-4 h-4 text-emerald-600" />
                          <span>వీడియో సిద్ధంగా ఉంది (Video Preview):</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => setVideoUrl('')}
                          className="text-red-600 text-[10px] font-bold hover:underline cursor-pointer"
                        >
                          వీడియో తీసివేయండి
                        </button>
                      </div>
                      <video
                        src={videoUrl}
                        controls
                        className="w-full max-h-48 rounded-lg bg-black"
                      />
                    </div>
                  )}
                </div>

                {/* 11. Submitter / Owner Info */}
                <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200/80 space-y-3">
                  <h4 className="text-xs font-bold text-stone-800">యజమాని వివరాలు (Owner / Seller Details)</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-stone-600">యజమాని పేరు (Owner Name) *</label>
                      <input
                        type="text"
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        placeholder="ఉదా: శివ రాఘవ గారు"
                        className="w-full px-3 py-2 border border-stone-200 rounded-xl text-xs bg-white font-medium focus:ring-2 focus:ring-amber-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-stone-600">మొబైల్ నెంబర్ (Mobile Number) *</label>
                      <input
                        type="text"
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        placeholder="ఉదా: 8977776111"
                        className="w-full px-3 py-2 border border-stone-200 rounded-xl text-xs bg-white font-mono font-bold focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-stone-600">వాట్సాప్ నెంబర్ (WhatsApp Contact)</label>
                      <input
                        type="text"
                        value={whatsappContact}
                        onChange={(e) => setWhatsappContact(e.target.value)}
                        placeholder="ఉదా: 8977776111"
                        className="w-full px-3 py-2 border border-stone-200 rounded-xl text-xs bg-white font-mono font-bold focus:ring-2 focus:ring-amber-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-stone-600">లభ్యత స్థితి (Availability Status)</label>
                      <select
                        value={availabilityStatus}
                        onChange={(e) => setAvailabilityStatus(e.target.value as any)}
                        className="w-full px-3 py-2 border border-stone-200 rounded-xl text-xs bg-white font-bold text-amber-900"
                      >
                        <option value="Available">Available (అందుబాటులో ఉంది)</option>
                        <option value="Sold">Sold (అమ్మబడింది)</option>
                        <option value="Leased">Leased (లీజుకు ఇవ్వబడింది)</option>
                        <option value="Under Discussion">Under Discussion (చర్చల్లో ఉంది)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Form Buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 py-3 text-stone-600 bg-stone-100 hover:bg-stone-200 text-xs font-bold rounded-xl transition-all cursor-pointer"
                  >
                    రద్దు చేయండి (Cancel)
                  </button>
                  <button
                    id="submit-listing-form-btn"
                    type="submit"
                    className="flex-1 py-3 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-md active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>{editListing ? 'సవరణ సేవ్ చేయండి' : 'వివరాలు సేవ్ చేయండి (Next)'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
