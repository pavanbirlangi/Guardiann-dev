import React, { useState } from "react";
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

const InstitutionsManagement = () => {
  const [institutions, setInstitutions] = useState([
    {
      id: 1,
      name: "Delhi Public School",
      category: "schools",
      rating: 4.5,
      address: "Mathura Road, New Delhi",
      phone: "+91 98765 43210",
      bookingAmount: 2000,
      status: "active",
      description: "Premier educational institution with excellent facilities"
    },
    {
      id: 2,
      name: "IIT Delhi",
      category: "colleges",
      rating: 4.8,
      address: "Hauz Khas, New Delhi",
      phone: "+91 98765 43211",
      bookingAmount: 2000,
      status: "active",
      description: "Leading technical institute in India"
    },
    {
      id: 3,
      name: "AIIMS Delhi",
      category: "colleges",
      rating: 4.9,
      address: "Ansari Nagar, New Delhi",
      phone: "+91 98765 43212",
      bookingAmount: 2000,
      status: "active",
      description: "Premier medical college and hospital"
    }
  ]);

  const [editingInstitution, setEditingInstitution] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    rating: "",
    address: "",
    phone: "",
    bookingAmount: "",
    description: "",
    status: "active"
  });

  const categories = [
    { value: "schools", label: "Schools" },
    { value: "colleges", label: "Colleges" },
    { value: "coaching", label: "Coaching Centers" },
    { value: "pg-colleges", label: "PG Colleges" }
  ];

  const handleEdit = (institution) => {
    setEditingInstitution(institution);
    setFormData({
      name: institution.name,
      category: institution.category,
      rating: institution.rating.toString(),
      address: institution.address,
      phone: institution.phone,
      bookingAmount: institution.bookingAmount.toString(),
      description: institution.description,
      status: institution.status
    });
    setIsDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingInstitution(null);
    setFormData({
      name: "",
      category: "",
      rating: "",
      address: "",
      phone: "",
      bookingAmount: "2000",
      description: "",
      status: "active"
    });
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    const institutionData = {
      ...formData,
      rating: parseFloat(formData.rating),
      bookingAmount: parseInt(formData.bookingAmount)
    };
    
    if (editingInstitution) {
      setInstitutions(prev => prev.map(inst => 
        inst.id === editingInstitution.id 
          ? { ...inst, ...institutionData }
          : inst
      ));
      toast.success("Institution updated successfully!");
    } else {
      const newInstitution = {
        id: Date.now(),
        ...institutionData
      };
      setInstitutions(prev => [...prev, newInstitution]);
      toast.success("Institution added successfully!");
    }
    
    setIsDialogOpen(false);
  };

  const handleDelete = (institutionId) => {
    setInstitutions(prev => prev.filter(inst => inst.id !== institutionId));
    toast.success("Institution deleted successfully!");
  };

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
                  value={formData.category} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
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
                <Label htmlFor="phone" className="text-right">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="bookingAmount" className="text-right">Booking Amount</Label>
                <Input
                  id="bookingAmount"
                  type="number"
                  value={formData.bookingAmount}
                  onChange={(e) => setFormData(prev => ({ ...prev, bookingAmount: e.target.value }))}
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
                <Label htmlFor="status" className="text-right">Status</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
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
        {institutions.map((institution, index) => (
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
                      <Badge variant={institution.status === "active" ? "default" : "secondary"}>
                        {institution.status}
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
                        {institution.phone}
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
                    <p className="font-medium capitalize">{institution.category}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Booking Amount</p>
                    <p className="font-medium">₹{institution.bookingAmount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Description</p>
                    <p className="text-sm">{institution.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default InstitutionsManagement;
