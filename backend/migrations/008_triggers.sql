-- Shared updated_at trigger across all mutable tables (idempotent).
create or replace function set_updated_at() returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

do $$
declare t text;
begin
    foreach t in array array['users','systems','phases','roadmap_items','doc_pages']
    loop
        execute format('drop trigger if exists trg_set_updated_at on %I', t);
        execute format(
            'create trigger trg_set_updated_at before update on %I '
            'for each row execute function set_updated_at()', t);
    end loop;
end $$;
