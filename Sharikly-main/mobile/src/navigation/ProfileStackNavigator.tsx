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
import { ChangePasswordScreen } from "@/features/profile/screens/ChangePasswordScreen";
import { EditProfileScreen } from "@/features/profile/screens/EditProfileScreen";
import { NotificationPreferencesScreen } from "@/features/profile/screens/NotificationPreferencesScreen";
import { BlockedUsersScreen } from "@/features/profile/screens/BlockedUsersScreen";
import {
  PhoneAndEmailScreen,
  LanguageScreen,
  PaymentMethodsScreen,
  PayoutMethodsScreen,
  PayoutScheduleScreen,
  SmartPricingScreen,
  InstantBookingScreen,
  DepositSettingsScreen,
  AvailabilityDefaultsScreen,
  HelpCenterScreen,
  ContactSupportScreen,
  ReportIssueScreen
} from "@/features/profile/screens/SettingsPlaceholderScreens";
import { HostStackNavigator } from "@/navigation/HostStackNavigator";
import type { ProfileStackParamList } from "@/navigation/types";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export function ProfileStackNavigator(): React.ReactElement {
  return (
    <Stack.Navigator initialRouteName="Profile">
      <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: "Profile" }} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
      <Stack.Screen name="NotificationPreferences" component={NotificationPreferencesScreen} />
      <Stack.Screen name="BlockedUsers" component={BlockedUsersScreen} />
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
      
      {/* Settings Placeholders */}
      <Stack.Screen name="PhoneAndEmail" component={PhoneAndEmailScreen} />
      <Stack.Screen name="Language" component={LanguageScreen} />
      <Stack.Screen name="PaymentMethods" component={PaymentMethodsScreen} />
      <Stack.Screen name="PayoutMethods" component={PayoutMethodsScreen} />
      <Stack.Screen name="PayoutSchedule" component={PayoutScheduleScreen} />
      <Stack.Screen name="SmartPricing" component={SmartPricingScreen} />
      <Stack.Screen name="InstantBooking" component={InstantBookingScreen} />
      <Stack.Screen name="DepositSettings" component={DepositSettingsScreen} />
      <Stack.Screen name="AvailabilityDefaults" component={AvailabilityDefaultsScreen} />
      <Stack.Screen name="HelpCenter" component={HelpCenterScreen} />
      <Stack.Screen name="ContactSupport" component={ContactSupportScreen} />
      <Stack.Screen name="ReportIssue" component={ReportIssueScreen} />
    </Stack.Navigator>
  );
}
