CREATE TABLE portfolio_project_engagements (
  project_id TEXT PRIMARY KEY REFERENCES portfolio_projects(project_id) ON DELETE CASCADE,
  data JSONB NOT NULL CHECK (jsonb_typeof(data) = 'object'),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT project_engagements_have_records CHECK (data ? 'aep' AND data ? 'bizapps'),
  CONSTRAINT project_engagements_match_status CHECK (
    data->>'matchStatus' IN ('not-checked', 'matched', 'mismatch', 'access-needed', 'follow-up')
  )
);