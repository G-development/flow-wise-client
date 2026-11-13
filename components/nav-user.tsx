"use client";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { LogOut, Settings, Upload } from "lucide-react";
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

  // 13/11/2026 (Gio): via "Upgrade to Pro" e "Notifications", che non esistono; "Account" diventa
  // "Settings" come la pagina, "Import utility" diventa "Import CSV" come nelle Shortcuts di Settings.
  // Il trigger e' un vero pulsante (tastiera e lettori di schermo) e le voci sono link veri (asChild).
  const signOut = async () => {
    await supabase.auth.signOut();
    router.replace("/");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Account menu"
          className="rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <Avatar className="h-8 w-8 rounded-lg">
            <AvatarImage src={profile?.avatar_url || undefined} alt="" className="object-cover" />
            <AvatarFallback className="rounded-lg bg-primary/10 text-xs font-semibold text-primary">{initials}</AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="min-w-56 rounded-xl" side="bottom" align="end" sideOffset={6}>
        <DropdownMenuLabel className="p-0 font-normal">
          <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
            <Avatar className="h-8 w-8 rounded-lg">
              <AvatarImage src={profile?.avatar_url || undefined} alt="" className="object-cover" />
              <AvatarFallback className="rounded-lg bg-primary/10 text-xs font-semibold text-primary">{initials}</AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">{profile?.name || "User"}</span>
              <span className="truncate text-xs text-muted-foreground">{profile?.email || ""}</span>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="/settings">
              <Settings />
              Settings
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/settings/import">
              <Upload />
              Import CSV
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => void signOut()}>
          <LogOut />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
