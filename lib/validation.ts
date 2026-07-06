// Validation utility functions

export interface ValidationErrors {
  [key: string]: string;
}

// Project validation
export function validateProject(data: {
  title?: string; description?: string; liveUrl?: string; githubUrl?: string; tags?: string }): ValidationErrors {
  const errors: ValidationErrors = {};
  
  if (!data.title || !data.title.trim()) {
    errors.title = 'Le titre du projet est obligatoire';
  } else if (data.title.trim().length < 2) {
    errors.title = 'Le titre doit contenir au moins 2 caractères';
  } else if (data.title.trim().length > 100) {
    errors.title = 'Le titre ne peut pas dépasser 100 caractères';
  }
  
  if (data.description && data.description.length > 2000) {
    errors.description = 'La description ne peut pas dépasser 2000 caractères';
  }
  
  const urlRegex = /^(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/;
  if (data.liveUrl && !urlRegex.test(data.liveUrl)) {
    errors.liveUrl = 'L\'URL du site live n\'est pas valide';
  }
  
  if (data.githubUrl && !urlRegex.test(data.githubUrl)) {
    errors.githubUrl = 'L\'URL GitHub n\'est pas valide';
  }
  
  const tagsArray = (data.tags || '').split(',').map(t => t.trim());
  if (tagsArray.some(tag => tag.length > 50)) {
    errors.tags = 'Chaque tag ne peut pas dépasser 50 caractères';
  }
  
  return errors;
}

// Skill validation
export function validateSkill(data: { name?: string; category?: string; level?: number }): ValidationErrors {
  const errors: ValidationErrors = {};
  
  if (!data.name || !data.name.trim()) {
    errors.name = 'Le nom de la compétence est obligatoire';
  } else if (data.name.trim().length < 2) {
    errors.name = 'Le nom doit contenir au moins 2 caractères';
  }
  
  const validCategories = ['Frontend', 'Backend', 'Design', 'DevOps', 'Autre'];
  if (!data.category || !validCategories.includes(data.category)) {
    errors.category = 'Veuillez sélectionner une catégorie valide';
  }
  
  if (typeof data.level !== 'number' || data.level < 0 || data.level > 100) {
    errors.level = 'Le niveau doit être un nombre entre 0 et 100';
  }
  
  return errors;
}

// Experience validation
export function validateExperience(data: {
  type?: 'work' | 'education';
  title?: string;
  company?: string;
  startDate?: string;
  endDate?: string;
  current?: boolean;
  description?: string;
}): ValidationErrors {
  const errors: ValidationErrors = {};
  
  const validTypes = ['work', 'education'];
  if (!data.type || !validTypes.includes(data.type)) {
    errors.type = 'Veuillez sélectionner un type valide';
  }
  
  if (!data.title || !data.title.trim()) {
    errors.title = 'Le titre est obligatoire';
  } else if (data.title.trim().length < 2) {
    errors.title = 'Le titre doit contenir au moins 2 caractères';
  }
  
  if (!data.company || !data.company.trim()) {
    errors.company = 'Le nom de l\'entreprise/école est obligatoire';
  }
  
  if (!data.startDate) {
    errors.startDate = 'La date de début est obligatoire';
  }
  
  if (!data.current && !data.endDate) {
    errors.endDate = 'La date de fin est obligatoire';
  }
  
  if (!data.current && data.startDate && data.endDate) {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    if (start > end) {
      errors.endDate = 'La date de fin doit être après la date de début';
    }
  }
  
  if (data.description && data.description.length > 2000) {
    errors.description = 'La description ne peut pas dépasser 2000 caractères';
  }
  
  return errors;
}

// Message reply validation
export function validateMessageReply(message?: string): ValidationErrors {
  const errors: ValidationErrors = {};
  
  if (!message || !message.trim()) {
    errors.message = 'Votre réponse ne peut pas être vide';
  } else if (message.trim().length < 2) {
    errors.message = 'Votre réponse est trop courte';
  } else if (message.length > 5000) {
    errors.message = 'Votre réponse ne peut pas dépasser 5000 caractères';
  }
  
  return errors;
}

// Auth validation
export function validateRegister(data: { name?: string; email?: string; password?: string }): ValidationErrors {
  const errors: ValidationErrors = {};
  
  if (!data.name || !data.name.trim()) {
    errors.name = 'Le nom est obligatoire';
  } else if (data.name.trim().length < 2) {
    errors.name = 'Le nom doit contenir au moins 2 caractères';
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!data.email || !data.email.trim()) {
    errors.email = 'L\'email est obligatoire';
  } else if (!emailRegex.test(data.email.trim())) {
    errors.email = 'L\'email n\'est pas valide';
  }
  
  if (!data.password) {
    errors.password = 'Le mot de passe est obligatoire';
  } else if (data.password.length < 6) {
    errors.password = 'Le mot de passe doit contenir au moins 6 caractères';
  }
  
  return errors;
}

// Login validation
export function validateLogin(data: { email?: string; password?: string }): ValidationErrors {
  const errors: ValidationErrors = {};
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!data.email || !data.email.trim()) {
    errors.email = 'L\'email est obligatoire';
  } else if (!emailRegex.test(data.email.trim())) {
    errors.email = 'L\'email n\'est pas valide';
  }
  
  if (!data.password) {
    errors.password = 'Le mot de passe est obligatoire';
  }
  
  return errors;
}
export function validateClientInvoice(data: {
  clientId?: string;
  invoiceNumber?: string;
  amount?: number;
  status?: string;
  issueDate?: string;
  dueDate?: string;
}): ValidationErrors {

  const errors: ValidationErrors = {};

  if (!data.clientId) {
    errors.clientId = "Le client est obligatoire";
  }

  if (
    !data.invoiceNumber ||
    !data.invoiceNumber.trim()
  ) {
    errors.invoiceNumber =
      "Le numéro de facture est obligatoire";
  }

  if (
    typeof data.amount !== "number" ||
    data.amount <= 0
  ) {
    errors.amount =
      "Le montant doit être supérieur à 0";
  }

  const validStatus = [
    "Payée",
    "En attente"
  ];

  if (
    !data.status ||
    !validStatus.includes(data.status)
  ) {
    errors.status = "Statut invalide";
  }

  if (!data.issueDate) {
    errors.issueDate =
      "La date d'émission est obligatoire";
  }

  if (!data.dueDate) {
    errors.dueDate =
      "La date d'échéance est obligatoire";
  }

  if (
    data.issueDate &&
    data.dueDate &&
    new Date(data.dueDate) <
      new Date(data.issueDate)
  ) {
    errors.dueDate =
      "La date d'échéance doit être postérieure";
  }

  return errors;
}
export function validateClientLocation(data: {
  clientId?: string;
  latitude?: number;
  longitude?: number;
}): ValidationErrors {

  const errors: ValidationErrors = {};

  if (!data.clientId) {
    errors.clientId = "Le client est obligatoire";
  }

  if (
    typeof data.latitude !== "number" ||
    data.latitude < -90 ||
    data.latitude > 90
  ) {
    errors.latitude =
      "Latitude comprise entre -90 et 90";
  }

  if (
    typeof data.longitude !== "number" ||
    data.longitude < -180 ||
    data.longitude > 180
  ) {
    errors.longitude =
      "Longitude comprise entre -180 et 180";
  }

  return errors;
}
export function validateClientTag(data: {
  clientId?: string;
  tagName?: string;
}): ValidationErrors {

  const errors: ValidationErrors = {};

  if (!data.clientId) {
    errors.clientId = "Le client est obligatoire";
  }

  if (!data.tagName || !data.tagName.trim()) {
    errors.tagName = "Le tag est obligatoire";
  } else if (data.tagName.length < 2) {
    errors.tagName = "Minimum 2 caractères";
  } else if (data.tagName.length > 30) {
    errors.tagName = "Maximum 30 caractères";
  }

  return errors;
}
export function validateClientEmail(data: {
  clientId?: string;
  senderEmail?: string;
  receiverEmail?: string;
  subject?: string;
  message?: string;
}): ValidationErrors {

  const errors: ValidationErrors = {};

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!data.clientId) {
    errors.clientId = "Le client est obligatoire";
  }

  if (
    !data.senderEmail ||
    !emailRegex.test(data.senderEmail)
  ) {
    errors.senderEmail = "Email expéditeur invalide";
  }

  if (
    !data.receiverEmail ||
    !emailRegex.test(data.receiverEmail)
  ) {
    errors.receiverEmail = "Email destinataire invalide";
  }

  if (!data.subject || !data.subject.trim()) {
    errors.subject = "Le sujet est obligatoire";
  }

  if (!data.message || !data.message.trim()) {
    errors.message = "Le message est obligatoire";
  } else if (data.message.length < 10) {
    errors.message = "Minimum 10 caractères";
  } else if (data.message.length > 5000) {
    errors.message = "Maximum 5000 caractères";
  }

  return errors;
}
export function validateClientReminder(data: {
  clientId?: string;
  title?: string;
  description?: string;
  reminderDate?: string;
  priority?: string;
}): ValidationErrors {

  const errors: ValidationErrors = {};

  if (!data.clientId) {
    errors.clientId = "Le client est obligatoire";
  }

  if (!data.title || !data.title.trim()) {
    errors.title = "Le titre est obligatoire";
  } else if (data.title.length < 3) {
    errors.title = "Minimum 3 caractères";
  }

  if (!data.reminderDate) {
    errors.reminderDate = "La date du rappel est obligatoire";
  }

  const validPriorities = [
    "Normale",
    "Haute",
    "Urgente"
  ];

  if (
    data.priority &&
    !validPriorities.includes(data.priority)
  ) {
    errors.priority = "Priorité invalide";
  }

  return errors;
}
export function validateClientDocument(data: {
  clientId?: string;
  documentName?: string;
  documentType?: string;
  fileUrl?: string;
  fileSize?: number;
}): ValidationErrors {

  const errors: ValidationErrors = {};

  if (!data.clientId) {
    errors.clientId = "Le client est obligatoire";
  }

  if (!data.documentName || !data.documentName.trim()) {
    errors.documentName = "Le nom du document est obligatoire";
  }

  const validTypes = [
    "Contrat",
    "Facture",
    "Devis",
    "Cahier des charges"
  ];

  if (
    !data.documentType ||
    !validTypes.includes(data.documentType)
  ) {
    errors.documentType = "Type de document invalide";
  }

  if (!data.fileUrl) {
    errors.fileUrl = "Veuillez sélectionner un fichier";
  }

  if (
    data.fileSize &&
    data.fileSize > 10485760
  ) {
    errors.fileSize = "La taille maximale est de 10 MB";
  }

  return errors;
}
export function validateClientComment(data: {
  clientId?: string;
  userId?: string;
  comment?: string;
}): ValidationErrors {

  const errors: ValidationErrors = {};

  if (!data.clientId) {
    errors.clientId = "Le client est obligatoire";
  }

  if (!data.userId) {
    errors.userId = "L'utilisateur est obligatoire";
  }

  if (!data.comment || !data.comment.trim()) {
    errors.comment = "Le commentaire est obligatoire";
  } else if (data.comment.length < 3) {
    errors.comment = "Minimum 3 caractères";
  } else if (data.comment.length > 1000) {
    errors.comment = "Maximum 1000 caractères";
  }

  return errors;
}

export function validateClientActivity(data: {
  clientId?: string;
  userId?: string;
  action?: string;
  description?: string;
}): ValidationErrors {

  const errors: ValidationErrors = {};

  if (!data.clientId) {
    errors.clientId = "Le client est obligatoire";
  }

  if (!data.userId) {
    errors.userId = "L'utilisateur est obligatoire";
  }

  const validActions = [
    "CREATE_CLIENT",
    "UPDATE_CLIENT",
    "SEND_EMAIL",
    "ADD_DOCUMENT",
    "CREATE_PROJECT"
  ];

  if (!data.action || !validActions.includes(data.action)) {
    errors.action = "Action invalide";
  }

  if (!data.description || !data.description.trim()) {
    errors.description = "La description est obligatoire";
  } else if (data.description.length < 5) {
    errors.description = "Minimum 5 caractères";
  } else if (data.description.length > 1000) {
    errors.description = "Maximum 1000 caractères";
  }

  return errors;
}