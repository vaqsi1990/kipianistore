import React from "react";
import { auth } from "../../../../auth";
import { redirect } from "next/navigation";
import EditProductForm from "@/components/EditProductForm";
import { getFinaProductForEdit } from "@/lib/actions/fina-product.actions";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

interface EditPageProps {
  searchParams: Promise<{ id?: string }>;
}

export default async function EditPage({ searchParams }: EditPageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  if (session.user.role !== "admin") {
    redirect("/");
  }

  const { id } = await searchParams;
  if (!id) {
    redirect("/adminall");
  }

  const product = await getFinaProductForEdit(id);

  return (
    <div className="min-h-screen bg-gray-50 py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 space-y-6">
          {product ? (
            <EditProductForm product={product} />
          ) : (
            <div className="text-center space-y-4 py-8">
              <h2 className="text-2xl font-bold">პროდუქტი ვერ მოიძებნა</h2>
              <p className="text-gray-600">ეს FINA პროდუქტი აღარ არის კატალოგში.</p>
              <Link href="/adminall">
                <Button>ადმინ პანელი</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
