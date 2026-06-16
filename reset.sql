-- =========================
-- AUTH / USER DATA
-- =========================

-- TRUNCATE TABLE users RESTART IDENTITY CASCADE;



-- =========================
-- SESSION DATA
-- =========================

TRUNCATE TABLE test_sessions CASCADE;

-- =========================
-- ENERGY TEST
-- =========================

TRUNCATE TABLE energy_group_responses CASCADE;
TRUNCATE TABLE energy_statement_rankings CASCADE;

TRUNCATE TABLE energy_results CASCADE;
TRUNCATE TABLE energy_result_eligible_centers CASCADE;

-- =========================
-- PERSONALITY TEST
-- =========================

TRUNCATE TABLE personality_sessions CASCADE;
TRUNCATE TABLE personality_responses CASCADE;
TRUNCATE TABLE personality_result_breakdowns CASCADE;

TRUNCATE TABLE final_personality_results CASCADE;

DELETE FROM user_login_history

COMMIT;