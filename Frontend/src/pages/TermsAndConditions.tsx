import React from "react";

const TermsAndConditions = () => (
  <div className="container mx-auto py-10 px-4">
    <h1 className="text-2xl font-bold mb-4">Terms and Conditions</h1>
    <p className="text-sm text-gray-700 mb-4">
      Welcome to Guardiann. By accessing our platform, you agree to be bound by the following terms and conditions:
    </p>

    <ul className="list-disc list-inside text-sm text-gray-700 space-y-2">
      <li>Guardiann provides a platform to browse and discover educational institutions. We do not operate or control any of the listed institutions.</li>
      <li>All bookings or premium listings made via our platform are final and subject to verification.</li>
      <li>Any disputes with institutions must be resolved directly with them. We facilitate the connection but do not guarantee services provided by third parties.</li>
      <li>Users are responsible for maintaining confidentiality of their login credentials.</li>
      <li>We reserve the right to suspend or delete accounts violating our policies or engaging in fraudulent activities.</li>
    </ul>
  </div>
);

export default TermsAndConditions;
