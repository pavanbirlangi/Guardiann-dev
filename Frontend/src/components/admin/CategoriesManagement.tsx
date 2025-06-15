import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Edit, Trash2, Plus, School, Book, Users, Calendar } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon_url: string | null;
  subcategories: string[];
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

interface FormData {
  name: string;
  description: string;
  icon_url: string;
  subcategories: string;
  display_order: number;
  is_active: boolean;
}

interface ApiResponse {
  success: boolean;
  data: Category[];
  message?: string;
}

const CategoriesManagement = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    description: "",
    icon_url: "",
    subcategories: "",
    display_order: 0,
    is_active: true
  });
  const [failedIcons, setFailedIcons] = useState<Set<string>>(new Set());

  const iconMap = {
    School: <School className="h-6 w-6" />,
    Book: <Book className="h-6 w-6" />,
    Users: <Users className="h-6 w-6" />,
    Calendar: <Calendar className="h-6 w-6" />
  };

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const accessToken = localStorage.getItem('accessToken');
      console.log('Fetching categories with token:', accessToken ? 'Token exists' : 'No token found');
      
      const response = await axios.get<ApiResponse>(`${import.meta.env.VITE_API_URL}/dashboard/admin/categories`, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });
      
      console.log('Categories response:', response.data);
      
      if (response.data.success) {
        setCategories(response.data.data);
      } else {
        toast.error(response.data.message || 'Failed to fetch categories');
      }
    } catch (error: any) {
      console.error('Error fetching categories:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      if (error.response?.status === 401) {
        toast.error('Please log in to access this page');
      } else if (error.response?.status === 403) {
        toast.error('You do not have permission to access this page');
      } else {
        toast.error(error.response?.data?.message || 'Failed to fetch categories');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || "",
      icon_url: category.icon_url || "",
      subcategories: category.subcategories.join(", "),
      display_order: category.display_order,
      is_active: category.is_active
    });
    setIsDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingCategory(null);
    setFormData({
      name: "",
      description: "",
      icon_url: "",
      subcategories: "",
      display_order: 0,
      is_active: true
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      const subcategoriesArray = formData.subcategories.split(",").map(s => s.trim()).filter(s => s);
      const payload = {
        ...formData,
        subcategories: subcategoriesArray
      };

      if (editingCategory) {
        const response = await axios.put<ApiResponse>(
          `${import.meta.env.VITE_API_URL}/dashboard/admin/categories/${editingCategory.id}`,
          payload,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('accessToken')}`
            }
          }
        );
        if (response.data.success) {
          toast.success("Category updated successfully!");
          setIsDialogOpen(false);
          fetchCategories();
        } else {
          toast.error(response.data.message || 'Failed to update category');
        }
      } else {
        const response = await axios.post<ApiResponse>(
          `${import.meta.env.VITE_API_URL}/dashboard/admin/categories`,
          payload,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('accessToken')}`
            }
          }
        );
        if (response.data.success) {
          toast.success("Category added successfully!");
          setIsDialogOpen(false);
          fetchCategories();
        } else {
          toast.error(response.data.message || 'Failed to add category');
        }
      }
    } catch (error) {
      console.error('Error saving category:', error);
      toast.error(editingCategory ? 'Failed to update category' : 'Failed to add category');
    }
  };

  const handleDelete = async (categoryId: string) => {
    try {
      const response = await axios.delete<ApiResponse>(`${import.meta.env.VITE_API_URL}/dashboard/admin/categories/${categoryId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      if (response.data.success) {
        toast.success("Category deleted successfully!");
        fetchCategories();
      } else {
        toast.error(response.data.message || 'Failed to delete category');
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error('Failed to delete category');
    }
  };

  if (loading) {
    return <div>Loading categories...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Categories Management</h2>
          <p className="text-gray-600">Manage educational categories and their subcategories</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAdd}>
              <Plus className="h-4 w-4 mr-2" />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>
                {editingCategory ? "Edit Category" : "Add New Category"}
              </DialogTitle>
              <DialogDescription>
                {editingCategory ? "Update the category details below." : "Create a new educational category."}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="icon_url" className="text-right">
                  Icon URL
                </Label>
                <Input
                  id="icon_url"
                  value={formData.icon_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, icon_url: e.target.value }))}
                  className="col-span-3"
                  placeholder="https://example.com/icon.png"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="subcategories" className="text-right">
                  Subcategories
                </Label>
                <Input
                  id="subcategories"
                  placeholder="Separate with commas"
                  value={formData.subcategories}
                  onChange={(e) => setFormData(prev => ({ ...prev, subcategories: e.target.value }))}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="display_order" className="text-right">
                  Display Order
                </Label>
                <Input
                  id="display_order"
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData(prev => ({ ...prev, display_order: parseInt(e.target.value) || 0 }))}
                  className="col-span-3"
                />
              </div>
              {editingCategory && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="is_active" className="text-right">
                    Active
                  </Label>
                  <div className="col-span-3">
                    <input
                      type="checkbox"
                      id="is_active"
                      checked={formData.is_active}
                      onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                      className="mr-2"
                    />
                    <Label htmlFor="is_active">Category is active</Label>
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button type="submit" onClick={handleSave}>
                {editingCategory ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {categories.map((category, index) => (
          <motion.div
            key={category.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                      {category.icon_url && !failedIcons.has(category.id) ? (
                        <img 
                          src={category.icon_url} 
                          alt={category.name} 
                          className="h-6 w-6 object-contain"
                          onError={() => {
                            setFailedIcons(prev => new Set([...prev, category.id]));
                          }}
                        />
                      ) : (
                        <School className="h-6 w-6" />
                      )}
                    </div>
                    <div>
                      <CardTitle>{category.name}</CardTitle>
                      <CardDescription>Order: {category.display_order}</CardDescription>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleEdit(category)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleDelete(category.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">{category.description}</p>
                <div>
                  <h4 className="text-sm font-medium mb-2">Subcategories:</h4>
                  <div className="flex flex-wrap gap-2">
                    {category.subcategories.map((subcat, idx) => (
                      <span 
                        key={idx}
                        className="bg-gray-100 px-2 py-1 rounded text-xs"
                      >
                        {subcat}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="mt-4">
                  <span className={`text-xs px-2 py-1 rounded ${category.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {category.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default CategoriesManagement;