import {
  ArrowDownToLine,
  ArrowUpFromLine,
  History,
  LayoutDashboard,
  type LucideIcon,
} from "lucide-react";

export interface NavigationItem {
  title: string;
  href: string;
  icon: LucideIcon;
}

export const navigation: NavigationItem[] = [
  {
    title: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Barang Masuk",
    href: "/masuk",
    icon: ArrowDownToLine,
  },
  {
    title: "Pengambilan",
    href: "/pengambilan",
    icon: ArrowUpFromLine,
  },
  {
    title: "Riwayat",
    href: "/riwayat",
    icon: History,
  },
];