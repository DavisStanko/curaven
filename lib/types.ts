export type Message = {
  id: string;
  match_id: string;
  sender_id: string;
  content: string;
  created_at: string;
};

export type Match = {
  id: string;
  user_a: string;
  user_b: string;
  created_at: string;
  expires_at: string;
  user_a_revealed: boolean;
  user_b_revealed: boolean;
};

export type Profile = {
  id: string;
  phone_number: string | null;
  is_looking: boolean;
  created_at: string;
};
