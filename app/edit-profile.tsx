import { ThemedText } from "@/components/themed-text";
import { getMyProfile, updateMyProfile } from "@/services/profile";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const POL_OPTIONS = [
  { value: "zensko", label: "Žensko" },
  { value: "musko", label: "Muško" },
  { value: "ne_zelim", label: "Ne želim da kažem" },
];

export default function EditProfileScreen() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [ime, setIme] = useState("");
  const [lokacija, setLokacija] = useState("");
  const [pol, setPol] = useState<string | null>(null);
  const [telefon, setTelefon] = useState("");

  useEffect(() => {
    getMyProfile()
      .then((profile) => {
        setIme(profile.ime ?? "");
        setLokacija(profile.lokacija ?? "");
        setPol(profile.pol ?? null);
        setTelefon(profile.broj_telefona ?? "");
      })
      .catch((err) =>
        Alert.alert("Greška", err.message ?? "Greška pri učitavanju profila"),
      )
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateMyProfile({
        ime: ime.trim() || null,
        lokacija: lokacija.trim() || null,
        pol: pol,
        broj_telefona: telefon.trim() || null,
      });
      router.back();
    } catch (err: any) {
      Alert.alert("Greška", err.message ?? "Čuvanje nije uspelo.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#3a2a25" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ThemedText style={styles.backButtonText}>{"‹ Nazad"}</ThemedText>
        </Pressable>
        <ThemedText style={styles.title}>Izmeni profil</ThemedText>

        <ThemedText style={styles.label}>Ime i prezime</ThemedText>
        <TextInput
          style={styles.input}
          placeholder="npr. Teodora Lakićević"
          placeholderTextColor="#644A0766"
          value={ime}
          onChangeText={setIme}
        />

        <ThemedText style={styles.label}>Lokacija (grad)</ThemedText>
        <TextInput
          style={styles.input}
          placeholder="npr. Beograd"
          placeholderTextColor="#644A0766"
          value={lokacija}
          onChangeText={setLokacija}
        />

        <ThemedText style={styles.label}>Broj telefona</ThemedText>
        <TextInput
          style={styles.input}
          placeholder="npr. 06X XXX XXXX"
          placeholderTextColor="#644A0766"
          value={telefon}
          onChangeText={setTelefon}
          keyboardType="phone-pad"
        />

        <ThemedText style={styles.label}>Pol</ThemedText>
        <View style={styles.polRow}>
          {POL_OPTIONS.map((opt) => (
            <Pressable
              key={opt.value}
              style={[
                styles.polChip,
                pol === opt.value && styles.polChipSelected,
              ]}
              onPress={() => setPol(opt.value)}
            >
              <ThemedText
                style={[
                  styles.polChipText,
                  pol === opt.value && styles.polChipTextSelected,
                ]}
              >
                {opt.label}
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
            <ThemedText style={styles.saveButtonText}>Sačuvaj</ThemedText>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#FFDBDB" },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFDBDB",
  },
  container: { padding: 20, paddingBottom: 40 },
  backButton: { marginBottom: 12, alignSelf: "flex-start" },
  backButtonText: { fontSize: 16, fontWeight: "600", color: "#3a2a25" },
  title: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 20,
    color: "#3a2a25",
  },
  label: {
    fontWeight: "700",
    marginBottom: 8,
    marginTop: 14,
    color: "#3a2a25",
    fontSize: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: "#FFC6C6",
    borderRadius: 12,
    padding: 12,
    backgroundColor: "#fff",
    color: "#3a2a25",
    fontSize: 15,
  },
  polRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  polChip: {
    borderWidth: 1,
    borderColor: "#FFC6C6",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: "#fff",
  },
  polChipSelected: {
    backgroundColor: "#3a2a25",
    borderColor: "#3a2a25",
  },
  polChipText: { color: "#3a2a25", fontSize: 13, fontWeight: "600" },
  polChipTextSelected: { color: "#FFDBDB" },
  saveButton: {
    marginTop: 32,
    backgroundColor: "#3a2a25",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  saveButtonText: { color: "#FFDBDB", fontWeight: "700", fontSize: 16 },
});
