CREATE TABLE portfolio_projects (
  project_id TEXT PRIMARY KEY,
  project_name TEXT NOT NULL CHECK (length(trim(project_name)) > 0),
  client_name TEXT NOT NULL DEFAULT '',
  source_links JSONB NOT NULL CHECK (jsonb_typeof(source_links) = 'object'),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT portfolio_projects_has_all_source_links CHECK (
    source_links ?& ARRAY['mme', 'dna', 'aep', 'sharepoint', 'myWizzard', 'hvlv']
  )
);

CREATE INDEX portfolio_projects_updated_at_idx ON portfolio_projects (updated_at DESC);