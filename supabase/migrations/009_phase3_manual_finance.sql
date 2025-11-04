-- Phase 3: Manual Finance Tracking
-- Adds financial tracking fields and payout management

-- Update registrations table with finance fields
ALTER TABLE public.registrations
  ADD COLUMN IF NOT EXISTS entry_fee_paid NUMERIC(10, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS collected_by_name TEXT,
  ADD COLUMN IF NOT EXISTS payment_method TEXT CHECK (payment_method IN ('cash', 'upi', 'card', 'bank_transfer', 'other')),
  ADD COLUMN IF NOT EXISTS payment_reference TEXT,
  ADD COLUMN IF NOT EXISTS payment_date TIMESTAMPTZ;

-- Note: payment_status already exists from Phase 1, but ensure it's there
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'registrations' AND column_name = 'payment_status'
  ) THEN
    ALTER TABLE public.registrations 
      ADD COLUMN payment_status TEXT CHECK (payment_status IN ('pending', 'paid', 'refunded')) DEFAULT 'pending';
  END IF;
END $$;

-- Create payouts table
CREATE TABLE IF NOT EXISTS public.payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  organizer_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount NUMERIC(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'paid', 'cancelled')),
  payment_method TEXT CHECK (payment_method IN ('bank_transfer', 'upi', 'cash', 'check', 'other')),
  reference_number TEXT,
  notes TEXT,
  paid_at TIMESTAMPTZ,
  created_by UUID REFERENCES public.profiles(id),
  approved_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_payouts_tournament ON public.payouts(tournament_id);
CREATE INDEX IF NOT EXISTS idx_payouts_organizer ON public.payouts(organizer_profile_id);
CREATE INDEX IF NOT EXISTS idx_payouts_status ON public.payouts(status);
CREATE INDEX IF NOT EXISTS idx_registrations_payment_status ON public.registrations(payment_status);
CREATE INDEX IF NOT EXISTS idx_registrations_payment_method ON public.registrations(payment_method);

-- Updated_at trigger for payouts
CREATE TRIGGER update_payouts_updated_at BEFORE UPDATE ON public.payouts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Payouts

-- Organizers can view their own payouts
CREATE POLICY "Organizers can view their payouts" ON public.payouts
  FOR SELECT USING (auth.uid() = organizer_profile_id);

-- Admins and finance roles can view all payouts
CREATE POLICY "Admins and finance can view payouts" ON public.payouts
  FOR SELECT USING (
    public.is_admin(auth.uid()) OR 
    public.has_role(auth.uid(), 'finance')
  );

-- Organizers can create payout requests for their tournaments
CREATE POLICY "Organizers can create payout requests" ON public.payouts
  FOR INSERT WITH CHECK (
    auth.uid() = organizer_profile_id AND
    EXISTS (SELECT 1 FROM public.tournaments WHERE id = tournament_id AND organizer_id = auth.uid())
  );

-- Only admins and finance can update payouts
CREATE POLICY "Admins and finance can update payouts" ON public.payouts
  FOR UPDATE USING (
    public.is_admin(auth.uid()) OR 
    public.has_role(auth.uid(), 'finance')
  );

-- Function to calculate tournament revenue
CREATE OR REPLACE FUNCTION public.calculate_tournament_revenue(tournament_uuid UUID)
RETURNS NUMERIC AS $$
DECLARE
  total_revenue NUMERIC;
BEGIN
  SELECT COALESCE(SUM(
    CASE 
      WHEN r.payment_status = 'paid' THEN COALESCE(r.entry_fee_paid, t.entry_fee)
      ELSE 0 
    END
  ), 0) INTO total_revenue
  FROM public.registrations r
  JOIN public.tournaments t ON t.id = r.tournament_id
  WHERE r.tournament_id = tournament_uuid;
  
  RETURN total_revenue;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get pending payment count
CREATE OR REPLACE FUNCTION public.count_pending_payments(tournament_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  pending_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO pending_count
  FROM public.registrations
  WHERE tournament_id = tournament_uuid
    AND payment_status = 'pending';
  
  RETURN pending_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

