'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  FaUser,
  FaEnvelope,
  FaPhone,
  FaShoppingCart,
  FaMoneyBillWave,
  FaCalendar,
  FaMapMarkerAlt,
  FaEye,
  FaPrint,
  FaWhatsapp,
  FaTelegram,
  FaHistory,
  FaBox,
  FaCheckCircle,
  FaClock,
  FaTruck,
  FaTrash
} from "react-icons/fa";
import { format } from "date-fns";
import Image from "next/image";
import { toast } from "sonner";
import { formatUserName } from "@/lib/utils";

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
  idNumber: string;
  streetAddress: string;
  city: string;
  postalCode: string;
  country: string;
  additionalInfo?: string;
}

interface Order {
  id: string;
  userId: string;
  shippingAddress: any;
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
}

interface User {
  id: string;
  name: string;
  lastName?: string | null;
  email: string;
  role: string;
  createdAt: string | Date;
  orders: Order[];
}

interface UserManagementCardProps {
  user: User;
  currentUserId?: string;
  currentUserRole?: string;
}

const UserManagementCard: React.FC<UserManagementCardProps> = ({ user, currentUserId, currentUserRole }) => {
  const [showDetails, setShowDetails] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const totalOrders = user.orders.length;
  const totalSpent = user.orders.reduce((sum, order) => {
    const total = typeof order.totalPrice === 'string' ? parseFloat(order.totalPrice) : order.totalPrice;
    return sum + (total || 0);
  }, 0);
  const paidOrders = user.orders.filter(order => order.isPaid).length;
  const deliveredOrders = user.orders.filter(order => order.isDelivered).length;

  // Check if current user can delete this user
  const canDelete = currentUserRole === 'admin' && currentUserId !== user.id;

  const handleDeleteUser = async () => {
    if (!canDelete) {
      toast.error('You cannot delete this user');
      return;
    }

    if (!confirm(`Are you sure you want to delete user "${formatUserName(user) || user.name}"? This action cannot be undone.`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('წაშლა წარმატებით განხორციელდა');
        // Refresh the page to update the user list
        window.location.reload();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (date: string | Date | null | undefined): string => {
    if (!date) return '';
    return format(new Date(date), 'MMM dd, yyyy HH:mm');
  };

  const getPriceValue = (price: number | string): number => {
    if (typeof price === 'string') {
      return parseFloat(price) || 0;
    }
    return price || 0;
  };

  const getLatestShippingAddress = (): ShippingAddress | null => {
    const latestOrder = user.orders[0];
    return latestOrder?.shippingAddress as ShippingAddress || null;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center text-lg">
              <FaUser className="w-5 h-5 mr-2 text-[#438c71]" />
              {formatUserName(user) || user.name}
            </CardTitle>
            <CardDescription>
              Member since {formatDate(user.createdAt)} • {user.role}
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
              {showDetails ? 'Hide' : 'Details'}
            </Button>
            
            {canDelete && (
              <Button
                className="w-full px-4 mb-10 py-2 text-[20px] font-bold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                variant="outline"
                size="sm"
                onClick={handleDeleteUser}
                disabled={isDeleting}
              >
                <FaTrash className="w-4 h-4 mr-1" />
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* User Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
            <div className="flex items-center">
              <FaShoppingCart className="w-5 h-5 mr-3 text-blue-500" />
              <div>
                <p className="font-medium text-sm">Total Orders</p>
                <p className="text-xs text-gray-500">All time</p>
              </div>
            </div>
            <span className="font-bold text-blue-600">{totalOrders}</span>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
            <div className="flex items-center">
              <FaMoneyBillWave className="w-5 h-5 mr-3 text-green-500" />
              <div>
                <p className="font-medium text-sm">Total Spent</p>
                <p className="text-xs text-gray-500">All time</p>
              </div>
            </div>
            <span className="font-bold text-green-600">₾{totalSpent.toFixed(2)}</span>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
            <div className="flex items-center">
              <FaCheckCircle className="w-5 h-5 mr-3 text-purple-500" />
              <div>
                <p className="font-medium text-sm">Paid Orders</p>
                <p className="text-xs text-gray-500">Completed</p>
              </div>
            </div>
            <span className="font-bold text-purple-600">{paidOrders}</span>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
            <div className="flex items-center">
              <FaTruck className="w-5 h-5 mr-3 text-orange-500" />
              <div>
                <p className="font-medium text-sm">Delivered</p>
                <p className="text-xs text-gray-500">Completed</p>
              </div>
            </div>
            <span className="font-bold text-orange-600">{deliveredOrders}</span>
          </div>
        </div>

        {/* User Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium mb-3 flex items-center">
              <FaUser className="w-4 h-4 mr-2 text-[#438c71]" />
              Contact Information
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center">
                <FaUser className="w-3 h-3 mr-2 text-gray-400" />
                <span className="font-medium">{formatUserName(user) || user.name}</span>
              </div>
              <div className="flex items-center">
                <FaEnvelope className="w-3 h-3 mr-2 text-gray-400" />
                <span>{user.email}</span>
              </div>
              {getLatestShippingAddress()?.phone && (
                <div className="flex items-center">
                  <FaPhone className="w-3 h-3 mr-2 text-gray-400" />
                  <span>{getLatestShippingAddress()?.phone}</span>
                </div>
              )}
              {getLatestShippingAddress()?.idNumber && (
                <div className="flex items-center">
                  <FaUser className="w-3 h-3 mr-2 text-gray-400" />
                  <span>ID: {getLatestShippingAddress()?.idNumber}</span>
                </div>
              )}
            </div>
            
        
          </div>

          <div>
            <h4 className="font-medium mb-3 flex items-center">
              <FaMapMarkerAlt className="w-4 h-4 mr-2 text-[#438c71]" />
              Latest Shipping Address
            </h4>
            {getLatestShippingAddress() ? (
              <div className="space-y-1 text-sm">
                <p className="font-medium">
                  {getLatestShippingAddress()?.firstName} {getLatestShippingAddress()?.lastName}
                </p>
                <p>{getLatestShippingAddress()?.streetAddress}</p>
                <p>{getLatestShippingAddress()?.city}, {getLatestShippingAddress()?.postalCode}</p>
                <p>{getLatestShippingAddress()?.country}</p>
                {getLatestShippingAddress()?.additionalInfo && (
                  <p className="text-gray-500 text-xs">
                    Additional Info: {getLatestShippingAddress()?.additionalInfo}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No shipping address available</p>
            )}
          </div>
        </div>

        {/* Expandable Details */}
        {showDetails && (
          <>
            <Separator />
            
            {/* Order History */}
            <div>
              <h4 className="font-medium mb-3 flex items-center">
                <FaHistory className="w-4 h-4 mr-2 text-[#438c71]" />
                Order History ({totalOrders} orders)
              </h4>
              <div className="space-y-4">
                {user.orders.length > 0 ? (
                  user.orders.map((order, index) => (
                    <div key={order.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h5 className="font-medium">Order #{order.id.slice(-8).toUpperCase()}</h5>
                          <p className="text-sm text-gray-500">{formatDate(order.createdAt)}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge 
                            variant={order.isPaid ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {order.isPaid ? 'Paid' : 'Pending'}
                          </Badge>
                          <Badge 
                            variant={order.isDelivered ? "default" : "outline"}
                            className="text-xs"
                          >
                            {order.isDelivered ? 'Delivered' : 'In Transit'}
                          </Badge>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedOrder(selectedOrder?.id === order.id ? null : order)}
                          >
                            <FaEye className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>

                      {/* Order Items Preview */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium mb-2">Items ({order.orderitems.length})</p>
                          <div className="space-y-2">
                            {order.orderitems.slice(0, 3).map((item, itemIndex) => (
                              <div key={itemIndex} className="flex items-center space-x-2 text-sm">
                                <Image
                                  src={item.image}
                                  alt={item.title}
                                  width={24}
                                  height={24}
                                  className="w-6 h-6 object-cover rounded"
                                />
                                <span className="truncate">{item.title}</span>
                                <span className="text-gray-500">x{item.qty}</span>
                              </div>
                            ))}
                            {order.orderitems.length > 3 && (
                              <p className="text-xs text-gray-500">
                                +{order.orderitems.length - 3} more items
                              </p>
                            )}
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-medium mb-2">Order Summary</p>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span>Items Total</span>
                              <span>₾{getPriceValue(order.itemsPrice).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Shipping</span>
                              <span>₾{getPriceValue(order.shippingPrice).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Tax</span>
                              <span>₾{getPriceValue(order.taxPrice).toFixed(2)}</span>
                            </div>
                            <Separator />
                            <div className="flex justify-between font-medium">
                              <span>Total</span>
                              <span className="text-[#438c71]">₾{getPriceValue(order.totalPrice).toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Detailed Order Items (Expandable) */}
                      {selectedOrder?.id === order.id && (
                        <div className="mt-4 pt-4 border-t">
                          <h6 className="font-medium mb-3">All Items</h6>
                          <div className="space-y-3">
                            {order.orderitems.map((item, itemIndex) => (
                              <div key={itemIndex} className="flex items-center space-x-3 p-3 border rounded-lg">
                                <Image
                                  src={item.image}
                                  alt={item.title}
                                  width={48}
                                  height={48}
                                  className="w-12 h-12 object-cover rounded-lg"
                                />
                                <div className="flex-1 min-w-0">
                                  <h5 className="font-medium text-sm truncate">{item.title}</h5>
                                  <p className="text-xs text-gray-500">Qty: {item.qty} × ₾{getPriceValue(item.price).toFixed(2)}</p>
                                </div>
                                <span className="font-medium text-sm">
                                  ₾{(getPriceValue(item.price) * item.qty).toFixed(2)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <FaShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No orders yet</p>
                  </div>
                )}
              </div>
            </div>

            {/* User Statistics */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium mb-3">User Statistics</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Average Order Value</p>
                  <p className="font-medium">₾{totalOrders > 0 ? (totalSpent / totalOrders).toFixed(2) : '0.00'}</p>
                </div>
                <div>
                  <p className="text-gray-600">Payment Success Rate</p>
                  <p className="font-medium">{totalOrders > 0 ? ((paidOrders / totalOrders) * 100).toFixed(1) : '0'}%</p>
                </div>
                <div>
                  <p className="text-gray-600">Delivery Success Rate</p>
                  <p className="font-medium">{totalOrders > 0 ? ((deliveredOrders / totalOrders) * 100).toFixed(1) : '0'}%</p>
                </div>
                <div>
                  <p className="text-gray-600">Last Order</p>
                  <p className="font-medium">{user.orders.length > 0 ? formatDate(user.orders[0].createdAt) : 'Never'}</p>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default UserManagementCard; 