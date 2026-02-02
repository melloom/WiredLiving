
"use client";
import { ThemeProvider } from "./theme-provider";
import { ToastProvider } from "./toast";
import { ConfirmDialogProvider } from "./confirm-dialog";
import { MobileMenuProvider } from "@/lib/mobile-menu-context";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <ToastProvider>
        <ConfirmDialogProvider>
          <MobileMenuProvider>
            {children}
          </MobileMenuProvider>
        </ConfirmDialogProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}


