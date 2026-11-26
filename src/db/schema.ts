import { pgTable, serial, text, timestamp, doublePrecision, integer, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Users table authenticated via Firebase Auth
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  displayName: text('display_name'),
  photoUrl: text('photo_url'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Property listings table
export const listings = pgTable('listings', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  price: doublePrecision('price').notNull(),
  priceFormatted: text('price_formatted').notNull(),
  type: text('type').notNull(), // house, apartment, plot, commercial, farm_land
  status: text('status').notNull(), // sale, rent, lease
  city: text('city').notNull(),
  area: text('area').notNull(),
  beds: integer('beds'),
  baths: integer('baths'),
  size: text('size').notNull(),
  imageUrl: text('image_url').notNull(),
  images: jsonb('images').$type<string[]>(),
  isApproved: text('is_approved').notNull().default('Pending'),
  contactName: text('contact_name').notNull(),
  contactPhone: text('contact_phone').notNull(),
  contactEmail: text('contact_email'),
  submittedBy: text('submitted_by').notNull(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at'),
  district: text('district'),
  mandal: text('mandal'),
  village: text('village'),
  exactLocation: text('exact_location'),
  googleMapsUrl: text('google_maps_url'),
  landAreaAcres: doublePrecision('land_area_acres'),
  landAreaCents: doublePrecision('land_area_cents'),
  squareYards: doublePrecision('square_yards'),
  landType: text('land_type'),
  cropType: text('crop_type'),
  gardenType: text('garden_type'),
  waterFacility: jsonb('water_facility').$type<string[]>(),
  electricity: text('electricity'),
  roadAccess: text('road_access'),
  fencing: text('fencing'),
  pricePerAcre: doublePrecision('price_per_acre'),
  whatsappContact: text('whatsapp_contact'),
  videoUrl: text('video_url'),
  categorizedPhotos: jsonb('categorized_photos').$type<any[]>(),
  documents: jsonb('documents').$type<any[]>(),
  availabilityStatus: text('availability_status').default('Available'),
  paymentId: text('payment_id'),
  paymentAmount: doublePrecision('payment_amount'),
  packageName: text('package_name'),
  paymentStatus: text('payment_status'),
});

// Property inquiries table
export const inquiries = pgTable('inquiries', {
  id: text('id').primaryKey(),
  listingId: text('listing_id').notNull(),
  listingTitle: text('listing_title').notNull(),
  ownerUid: text('owner_uid'),
  senderName: text('sender_name').notNull(),
  senderPhone: text('sender_phone').notNull(),
  senderEmail: text('sender_email'),
  message: text('message').notNull(),
  createdAt: text('created_at').notNull(),
  status: text('status').default('new'),
});

// Buyer requests table
export const buyerRequests = pgTable('buyer_requests', {
  id: text('id').primaryKey(),
  customerName: text('customer_name').notNull(),
  mobileNumber: text('mobile_number').notNull(),
  district: text('district').notNull(),
  mandal: text('mandal').notNull(),
  village: text('village').notNull(),
  requiredLandType: text('required_land_type').notNull(),
  requiredAcres: doublePrecision('required_acres').notNull(),
  budget: doublePrecision('budget').notNull(),
  cropGardenPreference: text('crop_garden_preference'),
  waterRequirement: text('water_requirement'),
  buyOrLease: text('buy_or_lease').notNull(),
  additionalRequirements: text('additional_requirements'),
  createdAt: text('created_at').notNull(),
  submittedBy: text('submitted_by').notNull(),
});

// User Favorites table
export const favorites = pgTable('favorites', {
  id: serial('id').primaryKey(),
  userUid: text('user_uid').notNull(),
  listingId: text('listing_id').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Relationships
export const usersRelations = relations(users, ({ many }) => ({
  favorites: many(favorites),
}));

export const favoritesRelations = relations(favorites, ({ one }) => ({
  user: one(users, {
    fields: [favorites.userUid],
    references: [users.uid],
  }),
  listing: one(listings, {
    fields: [favorites.listingId],
    references: [listings.id],
  }),
}));
