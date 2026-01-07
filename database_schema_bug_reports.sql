-- BUG REPORTS TABLE
-- For test phase feedback collection from GLs

CREATE TABLE IF NOT EXISTS bug_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gebietsleiter_id UUID REFERENCES gebietsleiter(id) ON DELETE SET NULL,
    gebietsleiter_name VARCHAR(255), -- Store name in case GL is deleted
    description TEXT NOT NULL,
    screenshot_url TEXT, -- URL to uploaded screenshot
    page_url TEXT, -- Current page URL when bug was reported
    user_agent TEXT, -- Browser/device info
    status VARCHAR(20) DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'fixed', 'wont_fix')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_bug_reports_status ON bug_reports(status);
CREATE INDEX IF NOT EXISTS idx_bug_reports_created_at ON bug_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bug_reports_gl ON bug_reports(gebietsleiter_id);

-- Enable RLS
ALTER TABLE bug_reports ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "GLs can insert bug reports" ON bug_reports;
CREATE POLICY "GLs can insert bug reports" ON bug_reports
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "GLs can view own bug reports" ON bug_reports;
CREATE POLICY "GLs can view own bug reports" ON bug_reports
    FOR SELECT USING (auth.uid() = gebietsleiter_id);

DROP POLICY IF EXISTS "Service role has full access to bug reports" ON bug_reports;
CREATE POLICY "Service role has full access to bug reports" ON bug_reports
    FOR ALL USING (true);

-- Function to update updated_at
CREATE OR REPLACE FUNCTION update_bug_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS bug_reports_updated_at ON bug_reports;
CREATE TRIGGER bug_reports_updated_at
    BEFORE UPDATE ON bug_reports
    FOR EACH ROW
    EXECUTE FUNCTION update_bug_reports_updated_at();
