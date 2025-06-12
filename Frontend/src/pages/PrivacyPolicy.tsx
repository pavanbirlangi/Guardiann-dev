import React from "react";

const PrivacyPolicy = () => (
  <div className="container mx-auto py-10 px-4">
    <h1 className="text-2xl font-bold mb-4">Privacy Policy</h1>
    <p className="text-sm text-gray-700 mb-4">
      At Guardiann, we value your privacy. This policy outlines how we collect, use, and protect your personal information:
    </p>

    <ul className="list-disc list-inside text-sm text-gray-700 space-y-2">
      <li>We collect basic user data such as name, email, phone number, and preferences when you register or make a booking.</li>
      <li>We use your information to improve our services, personalize recommendations, and complete transactions.</li>
      <li>We do not sell or share your personal data with any third-party without your consent, except for services essential to our platform (e.g., payment gateways).</li>
      <li>All payments are securely processed via Razorpay. We do not store your card or UPI details on our servers.</li>
      <li>You can request deletion of your data by contacting us at support@guardiann.com.</li>
    </ul>
  </div>
);

export default PrivacyPolicy;
