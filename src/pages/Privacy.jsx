import Navbar from '../components/Navbar';
import BackLink from '../components/BackLink';

export default function Privacy() {
  return (
    <div>
      <Navbar />
      <div className="max-w-3xl mx-auto px-6 py-16">
        <BackLink to="/" label="Back to home" />
        <h1 className="text-3xl font-semibold">Privacy Policy</h1>
        <p className="text-muted mt-2 text-sm">Last updated: [add date]</p>

        <div className="mt-8 space-y-8 text-sm leading-relaxed">
          <Section title="1. What we collect">
            Your name, email, and role when you register; profile details you
            add such as an avatar or tutor bio; resources you list or buy;
            bookings you make or accept; and payment references needed to
            confirm a transaction. We do not store your M-Pesa PIN or full
            card details — payments are handled by Safaricom's Daraja API or
            verified manually against a till statement.
          </Section>

          <Section title="2. How we use it">
            To run the marketplace and tutoring bookings, process payments and
            payouts, moderate listed resources, send account and transaction
            notifications, and improve the platform.
          </Section>

          <Section title="3. What other users can see">
            Your name is visible on resources you list, reviews you leave, and
            tutor bookings. Your email and payment details are never shown to
            other users.
          </Section>

          <Section title="4. Sharing">
            We share transaction data with Safaricom to process M-Pesa
            payments and with Supabase, our database and storage provider. We
            do not sell your data to advertisers.
          </Section>

          <Section title="5. Storage and security">
            Resource files you purchase are kept in private storage and only
            ever served through short-lived, signed links generated at
            download time. Passwords are hashed and never visible to us.
          </Section>

          <Section title="6. Your choices">
            You can update your profile, avatar, and preferences from
            Settings at any time. To request deletion of your account and
            associated data, contact us at [add contact email].
          </Section>

          <Section title="7. Changes to this policy">
            We may update this policy from time to time. Continuing to use
            ElimuHub after an update means you accept the new policy.
          </Section>

          <Section title="8. Contact">
            Questions about this policy can be sent to [add contact email].
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section>
      <h2 className="font-medium">{title}</h2>
      <p className="text-muted mt-2">{children}</p>
    </section>
  );
}
