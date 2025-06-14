import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Download, Eye, Search, Filter, Calendar } from "lucide-react";
import { toast } from "sonner";
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface Booking {
  booking_id: string;
  institution_name: string;
  visitor_name: string;
  visitor_email: string;
  visitor_phone: string;
  booking_date: string;
  visit_date: string;
  visit_time: string;
  amount: number;
  status: string;
  payment_id: string;
  category_name: string;
  pdf_url?: string;
}

interface ApiResponse {
  success: boolean;
  data: Booking[];
}

const BookingsManagement = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const { data: bookingsData, isLoading, error } = useQuery<Booking[]>({
    queryKey: ['admin-bookings', statusFilter, categoryFilter, searchTerm],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (categoryFilter !== 'all') params.append('category', categoryFilter);
      if (searchTerm) params.append('search', searchTerm);

      const response = await api.get<ApiResponse>(`/dashboard/admin/bookings?${params.toString()}`);
      return response.data.data;
    }
  });

  useEffect(() => {
    if (error) {
      toast.error('Failed to load bookings');
    }
  }, [error]);

  const filteredBookings = bookingsData || [];

  const handleStatusChange = async (bookingId: string, newStatus: string) => {
    try {
      await api.patch(`/dashboard/admin/bookings/${bookingId}/status`, { status: newStatus });
      toast.success(`Booking status updated to ${newStatus}`);
    } catch (error) {
      toast.error('Failed to update booking status');
    }
  };

  const handleDownloadReceipt = async (booking: Booking) => {
    try {
      if (booking.pdf_url) {
        window.open(booking.pdf_url, '_blank');
      } else {
        toast.error('Receipt not available');
      }
    } catch (error) {
      toast.error('Failed to download receipt');
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "confirmed": return "default";
      case "pending": return "secondary";
      case "cancelled": return "destructive";
      default: return "secondary";
    }
  };

  const totalRevenue = bookingsData
    ?.filter(b => b.status === "confirmed")
    .reduce((sum, booking) => sum + booking.amount, 0) || 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Bookings Management</h2>
          <p className="text-gray-600">Manage all booking requests and payments</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-600">Total Revenue</p>
          <p className="text-2xl font-bold text-green-600">₹{totalRevenue.toLocaleString()}</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "Total Bookings", value: bookingsData?.length || 0, color: "bg-blue-500" },
          { label: "Confirmed", value: bookingsData?.filter(b => b.status === "confirmed").length || 0, color: "bg-green-500" },
          { label: "Pending", value: bookingsData?.filter(b => b.status === "pending").length || 0, color: "bg-yellow-500" },
          { label: "Cancelled", value: bookingsData?.filter(b => b.status === "cancelled").length || 0, color: "bg-red-500" }
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{stat.label}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                  <div className={`w-3 h-3 rounded-full ${stat.color}`}></div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter & Search</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by student name, institution, or booking ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="schools">Schools</SelectItem>
                <SelectItem value="colleges">Colleges</SelectItem>
                <SelectItem value="coaching">Coaching</SelectItem>
                <SelectItem value="pg-colleges">PG Colleges</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bookings Table */}
      <Card>
        <CardHeader>
          <CardTitle>Booking Records</CardTitle>
          <CardDescription>Showing {filteredBookings.length} of {bookingsData?.length || 0} bookings</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Booking ID</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Institution</TableHead>
                <TableHead>Visit Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBookings.map((booking) => (
                <TableRow key={booking.booking_id}>
                  <TableCell className="font-medium">{booking.booking_id}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{booking.visitor_name}</p>
                      <p className="text-sm text-gray-600">{booking.visitor_email}</p>
                      <p className="text-sm text-gray-600">{booking.visitor_phone}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{booking.institution_name}</p>
                      <p className="text-sm text-gray-600 capitalize">{booking.category_name}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {booking.visit_date} at {booking.visit_time}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">₹{booking.amount.toLocaleString()}</TableCell>
                  <TableCell>
                    <Select 
                      value={booking.status} 
                      onValueChange={(value) => handleStatusChange(booking.booking_id, value)}
                    >
                      <SelectTrigger className="w-32">
                        <Badge variant={getStatusBadgeVariant(booking.status)}>
                          {booking.status}
                        </Badge>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleDownloadReceipt(booking)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default BookingsManagement;
