"use client";

import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  FaShoppingCart,
  FaMoneyBillWave,
  FaTruck,
  FaCheckCircle,
  FaClock,
  FaUser,
  FaMapMarkerAlt,
  FaCreditCard,
  FaCalendar,
  FaPhone,
  FaEnvelope,
  FaBox,
  FaEdit,
  FaEye,
  FaPrint,
  FaDownload,
  FaWhatsapp,
  FaTelegram,
  FaTrash,
} from "react-icons/fa";
import { format } from "date-fns";
import Image from "next/image";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

interface OrderItem {
  productId: string;
  qty: number;
  price: number;
  title: string;
  image: string;
}

interface ShippingAddress {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  streetAddress: string;
  city: string;
  postalCode: string;
  country: string;
  additionalInfo?: string;
}

interface Order {
  id: string;
  userId: string;
  shippingAddress: any; // Changed to any to handle JSON from database
  paymentMethod: string;
  itemsPrice: number | string;
  shippingPrice: number | string;
  taxPrice: number | string;
  totalPrice: number | string;
  isPaid: boolean;
  paidAt?: string | Date | null;
  isDelivered: boolean;
  deliveredAt?: string | Date | null;
  createdAt: string | Date;
  orderitems: OrderItem[];
  user: {
    id: string;
    name: string;
    email: string;
  };
  deliveryLocation?: string; // Add deliveryLocation to Order type
}

interface OrderManagementCardProps {
  order: Order;
  onStatusUpdate?: (
    orderId: string,
    updates: { isPaid?: boolean; isDelivered?: boolean }
  ) => void;
  onDelete?: (orderId: string) => void;
}

const OrderManagementCard: React.FC<OrderManagementCardProps> = ({
  order,
  onStatusUpdate,
  onDelete,
}) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();
  const t = useTranslations();

  // Safely extract shipping address from JSON
  const shippingAddress: ShippingAddress =
    order.shippingAddress as ShippingAddress;

  const handleStatusUpdate = async (
    field: "isPaid" | "isDelivered",
    value: boolean
  ) => {
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/orders/${order.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });

      if (!response.ok) {
        throw new Error("Failed to update order status");
      }

      toast.success(
        `Order ${field === "isPaid" ? "payment" : "delivery"} status updated successfully`
      );

      if (onStatusUpdate) {
        onStatusUpdate(order.id, { [field]: value });
      }
    } catch (error) {
      console.error("Error updating order status:", error);
      toast.error("Failed to update order status");
    } finally {
      setIsUpdating(false);
    }
  };

  const getEstimatedDelivery = () => {
    const orderDate = new Date(order.createdAt);
    const deliveryDate = new Date(orderDate);
    deliveryDate.setDate(orderDate.getDate() + 5);
    return format(deliveryDate, "MMM dd, yyyy");
  };

  // Helper function to safely convert price values
  const getPriceValue = (price: number | string): number => {
    if (typeof price === "string") {
      return parseFloat(price) || 0;
    }
    return price || 0;
  };

  // Helper function to safely format dates
  const formatDate = (date: string | Date | null | undefined): string => {
    if (!date) return "";
    return format(new Date(date), "MMM dd, yyyy HH:mm");
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this order? This action cannot be undone.")) {
      return;
    }
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/orders/${order.id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete order");
      }
      toast.success("წაშლა წარმატებით განხორციელდა");
      if (onDelete) {
        onDelete(order.id);
      }
      router.push("/adminall");
    } catch (error) {
      console.error("Error deleting order:", error);
      toast.error("Failed to delete order");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center text-lg">
              <FaShoppingCart className="w-5 h-5 mr-2 text-[#438c71]" />
              Order #{order.id.slice(-8).toUpperCase()}
            </CardTitle>
            <CardDescription>
              Placed on {formatDate(order.createdAt)}
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              className="w-full px-4 mb-10 py-2 text-[20px] font-bold text-white bg-[#438c71] rounded-lg hover:bg-[#3a7a5f] transition-colors"
              variant="outline"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
            >
              <FaEye className="w-4 h-4 mr-1" />
              {showDetails ? "Hide" : "Details"}
            </Button>
            <Button
              className="w-full px-4 mb-10 py-2 text-[20px] font-bold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              <FaTrash className="w-4 h-4 mr-1" />
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Order Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
            <div className="flex items-center">
              <FaCreditCard className="w-5 h-5 mr-3 text-blue-500" />
              <div>
                <p className="font-medium text-sm">Payment</p>
                <p className="text-xs text-gray-500">{order.paymentMethod}</p>
              </div>
            </div>
            <Badge
              variant={order.isPaid ? "default" : "secondary"}
              className="text-xs"
            >
              {order.isPaid ? "Paid" : "Pending"}
            </Badge>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
            <div className="flex items-center">
              <FaTruck className="w-5 h-5 mr-3 text-green-500" />
              <div>
                <p className="font-medium text-sm">Delivery</p>
                <p className="text-xs text-gray-500">
                  {order.isDelivered ? "Delivered" : "In Transit"}
                </p>
              </div>
            </div>
            <Badge
              variant={order.isDelivered ? "default" : "outline"}
              className="text-xs"
            >
              {order.isDelivered ? "Delivered" : "In Transit"}
            </Badge>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
            <div className="flex items-center">
              <FaMoneyBillWave className="w-5 h-5 mr-3 text-purple-500" />
              <div>
                <p className="font-medium text-sm">Total</p>
                <p className="text-xs text-gray-500">
                  {order.orderitems.length} ნივთი
                </p>
              </div>
            </div>
            <span className="font-bold text-[#438c71]">
              ₾{getPriceValue(order.totalPrice).toFixed(2)}
            </span>
          </div>
        </div>

        {/* Customer Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium mb-3 flex items-center">
              <FaUser className="w-4 h-4 mr-2 text-[#438c71]" />
              მომხმარებლის დეტალები
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center">
                <FaUser className="w-3 h-3 mr-2 text-gray-400" />
                <span className="font-medium">
                  {shippingAddress.firstName} {shippingAddress.lastName}
                </span>
              </div>
              <div className="flex items-center">
                <FaEnvelope className="w-3 h-3 mr-2 text-gray-400" />
                <span>{shippingAddress.email}</span>
              </div>
              <div className="flex items-center">
                <FaPhone className="w-3 h-3 mr-2 text-gray-400" />
                <span>{shippingAddress.phone}</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-3 flex items-center">
              <FaMapMarkerAlt className="w-4 h-4 mr-2 text-[#438c71]" />
              გადაცემის მისამართი
            </h4>
            <div className="space-y-1 text-sm">
              {/* Show delivery location/city if present */}
              {order.deliveryLocation && (
                <div className="flex items-center space-x-2">
                  <FaMapMarkerAlt className="w-3 h-3 text-gray-400" />
                  <span className="font-semibold">
                    {t(`productDetail.locations.${order.deliveryLocation}`, { defaultMessage: order.deliveryLocation.charAt(0).toUpperCase() + order.deliveryLocation.slice(1) })}
                    <span className="text-gray-600 ml-2">
                      (
                      {t(`productDetail.locations.${order.deliveryLocation}Address`, { defaultMessage: "" })}
                      )
                    </span>
                  </span>
                </div>
              )}
              <p className="font-medium">
                {shippingAddress.firstName} {shippingAddress.lastName}
              </p>
              <p>{shippingAddress.streetAddress}</p>
              <p>
                {shippingAddress.city}, {shippingAddress.postalCode}
              </p>
              <p>{shippingAddress.country}</p>
              {shippingAddress.additionalInfo && (
                <p className="text-gray-500 text-xs">
                    დამატებითი ინფორმაცია: {shippingAddress.additionalInfo}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Expandable Details */}
        {showDetails && (
          <>
            <Separator />

            {/* Order Items */}
            <div>
              <h4 className="font-medium mb-3 flex items-center">
                <FaBox className="w-4 h-4 mr-2 text-[#438c71]" />
                შეკვეთილი ნივთები ({order.orderitems.length})
              </h4>
              <div className="space-y-3">
                {order.orderitems.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-3 p-3 border rounded-lg"
                  >
                    <Image
                      src={item.image}
                      alt={item.title}
                      width={48}
                      height={48}
                      className="w-12 h-12 object-cover rounded-lg"
                    />
                    <div className="flex-1 min-w-0">
                      <h5 className="font-medium text-sm truncate">
                        {item.title}
                      </h5>
                      <p className="text-xs text-gray-500">
                        რაოდენობა: {item.qty} × ₾
                        {getPriceValue(item.price).toFixed(2)}
                      </p>
                    </div>
                    <span className="font-medium text-sm">
                      ₾{(getPriceValue(item.price) * item.qty).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Price Breakdown */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium mb-3">ფასების განლაგება</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>ნივთების ჯამი</span>
                  <span>₾{getPriceValue(order.itemsPrice).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>გადაცემის საფუძველი</span>
                  <span>₾{getPriceValue(order.shippingPrice).toFixed(2)}</span>
                </div>
             
                <Separator />
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span className="text-[#438c71]">
                    ₾{getPriceValue(order.totalPrice).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Status Management */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium mb-3">Status Management</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium mb-2">Payment Status</p>
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant={order.isPaid ? "default" : "outline"}
                      onClick={() =>
                        handleStatusUpdate("isPaid", !order.isPaid)
                      }
                      disabled={isUpdating}
                    >
                      {order.isPaid ? "Mark as Pending" : "Mark as Paid"}
                    </Button>
                    {order.isPaid && order.paidAt && (
                      <span className="text-xs text-gray-500">
                        გაგადახდილია: {formatDate(order.paidAt)}
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">Delivery Status</p>
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant={order.isDelivered ? "default" : "outline"}
                      onClick={() =>
                        handleStatusUpdate("isDelivered", !order.isDelivered)
                      }
                      disabled={isUpdating}
                    >
                      {order.isDelivered
                        ? "Mark as In Transit"
                        : "Mark as Delivered"}
                    </Button>
                    {order.isDelivered && order.deliveredAt && (
                      <span className="text-xs text-gray-500">
                        გადაცემულია: {formatDate(order.deliveredAt)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Order Timeline */}
            <div>
              <h4 className="font-medium mb-3">შეკვეთილი ნივთების დროშემობრუნება</h4>
              <div className="space-y-3">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">შეკვეთილია</p>
                    <p className="text-xs text-gray-500">
                      {formatDate(order.createdAt)}
                    </p>
                  </div>
                </div>
                {order.isPaid && order.paidAt && (
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">გაგადახდილია</p>
                      <p className="text-xs text-gray-500">
                        {formatDate(order.paidAt)}
                      </p>
                    </div>
                  </div>
                )}
                {order.isDelivered && order.deliveredAt && (
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">გადაცემულია</p>
                      <p className="text-xs text-gray-500">
                        {formatDate(order.deliveredAt)}
                      </p>
                    </div>
                  </div>
                )}
                {!order.isDelivered && (
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-gray-300 rounded-full mr-3"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">გადაცემის დრო</p>
                      <p className="text-xs text-gray-500">
                        {getEstimatedDelivery()}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default OrderManagementCard;
