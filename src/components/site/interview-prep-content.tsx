import { CheckCircle2 } from "lucide-react";

/** Shared interview checklist (public page + dashboard). Practical guidance only. */
export const INTERVIEW_SECTIONS = [
  {
    title: "1. Research",
    items: [
      "Read the job description twice and list the top three things the role needs",
      "Understand what the company does, who its customers are and recent news",
      "Look up your interviewers on LinkedIn",
      "Confirm the time zone and format (phone, video, in person)",
    ],
  },
  {
    title: "2. Prepare your stories (STAR)",
    items: [
      "Situation — the context, briefly",
      "Task — what you were responsible for",
      "Action — what you personally did",
      "Result — what changed; use numbers you can explain",
      "Prepare 5–6 stories: a challenge, teamwork, a mistake, leadership, a result you're proud of",
    ],
  },
  {
    title: "3. Practise common questions",
    items: [
      "Tell me about yourself (60–90 seconds, tailored to the role)",
      "Why this role and why this company?",
      "Strengths and areas you're developing",
      "Salary expectations — research a range beforehand",
      "Questions about gaps or career changes — be brief and honest",
    ],
  },
  {
    title: "4. Remote interview setup",
    items: [
      "Test camera, microphone and the meeting link in advance",
      "Stable internet plus a backup (mobile data) and power plan",
      "Quiet space, neutral background, good lighting",
      "Join 3–5 minutes early",
    ],
  },
  {
    title: "5. Your questions for them",
    items: [
      "What does success look like in the first 90 days?",
      "How does the team communicate and make decisions?",
      "What are the next steps and timeline?",
    ],
  },
  {
    title: "6. Follow up",
    items: [
      "Send a short thank-you email within 24 hours",
      "Note what went well and what to improve",
      "Update your application tracker",
    ],
  },
];

export function InterviewPrepContent() {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {INTERVIEW_SECTIONS.map((section) => (
        <section key={section.title} className="tile p-5 sm:p-6">
          <h2 className="font-semibold">{section.title}</h2>
          <ul className="mt-4 space-y-2.5">
            {section.items.map((item) => (
              <li key={item} className="flex gap-2.5 text-sm leading-relaxed text-slate-700">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-brand-600" aria-hidden />
                {item}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
