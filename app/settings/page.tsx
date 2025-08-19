"use client";
import { useEffect, useState, useRef } from "react";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  User,
  KeySquare,
  Send,
  HandCoins,
  BellRing,
  Sparkle,
  Fingerprint,
} from "lucide-react";
import Navbar from "@/components/navbar";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function Settings() {
  // useAuth();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const data = {
    name: "name",
    email: "email",
    profilePic: "profilePic",
    currency: "currency",
    notifications: "notifications",
    createdAt: "createdAt",
    updatedAt: "updatedAt",
    authMethod: "authMethod",
  };

  const [name, setName] = useState<string>(data?.name || "");
  const [username, setUsername] = useState<string>(
    data?.email.split("@")[0] || ""
  );

  useEffect(() => {
    if (data) {
      setName(data.name);
      setUsername(data.email.split("@")[0]);
    }
  }, [data]);

  const handleSubmit = async () => {
    console.log("Submit");
  };

  const handleAvatarChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    console.log("Submit");
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("image", file);

    try {
      const response = await fetch(`${API_URL}/users/profile/photo`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("fw-token")}`,
        },
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Upload failed");

      console.log("Profile picture updated:", data.profilePic);
    } catch (error) {
      console.error(
        "Error updating profile picture:",
        (error as Error).message
      );
    }
  };

  return (
    <>
      <Navbar />
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex flex-col lg:flex-row items-center justify-between space-y-2 lg:space-y-0">
          <h1 className="text-3xl font-bold tracking-tight">Account - WIP</h1>
          {/* <DatePickerWithRange /> */}
        </div>

        <div className="max-w-lg mx-auto p-8 border rounded-xl shadow-md">
          {/* <div className="max-w-lg rounded-xl border bg-card text-card-foreground shadow"> */}
          <Avatar
            className="h-20 w-20 rounded-lg"
            onClick={() => {
              fileInputRef.current?.click();
            }}
          >
            <AvatarImage src={data?.profilePic} alt={data?.name} />
            <AvatarFallback className="rounded-lg">FW</AvatarFallback>
          </Avatar>
          <Input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            className="hidden"
            onChange={handleAvatarChange}
          />
          <h1 className="text-2xl font-semibold">
            {data?.name + "'s"} profile
          </h1>

          <div className="mt-6 flex-col justify-center items-center">
            {/* Name */}
            <div className="mb-4 mt-4">
              <Label className="text-sm font-medium text-gray-700">
                <User className="inline mr-2" width={20} /> Name
              </Label>
              <Input
                className="mt-2"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled
                placeholder="Your name"
              />
            </div>

            {/* Username */}
            <div className="mb-4 mt-4">
              <Label className="text-sm font-medium text-gray-700">
                <Sparkle className="inline mr-2" width={20} /> Username
              </Label>
              <Input
                className="mt-2"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled
                placeholder="Your username"
              />
            </div>

            {/* Password */}
            <div className="mb-4 mt-4">
              <Label className="text-sm font-medium text-gray-700">
                <KeySquare className="inline mr-2" width={20} /> Password
              </Label>
              <Input className="mt-2" disabled placeholder="******" />
            </div>

            {/* E-mail */}
            <div className="mb-4 mt-4">
              <Label className="text-sm font-medium text-gray-700">
                <Send className="inline mr-2" width={20} /> E-mail
              </Label>
              <Input
                className="mt-2"
                value={data?.email}
                disabled
                placeholder="Your email"
              />
            </div>

            {/* Notifications */}
            <div className="mb-4 mt-4">
              <Label className="text-sm font-medium text-gray-700">
                <BellRing className="inline mr-2" width={20} /> Notifications
                <Checkbox
                  id="notifications"
                  className="ml-2"
                  disabled
                  value={String(data?.notifications)}
                />
              </Label>
            </div>

            {/* Currency */}
            <div className="mb-4 mt-4">
              <Label className="text-sm font-medium text-gray-700">
                <HandCoins className="inline mr-2" width={20} /> Favorite
                currency
              </Label>
              <Input
                className="mt-2"
                value={data?.currency}
                disabled
                placeholder="Your currency"
              />
            </div>

            {/* Auth method */}
            <div className="mb-4 mt-4">
              <Label className="text-sm font-medium text-gray-700">
                <Fingerprint className="inline mr-2" width={20} /> Auth method
              </Label>
              <Input
                className="mt-2"
                value={data?.authMethod}
                disabled
                placeholder="Auth"
              />
            </div>

            {/* Account Information */}
            <div className="mb-4 mt-4">
              <p className="text-xs text-gray-500 text-right">
                You have been with us since:
                {data?.createdAt && new Date(data.createdAt).toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 text-right">
                Last modified:
                {data?.updatedAt && new Date(data.updatedAt).toLocaleString()}
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex justify-center items-center">
              <Button
                onClick={handleSubmit}
                //   disabled={loading}
                disabled={true}
              ></Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
