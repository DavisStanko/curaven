DO $$
DECLARE
  v_user_id uuid;
  v_username text;
  v_message text;
  v_email text;
BEGIN
  -- Temporary table to hold our data
  CREATE TEMP TABLE IF NOT EXISTS temp_messages (
    username text,
    message text
  ) ON COMMIT DROP;

  INSERT INTO temp_messages (username, message) VALUES
    ('sam_t', 'is the library loud floor actually quiet rn?'),
    ('jess.m', 'anyone in loeb cafe?'),
    ('ryan22', 'why is it so hot in the tunnels today lol'),
    ('mattheww', '2 is delayed again. typical.'),
    ('ashley_', 'is the gym packed?'),
    ('lucas.k', 'just saw a groundhog near res commons'),
    ('emilyy', 'anyone have a charger in nicol?'),
    ('dylan_', 'i’m actually gonna fail this midterm tomorrow'),
    ('sarah.p', 'is roosters still open?'),
    ('nathan', 'anyone doing the comp assignment in herzberg?');

  FOR v_username, v_message IN SELECT username, message FROM temp_messages LOOP
    v_email := v_username || '@example.com';
    
    -- Try to find existing user
    SELECT id INTO v_user_id FROM auth.users WHERE email = v_email;
    
    -- If not found, create new user
    IF v_user_id IS NULL THEN
      INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at
      ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        gen_random_uuid(),
        'authenticated',
        'authenticated',
        v_email,
        '$2a$10$abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMONPQRSTUVWXYZ', -- dummy hash
        now(),
        '{"provider": "email", "providers": ["email"]}',
        jsonb_build_object('username', v_username),
        now(),
        now()
      )
      RETURNING id INTO v_user_id;
    END IF;

    -- Ensure profile exists (in case trigger failed or user existed without profile)
    INSERT INTO public.profiles (id, username)
    VALUES (v_user_id, v_username)
    ON CONFLICT (id) DO NOTHING;

    -- Insert message
    INSERT INTO public.messages (content, user_id, author_name)
    VALUES (v_message, v_user_id, v_username);
    
  END LOOP;
END $$;
