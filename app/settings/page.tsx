"use client";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Send, HandCoins, BellRing, Sparkle } from "lucide-react";
import Navbar from "@/components/navbar";

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
  const [message, setMessage] = useState("");

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
        setMessage("Failed to load profile.");
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
      setMessage("Failed to update profile.");
    } else if (data) {
      setProfile(data);
      setMessage("Profile updated successfully!");
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
      setMessage('Avatar updated successfully!');
    } catch (err) {
      console.error('Error uploading avatar:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload avatar';
      toast.error(errorMessage, { id: loadingToast });
      setMessage(`Failed to upload avatar: ${errorMessage}`);
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
    setMessage("");
  };

  if (loading && !profile) return <div>Loading...</div>;
  if (!profile) return <div>Error loading profile.</div>;

  return (
    <>
      <Navbar />
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Account Settings</h1>
            <p className="text-sm text-muted-foreground">Gestisci profilo, notifiche e preferenze</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[320px,1fr]">
          {/* Card avatar / info */}
          <div className="border rounded-xl shadow-sm bg-white p-4 md:p-6 space-y-4">
            <div className="flex items-start gap-4">
              <div className="relative inline-block">
                <Avatar className="h-20 w-20 rounded-lg">
                  {profile.avatar_url ? (
                    <AvatarImage src={profile.avatar_url} alt={profile.name} />
                  ) : (
                    <AvatarFallback className="rounded-lg text-lg font-semibold">
                      {initials}
                    </AvatarFallback>
                  )}
                </Avatar>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 rounded-lg bg-black/60 text-white text-xs font-medium opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center"
                >
                  Cambia foto
                </button>
              </div>

              <div className="space-y-1">
                <h2 className="text-lg font-semibold">{profile.name}</h2>
                <p className="text-sm text-muted-foreground">{profile.email ?? ""}</p>
                <p className="text-xs text-muted-foreground">@{username || profile.username}</p>
              </div>
            </div>

            <Input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              className="hidden"
              onChange={handleAvatarChange}
            />

            <div className="text-xs text-muted-foreground space-y-1">
              <p>
                Member since: {profile.created_at && new Date(profile.created_at).toLocaleDateString()}
              </p>
              <p>
                Last updated: {profile.updated_at && new Date(profile.updated_at).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Card form */}
          <div className="border rounded-xl shadow-sm bg-white p-4 md:p-6 space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <User width={18} /> Name
                </Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Sparkle width={18} /> Username
                </Label>
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Your username"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Send width={18} /> E-mail
                </Label>
                <Input value={profile.email ?? ""} disabled />
              </div>

              <div className="flex items-center gap-3 md:col-span-2">
                <div className="flex items-center gap-2">
                  <BellRing width={18} />
                  <Label className="text-sm font-medium text-gray-700">Notifications</Label>
                </div>
                <Checkbox
                  id="notifications"
                  checked={notifications}
                  onCheckedChange={(val) => setNotifications(!!val)}
                />
                <span className="text-xs text-muted-foreground">Email alerts e promemoria</span>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <HandCoins width={18} /> Currency
                </Label>
                <Input
                  disabled
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  placeholder="Your currency"
                />
              </div>
            </div>

            {message && (
              <p className="text-sm text-green-600 bg-green-50 border border-green-100 rounded-md px-3 py-2">
                {message}
              </p>
            )}

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={resetForm} disabled={loading}>
                Annulla
              </Button>
              <Button onClick={handleSubmit} disabled={loading}>
                Aggiorna profilo
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
