"use client";

import Image from "next/image";
import Logo from "../flow-wise-logo.svg";
import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <a href="#" className="flex items-center gap-2 self-center font-medium">
          <div className="flex items-center justify-center rounded-md text-primary-foreground">
            <Image src={Logo} width={50} height={50} alt="logo"/>
          </div>
          Flow Wise
        </a>
        <LoginForm />
      </div>
    </div>
  );
}
