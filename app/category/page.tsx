"use client";

import { DynamicTable } from "@/components/dynamic-table";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/navbar";
import { useCategories, useUpdateCategory } from "@/lib/hooks/useQueries";
import { toast } from "sonner";

interface Category {
  id: string;
  name: string;
  type: string;
  userid: string;
  active: boolean;
}

export default function Categories() {
  const { data: categories = [], isLoading, isError } = useCategories();
  const updateCategory = useUpdateCategory();

  const toggleActive = (category: Category) => {
    updateCategory.mutate(
      {
        id: category.id,
        data: { active: !category.active },
      },
      {
        onError: () => {
          toast.error("Failed to update category");
        },
      }
    );
  };

  return (
    <>
      <Navbar />
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between space-y-2 lg:space-y-0 gap-4">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Categories</h1>
        </div>

        {isLoading && <p>Loading categories...</p>}
        {isError && <p className="text-red-500">Failed to load categories</p>}

        {!isLoading && !isError && categories.length === 0 && (
          <p>You have no categories yet.</p>
        )}

        {!isLoading && categories.length > 0 && (
          <div className="overflow-x-auto">
            <DynamicTable
              data={categories.map((c) => {
                const type = c.type?.toLowerCase();
                const isIncome = type === "income" || type === "i";
                const label = isIncome ? "Income" : "Expense";
                const badgeClass = isIncome
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-rose-100 text-rose-800";

                return {
                  Name: c.name,
                  Type: <Badge className={`${badgeClass} font-medium`}>{label}</Badge>,
                  Active: (
                    <Switch
                      checked={c.active}
                      onCheckedChange={() => toggleActive(c)}
                    />
                  ),
                };
              })}
              caption={`You currently have ${categories.length} categories.`}
            />
          </div>
        )}
      </div>
    </>
  );
}
