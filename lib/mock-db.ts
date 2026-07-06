import { hash } from "bcryptjs";
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
  dateCreation: Date;
  userId: string;
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
  userId: string;
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
  userId: string;
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
  userId: string;
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
  comment: string;
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
  createdAt: Date;
  updatedAt: Date;
}

interface ClientActivity {
  _id: string;
  clientId: string;
  userId: string;
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

// Helper to load data from JSON file
function loadData<T>(filePath: string, defaultValue: T): T {
  if (!fs.existsSync(filePath)) {
    return defaultValue;
  }
  try {
    const data = fs.readFileSync(filePath, "utf8");
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error loading data from ${filePath}:`, error);
    return defaultValue;
  }
}

// Helper to save data to JSON file
function saveData<T>(filePath: string, data: T) {
  try {
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
      invitationId: 1
    });
  }
}

initializeFiles();

// Helper functions to load/save data fresh each time
function getUsers() { return loadData<Record<string, User>>(USERS_FILE, {}); }
function setUsers(data: Record<string, User>) { saveData(USERS_FILE, data); }

function getPortfolios() { return loadData<Record<string, Portfolio>>(PORTFOLIOS_FILE, {}); }
function setPortfolios(data: Record<string, Portfolio>) { saveData(PORTFOLIOS_FILE, data); }

function getPortfolioProjects() { return loadData<Record<string, PortfolioProject>>(PORTFOLIO_PROJECTS_FILE, {}); }
function setPortfolioProjects(data: Record<string, PortfolioProject>) { saveData(PORTFOLIO_PROJECTS_FILE, data); }

function getAgencyProjects() { return loadData<Record<string, Project>>(AGENCY_PROJECTS_FILE, {}); }
function setAgencyProjects(data: Record<string, Project>) { saveData(AGENCY_PROJECTS_FILE, data); }

function getTasks() { return loadData<Record<string, Task>>(TASKS_FILE, {}); }
function setTasks(data: Record<string, Task>) { saveData(TASKS_FILE, data); }

function getTeam() { return loadData<Record<string, TeamUser>>(TEAM_FILE, {}); }
function setTeam(data: Record<string, TeamUser>) { saveData(TEAM_FILE, data); }

function getDocuments() { return loadData<Record<string, Document>>(DOCUMENTS_FILE, {}); }
function setDocuments(data: Record<string, Document>) { saveData(DOCUMENTS_FILE, data); }

function getSkills() { return loadData<Record<string, Skill>>(SKILLS_FILE, {}); }
function setSkills(data: Record<string, Skill>) { saveData(SKILLS_FILE, data); }

function getExperiences() { return loadData<Record<string, Experience>>(EXPERIENCES_FILE, {}); }
function setExperiences(data: Record<string, Experience>) { saveData(EXPERIENCES_FILE, data); }

function getTestimonials() { return loadData<Record<string, Testimonial>>(TESTIMONIALS_FILE, {}); }
function setTestimonials(data: Record<string, Testimonial>) { saveData(TESTIMONIALS_FILE, data); }

function getClients() { return loadData<Record<string, Client>>(CLIENTS_FILE, {}); }
function setClients(data: Record<string, Client>) { saveData(CLIENTS_FILE, data); }

function getEmailToId() { return loadData<Record<string, string>>(EMAIL_TO_ID_FILE, {}); }
function setEmailToId(data: Record<string, string>) { saveData(EMAIL_TO_ID_FILE, data); }

function getSlugToId() { return loadData<Record<string, string>>(SLUG_TO_ID_FILE, {}); }
function setSlugToId(data: Record<string, string>) { saveData(SLUG_TO_ID_FILE, data); }

function getPortfolioMessages() { return loadData<Record<string, Message>>(PORTFOLIO_MESSAGES_FILE, {}); }
function setPortfolioMessages(data: Record<string, Message>) { saveData(PORTFOLIO_MESSAGES_FILE, data); }

function getTeamMessages() { return loadData<Record<string, TeamMessage>>(TEAM_MESSAGES_FILE, {}); }
function setTeamMessages(data: Record<string, TeamMessage>) { saveData(TEAM_MESSAGES_FILE, data); }
function getClientComments() {
  return loadData<
    Record<string, ClientComment>
  >(CLIENT_COMMENTS_FILE, {});
}

function setClientComments(
 data: Record<string, ClientComment>
) {
 saveData(CLIENT_COMMENTS_FILE, data);
}

function getClientDocuments() {
  return loadData<Record<string, ClientDocument>>(CLIENT_DOCUMENTS_FILE, {});
}

function setClientDocuments(data: Record<string, ClientDocument>) {
  saveData(CLIENT_DOCUMENTS_FILE, data);
}

function getClientActivities() {
  return loadData<Record<string, ClientActivity>>(CLIENT_ACTIVITIES_FILE, {});
}

function setClientActivities(data: Record<string, ClientActivity>) {
  saveData(CLIENT_ACTIVITIES_FILE, data);
}

function getClientReminders() {
  return loadData<Record<string, ClientReminder>>(CLIENT_REMINDERS_FILE, {});
}

function setClientReminders(data: Record<string, ClientReminder>) {
  saveData(CLIENT_REMINDERS_FILE, data);
}

function getClientEmails() {
  return loadData<Record<string, ClientEmail>>(CLIENT_EMAILS_FILE, {});
}

function setClientEmails(data: Record<string, ClientEmail>) {
  saveData(CLIENT_EMAILS_FILE, data);
}

function getClientTags() {
  return loadData<Record<string, ClientTag>>(CLIENT_TAGS_FILE, {});
}

function setClientTags(data: Record<string, ClientTag>) {
  saveData(CLIENT_TAGS_FILE, data);
}

function getClientLocations() {
  return loadData<Record<string, ClientLocation>>(CLIENT_LOCATIONS_FILE, {});
}

function setClientLocations(data: Record<string, ClientLocation>) {
  saveData(CLIENT_LOCATIONS_FILE, data);
}

function getClientInvoices() {
  return loadData<Record<string, ClientInvoice>>(CLIENT_INVOICES_FILE, {});
}

function setClientInvoices(data: Record<string, ClientInvoice>) {
  saveData(CLIENT_INVOICES_FILE, data);
}

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
  invitationId: 1
}); }
function setCounters(data: Record<string, number>) { saveData(COUNTERS_FILE, data); }

// Generate a simple ObjectId-like string
function generateId(counterKey: string): string {
  const counters = getCounters();
  // Initialize counter if it doesn't exist
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
  findOne: async (query: { email?: string }) => {
    console.log("MockUser.findOne query:", query);
    const users = getUsers();
    const emailToId = getEmailToId();
    console.log("emailToId contents:", emailToId);
    if (query.email) {
      const lowerEmail = query.email.toLowerCase();
      console.log("MockUser.findOne: looking for email:", lowerEmail);
      const userId = emailToId[lowerEmail];
      console.log("MockUser.findOne: userId found:", userId);
      if (userId && users[userId]) {
        return users[userId];
      }
    }
    console.log("MockUser.findOne: no user found");
    return null;
  },

  create: async (userData: { name: string; nom?: string; prenom?: string; email: string; password: string; role: string }) => {
    console.log("MockUser.create called with data:", userData);
    const _id = generateId("userId");
    console.log("MockUser.create: generated ID:", _id);
    const now = new Date();
    const user: User = {
      _id,
      name: userData.name,
      nom: userData.nom || userData.name,
      prenom: userData.prenom || userData.name,
      email: userData.email.toLowerCase(),
      password: userData.password,
      role: userData.role || "freelance",
      avatar: "",
      createdAt: now,
      updatedAt: now,
    };
    const users = getUsers();
    const emailToId = getEmailToId();
    users[_id] = user;
    emailToId[user.email] = _id;
    setUsers(users);
    setEmailToId(emailToId);
    console.log("MockUser.create: user saved! Now users count:", Object.keys(users).length);
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
    setPortfolios(portfolios);
    setSlugToId(slugToId);
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
    setPortfolioProjects(portfolioProjects);
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
    setPortfolioProjects(portfolioProjects);
    return portfolioProjects[id];
  },

  findByIdAndDelete: async (id: string) => {
    const portfolioProjects = getPortfolioProjects();
    if (!portfolioProjects[id]) return null;
    const deleted = portfolioProjects[id];
    delete portfolioProjects[id];
    setPortfolioProjects(portfolioProjects);
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
    setSkills(skills);
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
    setSkills(skills);
    return skills[id];
  },

  findByIdAndDelete: async (id: string) => {
    const skills = getSkills();
    if (!skills[id]) return null;
    const deleted = skills[id];
    delete skills[id];
    setSkills(skills);
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
    setExperiences(experiences);
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
    setExperiences(experiences);
    return experiences[id];
  },

  findByIdAndDelete: async (id: string) => {
    const experiences = getExperiences();
    if (!experiences[id]) return null;
    const deleted = experiences[id];
    delete experiences[id];
    setExperiences(experiences);
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
    setPortfolioMessages(messages);
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
    setPortfolioMessages(messages);
    return messages[id];
  },

  findByIdAndDelete: async (id: string) => {
    const messages = getPortfolioMessages();
    if (!messages[id]) return null;
    const deleted = messages[id];
    delete messages[id];
    setPortfolioMessages(messages);
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
    setTeamMessages(messages);

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
    setTeamMessages(messages);
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
    setTestimonials(testimonials);
    return t;
  },
};

// Client operations
export const MockClient = {
  find: async (userId?: string) => {
    const clients = getClients();
    const all = Object.values(clients);
    const filtered = userId ? all.filter(c => !c.userId || c.userId === userId) : all;
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
    userId: string;
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
      dateCreation: now,
      userId: clientData.userId,
      createdAt: now,
      updatedAt: now,
    };
    const clients = getClients();
    clients[_id] = client;
    setClients(clients);
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
    setClients(clients);
    return clients[id];
  },

  findByIdAndDelete: async (id: string) => {
    const clients = getClients();
    if (!clients[id]) return null;
    const deleted = clients[id];
    delete clients[id];
    setClients(clients);
    return deleted;
  },
};

// Agency Project operations
export const MockProject = {
  find: async (userId?: string) => {
    const agencyProjects = getAgencyProjects();
    const clients = getClients();
    const all = Object.values(agencyProjects);
    const filtered = userId ? all.filter(p => !p.userId || p.userId === userId) : all;
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
    userId: string;
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
      userId: projectData.userId,
      createdAt: now,
      updatedAt: now,
    };
    const agencyProjects = getAgencyProjects();
    const clients = getClients();
    agencyProjects[_id] = project;
    setAgencyProjects(agencyProjects);
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
    setAgencyProjects(agencyProjects);
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
    setAgencyProjects(agencyProjects);
    return deleted;
  },
};

// Task operations
export const MockTask = {
  find: async (filter: { projetId?: string, userId?: string } = {}) => {
    const tasks = getTasks();
    const agencyProjects = getAgencyProjects();
    const team = getTeam();
    let allTasks = Object.values(tasks).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    if (filter.projetId) {
      allTasks = allTasks.filter(t => t.projetId === filter.projetId);
    }
    if (filter.userId) {
      allTasks = allTasks.filter(t => !t.userId || t.userId === filter.userId);
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
    userId: string;
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
      userId: taskData.userId,
      createdAt: now,
      updatedAt: now,
    };
    const tasks = getTasks();
    const agencyProjects = getAgencyProjects();
    const team = getTeam();
    tasks[_id] = task;
    setTasks(tasks);
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
    setTasks(tasks);
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
    setTasks(tasks);
    return deleted;
  },
};

// Team operations
export const MockTeam = {
  find: async () => {
    const team = getTeam();
    // Map avatar to photo for frontend compatibility
    return Object.values(team).map(t => ({
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
      createdAt: now,
      updatedAt: now,
    };
    const team = getTeam();
    team[_id] = teamUser;
    setTeam(team);
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
    setTeam(team);
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
    setTeam(team);
    return deleted;
  },
};

// Document operations
export const MockDocument = {
  find: async (userId?: string) => {
    const documents = getDocuments();
    const agencyProjects = getAgencyProjects();
    const team = getTeam();
    const all = Object.values(documents);
    const filtered = userId ? all.filter(d => !d.userId || d.userId === userId) : all;
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
    userId: string;
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
      userId: docData.userId,
      createdAt: now,
      updatedAt: now,
    };
    const documents = getDocuments();
    const agencyProjects = getAgencyProjects();
    const team = getTeam();
    documents[_id] = document;
    setDocuments(documents);
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
    setDocuments(documents);
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
    action: string;
    description: string;
  }) => {
    const _id = generateId("clientActivityId");
    const now = new Date();
    const item: ClientActivity = {
      _id,
      clientId: data.clientId,
      userId: data.userId,
      action: data.action,
      description: data.description,
      createdAt: now,
      updatedAt: now,
    };
    const items = getClientActivities();
    items[_id] = item;
    setClientActivities(items);
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
    setClientActivities(items);
    return items[id];
  },

  findByIdAndDelete: async (id: string) => {
    const items = getClientActivities();
    if (!items[id]) return null;
    const deleted = items[id];
    delete items[id];
    setClientActivities(items);
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
    comment: string;
  }) => {
    const _id = generateId("clientCommentId");
    const now = new Date();
    const item: ClientComment = {
      _id,
      clientId: data.clientId,
      userId: data.userId,
      comment: data.comment,
      createdAt: now,
      updatedAt: now,
    };
    const items = getClientComments();
    items[_id] = item;
    setClientComments(items);
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
    setClientComments(items);
    return items[id];
  },

  findByIdAndDelete: async (id: string) => {
    const items = getClientComments();
    if (!items[id]) return null;
    const deleted = items[id];
    delete items[id];
    setClientComments(items);
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
      createdAt: now,
      updatedAt: now,
    };
    const items = getClientDocuments();
    items[_id] = item;
    setClientDocuments(items);
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
    setClientDocuments(items);
    return items[id];
  },

  findByIdAndDelete: async (id: string) => {
    const items = getClientDocuments();
    if (!items[id]) return null;
    const deleted = items[id];
    delete items[id];
    setClientDocuments(items);
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
      createdAt: now,
      updatedAt: now,
    };
    const items = getClientReminders();
    items[_id] = item;
    setClientReminders(items);
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
    setClientReminders(items);
    return items[id];
  },

  findByIdAndDelete: async (id: string) => {
    const items = getClientReminders();
    if (!items[id]) return null;
    const deleted = items[id];
    delete items[id];
    setClientReminders(items);
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
      createdAt: now,
      updatedAt: now,
    };
    const items = getClientEmails();
    items[_id] = item;
    setClientEmails(items);
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
    setClientEmails(items);
    return items[id];
  },

  findByIdAndDelete: async (id: string) => {
    const items = getClientEmails();
    if (!items[id]) return null;
    const deleted = items[id];
    delete items[id];
    setClientEmails(items);
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
    setClientTags(items);
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
    setClientTags(items);
    return items[id];
  },

  findByIdAndDelete: async (id: string) => {
    const items = getClientTags();
    if (!items[id]) return null;
    const deleted = items[id];
    delete items[id];
    setClientTags(items);
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
    setClientLocations(items);
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
    setClientLocations(items);
    return items[id];
  },

  findByIdAndDelete: async (id: string) => {
    const items = getClientLocations();
    if (!items[id]) return null;
    const deleted = items[id];
    delete items[id];
    setClientLocations(items);
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
    setClientInvoices(items);
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
    setClientInvoices(items);
    return items[id];
  },

  findByIdAndDelete: async (id: string) => {
    const items = getClientInvoices();
    if (!items[id]) return null;
    const deleted = items[id];
    delete items[id];
    setClientInvoices(items);
    return deleted;
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

// Initialize with a test user (optional)
async function initMockDB() {
  const testPassword = await hash("password123", 10);
  
  // Create test users
  await createUserAndTeamMember("User", "Test", "test@example.com", "Admin", testPassword, "22000000");
  await createUserAndTeamMember("Doe", "John", "john.doe@example.com", "Développeur", testPassword, "22123456");
  await createUserAndTeamMember("Smith", "Jane", "jane.smith@example.com", "Designer", testPassword, "22654321");
  await createUserAndTeamMember("hoimdi", "omayma", "omayma.hoimdi@esprit.tn", "Développeur", testPassword, "24241670");
  
  const testUser = await MockUser.findOne({ email: "test@example.com" });
  if (testUser) {
    let portfolio = await MockPortfolio.findOne({ userId: testUser._id });
    if (!portfolio) {
      await MockPortfolio.create({
        userId: testUser._id,
        title: "Portfolio de Test User",
        slug: "test-user",
        bio: "",
        theme: "light",
        primaryColor: "#6366f1",
        isPublished: false,
        views: 0,
      });
    }
  }
  
  // Migration: assign existing orphan data to the first admin user
  await migrateOrphanData();
}

async function migrateOrphanData() {
  // Find the first admin user to own existing data
  const team = getTeam();
  const adminUser = Object.values(team).find((t: any) => t.role === "Admin") || Object.values(team)[0];
  if (!adminUser) return;
  
  const adminId = adminUser._id;
  
  // Migrate clients
  const clients = getClients();
  let clientsChanged = false;
  for (const c of Object.values(clients)) {
    if (!(c as any).userId) {
      (c as any).userId = adminId;
      clientsChanged = true;
    }
  }
  if (clientsChanged) setClients(clients);
  
  // Migrate projects
  const projects = getAgencyProjects();
  let projectsChanged = false;
  for (const p of Object.values(projects)) {
    if (!(p as any).userId) {
      (p as any).userId = adminId;
      projectsChanged = true;
    }
  }
  if (projectsChanged) setAgencyProjects(projects);
  
  // Migrate tasks
  const tasks = getTasks();
  let tasksChanged = false;
  for (const t of Object.values(tasks)) {
    if (!(t as any).userId) {
      (t as any).userId = adminId;
      tasksChanged = true;
    }
  }
  if (tasksChanged) setTasks(tasks);
  
  // Migrate documents
  const documents = getDocuments();
  let docsChanged = false;
  for (const d of Object.values(documents)) {
    if (!(d as any).userId) {
      (d as any).userId = adminId;
      docsChanged = true;
    }
  }
  if (docsChanged) setDocuments(documents);
  
  // Migrate invitations
  const invitations = getInvitations();
  let invChanged = false;
  for (const inv of Object.values(invitations)) {
    if (!(inv as any).userId) {
      (inv as any).userId = adminId;
      invChanged = true;
    }
  }
  if (invChanged) setInvitations(invitations);
}

// Initialize mock DB
initMockDB();

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
function setSettings(data: any) { saveData(SETTINGS_FILE, data); }

export const MockSettings = {
  findOne: async (query?: { userId?: string }) => {
    const settings = getSettings();
    if (query?.userId) {
      const all = Object.values(settings);
      const found = all.find((s: any) => s.userId === query.userId);
      return found || null;
    }
    return settings && settings.nomAgence ? settings : null;
  },
  create: async (data: any) => {
    setSettings(data);
    return data;
  },
  findOneAndUpdate: async (query: { userId?: string }, updateData: any, options?: any) => {
    const settings = getSettings();
    if (query?.userId) {
      const updated = { ...settings, ...updateData, userId: query.userId };
      setSettings(updated);
      return updated;
    }
    const updated = { ...settings, ...updateData };
    setSettings(updated);
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
  createdAt: string;
  updatedAt: string;
}

function getInvitations() { return loadData<Record<string, InvitationRecord>>(INVITATIONS_FILE, {}); }
function setInvitations(data: Record<string, InvitationRecord>) { saveData(INVITATIONS_FILE, data); }

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
      createdAt: now,
      updatedAt: now,
    };
    const invitations = getInvitations();
    invitations[_id] = invitation;
    setInvitations(invitations);
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
        setInvitations(invitations);
        return invitations[inv._id];
      }
    }
    return null;
  },
};
