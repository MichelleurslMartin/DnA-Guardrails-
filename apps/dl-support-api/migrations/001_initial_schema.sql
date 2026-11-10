CREATE TABLE workbench_engagements (
  singleton BOOLEAN PRIMARY KEY DEFAULT TRUE CHECK (singleton),
  data JSONB NOT NULL,
  CONSTRAINT engagements_data_is_object CHECK (jsonb_typeof(data) = 'object'),
  CONSTRAINT engagements_has_records CHECK (data ? 'aep' AND data ? 'bizapps'),
  CONSTRAINT engagements_match_status CHECK (
    data->>'matchStatus' IN ('not-checked', 'matched', 'mismatch', 'access-needed', 'follow-up')
  )
);

CREATE TABLE work_items (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL CHECK (length(trim(title)) > 0),
  category TEXT NOT NULL CHECK (category IN ('checklist', 'action', 'raid', 'decision', 'change')),
  stage TEXT NOT NULL DEFAULT '' CHECK (stage IN ('', 'Mobilize', 'Plan and Analyze', 'Execute Delivery', 'Prepare for Phase Transition', 'Recover/Escalate', 'Close/Handover')),
  status TEXT NOT NULL CHECK (status IN ('not-started', 'in-progress', 'blocked', 'complete')),
  owner TEXT NOT NULL DEFAULT '',
  due_date DATE,
  evidence TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX work_items_updated_at_idx ON work_items (updated_at DESC);

CREATE TABLE workbench_preferences (
  singleton BOOLEAN PRIMARY KEY DEFAULT TRUE CHECK (singleton),
  theme TEXT NOT NULL CHECK (theme IN ('light', 'dark', 'system'))
);