import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin, Phone, Download, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';

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
  visiting_hours: string[];
}

interface ApiResponse {
  success: boolean;
  data: BookingData;
}

const BookingConfirmation = () => {
  const { booking_id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);

  const { data: bookingData, error } = useQuery<BookingData>({
    queryKey: ['booking', booking_id],
    queryFn: async () => {
      const response = await api.get<ApiResponse>(`/api/institutions/booking/${booking_id}`);
      return response.data.data;
    },
    enabled: !!booking_id && !!user,
  });

  useEffect(() => {
    if (error) {
      toast.error('Failed to load booking details');
      navigate('/user/dashboard');
    }
  }, [error, navigate]);

  if (!bookingData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const {
    booking_id: id,
    institution_name,
    thumbnail_url,
    category_name,
    visit_date,
    visit_time,
    amount,
    status,
    visitor_name,
    institution_address,
    institution_city,
    institution_state,
    institution_contact,
    visiting_hours
  } = bookingData;

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
      confirmed: { color: 'bg-green-100 text-green-800', label: 'Confirmed' },
      completed: { color: 'bg-blue-100 text-blue-800', label: 'Completed' },
      cancelled: { color: 'bg-red-100 text-red-800', label: 'Cancelled' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;

    return (
      <Badge className={`${config.color} font-medium`}>
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => navigate('/user/dashboard')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        <Card className="p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="w-full md:w-48 h-48 relative">
              <img
                src={thumbnail_url || 'https://placehold.co/400x400?text=No+Image'}
                alt={institution_name}
                className="w-full h-full object-cover rounded-lg"
              />
            </div>
            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-bold mb-2">{institution_name}</h1>
                  <p className="text-gray-600">{category_name}</p>
                </div>
                {getStatusBadge(status)}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-gray-500" />
                  <span>{format(new Date(visit_date), 'MMMM d, yyyy')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-gray-500" />
                  <span>{visit_time}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-gray-500" />
                  <span>{`${institution_address}, ${institution_city}, ${institution_state}`}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-5 w-5 text-gray-500" />
                  <span>{institution_contact?.phone || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Booking Details</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Booking ID</span>
                <span className="font-medium">{id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Visitor Name</span>
                <span className="font-medium">{visitor_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Amount</span>
                <span className="font-medium">₹{amount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status</span>
                <span className="font-medium">{getStatusBadge(status)}</span>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Visiting Hours</h2>
            <div className="space-y-3">
              {visiting_hours?.map((hours: string, index: number) => (
                <div key={index} className="flex justify-between">
                  <span className="text-gray-600">Day {index + 1}</span>
                  <span className="font-medium">{hours}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="mt-6 flex justify-center">
          <Button className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Download Receipt
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BookingConfirmation;
