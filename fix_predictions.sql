-- ==========================================
-- إصلاح خطأ (column "updated_at" of relation "predictions" does not exist)
-- انسخ هذا الكود وقم بتشغيله في SQL Editor في Supabase
-- ==========================================

-- Add updated_at column if it does not exist
ALTER TABLE IF EXISTS public.predictions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE IF EXISTS public.users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE OR REPLACE FUNCTION public.evaluate_match_predictions(p_match_id UUID)
RETURNS void AS $$
DECLARE
  v_match_result TEXT;
  v_home_score INTEGER;
  v_away_score INTEGER;
  v_actual_penalty TEXT;
  v_actual_red_card TEXT;
  v_processed_count INTEGER;
  v_pts_winner INTEGER;
  v_pts_score INTEGER;
  v_pts_penalty INTEGER;
  v_pts_red_card INTEGER;
  v_pts_max INTEGER;
BEGIN
  -- Get match result and settings
  SELECT home_score, away_score, actual_penalty, actual_red_card, actual_winner 
  INTO v_home_score, v_away_score, v_actual_penalty, v_actual_red_card, v_match_result
  FROM public.matches WHERE id = p_match_id AND status = 'finished';

  IF v_home_score IS NULL OR v_away_score IS NULL THEN
    RETURN; -- Match not finished or missing score
  END IF;

  -- Determine match winner if not explicitly set
  IF v_match_result IS NULL OR v_match_result = '' THEN
    IF v_home_score > v_away_score THEN
      v_match_result := 'home';
    ELSIF v_away_score > v_home_score THEN
      v_match_result := 'away';
    ELSE
      v_match_result := 'draw';
    END IF;
  END IF;

  -- Get point settings
  SELECT correct_winner_points, correct_score_points, correct_penalty_points, correct_red_card_points, max_points_per_match
  INTO v_pts_winner, v_pts_score, v_pts_penalty, v_pts_red_card, v_pts_max
  FROM public.settings WHERE id = 1;

  -- Default values if settings not found
  v_pts_winner := COALESCE(v_pts_winner, 2);
  v_pts_score := COALESCE(v_pts_score, 3);
  v_pts_penalty := COALESCE(v_pts_penalty, 1);
  v_pts_red_card := COALESCE(v_pts_red_card, 1);
  v_pts_max := COALESCE(v_pts_max, 7);

  -- Ensure penalty and red card results are properly handled
  v_actual_penalty := COALESCE(v_actual_penalty, 'none');
  v_actual_red_card := COALESCE(v_actual_red_card, 'none');

  -- Update predictions for this match 
  WITH updated_predictions AS (
    UPDATE public.predictions
    SET points_earned = LEAST(
      v_pts_max,
      (CASE WHEN winner_prediction = v_match_result THEN v_pts_winner ELSE 0 END) +
      (CASE WHEN home_score = v_home_score AND away_score = v_away_score THEN v_pts_score ELSE 0 END) +
      (CASE WHEN v_actual_penalty != 'none' AND penalty_prediction = v_actual_penalty THEN v_pts_penalty ELSE 0 END) +
      (CASE WHEN v_actual_red_card != 'none' AND red_card_prediction = v_actual_red_card THEN v_pts_red_card ELSE 0 END)
    ),
    updated_at = NOW()
    WHERE match_id = p_match_id
    RETURNING id
  )
  SELECT count(*) INTO v_processed_count FROM updated_predictions;

  -- Update total points and statistics for all users (INCLUDING PREVIOUS POINTS)
  UPDATE public.users u
  SET 
    played_predictions = GREATEST(COALESCE(u.previous_predictions, 0), CEIL(COALESCE(u.previous_points, 0) / 2.0)::INTEGER) + (
      SELECT COUNT(p.id)
      FROM public.predictions p
      JOIN public.matches m ON p.match_id = m.id
      WHERE p.user_id = u.id AND m.status = 'finished'
    ),
    total_points = COALESCE(u.previous_points, 0) + (
      SELECT COALESCE(SUM(p.points_earned), 0)
      FROM public.predictions p
      WHERE p.user_id = u.id
    ),
    successful_predictions = LEAST(GREATEST(COALESCE(u.previous_predictions, 0), CEIL(COALESCE(u.previous_points, 0) / 2.0)::INTEGER), CEIL(COALESCE(u.previous_points, 0) / 3.0)::INTEGER) + (
      SELECT COUNT(p.id)
      FROM public.predictions p
      JOIN public.matches m ON p.match_id = m.id
      WHERE p.user_id = u.id AND m.status = 'finished' AND p.points_earned > 0
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
    ),
    updated_at = NOW()
  WHERE u.id IS NOT NULL;

  -- Update ranks
  WITH ranked_users AS (
    SELECT id, RANK() OVER (ORDER BY total_points DESC, exact_scores DESC, correct_winners DESC, username ASC) as user_rank
    FROM public.users
  )
  UPDATE public.users u
  SET rank = r.user_rank
  FROM ranked_users r
  WHERE u.id = r.id;

  -- Insert evaluation log
  INSERT INTO public.evaluation_logs (match_id, predictions_processed, details)
  VALUES (p_match_id, v_processed_count, 'Match evaluated successfully. Winner: ' || v_match_result || ', Score: ' || v_home_score || '-' || v_away_score || ', Penalty: ' || v_actual_penalty || ', Red Card: ' || v_actual_red_card);

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
