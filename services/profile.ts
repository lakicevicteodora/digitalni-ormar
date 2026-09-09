import { Profile } from "../types/database";
import { supabase } from "./supabase";

// Ucitaj profil ulogovanog korisnika
export async function getMyProfile() {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Korisnik nije ulogovan");

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userData.user.id)
    .single();

  if (error) throw error;
  return data as Profile;
}

// Izmeni profil (ime, lokacija, avatar)
export async function updateMyProfile(updates: Partial<Profile>) {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Korisnik nije ulogovan");

  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", userData.user.id)
    .select()
    .single();

  if (error) throw error;
  return data as Profile;
}

// Statistika za profil - koliko ima odece i autfita ukupno
export async function getMyStats() {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Korisnik nije ulogovan");

  const [clothingCount, outfitsCount] = await Promise.all([
    supabase
      .from("clothing_items")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userData.user.id),
    supabase
      .from("outfits")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userData.user.id),
  ]);

  return {
    clothingCount: clothingCount.count ?? 0,
    outfitsCount: outfitsCount.count ?? 0,
  };
}

export async function changePassword(newPassword: string) {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
}
