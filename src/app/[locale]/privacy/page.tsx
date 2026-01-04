import { getTranslations } from "next-intl/server";

export default async function PrivacyPage() {
  const t = await getTranslations("footer");

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="mb-8 text-3xl font-bold text-zinc-900 dark:text-zinc-100">{t("privacy")}</h1>
      <div className="max-w-none">
        <p className="mb-4">Last updated: November 28, 2025</p>
        <p className="mb-4">
          Usable/Flowcore (&quot;us&quot;, &quot;we&quot;, or &quot;our&quot;) operates the
          CalendRun website (the &quot;Service&quot;).
        </p>
        <p className="mb-4">
          This page informs you of our policies regarding the collection, use, and disclosure of
          personal data when you use our Service and the choices you have associated with that data.
        </p>

        <h2 className="text-xl font-bold mt-8 mb-4">1. Information We Collect</h2>
        <p className="mb-4">
          We collect several different types of information for various purposes to provide and
          improve our Service to you.
        </p>

        <h3 className="text-lg font-semibold mt-6 mb-3">Personal Data</h3>
        <p className="mb-4">
          While using our Service, we may ask you to provide us with certain personally identifiable
          information that can be used to contact or identify you (&quot;Personal Data&quot;).
          Personally identifiable information may include, but is not limited to:
        </p>
        <ul className="list-disc pl-5 space-y-2 mb-4">
          <li>Email address</li>
          <li>First name and last name</li>
          <li>Cookies and Usage Data</li>
          <li>Fitness data (run logs, distances, times)</li>
        </ul>

        <h3 className="text-lg font-semibold mt-6 mb-3">Usage Data</h3>
        <p className="mb-4">
          We may also collect information how the Service is accessed and used (&quot;Usage
          Data&quot;). This Usage Data may include information such as your computer&apos;s Internet
          Protocol address (e.g. IP address), browser type, browser version, the pages of our
          Service that you visit, the time and date of your visit, the time spent on those pages,
          unique device identifiers and other diagnostic data.
        </p>

        <h2 className="text-xl font-bold mt-8 mb-4">2. Use of Data</h2>
        <p className="mb-4">We use the collected data for various purposes:</p>
        <ul className="list-disc pl-5 space-y-2 mb-4">
          <li>To provide and maintain the Service</li>
          <li>To notify you about changes to our Service</li>
          <li>
            To allow you to participate in interactive features of our Service when you choose to do
            so (e.g. challenges, leaderboards)
          </li>
          <li>To provide customer care and support</li>
          <li>To provide analysis or valuable information so that we can improve the Service</li>
          <li>To monitor the usage of the Service</li>
          <li>To detect, prevent and address technical issues</li>
        </ul>

        <h2 className="text-xl font-bold mt-8 mb-4">3. Data Sharing and Disclosure</h2>
        <p className="mb-4">
          We may disclose your Personal Data in the good faith belief that such action is necessary
          to:
        </p>
        <ul className="list-disc pl-5 space-y-2 mb-4">
          <li>To comply with a legal obligation</li>
          <li>To protect and defend the rights or property of Usable/Flowcore</li>
          <li>To prevent or investigate possible wrongdoing in connection with the Service</li>
          <li>To protect the personal safety of users of the Service or the public</li>
          <li>To protect against legal liability</li>
        </ul>
        <p className="mb-4">
          If you join a Club within the Service, your name and activity data may be visible to other
          members of that Club.
        </p>

        <h2 className="text-xl font-bold mt-8 mb-4">4. Service Providers</h2>
        <p className="mb-4">
          We may employ third party companies and individuals to facilitate our Service
          (&quot;Service Providers&quot;), to provide the Service on our behalf, to perform
          Service-related services or to assist us in analyzing how our Service is used.
        </p>
        <p className="mb-4">
          These third parties have access to your Personal Data only to perform these tasks on our
          behalf and are obligated not to disclose or use it for any other purpose.
        </p>

        <h3 className="text-lg font-semibold mt-6 mb-3">Payments</h3>
        <p className="mb-4">
          We may provide paid products and/or services within the Service. In that case, we use
          third-party services for payment processing (e.g. payment processors).
        </p>
        <p className="mb-4">
          We will not store or collect your payment card details. That information is provided
          directly to our third-party payment processors whose use of your personal information is
          governed by their Privacy Policy. These payment processors adhere to the standards set by
          PCI-DSS as managed by the PCI Security Standards Council, which is a joint effort of
          brands like Visa, Mastercard, American Express and Discover. PCI-DSS requirements help
          ensure the secure handling of payment information.
        </p>

        <h2 className="text-xl font-bold mt-8 mb-4">5. Security of Data</h2>
        <p className="mb-4">
          The security of your data is important to us, but remember that no method of transmission
          over the Internet, or method of electronic storage is 100% secure. While we strive to use
          commercially acceptable means to protect your Personal Data, we cannot guarantee its
          absolute security.
        </p>

        <h2 className="text-xl font-bold mt-8 mb-4">6. Your Data Rights</h2>
        <p className="mb-4">
          You have the right to access, update or delete the information we have on you. Whenever
          made possible, you can access, update or request deletion of your Personal Data directly
          within your account settings section. If you are unable to perform these actions yourself,
          please contact us to assist you.
        </p>

        <h2 className="text-xl font-bold mt-8 mb-4">7. Links to Other Sites</h2>
        <p className="mb-4">
          Our Service may contain links to other sites that are not operated by us. If you click on
          a third party link, you will be directed to that third party&apos;s site. We strongly
          advise you to review the Privacy Policy of every site you visit.
        </p>
        <p className="mb-4">
          We have no control over and assume no responsibility for the content, privacy policies or
          practices of any third party sites or services.
        </p>

        <h2 className="text-xl font-bold mt-8 mb-4">8. Changes to This Privacy Policy</h2>
        <p className="mb-4">
          We may update our Privacy Policy from time to time. We will notify you of any changes by
          posting the new Privacy Policy on this page.
        </p>
        <p className="mb-4">
          You are advised to review this Privacy Policy periodically for any changes. Changes to
          this Privacy Policy are effective when they are posted on this page.
        </p>

        <h2 className="text-xl font-bold mt-8 mb-4">9. Contact Us</h2>
        <p className="mb-4">
          If you have any questions about this Privacy Policy, please contact us by email:
          support@flowcore.io
        </p>
      </div>
    </div>
  );
}
