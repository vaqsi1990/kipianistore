import React from "react";
import { auth } from "../../../../../auth";
import { redirect } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { FaArrowLeft } from "react-icons/fa";
import StoresAdminPanel from "@/components/StoresAdminPanel";
import { getAllStoresAdmin } from "@/lib/actions/store.actions";

export default async function AdminStoresPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== "admin") {
    redirect("/");
  }

  const stores = await getAllStoresAdmin();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">ფილიალების მართვა</h1>
            <p className="text-gray-600">
              დაამატეთ ან შეცვალეთ ქალაქები და მისამართები — პროდუქტებზე მიბმა პროდუქტის ფორმიდან ხდება
            </p>
          </div>
          <Link href="/adminall">
            <Button variant="outline">
              <FaArrowLeft className="mr-2" />
              უკან
            </Button>
          </Link>
        </div>

        <StoresAdminPanel initialStores={stores} />
      </div>
    </div>
  );
}
