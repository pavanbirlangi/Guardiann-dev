import React from "react";
import { Phone, Mail, Globe, Clock } from "lucide-react";

interface AboutTabProps {
  name: string;
  description: string;
  contact: {
    phone: string;
    email: string;
    website: string;
  };
  visiting_hours?: Array<{
    day: string;
    start_time: string;
    end_time: string;
  }>;
}

const AboutTab: React.FC<AboutTabProps> = ({ name, description, contact, visiting_hours = [] }) => {
  const formatTime = (time: string) => {
    try {
      const [hours, minutes] = time.split(':');
      const date = new Date();
      date.setHours(parseInt(hours), parseInt(minutes));
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    } catch (err) {
      return time;
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <h2 className="text-2xl font-semibold mb-4">About {name}</h2>
      <p className="text-gray-700 leading-relaxed mb-6">
        {description}
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-3">Contact Information</h3>
          <div className="space-y-2">
            <div className="flex items-center">
              <Phone className="w-4 h-4 mr-2 text-education-600" />
              <span>{contact.phone}</span>
            </div>
            <div className="flex items-center">
              <Mail className="w-4 h-4 mr-2 text-education-600" />
              <span>{contact.email}</span>
            </div>
            <div className="flex items-center">
              <Globe className="w-4 h-4 mr-2 text-education-600" />
              <span>{contact.website}</span>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-3">Visiting Hours</h3>
          <div className="space-y-2">
            {visiting_hours.length > 0 ? (
              visiting_hours.map((hour, index) => (
                <div key={index} className="flex items-center">
                  <Clock className="w-4 h-4 mr-2 text-education-600" />
                  <span>{hour.day}: {formatTime(hour.start_time)} - {formatTime(hour.end_time)}</span>
                </div>
              ))
            ) : (
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-2 text-education-600" />
                <span>Visiting hours not specified</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutTab;
