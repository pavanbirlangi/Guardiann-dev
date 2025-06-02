import React from "react";

interface Fee {
  name: string;
  amount: string | number;
  period: string;
  includes: string[];
}

interface FeesTabProps {
  fees: Fee[];
}

const FeesTab: React.FC<FeesTabProps> = ({ fees }) => {
  console.log('FeesTab received fees:', fees);

  if (!fees || fees.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-2xl font-semibold mb-4">Fee Structure</h2>
        <p className="text-gray-600">No fee structure available for this institution.</p>
      </div>
    );
  }

  const formatAmount = (amount: string | number) => {
    if (!amount) return '0';
    
    // If it's already a formatted string with ₹ symbol, return it as is
    if (typeof amount === 'string' && amount.includes('₹')) {
      return amount;
    }

    // Handle numeric values
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return isNaN(numAmount) ? '0' : `₹${numAmount.toLocaleString()}`;
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <h2 className="text-2xl font-semibold mb-4">Fee Structure</h2>
      <div className="space-y-6">
        {fees.map((fee, index) => {
          console.log('Processing fee:', fee);
          return (
            <div key={index} className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-3">
                <h2 className="font-medium text-lg capitalize">{fee.name || 'Unnamed Course'}</h2>
                <div className="text-right">
                  <p className="text-2xl font-bold text-education-600">{formatAmount(fee.amount)}</p>
                  <p className="text-sm text-gray-600">{fee.period || 'Per Year'}</p>
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
          );
        })}
      </div>
      <p className="mt-4 text-sm text-gray-600">
        * Additional fees may apply for extracurricular activities, transportation, and other services.
      </p>
    </div>
  );
};

export default FeesTab;
