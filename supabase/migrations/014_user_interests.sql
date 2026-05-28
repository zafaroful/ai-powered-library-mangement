-- User reading interests for personalized recommendations
alter table users add column if not exists interests text[] default '{}';

comment on column users.interests is 'Preferred book categories/topics for recommendations';
