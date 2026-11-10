CREATE TABLE hvlv_reconciliation_comments (
  pay_period_start DATE NOT NULL,
  pay_period_end DATE NOT NULL,
  enterprise_id TEXT NOT NULL CHECK (length(trim(enterprise_id)) > 0),
  cost_collector_id TEXT NOT NULL DEFAULT '',
  comment TEXT NOT NULL CHECK (length(comment) <= 4000),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (pay_period_start, pay_period_end, enterprise_id, cost_collector_id),
  CHECK (pay_period_end >= pay_period_start)
);