import { ThemedText } from "@/components/themed-text";
import DateTimePicker from "@react-native-community/datetimepicker";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getClothingItems, groupByCategory } from "../services/clothing";
import {
  addItemToOutfit,
  createOutfit,
  generateAIOutfit,
} from "../services/outfits";
import { ClothingItem } from "../types/database";

function todayString() {
  const d = new Date();
  return d.toISOString().split("T")[0];
}

export default function CreateOutfitScreen() {
  const [datum, setDatum] = useState(todayString());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [naziv, setNaziv] = useState("");
  const [napomena, setNapomena] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [clothingItems, setClothingItems] = useState<ClothingItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generatingAI, setGeneratingAI] = useState(false);

  useEffect(() => {
    getClothingItems()
      .then(setClothingItems)
      .catch((err) =>
        Alert.alert("Greška", err.message ?? "Greška pri učitavanju odeće"),
      )
      .finally(() => setLoadingItems(false));
  }, []);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleGenerateAI = async () => {
    if (clothingItems.length === 0) {
      Alert.alert(
        "Orman je prazan",
        "Dodaj prvo neku odeću u orman kako bi AI napravio kombinaciju.",
      );
      return;
    }

    setGeneratingAI(true);
    try {
      const result = await generateAIOutfit(
        "Casual izlazak",
        selectedIds.length > 0 ? selectedIds : undefined,
      );

      if (result.selectedItems && result.selectedItems.length > 0) {
        const ids = result.selectedItems.map((item) => item.id);
        setSelectedIds(ids);
      }
      if (result.naslov) setNaziv(result.naslov);
      if (result.obrazlozenje) setNapomena(result.obrazlozenje);
    } catch (err: any) {
      Alert.alert(
        "Greška pri AI stajlingu",
        err.message ?? "AI nije uspeo da generiše outfit.",
      );
    } finally {
      setGeneratingAI(false);
    }
  };

  const handleSave = async () => {
    if (!datum.trim()) {
      Alert.alert("Greška", "Datum je obavezan.");
      return;
    }
    if (selectedIds.length === 0) {
      Alert.alert("Greška", "Izaberi bar jedan komad odeće za autfit.");
      return;
    }

    setSaving(true);
    try {
      const outfit = await createOutfit({
        datum: datum.trim(),
        naziv: naziv.trim() || undefined,
        napomena: napomena.trim() || undefined,
      });

      await Promise.all(
        selectedIds.map((clothingId) => addItemToOutfit(outfit.id, clothingId)),
      );

      router.back();
    } catch (err: any) {
      Alert.alert("Greška", err.message ?? "Nešto nije uspelo pri čuvanju.");
    } finally {
      setSaving(false);
    }
  };

  if (loadingItems) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#3a2a25" />
      </View>
    );
  }

  const grouped = groupByCategory(clothingItems);
  const categories = Object.keys(grouped);

  return (
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ThemedText style={styles.backButtonText}>{"‹ Nazad"}</ThemedText>
        </Pressable>
        <ThemedText style={styles.title}>Kreiraj autfit</ThemedText>

        <Pressable
          style={styles.aiButton}
          onPress={handleGenerateAI}
          disabled={generatingAI}
        >
          {generatingAI ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <ThemedText style={styles.aiButtonText}>
              {selectedIds.length > 0
                ? "Ponudi drugu kombinaciju 🔄"
                : "Generiši outfit uz AI ✨"}
            </ThemedText>
          )}
        </Pressable>

        <ThemedText style={styles.label}>Datum</ThemedText>
        <Pressable
          style={styles.dateButton}
          onPress={() => setShowDatePicker(true)}
        >
          <ThemedText style={styles.dateButtonText}>{datum}</ThemedText>
        </Pressable>

        {showDatePicker && (
          <DateTimePicker
            value={new Date(datum)}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              setShowDatePicker(false);
              if (selectedDate) {
                setDatum(selectedDate.toISOString().split("T")[0]);
              }
            }}
          />
        )}

        <ThemedText style={styles.label}>Naziv (opciono)</ThemedText>
        <TextInput
          style={styles.input}
          placeholder="npr. Casual petak"
          placeholderTextColor="#644A0766"
          value={naziv}
          onChangeText={setNaziv}
        />

        <ThemedText style={styles.label}>Napomena (opciono)</ThemedText>
        <TextInput
          style={[styles.input, { height: 80 }]}
          placeholder="npr. Za sastanak posle podne"
          placeholderTextColor="#644A0766"
          value={napomena}
          onChangeText={setNapomena}
          multiline
        />

        <ThemedText style={styles.label}>
          Izaberi odeću ({selectedIds.length} izabrano)
        </ThemedText>

        {clothingItems.length === 0 ? (
          <ThemedText style={styles.emptyText}>
            Orman je prazan — dodaj prvo neku odeću u "Moj orman".
          </ThemedText>
        ) : (
          categories.map((category) => (
            <View key={category} style={styles.categorySection}>
              <ThemedText style={styles.categoryTitle}>{category}</ThemedText>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingRight: 16 }}
              >
                {grouped[category].map((item) => {
                  const isSelected = selectedIds.includes(item.id);
                  return (
                    <Pressable
                      key={item.id}
                      style={[
                        styles.itemCard,
                        isSelected && styles.itemCardSelected,
                      ]}
                      onPress={() => toggleSelect(item.id)}
                    >
                      {item.image_url ? (
                        <Image
                          source={{ uri: item.image_url }}
                          style={styles.itemImage}
                        />
                      ) : (
                        <View
                          style={[
                            styles.itemImage,
                            styles.itemImagePlaceholder,
                          ]}
                        >
                          <ThemedText
                            style={{ fontSize: 10, color: "#3a2a25" }}
                          >
                            Bez slike
                          </ThemedText>
                        </View>
                      )}
                      <ThemedText numberOfLines={1} style={styles.itemName}>
                        {item.naziv}
                      </ThemedText>
                      {isSelected && <View style={styles.checkmark} />}
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          ))
        )}

        <Pressable
          style={styles.saveButton}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#FFDBDB" />
          ) : (
            <ThemedText style={styles.saveButtonText}>
              Sačuvaj autfit
            </ThemedText>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#FFDBDB",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFDBDB",
  },
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  backButton: {
    marginBottom: 12,
    alignSelf: "flex-start",
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#3a2a25",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 16,
    color: "#3a2a25",
  },
  aiButton: {
    backgroundColor: "#644A07",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  aiButtonText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 15,
  },
  label: {
    fontWeight: "700",
    marginBottom: 8,
    marginTop: 12,
    color: "#3a2a25",
    fontSize: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: "#FFC6C6",
    borderRadius: 12,
    padding: 12,
    marginBottom: 4,
    backgroundColor: "#fff",
    color: "#3a2a25",
    fontSize: 15,
  },
  dateButton: {
    borderWidth: 1,
    borderColor: "#FFC6C6",
    borderRadius: 12,
    padding: 14,
    marginBottom: 4,
    backgroundColor: "#fff",
  },
  dateButtonText: {
    color: "#3a2a25",
    fontSize: 15,
    fontWeight: "600",
  },
  emptyText: {
    color: "#644A07",
    marginTop: 8,
    fontSize: 14,
  },
  categorySection: {
    marginTop: 16,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 10,
    color: "#3a2a25",
  },
  itemCard: {
    width: 106,
    marginRight: 12,
    padding: 8,
    borderRadius: 14,
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#FFC6C6",
    position: "relative",
    shadowColor: "#3a2a25",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  itemCardSelected: {
    borderColor: "#3a2a25",
  },
  itemImage: {
    width: "100%",
    height: 90,
    borderRadius: 8,
    marginBottom: 6,
  },
  itemImagePlaceholder: {
    backgroundColor: "#FFC6C6",
    justifyContent: "center",
    alignItems: "center",
  },
  itemName: {
    fontSize: 12,
    color: "#3a2a25",
    fontWeight: "600",
  },
  checkmark: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#3a2a25",
    borderWidth: 2,
    borderColor: "#fff",
  },
  saveButton: {
    marginTop: 32,
    backgroundColor: "#3a2a25",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    elevation: 3,
    shadowColor: "#3a2a25",
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  saveButtonText: {
    color: "#FFDBDB",
    fontWeight: "700",
    fontSize: 16,
  },
});
