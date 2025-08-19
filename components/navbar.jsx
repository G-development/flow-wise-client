/**
 * v0 by Vercel.
 * @see https://v0.dev/t/lJwnQlHSEBA
 * Documentation: https://v0.dev/docs#integrating-generated-code-into-your-nextjs-app
 */
"use client";

import { useRouter } from "next/navigation";

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

  return (
    <header className="flex h-16 w-full shrink-0 items-center px-4 md:px-6 border-b">
      {/* THIS IS THE MOBILE NAV */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="lg:hidden">
            <MenuIcon className="h-6 w-6" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>

        <div className="lg:hidden flex items-center w-full text-center justify-center">
          <Image src={Logo} width={50} alt="Flow-wise-logo" />
          <h1>Flow wise </h1>
        </div>

        <SheetContent side="left">
          <SheetTitle>where you flowing? 💸</SheetTitle>
          <Link href="#" className="mr-6 hidden lg:flex" prefetch={false}>
            {/* <MountainIcon className="h-6 w-6" /> */}
            <Image src={Logo} width={60} height={60} alt="Flow-wise-logo" />
            <span className="sr-only">Flow wise</span>
          </Link>
          <div className="grid gap-2 py-6">
            <Link
              href="/dashboard"
              className="flex w-full items-center py-2 text-lg font-semibold"
              prefetch={false}
            >
              <ChartNoAxesCombined className="mr-2" />
              Dashboard
            </Link>

            <Separator className="my-4" />

            <Link
              href="/incomes"
              className="flex w-full items-center py-2 text-lg font-semibold"
              prefetch={false}
            >
              <Plus className="mr-2" />
              Incomes
            </Link>
            <Link
              href="/expenses"
              className="flex w-full items-center py-2 text-lg font-semibold"
              prefetch={false}
            >
              <Minus className="mr-2" />
              Expenses
            </Link>

            <Separator className="my-4" />

            <Link
              href="/budgets"
              className="flex w-full items-center py-2 text-lg font-semibold"
              prefetch={false}
            >
              <HandCoins className="mr-2" />
              Budgets
            </Link>

            <Link
              href="/wallets"
              className="flex w-full items-center py-2 text-lg font-semibold"
              prefetch={false}
            >
              <Wallet className="mr-2" />
              Wallets
            </Link>

            <Separator className="my-4" />

            <Link
              href="/settings"
              className="flex w-full items-center py-2 text-lg font-semibold"
              prefetch={false}
            >
              <User className="mr-2" />
              Account
            </Link>
            <Link
              href="/settings/import"
              className="flex w-full items-center py-1 text-base font-normal pl-6"
              prefetch={false}
            >
              <Upload className="mr-2 h-5 w-5" />
              Import
            </Link>

            <Link
              href="/settings/yourbank"
              className="flex w-full items-center py-1 text-base font-normal pl-6"
              prefetch={false}
            >
              <Banknote className="mr-2 h-5 w-5" />
              Your Bank
            </Link>
            <div
              className="flex gap-2 absolute bottom-8 right-8"
              onClick={() => {
                localStorage.removeItem("fw-token");
                // router.push("/");
              }}
            >
              Logout
              <LogOut />
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* THIS IS THE DESKTOP NAV */}
      <Link href="/dashboard" className="mr-6 hidden lg:flex" prefetch={false}>
        {/* <MountainIcon className="h-6 w-6" /> */}
        <Image src={Logo} width={60} height={60} alt="Flow-wise-logo" />
        <span className="sr-only">Flow Wise</span>
      </Link>
      <nav className="ml-auto hidden lg:flex gap-6">
        <Link
          href="/dashboard"
          className="group inline-flex h-9 w-max items-center justify-center rounded-md bg-white px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-100 hover:text-gray-900 focus:bg-gray-100 focus:text-gray-900 focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-gray-100/50 data-[state=open]:bg-gray-100/50 dark:bg-gray-950 dark:hover:bg-gray-800 dark:hover:text-gray-50 dark:focus:bg-gray-800 dark:focus:text-gray-50 dark:data-[active]:bg-gray-800/50 dark:data-[state=open]:bg-gray-800/50"
          prefetch={false}
        >
          Dashboard
        </Link>
        <Link
          href="/incomes"
          className="group inline-flex h-9 w-max items-center justify-center rounded-md bg-white px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-100 hover:text-gray-900 focus:bg-gray-100 focus:text-gray-900 focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-gray-100/50 data-[state=open]:bg-gray-100/50 dark:bg-gray-950 dark:hover:bg-gray-800 dark:hover:text-gray-50 dark:focus:bg-gray-800 dark:focus:text-gray-50 dark:data-[active]:bg-gray-800/50 dark:data-[state=open]:bg-gray-800/50"
          prefetch={false}
        >
          Incomes
        </Link>
        <Link
          href="/expenses"
          className="group inline-flex h-9 w-max items-center justify-center rounded-md bg-white px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-100 hover:text-gray-900 focus:bg-gray-100 focus:text-gray-900 focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-gray-100/50 data-[state=open]:bg-gray-100/50 dark:bg-gray-950 dark:hover:bg-gray-800 dark:hover:text-gray-50 dark:focus:bg-gray-800 dark:focus:text-gray-50 dark:data-[active]:bg-gray-800/50 dark:data-[state=open]:bg-gray-800/50"
          prefetch={false}
        >
          Expenses
        </Link>
        <Link
          href="/budgets"
          className="group inline-flex h-9 w-max items-center justify-center rounded-md bg-white px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-100 hover:text-gray-900 focus:bg-gray-100 focus:text-gray-900 focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-gray-100/50 data-[state=open]:bg-gray-100/50 dark:bg-gray-950 dark:hover:bg-gray-800 dark:hover:text-gray-50 dark:focus:bg-gray-800 dark:focus:text-gray-50 dark:data-[active]:bg-gray-800/50 dark:data-[state=open]:bg-gray-800/50"
          prefetch={false}
        >
          Budgets
        </Link>
        <Link
          href="/wallets"
          className="group inline-flex h-9 w-max items-center justify-center rounded-md bg-white px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-100 hover:text-gray-900 focus:bg-gray-100 focus:text-gray-900 focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-gray-100/50 data-[state=open]:bg-gray-100/50 dark:bg-gray-950 dark:hover:bg-gray-800 dark:hover:text-gray-50 dark:focus:bg-gray-800 dark:focus:text-gray-50 dark:data-[active]:bg-gray-800/50 dark:data-[state=open]:bg-gray-800/50"
          prefetch={false}
        >
          Wallets
        </Link>
        <NavUser />
      </nav>
    </header>
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
