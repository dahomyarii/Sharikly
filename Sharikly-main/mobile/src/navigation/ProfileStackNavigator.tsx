import { AdminSupportThreadScreen } from "@/features/chat/screens/AdminSupportThreadScreen";
import { BlogListScreen } from "@/features/blog/screens/BlogListScreen";
import { BlogPostScreen } from "@/features/blog/screens/BlogPostScreen";
import { ChatInboxScreen } from "@/features/chat/screens/ChatInboxScreen";
import { ChatRoomScreen } from "@/features/chat/screens/ChatRoomScreen";
import { NotificationsScreen } from "@/features/notifications/screens/NotificationsScreen";
import {
  AboutScreen,
  CareersScreen,
  HowItWorksScreen,
  PrivacyScreen,
  TermsScreen,
} from "@/features/marketing/screens";
import { FavoritesScreen } from "@/features/profile/screens/FavoritesScreen";
import { ProfileScreen } from "@/features/profile/screens/ProfileScreen";
import { PublicProfileScreen } from "@/features/profile/screens/PublicProfileScreen";
import { SettingsScreen } from "@/features/profile/screens/SettingsScreen";
import { AdminBlogScreen } from "@/features/support/screens/AdminBlogScreen";
import { AdminMessagesScreen } from "@/features/support/screens/AdminMessagesScreen";
import { ContactScreen } from "@/features/support/screens/ContactScreen";
import { MyReportsScreen } from "@/features/support/screens/MyReportsScreen";
import { HostStackNavigator } from "@/navigation/HostStackNavigator";
import type { ProfileStackParamList } from "@/navigation/types";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export function ProfileStackNavigator(): React.ReactElement {
  return (
    <Stack.Navigator initialRouteName="Profile">
      <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: "Profile" }} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="Favorites" component={FavoritesScreen} />
      <Stack.Screen name="MyReports" component={MyReportsScreen} />
      <Stack.Screen name="Contact" component={ContactScreen} />
      <Stack.Screen name="AdminMessages" component={AdminMessagesScreen} />
      <Stack.Screen name="AdminBlog" component={AdminBlogScreen} />
      <Stack.Screen name="BlogList" component={BlogListScreen} />
      <Stack.Screen name="BlogPost" component={BlogPostScreen} />
      <Stack.Screen name="PublicProfile" component={PublicProfileScreen} />
      <Stack.Screen
        name="HostArea"
        component={HostStackNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen name="About" component={AboutScreen} />
      <Stack.Screen name="HowItWorks" component={HowItWorksScreen} />
      <Stack.Screen name="Careers" component={CareersScreen} />
      <Stack.Screen name="Privacy" component={PrivacyScreen} />
      <Stack.Screen name="Terms" component={TermsScreen} />
      {/* Moved from Inbox */}
      <Stack.Screen name="ChatInbox" component={ChatInboxScreen} options={{ title: "Messages" }} />
      <Stack.Screen name="ChatRoom" component={ChatRoomScreen} options={{ title: "Conversation" }} />
      <Stack.Screen name="AdminSupportThread" component={AdminSupportThreadScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
    </Stack.Navigator>
  );
}
