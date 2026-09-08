import Navbar from '../components/Navbar';
import BackLink from '../components/BackLink';

export default function Terms() {
  return (
    <div>
      <Navbar />
      <div className="max-w-3xl mx-auto px-6 py-16">
        <BackLink to="/" label="Back to home" />
        <h1 className="text-3xl font-semibold">Terms of Service</h1>
        <p className="text-muted mt-2 text-sm">Last updated: [add date]</p>

        <div className="mt-8 space-y-8 text-sm leading-relaxed">
          <Section title="1. Who this applies to">
            These terms cover anyone who uses ElimuHub, whether you are browsing
            resources, buying a resource, listing a resource as a teacher, or
            booking or offering tutoring.
          </Section>

          <Section title="2. Accounts">
            You are responsible for keeping your account details accurate and
            your login secure. We can suspend or close accounts that break these
            terms.
          </Section>

          <Section title="3. Listing and selling resources">
            Teachers submit resources for review before they go live. We can
            reject or remove a resource at any time if it does not meet our
            content standards, infringes on someone else's work, or breaks the
            law.
          </Section>

          <Section title="4. Payments and payouts">
            When a resource sells, the platform keeps a commission and pays out
            the remaining amount to the teacher, minus any payment processing
            fees. Payout schedules and minimum thresholds are described in your
            dashboard.
          </Section>

          <Section title="5. Refunds">
            If a resource is faulty, mislabeled, or not as described, contact us
            and we will review the case. Refund decisions may affect a
            teacher's payout for that sale.
          </Section>

          <Section title="6. Tutoring bookings">
            Tutors set their own subjects, rates and availability. ElimuHub
            facilitates the booking but is not a party to the tutoring itself,
            so any dispute about the session is between the student and the
            tutor, though we will step in to help resolve it where we can.
          </Section>

          <Section title="7. Acceptable use">
            Do not upload content you do not have the rights to, do not try to
            circumvent payments, and do not use the platform to harass or
            mislead other users.
          </Section>

          <Section title="8. Changes to these terms">
            We may update these terms from time to time. Continuing to use
            ElimuHub after an update means you accept the new terms.
          </Section>

          <Section title="9. Contact">
            Questions about these terms can be sent to [add contact email].
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
