import React, { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "lucide-react";
import { toast } from "react-hot-toast";

interface Institution {
  id: string;
  name: string;
  address: string;
  thumbnail_url: string;
  booking_amount: string;
  contact: {
    phone: string;
    email: string;
  };
}

const BookingPage = () => {
  const { category, id } = useParams<{category: string, id: string}>();
  const navigate = useNavigate();
  const [institutionData, setInstitutionData] = useState<Institution | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    date: "",
    time: "",
    notes: "",
    termsAccepted: false,
  });
  
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  React.useEffect(() => {
    const fetchInstitutionData = async () => {
      try {
        const response = await fetch(`http://localhost:3000/api/institutions/details/${id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch institution data');
        }
        const data = await response.json();
        if (data.success) {
          setInstitutionData(data.data);
        } else {
          throw new Error(data.message || 'Failed to fetch institution data');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchInstitutionData();
    }
  }, [id]);

  if (loading) {
    return (
      <Layout>
        <div className="container py-12 text-center">
          <p>Loading...</p>
        </div>
      </Layout>
    );
  }

  if (error || !institutionData) {
    return (
      <Layout>
        <div className="container py-12 text-center">
          <h1 className="text-2xl font-bold mb-4">Institution not found</h1>
          <p>The institution you are trying to book doesn't exist.</p>
          <Link to="/categories">
            <Button className="mt-4">Back to Categories</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: "",
      });
    }
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData({
      ...formData,
      [name]: checked,
    });
    
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: "",
      });
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      errors.name = "Name is required";
    }
    
    if (!formData.phone.trim()) {
      errors.phone = "Phone number is required";
    } else if (!/^\d{10}$/.test(formData.phone.trim())) {
      errors.phone = "Please enter a valid 10-digit phone number";
    }
    
    if (!formData.email.trim()) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email.trim())) {
      errors.email = "Please enter a valid email address";
    }
    
    if (!formData.date) {
      errors.date = "Date is required";
    }
    
    if (!formData.time) {
      errors.time = "Time is required";
    }
    
    if (!formData.termsAccepted) {
      errors.termsAccepted = "You must agree to the terms and conditions";
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      try {
        // First create a booking
        const bookingResponse = await fetch('http://localhost:3000/api/institutions/book', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          },
          body: JSON.stringify({
            institution_id: id,
            visit_date: formData.date,
            visit_time: formData.time,
            amount: parseFloat(institutionData.booking_amount),
            notes: formData.notes,
            visitor_name: formData.name,
            visitor_email: formData.email,
            visitor_phone: formData.phone
          }),
        });

        if (!bookingResponse.ok) {
          const errorData = await bookingResponse.json();
          throw new Error(errorData.message || 'Failed to create booking');
        }

        const bookingData = await bookingResponse.json();
        
        // Initialize Razorpay
        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID,
          amount: bookingData.data.payment.amount,
          currency: "INR",
          name: "Guardiann",
          description: `Booking for ${institutionData.name}`,
          order_id: bookingData.data.payment.order_id,
          handler: function (response: any) {
            // Handle successful payment
            const verifyPayment = async () => {
              try {
                console.log('Payment response:', response);
                console.log('Booking data:', bookingData);

                const verifyResponse = await fetch('http://localhost:3000/api/institutions/verify-payment', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                  },
                  body: JSON.stringify({
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_signature: response.razorpay_signature,
                    booking_id: bookingData.data.booking.booking_id
                  })
                });

                const verifyData = await verifyResponse.json();
                console.log('Verification response:', verifyData);

                if (!verifyResponse.ok || !verifyData.success) {
                  throw new Error(verifyData.message || 'Payment verification failed');
                }

                // Show success message
                toast.success('Payment successful! Redirecting to booking confirmation...');

                // Redirect to booking confirmation page with the correct booking ID
                const bookingId = bookingData.data.booking.booking_id;
                console.log('Redirecting to booking confirmation with ID:', bookingId);
                navigate(`/booking-confirmation/${bookingId}`);
              } catch (error) {
                console.error('Payment verification failed:', error);
                toast.error('Payment verification failed. Please contact support.');
                // Still redirect to booking confirmation as the payment might have been successful
                const bookingId = bookingData.data.booking.booking_id;
                console.log('Redirecting to booking confirmation with ID:', bookingId);
                navigate(`/booking-confirmation/${bookingId}`);
              }
            };

            verifyPayment();
          },
          prefill: {
            name: formData.name,
            email: formData.email,
            contact: formData.phone
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
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to process booking');
      }
    }
  };

  return (
    <Layout>
      <div className="bg-gray-50 py-12">
        <div className="container">
          <div className="max-w-3xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">Book a Visit</h1>
              <p className="text-gray-600">
                Complete the form below to schedule your visit to {institutionData.name}
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-2">
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <form onSubmit={handleSubmit}>
                    <div className="space-y-6">
                      <div>
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          placeholder="Enter your full name"
                          className={formErrors.name ? "border-red-500" : ""}
                        />
                        {formErrors.name && (
                          <p className="text-red-500 text-sm mt-1">{formErrors.name}</p>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="phone">Phone Number</Label>
                          <Input
                            id="phone"
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            placeholder="10-digit mobile number"
                            className={formErrors.phone ? "border-red-500" : ""}
                          />
                          {formErrors.phone && (
                            <p className="text-red-500 text-sm mt-1">{formErrors.phone}</p>
                          )}
                        </div>
                        
                        <div>
                          <Label htmlFor="email">Email Address</Label>
                          <Input
                            id="email"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            placeholder="your@email.com"
                            className={formErrors.email ? "border-red-500" : ""}
                          />
                          {formErrors.email && (
                            <p className="text-red-500 text-sm mt-1">{formErrors.email}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="date">Preferred Date</Label>
                          <div className="relative">
                            <Input
                              id="date"
                              name="date"
                              type="date"
                              value={formData.date}
                              onChange={handleInputChange}
                              className={formErrors.date ? "border-red-500" : ""}
                              min={new Date().toISOString().split('T')[0]}
                            />
                          </div>
                          {formErrors.date && (
                            <p className="text-red-500 text-sm mt-1">{formErrors.date}</p>
                          )}
                        </div>
                        
                        <div>
                          <Label htmlFor="time">Preferred Time</Label>
                          <Input
                            id="time"
                            name="time"
                            type="time"
                            value={formData.time}
                            onChange={handleInputChange}
                            className={formErrors.time ? "border-red-500" : ""}
                          />
                          {formErrors.time && (
                            <p className="text-red-500 text-sm mt-1">{formErrors.time}</p>
                          )}
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="notes">Additional Notes (Optional)</Label>
                        <Textarea
                          id="notes"
                          name="notes"
                          value={formData.notes}
                          onChange={handleInputChange}
                          placeholder="Any specific queries or requirements"
                          rows={3}
                        />
                      </div>
                      
                      <div className="border-t pt-6">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="termsAccepted"
                            name="termsAccepted"
                            checked={formData.termsAccepted}
                            onChange={handleCheckboxChange}
                            className="h-4 w-4 text-education-600 focus:ring-education-500 border-gray-300 rounded mr-2"
                          />
                          <Label htmlFor="termsAccepted" className="text-sm">
                            I agree to the <a href="#" className="text-education-600 hover:underline">terms and conditions</a>
                          </Label>
                        </div>
                        {formErrors.termsAccepted && (
                          <p className="text-red-500 text-sm mt-1">{formErrors.termsAccepted}</p>
                        )}
                      </div>
                      
                      <Button type="submit" className="w-full">
                        Proceed to Payment (₹{institutionData.booking_amount})
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
              
              <div>
                <div className="bg-white p-6 rounded-lg shadow-sm sticky top-20">
                  <h2 className="text-xl font-semibold mb-4">Booking Summary</h2>
                  
                  <div className="mb-4">
                    <img
                      src={institutionData.thumbnail_url}
                      alt={institutionData.name}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                  </div>
                  
                  <h3 className="font-medium">{institutionData.name}</h3>
                  <p className="text-sm text-gray-600 mb-4">{institutionData.address}</p>
                  
                  <div className="border-t border-b py-4 my-4">
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-600">Booking Fee</span>
                      <span className="font-semibold">₹{institutionData.booking_amount}</span>
                    </div>
                    <p className="text-xs text-gray-500">This amount is adjustable against admission fees</p>
                  </div>
                  
                  <div className="text-sm text-gray-600 mb-4">
                    <p className="mb-2">Your booking includes:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Guided campus tour</li>
                      <li>Meeting with faculty</li>
                      <li>Admission consultation</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default BookingPage;
