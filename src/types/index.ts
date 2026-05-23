// ============================================================
// ArtisConnect — Types TypeScript centralisés
// ============================================================

// ─── Enums ───────────────────────────────────────────────────

export type UserRole = 'client' | 'prestataire' | 'entreprise' | 'admin'

export type AccountStatus = 'pending' | 'step1_done' | 'step2_done' | 'verified' | 'rejected' | 'suspended'

export type SubscriptionTier = 'free' | 'premium'

export type AOStatus = 'open' | 'closing_soon' | 'closed' | 'awarded'

export type NotificationType =
  | 'new_message'
  | 'new_request'
  | 'account_validated'
  | 'account_rejected'
  | 'new_ao'
  | 'ao_response'
  | 'review_received'

export type City = 'ouagadougou' | 'bobo_dioulasso'

export type Language = 'fr' | 'en'

// ─── Database Tables ─────────────────────────────────────────

export interface Profile {
  id: string                    // uuid, matches auth.users.id
  role: UserRole
  first_name: string
  last_name: string
  phone: string | null
  avatar_url: string | null
  language: Language
  created_at: string
  updated_at: string
}

export interface PrestataireProfile {
  id: string
  user_id: string               // FK -> profiles.id
  business_name: string
  description: string | null
  description_en: string | null
  metier_id: string             // FK -> metiers.id
  city: City
  neighborhood: string | null
  address: string | null
  latitude: number | null
  longitude: number | null
  phone_public: string | null
  whatsapp: string | null
  website: string | null
  years_experience: number | null
  hourly_rate_min: number | null // in FCFA
  hourly_rate_max: number | null
  account_status: AccountStatus
  subscription_tier: SubscriptionTier
  is_featured: boolean          // mise en avant payante
  avg_rating: number | null
  total_reviews: number
  rccm_number: string | null
  rccm_doc_url: string | null
  id_doc_url: string | null
  verified_at: string | null
  created_at: string
  updated_at: string
}

export interface EntrepriseProfile {
  id: string
  user_id: string               // FK -> profiles.id
  company_name: string
  description: string | null
  sector: string | null
  city: City
  address: string | null
  phone_public: string | null
  website: string | null
  ao_subscription_active: boolean
  rccm_number: string | null
  rccm_doc_url: string | null
  account_status: AccountStatus
  created_at: string
  updated_at: string
}

export interface Metier {
  id: string
  name_fr: string
  name_en: string
  slug: string
  icon: string | null           // emoji or icon name
  category: string
  is_active: boolean
  prestataires_count: number
}

export interface Realisation {
  id: string
  prestataire_id: string        // FK -> prestataire_profiles.id
  title: string
  description: string | null
  image_urls: string[]
  completed_at: string | null
  is_featured: boolean
  created_at: string
}

export interface Review {
  id: string
  prestataire_id: string        // FK -> prestataire_profiles.id
  client_id: string             // FK -> profiles.id
  rating: number                // 1-5
  comment: string | null
  response: string | null       // prestataire reply
  response_at: string | null
  is_moderated: boolean
  created_at: string
}

export interface AppelOffre {
  id: string
  entreprise_id: string         // FK -> entreprise_profiles.id
  title: string
  description: string
  metier_id: string | null      // FK -> metiers.id
  city: City
  budget_min: number | null     // FCFA
  budget_max: number | null     // FCFA
  deadline: string | null
  status: AOStatus
  responses_count: number
  created_at: string
  updated_at: string
}

export interface AOResponse {
  id: string
  ao_id: string                 // FK -> appels_offres.id
  prestataire_id: string        // FK -> prestataire_profiles.id
  message: string
  proposed_budget: number | null
  status: 'pending' | 'shortlisted' | 'awarded' | 'rejected'
  created_at: string
}

export interface Message {
  id: string
  conversation_id: string
  sender_id: string             // FK -> profiles.id
  content: string
  is_read: boolean
  created_at: string
}

export interface Conversation {
  id: string
  client_id: string             // FK -> profiles.id
  prestataire_id: string        // FK -> prestataire_profiles.id
  last_message_at: string | null
  created_at: string
}

export interface Notification {
  id: string
  user_id: string               // FK -> profiles.id
  type: NotificationType
  title: string
  body: string
  link: string | null
  is_read: boolean
  created_at: string
}

// ─── API / Frontend Types ────────────────────────────────────

export interface PrestataireCard {
  id: string
  business_name: string
  user_id: string
  metier: Pick<Metier, 'name_fr' | 'name_en' | 'slug' | 'icon'>
  city: City
  neighborhood: string | null
  avg_rating: number | null
  total_reviews: number
  subscription_tier: SubscriptionTier
  is_featured: boolean
  account_status: AccountStatus
  phone_public: string | null
  whatsapp: string | null
  cover_image?: string | null
}

export interface SearchFilters {
  metier?: string
  city?: City
  neighborhood?: string
  min_rating?: number
  verified_only?: boolean
  premium_only?: boolean
  sort_by?: 'rating' | 'reviews' | 'featured' | 'recent'
}

export interface AdminStats {
  total_prestataires: number
  pending_validation: number
  total_clients: number
  total_entreprises: number
  total_ao: number
  open_ao: number
  total_reviews: number
  total_conversations: number
}
