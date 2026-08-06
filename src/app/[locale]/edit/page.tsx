import React from 'react';
import { auth } from "../../../../auth";
import { redirect } from "next/navigation";
import EditProductForm from '@/components/EditProductForm';

interface EditPageProps {
  searchParams: Promise<{ id: string }>;
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

 

  return (
    <div className="min-h-screen bg-gray-50 py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 space-y-6">
          <EditProductForm productId={id} />
        </div>
      </div>
    </div>
  );
}