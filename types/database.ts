export type Profile = {
  id: string;
  email: string;
  ime: string | null;
  avatar_url: string | null;
  lokacija: string | null;
  created_at: string;
};

export type ClothingItem = {
  id: string;
  user_id: string;
  naziv: string;
  kategorija: string;
  boja: string | null;
  sezona: string | null;
  stil: string | null;
  image_url: string | null;
  broj_nosenja: number;
  omiljeno: boolean;
  created_at: string;
};

export type Outfit = {
  id: string;
  user_id: string;
  datum: string;
  naziv: string | null;
  napomena: string | null;
  created_at: string;
};

export type OutfitItem = {
  id: string;
  outfit_id: string;
  clothing_item_id: string;
};
