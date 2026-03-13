import SafeAreaWrapper from "@/components/SafeAreaWrapper";
import apiService from "@/services/apiService";
import theme from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import RenderHtml from "react-native-render-html";

const { width } = Dimensions.get("window");

export default function DynamicPage() {
  const { page } = useLocalSearchParams();
  const [pageData, setPageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const scrollY = new Animated.Value(0);

  useEffect(() => {
    if (page) {
      fetchPage();
    }
  }, [page]);

  const fetchPage = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const response = await apiService.getPageBySlug(page);

      if (response.success) {
        setPageData(response.page.data);
      } else {
        setError(response.message || "Failed to load page");
      }
    } catch (err) {
      setError("An error occurred while loading the page");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchPage(true);
  };

  // Parallax animation
  const headerTranslate = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, -50],
    extrapolate: "clamp",
  });

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 60, 100],
    outputRange: [0, 0, 1],
    extrapolate: "clamp",
  });

  // Custom HTML styling
  const tagsStyles = {
    body: {
      color: theme.colors.text.secondary,
      fontSize: 15,
      fontFamily: theme.typography.fonts.regular,
      lineHeight: 24,
    },
    h1: {
      color: theme.colors.text.primary,
      fontSize: 26,
      fontFamily: theme.typography.fonts.bold,
      marginBottom: 12,
      marginTop: 24,
      letterSpacing: -0.5,
    },
    h2: {
      color: theme.colors.text.primary,
      fontSize: 22,
      fontFamily: theme.typography.fonts.bold,
      marginBottom: 10,
      marginTop: 20,
      letterSpacing: -0.3,
    },
    h3: {
      color: theme.colors.text.primary,
      fontSize: 18,
      fontFamily: theme.typography.fonts.semiBold,
      marginBottom: 8,
      marginTop: 16,
    },
    p: {
      color: theme.colors.text.secondary,
      fontSize: 15,
      fontFamily: theme.typography.fonts.regular,
      marginBottom: 16,
      lineHeight: 24,
    },
    a: {
      color: theme.colors.primary.teal,
      fontFamily: theme.typography.fonts.medium,
      textDecorationLine: "none",
    },
    ul: {
      marginBottom: 16,
      paddingLeft: 20,
    },
    ol: {
      marginBottom: 16,
      paddingLeft: 20,
    },
    li: {
      color: theme.colors.text.secondary,
      fontSize: 15,
      marginBottom: 8,
      lineHeight: 24,
    },
    strong: {
      fontFamily: theme.typography.fonts.semiBold,
      color: theme.colors.text.primary,
    },
    blockquote: {
      borderLeftWidth: 3,
      borderLeftColor: theme.colors.primary.teal,
      paddingLeft: 16,
      marginLeft: 0,
      marginBottom: 16,
      backgroundColor: theme.colors.background.accent,
      padding: 16,
      borderRadius: 8,
    },
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary.teal} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <SafeAreaWrapper>
        <View style={styles.errorContainer}>
          <View style={styles.errorIcon}>
            <Ionicons name="alert-circle-outline" size={48} color={theme.colors.status.error} />
          </View>
          <Text style={styles.errorTitle}>Unable to load page</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          
          <TouchableOpacity onPress={fetchPage} style={styles.errorButton} activeOpacity={0.8}>
            <Ionicons name="refresh" size={18} color="white" />
            <Text style={styles.errorButtonText}>Retry</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.back()} style={styles.backLink}>
            <Text style={styles.backLinkText}>Go back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaWrapper>
    );
  }

  return (
    <SafeAreaWrapper>
      <View style={styles.container}>
        {/* Fixed Header */}
        <Animated.View style={[styles.header, { opacity: headerOpacity }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerBack} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={24} color={"#000"} />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {pageData?.title}
          </Text>
        </Animated.View>

        <Animated.ScrollView
          showsVerticalScrollIndicator={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
          scrollEventThrottle={16}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={theme.colors.primary.teal}
              colors={[theme.colors.primary.teal]}
            />
          }
        >
          {/* Hero Image */}
          {pageData?.image_url && (
            <View style={styles.hero}>
              <Image source={{ uri: pageData.image_url }} style={styles.heroImage} />
              <LinearGradient
                colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.5)"]}
                style={styles.heroGradient}
              />
              <TouchableOpacity onPress={() => router.back()} style={styles.heroBack} activeOpacity={0.9}>
                <Ionicons name="arrow-back" size={22} color="black" />
              </TouchableOpacity>
            </View>
          )}

          {/* Content */}
          <View style={styles.content}>
           

            {/* Title */}
            <Text style={styles.title}>{pageData?.title}</Text>

            {/* Meta Info */}
            {pageData?.created_date && (
              <View style={styles.meta}>
                <Ionicons name="calendar-outline" size={14} color={theme.colors.text.tertiary} />
                <Text style={styles.metaText}>
                  {new Date(pageData.created_date).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </Text>
              </View>
            )}

            {/* Divider */}
            <View style={styles.divider} />


            {/* HTML Content */}
            {pageData?.description && (
              <View style={styles.htmlWrapper}>
                <RenderHtml
                  contentWidth={width - 32}
                  source={{ html: pageData.description }}
                  tagsStyles={tagsStyles}
                />
              </View>
            )}

            {/* Gallery */}
            {pageData?.images && pageData.images.length > 0 && (
              <View style={styles.gallery}>
                <View style={styles.galleryHeader}>
                  <Text style={styles.galleryTitle}>Gallery</Text>
                  <View style={styles.galleryBadge}>
                    <Text style={styles.galleryBadgeText}>{pageData.images_count}</Text>
                  </View>
                </View>

                <View style={styles.galleryGrid}>
                  {pageData.images.map((img) => (
                    <View key={img.id} style={styles.galleryItem}>
                      <Image source={{ uri: img.url }} style={styles.galleryImage} />
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Info Box */}
            <View style={styles.infoBox}>
              <View style={styles.infoHeader}>
                <View style={styles.infoIcon}>
                  <Ionicons name="information-circle" size={16} color={theme.colors.primary.teal} />
                </View>
                <Text style={styles.infoTitle}>Last Updated</Text>
              </View>
              <Text style={styles.infoText}>
                {pageData?.created_date
                  ? new Date(pageData.created_date).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  : "N/A"}
              </Text>
            </View>
          </View>

          <View style={{ height: 40 }} />
        </Animated.ScrollView>
      </View>
    </SafeAreaWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },

  // Loading
  loadingContainer: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: theme.typography.fonts.medium,
    color: theme.colors.text.tertiary,
  },

  // Error
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  errorIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${theme.colors.status.error}10`,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontFamily: theme.typography.fonts.bold,
    color: theme.colors.text.primary,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    fontFamily: theme.typography.fonts.regular,
    color: theme.colors.text.secondary,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  errorButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: theme.colors.primary.teal,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 100,
    marginBottom: 12,
  },
  errorButtonText: {
    color: "white",
    fontSize: 14,
    fontFamily: theme.typography.fonts.semiBold,
  },
  backLink: {
    paddingVertical: 8,
  },
  backLinkText: {
    color: theme.colors.text.tertiary,
    fontSize: 13,
    fontFamily: theme.typography.fonts.medium,
  },

  // Header
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: theme.colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  headerBack: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    fontSize: 16,
    fontFamily: theme.typography.fonts.semiBold,
    color: theme.colors.text.primary,
  },

  // Hero
  hero: {
    height: 280,
    backgroundColor: theme.colors.neutral.lightGray,
    position: "relative",
  },
  heroImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  heroGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  heroBack: {
    position: "absolute",
    top: 16,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.95)",
    alignItems: "center",
    justifyContent: "center",
  },

  // Content
  content: {
    padding: 16,
  },

  // Badge
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    backgroundColor: theme.colors.background.accent,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 100,
    marginBottom: 12,
  },
  badgeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.primary.teal,
  },
  badgeText: {
    fontSize: 11,
    fontFamily: theme.typography.fonts.semiBold,
    color: theme.colors.primary.teal,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  // Title
  title: {
    fontSize: 28,
    fontFamily: theme.typography.fonts.bold,
    color: theme.colors.text.primary,
    marginBottom: 12,
    letterSpacing: -0.5,
    lineHeight: 36,
  },

  // Meta
  meta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 20,
  },
  metaText: {
    fontSize: 13,
    fontFamily: theme.typography.fonts.medium,
    color: theme.colors.text.tertiary,
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: theme.colors.border.light,
    marginBottom: 20,
  },

  // HTML Content
  htmlWrapper: {
    marginBottom: 24,
  },

  // Gallery
  gallery: {
    marginBottom: 24,
  },
  galleryHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  galleryTitle: {
    fontSize: 18,
    fontFamily: theme.typography.fonts.bold,
    color: theme.colors.text.primary,
  },
  galleryBadge: {
    backgroundColor: theme.colors.background.accent,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 100,
  },
  galleryBadgeText: {
    fontSize: 12,
    fontFamily: theme.typography.fonts.semiBold,
    color: theme.colors.primary.teal,
  },
  galleryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  galleryItem: {
    width: (width - 40) / 2,
    height: 160,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: theme.colors.neutral.lightGray,
  },
  galleryImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },

  // Info Box
  infoBox: {
    backgroundColor: theme.colors.background.accent,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: `${theme.colors.primary.teal}20`,
  },
  infoHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  infoIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: `${theme.colors.primary.teal}15`,
    alignItems: "center",
    justifyContent: "center",
  },
  infoTitle: {
    fontSize: 13,
    fontFamily: theme.typography.fonts.semiBold,
    color: theme.colors.text.primary,
  },
  infoText: {
    fontSize: 13,
    fontFamily: theme.typography.fonts.regular,
    color: theme.colors.text.secondary,
    lineHeight: 20,
  },
});