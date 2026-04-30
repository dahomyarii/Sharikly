import type { NavigatorScreenParams } from "@react-navigation/native";

export type HomeStackParamList = {
  Home: undefined;
};

export type ListingsStackParamList = {
  ListingsExplore: { search?: string } | undefined;
  CreateListing: undefined;
  ListingDetail: { id: number };
  EditListing: { id: number };
  RequestBooking: { id: number };
  ListingAvailability: { id: number };
  ListingAvailabilityBlocks: { id: number };
};

export type BookingsStackParamList = {
  BookingsRenter: undefined;
  BookingReceipt: { id: number };
  HostBookings: undefined;
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
  ChatRoom: { roomId: number };
  AdminSupportThread: undefined;
  Notifications: undefined;
};

export type ProfileStackParamList = {
  Profile: undefined;
  Settings: undefined;
  Favorites: undefined;
  MyReports: undefined;
  Contact: undefined;
  AdminMessages: undefined;
  AdminBlog: undefined;
  BlogList: undefined;
  BlogPost: { id: number };
  PublicProfile: { userId: number };
  HostArea: undefined;
  About: undefined;
  HowItWorks: undefined;
  Careers: undefined;
  Privacy: undefined;
  Terms: undefined;
  // Moved from Inbox
  ChatInbox: undefined;
  ChatRoom: { roomId: number };
  AdminSupportThread: undefined;
  Notifications: undefined;
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
  ListingDetailModal: { id: number };
};

declare global {
  namespace ReactNavigation {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface RootParamList extends RootStackParamList {}
  }
}
