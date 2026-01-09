"use client";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  BadgeCheck,
  Bell,
  CreditCard,
  LogOut,
  Sparkles,
  Import,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Profile {
  id: string;
  name: string;
  username: string;
  avatar_url?: string;
  email: string | null;
}

export function NavUser() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user.id;
      const userEmail = sessionData?.session?.user.email;

      if (!userId) return;

      const { data, error } = await supabase
        .from("Profile")
        .select("*")
        .eq("id", userId)
        .single();

      if (!error && data) {
        setProfile({ ...data, email: data.email || userEmail || "" });
      }
    };

    fetchProfile();
  }, []);

  const initials = profile?.name
    ? profile.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    : "FW";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Avatar className="h-8 w-8 rounded-lg">
          <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.name} />
          <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
        side={true ? "bottom" : "right"}
        align="end"
        sideOffset={4}
      >
        <DropdownMenuLabel className="p-0 font-normal">
          <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
            <Avatar className="h-8 w-8 rounded-lg">
              <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.name} />
              <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">{profile?.name || "User"}</span>
              <span className="truncate text-xs">{profile?.email || ""}</span>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem disabled>
            <Sparkles />
            Upgrade to Pro
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <Link href="/settings">
            <DropdownMenuItem>
              <BadgeCheck />
              Account
            </DropdownMenuItem>
          </Link>
          <DropdownMenuItem disabled>
            <Bell />
            Notifications
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <Link href="/settings/yourbank">
          <DropdownMenuItem>
            <CreditCard />
            Your bank
          </DropdownMenuItem>
        </Link>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <Link href="/settings/import">
            <DropdownMenuItem>
              <Import />
              Import utility
            </DropdownMenuItem>
          </Link>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => {
            supabase.auth.signOut();
            router.replace("/");
          }}
        >
          <LogOut />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
