import React, { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { useQuery } from "@tanstack/react-query";
import axiosInstance from "@/lib/axios";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Users, BookOpen, Building2, Calendar } from "lucide-react";

interface AdminStatsData {
  totalStats: {
    totalCategories: number;
    totalInstitutions: number;
    totalBookings: number;
    totalRevenue: number;
    categoriesGrowth: number;
    institutionsGrowth: number;
    bookingsGrowth: number;
    revenueGrowth: number;
  };
  recentBookings: Array<{
    booking_id: string;
    visitor_name: string;
    visitor_email: string;
    booking_date: string;
    status: string;
    amount: number;
    institution_name: string;
    category_name: string;
  }>;
  monthlyStats: Array<{
    month: string;
    bookings: number;
    revenue: number;
  }>;
  categoryStats: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  institutionGrowth: Array<{
    month: string;
    institutions: number;
  }>;
}

interface ApiResponse {
  success: boolean;
  data: AdminStatsData;
}

const AdminStats = () => {
  const { data: statsData, isLoading, error } = useQuery<AdminStatsData>({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const response = await axiosInstance.get<ApiResponse>('/dashboard/admin/stats');
      return response.data.data;
    }
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="h-4 w-24 bg-gray-200 animate-pulse rounded" />
                    <div className="h-8 w-16 bg-gray-200 animate-pulse rounded mt-2" />
                  </div>
                  <div className="h-3 w-3 bg-gray-200 animate-pulse rounded-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-6 w-32 bg-gray-200 animate-pulse rounded" />
                <div className="h-4 w-48 bg-gray-200 animate-pulse rounded mt-2" />
              </CardHeader>
              <CardContent>
                <div className="h-[300px] bg-gray-200 animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">Failed to load statistics</p>
      </div>
    );
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case "confirmed":
        return "default";
      case "pending":
        return "secondary";
      case "cancelled":
        return "destructive";
      default:
        return "secondary";
    }
  };

  return (
    <div className="space-y-6">
      {/* Total Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { 
            label: "Total Categories", 
            value: statsData?.totalStats.totalCategories, 
            growth: statsData?.totalStats.categoriesGrowth,
            color: "bg-blue-500",
            icon: "🏫",
            isPercentage: false
          },
          { 
            label: "Total Institutions", 
            value: statsData?.totalStats.totalInstitutions, 
            growth: statsData?.totalStats.institutionsGrowth,
            color: "bg-green-500",
            icon: "🏢",
            isPercentage: false
          },
          { 
            label: "Total Bookings", 
            value: statsData?.totalStats.totalBookings, 
            growth: statsData?.totalStats.bookingsGrowth,
            color: "bg-yellow-500",
            icon: "📅",
            isPercentage: false
          },
          { 
            label: "Total Revenue", 
            value: `₹${statsData?.totalStats.totalRevenue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`, 
            growth: statsData?.totalStats.revenueGrowth,
            color: "bg-purple-500",
            icon: "💰",
            isPercentage: true
          }
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{stat.icon}</span>
                    <p className="text-sm text-gray-600">{stat.label}</p>
                  </div>
                  <p className="text-2xl font-bold mt-2">{stat.value}</p>
                  {stat.growth !== undefined && (
                    <span className={`text-sm ${stat.growth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {stat.growth >= 0 ? '+' : ''}
                      {stat.isPercentage ? `${stat.growth}%` : stat.growth} this month
                    </span>
                  )}
                </div>
                <div className={`w-3 h-3 rounded-full ${stat.color}`}></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Bookings */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Bookings</CardTitle>
          <CardDescription>Latest booking requests</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {statsData?.recentBookings.map((booking) => (
              <div key={booking.booking_id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">{booking.visitor_name}</p>
                  <p className="text-sm text-gray-600">{booking.visitor_email}</p>
                  <p className="text-sm text-gray-600">{booking.institution_name}</p>
                </div>
                <div className="text-right">
                  <Badge variant={getStatusBadgeVariant(booking.status)}>
                    {booking.status}
                  </Badge>
                  <p className="text-sm text-gray-600 mt-1">
                    {format(new Date(booking.booking_date), 'MMM d, yyyy h:mm a')}
                  </p>
                  <p className="font-medium">₹{booking.amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Bookings Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Bookings</CardTitle>
            <CardDescription>Booking trends over the last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={statsData?.monthlyStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="bookings" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Revenue</CardTitle>
            <CardDescription>Revenue trends over the last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={statsData?.monthlyStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => [`₹${value.toLocaleString()}`, "Revenue"]} />
                <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Category Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Bookings by Category</CardTitle>
            <CardDescription>Distribution of bookings across categories</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statsData?.categoryStats}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statsData?.categoryStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Institution Growth */}
        <Card>
          <CardHeader>
            <CardTitle>Institution Growth</CardTitle>
            <CardDescription>Number of institutions over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={statsData?.institutionGrowth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="institutions" stroke="#8b5cf6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminStats;