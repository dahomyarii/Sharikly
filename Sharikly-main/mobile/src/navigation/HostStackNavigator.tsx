import { CommunityEarningsScreen } from "@/features/host/screens/CommunityEarningsScreen";
import { EarningsScreen } from "@/features/host/screens/EarningsScreen";
import { HostEarningsScreen } from "@/features/host/screens/HostEarningsScreen";
import { HostListingsManageScreen } from "@/features/host/screens/HostListingsManageScreen";
import { HostOpportunitiesScreen } from "@/features/host/screens/HostOpportunitiesScreen";
import { HostOverviewScreen } from "@/features/host/screens/HostOverviewScreen";
import { StartRentingScreen } from "@/features/host/screens/StartRentingScreen";
import { TopHostsScreen } from "@/features/host/screens/TopHostsScreen";
import type { HostStackParamList } from "@/navigation/types";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

const Stack = createNativeStackNavigator<HostStackParamList>();

export function HostStackNavigator(): React.ReactElement {
  return (
    <Stack.Navigator initialRouteName="HostOverview">
      <Stack.Screen name="HostOverview" component={HostOverviewScreen} options={{ title: "Overview" }} />
      <Stack.Screen name="HostEarnings" component={HostEarningsScreen} />
      <Stack.Screen name="HostListings" component={HostListingsManageScreen} />
      <Stack.Screen name="HostOpportunities" component={HostOpportunitiesScreen} />
      <Stack.Screen name="Earnings" component={EarningsScreen} />
      <Stack.Screen name="CommunityEarnings" component={CommunityEarningsScreen} />
      <Stack.Screen name="TopHosts" component={TopHostsScreen} />
      <Stack.Screen name="StartRenting" component={StartRentingScreen} />
    </Stack.Navigator>
  );
}
