import React from "react";

interface InfrastructureItem {
  name: string;
  description: string;
  icon_url: string;
}

interface InfrastructureTabProps {
  infrastructure: InfrastructureItem[];
}

const InfrastructureTab: React.FC<InfrastructureTabProps> = ({ infrastructure }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <h2 className="text-2xl font-semibold mb-4">Infrastructure</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {infrastructure.map((item, index) => (
          <div key={index} className="bg-gray-50 p-4 rounded-lg">
            {item.icon_url && (
              <img 
                src={item.icon_url} 
                alt={item.name} 
                className="w-12 h-12 mx-auto mb-3"
              />
            )}
            <h3 className="font-medium text-center mb-2">{item.name}</h3>
            <p className="text-sm text-gray-600 text-center">{item.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default InfrastructureTab;
