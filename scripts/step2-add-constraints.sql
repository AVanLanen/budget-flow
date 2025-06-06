-- Step 2: Add constraints and checks
ALTER TABLE accounts ADD CONSTRAINT accounts_type_check 
CHECK (type IN ('checking', 'savings', 'credit', 'investment', 'loan'));

ALTER TABLE scenarios ADD CONSTRAINT scenarios_type_check 
CHECK (type IN ('investment', 'loan'));

-- Add foreign key constraints
ALTER TABLE users ADD CONSTRAINT users_id_fkey 
FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE accounts ADD CONSTRAINT accounts_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE transactions ADD CONSTRAINT transactions_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE transactions ADD CONSTRAINT transactions_account_id_fkey 
FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE;

ALTER TABLE scenarios ADD CONSTRAINT scenarios_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
