import React from "react";
import { auth } from "../../../../auth";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingCart, User, List } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  FaEnvelope,
  FaCalendarAlt,
  FaPlus,
  FaMapMarkerAlt,
  FaCreditCard,
} from "react-icons/fa";
import { Link } from "@/i18n/navigation";

import { format } from "date-fns";
import { getTranslations } from "next-intl/server";
import SignOutButton from "@/components/SignOutButton";
import { getUserOrdersWithBOGStatus } from "@/lib/actions/order.actions";
import RecentOrders from "@/components/RecentOrders";

async function getCurrentUser() {
  const session = await auth();
  if (!session?.user?.id) return null;

  // Use the new function to get orders with refreshed BOG statuses
  const user = await getUserOrdersWithBOGStatus();

  if (user) {
  } else {
    console.log("User not found");
  }
  console.log("==========================");

  return user;
}

export default async function ProfilePage() {
  const user = await getCurrentUser();
  const t = await getTranslations("profile");

  if (!user) {
    redirect("/sign-in");
  }

  const isAdmin = user.role === "admin";
  const orderCount = user.Order?.length || 0;
  const cartItemCount = user.Cart?.[0]?.items?.length || 0;

  // Convert cart data to plain objects to avoid Decimal serialization issues
  const cartData = user.Cart?.[0]
    ? {
        ...user.Cart[0],
        itemsPrice: parseFloat(user.Cart[0].itemsPrice?.toString() || "0"),
        totalPrice: parseFloat(user.Cart[0].totalPrice?.toString() || "0"),
        shippingPrice: parseFloat(
          user.Cart[0].shippingPrice?.toString() || "0"
        ),
        taxPrice: parseFloat(user.Cart[0].taxPrice?.toString() || "0"),
        items: (user.Cart[0].items || []).map((item: any) => ({
          ...item,
          price: parseFloat(item.price?.toString() || "0"),
        })),
      }
    : null;

  return (
    <div className="min-h-screen mt-9  py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* User Info Card */}
          <div className="lg:col-span-1">
            <Card className="h-fit bg-white">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto w-24 h-24  bg-[#bbb272] rounded-full flex items-center justify-center mb-4">
                  <User className="text-white text-3xl" />
                </div>
                <CardTitle className="text-2xl">{user.name}</CardTitle>
                <div className="flex items-center justify-center gap-2">
                  <Badge
                    variant={isAdmin ? "default" : "secondary"}
                    className="text-sm"
                  >
                    {isAdmin ? (
                      <>
                        <div className="text-[18px] font-bold">
                          {t("admin")}
                        </div>
                      </>
                    ) : (
                      <div className="text-[18px] font-bold">{t("user")}</div>
                    )}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center border border-black gap-3 p-3 bg-white rounded-lg">
                  <div className="w-12 h-12 bg-[#bbb272] rounded-full flex items-center justify-center">
                    <FaEnvelope className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-[16px] font-bold">{t("email")}</p>
                    <p className="font-medium">{user.email}</p>
                  </div>
                </div>

                <div className="flex items-center border border-black gap-3 p-3 bg-white rounded-lg">
                  <div className="w-12 h-12 bg-[#bbb272] rounded-full flex items-center justify-center">
                    <FaCalendarAlt className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-[16px] font-bold">{t("memberSince")}</p>
                    <p className="font-medium">
                      {format(new Date(user.createdAt), "MMM dd, yyyy")}
                    </p>
                  </div>
                </div>

                {user.address && (
                  <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
                    <div className="w-12 h-12 bg-[#bbb272] rounded-full flex items-center justify-center">
                      <FaMapMarkerAlt className="w-6 h-6 text-white" />
                    </div>

                    <div>
                      <p className="text-[16px] font-bold">{t("address")}</p>
                      <p className="font-medium text-sm">
                        {typeof user.address === "object" &&
                        user.address !== null
                          ? `${(user.address as any).street || ""} ${(user.address as any).city || ""}`
                          : t("addressSaved")}
                      </p>
                    </div>
                  </div>
                )}

                {user.paymentMethod && (
                  <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
                    <div className="w-12 h-12 bg-[#bbb272] rounded-full flex items-center justify-center">
                      <FaCreditCard className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-[16px] font-bold">
                        {t("paymentMethod")}
                      </p>
                      <p className="font-medium text-sm">
                        •••• •••• •••• {user.paymentMethod.slice(-4)}
                      </p>
                    </div>
                  </div>
                )}
                <div className="flex justify-center">
                  <Link
                    className="inline-flex items-center font-medium text-blue-600 dark:text-blue-500 hover:underline"
                    href="/forgot-password"
                  >
                    {t("recoverPassword")}
                  </Link>
                </div>

                {/* Sign Out Button */}
                <div className="pt-3">
                  <SignOutButton />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Stats */}
            <div className="grid bg-white rounded-xl grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-white flex justify-center items-center rounded-xl border-2 border-black">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-row justify-center items-center gap-3">
                      <p className="text-sm text-black">
                        {t("totalOrders")}
                      </p>
                      <p className="text-[20px] font-bold text-black">
                        {orderCount}
                      </p>
                    </div>
               
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white flex justify-center items-center rounded-xl border-2 border-black">
                <CardContent className="p-6">
                  <div className="flex  bg-white items-center flex-row justify-between">
                    <div className="flex flex-row justify-center items-center gap-3">
                      <p className="text-sm text-black">
                        {t("cartItems")}
                      </p>
                      <p className="text-[20px] font-bold black">
                        {cartItemCount}
                      </p>
                    </div>
                  
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Admin Actions */}
            {isAdmin && (
              <Card className="bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="text-[20px] font-bold">
                      {t("adminActions.title")}
                    </div>
                  </CardTitle>
                  <CardDescription>
                    {t("adminActions.description")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Link href="/new">
                      <Button
                        className="w-full px-4  py-2 text-[20px] font-bold text-white bg-[#bbb272] rounded-lg  transition-colors"
                        variant="default"
                      >
                        <FaPlus className="mr-2" />
                        {t("adminActions.addNewProduct")}
                      </Button>
                    </Link>
                    <Link href="/adminall">
                      <Button
                        className="w-full px-4  py-2 text-[20px] font-bold text-white bg-[#bbb272] rounded-lg  transition-colors"
                        variant="outline"
                      >
                        <List className="mr-2" />
                        {t("adminActions.actions")}
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )}

            <RecentOrders
              orders={
                user.Order?.map((order) => ({
                  id: order.id,
                  createdAt: order.createdAt.toISOString(),
                  totalPrice: parseFloat(order.totalPrice.toString()),
                  // ახლა პირდაპირ ბაზის isPaid-ს იყენებ
                  isPaid: order.isPaid,
                  isDelivered: order.isDelivered,
                  paymentMethod: order.paymentMethod,
                  orderitems: (order.orderitems || []).map((item) => ({
                    ...item,
                    price: parseFloat(item.price.toString()),
                    qty: parseInt(item.qty.toString()),
                  })),
                })) || []
              }
            />

            {/* Quick Actions */}
            <Card>
              <CardHeader className="text-start md:text-center">
                <CardTitle className="text-[20px] md:text-start text-start font-bold">
                  {t("quickActions.title")}
                </CardTitle>
                <CardDescription className="md:text-start  text-start">
                  {t("quickActions.description")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid mx-auto grid-cols-1 md:grid-cols-2 gap-4">
                  <Link
                    className="flex  justify-center md:justify-start"
                    href="/cart"
                  >
                    <Button className="w-full md:w-[70%]      px-4 py-2 text-[20px] font-bold text-black bg-white border-2 border-black hover:border-[#bbb272] rounded-lg  hover:bg-[#bbb272] hover:text-white transition-colors flex  gap-2">
                      <ShoppingCart className="mr-2" />
                      {t("quickActions.viewCart")}
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
