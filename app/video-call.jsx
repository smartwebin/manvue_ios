import theme from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { Camera } from "expo-camera";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  ChannelProfileType,
  ClientRoleType,
  createAgoraRtcEngine,
  RtcSurfaceView,
} from "react-native-agora";

// Replace with your Agora App ID
const APP_ID = "3b8f137a16c144cca0d2bd34227ba771";

export default function VideoCallScreen() {
  const params = useLocalSearchParams();
  const { interviewId, audio, channelName } = params;

  const [localUid, setLocalUid] = useState(0);
  const [remoteUid, setRemoteUid] = useState(0);
  const [isJoined, setIsJoined] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [videoDisabled, setVideoDisabled] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [isConnecting, setIsConnecting] = useState(false);
  const [audioOnly, setAudioOnly] = useState(false);

  const engineRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    if (audio === "true" || audio === "1") {
      setAudioOnly(true);
      setVideoDisabled(true);
    }
    initAgora();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      leaveChannel();
      engineRef.current?.release();
    };
  }, []);

  // Call duration timer
  useEffect(() => {
    if (isJoined) {
      timerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      setCallDuration(0);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isJoined]);

  const toggleVideo = () => {
    if (!engineRef.current || audioOnly) return;
    engineRef.current.muteLocalVideoStream(!videoDisabled);
    setVideoDisabled(!videoDisabled);
  };

  const initAgora = async () => {
    try {
      // Request permissions
      const { status: cameraStatus } =
        await Camera.requestCameraPermissionsAsync();
      const { status: micStatus } =
        await Camera.requestMicrophonePermissionsAsync();

      if (cameraStatus !== "granted" || micStatus !== "granted") {
        Alert.alert(
          "Permissions Required",
          "Camera and microphone permissions are required for video calls",
          [
            {
              text: "OK",
              onPress: () => router.back(),
            },
          ]
        );
        return;
      }

      // Create engine
      const engine = createAgoraRtcEngine();
      engineRef.current = engine;

      // Initialize
      engine.initialize({
        appId: APP_ID,
        channelProfile: ChannelProfileType.ChannelProfileCommunication,
      });

      // Enable video or audio based on mode
      if (audioOnly) {
        engine.enableAudio();
        engine.disableVideo();
      } else {
        engine.enableVideo();
        engine.setVideoEncoderConfiguration({
          dimensions: { width: 1280, height: 720 },
          frameRate: 30,
          bitrate: 0,
          minBitrate: -1,
          orientationMode: 0,
          degradationPreference: 2,
          mirrorMode: 0,
        });
      }

      // Register event handlers
      engine.registerEventHandler({
        onJoinChannelSuccess: (connection, elapsed) => {
          console.log("✅ Joined channel successfully");
          setIsJoined(true);
          setLocalUid(connection.localUid);
          setIsConnecting(false);
        },
        onUserJoined: (connection, uid, elapsed) => {
          console.log("👤 Remote user joined:", uid);
          setRemoteUid(uid);
        },
        onUserOffline: (connection, uid, reason) => {
          console.log("👋 Remote user left:", uid);
          setRemoteUid(0);
        },
        onLeaveChannel: (connection, stats) => {
          console.log("👋 Left channel");
          setIsJoined(false);
          setRemoteUid(0);
        },
        onError: (err, msg) => {
          console.error("❌ Agora Error:", err, msg);
          Alert.alert(
            "Connection Error",
            "Failed to connect to video call. Please try again."
          );
        },
      });

      // Auto-join channel
      setTimeout(() => {
        joinChannel();
      }, 500);
    } catch (error) {
      console.error("❌ Error initializing Agora:", error);
      Alert.alert(
        "Error",
        "Failed to initialize video call. Please try again.",
        [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ]
      );
    }
  };

  const joinChannel = async () => {
    if (!engineRef.current) return;

    try {
      setIsConnecting(true);

      await engineRef.current.joinChannel(null, channelName, 0, {
        clientRoleType: ClientRoleType.ClientRoleBroadcaster,
      });

      console.log("🔗 Joining channel:", channelName);
    } catch (error) {
      console.error("❌ Error joining channel:", error);
      setIsConnecting(false);
      Alert.alert("Error", "Failed to join video call. Please try again.");
    }
  };

  const leaveChannel = async () => {
    if (!engineRef.current) return;

    try {
      await engineRef.current.leaveChannel();

      Alert.alert("Call Ended", "You have left the interview call.", [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      console.error("❌ Error leaving channel:", error);
      router.back();
    }
  };

  const toggleMute = () => {
    if (!engineRef.current) return;
    engineRef.current.muteLocalAudioStream(!isMuted);
    setIsMuted(!isMuted);
  };

  const switchCamera = () => {
    if (!engineRef.current || audioOnly) return;
    engineRef.current.switchCamera();
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Remote Video */}
      <View style={styles.remoteView}>
        {remoteUid > 0 && !audioOnly ? (
          <RtcSurfaceView canvas={{ uid: remoteUid }} style={styles.video} />
        ) : (
          <View style={styles.placeholder}>
            <View style={styles.placeholderIconContainer}>
              <Ionicons
                name="person-outline"
                size={64}
                color={theme.colors.neutral.white}
              />
            </View>
            <Text style={styles.placeholderText}>
              {isConnecting
                ? "Connecting..."
                : "Waiting for the other participant..."}
            </Text>
          </View>
        )}
      </View>

      {/* Local Video - Only show if NOT audio-only */}
      {!audioOnly && (
        <View style={styles.localView}>
          {isJoined && !videoDisabled ? (
            <RtcSurfaceView
              canvas={{ uid: 0 }}
              style={styles.video}
              zOrderMediaOverlay={true}
            />
          ) : (
            <View style={styles.localPlaceholder}>
              <Ionicons
                name="mic"
                size={32}
                color={theme.colors.neutral.white}
              />
            </View>
          )}
        </View>
      )}

      {/* Top Bar */}
      <View style={styles.topBar}>
        <View style={styles.durationContainer}>
          <View style={styles.recordingIndicator} />
          <Text style={styles.durationText}>
            {formatDuration(callDuration)}
          </Text>
        </View>

        {!audioOnly && (
          <TouchableOpacity
            style={styles.switchCameraButton}
            onPress={switchCamera}
          >
            <Ionicons
              name="camera-reverse-outline"
              size={24}
              color={theme.colors.neutral.white}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.controlButton, isMuted && styles.controlButtonActive]}
          onPress={toggleMute}
        >
          <Ionicons
            name={isMuted ? "mic-off" : "mic"}
            size={24}
            color={theme.colors.neutral.white}
          />
          <Text style={styles.controlLabel}>{isMuted ? "Unmute" : "Mute"}</Text>
        </TouchableOpacity>

        {!audioOnly && (
          <TouchableOpacity
            style={[
              styles.controlButton,
              videoDisabled && styles.controlButtonActive,
            ]}
            onPress={toggleVideo}
          >
            <Ionicons
              name={videoDisabled ? "videocam-off" : "videocam"}
              size={24}
              color={theme.colors.neutral.white}
            />
            <Text style={styles.controlLabel}>Video</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.endCallButton} onPress={leaveChannel}>
          <Ionicons name="call" size={28} color={theme.colors.neutral.white} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  remoteView: {
    flex: 1,
  },
  localView: {
    position: "absolute",
    top: 80,
    right: 20,
    width: 120,
    height: 160,
    backgroundColor: "#333",
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: theme.colors.primary.teal,
  },
  video: {
    flex: 1,
  },
  placeholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
  },
  placeholderIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  placeholderText: {
    color: theme.colors.neutral.white,
    fontSize: 16,
    fontFamily: theme.typography.fonts.medium,
    textAlign: "center",
    paddingHorizontal: 40,
  },
  localPlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#2a2a2a",
  },
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  durationContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  recordingIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.status.error,
    marginRight: 8,
  },
  durationText: {
    color: theme.colors.neutral.white,
    fontSize: 14,
    fontFamily: theme.typography.fonts.semiBold,
  },
  switchCameraButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  controls: {
    position: "absolute",
    bottom: 50,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 24,
    paddingHorizontal: 20,
  },
  controlButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  controlButtonActive: {
    backgroundColor: theme.colors.status.error,
  },
  controlLabel: {
    position: "absolute",
    bottom: -20,
    color: theme.colors.neutral.white,
    fontSize: 10,
    fontFamily: theme.typography.fonts.medium,
  },
  endCallButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: theme.colors.status.error,
    justifyContent: "center",
    alignItems: "center",
    transform: [{ rotate: "135deg" }],
  },
});