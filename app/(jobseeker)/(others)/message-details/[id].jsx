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
  View
} from "react-native";

const { width, height } = Dimensions.get("window");

export default function MessageDetails() {
  const receivedData = useLocalSearchParams();
  const conversationId = receivedData.id;
  const [messageText, setMessageText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef(null);
  const [showOptions, setShowOptions] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedReason, setSelectedReason] = useState("");
  const [isBlocked, setIsBlocked] = useState(false);
  const [isSendingFile, setIsSendingFile] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const flatListRef = useRef(null);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [blockedByMe, setBlockedByMe] = useState(false);
  const [blockedByOther, setBlockedByOther] = useState(false);
  const [canUnblock, setCanUnblock] = useState(false);
  const [companyData, setCompanyData] = useState(null);
  const [messages, setMessages] = useState([]);
  const [conversationInfo, setConversationInfo] = useState(null);

  const [showFileViewer, setShowFileViewer] = useState(false);
  const [viewerFile, setViewerFile] = useState(null);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    if (conversationId) {
      fetchMessages();
      const interval = setInterval(() => fetchMessages(false), 5000);
      return () => clearInterval(interval);
    }
  }, [conversationId]);

  const fetchMessages = async (showLoader = true) => {
    try {
      if (showLoader) setIsLoading(true);
      const result = await apiService.getConversationMessages2(conversationId);

      if (result.success) {
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

        const otherParticipant = result.data.conversation?.other_participant;
        if (otherParticipant) {
          setCompanyData({
            id: otherParticipant.user_id,
            name: otherParticipant.name,
            initial: getInitials(otherParticipant.name),
            isOnline: false,
            lastSeen: "online",
            email: otherParticipant.email,
            profileImage: otherParticipant.profile_image,
          });
        }

        // Set blocked status from conversation
        const conv = result.data.conversation;
        setIsBlocked(conv?.is_blocked || false);
        setBlockedByMe(conv?.blocked_by_me || false);
        setBlockedByOther(conv?.blocked_by_other || false);
        setCanUnblock(conv?.can_unblock || false);

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
      console.error("Error fetching messages:", error);
      if (showLoader) {
        Alert.alert("Error", "Failed to load messages");
      }
    } finally {
      if (showLoader) setIsLoading(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return "??";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const handleScroll = (event) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const distanceFromBottom =
      contentSize.height - (contentOffset.y + layoutMeasurement.height);

    // Consider user "near bottom" if within 100px of the bottom
    setIsNearBottom(distanceFromBottom < 100);
  };

  const getFileType = (url, mimeType, fileName) => {
    const ext =
      fileName?.split(".").pop()?.toLowerCase() ||
      url?.split(".").pop()?.toLowerCase() ||
      "";
    const mime = mimeType?.toLowerCase() || "";

    if (
      mime.includes("image") ||
      ["jpg", "jpeg", "png", "gif", "webp", "bmp"].includes(ext)
    ) {
      return "image";
    }
    if (mime.includes("pdf") || ext === "pdf") {
      return "pdf";
    }
    if (
      mime.includes("document") ||
      mime.includes("word") ||
      mime.includes("text") ||
      ["doc", "docx", "txt", "rtf"].includes(ext)
    ) {
      return "document";
    }
    return "unknown";
  };

  const handleFileOpen = async (item) => {
    try {
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
        setImageLoading(true);
        setImageError(false);
        setViewerFile({
          type: "image",
          url: fullUrl,
          name: fileName,
        });
        setShowFileViewer(true);
      } else if (fileType === "pdf") {
        await WebBrowser.openBrowserAsync(fullUrl);
      } else if (fileType === "document" || fileType === "unknown") {
        const supported = await Linking.canOpenURL(fullUrl);
        if (supported) {
          await Linking.openURL(fullUrl);
        } else {
          await WebBrowser.openBrowserAsync(fullUrl);
        }
      }
    } catch (error) {
      console.error("Error opening file:", error);
      Alert.alert("Error", "Failed to open file");
    }
  };

  const sendMessage = async () => {
    if (messageText.trim() && !isBlocked && !isSending) {
      const tempMessage = {
        id: "temp_" + Date.now(),
        text: messageText.trim(),
        timestamp: new Date().toISOString(),
        sender: "user",
        type: "text",
        status: "sending",
      };

      setMessages((prev) => [...prev, tempMessage]);
      const messageToSend = messageText.trim();
      setMessageText("");

      setTimeout(() => {
        if (flatListRef.current) {
          flatListRef.current.scrollToEnd({ animated: true });
        }
      }, 100);

      try {
        setIsSending(true);
        const result = await apiService.sendMessage2(
          conversationId,
          messageToSend,
          "text"
        );

        if (result.success) {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === tempMessage.id
                ? { ...result.data.message, sender: "user" }
                : msg
            )
          );
        } else {
          setMessages((prev) =>
            prev.filter((msg) => msg.id !== tempMessage.id)
          );
          Alert.alert("Error", result.message || "Failed to send message");
        }
      } catch (error) {
        console.error("Error sending message:", error);
        setMessages((prev) => prev.filter((msg) => msg.id !== tempMessage.id));
        Alert.alert("Error", "Failed to send message");
      } finally {
        setIsSending(false);
      }
    }
  };

  const handleFileUpload = async () => {
    if (isBlocked || isSendingFile) return;

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true,
      });

      if (result.type === "success" || result.assets?.[0]) {
        const file = result.assets?.[0] || result;
        uploadFile(file);
      }
    } catch (error) {
      console.error("Error picking document:", error);
      Alert.alert("Error", "Failed to pick document");
    }
  };

  const uploadFile = async (file) => {
    const tempMessage = {
      id: "temp_" + Date.now(),
      text: file.name,
      timestamp: new Date().toISOString(),
      sender: "user",
      type: "file",
      fileName: file.name,
      fileSize: formatFileSize(file.size),
      status: "sending",
    };

    setMessages((prev) => [...prev, tempMessage]);
    setIsSendingFile(true);

    setTimeout(() => {
      if (flatListRef.current) {
        flatListRef.current.scrollToEnd({ animated: true });
      }
    }, 100);

    try {
      const result = await apiService.sendMessageWithFile(
        conversationId,
        "",
        file
      );

      if (result.success) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === tempMessage.id
              ? { ...result.data.message, sender: "user" }
              : msg
          )
        );
      } else {
        setMessages((prev) => prev.filter((msg) => msg.id !== tempMessage.id));
        Alert.alert("Error", result.message || "Failed to send file");
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      setMessages((prev) => prev.filter((msg) => msg.id !== tempMessage.id));
      Alert.alert("Error", "Failed to upload file");
    } finally {
      setIsSendingFile(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const handleBlockCompany = async () => {
    try {
      const result = await apiService.blockConversation(
        conversationId,
        "block"
      );

      if (result.success) {
        setIsBlocked(true);
        setShowBlockModal(false);
        setShowOptions(false);
        Alert.alert(
          "Success",
          `You have blocked ${companyData?.name}. You will no longer receive messages from them.`
        );
      } else {
        Alert.alert("Error", result.message || "Failed to block company");
      }
    } catch (error) {
      console.error("Error blocking company:", error);
      Alert.alert("Error", "Failed to block company. Please try again.");
    }
  };

  const handleUnblockCompany = async () => {
    try {
      const result = await apiService.blockConversation(
        conversationId,
        "unblock"
      );

      if (result.success) {
        setIsBlocked(false);
        Alert.alert(
          "Success",
          `You have unblocked ${companyData?.name}. You can now receive messages from them.`
        );
      } else {
        Alert.alert("Error", result.message || "Failed to unblock company");
      }
    } catch (error) {
      console.error("Error unblocking company:", error);
      Alert.alert("Error", "Failed to unblock company. Please try again.");
    }
  };

  const handleReportCompany = () => {
    setShowReportModal(false);
    setShowOptions(false);
    Alert.alert(
      "Report Submitted",
      `Thank you for reporting ${companyData?.name}. We will review your report and take appropriate action.`,
      [{ text: "OK" }]
    );
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
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

  const Header = () => (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: theme.colors.background.card,
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
        paddingTop: Platform.OS === "ios" ? theme.spacing.xl : theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border.light,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            marginRight: theme.spacing.md,
            padding: theme.spacing.xs,
          }}
          activeOpacity={0.7}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color={theme.colors.text.primary}
          />
        </TouchableOpacity>

        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: theme.borderRadius.full,
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
            {companyData?.initial || "??"}
          </Text>
        </View>

        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: theme.typography.sizes.base,
              fontFamily: theme.typography.fonts.semiBold,
              color: theme.colors.text.primary,
            }}
            numberOfLines={1}
          >
            {companyData?.name || "Company"}
          </Text>
          <Text
            style={{
              fontSize: theme.typography.sizes.sm,
              fontFamily: theme.typography.fonts.regular,
              color: theme.colors.text.secondary,
            }}
          >
            {companyData?.lastSeen || "Offline"}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        onPress={() => setShowOptions(true)}
        style={{ padding: theme.spacing.xs }}
        activeOpacity={0.7}
      >
        <Ionicons
          name="ellipsis-vertical"
          size={20}
          color={theme.colors.text.primary}
        />
      </TouchableOpacity>
    </View>
  );

  const MessageItem = ({ item }) => {
    const isUser = item.sender === "user" || item.sender === "candidate";
    const isFile = item.type === "file";

    return (
      <View
        style={{
          flexDirection: "row",
          justifyContent: isUser ? "flex-end" : "flex-start",
          alignItems: "flex-start",
          paddingHorizontal: theme.spacing.lg,
          marginBottom: theme.spacing.md,
        }}
      >
        {!isUser && (
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
              {companyData?.initial || "??"}
            </Text>
          </View>
        )}

        <TouchableOpacity
          onPress={() => isFile && handleFileOpen(item)}
          disabled={!isFile}
          activeOpacity={isFile ? 0.7 : 1}
          style={{
            maxWidth: width * 0.75,
            backgroundColor: isUser
              ? theme.colors.primary.teal
              : theme.colors.background.card,
            borderRadius: theme.borderRadius.lg,
            padding: theme.spacing.md,
            borderBottomRightRadius: isUser ? 4 : theme.borderRadius.lg,
            borderBottomLeftRadius: isUser ? theme.borderRadius.lg : 4,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 2,
            elevation: 2,
          }}
        >
          {isFile ? (
            <View>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: theme.spacing.xs,
                }}
              >
                <Ionicons
                  name="document-attach"
                  size={20}
                  color={
                    isUser
                      ? theme.colors.neutral.white
                      : theme.colors.primary.teal
                  }
                  style={{ marginRight: theme.spacing.sm }}
                />
                <Text
                  style={{
                    fontSize: theme.typography.sizes.base,
                    fontFamily: theme.typography.fonts.medium,
                    color: isUser
                      ? theme.colors.neutral.white
                      : theme.colors.text.primary,
                    flex: 1,
                  }}
                  numberOfLines={1}
                >
                  {item.fileName || item.text}
                </Text>
              </View>
              {item.fileSize && (
                <Text
                  style={{
                    fontSize: theme.typography.sizes.xs,
                    fontFamily: theme.typography.fonts.regular,
                    color: isUser
                      ? "rgba(255, 255, 255, 0.8)"
                      : theme.colors.text.secondary,
                    marginBottom: theme.spacing.xs,
                  }}
                >
                  {item.fileSize}
                </Text>
              )}
              <Text
                style={{
                  fontSize: theme.typography.sizes.xs,
                  fontFamily: theme.typography.fonts.medium,
                  color: isUser
                    ? "rgba(255, 255, 255, 0.9)"
                    : theme.colors.primary.teal,
                }}
              >
                Tap to view
              </Text>
            </View>
          ) : (
            <Text
              style={{
                fontSize: theme.typography.sizes.base,
                fontFamily: theme.typography.fonts.regular,
                color: isUser
                  ? theme.colors.neutral.white
                  : theme.colors.text.primary,
                lineHeight: theme.typography.sizes.base * 1.4,
              }}
            >
              {item.text}
            </Text>
          )}

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: theme.spacing.xs,
            }}
          >
            <Text
              style={{
                fontSize: theme.typography.sizes.xs,
                fontFamily: theme.typography.fonts.regular,
                color: isUser
                  ? "rgba(255, 255, 255, 0.8)"
                  : theme.colors.text.tertiary,
              }}
            >
              {formatTime(item.timestamp)}
            </Text>

            {isUser && (
              <View style={{ marginLeft: theme.spacing.xs }}>
                {item.status === "sending" ? (
                  <ActivityIndicator
                    size="small"
                    color="rgba(255, 255, 255, 0.8)"
                  />
                ) : item.status === "read" ? (
                  <Ionicons
                    name="checkmark-done"
                    size={14}
                    color="rgba(255, 255, 255, 0.8)"
                  />
                ) : (
                  <Ionicons
                    name="checkmark"
                    size={14}
                    color="rgba(255, 255, 255, 0.8)"
                  />
                )}
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>
    );
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

  const FileViewerModal = () => (
    <Modal
      visible={showFileViewer}
      transparent
      animationType="fade"
      onRequestClose={() => setShowFileViewer(false)}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0, 0, 0, 0.95)",
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: theme.spacing.lg,
            paddingTop:
              Platform.OS === "ios" ? theme.spacing.xxl : theme.spacing.lg,
            paddingBottom: theme.spacing.md,
          }}
        >
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: theme.typography.sizes.base,
                fontFamily: theme.typography.fonts.medium,
                color: theme.colors.neutral.white,
              }}
              numberOfLines={1}
            >
              {viewerFile?.name || "File"}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => setShowFileViewer(false)}
            style={{
              padding: theme.spacing.sm,
              marginLeft: theme.spacing.md,
            }}
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
                source={{ uri: viewerFile.url }}
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
      transparent
      animationType="fade"
      onRequestClose={() => setShowOptions(false)}
    >
      <SafeAreaWrapper>
        <TouchableOpacity
        style={{
          flex: 1,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
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
            paddingBottom:
              Platform.OS === "ios" ? theme.spacing.xl : theme.spacing.lg,
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

          {/* Show unblock option ONLY if current user blocked it */}
          {blockedByMe ? (
            <TouchableOpacity
              onPress={() => {
                setShowOptions(false);
                handleUnblockCompany();
              }}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: theme.spacing.lg,
                paddingVertical: theme.spacing.md,
              }}
              activeOpacity={0.7}
            >
              <Ionicons
                name="checkmark-circle-outline"
                size={24}
                color={theme.colors.status.success}
              />
              <Text
                style={{
                  marginLeft: theme.spacing.md,
                  fontSize: theme.typography.sizes.base,
                  fontFamily: theme.typography.fonts.medium,
                  color: theme.colors.text.primary,
                }}
              >
                Unblock Company
              </Text>
            </TouchableOpacity>
          ) : !isBlocked ? (
            // Show block option only if conversation is NOT blocked by anyone
            <TouchableOpacity
              onPress={() => {
                setShowOptions(false);
                setShowBlockModal(true);
              }}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: theme.spacing.lg,
                paddingVertical: theme.spacing.md,
              }}
              activeOpacity={0.7}
            >
              <Ionicons
                name="ban-outline"
                size={24}
                color={theme.colors.status.error}
              />
              <Text
                style={{
                  marginLeft: theme.spacing.md,
                  fontSize: theme.typography.sizes.base,
                  fontFamily: theme.typography.fonts.medium,
                  color: theme.colors.text.primary,
                }}
              >
                Block Company
              </Text>
            </TouchableOpacity>
          ) : null}

          {/* Report option - always available if not blocked by me */}
          {/* {!blockedByMe && (
            <TouchableOpacity
              onPress={() => {
                setShowOptions(false);
                setShowReportModal(true);
              }}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: theme.spacing.lg,
                paddingVertical: theme.spacing.md,
              }}
              activeOpacity={0.7}
            >
              <Ionicons
                name="flag-outline"
                size={24}
                color={theme.colors.status.warning}
              />
              <Text
                style={{
                  marginLeft: theme.spacing.md,
                  fontSize: theme.typography.sizes.base,
                  fontFamily: theme.typography.fonts.medium,
                  color: theme.colors.text.primary,
                }}
              >
                Report Company
              </Text>
            </TouchableOpacity>
          )} */}
        </View>
      </TouchableOpacity>
      </SafeAreaWrapper>
    </Modal>
  );

  const BlockModal = () => (
    <Modal
      visible={showBlockModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowBlockModal(false)}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
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
              width: 60,
              height: 60,
              borderRadius: 30,
              backgroundColor: theme.colors.status.errorLight,
              justifyContent: "center",
              alignItems: "center",
              alignSelf: "center",
              marginBottom: theme.spacing.lg,
            }}
          >
            <Ionicons name="ban" size={32} color={theme.colors.status.error} />
          </View>

          <Text
            style={{
              fontSize: theme.typography.sizes.xl,
              fontFamily: theme.typography.fonts.bold,
              color: theme.colors.text.primary,
              textAlign: "center",
              marginBottom: theme.spacing.sm,
            }}
          >
            Block {companyData?.name}?
          </Text>

          <Text
            style={{
              fontSize: theme.typography.sizes.base,
              fontFamily: theme.typography.fonts.regular,
              color: theme.colors.text.secondary,
              textAlign: "center",
              marginBottom: theme.spacing.xl,
              lineHeight: theme.typography.sizes.base * 1.4,
            }}
          >
            They won't be able to send you messages or view your profile.
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
              onPress={handleBlockCompany}
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

  const ReportModal = () => (
    <Modal
      visible={showReportModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowReportModal(false)}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
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
              width: 60,
              height: 60,
              borderRadius: 30,
              backgroundColor: theme.colors.status.warningLight,
              justifyContent: "center",
              alignItems: "center",
              alignSelf: "center",
              marginBottom: theme.spacing.lg,
            }}
          >
            <Ionicons
              name="flag"
              size={32}
              color={theme.colors.status.warning}
            />
          </View>

          <Text
            style={{
              fontSize: theme.typography.sizes.xl,
              fontFamily: theme.typography.fonts.bold,
              color: theme.colors.text.primary,
              textAlign: "center",
              marginBottom: theme.spacing.sm,
            }}
          >
            Report {companyData?.name}
          </Text>

          <Text
            style={{
              fontSize: theme.typography.sizes.base,
              fontFamily: theme.typography.fonts.regular,
              color: theme.colors.text.secondary,
              textAlign: "center",
              marginBottom: theme.spacing.lg,
            }}
          >
            Please select a reason for reporting
          </Text>

          <View style={{ marginBottom: theme.spacing.xl }}>
            {[
              "Spam or misleading",
              "Inappropriate content",
              "Harassment",
              "Scam or fraud",
              "Other",
            ].map((reason) => (
              <TouchableOpacity
                key={reason}
                onPress={() => setSelectedReason(reason)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingVertical: theme.spacing.md,
                  borderBottomWidth: 1,
                  borderBottomColor: theme.colors.border.light,
                }}
                activeOpacity={0.7}
              >
                <View
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 10,
                    borderWidth: 2,
                    borderColor:
                      selectedReason === reason
                        ? theme.colors.primary.teal
                        : theme.colors.border.medium,
                    backgroundColor:
                      selectedReason === reason
                        ? theme.colors.primary.teal
                        : "transparent",
                    marginRight: theme.spacing.md,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  {selectedReason === reason && (
                    <View
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: theme.colors.neutral.white,
                      }}
                    />
                  )}
                </View>
                <Text
                  style={{
                    fontSize: theme.typography.sizes.base,
                    fontFamily: theme.typography.fonts.regular,
                    color: theme.colors.text.primary,
                  }}
                >
                  {reason}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={{ flexDirection: "row", gap: theme.spacing.md }}>
            <TouchableOpacity
              onPress={() => setShowReportModal(false)}
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
              onPress={handleReportCompany}
              disabled={!selectedReason}
              style={{
                flex: 1,
                backgroundColor: selectedReason
                  ? theme.colors.status.warning
                  : theme.colors.neutral.mediumGray,
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
                Report
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: theme.colors.background.primary,
          justifyContent: "center",
          alignItems: "center",
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
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background.primary }}>
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
                onPress={handleFileUpload}
                disabled={isSendingFile}
                style={{
                  padding: theme.spacing.sm,
                  borderRadius: theme.borderRadius.full,
                  backgroundColor: isSendingFile
                    ? theme.colors.neutral.mediumGray
                    : theme.colors.background.accent,
                }}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={isSendingFile ? "hourglass-outline" : "attach-outline"}
                  size={20}
                  color={
                    isSendingFile
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
                  placeholder="Type your message..."
                  placeholderTextColor={theme.colors.text.placeholder}
                  multiline
                  style={{
                    fontSize: theme.typography.sizes.base,
                    fontFamily: theme.typography.fonts.regular,
                    color: theme.colors.text.primary,
                    textAlignVertical: "top",
                  }}
                />
              </View>

              <TouchableOpacity
                onPress={sendMessage}
                disabled={!messageText.trim() || isSending}
                style={{
                  padding: theme.spacing.sm,
                  borderRadius: theme.borderRadius.full,
                  overflow: "hidden",
                }}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={
                    messageText.trim() && !isSending
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
                ? theme.colors.status.error
                : theme.colors.status.warning,
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
                  textAlign: "center",
                }}
              >
                {blockedByMe
                  ? "You have blocked this company"
                  : "This company has blocked you"}
              </Text>
            </View>
          </View>
        )}
      </KeyboardAvoidingView>

      <FileViewerModal />
      <OptionsModal />
      <BlockModal />
      <ReportModal />
    </View>
  );
}
