-- ==========================================
-- إصلاح خطأ (UPDATE requires a WHERE clause)
-- شغل هذا الكود في SQL Editor في Supabase
-- ==========================================

CREATE OR REPLACE FUNCTION public.evaluate_match_predictions(p_match_id UUID)
RETURNS void AS $$
DECLARE
  v_home_score INTEGER;
  v_away_score INTEGER;
  v_actual_penalty TEXT;
  v_actual_red_card TEXT;
  v_actual_winner TEXT;
  v_status TEXT;
  v_match_result TEXT;
  v_pts_winner INTEGER;
  v_pts_score INTEGER;
  v_pts_penalty INTEGER;
  v_pts_red_card INTEGER;
  v_pts_max INTEGER;
BEGIN
  SELECT home_score, away_score, actual_penalty, actual_red_card, actual_winner, status 
  INTO v_home_score, v_away_score, v_actual_penalty, v_actual_red_card, v_actual_winner, v_status
  FROM public.matches WHERE id = p_match_id;

  IF v_status = 'finished' AND v_home_score IS NOT NULL AND v_away_score IS NOT NULL THEN
    
    SELECT correct_winner_points, correct_score_points, correct_penalty_points, correct_red_card_points, max_points_per_match
    INTO v_pts_winner, v_pts_score, v_pts_penalty, v_pts_red_card, v_pts_max
    FROM public.settings WHERE id = 1;
    
    IF v_pts_winner IS NULL THEN
      v_pts_winner := 2; v_pts_score := 3; v_pts_penalty := 1; v_pts_red_card := 1; v_pts_max := 7;
    END IF;

    IF v_actual_winner IS NOT NULL AND v_actual_winner != '' THEN
      v_match_result := v_actual_winner;
    ELSIF v_home_score > v_away_score THEN
      v_match_result := 'home';
    ELSIF v_home_score < v_away_score THEN
      v_match_result := 'away';
    ELSE
      v_match_result := 'draw';
    END IF;

    -- Update existing predictions
    UPDATE public.predictions
    SET points_earned = LEAST(v_pts_max, (
      CASE WHEN home_score = v_home_score AND away_score = v_away_score THEN v_pts_score ELSE 0 END +
      CASE WHEN winner_prediction = v_match_result THEN v_pts_winner ELSE 0 END +
      CASE WHEN v_actual_penalty != 'none' AND penalty_prediction = v_actual_penalty THEN v_pts_penalty ELSE 0 END +
      CASE WHEN v_actual_red_card != 'none' AND red_card_prediction = v_actual_red_card THEN v_pts_red_card ELSE 0 END
    ))
    WHERE match_id = p_match_id;

    -- Update user stats
    UPDATE public.users u
    SET 
      played_predictions = (SELECT COUNT(p.id) FROM public.predictions p JOIN public.matches m ON p.match_id = m.id WHERE p.user_id = u.id AND m.status = 'finished'),
      total_points = (SELECT COALESCE(SUM(p.points_earned), 0) FROM public.predictions p WHERE p.user_id = u.id),
      exact_scores = (SELECT COUNT(p.id) FROM public.predictions p JOIN public.matches m ON p.match_id = m.id WHERE p.user_id = u.id AND m.status = 'finished' AND p.home_score = m.home_score AND p.away_score = m.away_score),
      correct_winners = (
        SELECT COUNT(p.id) FROM public.predictions p JOIN public.matches m ON p.match_id = m.id 
        WHERE p.user_id = u.id AND m.status = 'finished' AND p.winner_prediction = (
           CASE WHEN m.actual_winner IS NOT NULL AND m.actual_winner != '' THEN m.actual_winner WHEN m.home_score > m.away_score THEN 'home' WHEN m.home_score < m.away_score THEN 'away' ELSE 'draw' END
        )
      ),
      correct_penalties = (SELECT COUNT(p.id) FROM public.predictions p JOIN public.matches m ON p.match_id = m.id WHERE p.user_id = u.id AND m.status = 'finished' AND m.actual_penalty != 'none' AND p.penalty_prediction = m.actual_penalty),
      correct_red_cards = (SELECT COUNT(p.id) FROM public.predictions p JOIN public.matches m ON p.match_id = m.id WHERE p.user_id = u.id AND m.status = 'finished' AND m.actual_red_card != 'none' AND p.red_card_prediction = m.actual_red_card)
    WHERE u.id IS NOT NULL; -- <<< هذا هو التعديل الضروري

    -- Rank calculation
    WITH RankedUsers AS (
      SELECT id, ROW_NUMBER() OVER (ORDER BY total_points DESC, exact_scores DESC, correct_winners DESC, created_at ASC) as new_rank FROM public.users
    )
    UPDATE public.users u SET rank = ru.new_rank FROM RankedUsers ru WHERE u.id = ru.id;

  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
