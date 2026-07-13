import { hash, hashSync } from "bcryptjs";
import fs from "fs";
import path from "path";

interface User {
  _id: string;
  name: string;
  nom?: string;
  prenom?: string;
  email: string;
  password: string;
  role: string;
  avatar: string;
  activeWorkspaceId?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Portfolio {
  _id: string;
  userId: string;
  title: string;
  slug: string;
  bio: string;
  theme: string;
  primaryColor: string;
  isPublished: boolean;
  views: number;
  createdAt: Date;
  updatedAt: Date;
}

interface PortfolioProject {
  _id: string;
  portfolioId: string;
  title: string;
  description: string;
  images: string[];
  tags: string[];
  liveUrl: string;
  githubUrl: string;
  isPublished: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

interface Skill {
  _id: string;
  portfolioId: string;
  name: string;
  category: string;
  level: number;
  icon: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Experience {
  _id: string;
  portfolioId: string;
  type: "work" | "education";
  title: string;
  company: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Testimonial {
  _id: string;
  portfolioId: string;
  authorName: string;
  authorJob: string;
  authorAvatar: string;
  content: string;
  rating: number;
  isApproved: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface Message {
  _id: string;
  portfolioId: string;
  senderName: string;
  senderEmail: string;
  subject: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface Client {
  _id: string;
  nomSociete: string;
  responsable: string;
  email: string;
  telephone: string;
  adresse: string;
  secteurActivite: string;
  budget?: number;
  dateCreation: Date;
  workspaceId: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Project {
  _id: string;
  titre: string;
  description: string;
  dateDebut?: Date;
  dateFin?: Date;
  budget: number;
  statut: string;
  priorite: string;
  clientId: string;
  chefProjet?: string;
  workspaceId: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Task {
  _id: string;
  titre: string;
  description: string;
  statut: string;
  priorite: string;
  dateDebut?: string;
  dateFin?: string;
  projetId: string;
  employeId?: string;
  workspaceId: string;
  createdAt: Date;
  updatedAt: Date;
}

interface TeamUser {
  _id: string;
  nom: string;
  prenom: string;
  email: string;
  password?: string;
  role: string;
  telephone?: string;
  avatar?: string;
  dateEmbauche?: string;
  userId?: string;
  workspaceId?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Document {
  _id: string;
  nomDocument: string;
  type: string;
  description?: string;
  url: string;
  dateUpload: string;
  projectId: string;
  uploadedBy: string;
  workspaceId: string;
  createdAt: Date;
  updatedAt: Date;
}

interface TeamMessage {
  _id: string;
  expediteurId: string;
  destinataireId: string;
  contenu: string;
  dateEnvoi: Date;
  lu: boolean;
  createdAt: Date;
  updatedAt: Date;
}
interface ClientComment {
  _id: string;
  clientId: string;
  userId: string;
  userName: string;
  userEmail: string;
  comment: string;
  workspaceId: string;
  createdAt: Date;
  updatedAt: Date;
}
interface ClientDocument {
  _id: string;
  clientId: string;
  documentName: string;
  documentType: string;
  fileUrl: string;
  fileSize: number;
  uploadedBy: string;
  uploadedByName: string;
  uploadedByEmail: string;
  createdAt: Date;
  updatedAt: Date;
}

interface ClientActivity {
  _id: string;
  clientId: string;
  userId: string;
  userName: string;
  userEmail: string;
  action: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

interface ProjectActivity {
  _id: string;
  projectId: string;
  userId: string;
  userName: string;
  userEmail: string;
  action: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

interface ClientReminder {
  _id: string;
  clientId: string;
  title: string;
  description: string;
  reminderDate: string;
  endDate?: string;
  priority: string;
  status: string;
  createdBy?: string;
  createdByName?: string;
  createdByEmail?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface ClientEmail {
  _id: string;
  clientId: string;
  senderEmail: string;
  receiverEmail: string;
  subject: string;
  message: string;
  status: string;
  attachmentUrl?: string;
  attachmentName?: string;
  sentBy: string;
  sentByName: string;
  sentByEmail: string;
  createdAt: Date;
  updatedAt: Date;
}

interface ClientTag {
  _id: string;
  clientId: string;
  tagName: string;
  createdAt: Date;
  updatedAt: Date;
}

interface ClientLocation {
  _id: string;
  clientId: string;
  latitude: number;
  longitude: number;
  createdAt: Date;
  updatedAt: Date;
}

interface ClientInvoice {
  _id: string;
  clientId: string;
  invoiceNumber: string;
  amount: number;
  status: string;
  issueDate: string;
  dueDate: string;
  createdAt: Date;
  updatedAt: Date;
}

interface WorkspaceRecord {
  _id: string;
  nom: string;
  ownerId: string;
  description: string;
  logo: string;
  createdAt: string;
  updatedAt: string;
}

interface WorkspaceMemberRecord {
  _id: string;
  workspaceId: string;
  userId: string;
  role: string;
  equipe: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface TeamRecord {
  _id: string;
  workspaceId: string;
  nom: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

// Paths to JSON files
const DATA_DIR = path.join(process.cwd(), "data");
const USERS_FILE = path.join(DATA_DIR, "users.json");
const PORTFOLIOS_FILE = path.join(DATA_DIR, "portfolios.json");
const PORTFOLIO_PROJECTS_FILE = path.join(DATA_DIR, "portfolioProjects.json");
const AGENCY_PROJECTS_FILE = path.join(DATA_DIR, "agencyProjects.json");
const TASKS_FILE = path.join(DATA_DIR, "tasks.json");
const TEAM_FILE = path.join(DATA_DIR, "team.json");
const DOCUMENTS_FILE = path.join(DATA_DIR, "documents.json");
const SKILLS_FILE = path.join(DATA_DIR, "skills.json");
const EXPERIENCES_FILE = path.join(DATA_DIR, "experiences.json");
const TESTIMONIALS_FILE = path.join(DATA_DIR, "testimonials.json");
const PORTFOLIO_MESSAGES_FILE = path.join(DATA_DIR, "messages.json");
const TEAM_MESSAGES_FILE = path.join(DATA_DIR, "teamMessages.json");
const CLIENTS_FILE = path.join(DATA_DIR, "clients.json");
const EMAIL_TO_ID_FILE = path.join(DATA_DIR, "emailToId.json");
const SLUG_TO_ID_FILE = path.join(DATA_DIR, "slugToId.json");
const COUNTERS_FILE = path.join(DATA_DIR, "counters.json");
const SETTINGS_FILE = path.join(DATA_DIR, "settings.json");
const CLIENT_ACTIVITIES_FILE =
 path.join(DATA_DIR, "clientActivities.json");
const PROJECT_ACTIVITIES_FILE =
 path.join(DATA_DIR, "projectActivities.json");

const CLIENT_COMMENTS_FILE =
 path.join(DATA_DIR, "clientComments.json");

const CLIENT_DOCUMENTS_FILE =
 path.join(DATA_DIR, "clientDocuments.json");

const CLIENT_REMINDERS_FILE =
 path.join(DATA_DIR, "clientReminders.json");

const CLIENT_EMAILS_FILE =
 path.join(DATA_DIR, "clientEmails.json");

const CLIENT_TAGS_FILE =
 path.join(DATA_DIR, "clientTags.json");

const CLIENT_LOCATIONS_FILE =
 path.join(DATA_DIR, "clientLocations.json");

const CLIENT_INVOICES_FILE =
 path.join(DATA_DIR, "clientInvoices.json");

const WORKSPACES_FILE = path.join(DATA_DIR, "workspaces.json");
const WORKSPACE_MEMBERS_FILE = path.join(DATA_DIR, "workspaceMembers.json");
const TEAMS_FILE = path.join(DATA_DIR, "teams.json");
const ACTIVITIES_FILE = path.join(DATA_DIR, "activities.json");
const EVENTS_FILE = path.join(DATA_DIR, "events.json");
const NOTIFICATIONS_FILE = path.join(DATA_DIR, "notifications.json");
const COMMENTS_FILE = path.join(DATA_DIR, "comments.json");
const DISCUSSION_MESSAGES_FILE = path.join(DATA_DIR, "discussionMessages.json");
const ROLES_FILE = path.join(DATA_DIR, "roles.json");

// Helper to load data from JSON file
// In-memory cache so sync loadData sees writes made by async saveData
const memoryCache = new Map<string, any>();

// Preload cache from MongoDB when MONGODB_URI is available
if (process.env.MONGODB_URI) {
  (async () => {
    try {
      const { default: DataStore } = await import("@/models/DataStore");
      const { connectDB } = await import("@/lib/mongodb");
      await connectDB();
      const allDocs = await DataStore.find({}).lean();
      for (const doc of allDocs) {
        memoryCache.set(doc.key as string, doc.value);
      }
      console.log(`Preloaded ${allDocs.length} keys from MongoDB DataStore`);
    } catch (e) {
      console.error("DataStore preload failed (normal on first deploy):", e);
    }
  })();
}

export function loadData<T>(filePath: string, defaultValue: T): T {
  // Check in-memory cache first (has latest writes from saveData)
  if (memoryCache.has(filePath)) {
    return memoryCache.get(filePath) as T;
  }
  // Fall back to JSON file (bundled on Vercel, or local dev)
  if (!fs.existsSync(filePath)) {
    return defaultValue;
  }
  try {
    const data = fs.readFileSync(filePath, "utf8");
    const parsed = JSON.parse(data);
    memoryCache.set(filePath, parsed);
    return parsed;
  } catch (error) {
    console.error(`Error loading data from ${filePath}:`, error);
    return defaultValue;
  }
}

// Helper to save data — uses MongoDB on Vercel, falls back to JSON file
export async function saveData<T>(filePath: string, data: T) {
  // Always update in-memory cache so sync loadData sees latest writes immediately
  memoryCache.set(filePath, data);
  // When MONGODB_URI is available, also persist via MongoDB DataStore
  if (process.env.MONGODB_URI) {
    try {
      const { default: DataStore } = await import("@/models/DataStore");
      const { connectDB } = await import("@/lib/mongodb");
      await connectDB();
      await DataStore.findOneAndUpdate(
        { key: filePath },
        { key: filePath, value: JSON.parse(JSON.stringify(data)) },
        { upsert: true }
      );
    } catch (e) {
      console.error("MongoDB saveData failed:", e);
    }
  }
  // Local dev: write to JSON file
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error(`Error saving data to ${filePath}:`, error);
  }
}

// Initialize files if they don't exist
function initializeFiles() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(CLIENT_COMMENTS_FILE))
 saveData(CLIENT_COMMENTS_FILE, {});

if (!fs.existsSync(CLIENT_ACTIVITIES_FILE))
 saveData(CLIENT_ACTIVITIES_FILE, {});
if (!fs.existsSync(PROJECT_ACTIVITIES_FILE))
 saveData(PROJECT_ACTIVITIES_FILE, {});

if (!fs.existsSync(CLIENT_DOCUMENTS_FILE))
 saveData(CLIENT_DOCUMENTS_FILE, {});

if (!fs.existsSync(CLIENT_REMINDERS_FILE))
 saveData(CLIENT_REMINDERS_FILE, {});

if (!fs.existsSync(CLIENT_EMAILS_FILE))
 saveData(CLIENT_EMAILS_FILE, {});

if (!fs.existsSync(CLIENT_TAGS_FILE))
 saveData(CLIENT_TAGS_FILE, {});

if (!fs.existsSync(CLIENT_LOCATIONS_FILE))
 saveData(CLIENT_LOCATIONS_FILE, {});

if (!fs.existsSync(CLIENT_INVOICES_FILE))
 saveData(CLIENT_INVOICES_FILE, {});

  if (!fs.existsSync(USERS_FILE)) saveData(USERS_FILE, {});
  if (!fs.existsSync(SETTINGS_FILE)) saveData(SETTINGS_FILE, { nomAgence: "AgencyFlow", emailAgence: "", telephoneAgence: "", logo: "", theme: "light", couleur: "#7C3AED", notifEmail: true, notifRappels: true, notifEcheances: false, notifCommentaires: true });
  if (!fs.existsSync(PORTFOLIOS_FILE)) saveData(PORTFOLIOS_FILE, {});
  if (!fs.existsSync(PORTFOLIO_PROJECTS_FILE)) saveData(PORTFOLIO_PROJECTS_FILE, {});
  if (!fs.existsSync(AGENCY_PROJECTS_FILE)) saveData(AGENCY_PROJECTS_FILE, {});
  if (!fs.existsSync(TASKS_FILE)) saveData(TASKS_FILE, {});
  if (!fs.existsSync(TEAM_FILE)) saveData(TEAM_FILE, {});
  if (!fs.existsSync(WORKSPACES_FILE)) saveData(WORKSPACES_FILE, {});
  if (!fs.existsSync(WORKSPACE_MEMBERS_FILE)) saveData(WORKSPACE_MEMBERS_FILE, {});
  if (!fs.existsSync(TEAMS_FILE)) saveData(TEAMS_FILE, {});
  if (!fs.existsSync(ACTIVITIES_FILE)) saveData(ACTIVITIES_FILE, {});
  if (!fs.existsSync(EVENTS_FILE)) saveData(EVENTS_FILE, {});
  if (!fs.existsSync(NOTIFICATIONS_FILE)) saveData(NOTIFICATIONS_FILE, {});
  if (!fs.existsSync(COMMENTS_FILE)) saveData(COMMENTS_FILE, {});
  if (!fs.existsSync(DISCUSSION_MESSAGES_FILE)) saveData(DISCUSSION_MESSAGES_FILE, {});
  if (!fs.existsSync(ROLES_FILE)) saveData(ROLES_FILE, {});
  if (!fs.existsSync(DOCUMENTS_FILE)) saveData(DOCUMENTS_FILE, {});
  if (!fs.existsSync(SKILLS_FILE)) saveData(SKILLS_FILE, {});
  if (!fs.existsSync(EXPERIENCES_FILE)) saveData(EXPERIENCES_FILE, {});
  if (!fs.existsSync(TESTIMONIALS_FILE)) saveData(TESTIMONIALS_FILE, {});
  if (!fs.existsSync(PORTFOLIO_MESSAGES_FILE)) saveData(PORTFOLIO_MESSAGES_FILE, {});
  if (!fs.existsSync(TEAM_MESSAGES_FILE)) saveData(TEAM_MESSAGES_FILE, {});
  if (!fs.existsSync(CLIENTS_FILE)) saveData(CLIENTS_FILE, {});
  if (!fs.existsSync(EMAIL_TO_ID_FILE)) saveData(EMAIL_TO_ID_FILE, {});
  if (!fs.existsSync(SLUG_TO_ID_FILE)) saveData(SLUG_TO_ID_FILE, {});
  if (!fs.existsSync(COUNTERS_FILE)) {
    saveData(COUNTERS_FILE, {
      userId: 1,
      portfolioId: 1,
      portfolioProjectId: 1,
      agencyProjectId: 1,
      taskId: 1,
      teamId: 1,
      documentId: 1,
      skillId: 1,
      experienceId: 1,
      testimonialId: 1,
      messageId: 1,
      clientId: 1,
      invitationId: 1,
      workspaceId: 1,
      workspaceMemberId: 1,
      teamGroupId: 1,
      activityId: 1,
      eventId: 1,
      notificationId: 1,
      commentId: 1,
      discussionMessageId: 1,
      roleId: 1
    });
  }
}

if (!process.env.MONGODB_URI) { try { initializeFiles(); } catch {} }

// Helper functions to load/save data fresh each time
function getUsers() { return loadData<Record<string, User>>(USERS_FILE, {}); }
async function setUsers(data: Record<string, User>) { await saveData(USERS_FILE, data); }

function getPortfolios() { return loadData<Record<string, Portfolio>>(PORTFOLIOS_FILE, {}); }
async function setPortfolios(data: Record<string, Portfolio>) { await saveData(PORTFOLIOS_FILE, data); }

function getPortfolioProjects() { return loadData<Record<string, PortfolioProject>>(PORTFOLIO_PROJECTS_FILE, {}); }
async function setPortfolioProjects(data: Record<string, PortfolioProject>) { await saveData(PORTFOLIO_PROJECTS_FILE, data); }

function getAgencyProjects() { return loadData<Record<string, Project>>(AGENCY_PROJECTS_FILE, {}); }
async function setAgencyProjects(data: Record<string, Project>) { await saveData(AGENCY_PROJECTS_FILE, data); }

function getTasks() { return loadData<Record<string, Task>>(TASKS_FILE, {}); }
async function setTasks(data: Record<string, Task>) { await saveData(TASKS_FILE, data); }

function getTeam() { return loadData<Record<string, TeamUser>>(TEAM_FILE, {}); }
async function setTeam(data: Record<string, TeamUser>) { await saveData(TEAM_FILE, data); }

function getDocuments() { return loadData<Record<string, Document>>(DOCUMENTS_FILE, {}); }
async function setDocuments(data: Record<string, Document>) { await saveData(DOCUMENTS_FILE, data); }

function getSkills() { return loadData<Record<string, Skill>>(SKILLS_FILE, {}); }
async function setSkills(data: Record<string, Skill>) { await saveData(SKILLS_FILE, data); }

function getExperiences() { return loadData<Record<string, Experience>>(EXPERIENCES_FILE, {}); }
async function setExperiences(data: Record<string, Experience>) { await saveData(EXPERIENCES_FILE, data); }

function getTestimonials() { return loadData<Record<string, Testimonial>>(TESTIMONIALS_FILE, {}); }
async function setTestimonials(data: Record<string, Testimonial>) { await saveData(TESTIMONIALS_FILE, data); }

function getClients() { return loadData<Record<string, Client>>(CLIENTS_FILE, {}); }
async function setClients(data: Record<string, Client>) { await saveData(CLIENTS_FILE, data); }

function getEmailToId() { return loadData<Record<string, string>>(EMAIL_TO_ID_FILE, {}); }
async function setEmailToId(data: Record<string, string>) { await saveData(EMAIL_TO_ID_FILE, data); }

function getSlugToId() { return loadData<Record<string, string>>(SLUG_TO_ID_FILE, {}); }
async function setSlugToId(data: Record<string, string>) { await saveData(SLUG_TO_ID_FILE, data); }

function getPortfolioMessages() { return loadData<Record<string, Message>>(PORTFOLIO_MESSAGES_FILE, {}); }
async function setPortfolioMessages(data: Record<string, Message>) { await saveData(PORTFOLIO_MESSAGES_FILE, data); }

function getTeamMessages() { return loadData<Record<string, TeamMessage>>(TEAM_MESSAGES_FILE, {}); }
async function setTeamMessages(data: Record<string, TeamMessage>) { await saveData(TEAM_MESSAGES_FILE, data); }
function getClientComments() {
  return loadData<
    Record<string, ClientComment>
  >(CLIENT_COMMENTS_FILE, {});
}

async function setClientComments(
 data: Record<string, ClientComment>
) {
 await saveData(CLIENT_COMMENTS_FILE, data);
}

function getClientDocuments() {
  return loadData<Record<string, ClientDocument>>(CLIENT_DOCUMENTS_FILE, {});
}

async function setClientDocuments(data: Record<string, ClientDocument>) {
  await saveData(CLIENT_DOCUMENTS_FILE, data);
}

function getClientActivities() {
  return loadData<Record<string, ClientActivity>>(CLIENT_ACTIVITIES_FILE, {});
}

async function setClientActivities(data: Record<string, ClientActivity>) {
  await saveData(CLIENT_ACTIVITIES_FILE, data);
}
function getProjectActivities() {
  return loadData<Record<string, ProjectActivity>>(PROJECT_ACTIVITIES_FILE, {});
}
async function setProjectActivities(data: Record<string, ProjectActivity>) {
  await saveData(PROJECT_ACTIVITIES_FILE, data);
}

function getClientReminders() {
  return loadData<Record<string, ClientReminder>>(CLIENT_REMINDERS_FILE, {});
}

async function setClientReminders(data: Record<string, ClientReminder>) {
  await saveData(CLIENT_REMINDERS_FILE, data);
}

function getClientEmails() {
  return loadData<Record<string, ClientEmail>>(CLIENT_EMAILS_FILE, {});
}

async function setClientEmails(data: Record<string, ClientEmail>) {
  await saveData(CLIENT_EMAILS_FILE, data);
}

function getClientTags() {
  return loadData<Record<string, ClientTag>>(CLIENT_TAGS_FILE, {});
}

async function setClientTags(data: Record<string, ClientTag>) {
  await saveData(CLIENT_TAGS_FILE, data);
}

function getClientLocations() {
  return loadData<Record<string, ClientLocation>>(CLIENT_LOCATIONS_FILE, {});
}

async function setClientLocations(data: Record<string, ClientLocation>) {
  await saveData(CLIENT_LOCATIONS_FILE, data);
}

function getClientInvoices() {
  return loadData<Record<string, ClientInvoice>>(CLIENT_INVOICES_FILE, {});
}

async function setClientInvoices(data: Record<string, ClientInvoice>) {
  await saveData(CLIENT_INVOICES_FILE, data);
}

function getWorkspaces() { return loadData<Record<string, WorkspaceRecord>>(WORKSPACES_FILE, {}); }
async function setWorkspaces(data: Record<string, WorkspaceRecord>) { await saveData(WORKSPACES_FILE, data); }

function getWorkspaceMembers() { return loadData<Record<string, WorkspaceMemberRecord>>(WORKSPACE_MEMBERS_FILE, {}); }
async function setWorkspaceMembers(data: Record<string, WorkspaceMemberRecord>) { await saveData(WORKSPACE_MEMBERS_FILE, data); }

function getTeams() { return loadData<Record<string, TeamRecord>>(TEAMS_FILE, {}); }
async function setTeams(data: Record<string, TeamRecord>) { await saveData(TEAMS_FILE, data); }

function getCounters() { return loadData<Record<string, number>>(COUNTERS_FILE, {
  userId: 1,
  portfolioId: 1,
  portfolioProjectId: 1,
  agencyProjectId: 1,
  taskId: 1,
  teamId: 1,
  documentId: 1,
  skillId: 1,
  experienceId: 1,
  testimonialId: 1,
  portfolioMessageId: 1,
  teamMessageId: 1,
  clientId: 1,
  invitationId: 1,
  workspaceId: 1,
  workspaceMemberId: 1,
  teamGroupId: 1,
  activityId: 1,
  notificationId: 1,
  commentId: 1
}); }
async function setCounters(data: Record<string, number>) { await saveData(COUNTERS_FILE, data); }

// Generate a simple ObjectId-like string
function generateId(counterKey: string): string {
  const counters = getCounters();
  if (typeof counters[counterKey] !== 'number') {
    counters[counterKey] = 1;
  }
  const id = `mock-${counters[counterKey].toString().padStart(24, "0")}`;
  counters[counterKey]++;
  setCounters(counters);
  return id;
}

// User operations
export const MockUser = {
  findOne: async (query: { email?: string; _id?: string }) => {
    const users = getUsers();
    if (query._id) {
      return users[query._id] || null;
    }
    const emailToId = getEmailToId();
    if (query.email) {
      const lowerEmail = query.email.toLowerCase();
      const userId = emailToId[lowerEmail];
      if (userId && users[userId]) {
        return users[userId];
      }
    }
    return null;
  },

  findById: async (id: string) => {
    const users = getUsers();
    return users[id] || null;
  },

  create: async (userData: { name: string; nom?: string; prenom?: string; email: string; password: string; role: string; activeWorkspaceId?: string }) => {
    const _id = generateId("userId");
    const now = new Date();
    const user: User = {
      _id,
      name: userData.name,
      nom: userData.nom || "",
      prenom: userData.prenom || "",
      email: userData.email.toLowerCase(),
      password: userData.password,
      role: userData.role || "freelance",
      avatar: "",
      activeWorkspaceId: userData.activeWorkspaceId,
      createdAt: now,
      updatedAt: now,
    };
    const users = getUsers();
    const emailToId = getEmailToId();
    users[_id] = user;
    emailToId[user.email] = _id;
    await setUsers(users);
    await setEmailToId(emailToId);
    return user;
  },

  updateOne: async (query: { _id?: string; email?: string }, update: Record<string, any>) => {
    const users = getUsers();
    let user: User | null = null;
    if (query._id) {
      user = users[query._id] || null;
    } else if (query.email) {
      const emailToId = getEmailToId();
      const uid = emailToId[query.email.toLowerCase()];
      if (uid) user = users[uid] || null;
    }
    if (!user) return null;
    const now = new Date();
    for (const key of Object.keys(update)) {
      (user as any)[key] = update[key];
    }
    user.updatedAt = now;
    users[user._id] = user;
    await setUsers(users);
    return user;
  },
};

// Portfolio operations
export const MockPortfolio = {
  exists: async (query: { slug?: string }) => {
    const slugToId = getSlugToId();
    if (query.slug) {
      return !!slugToId[query.slug];
    }
    return false;
  },

  create: async (portfolioData: {
    userId: string;
    title: string;
    slug: string;
    bio: string;
    theme: string;
    primaryColor: string;
    isPublished: boolean;
    views: number;
  }) => {
    const _id = generateId("portfolioId");
    const now = new Date();
    const portfolio: Portfolio = {
      _id,
      ...portfolioData,
      createdAt: now,
      updatedAt: now,
    };
    const portfolios = getPortfolios();
    const slugToId = getSlugToId();
    portfolios[_id] = portfolio;
    slugToId[portfolio.slug] = _id;
    await setPortfolios(portfolios);
    await setSlugToId(slugToId);
    return portfolio;
  },

  findOne: async (query: { userId?: string; slug?: string }) => {
    const portfolios = getPortfolios();
    for (const portfolio of Object.values(portfolios)) {
      if (query.userId && portfolio.userId === query.userId) return portfolio;
      if (query.slug && portfolio.slug === query.slug) return portfolio;
    }
    return null;
  },

  findBySlug: async (slug: string) => {
    const slugToId = getSlugToId();
    const portfolios = getPortfolios();
    const id = slugToId[slug];
    return id ? portfolios[id] || null : null;
  },

  findById: async (id: string) => {
    const portfolios = getPortfolios();
    return portfolios[id] || null;
  },
};

// Portfolio Project operations
export const MockPortfolioProject = {
  find: async (query: { portfolioId?: string }) => {
    const portfolioProjects = getPortfolioProjects();
    const results: PortfolioProject[] = [];
    for (const project of Object.values(portfolioProjects)) {
      if (!query.portfolioId || project.portfolioId === query.portfolioId) {
        results.push(project);
      }
    }
    return results;
  },

  findById: async (id: string) => {
    const portfolioProjects = getPortfolioProjects();
    return portfolioProjects[id] || null;
  },

  create: async (projectData: {
    portfolioId: string;
    title: string;
    description: string;
    images?: string[];
    tags?: string[];
    liveUrl: string;
    githubUrl: string;
    isPublished: boolean;
    order: number;
  }) => {
    const _id = generateId("portfolioProjectId");
    const now = new Date();
    const project: PortfolioProject = {
      _id,
      portfolioId: projectData.portfolioId,
      title: projectData.title,
      description: projectData.description || "",
      images: Array.isArray(projectData.images) ? projectData.images : [],
      tags: Array.isArray(projectData.tags) ? projectData.tags : [],
      liveUrl: projectData.liveUrl || "",
      githubUrl: projectData.githubUrl || "",
      isPublished: projectData.isPublished || false,
      order: projectData.order || 0,
      createdAt: now,
      updatedAt: now,
    };
    const portfolioProjects = getPortfolioProjects();
    portfolioProjects[_id] = project;
    await setPortfolioProjects(portfolioProjects);
    return project;
  },

  findByIdAndUpdate: async (id: string, updateData: Partial<PortfolioProject>) => {
    const portfolioProjects = getPortfolioProjects();
    if (!portfolioProjects[id]) return null;
    portfolioProjects[id] = {
      ...portfolioProjects[id],
      ...updateData,
      images: Array.isArray(updateData.images) ? updateData.images : portfolioProjects[id].images,
      tags: Array.isArray(updateData.tags) ? updateData.tags : portfolioProjects[id].tags,
      updatedAt: new Date(),
    };
    await setPortfolioProjects(portfolioProjects);
    return portfolioProjects[id];
  },

  findByIdAndDelete: async (id: string) => {
    const portfolioProjects = getPortfolioProjects();
    if (!portfolioProjects[id]) return null;
    const deleted = portfolioProjects[id];
    delete portfolioProjects[id];
    await setPortfolioProjects(portfolioProjects);
    return deleted;
  },
};

// Skill operations
export const MockSkill = {
  find: async (query: { portfolioId?: string }) => {
    const skills = getSkills();
    const results: Skill[] = [];
    for (const skill of Object.values(skills)) {
      if (!query.portfolioId || skill.portfolioId === query.portfolioId) {
        results.push(skill);
      }
    }
    return results;
  },

  findById: async (id: string) => {
    const skills = getSkills();
    return skills[id] || null;
  },

  create: async (skillData: {
    portfolioId: string;
    name: string;
    category: string;
    level: number;
    icon: string;
  }) => {
    const _id = generateId("skillId");
    const now = new Date();
    const skill: Skill = {
      _id,
      ...skillData,
      createdAt: now,
      updatedAt: now,
    };
    const skills = getSkills();
    skills[_id] = skill;
    await setSkills(skills);
    return skill;
  },

  findByIdAndUpdate: async (id: string, updateData: Partial<Skill>) => {
    const skills = getSkills();
    if (!skills[id]) return null;
    skills[id] = {
      ...skills[id],
      ...updateData,
      updatedAt: new Date(),
    };
    await setSkills(skills);
    return skills[id];
  },

  findByIdAndDelete: async (id: string) => {
    const skills = getSkills();
    if (!skills[id]) return null;
    const deleted = skills[id];
    delete skills[id];
    await setSkills(skills);
    return deleted;
  },
};

// Experience operations
export const MockExperience = {
  find: async (query: { portfolioId?: string }) => {
    const experiences = getExperiences();
    const results: Experience[] = [];
    for (const exp of Object.values(experiences)) {
      if (!query.portfolioId || exp.portfolioId === query.portfolioId) {
        results.push(exp);
      }
    }
    return results;
  },

  findById: async (id: string) => {
    const experiences = getExperiences();
    return experiences[id] || null;
  },

  create: async (expData: {
    portfolioId: string;
    type: "work" | "education";
    title: string;
    company: string;
    startDate: string;
    endDate: string;
    current: boolean;
    description: string;
  }) => {
    const _id = generateId("experienceId");
    const now = new Date();
    const experience: Experience = {
      _id,
      ...expData,
      createdAt: now,
      updatedAt: now,
    };
    const experiences = getExperiences();
    experiences[_id] = experience;
    await setExperiences(experiences);
    return experience;
  },

  findByIdAndUpdate: async (id: string, updateData: Partial<Experience>) => {
    const experiences = getExperiences();
    if (!experiences[id]) return null;
    experiences[id] = {
      ...experiences[id],
      ...updateData,
      updatedAt: new Date(),
    };
    await setExperiences(experiences);
    return experiences[id];
  },

  findByIdAndDelete: async (id: string) => {
    const experiences = getExperiences();
    if (!experiences[id]) return null;
    const deleted = experiences[id];
    delete experiences[id];
    await setExperiences(experiences);
    return deleted;
  },
};

// Portfolio Message operations
export const MockMessage = {
  find: async (query: { portfolioId?: string }) => {
    const messages = getPortfolioMessages();
    const results: Message[] = [];
    for (const msg of Object.values(messages)) {
      if (!query.portfolioId || msg.portfolioId === query.portfolioId) {
        results.push(msg);
      }
    }
    return results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  findById: async (id: string) => {
    const messages = getPortfolioMessages();
    return messages[id] || null;
  },

  create: async (msgData: {
    portfolioId: string;
    senderName: string;
    senderEmail: string;
    subject: string;
    message: string;
    isRead: boolean;
  }) => {
    const _id = generateId("portfolioMessageId");
    const now = new Date();
    const message: Message = {
      _id,
      ...msgData,
      createdAt: now,
      updatedAt: now,
    };
    const messages = getPortfolioMessages();
    messages[_id] = message;
    await setPortfolioMessages(messages);
    return message;
  },

  findByIdAndUpdate: async (id: string, updateData: Partial<Message>) => {
    const messages = getPortfolioMessages();
    if (!messages[id]) return null;
    messages[id] = {
      ...messages[id],
      ...updateData,
      updatedAt: new Date(),
    };
    await setPortfolioMessages(messages);
    return messages[id];
  },

  findByIdAndDelete: async (id: string) => {
    const messages = getPortfolioMessages();
    if (!messages[id]) return null;
    const deleted = messages[id];
    delete messages[id];
    await setPortfolioMessages(messages);
    return deleted;
  },
};

// Team Message operations
export const MockTeamMessage = {
  find: async (filter: { with?: string }, userId: string) => {
    const messages = getTeamMessages();
    let results: TeamMessage[] = [];
    
    if (filter.with) {
      // Get conversation between userId and filter.with
      results = Object.values(messages).filter(msg => 
        (msg.expediteurId === userId && msg.destinataireId === filter.with) ||
        (msg.expediteurId === filter.with && msg.destinataireId === userId)
      ).sort((a, b) => new Date(a.dateEnvoi).getTime() - new Date(b.dateEnvoi).getTime());
    } else {
      // Get list of conversations (unique contacts)
      const conversationMap = new Map<string, TeamMessage>();
      for (const msg of Object.values(messages)) {
        if (msg.expediteurId === userId || msg.destinataireId === userId) {
          const otherUserId = msg.expediteurId === userId ? msg.destinataireId : msg.expediteurId;
          // Keep the most recent message for each conversation
          const existing = conversationMap.get(otherUserId);
          if (!existing || new Date(msg.dateEnvoi) > new Date(existing.dateEnvoi)) {
            conversationMap.set(otherUserId, msg);
          }
        }
      }
      results = Array.from(conversationMap.values()).sort((a, b) => 
        new Date(b.dateEnvoi).getTime() - new Date(a.dateEnvoi).getTime()
      );
    }

    // Populate expediteurId and destinataireId with user data
    const users = getTeam();
    return results.map(msg => ({
      ...msg,
      expediteurId: users[msg.expediteurId] ? {
        _id: users[msg.expediteurId]._id,
        nom: users[msg.expediteurId].nom,
        prenom: users[msg.expediteurId].prenom,
        photo: users[msg.expediteurId].avatar
      } : msg.expediteurId,
      destinataireId: users[msg.destinataireId] ? {
        _id: users[msg.destinataireId]._id,
        nom: users[msg.destinataireId].nom,
        prenom: users[msg.destinataireId].prenom,
        photo: users[msg.destinataireId].avatar
      } : msg.destinataireId
    }));
  },

  create: async (msgData: {
    expediteurId: string;
    destinataireId: string;
    contenu: string;
  }) => {
    const _id = generateId("teamMessageId");
    const now = new Date();
    const message: TeamMessage = {
      _id,
      expediteurId: msgData.expediteurId,
      destinataireId: msgData.destinataireId,
      contenu: msgData.contenu,
      dateEnvoi: now,
      lu: false,
      createdAt: now,
      updatedAt: now
    };
    
    const messages = getTeamMessages();
    messages[_id] = message;
    await setTeamMessages(messages);

    // Populate and return
    const users = getTeam();
    return {
      ...message,
      expediteurId: users[msgData.expediteurId] ? {
        _id: users[msgData.expediteurId]._id,
        nom: users[msgData.expediteurId].nom,
        prenom: users[msgData.expediteurId].prenom,
        photo: users[msgData.expediteurId].avatar
      } : msgData.expediteurId,
      destinataireId: users[msgData.destinataireId] ? {
        _id: users[msgData.destinataireId]._id,
        nom: users[msgData.destinataireId].nom,
        prenom: users[msgData.destinataireId].prenom,
        photo: users[msgData.destinataireId].avatar
      } : msgData.destinataireId
    };
  },

  markAsRead: async (messageIds: string[], userId: string) => {
    const messages = getTeamMessages();
    for (const id of messageIds) {
      if (messages[id] && messages[id].destinataireId === userId) {
        messages[id].lu = true;
        messages[id].updatedAt = new Date();
      }
    }
    await setTeamMessages(messages);
  }
};

// Testimonial operations
export const MockTestimonial = {
  find: async (query: { portfolioId?: string; isApproved?: boolean }) => {
    const testimonials = getTestimonials();
    const results: Testimonial[] = [];
    for (const t of Object.values(testimonials)) {
      if (query.portfolioId && t.portfolioId !== query.portfolioId) continue;
      if (query.isApproved !== undefined && t.isApproved !== query.isApproved) continue;
      results.push(t);
    }
    return results;
  },

  create: async (data: {
    portfolioId: string;
    authorName: string;
    authorJob?: string;
    authorAvatar?: string;
    content: string;
    rating?: number;
    isApproved?: boolean;
  }) => {
    const _id = generateId("testimonialId");
    const now = new Date();
    const t: Testimonial = {
      _id,
      portfolioId: data.portfolioId,
      authorName: data.authorName,
      authorJob: data.authorJob || "",
      authorAvatar: data.authorAvatar || "",
      content: data.content,
      rating: data.rating ?? 5,
      isApproved: data.isApproved ?? false,
      createdAt: now,
      updatedAt: now,
    };
    const testimonials = getTestimonials();
    testimonials[_id] = t;
    await setTestimonials(testimonials);
    return t;
  },
};

// Client operations
export const MockClient = {
  find: async (workspaceId?: string) => {
    const clients = getClients();
    const all = Object.values(clients);
    const filtered = workspaceId ? all.filter(c => !c.workspaceId || c.workspaceId === workspaceId) : all;
    return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  findById: async (id: string) => {
    const clients = getClients();
    return clients[id] || null;
  },

  create: async (clientData: {
    nomSociete: string;
    responsable: string;
    email: string;
    telephone?: string;
    adresse?: string;
    secteurActivite?: string;
    budget?: number;
    workspaceId: string;
  }) => {
    const _id = generateId("clientId");
    const now = new Date();
    const client: Client = {
      _id,
      nomSociete: clientData.nomSociete,
      responsable: clientData.responsable,
      email: clientData.email.toLowerCase(),
      telephone: clientData.telephone || "",
      adresse: clientData.adresse || "",
      secteurActivite: clientData.secteurActivite || "",
      budget: clientData.budget,
      dateCreation: now,
      workspaceId: clientData.workspaceId,
      createdAt: now,
      updatedAt: now,
    };
    const clients = getClients();
    clients[_id] = client;
    await setClients(clients);
    return client;
  },

  findByIdAndUpdate: async (id: string, updateData: Partial<Client>) => {
    const clients = getClients();
    if (!clients[id]) return null;
    clients[id] = {
      ...clients[id],
      ...updateData,
      updatedAt: new Date(),
    };
    await setClients(clients);
    return clients[id];
  },

  findByIdAndDelete: async (id: string) => {
    const clients = getClients();
    if (!clients[id]) return null;
    const deleted = clients[id];
    delete clients[id];
    await setClients(clients);
    return deleted;
  },
};

// Agency Project operations
export const MockProject = {
  find: async (workspaceId?: string) => {
    const agencyProjects = getAgencyProjects();
    const clients = getClients();
    const all = Object.values(agencyProjects);
    const filtered = workspaceId ? all.filter(p => !p.workspaceId || p.workspaceId === workspaceId) : all;
    const sorted = filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return sorted.map(p => ({
      ...p,
      clientId: clients[p.clientId] || null,
    }));
  },

  findById: async (id: string) => {
    const agencyProjects = getAgencyProjects();
    const clients = getClients();
    if (!agencyProjects[id]) return null;
    return {
      ...agencyProjects[id],
      clientId: clients[agencyProjects[id].clientId] || null,
    };
  },

  create: async (projectData: {
    titre: string;
    description?: string;
    dateDebut?: string;
    dateFin?: string;
    budget: number;
    statut: string;
    priorite: string;
    clientId: string;
    chefProjet?: string;
    workspaceId: string;
  }) => {
    const _id = generateId("agencyProjectId");
    const now = new Date();
    const project: Project = {
      _id,
      titre: projectData.titre,
      description: projectData.description || "",
      dateDebut: projectData.dateDebut ? new Date(projectData.dateDebut) : undefined,
      dateFin: projectData.dateFin ? new Date(projectData.dateFin) : undefined,
      budget: projectData.budget,
      statut: projectData.statut,
      priorite: projectData.priorite,
      clientId: projectData.clientId,
      chefProjet: projectData.chefProjet,
      workspaceId: projectData.workspaceId,
      createdAt: now,
      updatedAt: now,
    };
    const agencyProjects = getAgencyProjects();
    const clients = getClients();
    agencyProjects[_id] = project;
    await setAgencyProjects(agencyProjects);
    return {
      ...project,
      clientId: clients[project.clientId] || null,
    };
  },

  findByIdAndUpdate: async (id: string, updateData: Partial<Project>) => {
    const agencyProjects = getAgencyProjects();
    const clients = getClients();
    if (!agencyProjects[id]) return null;
    agencyProjects[id] = {
      ...agencyProjects[id],
      ...updateData,
      updatedAt: new Date(),
    };
    await setAgencyProjects(agencyProjects);
    return {
      ...agencyProjects[id],
      clientId: clients[agencyProjects[id].clientId] || null,
    };
  },

  findByIdAndDelete: async (id: string) => {
    const agencyProjects = getAgencyProjects();
    if (!agencyProjects[id]) return null;
    const deleted = agencyProjects[id];
    delete agencyProjects[id];
    await setAgencyProjects(agencyProjects);
    return deleted;
  },

  countByClient: async (workspaceId: string) => {
    const agencyProjects = getAgencyProjects();
    const all = Object.values(agencyProjects);
    const filtered = workspaceId ? all.filter((p: any) => !p.workspaceId || p.workspaceId === workspaceId) : all;
    const stats: Record<string, { count: number; totalBudget: number }> = {};
    for (const p of filtered) {
      const cid = (p as any).clientId;
      if (!cid) continue;
      if (!stats[cid]) stats[cid] = { count: 0, totalBudget: 0 };
      stats[cid].count++;
      stats[cid].totalBudget += (p as any).budget || 0;
    }
    return stats;
  },
};

// Task operations
export const MockTask = {
  find: async (filter: { projetId?: string, workspaceId?: string } = {}) => {
    const tasks = getTasks();
    const agencyProjects = getAgencyProjects();
    const team = getTeam();
    let allTasks = Object.values(tasks).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    if (filter.projetId) {
      allTasks = allTasks.filter(t => t.projetId === filter.projetId);
    }
    if (filter.workspaceId) {
      allTasks = allTasks.filter(t => !t.workspaceId || t.workspaceId === filter.workspaceId);
    }
    return allTasks.map(t => ({
      ...t,
      projetId: agencyProjects[t.projetId] ? { _id: agencyProjects[t.projetId]._id, titre: agencyProjects[t.projetId].titre } : null,
      employeId: t.employeId && team[t.employeId] ? { _id: team[t.employeId]._id, nom: team[t.employeId].nom, prenom: team[t.employeId].prenom } : null,
    }));
  },

  findById: async (id: string) => {
    const tasks = getTasks();
    const agencyProjects = getAgencyProjects();
    const team = getTeam();
    if (!tasks[id]) return null;
    return {
      ...tasks[id],
      projetId: agencyProjects[tasks[id].projetId] ? { _id: agencyProjects[tasks[id].projetId]._id, titre: agencyProjects[tasks[id].projetId].titre } : null,
      employeId: tasks[id].employeId && team[tasks[id].employeId] ? { _id: team[tasks[id].employeId]._id, nom: team[tasks[id].employeId].nom, prenom: team[tasks[id].employeId].prenom } : null,
    };
  },

  create: async (taskData: {
    titre: string;
    description: string;
    statut: string;
    priorite: string;
    dateDebut?: string;
    dateFin?: string;
    projetId: string;
    employeId?: string;
    workspaceId: string;
  }) => {
    const _id = generateId("taskId");
    const now = new Date();
    const task: Task = {
      _id,
      titre: taskData.titre,
      description: taskData.description || "",
      statut: taskData.statut,
      priorite: taskData.priorite,
      dateDebut: taskData.dateDebut,
      dateFin: taskData.dateFin,
      projetId: taskData.projetId,
      employeId: taskData.employeId,
      workspaceId: taskData.workspaceId,
      createdAt: now,
      updatedAt: now,
    };
    const tasks = getTasks();
    const agencyProjects = getAgencyProjects();
    const team = getTeam();
    tasks[_id] = task;
    await setTasks(tasks);
    return {
      ...task,
      projetId: agencyProjects[task.projetId] ? { _id: agencyProjects[task.projetId]._id, titre: agencyProjects[task.projetId].titre } : null,
      employeId: task.employeId && team[task.employeId] ? { _id: team[task.employeId]._id, nom: team[task.employeId].nom, prenom: team[task.employeId].prenom } : null,
    };
  },

  findByIdAndUpdate: async (id: string, updateData: Partial<Task>) => {
    const tasks = getTasks();
    const agencyProjects = getAgencyProjects();
    const team = getTeam();
    if (!tasks[id]) return null;
    tasks[id] = {
      ...tasks[id],
      ...updateData,
      updatedAt: new Date(),
    };
    await setTasks(tasks);
    return {
      ...tasks[id],
      projetId: agencyProjects[tasks[id].projetId] ? { _id: agencyProjects[tasks[id].projetId]._id, titre: agencyProjects[tasks[id].projetId].titre } : null,
      employeId: tasks[id].employeId && team[tasks[id].employeId] ? { _id: team[tasks[id].employeId]._id, nom: team[tasks[id].employeId].nom, prenom: team[tasks[id].employeId].prenom } : null,
    };
  },

  findByIdAndDelete: async (id: string) => {
    const tasks = getTasks();
    if (!tasks[id]) return null;
    const deleted = tasks[id];
    delete tasks[id];
    await setTasks(tasks);
    return deleted;
  },
};

// Team operations
export const MockTeam = {
  find: async (filter?: { userId?: string; workspaceId?: string }) => {
    const team = getTeam();
    let all = Object.values(team);
    if (filter?.userId) {
      all = all.filter(t => !t.userId || t.userId === filter.userId);
    }
    if (filter?.workspaceId) {
      all = all.filter(t => t.workspaceId === filter.workspaceId);
    }
    return all.map(t => ({
      ...t,
      photo: t.avatar || undefined,
    })).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  findById: async (id: string) => {
    const team = getTeam();
    const user = team[id] || null;
    if (!user) return null;
    return {
      ...user,
      photo: user.avatar || undefined,
    };
  },

  create: async (teamData: {
    nom: string;
    prenom: string;
    email: string;
    password: string;
    role: string;
    telephone?: string;
    avatar?: string;
    photo?: string;
    dateEmbauche?: string;
    userId?: string;
    workspaceId?: string;
  }) => {
    const _id = generateId("teamId");
    const now = new Date();
    const teamUser: TeamUser = {
      _id,
      nom: teamData.nom,
      prenom: teamData.prenom,
      email: teamData.email.toLowerCase(),
      password: teamData.password,
      role: teamData.role,
      telephone: teamData.telephone,
      avatar: teamData.avatar || teamData.photo,
      dateEmbauche: teamData.dateEmbauche,
      userId: teamData.userId,
      workspaceId: teamData.workspaceId,
      createdAt: now,
      updatedAt: now,
    };
    const team = getTeam();
    team[_id] = teamUser;
    await setTeam(team);
    return {
      ...teamUser,
      photo: teamUser.avatar,
    };
  },

  findByIdAndUpdate: async (id: string, updateData: Partial<TeamUser> & { photo?: string }) => {
    const team = getTeam();
    if (!team[id]) return null;
    const update: Partial<TeamUser> & { photo?: string } = { ...updateData };
    if (updateData.photo) {
      update.avatar = updateData.photo;
      delete update.photo;
    }
    team[id] = {
      ...team[id],
      ...update,
      updatedAt: new Date(),
    };
    await setTeam(team);
    return {
      ...team[id],
      photo: team[id].avatar,
    };
  },

  findByIdAndDelete: async (id: string) => {
    const team = getTeam();
    if (!team[id]) return null;
    const deleted = team[id];
    delete team[id];
    await setTeam(team);
    return deleted;
  },
};

// Document operations
export const MockDocument = {
  find: async (workspaceId?: string) => {
    const documents = getDocuments();
    const agencyProjects = getAgencyProjects();
    const team = getTeam();
    const all = Object.values(documents);
    const filtered = workspaceId ? all.filter(d => !d.workspaceId || d.workspaceId === workspaceId) : all;
    return filtered.map(doc => ({
      ...doc,
      projectId: agencyProjects[doc.projectId] ? { _id: agencyProjects[doc.projectId]._id, titre: agencyProjects[doc.projectId].titre } : null,
      uploadedBy: team[doc.uploadedBy] ? { _id: team[doc.uploadedBy]._id, nom: team[doc.uploadedBy].nom, prenom: team[doc.uploadedBy].prenom } : null,
    })).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  findById: async (id: string) => {
    const documents = getDocuments();
    const agencyProjects = getAgencyProjects();
    const team = getTeam();
    if (!documents[id]) return null;
    return {
      ...documents[id],
      projectId: agencyProjects[documents[id].projectId] ? { _id: agencyProjects[documents[id].projectId]._id, titre: agencyProjects[documents[id].projectId].titre } : null,
      uploadedBy: team[documents[id].uploadedBy] ? { _id: team[documents[id].uploadedBy]._id, nom: team[documents[id].uploadedBy].nom, prenom: team[documents[id].uploadedBy].prenom } : null,
    };
  },

  create: async (docData: {
    nomDocument: string;
    type: string;
    description?: string;
    url: string;
    projectId: string;
    uploadedBy: string;
    workspaceId: string;
  }) => {
    const _id = generateId("documentId");
    const now = new Date();
    const document: Document = {
      _id,
      nomDocument: docData.nomDocument,
      type: docData.type,
      description: docData.description || "",
      url: docData.url,
      dateUpload: new Date().toISOString().split('T')[0],
      projectId: docData.projectId,
      uploadedBy: docData.uploadedBy,
      workspaceId: docData.workspaceId,
      createdAt: now,
      updatedAt: now,
    };
    const documents = getDocuments();
    const agencyProjects = getAgencyProjects();
    const team = getTeam();
    documents[_id] = document;
    await setDocuments(documents);
    return {
      ...document,
      projectId: agencyProjects[document.projectId] ? { _id: agencyProjects[document.projectId]._id, titre: agencyProjects[document.projectId].titre } : null,
      uploadedBy: team[document.uploadedBy] ? { _id: team[document.uploadedBy]._id, nom: team[document.uploadedBy].nom, prenom: team[document.uploadedBy].prenom } : null,
    };
  },

  findByIdAndDelete: async (id: string) => {
    const documents = getDocuments();
    if (!documents[id]) return null;
    const deleted = documents[id];
    delete documents[id];
    await setDocuments(documents);
    return deleted;
  },
};

// Client Activity operations
export const MockClientActivity = {
  find: async (query: { clientId?: string }) => {
    const items = getClientActivities();
    const results: ClientActivity[] = [];
    for (const item of Object.values(items)) {
      if (!query.clientId || item.clientId === query.clientId) {
        results.push(item);
      }
    }
    return results;
  },

  findById: async (id: string) => {
    const items = getClientActivities();
    return items[id] || null;
  },

  create: async (data: {
    clientId: string;
    userId: string;
    userName: string;
    userEmail: string;
    action: string;
    description: string;
  }) => {
    const _id = generateId("clientActivityId");
    const now = new Date();
    const item: ClientActivity = {
      _id,
      clientId: data.clientId,
      userId: data.userId,
      userName: data.userName,
      userEmail: data.userEmail,
      action: data.action,
      description: data.description,
      createdAt: now,
      updatedAt: now,
    };
    const items = getClientActivities();
    items[_id] = item;
    await setClientActivities(items);
    return item;
  },

  findByIdAndUpdate: async (id: string, updateData: Partial<ClientActivity>) => {
    const items = getClientActivities();
    if (!items[id]) return null;
    items[id] = {
      ...items[id],
      ...updateData,
      updatedAt: new Date(),
    };
    await setClientActivities(items);
    return items[id];
  },

  findByIdAndDelete: async (id: string) => {
    const items = getClientActivities();
    if (!items[id]) return null;
    const deleted = items[id];
    delete items[id];
    await setClientActivities(items);
    return deleted;
  },
};

// Project Activity operations
export const MockProjectActivity = {
  find: async (query: { projectId?: string }) => {
    const items = getProjectActivities();
    const results: ProjectActivity[] = [];
    for (const item of Object.values(items)) {
      if (!query.projectId || item.projectId === query.projectId) {
        results.push(item);
      }
    }
    return results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  create: async (data: {
    projectId: string;
    userId: string;
    userName: string;
    userEmail: string;
    action: string;
    description: string;
  }) => {
    const _id = generateId("projectActivityId");
    const now = new Date();
    const item: ProjectActivity = {
      _id,
      projectId: data.projectId,
      userId: data.userId,
      userName: data.userName,
      userEmail: data.userEmail,
      action: data.action,
      description: data.description,
      createdAt: now,
      updatedAt: now,
    };
    const items = getProjectActivities();
    items[_id] = item;
    await setProjectActivities(items);
    return item;
  },

  findByIdAndDelete: async (id: string) => {
    const items = getProjectActivities();
    if (!items[id]) return null;
    const deleted = items[id];
    delete items[id];
    await setProjectActivities(items);
    return deleted;
  },
};

// Client Comment operations
export const MockClientComment = {
  find: async (query: { clientId?: string }) => {
    const items = getClientComments();
    const results: ClientComment[] = [];
    for (const item of Object.values(items)) {
      if (!query.clientId || item.clientId === query.clientId) {
        results.push(item);
      }
    }
    return results;
  },

  findById: async (id: string) => {
    const items = getClientComments();
    return items[id] || null;
  },

  create: async (data: {
    clientId: string;
    userId: string;
    userName: string;
    userEmail: string;
    comment: string;
    workspaceId: string;
  }) => {
    const _id = generateId("clientCommentId");
    const now = new Date();
    const item: ClientComment = {
      _id,
      clientId: data.clientId,
      userId: data.userId,
      userName: data.userName,
      userEmail: data.userEmail,
      comment: data.comment,
      workspaceId: data.workspaceId,
      createdAt: now,
      updatedAt: now,
    };
    const items = getClientComments();
    items[_id] = item;
    await setClientComments(items);
    return item;
  },

  findByIdAndUpdate: async (id: string, updateData: Partial<ClientComment>) => {
    const items = getClientComments();
    if (!items[id]) return null;
    items[id] = {
      ...items[id],
      ...updateData,
      updatedAt: new Date(),
    };
    await setClientComments(items);
    return items[id];
  },

  findByIdAndDelete: async (id: string) => {
    const items = getClientComments();
    if (!items[id]) return null;
    const deleted = items[id];
    delete items[id];
    await setClientComments(items);
    return deleted;
  },
};

// Client Document operations
export const MockClientDocument = {
  find: async (query: { clientId?: string }) => {
    const items = getClientDocuments();
    const results: ClientDocument[] = [];
    for (const item of Object.values(items)) {
      if (!query.clientId || item.clientId === query.clientId) {
        results.push(item);
      }
    }
    return results;
  },

  findById: async (id: string) => {
    const items = getClientDocuments();
    return items[id] || null;
  },

  create: async (data: {
    clientId: string;
    documentName: string;
    documentType: string;
    fileUrl: string;
    fileSize: number;
    uploadedBy: string;
    uploadedByName: string;
    uploadedByEmail: string;
  }) => {
    const _id = generateId("clientDocumentId");
    const now = new Date();
    const item: ClientDocument = {
      _id,
      clientId: data.clientId,
      documentName: data.documentName,
      documentType: data.documentType,
      fileUrl: data.fileUrl,
      fileSize: data.fileSize,
      uploadedBy: data.uploadedBy,
      uploadedByName: data.uploadedByName,
      uploadedByEmail: data.uploadedByEmail,
      createdAt: now,
      updatedAt: now,
    };
    const items = getClientDocuments();
    items[_id] = item;
    await setClientDocuments(items);
    return item;
  },

  findByIdAndUpdate: async (id: string, updateData: Partial<ClientDocument>) => {
    const items = getClientDocuments();
    if (!items[id]) return null;
    items[id] = {
      ...items[id],
      ...updateData,
      updatedAt: new Date(),
    };
    await setClientDocuments(items);
    return items[id];
  },

  findByIdAndDelete: async (id: string) => {
    const items = getClientDocuments();
    if (!items[id]) return null;
    const deleted = items[id];
    delete items[id];
    await setClientDocuments(items);
    return deleted;
  },
};

// Client Reminder operations
export const MockClientReminder = {
  find: async (query: { clientId?: string }) => {
    const items = getClientReminders();
    const results: ClientReminder[] = [];
    for (const item of Object.values(items)) {
      if (!query.clientId || item.clientId === query.clientId) {
        results.push(item);
      }
    }
    return results;
  },

  findById: async (id: string) => {
    const items = getClientReminders();
    return items[id] || null;
  },

  create: async (data: {
    clientId: string;
    title: string;
    description: string;
    reminderDate: string;
    priority: string;
    status: string;
    createdBy?: string;
    createdByName?: string;
    createdByEmail?: string;
  }) => {
    const _id = generateId("clientReminderId");
    const now = new Date();
    const item: ClientReminder = {
      _id,
      clientId: data.clientId,
      title: data.title,
      description: data.description,
      reminderDate: data.reminderDate,
      priority: data.priority,
      status: data.status,
      createdBy: data.createdBy,
      createdByName: data.createdByName,
      createdByEmail: data.createdByEmail,
      createdAt: now,
      updatedAt: now,
    };
    const items = getClientReminders();
    items[_id] = item;
    await setClientReminders(items);
    return item;
  },

  findByIdAndUpdate: async (id: string, updateData: Partial<ClientReminder>) => {
    const items = getClientReminders();
    if (!items[id]) return null;
    items[id] = {
      ...items[id],
      ...updateData,
      updatedAt: new Date(),
    };
    await setClientReminders(items);
    return items[id];
  },

  findByIdAndDelete: async (id: string) => {
    const items = getClientReminders();
    if (!items[id]) return null;
    const deleted = items[id];
    delete items[id];
    await setClientReminders(items);
    return deleted;
  },
};

// Client Email operations
export const MockClientEmail = {
  find: async (query: { clientId?: string }) => {
    const items = getClientEmails();
    const results: ClientEmail[] = [];
    for (const item of Object.values(items)) {
      if (!query.clientId || item.clientId === query.clientId) {
        results.push(item);
      }
    }
    return results;
  },

  findById: async (id: string) => {
    const items = getClientEmails();
    return items[id] || null;
  },

  create: async (data: {
    clientId: string;
    senderEmail: string;
    receiverEmail: string;
    subject: string;
    message: string;
    status: string;
    attachmentUrl?: string;
    attachmentName?: string;
    sentBy?: string;
    sentByName?: string;
    sentByEmail?: string;
  }) => {
    const _id = generateId("clientEmailId");
    const now = new Date();
    const item: ClientEmail = {
      _id,
      clientId: data.clientId,
      senderEmail: data.senderEmail,
      receiverEmail: data.receiverEmail,
      subject: data.subject,
      message: data.message,
      status: data.status,
      attachmentUrl: data.attachmentUrl,
      attachmentName: data.attachmentName,
      sentBy: data.sentBy || "",
      sentByName: data.sentByName || "",
      sentByEmail: data.sentByEmail || "",
      createdAt: now,
      updatedAt: now,
    };
    const items = getClientEmails();
    items[_id] = item;
    await setClientEmails(items);
    return item;
  },

  findByIdAndUpdate: async (id: string, updateData: Partial<ClientEmail>) => {
    const items = getClientEmails();
    if (!items[id]) return null;
    items[id] = {
      ...items[id],
      ...updateData,
      updatedAt: new Date(),
    };
    await setClientEmails(items);
    return items[id];
  },

  findByIdAndDelete: async (id: string) => {
    const items = getClientEmails();
    if (!items[id]) return null;
    const deleted = items[id];
    delete items[id];
    await setClientEmails(items);
    return deleted;
  },
};

// Client Tag operations
export const MockClientTag = {
  find: async (query: { clientId?: string }) => {
    const items = getClientTags();
    const results: ClientTag[] = [];
    for (const item of Object.values(items)) {
      if (!query.clientId || item.clientId === query.clientId) {
        results.push(item);
      }
    }
    return results;
  },

  findById: async (id: string) => {
    const items = getClientTags();
    return items[id] || null;
  },

  create: async (data: {
    clientId: string;
    tagName: string;
  }) => {
    const _id = generateId("clientTagId");
    const now = new Date();
    const item: ClientTag = {
      _id,
      clientId: data.clientId,
      tagName: data.tagName,
      createdAt: now,
      updatedAt: now,
    };
    const items = getClientTags();
    items[_id] = item;
    await setClientTags(items);
    return item;
  },

  findByIdAndUpdate: async (id: string, updateData: Partial<ClientTag>) => {
    const items = getClientTags();
    if (!items[id]) return null;
    items[id] = {
      ...items[id],
      ...updateData,
      updatedAt: new Date(),
    };
    await setClientTags(items);
    return items[id];
  },

  findByIdAndDelete: async (id: string) => {
    const items = getClientTags();
    if (!items[id]) return null;
    const deleted = items[id];
    delete items[id];
    await setClientTags(items);
    return deleted;
  },
};

// Client Location operations
export const MockClientLocation = {
  find: async (query: { clientId?: string }) => {
    const items = getClientLocations();
    const results: ClientLocation[] = [];
    for (const item of Object.values(items)) {
      if (!query.clientId || item.clientId === query.clientId) {
        results.push(item);
      }
    }
    return results;
  },

  findById: async (id: string) => {
    const items = getClientLocations();
    return items[id] || null;
  },

  create: async (data: {
    clientId: string;
    latitude: number;
    longitude: number;
  }) => {
    const _id = generateId("clientLocationId");
    const now = new Date();
    const item: ClientLocation = {
      _id,
      clientId: data.clientId,
      latitude: data.latitude,
      longitude: data.longitude,
      createdAt: now,
      updatedAt: now,
    };
    const items = getClientLocations();
    items[_id] = item;
    await setClientLocations(items);
    return item;
  },

  findByIdAndUpdate: async (id: string, updateData: Partial<ClientLocation>) => {
    const items = getClientLocations();
    if (!items[id]) return null;
    items[id] = {
      ...items[id],
      ...updateData,
      updatedAt: new Date(),
    };
    await setClientLocations(items);
    return items[id];
  },

  findByIdAndDelete: async (id: string) => {
    const items = getClientLocations();
    if (!items[id]) return null;
    const deleted = items[id];
    delete items[id];
    await setClientLocations(items);
    return deleted;
  },
};

// Client Invoice operations
export const MockClientInvoice = {
  find: async (query: { clientId?: string }) => {
    const items = getClientInvoices();
    const results: ClientInvoice[] = [];
    for (const item of Object.values(items)) {
      if (!query.clientId || item.clientId === query.clientId) {
        results.push(item);
      }
    }
    return results;
  },

  findById: async (id: string) => {
    const items = getClientInvoices();
    return items[id] || null;
  },

  create: async (data: {
    clientId: string;
    invoiceNumber: string;
    amount: number;
    status: string;
    issueDate: string;
    dueDate: string;
  }) => {
    const _id = generateId("clientInvoiceId");
    const now = new Date();
    const item: ClientInvoice = {
      _id,
      clientId: data.clientId,
      invoiceNumber: data.invoiceNumber,
      amount: data.amount,
      status: data.status,
      issueDate: data.issueDate,
      dueDate: data.dueDate,
      createdAt: now,
      updatedAt: now,
    };
    const items = getClientInvoices();
    items[_id] = item;
    await setClientInvoices(items);
    return item;
  },

  findByIdAndUpdate: async (id: string, updateData: Partial<ClientInvoice>) => {
    const items = getClientInvoices();
    if (!items[id]) return null;
    items[id] = {
      ...items[id],
      ...updateData,
      updatedAt: new Date(),
    };
    await setClientInvoices(items);
    return items[id];
  },

  findByIdAndDelete: async (id: string) => {
    const items = getClientInvoices();
    if (!items[id]) return null;
    const deleted = items[id];
    delete items[id];
    await setClientInvoices(items);
    return deleted;
  },
};

// Workspace operations
export const MockWorkspace = {
  create: async (data: { nom: string; ownerId: string; description?: string; logo?: string; _id?: string }) => {
    const _id = data._id || generateId("workspaceId");
    const now = new Date().toISOString();
    const ws: WorkspaceRecord = {
      _id, nom: data.nom, ownerId: data.ownerId,
      description: data.description || "", logo: data.logo || "",
      createdAt: now, updatedAt: now,
    };
    const workspaces = getWorkspaces();
    workspaces[_id] = ws;
    await setWorkspaces(workspaces);
    return ws;
  },
  findOne: async (query: { _id?: string }) => {
    const workspaces = getWorkspaces();
    if (query._id) return workspaces[query._id] || null;
    return null;
  },
  findByOwner: async (ownerId: string) => {
    const workspaces = getWorkspaces();
    return Object.values(workspaces).filter((w: any) => w.ownerId === ownerId);
  },
};

// Workspace Member operations
export const MockWorkspaceMember = {
  create: async (data: { workspaceId: string; userId: string; role: string; equipe?: string; status?: string }) => {
    const _id = generateId("workspaceMemberId");
    const now = new Date().toISOString();
    const member: WorkspaceMemberRecord = {
      _id, workspaceId: data.workspaceId, userId: data.userId,
      role: data.role, equipe: data.equipe || "", status: data.status || "Actif",
      createdAt: now, updatedAt: now,
    };
    const members = getWorkspaceMembers();
    members[_id] = member;
    await setWorkspaceMembers(members);
    return member;
  },
  find: async (query: { workspaceId?: string; userId?: string }) => {
    const members = getWorkspaceMembers();
    return Object.values(members).filter((m: any) => {
      if (query.workspaceId && m.workspaceId !== query.workspaceId) return false;
      if (query.userId && m.userId !== query.userId) return false;
      return true;
    });
  },
  findOne: async (query: { workspaceId?: string; userId?: string }) => {
    const members = getWorkspaceMembers();
    for (const m of Object.values(members)) {
      if (query.workspaceId && m.workspaceId !== query.workspaceId) continue;
      if (query.userId && m.userId !== query.userId) continue;
      return m;
    }
    return null;
  },
};

// Helper to check if we should use mock DB
export const useMockDB = !process.env.MONGODB_URI || process.env.MONGODB_URI.includes("localhost") && !process.env.MONGODB_URI.includes("mongodb://");

// Helper to create both user and team member with same ID
async function createUserAndTeamMember(nom: string, prenom: string, email: string, role: string, password: string, telephone?: string) {
  let user = await MockUser.findOne({ email });
    if (!user) {
      const _id = generateId("userId");
      const now = new Date();
      const newUser: any = {
        _id,
        name: `${prenom} ${nom}`,
        email: email.toLowerCase(),
        password,
        role,
        avatar: "",
        createdAt: now,
        updatedAt: now,
      };
      const allUsers = getUsers();
      const emailToIdMap = getEmailToId();
      allUsers[_id] = newUser;
      emailToIdMap[email.toLowerCase()] = _id;
      saveData(USERS_FILE, allUsers);
      saveData(EMAIL_TO_ID_FILE, emailToIdMap);
      user = newUser;
    }
  
  let teamMember = (await MockTeam.find()).find(t => t.email.toLowerCase() === email.toLowerCase());
  if (!teamMember && user) {
    const teamUser: any = {
      _id: user._id,
      nom,
      prenom,
      email: email.toLowerCase(),
      password,
      role,
      telephone: telephone || "",
      avatar: "",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const allTeam = getTeam();
    allTeam[user._id] = teamUser;
    saveData(TEAM_FILE, allTeam);
  }
}

// Find the first admin user to own existing/seed data
function findAdminUserId(): string | null {
  const team = getTeam();
  const admin = Object.values(team).find((t: any) => t.role === "Admin") || Object.values(team)[0];
  return admin?._id || null;
}

// Initialize with a test user (optional) - synchronous, called at module level
async function initMockDB() {
  const testPassword = hashSync("password123", 10);
  const users = getUsers();
  const emailToId = getEmailToId();
  const existingUserEntry = Object.values(users).find((u: any) => u.email === "test@example.com");
  
  let testUserId: string | null = null;
  if (!existingUserEntry) {
    testUserId = "mock-user-init-001";
    const now = new Date().toISOString();
    users[testUserId] = {
      _id: testUserId, name: "Test User", nom: "User", prenom: "Test",
      email: "test@example.com", password: testPassword, role: "freelance",
      avatar: "", createdAt: now, updatedAt: now,
    } as any;
    emailToId["test@example.com"] = testUserId;
    await setUsers(users);
    await setEmailToId(emailToId);
  } else {
    testUserId = existingUserEntry._id;
  }

  if (testUserId) {
    // Portfolio
    const portfolios = getPortfolios();
    const hasPortfolio = Object.values(portfolios).some((p: any) => p.userId === testUserId);
    if (!hasPortfolio) {
      const pid = "mock-portfolio-init-001";
      portfolios[pid] = { _id: pid, userId: testUserId, title: "Portfolio de Test User", slug: "test-user", bio: "", theme: "light", primaryColor: "#6366f1", isPublished: false, views: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } as any;
      await setPortfolios(portfolios);
    }

    // Workspace
    const workspaces = getWorkspaces();
    const existingWs = Object.values(workspaces).find((w: any) => w.ownerId === testUserId);
    let wsId: string | null = null;

    if (!existingWs) {
      wsId = "mock-ws-init-001";
      const now = new Date().toISOString();
      workspaces[wsId] = { _id: wsId, nom: "Agence AgencyFlow", ownerId: testUserId, description: "Espace de travail principal", logo: "", createdAt: now, updatedAt: now } as any;
      await setWorkspaces(workspaces);

      const members = getWorkspaceMembers();
      const memId = "mock-wsm-init-001";
      members[memId] = { _id: memId, workspaceId: wsId, userId: testUserId, role: "Owner", equipe: "", status: "Actif", createdAt: now, updatedAt: now } as any;
      await setWorkspaceMembers(members);
    } else {
      wsId = existingWs._id;
    }

    // Seed demo data if workspace exists and has no clients
    if (wsId) {
      const existingClients = getClients();
      const hasClients = Object.values(existingClients).some((c: any) => c.workspaceId === wsId);
      if (!hasClients) {
        const now = new Date().toISOString();
        const c1 = { _id: "mock-client-seed-001", nomSociete: "TechCorp France", responsable: "Jean Dupont", email: "jean.dupont@techcorp.fr", telephone: "01 23 45 67 89", adresse: "12 Rue de la Paix, 75002 Paris", secteurActivite: "Informatique", dateCreation: now, workspaceId: wsId, createdAt: now, updatedAt: now };
        const c2 = { _id: "mock-client-seed-002", nomSociete: "Design Studio", responsable: "Marie Laurent", email: "marie@designstudio.fr", telephone: "01 98 76 54 32", adresse: "5 Avenue des Arts, 75008 Paris", secteurActivite: "Education", dateCreation: now, workspaceId: wsId, createdAt: now, updatedAt: now };
        const c3 = { _id: "mock-client-seed-003", nomSociete: "ABC Consulting", responsable: "Pierre Martin", email: "pierre@abcconsulting.fr", telephone: "04 56 78 90 12", adresse: "8 Boulevard Haussmann, 75009 Paris", secteurActivite: "Finance", dateCreation: now, workspaceId: wsId, createdAt: now, updatedAt: now };
        existingClients[c1._id] = c1 as any;
        existingClients[c2._id] = c2 as any;
        existingClients[c3._id] = c3 as any;
        await setClients(existingClients);

        const projects = getAgencyProjects();
        const dateDebut = new Date();
        const dateFin = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
        projects["mock-proj-seed-001"] = { _id: "mock-proj-seed-001", titre: "Site E-commerce TechCorp", description: "Refonte complète du site e-commerce avec catalogue produits et paiement en ligne.", budget: 25000, dateDebut, dateFin, statut: "En cours", priorite: "Haute", clientId: c1._id, chefProjet: "Test User", workspaceId: wsId, createdAt: now, updatedAt: now } as any;
        projects["mock-proj-seed-002"] = { _id: "mock-proj-seed-002", titre: "Identité visuelle Design Studio", description: "Création du logo, charte graphique et supports de communication.", budget: 8000, dateDebut, dateFin, statut: "Terminé", priorite: "Moyenne", clientId: c2._id, chefProjet: "Test User", workspaceId: wsId, createdAt: now, updatedAt: now } as any;
        projects["mock-proj-seed-003"] = { _id: "mock-proj-seed-003", titre: "Application Mobile ABC", description: "Développement d'une application mobile iOS/Android de gestion de projets.", budget: 45000, dateDebut, dateFin, statut: "En attente", priorite: "Haute", clientId: c3._id, chefProjet: "Test User", workspaceId: wsId, createdAt: now, updatedAt: now } as any;
        await setAgencyProjects(projects);
      }

      // Team entry
      const team = getTeam();
      const hasTeamEntry = Object.values(team).some((t: any) => t.email === "test@example.com");
      if (!hasTeamEntry) {
        team["mock-team-init-001"] = { _id: "mock-team-init-001", nom: "User", prenom: "Test", email: "test@example.com", password: testPassword, role: "Admin", telephone: "", avatar: "", userId: testUserId, workspaceId: wsId, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } as any;
        await setTeam(team);
      }
    }
  }
}

async function migrateOrphanData() {
  const adminId = findAdminUserId();
  if (!adminId) return;
  
  // Get or create workspace for admin
  let workspaces = getWorkspaces();
  const adminWorkspace = Object.values(workspaces).find((w: any) => w.ownerId === adminId);
  let workspaceId: string;
  if (!adminWorkspace) {
    const now = new Date().toISOString();
    workspaceId = generateId("workspaceId");
    workspaces[workspaceId] = {
      _id: workspaceId, nom: "Agence AgencyFlow", ownerId: adminId,
      description: "", logo: "",
      createdAt: now, updatedAt: now,
    };
    await setWorkspaces(workspaces);
  } else {
    workspaceId = adminWorkspace._id;
  }
  
  // Migrate clients
  const clients = getClients();
  let clientsChanged = false;
  for (const c of Object.values(clients)) {
    if (!(c as any).workspaceId) {
      (c as any).workspaceId = workspaceId;
      clientsChanged = true;
    }
  }
  if (clientsChanged) await setClients(clients);
  
  // Migrate projects
  const projects = getAgencyProjects();
  let projectsChanged = false;
  for (const p of Object.values(projects)) {
    if (!(p as any).workspaceId) {
      (p as any).workspaceId = workspaceId;
      projectsChanged = true;
    }
  }
  if (projectsChanged) await setAgencyProjects(projects);
  
  // Migrate tasks
  const tasks = getTasks();
  let tasksChanged = false;
  for (const t of Object.values(tasks)) {
    if (!(t as any).workspaceId) {
      (t as any).workspaceId = workspaceId;
      tasksChanged = true;
    }
  }
  if (tasksChanged) await setTasks(tasks);
  
  // Migrate documents
  const documents = getDocuments();
  let docsChanged = false;
  for (const d of Object.values(documents)) {
    if (!(d as any).workspaceId) {
      (d as any).workspaceId = workspaceId;
      docsChanged = true;
    }
  }
  if (docsChanged) await setDocuments(documents);
  
  // Migrate invitations
  const invitations = getInvitations();
  let invChanged = false;
  for (const inv of Object.values(invitations)) {
    if (!(inv as any).workspaceId) {
      (inv as any).workspaceId = workspaceId;
      invChanged = true;
    }
  }
  if (invChanged) await setInvitations(invitations);
  
  // Migrate team members (assign to workspace)
  const allTeam = getTeam();
  let teamChanged = false;
  for (const t of Object.values(allTeam)) {
    if (!(t as any).userId) {
      (t as any).userId = adminId;
      teamChanged = true;
    }
  }
  if (teamChanged) await setTeam(allTeam);

  // Ensure all registered users have a team entry
  const users = getUsers();
  const allUsers = Object.values(users);
  let teamCreated = false;
  for (const u of allUsers) {
    const hasEntry = Object.values(getTeam()).some((t: any) => t.email?.toLowerCase() === (u as any).email?.toLowerCase());
    if (!hasEntry) {
      const userWsList = await MockWorkspace.findByOwner((u as any)._id);
      const userWs = userWsList.length > 0 ? userWsList[0] : null;
      if (userWs) {
        const nameParts = ((u as any).name || "Utilisateur").split(" ");
        await MockTeam.create({
          nom: nameParts.slice(1).join(" ") || "Inconnu",
          prenom: nameParts[0] || "Utilisateur",
          email: (u as any).email?.toLowerCase() || "",
          password: (u as any).password || "",
          role: "Admin",
          userId: (u as any)._id,
          workspaceId: userWs._id,
        });
        teamCreated = true;
      }
    }
  }
}

export async function getOrCreateMockUserAndPortfolio(email: string, name: string = "User") {
  let user = await MockUser.findOne({ email });
  if (!user) {
    const hashedPassword = await hash("password123", 10);
    user = await MockUser.create({
      name,
      email,
      password: hashedPassword,
      role: "freelance"
    });
  }
  let portfolio = await MockPortfolio.findOne({ userId: user._id });
  if (!portfolio) {
    portfolio = await MockPortfolio.create({
      userId: user._id,
      title: `Portfolio de ${user.name}`,
      slug: user.email.split('@')[0].toLowerCase(),
      bio: "",
      theme: "light",
      primaryColor: "#6366f1",
      isPublished: false,
      views: 0
    });
  }
  return { user, portfolio };
}

// Settings operations
function getSettings() { return loadData<any>(SETTINGS_FILE, {}); }
async function setSettings(data: any) { await saveData(SETTINGS_FILE, data); }

export const MockSettings = {
  findOne: async (query?: { workspaceId?: string }) => {
    const settings = getSettings();
    if (query?.workspaceId) {
      const all = Object.values(settings);
      const found = all.find((s: any) => s.workspaceId === query.workspaceId);
      return found || null;
    }
    return settings && settings.nomAgence ? settings : null;
  },
  create: async (data: any) => {
    await setSettings(data);
    return data;
  },
  findOneAndUpdate: async (query: { workspaceId?: string }, updateData: any, options?: any) => {
    const settings = getSettings();
    if (query?.workspaceId) {
      const updated = { ...settings, ...updateData, workspaceId: query.workspaceId };
      await setSettings(updated);
      return updated;
    }
    const updated = { ...settings, ...updateData };
    await setSettings(updated);
    return updated;
  },
};

const INVITATIONS_FILE = path.join(DATA_DIR, "invitations.json");

interface InvitationRecord {
  _id: string;
  email: string;
  token: string;
  nom: string;
  prenom: string;
  role: string;
  equipe: string;
  invitePar: string;
  statut: "En attente" | "Acceptée" | "Expirée" | "Annulée";
  expiration: string;
  userId: string;
  workspaceId: string;
  createdAt: string;
  updatedAt: string;
}

function getInvitations() { return loadData<Record<string, InvitationRecord>>(INVITATIONS_FILE, {}); }
async function setInvitations(data: Record<string, InvitationRecord>) { await saveData(INVITATIONS_FILE, data); }

export const MockInvitation = {
  create: async (data: {
    email: string;
    token: string;
    nom: string;
    prenom: string;
    role: string;
    equipe?: string;
    invitePar: string;
    expiration: Date;
    userId: string;
    workspaceId: string;
  }) => {
    const _id = generateId("invitationId");
    const now = new Date().toISOString();
    const invitation: InvitationRecord = {
      _id,
      email: data.email.toLowerCase(),
      token: data.token,
      nom: data.nom,
      prenom: data.prenom,
      role: data.role,
      equipe: data.equipe || "",
      invitePar: data.invitePar,
      statut: "En attente",
      expiration: data.expiration.toISOString(),
      userId: data.userId,
      workspaceId: data.workspaceId,
      createdAt: now,
      updatedAt: now,
    };
    const invitations = getInvitations();
    invitations[_id] = invitation;
    await setInvitations(invitations);
    return invitation;
  },

  findOne: async (query: { token?: string }) => {
    const invitations = getInvitations();
    for (const inv of Object.values(invitations)) {
      if (query.token && inv.token === query.token) return inv;
    }
    return null;
  },

  findOneAndUpdate: async (query: { token?: string }, updateData: Partial<InvitationRecord>) => {
    const invitations = getInvitations();
    for (const inv of Object.values(invitations)) {
      if (query.token && inv.token === query.token) {
        invitations[inv._id] = { ...inv, ...updateData, updatedAt: new Date().toISOString() };
        await setInvitations(invitations);
        return invitations[inv._id];
      }
    }
    return null;
  },

  find: async (workspaceId: string) => {
    const invitations = getInvitations();
    return Object.values(invitations)
      .filter((inv: any) => inv.workspaceId === workspaceId)
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  findById: async (id: string) => {
    const invitations = getInvitations();
    return invitations[id] || null;
  },

  findByIdAndDelete: async (id: string) => {
    const invitations = getInvitations();
    if (!invitations[id]) return null;
    const deleted = invitations[id];
    delete invitations[id];
    await setInvitations(invitations);
    return deleted;
  },

  findByIdAndUpdate: async (id: string, updateData: Partial<InvitationRecord>) => {
    const invitations = getInvitations();
    if (!invitations[id]) return null;
    invitations[id] = { ...invitations[id], ...updateData, updatedAt: new Date().toISOString() };
    await setInvitations(invitations);
    return invitations[id];
  },
};

// --- Activity ---
interface ActivityRecord {
  _id: string;
  workspaceId: string;
  userId: string;
  userName: string;
  userEmail: string;
  entityType: string;
  entityId: string;
  entityName: string;
  action: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

function getActivities() { return loadData<Record<string, ActivityRecord>>(ACTIVITIES_FILE, {}); }
async function setActivities(data: Record<string, ActivityRecord>) { await saveData(ACTIVITIES_FILE, data); }

export const MockActivity = {
  find: async (workspaceId: string, limit = 50, skip = 0) => {
    const items = getActivities();
    const filtered = Object.values(items)
      .filter((a: any) => a.workspaceId === workspaceId)
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const total = filtered.length;
    const paged = filtered.slice(skip, skip + limit);
    return { activities: paged, total };
  },

  create: async (data: {
    workspaceId: string; userId: string; userName: string; userEmail: string;
    entityType: string; entityId: string; entityName: string;
    action: string; description: string;
  }) => {
    const _id = generateId("activityId");
    const now = new Date().toISOString();
    const record: ActivityRecord = { _id, ...data, createdAt: now, updatedAt: now };
    const items = getActivities();
    items[_id] = record;
    await setActivities(items);
    return record;
  },
};

// --- Event ---
export interface CalendarEventRecord {
  _id: string;
  workspaceId: string;
  titre: string;
  description?: string;
  type: string;
  dateDebut: string;
  dateFin: string;
  employeId?: string;
  userId?: string;
  projectId?: string;
  statut?: string;
  createdAt: string;
  updatedAt: string;
}

function getEvents() { return loadData<Record<string, CalendarEventRecord>>(EVENTS_FILE, {}); }
async function setEvents(data: Record<string, CalendarEventRecord>) { await saveData(EVENTS_FILE, data); }

export const MockEvent = {
  find: async (workspaceId?: string) => {
    const items = getEvents();
    const all = Object.values(items)
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return workspaceId ? all.filter((e: any) => e.workspaceId === workspaceId) : all;
  },

  findById: async (id: string) => {
    const items = getEvents();
    return items[id] || null;
  },

  create: async (data: {
    workspaceId: string; titre: string; description?: string; type: string;
    dateDebut: string; dateFin: string; employeId?: string; userId?: string; projectId?: string; statut?: string;
  }) => {
    const _id = generateId("eventId");
    const now = new Date().toISOString();
    const record: CalendarEventRecord = { _id, ...data, createdAt: now, updatedAt: now };
    const items = getEvents();
    items[_id] = record;
    await setEvents(items);
    return record;
  },

  findByIdAndUpdate: async (id: string, data: Partial<CalendarEventRecord>) => {
    const items = getEvents();
    if (!items[id]) return null;
    items[id] = { ...items[id], ...data, updatedAt: new Date().toISOString() };
    await setEvents(items);
    return items[id];
  },

  findByIdAndDelete: async (id: string) => {
    const items = getEvents();
    if (!items[id]) return null;
    const record = items[id];
    delete items[id];
    await setEvents(items);
    return record;
  },
};

// --- Notification ---
interface NotificationRecord {
  _id: string;
  workspaceId: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  link: string;
  read: boolean;
  entityType: string;
  entityId: string;
  fromUserId: string;
  fromUserName: string;
  createdAt: string;
  updatedAt: string;
}

function getNotifications() { return loadData<Record<string, NotificationRecord>>(NOTIFICATIONS_FILE, {}); }
async function setNotifications(data: Record<string, NotificationRecord>) { await saveData(NOTIFICATIONS_FILE, data); }

export const MockNotification = {
  find: async (userId: string, limit = 20, skip = 0) => {
    const items = getNotifications();
    const filtered = Object.values(items)
      .filter((n: any) => n.userId === userId)
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const total = filtered.length;
    const paged = filtered.slice(skip, skip + limit);
    return { notifications: paged, total };
  },

  create: async (data: {
    workspaceId: string; userId: string; type: string; title: string;
    message?: string; link?: string; entityType?: string; entityId?: string;
    fromUserId?: string; fromUserName?: string;
  }) => {
    const _id = generateId("notificationId");
    const now = new Date().toISOString();
    const record: NotificationRecord = {
      _id, workspaceId: data.workspaceId, userId: data.userId, type: data.type,
      title: data.title, message: data.message || "", link: data.link || "",
      read: false, entityType: data.entityType || "", entityId: data.entityId || "",
      fromUserId: data.fromUserId || "", fromUserName: data.fromUserName || "",
      createdAt: now, updatedAt: now,
    };
    const items = getNotifications();
    items[_id] = record;
    await setNotifications(items);
    return record;
  },

  findByIdAndUpdate: async (id: string, updateData: Partial<NotificationRecord>) => {
    const items = getNotifications();
    if (!items[id]) return null;
    items[id] = { ...items[id], ...updateData, updatedAt: new Date().toISOString() };
    await setNotifications(items);
    return items[id];
  },

  updateMany: async (query: { userId: string; read?: boolean }, updateData: Partial<NotificationRecord>) => {
    const items = getNotifications();
    for (const n of Object.values(items)) {
      if (n.userId === query.userId) {
        items[n._id] = { ...items[n._id], ...updateData, updatedAt: new Date().toISOString() };
      }
    }
    await setNotifications(items);
  },

  countUnread: async (userId: string) => {
    const items = getNotifications();
    return Object.values(items).filter((n: any) => n.userId === userId && !n.read).length;
  },
};

// --- Discussion Message ---
interface DiscussionMessageRecord {
  _id: string;
  channelId: string;
  projectId: string;
  userId: string;
  userName: string;
  userEmail: string;
  userAvatar: string;
  content: string;
  time: string;
  reactions: { emoji: string; users: string[] }[];
  pinned: boolean;
  edited: boolean;
  parentId?: string;
  attachments?: { type: "image" | "file" | "voice"; name: string; data: string; size?: number }[];
  mentions?: string[];
  createdAt: string;
  updatedAt: string;
}

function getDiscussionMessages() { return loadData<Record<string, DiscussionMessageRecord>>(DISCUSSION_MESSAGES_FILE, {}); }
async function setDiscussionMessages(data: Record<string, DiscussionMessageRecord>) { await saveData(DISCUSSION_MESSAGES_FILE, data); }

export const MockDiscussion = {
  findByChannel: async (projectId: string, channelId: string) => {
    const items = getDiscussionMessages();
    return Object.values(items)
      .filter((m: any) => m.projectId === projectId && m.channelId === channelId)
      .sort((a: any, b: any) => new Date(a.time).getTime() - new Date(b.time).getTime());
  },

  create: async (data: {
    channelId: string; projectId: string; userId: string;
    userName: string; userEmail: string; userAvatar: string;
    content: string; parentId?: string; attachments?: any[]; mentions?: string[];
  }) => {
    const _id = generateId("discussionMessageId");
    const now = new Date().toISOString();
    const record: DiscussionMessageRecord = {
      _id, channelId: data.channelId, projectId: data.projectId,
      userId: data.userId, userName: data.userName, userEmail: data.userEmail,
      userAvatar: data.userAvatar, content: data.content,
      time: now, reactions: [], pinned: false, edited: false,
      parentId: data.parentId, attachments: data.attachments, mentions: data.mentions || [],
      createdAt: now, updatedAt: now,
    };
    const items = getDiscussionMessages();
    items[_id] = record;
    await setDiscussionMessages(items);
    return record;
  },

  update: async (id: string, update: Partial<DiscussionMessageRecord>) => {
    const items = getDiscussionMessages();
    if (!items[id]) return null;
    items[id] = { ...items[id], ...update, updatedAt: new Date().toISOString() };
    await setDiscussionMessages(items);
    return items[id];
  },

  deleteById: async (id: string) => {
    const items = getDiscussionMessages();
    if (!items[id]) return null;
    const deleted = items[id];
    delete items[id];
    await setDiscussionMessages(items);
    return deleted;
  },
};

// --- Role ---
interface RoleRecord {
  _id: string;
  workspaceId: string;
  nom: string;
  description: string;
  type: "Système" | "Personnalisé";
  creePar: string;
  creeParEmail: string;
  permissions: Record<string, { voir: boolean; creer: boolean; modifier: boolean; supprimer: boolean; gerer: boolean }>;
  createdAt: string;
  updatedAt: string;
}

function getRoles() { return loadData<Record<string, RoleRecord>>(ROLES_FILE, {}); }
async function setRoles(data: Record<string, RoleRecord>) { await saveData(ROLES_FILE, data); }

export const MockRole = {
  findByWorkspace: async (workspaceId: string) => {
    const items = getRoles();
    return Object.values(items)
      .filter((r: any) => r.workspaceId === workspaceId)
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  findById: async (id: string) => {
    const items = getRoles();
    return items[id] || null;
  },

  create: async (data: {
    workspaceId: string; nom: string; description: string; type: "Système" | "Personnalisé";
    creePar: string; creeParEmail: string;
    permissions: Record<string, { voir: boolean; creer: boolean; modifier: boolean; supprimer: boolean; gerer: boolean }>;
  }) => {
    const _id = generateId("roleId");
    const now = new Date().toISOString();
    const record: RoleRecord = {
      _id, workspaceId: data.workspaceId, nom: data.nom, description: data.description,
      type: data.type, creePar: data.creePar, creeParEmail: data.creeParEmail,
      permissions: data.permissions, createdAt: now, updatedAt: now,
    };
    const items = getRoles();
    items[_id] = record;
    await setRoles(items);
    return record;
  },

  findByIdAndUpdate: async (id: string, updateData: Partial<RoleRecord>) => {
    const items = getRoles();
    if (!items[id]) return null;
    items[id] = { ...items[id], ...updateData, updatedAt: new Date().toISOString() };
    await setRoles(items);
    return items[id];
  },

  findByIdAndDelete: async (id: string) => {
    const items = getRoles();
    if (!items[id]) return null;
    const deleted = items[id];
    delete items[id];
    await setRoles(items);
    return deleted;
  },
};

// --- Comment ---
interface CommentRecord {
  _id: string;
  workspaceId: string;
  userId: string;
  userName: string;
  entityType: string;
  entityId: string;
  content: string;
  mentions: string[];
  createdAt: string;
  updatedAt: string;
}

function getComments() { return loadData<Record<string, CommentRecord>>(COMMENTS_FILE, {}); }
async function setComments(data: Record<string, CommentRecord>) { await saveData(COMMENTS_FILE, data); }

export const MockComment = {
  find: async (entityType: string, entityId: string) => {
    const items = getComments();
    const results = Object.values(items)
      .filter((c: any) => c.entityType === entityType && c.entityId === entityId)
      .sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    return results;
  },

  create: async (data: {
    workspaceId: string; userId: string; userName: string;
    entityType: string; entityId: string; content: string; mentions?: string[];
  }) => {
    const _id = generateId("commentId");
    const now = new Date().toISOString();
    const record: CommentRecord = {
      _id, workspaceId: data.workspaceId, userId: data.userId, userName: data.userName,
      entityType: data.entityType, entityId: data.entityId, content: data.content,
      mentions: data.mentions || [], createdAt: now, updatedAt: now,
    };
    const items = getComments();
    items[_id] = record;
    await setComments(items);
    return record;
  },
};

// ─── Corbeille (Trash) ──────────────────────────────────────────
const CORBEILLE_FILE = path.join(DATA_DIR, "corbeille.json");

function getCorbeille() { return loadData<any[]>(CORBEILLE_FILE, []); }
async function setCorbeille(items: any[]) { await saveData(CORBEILLE_FILE, items); }

export const MockCorbeille = {
  find: async (workspaceId?: string) => {
    let items = getCorbeille();
    if (workspaceId) items = items.filter((i: any) => i.workspaceId === workspaceId);
    return items.sort((a: any, b: any) => new Date(b.supprimeLe).getTime() - new Date(a.supprimeLe).getTime());
  },

  create: async (data: any) => {
    const items = getCorbeille();
    items.unshift(data);
    await setCorbeille(items);
    return data;
  },

  findByIdAndDelete: async (id: string) => {
    const items = getCorbeille();
    const idx = items.findIndex((i: any) => i.id === id);
    if (idx === -1) return null;
    const removed = items.splice(idx, 1)[0];
    await setCorbeille(items);
    return removed;
  },

  deleteMany: async (workspaceId?: string) => {
    if (workspaceId) {
      const items = getCorbeille().filter((i: any) => i.workspaceId !== workspaceId);
      await setCorbeille(items);
    } else {
      await setCorbeille([]);
    }
  },
};

// Initialize mock DB with demo data (local dev only — on Vercel with MongoDB, start fresh)
if (!process.env.MONGODB_URI) {
  initMockDB().catch((e) => console.error("initMockDB failed:", e));
}
