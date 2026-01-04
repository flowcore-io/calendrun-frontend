import { getTranslations } from "next-intl/server";

export default async function TermsPage() {
  const t = await getTranslations("footer");

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="mb-8 text-3xl font-bold text-zinc-900 dark:text-zinc-100">{t("terms")}</h1>
      <div className="max-w-none">
        <p className="mb-4">Last updated: November 28, 2025</p>
        <p className="mb-4">
          Please read these Terms and Conditions (&quot;Terms&quot;, &quot;Terms and
          Conditions&quot;) carefully before using the CalendRun website and service (the
          &quot;Service&quot;) operated by Usable/Flowcore (&quot;us&quot;, &quot;we&quot;, or
          &quot;our&quot;).
        </p>

        <h2 className="text-xl font-bold mt-8 mb-4">1. Acceptance of Terms</h2>
        <p className="mb-4">
          By accessing or using the Service you agree to be bound by these Terms. If you disagree
          with any part of the terms then you may not access the Service.
        </p>

        <h2 className="text-xl font-bold mt-8 mb-4">2. Accounts</h2>
        <p className="mb-4">
          When you create an account with us, you must provide us information that is accurate,
          complete, and current at all times. Failure to do so constitutes a breach of the Terms,
          which may result in immediate termination of your account on our Service.
        </p>
        <p className="mb-4">
          You are responsible for safeguarding the password that you use to access the Service and
          for any activities or actions under your password, whether your password is with our
          Service or a third-party service.
        </p>

        <h2 className="text-xl font-bold mt-8 mb-4">3. Health Disclaimer</h2>
        <p className="mb-4">
          The Service offers health and fitness information and is designed for educational and
          entertainment purposes only. You should consult your physician or other health care
          professional before starting this or any other fitness program to determine if it is right
          for your needs.
        </p>
        <p className="mb-4">
          Do not start this fitness program if your physician or health care provider advises
          against it. If you experience faintness, dizziness, pain or shortness of breath at any
          time while exercising you should stop immediately.
        </p>
        <p className="mb-4">
          By using the Service, you understand that there is a risk of injury associated with
          participating in any exercise program. You hereby assume full responsibility for any and
          all injuries, losses and damages that you incur while attending, exercising or
          participating in the Service.
        </p>

        <h2 className="text-xl font-bold mt-8 mb-4">4. Subscriptions and Payments</h2>
        <p className="mb-4">
          Some parts of the Service may be billed on a subscription basis
          (&quot;Subscription(s)&quot;). You will be billed in advance on a recurring and periodic
          basis (&quot;Billing Cycle&quot;). Billing cycles are set on a monthly or annual basis.
        </p>
        <p className="mb-4">
          If payment processing is enabled, by providing a credit card or other payment method, you
          represent and warrant that you are authorized to use the designated payment method and
          that you authorize us (or our third-party payment processor) to charge your payment method
          for the total amount of your subscription or other purchase (including any applicable
          taxes and other charges).
        </p>

        <h2 className="text-xl font-bold mt-8 mb-4">5. User Conduct</h2>
        <p className="mb-4">You agree not to use the Service to:</p>
        <ul className="list-disc pl-5 space-y-2 mb-4">
          <li>
            Upload, post, email, transmit or otherwise make available any content that is unlawful,
            harmful, threatening, abusive, harassing, tortious, defamatory, vulgar, obscene,
            libelous, invasive of another&apos;s privacy, hateful, or racially, ethnically or
            otherwise objectionable;
          </li>
          <li>
            Impersonate any person or entity, or falsely state or otherwise misrepresent your
            affiliation with a person or entity;
          </li>
          <li>
            Engage in any activity that interferes with or disrupts the Service or servers or
            networks connected to the Service.
          </li>
        </ul>

        <h2 className="text-xl font-bold mt-8 mb-4">6. Intellectual Property</h2>
        <p className="mb-4">
          The Service and its original content, features and functionality are and will remain the
          exclusive property of Usable/Flowcore and its licensors. The Service is protected by
          copyright, trademark, and other laws of both the country and foreign countries.
        </p>

        <h2 className="text-xl font-bold mt-8 mb-4">7. Termination</h2>
        <p className="mb-4">
          We may terminate or suspend access to our Service immediately, without prior notice or
          liability, for any reason whatsoever, including without limitation if you breach the
          Terms.
        </p>
        <p className="mb-4">
          All provisions of the Terms which by their nature should survive termination shall survive
          termination, including, without limitation, ownership provisions, warranty disclaimers,
          indemnity and limitations of liability.
        </p>

        <h2 className="text-xl font-bold mt-8 mb-4">8. Limitation of Liability</h2>
        <p className="mb-4">
          In no event shall Usable/Flowcore, nor its directors, employees, partners, agents,
          suppliers, or affiliates, be liable for any indirect, incidental, special, consequential
          or punitive damages, including without limitation, loss of profits, data, use, goodwill,
          or other intangible losses, resulting from (i) your access to or use of or inability to
          access or use the Service; (ii) any conduct or content of any third party on the Service;
          (iii) any content obtained from the Service; and (iv) unauthorized access, use or
          alteration of your transmissions or content, whether based on warranty, contract, tort
          (including negligence) or any other legal theory, whether or not we have been informed of
          the possibility of such damage, and even if a remedy set forth herein is found to have
          failed of its essential purpose.
        </p>

        <h2 className="text-xl font-bold mt-8 mb-4">9. Changes</h2>
        <p className="mb-4">
          We reserve the right, at our sole discretion, to modify or replace these Terms at any
          time. If a revision is material we will try to provide at least 30 days notice prior to
          any new terms taking effect. What constitutes a material change will be determined at our
          sole discretion.
        </p>

        <h2 className="text-xl font-bold mt-8 mb-4">10. Contact Us</h2>
        <p className="mb-4">
          If you have any questions about these Terms, please contact us at support@flowcore.io.
        </p>
      </div>
    </div>
  );
}
