import { ClothingItem } from "../types/database";
import { supabase } from "./supabase";

// Ucitaj svu odecu ulogovanog korisnika
export async function getClothingItems() {
  const { data, error } = await supabase
    .from("clothing_items")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as ClothingItem[];
}

// Dodaj novi odevni predmet
export async function addClothingItem(item: {
  naziv: string;
  kategorija: string;
  boja?: string;
  stil?: string;
  sezona?: string;
  image_url?: string;
}) {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Korisnik nije ulogovan");

  const { data, error } = await supabase
    .from("clothing_items")
    .insert({ ...item, user_id: userData.user.id })
    .select()
    .single();

  if (error) throw error;
  return data as ClothingItem;
}

// Izmeni postojeci predmet
export async function updateClothingItem(
  id: string,
  updates: Partial<ClothingItem>,
) {
  const { data, error } = await supabase
    .from("clothing_items")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as ClothingItem;
}

// Obrisi predmet
export async function deleteClothingItem(id: string) {
  const { error } = await supabase.from("clothing_items").delete().eq("id", id);
  if (error) throw error;
}

// Ucitaj jedan predmet po ID-u
export async function getClothingItemById(id: string) {
  const { data, error } = await supabase
    .from("clothing_items")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data as ClothingItem;
}

// Ucitaj samo omiljene predmete
export async function getLikedItems() {
  const { data, error } = await supabase
    .from("clothing_items")
    .select("*")
    .eq("omiljeno", true)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as ClothingItem[];
}

// Prebaci status omiljenog (true/false)
export async function toggleLiked(id: string, currentValue: boolean) {
  const { data, error } = await supabase
    .from("clothing_items")
    .update({ omiljeno: !currentValue })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as ClothingItem;
}

// Grupise listu odece po kategoriji - vraca objekat { kategorija: [predmeti] }
export function groupByCategory(
  items: ClothingItem[],
): Record<string, ClothingItem[]> {
  return items.reduce(
    (groups, item) => {
      const key = item.kategorija || "Ostalo";
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
      return groups;
    },
    {} as Record<string, ClothingItem[]>,
  );
}

// Vraca predmete koji odgovaraju datim sezonama (ili su oznaceni "Sve sezone")
export async function getSuggestedItems(matchingSeasons: string[]) {
  const items = await getClothingItems();

  return items.filter((item) => {
    if (!item.sezona) return false;
    const normalized = item.sezona.trim().toLowerCase();
    if (normalized === "sve sezone") return true;
    return matchingSeasons.some((s) => s.toLowerCase() === normalized);
  });
}

// NOVO: posalji sliku (base64) Edge Function-u analyze-clothing,
// dobij nazad predlog kategorije/boje/stila/sezone sa AI-ja.
export async function analyzeClothingImage(imageBase64: string) {
  const { data, error } = await supabase.functions.invoke("analyze-clothing", {
    body: { imageBase64 },
  });

  if (error) throw error;

  return data as {
    kategorija?: string;
    boja?: string;
    stil?: string;
    sezona?: string;
  };
}
