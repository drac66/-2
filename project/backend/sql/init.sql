-- Run this in Supabase SQL Editor

create extension if not exists pgcrypto;

create table if not exists couple_messages (
  id uuid primary key default gen_random_uuid(),
  sender text not null,
  content text not null,
  created_at timestamptz not null default now()
);

create table if not exists couple_diary (
  id uuid primary key default gen_random_uuid(),
  author text not null,
  title text not null default '',
  content text not null,
  visibility text not null check (visibility in ('self', 'both')),
  created_at timestamptz not null default now()
);

create table if not exists couple_albums (
  id uuid primary key default gen_random_uuid(),
  owner text not null,
  media_type text not null check (media_type in ('image', 'video')),
  media_url text not null,
  note text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists idx_messages_created_at on couple_messages(created_at desc);
create index if not exists idx_diary_created_at on couple_diary(created_at desc);
create index if not exists idx_albums_created_at on couple_albums(created_at desc);
