-- This script adds subscription tier related columns to the public.organizations table.
-- These columns will define limits and features available to each organization based on their subscription.

-- Add subscription_tier column
-- Stores the name of the subscription tier (e.g., 'Free', 'Basic', 'Premium').
-- Defaults to 'Free' for new organizations.
ALTER TABLE public.organizations
ADD COLUMN subscription_tier VARCHAR(50) NOT NULL DEFAULT 'Free';

-- Add book_limit column
-- Defines the maximum number of books an organization can manage.
-- A value of -1 can represent an unlimited number of books.
-- Defaults to 100 for the 'Free' tier.
ALTER TABLE public.organizations
ADD COLUMN book_limit INTEGER NOT NULL DEFAULT 100;

-- Add user_limit column
-- Defines the maximum number of users an organization can have.
-- A value of -1 can represent an unlimited number of users.
-- Defaults to 3 for the 'Free' tier.
ALTER TABLE public.organizations
ADD COLUMN user_limit INTEGER NOT NULL DEFAULT 3;

-- Comments explaining the new columns:
COMMENT ON COLUMN public.organizations.subscription_tier IS 'Name of the subscription tier (e.g., Free, Basic, Premium). Determines feature access and limits.';
COMMENT ON COLUMN public.organizations.book_limit IS 'Maximum number of books allowed for this organization. -1 indicates unlimited.';
COMMENT ON COLUMN public.organizations.user_limit IS 'Maximum number of users allowed for this organization. -1 indicates unlimited.';

-- Note:
-- If this script needs to be re-runnable without erroring if columns exist (idempotency for ADD COLUMN),
-- you would typically use `ADD COLUMN IF NOT EXISTS`. However, standard SQL `ADD COLUMN`
-- will error if the column already exists, which prevents accidental re-application.
-- For a formal migration system, this script would be version-controlled and run once.

-- Example UPDATE statements for existing organizations (run manually if needed):
-- UPDATE public.organizations SET subscription_tier = 'Basic', book_limit = 1000, user_limit = 10 WHERE id = <some_id>;
-- UPDATE public.organizations SET subscription_tier = 'Premium', book_limit = -1, user_limit = -1 WHERE id = <another_id>;
