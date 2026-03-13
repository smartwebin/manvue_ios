import SafeAreaWrapper from "@/components/SafeAreaWrapper";
import { Stack } from "expo-router";
import "react-native-reanimated";

export default function JobLayout() {
  return (
    <SafeAreaWrapper>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="message-details/[id]" />
        <Stack.Screen name="notifications" />
      </Stack>
    </SafeAreaWrapper>
  );
}
