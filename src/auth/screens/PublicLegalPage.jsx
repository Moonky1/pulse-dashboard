import { PublicSiteShell } from '../components/PublicSiteShell.jsx'

const privacySections = [
  {
    title: 'About Pulse',
    body: 'Pulse is an internal workforce, training, and operations platform for Kampaign Kings staff. It supports staff identity, access administration, learning, and approved company workflows.',
  },
  {
    title: 'Information Pulse handles',
    body: 'Pulse stores the staff account and profile information, access status, authorization, and application activity needed to operate the service. This may include training progress and security or audit records created through authorized use of Pulse.',
  },
  {
    title: 'Google Sign-In',
    body: 'Staff may sign in with a company email and password or with Google. Google Sign-In provides basic identity information used for authentication, such as your name, email address, and Google profile identity. Pulse does not request access to Gmail, Google Drive, Google Calendar, contacts, or other Google account content.',
  },
  {
    title: 'How information is used',
    body: 'Information is used to authenticate staff, determine the applicable Pulse access state, provide training and operational features, support the service, and protect company systems. Google authentication confirms identity only; it does not automatically grant Pulse access or permissions.',
  },
  {
    title: 'Authentication and administration',
    body: 'Authentication is processed through Supabase Auth. Authorized Pulse administrators may review and manage staff access according to company policy. Access may be blocked or inactivated when required, while security and audit information may be retained for operational and security purposes.',
  },
  {
    title: 'Sharing and sale',
    body: 'Pulse does not sell staff personal information. Information is made available only as needed to operate, secure, administer, and support the internal service and its authentication providers.',
  },
  {
    title: 'Questions',
    body: 'For privacy questions or requests concerning your Pulse account, contact your Kampaign Kings administrator.',
  },
]

const termsSections = [
  {
    title: 'Authorized use',
    body: 'Pulse is intended for authorized Kampaign Kings staff. Successfully authenticating an identity does not itself grant access to Pulse; access depends on the company approval and authorization assigned to that staff account.',
  },
  {
    title: 'Your account',
    body: 'Use only your own authorized account. Do not transfer, share, or allow another person to use your staff account or authentication credentials.',
  },
  {
    title: 'Access controls',
    body: 'Do not attempt to bypass access controls, obtain permissions you were not granted, access another user’s account, or interfere with the security or operation of Pulse.',
  },
  {
    title: 'Company material',
    body: 'Training, operational, and internal company material available through Pulse is for authorized company use. Handle that material according to applicable Kampaign Kings policies and instructions.',
  },
  {
    title: 'Access changes',
    body: 'Access may be limited, suspended, blocked, or revoked according to company access and security policy. Staff should contact an authorized administrator if their access appears incorrect.',
  },
  {
    title: 'Service changes',
    body: 'Pulse functionality may evolve as company training and operational needs change. Staff should follow the current in-product guidance and applicable company policies when using the service.',
  },
  {
    title: 'Support',
    body: 'For account access, acceptable-use, or service support questions, contact your Kampaign Kings administrator.',
  },
]

const pages = {
  privacy: {
    eyebrow: 'Privacy',
    title: 'Privacy Policy',
    intro: 'How Pulse handles the information needed to provide secure internal staff access.',
    sections: privacySections,
  },
  terms: {
    eyebrow: 'Terms',
    title: 'Terms of Service',
    intro: 'The basic conditions for using Pulse.',
    sections: termsSections,
  },
}

export function PublicLegalPage({ kind }) {
  const page = pages[kind] ?? pages.privacy

  return (
    <PublicSiteShell>
      <main className="public-legal">
        <header className="public-legal-heading">
          <p className="public-site-eyebrow">{page.eyebrow}</p>
          <h1>{page.title}</h1>
          <p>{page.intro}</p>
          <p className="public-legal-updated">Last updated: September 2026</p>
        </header>
        <article className="public-legal-body">
          {page.sections.map((section) => (
            <section key={section.title}>
              <h2>{section.title}</h2>
              <p>{section.body}</p>
            </section>
          ))}
        </article>
      </main>
    </PublicSiteShell>
  )
}
