import { ThemedText } from "@/components/themed-text";
import * as FileSystem from "expo-file-system/legacy";
import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
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
import {
  addClothingItem,
  analyzeClothingImage,
  getClothingItemById,
  updateClothingItem,
} from "../services/clothing";
import { sendInstantNotification } from "../services/notifications";
import { uploadClothingImage } from "../services/storage";

const KATEGORIJE = ["Tops", "Bottoms", "Shoes", "Dresses", "Accessories"];
const SEZONE = [
  { value: "Zima", label: "Zima" },
  { value: "Prolece/Jesen", label: "Proleće/Jesen" },
  { value: "Leto", label: "Leto" },
  { value: "Sve sezone", label: "Sve sezone" },
];
const STILOVI = ["Casual", "Formalno", "Sportsko", "Elegantno"];

export default function AddItemScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEditMode = !!id;

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [naziv, setNaziv] = useState("");
  const [kategorija, setKategorija] = useState("");
  const [boja, setBoja] = useState("");
  const [stil, setStil] = useState("");
  const [sezona, setSezona] = useState("");
  const [saving, setSaving] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [loadingItem, setLoadingItem] = useState(isEditMode);

  useEffect(() => {
    if (!id) return;
    getClothingItemById(id)
      .then((item) => {
        setNaziv(item.naziv);
        setKategorija(item.kategorija);
        setBoja(item.boja ?? "");
        setSezona(item.sezona ?? "");
        setExistingImageUrl(item.image_url ?? null);
      })
      .catch((err) => {
        Alert.alert("Greška", err.message ?? "Predmet nije pronađen.");
        router.back();
      })
      .finally(() => setLoadingItem(false));
  }, [id]);

  // NOVO: poziva Edge Function analyze-clothing sa slikom (base64)
  // i automatski popunjava kategoriju/boju/stil/sezonu ako AI uspe
  // da ih prepozna. Ako poziv padne (nema neta, funkcija pukne...),
  // samo obavesti korisnika i ostavi polja prazna za rucni unos -
  // ne blokira dalje popunjavanje forme.
  const analyzeImage = async (uri: string) => {
    setAnalyzing(true);
    try {
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const result = await analyzeClothingImage(base64);

      if (result.kategorija) setKategorija(result.kategorija);
      if (result.boja) setBoja(result.boja);
      if (result.stil) setStil(result.stil);
      if (result.sezona) setSezona(result.sezona);
    } catch (err: any) {
      console.log("AI analiza nije uspela:", err.message);
      Alert.alert(
        "AI nije uspeo da prepozna sliku",
        "Nema veze, popuni polja ručno ispod.",
      );
    } finally {
      setAnalyzing(false);
    }
  };

  const pickFromGallery = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "Potrebna dozvola",
        "Dozvoli pristup galeriji da bi dodala sliku.",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      setImageUri(uri);
      analyzeImage(uri);
    }
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Potrebna dozvola", "Dozvoli pristup kameri da bi slikala.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.7,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      setImageUri(uri);
      analyzeImage(uri);
    }
  };

  const pickImage = () => {
    Alert.alert("Dodaj sliku", "Izaberi opciju", [
      { text: "Slikaj", onPress: takePhoto },
      { text: "Izaberi iz galerije", onPress: pickFromGallery },
      { text: "Otkaži", style: "cancel" },
    ]);
  };

  const handleSave = async () => {
    if (!naziv.trim() || !kategorija.trim()) {
      Alert.alert("Greška", "Naziv i kategorija su obavezni.");
      return;
    }

    setSaving(true);
    try {
      let image_url = existingImageUrl ?? undefined;
      if (imageUri) {
        image_url = await uploadClothingImage(imageUri);
      }

      if (isEditMode && id) {
        await updateClothingItem(id, {
          naziv: naziv.trim(),
          kategorija: kategorija.trim(),
          boja: boja.trim() || undefined,
          sezona: sezona.trim() || undefined,
          image_url,
        });
        await sendInstantNotification(
          "Izmenjeno! ✅",
          `"${naziv.trim()}" je uspešno ažuriran.`,
        );
      } else {
        await addClothingItem({
          naziv: naziv.trim(),
          kategorija: kategorija.trim(),
          boja: boja.trim() || undefined,
          stil: stil.trim() || undefined,
          sezona: sezona.trim() || undefined,
          image_url,
        });
        await sendInstantNotification(
          "Dodato! ✅",
          `"${naziv.trim()}" je dodat u tvoj orman.`,
        );
      }

      router.back();
    } catch (err: any) {
      Alert.alert("Greška", err.message ?? "Nešto nije uspelo pri čuvanju.");
    } finally {
      setSaving(false);
    }
  };

  if (loadingItem) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#3a2a25" />
      </View>
    );
  }

  const displayImage = imageUri ?? existingImageUrl;

  return (
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ThemedText style={styles.backButtonText}>{"‹ Nazad"}</ThemedText>
        </Pressable>

        <ThemedText style={styles.title}>
          {isEditMode ? "Izmeni predmet" : "Novi komad"}
        </ThemedText>

        <Pressable style={styles.photoButton} onPress={pickImage}>
          {displayImage ? (
            <Image source={{ uri: displayImage }} style={styles.preview} />
          ) : (
            <ThemedText style={styles.photoButtonText}>
              Dodaj fotografiju
            </ThemedText>
          )}
          {analyzing && (
            <View style={styles.analyzingOverlay}>
              <ActivityIndicator color="#fff" />
              <ThemedText style={styles.analyzingText}>
                AI analizira sliku...
              </ThemedText>
            </View>
          )}
        </Pressable>

        <ThemedText style={styles.label}>Naziv komada</ThemedText>
        <TextInput
          style={styles.input}
          placeholder="Unesi naziv..."
          placeholderTextColor="#644A0766"
          value={naziv}
          onChangeText={setNaziv}
        />

        <ThemedText style={styles.label}>Kategorija</ThemedText>
        <View style={styles.chipRow}>
          {KATEGORIJE.map((kat) => (
            <Pressable
              key={kat}
              style={[styles.chip, kategorija === kat && styles.chipActive]}
              onPress={() => setKategorija(kat)}
            >
              <ThemedText
                style={
                  kategorija === kat ? styles.chipTextActive : styles.chipText
                }
              >
                {kat}
              </ThemedText>
            </Pressable>
          ))}
        </View>

        <ThemedText style={styles.label}>
          Boja (AI popunjava, može i ručno)
        </ThemedText>
        <TextInput
          style={styles.input}
          placeholder="npr. crvena, tamnoplava..."
          placeholderTextColor="#644A0766"
          value={boja}
          onChangeText={setBoja}
        />

        <ThemedText style={styles.label}>Stil</ThemedText>
        <View style={styles.chipRow}>
          {STILOVI.map((s) => (
            <Pressable
              key={s}
              style={[styles.chip, stil === s && styles.chipActive]}
              onPress={() => setStil(stil === s ? "" : s)}
            >
              <ThemedText
                style={stil === s ? styles.chipTextActive : styles.chipText}
              >
                {s}
              </ThemedText>
            </Pressable>
          ))}
        </View>

        <ThemedText style={styles.label}>Sezona (opciono)</ThemedText>
        <View style={styles.chipRow}>
          {SEZONE.map((s) => (
            <Pressable
              key={s.value}
              style={[styles.chip, sezona === s.value && styles.chipActive]}
              onPress={() => setSezona(sezona === s.value ? "" : s.value)}
            >
              <ThemedText
                style={
                  sezona === s.value ? styles.chipTextActive : styles.chipText
                }
              >
                {s.label}
              </ThemedText>
            </Pressable>
          ))}
        </View>

        <Pressable
          style={styles.saveButton}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#FFDBDB" />
          ) : (
            <ThemedText style={styles.saveButtonText}>
              {isEditMode ? "Sačuvaj izmene" : "Sačuvaj komad"}
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
    marginBottom: 24,
    color: "#3a2a25",
  },
  photoButton: {
    height: 180,
    borderRadius: 16,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#FFC6C6",
    shadowColor: "#3a2a25",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  photoButtonText: {
    color: "#644A07",
    fontWeight: "600",
    fontSize: 15,
  },
  preview: {
    width: "100%",
    height: "100%",
  },
  analyzingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(58, 42, 37, 0.55)",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  analyzingText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 13,
  },
  label: {
    fontWeight: "700",
    marginBottom: 8,
    marginTop: 16,
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
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#FFC6C6",
  },
  chipActive: {
    backgroundColor: "#3a2a25",
    borderColor: "#3a2a25",
  },
  chipText: {
    color: "#644A07",
    fontSize: 14,
  },
  chipTextActive: {
    color: "#FFDBDB",
    fontWeight: "700",
    fontSize: 14,
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
