import type { NavigatorScreenParams } from "@react-navigation/native";

export type HomeStackParamList = {
  Home: undefined;
};

export type ListingsStackParamList = {
  ListingsExplore: { search?: string } | undefined;
};

export type BookingsStackParamList = {
  Bookings: { segment?: "renting" | "host" } | undefined;
  BookingReceipt: { id: number };
};

export type HostStackParamList = {
  HostOverview: undefined;
  HostEarnings: undefined;
  HostListings: undefined;
  HostOpportunities: undefined;
  Earnings: undefined;
  CommunityEarnings: undefined;
  TopHosts: undefined;
  StartRenting: undefined;
};

export type InboxStackParamList = {
  ChatInbox: undefined;
  AdminSupportThread: undefined;
  Notifications: undefined;
};

export type ProfileStackParamList = {
  Profile: undefined;
  EditProfile: undefined;
  Settings: undefined;
  Favorites: undefined;
  MyReports: undefined;
  Contact: undefined;
  AdminMessages: undefined;
  AdminBlog: undefined;
  BlogList: undefined;
  BlogPost: { id: number };
  HostArea: undefined;
  About: undefined;
  HowItWorks: undefined;
  Careers: undefined;
  Privacy: undefined;
  Terms: undefined;
  // Moved from Inbox
  ChatInbox: undefined;
  AdminSupportThread: undefined;
  ChangePassword: undefined;
  NotificationPreferences: undefined;
  BlockedUsers: undefined;
  Notifications: undefined;
  // Settings placeholders
  PhoneAndEmail: undefined;
  Language: undefined;
  PaymentMethods: undefined;
  PayoutMethods: undefined;
  PayoutSchedule: undefined;
  SmartPricing: undefined;
  InstantBooking: undefined;
  DepositSettings: undefined;
  AvailabilityDefaults: undefined;
  HelpCenter: undefined;
  ContactSupport: undefined;
  ReportIssue: undefined;
};

export type MainTabParamList = {
  HomeTab: NavigatorScreenParams<HomeStackParamList> | undefined;
  ExploreTab: NavigatorScreenParams<ListingsStackParamList> | undefined;
  InboxTab: NavigatorScreenParams<InboxStackParamList> | undefined;
  BookingsTab: NavigatorScreenParams<BookingsStackParamList> | undefined;
  ProfileTab: NavigatorScreenParams<ProfileStackParamList> | undefined;
};

export type AuthStackParamList = {
  Login: { message?: string } | undefined;
  Register: undefined;
  ForgotPassword: undefined;
  ResetPassword: { token?: string } | undefined;
  ResendVerification: undefined;
  VerifyEmail: Record<string, string | undefined> | undefined;
};

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  // Shared "leaf" screens live above the tabs so they open over the current
  // tab and the back arrow returns to wherever the user came from.
  ListingDetail: { id: number };
  CreateListing: undefined;
  EditListing: { id: number };
  RequestBooking: { id: number; start?: string; end?: string };
  ListingAvailability: { id: number };
  ListingAvailabilityBlocks: { id: number };
  PublicProfile: { userId: number };
  ChatRoom: { roomId: number };
};

declare global {
  namespace ReactNavigation {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface RootParamList extends RootStackParamList {}
  }
}
