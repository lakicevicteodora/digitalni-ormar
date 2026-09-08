import { ClothingItem, Outfit } from "../types/database";
import { getClothingItems } from "./clothing";
import { supabase } from "./supabase";

// Ucitaj sve autfite ulogovanog korisnika, sortirano po datumu
export async function getOutfits() {
  const { data, error } = await supabase
    .from("outfits")
    .select("*")
    .order("datum", { ascending: false });

  if (error) throw error;
  return data as Outfit[];
}

// Ucitaj jedan autfit po ID-u
export async function getOutfitById(id: string) {
  const { data, error } = await supabase
    .from("outfits")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data as Outfit;
}

// Ucitaj komade odece koji pripadaju odredjenom autfitu
export async function getOutfitItems(outfitId: string) {
  const { data, error } = await supabase
    .from("outfit_items")
    .select("id, clothing_item_id, clothing_items(*)")
    .eq("outfit_id", outfitId);

  if (error) throw error;
  return (data ?? []).map((row: any) => row.clothing_items as ClothingItem);
}

// Kreiraj novi autfit
export async function createOutfit(outfit: {
  datum: string; // format 'YYYY-MM-DD'
  naziv?: string;
  napomena?: string;
}) {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Korisnik nije ulogovan");

  const { data, error } = await supabase
    .from("outfits")
    .insert({ ...outfit, user_id: userData.user.id })
    .select()
    .single();

  if (error) throw error;
  return data as Outfit;
}

// Dodaj komad odece u autfit (many-to-many veza)
export async function addItemToOutfit(
  outfitId: string,
  clothingItemId: string,
) {
  const { error } = await supabase
    .from("outfit_items")
    .insert({ outfit_id: outfitId, clothing_item_id: clothingItemId });

  if (error) throw error;
}

// Obrisi autfit
export async function deleteOutfit(id: string) {
  const { error } = await supabase.from("outfits").delete().eq("id", id);
  if (error) throw error;
}

// Ucitaj sve autfite SA slikama njihovih komada
export async function getOutfitsWithItems() {
  const outfits = await getOutfits();

  const outfitsWithImages = await Promise.all(
    outfits.map(async (outfit) => {
      const items = await getOutfitItems(outfit.id);
      const itemImages = items
        .map((item) => item.image_url)
        .filter(Boolean) as string[];
      return { ...outfit, itemImages };
    }),
  );

  return outfitsWithImages;
}

// Poziva AI agenta (suggest-outfit) koji generise autfit od postojece odece
export async function generateAIOutfit(prilika?: string, vreme?: string) {
  const items = await getClothingItems();

  if (items.length === 0) {
    throw new Error("Nemate unetih komada odeće u ormanu.");
  }

  const { data, error } = await supabase.functions.invoke("suggest-outfit", {
    body: { items, prilika, vreme },
  });

  if (error) throw error;

  const selectedItems = items.filter((item) =>
    data.selected_item_ids?.includes(item.id),
  );

  return {
    selectedItems,
    naslov: data.naslov as string,
    obrazlozenje: data.obrazlozenje as string,
  };
}
