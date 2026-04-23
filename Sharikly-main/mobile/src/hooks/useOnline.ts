import NetInfo, { type NetInfoState } from "@react-native-community/netinfo";
import { useEffect, useState } from "react";

export function useOnline(): boolean {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    let mounted = true;
    const unsub = NetInfo.addEventListener((state: NetInfoState) => {
      if (!mounted) return;
      setOnline(state.isConnected === true && state.isInternetReachable !== false);
    });
    void NetInfo.fetch().then((state) => {
      if (!mounted) return;
      setOnline(state.isConnected === true && state.isInternetReachable !== false);
    });
    return () => {
      mounted = false;
      unsub();
    };
  }, []);

  return online;
}
