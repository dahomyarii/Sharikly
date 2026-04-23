import { AdminSupportThreadScreen } from "@/features/chat/screens/AdminSupportThreadScreen";
import { ChatInboxScreen } from "@/features/chat/screens/ChatInboxScreen";
import { ChatRoomScreen } from "@/features/chat/screens/ChatRoomScreen";
import { NotificationsScreen } from "@/features/notifications/screens/NotificationsScreen";
import type { InboxStackParamList } from "@/navigation/types";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

const Stack = createNativeStackNavigator<InboxStackParamList>();

export function InboxStackNavigator(): React.ReactElement {
  return (
    <Stack.Navigator initialRouteName="ChatInbox">
      <Stack.Screen name="ChatInbox" component={ChatInboxScreen} options={{ title: "Chat" }} />
      <Stack.Screen name="ChatRoom" component={ChatRoomScreen} options={{ title: "Conversation" }} />
      <Stack.Screen name="AdminSupportThread" component={AdminSupportThreadScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
    </Stack.Navigator>
  );
}
