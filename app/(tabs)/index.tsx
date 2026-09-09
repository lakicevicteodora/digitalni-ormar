import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useWeather } from "@/hooks/useWeather";
import {
  describeWeatherCode,
  getSeasonsForTemperature,
  getWeatherEmoji,
} from "@/services/weather";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  getClothingItems,
  getSuggestedItems,
  getWardrobeGapSuggestion,
  WardrobeGap,
} from "../../services/clothing";
import { getOutfits } from "../../services/outfits";
import { ClothingItem, Outfit } from "../../types/database";

export default function DashboardScreen() {
  const {
    weather,
    loading: weatherLoading,
    error: weatherError,
  } = useWeather();
  const [todaysOutfit, setTodaysOutfit] = useState<Outfit | null>(null);
  const [loadingOutfit, setLoadingOutfit] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [allItems, setAllItems] = useState<ClothingItem[]>([]);
  const [suggestedItems, setSuggestedItems] = useState<ClothingItem[]>([]);
  const [wardrobeGap, setWardrobeGap] = useState<WardrobeGap | null>(null);

  useFocusEffect(
    useCallback(() => {
      const todayStr = new Date().toISOString().split("T")[0];
      getOutfits()
        .then((outfits) => {
          const found = outfits.find((o) => o.datum === todayStr);
          setTodaysOutfit(found ?? null);
        })
        .catch(() => {})
        .finally(() => setLoadingOutfit(false));

      getClothingItems()
        .then(setAllItems)
        .catch(() => {});
      getWardrobeGapSuggestion()
        .then(setWardrobeGap)
        .catch(() => {});
    }, []),
  );

  useEffect(() => {
    if (!weather) return;
    const seasons = getSeasonsForTemperature(weather.temperature);
    getSuggestedItems(seasons)
      .then(setSuggestedItems)
      .catch(() => {});
  }, [weather]);

  const suggestions = searchQuery.trim()
    ? allItems.filter((item) =>
        item.naziv.toLowerCase().includes(searchQuery.trim().toLowerCase()),
      )
    : [];

  const handleSelectSuggestion = (item: ClothingItem) => {
    Keyboard.dismiss();
    setSearchQuery("");
    router.push(`/item-detail?id=${item.id}`);
  };

  return (
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        <ThemedView style={styles.header}>
          <ThemedText style={styles.greeting}>Zdravo! 👋</ThemedText>
          <ThemedText style={styles.subGreeting}>
            Šta planiraš da obučeš danas?
          </ThemedText>
        </ThemedView>

        <View style={styles.searchWrapper}>
          <View style={styles.searchBar}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Pretraži svoj orman..."
              placeholderTextColor="#644A0788"
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
            />
          </View>

          {searchQuery.trim().length > 0 && (
            <View style={styles.suggestionsBox}>
              {suggestions.length === 0 ? (
                <Text style={styles.noResultsText}>
                  Nemate taj komad odeće.
                </Text>
              ) : (
                suggestions.slice(0, 5).map((item) => (
                  <Pressable
                    key={item.id}
                    style={styles.suggestionRow}
                    onPress={() => handleSelectSuggestion(item)}
                  >
                    <Text style={styles.suggestionName}>{item.naziv}</Text>
                    <Text style={styles.suggestionCategory}>
                      {item.kategorija}
                    </Text>
                  </Pressable>
                ))
              )}
            </View>
          )}
        </View>

        <ThemedView style={styles.weatherCard}>
          {weatherLoading ? (
            <ActivityIndicator color="#fff" />
          ) : weatherError ? (
            <Text style={styles.errorText}>{weatherError}</Text>
          ) : weather ? (
            <>
              <Text style={styles.weatherEmoji}>
                {getWeatherEmoji(weather.weatherCode)}
              </Text>
              <Text style={styles.temperature}>{weather.temperature}°C</Text>
              <Text style={styles.weatherDesc}>
                {describeWeatherCode(weather.weatherCode)} · {weather.city}
              </Text>
            </>
          ) : null}
        </ThemedView>

        <ThemedView style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Današnji autfit</ThemedText>

          {loadingOutfit ? (
            <ActivityIndicator color="#3a2a25" />
          ) : todaysOutfit ? (
            <Pressable
              style={styles.outfitCard}
              onPress={() =>
                router.push(`/outfit-detail?id=${todaysOutfit.id}`)
              }
            >
              <Text style={styles.outfitTitle}>
                {todaysOutfit.naziv ?? "Autfit za danas"}
              </Text>
              {todaysOutfit.napomena ? (
                <Text style={styles.outfitNote}>{todaysOutfit.napomena}</Text>
              ) : null}
            </Pressable>
          ) : (
            <Pressable
              style={styles.emptyOutfitCard}
              onPress={() => router.push("/create-outfit")}
            >
              <Text style={styles.emptyOutfitText}>
                Nemaš planiran autfit za danas.
              </Text>
              <Text style={styles.emptyOutfitLink}>+ Kreiraj autfit</Text>
            </Pressable>
          )}
        </ThemedView>

        {suggestedItems.length > 0 && (
          <ThemedView style={styles.section}>
            <ThemedText style={styles.sectionTitle}>
              Predlog za danas
            </ThemedText>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 10 }}
            >
              {suggestedItems.map((item) => (
                <Pressable
                  key={item.id}
                  style={styles.suggestedCard}
                  onPress={() => router.push(`/item-detail?id=${item.id}`)}
                >
                  {item.image_url ? (
                    <Image
                      source={{ uri: item.image_url }}
                      style={styles.suggestedImage}
                    />
                  ) : (
                    <View
                      style={[
                        styles.suggestedImage,
                        styles.suggestedImagePlaceholder,
                      ]}
                    >
                      <Text style={{ fontSize: 10, color: "#3a2a25" }}>
                        Bez slike
                      </Text>
                    </View>
                  )}
                  <Text style={styles.suggestedName} numberOfLines={1}>
                    {item.naziv}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </ThemedView>
        )}
        {wardrobeGap && (
          <ThemedView style={styles.section}>
            <ThemedText style={styles.sectionTitle}>
              Predlog za kupovinu
            </ThemedText>
            <ThemedView style={styles.gapCard}>
              <Text style={styles.gapText}>{wardrobeGap.poruka}</Text>
              <Pressable
                style={styles.gapButton}
                onPress={() =>
                  router.push(`/add-item?kategorija=${wardrobeGap.kategorija}`)
                }
              >
                <Text style={styles.gapButtonText}>Dodaj komad odeće</Text>
              </Pressable>
            </ThemedView>
          </ThemedView>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#FFDBDB",
  },
  scrollContainer: {
    paddingBottom: 30,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 15,
    backgroundColor: "transparent",
  },
  greeting: {
    fontSize: 28,
    fontWeight: "700",
    color: "#3a2a25",
  },
  subGreeting: {
    fontSize: 15,
    color: "#3a2a25",
    marginTop: 4,
  },
  searchWrapper: {
    marginHorizontal: 20,
    marginTop: 16,
    zIndex: 10,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#FFC6C6",
  },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#3a2a25",
  },
  suggestionsBox: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginTop: 6,
    borderWidth: 1,
    borderColor: "#FFC6C6",
    overflow: "hidden",
  },
  suggestionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#FFDBDB",
  },
  suggestionName: {
    fontSize: 14,
    color: "#3a2a25",
    fontWeight: "600",
  },
  suggestionCategory: {
    fontSize: 12,
    color: "#3a2a25",
  },
  noResultsText: {
    padding: 14,
    color: "#3a2a25",
    fontSize: 14,
    textAlign: "center",
  },
  weatherCard: {
    marginHorizontal: 20,
    marginTop: 20,
    backgroundColor: "#3a2a25",
    borderRadius: 20,
    paddingVertical: 28,
    alignItems: "center",
  },
  weatherEmoji: { fontSize: 44 },
  temperature: {
    fontSize: 48,
    fontWeight: "700",
    color: "#FFDBDB",
    marginTop: 4,
  },
  weatherDesc: {
    fontSize: 15,
    color: "#FFC6C6",
    marginTop: 6,
  },
  errorText: {
    color: "#f5b7b1",
    textAlign: "center",
    paddingHorizontal: 16,
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 24,
    backgroundColor: "transparent",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 10,
    color: "#3a2a25",
  },
  outfitCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 18,
    shadowColor: "#3a2a25",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  outfitTitle: {
    fontWeight: "700",
    color: "#3a2a25",
    fontSize: 16,
  },
  outfitNote: {
    color: "#3a2a25",
    fontSize: 13,
    marginTop: 4,
  },
  emptyOutfitCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 18,
    alignItems: "center",
    shadowColor: "#3a2a25",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  emptyOutfitText: { color: "#3a2a25" },
  emptyOutfitLink: {
    color: "#3a2a25",
    fontWeight: "700",
    marginTop: 8,
  },
  suggestedCard: {
    width: 100,
    marginRight: 10,
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 6,
    shadowColor: "#3a2a25",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  suggestedImage: {
    width: "100%",
    height: 90,
    borderRadius: 8,
    marginBottom: 4,
  },
  suggestedImagePlaceholder: {
    backgroundColor: "#FFC6C6",
    justifyContent: "center",
    alignItems: "center",
  },
  suggestedName: {
    fontSize: 11,
    color: "#3a2a25",
  },
  gapCard: {
    backgroundColor: "#3a2a25",
    borderRadius: 14,
    padding: 18,
  },
  gapText: {
    color: "#FFDBDB",
    fontSize: 14,
    lineHeight: 20,
  },
  gapButton: {
    marginTop: 14,
    backgroundColor: "#FFDBDB",
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  gapButtonText: {
    color: "#3a2a25",
    fontWeight: "700",
    fontSize: 14,
  },
});
