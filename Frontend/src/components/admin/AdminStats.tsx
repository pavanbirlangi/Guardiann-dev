import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";

const AdminStats = () => {
  const monthlyBookings = [
    { month: "Jan", bookings: 45, revenue: 90000 },
    { month: "Feb", bookings: 52, revenue: 104000 },
    { month: "Mar", bookings: 48, revenue: 96000 },
    { month: "Apr", bookings: 61, revenue: 122000 },
    { month: "May", bookings: 55, revenue: 110000 },
    { month: "Jun", bookings: 67, revenue: 134000 }
  ];

  const categoryData = [
    { name: "Schools", value: 35, color: "#3b82f6" },
    { name: "Colleges", value: 30, color: "#10b981" },
    { name: "Coaching", value: 20, color: "#8b5cf6" },
    { name: "PG Colleges", value: 15, color: "#f59e0b" }
  ];

  const institutionGrowth = [
    { month: "Jan", institutions: 18 },
    { month: "Feb", institutions: 20 },
    { month: "Mar", institutions: 21 },
    { month: "Apr", institutions: 22 },
    { month: "May", institutions: 23 },
    { month: "Jun", institutions: 24 }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Monthly Bookings Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Bookings</CardTitle>
          <CardDescription>Booking trends over the last 6 months</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyBookings}>
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
            <LineChart data={monthlyBookings}>
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
                data={categoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
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
            <LineChart data={institutionGrowth}>
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
  );
};

export default AdminStats;