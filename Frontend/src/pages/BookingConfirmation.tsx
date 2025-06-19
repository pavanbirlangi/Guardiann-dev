import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '@/config';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin, Phone, Download, ArrowLeft, Check, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import Layout from '@/components/Layout';
import { generateGoogleCalendarUrl, generateOutlookCalendarUrl } from '@/utils/calendar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface BookingData {
  booking_id: string;
  institution_name: string;
  thumbnail_url: string | null;
  category_name: string;
  visit_date: string;
  visit_time: string;
  amount: number;
  status: string;
  visitor_name: string;
  institution_address: string;
  institution_city: string;
  institution_state: string;
  institution_contact: {
    phone?: string;
  };
  visiting_hours: Array<{
    day: string;
    hours: string;
  }>;
  payment_id: string;
  visitor_email: string;
  visitor_phone: string;
  pdf_url?: string;
  notes?: string;
}

const BookingConfirmation = () => {
  const { booking_id } = useParams();
  const [booking, setBooking] = useState<BookingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        if (!booking_id) {
          setError('Booking ID is required');
          setLoading(false);
          return;
        }

        const response = await fetch(`${import.meta.env.VITE_API_URL}/institutions/booking/${booking_id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          }
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Failed to fetch booking details');
        }

        setBooking(data.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch booking details');
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [booking_id]);

  const getStatusUI = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return {
          headerBg: 'bg-green-50',
          iconBg: 'bg-green-100',
          iconColor: 'text-green-600',
          titleColor: 'text-green-800',
          messageColor: 'text-green-700',
          title: 'Booking Confirmed!',
          message: 'Your visit has been successfully scheduled.',
          paymentStatus: {
            bg: 'bg-green-100',
            text: 'text-green-800',
            label: 'Successful'
          },
          icon: <Check className="h-8 w-8" />
        };
      case 'pending':
        return {
          headerBg: 'bg-yellow-50',
          iconBg: 'bg-yellow-100',
          iconColor: 'text-yellow-600',
          titleColor: 'text-yellow-800',
          messageColor: 'text-yellow-700',
          title: 'Booking Pending',
          message: 'Your booking is pending payment confirmation.',
          paymentStatus: {
            bg: 'bg-yellow-100',
            text: 'text-yellow-800',
            label: 'Pending'
          },
          icon: <AlertCircle className="h-8 w-8" />
        };
      case 'cancelled':
        return {
          headerBg: 'bg-red-50',
          iconBg: 'bg-red-100',
          iconColor: 'text-red-600',
          titleColor: 'text-red-800',
          messageColor: 'text-red-700',
          title: 'Booking Cancelled',
          message: 'This booking has been cancelled.',
          paymentStatus: {
            bg: 'bg-red-100',
            text: 'text-red-800',
            label: 'Cancelled'
          },
          icon: <AlertCircle className="h-8 w-8" />
        };
      default:
        return {
          headerBg: 'bg-gray-50',
          iconBg: 'bg-gray-100',
          iconColor: 'text-gray-600',
          titleColor: 'text-gray-800',
          messageColor: 'text-gray-700',
          title: 'Booking Status',
          message: 'Your booking status is being processed.',
          paymentStatus: {
            bg: 'bg-gray-100',
            text: 'text-gray-800',
            label: status
          },
          icon: <AlertCircle className="h-8 w-8" />
        };
    }
  };

  const handlePayment = async () => {
    try {
      // Create payment order
      const orderResponse = await fetch(`${import.meta.env.VITE_API_URL}/institutions/payment/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({
          amount: booking.amount,
          booking_id: booking.booking_id
        })
      });

      const orderData = await orderResponse.json();

      if (!orderResponse.ok || !orderData.success) {
        throw new Error(orderData.message || 'Failed to create payment order');
      }

      // Initialize Razorpay
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: orderData.data.amount,
        currency: "INR",
        name: "Guardiann",
        description: `Booking for ${booking.institution_name}`,
        order_id: orderData.data.order_id,
        handler: async function (response: any) {
          try {
            // Verify payment
            const verifyResponse = await fetch(`${import.meta.env.VITE_API_URL}/institutions/verify-payment`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                booking_id: booking.booking_id
              })
            });

            const verifyData = await verifyResponse.json();

            if (!verifyResponse.ok || !verifyData.success) {
              throw new Error(verifyData.message || 'Payment verification failed');
            }

            toast.success('Payment successful!');
            // Refresh the page to show updated status
            window.location.reload();
          } catch (error) {
            console.error('Payment verification failed:', error);
            toast.error('Payment verification failed. Please contact support.');
          }
        },
        prefill: {
          name: booking.visitor_name,
          email: booking.visitor_email,
          contact: booking.visitor_phone
        },
        theme: {
          color: "#2563eb"
        },
        method: {
          upi: true,
          card: true,
          netbanking: true,
          wallet: true
        }
      };

      const razorpay = new (window as any).Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error('Payment initialization failed:', error);
      toast.error('Failed to initialize payment. Please try again.');
    }
  };

  const handleAddToCalendar = (calendarType: 'google' | 'outlook') => {
    if (!booking) return;

    const visitDate = new Date(booking.visit_date);
    const [hours, minutes] = booking.visit_time.split(':').map(Number);
    visitDate.setHours(hours, minutes);

    // Set end time to 1 hour after start time
    const endDate = new Date(visitDate);
    endDate.setHours(endDate.getHours() + 1);

    const event = {
      title: `Visit to ${booking.institution_name}`,
      description: `Booking ID: ${booking.booking_id}\n\nPurpose: ${booking.notes || 'Institution Visit'}\n\nContact: ${booking.institution_contact?.phone || 'N/A'}`,
      startTime: visitDate.toISOString(),
      endTime: endDate.toISOString(),
      location: booking.institution_address
    };

    const url = calendarType === 'google' 
      ? generateGoogleCalendarUrl(event)
      : generateOutlookCalendarUrl(event);

    window.open(url, '_blank');
  };

  if (loading) {
    return (
      <Layout>
        <div className="container py-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      </Layout>
    );
  }

  if (error || !booking) {
    return (
      <Layout>
        <div className="container py-12 text-center">
          <h1 className="text-2xl font-bold mb-4">Booking not found</h1>
          <p>We couldn't find details for this booking.</p>
          <Button className="mt-4" onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </Button>
        </div>
      </Layout>
    );
  }

  const bookingDate = new Date();
  const statusUI = getStatusUI(booking.status);

  return (
    <Layout>
      <div className="bg-gray-50 py-12">
        <div className="container">
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              {/* Status header */}
              <div className={`${statusUI.headerBg} p-6 text-center`}>
                <div className={`w-16 h-16 ${statusUI.iconBg} rounded-full flex items-center justify-center mx-auto mb-4`}>
                  <div className={statusUI.iconColor}>
                    {statusUI.icon}
                  </div>
                </div>
                <h1 className={`text-2xl font-bold ${statusUI.titleColor} mb-2`}>{statusUI.title}</h1>
                <p className={statusUI.messageColor}>
                  {statusUI.message}
                </p>
              </div>
              
              {/* Booking details */}
              <div className="p-6">
                <div className="flex items-start gap-4 mb-6">
                  <img
                    src={booking.thumbnail_url || 'https://placehold.co/400x400?text=No+Image'}
                    alt={booking.institution_name}
                    className="w-20 h-20 object-cover rounded-lg"
                  />
                  <div>
                    <h2 className="font-semibold text-xl">{booking.institution_name}</h2>
                    <p className="text-gray-600 text-sm">{booking.institution_address}</p>
                  </div>
                </div>
                
                <div className="border rounded-lg p-4 mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm text-gray-500 mb-1">Booking ID</h3>
                      <p className="font-semibold">{booking.booking_id}</p>
                    </div>
                    <div>
                      <h3 className="text-sm text-gray-500 mb-1">Booking Date</h3>
                      <p>{bookingDate.toLocaleDateString()}</p>
                    </div>
                    <div>
                      <h3 className="text-sm text-gray-500 mb-1">Visit Date</h3>
                      <p>{new Date(booking.visit_date).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <h3 className="text-sm text-gray-500 mb-1">Visit Time</h3>
                      <p>{booking.visit_time}</p>
                    </div>
                    <div>
                      <h3 className="text-sm text-gray-500 mb-1">Amount</h3>
                      <p className="font-semibold">₹{booking.amount}</p>
                    </div>
                    <div>
                      <h3 className="text-sm text-gray-500 mb-1">Payment Status</h3>
                      <span className={`inline-block ${statusUI.paymentStatus.bg} ${statusUI.paymentStatus.text} px-2 py-1 rounded text-xs`}>
                        {statusUI.paymentStatus.label}
                      </span>
                    </div>
                    {booking.status === 'confirmed' && (
                      <>
                        <div>
                          <h3 className="text-sm text-gray-500 mb-1">Payment ID</h3>
                          <p className="font-semibold">{booking.payment_id}</p>
                        </div>
                        <div>
                          <h3 className="text-sm text-gray-500 mb-1">Visitor Name</h3>
                          <p>{booking.visitor_name}</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
                
                {booking.status === 'confirmed' && (
                  <div className="bg-gray-50 p-4 rounded-lg mb-6">
                    <h3 className="font-medium mb-2">What's Next?</h3>
                    <ul className="text-sm space-y-2">
                      <li className="flex items-start">
                        <Check className="h-4 w-4 text-green-600 mr-2 mt-1 flex-shrink-0" />
                        <span>You will receive a confirmation email with your booking details.</span>
                      </li>
                      <li className="flex items-start">
                        <Check className="h-4 w-4 text-green-600 mr-2 mt-1 flex-shrink-0" />
                        <span>Reach the campus at the scheduled time as mentioned in your booking.</span>
                      </li>
                      <li className="flex items-start">
                        <Check className="h-4 w-4 text-green-600 mr-2 mt-1 flex-shrink-0" />
                        <span>Please carry your booking ID and a valid ID proof during your visit.</span>
                      </li>
                    </ul>
                  </div>
                )}
                
                <div className="flex flex-col sm:flex-row gap-4">
                  {booking.status === 'confirmed' && (
                    <>
                      <Button 
                        className="flex items-center gap-2"
                        onClick={() => {
                          if (booking.pdf_url) {
                            window.open(booking.pdf_url, '_blank');
                          } else {
                            toast.error('Receipt not available');
                          }
                        }}
                      >
                        <Download className="h-4 w-4" />
                        Download Receipt
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button className="flex items-center gap-2" variant="outline">
                            <Calendar className="h-4 w-4" />
                            Add to Calendar
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => handleAddToCalendar('google')}>
                            Add to Google Calendar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleAddToCalendar('outlook')}>
                            Add to Outlook Calendar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </>
                  )}
                  {booking.status === 'pending' && (
                    <Button className="flex items-center gap-2" onClick={handlePayment}>
                      Proceed to Payment
                    </Button>
                  )}
                </div>
              </div>
              
              {/* Footer */}
              <div className="border-t p-6">
                <p className="text-center text-gray-600 text-sm mb-4">
                  Thank you for choosing Guardiann.
                </p>
                <div className="text-center">
                  <Button variant="link" onClick={() => navigate('/')}>
                    Back to Home
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default BookingConfirmation;
