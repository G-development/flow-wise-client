"use client";

export default function PrivacyTerms() {
  return (
    <div className="p-8 max-w-3xl mx-auto space-y-6">
      <h1 className="text-4xl font-bold text-center">Flow Wise © 2025</h1>
      <h1 className="text-3xl font-bold">Terms of Service & Privacy Policy</h1>

      {/* Terms of Service */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Terms of Service</h2>
        <p>
          Welcome to Flow-Wise! By accessing or using our application, you agree
          to comply with these Terms of Service. Please read them carefully.
        </p>
        <h3 className="font-semibold">1. Use of Service</h3>
        <p>
          Flow-Wise provides tools to manage personal finances. You agree to use
          the service only for lawful purposes and in accordance with these
          terms.
        </p>
        <h3 className="font-semibold">2. User Accounts</h3>
        <p>
          You are responsible for maintaining the confidentiality of your
          account credentials and for all activity under your account.
        </p>
        <h3 className="font-semibold">3. Limitations</h3>
        <p>
          We reserve the right to modify or discontinue the service at any time
          without notice. We are not liable for any loss or damage caused by
          interruptions or changes.
        </p>
        <h3 className="font-semibold">4. Termination</h3>
        <p>
          We may suspend or terminate your account if you violate these Terms of
          Service or engage in harmful behavior.
        </p>
        <h3 className="font-semibold">5. Changes</h3>
        <p>
          These Terms of Service may be updated from time to time. Continued use
          of the service constitutes acceptance of the revised terms.
        </p>
      </section>

      {/* Privacy Policy */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Privacy Policy</h2>
        <p>
          Your privacy is important to us. This Privacy Policy explains how we
          collect, use, and protect your personal information when you use
          Flow-Wise.
        </p>
        <h3 className="font-semibold">1. Information We Collect</h3>
        <p>
          We may collect personal information such as your name, email address,
          and usage data to provide and improve our services.
        </p>
        <h3 className="font-semibold">2. How We Use Your Information</h3>
        <p>
          Your information is used to manage your account, provide personalized
          features, and improve the application. We do not sell your data to
          third parties.
        </p>
        <h3 className="font-semibold">3. Data Security</h3>
        <p>
          We implement reasonable measures to protect your information from
          unauthorized access, disclosure, or destruction.
        </p>
        <h3 className="font-semibold">4. Data Sharing</h3>
        <p>
          We may share information with trusted third-party providers only as
          necessary to operate the service. Any sharing is limited and secure.
        </p>
        <h3 className="font-semibold">5. Your Rights</h3>
        <p>
          You may request access, correction, or deletion of your personal
          information at any time by contacting us. You can also disable certain
          features to limit data collection.
        </p>
        <h3 className="font-semibold">6. Updates</h3>
        <p>
          We may update this Privacy Policy periodically. Continued use of
          Flow-Wise constitutes acceptance of the updated policy.
        </p>
      </section>

      <p className="text-sm text-gray-500">Last updated: August 2025</p>
    </div>
  );
}
