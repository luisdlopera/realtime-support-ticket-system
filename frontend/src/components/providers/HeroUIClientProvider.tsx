"use client";

import { HeroUIProvider } from "@heroui/system";

interface HeroUIClientProviderProps {
  children: React.ReactNode;
}

export function HeroUIClientProvider({ children }: HeroUIClientProviderProps) {
  return <HeroUIProvider>{children}</HeroUIProvider>;
}
