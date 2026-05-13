"use client";

import { ThemeProvider as NextThemeProvider } from "next-themes";
import { HeroUIClientProvider } from "./HeroUIClientProvider";
import { ReactNode } from "react";

export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <HeroUIClientProvider>
      <NextThemeProvider
        attribute="class"
        defaultTheme="light"
        forcedTheme="light"
        enableSystem={false}
        enableColorScheme={true}
        disableTransitionOnChange
      >
        {children}
      </NextThemeProvider>
    </HeroUIClientProvider>
  );
}
