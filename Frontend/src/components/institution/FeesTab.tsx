import React from "react";

interface FeeItem {
  amount: string;
  period: string;
  includes: string[];
}

interface FeesTabProps {
  fees: Record<string, FeeItem>;
}

const FeesTab: React.FC<FeesTabProps> = ({ fees }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <h2 className="text-2xl font-semibold mb-4">Fee Structure</h2>
      <div className="space-y-6">
        {Object.entries(fees).map(([level, fee], index) => (
          <div key={index} className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-medium text-lg capitalize">{level.replace(/([A-Z])/g, ' $1').trim()}</h3>
              <div className="text-right">
                <p className="text-2xl font-bold text-education-600">₹{fee.amount}</p>
                <p className="text-sm text-gray-600">{fee.period}</p>
              </div>
            </div>
            {fee.includes && fee.includes.length > 0 && (
              <div className="mt-3">
                <h4 className="text-sm font-medium mb-2">Includes:</h4>
                <ul className="list-disc list-inside text-sm text-gray-600">
                  {fee.includes.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
      <p className="mt-4 text-sm text-gray-600">
        * Additional fees may apply for extracurricular activities, transportation, and other services.
      </p>
    </div>
  );
};

export default FeesTab;
