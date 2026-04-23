import { ScreenShell } from "@/components/layout/ScreenShell";
import type { ComponentType, ReactElement } from "react";

export function createPlaceholderScreen(
  title: string,
  subtitle?: string
): ComponentType<object> {
  function PlaceholderScreen(): ReactElement {
    return <ScreenShell title={title} subtitle={subtitle} />;
  }
  PlaceholderScreen.displayName = `Placeholder(${title})`;
  return PlaceholderScreen;
}
