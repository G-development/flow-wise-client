"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from "@/components/ui/drawer";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import Navbar from "@/components/navbar";
import SimpleTable from "@/components/table";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface Category {
  _id: string;
  name: string;
  type: string;
}

interface Budget {
  _id: string;
  category?: Category;
  [key: string]: unknown;
}

export default function Budgets() {
  // useAuth();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<{
    amount: string;
    category: string;
    period: string;
  }>({
    amount: "",
    category: "",
    period: "",
  });
  const [newCategory, setNewCategory] = useState({
    name: "",
    type: "expense",
  });
  const router = useRouter();

  return (
    <>
      <Navbar />
    </>
  );
}
