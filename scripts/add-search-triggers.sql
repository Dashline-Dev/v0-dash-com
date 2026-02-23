-- Auto-update search_vector on INSERT/UPDATE for all searchable tables

-- Communities
CREATE OR REPLACE FUNCTION communities_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.location_name, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_communities_search_vector ON communities;
CREATE TRIGGER trg_communities_search_vector
  BEFORE INSERT OR UPDATE OF name, description, location_name
  ON communities FOR EACH ROW
  EXECUTE FUNCTION communities_search_vector_update();

-- Events
CREATE OR REPLACE FUNCTION events_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.location_name, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_events_search_vector ON events;
CREATE TRIGGER trg_events_search_vector
  BEFORE INSERT OR UPDATE OF title, description, location_name
  ON events FOR EACH ROW
  EXECUTE FUNCTION events_search_vector_update();

-- Spaces
CREATE OR REPLACE FUNCTION spaces_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_spaces_search_vector ON spaces;
CREATE TRIGGER trg_spaces_search_vector
  BEFORE INSERT OR UPDATE OF name, description
  ON spaces FOR EACH ROW
  EXECUTE FUNCTION spaces_search_vector_update();

-- Areas
CREATE OR REPLACE FUNCTION areas_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_areas_search_vector ON areas;
CREATE TRIGGER trg_areas_search_vector
  BEFORE INSERT OR UPDATE OF name, description
  ON areas FOR EACH ROW
  EXECUTE FUNCTION areas_search_vector_update();
