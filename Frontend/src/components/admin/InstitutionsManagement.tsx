import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Edit, Trash2, Plus, Star, MapPin, Phone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import axios from "axios";

interface Fee {
  name: string;
  amount: string;
  period: string;
  includes: string[];
}

interface Course {
  name: string;
  description: string;
  duration: string;
}

interface Institution {
  id: string;
  name: string;
  category_id: string;
  category_name: string;
  rating: string;
  address: string;
  contact: {
    phone: string;
    email: string;
    website: string;
  };
  booking_amount: string;
  is_active: boolean;
  description: string;
  thumbnail_url: string;
  gallery: string[];
  courses: Course[];
  infrastructure: Array<{
    name: string;
    description: string;
    icon_url: string;
  }>;
  fees: Fee[];
  city: string;
  state: string;
  type: string;
  starting_from: string;
  visiting_hours: Array<{
    day: string;
    start_time: string;
    end_time: string;
  }>;
  created_at: string;
  updated_at: string;
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface UploadResponse {
  success: boolean;
  urls: string[];
  message?: string;
}

const InstitutionsManagement = () => {
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingInstitution, setEditingInstitution] = useState<Institution | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  const [formData, setFormData] = useState<Omit<Institution, 'id' | 'created_at' | 'updated_at'>>({
    name: "",
    category_id: "",
    category_name: "",
    rating: "",
    address: "",
    city: "",
    state: "",
    type: "",
    contact: {
    phone: "",
      email: "",
      website: ""
    },
    booking_amount: "2000",
    starting_from: "",
    description: "",
    is_active: true,
    thumbnail_url: "",
    gallery: [],
    courses: [],
    infrastructure: [],
    fees: [],
    visiting_hours: [
      { day: "Monday", start_time: "09:00", end_time: "17:00" },
      { day: "Tuesday", start_time: "09:00", end_time: "17:00" },
      { day: "Wednesday", start_time: "09:00", end_time: "17:00" },
      { day: "Thursday", start_time: "09:00", end_time: "17:00" },
      { day: "Friday", start_time: "09:00", end_time: "17:00" },
      { day: "Saturday", start_time: "09:00", end_time: "17:00" }
    ]
  });

  const fetchInstitutions = async (categorySlug?: string) => {
    try {
      setLoading(true);
      const accessToken = localStorage.getItem('accessToken');
      
      if (!categorySlug) {
        const response = await axios.get<Institution[]>(
          `${import.meta.env.VITE_API_URL}/institutions`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`
            }
          }
        );
        
        if (Array.isArray(response.data)) {
          console.log('Fetched all institutions:', response.data);
          setInstitutions(response.data);
        }
        return;
      }

      console.log('Fetching institutions for category slug:', categorySlug);
      const response = await axios.get<{ success: boolean; data: Institution[] }>(
        `${import.meta.env.VITE_API_URL}/institutions/list/${categorySlug}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        }
      );
      
      console.log('API Response:', response.data);
      
      if (response.data.success && Array.isArray(response.data.data)) {
        console.log('Fetched institutions for category:', response.data.data);
        setInstitutions(response.data.data);
      } else {
        console.error('Invalid institutions data format:', response.data);
        toast.error('Failed to load institutions');
      }
    } catch (error: any) {
      console.error('Fetch Error:', error);
      if (error.response?.status === 401) {
        toast.error('Please log in to access this page');
      } else if (error.response?.status === 403) {
        toast.error('You do not have permission to access this page');
      } else if (error.response?.status === 404) {
        console.error('Category not found. Details:', {
          categorySlug,
          error: error.response.data,
          categories: categories
        });
        toast.error(error.response.data.message || 'Category not found. Please check the category slug.');
      } else {
        toast.error('Failed to fetch institutions');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const accessToken = localStorage.getItem('accessToken');
      const response = await axios.get<ApiResponse<Category[]>>(
        `${import.meta.env.VITE_API_URL}/dashboard/admin/categories`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        }
      );
      
      if (response.data.success && Array.isArray(response.data.data)) {
        console.log('Fetched categories:', response.data.data);
        const categoriesWithSlugs = response.data.data.map(cat => ({
          ...cat,
          slug: cat.slug || cat.name.toLowerCase().replace(/\s+/g, '-')
        }));
        setCategories(categoriesWithSlugs);
      } else {
        console.error('Invalid categories data format:', response.data);
        toast.error('Failed to load categories');
      }
    } catch (error: any) {
      console.error('Error fetching categories:', error);
      toast.error('Failed to fetch categories');
    }
  };

  useEffect(() => {
    fetchInstitutions();
    fetchCategories();
  }, []);

  const getCategorySlug = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    if (!category) {
      console.error('Category not found for ID:', categoryId);
      console.log('Available categories:', categories);
      return '';
    }
    console.log('Found category:', category);
    return category.slug || category.name.toLowerCase().replace(/\s+/g, '-');
  };

  const handleEdit = (institution: Institution) => {
    console.log('Editing institution:', institution);
    const categorySlug = getCategorySlug(institution.category_id);
    console.log('Category details:', {
      id: institution.category_id,
      slug: categorySlug,
      availableCategories: categories
    });
    
    setEditingInstitution(institution);
    setFormData({
      name: institution.name,
      category_id: institution.category_id,
      category_name: institution.category_name,
      rating: institution.rating,
      address: institution.address,
      city: institution.city,
      state: institution.state,
      type: institution.type,
      contact: {
        phone: institution.contact.phone,
        email: institution.contact.email,
        website: institution.contact.website
      },
      booking_amount: institution.booking_amount,
      starting_from: institution.starting_from,
      description: institution.description,
      is_active: institution.is_active,
      thumbnail_url: institution.thumbnail_url,
      gallery: institution.gallery,
      courses: institution.courses || [],
      infrastructure: institution.infrastructure,
      fees: Array.isArray(institution.fees) 
        ? institution.fees 
        : Object.entries(institution.fees || {}).map(([name, fee]: [string, any]) => ({
            name: name.charAt(0).toUpperCase() + name.slice(1),
            amount: fee?.amount || "",
            period: fee?.period || "",
            includes: Array.isArray(fee?.includes) ? fee.includes : []
          })),
      visiting_hours: institution.visiting_hours
    });
    setIsDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingInstitution(null);
    setFormData({
      name: "",
      category_id: "",
      category_name: "",
      rating: "",
      address: "",
      city: "",
      state: "",
      type: "",
      contact: {
      phone: "",
        email: "",
        website: ""
      },
      booking_amount: "2000",
      starting_from: "",
      description: "",
      is_active: true,
      thumbnail_url: "",
      gallery: [],
      courses: [],
      infrastructure: [],
      fees: [],
      visiting_hours: [
        { day: "Monday", start_time: "09:00", end_time: "17:00" },
        { day: "Tuesday", start_time: "09:00", end_time: "17:00" },
        { day: "Wednesday", start_time: "09:00", end_time: "17:00" },
        { day: "Thursday", start_time: "09:00", end_time: "17:00" },
        { day: "Friday", start_time: "09:00", end_time: "17:00" },
        { day: "Saturday", start_time: "09:00", end_time: "17:00" }
      ]
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      const accessToken = localStorage.getItem('accessToken');
      const categorySlug = getCategorySlug(formData.category_id);
      console.log('Saving institution with category slug:', categorySlug);
      
    const institutionData = {
      ...formData,
      rating: parseFloat(formData.rating),
        booking_amount: parseFloat(formData.booking_amount),
        starting_from: parseFloat(formData.starting_from),
        category_id: formData.category_id,
        contact: {
          phone: formData.contact.phone,
          email: formData.contact.email,
          website: formData.contact.website
        },
        fees: formData.fees,
        visiting_hours: formData.visiting_hours
    };
    
    if (editingInstitution) {
        const response = await axios.put<Institution>(
          `${import.meta.env.VITE_API_URL}/institutions/${editingInstitution.id}`, 
          institutionData,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`
            }
          }
        );
      toast.success("Institution updated successfully!");
        fetchInstitutions(categorySlug);
    } else {
        const response = await axios.post<Institution>(
          `${import.meta.env.VITE_API_URL}/institutions`, 
          institutionData,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`
            }
          }
        );
      toast.success("Institution added successfully!");
        fetchInstitutions(categorySlug);
    }
    
    setIsDialogOpen(false);
    } catch (error: any) {
      console.error('Save Error:', error);
      if (error.response?.data?.error) {
        toast.error(error.response.data.error);
      } else {
        toast.error('Operation failed');
      }
    }
  };

  const handleDelete = async (institutionId: string) => {
    try {
      const accessToken = localStorage.getItem('accessToken');
      await axios.delete(
        `${import.meta.env.VITE_API_URL}/institutions/${institutionId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        }
      );
    toast.success("Institution deleted successfully!");
      fetchInstitutions();
    } catch (error: any) {
      console.error('Delete Error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      if (error.response?.data?.error) {
        toast.error(error.response.data.error);
      } else {
        toast.error('Failed to delete institution');
      }
    }
  };

  const handleAddFee = () => {
    setFormData(prev => ({
      ...prev,
      fees: [
        ...prev.fees,
        {
          name: "",
          amount: "",
          period: "",
          includes: []
        }
      ]
    }));
  };

  const handleRemoveFee = (index: number) => {
    setFormData(prev => ({
      ...prev,
      fees: prev.fees.filter((_, i) => i !== index)
    }));
  };

  const handleAddCourse = () => {
    setFormData(prev => ({
      ...prev,
      courses: [
        ...prev.courses,
        {
          name: "",
          description: "",
          duration: ""
        }
      ]
    }));
  };

  const handleRemoveCourse = (index: number) => {
    setFormData(prev => ({
      ...prev,
      courses: prev.courses.filter((_, i) => i !== index)
    }));
  };

  if (loading) {
    return <div>Loading institutions...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Institutions Management</h2>
          <p className="text-gray-600">Manage educational institutions and their details</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAdd}>
              <Plus className="h-4 w-4 mr-2" />
              Add Institution
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[625px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingInstitution ? "Edit Institution" : "Add New Institution"}
              </DialogTitle>
              <DialogDescription>
                {editingInstitution ? "Update the institution details below." : "Create a new educational institution."}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="font-medium">Basic Information</h3>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="category" className="text-right">Category</Label>
                <Select 
                    value={formData.category_id} 
                    onValueChange={(value) => {
                      const category = categories.find(cat => cat.id === value);
                      setFormData(prev => ({ 
                        ...prev, 
                        category_id: value,
                        category_name: category?.name || ''
                      }));
                    }}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.isArray(categories) && categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="rating" className="text-right">Rating</Label>
                <Input
                  id="rating"
                  type="number"
                  step="0.1"
                  min="0"
                  max="5"
                  value={formData.rating}
                  onChange={(e) => setFormData(prev => ({ ...prev, rating: e.target.value }))}
                  className="col-span-3"
                />
              </div>
              </div>

              {/* Location Information */}
              <div className="space-y-4 border-t pt-4">
                <h3 className="font-medium">Location Information</h3>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="address" className="text-right">Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  className="col-span-3"
                />
              </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="city" className="text-right">City</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="state" className="text-right">State</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                    className="col-span-3"
                  />
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-4 border-t pt-4">
                <h3 className="font-medium">Contact Information</h3>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="phone" className="text-right">Phone</Label>
                <Input
                  id="phone"
                    value={formData.contact.phone}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      contact: { ...prev.contact, phone: e.target.value }
                    }))}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="email" className="text-right">Email</Label>
                <Input
                    id="email"
                    type="email"
                    value={formData.contact.email}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      contact: { ...prev.contact, email: e.target.value }
                    }))}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="website" className="text-right">Website</Label>
                  <Input
                    id="website"
                    value={formData.contact.website}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      contact: { ...prev.contact, website: e.target.value }
                    }))}
                    className="col-span-3"
                  />
                </div>
              </div>

              {/* Financial Information */}
              <div className="space-y-4 border-t pt-4">
                <h3 className="font-medium">Financial Information</h3>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="booking_amount" className="text-right">Booking Amount</Label>
                  <Input
                    id="booking_amount"
                    type="number"
                    value={formData.booking_amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, booking_amount: e.target.value }))}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="starting_from" className="text-right">Starting From</Label>
                  <Input
                    id="starting_from"
                    type="number"
                    value={formData.starting_from}
                    onChange={(e) => setFormData(prev => ({ ...prev, starting_from: e.target.value }))}
                    className="col-span-3"
                  />
                </div>
              </div>

              {/* Fees Structure */}
              <div className="space-y-4 border-t pt-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium">Fees Structure</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddFee}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Fee
                  </Button>
                </div>
                
                {formData.fees.map((fee, index) => (
                  <div key={index} className="space-y-2 p-4 border rounded-lg relative">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => handleRemoveFee(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor={`fee_name_${index}`} className="text-right">Course Name</Label>
                      <Input
                        id={`fee_name_${index}`}
                        value={fee.name}
                        onChange={(e) => {
                          const newFees = [...formData.fees];
                          newFees[index] = { ...fee, name: e.target.value };
                          setFormData(prev => ({ ...prev, fees: newFees }));
                        }}
                        className="col-span-3"
                        placeholder="e.g., JEE, NEET, Foundation"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor={`fee_amount_${index}`} className="text-right">Amount</Label>
                      <Input
                        id={`fee_amount_${index}`}
                  type="number"
                        value={fee.amount}
                        onChange={(e) => {
                          const newFees = [...formData.fees];
                          newFees[index] = { ...fee, amount: e.target.value };
                          setFormData(prev => ({ ...prev, fees: newFees }));
                        }}
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor={`fee_period_${index}`} className="text-right">Period</Label>
                      <Input
                        id={`fee_period_${index}`}
                        value={fee.period}
                        onChange={(e) => {
                          const newFees = [...formData.fees];
                          newFees[index] = { ...fee, period: e.target.value };
                          setFormData(prev => ({ ...prev, fees: newFees }));
                        }}
                        className="col-span-3"
                        placeholder="e.g., Per Year, Per Semester"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor={`fee_includes_${index}`} className="text-right">Includes</Label>
                      <div className="col-span-3 space-y-2">
                        <div className="flex gap-2">
                          <Input
                            id={`fee_includes_${index}`}
                            value={fee.includes.join(', ')}
                            onChange={(e) => {
                              const newFees = [...formData.fees];
                              newFees[index] = {
                                ...fee,
                                includes: e.target.value.split(',').map(item => item.trim()).filter(Boolean)
                              };
                              setFormData(prev => ({ ...prev, fees: newFees }));
                            }}
                            placeholder="Enter items separated by commas"
                          />
                        </div>
                        <p className="text-sm text-gray-500">
                          Enter items separated by commas (e.g., Study Material, Mock Tests, Doubt Sessions)
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Courses */}
              <div className="space-y-4 border-t pt-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium">Courses</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddCourse}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Course
                  </Button>
                </div>
                
                {formData.courses.map((course, index) => (
                  <div key={index} className="space-y-2 p-4 border rounded-lg relative">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => handleRemoveCourse(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor={`course_name_${index}`} className="text-right">Course Name</Label>
                      <Input
                        id={`course_name_${index}`}
                        value={course.name}
                        onChange={(e) => {
                          const newCourses = [...formData.courses];
                          newCourses[index] = { ...course, name: e.target.value };
                          setFormData(prev => ({ ...prev, courses: newCourses }));
                        }}
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor={`course_description_${index}`} className="text-right">Description</Label>
                      <Textarea
                        id={`course_description_${index}`}
                        value={course.description}
                        onChange={(e) => {
                          const newCourses = [...formData.courses];
                          newCourses[index] = { ...course, description: e.target.value };
                          setFormData(prev => ({ ...prev, courses: newCourses }));
                        }}
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor={`course_duration_${index}`} className="text-right">Duration</Label>
                      <Input
                        id={`course_duration_${index}`}
                        value={course.duration}
                        onChange={(e) => {
                          const newCourses = [...formData.courses];
                          newCourses[index] = { ...course, duration: e.target.value };
                          setFormData(prev => ({ ...prev, courses: newCourses }));
                        }}
                        className="col-span-3"
                        placeholder="e.g., 2 years, 6 months"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Infrastructure */}
              <div className="space-y-4 border-t pt-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium">Infrastructure</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        infrastructure: [
                          ...prev.infrastructure,
                          {
                            name: "",
                            description: "",
                            icon_url: ""
                          }
                        ]
                      }));
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Infrastructure
                  </Button>
                </div>
                
                {formData.infrastructure.map((item, index) => (
                  <div key={index} className="space-y-2 p-4 border rounded-lg relative">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          infrastructure: prev.infrastructure.filter((_, i) => i !== index)
                        }));
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor={`infra_name_${index}`} className="text-right">Name</Label>
                      <Input
                        id={`infra_name_${index}`}
                        value={item.name}
                        onChange={(e) => {
                          const newInfra = [...formData.infrastructure];
                          newInfra[index] = { ...item, name: e.target.value };
                          setFormData(prev => ({ ...prev, infrastructure: newInfra }));
                        }}
                        className="col-span-3"
                        placeholder="e.g., Smart Classrooms, Library"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor={`infra_description_${index}`} className="text-right">Description</Label>
                      <Textarea
                        id={`infra_description_${index}`}
                        value={item.description}
                        onChange={(e) => {
                          const newInfra = [...formData.infrastructure];
                          newInfra[index] = { ...item, description: e.target.value };
                          setFormData(prev => ({ ...prev, infrastructure: newInfra }));
                        }}
                        className="col-span-3"
                        placeholder="Describe the infrastructure feature"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor={`infra_icon_${index}`} className="text-right">Icon URL</Label>
                      <Input
                        id={`infra_icon_${index}`}
                        value={item.icon_url}
                        onChange={(e) => {
                          const newInfra = [...formData.infrastructure];
                          newInfra[index] = { ...item, icon_url: e.target.value };
                          setFormData(prev => ({ ...prev, infrastructure: newInfra }));
                        }}
                        className="col-span-3"
                        placeholder="URL for the infrastructure icon"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Visiting Hours */}
              <div className="space-y-4 border-t pt-4">
                <h3 className="font-medium">Visiting Hours</h3>
                {formData.visiting_hours.map((hour, index) => (
                  <div key={hour.day} className="space-y-2">
                    <h4 className="text-sm font-medium">{hour.day}</h4>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor={`${hour.day}_start`} className="text-right">Start Time</Label>
                      <Input
                        id={`${hour.day}_start`}
                        type="time"
                        value={hour.start_time}
                        onChange={(e) => {
                          const newHours = [...formData.visiting_hours];
                          newHours[index] = { ...hour, start_time: e.target.value };
                          setFormData(prev => ({ ...prev, visiting_hours: newHours }));
                        }}
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor={`${hour.day}_end`} className="text-right">End Time</Label>
                      <Input
                        id={`${hour.day}_end`}
                        type="time"
                        value={hour.end_time}
                        onChange={(e) => {
                          const newHours = [...formData.visiting_hours];
                          newHours[index] = { ...hour, end_time: e.target.value };
                          setFormData(prev => ({ ...prev, visiting_hours: newHours }));
                        }}
                        className="col-span-3"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Gallery Images */}
              <div className="space-y-4 border-t pt-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium">Gallery Images</h3>
                  <div className="flex gap-2">
                    <Input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={async (e) => {
                        const files = e.target.files;
                        if (!files) return;

                        try {
                          const accessToken = localStorage.getItem('accessToken');
                          if (!accessToken) {
                            toast.error('Please log in to upload images');
                            return;
                          }

                          const formData = new FormData();
                          Array.from(files).forEach((file) => {
                            formData.append('images', file);
                          });

                          const response = await axios.post<UploadResponse>(
                            `${import.meta.env.VITE_API_URL}/upload`,
                            formData,
                            {
                              headers: {
                                'Content-Type': 'multipart/form-data',
                                'Authorization': `Bearer ${accessToken}`
                              }
                            }
                          );

                          if (response.data.success) {
                            setFormData(prev => ({
                              ...prev,
                              gallery: [...prev.gallery, ...response.data.urls]
                            }));
                            toast.success('Images uploaded successfully');
                          } else {
                            throw new Error(response.data.message || 'Failed to upload images');
                          }
                        } catch (error: any) {
                          console.error('Error uploading images:', error);
                          if (error.response?.status === 401) {
                            toast.error('Please log in to upload images');
                          } else if (error.response?.status === 403) {
                            toast.error('You do not have permission to upload images');
                          } else {
                            toast.error(error.response?.data?.message || 'Failed to upload images');
                          }
                        }
                      }}
                      className="hidden"
                      id="gallery-upload"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById('gallery-upload')?.click()}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Upload Images
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {formData.gallery.map((imageUrl, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={imageUrl}
                        alt={`Gallery image ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            gallery: prev.gallery.filter((_, i) => i !== index)
                          }));
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Additional Information */}
              <div className="space-y-4 border-t pt-4">
                <h3 className="font-medium">Additional Information</h3>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="type" className="text-right">Type</Label>
                  <Input
                    id="type"
                    value={formData.type}
                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="col-span-3"
                />
              </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="thumbnail" className="text-right">Thumbnail Image</Label>
                  <div className="col-span-3 space-y-2">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;

                        try {
                          const accessToken = localStorage.getItem('accessToken');
                          if (!accessToken) {
                            toast.error('Please log in to upload images');
                            return;
                          }

                          const formData = new FormData();
                          formData.append('images', file);

                          const response = await axios.post<UploadResponse>(
                            `${import.meta.env.VITE_API_URL}/upload`,
                            formData,
                            {
                              headers: {
                                'Content-Type': 'multipart/form-data',
                                'Authorization': `Bearer ${accessToken}`
                              }
                            }
                          );

                          if (response.data.success && response.data.urls.length > 0) {
                            setFormData(prev => ({
                              ...prev,
                              thumbnail_url: response.data.urls[0]
                            }));
                            toast.success('Thumbnail uploaded successfully');
                          } else {
                            throw new Error(response.data.message || 'Failed to upload thumbnail');
                          }
                        } catch (error: any) {
                          console.error('Error uploading thumbnail:', error);
                          if (error.response?.status === 401) {
                            toast.error('Please log in to upload images');
                          } else if (error.response?.status === 403) {
                            toast.error('You do not have permission to upload images');
                          } else {
                            toast.error(error.response?.data?.message || 'Failed to upload thumbnail');
                          }
                        }
                      }}
                      className="hidden"
                      id="thumbnail-upload"
                    />
                    <div className="flex items-center gap-4">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById('thumbnail-upload')?.click()}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Upload Thumbnail
                      </Button>
                      {formData.thumbnail_url && (
                        <div className="relative group">
                          <img
                            src={formData.thumbnail_url}
                            alt="Thumbnail preview"
                            className="h-20 w-20 object-cover rounded-lg"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => {
                              setFormData(prev => ({
                                ...prev,
                                thumbnail_url: ""
                              }));
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="status" className="text-right"></Label>
                {/*
                <Select 
                    value={formData.is_active ? "active" : "inactive"} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, is_active: value === "active" }))}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
                */}
              </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" onClick={handleSave}>
                {editingInstitution ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6">
        {loading ? (
          <div>Loading institutions...</div>
        ) : institutions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No institutions found for this category.</p>
          </div>
        ) : (
          institutions.map((institution, index) => (
          <motion.div
            key={institution.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <CardTitle>{institution.name}</CardTitle>
                        <Badge 
                          variant={institution.is_active ? "default" : "destructive"}
                          className="capitalize"
                        >
                          {institution.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <CardDescription className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        {institution.rating}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {institution.address}
                      </span>
                      <span className="flex items-center gap-1">
                        <Phone className="h-4 w-4" />
                          {institution.contact?.phone || 'Not provided'}
                      </span>
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleEdit(institution)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleDelete(institution.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Category</p>
                      <p className="font-medium capitalize">{institution.category_name || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Booking Amount</p>
                      <p className="font-medium">₹{parseFloat(institution.booking_amount).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Description</p>
                      <div 
                        className="text-sm relative group"
                        title={institution.description}
                      >
                        <p className="line-clamp-2 group-hover:line-clamp-none transition-all duration-200">
                          {institution.description || 'No description provided'}
                        </p>
                        {institution.description && institution.description.length > 100 && (
                          <span className="text-xs text-blue-500 mt-1 block group-hover:hidden">
                            Hover to see more
                          </span>
                        )}
                      </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default InstitutionsManagement;
