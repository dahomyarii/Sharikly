import { ListingsExploreScreen } from "@/features/listings/screens/ListingsExploreScreen";
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
    </Stack.Navigator>
  );
}
