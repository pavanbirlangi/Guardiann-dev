import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Categories from "./pages/Categories";
import InstitutionListing from "./pages/InstitutionListing";
import InstitutionDetails from "./pages/InstitutionDetails";
import BookingPage from "./pages/BookingPage";
import BookingConfirmation from "./pages/BookingConfirmation";
import AboutUs from "./pages/AboutUs";
import Contact from "./pages/Contact";
import Auth from "./pages/Auth";
import UserDashboard from "./pages/UserDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import GoogleCallback from "./pages/GoogleCallback";
import NotFound from "./pages/NotFound";
import { useEffect } from "react";

const queryClient = new QueryClient();

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    console.log('ProtectedRoute - Auth State:', { isAuthenticated, user, loading });
    
    if (!loading) {
      if (!isAuthenticated) {
        console.log('Not authenticated, redirecting to auth page');
        navigate('/auth', { state: { from: location.pathname } });
      } else if (user?.role === 'ADMIN' && location.pathname !== '/admin/dashboard') {
        console.log('Admin user, redirecting to admin dashboard');
        navigate('/admin/dashboard');
      }
    }
  }, [isAuthenticated, user, loading, navigate, location]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  // If user is admin, only allow access to admin dashboard
  if (user?.role === 'ADMIN' && location.pathname !== '/admin/dashboard') {
    return null;
  }

  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/categories/:category" element={<InstitutionListing />} />
          <Route path="/institution/:category/:id" element={<InstitutionDetails />} />
          <Route path="/book/:category/:id" element={<BookingPage />} />
          <Route path="/booking-confirmation/:category/:id" element={<BookingConfirmation />} />
          <Route path="/about" element={<AboutUs />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/auth/google/callback" element={<GoogleCallback />} />
          
          {/* Protected Routes */}
          <Route 
            path="/user/dashboard" 
            element={
              <ProtectedRoute>
                <UserDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/dashboard" 
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
