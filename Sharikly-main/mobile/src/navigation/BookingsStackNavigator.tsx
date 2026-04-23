import { BookingReceiptScreen } from "@/features/bookings/screens/BookingReceiptScreen";
import { BookingsRenterScreen } from "@/features/bookings/screens/BookingsRenterScreen";
import { HostBookingsScreen } from "@/features/bookings/screens/HostBookingsScreen";
import type { BookingsStackParamList } from "@/navigation/types";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

const Stack = createNativeStackNavigator<BookingsStackParamList>();

export function BookingsStackNavigator(): React.ReactElement {
  return (
    <Stack.Navigator initialRouteName="BookingsRenter" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="BookingsRenter" component={BookingsRenterScreen} />
      <Stack.Screen name="BookingReceipt" component={BookingReceiptScreen} />
      <Stack.Screen name="HostBookings" component={HostBookingsScreen} />
    </Stack.Navigator>
  );
}
