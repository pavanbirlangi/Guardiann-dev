import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface BookingWidgetProps {
  institution: any;
  category: string;
  id: string;
}

const BookingWidget: React.FC<BookingWidgetProps> = ({ institution, category, id }) => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const formatAmount = (amount: string | number) => {
    if (!amount) return '0';
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return isNaN(numAmount) ? '0' : numAmount.toLocaleString();
  };

  const handleBookClick = (e: React.MouseEvent) => {
    if (!isAuthenticated) {
      e.preventDefault();
      toast.error("Please login to book your visit");
      // Store the current URL in localStorage before redirecting
      localStorage.setItem('redirectAfterLogin', location.pathname);
      navigate("/auth");
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm relative z-30">
      <h2 className="text-xl font-semibold mb-4">Book a Visit</h2>
      <p className="text-gray-600 mb-6">
        Schedule a visit to {institution.name} to learn more about the programs and facilities.
      </p>
      
      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <h3 className="font-medium mb-3">Booking Fee</h3>
        <p className="text-2xl font-bold text-education-700">₹{formatAmount(institution.booking_amount)}</p>
        <p className="text-sm text-gray-600 mt-1">
          This amount is adjustable against admission fees.
        </p>
      </div>
      
      <div className="space-y-3 mb-6">
        <div className="flex items-center">
          <Check className="w-5 h-5 text-green-500 mr-2" />
          <span className="text-sm">Personalized campus tour</span>
        </div>
        <div className="flex items-center">
          <Check className="w-5 h-5 text-green-500 mr-2" />
          <span className="text-sm">Meet with faculty members</span>
        </div>
        <div className="flex items-center">
          <Check className="w-5 h-5 text-green-500 mr-2" />
          <span className="text-sm">Detailed course & fee breakdown</span>
        </div>
        <div className="flex items-center">
          <Check className="w-5 h-5 text-green-500 mr-2" />
          <span className="text-sm">Admission counseling</span>
        </div>
      </div>
      
      <Link to={`/book/${category}/${id}`} onClick={handleBookClick} className="w-full">
        <Button size="lg" className="w-full">
          Book Your Slot
        </Button>
      </Link>
      
      <p className="text-xs text-gray-500 text-center mt-4">
        Limited slots available. Book now to secure your spot.
      </p>
    </div>
  );
};

export default BookingWidget;
