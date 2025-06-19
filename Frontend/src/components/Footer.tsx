import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

interface PlatformSettings {
  contactEmail: string;
  supportPhone: string;
}

interface ApiResponse {
  success: boolean;
  data: PlatformSettings;
}

const Footer = () => {
  const [settings, setSettings] = useState<PlatformSettings>({
    contactEmail: '',
    supportPhone: ''
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await axios.get<ApiResponse>('https://guardiann.in/api/settings');
        if (response.data.success) {
          setSettings(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
      }
    };

    fetchSettings();
  }, []);

  return (
    <footer className="bg-gray-100 pt-12 pb-8">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <Link to="/" className="inline-block mb-4">
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-education-600 to-education-400">
                  Guardiann
              </span>
            </Link>
            <p className="text-gray-600 text-sm mb-4">
              Find the best schools, colleges & coaching centers near you.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/categories" className="text-sm text-gray-600 hover:text-education-600">
                  Explore
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-sm text-gray-600 hover:text-education-600">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-sm text-gray-600 hover:text-education-600">
                  Contact
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-sm text-gray-600 hover:text-education-600">
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-sm text-gray-600 hover:text-education-600">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/refund" className="text-sm text-gray-600 hover:text-education-600">
                 Refund Policy
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Categories</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/categories/schools" className="text-sm text-gray-600 hover:text-education-600">
                  Schools
                </Link>
              </li>
              <li>
                <Link to="/categories/colleges" className="text-sm text-gray-600 hover:text-education-600">
                  Colleges
                </Link>
              </li>
              <li>
                <Link to="/categories/coaching" className="text-sm text-gray-600 hover:text-education-600">
                  Coaching
                </Link>
              </li>
              <li>
                <Link to="/categories/pg-colleges" className="text-sm text-gray-600 hover:text-education-600">
                  PG Colleges
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Contact Us</h3>
            <ul className="space-y-2">
              <li className="text-sm text-gray-600">
                {settings.contactEmail || 'support@guardiann.com'}
              </li>
              <li className="text-sm text-gray-600">
                {settings.supportPhone || '+91 9063601724'}
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-gray-200 text-center text-sm text-gray-500">
          <p>&copy; {new Date().getFullYear()} Guardiann. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
