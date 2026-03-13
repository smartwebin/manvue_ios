import SafeAreaWrapper from "@/components/SafeAreaWrapper";
import apiService from "@/services/apiService";
import theme from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const { width, height } = Dimensions.get("window");

export default function EmployerChatDetails() {
  const receivedData = useLocalSearchParams();
  const [messageText, setMessageText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef(null);
  const [showOptions, setShowOptions] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  const [conversationId, setConversationId] = useState(receivedData.id[2]);
  const flatListRef = useRef(null);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const id = receivedData.id[0];
  const applicationId = receivedData.id[1];
  const [blockedByMe, setBlockedByMe] = useState(false);
  const [blockedByOther, setBlockedByOther] = useState(false);
  const [canUnblock, setCanUnblock] = useState(false);
  // File viewer state
  const [showFileViewer, setShowFileViewer] = useState(false);
  const [viewerFile, setViewerFile] = useState(null);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  // Dynamic data from API
  const [candidateData, setCandidateData] = useState(null);
  const [messages, setMessages] = useState([]);
  const [conversationInfo, setConversationInfo] = useState(null);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(() => fetchMessages(false), 5000);
    return () => clearInterval(interval);
  }, [id]);

  const fetchMessages = async (showLoader = true) => {
    try {
      if (showLoader) setIsLoadingMessages(true);

      const result = await apiService.getConversationMessages({
        conversationId:
          conversationId && conversationId !== "0" ? conversationId : null,
        applicationId:
          applicationId && applicationId !== "0" ? applicationId : null,
        jobseekerId: id && id !== "0" ? id : null,
      });

      if (result.success) {
        setConversationId(result.data?.conversation?.conversation_id || null);
        const newMessages = result.data.messages || [];

        // Check if there are actually NEW messages (by comparing last message ID)
        const hasNewMessages =
          showLoader ||
          (newMessages.length > 0 &&
            messages.length > 0 &&
            newMessages[newMessages.length - 1]?.id !==
              messages[messages.length - 1]?.id);

        setMessages(newMessages);
        setConversationInfo(result.data.conversation);

        if (result.data.conversation?.other_participant) {
          const participant = result.data.conversation.other_participant;
          setCandidateData({
            id: participant.user_id,
            name: participant.name,
            initial: getInitials(participant.name),
            isOnline: false,
            email: participant.email,
            profileImage: participant.profile_image,
          });

          // ===== UPDATE BLOCKING STATES FROM NEW API RESPONSE =====
          const conv = result.data.conversation;
          setIsBlocked(conv.is_blocked || false);
          setBlockedByMe(conv.blocked_by_me || false);
          setBlockedByOther(conv.blocked_by_other || false);
          setCanUnblock(conv.can_unblock || false);
        }

        // Only scroll if it's initial load OR (genuinely new message arrived AND user is near bottom)
        if (hasNewMessages && (showLoader || isNearBottom)) {
          setTimeout(() => {
            if (flatListRef.current) {
              flatListRef.current.scrollToEnd({ animated: !showLoader });
            }
          }, 100);
        }
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      if (showLoader) setIsLoadingMessages(false);
    }
  };

  const getInitials = (name) => {
    const parts = name?.split(" ") || [];
    return parts.length >= 2
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : name?.substring(0, 2).toUpperCase() || "NA";
  };

  const handleScroll = (event) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const distanceFromBottom =
      contentSize.height - (contentOffset.y + layoutMeasurement.height);

    // Consider user "near bottom" if within 100px of the bottom
    setIsNearBottom(distanceFromBottom < 100);
  };

  /**
   * Determine file type from URL or mime type
   */
  const getFileType = (fileUrl, mimeType = null, fileName = null) => {
    // Check mime type first
    if (mimeType) {
      if (mimeType.startsWith("image/")) return "image";
      if (mimeType === "application/pdf") return "pdf";
      if (mimeType.includes("document") || mimeType.includes("word"))
        return "document";
    }

    // Check file extension
    const extension = (fileName || fileUrl || "")
      .toLowerCase()
      .split(".")
      .pop();

    const imageExtensions = ["jpg", "jpeg", "png", "gif", "webp", "bmp"];
    const pdfExtensions = ["pdf"];
    const docExtensions = ["doc", "docx", "txt", "rtf", "odt"];

    if (imageExtensions.includes(extension)) return "image";
    if (pdfExtensions.includes(extension)) return "pdf";
    if (docExtensions.includes(extension)) return "document";

    return "unknown";
  };

  /**
   * Get appropriate icon for file type
   */
  const getFileIcon = (fileUrl, mimeType = null, fileName = null) => {
    const fileType = getFileType(fileUrl, mimeType, fileName);

    switch (fileType) {
      case "image":
        return "image-outline";
      case "pdf":
        return "document-text-outline";
      case "document":
        return "document-outline";
      default:
        return "attach-outline";
    }
  };

  /**
   * Handle file opening based on type
   */
  const handleFileOpen = async (item) => {
    try {
      // Use fileFullUrl from backend if available, otherwise construct it
      const fullUrl =
        item.fileFullUrl ||
        (item.fileUrl ? `${apiService.BASE_IMG_URL}/${item.fileUrl}` : null) ||
        (item.file_url ? `${apiService.BASE_IMG_URL}/${item.file_url}` : null);

      const fileName =
        item.fileName || item.fileOriginalName || item.file_name || "";
      const mimeType = item.mimeType || item.mime_type;

      if (!fullUrl) {
        Alert.alert("Error", "File URL not found");
        return;
      }

      const fileType = getFileType(fullUrl, mimeType, fileName);

      console.log("Opening file:", { fullUrl, fileType, mimeType, fileName });

      if (fileType === "image") {
        // Show image in modal viewer
        setImageLoading(true);
        setImageError(false);
        setViewerFile({
          type: "image",
          url: fullUrl,
          name: fileName,
        });
        setShowFileViewer(true);
      } else if (fileType === "pdf") {
        // Open PDF in browser
        await WebBrowser.openBrowserAsync(fullUrl);
      } else if (fileType === "document" || fileType === "unknown") {
        // Try to open with system default app
        const supported = await Linking.canOpenURL(fullUrl);
        if (supported) {
          await Linking.openURL(fullUrl);
        } else {
          // Fallback to browser
          await WebBrowser.openBrowserAsync(fullUrl);
        }
      }
    } catch (error) {
      console.error("Error opening file:", error);
      Alert.alert("Error", "Failed to open file");
    }
  };

  const sendMessage = async () => {
    if (!messageText.trim() || isBlocked || isSending) return;

    const tempMessage = {
      id: Date.now().toString(),
      text: messageText.trim(),
      timestamp: new Date().toISOString(),
      sender: "company",
      type: "text",
      status: "sending",
    };

    setMessages((prev) => [...prev, tempMessage]);
    const textToSend = messageText.trim();
    setMessageText("");

    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

    setIsSending(true);
    try {
      const result = await apiService.sendMessage(
        id,
        applicationId,
        conversationId,
        textToSend,
        "text"
      );

      if (result.success) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === tempMessage.id
              ? {
                  ...result.data,
                  id: result.data.message_id.toString(),
                  sender: "company",
                  type: "text",
                }
              : msg
          )
        );
      } else {
        setMessages((prev) => prev.filter((msg) => msg.id !== tempMessage.id));
        Alert.alert("Error", result.message || "Failed to send message");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((prev) => prev.filter((msg) => msg.id !== tempMessage.id));
      Alert.alert("Error", "Failed to send message");
    } finally {
      setIsSending(false);
    }
  };

  const handleFileRequest = async () => {
    if (isBlocked || isSending) return;

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true,
      });

      if (result.type === "success" || result.assets?.[0]) {
        const file = result.assets?.[0] || result;
        const tempMessage = {
          id: Date.now().toString(),
          fileOriginalName: file.name,
          fileSize: file.size,
          mimeType: file.mimeType,
          timestamp: new Date().toISOString(),
          sender: "company",
          type: "file",
          status: "sending",
        };

        setMessages((prev) => [...prev, tempMessage]);

        setTimeout(
          () => flatListRef.current?.scrollToEnd({ animated: true }),
          100
        );

        setIsSending(true);
        const uploadResult = await apiService.sendMessage(
          id,
          applicationId,
          conversationId,
          null,
          "file",
          file
        );

        if (uploadResult.success) {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === tempMessage.id
                ? {
                    ...uploadResult.data,
                    id: uploadResult.data.message_id.toString(),
                    sender: "company",
                    type: "file",
                  }
                : msg
            )
          );
        } else {
          setMessages((prev) =>
            prev.filter((msg) => msg.id !== tempMessage.id)
          );
          Alert.alert("Error", uploadResult.message || "Failed to send file");
        }
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      Alert.alert("Error", "Failed to upload file");
    } finally {
      setIsSending(false);
    }
  };

  const handleBlockCandidate = async () => {
    try {
      const result = await apiService.blockConversation(
        conversationId,
        "block"
      );
      if (result.success) {
        setIsBlocked(true);
        setShowBlockModal(false);
        Alert.alert("Success", "Candidate has been blocked");
      } else {
        Alert.alert("Error", result.message || "Failed to block candidate");
      }
    } catch (error) {
      console.error("Error blocking candidate:", error);
      Alert.alert("Error", "Failed to block candidate");
    }
  };

  const handleUnblockCandidate = async () => {
    try {
      const result = await apiService.blockConversation(
        conversationId,
        "unblock"
      );
      if (result.success) {
        setIsBlocked(false);
        setShowOptions(false);
        Alert.alert("Success", "Candidate has been unblocked");
      } else {
        Alert.alert("Error", result.message || "Failed to unblock candidate");
      }
    } catch (error) {
      console.error("Error unblocking candidate:", error);
      Alert.alert("Error", "Failed to unblock candidate");
    }
  };

  const handleTyping = (text) => {
    setMessageText(text);

    // Simulate showing typing indicator from other party
    // In a real app, you'd emit a typing event to the backend
    if (text.length > 0 && !isTyping) {
      // Randomly show typing indicator (30% chance) to simulate other party typing
      if (Math.random() > 0.7) {
        setIsTyping(true);
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        typingTimeoutRef.current = setTimeout(() => {
          setIsTyping(false);
        }, 3000);
      }
    }
  };

  const TypingIndicator = () => (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "flex-start",
        paddingHorizontal: theme.spacing.lg,
        marginBottom: theme.spacing.md,
      }}
    >
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 16,
          backgroundColor: theme.colors.primary.teal,
          justifyContent: "center",
          alignItems: "center",
          marginRight: theme.spacing.sm,
          marginTop: 2,
        }}
      >
        <Text
          style={{
            fontSize: theme.typography.sizes.xs,
            fontFamily: theme.typography.fonts.bold,
            color: theme.colors.neutral.white,
          }}
        >
          {candidateData?.initial || "NA"}
        </Text>
      </View>
      <View
        style={{
          backgroundColor: theme.colors.background.card,
          borderRadius: theme.borderRadius.lg,
          padding: theme.spacing.md,
          borderBottomLeftRadius: 4,
          flexDirection: "row",
          alignItems: "center",
          gap: theme.spacing.xs,
        }}
      >
        <View
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: theme.colors.text.tertiary,
          }}
        />
        <View
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: theme.colors.text.tertiary,
          }}
        />
        <View
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: theme.colors.text.tertiary,
          }}
        />
      </View>
    </View>
  );

  const Header = () => (
    <View
      style={{
        backgroundColor: theme.colors.background.card,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border.light,
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              padding: theme.spacing.sm,
              marginRight: theme.spacing.md,
            }}
            activeOpacity={0.7}
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color={theme.colors.text.primary}
            />
          </TouchableOpacity>

          {candidateData?.profileImage ? (
            <Image
              source={{ uri: candidateData.profileImage }}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                marginRight: theme.spacing.md,
              }}
            />
          ) : (
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: theme.colors.primary.teal,
                justifyContent: "center",
                alignItems: "center",
                marginRight: theme.spacing.md,
              }}
            >
              <Text
                style={{
                  fontSize: theme.typography.sizes.base,
                  fontFamily: theme.typography.fonts.bold,
                  color: theme.colors.neutral.white,
                }}
              >
                {candidateData?.initial || "NA"}
              </Text>
            </View>
          )}

          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: theme.typography.sizes.lg,
                fontFamily: theme.typography.fonts.bold,
                color: theme.colors.text.primary,
              }}
              numberOfLines={1}
            >
              {candidateData?.name || "Unknown"}
            </Text>
            {candidateData?.email && (
              <Text
                style={{
                  fontSize: theme.typography.sizes.sm,
                  fontFamily: theme.typography.fonts.regular,
                  color: theme.colors.text.secondary,
                }}
                numberOfLines={1}
              >
                {candidateData.email}
              </Text>
            )}
          </View>
        </View>

        <TouchableOpacity
          onPress={() => setShowOptions(true)}
          style={{
            padding: theme.spacing.sm,
          }}
          activeOpacity={0.7}
        >
          <Ionicons
            name="ellipsis-vertical"
            size={20}
            color={theme.colors.text.primary}
          />
        </TouchableOpacity>
      </View>
    </View>
  );

  const MessageItem = ({ item }) => {
    const isOwnMessage = item.sender === "company";

    return (
      <View
        style={{
          flexDirection: "row",
          justifyContent: isOwnMessage ? "flex-end" : "flex-start",
          alignItems: "flex-start",
          paddingHorizontal: theme.spacing.lg,
          marginBottom: theme.spacing.md,
        }}
      >
        {!isOwnMessage && (
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: theme.colors.primary.teal,
              justifyContent: "center",
              alignItems: "center",
              marginRight: theme.spacing.sm,
              marginTop: 2,
            }}
          >
            <Text
              style={{
                fontSize: theme.typography.sizes.xs,
                fontFamily: theme.typography.fonts.bold,
                color: theme.colors.neutral.white,
              }}
            >
              {candidateData?.initial || "NA"}
            </Text>
          </View>
        )}

        <View
          style={{
            maxWidth: width * 0.75,
            backgroundColor: isOwnMessage
              ? theme.colors.primary.teal
              : theme.colors.background.card,
            borderRadius: theme.borderRadius.lg,
            padding: theme.spacing.md,
            borderBottomRightRadius: isOwnMessage ? 4 : theme.borderRadius.lg,
            borderBottomLeftRadius: isOwnMessage ? theme.borderRadius.lg : 4,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 2,
            elevation: 2,
          }}
        >
          {item.type === "file" ? (
            <TouchableOpacity
              onPress={() => handleFileOpen(item)}
              activeOpacity={0.7}
            >
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: theme.borderRadius.md,
                    backgroundColor: isOwnMessage
                      ? "rgba(255,255,255,0.2)"
                      : theme.colors.background.accent,
                    justifyContent: "center",
                    alignItems: "center",
                    marginRight: theme.spacing.sm,
                  }}
                >
                  <Ionicons
                    name={getFileIcon(
                      item.fileUrl || item.file_url,
                      item.mimeType || item.mime_type,
                      item.fileName || item.fileOriginalName || item.file_name
                    )}
                    size={20}
                    color={
                      isOwnMessage
                        ? theme.colors.neutral.white
                        : theme.colors.primary.teal
                    }
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: theme.typography.sizes.sm,
                      fontFamily: theme.typography.fonts.medium,
                      color: isOwnMessage
                        ? theme.colors.neutral.white
                        : theme.colors.text.primary,
                    }}
                    numberOfLines={1}
                  >
                    {item.fileName ||
                      item.fileOriginalName ||
                      item.file_name ||
                      "File"}
                  </Text>
                  {item.fileSize && (
                    <Text
                      style={{
                        fontSize: theme.typography.sizes.xs,
                        fontFamily: theme.typography.fonts.regular,
                        color: isOwnMessage
                          ? "rgba(255,255,255,0.8)"
                          : theme.colors.text.secondary,
                      }}
                    >
                      {(item.fileSize / 1024).toFixed(2)} KB
                    </Text>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          ) : (
            <Text
              style={{
                fontSize: theme.typography.sizes.base,
                fontFamily: theme.typography.fonts.regular,
                color: isOwnMessage
                  ? theme.colors.neutral.white
                  : theme.colors.text.primary,
                lineHeight: 20,
              }}
            >
              {item.text || item.message}
            </Text>
          )}

          <Text
            style={{
              fontSize: theme.typography.sizes.xs,
              fontFamily: theme.typography.fonts.regular,
              color: isOwnMessage
                ? "rgba(255,255,255,0.7)"
                : theme.colors.text.secondary,
              marginTop: theme.spacing.xs,
            }}
          >
            {new Date(item.timestamp || item.created_at).toLocaleTimeString(
              [],
              {
                hour: "2-digit",
                minute: "2-digit",
              }
            )}
          </Text>
        </View>
      </View>
    );
  };

  const FileViewerModal = () => (
    <Modal
      visible={showFileViewer}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowFileViewer(false)}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.95)",
        }}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            paddingHorizontal: theme.spacing.lg,
            paddingVertical: theme.spacing.md,
            paddingTop:
              Platform.OS === "ios" ? theme.spacing.xxl : theme.spacing.lg,
          }}
        >
          <Text
            style={{
              fontSize: theme.typography.sizes.base,
              fontFamily: theme.typography.fonts.medium,
              color: theme.colors.neutral.white,
              flex: 1,
            }}
            numberOfLines={1}
          >
            {viewerFile?.name || "File"}
          </Text>
          <TouchableOpacity
            onPress={() => setShowFileViewer(false)}
            style={{
              padding: theme.spacing.sm,
              marginLeft: theme.spacing.md,
            }}
            activeOpacity={0.7}
          >
            <Ionicons
              name="close"
              size={28}
              color={theme.colors.neutral.white}
            />
          </TouchableOpacity>
        </View>

        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          {viewerFile?.type === "image" && (
            <>
              <Image
                source={{ uri: viewerFile?.url }}
                style={{
                  width: width,
                  height: height * 0.8,
                }}
                resizeMode="contain"
                onLoadStart={() => setImageLoading(true)}
                onLoadEnd={() => setImageLoading(false)}
                onError={() => {
                  setImageLoading(false);
                  setImageError(true);
                }}
              />
              {imageLoading && (
                <View
                  style={{
                    position: "absolute",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <ActivityIndicator
                    size="large"
                    color={theme.colors.neutral.white}
                  />
                </View>
              )}
              {imageError && (
                <View
                  style={{
                    position: "absolute",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Ionicons
                    name="image-outline"
                    size={64}
                    color={theme.colors.neutral.mediumGray}
                  />
                  <Text
                    style={{
                      marginTop: theme.spacing.md,
                      fontSize: theme.typography.sizes.base,
                      fontFamily: theme.typography.fonts.medium,
                      color: theme.colors.neutral.white,
                    }}
                  >
                    Failed to load image
                  </Text>
                </View>
              )}
            </>
          )}
        </View>
      </View>
    </Modal>
  );

  const OptionsModal = () => (
    <Modal
      visible={showOptions}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowOptions(false)}
    >
      <TouchableOpacity
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.5)",
          justifyContent: "flex-end",
        }}
        activeOpacity={1}
        onPress={() => setShowOptions(false)}
      >
        <View
          style={{
            backgroundColor: theme.colors.background.card,
            borderTopLeftRadius: theme.borderRadius.xl,
            borderTopRightRadius: theme.borderRadius.xl,
            paddingBottom: theme.spacing.xl,
          }}
        >
          <View
            style={{
              alignItems: "center",
              paddingVertical: theme.spacing.md,
            }}
          >
            <View
              style={{
                width: 40,
                height: 4,
                backgroundColor: theme.colors.neutral.mediumGray,
                borderRadius: 2,
              }}
            />
          </View>

          {/* Show ONLY unblock option if blocked by me */}
          {blockedByMe ? (
            <TouchableOpacity
              onPress={() => {
                setShowOptions(false);
                handleUnblockCandidate();
              }}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: theme.spacing.xl,
                paddingVertical: theme.spacing.lg,
              }}
              activeOpacity={0.7}
            >
              <Ionicons
                name="checkmark-circle"
                size={24}
                color={theme.colors.status.success}
                style={{ marginRight: theme.spacing.md }}
              />
              <Text
                style={{
                  fontSize: theme.typography.sizes.base,
                  fontFamily: theme.typography.fonts.medium,
                  color: theme.colors.status.success,
                }}
              >
                Unblock Candidate
              </Text>
            </TouchableOpacity>
          ) : !isBlocked ? (
            /* Show block option only if NOT blocked by anyone */
            <TouchableOpacity
              onPress={() => {
                setShowOptions(false);
                setShowBlockModal(true);
              }}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: theme.spacing.xl,
                paddingVertical: theme.spacing.lg,
              }}
              activeOpacity={0.7}
            >
              <Ionicons
                name="ban"
                size={24}
                color={theme.colors.status.error}
                style={{ marginRight: theme.spacing.md }}
              />
              <Text
                style={{
                  fontSize: theme.typography.sizes.base,
                  fontFamily: theme.typography.fonts.medium,
                  color: theme.colors.status.error,
                }}
              >
                Block Candidate
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </TouchableOpacity>
    </Modal>
  );

  const BlockModal = () => (
    <Modal
      visible={showBlockModal}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowBlockModal(false)}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.5)",
          justifyContent: "center",
          alignItems: "center",
          paddingHorizontal: theme.spacing.xl,
        }}
      >
        <View
          style={{
            backgroundColor: theme.colors.background.card,
            borderRadius: theme.borderRadius.xl,
            padding: theme.spacing.xl,
            width: "100%",
            maxWidth: 400,
          }}
        >
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: theme.colors.status.errorLight,
              justifyContent: "center",
              alignItems: "center",
              marginBottom: theme.spacing.lg,
            }}
          >
            <Ionicons name="ban" size={24} color={theme.colors.status.error} />
          </View>

          <Text
            style={{
              fontSize: theme.typography.sizes.xl,
              fontFamily: theme.typography.fonts.bold,
              color: theme.colors.text.primary,
              marginBottom: theme.spacing.sm,
            }}
          >
            Block Candidate?
          </Text>

          <Text
            style={{
              fontSize: theme.typography.sizes.base,
              fontFamily: theme.typography.fonts.regular,
              color: theme.colors.text.secondary,
              marginBottom: theme.spacing.xl,
              lineHeight: 22,
            }}
          >
            You won't be able to send or receive messages from this candidate.
            They won't be notified.
          </Text>

          <View style={{ flexDirection: "row", gap: theme.spacing.md }}>
            <TouchableOpacity
              onPress={() => setShowBlockModal(false)}
              style={{
                flex: 1,
                backgroundColor: theme.colors.neutral.lightGray,
                borderRadius: theme.borderRadius.lg,
                paddingVertical: theme.spacing.md,
                alignItems: "center",
              }}
              activeOpacity={0.8}
            >
              <Text
                style={{
                  fontSize: theme.typography.sizes.base,
                  fontFamily: theme.typography.fonts.semiBold,
                  color: theme.colors.text.secondary,
                }}
              >
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleBlockCandidate}
              style={{
                flex: 1,
                backgroundColor: theme.colors.status.error,
                borderRadius: theme.borderRadius.lg,
                paddingVertical: theme.spacing.md,
                alignItems: "center",
              }}
              activeOpacity={0.9}
            >
              <Text
                style={{
                  fontSize: theme.typography.sizes.base,
                  fontFamily: theme.typography.fonts.semiBold,
                  color: theme.colors.neutral.white,
                }}
              >
                Block
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  if (isLoadingMessages) {
    return (
      <SafeAreaWrapper>
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: theme.colors.background.primary,
          }}
        >
          <ActivityIndicator size="large" color={theme.colors.primary.teal} />
          <Text
            style={{
              marginTop: theme.spacing.md,
              fontSize: theme.typography.sizes.base,
              fontFamily: theme.typography.fonts.medium,
              color: theme.colors.text.secondary,
            }}
          >
            Loading messages...
          </Text>
        </View>
      </SafeAreaWrapper>
    );
  }

  return (
    <SafeAreaWrapper>
      <View
        style={{ flex: 1, backgroundColor: theme.colors.background.primary }}
      >
        <StatusBar
          barStyle="dark-content"
          backgroundColor={theme.colors.background.card}
        />
        <Header />

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
        >
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={({ item }) => <MessageItem item={item} />}
            keyExtractor={(item) => item.id}
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingVertical: theme.spacing.md }}
            showsVerticalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            maintainVisibleContentPosition={{
              minIndexForVisible: 0,
              autoscrollToTopThreshold: 10,
            }}
            ListFooterComponent={isTyping ? <TypingIndicator /> : null}
          />

          {!isBlocked && (
            <View
              style={{
                backgroundColor: theme.colors.background.card,
                borderTopWidth: 1,
                borderTopColor: theme.colors.border.light,
                paddingHorizontal: theme.spacing.lg,
                paddingVertical: theme.spacing.md,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "flex-end",
                  gap: theme.spacing.sm,
                }}
              >
                <TouchableOpacity
                  onPress={handleFileRequest}
                  disabled={isSending || isBlocked}
                  style={{
                    padding: theme.spacing.sm,
                    borderRadius: theme.borderRadius.full,
                    backgroundColor:
                      isSending || isBlocked
                        ? theme.colors.neutral.mediumGray
                        : theme.colors.background.accent,
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={
                      isSending || isBlocked
                        ? "hourglass-outline"
                        : "attach-outline"
                    }
                    size={20}
                    color={
                      isSending || isBlocked
                        ? theme.colors.neutral.white
                        : theme.colors.primary.teal
                    }
                  />
                </TouchableOpacity>

                <View
                  style={{
                    flex: 1,
                    backgroundColor: theme.colors.neutral.lightGray,
                    borderRadius: theme.borderRadius.lg,
                    paddingHorizontal: theme.spacing.md,
                    paddingVertical: theme.spacing.sm,
                    maxHeight: 100,
                  }}
                >
                  <TextInput
                    value={messageText}
                    onChangeText={handleTyping}
                    placeholder={
                      isBlocked
                        ? "Messaging is disabled"
                        : "Type your message..."
                    }
                    placeholderTextColor={theme.colors.text.placeholder}
                    multiline
                    editable={!isBlocked}
                    style={{
                      fontSize: theme.typography.sizes.base,
                      fontFamily: theme.typography.fonts.regular,
                      color: isBlocked
                        ? theme.colors.neutral.mediumGray
                        : theme.colors.text.primary,
                      textAlignVertical: "top",
                    }}
                  />
                </View>

                <TouchableOpacity
                  onPress={sendMessage}
                  disabled={!messageText.trim() || isSending || isBlocked}
                  style={{
                    padding: theme.spacing.sm,
                    borderRadius: theme.borderRadius.full,
                    overflow: "hidden",
                  }}
                  activeOpacity={0.9}
                >
                  <LinearGradient
                    colors={
                      messageText.trim() && !isSending && !isBlocked
                        ? [
                            theme.colors.primary.teal,
                            theme.colors.secondary.darkTeal,
                          ]
                        : [
                            theme.colors.neutral.mediumGray,
                            theme.colors.neutral.mediumGray,
                          ]
                    }
                    style={{
                      padding: theme.spacing.sm,
                      borderRadius: theme.borderRadius.full,
                    }}
                  >
                    <Ionicons
                      name="send"
                      size={18}
                      color={theme.colors.neutral.white}
                    />
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {isBlocked && (
            <View
              style={{
                backgroundColor: blockedByMe
                  ? theme.colors.status.error // Red if I blocked
                  : theme.colors.status.warning, // Orange if they blocked
                paddingHorizontal: theme.spacing.lg,
                paddingVertical: theme.spacing.md,
                alignItems: "center",
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Ionicons
                  name="ban"
                  size={18}
                  color={theme.colors.neutral.white}
                  style={{ marginRight: theme.spacing.sm }}
                />
                <Text
                  style={{
                    fontSize: theme.typography.sizes.base,
                    fontFamily: theme.typography.fonts.medium,
                    color: theme.colors.neutral.white,
                  }}
                >
                  {blockedByMe
                    ? "You have blocked this candidate"
                    : "This candidate has blocked you"}
                </Text>
              </View>
            </View>
          )}
        </KeyboardAvoidingView>

        <OptionsModal />
        <BlockModal />
        <FileViewerModal />
      </View>
    </SafeAreaWrapper>
  );
}
