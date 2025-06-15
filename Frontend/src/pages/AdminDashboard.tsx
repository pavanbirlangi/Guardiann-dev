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
  
            <TabsContent value="overview">
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