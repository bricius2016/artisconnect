-- ============================================================
-- ArtisConnect — Migration principale v0.1
-- Base de données Supabase (PostgreSQL)
-- ============================================================
-- Ordre d'exécution : coller ce fichier dans l'éditeur SQL
-- de Supabase (Settings > SQL Editor) et exécuter.
-- ============================================================

-- ─── Extensions ─────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- ─── Types ENUM ─────────────────────────────────────────────
CREATE TYPE user_role AS ENUM ('client', 'prestataire', 'entreprise', 'admin');
CREATE TYPE account_status AS ENUM ('pending', 'step1_done', 'step2_done', 'verified', 'rejected', 'suspended');
CREATE TYPE subscription_tier AS ENUM ('free', 'premium');
CREATE TYPE ao_status AS ENUM ('open', 'closing_soon', 'closed', 'awarded');
CREATE TYPE ao_response_status AS ENUM ('pending', 'shortlisted', 'awarded', 'rejected');
CREATE TYPE notification_type AS ENUM (
  'new_message', 'new_request', 'account_validated', 'account_rejected',
  'new_ao', 'ao_response', 'review_received'
);
CREATE TYPE city_type AS ENUM ('ouagadougou', 'bobo_dioulasso');

-- ─── 1. PROFILES ────────────────────────────────────────────
-- Étend auth.users de Supabase avec les infos métier
CREATE TABLE public.profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role          user_role NOT NULL DEFAULT 'client',
  first_name    TEXT NOT NULL,
  last_name     TEXT NOT NULL,
  phone         TEXT,
  avatar_url    TEXT,
  language      TEXT NOT NULL DEFAULT 'fr' CHECK (language IN ('fr', 'en')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger : crée automatiquement un profil à chaque inscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, role, first_name, last_name)
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'client'),
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─── 2. MÉTIERS ─────────────────────────────────────────────
CREATE TABLE public.metiers (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name_fr               TEXT NOT NULL,
  name_en               TEXT NOT NULL,
  slug                  TEXT NOT NULL UNIQUE,
  icon                  TEXT,                  -- emoji ou nom d'icône
  category              TEXT NOT NULL DEFAULT 'general',
  is_active             BOOLEAN NOT NULL DEFAULT TRUE,
  prestataires_count    INTEGER NOT NULL DEFAULT 0,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 3. PRESTATAIRE PROFILES ────────────────────────────────
CREATE TABLE public.prestataire_profiles (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  business_name       TEXT NOT NULL,
  description         TEXT,
  description_en      TEXT,
  metier_id           UUID REFERENCES public.metiers(id) ON DELETE SET NULL,
  city                city_type NOT NULL DEFAULT 'ouagadougou',
  neighborhood        TEXT,
  address             TEXT,
  latitude            DOUBLE PRECISION,
  longitude           DOUBLE PRECISION,
  phone_public        TEXT,
  whatsapp            TEXT,
  website             TEXT,
  years_experience    INTEGER,
  hourly_rate_min     INTEGER,               -- FCFA
  hourly_rate_max     INTEGER,               -- FCFA
  account_status      account_status NOT NULL DEFAULT 'pending',
  subscription_tier   subscription_tier NOT NULL DEFAULT 'free',
  is_featured         BOOLEAN NOT NULL DEFAULT FALSE,
  avg_rating          NUMERIC(3,2),
  total_reviews       INTEGER NOT NULL DEFAULT 0,
  rccm_number         TEXT,
  rccm_doc_url        TEXT,
  id_doc_url          TEXT,
  verified_at         TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Index de recherche full-text
CREATE INDEX idx_prestataire_search ON public.prestataire_profiles
  USING GIN (to_tsvector('french', coalesce(business_name,'') || ' ' || coalesce(description,'')));

CREATE INDEX idx_prestataire_city ON public.prestataire_profiles(city);
CREATE INDEX idx_prestataire_metier ON public.prestataire_profiles(metier_id);
CREATE INDEX idx_prestataire_status ON public.prestataire_profiles(account_status);
CREATE INDEX idx_prestataire_rating ON public.prestataire_profiles(avg_rating DESC);
CREATE INDEX idx_prestataire_featured ON public.prestataire_profiles(is_featured, subscription_tier);

-- ─── 4. ENTREPRISE PROFILES ─────────────────────────────────
CREATE TABLE public.entreprise_profiles (
  id                        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  company_name              TEXT NOT NULL,
  description               TEXT,
  sector                    TEXT,
  city                      city_type NOT NULL DEFAULT 'ouagadougou',
  address                   TEXT,
  phone_public              TEXT,
  website                   TEXT,
  ao_subscription_active    BOOLEAN NOT NULL DEFAULT FALSE,
  rccm_number               TEXT,
  rccm_doc_url              TEXT,
  account_status            account_status NOT NULL DEFAULT 'pending',
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- ─── 5. RÉALISATIONS ────────────────────────────────────────
CREATE TABLE public.realisations (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prestataire_id    UUID NOT NULL REFERENCES public.prestataire_profiles(id) ON DELETE CASCADE,
  title             TEXT NOT NULL,
  description       TEXT,
  image_urls        TEXT[] NOT NULL DEFAULT '{}',
  completed_at      DATE,
  is_featured       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 6. AVIS & ÉVALUATIONS ──────────────────────────────────
CREATE TABLE public.reviews (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prestataire_id    UUID NOT NULL REFERENCES public.prestataire_profiles(id) ON DELETE CASCADE,
  client_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating            SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment           TEXT,
  response          TEXT,
  response_at       TIMESTAMPTZ,
  is_moderated      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(prestataire_id, client_id)   -- un avis par client par prestataire
);

-- Trigger : recalcule la note moyenne du prestataire après chaque avis
CREATE OR REPLACE FUNCTION public.update_prestataire_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.prestataire_profiles
  SET
    avg_rating    = (SELECT AVG(rating)::NUMERIC(3,2) FROM public.reviews WHERE prestataire_id = COALESCE(NEW.prestataire_id, OLD.prestataire_id) AND NOT is_moderated),
    total_reviews = (SELECT COUNT(*) FROM public.reviews WHERE prestataire_id = COALESCE(NEW.prestataire_id, OLD.prestataire_id) AND NOT is_moderated),
    updated_at    = NOW()
  WHERE id = COALESCE(NEW.prestataire_id, OLD.prestataire_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER after_review_change
  AFTER INSERT OR UPDATE OR DELETE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_prestataire_rating();

-- ─── 7. APPELS D'OFFRES ─────────────────────────────────────
CREATE TABLE public.appels_offres (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entreprise_id     UUID NOT NULL REFERENCES public.entreprise_profiles(id) ON DELETE CASCADE,
  title             TEXT NOT NULL,
  description       TEXT NOT NULL,
  metier_id         UUID REFERENCES public.metiers(id) ON DELETE SET NULL,
  city              city_type NOT NULL DEFAULT 'ouagadougou',
  budget_min        INTEGER,               -- FCFA
  budget_max        INTEGER,               -- FCFA
  deadline          DATE,
  status            ao_status NOT NULL DEFAULT 'open',
  responses_count   INTEGER NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ao_status ON public.appels_offres(status);
CREATE INDEX idx_ao_city ON public.appels_offres(city);
CREATE INDEX idx_ao_metier ON public.appels_offres(metier_id);

-- ─── 8. RÉPONSES AO ─────────────────────────────────────────
CREATE TABLE public.ao_responses (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ao_id             UUID NOT NULL REFERENCES public.appels_offres(id) ON DELETE CASCADE,
  prestataire_id    UUID NOT NULL REFERENCES public.prestataire_profiles(id) ON DELETE CASCADE,
  message           TEXT NOT NULL,
  proposed_budget   INTEGER,               -- FCFA
  status            ao_response_status NOT NULL DEFAULT 'pending',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(ao_id, prestataire_id)
);

-- Trigger : incrémente le compteur de réponses sur l'AO
CREATE OR REPLACE FUNCTION public.update_ao_responses_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.appels_offres
  SET responses_count = (
    SELECT COUNT(*) FROM public.ao_responses WHERE ao_id = COALESCE(NEW.ao_id, OLD.ao_id)
  )
  WHERE id = COALESCE(NEW.ao_id, OLD.ao_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER after_ao_response_change
  AFTER INSERT OR DELETE ON public.ao_responses
  FOR EACH ROW EXECUTE FUNCTION public.update_ao_responses_count();

-- ─── 9. MESSAGERIE ──────────────────────────────────────────
CREATE TABLE public.conversations (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id           UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  prestataire_id      UUID NOT NULL REFERENCES public.prestataire_profiles(id) ON DELETE CASCADE,
  last_message_at     TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(client_id, prestataire_id)
);

CREATE TABLE public.messages (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id   UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content           TEXT NOT NULL,
  is_read           BOOLEAN NOT NULL DEFAULT FALSE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_messages_conversation ON public.messages(conversation_id, created_at);

-- Trigger : met à jour last_message_at sur la conversation
CREATE OR REPLACE FUNCTION public.update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.conversations
  SET last_message_at = NOW()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER after_message_insert
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.update_conversation_last_message();

-- ─── 10. NOTIFICATIONS ──────────────────────────────────────
CREATE TABLE public.notifications (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type        notification_type NOT NULL,
  title       TEXT NOT NULL,
  body        TEXT NOT NULL,
  link        TEXT,
  is_read     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON public.notifications(user_id, is_read, created_at DESC);

-- ─── 11. UPDATED_AT TRIGGERS ────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_updated_at_prestataire
  BEFORE UPDATE ON public.prestataire_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_updated_at_entreprise
  BEFORE UPDATE ON public.entreprise_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_updated_at_ao
  BEFORE UPDATE ON public.appels_offres
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─── 12. ROW LEVEL SECURITY (RLS) ───────────────────────────
-- Active RLS sur toutes les tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prestataire_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entreprise_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.realisations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appels_offres ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ao_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- PROFILES
CREATE POLICY "Profils visibles par tous les connectés"
  ON public.profiles FOR SELECT
  TO authenticated USING (TRUE);

CREATE POLICY "Chacun peut modifier son propre profil"
  ON public.profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id);

-- PRESTATAIRE PROFILES
CREATE POLICY "Prestataires vérifiés visibles par tous"
  ON public.prestataire_profiles FOR SELECT
  TO anon, authenticated
  USING (account_status = 'verified');

CREATE POLICY "Prestataire peut voir son propre profil"
  ON public.prestataire_profiles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Prestataire peut créer son profil"
  ON public.prestataire_profiles FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Prestataire peut modifier son propre profil"
  ON public.prestataire_profiles FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- ENTREPRISE PROFILES
CREATE POLICY "Entreprises vérifiées visibles par tous"
  ON public.entreprise_profiles FOR SELECT
  TO authenticated
  USING (account_status = 'verified');

CREATE POLICY "Entreprise peut voir son propre profil"
  ON public.entreprise_profiles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Entreprise peut créer son profil"
  ON public.entreprise_profiles FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Entreprise peut modifier son profil"
  ON public.entreprise_profiles FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- MÉTIERS
CREATE POLICY "Métiers visibles par tous"
  ON public.metiers FOR SELECT
  TO anon, authenticated USING (is_active = TRUE);

-- RÉALISATIONS
CREATE POLICY "Réalisations visibles par tous"
  ON public.realisations FOR SELECT
  TO anon, authenticated USING (TRUE);

CREATE POLICY "Prestataire gère ses réalisations"
  ON public.realisations FOR ALL
  TO authenticated
  USING (prestataire_id IN (
    SELECT id FROM public.prestataire_profiles WHERE user_id = auth.uid()
  ));

-- AVIS
CREATE POLICY "Avis non modérés visibles par tous"
  ON public.reviews FOR SELECT
  TO anon, authenticated USING (NOT is_moderated);

CREATE POLICY "Clients connectés peuvent laisser un avis"
  ON public.reviews FOR INSERT
  TO authenticated
  WITH CHECK (client_id = auth.uid());

CREATE POLICY "Prestataire peut répondre à ses avis"
  ON public.reviews FOR UPDATE
  TO authenticated
  USING (prestataire_id IN (
    SELECT id FROM public.prestataire_profiles WHERE user_id = auth.uid()
  ));

-- APPELS D'OFFRES
CREATE POLICY "AO ouverts visibles par tous"
  ON public.appels_offres FOR SELECT
  TO anon, authenticated USING (status IN ('open', 'closing_soon'));

CREATE POLICY "Entreprise gère ses AO"
  ON public.appels_offres FOR ALL
  TO authenticated
  USING (entreprise_id IN (
    SELECT id FROM public.entreprise_profiles WHERE user_id = auth.uid()
  ));

-- RÉPONSES AO
CREATE POLICY "Prestataire voit ses propres réponses"
  ON public.ao_responses FOR SELECT
  TO authenticated
  USING (prestataire_id IN (
    SELECT id FROM public.prestataire_profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Entreprise voit les réponses à ses AO"
  ON public.ao_responses FOR SELECT
  TO authenticated
  USING (ao_id IN (
    SELECT id FROM public.appels_offres WHERE entreprise_id IN (
      SELECT id FROM public.entreprise_profiles WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY "Prestataire peut candidater"
  ON public.ao_responses FOR INSERT
  TO authenticated
  WITH CHECK (prestataire_id IN (
    SELECT id FROM public.prestataire_profiles WHERE user_id = auth.uid()
  ));

-- CONVERSATIONS & MESSAGES
CREATE POLICY "Voir ses conversations"
  ON public.conversations FOR SELECT
  TO authenticated
  USING (
    client_id = auth.uid() OR
    prestataire_id IN (SELECT id FROM public.prestataire_profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Créer une conversation"
  ON public.conversations FOR INSERT
  TO authenticated
  WITH CHECK (client_id = auth.uid());

CREATE POLICY "Voir les messages de ses conversations"
  ON public.messages FOR SELECT
  TO authenticated
  USING (
    conversation_id IN (
      SELECT id FROM public.conversations
      WHERE client_id = auth.uid()
         OR prestataire_id IN (SELECT id FROM public.prestataire_profiles WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Envoyer un message"
  ON public.messages FOR INSERT
  TO authenticated
  WITH CHECK (sender_id = auth.uid());

-- NOTIFICATIONS
CREATE POLICY "Voir ses notifications"
  ON public.notifications FOR SELECT
  TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Marquer ses notifications comme lues"
  ON public.notifications FOR UPDATE
  TO authenticated USING (user_id = auth.uid());
