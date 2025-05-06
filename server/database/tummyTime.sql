-- 1. TABLE: user_baby
CREATE TABLE user_baby (
    baby_id INT REFERENCES baby(baby_id) ON DELETE CASCADE,
    user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    PRIMARY KEY (baby_id, user_id)
);

-- 2. TABLE: milestones
CREATE TABLE milestones (
milestone_id SERIAL PRIMARY KEY,
baby_id INT REFERENCES Baby(baby_id) ON DELETE CASCADE,
date DATE NOT NULL,
title VARCHAR(255) NOT NULL,
details VARCHAR(255)
)

-- 3. TABLE: journalentry
CREATE TABLE journalentry (
    entry_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    text TEXT NOT NULL,
    date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    image VARCHAR(255)
);

-- 4. TABLE: growth
CREATE TABLE IF NOT EXISTS growth (
growth_id SERIAL PRIMARY KEY,
baby_id INT REFERENCES Baby(baby_id) ON DELETE CASCADE,
date DATE NOT NULL,
weight DECIMAL(5, 2) NOT NULL,
height DECIMAL(5, 2) NOT NULL,
notes VARCHAR(255)
);

-- 5. TABLE: forumpost
CREATE TABLE forumpost (
    post_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE forumpost ADD COLUMN category VARCHAR(50);

-- 6. TABLE: forumreply
CREATE TABLE forumreply (
    reply_id SERIAL PRIMARY KEY,
    post_id INTEGER NOT NULL REFERENCES forumpost(post_id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. TABLE: feedingschedule
CREATE TABLE feedingschedule (
    feeding_schedule_id SERIAL PRIMARY KEY,
    baby_id INTEGER NOT NULL REFERENCES baby(baby_id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    type VARCHAR(100) NOT NULL,
    issues VARCHAR(255),
    notes VARCHAR(255),
    meal VARCHAR(50) NOT NULL,
    date DATE NOT NULL,
    time TIME WITHOUT TIME ZONE NOT NULL
);

-- 8. TABLE: coupons
CREATE TABLE Coupons (
    coupon_id SERIAL PRIMARY KEY,
    store_name VARCHAR(255),
    product_name VARCHAR(255),
    discount_description TEXT,
    discount_code VARCHAR(50),
    expiration_date DATE,
    is_online BOOLEAN,
    city VARCHAR(100),
    image_url TEXT,
    brands VARCHAR(255),
    store VARCHAR(255),
    is_featured BOOLEAN DEFAULT FALSE,
    discount_amount DECIMAL(6,2),
    discount_symbol VARCHAR(4) DEFAULT '$',
    label VARCHAR(50) GENERATED ALWAYS AS ('$' || discount_amount || ' off') STORED
);

INSERT INTO Coupons (store_name, product_name, discount_description, discount_code, expiration_date, is_online, city, image_url, brands, store, is_featured, discount_amount) VALUES
-- Toronto
('Enfamil Family Beginnings', 'Baby Formula', 'Get up to $400 in FREE gifts from Enfamil.', 'ENFAMIL400', '2025-04-10', TRUE, 'Toronto', 'https://new-lozo-prod.s3.amazonaws.com/offers/images/offer_140945.jpeg', 'Enfamil®', NULL, TRUE, 400.00),
('Rite Aid', 'Pampers Cruisers 360 Diapers', 'Save $3.00 on ONE Box Pampers Cruisers 360 Diapers.', 'PAMPERS3', '2025-05-15', FALSE, 'Toronto', 'https://new-lozo-prod.s3.amazonaws.com/offers/images/offer_706944.jpeg', 'Pampers®', 'Rite Aid', FALSE, 3.00),
-- Montreal
('Rite Aid', 'Pampers Wipes', 'Save $0.50 on TWO Pampers Wipes 52 ct or higher.', 'WIPES50', '2025-03-30', FALSE, 'Montreal', 'https://new-lozo-prod.s3.amazonaws.com/offers/images/offer_706917.jpeg', 'Pampers®', 'Rite Aid', FALSE, 0.50),
('Rite Aid', 'Pampers Pure Protection Diapers', 'Save $3.00 on ONE BOX Pampers Pure Protection Diapers.', 'PURE3', '2025-06-10', FALSE, 'Montreal', 'https://new-lozo-prod.s3.amazonaws.com/offers/images/offer_706908.jpeg', 'Pampers®', 'Rite Aid', FALSE, 3.00),
-- Calgary
('Rite Aid', 'Pampers Swaddlers Diapers', 'Save $1.50 on ONE Jumbo BAG Pampers Swaddlers, Pure OR Baby Dry Diapers.', 'SWADDLE150', '2025-04-20', FALSE, 'Calgary', 'https://new-lozo-prod.s3.amazonaws.com/offers/images/offer_706885.jpeg', 'Pampers®', 'Rite Aid', FALSE, 1.50),
('Enfamil Family Beginnings', 'Baby Formula', 'Get up to $400 in FREE gifts from Enfamil.', 'ENFAMIL400', '2025-05-25', TRUE, 'Calgary', 'https://new-lozo-prod.s3.amazonaws.com/offers/images/offer_140945.jpeg', 'Enfamil®', NULL, TRUE, 400.00),
-- Ottawa
('Rite Aid', 'Pampers Cruisers 360 Diapers', 'Save $3.00 on ONE Box Pampers Cruisers 360 Diapers.', 'PAMPERS3', '2025-03-22', FALSE, 'Ottawa', 'https://new-lozo-prod.s3.amazonaws.com/offers/images/offer_706944.jpeg', 'Pampers®', 'Rite Aid', FALSE, 3.00),
('Rite Aid', 'Pampers Wipes', 'Save $0.50 on TWO Pampers Wipes 52 ct or higher.', 'WIPES50', '2025-06-05', FALSE, 'Ottawa', 'https://new-lozo-prod.s3.amazonaws.com/offers/images/offer_706917.jpeg', 'Pampers®', 'Rite Aid', FALSE, 0.50),
-- Vancouver
('Rite Aid', 'Pampers Pure Protection Diapers', 'Save $3.00 on ONE BOX Pampers Pure Protection Diapers.', 'PURE3', '2025-04-18', FALSE, 'Vancouver', 'https://new-lozo-prod.s3.amazonaws.com/offers/images/offer_706908.jpeg', 'Pampers®', 'Rite Aid', FALSE, 3.00),
('Enfamil Family Beginnings', 'Baby Formula', 'Get up to $400 in FREE gifts from Enfamil.', 'ENFAMIL400', '2025-05-30', TRUE, 'Vancouver', 'https://new-lozo-prod.s3.amazonaws.com/offers/images/offer_140945.jpeg', 'Enfamil®', NULL, TRUE, 400.00);

-- Additional Coupons
INSERT INTO Coupons (store_name, product_name, discount_description, discount_code, expiration_date, is_online, city, image_url, brands, store, is_featured, discount_amount) VALUES
('Rite Aid', 'Pampers Easy Ups Training Underwear', 'Save $1.50 On ONE Jumbo BAG Pampers Easy Ups Training Underwear.', '706878', '2025-03-01', TRUE, 'Toronto', 'https://new-lozo-prod.s3.amazonaws.com/offers/images/offer_706878.jpeg', 'Pampers', 'Rite Aid', FALSE, 1.50),
('Rite Aid', 'Pampers Swaddlers, Cruisers OR Baby Dry', 'Save $3.00 On ONE BOX Pampers Swaddlers, Cruisers OR Baby Dry Diapers.', '706848', '2025-03-01', TRUE, 'Vancouver', 'https://new-lozo-prod.s3.amazonaws.com/offers/images/offer_706848.jpeg', 'Pampers', 'Rite Aid', FALSE, 3.00),
('Ibotta', 'Pampers Cruisers 360 Fit', 'Save $3.00 On Pampers Cruisers 360 Fit.', '386509', '2025-03-01', TRUE, 'Montreal', 'https://new-lozo-prod.s3.amazonaws.com/offers/images/offer_386509.png', 'Pampers', 'Ibotta', FALSE, 3.00),
('Ibotta', 'Pampers Cruisers 360 Fit Diapers', 'Save $3.00 On Pampers Cruisers 360 Fit Diapers.', '358172', '2025-03-01', TRUE, 'Calgary', 'https://new-lozo-prod.s3.amazonaws.com/offers/images/offer_358172.png', 'Pampers', 'Ibotta', FALSE, 3.00),
('Ibotta', 'Pampers Easy Ups Training Underwear', 'Save $3.00 On Pampers Easy Ups Training Underwear.', '358171', '2025-03-01', TRUE, 'Edmonton', 'https://new-lozo-prod.s3.amazonaws.com/offers/images/offer_358171.png', 'Pampers', 'Ibotta', FALSE, 3.00),
('Rite Aid', 'Huggies Diapers', 'Save $1.50 On any ONE (1) Package of Huggies Diapers.', '706969', '2025-03-01', TRUE, 'Ottawa', 'https://new-lozo-prod.s3.amazonaws.com/offers/images/offer_706969.jpeg', 'Huggies', 'Rite Aid', FALSE, 1.50);




-- Second batch of inserts
INSERT INTO Coupons (store_name, product_name, discount_description, discount_code, expiration_date, is_online, city, image_url, brands, store, is_featured, discount_amount) VALUES
('Rite Aid', 'Pull-Ups Training Pants', 'Save $1.50 On any ONE (1) pack of Pull-Ups Training Pants, Night*Time or Goodnites Youth Pants (7 ct. or higher. Not valid on Trial Packs)', 'PULLUPS150', '2025-12-31', TRUE, 'Toronto', 'https://new-lozo-prod.s3.amazonaws.com/offers/images/offer_706958.jpeg', 'Pull-Ups®', 'Rite Aid', FALSE, 1.50),
('Rite Aid', 'Aquaphor Body or Baby Product', 'Save $3.00 On any* ONE (1) Aquaphor Body or Aquaphor Baby Product *Excludes travel/trial sizes and items under 2oz', 'AQUAPHOR300', '2025-12-31', TRUE, 'Vancouver', 'https://new-lozo-prod.s3.amazonaws.com/offers/images/offer_706951.jpeg', 'Aquaphor®', 'Rite Aid', FALSE, 3.00),
('Rite Aid', 'Huggies Baby Wipes', 'Save $0.25 On any ONE (1) Pack of Huggies Baby Wipes, Natural Care, Simply Clean, Skin Essentials, Calm or Nourish (valid only on 56ct. to 168 ct.)', 'HUGGIES25', '2025-12-31', TRUE, 'Montreal', 'https://new-lozo-prod.s3.amazonaws.com/offers/images/offer_706866.jpeg', 'Huggies®', 'Rite Aid', FALSE, 0.25),
('Rite Aid', 'Eucerin Body, Baby, Sun or Face Products', 'Save $3.00 On any* ONE (1) Eucerin Body, Baby, Sun or Face Products. *Excludes travel/trial, Body Products under 5oz, and Radiant Tone products.', 'EUCERIN300', '2025-12-31', TRUE, 'Calgary', 'https://new-lozo-prod.s3.amazonaws.com/offers/images/offer_706854.jpeg', 'Eucerin®', 'Rite Aid', FALSE, 3.00);

INSERT INTO Coupons (store_name, product_name, discount_description, discount_code, expiration_date, is_online, city, image_url, brands, store, is_featured, discount_amount) VALUES
('Ibotta', 'Gerber Pouches', 'Save $5.00 On Gerber Pouches', 'GERBER5', '2025-03-31', TRUE, 'Toronto', 'https://new-lozo-prod.s3.amazonaws.com/offers/images/offer_381487.png', 'GERBER', 'Ibotta', FALSE, 5.00),
('Ibotta', 'Mommy''s Bliss Kids Sleep Gummies', 'Save $1.00 On Mommy''s Bliss Kids Sleep Gummies', 'MOMMY1', '2025-04-15', TRUE, 'Vancouver', 'https://new-lozo-prod.s3.amazonaws.com/offers/images/offer_371251.png', 'Mommy''s Bliss', 'Ibotta', FALSE, 1.00),
('Ibotta', 'Huggies Diapers', 'Save $3.00 On Huggies Diapers', 'HUGGIES3', '2025-05-01', TRUE, 'Montreal', 'https://new-lozo-prod.s3.amazonaws.com/offers/images/offer_358620.png', 'Huggies', 'Ibotta', FALSE, 3.00),
('Ibotta', 'Huggies Diapers', 'Save $6.00 On Huggies Diapers', 'HUGGIES6', '2025-05-15', TRUE, 'Calgary', 'https://new-lozo-prod.s3.amazonaws.com/offers/images/offer_358621.png', 'Huggies', 'Ibotta', FALSE, 6.00),
('Ibotta', 'Huggies Diapers', 'Save $4.00 On Huggies Diapers', 'HUGGIES4', '2025-06-01', TRUE, 'Edmonton', 'https://new-lozo-prod.s3.amazonaws.com/offers/images/offer_358622.png', 'Huggies', 'Ibotta', FALSE, 4.00),
('Ibotta', 'Luvs Diapers', 'Save $2.00 On Luvs Diapers', 'LUVS2', '2025-06-15', TRUE, 'Ottawa', 'https://new-lozo-prod.s3.amazonaws.com/offers/images/offer_358173.png', 'Luvs', 'Ibotta', FALSE, 2.00),
('Website', 'Pull-Ups Night*Time Training Pants', 'Save $2.00 off any one (1) package of Pull-Ups Night*Time Training Pants', 'PULLUPS2', '2025-07-01', TRUE, 'Winnipeg', 'https://new-lozo-prod.s3.amazonaws.com/offers/images/offer_241287.png', 'Pull-Ups', 'Website', FALSE, 2.00);

INSERT INTO Coupons (store_name, product_name, discount_description, discount_code, expiration_date, is_online, city, image_url, brands, store, is_featured, discount_amount) VALUES
('Website', 'Pull-Ups New Leaf Training Underwear', 'Save $2.00 off any ONE (1) package of Pull-Ups New Leaf Training Underwear', NULL, '2025-06-30', TRUE, 'Toronto', 'https://new-lozo-prod.s3.amazonaws.com/offers/images/offer_241286.png', 'Pull-Ups', 'Online', FALSE, 2.00),
('Website', 'Pull-Ups Potty Training Pants', 'Save $1.50 off any one (1) package of Pull-Ups Potty Training Pants', NULL, '2025-06-30', TRUE, 'Vancouver', 'https://new-lozo-prod.s3.amazonaws.com/offers/images/offer_241285.png', 'Pull-Ups', 'Online', FALSE, 1.50),
('Website', 'Happy Baby Organics Stage 2 Formula', 'Save $3.00 off any one (1) Happy Baby Organics Stage 2 Formula', NULL, '2025-06-30', TRUE, 'Montreal', 'https://new-lozo-prod.s3.amazonaws.com/offers/images/offer_259218.jpeg', 'Happy Baby, Happy Family', 'Online', FALSE, 3.00),
('Website', 'Happy Baby Organics Pouches & Jars', 'Save $1.00 off any three (3) Happy Baby Organics or Happy Tot Organics pouches and jars', NULL, '2025-06-30', TRUE, 'Calgary', 'https://new-lozo-prod.s3.amazonaws.com/offers/images/offer_132851.jpeg', 'Happy Baby, Happy Family', 'Online', FALSE, 1.00),
('Website', 'Happy Baby Organics Snack', 'Save $0.75 off ONE (1) Happy Baby Organics or Happy Tot Organics snack', NULL, '2025-06-30', TRUE, 'Ottawa', 'https://new-lozo-prod.s3.amazonaws.com/offers/images/offer_1037.png', 'Happy Baby, Happy Family', 'Online', FALSE, 0.75),
('Website', 'Happy Tot Organics Pouches', 'Save $1.00 on any three (3) Happy Tot Organics pouches', NULL, '2025-06-30', TRUE, 'Edmonton', 'https://new-lozo-prod.s3.amazonaws.com/offers/images/offer_74934.jpeg', 'Happy Baby, Happy Family', 'Online', FALSE, 1.00),
('Website', 'Happy Tot Organics Meal Bowl', 'Save $1.00 on any three (3) Happy Tot Organics meal bowls', NULL, '2025-06-30', TRUE, 'Winnipeg', 'https://new-lozo-prod.s3.amazonaws.com/offers/images/offer_74514.jpeg', 'Happy Baby, Happy Family', 'Online', FALSE, 1.00),
('Website', 'Gold Bond Product', 'Save $1.00 off any (1) Gold Bond Product', NULL, '2025-06-30', TRUE, 'Halifax', 'https://new-lozo-prod.s3.amazonaws.com/offers/images/offer_561.jpeg', 'Gold Bond', 'Online', FALSE, 1.00);






INSERT INTO Coupons (store_name, product_name, discount_description, discount_code, expiration_date, is_online, city, image_url, brands, store, is_featured, discount_amount) VALUES
('Shoppers Drug Mart', 'Eucerin Body Lotion', 'Save $3.00 on any EUCERIN® Body (8oz or larger), Baby or Face product', 'EUC3OFF', '2025-03-15', TRUE, 'Toronto', 'https://new-lozo-prod.s3.amazonaws.com/offers/images/offer_68162.gif', 'Eucerin®', 'Shoppers Drug Mart', FALSE, 3.00),
('Walmart', 'GoodNites Bed Mats', 'Save $1.50 off ONE (1) package of GoodNites® Bed Mats', 'GN1.5OFF', '2025-02-28', TRUE, 'Vancouver', 'https://new-lozo-prod.s3.amazonaws.com/offers/images/offer_16384.gif', 'GOODNITES®', 'Walmart', FALSE, 1.50),
('Loblaws', 'GoodNites Bedtime Pants', 'Save $1.50 off ONE (1) package of GoodNites® Bedtime Pants', 'GN1.5OFF', '2025-03-10', FALSE, 'Calgary', 'https://new-lozo-prod.s3.amazonaws.com/offers/images/offer_717.jpeg', 'GOODNITES®', 'Loblaws', FALSE, 1.50),
('Costco', 'Huggies Little Snugglers', 'Save $1.00 off any ONE (1) package of Huggies® Little Snugglers® Diapers', 'HUG1OFF', '2025-04-01', TRUE, 'Montreal', 'https://new-lozo-prod.s3.amazonaws.com/offers/images/offer_241284.jpeg', 'Huggies®', 'Costco', FALSE, 1.00),
('Superstore', 'Huggies Little Movers', 'Save $1.00 off any ONE (1) package of Huggies® Little Movers® Diapers', 'HUG1OFF', '2025-04-15', FALSE, 'Edmonton', 'https://new-lozo-prod.s3.amazonaws.com/offers/images/offer_241283.jpeg', 'Huggies®', 'Superstore', FALSE, 1.00),
('Metro', 'Huggies Special Delivery Diapers', 'Save $2.00 off any ONE (1) package of HUGGIES® Special Delivery™ Diapers (16 ct. or higher)', 'HUG2OFF', '2025-05-01', TRUE, 'Ottawa', 'https://new-lozo-prod.s3.amazonaws.com/offers/images/offer_239054.png', 'Huggies®', 'Metro', FALSE, 2.00),
('London Drugs', 'Children’s TYLENOL', 'Save $1.00 on any one (1) Children’s TYLENOL® or Infants’ TYLENOL® product', 'TYL1OFF', '2025-06-01', TRUE, 'Winnipeg', 'https://new-lozo-prod.s3.amazonaws.com/offers/images/offer_62407.png', 'Tylenol®', 'London Drugs', FALSE, 1.00);



INSERT INTO Coupons (store_name, product_name, discount_description, discount_code, expiration_date, is_online, city, image_url, brands, store, is_featured, discount_amount) VALUES
('Pharmacy Canada', 'A+D Product', 'Save $1.00 off ONE (1) A+D® Product', 'AD123', '2025-12-31', TRUE, 'Toronto', 'https://new-lozo-prod.s3.amazonaws.com/offers/images/offer_1475.jpeg', 'A+D®', 'Pharmacy Canada', FALSE, 1.00),
('Wellness Store', 'Boiron ColdCalm', 'Save $2.00 off any Boiron ColdCalm liquid doses', 'BC456', '2025-11-30', TRUE, 'Vancouver', 'https://new-lozo-prod.s3.amazonaws.com/offers/images/offer_82682.jpeg', 'Coldcalm®', 'Wellness Store', FALSE, 2.00),
('Natural Health', 'Boiron ColicComfort', 'Save $2.00 off any Boiron ColicComfort', 'CC789', '2025-10-31', FALSE, 'Montreal', 'https://new-lozo-prod.s3.amazonaws.com/offers/images/offer_75308.jpeg', 'ColicComfort®', 'Natural Health', FALSE, 2.00),
('Medicine Hub', 'Boiron Camilia 30 Dose', 'Save $2.00 off any Boiron Camilia 30 Dose', 'CA101', '2025-09-30', TRUE, 'Calgary', 'https://new-lozo-prod.s3.amazonaws.com/offers/images/offer_72283.jpeg', 'Camilia®', 'Medicine Hub', FALSE, 2.00),
('Baby Care Store', 'Aquaphor Baby Product', 'Save $3.00 On any ONE (1) Aquaphor Baby Product', 'AQ202', '2025-08-31', FALSE, 'Edmonton', 'https://new-lozo-prod.s3.amazonaws.com/offers/images/offer_705196.jpeg', 'Aquaphor®', 'Baby Care Store', FALSE, 3.00),
('Family Pharmacy', 'JOHNSON’S Baby Product', 'Save $0.75 On any ONE (1) JOHNSON’S Baby, Kid’s or DESITIN® Product', 'JP303', '2025-07-31', TRUE, 'Winnipeg', 'https://new-lozo-prod.s3.amazonaws.com/offers/images/offer_705175.jpeg', 'JOHNSON’S®', 'Family Pharmacy', FALSE, 0.75),
('Skin Care Depot', 'Eucerin Baby Product', 'Save $3.00 On any ONE (1) Eucerin Baby Product', 'EU404', '2025-06-30', FALSE, 'Ottawa', 'https://new-lozo-prod.s3.amazonaws.com/offers/images/offer_705164.jpeg', 'Eucerin®', 'Skin Care Depot', FALSE, 3.00);



-- sets the is_featured column to TRUE
UPDATE Coupons
SET is_featured = TRUE
WHERE brands LIKE 'Huggies%'
   OR store IN ('Walmart', 'Costco', 'Metro');

--9: TABLE: curatedtips
CREATE TABLE CuratedTips (
    tip_id SERIAL PRIMARY KEY,
    category VARCHAR(50) NOT NULL,            -- SLEEP, HYGIENE, PHYSICAL ACTIVITIES, LANGUAGE DEVELOPMENT
    target_gender VARCHAR(10) NOT NULL,         -- 'Boy', 'Girl', or 'All'
    min_age INT NOT NULL,                       -- in MONTHS (inclusive)
    max_age INT NOT NULL,                       -- in MONTHS (inclusive)
    tip_text TEXT NOT NULL,                     -- The curated tip content
    notification_frequency VARCHAR(10) NOT NULL, -- 'Daily' or 'Weekly'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO CuratedTips (category, target_gender, min_age, max_age, tip_text, notification_frequency) VALUES
('SLEEP', 'All', 0, 3, 'Establish a consistent sleep routine even in the early weeks.', 'Weekly'),
('SLEEP', 'Girl', 4, 6, 'Encourage quiet time before naps with soft lullabies.', 'Daily'),
('SLEEP', 'Boy', 7, 9, 'Monitor sleep patterns and adjust bedtime routines as needed.', 'Weekly'),
('SLEEP', 'All', 10, 12, 'Introduce a bedtime story to help signal winding down.', 'Daily'),

('HYGIENE', 'All', 0, 3, 'Keep the baby’s skin clean and moisturized with gentle products.', 'Weekly'),
('HYGIENE', 'Girl', 4, 6, 'Use hypoallergenic wipes and gentle soap during bath time.', 'Daily'),
('HYGIENE', 'Boy', 7, 9, 'Establish a gentle cleansing routine after feeding.', 'Weekly'),
('HYGIENE', 'All', 10, 12, 'Introduce a mild baby lotion to keep skin soft.', 'Daily'),

('PHYSICAL ACTIVITIES', 'Boy', 0, 3, 'Incorporate tummy time to strengthen neck and shoulder muscles.', 'Daily'),
('PHYSICAL ACTIVITIES', 'Girl', 0, 3, 'Engage in gentle play that encourages reaching and grasping.', 'Daily'),
('PHYSICAL ACTIVITIES', 'All', 4, 6, 'Encourage rolling over with supervised floor play.', 'Weekly'),
('PHYSICAL ACTIVITIES', 'Boy', 7, 9, 'Promote crawling by placing toys just out of reach.', 'Daily'),

('LANGUAGE DEVELOPMENT', 'All', 0, 3, 'Talk, sing, and read to your baby frequently to boost language skills.', 'Daily'),
('LANGUAGE DEVELOPMENT', 'Girl', 4, 6, 'Use varied tones and facial expressions when speaking to your baby.', 'Weekly'),
('LANGUAGE DEVELOPMENT', 'Boy', 4, 6, 'Engage in interactive play that includes simple words and sounds.', 'Daily'),
('LANGUAGE DEVELOPMENT', 'All', 7, 9, 'Introduce new vocabulary with picture books and songs.', 'Weekly'),
('LANGUAGE DEVELOPMENT', 'Girl', 10, 12, 'Encourage simple conversation by asking questions and waiting for responses.', 'Daily'),
('LANGUAGE DEVELOPMENT', 'Boy', 10, 12, 'Play interactive games like peek-a-boo to stimulate communication.', 'Weekly'),
('LANGUAGE DEVELOPMENT', 'All', 13, 15, 'Build language skills with storytime sessions and interactive reading.', 'Daily'),
('LANGUAGE DEVELOPMENT', 'All', 16, 18, 'Incorporate descriptive words during daily routines to enhance vocabulary.', 'Weekly'),
('LANGUAGE DEVELOPMENT', 'All', 19, 24, 'Encourage early word formation through fun repetition and music.', 'Daily');



INSERT INTO CuratedTips (category, target_gender, min_age, max_age, tip_text, notification_frequency) VALUES
('SLEEP', 'All', 13, 15, 'Establish a quiet environment for nap times.', 'Daily'),
('SLEEP', 'Girl', 13, 15, 'Use soft lighting and gentle music for nap sessions.', 'Weekly'),
('SLEEP', 'Boy', 16, 18, 'Maintain regular sleep schedules as naps consolidate.', 'Daily'),
('SLEEP', 'All', 19, 24, 'Gradually transition to a more structured bedtime routine.', 'Weekly'),

('HYGIENE', 'All', 13, 15, 'Introduce a regular bathing schedule to keep skin healthy.', 'Daily'),
('HYGIENE', 'Girl', 16, 18, 'Use fragrance-free, gentle cleansers during baths.', 'Weekly'),
('HYGIENE', 'Boy', 16, 18, 'Maintain skin hydration with regular moisturizing.', 'Daily'),
('HYGIENE', 'All', 19, 24, 'Establish a skincare routine that protects delicate skin.', 'Weekly'),

('PHYSICAL ACTIVITIES', 'All', 10, 12, 'Encourage assisted standing to build leg strength.', 'Daily'),
('PHYSICAL ACTIVITIES', 'Girl', 10, 12, 'Engage in interactive play to develop coordination.', 'Daily'),
('PHYSICAL ACTIVITIES', 'Boy', 13, 15, 'Promote crawling by placing toys just out of reach.', 'Weekly'),
('PHYSICAL ACTIVITIES', 'All', 16, 18, 'Incorporate assisted walking to improve balance.', 'Daily'),
('PHYSICAL ACTIVITIES', 'Girl', 19, 24, 'Create simple obstacle courses to boost motor skills.', 'Weekly'),

('LANGUAGE DEVELOPMENT', 'All', 13, 15, 'Introduce rhyming games and songs to encourage word formation.', 'Daily'),
('LANGUAGE DEVELOPMENT', 'Boy', 13, 15, 'Respond enthusiastically to babbling to encourage communication.', 'Weekly'),
('LANGUAGE DEVELOPMENT', 'Girl', 16, 18, 'Read short stories and ask simple questions during reading time.', 'Daily'),
('LANGUAGE DEVELOPMENT', 'All', 16, 18, 'Incorporate repetition and simple songs into daily routines.', 'Weekly'),
('LANGUAGE DEVELOPMENT', 'Boy', 19, 24, 'Use picture books to stimulate conversation and recognition.', 'Daily'),
('LANGUAGE DEVELOPMENT', 'Girl', 19, 24, 'Introduce basic sign language to aid early communication.', 'Weekly'),

('SLEEP', 'All', 25, 30, 'Maintain a consistent sleep schedule as your baby grows.', 'Daily'),
('HYGIENE', 'All', 25, 30, 'Gently clean and moisturize your baby’s skin after every bath.', 'Weekly'),
('PHYSICAL ACTIVITIES', 'All', 25, 30, 'Encourage independent play to boost coordination.', 'Daily'),
('LANGUAGE DEVELOPMENT', 'All', 25, 30, 'Expand vocabulary with interactive reading sessions.', 'Weekly'),
('SLEEP', 'Boy', 31, 36, 'Monitor sleep patterns and adjust bedtime routines accordingly.', 'Daily'),
('HYGIENE', 'Girl', 31, 36, 'Use natural, gentle products to maintain delicate skin.', 'Weekly'),
('PHYSICAL ACTIVITIES', 'Boy', 31, 36, 'Introduce activities that build strength and balance.', 'Daily'),
('LANGUAGE DEVELOPMENT', 'Girl', 31, 36, 'Encourage expressive language through engaging storytelling.', 'Weekly'),
('SLEEP', 'All', 37, 48, 'Develop a soothing nighttime routine to improve sleep quality.', 'Daily'),
('HYGIENE', 'All', 37, 48, 'Maintain a consistent hygiene routine to support healthy skin.', 'Weekly'),
('PHYSICAL ACTIVITIES', 'All', 37, 48, 'Incorporate more physical play to enhance motor skills.', 'Daily');

--10. TABLE: baby
CREATE TABLE Baby (
   baby_id SERIAL PRIMARY KEY,
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  gender VARCHAR(50) NOT NULL,
  weight NUMERIC NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE baby ADD COLUMN profile_picture_url VARCHAR(255) DEFAULT '/BlankProfilePictures/BlankBabyPicture.avif';

-- 11. TABLE: doctor_baby
CREATE TABLE doctor_baby (
  doctor_id INT REFERENCES users(user_id) ON DELETE CASCADE,
  baby_id INT REFERENCES baby(baby_id) ON DELETE CASCADE,
  PRIMARY KEY (baby_id, doctor_id)
);


-- 12. TABLE: healthRecord
CREATE TABLE healthRecord (
    record_id SERIAL PRIMARY KEY, -- Unique identifier for each health record
    baby_id INT NOT NULL, -- Foreign key referencing the baby
    date DATE NOT NULL, -- Date of the health record entry
    height DECIMAL(5, 2), -- Height of the baby in centimeters
    weight DECIMAL(5, 2), -- Weight of the baby in kilograms
    head_circumference DECIMAL(5, 2), -- Head circumference in centimeters
    temperature DECIMAL(4, 2), -- Body temperature in Celsius
    heart_rate INT, -- Heart rate in beats per minute
    respiratory_rate INT, -- Respiratory rate in breaths per minute
    blood_pressure VARCHAR(10), -- Blood pressure (e.g., "120/80")
    vaccinations TEXT, -- List of vaccinations administered
    notes TEXT, -- Additional notes or observations
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Timestamp of record creation
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Timestamp of last update

    -- Foreign key constraint to link to the baby table
    CONSTRAINT fk_baby
        FOREIGN KEY (baby_id)
        REFERENCES baby(baby_id)
        ON DELETE CASCADE
);
ALTER TABLE healthRecord
ADD COLUMN status VARCHAR(50);


INSERT INTO healthRecord (
    baby_id, date, height, weight, head_circumference, temperature, heart_rate, respiratory_rate, blood_pressure, vaccinations, notes, status
) VALUES (
    13, -- baby_id
    '2024-01-15', -- date
    60.5, -- height
    5.2, -- weight
    40.0, -- head circumference
    36.5, -- temperature
    120, -- heart rate
    30, -- respiratory rate
    '90/60', -- blood pressure
    'BCG, Hepatitis B', -- vaccinations
    'Baby is healthy and active.', -- notes
    'Stable' -- status
);

-- 13: TABLE stool_entries
CREATE TABLE public.stool_entries (
  stool_id    SERIAL PRIMARY KEY,
  baby_id     INT NOT NULL REFERENCES public.baby(baby_id) ON DELETE CASCADE,
  color       VARCHAR(50),    -- can be NULL if baby didn't poo
  consistency VARCHAR(50),    -- can be NULL if baby didn't poo
  notes       TEXT,
  timestamp   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2) INSERT one row per day, random data from 2024-12-01 to 2025-02-20
INSERT INTO public.stool_entries (baby_id, color, consistency, notes, timestamp)
SELECT
  13 AS baby_id,

  /* If "didn't poo," color is NULL; otherwise pick from array of colors */
  CASE
	WHEN random_note = 'didn''t poo today' THEN NULL
	ELSE (ARRAY['Brown','Yellow','Greenish','Dark Brown','Blackish'])
		 [floor(random()*5)+1]
  END AS color,

  /* If "didn't poo," consistency is NULL; otherwise pick from array of consistencies */
  CASE
	WHEN random_note = 'didn''t poo today' THEN NULL
	ELSE (ARRAY['Soft','Liquid','Hard','Seedy','Loose','Sticky'])
		 [floor(random()*6)+1]
  END AS consistency,

  /* We'll use the random_note for 'notes' directly */
  random_note,
  
  /* random timestamp within that day */
  (g.d::timestamp + (random()*86400)* interval '1 second') AS timestamp

FROM (
  /* Generate 1 row per day from Dec 1, 2024 to Feb 20, 2025 */
  SELECT d::date,
		 /* 20% chance of "didn't poo," else random note or null */
		 CASE
		   WHEN random() < 0.2 THEN 'didn''t poo today'
		   WHEN random() < 0.3 THEN NULL
		   ELSE (ARRAY[
			   'some lumps observed',
			   'slight odor noticed',
			   'normal stool for baby',
			   'watery with mild smell'
			 ])[floor(random()*4)+1]
		 END AS random_note
  FROM generate_series('2024-12-01'::date,
					   '2025-02-20'::date,
					   interval '1 day') AS t(d)
) AS g;


-- Feeding Schedule Sample Data start from 2024-12-01 to 2025-02-20 (adjust dates for smaller data size).
WITH random_data AS (
  SELECT
    gs.day::date AS date,
    floor(random() * 86400)::int AS seconds_offset,
    random() AS r_flag,   -- 20% chance baby did not eat
    random() AS r_meal,
    random() AS r_type,
    random() AS r_amount,
    random() AS r_issues
  FROM generate_series(
         '2024-12-01'::date,
         '2025-02-20'::date,
         INTERVAL '1 day'
       ) gs(day)
)
INSERT INTO public.feedingschedule (
  baby_id,
  date,
  time,
  meal,
  type,
  amount,
  issues,
  notes
)
SELECT
  13 AS baby_id,
  date,
  ('00:00:00'::time + seconds_offset * INTERVAL '1 second')::time AS time,
  
  CASE 
    WHEN r_flag < 0.2 THEN 'None'
    ELSE (ARRAY['Breakfast','Lunch','Dinner','Snack'])[floor(r_meal * 4) + 1]
  END AS meal,
  
  CASE 
    WHEN r_flag < 0.2 THEN 'None'
    ELSE (ARRAY['Formula','Breastmilk','Solid','Mixed'])[floor(r_type * 4) + 1]
  END AS type,
  
  CASE 
    WHEN r_flag < 0.2 THEN 0
    ELSE CAST((r_amount * 8 + 1) AS INTEGER)
  END AS amount,
  
  CASE 
    WHEN r_issues < 0.1 THEN 'Spit up'
    WHEN r_issues < 0.2 THEN 'Refused partial feed'
    ELSE NULL
  END AS issues,
  
  CASE 
    WHEN r_flag < 0.2 THEN 'baby did not eat'
    ELSE NULL
  END AS notes
FROM random_data;


-- Growth sample data (weight, height) start from 2024-12-01 to 2025-02-20, increase by 7 day interval
WITH gs AS (
  SELECT 
    gs.day::date AS date,
    row_number() OVER (ORDER BY gs.day) - 1 AS rn,
    count(*) OVER () - 1 AS max_rn
  FROM generate_series(
         '2024-12-01'::date,
         '2025-02-20'::date,
         INTERVAL '7 days'
       ) AS gs(day)
)
INSERT INTO public.growth (baby_id, date, height, weight, notes)
SELECT
  13 AS baby_id,
  date,
  CAST(12 + ((30 - 12) * rn::numeric / NULLIF(max_rn, 0)) AS NUMERIC(5,2)) AS height,
  CAST((random() * 22 + 8) AS NUMERIC(5,2)) AS weight,
  CASE 
    WHEN random() < 0.3 THEN NULL
    ELSE (ARRAY[
           'Growth spurt this week',
           'Everything looks normal',
           'Pediatrician says healthy',
           'Slightly below average weight'
         ])[floor(random() * 4) + 1]
  END AS notes
FROM gs;

-- Milestone sample data from 2024-12-01 to 2025-02-20 with 10 day interval
WITH date_cte AS (
  SELECT
    ROW_NUMBER() OVER (ORDER BY gs.day) AS rn,
    gs.day::date AS milestone_date
  FROM generate_series(
    '2024-12-01'::date,
    '2025-02-20'::date,
    INTERVAL '10 days'
  ) AS gs(day)
)
INSERT INTO public.milestones (baby_id, date, title, details)
SELECT
  13 AS baby_id,
  d.milestone_date AS date,
  (ARRAY[
    'First Steps',
    'First Words',
    'Stood Unsupported',
    'Started Crawling',
    'First Solid Food',
    'Waved Hello',
    'Clapped Hands',
    'Said “Mama”',
    'Said “Dada”',
    'First Laugh'
  ])[d.rn] AS title,
  (ARRAY[
    'Family cheered a lot!',
    'We recorded a video',
    'Called the pediatrician, all good',
    'No issues encountered, baby is healthy',
    'Grandparents were excited',
    'Posted on social media',
    'Big celebration at home',
    'Documented in the baby journal',
    'Siblings joined in excitement',
    'Baby looked very happy!'
  ])[d.rn] AS details
FROM date_cte d;


-- TABLE 14: reminders
CREATE TABLE public.reminders (
	reminder_id serial4 NOT NULL,
	baby_id int4 NOT NULL,
	title varchar(255) NOT NULL,
	"time" time NOT NULL,
	"date" date NOT NULL,
	notes text NULL,
	is_active bool DEFAULT true NULL,
	next_reminder bool DEFAULT false NULL,
	reminder_in varchar(20) NULL,
	created_at timestamp DEFAULT CURRENT_TIMESTAMP NULL,
	updated_at timestamp DEFAULT CURRENT_TIMESTAMP NULL,
	CONSTRAINT reminders_pkey PRIMARY KEY (reminder_id)
);
CREATE INDEX idx_reminders_baby_id ON public.reminders USING btree (baby_id);


-- public.reminders foreign keys

ALTER TABLE public.reminders ADD CONSTRAINT reminders_baby_id_fkey FOREIGN KEY (baby_id) REFERENCES public.baby(baby_id) ON DELETE CASCADE;

-- Reminder Sample Data
DO $$
DECLARE
    BABY_ID INT := 13; -- Set your baby_id here
    curr_date DATE;
    random_hour INT;
    random_minute INT;
    formatted_time TEXT;
    next_reminder_value BOOLEAN;
    reminder_in_value TEXT;
    reminder_in_options TEXT[] := ARRAY['1 hr', '1.5 hrs', '2 hrs', '3 hrs', '4 hrs'];
    
    -- Category-specific reminder data
    feeding_titles TEXT[] := ARRAY['Morning Feeding', 'Afternoon Feeding', 'Evening Feeding', 'Night Feeding'];
    feeding_notes TEXT[] := ARRAY[
        'Baby was hungry and finished quickly.',
        'Seemed fussy during feeding, might need more attention.',
        'Ate well. Burped easily after feeding.',
        'Tried new formula today. Baby seemed to like it.',
        'Only finished half the bottle. Monitor next feeding.',
        'Good appetite today.',
        'Baby fell asleep while feeding.'
    ];
    
    medical_titles TEXT[] := ARRAY['Pediatrician Appointment', 'Vaccination Appointment', 'Growth Check', 'Eye Doctor Appointment'];
    medical_notes TEXT[] := ARRAY[
        'Regular checkup with Dr. Smith. Bring health card.',
        'Scheduled vaccinations at City Clinic. Bring health record.',
        'Follow-up appointment to check weight gain.',
        'Follow up with Dr. Johnson at Children''s Hospital.',
        'Remember to ask about sleep patterns.',
        'Appointment at City Clinic. Free parking available.',
        'Bring list of questions for the doctor.'
    ];
    
    care_titles TEXT[] := ARRAY['Diaper Change', 'Bath Time', 'Temperature Check', 'Medicine Reminder', 'Vitamin D Drops'];
    care_notes TEXT[] := ARRAY[
        'Check for rash and apply cream if needed.',
        'Use gentle soap and warm water.',
        'Record temperature in baby journal.',
        'Monitor for any changes in symptoms.',
        'Administer medicine after feeding.',
        'Make sure area is completely dry before diapering.',
        'Check supplies, may need to restock.'
    ];
    
    activity_titles TEXT[] := ARRAY['Tummy Time', 'Playtime', 'Sleep Schedule'];
    activity_notes TEXT[] := ARRAY[
        'Aim for 10-15 minutes on tummy.',
        'Use colorful toys to encourage movement.',
        'Watch for developmental milestones.',
        'Try new sensory play activities.',
        'Focus on establishing bedtime routine.',
        'Monitor for signs of tiredness.',
        'Keep session short if baby seems frustrated.'
    ];
    
    -- Variables for selected reminder data
    selected_category INT;
    selected_title TEXT;
    selected_note TEXT;
BEGIN
    -- Generate 15 reminder records, one for each day counting backward from today
    FOR i IN 0..14 LOOP
        curr_date := CURRENT_DATE - (i || ' days')::INTERVAL;
        
        -- Random time between 6:00 and 21:00
        random_hour := 6 + floor(random() * 15);
        random_minute := floor(random() * 4) * 15; -- 0, 15, 30, or 45
        formatted_time := lpad(random_hour::text, 2, '0') || ':' || lpad(random_minute::text, 2, '0');
        
        -- Select a random category (1=feeding, 2=medical, 3=care, 4=activity)
        selected_category := 1 + floor(random() * 4);
        
        -- Based on category, select appropriate title and matching note
        CASE selected_category
            WHEN 1 THEN -- Feeding
                selected_title := feeding_titles[1 + floor(random() * array_length(feeding_titles, 1))];
                selected_note := feeding_notes[1 + floor(random() * array_length(feeding_notes, 1))];
                next_reminder_value := random() < 0.8; -- 80% chance for feeding entries
            WHEN 2 THEN -- Medical
                selected_title := medical_titles[1 + floor(random() * array_length(medical_titles, 1))];
                selected_note := medical_notes[1 + floor(random() * array_length(medical_notes, 1))];
                next_reminder_value := random() < 0.3; -- 30% chance for medical entries
            WHEN 3 THEN -- Care
                selected_title := care_titles[1 + floor(random() * array_length(care_titles, 1))];
                selected_note := care_notes[1 + floor(random() * array_length(care_notes, 1))];
                next_reminder_value := random() < 0.4; -- 40% chance for care entries
            WHEN 4 THEN -- Activity
                selected_title := activity_titles[1 + floor(random() * array_length(activity_titles, 1))];
                selected_note := activity_notes[1 + floor(random() * array_length(activity_notes, 1))];
                next_reminder_value := random() < 0.2; -- 20% chance for activity entries
        END CASE;
        
        -- Set reminder_in value if next_reminder is enabled
        IF next_reminder_value THEN
            reminder_in_value := reminder_in_options[1 + floor(random() * array_length(reminder_in_options, 1))];
        ELSE
            reminder_in_value := NULL;
        END IF;
        
        -- Insert the record with proper type casting and correlation between title and notes
        INSERT INTO reminders (
            baby_id,
            title,
            "time",
            "date",
            notes,
            is_active,
            next_reminder,
            reminder_in,
            created_at,
            updated_at
        ) VALUES (
            BABY_ID,
            selected_title,
            formatted_time::TIME,
            curr_date,
            selected_note,
            TRUE, -- All active
            next_reminder_value,
            reminder_in_value,
            CURRENT_TIMESTAMP - (random() * i || ' hours')::INTERVAL,
            CURRENT_TIMESTAMP - (random() * i || ' hours')::INTERVAL
        );
    END LOOP;
END $$;

-- TABLE 15: TipsNotificationSettings
DROP TABLE IF EXISTS TipsNotificationSettings CASCADE;

CREATE TABLE TipsNotificationSettings (
    setting_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE, -- Only one record per user
    notification_frequency VARCHAR(10) NOT NULL, -- 'Daily' or 'Weekly'
    opt_in BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- TABLE 16:
DROP TABLE IF EXISTS exporteddocument CASCADE;

-- Create the exporteddocument table
CREATE TABLE exporteddocument (
    document_id SERIAL PRIMARY KEY,
    file_name VARCHAR(255) NOT NULL,
    file_format VARCHAR(50) NOT NULL,
    created_at TIMESTAMP NOT NULL  
);

-- Example inserts:
INSERT INTO exporteddocument (file_name, file_format, created_at)
VALUES 
('"ExportedBabyData_Info_Growth_Milestones_Feeding_Stool_from2025-02-27_to2025-03-16.csv"', 'CSV', '2024-05-21 02:55:35.938');


--TABLE 17
CREATE TABLE childcare_providers (
    id              SERIAL PRIMARY KEY,
    provider_type   TEXT NOT NULL,           -- "nannies" or "babysitters"
    city            TEXT NOT NULL,           -- e.g. "Toronto", "Vancouver", from dataByLocation keys
    name            TEXT NOT NULL,
    location        TEXT,                    -- provider's stated location in their profile
    rating          NUMERIC(3, 2),           -- or REAL, depending on preference
    reviews_count   INT DEFAULT 0,
    experience      TEXT,                    -- e.g. "10 years"
    age             INT,
    hourly_rate     NUMERIC(6, 2),           -- or REAL, depending on preference
    title           TEXT,
    bio             TEXT,
    is_premium      BOOLEAN DEFAULT FALSE,
    profile_url     TEXT,
    profile_image   TEXT,
    verification    BOOLEAN DEFAULT FALSE,
    hired_count     INT DEFAULT 0,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create an index for faster searches
CREATE INDEX idx_provider_type_city ON childcare_providers(provider_type, city);
ALTER TABLE childcare_providers
ADD COLUMN IF NOT EXISTS favourite BOOLEAN DEFAULT FALSE;

-- 18:Create table for storing user's favorite childcare providers
CREATE TABLE IF NOT EXISTS user_favorite_providers (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  provider_id INTEGER NOT NULL REFERENCES childcare_providers(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, provider_id)
);

-- Create index to improve query performance
CREATE INDEX IF NOT EXISTS idx_user_favorite_providers_user_id ON user_favorite_providers(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorite_providers_provider_id ON user_favorite_providers(provider_id);

-- Add comment to table
COMMENT ON TABLE user_favorite_providers IS 'Stores user favorite childcare providers for quick access and filtering';

INSERT INTO public.childcare_providers
  (provider_type, city, "name", "location", rating, reviews_count, experience, age, hourly_rate, title, bio, is_premium, profile_url, profile_image, verification, hired_count, created_at, favourite)
VALUES
  ('nannies','Toronto','Fernanda','Brampton',5.00,3,NULL,38,14.00,
    'I''m a Brazilian nanny with 12 years of experience!',
    'I''m a Brazilian nanny with 12 years of experience! ...',
    true,
    'https://care.com/en-ca/profiles/details/child-care-fernandac-brampton/2306196?source=providerSnippet',
    'https://useprd-cdn-s.care.com/attachments/member/1161461_MTE2MTQ2MQ==/606079/profile.jpg?1676528875005',
    true, 2, '2025-03-19 02:29:34.050439-04', false),
    
  ('nannies','Vancouver','Emma','Edmonton',5.00,1,'4 years',54,12.00,
    '',
    'My name is Emma, I been working in Hongkong about five years ...',
    true,
    'https://care.com/en-ca/profiles/details/child-care-emmab-edmonton/599616?source=providerSnippet',
    'https://useprd-cdn-s.care.com/attachments/member/543265_NTQzMjY1/488025/profile.jpg?1612956628006',
    true, 1, '2025-03-19 02:29:34.050439-04', false),
    
  ('nannies','Montreal','Emma','Edmonton',5.00,1,'4 years',54,12.00,
    '',
    'My name is Emma, I been working in Hongkong about five years ...',
    true,
    'https://care.com/en-ca/profiles/details/child-care-emmab-edmonton/599616?source=providerSnippet',
    'https://useprd-cdn-s.care.com/attachments/member/543265_NTQzMjY1/488025/profile.jpg?1612956628006',
    true, 1, '2025-03-19 02:29:34.050439-04', false);

-- Three distinct babysitters
INSERT INTO public.childcare_providers
  (provider_type, city, "name", "location", rating, reviews_count, experience, age, hourly_rate, title, bio, is_premium, profile_url, profile_image, verification, hired_count, created_at, favourite)
VALUES
  ('babysitters','Toronto','Natalia','Vancouver',5.00,1,'9 years',24,17.00,
    'Fun Responsible loving nanny/babysitter',
    'Fun Responsible loving nanny/babysitter ...',
    false,
    'https://care.com/en-ca/profiles/details/child-care-nataliam-vancouver/1377640?source=providerSnippet',
    'https://useprd-cdn-s.care.com/attachments/member/1093063_MTA5MzA2Mw==/431550/profile.jpg?1573508070005',
    false, 0, '2025-03-19 02:29:34.050439-04', false),
    
  ('babysitters','Calgary','Chloe','Calgary',5.00,1,'5 years',27,16.00,
    'Hello, I’m Chloe',
    'Hello, I’m Chloe ...',
    false,
    'https://care.com/en-ca/profiles/details/child-care-chloem-calgary/985021?source=providerSnippet',
    'https://useprd-cdn-s.care.com/attachments/member/774174_Nzc0MTc0/300865/profile.jpg?1512380661003',
    false, 1, '2025-03-19 02:29:34.050439-04', false),
    
  ('babysitters','Ottawa','Kaitlyn','Montreal',5.00,1,'7 years',25,16.00,
    'Hi! I''m looking for a part time job to do after classes as I''m a full time student',
    'Hi! I''m looking for a part time job ...',
    false,
    'https://care.com/en-ca/profiles/details/child-care-kaitlync-montreal/1028701?source=providerSnippet',
    'https://useprd-cdn-s.care.com/attachments/member/823894_ODIzODk0/323238/profile.png?1521217031005',
    true, 1, '2025-03-19 02:29:34.050439-04', false);
    
--Table 19: sharing_health_documents_parent_doctor
CREATE TABLE sharing_health_documents_baby_doctor (
  document_id SERIAL PRIMARY KEY,
  filename VARCHAR(255) NOT NULL,
  file_data BYTEA NOT NULL,
  mimetype TEXT NOT NULL,
  baby_id INTEGER NOT NULL,
  uploaded_by INTEGER NOT NULL,
  shared_with INTEGER,
  is_from_doctor BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Add foreign key constraints if you have users and children tables
  CONSTRAINT fk_baby FOREIGN KEY(baby_id) REFERENCES baby(baby_id) ON DELETE CASCADE,
  CONSTRAINT fk_uploader FOREIGN KEY(uploaded_by) REFERENCES users(user_id),
  CONSTRAINT fk_shared_with FOREIGN KEY(shared_with) REFERENCES users(user_id)
);    
    

-- TABLE 20: Create a table for storing the actual image data
CREATE TABLE profile_images (
    image_id SERIAL PRIMARY KEY,
    entity_type VARCHAR(10) NOT NULL CHECK (entity_type IN ('user', 'baby')),
    entity_id INTEGER NOT NULL,
    image_data BYTEA NOT NULL,
    mime_type VARCHAR(30) NOT NULL,
    original_filename VARCHAR(255),
    file_size INTEGER NOT NULL,
    width INTEGER,
    height INTEGER,
    is_animated BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Create index for faster lookups and enforce uniqueness
    UNIQUE (entity_type, entity_id)
);
-- Create index for faster retrieval by entity
CREATE INDEX idx_profile_images_entity ON profile_images(entity_type, entity_id);
    

--TABLE 21: Users after adding the profile picture
-- 1. Add reference columns to the main tables
ALTER TABLE users ADD COLUMN profile_picture_url VARCHAR(255) DEFAULT '/BlankProfilePictures/BlankUserPicture.avif';
CREATE TABLE public.users (
    user_id serial4 NOT NULL,
    email varchar(255) NOT NULL,
    first_name varchar(100) NOT NULL,
    last_name varchar(100) NOT NULL,
    "role" varchar(50) NOT NULL,
    created_at timestamp DEFAULT now() NULL,
    profile_picture_url varchar(255) DEFAULT '/BlankProfilePictures/BlankProfilePicture.avif'::character varying NULL,
    CONSTRAINT users_email_key UNIQUE (email),
    CONSTRAINT users_pkey PRIMARY KEY (user_id)
);

CREATE TABLE public.reminders (
    reminder_id serial4 NOT NULL,
    baby_id int4 NOT NULL,
    title varchar(255) NOT NULL,
    "time" time NOT NULL,
    "date" date NOT NULL,
    notes text NULL,
    is_active bool DEFAULT true NULL,
    next_reminder bool DEFAULT false NULL,
    reminder_in varchar(20) NULL,
    created_at timestamp DEFAULT CURRENT_TIMESTAMP NULL,
    updated_at timestamp DEFAULT CURRENT_TIMESTAMP NULL,
    alert_minutes_before int4 NULL,
    original_time time NULL,
    original_date date NULL,
    delay_count int4 DEFAULT 0 NULL,
    last_notification_at timestamp NULL,
    CONSTRAINT reminders_pkey PRIMARY KEY (reminder_id),
    CONSTRAINT reminders_baby_id_fkey FOREIGN KEY (baby_id) REFERENCES public.baby(baby_id) ON DELETE CASCADE
);
CREATE INDEX idx_reminders_baby_id ON public.reminders USING btree (baby_id);

-- TABLE: Quiz
-- Drop tables if they exist 
DROP TABLE IF EXISTS QuizQuestions CASCADE;

-- Quiz Questions table
CREATE TABLE QuizQuestions (
    question_id SERIAL PRIMARY KEY,
    category VARCHAR(50) NOT NULL, 
    question_text TEXT NOT NULL,
    option_a TEXT NOT NULL,
    option_b TEXT NOT NULL,
    option_c TEXT NOT NULL,
    option_d TEXT NOT NULL,
    correct_option VARCHAR(1) NOT NULL,    -- 'A', 'B', 'C', or 'D'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- Category: SLEEP (10 questions)
INSERT INTO QuizQuestions (category, question_text, option_a, option_b, option_c, option_d, correct_option) VALUES
('SLEEP', 'For infants 0-3 months, which tip is recommended to improve sleep?', 'Introduce bedtime stories', 'Encourage active play before bed', 'Establish a consistent sleep routine', 'Monitor sleep patterns', 'C'),
('SLEEP', 'For infants 4-6 months (girls), what is advised before naps?', 'Play energetic music', 'Encourage quiet time with soft lullabies', 'Increase feedings', 'Establish a sleep routine', 'B'),
('SLEEP', 'For 7-9 month old boys, which tip is best for sleep improvement?', 'Monitor sleep patterns and adjust routines', 'Encourage daytime naps only', 'Use bright lights before bedtime', 'Introduce bedtime stories', 'A'),
('SLEEP', 'For 10-12 month olds, what helps signal bedtime?', 'Introduce a bedtime story', 'Feed a large meal', 'Delay bedtime', 'Keep the room noisy', 'A'),
('SLEEP', 'Which tip is common for improving infant sleep overall?', 'Avoid any routine', 'Skip naps', 'Establish a consistent sleep routine', 'Keep changing bedtime', 'C'),
('SLEEP', 'For babies aged 13-15 months, what is recommended for naps?', 'Delay naps indefinitely', 'Establish a quiet environment for nap times', 'Use bright colors in the room', 'Encourage active play', 'B'),
('SLEEP', 'For 16-18 month old boys, which advice is given?', 'Avoid sleep routines', 'Maintain irregular sleep patterns', 'Monitor sleep patterns', 'Keep lights on all night', 'C'),
('SLEEP', 'What is advised for infants aged 19-24 months regarding sleep?', 'Avoid any sleep schedule', 'Transition to a structured bedtime routine gradually', 'Keep changing routines daily', 'Allow endless screen time', 'B'),
('SLEEP', 'For older infants, what is a key sleep tip?', 'Avoid sleep routines', 'Maintain a consistent sleep schedule', 'Increase nighttime activities', 'Vary the bedtime every day', 'B'),
('SLEEP', 'For toddlers aged 37-48 months, what is recommended?', 'Change routines daily', 'Increase bedtime delays', 'Develop a soothing nighttime routine', 'Keep them awake longer', 'C');


-- Category: HYGIENE (10 questions)
INSERT INTO QuizQuestions (category, question_text, option_a, option_b, option_c, option_d, correct_option) VALUES
('HYGIENE', 'For infants 0-3 months, what hygiene tip is recommended?', 'Clean the baby’s face and neck folds daily', 'Start brushing teeth', 'Introduce solid food cleaning routines', 'Encourage independent washing', 'A'),
('HYGIENE', 'What hygiene practice is suitable for 4-6 month old girls?', 'Use toothpaste twice a day', 'Introduce regular diaper changing routines', 'Teach handwashing techniques', 'Let them bathe independently', 'B'),
('HYGIENE', 'For boys aged 7-9 months, what is recommended?', 'Monitor their tooth brushing', 'Let them clean themselves', 'Wipe gums with a clean cloth', 'Use mouthwash', 'C'),
('HYGIENE', 'What hygiene tip is important for 10-12 month olds?', 'Brush with fluoride toothpaste', 'Teach to bathe independently', 'Clean teeth and gums gently with a soft brush', 'Introduce flossing', 'C'),
('HYGIENE', 'Which hygiene practice is advised for 13-15 month infants?', 'Allow them to brush without supervision', 'Teach them to floss', 'Encourage supervised brushing with soft toothbrush', 'Skip brushing after meals', 'C'),
('HYGIENE', 'For 16-18 month olds, what is an effective hygiene tip?', 'Encourage wiping hands after meals', 'Let them use adult toothbrushes', 'Introduce daily shampoo use', 'Skip cleaning baby bottles', 'A'),
('HYGIENE', 'What hygiene routine is recommended for toddlers aged 19-24 months?', 'Allow use of harsh soaps', 'Teach proper handwashing techniques', 'Skip bath time routines', 'Ignore brushing teeth', 'B'),
('HYGIENE', 'For toddlers 25-30 months, what’s a good hygiene habit?', 'Supervised tooth brushing', 'No need to brush teeth yet', 'Avoid handwashing education', 'Skip bath time', 'A'),
('HYGIENE', 'Which hygiene tip suits 31-36 month olds?', 'Brush teeth occasionally', 'Encourage independent hygiene with supervision', 'Let them eat without washing hands', 'Skip cleaning toys', 'B'),
('HYGIENE', 'For 37-48 month olds, what is advised?', 'Introduce flossing and regular tooth brushing', 'Avoid brushing to prevent resistance', 'Skip baths during winter', 'Ignore dental visits', 'A');










-- Category: PHYSICAL ACTIVITIES (10 questions) 
INSERT INTO QuizQuestions (category, question_text, option_a, option_b, option_c, option_d, correct_option) VALUES
-- Row 1
('PHYSICAL ACTIVITIES', 'For 0-3 month old boys, what is a recommended physical activity?', 
 'Avoid any play', 
 'Keep the baby immobilized', 
 'Incorporate tummy time to strengthen neck and shoulder muscles', 
 'Skip tummy time', 'C'),
-- Row 2
('PHYSICAL ACTIVITIES', 'For 0-3 month old girls, which activity is suggested?', 
 'Keep the baby in a crib all day', 
 'Engage in gentle play that encourages reaching and grasping', 
 'Overstimulate the baby', 
 'Avoid movement', 'B'),
-- Row 3
('PHYSICAL ACTIVITIES', 'For 4-6 month olds (all genders), what is advised?', 
 'Avoid floor play', 
 'Encourage rolling over with supervised floor play', 
 'Place the baby on a hard surface', 
 'Keep the baby in a carrier constantly', 'B'),
-- Row 4
('PHYSICAL ACTIVITIES', 'For 7-9 month old boys, which advice is given?', 
 'Keep the baby confined', 
 'Overstimulate with excessive toys', 
 'Do not provide any toys', 
 'Promote crawling by placing toys just out of reach', 'D'),
-- Row 5
('PHYSICAL ACTIVITIES', 'For 10-12 month olds, what is a good activity tip?', 
 'Avoid assisted standing', 
 'Encourage assisted standing to build leg strength', 
 'Restrict movement', 
 'Keep the baby seated only', 'B'),
-- Row 6
('PHYSICAL ACTIVITIES', 'For 13-15 month olds (boys), what is suggested?', 
 'Do not supervise play', 
 'Avoid toys', 
 'Keep the baby in one spot', 
 'Promote crawling by placing toys just out of reach', 'D'),
-- Row 7
('PHYSICAL ACTIVITIES', 'For 16-18 month olds, which activity is encouraged?', 
 'Do not supervise', 
 'Keep the baby lying down', 
 'Avoid walking practice', 
 'Incorporate assisted walking to improve balance', 'D'),
-- Row 8
('PHYSICAL ACTIVITIES', 'For 19-24 month old girls, what tip is provided?', 
 'Restrict physical activity', 
 'Keep the play area empty', 
 'Avoid any challenge', 
 'Create simple obstacle courses to boost motor skills', 'D'),
-- Row 9
('PHYSICAL ACTIVITIES', 'For toddlers 25-30 months, what is recommended?', 
 'Keep play structured and rigid', 
 'Overcontrol activities', 
 'Encourage independent play to boost coordination', 
 'Avoid any independent play', 'C'),
-- Row 10
('PHYSICAL ACTIVITIES', 'For toddlers 31-36 months (boys), what is a key tip?', 
 'Do not allow physical play', 
 'Keep the child sedentary', 
 'Avoid any outdoor activity', 
 'Introduce activities that build strength and balance', 'D');



-- Category: LANGUAGE DEVELOPMENT (10 questions) 
INSERT INTO QuizQuestions (category, question_text, option_a, option_b, option_c, option_d, correct_option) VALUES
-- Row 1
('LANGUAGE DEVELOPMENT', 'For infants 0-3 months, what language tip is advised?', 
 'Use complex vocabulary', 
 'Avoid interaction', 
 'Talk, sing, and read frequently to boost language skills', 
 'Remain silent', 'C'),
-- Row 2
('LANGUAGE DEVELOPMENT', 'For 4-6 month old girls, which tip is recommended?', 
 'Speak monotonously', 
 'Use varied tones and facial expressions when speaking', 
 'Avoid facial expressions', 
 'Use only one tone', 'B'),
-- Row 3
('LANGUAGE DEVELOPMENT', 'For 4-6 month old boys, what is suggested?', 
 'Avoid any speech', 
 'Engage in interactive play that includes simple words and sounds', 
 'Only sing without words', 
 'Use complex sentences', 'B'),
-- Row 4
('LANGUAGE DEVELOPMENT', 'For 7-9 month olds, what helps language development?', 
 'Introduce new vocabulary with picture books and songs', 
 'Avoid any interaction', 
 'Only show pictures without speaking', 
 'Keep language repetitive', 'A'),
-- Row 5
('LANGUAGE DEVELOPMENT', 'For 10-12 month olds (girls), what is recommended?', 
 'Use complex questions', 
 'Interrupt the baby constantly', 
 'Encourage simple conversation by asking questions and waiting for responses', 
 'Avoid conversation', 'C'),
-- Row 6
('LANGUAGE DEVELOPMENT', 'For 10-12 month olds (boys), which tip is advised?', 
 'Use only one-word commands', 
 'Play interactive games like peek-a-boo to stimulate communication', 
 'Keep the baby isolated', 
 'Avoid games', 'B'),
-- Row 7
('LANGUAGE DEVELOPMENT', 'For 13-15 month olds, what is a suggested tip?', 
 'Build language skills with storytime sessions and interactive reading', 
 'Avoid reading', 
 'Use only visual aids', 
 'Skip storytime', 'A'),
-- Row 8
('LANGUAGE DEVELOPMENT', 'For 16-18 month olds, what is recommended?', 
 'Keep interactions minimal', 
 'Use non-descriptive language', 
 'Avoid daily conversation', 
 'Incorporate descriptive words during daily routines to enhance vocabulary', 'D'),
-- Row 9
('LANGUAGE DEVELOPMENT', 'For 19-24 month olds, which tip is advised?', 
 'Use only complex vocabulary', 
 'Encourage early word formation through fun repetition and music', 
 'Avoid singing', 
 'Ignore repetition', 'B'),
-- Row 10
('LANGUAGE DEVELOPMENT', 'For toddlers 25-30 months, what is a key language development tip?', 
 'Avoid interaction', 
 'Use only gestures', 
 'Expand vocabulary with interactive reading sessions', 
 'Keep language minimal', 'C');




----------------------------
-- Category: EMOTIONAL DEVELOPMENT (10 questions)
INSERT INTO QuizQuestions (category, question_text, option_a, option_b, option_c, option_d, correct_option) VALUES
-- Row 1
('EMOTIONAL DEVELOPMENT', 'For 0-3 month olds, what helps emotional bonding?', 
 'Only interact during feeding', 
 'Avoid eye contact', 
 'Respond to cries promptly and hold often', 
 'Leave them alone often', 'C'),
-- Row 2
('EMOTIONAL DEVELOPMENT', 'How to support 4-6 month old girls emotionally?', 
 'Ignore crying', 
 'Talk, smile, and comfort when they cry', 
 'Keep them isolated', 
 'Avoid emotional expressions', 'B'),
-- Row 3
('EMOTIONAL DEVELOPMENT', 'What is helpful for 7-9 month old boys?', 
 'Change routines daily', 
 'Avoid cuddles', 
 'Maintain consistent routines to create a sense of security', 
 'Minimize touch', 'C'),
-- Row 4
('EMOTIONAL DEVELOPMENT', 'For 10-12 month olds, what’s a useful practice?', 
 'Encourage social play with familiar adults', 
 'Avoid smiles', 
 'Keep the baby away from people', 
 'Speak with a flat tone', 'A'),
-- Row 5
('EMOTIONAL DEVELOPMENT', 'What’s a key tip for 13-15 month olds?', 
 'Punish all expressions', 
 'Avoid naming emotions', 
 'Name their emotions and comfort when upset', 
 'Ignore tantrums', 'C'),
-- Row 6
('EMOTIONAL DEVELOPMENT', 'For 16-18 month olds, how can you help emotionally?', 
 'Criticize crying', 
 'Validate their feelings and offer comfort', 
 'Avoid discussing feelings', 
 'Use strict punishment for emotions', 'B'),
-- Row 7
('EMOTIONAL DEVELOPMENT', 'What’s an emotional support tip for 19-24 month olds?', 
 'Enforce one way only', 
 'Allow choices to build autonomy and reduce frustration', 
 'Never give choices', 
 'Ignore their opinions', 'B'),
-- Row 8
('EMOTIONAL DEVELOPMENT', 'For 25-30 month olds, what helps?', 
 'Tell them emotions are wrong', 
 'Acknowledge emotions and guide through calming techniques', 
 'Avoid conversations', 
 'Ignore tantrums', 'B'),
-- Row 9
('EMOTIONAL DEVELOPMENT', 'How to support 31-36 month old toddlers?', 
 'React angrily to crying', 
 'Help label emotions and offer coping strategies', 
 'Discourage emotional words', 
 'Avoid emotional support', 'B'),
-- Row 10
('EMOTIONAL DEVELOPMENT', 'What emotional development activity suits 37-48 month olds?', 
 'Avoid pretend play', 
 'Limit interaction time', 
 'Role-play different emotions and how to respond', 
 'Hide all emotions', 'C');


-- ALTER TABLE baby to add height and DOB column if not exists
ALTER TABLE public.baby 
  ADD COLUMN IF NOT EXISTS height numeric,  -- height in centimeters 
  ADD COLUMN IF NOT EXISTS birthdate date;  -- date of birth


ALTER TABLE journalentry 
ADD COLUMN tags TEXT[] DEFAULT '{}';

-- Add index for tag searching. The index would make the following queries much faster:
-- Find all entries with a specific tag:
--         SELECT * FROM journalentry WHERE tags @> ARRAY['work'];
-- Find entries with any of these tags:
--         SELECT * FROM journalentry WHERE tags && ARRAY['personal', 'health'];
CREATE INDEX idx_journalentry_tags ON journalentry USING GIN (tags); 