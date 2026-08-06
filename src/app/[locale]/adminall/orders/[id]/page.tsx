import React from "react";
import { auth } from "../../../../../../auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  FaShoppingCart,
  FaMoneyBillWave,
  FaTruck,
  FaCheckCircle,
  FaClock,
  FaArrowLeft,
  FaUser,
  FaMapMarkerAlt,
  FaCreditCard,
  FaCalendar,
  FaPhone,
  FaEnvelope,
  FaBox,
  FaEdit
} from "react-icons/fa";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import Image from "next/image";
import { notFound } from "next/navigation";

async function getOrderById(id: string) {
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      user: true,
      orderitems: {
        include: {
          product: true
        }
      }
    }
  });

  if (!order) return null;

  // Convert Decimal objects to numbers
  return {
    ...order,
    itemsPrice: Number(order.itemsPrice),
    shippingPrice: Number(order.shippingPrice),
    taxPrice: Number(order.taxPrice),
    totalPrice: Number(order.totalPrice),
    orderitems: order.orderitems.map(item => ({
      ...item,
      price: Number(item.price)
    }))
  };
}

export default async function OrderDetailPage({ params }: { params: { id: string } }) {
  const session = await auth();
  
  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  if (session.user.role !== "admin") {
    redirect("/");
  }

  const order = await getOrderById(params.id);

  if (!order) {
    notFound();
  }

  const shippingAddress = order.shippingAddress as any;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <div className="flex items-center mb-2">
              <Link href="/adminall/orders">
                <Button className="w-full px-4 mb-10 py-2 text-[20px] font-bold text-white bg-[#438c71] rounded-lg hover:bg-[#3a7a5f] mr-4 transition-colors" variant="ghost" size="sm" >
                  <FaArrowLeft className="w-4 h-4 mr-2" />
                  Back to Orders
                </Button>
              </Link>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Order #{order.id.slice(-8)}
            </h1>
            <p className="text-gray-600">
              Placed on {format(new Date(order.createdAt), 'MMMM dd, yyyy')}
            </p>
          </div>
          <div className="flex items-center space-x-2 mt-4 sm:mt-0">
            <Button className="w-full px-4 mb-10 py-2 text-[20px] font-bold text-white bg-[#438c71] rounded-lg hover:bg-[#3a7a5f] transition-colors" variant="outline">
              <FaEdit className="w-4 h-4 mr-2" />
              Edit Order
            </Button>
            <Button className="w-full px-4 mb-10 py-2 text-[20px] font-bold text-white bg-[#438c71] rounded-lg hover:bg-[#3a7a5f] transition-colors">
              <FaTruck className="w-4 h-4 mr-2" />
              Update Status
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FaShoppingCart className="w-5 h-5 mr-2" />
                  Order Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center">
                      <FaCreditCard className="w-5 h-5 mr-3 text-blue-500" />
                      <div>
                        <p className="font-medium">Payment Status</p>
                        <p className="text-sm text-gray-500">{order.paymentMethod}</p>
                      </div>
                    </div>
                    {order.isPaid ? (
                      <Badge variant="default">
                        <FaCheckCircle className="w-3 h-3 mr-1" />
                        Paid
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        <FaClock className="w-3 h-3 mr-1" />
                        Pending
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center">
                      <FaTruck className="w-5 h-5 mr-3 text-green-500" />
                      <div>
                        <p className="font-medium">Delivery Status</p>
                        <p className="text-sm text-gray-500">Shipping</p>
                      </div>
                    </div>
                    {order.isDelivered ? (
                      <Badge variant="default">
                        <FaCheckCircle className="w-3 h-3 mr-1" />
                        Delivered
                      </Badge>
                    ) : (
                      <Badge variant="outline">
                        <FaTruck className="w-3 h-3 mr-1" />
                        In Transit
                      </Badge>
                    )}
                  </div>
                </div>
                {order.paidAt && (
                  <p className="text-sm text-gray-500 mt-2">
                    Paid on {format(new Date(order.paidAt), 'MMMM dd, yyyy')}
                  </p>
                )}
                {order.deliveredAt && (
                  <p className="text-sm text-gray-500 mt-2">
                    Delivered on {format(new Date(order.deliveredAt), 'MMMM dd, yyyy')}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Order Items */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FaBox className="w-5 h-5 mr-2" />
                  Order Items ({order.orderitems.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {order.orderitems.map((item, index) => (
                    <div key={index} className="flex items-center space-x-4 p-4 border rounded-lg">
                      <div className="flex-shrink-0">
                        <Image
                          src={item.image}
                          alt={item.title}
                          width={64}
                          height={64}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900">{item.title}</h3>
                        <p className="text-sm text-gray-500">Quantity: {item.qty}</p>
                        <p className="text-sm text-gray-500">Price: ₾{Number(item.price).toFixed(2)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">₾{(Number(item.price) * item.qty).toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Customer Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FaUser className="w-5 h-5 mr-2" />
                  Customer Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-3">Contact Details</h4>
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <FaUser className="w-4 h-4 mr-2 text-[#438c71]" />
                        <span>{order.user.name}</span>
                      </div>
                      <div className="flex items-center">
                        <FaEnvelope className="w-4 h-4 mr-2 text-[#438c71]" />
                        <span>{order.user.email}</span>
                      </div>
                      {shippingAddress.phone && (
                        <div className="flex items-center">
                          <FaPhone className="w-4 h-4 mr-2 text-[#438c71]" />
                          <span>{shippingAddress.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-3">Shipping Address</h4>
                    <div className="space-y-2">
                      <div className="flex items-start">
                        <FaMapMarkerAlt className="w-4 h-4 mr-2 text-[#438c71] mt-0.5" />
                        <div>
                          <p>{shippingAddress.streetAddress}</p>
                          <p>{shippingAddress.city}, {shippingAddress.postalCode}</p>
                          <p>{shippingAddress.country}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FaMoneyBillWave className="w-5 h-5 mr-2" />
                  Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Items Total</span>
                      <span className="font-semibold">₾{Number(order.itemsPrice).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Shipping</span>
                      <span className="font-semibold">₾{Number(order.shippingPrice).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tax (18%)</span>
                      <span className="font-semibold">₾{Number(order.taxPrice).toFixed(2)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span className="text-[#438c71]">₾{Number(order.totalPrice).toFixed(2)}</span>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <h4 className="font-medium">Payment Information</h4>
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <FaCreditCard className="w-4 h-4 mr-2 text-[#438c71]" />
                        <span className="text-sm">{order.paymentMethod}</span>
                      </div>
                      {order.paymentResult && (
                        <div className="text-sm text-gray-500">
                          Payment ID: {(order.paymentResult as any).id || 'N/A'}
                        </div>
                      )}
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <h4 className="font-medium">Order Timeline</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                        <div>
                          <p className="font-medium">Order Placed</p>
                          <p className="text-gray-500">{format(new Date(order.createdAt), 'MMM dd, yyyy HH:mm')}</p>
                        </div>
                      </div>
                      {order.isPaid && order.paidAt && (
                        <div className="flex items-center">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                          <div>
                            <p className="font-medium">Payment Received</p>
                            <p className="text-gray-500">{format(new Date(order.paidAt), 'MMM dd, yyyy HH:mm')}</p>
                          </div>
                        </div>
                      )}
                      {order.isDelivered && order.deliveredAt && (
                        <div className="flex items-center">
                          <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                          <div>
                            <p className="font-medium">Delivered</p>
                            <p className="text-gray-500">{format(new Date(order.deliveredAt), 'MMM dd, yyyy HH:mm')}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 