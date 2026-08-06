"use client";

import { Button } from "@/components/ui/button";
import { FaTrash } from "react-icons/fa";
import { deleteProduct } from "@/lib/actions/actions";
import { useRouter } from "next/navigation";

interface DeleteProductButtonProps {
  productId: string;
}

export default function DeleteProductButton({ productId }: DeleteProductButtonProps) {
  const router = useRouter();

  const handleDelete = async () => {
    try {
      await deleteProduct(productId);
      router.refresh();
    } catch (error) {
      console.error("Error deleting product:", error);
    }
  };

  return (
    <Button 
      size="sm" 
      variant="outline" 
      className="w-full px-4 mb-10 py-2 text-[20px] font-bold text-white bg-[#438c71] rounded-lg hover:bg-[#3a7a5f] transition-colors" 
      onClick={handleDelete}
    >
      <FaTrash className="w-3 h-3" />
    </Button>
  );
} 