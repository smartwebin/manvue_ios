// API Configuration for Manvue App
export const API_CONFIG = {
  // Base URLs
  BASE_URL: "https://www.manvue.in/api",
  BASE_IMG_URL: "https://www.manvue.in/photos",
  // BASE_URL: "https://work.phpwebsites.in//manvue/api",
  // BASE_IMG_URL: "https://work.phpwebsites.in//manvue/photos",

  // API Endpoints
  ENDPOINTS: {
    // Jobseeker endpoints
    // Jobseeker endpoints
    SIGNUP: "/signup.php",
    LOGIN: "/login.php",
    PROFILE: "/profile.php",
    USER_DATA: "/profile.php", // User profile data endpoint (legacy)
    HOME: "/home.php", // New home dashboard endpoint
    GET_PROFILE: "/get-profile.php",
    UPDATE_PROFILE: "/update-profile.php",
    VERIFY_EMAIL: "/verify-email.php",
    RESEND_VERIFICATION: "/resend-verification.php",

    // Employer endpoints
    EMPLOYER_SIGNUP: "/employer-signup.php",
    EMPLOYER_LOGIN: "/employer-login.php",
    POST_JOB: "/post-job.php",
    GET_COMPANY: "/get-company.php",
    UPDATE_COMPANY: "/update-company.php",
    GET_JOBS: "/get-jobs.php",
    GET_MATCHING_CANDIDATES: "/get-matching-candidates.php",
    GET_JOB_BY_ID: "/get-job-by-id.php",
    UPDATE_JOB: "/update-job.php",
    DELETE_JOB: "/delete-job.php",

    // Job Proposal Endpoints (NEW - CORRECTED)
    GET_EMPLOYER_ACTIVE_JOBS: "/get_employer_active_jobs.php",
    SEND_JOB_PROPOSAL: "/send_job_proposal.php",
    GET_JOBSEEKER_PROPOSALS: "/get_jobseeker_proposals.php",
    RESPOND_TO_PROPOSAL: "/respond_to_proposal.php",
    GET_CANDIDATE_DETAILS: "/get_candidate_details.php",
    GET_APPLICATION_DETAILS: "/get_application_details",
    // Common endpoints
    JOBS: "/jobs.php",
    APPLICATIONS: "/applications.php",
    SKILLS: "/skills.php",
    GET_SKILLS: "/skills.php",
    GET_SKILL_SUGGESTIONS: "/get-skill-suggestions.php",
    COMPANIES: "/companies.php",
    MATCHES: "/matches.php",
    MESSAGES: "/messages.php",
    NOTIFICATIONS: "/notifications.php",
    UPLOAD: "/upload.php",

    // Razorpay Payment endpoints
    GET_SUBSCRIPTION_PLANS: "/get-subscription-plans.php",
    CREATE_RAZORPAY_ORDER: "/create-razorpay-order.php",
    VERIFY_RAZORPAY_PAYMENT: "/verify-razorpay-payment.php",
    GET_USER_SUBSCRIPTION: "/get-user-subscription.php",

    // Conversation/Chat Endpoints (NEW)
    GET_EMPLOYER_CONVERSATIONS: "/get_employer_conversations.php",
    GET_CONVERSATION_DETAILS: "/get_conversation_details.php",
    SEND_MESSAGE: "/send_message.php",
    MARK_MESSAGES_READ: "/mark_messages_read.php",
    BLOCK_CONVERSATION: "/block_conversation.php",

    // Chat/Messaging Endpoints (NEW)
    GET_CONVERSATION_MESSAGES: "/get_conversation_messages.php",
    SEND_MESSAGE: "/send_message.php",
    BLOCK_CONVERSATION: "/block_conversation.php",
    MARK_MESSAGES_READ: "/mark_messages_read.php",
    GET_CHAT_ATTACHMENTS: "/get_chat_attachments.php",

    // Conversation List Endpoints (EXISTING - from previous)
    GET_EMPLOYER_CONVERSATIONS: "/get_employer_conversations.php",
    GET_JOBSEEKER_CONVERSATIONS: "/get_jobseeker_conversations.php",

    JOBSEEKER_CHAT_LIST: "jobseeker_chat_list.php",
    GET_CONVERSATION_MESSAGES2: "get_conversation_messages2.php",
    SEND_MESSAGE2: "send_message2.php",
    // Matching Jobs Endpoint (NEW)
    GET_MATCHING_JOBS: "/get-matching-jobs.php",
    GET_JOB_DETAILS: "/get-job-details.php",
    SUBMIT_JOB_APPLICATION: "/submit-job-application.php",

    // Interview Endpoints
    GET_EMPLOYER_INTERVIEWS: "/get-employer-interviews.php",
    GET_JOBSEEKER_INTERVIEWS: "/get-jobseeker-interviews.php",
    SCHEDULE_INTERVIEW: "/schedule-interview.php",

    // Application Management Endpoints
    UPDATE_APPLICATION_STATUS: "/update-application-status.php",
    SELECT_CANDIDATE: "/select-candidate.php",

    // Notification endpoints
    GET_NOTIFICATIONS: "/get-notifications.php",
    MARK_NOTIFICATIONS_READ: "/mark-notifications-read.php",
    DELETE_NOTIFICATIONS: "/delete-notifications.php",
    // Page endpoints
    GET_PAGE: "/get-page.php",
    FORGOT_PASSWORD: "/forgot-password.php",
    RESET_PASSWORD: "/reset-password.php",
  },

  // Request headers
  HEADERS: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },

  // File upload headers
  UPLOAD_HEADERS: {
    "Content-Type": "multipart/form-data",
    Accept: "application/json",
  },

  // Request timeout
  TIMEOUT: 30000, // 30 seconds

  // Authentication key (if required)
  AUTH_KEY: "your_auth_key_here", // Replace with actual auth key

  // Basic Authentication credentials
  BASIC_AUTH: {
    USERNAME: "swebapuser",
    PASSWORD: "2074@seb#209Y",
  },
};

// Image URL helper function
export const getImageUrl = (imageName, size = "large") => {
  if (!imageName) return null;

  const sizeUrls = {
    large: "https://work.phpwebsites.in//manvue/photos/large",
    medium: "https://work.phpwebsites.in//manvue/photos/medium",
    small: "https://work.phpwebsites.in//manvue/photos/small",
  };

  return `${sizeUrls[size] || sizeUrls.large}/${imageName}`;
};

// API URL helper function
export const getApiUrl = (endpoint) => {
  return `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS[endpoint] || endpoint}`;
};

// Logging functions for debugging
export const logApiRequest = (method, url, body) => {
  if (__DEV__) {
    console.log(`🚀 API Request: ${method} ${url}`, body ? { body } : "");
  }
};

export const logApiResponse = (url, data) => {
  if (__DEV__) {
    console.log(`📦 API Response: ${url}`, data);
  }
};

// File validation helper
export const validateFile = (file, type = "image") => {
  if (!file || !file.uri) {
    return {
      isValid: false,
      errors: ["No file selected"],
    };
  }

  const maxSizes = {
    image: 5 * 1024 * 1024, // 5MB
    document: 10 * 1024 * 1024, // 10MB
  };

  const allowedTypes = {
    image: ["image/jpeg", "image/jpg", "image/png"],
    document: [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ],
  };

  const errors = [];

  // Check file size if available
  if (file.fileSize && file.fileSize > maxSizes[type]) {
    errors.push(
      `File size must be less than ${maxSizes[type] / (1024 * 1024)}MB`,
    );
  }

  // Check file type if available
  if (file.mimeType && !allowedTypes[type].includes(file.mimeType)) {
    errors.push(
      `Invalid file type. Allowed types: ${allowedTypes[type].join(", ")}`,
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export default API_CONFIG;
