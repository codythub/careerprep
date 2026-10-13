/**
 * Career guides: editorial content shipped with the site (no database, no CMS).
 * The Laravel API has no content endpoints, so guides are edited here and deployed.
 * Practical advice only — no statistics, promises or invented stories.
 */

export const GUIDE_CATEGORY_LABEL = {
  RESUME: "Resume",
  INTERVIEWS: "Interviews",
  REMOTE_JOBS: "Remote Jobs",
  LINKEDIN: "LinkedIn",
  COVER_LETTERS: "Cover Letters",
  SALARY_NEGOTIATION: "Salary",
  PORTFOLIO: "Portfolio",
  CAREER_DEVELOPMENT: "Career Development",
  SCAM_AWARENESS: "Job Scam Awareness",
} as const;

export type GuideCategory = keyof typeof GUIDE_CATEGORY_LABEL;

export const GUIDE_CATEGORY_SLUG: Record<GuideCategory, string> = {
  RESUME: "resume",
  INTERVIEWS: "interviews",
  REMOTE_JOBS: "remote-jobs",
  LINKEDIN: "linkedin",
  COVER_LETTERS: "cover-letters",
  SALARY_NEGOTIATION: "salary",
  PORTFOLIO: "portfolio",
  CAREER_DEVELOPMENT: "career-development",
  SCAM_AWARENESS: "job-scam-awareness",
};

export type Guide = {
  slug: string;
  title: string;
  excerpt: string;
  category: GuideCategory;
  seoTitle?: string;
  seoDescription?: string;
  content: string;
};

const GUIDES: Guide[] = [
  {
    slug: "how-to-write-a-strong-resume",
    title: "How to Write a Strong Resume",
    category: "RESUME",
    excerpt: "A practical checklist for a clear, ATS-friendly resume that shows what you achieved — not just what you were responsible for.",
    seoDescription: "Practical resume advice for Nigerian professionals: structure, achievement statements, keywords and ATS-friendly formatting.",
    content: `## Start with the role you want

Before you edit anything, pick one target role. Read three to five real job descriptions for it and note the skills, tools and outcomes that keep appearing. Your resume should make those easy to find.

## Use a simple, ATS-friendly structure

Applicant tracking systems (ATS) read plain structure best:

- **Contact details** — name, city, phone, professional email, LinkedIn URL
- **Professional summary** — three or four lines on who you are, what you do well and the role you're targeting
- **Skills** — grouped, relevant, and matching the language employers use
- **Experience** — most recent first
- **Education and certifications**

Avoid tables, text boxes, images and multi-column layouts for the main content. Use standard headings like "Experience" and "Education".

## Write achievements, not duties

Compare:

- *Responsible for customer complaints.*
- *Resolved an average of 40 customer tickets a day, cutting the team's response backlog from three days to one.*

The second tells the employer what changed because you were there. A useful pattern is **action + task + result**. Only use numbers you can explain in an interview.

## Tailor every application

Keep a master resume with everything, then create a focused version for each role. Move the most relevant experience and skills to the top and mirror the employer's terminology where it honestly describes your work.

## Final checks

- One or two pages
- Consistent dates and formatting
- No spelling errors — read it aloud
- Saved as PDF unless the employer asks for Word
- File named clearly, e.g. \`Firstname-Lastname-Resume.pdf\``,
  },
  {
    slug: "job-scam-awareness",
    title: "Job Scam Awareness: How to Protect Yourself",
    category: "SCAM_AWARENESS",
    excerpt: "The warning signs of fake job offers and what to do if a listing asks you for money or sensitive information.",
    seoDescription: "Learn the warning signs of job scams targeting Nigerian job seekers and how to stay safe when applying for remote jobs.",
    content: `## The most important rule

**A legitimate employer will never ask you to pay to get a job.** Not for "training", "equipment", "processing", "visa fees" or "registration".

## Common warning signs

- You're offered a job without an interview, or after a short chat on a messaging app
- The salary is far above what similar roles pay
- The recruiter uses a free email address instead of a company domain
- You're asked for your BVN, bank login, card details or copies of ID early in the process
- You're pressured to decide or pay quickly
- The company has no verifiable website, address or online presence
- You're sent a cheque and asked to send part of the money back

## How to check an employer

1. Search the company name with words like "scam" or "reviews"
2. Check that the website domain matches the recruiter's email domain
3. Look for the company and the recruiter on LinkedIn
4. Apply through the company's official careers page where possible

## If something feels wrong

Stop communicating and don't send money or documents. If you found the listing on our job board, use the **Report this job** button so our team can review it.`,
  },
  {
    slug: "how-to-find-legitimate-remote-jobs-from-nigeria",
    title: "How to Find Legitimate Remote Jobs from Nigeria",
    category: "REMOTE_JOBS",
    excerpt: "Understand the difference between 'remote' and 'open to Nigeria', and how to check eligibility before you apply.",
    seoDescription: "How Nigerian professionals can find remote jobs they are actually eligible for, and check location requirements before applying.",
    content: `## "Remote" doesn't always mean "anywhere"

Many remote roles are limited to specific countries or time zones for legal, tax or payroll reasons. A job can be fully remote and still not accept applicants based in Nigeria.

That's why our job board shows two separate labels:

- **Remote** — the work can be done away from an office
- **Nigeria Eligible** — our team has confirmed that Nigeria-based applicants can apply

Jobs we haven't confirmed show **Check eligibility before applying**.

## How to check eligibility yourself

- Read the full description for phrases like "must be based in", "US only", "EMEA" or "work authorisation"
- Look for the company's hiring policy on its careers page
- Check whether they hire through an Employer of Record (EOR) or as contractors
- If unclear, ask politely before investing time in a long application

## Prepare for remote hiring processes

- Reliable internet and a backup power plan
- A quiet space for video interviews
- Comfort with async tools: email, Slack, shared documents
- Clear availability in the employer's time zone`,
  },
  {
    slug: "how-to-prepare-for-interviews",
    title: "How to Prepare for Interviews",
    category: "INTERVIEWS",
    excerpt: "A simple preparation routine: research the company, practise structured answers and prepare good questions.",
    seoDescription: "Interview preparation guide: company research, the STAR method, common questions and remote interview tips.",
    content: `## Research the company and the role

Understand what the company does, who its customers are and what the role is expected to achieve. Re-read the job description and note the top three things they need.

## Prepare stories using STAR

For behavioural questions ("Tell me about a time when…"), structure answers as:

- **Situation** — the context
- **Task** — what you needed to do
- **Action** — what *you* did
- **Result** — what changed, ideally measurable

Prepare five or six stories that cover teamwork, a challenge, a mistake you learned from, leadership and a result you're proud of.

## Common questions to practise

- Tell me about yourself
- Why do you want this role?
- What are your strengths and areas to develop?
- What are your salary expectations?

## For remote interviews

Test your camera, microphone and connection beforehand. Have a charged device and a backup data plan. Join a few minutes early.

## Ask good questions

- What does success look like in the first 90 days?
- How does the team communicate and collaborate?
- What are the next steps in the process?`,
  },
  {
    slug: "linkedin-profile-optimization",
    title: "LinkedIn Profile Optimization",
    category: "LINKEDIN",
    excerpt: "Make your LinkedIn profile work with your resume: headline, About section, experience and skills.",
    seoDescription: "Improve your LinkedIn profile with a clear headline, strong About section and consistent experience details.",
    content: `## Headline

Your headline appears everywhere you do. Go beyond your current job title: say what you do and for whom, e.g. *Customer Success Specialist | SaaS | Onboarding & Retention*.

## About section

Write in the first person. Cover what you do, what you're good at, the kind of role you're looking for, and one or two achievements. Keep paragraphs short.

## Experience

Match titles and dates to your resume — recruiters notice inconsistencies. Add two or three achievement bullets per role.

## Skills and recommendations

List skills that match your target roles. Ask former managers or colleagues for specific recommendations about work they saw you do.

## Settings worth checking

- A clear, professional profile photo
- A custom profile URL
- "Open to work" preferences set to your target roles and locations`,
  },
];

/** Guides in display order, optionally limited to one category. */
export function listGuides(category?: GuideCategory, take?: number): Guide[] {
  const list = category ? GUIDES.filter((g) => g.category === category) : GUIDES;
  return take ? list.slice(0, take) : list;
}

export function guideBySlug(slug: string): Guide | null {
  return GUIDES.find((g) => g.slug === slug) ?? null;
}
