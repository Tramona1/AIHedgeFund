-- Test query for user_preferences table
SELECT table_schema, table_name, column_name, data_type
FROM information_schema.columns
WHERE table_name = 'user_preferences';

-- Direct select from user_preferences table
SELECT * FROM user_preferences LIMIT 5; 