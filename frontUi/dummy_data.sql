-- ============================================================
-- Raqeeb Dummy Data — run after schema.sql
-- ============================================================

-- ============================================================
-- 1. espData — fake WiFi detections
-- ============================================================
insert into public."espData" (anchor_id, ssid, rssi, block_number, mac, note, status) values
  ('anchor-1', 'iPhone_of_Ahmed',    -45, 1, 'aa:bb:cc:dd:ee:01', null,                 'active'),
  ('anchor-1', 'Galaxy_S22_Khalid',  -62, 1, 'aa:bb:cc:dd:ee:02', 'Seen near door',     'flagged'),
  ('anchor-2', 'RedmiNote_Fatima',   -71, 2, 'aa:bb:cc:dd:ee:03', null,                 'active'),
  ('anchor-2', 'LAPTOP-7F3A',        -38, 2, 'aa:bb:cc:dd:ee:04', 'Student laptop',     'resolved'),
  ('anchor-3', 'iPhone_Sara',        -55, 3, 'aa:bb:cc:dd:ee:05', null,                 'active'),
  ('anchor-3', 'AndroidAP_Unknown',  -80, 3, 'aa:bb:cc:dd:ee:06', 'Unknown hotspot',    'flagged'),
  ('anchor-4', 'OnePlus_Omar',       -49, 4, 'aa:bb:cc:dd:ee:07', null,                 'active'),
  ('anchor-4', 'HUAWEI-P40',         -66, 5, 'aa:bb:cc:dd:ee:08', null,                 'active'),
  ('anchor-5', 'iPhone_Nora',        -43, 6, 'aa:bb:cc:dd:ee:09', 'Checked — OK',       'resolved'),
  ('anchor-5', 'Samsung_Tablet',     -77, 7, 'aa:bb:cc:dd:ee:10', null,                 'active'),
  ('anchor-6', 'ASUS_Laptop_Ali',    -52, 8, 'aa:bb:cc:dd:ee:11', null,                 'active'),
  ('anchor-6', 'UnknownDevice_03',   -88, 9, 'aa:bb:cc:dd:ee:12', 'Suspicious device',  'flagged');

-- ============================================================
-- 2. whitelist — trusted MAC addresses
-- ============================================================
insert into public.whitelist (mac) values
  ('aa:bb:cc:dd:ee:04'),   -- LAPTOP-7F3A (teacher laptop)
  ('aa:bb:cc:dd:ee:09'),   -- iPhone_Nora  (staff phone)
  ('11:22:33:44:55:66'),   -- some other trusted device
  ('de:ad:be:ef:00:01');   -- exam room router

-- ============================================================
-- 3. invitations — pending user invitations
-- ============================================================
insert into public.invitations (email, role, used) values
  ('teacher2@school.edu',   'teacher',   false),
  ('assistant1@school.edu', 'assistant', false),
  ('assistant2@school.edu', 'assistant', false),
  ('olduser@school.edu',    'assistant', true);   -- already registered

-- ============================================================
-- 4. user_roles — set YOUR user as teacher
--    Replace the UUID below with your real user UUID from:
--    Supabase Dashboard → Authentication → Users
-- ============================================================
insert into public.user_roles (user_id, role)
values ('00000000-0000-0000-0000-000000000000', 'teacher')
on conflict (user_id) do update set role = 'teacher';

-- ============================================================
-- 5. comments — comments on detections
--    Uses a placeholder author UUID — replace if needed
-- ============================================================
insert into public.comments (detection_mac, author_id, author_email, content) values
  ('aa:bb:cc:dd:ee:02', '00000000-0000-0000-0000-000000000000', 'teacher@school.edu', 'Flagged — spotted near the exit door during exam.'),
  ('aa:bb:cc:dd:ee:02', '00000000-0000-0000-0000-000000000000', 'teacher@school.edu', 'Asked student to put phone away.'),
  ('aa:bb:cc:dd:ee:06', '00000000-0000-0000-0000-000000000000', 'teacher@school.edu', 'Unknown hotspot — could be tethering device.'),
  ('aa:bb:cc:dd:ee:12', '00000000-0000-0000-0000-000000000000', 'teacher@school.edu', 'Investigate before next session.');
