-- Action History Table for GL Assignment Tracking
-- This table stores all actions performed by Gebietsleiters (GLs) when assigning, swapping, or removing markets

CREATE TABLE IF NOT EXISTS action_history (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Action Details
  action_type VARCHAR(20) NOT NULL CHECK (action_type IN ('assign', 'swap', 'remove')),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Market Information
  market_id VARCHAR(50) REFERENCES markets(id) ON DELETE CASCADE,
  market_chain VARCHAR(100) NOT NULL,
  market_address TEXT NOT NULL,
  market_postal_code VARCHAR(20),
  market_city VARCHAR(100),
  
  -- GL Information
  target_gl VARCHAR(100) NOT NULL, -- The GL who received/lost the market
  previous_gl VARCHAR(100), -- Only for 'swap' actions - the GL who previously had the market
  
  -- Metadata
  performed_by VARCHAR(100), -- User/Admin who performed the action (for future use)
  notes TEXT, -- Optional notes about the action
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_action_history_timestamp ON action_history(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_action_history_market_id ON action_history(market_id);
CREATE INDEX IF NOT EXISTS idx_action_history_target_gl ON action_history(target_gl);
CREATE INDEX IF NOT EXISTS idx_action_history_action_type ON action_history(action_type);
CREATE INDEX IF NOT EXISTS idx_action_history_created_at ON action_history(created_at DESC);

-- Composite index for filtering by GL and date range
CREATE INDEX IF NOT EXISTS idx_action_history_gl_timestamp ON action_history(target_gl, timestamp DESC);

-- Function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_action_history_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to call the function before each update
CREATE TRIGGER trigger_update_action_history_updated_at
BEFORE UPDATE ON action_history
FOR EACH ROW
EXECUTE FUNCTION update_action_history_updated_at();

-- Add Row Level Security (RLS) policies if needed
ALTER TABLE action_history ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all operations for authenticated users (adjust as needed)
CREATE POLICY "Allow all operations for authenticated users" 
ON action_history 
FOR ALL 
USING (true);

-- Comments for documentation
COMMENT ON TABLE action_history IS 'Stores all GL assignment actions (assign, swap, remove) for auditing and history tracking';
COMMENT ON COLUMN action_history.action_type IS 'Type of action: assign (new GL), swap (change GL), remove (remove GL)';
COMMENT ON COLUMN action_history.target_gl IS 'The Gebietsleiter who received or lost the market';
COMMENT ON COLUMN action_history.previous_gl IS 'For swap actions: the GL who previously had the market';
COMMENT ON COLUMN action_history.performed_by IS 'User/Admin who performed the action (for future auditing)';

