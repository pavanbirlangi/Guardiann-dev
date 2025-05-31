import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Save, Globe, Mail, Shield, CreditCard, LogOut } from "lucide-react";
import { toast } from "sonner";
import axiosInstance from "@/lib/axios";

interface ApiResponse {
  success: boolean;
  message?: string;
  data?: any;
}

const SettingsManagement = () => {
  const [settings, setSettings] = useState({
    // General Settings
    siteName: "EduConnect",
    siteDescription: "Your trusted partner in finding the perfect educational institution",
    contactEmail: "admin@educonnect.com",
    supportPhone: "+91 98765 43210",
    
    // Booking Settings
    defaultBookingAmount: 2000,
    enableOnlinePayment: true,
    requireEmailVerification: true,
    autoConfirmBookings: false,
    
    // Email Settings
    emailHost: "smtp.gmail.com",
    emailPort: 587,
    emailUsername: "noreply@educonnect.com",
    emailPassword: "",
    
    // Notification Settings
    sendBookingConfirmation: true,
    sendReminderEmails: true,
    sendMarketingEmails: false,
    adminNotifications: true,
    
    // Security Settings
    enableTwoFactorAuth: false,
    sessionTimeout: 30,
    maxLoginAttempts: 5,
    
    // Platform Settings
    maintenanceMode: false,
    allowNewRegistrations: true,
    enableReviews: true,
    moderateReviews: true
  });

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = () => {
    // In a real app, this would save to a backend
    toast.success("Settings saved successfully!");
  };

  const handleLogout = async () => {
    try {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        toast.error('No access token found');
        return;
      }

      try {
        const response = await axiosInstance.post<ApiResponse>('/auth/logout', {
          accessToken
        });

        if (response.data.success) {
          toast.success('Logged out successfully');
        } else {
          toast.error(response.data.message || 'Failed to logout from server');
        }
      } catch (error: any) {
        console.error('Server logout error:', error);
        toast.error('Failed to logout from server, but logged out locally');
      }

      // Always perform local logout regardless of server response
      localStorage.removeItem('accessToken');
      localStorage.removeItem('idToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      window.location.href = '/auth';
    } catch (error: any) {
      console.error('Logout error:', error);
      // Even if everything fails, try to clear storage and redirect
      localStorage.removeItem('accessToken');
      localStorage.removeItem('idToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      window.location.href = '/auth';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Platform Settings</h2>
        <p className="text-gray-600">Configure your platform settings and preferences</p>
      </div>

      <div className="space-y-6">
        {/* General Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              General Settings
            </CardTitle>
            <CardDescription>Basic platform configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="siteName">Site Name</Label>
                <Input
                  id="siteName"
                  value={settings.siteName}
                  onChange={(e) => handleSettingChange("siteName", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="contactEmail">Contact Email</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={settings.contactEmail}
                  onChange={(e) => handleSettingChange("contactEmail", e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="siteDescription">Site Description</Label>
              <Textarea
                id="siteDescription"
                value={settings.siteDescription}
                onChange={(e) => handleSettingChange("siteDescription", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="supportPhone">Support Phone</Label>
              <Input
                id="supportPhone"
                value={settings.supportPhone}
                onChange={(e) => handleSettingChange("supportPhone", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Booking Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Booking Settings
            </CardTitle>
            <CardDescription>Configure booking and payment settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="defaultBookingAmount">Default Booking Amount (₹)</Label>
                <Input
                  id="defaultBookingAmount"
                  type="number"
                  value={settings.defaultBookingAmount}
                  onChange={(e) => handleSettingChange("defaultBookingAmount", parseInt(e.target.value))}
                />
              </div>
            </div>
            <Separator />
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Enable Online Payment</Label>
                  <p className="text-sm text-gray-600">Allow users to pay online during booking</p>
                </div>
                <Switch
                  checked={settings.enableOnlinePayment}
                  onCheckedChange={(checked) => handleSettingChange("enableOnlinePayment", checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Require Email Verification</Label>
                  <p className="text-sm text-gray-600">Users must verify email before booking</p>
                </div>
                <Switch
                  checked={settings.requireEmailVerification}
                  onCheckedChange={(checked) => handleSettingChange("requireEmailVerification", checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Auto-confirm Bookings</Label>
                  <p className="text-sm text-gray-600">Automatically confirm bookings upon payment</p>
                </div>
                <Switch
                  checked={settings.autoConfirmBookings}
                  onCheckedChange={(checked) => handleSettingChange("autoConfirmBookings", checked)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Email Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email Settings
            </CardTitle>
            <CardDescription>Configure SMTP settings for email notifications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="emailHost">SMTP Host</Label>
                <Input
                  id="emailHost"
                  value={settings.emailHost}
                  onChange={(e) => handleSettingChange("emailHost", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="emailPort">SMTP Port</Label>
                <Input
                  id="emailPort"
                  type="number"
                  value={settings.emailPort}
                  onChange={(e) => handleSettingChange("emailPort", parseInt(e.target.value))}
                />
              </div>
              <div>
                <Label htmlFor="emailUsername">Email Username</Label>
                <Input
                  id="emailUsername"
                  value={settings.emailUsername}
                  onChange={(e) => handleSettingChange("emailUsername", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="emailPassword">Email Password</Label>
                <Input
                  id="emailPassword"
                  type="password"
                  value={settings.emailPassword}
                  onChange={(e) => handleSettingChange("emailPassword", e.target.value)}
                />
              </div>
            </div>
            <Separator />
            <div className="space-y-4">
              <h4 className="font-medium">Notification Settings</h4>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Send Booking Confirmations</Label>
                  <p className="text-sm text-gray-600">Email confirmations to users</p>
                </div>
                <Switch
                  checked={settings.sendBookingConfirmation}
                  onCheckedChange={(checked) => handleSettingChange("sendBookingConfirmation", checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Send Reminder Emails</Label>
                  <p className="text-sm text-gray-600">Remind users about upcoming visits</p>
                </div>
                <Switch
                  checked={settings.sendReminderEmails}
                  onCheckedChange={(checked) => handleSettingChange("sendReminderEmails", checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Admin Notifications</Label>
                  <p className="text-sm text-gray-600">Notify admins of new bookings</p>
                </div>
                <Switch
                  checked={settings.adminNotifications}
                  onCheckedChange={(checked) => handleSettingChange("adminNotifications", checked)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security Settings
            </CardTitle>
            <CardDescription>Configure security and access controls</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                <Input
                  id="sessionTimeout"
                  type="number"
                  value={settings.sessionTimeout}
                  onChange={(e) => handleSettingChange("sessionTimeout", parseInt(e.target.value))}
                />
              </div>
              <div>
                <Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
                <Input
                  id="maxLoginAttempts"
                  type="number"
                  value={settings.maxLoginAttempts}
                  onChange={(e) => handleSettingChange("maxLoginAttempts", parseInt(e.target.value))}
                />
              </div>
            </div>
            <Separator />
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Enable Two-Factor Authentication</Label>
                  <p className="text-sm text-gray-600">Require 2FA for admin accounts</p>
                </div>
                <Switch
                  checked={settings.enableTwoFactorAuth}
                  onCheckedChange={(checked) => handleSettingChange("enableTwoFactorAuth", checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Maintenance Mode</Label>
                  <p className="text-sm text-gray-600">Put the platform in maintenance mode</p>
                </div>
                <Switch
                  checked={settings.maintenanceMode}
                  onCheckedChange={(checked) => handleSettingChange("maintenanceMode", checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Allow New Registrations</Label>
                  <p className="text-sm text-gray-600">Allow new users to register</p>
                </div>
                <Switch
                  checked={settings.allowNewRegistrations}
                  onCheckedChange={(checked) => handleSettingChange("allowNewRegistrations", checked)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end gap-4">
          <Button onClick={handleLogout} variant="outline" className="flex items-center gap-2">
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
          <Button onClick={handleSave} className="flex items-center gap-2">
            <Save className="h-4 w-4" />
            Save All Settings
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SettingsManagement;
