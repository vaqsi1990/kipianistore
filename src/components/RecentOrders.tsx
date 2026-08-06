"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FaClock, FaCheckCircle, FaTruck } from "react-icons/fa";
import { format } from "date-fns";
import { useTranslations } from "next-intl";

interface OrderItem {
  image: string;
  orderId: string;
  productId: string;
  qty: number;
  price: number;
  title: string;
}

interface Order {
  id: string;
  createdAt: string | Date;
  totalPrice: number;
  isPaid: boolean;
  isDelivered: boolean;
  paymentMethod: string;
  paymentStatus?: string;
  orderitems: OrderItem[];
}

interface RecentOrdersProps {
  orders: Order[];
  onOrdersUpdate?: (orders: Order[]) => void;
}

const RecentOrders: React.FC<RecentOrdersProps> = ({
  orders,
  onOrdersUpdate,
}) => {
  const t = useTranslations("profile");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [localOrders, setLocalOrders] = useState<Order[]>(orders);

  useEffect(() => {
    setLocalOrders(orders);
  }, [orders]);

  const refreshBOGOrders = async () => {
    setIsRefreshing(true);
    try {
      const bogOrders = localOrders.filter((order) =>
        order.paymentMethod?.includes("BOG")
      );

      const updatedOrders = await Promise.all(
        bogOrders.map(async (order) => {
          try {
            const response = await fetch(`/api/orders/bog-status/${order.id}`);
            if (response.ok) {
              const data = await response.json();
              return data.order;
            }
            return order;
          } catch (error) {
            return order;
          }
        })
      );

      const newOrders = localOrders.map((order) => {
        const updatedOrder = updatedOrders.find((uo) => uo.id === order.id);
        if (updatedOrder) {
          return {
            ...order,
            isPaid: updatedOrder.isPaid ?? order.isPaid,
            paymentMethod: updatedOrder.paymentMethod ?? order.paymentMethod,
            totalPrice: updatedOrder.totalPrice ?? order.totalPrice,
            paymentStatus: updatedOrder.paymentStatus ?? order.paymentStatus,
          };
        }
        return order;
      });

      setLocalOrders(newOrders);
      if (onOrdersUpdate) {
        onOrdersUpdate(newOrders);
      }
    } catch (error) {
      alert(t("recentOrders.errorFetchingStatus"));
    } finally {
      setIsRefreshing(false);
    }
  };

  const getStatusText = (order: Order) => {
    if (order.isPaid) return t("recentOrders.paid");
    return order.paymentStatus || t("recentOrders.pending");
  };

  const getStatusIcon = (order: Order) => {
    return order.isPaid ? (
      <FaCheckCircle className="w-4 h-4 text-green-600" />
    ) : (
      <FaClock className="w-4 h-4 text-gray-600" />
    );
  };

  const getStatusVariant = (order: Order) => {
    return order.isPaid ? "default" : "secondary";
  };

  if (!localOrders || localOrders.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {t("recentOrders.title")}
          </CardTitle>
          <CardDescription>{t("recentOrders.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <FaClock className="text-gray-400 text-2xl" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {t("recentOrders.noOrders")}
            </h3>
            <p className="text-gray-500">
              {t("recentOrders.noOrdersDescription")}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {t("recentOrders.title")}
            </CardTitle>
            <CardDescription>{t("recentOrders.description")}</CardDescription>
          </div>
          {localOrders.some((order) => order.paymentMethod?.includes("BOG")) && (
            <button
              onClick={refreshBOGOrders}
              disabled={isRefreshing}
              className="bg-[#bbb272] text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-[#bbb272]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRefreshing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  {t("recentOrders.refreshing")}
                </>
              ) : (
                <>🔄 {t("recentOrders.refreshAll")}</>
              )}
            </button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {localOrders.map((order) => (
            <div key={order.id} className="block">
              <div className="flex items-center border-black justify-between p-3.5 border rounded-lg transition">
                <div>
                  <p className="font-medium">
                    {t("recentOrders.orderNumber", {
                      number: order.id.slice(-8),
                    })}
                  </p>
                  <p className="text-[16px] text-gray-500">
                    {format(new Date(order.createdAt), "MMM dd, yyyy")}
                  </p>
                  <p className="text-sm text-gray-500">
                    {t("recentOrders.total", {
                      amount: order.totalPrice,
                    })}
                  </p>
                  <p className="text-xs text-gray-400">
                    {order.paymentMethod}
                  </p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2 mb-2">
                    {getStatusIcon(order)}
                    <Badge
                      className="text-[16px]"
                      variant={getStatusVariant(order)}
                    >
                      {getStatusText(order)}
                    </Badge>
                  </div>
                  {order.isDelivered && (
                    <Badge variant="outline" className="ml-2">
                      <FaTruck className="w-3 h-3 mr-1" />
                      {t("recentOrders.delivered")}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default RecentOrders;