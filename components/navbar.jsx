/**
 * v0 by Vercel.
 * @see https://v0.dev/t/lJwnQlHSEBA
 * Documentation: https://v0.dev/docs#integrating-generated-code-into-your-nextjs-app
 */
"use client";

import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

import Image from "next/image";
import Link from "next/link";

import { Separator } from "@/components/ui/separator";
import {
  LogOut,
  ChartNoAxesCombined,
  Plus,
  Minus,
  HandCoins,
  User,
  Upload,
  Banknote,
  Wallet,
  Boxes,
} from "lucide-react";
import Logo from "../app/flow-wise-logo.svg";

import {
  Sheet,
  SheetTitle,
  SheetTrigger,
  SheetContent,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { NavUser } from "./nav-user";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();

  const isActive = (path) => pathname === path;

  return (
    <>
    <header className="flex h-14 w-full shrink-0 items-center px-3 md:px-6 border-b sticky top-0 bg-background z-50">
      {/* Mobile App Bar */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="lg:hidden" aria-label="Open menu">
            <MenuIcon className="h-5 w-5" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>

        <div className="lg:hidden flex items-center gap-2 flex-1 justify-center">
          <Image src={Logo} width={36} alt="Flow wise logo" />
          <span className="font-semibold text-base">Flow Wise</span>
        </div>

        <div className="lg:hidden">
          <NavUser />
        </div>

        <SheetContent side="left" className="p-0">
          <div className="px-4 py-3 border-b flex items-center gap-2">
            <Image src={Logo} width={32} height={32} alt="Flow wise" />
            <SheetTitle className="text-base">Flow Wise</SheetTitle>
          </div>
          <nav className="grid gap-1 p-4">
            <Link href="/dashboard" className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-muted" prefetch={false}>
              <ChartNoAxesCombined className="h-4 w-4" /> Dashboard
            </Link>
            <Link href="/incomes" className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-muted" prefetch={false}>
              <Plus className="h-4 w-4" /> Incomes
            </Link>
            <Link href="/expenses" className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-muted" prefetch={false}>
              <Minus className="h-4 w-4" /> Expenses
            </Link>
            <Separator className="my-2" />
            <Link href="/budgets" className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-muted" prefetch={false}>
              <HandCoins className="h-4 w-4" /> Budgets
            </Link>
            <Link href="/wallets" className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-muted" prefetch={false}>
              <Wallet className="h-4 w-4" /> Wallets
            </Link>
            <Link href="/category" className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-muted" prefetch={false}>
              <Boxes className="h-4 w-4" /> Categories
            </Link>
            <Separator className="my-2" />
            <Link href="/settings" className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-muted" prefetch={false}>
              <User className="h-4 w-4" /> Account
            </Link>
            <Link href="/settings/import" className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted" prefetch={false}>
              <Upload className="h-4 w-4" /> Import
            </Link>
            <Link href="/settings/yourbank" className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted" prefetch={false}>
              <Banknote className="h-4 w-4" /> Your Bank
            </Link>
            <Button
              variant="outline"
              className="mt-2 justify-start gap-2"
              onClick={async () => {
                await supabase.auth.signOut();
                router.push("/login");
              }}
            >
              <LogOut className="h-4 w-4" /> Logout
            </Button>
          </nav>
        </SheetContent>
      </Sheet>

      {/* Desktop Nav */}
      <Link href="/dashboard" className="mr-6 hidden lg:flex" prefetch={false}>
        <Image src={Logo} width={60} height={60} alt="Flow wise logo" />
        <span className="sr-only">Flow Wise</span>
      </Link>
      <nav className="ml-auto hidden lg:flex gap-6">
        <Link
          href="/dashboard"
          className={`group inline-flex h-9 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-100 hover:text-gray-900 focus:bg-gray-100 focus:text-gray-900 focus:outline-none ${
            isActive('/dashboard') ? 'bg-gray-100 font-semibold' : 'bg-white'
          }`}
          prefetch={false}
        >
          Dashboard
        </Link>
        <Link
          href="/incomes"
          className={`group inline-flex h-9 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-100 hover:text-gray-900 focus:bg-gray-100 focus:text-gray-900 focus:outline-none ${
            isActive('/incomes') ? 'bg-gray-100 font-semibold' : 'bg-white'
          }`}
          prefetch={false}
        >
          Incomes
        </Link>
        <Link
          href="/expenses"
          className={`group inline-flex h-9 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-100 hover:text-gray-900 focus:bg-gray-100 focus:text-gray-900 focus:outline-none ${
            isActive('/expenses') ? 'bg-gray-100 font-semibold' : 'bg-white'
          }`}
          prefetch={false}
        >
          Expenses
        </Link>
        <Link
          href="/budgets"
          className={`group inline-flex h-9 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-100 hover:text-gray-900 focus:bg-gray-100 focus:text-gray-900 focus:outline-none ${
            isActive('/budgets') ? 'bg-gray-100 font-semibold' : 'bg-white'
          }`}
          prefetch={false}
        >
          Budgets
        </Link>
        <Link
          href="/wallets"
          className={`group inline-flex h-9 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-100 hover:text-gray-900 focus:bg-gray-100 focus:text-gray-900 focus:outline-none ${
            isActive('/wallets') ? 'bg-gray-100 font-semibold' : 'bg-white'
          }`}
          prefetch={false}
        >
          Wallets
        </Link>
        <Link
          href="/category"
          className={`group inline-flex h-9 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-100 hover:text-gray-900 focus:bg-gray-100 focus:text-gray-900 focus:outline-none ${
            isActive('/category') ? 'bg-gray-100 font-semibold' : 'bg-white'
          }`}
          prefetch={false}
        >
          Categories
        </Link>
        <NavUser />
      </nav>
    </header>
    {/* Bottom Navigation (Mobile) */}
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background lg:hidden">
      <div className="grid grid-cols-5">
        <Link
          href="/dashboard"
          prefetch={false}
          className={`flex flex-col items-center justify-center py-2 text-[11px] ${isActive('/dashboard') ? 'text-foreground font-medium' : 'text-muted-foreground'}`}
          aria-label="Dashboard"
        >
          <ChartNoAxesCombined className="h-5 w-5" />
          <span>Dashboard</span>
        </Link>
        <Link
          href="/incomes"
          prefetch={false}
          className={`flex flex-col items-center justify-center py-2 text-[11px] ${isActive('/incomes') ? 'text-foreground font-medium' : 'text-muted-foreground'}`}
          aria-label="Incomes"
        >
          <Plus className="h-5 w-5" />
          <span>Incomes</span>
        </Link>
        <Link
          href="/expenses"
          prefetch={false}
          className={`flex flex-col items-center justify-center py-2 text-[11px] ${isActive('/expenses') ? 'text-foreground font-medium' : 'text-muted-foreground'}`}
          aria-label="Expenses"
        >
          <Minus className="h-5 w-5" />
          <span>Expenses</span>
        </Link>
        <Link
          href="/wallets"
          prefetch={false}
          className={`flex flex-col items-center justify-center py-2 text-[11px] ${isActive('/wallets') ? 'text-foreground font-medium' : 'text-muted-foreground'}`}
          aria-label="Wallets"
        >
          <Wallet className="h-5 w-5" />
          <span>Wallets</span>
        </Link>
        <Link
          href="/settings"
          prefetch={false}
          className={`flex flex-col items-center justify-center py-2 text-[11px] ${isActive('/settings') ? 'text-foreground font-medium' : 'text-muted-foreground'}`}
          aria-label="Settings"
        >
          <User className="h-5 w-5" />
          <span>Settings</span>
        </Link>
      </div>
    </nav>
    </>
  );
}

function MenuIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="4" x2="20" y1="12" y2="12" />
      <line x1="4" x2="20" y1="6" y2="6" />
      <line x1="4" x2="20" y1="18" y2="18" />
    </svg>
  );
}

function MountainIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m8 3 4 8 5-5 5 15H2L8 3z" />
    </svg>
  );
}
