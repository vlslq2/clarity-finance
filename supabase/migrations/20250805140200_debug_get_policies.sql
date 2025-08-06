-- This is a temporary debugging function to help identify conflicting RLS policies.
-- It can be safely removed after the issue is resolved.
CREATE OR REPLACE FUNCTION debug_get_policies()
RETURNS TABLE (
    schemaname text,
    tablename text,
    policyname text,
    permissive text,
    roles text[],
    cmd text,
    qual text,
    with_check text
)
LANGUAGE sql
SET search_path = public
AS $$
    SELECT
        n.nspname::text,
        c.relname::text,
        p.polname::text,
        CASE
            WHEN p.polpermissive THEN 'PERMISSIVE'::text
            ELSE 'RESTRICTIVE'::text
        END,
        (SELECT array_agg(r.rolname::text) FROM pg_roles r WHERE r.oid = ANY (p.polroles)),
        p.polcmd::text,
        pg_get_expr(p.polqual, p.polrelid),
        pg_get_expr(p.polwithcheck, p.polrelid)
    FROM pg_policy p
    JOIN pg_class c ON c.oid = p.polrelid
    LEFT JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname IN ('pockets', 'transactions');
$$;