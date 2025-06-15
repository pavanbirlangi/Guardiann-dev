import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Calendar, Check, Download, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import axios from "axios";
import { toast } from "sonner";

interface Booking {
  id: string;
  booking_id: string;
  institution_id: string;
  institution_name: string;
  thumbnail_url: string;
  category_name: string;
  status: string;
  booking_date: string;
  visit_date: string;
  visit_time: string;
  amount: string;
  visitor_name: string;
  visitor_email: string;
  visitor_phone: string;
  pdf_url?: string;
}

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  profile_picture_url: string;
  address: string;
  city: string;
  state: string;
  country: string;
  created_at: string;
  last_login: string;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

const DEFAULT_THUMBNAIL = 'https://placehold.co/96x96?text=No+Image';

const UserDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("bookings");
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    fetchUserProfile();
    fetchUserBookings();
  }, []);

  const fetchUserProfile = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get<ApiResponse<UserProfile>>(
        `${import.meta.env.VITE_API_URL}/dashboard/user/data`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        setUserProfile(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      toast.error('Failed to fetch user profile');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserBookings = async () => {
    setBookingsLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get<ApiResponse<Booking[]>>(
        `${import.meta.env.VITE_API_URL}/dashboard/user/bookings`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        setBookings(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
      setError('Failed to load bookings');
      toast.error('Failed to load bookings');
    } finally {
      setBookingsLoading(false);
    }
  };
  
  const handleLogout = () => {
    logout();
    navigate('/');
  };
  
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) return;
    setIsUpdating(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.put<ApiResponse<UserProfile>>(
        `${import.meta.env.VITE_API_URL}/dashboard/user/data`,
        {
          full_name: userProfile.full_name,
          phone: userProfile.phone,
          address: userProfile.address,
          city: userProfile.city,
          state: userProfile.state,
          country: userProfile.country,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        toast.success('Profile updated successfully');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setIsUpdating(false);
    }
  };
  
  const handleViewBooking = (bookingId: string) => {
    navigate(`/booking-confirmation/${bookingId}`);
  };
  
  const getStatusBadge = (status: string) => {
    if (status === "confirmed") {
      return <Badge className="bg-green-500">Confirmed</Badge>;
    } else if (status === "pending") {
      return <Badge variant="outline" className="text-yellow-600 border-yellow-600">Pending</Badge>;
    } else {
      return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div className="bg-gray-50 py-12">
        <div className="container">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row gap-8">
              {/* Sidebar */}
              <div className="w-full md:w-64">
                <Card className="mb-6">
                  <CardHeader>
                    <div className="flex flex-col items-center">
                      <div className="w-20 h-20 bg-education-100 rounded-full flex items-center justify-center mb-4">
                        {userProfile?.profile_picture_url ? (
                          <img 
                            src={userProfile.profile_picture_url} 
                            alt={userProfile.full_name}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <User className="h-10 w-10 text-education-600" />
                        )}
                      </div>
                      <CardTitle className="text-xl">{userProfile?.full_name || user?.name}</CardTitle>
                      <CardDescription className="text-sm">{userProfile?.email || user?.email}</CardDescription>
                    </div>
                  </CardHeader>
                </Card>
                
                <div className="space-y-2">
                  <Button 
                    variant="ghost" 
                    className={`w-full justify-start ${activeTab === "bookings" ? "bg-gray-100" : ""}`}
                    onClick={() => setActiveTab("bookings")}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    My Bookings
                  </Button>
                  <Button 
                    variant="ghost" 
                    className={`w-full justify-start ${activeTab === "profile" ? "bg-gray-100" : ""}`}
                    onClick={() => setActiveTab("profile")}
                  >
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start mt-6 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                    onClick={handleLogout}
                  >
                    Logout
                  </Button>
                </div>
              </div>
              
              {/* Main Content */}
              <div className="flex-1">
                <Card>
                  <CardHeader>
                    <CardTitle>{activeTab === "bookings" ? "My Bookings" : "My Profile"}</CardTitle>
                    <CardDescription>
                      {activeTab === "bookings" ? 
                        "Manage your institution visit bookings" : 
                        "Manage your personal information"
                      }
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {activeTab === "bookings" ? (
                      <div>
                        {bookingsLoading ? (
                          <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
                            <p>Loading bookings...</p>
                          </div>
                        ) : bookings.length > 0 ? (
                          <div className="space-y-4">
                            {bookings.map((booking) => (
                              <div key={booking.id} className="border rounded-lg p-4">
                                <div className="flex flex-col md:flex-row gap-4">
                                  <div className="w-full md:w-24 h-24 relative">
                                    <img
                                      src={booking.thumbnail_url || DEFAULT_THUMBNAIL}
                                      alt={booking.institution_name}
                                      className="w-full h-full object-cover rounded"
                                      onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.src = DEFAULT_THUMBNAIL;
                                      }}
                                    />
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-2">
                                      <div>
                                        <h3 className="font-semibold text-lg">{booking.institution_name}</h3>
                                        <p className="text-sm text-gray-500">{booking.category_name}</p>
                                      </div>
                                      {getStatusBadge(booking.status)}
                                    </div>
                                    <div className="text-sm text-gray-600 mb-2">
                                      <p><span className="font-medium">Booking ID:</span> {booking.booking_id}</p>
                                      <p><span className="font-medium">Visit Date:</span> {new Date(booking.visit_date).toLocaleDateString('en-IN', {
                                        year: 'numeric',
                                        month: '2-digit',
                                        day: '2-digit'
                                      })} at {booking.visit_time}</p>
                                      <p><span className="font-medium">Amount:</span> ₹{booking.amount}</p>
                                      {booking.visitor_name && (
                                        <p><span className="font-medium">Visitor:</span> {booking.visitor_name}</p>
                                      )}
                                    </div>
                                    <div className="flex flex-wrap gap-2 mt-3">
                                      <Button
                                        size="sm"
                                        className="flex items-center gap-1"
                                        onClick={() => handleViewBooking(booking.booking_id)}
                                      >
                                        View Details
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="flex items-center gap-1"
                                        onClick={() => {
                                          if (booking.pdf_url) {
                                            window.open(booking.pdf_url, '_blank');
                                          } else {
                                            toast.error('Receipt not available');
                                          }
                                        }}
                                      >
                                        <Download className="h-4 w-4" /> Receipt
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                            <h3 className="text-lg font-medium mb-2">No Bookings Yet</h3>
                            <p className="text-gray-500 mb-4">You haven't made any bookings yet.</p>
                            <Button onClick={() => navigate("/categories")}>
                              Explore Institutions
                            </Button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <form onSubmit={handleProfileUpdate} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="full_name">Full Name</Label>
                            <Input 
                              id="full_name"
                              value={userProfile?.full_name || ''}
                              onChange={(e) => setUserProfile(prev => prev ? {...prev, full_name: e.target.value} : null)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input 
                              id="email"
                              type="email"
                              value={userProfile?.email || ''}
                              readOnly
                              disabled
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="phone">Phone Number</Label>
                            <Input 
                              id="phone"
                              value={userProfile?.phone || ''}
                              onChange={(e) => setUserProfile(prev => prev ? {...prev, phone: e.target.value} : null)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="address">Address</Label>
                            <Input 
                              id="address"
                              value={userProfile?.address || ''}
                              onChange={(e) => setUserProfile(prev => prev ? {...prev, address: e.target.value} : null)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="city">City</Label>
                            <Input 
                              id="city"
                              value={userProfile?.city || ''}
                              onChange={(e) => setUserProfile(prev => prev ? {...prev, city: e.target.value} : null)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="state">State</Label>
                            <Input 
                              id="state"
                              value={userProfile?.state || ''}
                              onChange={(e) => setUserProfile(prev => prev ? {...prev, state: e.target.value} : null)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="country">Country</Label>
                            <Input 
                              id="country"
                              value={userProfile?.country || ''}
                              onChange={(e) => setUserProfile(prev => prev ? {...prev, country: e.target.value} : null)}
                            />
                          </div>
                        </div>
                        <Button type="submit" className="mt-6" disabled={isUpdating}>
                          {isUpdating ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          ) : (
                            <>
                              <Check className="mr-2 h-4 w-4" /> Save Changes
                            </>
                          )}
                        </Button>
                      </form>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default UserDashboard;
