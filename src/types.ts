export type PropertyType = 'house' | 'apartment' | 'plot' | 'commercial' | 'farm_land';
export type MainCategoryTab = 'all' | 'houses' | 'plots' | 'polalu' | 'thotalu' | 'commercial';
export type ListingStatus = 'sale' | 'rent' | 'lease' | 'buy'; // Added lease and buy
export type ApprovalStatus = 'Yes' | 'Pending' | 'No';
export type LandAvailabilityStatus = 'Available' | 'Sold' | 'Leased' | 'Under Discussion';

export const isOrchardProperty = (property: { landType?: string; gardenType?: string; cropType?: string; title?: string; description?: string }): boolean => {
  if (property.gardenType && property.gardenType !== 'All' && property.gardenType !== '') return true;
  const lt = (property.landType || '').toLowerCase();
  const title = (property.title || '').toLowerCase();
  const desc = (property.description || '').toLowerCase();
  return (
    lt.includes('తోట') ||
    lt.includes('garden') ||
    lt.includes('orchard') ||
    lt.includes('మామిడి') ||
    lt.includes('కొబ్బరి') ||
    lt.includes('నిమ్మ') ||
    lt.includes('పామాయిల్') ||
    title.includes('తోట') ||
    title.includes('garden') ||
    title.includes('కొబ్బరి') ||
    title.includes('మామిడి') ||
    title.includes('orchard') ||
    desc.includes('తోట') ||
    desc.includes('కొబ్బరి తోట') ||
    desc.includes('మామిడి తోట')
  );
};

export const isCropFieldProperty = (property: { type?: PropertyType; landType?: string; gardenType?: string; cropType?: string; title?: string; description?: string }): boolean => {
  if (property.type && property.type !== 'farm_land') return false;
  return !isOrchardProperty(property);
};


export type DocumentType = 
  | 'pattadar_passbook' 
  | 'sale_deed' 
  | 'registration_doc' 
  | 'survey_map' 
  | 'other_ownership';

export interface PropertyDocument {
  id: string;
  type: DocumentType;
  title: string;
  fileName: string;
  fileUrl: string;
  fileSize?: string;
  uploadedAt: string;
  isVerified?: boolean;
}

export type PhotoSlotType = 
  | 'front_view' 
  | 'road_access' 
  | 'full_land_view' 
  | 'water_facilities' 
  | 'boundary' 
  | 'garden_trees' 
  | 'other';

export interface PropertyPhoto {
  slot: PhotoSlotType;
  label: string;
  url: string;
}

export interface PropertyInquiry {
  id: string;
  listingId: string;
  listingTitle: string;
  ownerUid?: string;
  senderName: string;
  senderPhone: string;
  senderEmail?: string;
  message: string;
  createdAt: string;
  status: 'new' | 'contacted' | 'closed';
}

export interface PropertyListing {
  id: string;
  title: string;
  description: string;
  price: number; // in Rupees
  priceFormatted: string; // e.g. "45 Lakhs" or "1.2 Crores"
  type: PropertyType;
  status: 'sale' | 'rent' | 'lease'; // Supports For Sale, For Rent, For Lease
  city: string; // e.g. "Kakinada", "Vijayawada", "Guntur", "Tirupati", "Visakhapatnam", "Amaravati"
  area: string; // e.g. "Turangi", "Benz Circle", "Gorantla", "Bhanugudi"
  beds?: number;
  baths?: number;
  size: string; // e.g. "1200 sqft" or "150 Sq. Yards"
  imageUrl: string;
  images?: string[];
  categorizedPhotos?: PropertyPhoto[];
  documents?: PropertyDocument[];
  isApproved: ApprovalStatus;
  contactName: string;
  contactPhone: string;
  contactEmail?: string;
  submittedBy: string;
  createdAt: string;
  updatedAt?: string; // Date of last update
  features?: string[];
  facing?: 'East' | 'West' | 'North' | 'South' | 'North-East' | 'South-East' | 'North-West' | 'South-West';
  age?: number; // Age in years (0 for new/under-construction, 1-5, or 5+)
  
  // Agricultural / Garden / Plot Specific Fields
  district?: string;
  mandal?: string;
  village?: string;
  exactLocation?: string;
  googleMapsUrl?: string;
  landAreaAcres?: number;
  landAreaCents?: number;
  squareYards?: number;
  landType?: string; // Subcategory: పంట పొలాలు, మామిడి తోటలు, కొబ్బరి తోటలు, etc.
  cropType?: string;
  gardenType?: string;
  waterFacility?: string[]; // Borewell, Canal Water, Electricity, etc.
  electricity?: boolean | string;
  roadAccess?: string; // Yes / No or details
  fencing?: string; // Fencing status
  pricePerAcre?: number;
  whatsappContact?: string;
  videoUrl?: string;
  hasLiveCameraRecorded?: boolean;
  availabilityStatus?: LandAvailabilityStatus; // Available, Sold, Leased, Under Discussion

  // Paid Listing Fields (Razorpay Integration)
  paymentId?: string;
  paymentAmount?: number;
  packageName?: 'basic' | 'premium' | 'featured';
  paymentStatus?: 'pending' | 'success' | 'failed';
  paymentDate?: string;
  startDate?: string;
  expiryDate?: string;
}

export interface BuyerRequest {
  id: string;
  customerName: string;
  mobileNumber: string;
  district: string;
  mandal: string;
  village: string;
  requiredLandType: string;
  requiredAcres: number;
  budget: number;
  cropGardenPreference?: string;
  waterRequirement?: string;
  buyOrLease: 'buy' | 'lease';
  additionalRequirements?: string;
  createdAt: string;
  submittedBy: string;
}

export interface AreaFilter {
  city: string;
  areas: string[];
}

export interface UserFeedback {
  id: string;
  name: string;
  contact: string;
  type: 'feature' | 'issue';
  message: string;
  createdAt: string;
}

export type PaymentSystemStatus = 'Pending' | 'Verified' | 'Rejected';

export interface ManaGruhamPayment {
  id: string; // generated TXN id, e.g. "TXN-87428472"
  customerName: string;
  paymentPurpose: string;
  amount: number;
  upiId: string; // isivaraghava@okaxis
  utr: string; // User-entered Transaction Reference / UTR
  status: PaymentSystemStatus;
  createdAt: string;
  verifiedAt?: string;
  itemType: 'service' | 'product' | 'booking' | 'other' | 'package';
  itemId: string; // e.g. "vastu-consult" or listing property id
  packageName?: 'basic' | 'premium' | 'featured'; // if listing package
  contactPhone?: string;
}


