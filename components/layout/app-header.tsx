"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";

export function AppHeader() {
  return (
    <header className="flex h-16 items-center border-b px-6">
      <SidebarTrigger />

      <div className="ml-4">
        <h1 className="text-lg font-semibold">
          Inventory Barang
        </h1>
      </div>
    </header>
  );
}