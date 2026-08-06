"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Separator } from "@/components/ui/separator";
import {
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  Truck,
  CreditCard,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { useCart } from "@/lib/context/CartContext";
import Image from "next/image";

const CartPage = () => {
  const t = useTranslations();
  const router = useRouter();
  const params = useParams();
  const { cart, loading, refreshCart, removeFromCartOptimistic, updateCart } =
    useCart();
  const [updating, setUpdating] = useState<string | null>(null);



  const handleQuantityChange = async (
    productId: string,
    size: string,
    newQuantity: number
  ) => {
    if (newQuantity < 1) return;

    setUpdating(`${productId}-${size}`);

    // Store original cart state for rollback
    const originalCart = cart;

    // Optimistically update the UI immediately
    if (cart) {
      const updatedItems = cart.items.map((item) =>
        item.productId === productId && item.size === size
          ? { ...item, qty: newQuantity }
          : item
      );

      // Calculate new totals
      const itemsPrice = updatedItems.reduce(
        (sum, item) => sum + parseFloat(item.price) * item.qty,
        0
      );
      const taxPrice = itemsPrice * 0.18; // 18% tax
      const shippingPrice = itemsPrice > 100 ? 0 : 10; // Free shipping over 100
      const totalPrice = itemsPrice + taxPrice + shippingPrice;

      // Update cart immediately
      updateCart({
        ...cart,
        items: updatedItems,
        itemsPrice: itemsPrice.toString(),
        totalPrice: totalPrice.toString(),
        shippingPrice: shippingPrice.toString(),
        taxPrice: taxPrice.toString(),
      });
    }

    try {
      const response = await fetch("/api/cart/update-quantity", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ productId, size, quantity: newQuantity }),
      });

      if (!response.ok) {
        throw new Error("რაოდენობის განახლება ვერ მოხერხდა");
      }

      // Force refresh cart to ensure sync with server
      await refreshCart(true);
      toast.success("კალათა განახლდა");
    } catch (error) {
      console.error("Error updating quantity:", error);
      toast.error("რაოდენობის განახლება ვერ მოხერხდა");

      // Rollback to original state on error
      if (originalCart) {
        updateCart(originalCart);
      }
    } finally {
      setUpdating(null);
    }
  };

  const handleRemoveItem = async (productId: string, size: string) => {
    setUpdating(`${productId}-${size}`);

    // Optimistically remove from UI
    removeFromCartOptimistic(productId, size);

    try {
      const response = await fetch("/api/cart/remove", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ productId, size }),
      });

      if (!response.ok) {
        throw new Error("პროდუქტის წაშლა ვერ მოხერხდა");
      }

      await refreshCart();
      toast.success("პროდუქტი წაშლილია კალათიდან");
    } catch (error) {
      console.error("Error removing item:", error);
      toast.error("პროდუქტის წაშლა ვერ მოხერხდა");
      // Refresh cart to revert optimistic update on error
      await refreshCart();
    } finally {
      setUpdating(null);
    }
  };

  const handleClearCart = async () => {
    try {
      const response = await fetch("/api/cart/clear", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("კალათის გასუფთავება ვერ მოხერხდა");
      }

      await refreshCart();
      toast.success("კალათა გასუფთავდა");
    } catch (error) {
      console.error("Error clearing cart:", error);
      toast.error("კალათის გასუფთავება ვერ მოხერხდა");
    }
  };

  const handleCheckout = () => {
    if (!cart || cart.items.length === 0) {
      toast.error("კალათა ცარიელია");
      return;
    }
    router.push(`/${params.locale}/checkout/personal`);
  };

  const formatPrice = (price: string) => {
    return `₾${parseFloat(price).toFixed(2)}`;
  };

  const formatSize = (size: string) => {
    return size.replace("SIZE_", "").replace("_", "x");
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-white rounded w-1/4 mb-8"></div>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-white rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="container mt-[120px] min-h-screen mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-8">
            <ShoppingBag className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {t("cart.empty")}
            </h1>
            <p className="text-gray-600 mb-8">{t("cart.emptyDescription")}</p>
            <Link href="/list">
              <Button
                variant="outline"
                className="w-full md:w-[30%] px-4  mb-10  py-2 text-[20px] font-bold text-white bg-[#438c71] rounded-lg hover:bg-[#3a7a5f] transition-colors "
              >
                {t("cart.continueShopping")}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container min-h-screen mx-auto px-2 sm:px-4 py-4 sm:py-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row items-center mt-[60px] sm:mt-[100px] justify-between mb-6 sm:mb-8 gap-4 sm:gap-0">
          <h1 className="text-[20px] md:text-3xl mt-5 md:mt-0  font-bold text-white w-full sm:w-auto text-center sm:text-left">
            {t("cart.title")}
          </h1>
          <Button
            onClick={handleClearCart}
            className="w-full mr-0 md:mr-[38px] sm:w-[40%] md:w-[25%] px-4 py-2 text-[20px] font-bold text-[#438c71] bg-white border-2 border-[#438c71] rounded-lg hover:bg-[#438c71] hover:text-white transition-colors flex items-center justify-center gap-2"
          >
            {t("cart.clearCart")}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg sm:text-xl md:text-2xl">
                  <ShoppingBag className="h-5 w-5 mr-2" />
                  {t("cart.items")} ({cart.items.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {cart.items.map((item) => (
                  <div
                    key={`${item.productId}-${item.size}`}
                    className="flex flex-col md:text-start text-center sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4 p-2 sm:p-4 border rounded-lg"
                  >
                    <div className="flex-shrink-0">
                      <Image
                        src={item.image}
                        alt={item.name}
                        className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-md"
                        width={80}
                        height={80}
                      />
                    </div>
                    <div className="flex-1 min-w-0 w-full">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
                        {item.name}
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-600">
                        Size: {formatSize(item.size)}
                      </p>
                      <p className="text-base sm:text-lg font-bold text-[#438c71]">
                        {formatPrice(item.price)}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2 mt-2 sm:mt-0">
                      <button
                        className="text-[#438c71] bg-white border-2 border-[#438c71] hover:bg-[#438c71] hover:text-white rounded-lg px-2 sm:px-3"
                        onClick={() =>
                          handleQuantityChange(
                            item.productId,
                            item.size,
                            item.qty - 1
                          )
                        }
                        disabled={updating === `${item.productId}-${item.size}`}
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="w-8 sm:w-12 text-center font-semibold">
                        {updating === `${item.productId}-${item.size}`
                          ? "..."
                          : item.qty}
                      </span>
                      <button
                        className="text-[#438c71] bg-white border-2 border-[#438c71] hover:bg-[#438c71] hover:text-white rounded-lg px-2 sm:px-3"
                        onClick={() =>
                          handleQuantityChange(
                            item.productId,
                            item.size,
                            item.qty + 1
                          )
                        }
                        disabled={updating === `${item.productId}-${item.size}`}
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="text-right w-full sm:w-auto mt-2 sm:mt-0">
                      <p className="text-base text-center md:text-left sm:text-lg font-bold text-[#438c71]">
                        {formatPrice(
                          (parseFloat(item.price) * item.qty).toString()
                        )}
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        handleRemoveItem(item.productId, item.size)
                      }
                      disabled={updating === `${item.productId}-${item.size}`}
                      className="text-red-600 mt-2 p-0 mb-2 h-auto w-auto"
                    >
                      <Trash2 className="h-6 w-6 " />
                    </button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1 w-full">
            <Card className="sticky top-8 w-full max-w-full">
              <CardHeader>
                <CardTitle className="flex items-center text-lg sm:text-xl md:text-2xl">
                  <CreditCard className="h-5 w-5 mr-2" />
                  {t("cart.orderSummary")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600 md:text-[20px] text-[18px]">{t("cart.subtotal")}</span>
                    <span className="font-semibold md:text-[20px] text-[18px]">
                      {formatPrice(cart.itemsPrice)}
                    </span>
                  </div>

                  <Separator />
                  <div className="flex justify-between md:text-[20px] text-[18px] font-bold">
                    <span>{t("cart.total")}</span>
                    <span className="text-[#438c71]">
                      {formatPrice(cart.totalPrice)}
                    </span>
                  </div>
                </div>

                <Button
                 
                  onClick={handleCheckout}
                  className="w-full  px-4 mb-6 py-2 text-[20px] font-bold text-white bg-[#438c71] rounded-lg hover:bg-[#3a7a5f] transition-colors"
                >
                  {t("cart.checkout")}
                </Button>

                <Link href="/list">
                  <Button className="w-full sm:w-[80%] mx-auto mt-4 sm:mt-8 px-4 py-2 text-[20px] font-bold text-[#438c71] bg-white border-2 border-[#438c71] rounded-lg hover:bg-[#438c71] hover:text-white transition-colors flex items-center justify-center gap-2">
                    {t("cart.continueShopping")}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
