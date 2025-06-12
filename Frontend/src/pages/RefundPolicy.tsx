import React from "react";

const RefundPolicy = () => (
  <div className="container mx-auto py-10 px-4">
    <h1 className="text-2xl font-bold mb-4">Refund & Cancellation Policy</h1>
    <p className="text-sm text-gray-700 mb-4">
      Guardiann enables users to discover and connect with educational institutions. We strive for transparency in our payment process.
    </p>

    <ul className="list-disc list-inside text-sm text-gray-700 space-y-2">
      <li>Once a booking or premium listing fee is paid, it is generally non-refundable.</li>
      <li>In case of duplicate payments or technical issues, please contact us within 7 days of the transaction.</li>
      <li>Refunds (if approved) will be processed within 7–10 business days via the original payment method.</li>
      <li>We do not entertain cancellation requests once a slot is booked with an institution through our platform.</li>
      <li>For support, contact: <span className="text-blue-600">support@guardiann.com</span> or +91 9063601724.</li>
    </ul>
  </div>
);

export default RefundPolicy;
