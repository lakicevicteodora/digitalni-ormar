import { ThemedText } from "@/components/themed-text";
import { changePassword } from "@/services/profile";
import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ChangePasswordScreen() {
  const [novaLozinka, setNovaLozinka] = useState("");
  const [potvrdaLozinke, setPotvrdaLozinke] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (novaLozinka.length < 6) {
      Alert.alert("Greška", "Lozinka mora imati bar 6 karaktera.");
      return;
    }
    if (novaLozinka !== potvrdaLozinke) {
      Alert.alert("Greška", "Lozinke se ne poklapaju.");
      return;
    }

    setSaving(true);
    try {
      await changePassword(novaLozinka);
      Alert.alert("Uspešno", "Lozinka je promenjena.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (err: any) {
      Alert.alert("Greška", err.message ?? "Promena lozinke nije uspela.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ThemedText style={styles.backButtonText}>{"‹ Nazad"}</ThemedText>
        </Pressable>
        <ThemedText style={styles.title}>Promeni lozinku</ThemedText>

        <ThemedText style={styles.label}>Nova lozinka</ThemedText>
        <TextInput
          style={styles.input}
          placeholder="Bar 6 karaktera"
          placeholderTextColor="#644A0766"
          value={novaLozinka}
          onChangeText={setNovaLozinka}
          secureTextEntry
        />

        <ThemedText style={styles.label}>Potvrdi novu lozinku</ThemedText>
        <TextInput
          style={styles.input}
          placeholder="Ponovi lozinku"
          placeholderTextColor="#644A0766"
          value={potvrdaLozinke}
          onChangeText={setPotvrdaLozinke}
          secureTextEntry
        />

        <Pressable
          style={styles.saveButton}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#FFDBDB" />
          ) : (
            <ThemedText style={styles.saveButtonText}>
              Sačuvaj novu lozinku
            </ThemedText>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#FFDBDB" },
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
  saveButton: {
    marginTop: 32,
    backgroundColor: "#3a2a25",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  saveButtonText: { color: "#FFDBDB", fontWeight: "700", fontSize: 16 },
});
