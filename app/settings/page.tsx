"use client";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AtSign,
  Banknote,
  Boxes,
  Camera,
  Coins,
  Compass,
  FileText,
  LayoutGrid,
  LifeBuoy,
  Mail,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Upload,
  User,
} from "lucide-react";
import Navbar from "@/components/navbar";
import { YourDataCard } from "@/components/settings/your-data-card";
import { DeleteAccountCard } from "@/components/settings/delete-account-card";
import { SettingsLinkRow, SettingsRows, SettingsSection } from "@/components/settings/settings-section";

interface Profile {
  id: string;
  name: string;
  username: string;
  avatar_url?: string;
  email: string | null;
  currency: string;
  bio?: string;
  settings?: { notifications?: boolean };
  created_at?: string;
  updated_at?: string;
}

export default function Settings() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [currency, setCurrency] = useState("");
  const [notifications, setNotifications] = useState(false);
  const [loading, setLoading] = useState(false);

  const initials = (name || "FW")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user.id;

      if (!userId) {
        console.error("No Supabase session found");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("Profile")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
        toast.error("Failed to load profile");
      } else if (data) {
        setProfile(data);
        setName(data.name);
        setUsername(data.username);
        setCurrency(data.currency);
        setNotifications(data.settings?.notifications || false);
      }
      setLoading(false);
    };

    fetchProfile();
  }, []);

  const handleSubmit = async () => {
    if (!profile) return;
    setLoading(true);

    const { data, error } = await supabase
      .from("Profile")
      .update({
        name,
        username,
        currency,
        settings: { notifications },
        updated_at: new Date().toISOString(),
      })
      .eq("id", profile.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } else if (data) {
      setProfile(data);
      toast.success("Profile updated");
    }
    setLoading(false);
  };

  const handleAvatarChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file || !profile) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    setLoading(true);
    const loadingToast = toast.loading('Uploading avatar...');
    
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      if (!token) {
        throw new Error('Not authenticated');
      }

      const formData = new FormData();
      formData.append('image', file);

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5030';
      const response = await fetch(`${apiUrl}/users/profile/photo`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to upload avatar');
      }

      const data = await response.json();
      
      setProfile((prev) => prev ? { ...prev, avatar_url: data.avatar_url } : prev);
      toast.success('Avatar updated successfully!', { id: loadingToast });
    } catch (err) {
      console.error('Error uploading avatar:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload avatar';
      toast.error(errorMessage, { id: loadingToast });
    } finally {
      setLoading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const resetForm = () => {
    if (!profile) return;
    setName(profile.name);
    setUsername(profile.username);
    setCurrency(profile.currency);
    setNotifications(profile.settings?.notifications || false);
  };

  if (loading && !profile) {
    return (
      <>
        <Navbar />
        <main className="app-page">
          <div className="mx-auto max-w-3xl space-y-4">
            <div className="h-24 animate-pulse rounded-2xl bg-muted" />
            <div className="h-48 animate-pulse rounded-2xl bg-muted" />
          </div>
        </main>
      </>
    );
  }
  if (!profile) {
    return (
      <>
        <Navbar />
        <main className="app-page">
          <p className="mx-auto max-w-3xl rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            Could not load your profile. Reload the page or sign in again.
          </p>
        </main>
      </>
    );
  }

  const dirty = name !== profile.name || username !== profile.username;
  const memberSince = profile.created_at
    ? new Date(profile.created_at).toLocaleDateString("en-GB", { month: "long", year: "numeric" })
    : null;

  return (
    <>
      <Navbar />
      <main className="app-page">
        <div className="mx-auto max-w-3xl space-y-6">
          <div className="app-page-header">
            <div>
              <h1 className="page-title">Settings</h1>
              <p className="page-description">Your profile, preferences and data</p>
            </div>
          </div>

          {/* Testata del profilo: foto (il pulsante e' sempre visibile, anche al tocco), nome, email */}
          <section className="flex items-center gap-4 rounded-2xl border border-border/70 bg-card p-4 shadow-sm sm:p-6">
            <div className="relative shrink-0">
              <Avatar className="h-16 w-16 rounded-2xl sm:h-20 sm:w-20">
                {profile.avatar_url ? (
                  <AvatarImage src={profile.avatar_url} alt={profile.name} className="object-cover" />
                ) : (
                  <AvatarFallback className="rounded-2xl bg-primary/10 text-lg font-semibold text-primary">
                    {initials}
                  </AvatarFallback>
                )}
              </Avatar>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
                className="absolute -bottom-1 -right-1 rounded-full border border-border bg-card p-1.5 shadow-sm transition-colors hover:bg-secondary disabled:opacity-50"
                aria-label="Change photo"
              >
                <Camera className="h-3.5 w-3.5" />
              </button>
              <Input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={handleAvatarChange} />
            </div>
            <div className="min-w-0">
              <p className="truncate text-lg font-semibold">{profile.name}</p>
              <p className="truncate text-sm text-muted-foreground">{profile.email ?? ""}</p>
              <p className="truncate text-xs text-muted-foreground">
                @{profile.username}
                {memberSince && ` · member since ${memberSince}`}
              </p>
            </div>
          </section>

          <SettingsSection id="profile" icon={User} title="Profile" description="How you appear in Flow Wise.">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="settings-name">Name</Label>
                <Input id="settings-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="settings-username">Username</Label>
                <div className="relative">
                  <AtSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="settings-username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="username"
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="grid gap-2 sm:col-span-2">
                <Label htmlFor="settings-email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="settings-email" value={profile.email ?? ""} disabled className="pl-9" />
                </div>
                <p className="text-xs text-muted-foreground">The email is the one you sign in with and can&apos;t be changed here.</p>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-end gap-2">
              {dirty && (
                <Button variant="ghost" onClick={resetForm} disabled={loading}>
                  Cancel
                </Button>
              )}
              <Button onClick={handleSubmit} disabled={loading || !dirty}>
                Save changes
              </Button>
            </div>
          </SettingsSection>

          <SettingsSection id="preferences" icon={SlidersHorizontal} title="Preferences">
            <SettingsRows>
              <div className="flex items-center gap-3 px-2 py-2.5">
                <Coins className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">Currency</span>
                  <span className="block text-xs text-muted-foreground">More currencies may come later</span>
                </span>
                <span className="rounded-lg bg-secondary px-2.5 py-1 text-sm font-medium tabular-nums">{currency || "EUR"}</span>
              </div>
            </SettingsRows>
          </SettingsSection>

          <SettingsSection id="shortcuts" icon={LayoutGrid} title="Shortcuts">
            <SettingsRows>
              <SettingsLinkRow href="/settings/yourbank" icon={Banknote} label="Your Bank" hint="Linked banks, sync and daily import" />
              <SettingsLinkRow href="/settings/import" icon={Upload} label="Import CSV" hint="Add movements from a file" />
              <SettingsLinkRow href="/category" icon={Boxes} label="Categories" hint="Income, expense and transfer categories" />
            </SettingsRows>
          </SettingsSection>

          <SettingsSection id="help" icon={LifeBuoy} title="Help">
            <SettingsRows>
              <SettingsLinkRow href="/dashboard?tour=1" icon={Compass} label="Replay the tour" hint="A quick look at the main pages" />
              <SettingsLinkRow href="/#changelog" icon={Sparkles} label="What's new" hint="The latest changes to Flow Wise" />
              <SettingsLinkRow href="/privacy" icon={ShieldCheck} label="Privacy Policy" />
              <SettingsLinkRow href="/terms" icon={FileText} label="Terms of Service" />
            </SettingsRows>
          </SettingsSection>

          <YourDataCard />
          <DeleteAccountCard email={profile.email ?? ""} />
        </div>
      </main>
    </>
  );
}
