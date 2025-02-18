"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useFetch } from "@/hooks/useFetch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { User, KeySquare, Send, Sparkle } from "lucide-react";
import Navbar from "@/components/navbar";

interface UserData {
  name: string;
  email: string;
  currency: string;
  notifications: boolean;
  authMethod: string;
  _id: string;
  createdAt: string;
  updatedAt: string;
}

export default function Settings() {
  useAuth();
  const { data, loading, error } = useFetch<UserData>("users/profile");

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

  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;

  return (
    <>
      <Navbar />
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex flex-col lg:flex-row items-center justify-between space-y-2 lg:space-y-0">
          <h1 className="text-3xl font-bold tracking-tight">Settings - WIP</h1>
          {/* <DatePickerWithRange /> */}
        </div>

        <div className="max-w-lg mx-auto p-4">
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
              >
                {loading ? "Updating..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
