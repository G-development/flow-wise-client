"use client";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";

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

    setLoading(true);
    try {
      // const filePath = `${profile.id}/${file.name}`;
      // const { data: uploadData, error: uploadError } = await supabase.storage
      //   .from("avatars")
      //   .upload(filePath, file, { upsert: true });

      // if (uploadError) throw uploadError;

      // const { data: publicUrlData } = supabase.storage
      //   .from("avatars")
      //   .getPublicUrl(filePath);

      // setProfile(
      //   (prev) => prev && { ...prev, avatar_url: publicUrlData.publicUrl }
      // );
      // setMessage("Avatar updated!");
    } catch (err) {
      console.error("Error uploading avatar:", err);
      setMessage("Failed to upload avatar.");
    }
    setLoading(false);
  };

  if (loading && !profile) return <div>Loading...</div>;
  if (!profile) return <div>Error loading profile.</div>;

  return (
    <>
      <Navbar />
      <div className="flex-1 space-y-4 p-8 pt-6">
        <h1 className="text-3xl font-bold tracking-tight">Account Settings</h1>

        <div className="max-w-lg mx-auto p-8 border rounded-xl shadow-md space-y-4">
          <Avatar
            className="h-20 w-20 rounded-lg cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            {profile.avatar_url ? (
              <AvatarImage src={profile.avatar_url} alt={profile.name} />
            ) : (
              <AvatarFallback className="rounded-lg">FW</AvatarFallback>
            )}
          </Avatar>
          <Input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            className="hidden"
            onChange={handleAvatarChange}
          />

          <h2 className="text-2xl font-semibold">{profile.name}&apos s Profile</h2>

          <div>
            <Label className="text-sm font-medium text-gray-700">
              <User className="inline mr-2" width={20} /> Name
            </Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
            />
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-700">
              <Sparkle className="inline mr-2" width={20} /> Username
            </Label>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Your username"
            />
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-700">
              <Send className="inline mr-2" width={20} /> E-mail
            </Label>
            <Input value={profile.email ?? ""} disabled />
          </div>

          <div className="flex items-center">
            <BellRing className="mr-2" width={20} />
            <Label className="text-sm font-medium text-gray-700">
              Notifications
            </Label>
            <Checkbox
              id="notifications"
              className="ml-2"
              checked={notifications}
              onCheckedChange={(val) => setNotifications(!!val)}
            />
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-700">
              <HandCoins className="inline mr-2" width={20} /> Currency
            </Label>
            <Input
              disabled
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              placeholder="Your currency"
            />
          </div>

          <div className="text-xs text-gray-500 text-right">
            <p>
              Member since:{" "}
              {profile.created_at &&
                new Date(profile.created_at).toLocaleString()}
            </p>
            <p>
              Last updated:{" "}
              {profile.updated_at &&
                new Date(profile.updated_at).toLocaleString()}
            </p>
          </div>

          {message && (
            <p className="text-center text-sm text-green-600">{message}</p>
          )}

          <div className="flex justify-center mt-4">
            <Button onClick={handleSubmit} disabled={loading}>
              Update Profile
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
