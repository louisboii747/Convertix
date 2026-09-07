begin;
create extension if not exists pgtap with schema extensions;
select plan(16);

select ok((select relrowsecurity from pg_class where oid = 'public.profiles'::regclass), 'profiles enables RLS');
select ok((select relrowsecurity from pg_class where oid = 'public.conversion_history'::regclass), 'history enables RLS');
select ok(not has_table_privilege('anon', 'public.profiles', 'TRUNCATE'), 'anon cannot truncate profiles');
select ok(not has_table_privilege('authenticated', 'public.profiles', 'TRUNCATE'), 'authenticated cannot truncate profiles');
select ok(not has_table_privilege('anon', 'public.conversion_history', 'SELECT'), 'anon cannot read history');
select ok(not has_table_privilege('authenticated', 'public.conversion_history', 'TRUNCATE'), 'authenticated cannot truncate history');
select ok(not has_column_privilege('authenticated', 'public.profiles', 'created_at', 'UPDATE'), 'member since is not user-editable');
select ok(not has_column_privilege('authenticated', 'public.profiles', 'id', 'UPDATE'), 'profile ownership is not user-editable');
select ok(not has_function_privilege('anon', 'public.account_conversion_summary()', 'EXECUTE'), 'anonymous cannot execute summary');
select ok(not (select prosecdef from pg_proc where oid = 'public.account_conversion_summary()'::regprocedure), 'summary respects invoker RLS');
select ok(not has_function_privilege('authenticated', 'public.handle_new_user()', 'EXECUTE'), 'signup trigger is not a public RPC');

insert into auth.users (id, email, raw_user_meta_data) values
 ('11111111-aaaa-4111-8111-111111111111', 'account-v2-sql-one@example.test', '{"display_name":"SQL One"}'),
 ('22222222-aaaa-4222-8222-222222222222', 'account-v2-sql-two@example.test', '{"display_name":"SQL Two"}');
insert into public.conversion_history (user_id, conversion_id, original_filename, source_format, target_format, status) values
 ('11111111-aaaa-4111-8111-111111111111', gen_random_uuid(), 'one.docx', 'docx', 'pdf', 'completed'),
 ('22222222-aaaa-4222-8222-222222222222', gen_random_uuid(), 'two.docx', 'docx', 'pdf', 'completed');

set local role authenticated;
select set_config('request.jwt.claim.sub', '11111111-aaaa-4111-8111-111111111111', true);
select is((select count(*) from public.profiles), 1::bigint, 'only own profile is visible');
select is((select count(*) from public.conversion_history), 1::bigint, 'only own history is visible');
select is((public.account_conversion_summary()->>'total')::bigint, 1::bigint, 'summary counts only own history');
reset role;
delete from auth.users where id = '11111111-aaaa-4111-8111-111111111111';
select is((select count(*) from public.profiles where id='11111111-aaaa-4111-8111-111111111111'), 0::bigint, 'Auth deletion cascades to profile');
select is((select count(*) from public.conversion_history where user_id='11111111-aaaa-4111-8111-111111111111'), 0::bigint, 'Auth deletion cascades to history');
select * from finish();
rollback;
