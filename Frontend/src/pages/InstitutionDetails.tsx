import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight } from "lucide-react";

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
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

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

        console.log('Institution Data:', data.data);
        console.log('Fees Data:', data.data.fees);
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

  const handleImageNavigation = (direction: 'prev' | 'next') => {
    const allImages = [institution.thumbnail_url, ...institution.gallery];
    const currentIndex = allImages.indexOf(selectedImage || institution.thumbnail_url);
    
    if (direction === 'prev') {
      const newIndex = currentIndex === 0 ? allImages.length - 1 : currentIndex - 1;
      setSelectedImage(allImages[newIndex] === institution.thumbnail_url ? null : allImages[newIndex]);
    } else {
      const newIndex = currentIndex === allImages.length - 1 ? 0 : currentIndex + 1;
      setSelectedImage(allImages[newIndex] === institution.thumbnail_url ? null : allImages[newIndex]);
    }
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
            {/* Gallery */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Gallery</h3>
              <div className="relative">
                {/* Main Image Display */}
                <div className="relative aspect-video w-full overflow-hidden rounded-lg">
                  <img
                    src={selectedImage || institution.thumbnail_url}
                    alt={institution.name}
                    className="h-full w-full object-cover"
                  />
                  {institution.gallery.length > 4 && (
                    <>
                      <button
                        onClick={() => handleImageNavigation('prev')}
                        className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white hover:bg-black/70"
                      >
                        <ChevronLeft className="h-6 w-6" />
                      </button>
                      <button
                        onClick={() => handleImageNavigation('next')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white hover:bg-black/70"
                      >
                        <ChevronRight className="h-6 w-6" />
                      </button>
                    </>
                  )}
                </div>

                {/* Thumbnail Carousel */}
                <div className="relative mt-4">
                  <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide">
                    <div
                      className={`relative h-20 w-20 flex-shrink-0 cursor-pointer overflow-hidden rounded-lg ${
                        !selectedImage ? 'ring-2 ring-blue-500' : ''
                      }`}
                      onClick={() => setSelectedImage(null)}
                    >
                      <img
                        src={institution.thumbnail_url}
                        alt="Main"
                        className="h-full w-full object-cover"
                      />
                    </div>
                    {institution.gallery.map((image, index) => (
                      <div
                        key={index}
                        className={`relative h-20 w-20 flex-shrink-0 cursor-pointer overflow-hidden rounded-lg ${
                          selectedImage === image ? 'ring-2 ring-blue-500' : ''
                        }`}
                        onClick={() => setSelectedImage(image)}
                      >
                        <img
                          src={image}
                          alt={`Gallery ${index + 1}`}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                  {institution.gallery.length > 4 && (
                    <div className="absolute inset-y-0 right-0 flex items-center">
                      <div className="h-full w-8 bg-gradient-to-l from-white to-transparent" />
                    </div>
                  )}
                </div>
              </div>
            </div>

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
                  visiting_hours={institution.visiting_hours}
                />
              </TabsContent>
              
              <TabsContent value="courses">
                <CoursesTab courses={institution.courses || []} />
              </TabsContent>
              
              <TabsContent value="infrastructure">
                <InfrastructureTab infrastructure={institution.infrastructure || []} />
              </TabsContent>
              
              <TabsContent value="fees">
                <FeesTab fees={Array.isArray(institution.fees) ? institution.fees : []} />
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
