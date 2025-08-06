-- Create the pockets table
CREATE TABLE IF NOT EXISTS public.pockets (
    id bigint NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    user_id uuid NOT NULL,
    name text NOT NULL,
    balance numeric NOT NULL DEFAULT 0,
    icon text,
    color text,
    is_default boolean NOT NULL DEFAULT false
);

ALTER TABLE public.pockets OWNER TO postgres;

CREATE SEQUENCE IF NOT EXISTS public.pockets_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER TABLE public.pockets_id_seq OWNER TO postgres;

ALTER SEQUENCE public.pockets_id_seq OWNED BY public.pockets.id;

ALTER TABLE ONLY public.pockets ALTER COLUMN id SET DEFAULT nextval('public.pockets_id_seq'::regclass);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'pockets_pkey'
    ) THEN
        ALTER TABLE public.pockets ADD CONSTRAINT pockets_pkey PRIMARY KEY (id);
    END IF;
END;
$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'pockets_user_id_fkey'
    ) THEN
        ALTER TABLE public.pockets ADD CONSTRAINT pockets_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END;
$$;


ALTER TABLE public.pockets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all access for users based on user_id" ON public.pockets;
CREATE POLICY "Enable all access for users based on user_id" ON public.pockets FOR ALL USING ((current_user_id() = user_id));

-- Add the pocket_id to the transactions table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'transactions' AND column_name = 'pocket_id'
    ) THEN
        ALTER TABLE public.transactions ADD COLUMN pocket_id bigint;
    END IF;
END;
$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'transactions_pocket_id_fkey'
    ) THEN
        ALTER TABLE public.transactions ADD CONSTRAINT transactions_pocket_id_fkey FOREIGN KEY (pocket_id) REFERENCES public.pockets(id);
    END IF;
END;
$$;