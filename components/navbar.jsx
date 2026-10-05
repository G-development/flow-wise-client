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
  Menu,
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

const navLinks = [
  { href: '/dashboard', icon: ChartNoAxesCombined, label: 'Dashboard' },
  { href: '/incomes', icon: Plus, label: 'Incomes' },
  { href: '/expenses', icon: Minus, label: 'Expenses' },
];

const mainLinks = [
  { href: '/budgets', icon: HandCoins, label: 'Budgets' },
  { href: '/wallets', icon: Wallet, label: 'Wallets' },
  { href: '/category', icon: Boxes, label: 'Categories' },
];

const settingsLinks = [
  { href: '/settings', icon: User, label: 'Account' },
  { href: '/settings/import', icon: Upload, label: 'Import' },
  { href: '/settings/yourbank', icon: Banknote, label: 'Your Bank' },
];

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();

  const isActive = (path) => pathname === path || pathname.startsWith(`${path}/`);

  const navLinkClass = (active) =>
    `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ${
      active
        ? 'bg-primary/10 text-primary'
        : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
    }`;

  const desktopNavClass = (active) =>
    `inline-flex h-10 w-max items-center justify-center rounded-xl px-2.5 xl:px-3 text-sm font-medium transition-colors duration-200 ${
      active
        ? 'bg-primary/10 text-primary'
        : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
    }`;

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border/70 bg-background/90 shadow-sm backdrop-blur-xl supports-[backdrop-filter]:bg-background/75">
        <div className="mx-auto flex h-16 w-full max-w-[1440px] items-center justify-between gap-3 px-3 sm:px-5 lg:px-8">
          {/* Mobile Menu Button */}
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-xl lg:hidden hover:bg-secondary"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>

            <SheetContent side="left" className="w-64 p-0">
              <div className="flex items-center gap-2 border-b px-4 py-4">
                <Image src={Logo} width={32} height={32} alt="Flow wise" />
                <SheetTitle className="text-lg">Flow Wise</SheetTitle>
              </div>
              <nav className="space-y-6 px-4 py-6">
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Main</p>
                  {navLinks.map(({ href, icon: Icon, label }) => (
                    <Link
                      key={href}
                      href={href}
                      className={navLinkClass(isActive(href))}
                      prefetch={false}
                    >
                      <Icon className="h-4 w-4" />
                      {label}
                    </Link>
                  ))}
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Management</p>
                  {mainLinks.map(({ href, icon: Icon, label }) => (
                    <Link
                      key={href}
                      href={href}
                      className={navLinkClass(isActive(href))}
                      prefetch={false}
                    >
                      <Icon className="h-4 w-4" />
                      {label}
                    </Link>
                  ))}
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Settings</p>
                  {settingsLinks.map(({ href, icon: Icon, label }) => (
                    <Link
                      key={href}
                      href={href}
                      className={navLinkClass(isActive(href))}
                      prefetch={false}
                    >
                      <Icon className="h-4 w-4" />
                      {label}
                    </Link>
                  ))}
                </div>

                <Separator />
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2"
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

          {/* Mobile Logo */}
          <div className="flex items-center gap-2 lg:hidden">
            <Image src={Logo} width={32} height={32} alt="Flow wise logo" />
          <span className="font-semibold tracking-tight text-base">Flow Wise</span>
          </div>

          {/* Mobile User Menu */}
          <div className="lg:hidden">
            <NavUser />
          </div>

          {/* Desktop Logo */}
          <Link href="/dashboard" className="mr-5 hidden shrink-0 items-center gap-2.5 lg:flex" prefetch={false}>
            <Image src={Logo} width={36} height={36} alt="Flow wise logo" />
            <span className="hidden text-lg font-semibold tracking-tight xl:inline">Flow Wise</span>
          </Link>

          {/* Desktop Nav */}
          <nav aria-label="Main navigation" className="hidden items-center gap-1 lg:flex">
            {navLinks.map(({ href, icon: Icon, label }) => (
              <Link
                key={href}
                href={href}
                className={desktopNavClass(isActive(href))}
                prefetch={false}
                aria-current={isActive(href) ? "page" : undefined}
              >
                <Icon className="mr-2 h-4 w-4" aria-hidden="true" />
                {label}
              </Link>
            ))}
            <Separator orientation="vertical" className="mx-1 h-6" />
            {mainLinks.map(({ href, icon: Icon, label }) => (
              <Link
                key={href}
                href={href}
                className={desktopNavClass(isActive(href))}
                prefetch={false}
                aria-current={isActive(href) ? "page" : undefined}
              >
                <Icon className="mr-2 h-4 w-4" aria-hidden="true" />
                {label}
              </Link>
            ))}
          </nav>

          {/* Desktop User Menu */}
          <div className="ml-auto hidden lg:flex items-center gap-2">
            <NavUser />
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation */}
      <nav aria-label="Mobile navigation" className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-background/95 px-2 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_-18px_rgba(15,23,42,0.35)] backdrop-blur-xl lg:hidden">
        <div className="mx-auto grid max-w-lg grid-cols-5 gap-1 py-1.5">
          {navLinks.map(({ href, icon: Icon, label }) => (
            <Link
              key={href}
              href={href}
              prefetch={false}
              className={`flex min-w-0 flex-col items-center justify-center rounded-xl px-1 py-2.5 gap-1 text-[10px] font-medium transition-colors duration-200 ${
                isActive(href)
                  ? 'text-primary bg-primary/10'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              aria-label={label}
              aria-current={isActive(href) ? "page" : undefined}
            >
              <Icon className="h-5 w-5" />
              <span>{label}</span>
            </Link>
          ))}
          <Link
            href="/budgets"
            prefetch={false}
            className={`flex min-w-0 flex-col items-center justify-center rounded-xl px-1 py-2.5 gap-1 text-[10px] font-medium transition-colors duration-200 ${
              isActive('/budgets')
                ? 'text-primary bg-primary/10'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            aria-label="Budgets"
            aria-current={isActive('/budgets') ? "page" : undefined}
          >
            <HandCoins className="h-5 w-5" />
            <span>Budget</span>
          </Link>
          <Link
            href="/wallets"
            prefetch={false}
            className={`flex min-w-0 flex-col items-center justify-center rounded-xl px-1 py-2.5 gap-1 text-[10px] font-medium transition-colors duration-200 ${
              isActive('/wallets')
                ? 'text-primary bg-primary/10'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            aria-label="Wallets"
            aria-current={isActive('/wallets') ? "page" : undefined}
          >
            <Wallet className="h-5 w-5" />
            <span>Wallet</span>
          </Link>
        </div>
      </nav>
    </>
  );
}
