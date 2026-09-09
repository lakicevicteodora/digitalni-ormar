import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { getLikedItems } from "@/services/clothing";
import {
  cancelAllReminders,
  requestNotificationPermission,
  scheduleDailyOutfitReminder,
} from "@/services/notifications";
import { getMyProfile, getMyStats } from "@/services/profile";
import { supabase } from "@/services/supabase";
import { Profile } from "@/types/database";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ProfileScreen() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState({
    clothingCount: 0,
    outfitsCount: 0,
    likedCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [remindersOn, setRemindersOn] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      Promise.all([getMyProfile(), getMyStats(), getLikedItems()])
        .then(([profileData, statsData, likedItems]) => {
          setProfile(profileData);
          setStats({ ...statsData, likedCount: likedItems.length });
        })
        .catch((err) =>
          Alert.alert("Greška", err.message ?? "Greška pri učitavanju profila"),
        )
        .finally(() => setLoading(false));
    }, []),
  );

  const handleToggleReminders = async (value: boolean) => {
    if (value) {
      const granted = await requestNotificationPermission();
      if (!granted) {
        Alert.alert(
          "Dozvola potrebna",
          "Uključi notifikacije u podešavanjima telefona da bi primala podsetnike.",
        );
        return;
      }
      await scheduleDailyOutfitReminder(20, 0);
      Alert.alert(
        "Podsetnici uključeni",
        "Svako veče u 20h dobićeš podsetnik.",
      );
    } else {
      await cancelAllReminders();
    }
    setRemindersOn(value);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" color="#3a2a25" />
      </ThemedView>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <ThemedView style={styles.header}>
        <ThemedView style={styles.avatar}>
          <ThemedText style={styles.avatarText}>
            {(profile?.ime?.[0] ?? profile?.email?.[0] ?? "?").toUpperCase()}
          </ThemedText>
        </ThemedView>
        <ThemedText style={styles.name}>
          {profile?.ime || "Bez imena"}
        </ThemedText>
        <ThemedText style={styles.email}>{profile?.email}</ThemedText>
        <ThemedView style={styles.metaRow}>
          {profile?.lokacija ? (
            <ThemedText style={styles.metaText}>
              📍 {profile.lokacija}
            </ThemedText>
          ) : null}
          {profile?.broj_telefona ? (
            <ThemedText style={styles.metaText}>
              📞 {profile.broj_telefona}
            </ThemedText>
          ) : null}
        </ThemedView>
      </ThemedView>

      <ThemedView style={styles.statsRow}>
        <ThemedView style={styles.statCard}>
          <ThemedText style={styles.statNumber}>
            {stats.clothingCount}
          </ThemedText>
          <ThemedText style={styles.statLabel}>Odevni predmeti</ThemedText>
        </ThemedView>
        <ThemedView style={styles.statCard}>
          <ThemedText style={styles.statNumber}>
            {stats.outfitsCount}
          </ThemedText>
          <ThemedText style={styles.statLabel}>Autfiti</ThemedText>
        </ThemedView>
        <Pressable
          style={styles.statCard}
          onPress={() => router.push("/liked-items")}
        >
          <ThemedText style={styles.statNumber}>
            ❤️ {stats.likedCount}
          </ThemedText>
          <ThemedText style={styles.statLabel}>Omiljeno</ThemedText>
        </Pressable>
      </ThemedView>

      <ThemedText style={styles.sectionTitle}>Nalog</ThemedText>
      <ThemedView style={styles.card}>
        <Pressable
          style={styles.settingsRow}
          onPress={() => router.push("/edit-profile")}
        >
          <ThemedText style={styles.settingsRowText}>Izmeni profil</ThemedText>
          <ThemedText style={styles.chevron}>›</ThemedText>
        </Pressable>
        <ThemedView style={styles.divider} />
        <Pressable
          style={styles.settingsRow}
          onPress={() => router.push("/change-password")}
        >
          <ThemedText style={styles.settingsRowText}>
            Promeni lozinku
          </ThemedText>
          <ThemedText style={styles.chevron}>›</ThemedText>
        </Pressable>
      </ThemedView>

      <ThemedText style={styles.sectionTitle}>Podešavanja</ThemedText>
      <ThemedView style={styles.card}>
        <ThemedView style={styles.settingsRow}>
          <ThemedText style={styles.settingsRowText}>
            Dnevni podsetnik (20h)
          </ThemedText>
          <Switch value={remindersOn} onValueChange={handleToggleReminders} />
        </ThemedView>
      </ThemedView>

      <Pressable style={styles.logoutButton} onPress={handleLogout}>
        <ThemedText style={styles.logoutButtonText}>Odjavi se</ThemedText>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#FFDBDB" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    alignItems: "center",
    paddingTop: 24,
    paddingHorizontal: 20,
    backgroundColor: "transparent",
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#3a2a25",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  avatarText: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "700",
    textAlign: "center",
    alignSelf: "center",
    lineHeight: 40,
  },
  name: { fontSize: 22, fontWeight: "700", color: "#3a2a25" },
  email: { fontSize: 13, color: "#644A07", marginTop: 2 },
  metaRow: {
    flexDirection: "row",
    gap: 14,
    marginTop: 8,
    backgroundColor: "transparent",
  },
  metaText: { fontSize: 13, color: "#3a2a25" },
  statsRow: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginTop: 24,
    gap: 12,
    backgroundColor: "transparent",
  },
  statCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#3a2a25",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: "700",
    color: "#3a2a25",
    textAlign: "center",
  },
  statLabel: {
    fontSize: 11,
    color: "#3a2a25",
    marginTop: 6,
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#3a2a25",
    marginTop: 24,
    marginBottom: 8,
    marginHorizontal: 24,
  },
  card: {
    marginHorizontal: 20,
    backgroundColor: "#fff",
    borderRadius: 12,
    shadowColor: "#3a2a25",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    overflow: "hidden",
  },
  settingsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: "transparent",
  },
  settingsRowText: { fontSize: 15, fontWeight: "600", color: "#3a2a25" },
  chevron: { fontSize: 20, color: "#3a2a25" },
  divider: { height: 1, backgroundColor: "#FFDBDB", marginLeft: 16 },
  logoutButton: {
    marginHorizontal: 20,
    marginTop: 28,
    backgroundColor: "#3a2a25",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  logoutButtonText: { color: "#fff", fontWeight: "700" },
});
