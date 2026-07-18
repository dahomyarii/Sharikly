import { BookingReceiptScreen } from "@/features/bookings/screens/BookingReceiptScreen";
import { BookingsScreen } from "@/features/bookings/screens/BookingsScreen";
import type { BookingsStackParamList } from "@/navigation/types";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

const Stack = createNativeStackNavigator<BookingsStackParamList>();

export function BookingsStackNavigator(): React.ReactElement {
  return (
    <Stack.Navigator initialRouteName="Bookings" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Bookings" component={BookingsScreen} />
      <Stack.Screen name="BookingReceipt" component={BookingReceiptScreen} />
    </Stack.Navigator>
  );
}
