"use client";

import { DynamicTable } from "@/components/dynamic-table";
import { Switch } from "@/components/ui/switch";
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
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex flex-col lg:flex-row items-center justify-between space-y-2 lg:space-y-0">
          <h1 className="text-3xl font-bold tracking-tight">Categories</h1>
        </div>

        {isLoading && <p>Loading categories...</p>}
        {isError && <p className="text-red-500">Failed to load categories</p>}

        {!isLoading && !isError && categories.length === 0 && (
          <p>You have no categories yet.</p>
        )}

        {!isLoading && categories.length > 0 && (
          <DynamicTable
            data={categories.map((c) => ({
              Name: c.name,
              Type: c.type,
              Active: (
                <Switch
                  checked={c.active}
                  onCheckedChange={() => toggleActive(c)}
                />
              ),
            }))}
            caption={`You currently have ${categories.length} categories.`}
          />
        )}
      </div>
    </>
  );
}
