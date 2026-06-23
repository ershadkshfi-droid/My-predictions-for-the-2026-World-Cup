-- /supabase_schema.sql

-- 1. Modify Users Table (Adding Statistics Columns)
ALTER TABLE IF EXISTS public.users ADD COLUMN IF NOT EXISTS played_predictions INTEGER DEFAULT 0;
ALTER TABLE IF EXISTS public.users ADD COLUMN IF NOT EXISTS exact_scores INTEGER DEFAULT 0;
ALTER TABLE IF EXISTS public.users ADD COLUMN IF NOT EXISTS correct_winners INTEGER DEFAULT 0;
ALTER TABLE IF EXISTS public.users ADD COLUMN IF NOT EXISTS correct_penalties INTEGER DEFAULT 0;
ALTER TABLE IF EXISTS public.users ADD COLUMN IF NOT EXISTS correct_red_cards INTEGER DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT DEFAULT 'user'::TEXT CHECK (role IN ('user', 'admin')),
  avatar_url TEXT,
  total_points INTEGER DEFAULT 0,
  rank INTEGER,
  played_predictions INTEGER DEFAULT 0,
  exact_scores INTEGER DEFAULT 0,
  correct_winners INTEGER DEFAULT 0,
  correct_penalties INTEGER DEFAULT 0,
  correct_red_cards INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Safely Create Policies using DO block to handle 'already exists'
DO $$ BEGIN
  CREATE POLICY "Users can view all users" ON public.users FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update their own profile" ON public.users FOR UPDATE USING (auth.uid() = id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 2. Modify Matches Table
ALTER TABLE IF EXISTS public.matches ADD COLUMN IF NOT EXISTS actual_penalty TEXT DEFAULT 'none';
ALTER TABLE IF EXISTS public.matches ADD COLUMN IF NOT EXISTS actual_red_card TEXT DEFAULT 'none';
ALTER TABLE IF EXISTS public.matches ADD COLUMN IF NOT EXISTS actual_winner TEXT DEFAULT 'draw';

CREATE TABLE IF NOT EXISTS public.matches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  stage TEXT NOT NULL,
  home_team TEXT NOT NULL,
  away_team TEXT NOT NULL,
  match_date TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'scheduled'::TEXT,
  home_score INTEGER,
  away_score INTEGER,
  actual_penalty TEXT DEFAULT 'none',
  actual_red_card TEXT DEFAULT 'none',
  actual_winner TEXT DEFAULT 'draw',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for matches
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Anyone can view matches" ON public.matches FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "Only admins can modify matches" ON public.matches FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin')
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 3. Create Predictions Table
CREATE TABLE IF NOT EXISTS public.predictions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) NOT NULL,
  match_id UUID REFERENCES public.matches(id) NOT NULL,
  winner_prediction TEXT NOT NULL,
  home_score INTEGER NOT NULL,
  away_score INTEGER NOT NULL,
  penalty_prediction TEXT NOT NULL,
  red_card_prediction TEXT DEFAULT 'none',
  points_earned INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, match_id)
);

ALTER TABLE IF EXISTS public.predictions ADD COLUMN IF NOT EXISTS red_card_prediction TEXT DEFAULT 'none';

ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users can view all predictions" ON public.predictions FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can insert their own predictions" ON public.predictions FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update their own predictions" ON public.predictions FOR UPDATE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 4. Create Evaluation Logs Table (حفظ السجلات)
CREATE TABLE IF NOT EXISTS public.evaluation_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id UUID REFERENCES public.matches(id),
  evaluated_at TIMESTAMPTZ DEFAULT NOW(),
  predictions_processed INTEGER DEFAULT 0,
  details TEXT
);

ALTER TABLE public.evaluation_logs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Admins can view logs" ON public.evaluation_logs FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin')
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;


-- 5. Trigger for new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, username, email, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    new.email,
    CASE WHEN new.email = 'ershadkshfi@gmail.com' THEN 'admin' ELSE 'user' END
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- 6. Prediction Evaluation Engine

CREATE OR REPLACE FUNCTION public.evaluate_match_predictions(p_match_id UUID)
RETURNS void AS $$
DECLARE
  v_home_score INTEGER;
  v_away_score INTEGER;
  v_actual_penalty TEXT;
  v_actual_red_card TEXT;
  v_actual_winner TEXT;
  v_status TEXT;
  v_match_result TEXT; -- 'home', 'away', 'draw'
  v_processed_count INTEGER;
BEGIN
  -- Get match details
  SELECT home_score, away_score, actual_penalty, actual_red_card, actual_winner, status 
  INTO v_home_score, v_away_score, v_actual_penalty, v_actual_red_card, v_actual_winner, v_status
  FROM public.matches
  WHERE id = p_match_id;

  -- Only evaluate if match is finished and scores are set
  IF v_status = 'finished' AND v_home_score IS NOT NULL AND v_away_score IS NOT NULL THEN
    
    -- Determine actual match result
    IF v_actual_winner IS NOT NULL AND v_actual_winner != '' THEN
      v_match_result := v_actual_winner;
    ELSIF v_home_score > v_away_score THEN
      v_match_result := 'home';
    ELSIF v_home_score < v_away_score THEN
      v_match_result := 'away';
    ELSE
      v_match_result := 'draw';
    END IF;

    -- Update predictions for this match 
    -- Points: 3 for exact score, 2 for exactly correct winner_prediction, 1 for correct penalty_prediction (if actual != 'none')
    WITH updated_predictions AS (
      UPDATE public.predictions
      SET points_earned = (
        CASE
          WHEN home_score = v_home_score AND away_score = v_away_score THEN 3
          ELSE 0
        END
        +
        CASE
          WHEN winner_prediction = v_match_result THEN 2
          ELSE 0
        END
        +
        CASE
          WHEN v_actual_penalty != 'none' AND penalty_prediction = v_actual_penalty THEN 1
          ELSE 0
        END
        +
        CASE
          WHEN v_actual_red_card != 'none' AND red_card_prediction = v_actual_red_card THEN 1
          ELSE 0
        END
      )
      WHERE match_id = p_match_id
      RETURNING id
    )
    SELECT count(*) INTO v_processed_count FROM updated_predictions;

    -- Update total points and statistics for all users
    UPDATE public.users u
    SET 
      played_predictions = (
        SELECT COUNT(p.id)
        FROM public.predictions p
        JOIN public.matches m ON p.match_id = m.id
        WHERE p.user_id = u.id AND m.status = 'finished'
      ),
      total_points = (
        SELECT COALESCE(SUM(p.points_earned), 0)
        FROM public.predictions p
        WHERE p.user_id = u.id
      ),
      exact_scores = (
        SELECT COUNT(p.id)
        FROM public.predictions p
        JOIN public.matches m ON p.match_id = m.id
        WHERE p.user_id = u.id AND m.status = 'finished' AND p.home_score = m.home_score AND p.away_score = m.away_score
      ),
      correct_winners = (
        SELECT COUNT(p.id)
        FROM public.predictions p
        JOIN public.matches m ON p.match_id = m.id
        WHERE p.user_id = u.id AND m.status = 'finished' AND p.winner_prediction = (
           CASE 
             WHEN m.actual_winner IS NOT NULL AND m.actual_winner != '' THEN m.actual_winner
             WHEN m.home_score > m.away_score THEN 'home'
             WHEN m.home_score < m.away_score THEN 'away'
             ELSE 'draw'
           END
        )
      ),
      correct_penalties = (
        SELECT COUNT(p.id)
        FROM public.predictions p
        JOIN public.matches m ON p.match_id = m.id
        WHERE p.user_id = u.id AND m.status = 'finished' AND m.actual_penalty != 'none' AND p.penalty_prediction = m.actual_penalty
      ),
      correct_red_cards = (
        SELECT COUNT(p.id)
        FROM public.predictions p
        JOIN public.matches m ON p.match_id = m.id
        WHERE p.user_id = u.id AND m.status = 'finished' AND m.actual_red_card != 'none' AND p.red_card_prediction = m.actual_red_card
      );

    -- Update ranks for all users 
    -- (Sort logic: High Score > Most Exact Scores > Most Correct Winners > Signup Date)
    WITH RankedUsers AS (
      SELECT id, DENSE_RANK() OVER (ORDER BY COALESCE(total_points, 0) DESC, exact_scores DESC, correct_winners DESC, created_at ASC) as new_rank
      FROM public.users
    )
    UPDATE public.users u
    SET rank = ru.new_rank
    FROM RankedUsers ru
    WHERE u.id = ru.id;

    -- Insert evaluation log (حفظ السجلات)
    INSERT INTO public.evaluation_logs (match_id, predictions_processed, details)
    VALUES (p_match_id, v_processed_count, 'Match evaluated successfully. Winner: ' || v_match_result || ', Score: ' || v_home_score || '-' || v_away_score || ', Penalty: ' || v_actual_penalty || ', Red Card: ' || v_actual_red_card);

  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to evaluate matches when their status is changed to finished
CREATE OR REPLACE FUNCTION public.trigger_evaluate_match()
RETURNS trigger AS $$
BEGIN
  -- Evaluate if match is set to finished OR if it is already finished and scores are updated
  IF (NEW.status = 'finished' AND OLD.status != 'finished') OR
     (NEW.status = 'finished' AND (NEW.home_score IS DISTINCT FROM OLD.home_score OR NEW.away_score IS DISTINCT FROM OLD.away_score OR NEW.actual_penalty IS DISTINCT FROM OLD.actual_penalty OR NEW.actual_red_card IS DISTINCT FROM OLD.actual_red_card OR NEW.actual_winner IS DISTINCT FROM OLD.actual_winner)) THEN
    PERFORM public.evaluate_match_predictions(NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_match_finished ON public.matches;

CREATE TRIGGER on_match_finished
  AFTER UPDATE ON public.matches
  FOR EACH ROW EXECUTE PROCEDURE public.trigger_evaluate_match();
