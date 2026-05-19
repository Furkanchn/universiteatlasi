ALTER TABLE nearby_places
    ADD COLUMN subtype VARCHAR(40);

CREATE INDEX idx_nearby_places_subtype
    ON nearby_places(university_id, category, subtype);
