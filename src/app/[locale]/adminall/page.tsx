import React from "react";
import { auth } from "../../../../auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FaPlus, 
  FaEdit, 
  FaTrash, 
  FaEye, 
  FaSearch,
  FaFilter,
  FaSort,
  FaCrown,
  FaShoppingCart,
  FaMoneyBillWave,
  FaTruck,
  FaCheckCircle,
  FaClock,
  FaUsers,
  FaCreditCard
} from "react-icons/fa";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import Image from "next/image";
import DeleteProductButton from "@/components/DeleteProductButton";
import OrderManagementCard from "@/components/OrderManagementCard";
import UserManagementCard from "@/components/UserManagementCard";
import { useTranslations } from "next-intl";

async function getAllProducts() {
  const products = await prisma.product.findMany({
    include: {
      sizes: true,
      OrderItem: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  return products;
}

async function getAllOrders() {
  const orders = await prisma.order.findMany({
    include: {
      user: true,
      orderitems: {
        include: {
          product: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  // Convert Decimal objects to numbers
  return orders.map(order => ({
    ...order,
    itemsPrice: Number(order.itemsPrice),
    shippingPrice: Number(order.shippingPrice),
    taxPrice: Number(order.taxPrice),
    totalPrice: Number(order.totalPrice),
    orderitems: order.orderitems.map(item => ({
      ...item,
      price: Number(item.price)
    }))
  }));
}

async function getAllUsers() {
  const users = await prisma.user.findMany({
    include: {
      Order: {
        include: {
          orderitems: {
            include: {
              product: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  // Convert Decimal objects to numbers in user orders
  return users.map(user => ({
    ...user,
    Order: user.Order.map(order => ({
      ...order,
      itemsPrice: Number(order.itemsPrice),
      shippingPrice: Number(order.shippingPrice),
      taxPrice: Number(order.taxPrice),
      totalPrice: Number(order.totalPrice),
      orderitems: order.orderitems.map(item => ({
        ...item,
        price: Number(item.price)
      }))
    }))
  }));
}

export default async function AdminAllPage() {
  const session = await auth();
  
  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  if (session.user.role !== "admin") {
    redirect("/");
  }

  const products = await getAllProducts();
  const orders = await getAllOrders();
  const users = await getAllUsers();

  // Calculate order statistics
  const totalOrders = orders.length;
  const pendingOrders = orders.filter(order => !order.isPaid).length;
  const deliveredOrders = orders.filter(order => order.isDelivered).length;
  const totalRevenue = orders.reduce((sum, order) => sum + Number(order.totalPrice), 0);

  // Calculate user statistics
  const totalUsers = users.length;
  const activeUsers = users.filter(user => user.Order.length > 0).length;
  const totalUserSpending = users.reduce((sum, user) => {
    return sum + user.Order.reduce((orderSum, order) => {
      return orderSum + Number(order.totalPrice);
    }, 0);
  }, 0);

  // Calculate BOG orders statistics
  const bogOrders = orders.filter(order => order.paymentMethod?.includes('BOG'));
  const bogPaidOrders = bogOrders.filter(order => order.isPaid);
  const bogPendingOrders = bogOrders.filter(order => !order.isPaid);
  const bogTotalRevenue = bogOrders.reduce((sum, order) => sum + Number(order.totalPrice), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">ადმინის პანელი</h1>
            <p className="text-gray-600">მართეთ თქვენი პროდუქტები, შეკვეთები და მომხმარებლები</p>
          </div>
          <div className="flex gap-4">
            <Link href="/new">
              <Button className="w-full px-4 mb-10 py-2 text-[20px] font-bold text-white bg-[#869dab] rounded-lg hover:bg-[#3a7a5f] transition-colors" variant="default">
                <FaPlus className="mr-2" />
                პროდუქტის დამატება
              </Button>
            </Link>
 
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-6 mb-8">
          <Card className="bg-white border-2 border-orange-400 text-orange-400">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-orange-400">ყველა პროდუქტი</p>
                  <p className="text-2xl font-bold text-orange-500">{products.length}</p>
                </div>
                <div className="text-2xl text-orange-400">
                  <FaCrown className="text-2xl" />
                </div>
              </div>
            </CardContent>
          </Card>

            <Card className="bg-white border-2 border-orange-400 text-orange-400">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-orange-400">ყველა შეკვეთა</p>
                  <p className="text-2xl font-bold text-orange-500">{totalOrders}</p>
                </div>
                <div className="text-2xl text-orange-400">
                  <FaShoppingCart className="text-2xl" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-2 border-orange-400 text-orange-400">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-orange-400">ყველა შემოსავსები</p>
                  <p className="text-2xl font-bold text-orange-500">₾{totalRevenue.toFixed(2)}</p>
                </div>
                <div className="text-2xl text-orange-400">
                  <FaMoneyBillWave className="text-2xl" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-2 border-orange-400 text-orange-400">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-orange-400">მიმდინარე შეკვეთები</p>
                  <p className="text-2xl font-bold text-orange-500">{pendingOrders}</p>
                </div>
                <div className="text-2xl text-orange-400">
                  <FaClock className="text-2xl" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-2 border-orange-400 text-orange-400">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-orange-400">ყველა მომხმარებელი</p>
                  <p className="text-2xl font-bold text-orange-500">{totalUsers}</p>
                </div>
                <div className="text-2xl text-orange-400">
                  <FaUsers className="text-2xl" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-2 border-blue-400 text-blue-400">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-400">BOG შეკვეთები</p>
                  <p className="text-2xl font-bold text-blue-500">{bogOrders.length}</p>
                  <p className="text-xs text-blue-400">{bogPaidOrders.length} paid, {bogPendingOrders.length} pending</p>
                </div>
                <div className="text-2xl text-blue-400">
                  <FaCreditCard className="text-2xl" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="products" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="products">პროდუქტები</TabsTrigger>
            <TabsTrigger value="orders">შეკვეთები</TabsTrigger>
            <TabsTrigger value="users">მომხმარებლები</TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="space-y-6">
            {/* Products Table */}
            <Card>
              <CardHeader>
                <CardTitle>ყველა პროდუქტი</CardTitle>
                <CardDescription>
                 დაამატეთ ან გამართეთ ყველა პროდუქტი
                </CardDescription>
              </CardHeader>
              <CardContent>
                {products.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b bg-white">
                          <th className="text-left p-4 font-semibold">პროდუქტი</th>
                          <th className="text-left p-4 font-semibold">კატეგორია</th>
                          <th className="text-left p-4 font-semibold">ბრენდი</th>
                          <th className="text-left p-4 font-semibold">ზომა</th>
                          <th className="text-left p-4 font-semibold">გაყიდვები</th>
                          <th className="text-left p-4 font-semibold">სტატუსი</th>
                          <th className="text-left p-4 font-semibold">ქონება</th>
                        </tr>
                      </thead>
                      <tbody>
                        {products.map((product) => (
                          <tr key={product.id} className="border-b bg-white">
                            <td className="p-4">
                              <div className="flex items-center space-x-3">
                                {product.images && product.images.length > 0 && (
                                  <Image
                                    src={product.images[0]}
                                    alt={product.title}
                                    width={48}
                                    height={48}
                                    className="w-12 h-12 object-cover rounded-lg"
                                  />
                                )}
                                <div>
                                  <p className="font-medium">{product.title}</p>
                                  <p className="text-sm text-gray-500">{product.titleEn}</p>
                                </div>
                              </div>
                            </td>
                            <td className="p-4">
                              <Badge variant="outline">
                                {product.category}
                              </Badge>
                            </td>
                            <td className="p-4">
                              <p className="font-medium">{product.brand}</p>
                            </td>
                            <td className="p-4">
                              <p className="text-sm text-gray-600">
                                {product.sizes.length} sizes
                              </p>
                            </td>
                            <td className="p-4">
                              <p className="font-medium">{product.sales || 0}</p>
                            </td>
                            <td className="p-4">
                              <div className="flex flex-col gap-1">
                                {product.popular && (
                                  <Badge variant="default" className="text-xs">
                                    Popular
                                  </Badge>
                                )}
                                <div className="flex gap-1">
                                  {product.tbilisi && (
                                    <Badge variant="secondary" className="text-xs">
                                      თბილისი
                                    </Badge>
                                  )}
                                  {product.batumi && (
                                    <Badge variant="secondary" className="text-xs">
                                      ბათუმი
                                    </Badge>
                                  )}
                                  {product.qutaisi && (
                                    <Badge variant="secondary" className="text-xs">
                                      ქუთაისი
                                    </Badge>
                                  )}
                                   {product.qutaisi && (
                                    <Badge variant="secondary" className="text-xs">
                                      ქობულეთი
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center space-x-2">
                                <Link href={`/products/${product.id}`}>
                                  <Button className="w-full px-4 mb-10 py-2 text-[20px] font-bold text-white bg-[#869dab] rounded-lg hover:bg-[#3a7a5f] transition-colors" size="sm" variant="outline">
                                    <FaEye className="w-3 h-3" />
                                  </Button>
                                </Link>
                                <Link href={`/edit?id=${product.id}`}>
                                  <Button className="w-full px-4 mb-10 py-2 text-[20px] font-bold text-white bg-[#869dab] rounded-lg hover:bg-[#3a7a5f] transition-colors" size="sm" variant="outline">
                                    <FaEdit className="w-3 h-3" />
                                  </Button>
                                </Link>
                                
                                <DeleteProductButton productId={product.id} />
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <FaPlus className="text-gray-400 text-2xl" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No products yet</h3>
                    <p className="text-gray-500 mb-6">Get started by adding your first product</p>
                    <Link href="/new">
                      <Button className="w-full px-4 mb-10 py-2 text-[20px] font-bold text-white bg-[#869dab] rounded-lg hover:bg-[#3a7a5f] transition-colors" variant="default">
                        <FaPlus className="mr-2" />
                        პროდუქტის დამატება
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders" className="space-y-6">
            {/* BOG Orders Section */}
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FaCreditCard className="text-[#869dab]" />
                      ბარათით შეკვეთები
                    </CardTitle>
                    <CardDescription>
                    ბარათით გადახდის მეთოდით შექმნილი შეკვეთები
                    </CardDescription>
                  </div>
              
                </div>
              </CardHeader>
              <CardContent>
                {bogOrders.length > 0 ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <div className="flex items-center gap-2">
                          <FaCreditCard className="text-[#869dab]" />
                          <span className="font-semibold text-blue-800">ყველა ბარათით გადახდილი შეკვეთა</span>
                        </div>
                        <p className="text-2xl font-bold text-blue-600">{bogOrders.length}</p>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                        <div className="flex items-center gap-2">
                          <FaCheckCircle className="text-[#869dab]" />
                          <span className="font-semibold text-green-800">გადახდილი</span>
                        </div>
                        <p className="text-2xl font-bold text-green-600">{bogOrders.filter(o => o.isPaid).length}</p>
                      </div>
                      <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                        <div className="flex items-center gap-2">
                          <FaClock className="text-[#869dab]" />
                          <span className="font-semibold text-orange-800">მუშავდება</span>
                        </div>
                        <p className="text-2xl font-bold text-orange-600">{bogOrders.filter(o => !o.isPaid).length}</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {bogOrders.slice(0, 3).map((order) => (
                        <div key={order.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <FaCreditCard className="text-[#869dab] text-sm" />
                            </div>
                            <div>
                              <p className="font-medium text-blue-900">Order #{order.id.slice(-8)}</p>
                              <p className="text-sm text-blue-600">{order.user.name}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-blue-900">₾{Number(order.totalPrice).toFixed(2)}</p>
                            <Badge variant={order.isPaid ? "default" : "secondary"} className="text-xs">
                              {order.isPaid ? 'BOG გადახდილი' : 'BOG მუშავდება'}
                            </Badge>
                          </div>
                        </div>
                      ))}
                      {bogOrders.length > 3 && (
                        <div className="text-center py-2">
                          <Link href="/adminall/orders?bog=true">
                            <Button variant="outline" size="sm" className="text-[#869dab] border-[#869dab] hover:bg-[#869dab]">
                             {bogOrders.length} ბარათით გადახდილი შეკვეთები
                            </Button>
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                      <FaCreditCard className="text-[#869dab] text-2xl" />
                    </div>
                    <h3 className="text-lg font-medium text-blue-900 mb-2">ბარათით გადახდილი შეკვეთები გამოვიდეს მომხმარებლების შეკვეთების შემდეგ</h3>
                    <p className="text-[#bbb272] mb-4">ბარათით გადახდილი შეკვეთები გამოვიდეს მომხმარებლების შეკვეთების შემდეგ</p>
                    <Link href="/adminall/orders">
                      <Button variant="outline" className="text-[#869dab] border-[#869dab] hover:bg-[#869dab]">
                       ყველა შეკვეთა
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

        
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            {/* Users Management Section */}
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>
                  View all users checkout information, buying history, and status details
                </CardDescription>
              </CardHeader>
              <CardContent>
                {users.length > 0 ? (
                  <div className="space-y-6">
                    {users.map((user) => (
                      <UserManagementCard
                        key={user.id}
                        user={{
                          ...user,
                          orders: user.Order.map(order => ({
                            ...order,
                            itemsPrice: order.itemsPrice.toString(),
                            shippingPrice: order.shippingPrice.toString(),
                            taxPrice: order.taxPrice.toString(),
                            totalPrice: order.totalPrice.toString(),
                            orderitems: order.orderitems.map(item => ({
                              ...item,
                              price: Number(item.price)
                            }))
                          }))
                        }}
                        currentUserId={session.user.id}
                        currentUserRole={session.user.role}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <FaUsers className="text-gray-400 text-2xl" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No users yet</h3>
                    <p className="text-gray-500 mb-6">Users will appear here when they register</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}



