/**
 * Candidate-side demo data + local session state.
 *
 * This is a frontend prototype: invitations are static demo data, but the
 * candidate's *own* per-invitation status (not started / in progress /
 * completed) and their profile live in localStorage so the journey feels
 * real across navigations in this browser.
 */

export type InvitationStatus = "not-started" | "in-progress" | "completed";
export type InterviewMode = "one-way" | "live";

export interface Invitation {
  id: string;
  company: string;
  companyInitials: string;
  companyColor: string;
  role: string;
  invitedAt: string;
  deadline: string; // ISO date
  daysLeft: number;
  mode: InterviewMode;
  durationMinutes: number;
  questionCount: number;
  questions: Array<{ id: string; prompt: string; prepSeconds: number; recordingLimitSeconds: number }>;
  aboutRole: string;
  instructions: string[];
  salaryNote?: string;
}

export interface NotificationItem {
  id: string;
  kind: "reminder" | "tip" | "status";
  title: string;
  body: string;
  daysAgo: number;
  read: boolean;
  href: string;
}

export interface CandidateProfile {
  name: string;
  email: string;
  phone: string;
  location: string;
  headline: string;
  resumeName: string | null;
  resumeUpdatedAt: number | null;
  education: string;
  skills: string[];
  notifyReminders: boolean;
  notifyEmails: boolean;
  mirrorDefault: boolean;
  linkLostGuard: boolean;
}

export const CANDIDATE_PROFILE_DEFAULTS: CandidateProfile = {
  name: "Rohan Sharma",
  email: "rohan.sharma@example.com",
  phone: "+91 98104 21023",
  location: "Hyderabad, India",
  headline: "Frontend engineer · React & TypeScript",
  resumeName: "rohan-sharma-resume.pdf",
  resumeUpdatedAt: Date.now() - 1000 * 60 * 60 * 24 * 9,
  education: "B.Tech, Computer Science — IIIT Hyderabad (2024)",
  skills: ["React", "TypeScript", "Next.js", "CSS architecture", "Testing"],
  notifyReminders: true,
  notifyEmails: true,
  mirrorDefault: true,
  linkLostGuard: true,
};

export const INVITATIONS: Invitation[] = [
  {
    id: "frontend-techcore",
    company: "TechCore",
    companyInitials: "T",
    companyColor: "#6258E8",
    role: "Frontend Developer",
    invitedAt: "2026-10-18",
    deadline: "2026-10-28",
    daysLeft: 6,
    mode: "one-way",
    durationMinutes: 15,
    questionCount: 5,
    questions: [
      {
        id: "q1",
        prompt:
          "Tell us about a challenging project you worked on. What was your role, and what did you learn?",
        prepSeconds: 45,
        recordingLimitSeconds: 180,
      },
      {
        id: "q2",
        prompt:
          "Walk us through how you'd make a slow page fast. Where do you look first?",
        prepSeconds: 60,
        recordingLimitSeconds: 180,
      },
      {
        id: "q3",
        prompt:
          "How do you decide between shipping quickly and doing it 'properly'? Give a real example.",
        prepSeconds: 45,
        recordingLimitSeconds: 150,
      },
      {
        id: "q4",
        prompt:
          "Describe how you'd design the state management for a dashboard with filters, sorting, and live updates.",
        prepSeconds: 75,
        recordingLimitSeconds: 210,
      },
      {
        id: "q5",
        prompt:
          "Why TechCore, and what kind of work would make you say 'that was a great year'?",
        prepSeconds: 30,
        recordingLimitSeconds: 120,
      },
    ],
    aboutRole:
      "We are looking for a passionate Frontend Developer with a strong foundation in modern web technologies. You'll work closely with designers and engineers to build responsive and performant web applications.",
    instructions: [
      "Complete the interview before the deadline.",
      "Make sure your camera and microphone are working.",
      "Find a quiet place with good lighting and stable internet.",
      "You can retake some questions if needed.",
    ],
    salaryNote: "Hybrid · Hyderabad",
  },
  {
    id: "backend-stackline",
    company: "Stackline",
    companyInitials: "S",
    companyColor: "#178A5B",
    role: "Backend Developer",
    invitedAt: "2026-10-15",
    deadline: "2026-10-24",
    daysLeft: 2,
    mode: "one-way",
    durationMinutes: 14,
    questionCount: 4,
    questions: [
      {
        id: "q1",
        prompt:
          "Tell us about an API you designed that other teams actually used. What made it good?",
        prepSeconds: 45,
        recordingLimitSeconds: 180,
      },
      {
        id: "q2",
        prompt:
          "A query slowed down in production. Walk us through your debugging steps.",
        prepSeconds: 60,
        recordingLimitSeconds: 180,
      },
      {
        id: "q3",
        prompt:
          "How do you decide between a queue, a cron, and doing the work inline?",
        prepSeconds: 60,
        recordingLimitSeconds: 150,
      },
      {
        id: "q4",
        prompt:
          "What does 'production readiness' mean to you for a new service?",
        prepSeconds: 45,
        recordingLimitSeconds: 150,
      },
    ],
    aboutRole:
      "Join the platform team building the services behind Stackline's retail analytics. Expect real ownership of APIs, data pipelines, and reliability work.",
    instructions: [
      "Complete the interview before the deadline.",
      "Make sure your camera and microphone are working.",
      "Find a quiet place with good lighting and stable internet.",
      "One retake is available per question.",
    ],
  },
  {
    id: "fullstack-nimbus",
    company: "Nimbus Labs",
    companyInitials: "N",
    companyColor: "#B3791F",
    role: "Full Stack Developer",
    invitedAt: "2026-10-08",
    deadline: "2026-10-19",
    daysLeft: -1, // passed
    mode: "one-way",
    durationMinutes: 16,
    questionCount: 4,
    questions: [
      {
        id: "q1",
        prompt: "Tell us about a feature you shipped from design to deployment.",
        prepSeconds: 45,
        recordingLimitSeconds: 180,
      },
      {
        id: "q2",
        prompt: "How do you keep a codebase healthy while shipping fast?",
        prepSeconds: 60,
        recordingLimitSeconds: 150,
      },
      {
        id: "q3",
        prompt: "Describe a trade-off you made between frontend polish and backend correctness.",
        prepSeconds: 60,
        recordingLimitSeconds: 150,
      },
      {
        id: "q4",
        prompt: "What do you want to learn in your next role?",
        prepSeconds: 30,
        recordingLimitSeconds: 120,
      },
    ],
    aboutRole:
      "Nimbus Labs builds scheduling tools for hospitals. You'd work across a Next.js frontend and a TypeScript backend with real users depending on you.",
    instructions: [
      "Complete the interview before the deadline.",
      "Make sure your camera and microphone are working.",
      "Find a quiet place with good lighting and stable internet.",
    ],
  },
  {
    id: "analyst-datova",
    company: "Datova",
    companyInitials: "D",
    companyColor: "#9185F6",
    role: "Data Analyst",
    invitedAt: "2026-10-12",
    deadline: "2026-11-05",
    daysLeft: 14,
    mode: "live",
    durationMinutes: 30,
    questionCount: 6,
    questions: [
      {
        id: "q1",
        prompt: "Tell us about an analysis that changed a team's decision.",
        prepSeconds: 45,
        recordingLimitSeconds: 180,
      },
      {
        id: "q2",
        prompt: "How do you sanity-check a dataset before trusting it?",
        prepSeconds: 60,
        recordingLimitSeconds: 180,
      },
      {
        id: "q3",
        prompt: "Explain a technical finding to a non-technical stakeholder, as you would in a meeting.",
        prepSeconds: 45,
        recordingLimitSeconds: 150,
      },
      {
        id: "q4",
        prompt: "A dashboard metric looks wrong an hour before a board review. What do you do?",
        prepSeconds: 45,
        recordingLimitSeconds: 150,
      },
      {
        id: "q5",
        prompt: "Which tools do you reach for first, and why?",
        prepSeconds: 30,
        recordingLimitSeconds: 120,
      },
      {
        id: "q6",
        prompt: "What kind of data work do you most enjoy — and least?",
        prepSeconds: 30,
        recordingLimitSeconds: 120,
      },
    ],
    aboutRole:
      "Datova's analysts sit directly with product teams: your charts and cohort analyses get used in planning, not filed away. Live interview with the analytics lead.",
    instructions: [
      "This is a scheduled live interview — a Calendly-style slot picker follows the preparation room.",
      "Test your camera, microphone, lighting, and internet beforehand.",
      "Join from a quiet place; a headset is recommended.",
      "No retakes in live mode — check your setup first.",
    ],
  },
];

export const NOTIFICATIONS: NotificationItem[] = [
  {
    id: "n1",
    kind: "reminder",
    title: "Deadline approaching",
    body: "TechCore · Frontend Developer closes in 6 days. Budget ~15 minutes to finish it.",
    daysAgo: 0,
    read: false,
    href: "/my-interviews",
  },
  {
    id: "n2",
    kind: "reminder",
    title: "Closes in 2 days",
    body: "Stackline · Backend Developer is due Oct 24 — it's the most urgent one on your list.",
    daysAgo: 0,
    read: false,
    href: "/my-interviews",
  },
  {
    id: "n3",
    kind: "status",
    title: "Completing your profile",
    body: "Profiles with a resume get more interview invitations. Add or update yours in Profile & Settings.",
    daysAgo: 1,
    read: false,
    href: "/my-interviews/settings",
  },
  {
    id: "n4",
    kind: "tip",
    title: "Before you record",
    body: "Run the device test before your next interview — camera, mic, and lighting all get checked.",
    daysAgo: 2,
    read: true,
    href: "/my-interviews/frontend-techcore",
  },
  {
    id: "n5",
    kind: "status",
    title: "Nimbus Labs interview submitted",
    body: "Your Full Stack Developer interview was completed and is with the team now.",
    daysAgo: 5,
    read: true,
    href: "/my-interviews",
  },
];

export function formatDeadline(iso: string) {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const m = /^\d{4}-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return iso;
  return `${months[Number(m[1]) - 1]} ${Number(m[2])}`;
}

/* ---------------- local session state ---------------- */

const STATUS_KEY = "vervue:candidate-invitations:v1";
const PROFILE_KEY = "vervue:candidate-profile:v1";

type StoredStatuses = Record<string, InvitationStatus>;

function readStatuses(): StoredStatuses {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STATUS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as StoredStatuses) : {};
  } catch {
    return {};
  }
}

function writeStatuses(map: StoredStatuses) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STATUS_KEY, JSON.stringify(map));
  } catch {
    /* storage may be unavailable — demo still works without persistence */
  }
}

export function readInvitationStatus(id: string): InvitationStatus {
  return readStatuses()[id] ?? "not-started";
}

export function allStatuses(): StoredStatuses {
  return readStatuses();
}

export function writeInvitationStatus(id: string, status: InvitationStatus) {
  const map = readStatuses();
  map[id] = status;
  writeStatuses(map);
}

export function statusLabel(status: InvitationStatus) {
  return status === "completed"
    ? "Completed"
    : status === "in-progress"
      ? "In Progress"
      : "Not Started";
}

/* per-invitation progress: how far a candidate got before pausing */

const PROGRESS_KEY = "vervue:candidate-progress:v1";

interface StoredProgress {
  nextIndex: number; // index of the NEXT question to answer
  answered: number;
  updatedAt: number;
}

export interface InvitationProgress {
  answered: number;
  total: number;
  nextIndex: number;
}

function readProgressMap(): Record<string, StoredProgress> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(PROGRESS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as Record<string, StoredProgress>) : {};
  } catch {
    return {};
  }
}

function writeProgressMap(map: Record<string, StoredProgress>) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PROGRESS_KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
}

export function readInvitationProgress(invitation: Invitation): InvitationProgress | null {
  const entry = readProgressMap()[invitation.id];
  if (!entry || entry.answered <= 0) return null;
  const answered = Math.min(entry.answered, invitation.questionCount);
  return { answered, total: invitation.questionCount, nextIndex: answered };
}

export function writeInvitationProgress(invitationId: string, answered: number) {
  const map = readProgressMap();
  map[invitationId] = {
    answered: Math.floor(answered),
    nextIndex: Math.floor(answered),
    updatedAt: Date.now(),
  };
  writeProgressMap(map);
}

export function clearInvitationProgress(invitationId: string) {
  const map = readProgressMap();
  delete map[invitationId];
  writeProgressMap(map);
}

/* notification read state, per browser */

const NOTIF_KEY = "vervue:candidate-notifications:v1";

export function readUnreadNotificationIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(NOTIF_KEY);
    if (!raw) return new Set(NOTIFICATIONS.filter((n) => !n.read).map((n) => n.id));
    const readIds = JSON.parse(raw);
    const read = new Set(Array.isArray(readIds) ? readIds : []);
    return new Set(
      NOTIFICATIONS.filter((n) => !n.read && !read.has(n.id)).map((n) => n.id)
    );
  } catch {
    return new Set(NOTIFICATIONS.filter((n) => !n.read).map((n) => n.id));
  }
}

export function markNotificationRead(id: string) {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(NOTIF_KEY);
    const readIds: string[] = raw ? JSON.parse(raw) : [];
    if (!readIds.includes(id)) {
      readIds.push(id);
      window.localStorage.setItem(NOTIF_KEY, JSON.stringify(readIds));
    }
  } catch {
    /* ignore */
  }
}

/* profile state */

export function readProfile(): CandidateProfile {
  if (typeof window === "undefined") return CANDIDATE_PROFILE_DEFAULTS;
  try {
    const raw = window.localStorage.getItem(PROFILE_KEY);
    if (!raw) return CANDIDATE_PROFILE_DEFAULTS;
    const parsed = JSON.parse(raw);
    return { ...CANDIDATE_PROFILE_DEFAULTS, ...(parsed && typeof parsed === "object" ? parsed : {}) };
  } catch {
    return CANDIDATE_PROFILE_DEFAULTS;
  }
}

export function writeProfile(profile: CandidateProfile) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch {
    /* ignore */
  }
}

/** Profile completion percentage, matching the dashboard's checklist. */
export function profileCompletion(p: CandidateProfile): {
  percent: number;
  missing: string[];
} {
  const checks: Array<[string, boolean]> = [
    ["Personal info", !!(p.name && p.email && p.phone)],
    ["Location", !!p.location],
    ["Resume", !!p.resumeName],
    ["Education", !!p.education],
    ["Skills", p.skills.length > 0],
    ["Headline", !!p.headline],
  ];
  const doneCount = checks.filter(([, ok]) => ok).length;
  return {
    percent: Math.round((doneCount / checks.length) * 100),
    missing: checks.filter(([, ok]) => !ok).map(([label]) => label),
  };
}
