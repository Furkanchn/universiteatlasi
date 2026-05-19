CREATE TABLE university_locations (
    id              BIGSERIAL PRIMARY KEY,
    university_id   BIGINT NOT NULL UNIQUE REFERENCES universitetler(id) ON DELETE CASCADE,
    latitude        NUMERIC(10,7) NOT NULL,
    longitude       NUMERIC(10,7) NOT NULL,
    source          VARCHAR(100) NOT NULL,
    source_date     DATE NOT NULL,
    confidence      VARCHAR(30) NOT NULL DEFAULT 'PILOT',
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE nearby_places (
    id                BIGSERIAL PRIMARY KEY,
    university_id     BIGINT NOT NULL REFERENCES universitetler(id) ON DELETE CASCADE,
    name              VARCHAR(255) NOT NULL,
    category          VARCHAR(30) NOT NULL,
    latitude          NUMERIC(10,7) NOT NULL,
    longitude         NUMERIC(10,7) NOT NULL,
    distance_meters   INTEGER NOT NULL,
    source            VARCHAR(100) NOT NULL,
    source_date       DATE NOT NULL,
    external_id       VARCHAR(80),
    created_at        TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT nearby_places_category_check
        CHECK (category IN ('cafe', 'food', 'dormitory', 'market', 'transport', 'library'))
);

CREATE INDEX idx_nearby_places_university ON nearby_places(university_id);
CREATE INDEX idx_nearby_places_category ON nearby_places(category);
CREATE INDEX idx_nearby_places_distance ON nearby_places(university_id, category, distance_meters);
CREATE UNIQUE INDEX uq_nearby_place_source
    ON nearby_places(university_id, source, external_id)
    WHERE external_id IS NOT NULL;
