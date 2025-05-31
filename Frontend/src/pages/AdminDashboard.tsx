import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import React, { useState } from "react";
import { motion } from "framer-motion";
import Layout from "@/components/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
    Settings, 
    School, 
    Calendar, 
    BarChart3, 
    Users, 
    DollarSign,
    Download,
    Eye,
    Edit,
    Trash2,
    Plus
  } from "lucide-react";
  import CategoriesManagement from "@/components/admin/CategoriesManagement";
  import InstitutionsManagement from "@/components/admin/InstitutionsManagement";
  import BookingsManagement from "@/components/admin/BookingsManagement";
  import AdminStats from "@/components/admin/AdminStats";
  import SettingsManagement from "@/components/admin/SettingsManagement";
  
  const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState("overview");
    const { user, logout } = useAuth();
  
    // Mock data for overview
    const overviewStats = [
      {
        title: "Total Categories",
        value: "4",
        change: "+2 this month",
        icon: <School className="h-4 w-4" />,
        color: "bg-blue-500"
      },
      {
        title: "Total Institutions",
        value: "24",
        change: "+8 this month",
        icon: <Settings className="h-4 w-4" />,
        color: "bg-green-500"
      },
      {
        title: "Total Bookings",
        value: "156",
        change: "+23 this week",
        icon: <Calendar className="h-4 w-4" />,
        color: "bg-purple-500"
      },
      {
        title: "Revenue",
        value: "₹3,12,000",
        change: "+12% this month",
        icon: <DollarSign className="h-4 w-4" />,
        color: "bg-amber-500"
      }
    ];
  
    const recentBookings = [
      {
        id: 1,
        institutionName: "Delhi Public School",
        studentName: "Rahul Sharma",
        date: "2024-01-15",
        amount: "₹2,000",
        status: "confirmed"
      },
      {
        id: 2,
        institutionName: "IIT Delhi",
        studentName: "Priya Patel",
        date: "2024-01-16",
        amount: "₹2,000",
        status: "pending"
      },
      {
        id: 3,
        institutionName: "AIIMS Delhi",
        studentName: "Amit Kumar",
        date: "2024-01-17",
        amount: "₹2,000",
        status: "confirmed"
      }
    ];
  
    return (
      <Layout>
        <motion.div 
          className="container py-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
            <p className="text-gray-600">Manage your educational platform</p>
          </div>
  
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="categories">Categories</TabsTrigger>
              <TabsTrigger value="institutions">Institutions</TabsTrigger>
              <TabsTrigger value="bookings">Bookings</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
  
            <TabsContent value="overview" className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {overviewStats.map((stat, index) => (
                  <motion.div
                    key={stat.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                        <div className={`p-2 rounded-md ${stat.color} text-white`}>
                          {stat.icon}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{stat.value}</div>
                        <p className="text-xs text-muted-foreground">{stat.change}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
  
              {/* Recent Bookings */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Bookings</CardTitle>
                  <CardDescription>Latest booking requests and confirmations</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentBookings.map((booking) => (
                      <div key={booking.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium">{booking.institutionName}</h4>
                          <p className="text-sm text-gray-600">{booking.studentName}</p>
                          <p className="text-xs text-gray-500">{booking.date}</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="font-medium">{booking.amount}</span>
                          <Badge variant={booking.status === "confirmed" ? "default" : "secondary"}>
                            {booking.status}
                          </Badge>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
  
              <AdminStats />
            </TabsContent>
  
            <TabsContent value="categories">
              <CategoriesManagement />
            </TabsContent>
  
            <TabsContent value="institutions">
              <InstitutionsManagement />
            </TabsContent>
  
            <TabsContent value="bookings">
              <BookingsManagement />
            </TabsContent>
  
            <TabsContent value="settings">
              <SettingsManagement />
            </TabsContent>
          </Tabs>
        </motion.div>
      </Layout>
    );
  };
  
  export default AdminDashboard;