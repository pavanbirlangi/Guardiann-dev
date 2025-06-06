import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar as CalendarIcon } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { format } from 'date-fns';
import { Card } from '@/components/ui/card';
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

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
  visiting_hours?: string[];
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

interface BookingResponse {
  booking_id: string;
  status: string;
  amount: number;
  visit_date: string;
  visit_time: string;
  payment_id?: string;
}

const BookingPage = () => {
  const { category, id } = useParams<{category: string, id: string}>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [institution, setInstitution] = useState<Institution | null>(null);
  
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState('');
  const [visitorName, setVisitorName] = useState('');
  const [visitorEmail, setVisitorEmail] = useState('');
  const [visitorPhone, setVisitorPhone] = useState('');
  const [notes, setNotes] = useState('');

  const { data: institutionData, isLoading } = useQuery<Institution>({
    queryKey: ['institution', id],
    queryFn: async () => {
      const response = await api.get<ApiResponse<Institution>>(`/api/institutions/details/${id}`);
      return response.data.data;
    },
    enabled: !!id,
  });

  useEffect(() => {
    const fetchInstitutionDetails = async () => {
      try {
        setLoading(true);
        const response = await axios.get<ApiResponse<Institution>>(
          `${import.meta.env.VITE_API_URL}/institutions/details/${id}`
        );
        
        if (response.data.success) {
          setInstitution(response.data.data);
        } else {
          throw new Error(response.data.message || 'Failed to fetch institution details');
        }
      } catch (error: any) {
        console.error('Error fetching institution:', error);
        toast.error(error.response?.data?.message || 'Failed to fetch institution details');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchInstitutionDetails();
    }
  }, [id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    });
    
    // Clear error for this field when user starts typing
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
    } else if (!/^\d{10}$/.test(formData.phone)) {
      errors.phone = "Please enter a valid 10-digit phone number";
    }
    
    if (!formData.email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Please enter a valid email address";
    }
    
    if (!formData.date) {
      errors.date = "Visit date is required";
    } else {
      const selectedDate = new Date(formData.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (selectedDate < today) {
        errors.date = "Visit date cannot be in the past";
      }
    }
    
    if (!formData.time) {
      errors.time = "Visit time is required";
    }
    
    if (!formData.termsAccepted) {
      errors.termsAccepted = "You must accept the terms and conditions";
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        toast.error('Please log in to make a booking');
        navigate('/login', { 
          state: { 
            from: `/book/${category}/${id}`,
            message: 'Please log in to make a booking'
          } 
        });
        return;
      }

      // Format the date and time
      const formattedDate = new Date(formData.date).toISOString().split('T')[0];
      const formattedTime = formData.time + ':00'; // Add seconds for PostgreSQL TIME format

      const response = await axios.post<ApiResponse<BookingResponse>>(
        `${import.meta.env.VITE_API_URL}/institutions/book`,
        {
          institution_id: id,
          visit_date: formattedDate,
          visit_time: formattedTime,
          amount: parseFloat(institution?.booking_amount || '0'),
          notes: formData.notes,
          contact: {
            name: formData.name,
            phone: formData.phone,
            email: formData.email
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        toast.success('Booking created successfully!');
        navigate(`/booking-confirmation/${response.data.data.booking_id}`);
      } else {
        throw new Error(response.data.message || 'Failed to create booking');
      }
    } catch (error: any) {
      console.error('Booking error:', error);
      
      // Handle authentication errors
      if (error.response?.status === 401) {
        toast.error('Your session has expired. Please log in again.');
        localStorage.removeItem('accessToken'); // Clear invalid token
        navigate('/login', { 
          state: { 
            from: `/book/${category}/${id}`,
            message: 'Your session has expired. Please log in again.'
          } 
        });
        return;
      }
      
      toast.error(error.response?.data?.message || 'Failed to create booking');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!institutionData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Institution not found</h1>
          <Button onClick={() => navigate(-1)}>Go Back</Button>
        </div>
      </div>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <Card className="p-6">
            <h1 className="text-2xl font-bold mb-6">Book a Visit to {institutionData.name}</h1>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Visit Date</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !selectedDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Visit Time</label>
                  <select
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                    className="w-full p-2 border rounded-md"
                    required
                  >
                    <option value="">Select a time</option>
                    {institutionData.visiting_hours?.map((hours: string, index: number) => (
                      <option key={index} value={hours}>{hours}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Visitor Name</label>
                  <Input
                    type="text"
                    value={visitorName}
                    onChange={(e) => setVisitorName(e.target.value)}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Visitor Email</label>
                  <Input
                    type="email"
                    value={visitorEmail}
                    onChange={(e) => setVisitorEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Visitor Phone</label>
                <Input
                  type="tel"
                  value={visitorPhone}
                  onChange={(e) => setVisitorPhone(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Additional Notes</label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any special requirements or questions?"
                />
              </div>

              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-600">Booking Amount:</p>
                  <p className="text-xl font-bold">₹{institutionData.booking_amount}</p>
                </div>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Processing...' : 'Confirm Booking'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default BookingPage;
