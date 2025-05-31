import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

// Import the refactored components
import InstitutionHeader from "@/components/institution/InstitutionHeader";
import InstitutionGallery from "@/components/institution/InstitutionGallery";
import AboutTab from "@/components/institution/AboutTab";
import CoursesTab from "@/components/institution/CoursesTab";
import InfrastructureTab from "@/components/institution/InfrastructureTab";
import FeesTab from "@/components/institution/FeesTab";
import BookingWidget from "@/components/institution/BookingWidget";
import LocationMap from "@/components/institution/LocationMap";

const InstitutionDetails = () => {
  const { category, id } = useParams<{category: string, id: string}>();
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [institution, setInstitution] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInstitutionDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`${import.meta.env.VITE_API_URL}/institutions/details/${id}`);
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.message || 'Failed to fetch institution details');
        }

        setInstitution(data.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch institution details');
        toast.error('Failed to fetch institution details');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchInstitutionDetails();
    }
  }, [id]);

  // Handle image gallery
  const handleImageClick = (imageSrc: string | null) => {
    setActiveImage(imageSrc);
  };

  if (loading) {
    return (
      <Layout>
        <div className="container py-12 text-center">
          <h1 className="text-2xl font-bold mb-4">Loading...</h1>
          <p>Please wait while we fetch the institution details.</p>
        </div>
      </Layout>
    );
  }

  if (error || !institution) {
    return (
      <Layout>
        <div className="container py-12 text-center">
          <h1 className="text-2xl font-bold mb-4">Error</h1>
          <p>{error || 'Institution not found'}</p>
          <Link to={`/categories/${category}`}>
            <Button className="mt-4">Back to Listing</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Institution header */}
      <InstitutionHeader
        name={institution.name}
        address={institution.address}
        rating={institution.rating}
        category={category!}
        id={id!}
      />

      {/* Main content */}
      <div className="container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left column - Gallery and tabs */}
          <div className="lg:col-span-2">
            <InstitutionGallery
              thumbnail={institution.thumbnail_url}
              gallery={institution.gallery || []}
              name={institution.name}
              activeImage={activeImage}
              onImageClick={handleImageClick}
            />

            <Tabs defaultValue="about">
              <TabsList className="mb-6">
                <TabsTrigger value="about">About</TabsTrigger>
                <TabsTrigger value="courses">Courses</TabsTrigger>
                <TabsTrigger value="infrastructure">Infrastructure</TabsTrigger>
                <TabsTrigger value="fees">Fees</TabsTrigger>
              </TabsList>
              
              <TabsContent value="about">
                <AboutTab
                  name={institution.name}
                  description={institution.description}
                  contact={institution.contact}
                />
              </TabsContent>
              
              <TabsContent value="courses">
                <CoursesTab courses={institution.courses || []} />
              </TabsContent>
              
              <TabsContent value="infrastructure">
                <InfrastructureTab infrastructure={institution.infrastructure || []} />
              </TabsContent>
              
              <TabsContent value="fees">
                <FeesTab fees={institution.fees || {}} />
              </TabsContent>
            </Tabs>
          </div>

          {/* Right column - Booking widget and location */}
          <div className="relative">
            <div className="lg:sticky lg:top-20 space-y-6 z-20">
              <BookingWidget 
                institution={institution}
                category={category!}
                id={id!}
              />
              
              <LocationMap
                address={institution.address}
                city={institution.city}
                state={institution.state}
              />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default InstitutionDetails;
