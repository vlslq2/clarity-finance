-- Create the pockets table
CREATE TABLE public.pockets (
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

CREATE SEQUENCE public.pockets_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER TABLE public.pockets_id_seq OWNER TO postgres;

ALTER SEQUENCE public.pockets_id_seq OWNED BY public.pockets.id;

ALTER TABLE ONLY public.pockets ALTER COLUMN id SET DEFAULT nextval('public.pockets_id_seq'::regclass);

ALTER TABLE ONLY public.pockets
    ADD CONSTRAINT pockets_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.pockets
    ADD CONSTRAINT pockets_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.pockets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all access for users based on user_id" ON public.pockets FOR ALL USING ((auth.uid() = user_id));

-- Add the pocket_id to the transactions table
ALTER TABLE public.transactions
    ADD COLUMN pocket_id bigint;

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_pocket_id_fkey FOREIGN KEY (pocket_id) REFERENCES public.pockets(id);