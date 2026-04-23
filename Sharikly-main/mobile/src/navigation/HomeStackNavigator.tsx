import { HomeScreen } from "@/features/home/screens/HomeScreen";
import type { HomeStackParamList } from "@/navigation/types";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

const Stack = createNativeStackNavigator<HomeStackParamList>();

export function HomeStackNavigator(): React.ReactElement {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Home" component={HomeScreen} options={{ title: "Home" }} />
    </Stack.Navigator>
  );
}
