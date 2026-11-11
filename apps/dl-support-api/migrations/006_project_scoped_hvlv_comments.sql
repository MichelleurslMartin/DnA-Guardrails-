ALTER TABLE hvlv_reconciliation_comments
  ADD COLUMN project_id TEXT NOT NULL DEFAULT '' CHECK (length(project_id) <= 200);

ALTER TABLE hvlv_reconciliation_comments
  DROP CONSTRAINT hvlv_reconciliation_comments_pkey;

ALTER TABLE hvlv_reconciliation_comments
  ADD PRIMARY KEY (project_id, pay_period_start, pay_period_end, enterprise_id, cost_collector_id);