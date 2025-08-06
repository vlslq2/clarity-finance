DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'pockets' AND column_name = 'icon' AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.pockets ADD COLUMN icon text;
    END IF;
END;
$$;