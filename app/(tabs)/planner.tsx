import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getOutfitsWithItems } from "../../services/outfits";
import { Outfit } from "../../types/database";

type OutfitWithImages = Outfit & { itemImages: string[] };

export default function PlannerScreen() {
  const [outfits, setOutfits] = useState<OutfitWithImages[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadOutfits = async () => {
    try {
      setError(null);
      const data = await getOutfitsWithItems();
      setOutfits(data);
    } catch (err: any) {
      setError(err.message ?? "Greška pri učitavanju autfita");
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadOutfits();
    }, []),
  );

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("sr-RS", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  };

  // AI Banner kartica za brzi stajling
  const renderAICard = () => (
    <Pressable
      style={styles.aiBanner}
      onPress={() => router.push("/create-outfit")}
    >
      <View style={styles.aiBannerContent}>
        <ThemedText style={styles.aiBannerTitle}>
          Nemaš ideju šta da obučeš? ✨
        </ThemedText>
        <ThemedText style={styles.aiBannerSubtitle}>
          Pusti AI stilistu da izabere savršenu kombinaciju za tebe iz tvog
          ormana.
        </ThemedText>
      </View>
      <View style={styles.aiBannerBadge}>
        <ThemedText style={styles.aiBannerBadgeText}>Probaj AI</ThemedText>
      </View>
    </Pressable>
  );

  const renderContent = () => {
    if (loading) {
      return (
        <ThemedView style={styles.centered}>
          <ActivityIndicator size="large" color="#3a2a25" />
          <ThemedText style={styles.loadingText}>
            Učitavanje autfita...
          </ThemedText>
        </ThemedView>
      );
    }

    if (error) {
      return (
        <ThemedView style={styles.centered}>
          <ThemedText style={styles.errorText}>{error}</ThemedText>
        </ThemedView>
      );
    }

    if (outfits.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          {renderAICard()}
          <ThemedView style={styles.centeredEmpty}>
            <ThemedText style={styles.emptyText}>
              Nemaš još sačuvanih autfita.
            </ThemedText>
            <ThemedText style={styles.emptySubtext}>
              Kreiraj prvi autfit za neki dan ili iskoristi AI pomoć na kartici
              iznad.
            </ThemedText>
          </ThemedView>
        </View>
      );
    }

    return (
      <FlatList
        data={outfits}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={renderAICard}
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            onPress={() => router.push(`/outfit-detail?id=${item.id}`)}
          >
            <View style={styles.imagesGrid}>
              {item.itemImages.slice(0, 4).map((uri, idx) => (
                <Image key={idx} source={{ uri }} style={styles.itemThumb} />
              ))}
              {item.itemImages.length === 0 && (
                <View style={[styles.itemThumb, styles.itemThumbPlaceholder]}>
                  <ThemedText style={{ fontSize: 10, color: "#3a2a25" }}>
                    Bez slika
                  </ThemedText>
                </View>
              )}
            </View>

            <ThemedText style={styles.cardDate}>
              {formatDate(item.datum)}
            </ThemedText>
            {item.naziv ? (
              <ThemedText style={styles.cardTitle} numberOfLines={1}>
                {item.naziv}
              </ThemedText>
            ) : null}
          </Pressable>
        )}
      />
    );
  };

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <View style={styles.header}>
        <ThemedText style={styles.headerTitle}>Planer autfita</ThemedText>
      </View>

      {renderContent()}

      <Pressable
        style={styles.fab}
        onPress={() => router.push("/create-outfit")}
      >
        <ThemedText style={styles.fabText}>+</ThemedText>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#FFDBDB",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 8,
    backgroundColor: "transparent",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#3a2a25",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "transparent",
  },
  emptyContainer: {
    padding: 16,
    flex: 1,
  },
  centeredEmpty: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
    backgroundColor: "transparent",
  },
  loadingText: {
    marginTop: 10,
    color: "#644A07",
  },
  errorText: {
    color: "#c0392b",
    textAlign: "center",
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#3a2a25",
  },
  emptySubtext: {
    marginTop: 4,
    color: "#644A07",
    textAlign: "center",
  },
  list: {
    padding: 16,
  },
  aiBanner: {
    backgroundColor: "#644A07",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#3a2a25",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  aiBannerContent: {
    flex: 1,
    marginRight: 10,
  },
  aiBannerTitle: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 4,
  },
  aiBannerSubtitle: {
    color: "#FFDBDB",
    fontSize: 12,
    lineHeight: 16,
  },
  aiBannerBadge: {
    backgroundColor: "#FFDBDB",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  aiBannerBadgeText: {
    color: "#3a2a25",
    fontSize: 12,
    fontWeight: "700",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#FFC6C6",
    shadowColor: "#3a2a25",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  imagesGrid: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
  },
  itemThumb: {
    width: 80,
    height: 80,
    borderRadius: 10,
  },
  itemThumbPlaceholder: {
    backgroundColor: "#FFC6C6",
    justifyContent: "center",
    alignItems: "center",
  },
  cardDate: {
    fontWeight: "700",
    fontSize: 13,
    color: "#644A07",
  },
  cardTitle: {
    fontWeight: "600",
    color: "#3a2a25",
    fontSize: 15,
    marginTop: 2,
  },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#3a2a25",
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#3a2a25",
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  fabText: {
    color: "#FFDBDB",
    fontSize: 28,
    lineHeight: 30,
    fontWeight: "600",
  },
});
