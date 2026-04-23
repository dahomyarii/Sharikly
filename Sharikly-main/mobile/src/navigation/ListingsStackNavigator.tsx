import { CreateListingScreen } from "@/features/listings/screens/CreateListingScreen";
import { EditListingScreen } from "@/features/listings/screens/EditListingScreen";
import { ListingAvailabilityBlocksScreen } from "@/features/listings/screens/ListingAvailabilityBlocksScreen";
import { ListingAvailabilityScreen } from "@/features/listings/screens/ListingAvailabilityScreen";
import { ListingDetailScreen } from "@/features/listings/screens/ListingDetailScreen";
import { ListingsExploreScreen } from "@/features/listings/screens/ListingsExploreScreen";
import { RequestBookingScreen } from "@/features/listings/screens/RequestBookingScreen";
import type { ListingsStackParamList } from "@/navigation/types";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

const Stack = createNativeStackNavigator<ListingsStackParamList>();

export function ListingsStackNavigator(): React.ReactElement {
  return (
    <Stack.Navigator
      initialRouteName="ListingsExplore"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="ListingsExplore" component={ListingsExploreScreen} />
      <Stack.Screen name="CreateListing" component={CreateListingScreen} />
      <Stack.Screen name="ListingDetail" component={ListingDetailScreen} />
      <Stack.Screen name="EditListing" component={EditListingScreen} />
      <Stack.Screen name="RequestBooking" component={RequestBookingScreen} />
      <Stack.Screen name="ListingAvailability" component={ListingAvailabilityScreen} />
      <Stack.Screen name="ListingAvailabilityBlocks" component={ListingAvailabilityBlocksScreen} />
    </Stack.Navigator>
  );
}

