-- ============================================================
-- ArtisConnect — Données initiales (métiers)
-- Exécuter après 001_initial_schema.sql
-- ============================================================

INSERT INTO public.metiers (name_fr, name_en, slug, icon, category) VALUES
-- Bâtiment & construction
('Maçonnerie', 'Masonry', 'maconnerie', '🧱', 'batiment'),
('Plomberie', 'Plumbing', 'plomberie', '🔧', 'batiment'),
('Électricité', 'Electrical', 'electricite', '⚡', 'batiment'),
('Menuiserie', 'Carpentry', 'menuiserie', '🪵', 'batiment'),
('Peinture & décoration', 'Painting & decoration', 'peinture', '🖌️', 'batiment'),
('Carrelage', 'Tiling', 'carrelage', '🏠', 'batiment'),
('Charpente', 'Roofing & framing', 'charpente', '🏗️', 'batiment'),
('Soudure & métallerie', 'Welding & metalwork', 'soudure', '⚙️', 'batiment'),
('Climatisation & froid', 'AC & refrigeration', 'climatisation', '❄️', 'batiment'),
('Vitrerie & aluminium', 'Glazing & aluminium', 'vitrerie', '🪟', 'batiment'),

-- Automobile & mécanique
('Mécanique auto', 'Auto mechanics', 'mecanique-auto', '🔩', 'mecanique'),
('Électricité auto', 'Auto electrical', 'electricite-auto', '🔌', 'mecanique'),
('Carrosserie & peinture auto', 'Body & auto paint', 'carrosserie', '🚗', 'mecanique'),
('Vulcanisation', 'Tire repair', 'vulcanisation', '🛞', 'mecanique'),
('Mécanique moto', 'Motorcycle mechanics', 'mecanique-moto', '🏍️', 'mecanique'),

-- Textile & couture
('Couture & confection', 'Sewing & tailoring', 'couture', '🪡', 'textile'),
('Broderie', 'Embroidery', 'broderie', '🧵', 'textile'),
('Cordonnerie', 'Cobblery', 'cordonnerie', '👟', 'textile'),

-- Beauté & bien-être
('Coiffure', 'Hairdressing', 'coiffure', '💇', 'beaute'),
('Coiffure & tresses', 'Hair braiding', 'tresses', '💆', 'beaute'),
('Esthétique', 'Beauty care', 'esthetique', '💅', 'beaute'),

-- Services à domicile
('Jardinage & espaces verts', 'Gardening', 'jardinage', '🌿', 'services'),
('Nettoyage & ménage', 'Cleaning', 'nettoyage', '🧹', 'services'),
('Déménagement', 'Moving', 'demenagement', '📦', 'services'),
('Sécurité & gardiennage', 'Security & guarding', 'securite', '🛡️', 'services'),

-- Numérique & tech
('Informatique & réparation', 'IT & repair', 'informatique', '💻', 'tech'),
('Imprimerie & reprographie', 'Printing', 'imprimerie', '🖨️', 'tech'),
('Photographie & vidéo', 'Photography & video', 'photographie', '📷', 'tech'),

-- Alimentation
('Restauration & traiteur', 'Catering', 'restauration', '🍽️', 'alimentation'),
('Boulangerie & pâtisserie', 'Bakery & pastry', 'boulangerie', '🍞', 'alimentation'),

-- Artisanat
('Poterie & céramique', 'Pottery & ceramics', 'poterie', '🏺', 'artisanat'),
('Sculpture & art', 'Sculpture & art', 'sculpture', '🎨', 'artisanat'),
('Vannerie & tissage', 'Basketry & weaving', 'vannerie', '🧺', 'artisanat');
