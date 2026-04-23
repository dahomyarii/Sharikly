import { APP_SCHEME } from "@/core/config/env";
import type { LinkingOptions } from "@react-navigation/native";
import * as Linking from "expo-linking";

import type { RootStackParamList } from "@/navigation/types";

const prefix = Linking.createURL("/");

export const linking: LinkingOptions<RootStackParamList> = {
  prefixes: [prefix, `${APP_SCHEME}://`],
  config: {
    screens: {
      Auth: {
        screens: {
          VerifyEmail: "verify-email",
          ResetPassword: "reset-password",
          Login: "login",
        },
      },
      Main: {
        screens: {
          ExploreTab: {
            screens: {
              ListingDetail: "listings/:id",
              ListingsExplore: "listings",
            },
          },
        },
      },
    },
  },
};
