import axios from "axios";
import * as SecureStore from "expo-secure-store";
import { API_CONFIG } from "../config/api";

// Create axios instance
export const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: API_CONFIG.HEADERS,
  // Add basic authentication
  auth: {
    username: API_CONFIG.BASIC_AUTH.USERNAME,
    password: API_CONFIG.BASIC_AUTH.PASSWORD,
  },
});

// Request interceptor to add auth headers
apiClient.interceptors.request.use(
  async (config) => {
    // Add auth key if required
    if (API_CONFIG.AUTH_KEY) {
      config.headers["Auth-Key"] = API_CONFIG.AUTH_KEY;
    }

    // Add JWT token if available
    try {
      const token = await SecureStore.getItemAsync("jwt_token");
      if (token) {
        config.headers["Authorization"] = `Bearer ${token}`;
      }
    } catch (error) {
      console.log("Failed to get token from SecureStore:", error);
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle common errors
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;

      switch (status) {
        case 401:
          // Unauthorized - clear token and redirect to login
          clearStoredToken();
          break;
        case 422:
          // Validation errors
          break;
        case 500:
          // Server error
          break;
        default:
          break;
      }

      return Promise.reject(data || error.response);
    } else if (error.request) {
      // Network error
      return Promise.reject({
        message: "Network error. Please check your connection.",
        type: "network_error",
      });
    } else {
      // Other error
      return Promise.reject({
        message: "Something went wrong. Please try again.",
        type: "unknown_error",
      });
    }
  },
);

// Token management functions using SecureStore
export const getStoredToken = async () => {
  try {
    return await SecureStore.getItemAsync("jwt_token");
  } catch (error) {
    console.log("Failed to get token from SecureStore:", error);
    return null;
  }
};

export const setStoredToken = async (token) => {
  try {
    await SecureStore.setItemAsync("jwt_token", token);
    return true;
  } catch (error) {
    console.log("Failed to store token:", error);
    return false;
  }
};

export const clearStoredToken = async () => {
  try {
    await SecureStore.deleteItemAsync("jwt_token");
    return true;
  } catch (error) {
    console.log("Failed to clear token:", error);
    return false;
  }
};

// User type management functions using SecureStore
export const getStoredUserType = async () => {
  try {
    return await SecureStore.getItemAsync("user_type");
  } catch (error) {
    console.log("Failed to get user type from SecureStore:", error);
    return null;
  }
};

export const setStoredUserType = async (userType) => {
  try {
    await SecureStore.setItemAsync("user_type", userType);
    return true;
  } catch (error) {
    console.log("Failed to store user type:", error);
    return false;
  }
};

export const clearStoredUserType = async () => {
  try {
    await SecureStore.deleteItemAsync("user_type");
    return true;
  } catch (error) {
    console.log("Failed to clear user type:", error);
    return false;
  }
};

// User ID management functions using SecureStore
export const getStoredUserId = async () => {
  try {
    return await SecureStore.getItemAsync("user_id");
  } catch (error) {
    console.log("Failed to get user ID from SecureStore:", error);
    return null;
  }
};

export const setStoredUserId = async (userId) => {
  try {
    await SecureStore.setItemAsync("user_id", userId.toString());
    return true;
  } catch (error) {
    console.log("Failed to store user ID:", error);
    return false;
  }
};

export const clearStoredUserId = async () => {
  try {
    await SecureStore.deleteItemAsync("user_id");
    return true;
  } catch (error) {
    console.log("Failed to clear user ID:", error);
    return false;
  }
};

// API Service class
class ApiService {
  // Test signup with simple JSON first
  async testSignup(userData) {
    try {
      console.log("🧪 Testing simple JSON signup...");
      const response = await apiClient.post(
        API_CONFIG.ENDPOINTS.SIGNUP,
        userData,
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        },
      );

      return {
        success: true,
        data: response.data.data,
        token: response.data.jwt_token,
        message: response.data.message,
      };
    } catch (error) {
      console.log("🧪 JSON test failed, trying FormData...");
      return null; // Fall back to FormData method
    }
  }

  // Signup API
  async signup(userData) {
    try {
      // Ensure userData is FormData
      let formData;
      if (userData instanceof FormData) {
        formData = userData;
      } else {
        formData = new FormData();
        // Add all form fields
        Object.keys(userData).forEach((key) => {
          if (key === "skills" && Array.isArray(userData[key])) {
            formData.append("skills", JSON.stringify(userData[key]));
          } else if (
            key === "preferred_locations" &&
            Array.isArray(userData[key])
          ) {
            formData.append(
              "preferred_locations",
              JSON.stringify(userData[key]),
            );
          } else if (
            key === "job_type_preference" &&
            Array.isArray(userData[key])
          ) {
            formData.append(
              "job_type_preference",
              JSON.stringify(userData[key]),
            );
          } else if (
            key === "work_mode_preference" &&
            Array.isArray(userData[key])
          ) {
            formData.append(
              "work_mode_preference",
              JSON.stringify(userData[key]),
            );
          } else if (key === "educationList" && Array.isArray(userData[key])) {
            formData.append("educationList", JSON.stringify(userData[key]));
          } else if (key === "workList" && Array.isArray(userData[key])) {
            formData.append("workList", JSON.stringify(userData[key]));
          } else if (key === "profile_image" && userData[key]) {
            formData.append("profile_image", userData[key]);
          } else if (userData[key] !== null && userData[key] !== undefined) {
            formData.append(key, userData[key]);
          }
        });
      }

      // Log the FormData contents for debugging
      if (__DEV__) {
        console.log("🚀 Signup FormData contents:");
        for (let [key, value] of formData.entries()) {
          if (key === "profile_image") {
            console.log(`${key}:`, "File object");
          } else {
            console.log(`${key}:`, value);
          }
        }
      }

      // Important: Don't set Content-Type header for FormData
      // Axios will automatically set it with correct boundary
      const response = await apiClient.post(
        API_CONFIG.ENDPOINTS.SIGNUP,
        formData,
        {
          headers: {
            // Remove Content-Type - let axios handle it automatically
            Accept: "application/json",
          },
        },
      );

      if (__DEV__) {
        console.log("✅ Signup API Response:", response.data);
      }

      // Store JWT token if provided
      if (response.data?.jwt_token || response.data?.token) {
        const token = response.data.jwt_token || response.data.token;
        await SecureStore.setItemAsync("jwt_token", token);
      }

      return {
        success: response.data?.success || false,
        data: response.data?.data || {},
        token: response.data?.jwt_token || response.data?.token || null,
        message: response.data?.message || "Signup successful",
        payment_required: response.data?.payment_required || false,
        errors: response.data?.errors || [],
      };
    } catch (error) {
      // Enhanced error logging
      if (__DEV__) {
        console.log("❌ Signup API Error Details:");
        if (error.response) {
          console.log("❌ Status:", error.response.status);
          console.log("❌ Data:", error.response.data);
          console.log("❌ Message:", error.response.data?.message);
          console.log("❌ Errors:", error.response.data?.errors);
        } else if (error.request) {
          console.log("❌ No response received:", error.request);
        } else {
          console.log("❌ Error:", error.message);
        }
      }

      // Extract error details from response
      const errorData = error.response?.data || {};

      return {
        success: false,
        errors: errorData?.errors || [error.message || "Signup failed"],
        message:
          errorData?.message ||
          error.message ||
          "Registration failed. Please try again.",
        data: null,
        payment_required: false,
      };
    }
  }

  // Employer Signup API
  async employerSignup(companyData) {
    try {
      if (__DEV__) {
        console.log("🏢 Employer Signup Request:", companyData);
      }

      const response = await apiClient.post(
        API_CONFIG.ENDPOINTS.EMPLOYER_SIGNUP,
        companyData,
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        },
      );

      if (__DEV__) {
        console.log("🏢 Employer Signup Response:", response.data);
      }

      // Store JWT token if provided
      if (response.data.jwt_token) {
        await setStoredToken(response.data.jwt_token);
      }

      // Store user data from login response
      if (response.data.data) {
        // Store user_id
        if (response.data.data.user_id) {
          await setStoredUserId(response.data.data.user_id);
        }

        // Store user_type (employer)
        await setStoredUserType("employer");

        // Store company_id for employer
        if (
          response.data.data.company &&
          response.data.data.company.company_id
        ) {
          try {
            await SecureStore.setItemAsync(
              "company_id",
              response.data.data.company.company_id.toString(),
            );
          } catch (storageError) {
            console.log("Failed to store company_id:", storageError);
          }
        }

        // Store additional user profile data in SecureStore
        const userData = response.data.data;
        try {
          await SecureStore.setItemAsync(
            "user_name",
            `${userData.first_name} ${userData.last_name}` || "",
          );
          await SecureStore.setItemAsync("user_email", userData.email || "");
          await SecureStore.setItemAsync("user_phone", userData.phone || "");
          await SecureStore.setItemAsync("user_status", userData.status || "");
          await SecureStore.setItemAsync(
            "profile_image",
            userData.profile_image || "",
          );
        } catch (storageError) {
          console.log("Failed to store user profile data:", storageError);
        }
      }

      // Check if the response indicates success
      if (response.data.success) {
        return {
          success: true,
          data: response.data.data,
          token: response.data.jwt_token,
          message: response.data.message,
        };
      } else {
        // Backend returned errors in success response (shouldn't happen but handle it)
        return {
          success: false,
          errors: response.data.errors || [
            response.data.message || "Registration failed",
          ],
          message: response.data.message || "Registration failed",
        };
      }
    } catch (error) {
      if (__DEV__) {
        console.error("❌ Employer Signup Error:", error);
        if (error.response) {
          console.error("❌ Error Response Status:", error.response.status);
          console.error("❌ Error Response Data:", error.response.data);
        }
      }

      // Handle different error scenarios
      if (error.response) {
        // Server responded with error status (422, 500, etc.)
        return {
          success: false,
          errors: error.response.data?.errors || [
            error.response.data?.message || "Registration failed",
          ],
          message: error.response.data?.message || "Registration failed",
        };
      } else if (error.request) {
        // Request was made but no response received (network error)
        return {
          success: false,
          errors: ["Network error. Please check your internet connection."],
          message: "Network error. Please check your internet connection.",
        };
      } else {
        // Something else went wrong
        return {
          success: false,
          errors: [error.message || "An unexpected error occurred"],
          message: error.message || "An unexpected error occurred",
        };
      }
    }
  }

  // Employer Login API
  async employerLogin(credentials) {
    try {
      if (__DEV__) {
        console.log("🏢 Employer Login Request:", {
          emailOrMobile: credentials.emailOrMobile,
        });
      }

      const response = await apiClient.post(
        API_CONFIG.ENDPOINTS.EMPLOYER_LOGIN,
        credentials,
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        },
      );

      if (__DEV__) {
        console.log("🏢 Employer Login Response:", response.data);
      }

      // Store JWT token if provided
      if (response.data.jwt_token) {
        await setStoredToken(response.data.jwt_token);
      }

      // Store user data from login response
      if (response.data.data) {
        // Store user_id
        if (response.data.data.user_id) {
          await setStoredUserId(response.data.data.user_id);
        }

        // Store user_type (employer)
        await setStoredUserType("employer");

        // Store company_id for employer
        if (
          response.data.data.company &&
          response.data.data.company.company_id
        ) {
          try {
            await SecureStore.setItemAsync(
              "company_id",
              response.data.data.company.company_id.toString(),
            );
          } catch (storageError) {
            console.log("Failed to store company_id:", storageError);
          }
        }

        // Store additional user profile data in SecureStore
        const userData = response.data.data;
        try {
          await SecureStore.setItemAsync(
            "user_name",
            `${userData.first_name} ${userData.last_name}` || "",
          );
          await SecureStore.setItemAsync("user_email", userData.email || "");
          await SecureStore.setItemAsync("user_phone", userData.phone || "");
          await SecureStore.setItemAsync("user_status", userData.status || "");
          await SecureStore.setItemAsync(
            "profile_image",
            userData.profile_image || "",
          );
        } catch (storageError) {
          console.log("Failed to store user profile data:", storageError);
        }
      }

      return {
        success: true,
        data: response.data.data,
        token: response.data.jwt_token,
        message: response.data.message,
      };
    } catch (error) {
      if (__DEV__) {
        console.log("❌ Employer Login Error:", error);
        if (error.response) {
          console.log("❌ Error Response Status:", error.response.status);
          console.log("❌ Error Response Data:", error.response.data);
        }
      }

      return {
        success: false,
        errors: error.response?.data?.errors ||
          error.data?.data?.errors || [error.message || "Login failed"],
        message:
          error.response?.data?.message ||
          error.data?.message ||
          "Invalid credentials or login failed",
      };
    }
  }

  // Login API for jobseekers
  async login(credentials) {
    try {
      if (__DEV__) {
        console.log("🔑 Login Request:", {
          email: credentials.emailOrMobile,
          user_type: credentials.user_type,
        });
      }

      const response = await apiClient.post(
        API_CONFIG.ENDPOINTS.LOGIN,
        credentials,
      );

      if (__DEV__) {
        console.log("🔑 Login Response:", response.data);
      }

      // Store JWT token if provided
      if (response.data.jwt_token) {
        await setStoredToken(response.data.jwt_token);
      }

      console.log("response.data", response.data);
      // Store user data from login response
      if (response.data.data) {
        // Store user_id
        if (response.data.data.user_id) {
          await setStoredUserId(response.data.data.user_id);
        }

        // Store user_type
        if (response.data.data.user_type) {
          await setStoredUserType(response.data.data.user_type);
        }

        // Store additional user profile data in SecureStore
        const userData = response.data.data;
        try {
          await SecureStore.setItemAsync(
            "user_first_name",
            userData.first_name || "",
          );
          await SecureStore.setItemAsync(
            "user_last_name",
            userData.last_name || "",
          );
          await SecureStore.setItemAsync("user_email", userData.email || "");
          await SecureStore.setItemAsync("user_phone", userData.phone || "");
          await SecureStore.setItemAsync("user_status", userData.status || "");
          await SecureStore.setItemAsync(
            "profile_image",
            userData.profile_image || "",
          );

          // Store subscription data (for jobseekers only)
          if (userData.subscription) {
            await SecureStore.setItemAsync(
              "subscription_status",
              userData.subscription.has_active_subscription
                ? "active"
                : "inactive",
            );

            if (userData.subscription.subscription_id) {
              await SecureStore.setItemAsync(
                "subscription_id",
                userData.subscription.subscription_id.toString(),
              );
            }

            if (userData.subscription.end_date) {
              await SecureStore.setItemAsync(
                "subscription_end_date",
                userData.subscription.end_date,
              );
            }
          } else {
            // No subscription data returned, set as inactive
            await SecureStore.setItemAsync("subscription_status", "inactive");
          }
        } catch (storageError) {
          console.log("Failed to store user profile data:", storageError);
        }
      }

      return {
        success: true,
        data: response.data.data,
        token: response.data.jwt_token,
        message: response.data.message,
      };
    } catch (error) {
      if (__DEV__) {
        console.log("❌ Login API Error:", error);
        if (error.response) {
          console.log("❌ Error Response Status:", error.response.status);
          console.log("❌ Error Response Data:", error.response.data);
        }
      }

      return {
        success: false,
        errors: error.response?.data?.errors ||
          error.data?.data?.errors || [error.message || "Login failed"],
        message:
          error.response?.data?.message ||
          error.data?.message ||
          "Invalid credentials or login failed",
      };
    }
  }

  // Get user profile (legacy method)
  async getProfile(userId) {
    try {
      const response = await apiClient.get(
        `${API_CONFIG.ENDPOINTS.PROFILE}?user_id=${userId}`,
      );

      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      return {
        success: false,
        errors: error.data?.data?.errors || [
          error.message || "Failed to get profile",
        ],
        message: error.data?.message || "Failed to get profile",
      };
    }
  }

  // Get comprehensive profile data
  async getFullProfile(userId) {
    try {
      if (__DEV__) {
        console.log(
          "📊 Getting Full Profile for userId:",
          userId,
          typeof userId,
        );
      }

      if (!userId) {
        return {
          success: false,
          errors: ["User ID is required"],
          message: "User ID is required",
          data: null,
        };
      }

      const requestData = {
        user_id: parseInt(userId), // Ensure it's an integer
      };

      if (__DEV__) {
        console.log("📤 Full Profile Request Data:", requestData);
      }

      const response = await apiClient.post(
        API_CONFIG.ENDPOINTS.GET_PROFILE,
        requestData,
      );

      if (__DEV__) {
        console.log("👤 Full Profile Response:", response.data);
      }

      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      if (__DEV__) {
        console.log("❌ Get Full Profile Error:", error);
        if (error.response) {
          console.log("❌ Error Response Status:", error.response.status);
          console.log("❌ Error Response Data:", error.response.data);
        }
      }

      return {
        success: false,
        errors: error.response?.data?.errors ||
          error.data?.data?.errors || [
            error.message || "Failed to get profile data",
          ],
        message:
          error.response?.data?.message ||
          error.data?.message ||
          "Failed to get profile data",
        data: null,
      };
    }
  }

  // Update specific profile field
  async updateProfileField(userId, fieldName, fieldValue) {
    console.log("updateProfileField", fieldValue);
    try {
      if (__DEV__) {
        console.log("✏️ Updating Profile Field:", {
          userId,
          fieldName,
          fieldValue,
        });
      }

      if (!userId) {
        return {
          success: false,
          errors: ["User ID is required"],
          message: "User ID is required",
          data: null,
        };
      }

      const requestData = {
        user_id: parseInt(userId), // Ensure it's an integer
        field_name: fieldName,
        field_value: fieldValue,
      };

      if (__DEV__) {
        console.log("📤 Update Profile Request Data:", requestData);
      }

      const response = await apiClient.post(
        API_CONFIG.ENDPOINTS.UPDATE_PROFILE,
        requestData,
      );

      if (__DEV__) {
        console.log("✏️ Update Profile Field Response:", response.data);
      }

      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
        requiresApproval: response.data.requires_approval || false,
      };
    } catch (error) {
      if (__DEV__) {
        console.log("❌ Update Profile Field Error:", error);
        if (error.response) {
          console.log("❌ Error Response Status:", error.response.status);
          console.log("❌ Error Response Data:", error.response.data);
        }
      }

      return {
        success: false,
        errors: error.response?.data?.errors ||
          error.data?.data?.errors || [
            error.message || "Failed to update profile field",
          ],
        message:
          error.response?.data?.message ||
          error.data?.message ||
          "Failed to update profile field",
        data: null,
      };
    }
  }

  // Get user data for home screen (legacy method)
  async getUserData(userId, userType = null) {
    try {
      const params = new URLSearchParams({ user_id: userId });
      if (userType) {
        params.append("user_type", userType);
      }

      const response = await apiClient.get(
        `${API_CONFIG.ENDPOINTS.USER_DATA}?${params.toString()}`,
      );

      if (__DEV__) {
        console.log("👤 User Data Response:", response.data);
      }

      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      if (__DEV__) {
        console.log("❌ Get User Data Error:", error);
        if (error.response) {
          console.log("❌ Error Response Status:", error.response.status);
          console.log("❌ Error Response Data:", error.response.data);
        }
      }

      return {
        success: false,
        errors: error.response?.data?.errors ||
          error.data?.data?.errors || [
            error.message || "Failed to get user data",
          ],
        message:
          error.response?.data?.message ||
          error.data?.message ||
          "Failed to get user data",
        data: null,
      };
    }
  }

  // Get comprehensive home dashboard data
  async getHomeDashboard(userId, userType = null) {
    try {
      if (__DEV__) {
        console.log(
          "🏠 Getting Home Dashboard for userId:",
          userId,
          "userType:",
          userType,
        );
      }

      if (!userId) {
        return {
          success: false,
          errors: ["User ID is required"],
          message: "User ID is required",
          data: null,
        };
      }

      const requestData = {
        user_id: parseInt(userId), // Ensure it's an integer
      };

      if (userType) {
        requestData.user_type = userType;
      }

      if (__DEV__) {
        console.log("📤 Home Dashboard Request Data:", requestData);
      }

      const response = await apiClient.post(
        API_CONFIG.ENDPOINTS.HOME,
        requestData,
      );

      // if (__DEV__) {
      //   console.log("🏠 Home Dashboard Response:", response.data);
      // }

      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      if (__DEV__) {
        console.log("❌ Get Home Dashboard Error:", error);
        if (error.response) {
          console.log("❌ Error Response Status:", error.response.status);
          console.log("❌ Error Response Data:", error.response.data);
        }
      }

      return {
        success: false,
        errors: error.response?.data?.errors ||
          error.data?.data?.errors || [
            error.message || "Failed to get home dashboard data",
          ],
        message:
          error.response?.data?.message ||
          error.data?.message ||
          "Failed to get home dashboard data",
        data: null,
      };
    }
  }

  // Update profile
  async updateProfile(userData) {
    try {
      const formData = new FormData();

      Object.keys(userData).forEach((key) => {
        if (key === "profile_image" && userData[key]) {
          formData.append("profile_image", userData[key]);
        } else if (userData[key] !== null && userData[key] !== undefined) {
          formData.append(key, userData[key]);
        }
      });

      const response = await apiClient.post(
        API_CONFIG.ENDPOINTS.PROFILE,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Accept: "application/json",
          },
        },
      );

      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      return {
        success: false,
        errors: error.data?.data?.errors || [error.message || "Update failed"],
        message: error.data?.message || "Update failed",
      };
    }
  }

  // Get skills list
  async getSkills(category = null) {
    try {
      const url = category
        ? `${API_CONFIG.ENDPOINTS.SKILLS}?category=${category}`
        : API_CONFIG.ENDPOINTS.SKILLS;

      const response = await apiClient.get(url);

      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      return {
        success: false,
        errors: error.data?.data?.errors || [
          error.message || "Failed to get skills",
        ],
        message: error.data?.message || "Failed to get skills",
      };
    }
  }

  /**
   * Get AI-Powered Skill Suggestions
   * @param {Object} params - { search_term, context_type, user_id }
   * @returns {Promise} - Array of AI-suggested skills
   */
  async getSkillSuggestions(params) {
    try {
      if (__DEV__) {
        console.log("🤖 Get AI Skill Suggestions Request:", params);
      }

      const requestData = {
        search_term: params.search_term || params.searchTerm || "",
        context_type: params.context_type || params.contextType || "general",
        user_id: params.user_id || params.userId || null,
      };

      // Validate search term
      if (
        !requestData.search_term ||
        requestData.search_term.trim().length < 2
      ) {
        return {
          success: false,
          errors: ["Search term must be at least 2 characters long"],
          message: "Search term is too short",
          data: { suggestions: [] },
        };
      }

      const response = await apiClient.post(
        API_CONFIG.ENDPOINTS.GET_SKILL_SUGGESTIONS,
        requestData,
      );

      if (__DEV__) {
        console.log("🤖 Get AI Skill Suggestions Response:", response.data);
      }

      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      if (__DEV__) {
        console.log("❌ Get AI Skill Suggestions Error:", error);
        if (error.response) {
          console.log("❌ Error Response Status:", error.response.status);
          console.log("❌ Error Response Data:", error.response.data);
        }
      }

      return {
        success: false,
        errors: error.response?.data?.errors ||
          error.data?.data?.errors || [
            error.message || "Failed to get skill suggestions",
          ],
        message:
          error.response?.data?.message ||
          error.data?.message ||
          "Failed to get AI skill suggestions",
        data: { suggestions: [] },
      };
    }
  }

  // Get jobs
  async getJobs(filters = {}) {
    try {
      const queryParams = new URLSearchParams(filters).toString();
      const url = queryParams
        ? `${API_CONFIG.ENDPOINTS.JOBS}?${queryParams}`
        : API_CONFIG.ENDPOINTS.JOBS;

      const response = await apiClient.get(url);

      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      return {
        success: false,
        errors: error.data?.data?.errors || [
          error.message || "Failed to get jobs",
        ],
        message: error.data?.message || "Failed to get jobs",
      };
    }
  }

  // Apply for job
  async applyForJob(applicationData) {
    try {
      const formData = new FormData();

      Object.keys(applicationData).forEach((key) => {
        if (key === "resume_file" && applicationData[key]) {
          formData.append("resume_file", applicationData[key]);
        } else if (
          applicationData[key] !== null &&
          applicationData[key] !== undefined
        ) {
          formData.append(key, applicationData[key]);
        }
      });

      const response = await apiClient.post(
        API_CONFIG.ENDPOINTS.APPLICATIONS,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Accept: "application/json",
          },
        },
      );

      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      return {
        success: false,
        errors: error.data?.data?.errors || [
          error.message || "Application failed",
        ],
        message: error.data?.message || "Application failed",
      };
    }
  }

  // Post Job API (Employer)
  async postJob(jobData) {
    try {
      if (__DEV__) {
        console.log("💼 Post Job Request:", jobData);
      }

      const response = await apiClient.post(
        API_CONFIG.ENDPOINTS.POST_JOB,
        jobData,
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        },
      );

      if (__DEV__) {
        console.log("💼 Post Job Response:", response.data);
      }

      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      if (__DEV__) {
        console.log("❌ Post Job Error:", error);
        if (error.response) {
          console.log("❌ Error Response Status:", error.response.status);
          console.log("❌ Error Response Data:", error.response.data);
        }
      }

      return {
        success: false,
        errors: error.response?.data?.errors ||
          error.data?.data?.errors || [error.message || "Failed to post job"],
        message:
          error.response?.data?.message ||
          error.data?.message ||
          "Failed to post job",
      };
    }
  }

  // Get Company Profile
  async getCompanyProfile(userId, companyId) {
    try {
      if (__DEV__) {
        console.log("🏢 Get Company Profile Request:", { userId, companyId });
      }

      const response = await apiClient.post(
        API_CONFIG.ENDPOINTS.GET_COMPANY,
        {
          userId: parseInt(userId),
          companyId: companyId ? parseInt(companyId) : null,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        },
      );

      // if (__DEV__) {
      //   console.log("🏢 Get Company Profile Response:", response.data);
      // }

      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      if (__DEV__) {
        console.log("❌ Get Company Profile Error:", error);
        if (error.response) {
          console.log("❌ Error Response Status:", error.response.status);
          console.log("❌ Error Response Data:", error.response.data);
        }
      }

      return {
        success: false,
        errors: error.response?.data?.errors ||
          error.data?.data?.errors || [
            error.message || "Failed to get company profile",
          ],
        message:
          error.response?.data?.message ||
          error.data?.message ||
          "Failed to get company profile",
        data: null,
      };
    }
  }

  /**
   * Update Company Field (Supports normal + profile image upload)
   */
  async updateCompanyField(companyId, userId, fieldName, fieldValue) {
    try {
      const isFileUpload =
        fieldValue && typeof fieldValue === "object" && fieldValue.uri;

      const formData = new FormData();
      formData.append("companyId", companyId.toString());
      formData.append("userId", userId.toString());
      formData.append("fieldName", fieldName);

      if (isFileUpload) {
        // ✅ For image uploads, add empty fieldValue (required by backend)
        formData.append("fieldValue", "");

        // Add the actual image file
        formData.append("profile_image", {
          uri: fieldValue.uri,
          type: fieldValue.mimeType || fieldValue.type || "image/jpeg",
          name:
            fieldValue.fileName ||
            fieldValue.name ||
            `company_logo_${Date.now()}.jpg`,
        });

        if (__DEV__) {
          console.log("📤 Uploading file:", {
            fieldName,
            uri: fieldValue.uri,
            type: fieldValue.mimeType || fieldValue.type,
            name: fieldValue.fileName || fieldValue.name,
          });
        }
      } else {
        // Normal text/field update
        formData.append("fieldValue", fieldValue.toString());
      }

      // ✅ Send request - axios will auto-set Content-Type with boundary
      const response = await apiClient.post(
        API_CONFIG.ENDPOINTS.UPDATE_COMPANY,
        formData,
        {
          headers: {
            Accept: "application/json",
            "Content-Type": "multipart/form-data",
          },
        },
      );

      if (__DEV__) {
        console.log("✅ Update Company Field Response:", response.data);
      }

      return {
        success: response.data.success,
        data: response.data.data,
        message: response.data.message,
        requires_approval: response.data.requires_approval || false,
      };
    } catch (error) {
      if (__DEV__) {
        console.error("❌ Update Company Field Error:", error);
        if (error.response) {
          console.error("❌ Status:", error.response.status);
          console.error("❌ Data:", error.response.data);
          console.error("❌ Headers:", error.response.headers);
        }
      }

      return {
        success: false,
        errors: error.response?.data?.errors || [
          error.message || "Failed to update company field",
        ],
        message:
          error.response?.data?.message || "Failed to update company field",
        data: null,
      };
    }
  }

  async updateCompanyFieldViaForm(formData) {
    console.log("🚀 updateCompanyFieldViaForm called with:", formData);
    try {
      const response = await apiClient.post(
        API_CONFIG.ENDPOINTS.UPDATE_COMPANY,
        formData,
        {
          headers: {
            Accept: "application/json",
          },
        },
      );
      console.log("✅ Update Company Field Response:", response);
      return response.data;
    } catch (error) {
      return (
        error.response?.data || {
          success: false,
          message: "Upload failed",
        }
      );
    }
  }

  // Get Jobs (Employer)
  async getJobs(companyId, userId, filters = {}) {
    try {
      if (__DEV__) {
        // console.log("💼 Get Jobs Request:", { companyId, userId, filters });
      }

      const requestData = {
        companyId: companyId ? parseInt(companyId) : null,
        userId: userId ? parseInt(userId) : null,
        status: filters.status || "all",
        searchQuery: filters.searchQuery || "",
        limit: filters.limit || 100,
        offset: filters.offset || 0,
      };

      const response = await apiClient.post(
        API_CONFIG.ENDPOINTS.GET_JOBS,
        requestData,
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        },
      );

      if (__DEV__) {
        console.log("💼 Get Jobs Response:", response.data);
      }

      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      if (__DEV__) {
        console.log("❌ Get Jobs Error:", error);
        if (error.response) {
          console.log("❌ Error Response Status:", error.response.status);
          console.log("❌ Error Response Data:", error.response.data);
        }
      }

      return {
        success: false,
        errors: error.response?.data?.errors ||
          error.data?.data?.errors || [error.message || "Failed to get jobs"],
        message:
          error.response?.data?.message ||
          error.data?.message ||
          "Failed to get jobs",
        data: null,
      };
    }
  }

  // Verify Email API
  async verifyEmail(data) {
    try {
      if (__DEV__) {
        console.log("📧 Verify Email Request:", {
          email: data.email,
          user_type: data.user_type,
        });
      }

      const response = await apiClient.post(
        API_CONFIG.ENDPOINTS.VERIFY_EMAIL,
        data,
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        },
      );

      if (__DEV__) {
        console.log("📧 Verify Email Response:", response.data);
      }

      return {
        success: true,
        data: response.data.data,
        token: response.data.token || response.data.jwt_token,
        payment_required: response.data.payment_required || false,
        message: response.data.message,
      };
    } catch (error) {
      if (__DEV__) {
        console.log("❌ Verify Email Error:", error);
        if (error.response) {
          console.log("❌ Error Response Status:", error.response.status);
          console.log("❌ Error Response Data:", error.response.data);
        }
      }

      return {
        success: false,
        errors: error.response?.data?.errors ||
          error.data?.data?.errors || [error.message || "Verification failed"],
        message:
          error.response?.data?.message ||
          error.data?.message ||
          "Invalid verification code",
      };
    }
  }

  // Resend Verification Code API
  async resendVerificationCode(data) {
    try {
      if (__DEV__) {
        console.log("🔄 Resend Verification Code Request:", {
          email: data.email,
          user_type: data.user_type,
        });
      }

      const response = await apiClient.post(
        API_CONFIG.ENDPOINTS.RESEND_VERIFICATION,
        data,
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        },
      );

      if (__DEV__) {
        console.log("🔄 Resend Verification Code Response:", response.data);
      }

      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      if (__DEV__) {
        console.log("❌ Resend Verification Code Error:", error);
        if (error.response) {
          console.log("❌ Error Response Status:", error.response.status);
          console.log("❌ Error Response Data:", error.response.data);
        }
      }

      return {
        success: false,
        errors: error.response?.data?.errors ||
          error.data?.data?.errors || [
            error.message || "Failed to resend code",
          ],
        message:
          error.response?.data?.message ||
          error.data?.message ||
          "Failed to resend verification code",
      };
    }
  }

  // Logout
  async logout() {
    try {
      // Clear all stored user data
      await Promise.all([
        clearStoredToken(),
        clearStoredUserType(),
        clearStoredUserId(),
      ]);

      // Clear all user profile data
      await Promise.all([
        SecureStore.deleteItemAsync("user_email"),
        SecureStore.deleteItemAsync("user_first_name"),
        SecureStore.deleteItemAsync("user_last_name"),
        SecureStore.deleteItemAsync("user_status"),
        SecureStore.deleteItemAsync("user_phone"),
        SecureStore.deleteItemAsync("user_name"),
        SecureStore.deleteItemAsync("profile_image"),
      ]);

      // Clear subscription data (for jobseekers)
      await Promise.all([
        SecureStore.deleteItemAsync("subscription_status"),
        SecureStore.deleteItemAsync("subscription_id"),
        SecureStore.deleteItemAsync("subscription_end_date"),
      ]);

      // Clear company data (for employers)
      await SecureStore.deleteItemAsync("company_id");

      if (__DEV__) {
        console.log("✅ All user data cleared successfully");
      }

      return {
        success: true,
        message: "Logged out successfully",
      };
    } catch (error) {
      console.error("Logout error:", error);
      return {
        success: false,
        message: "Logout failed",
        error: error.message,
      };
    }
  }

  // ============================================
  // RAZORPAY PAYMENT APIs
  // ============================================

  /**
   * Get Subscription Plans
   * @param {Object} params - { user_type: 'jobseeker' | 'employer' | 'all' }
   */
  async getSubscriptionPlans(params = {}) {
    try {
      if (__DEV__) {
        console.log("💰 Get Subscription Plans Request:", params);
      }

      const queryParams = new URLSearchParams(params).toString();
      const url = `${API_CONFIG.ENDPOINTS.GET_SUBSCRIPTION_PLANS}?${queryParams}`;

      const response = await apiClient.get(url, {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });

      if (__DEV__) {
        console.log("💰 Get Subscription Plans Response:", response.data);
      }

      return {
        success: true,
        data: response.data.data,
        count: response.data.count,
        message: response.data.message,
      };
    } catch (error) {
      if (__DEV__) {
        console.log("❌ Get Subscription Plans Error:", error);
        if (error.response) {
          console.log("❌ Error Response Status:", error.response.status);
          console.log("❌ Error Response Data:", error.response.data);
        }
      }

      return {
        success: false,
        errors: error.response?.data?.errors ||
          error.data?.data?.errors || [
            error.message || "Failed to get subscription plans",
          ],
        message:
          error.response?.data?.message ||
          error.data?.message ||
          "Failed to get subscription plans",
        data: [],
      };
    }
  }

  /**
   * Create Razorpay Order
   * @param {Object} orderData - { plan_id, user_id, coupon_code (optional) }
   */
  async createRazorpayOrder(orderData) {
    try {
      if (__DEV__) {
        console.log("💳 Create Razorpay Order Request:", orderData);
      }

      const response = await apiClient.post(
        API_CONFIG.ENDPOINTS.CREATE_RAZORPAY_ORDER,
        orderData,
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        },
      );

      if (__DEV__) {
        console.log("💳 Create Razorpay Order Response:", response.data);
      }

      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      if (__DEV__) {
        console.log("❌ Create Razorpay Order Error:", error);
        if (error.response) {
          console.log("❌ Error Response Status:", error.response.status);
          console.log("❌ Error Response Data:", error.response.data);
        }
      }

      return {
        success: false,
        errors: error.response?.data?.errors ||
          error.data?.data?.errors || [
            error.message || "Failed to create order",
          ],
        message:
          error.response?.data?.message ||
          error.data?.message ||
          "Failed to create payment order",
      };
    }
  }

  /**
   * Verify Razorpay Payment
   * @param {Object} paymentData - { razorpay_payment_id, razorpay_order_id, razorpay_signature, user_id }
   */
  async verifyRazorpayPayment(paymentData) {
    try {
      if (__DEV__) {
        console.log("✅ Verify Razorpay Payment Request:", {
          payment_id: paymentData.razorpay_payment_id,
          order_id: paymentData.razorpay_order_id,
          user_id: paymentData.user_id,
        });
      }

      const response = await apiClient.post(
        API_CONFIG.ENDPOINTS.VERIFY_RAZORPAY_PAYMENT,
        paymentData,
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        },
      );

      if (__DEV__) {
        console.log("✅ Verify Razorpay Payment Response:", response.data);
      }

      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      if (__DEV__) {
        console.log("❌ Verify Razorpay Payment Error:", error);
        if (error.response) {
          console.log("❌ Error Response Status:", error.response.status);
          console.log("❌ Error Response Data:", error.response.data);
        }
      }

      return {
        success: false,
        errors: error.response?.data?.errors ||
          error.data?.data?.errors || [
            error.message || "Payment verification failed",
          ],
        message:
          error.response?.data?.message ||
          error.data?.message ||
          "Failed to verify payment",
      };
    }
  }

  /**
   * Get User Subscription
   * @param {number} userId - User ID
   */
  async getUserSubscription(userId) {
    try {
      if (__DEV__) {
        console.log("📋 Get User Subscription Request:", { userId });
      }

      const response = await apiClient.get(
        `${API_CONFIG.ENDPOINTS.GET_USER_SUBSCRIPTION}?user_id=${userId}`,
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        },
      );

      if (__DEV__) {
        console.log("📋 Get User Subscription Response:", response.data);
      }

      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      if (__DEV__) {
        console.log("❌ Get User Subscription Error:", error);
        if (error.response) {
          console.log("❌ Error Response Status:", error.response.status);
          console.log("❌ Error Response Data:", error.response.data);
        }
      }

      return {
        success: false,
        errors: error.response?.data?.errors ||
          error.data?.data?.errors || [
            error.message || "Failed to get subscription",
          ],
        message:
          error.response?.data?.message ||
          error.data?.message ||
          "Failed to get subscription details",
        data: null,
      };
    }
  }

  /**
   * Get Matching Candidates for Employer
   * @param {Object} params - { employer_user_id, company_id, status, search_query, limit, offset }
   */
  async getMatchingCandidates(params) {
    try {
      if (__DEV__) {
        console.log("👥 Get Matching Candidates Request:", params);
      }

      const response = await apiClient.post(
        API_CONFIG.ENDPOINTS.GET_MATCHING_CANDIDATES,
        params,
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        },
      );

      if (__DEV__) {
        console.log("👥 Get Matching Candidates Response:", response.data);
      }

      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      if (__DEV__) {
        console.log("❌ Get Matching Candidates Error:", error);
        if (error.response) {
          console.log("❌ Error Response Status:", error.response.status);
          console.log("❌ Error Response Data:", error.response.data);
        }
      }

      return {
        success: false,
        errors: error.response?.data?.errors ||
          error.data?.data?.errors || [
            error.message || "Failed to get matching candidates",
          ],
        message:
          error.response?.data?.message ||
          error.data?.message ||
          "Failed to get matching candidates",
        data: null,
      };
    }
  }
  /**
   * Get Job By ID
   * @param {Object} params - { jobId, userId }
   */
  async getJobById(params) {
    try {
      if (__DEV__) {
        console.log("📋 Get Job By ID Request:", params);
      }

      const response = await apiClient.post(
        API_CONFIG.ENDPOINTS.GET_JOB_BY_ID,
        params,
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        },
      );

      // if (__DEV__) {
      //   console.log("📋 Get Job By ID Response:", response.data);
      // }

      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      if (__DEV__) {
        console.log("❌ Get Job By ID Error:", error);
        if (error.response) {
          console.log("❌ Error Response Status:", error.response.status);
          console.log("❌ Error Response Data:", error.response.data);
        }
      }

      return {
        success: false,
        errors: error.response?.data?.errors ||
          error.data?.data?.errors || [error.message || "Failed to get job"],
        message:
          error.response?.data?.message ||
          error.data?.message ||
          "Failed to get job",
        data: null,
      };
    }
  }

  /**
   * Update Job
   * @param {Object} jobData - Complete job data with jobId, userId, companyId, and all job fields
   */
  async updateJob(jobData) {
    try {
      if (__DEV__) {
        console.log("✏️ Update Job Request:", jobData);
      }

      const response = await apiClient.post(
        API_CONFIG.ENDPOINTS.UPDATE_JOB,
        jobData,
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        },
      );

      if (__DEV__) {
        console.log("✏️ Update Job Response:", response.data);
      }

      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      if (__DEV__) {
        console.log("❌ Update Job Error:", error);
        if (error.response) {
          console.log("❌ Error Response Status:", error.response.status);
          console.log("❌ Error Response Data:", error.response.data);
        }
      }

      return {
        success: false,
        errors: error.response?.data?.errors ||
          error.data?.data?.errors || [error.message || "Failed to update job"],
        message:
          error.response?.data?.message ||
          error.data?.message ||
          "Failed to update job",
        data: null,
      };
    }
  }

  /**
   * Delete Job
   * @param {Object} params - {jobId, userId, companyId }
   */
  async deleteJob(params) {
    try {
      const response = await apiClient.post(
        API_CONFIG.ENDPOINTS.DELETE_JOB,
        params,
      );

      if (__DEV__) {
        console.log("🗑️ Delete Job Response:", response.data);
      }

      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      return {
        success: false,
        errors: error.response?.data?.errors ||
          error.data?.data?.errors || [error.message || "Failed to delete job"],
        message:
          error.response?.data?.message ||
          error.data?.message ||
          "Failed to delete job",
        data: null,
      };
    }
  }
  /**
   * Get employer's active jobs for proposal sending
   */
  async getEmployerActiveJobs() {
    try {
      const userId = await SecureStore.getItemAsync("user_id");
      const companyId = await SecureStore.getItemAsync("company_id");

      if (!userId || !companyId) {
        throw new Error("User or company ID not found");
      }

      if (__DEV__) {
        console.log("📋 Get Employer Active Jobs Request:", {
          userId,
          companyId,
        });
      }

      const response = await apiClient.post(
        API_CONFIG.ENDPOINTS.GET_EMPLOYER_ACTIVE_JOBS,
        {
          employer_user_id: parseInt(userId),
          company_id: parseInt(companyId),
        },
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        },
      );

      if (__DEV__) {
        console.log("📋 Get Employer Active Jobs Response:", response.data);
      }

      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      if (__DEV__) {
        console.log("❌ Get Employer Active Jobs Error:", error);
        if (error.response) {
          console.log("❌ Error Response Status:", error.response.status);
          console.log("❌ Error Response Data:", error.response.data);
        }
      }

      return {
        success: false,
        errors: error.response?.data?.errors ||
          error.data?.errors || [error.message || "Failed to fetch jobs"],
        message:
          error.response?.data?.message ||
          error.data?.message ||
          "Failed to fetch jobs",
        data: null,
      };
    }
  }

  /**
   * Send job proposal to a candidate
   */
  async sendJobProposal(proposalData) {
    try {
      const userId = await SecureStore.getItemAsync("user_id");
      const companyId = await SecureStore.getItemAsync("company_id");

      if (!userId || !companyId) {
        throw new Error("User or company ID not found");
      }

      const payload = {
        employer_user_id: parseInt(userId),
        company_id: parseInt(companyId),
        job_id: proposalData.jobId,
        jobseeker_id: proposalData.jobseekerId,
        proposal_message: proposalData.proposalMessage,
        application_type: proposalData.applicationType || "manual",
        match_score: proposalData.matchScore || null,
      };

      if (__DEV__) {
        console.log("📤 Send Job Proposal Request:", payload);
      }

      const response = await apiClient.post(
        API_CONFIG.ENDPOINTS.SEND_JOB_PROPOSAL,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        },
      );

      if (__DEV__) {
        console.log("📤 Send Job Proposal Response:", response.data);
      }

      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      if (__DEV__) {
        console.log("❌ Send Job Proposal Error:", error);
        if (error.response) {
          console.log("❌ Error Response Status:", error.response.status);
          console.log("❌ Error Response Data:", error.response.data);
        }
      }

      return {
        success: false,
        errors: error.response?.data?.errors ||
          error.data?.errors || [error.message || "Failed to send proposal"],
        message:
          error.response?.data?.message ||
          error.data?.message ||
          "Failed to send proposal",
        data: null,
      };
    }
  }

  /**
   * Get candidate details for proposal
   */
  async getCandidateDetails(params) {
    try {
      const userId = await SecureStore.getItemAsync("user_id");
      const companyId = await SecureStore.getItemAsync("company_id");

      if (!userId || !companyId) {
        throw new Error("User or company ID not found");
      }

      if (__DEV__) {
        console.log("👤 Get Candidate Details Request:", params);
        console.log("👤 Get Candidate userId:", userId);
        console.log("👤 Get Candidate companyId:", companyId);
      }

      const payload = {
        employer_user_id: userId || parseInt(userId),
        company_id: companyId || parseInt(companyId),
        candidate_id: parseInt(params),
      };

      const response = await apiClient.post(
        API_CONFIG.ENDPOINTS.GET_CANDIDATE_DETAILS,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        },
      );

      if (__DEV__) {
        console.log("👤 Get Candidate Details Response:", response.data);
      }

      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      if (__DEV__) {
        console.log("❌ Get Candidate Details Error:", error);
        if (error.response) {
          console.log("❌ Error Response Status:", error.response.status);
          console.log("❌ Error Response Data:", error.response.data);
        }
      }

      return {
        success: false,
        errors: error.response?.data?.errors ||
          error.data?.errors || [
            error.message || "Failed to fetch candidate details",
          ],
        message:
          error.response?.data?.message ||
          error.data?.message ||
          "Failed to fetch candidate details",
        data: null,
      };
    }
  }

  /**
   * Get jobseeker's pending proposals (for jobseeker side)
   */
  async getJobseekerProposals(status = "all") {
    try {
      const userId = await SecureStore.getItemAsync("user_id");

      if (!userId) {
        throw new Error("User ID not found");
      }

      if (__DEV__) {
        console.log("📨 Get Jobseeker Proposals Request:", { userId, status });
      }

      const response = await apiClient.post(
        API_CONFIG.ENDPOINTS.GET_JOBSEEKER_PROPOSALS,
        {
          jobseeker_id: parseInt(userId),
          status: status, // 'all', 'submitted', 'under_review', 'shortlisted', 'rejected', etc.
        },
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        },
      );

      if (__DEV__) {
        console.log("📨 Get Jobseeker Proposals Response:", response.data);
      }

      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      if (__DEV__) {
        console.log("❌ Get Jobseeker Proposals Error:", error);
        if (error.response) {
          console.log("❌ Error Response Status:", error.response.status);
          console.log("❌ Error Response Data:", error.response.data);
        }
      }

      return {
        success: false,
        errors: error.response?.data?.errors ||
          error.data?.errors || [error.message || "Failed to fetch proposals"],
        message:
          error.response?.data?.message ||
          error.data?.message ||
          "Failed to fetch proposals",
        data: null,
      };
    }
  }

  /**
   * Jobseeker accepts/rejects a proposal
   */
  async respondToProposal(applicationId, action, responseMessage = "") {
    try {
      const userId = await SecureStore.getItemAsync("user_id");

      if (!userId) {
        throw new Error("User ID not found");
      }

      if (__DEV__) {
        console.log("✅ Respond to Proposal Request:", {
          applicationId,
          action,
        });
      }

      const response = await apiClient.post(
        API_CONFIG.ENDPOINTS.RESPOND_TO_PROPOSAL,
        {
          jobseeker_id: parseInt(userId),
          application_id: parseInt(applicationId),
          action: action, // 'accept' or 'reject'
          response_message: responseMessage,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        },
      );

      if (__DEV__) {
        console.log("✅ Respond to Proposal Response:", response.data);
      }

      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      if (__DEV__) {
        console.log("❌ Respond to Proposal Error:", error);
        if (error.response) {
          console.log("❌ Error Response Status:", error.response.status);
          console.log("❌ Error Response Data:", error.response.data);
        }
      }

      return {
        success: false,
        errors: error.response?.data?.errors ||
          error.data?.errors || [
            error.message || "Failed to respond to proposal",
          ],
        message:
          error.response?.data?.message ||
          error.data?.message ||
          "Failed to respond to proposal",
        data: null,
      };
    }
  }
  /**
   * Get jobseeker's received proposals/applications
   * Fetches all job proposals sent to the jobseeker
   * @param {Object} params - Filter parameters
   * @param {string} params.status - Filter by status: 'all', 'pending', 'accepted', 'rejected'
   * @param {string} params.search_query - Search in company name, job title, location
   * @param {number} params.limit - Number of results per page (default: 50)
   * @param {number} params.offset - Offset for pagination (default: 0)
   * @returns {Promise} API response with applications and stats
   */
  async getJobseekerProposals(params = {}) {
    try {
      const userId = await SecureStore.getItemAsync("user_id");

      if (!userId) {
        throw new Error("User ID not found");
      }

      const payload = {
        jobseeker_id: parseInt(userId),
        status: params.status || "all",
        search_query: params.search_query || "",
        limit: params.limit || 50,
        offset: params.offset || 0,
        exclude_direct_apply: params.exclude_direct_apply,
      };

      if (__DEV__) {
        console.log("📨 Get Jobseeker Proposals Request:", payload);
      }

      const response = await apiClient.post(
        API_CONFIG.ENDPOINTS.GET_JOBSEEKER_PROPOSALS,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        },
      );

      if (__DEV__) {
        console.log("📨 Get Jobseeker Proposals Response:", response.data);
      }

      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      if (__DEV__) {
        console.log("❌ Get Jobseeker Proposals Error:", error);
        if (error.response) {
          console.log("❌ Error Response Status:", error.response.status);
          console.log("❌ Error Response Data:", error.response.data);
        }
      }

      return {
        success: false,
        errors: error.response?.data?.errors ||
          error.data?.errors || [error.message || "Failed to fetch proposals"],
        message:
          error.response?.data?.message ||
          error.data?.message ||
          "Failed to fetch proposals",
        data: null,
      };
    }
  }

  /**
   * Respond to a job proposal (accept or reject)
   * @param {number} applicationId - The application ID to respond to
   * @param {string} action - 'accept' or 'reject'
   * @param {string} responseMessage - Optional message from jobseeker
   * @returns {Promise} API response
   */
  async respondToProposal(applicationId, action, responseMessage = "") {
    try {
      const userId = await SecureStore.getItemAsync("user_id");

      if (!userId) {
        throw new Error("User ID not found");
      }

      if (__DEV__) {
        console.log("✅ Respond to Proposal Request:", {
          applicationId,
          action,
        });
      }

      const response = await apiClient.post(
        API_CONFIG.ENDPOINTS.RESPOND_TO_PROPOSAL,
        {
          jobseeker_id: parseInt(userId),
          application_id: parseInt(applicationId),
          action: action, // 'accept' or 'reject'
          response_message: responseMessage,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        },
      );

      if (__DEV__) {
        console.log("✅ Respond to Proposal Response:", response.data);
      }

      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      if (__DEV__) {
        console.log("❌ Respond to Proposal Error:", error);
        if (error.response) {
          console.log("❌ Error Response Status:", error.response.status);
          console.log("❌ Error Response Data:", error.response.data);
        }
      }

      return {
        success: false,
        errors: error.response?.data?.errors ||
          error.data?.errors || [
            error.message || "Failed to respond to proposal",
          ],
        message:
          error.response?.data?.message ||
          error.data?.message ||
          "Failed to respond to proposal",
        data: null,
      };
    }
  }

  /**
   * Get detailed information about a specific job application
   * @param {number} applicationId - The application ID
   * @returns {Promise} API response with detailed application data
   */
  async getApplicationDetails(applicationId) {
    try {
      const userId = await SecureStore.getItemAsync("user_id");

      if (!userId) {
        throw new Error("User ID not found");
      }

      if (__DEV__) {
        console.log("📋 Get Application Details Request:", { applicationId });
      }

      const response = await apiClient.post(
        API_CONFIG.ENDPOINTS.GET_APPLICATION_DETAILS,
        {
          user_id: parseInt(userId),
          application_id: parseInt(applicationId),
        },
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        },
      );

      if (__DEV__) {
        console.log("📋 Get Application Details Response:", response.data);
      }

      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      if (__DEV__) {
        console.log("❌ Get Application Details Error:", error);
        if (error.response) {
          console.log("❌ Error Response Status:", error.response.status);
          console.log("❌ Error Response Data:", error.response.data);
        }
      }

      return {
        success: false,
        errors: error.response?.data?.errors ||
          error.data?.errors || [
            error.message || "Failed to fetch application details",
          ],
        message:
          error.response?.data?.message ||
          error.data?.message ||
          "Failed to fetch application details",
        data: null,
      };
    }
  }
  /**
   * Get employer's conversations with accepted jobseekers
   * Fetches all chat conversations for employer
   * @param {Object} params - Filter parameters
   * @param {string} params.filter - Filter: 'all', 'unread', 'interviews', 'proposals'
   * @param {string} params.search_query - Search in candidate name, job title, messages
   * @returns {Promise} API response with conversations and stats
   */
  async getEmployerConversations(params = {}) {
    try {
      const userId = await SecureStore.getItemAsync("user_id");

      if (!userId) {
        throw new Error("User ID not found");
      }

      const payload = {
        employer_id: parseInt(userId),
        filter: params.filter || "all",
        search_query: params.search_query || "",
      };

      if (__DEV__) {
        // console.log("💬 Get Employer Conversations Request:", payload);
      }

      const response = await apiClient.post(
        API_CONFIG.ENDPOINTS.GET_EMPLOYER_CONVERSATIONS,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        },
      );

      if (__DEV__) {
        // console.log("💬 Get Employer Conversations Response:", response.data);
      }

      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      if (__DEV__) {
        console.log("❌ Get Employer Conversations Error:", error);
        if (error.response) {
          console.log("❌ Error Response Status:", error.response.status);
          console.log("❌ Error Response Data:", error.response.data);
        }
      }

      return {
        success: false,
        errors: error.response?.data?.errors ||
          error.data?.errors || [
            error.message || "Failed to fetch conversations",
          ],
        message:
          error.response?.data?.message ||
          error.data?.message ||
          "Failed to fetch conversations",
        data: null,
      };
    }
  }

  /**
   * Block or unblock a conversation
   * @param {number} conversationId - The conversation ID
   * @param {string} action - 'block' or 'unblock'
   * @returns {Promise} API response
   */
  async blockConversation(conversationId, action = "block") {
    try {
      const userId = await SecureStore.getItemAsync("user_id");

      if (!userId) {
        throw new Error("User ID not found");
      }

      if (__DEV__) {
        console.log("🚫 Block Conversation Request:", {
          conversationId,
          action,
        });
      }

      const response = await apiClient.post(
        API_CONFIG.ENDPOINTS.BLOCK_CONVERSATION,
        {
          user_id: parseInt(userId),
          conversation_id: parseInt(conversationId),
          action: action,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        },
      );

      if (__DEV__) {
        console.log("🚫 Block Conversation Response:", response.data);
      }

      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      if (__DEV__) {
        console.log("❌ Block Conversation Error:", error);
        if (error.response) {
          console.log("❌ Error Response Status:", error.response.status);
          console.log("❌ Error Response Data:", error.response.data);
        }
      }

      return {
        success: false,
        errors: error.response?.data?.errors ||
          error.data?.errors || [
            error.message || "Failed to block conversation",
          ],
        message:
          error.response?.data?.message ||
          error.data?.message ||
          "Failed to block conversation",
        data: null,
      };
    }
  }

  /**
   * Get conversation details including messages
   * @param {number} conversationId - The conversation ID
   * @param {number} limit - Number of messages to fetch
   * @param {number} offset - Offset for pagination
   * @returns {Promise} API response with conversation and messages
   */
  async getConversationDetails(conversationId, limit = 50, offset = 0) {
    try {
      const userId = await SecureStore.getItemAsync("user_id");

      if (!userId) {
        throw new Error("User ID not found");
      }

      if (__DEV__) {
        console.log("💬 Get Conversation Details Request:", {
          conversationId,
          limit,
          offset,
        });
      }

      const response = await apiClient.post(
        API_CONFIG.ENDPOINTS.GET_CONVERSATION_DETAILS,
        {
          user_id: parseInt(userId),
          conversation_id: parseInt(conversationId),
          limit: limit,
          offset: offset,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        },
      );

      if (__DEV__) {
        console.log("💬 Get Conversation Details Response:", response.data);
      }

      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      if (__DEV__) {
        console.log("❌ Get Conversation Details Error:", error);
        if (error.response) {
          console.log("❌ Error Response Status:", error.response.status);
          console.log("❌ Error Response Data:", error.response.data);
        }
      }

      return {
        success: false,
        errors: error.response?.data?.errors ||
          error.data?.errors || [
            error.message || "Failed to fetch conversation",
          ],
        message:
          error.response?.data?.message ||
          error.data?.message ||
          "Failed to fetch conversation",
        data: null,
      };
    }
  }

  /**
   * Mark messages as read in a conversation
   * @param {number} conversationId - The conversation ID
   * @returns {Promise} API response
   */
  async markMessagesAsRead(conversationId) {
    try {
      const userId = await SecureStore.getItemAsync("user_id");

      if (!userId) {
        throw new Error("User ID not found");
      }

      if (__DEV__) {
        console.log("✅ Mark Messages Read Request:", { conversationId });
      }

      const response = await apiClient.post(
        API_CONFIG.ENDPOINTS.MARK_MESSAGES_READ,
        {
          user_id: parseInt(userId),
          conversation_id: parseInt(conversationId),
        },
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        },
      );

      if (__DEV__) {
        console.log("✅ Mark Messages Read Response:", response.data);
      }

      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      if (__DEV__) {
        console.log("❌ Mark Messages Read Error:", error);
      }

      return {
        success: false,
        errors: error.response?.data?.errors ||
          error.data?.errors || [
            error.message || "Failed to mark messages as read",
          ],
        message:
          error.response?.data?.message ||
          error.data?.message ||
          "Failed to mark messages as read",
        data: null,
      };
    }
  }
  /**
   * Get Conversation Messages
   * Fetches all messages in a conversation
   * @param {number} conversationId - The conversation ID
   * @param {number} limit - Number of messages to fetch (default: 50)
   * @param {number} offset - Offset for pagination (default: 0)
   * @returns {Promise} API response with messages and conversation info
   */
  async getConversationMessages({
    conversationId = null,
    applicationId = null,
    jobseekerId = null,
    limit = 50,
    offset = 0,
  }) {
    try {
      const userId = await SecureStore.getItemAsync("user_id");
      if (!userId) throw new Error("User ID not found");
      // console.log("conversationId applicationId jobseekerId", conversationId);

      if (!conversationId && !applicationId && !jobseekerId) {
        throw new Error(
          "Either conversationId, applicationId, or jobseekerId is required",
        );
      }

      const payload = {
        user_id: parseInt(userId),
        conversation_id: conversationId ? parseInt(conversationId) : null,
        application_id: applicationId ? parseInt(applicationId) : null,
        jobseeker_id: jobseekerId ? parseInt(jobseekerId) : null,
        limit,
        offset,
      };

      // if (__DEV__) console.log("💬 Get Messages Request:", payload);

      const response = await apiClient.post(
        API_CONFIG.ENDPOINTS.GET_CONVERSATION_MESSAGES,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        },
      );

      // if (__DEV__) console.log("💬 Get Messages Response:", response.data);

      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      if (__DEV__) {
        console.log("❌ Get Messages Error:", error);
        if (error.response)
          console.log("❌ Error Response:", error.response.data);
      }

      return {
        success: false,
        errors: error.response?.data?.errors || [
          error.message || "Failed to fetch messages",
        ],
        message: error.response?.data?.message || "Failed to fetch messages",
        data: null,
      };
    }
  }

  /**
   * Send Message
   * Sends a text or file message in a conversation
   * Supports 2 ways to send:
   * 1. By conversation_id (if you already have it)
   * 2. By application_id (creates conversation if needed)
   *
   * @param {number} conversationId - Optional: The conversation ID
   * @param {number} applicationId - Optional: The application ID (creates conversation if needed)
   * @param {string} messageText - The message text
   * @param {string} messageType - 'text' or 'file'
   * @param {Object} fileData - Optional file data for file messages
   * @param {string} fileData.uri - File URI
   * @param {string} fileData.type - File MIME type
   * @param {string} fileData.name - File name
   * @returns {Promise} API response
   */
  async sendMessage(
    jobseekerId,
    applicationId = null,
    conversationId = null,
    messageText,
    messageType = "text",
    fileData = null,
  ) {
    try {
      const userId = await SecureStore.getItemAsync("user_id");

      if (!userId) {
        throw new Error("User ID not found");
      }

      if (!conversationId && !applicationId) {
        throw new Error("Either conversationId or applicationId is required");
      }

      const formData = new FormData();
      formData.append("user_id", userId);

      if (conversationId) {
        formData.append("conversation_id", conversationId.toString());
      }
      if (applicationId) {
        formData.append("application_id", applicationId.toString());
      }

      formData.append("jobseeker_id", jobseekerId);
      formData.append("message_text", messageText);
      formData.append("message_type", messageType);

      // If file is being sent
      if (fileData && messageType === "file") {
        formData.append("file", {
          uri: fileData.uri,
          type: fileData.type || "application/octet-stream",
          name: fileData.name || "file",
        });
      }

      if (__DEV__) {
        console.log("📤 Send Message Request:", {
          conversationId,
          applicationId,
          messageType,
          hasFile: !!fileData,
        });
      }

      const response = await apiClient.post(
        API_CONFIG.ENDPOINTS.SEND_MESSAGE,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Accept: "application/json",
          },
          timeout: 30000, // 30 seconds for file uploads
        },
      );

      if (__DEV__) {
        console.log("📤 Send Message Response:", response.data);
      }

      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      if (__DEV__) {
        console.log("❌ Send Message Error:", error);
        if (error.response) {
          console.log("❌ Error Response:", error.response.data);
        }
      }

      return {
        success: false,
        errors: error.response?.data?.errors || [
          error.message || "Failed to send message",
        ],
        message: error.response?.data?.message || "Failed to send message",
        data: null,
      };
    }
  }

  /**
   * Block/Unblock Conversation
   * @param {number} conversationId - The conversation ID
   * @param {string} action - 'block' or 'unblock'
   * @returns {Promise} API response
   */
  async blockConversation(conversationId, action = "block") {
    try {
      const userId = await SecureStore.getItemAsync("user_id");

      if (!userId) {
        throw new Error("User ID not found");
      }

      if (__DEV__) {
        console.log("🚫 Block Conversation Request:", {
          conversationId,
          action,
        });
      }

      const response = await apiClient.post(
        API_CONFIG.ENDPOINTS.BLOCK_CONVERSATION,
        {
          user_id: parseInt(userId),
          conversation_id: parseInt(conversationId),
          action: action,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        },
      );

      if (__DEV__) {
        console.log("🚫 Block Conversation Response:", response.data);
      }

      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      if (__DEV__) {
        console.log("❌ Block Conversation Error:", error);
        if (error.response) {
          console.log("❌ Error Response:", error.response.data);
        }
      }

      return {
        success: false,
        errors: error.response?.data?.errors || [
          error.message || "Failed to block conversation",
        ],
        message:
          error.response?.data?.message || "Failed to block conversation",
        data: null,
      };
    }
  }

  /**
   * Mark Messages as Read
   * Marks all unread messages from the other participant as read
   * @param {number} conversationId - The conversation ID
   * @returns {Promise} API response
   */
  async markMessagesAsRead(conversationId) {
    try {
      const userId = await SecureStore.getItemAsync("user_id");

      if (!userId) {
        throw new Error("User ID not found");
      }

      if (__DEV__) {
        console.log("✅ Mark Messages Read Request:", { conversationId });
      }

      const response = await apiClient.post(
        API_CONFIG.ENDPOINTS.MARK_MESSAGES_READ,
        {
          user_id: parseInt(userId),
          conversation_id: parseInt(conversationId),
        },
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        },
      );

      if (__DEV__) {
        console.log("✅ Mark Messages Read Response:", response.data);
      }

      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      if (__DEV__) {
        console.log("❌ Mark Messages Read Error:", error);
      }

      return {
        success: false,
        errors: error.response?.data?.errors || [
          error.message || "Failed to mark messages as read",
        ],
        message:
          error.response?.data?.message || "Failed to mark messages as read",
        data: null,
      };
    }
  }

  /**
   * Get Chat Attachments
   * Fetches all attachments in a conversation
   * @param {number} conversationId - The conversation ID
   * @param {string} fileType - Optional filter by file type ('pdf', 'image', 'document')
   * @returns {Promise} API response with attachments list
   */
  async getChatAttachments(conversationId, fileType = null) {
    try {
      const userId = await SecureStore.getItemAsync("user_id");

      if (!userId) {
        throw new Error("User ID not found");
      }

      const payload = {
        user_id: parseInt(userId),
        conversation_id: parseInt(conversationId),
      };

      if (fileType) {
        payload.file_type = fileType;
      }

      if (__DEV__) {
        console.log("📎 Get Attachments Request:", payload);
      }

      const response = await apiClient.post(
        API_CONFIG.ENDPOINTS.GET_CHAT_ATTACHMENTS,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        },
      );

      if (__DEV__) {
        console.log("📎 Get Attachments Response:", response.data);
      }

      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      if (__DEV__) {
        console.log("❌ Get Attachments Error:", error);
      }

      return {
        success: false,
        errors: error.response?.data?.errors || [
          error.message || "Failed to fetch attachments",
        ],
        message: error.response?.data?.message || "Failed to fetch attachments",
        data: null,
      };
    }
  }
  /**
   * Get Jobseeker Chat List
   * Fetches all conversations for a jobseeker with filtering and search
   * @param {string} searchQuery - Search term (optional)
   * @param {string} filter - Filter type: 'all', 'unread', 'blocked' (default: 'all')
   * @param {number} limit - Number of conversations to fetch (default: 50)
   * @param {number} offset - Pagination offset (default: 0)
   * @returns {Promise} API response with conversations array
   */
  async getJobseekerChatList(
    searchQuery = "",
    filter = "all",
    limit = 50,
    offset = 0,
  ) {
    try {
      const userId = await SecureStore.getItemAsync("user_id");

      if (!userId) {
        throw new Error("User ID not found");
      }

      if (__DEV__) {
        console.log("📥 Jobseeker Chat List Request:", {
          userId,
          searchQuery,
          filter,
          limit,
          offset,
        });
      }

      const formData = new FormData();
      formData.append("user_id", userId);

      if (searchQuery && searchQuery.trim()) {
        formData.append("search_query", searchQuery.trim());
      }

      if (filter && filter !== "all") {
        formData.append("filter", filter);
      }

      formData.append("limit", limit.toString());
      formData.append("offset", offset.toString());

      const response = await apiClient.post(
        API_CONFIG.ENDPOINTS.JOBSEEKER_CHAT_LIST,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Accept: "application/json",
          },
        },
      );

      if (__DEV__) {
        console.log("✅ Jobseeker Chat List Success:", {
          count: response.data.data?.conversations?.length || 0,
          filterCounts: response.data.data?.filter_counts,
        });
      }

      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      if (__DEV__) {
        console.log("❌ Jobseeker Chat List Error:", error);
        if (error.response) {
          console.log("❌ Error Status:", error.response.status);
          console.log("❌ Error Data:", error.response.data);
        }
      }

      return {
        success: false,
        errors: error.response?.data?.errors ||
          error.data?.errors || [
            error.message || "Failed to fetch conversations",
          ],
        message:
          error.response?.data?.message ||
          error.data?.message ||
          "Failed to fetch conversations",
        data: null,
      };
    }
  }

  async sendMessage2(conversationId, messageText, messageType = "text") {
    try {
      const userId = await SecureStore.getItemAsync("user_id");

      if (!userId) {
        throw new Error("User ID not found");
      }

      if (__DEV__) {
        console.log("📤 Send Message:", {
          userId,
          conversationId,
          messageType,
        });
      }

      const formData = new FormData();
      formData.append("user_id", userId);
      formData.append("conversation_id", conversationId.toString());
      formData.append("message_text", messageText);
      formData.append("message_type", messageType);

      const response = await apiClient.post(
        API_CONFIG.ENDPOINTS.SEND_MESSAGE2,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Accept: "application/json",
          },
        },
      );

      if (__DEV__) {
        console.log("✅ Message Sent:", response.data);
      }

      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      if (__DEV__) {
        console.log("❌ Send Message Error:", error);
      }

      return {
        success: false,
        errors: error.response?.data?.errors || [
          error.message || "Failed to send message",
        ],
        message: error.response?.data?.message || "Failed to send message",
        data: null,
      };
    }
  }

  async sendMessageWithFile(conversationId, messageText = "", file) {
    try {
      const userId = await SecureStore.getItemAsync("user_id");

      if (!userId) {
        throw new Error("User ID not found");
      }

      if (__DEV__) {
        console.log("📤 Send File:", {
          userId,
          conversationId,
          fileName: file.name,
        });
      }

      const formData = new FormData();
      formData.append("user_id", userId);
      formData.append("conversation_id", conversationId.toString());
      formData.append("message_text", messageText);
      formData.append("message_type", "file");

      formData.append("file", {
        uri: file.uri,
        type: file.mimeType || "application/octet-stream",
        name: file.name,
      });

      const response = await apiClient.post(
        API_CONFIG.ENDPOINTS.SEND_MESSAGE,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Accept: "application/json",
          },
        },
      );

      if (__DEV__) {
        console.log("✅ File Sent:", response.data);
      }

      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      if (__DEV__) {
        console.log("❌ Send File Error:", error);
      }

      return {
        success: false,
        errors: error.response?.data?.errors || [
          error.message || "Failed to send file",
        ],
        message: error.response?.data?.message || "Failed to send file",
        data: null,
      };
    }
  }
  async getConversationMessages2(conversationId, limit = 50, offset = 0) {
    try {
      const userId = await SecureStore.getItemAsync("user_id");

      if (!userId) {
        throw new Error("User ID not found");
      }

      if (__DEV__) {
        console.log("📥 Get Conversation Messages:", {
          userId,
          conversationId,
          limit,
          offset,
        });
      }

      const formData = new FormData();
      formData.append("user_id", userId);
      formData.append("conversation_id", conversationId.toString());
      formData.append("limit", limit.toString());
      formData.append("offset", offset.toString());

      const response = await apiClient.post(
        API_CONFIG.ENDPOINTS.GET_CONVERSATION_MESSAGES2,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Accept: "application/json",
          },
        },
      );

      if (__DEV__) {
        console.log("✅ Messages Success:", {
          count: response.data.data?.messages?.length || 0,
        });
      }

      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      if (__DEV__) {
        console.log("❌ Get Messages Error:", error);
      }

      return {
        success: false,
        errors: error.response?.data?.errors || [
          error.message || "Failed to fetch messages",
        ],
        message: error.response?.data?.message || "Failed to fetch messages",
        data: null,
      };
    }
  }

  // Add this method to your ApiService class in apiService.js

  /**
   * Get Employer Home Dashboard
   * Fetches statistics and recent candidate matches for employer home screen
   * @param {Object} params - { employer_user_id, company_id, match_limit }
   * @returns {Promise} API response with dashboard data
   */
  async getEmployerHomeDashboard(params) {
    try {
      const { employer_user_id, company_id, match_limit = 5 } = params;

      if (__DEV__) {
        console.log("🏠 Get Employer Home Dashboard Request:", params);
      }

      const formData = new FormData();
      formData.append("employer_user_id", employer_user_id.toString());
      formData.append("company_id", company_id.toString());
      formData.append("match_limit", match_limit.toString());

      const response = await apiClient.post(
        "/employer-home-dashboard.php", // Add this endpoint to API_CONFIG.ENDPOINTS
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Accept: "application/json",
          },
        },
      );

      // if (__DEV__) {
      //   console.log("✅ Employer Home Dashboard Success:", response.data);
      // }

      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      if (__DEV__) {
        console.log("❌ Employer Home Dashboard Error:", error);
      }

      return {
        success: false,
        errors: error.response?.data?.errors || [
          error.message || "Failed to fetch dashboard data",
        ],
        message:
          error.response?.data?.message || "Failed to fetch dashboard data",
        data: null,
      };
    }
  }
  /**
   * Get Matching Jobs for Jobseeker
   * Fetches jobs that match the jobseeker's skills
   * @param {Object} params - { user_id, search_query, limit, offset, employment_type, work_mode, location_city }
   * @returns {Promise} API response with matching jobs data
   */
  async getMatchingJobs(params) {
    try {
      const {
        user_id,
        search_query = "",
        limit = 20,
        offset = 0,
        employment_type = "",
        work_mode = "",
        location_city = "",
      } = params;

      // if (__DEV__) {
      //   console.log('🔍 Get Matching Jobs Request:', params);
      // }

      const formData = new FormData();
      formData.append("user_id", user_id.toString());
      formData.append("search_query", search_query);
      formData.append("limit", limit.toString());
      formData.append("offset", offset.toString());

      if (employment_type) {
        formData.append("employment_type", employment_type);
      }

      if (work_mode) {
        formData.append("work_mode", work_mode);
      }

      if (location_city) {
        formData.append("location_city", location_city);
      }

      if (params.exclude_applied) {
        formData.append("exclude_applied", params.exclude_applied);
      }

      const response = await apiClient.post(
        API_CONFIG.ENDPOINTS.GET_MATCHING_JOBS,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Accept: "application/json",
          },
        },
      );

      // if (__DEV__) {
      //   console.log('✅ Matching Jobs Success:', {
      //     total: response.data.data?.total_count || 0,
      //     jobsReturned: response.data.data?.jobs?.length || 0,
      //   });
      // }

      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      if (__DEV__) {
        console.log("❌ Get Matching Jobs Error:", error);
        if (error.response) {
          console.log("❌ Error Status:", error.response.status);
          console.log("❌ Error Data:", error.response.data);
        }
      }

      return {
        success: false,
        errors: error.response?.data?.errors ||
          error.data?.errors || [
            error.message || "Failed to fetch matching jobs",
          ],
        message:
          error.response?.data?.message ||
          error.data?.message ||
          "Failed to fetch matching jobs",
        data: null,
      };
    }
  }

  /**
   * Get Job Details for Jobseeker
   * Fetches complete job information with application status check
   * @param {Object} params - { job_id, user_id }
   * @returns {Promise} API response with job details
   */
  async getJobDetails(params) {
    try {
      const { job_id, user_id } = params;

      if (__DEV__) {
        console.log("📋 Get Job Details Request:", params);
      }

      const formData = new FormData();
      formData.append("job_id", job_id.toString());
      formData.append("user_id", user_id.toString());

      const response = await apiClient.post(
        API_CONFIG.ENDPOINTS.GET_JOB_DETAILS,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Accept: "application/json",
          },
        },
      );

      if (__DEV__) {
        console.log("✅ Job Details Success:", {
          response: response,
          responseData: response.data,
          jobId: response.data.data?.job_id,
          hasApplied: response.data.data?.has_applied,
          matchPercentage: response.data.data?.match_percentage,
          formData: formData,
        });
      }

      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      if (__DEV__) {
        console.log("❌ Get Job Details Error:", error);
        if (error.response) {
          console.log("❌ Error Status:", error.response.status);
          console.log("❌ Error Data:", error.response.data);
        }
      }

      return {
        success: false,
        errors: error.response?.data?.errors ||
          error.data?.errors || [
            error.message || "Failed to fetch job details",
          ],
        message:
          error.response?.data?.message ||
          error.data?.message ||
          "Failed to fetch job details",
        data: null,
      };
    }
  }

  /**
   * Submit Job Application
   * Allows jobseeker to apply for a job
   * @param {Object} params - { job_id, jobseeker_id, cover_letter, expected_salary, availability_date }
   * @returns {Promise} API response with application data
   */
  async submitJobApplication(params) {
    try {
      const {
        job_id,
        jobseeker_id,
        cover_letter,
        expected_salary = null,
        availability_date = null,
      } = params;

      if (__DEV__) {
        console.log("📤 Submit Job Application Request:", {
          job_id,
          jobseeker_id,
          hasCoverLetter: !!cover_letter,
          hasExpectedSalary: !!expected_salary,
          hasAvailabilityDate: !!availability_date,
        });
      }

      const formData = new FormData();
      formData.append("job_id", job_id.toString());
      formData.append("jobseeker_id", jobseeker_id.toString());
      formData.append("cover_letter", cover_letter);

      if (expected_salary !== null && expected_salary !== "") {
        formData.append("expected_salary", expected_salary.toString());
      }

      if (availability_date !== null && availability_date !== "") {
        formData.append("availability_date", availability_date);
      }

      const response = await apiClient.post(
        API_CONFIG.ENDPOINTS.SUBMIT_JOB_APPLICATION,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Accept: "application/json",
          },
        },
      );

      if (__DEV__) {
        console.log("✅ Application Submitted:", response.data);
      }

      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      if (__DEV__) {
        console.log("❌ Submit Application Error:", error);
        if (error.response) {
          console.log("❌ Error Status:", error.response.status);
          console.log("❌ Error Data:", error.response.data);
        }
      }

      return {
        success: false,
        errors: error.response?.data?.errors ||
          error.data?.errors || [
            error.message || "Failed to submit application",
          ],
        message:
          error.response?.data?.message ||
          error.data?.message ||
          "Failed to submit application",
        data: null,
      };
    }
  }

  // Add these functions to your apiService.js file

  // Get Employer Interviews
  // ============================================
  // ADD TO apiService.js
  // ============================================

  /**
   * Get Employer Interviews
   * Fetches all scheduled interviews for an employer with filtering
   * @param {Object} params - { employer_user_id, company_id, tab, status, search_query, limit, offset }
   * @returns {Promise} API response with interviews array
   */
  async getEmployerInterviews(params) {
    try {
      const {
        employer_user_id,
        company_id,
        tab = "applications", // applications or proposals
        status = "all", // all, scheduled, completed, cancelled
        search_query = "",
        limit = 20,
        offset = 0,
      } = params;

      if (__DEV__) {
        console.log("📋 Get Employer Interviews Request:", params);
      }

      const formData = new FormData();
      formData.append("employer_user_id", employer_user_id.toString());
      formData.append("company_id", company_id.toString());
      formData.append("tab", tab);
      formData.append("status", status);
      formData.append("search_query", search_query);
      formData.append("limit", limit.toString());
      formData.append("offset", offset.toString());

      const response = await apiClient.post(
        "/get-employer-interviews.php",
        formData,
      );

      if (__DEV__) {
        console.log("✅ Employer Interviews Success:", {
          total: response.data.data?.total_count || 0,
          interviewsReturned: response.data.data?.interviews?.length || 0,
          stats: response.data.data?.stats,
        });
      }

      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      if (__DEV__) {
        console.log("❌ Get Employer Interviews Error:", error);
        if (error.response) {
          console.log("❌ Error Status:", error.response.status);
          console.log("❌ Error Data:", error.response.data);
        }
      }

      return {
        success: false,
        errors: error.response?.data?.errors ||
          error.data?.errors || [
            error.message || "Failed to fetch employer interviews",
          ],
        message:
          error.response?.data?.message ||
          error.data?.message ||
          "Failed to fetch employer interviews",
        data: null,
      };
    }
  }

  // Get Jobseeker Interviews
  async getJobseekerInterviews(params) {
    try {
      if (__DEV__) {
        console.log("👤 Getting Jobseeker Interviews:", params);
      }

      const response = await apiClient.post(
        API_CONFIG.ENDPOINTS.GET_JOBSEEKER_INTERVIEWS,
        params,
      );

      if (__DEV__) {
        console.log("👤 Jobseeker Interviews Response:", response.data);
      }

      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      if (__DEV__) {
        console.log("❌ Get Jobseeker Interviews Error:", error);
        if (error.response) {
          console.log("❌ Error Response:", error.response.data);
        }
      }

      return {
        success: false,
        errors: error.response?.data?.errors || [
          error.message || "Failed to get interviews",
        ],
        message: error.response?.data?.message || "Failed to get interviews",
      };
    }
  }

  // Schedule Interview
  async scheduleInterview(interviewData) {
    try {
      if (__DEV__) {
        console.log("📅 Scheduling Interview:", interviewData);
      }

      const response = await apiClient.post(
        API_CONFIG.ENDPOINTS.SCHEDULE_INTERVIEW,
        interviewData,
      );

      if (__DEV__) {
        console.log("📅 Schedule Interview Response:", response.data);
      }

      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      if (__DEV__) {
        console.log("❌ Schedule Interview Error:", error);
        if (error.response) {
          console.log("❌ Error Response:", error.response.data);
        }
      }

      return {
        success: false,
        errors: error.response?.data?.errors || [
          error.message || "Failed to schedule interview",
        ],
        message:
          error.response?.data?.message || "Failed to schedule interview",
      };
    }
  }

  // Update Application Status
  async updateApplicationStatus(statusData) {
    try {
      if (__DEV__) {
        console.log("📝 Updating Application Status:", statusData);
      }

      const response = await apiClient.post(
        API_CONFIG.ENDPOINTS.UPDATE_APPLICATION_STATUS,
        statusData,
      );

      if (__DEV__) {
        console.log("✅ Application Status Updated:", response.data);
      }

      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      if (__DEV__) {
        console.log("❌ Update Application Status Error:", error);
        if (error.response) {
          console.log("❌ Error Response:", error.response.data);
        }
      }

      return {
        success: false,
        errors: error.response?.data?.errors || [
          error.message || "Failed to update application status",
        ],
        message:
          error.response?.data?.message ||
          "Failed to update application status",
      };
    }
  }

  // Select/Mark Candidate (for discovered candidates)
  async selectCandidate(candidateData) {
    try {
      if (__DEV__) {
        console.log("⭐ Selecting Candidate:", candidateData);
      }

      const response = await apiClient.post(
        API_CONFIG.ENDPOINTS.SELECT_CANDIDATE,
        candidateData,
      );

      if (__DEV__) {
        console.log("✅ Candidate Selected:", response.data);
      }

      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      if (__DEV__) {
        console.log("❌ Select Candidate Error:", error);
        if (error.response) {
          console.log("❌ Error Response:", error.response.data);
        }
      }

      return {
        success: false,
        errors: error.response?.data?.errors || [
          error.message || "Failed to select candidate",
        ],
        message: error.response?.data?.message || "Failed to select candidate",
      };
    }
  }

  // ============================================
  // STATE AND CITY APIs - Add to apiService.js
  // ============================================

  /**
   * Get all states
   * @returns {Promise} API response with states array
   */
  async getStates() {
    try {
      if (__DEV__) {
        console.log("🗺️ Getting States");
      }

      // Using POST with empty FormData (no parameters needed)
      const formData = new FormData();

      const response = await apiClient.post("/get-states", formData);

      console.log("✅ States Retrieved:", response.data);
      if (__DEV__) {
        console.log("✅ States Retrieved:", {
          count: response.data.count,
          success: response.data.success,
        });
      }

      return {
        success: true,
        data: response.data.data,
        count: response.data.count,
        message: response.data.message,
      };
    } catch (error) {
      if (__DEV__) {
        console.log("❌ Get States Error:", error);
        if (error.response) {
          console.log("❌ Error Status:", error.response.status);
          console.log("❌ Error Data:", error.response.data);
        }
      }

      return {
        success: false,
        errors: error.response?.data?.errors ||
          error.data?.errors || [error.message || "Failed to fetch states"],
        message:
          error.response?.data?.message ||
          error.data?.message ||
          "Failed to fetch states",
        data: [],
      };
    }
  }

  /**
   * Get cities by state_id
   * @param {number} stateId - The state ID to get cities for
   * @returns {Promise} API response with cities array
   */
  async getCitiesByState(stateId) {
    try {
      if (__DEV__) {
        console.log("🏙️ Getting Cities for State:", stateId);
      }

      const formData = new FormData();
      formData.append("state_id", stateId.toString());

      const response = await apiClient.post("/get-cities.php", formData);

      if (__DEV__) {
        console.log("✅ Cities Retrieved:", {
          stateId: response.data.state_id,
          count: response.data.count,
          success: response.data.success,
        });
      }

      return {
        success: true,
        data: response.data.data,
        count: response.data.count,
        state_id: response.data.state_id,
        message: response.data.message,
      };
    } catch (error) {
      if (__DEV__) {
        console.log("❌ Get Cities Error:", error);
        if (error.response) {
          console.log("❌ Error Status:", error.response.status);
          console.log("❌ Error Data:", error.response.data);
        }
      }

      return {
        success: false,
        errors: error.response?.data?.errors ||
          error.data?.errors || [error.message || "Failed to fetch cities"],
        message:
          error.response?.data?.message ||
          error.data?.message ||
          "Failed to fetch cities",
        data: [],
      };
    }
  }
  // ============================================
  // ADD TO apiService.js
  // ============================================

  /**
   * Get Interview Eligible Candidates
   * Fetches all candidates eligible for interview scheduling
   * Includes candidates from all application statuses except rejected
   * @param {Object} params - { employer_user_id, company_id, search_query, limit, offset }
   * @returns {Promise} API response with candidates array
   */
  async getInterviewEligibleCandidates(params) {
    try {
      const {
        employer_user_id,
        company_id,
        search_query = "",
        limit = 50,
        offset = 0,
      } = params;

      if (__DEV__) {
        console.log("📋 Get Interview Eligible Candidates Request:", params);
      }

      const formData = new FormData();
      formData.append("employer_user_id", employer_user_id.toString());
      formData.append("company_id", company_id.toString());
      formData.append("search_query", search_query);
      formData.append("limit", limit.toString());
      formData.append("offset", offset.toString());

      const response = await apiClient.post(
        "/get-interview-eligible-candidates.php",
        formData,
      );

      if (__DEV__) {
        console.log("✅ Interview Eligible Candidates Success:", {
          total: response.data.data?.total_count || 0,
          candidatesReturned: response.data.data?.candidates?.length || 0,
          stats: response.data.data?.stats,
        });
      }

      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      if (__DEV__) {
        console.log("❌ Get Interview Eligible Candidates Error:", error);
        if (error.response) {
          console.log("❌ Error Status:", error.response.status);
          console.log("❌ Error Data:", error.response.data);
        }
      }

      return {
        success: false,
        errors: error.response?.data?.errors ||
          error.data?.errors || [
            error.message || "Failed to fetch interview eligible candidates",
          ],
        message:
          error.response?.data?.message ||
          error.data?.message ||
          "Failed to fetch interview eligible candidates",
        data: null,
      };
    }
  }
  /**
   * Get User Notifications
   * Fetches notifications with filtering and pagination
   * @param {Object} params - Query parameters
   * @param {string} params.filter - Filter type: 'all', 'unread', 'job', 'system', 'admin', 'messages'
   * @param {number} params.limit - Number of notifications to fetch (default: 20)
   * @param {number} params.offset - Offset for pagination (default: 0)
   * @returns {Promise<Object>} Notifications data with stats and pagination
   */
  async getNotifications({ filter = "all", limit = 20, offset = 0 } = {}) {
    try {
      const userId = await getStoredUserId();

      if (!userId) {
        throw new Error("User ID not found");
      }

      // if (__DEV__) {
      //   console.log("🔔 Get Notifications Request:", {
      //     user_id: userId,
      //     filter,
      //     limit,
      //     offset,
      //   });
      // }

      const response = await apiClient.post(
        API_CONFIG.ENDPOINTS.GET_NOTIFICATIONS,
        {
          user_id: parseInt(userId),
          filter: filter,
          limit: limit,
          offset: offset,
        },
      );

      // if (__DEV__) {
      //   console.log("🔔 Get Notifications Response:", response.data);
      // }

      return {
        success: response.data?.success || false,
        data: response.data?.data || {
          notifications: [],
          stats: {
            all: 0,
            unread: 0,
            job: 0,
            system: 0,
            admin: 0,
            messages: 0,
          },
          pagination: {
            total: 0,
            limit: 20,
            offset: 0,
            current_count: 0,
            has_more: false,
          },
        },
        message:
          response.data?.message || "Notifications retrieved successfully",
      };
    } catch (error) {
      if (__DEV__) {
        console.error("❌ Get Notifications Error:", error);
        if (error.response) {
          console.error("❌ Error Response:", error.response.data);
        }
      }

      return {
        success: false,
        data: {
          notifications: [],
          stats: {
            all: 0,
            unread: 0,
            job: 0,
            system: 0,
            admin: 0,
            messages: 0,
          },
          pagination: {
            total: 0,
            limit: 20,
            offset: 0,
            current_count: 0,
            has_more: false,
          },
        },
        errors: error.response?.data?.errors || [
          error.message || "Failed to fetch notifications",
        ],
        message:
          error.response?.data?.message ||
          error.message ||
          "Failed to fetch notifications",
      };
    }
  }

  /**
   * Mark Notifications as Read
   * Mark single or multiple notifications as read
   * @param {Array<number>|number} notificationIds - Single notification ID or array of IDs
   * @param {boolean} markAll - Mark all unread notifications as read
   * @returns {Promise<Object>} Success status
   */
  async markNotificationsRead(notificationIds = [], markAll = false) {
    try {
      const userId = await getStoredUserId();

      if (!userId) {
        throw new Error("User ID not found");
      }

      if (__DEV__) {
        console.log("✅ Mark Notifications Read Request:", {
          user_id: userId,
          notification_ids: notificationIds,
          mark_all: markAll,
        });
      }

      const response = await apiClient.post(
        API_CONFIG.ENDPOINTS.MARK_NOTIFICATIONS_READ,
        {
          user_id: parseInt(userId),
          notification_ids: Array.isArray(notificationIds)
            ? notificationIds
            : [notificationIds],
          mark_all: markAll,
        },
      );

      if (__DEV__) {
        console.log("✅ Mark Notifications Read Response:", response.data);
      }

      return {
        success: response.data?.success || false,
        data: response.data?.data || {},
        message: response.data?.message || "Notifications marked as read",
      };
    } catch (error) {
      if (__DEV__) {
        console.error("❌ Mark Notifications Read Error:", error);
        if (error.response) {
          console.error("❌ Error Response:", error.response.data);
        }
      }

      return {
        success: false,
        errors: error.response?.data?.errors || [
          error.message || "Failed to mark notifications as read",
        ],
        message:
          error.response?.data?.message ||
          error.message ||
          "Failed to mark notifications as read",
      };
    }
  }

  /**
   * Delete Notifications
   * Soft delete notifications
   * @param {Array<number>|number} notificationIds - Single notification ID or array of IDs
   * @returns {Promise<Object>} Success status
   */
  async deleteNotifications(notificationIds) {
    try {
      const userId = await getStoredUserId();

      if (!userId) {
        throw new Error("User ID not found");
      }

      if (__DEV__) {
        console.log("🗑️ Delete Notifications Request:", {
          user_id: userId,
          notification_ids: notificationIds,
        });
      }

      const response = await apiClient.post(
        API_CONFIG.ENDPOINTS.DELETE_NOTIFICATIONS,
        {
          user_id: parseInt(userId),
          notification_ids: Array.isArray(notificationIds)
            ? notificationIds
            : [notificationIds],
        },
      );

      if (__DEV__) {
        console.log("🗑️ Delete Notifications Response:", response.data);
      }

      return {
        success: response.data?.success || false,
        data: response.data?.data || {},
        message: response.data?.message || "Notifications deleted successfully",
      };
    } catch (error) {
      if (__DEV__) {
        console.error("❌ Delete Notifications Error:", error);
        if (error.response) {
          console.error("❌ Error Response:", error.response.data);
        }
      }

      return {
        success: false,
        errors: error.response?.data?.errors || [
          error.message || "Failed to delete notifications",
        ],
        message:
          error.response?.data?.message ||
          error.message ||
          "Failed to delete notifications",
      };
    }
  }
  /**
   * Get page content by page slug
   * @param {string} pageSlug - The page identifier (e.g., 'about-us', 'privacy-policy', 'terms')
   * @returns {Promise} - Page data
   */
  async getPageBySlug(pageSlug) {
    try {
      const response = await apiClient.post(API_CONFIG.ENDPOINTS.GET_PAGE, {
        page: pageSlug,
      });

      console.log("[API] Get page response:", response.data);

      if (response.data.success) {
        return {
          success: true,
          page: response.data,
        };
      } else {
        return {
          success: false,
          message: response.data.message || "Failed to fetch page",
        };
      }
    } catch (error) {
      console.error("[API] Get page error:", error);

      if (error.response) {
        return {
          success: false,
          message: error.response.data?.message || "Server error occurred",
          error: error.response.data,
        };
      }

      return {
        success: false,
        message: error.message || "Network error occurred",
      };
    }
  }

  // Add this method to your ApiService class in apiService.js

  /**
   * Submit Contact Form
   * Sends contact form data to the backend
   * @param {Object} formData - { fname, lname, email, phone, message }
   * @returns {Promise} API response
   */
  async submitContactForm(formData) {
    try {
      const { fname, lname, email, phone, message } = formData;

      if (__DEV__) {
        console.log("📧 Submit Contact Form Request:", {
          fname,
          lname,
          email,
          phone,
          messageLength: message.length,
        });
      }

      // Create FormData for the request
      const requestData = new FormData();
      requestData.append("fname", fname);
      requestData.append("lname", lname);
      requestData.append("email", email);
      requestData.append("phone", phone);
      requestData.append("message", message);

      const response = await apiClient.post(
        "/contact-us.php", // Your PHP endpoint
        requestData,
      );

      if (__DEV__) {
        console.log("✅ Contact Form Submitted:", response.data);
      }

      return {
        success: response.data?.status === "Success",
        data: response.data?.data || null,
        message: response.data?.message || "Message sent successfully",
      };
    } catch (error) {
      if (__DEV__) {
        console.log("❌ Submit Contact Form Error:", error);
        if (error.response) {
          console.log("❌ Error Status:", error.response.status);
          console.log("❌ Error Data:", error.response.data);
        }
      }

      return {
        success: false,
        errors: error.response?.data?.errors ||
          error.data?.errors || [error.message || "Failed to send message"],
        message:
          error.response?.data?.message ||
          error.data?.message ||
          "Failed to send message. Please try again.",
        data: null,
      };
    }
  }

  /**
   * Forgot Password API
   * Sends password recovery email to user
   * @param {Object} data - { email, user_type }
   * @returns {Promise} API response
   */
  async forgotPassword(data) {
    try {
      if (__DEV__) {
        console.log("🔐 Forgot Password Request:", data);
      }

      const formData = new FormData();
      formData.append("email", data.email);
      formData.append("user_type", data.user_type);

      const response = await apiClient.post(
        API_CONFIG.ENDPOINTS.FORGOT_PASSWORD,
        formData,
      );

      if (__DEV__) {
        console.log("🔐 Forgot Password Response:", response.data);
      }

      // Check if backend returned success
      if (response.data?.success === true) {
        return {
          success: true,
          data: response.data?.data || {},
          message:
            response.data?.message ||
            "Password sent to your email successfully",
        };
      } else {
        // Backend returned success: false
        return {
          success: false,
          errors: response.data?.errors || [
            response.data?.message || "Failed to send password recovery email",
          ],
          message:
            response.data?.message ||
            "Failed to send password recovery email. Please try again.",
        };
      }
    } catch (error) {
      if (__DEV__) {
        console.log("❌ Forgot Password Error:", error);
        if (error.response) {
          console.log("❌ Error Response Status:", error.response.status);
          console.log("❌ Error Response Data:", error.response.data);
        }
      }

      // Handle error responses
      const errorData = error.response?.data || {};
      const backendMessage = errorData?.message || null;

      return {
        success: false,
        errors: errorData?.errors || [
          backendMessage ||
            error.message ||
            "Failed to send password recovery email",
        ],
        message:
          backendMessage ||
          "Failed to send password recovery email. Please try again.",
      };
    }
  }
  /**
   * Reset Password API
   * Changes user's password with old password verification
   * @param {Object} data - { user_id, o_password, n_password, c_password, user_type }
   * @returns {Promise} API response
   */
  async resetPassword(data) {
    try {
      if (__DEV__) {
        console.log("🔐 Reset Password Request:", {
          user_id: data.user_id,
          user_type: data.user_type,
          hasOldPassword: !!data.o_password,
          hasNewPassword: !!data.n_password,
          hasConfirmPassword: !!data.c_password,
        });
      }

      const requestData = {
        user_id: data.user_id,
        o_password: data.o_password,
        n_password: data.n_password,
        c_password: data.c_password,
        user_type: data.user_type,
      };

      const response = await apiClient.post(
        API_CONFIG.ENDPOINTS.RESET_PASSWORD,
        requestData,
      );

      if (__DEV__) {
        console.log("✅ Reset Password Response:", response.data);
      }

      // Check if backend returned success status
      if (response.data?.status === "Success") {
        return {
          success: true,
          data: response.data?.data || {},
          message: response.data?.message || "Password changed successfully",
        };
      } else {
        // Backend returned error status
        return {
          success: false,
          errors: response.data?.data?.err || [
            response.data?.message || "Failed to reset password",
          ],
          message: response.data?.message || "Failed to reset password",
        };
      }
    } catch (error) {
      if (__DEV__) {
        console.log("❌ Reset Password Error:", error);
        if (error.response) {
          console.log("❌ Error Response Status:", error.response.status);
          console.log("❌ Error Response Data:", error.response.data);
        }
      }

      // Handle error responses
      const errorData = error.response?.data || {};
      const backendMessage = errorData?.message || null;

      // Handle validation errors (409)
      if (error.response?.status === 409) {
        return {
          success: false,
          errors: errorData?.data?.err || [
            backendMessage || "Validation error occurred",
          ],
          message: backendMessage || "Please check all fields and try again",
        };
      }

      // Handle other errors (400, 401, etc.)
      return {
        success: false,
        errors: [backendMessage || error.message || "Failed to reset password"],
        message:
          backendMessage || "Failed to reset password. Please try again.",
      };
    }
  }
  // Delete education record
  async deleteEducation(userId, educationId) {
    try {
      if (__DEV__) {
        console.log("🗑️ Deleting Education:", { userId, educationId });
      }

      if (!userId || !educationId) {
        return {
          success: false,
          errors: ["User ID and Education ID are required"],
          message: "User ID and Education ID are required",
          data: null,
        };
      }

      const requestData = {
        user_id: parseInt(userId),
        education_id: parseInt(educationId),
      };

      const response = await apiClient.post(
        "delete-education.php",
        requestData,
      );

      if (__DEV__) {
        console.log("✅ Delete Education Response:", response.data);
      }

      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      if (__DEV__) {
        console.log("❌ Delete Education Error:", error);
        if (error.response) {
          console.log("❌ Error Response:", error.response.data);
        }
      }

      return {
        success: false,
        errors: error.response?.data?.errors || [
          error.message || "Failed to delete education",
        ],
        message: error.response?.data?.message || "Failed to delete education",
        data: null,
      };
    }
  }

  // Delete work experience record
  async deleteWork(userId, workId) {
    try {
      if (__DEV__) {
        console.log("🗑️ Deleting Work Experience:", { userId, workId });
      }

      if (!userId || !workId) {
        return {
          success: false,
          errors: ["User ID and Work ID are required"],
          message: "User ID and Work ID are required",
          data: null,
        };
      }

      const requestData = {
        user_id: parseInt(userId),
        work_id: parseInt(workId),
      };

      const response = await apiClient.post("delete-work.php", requestData);

      if (__DEV__) {
        console.log("✅ Delete Work Experience Response:", response.data);
      }

      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      if (__DEV__) {
        console.log("❌ Delete Work Experience Error:", error);
        if (error.response) {
          console.log("❌ Error Response:", error.response.data);
        }
      }

      return {
        success: false,
        errors: error.response?.data?.errors || [
          error.message || "Failed to delete work experience",
        ],
        message:
          error.response?.data?.message || "Failed to delete work experience",
        data: null,
      };
    }
  }

  // Update user profile image
  async updateUserImage(userId, imageAsset) {
    try {
      if (__DEV__) {
        console.log("📸 Uploading User Image:", { userId });
      }

      if (!userId || !imageAsset) {
        return {
          success: false,
          errors: ["User ID and image are required"],
          message: "User ID and image are required",
          data: null,
        };
      }

      // Create FormData
      const formData = new FormData();
      formData.append("user_id", parseInt(userId));
      formData.append("photo", {
        uri: imageAsset.uri,
        type: imageAsset.mimeType || "image/jpeg",
        name: imageAsset.fileName || `profile_${Date.now()}.jpg`,
      });

      const response = await apiClient.post("update-user-image.php", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (__DEV__) {
        console.log("✅ Upload Image Response:", response.data);
      }

      return {
        success: response.data.response_code === 200,
        data: response.data.data,
        message: response.data.message || "Image uploaded successfully",
      };
    } catch (error) {
      if (__DEV__) {
        console.log("❌ Upload Image Error:", error);
        if (error.response) {
          console.log("❌ Error Response:", error.response.data);
        }
      }

      return {
        success: false,
        errors: error.response?.data?.errors || [
          error.message || "Failed to upload image",
        ],
        message: error.response?.data?.message || "Failed to upload image",
        data: null,
      };
    }
  }

  // Delete user account
  async deleteAccount(userId) {
    try {
      if (__DEV__) {
        console.log("🗑️ Deleting Account:", { userId });
      }

      if (!userId) {
        return {
          success: false,
          errors: ["User ID is required"],
          message: "User ID is required",
          data: null,
        };
      }

      const requestData = {
        user_id: parseInt(userId),
      };

      const response = await apiClient.post("delete-account.php", requestData);

      if (__DEV__) {
        console.log("✅ Delete Account Response:", response.data);
      }

      return {
        success:
          response.data.response_code === 200 ||
          response.data.status === "Success",
        data: response.data.data,
        message: response.data.message || "Account deleted successfully",
      };
    } catch (error) {
      if (__DEV__) {
        console.log("❌ Delete Account Error:", error);
        if (error.response) {
          console.log("❌ Error Response:", error.response.data);
        }
      }

      return {
        success: false,
        errors: error.response?.data?.errors || [
          error.message || "Failed to delete account",
        ],
        message: error.response?.data?.message || "Failed to delete account",
        data: null,
      };
    }
  }
  /**
   * Get Contact Information
   * @returns {Promise} Contact info data
   */
  async getContactInfo() {
    try {
      if (__DEV__) {
        console.log("📞 Get Contact Info Request");
      }

      const response = await apiClient.get("get-contact-info.php", {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });

      if (__DEV__) {
        console.log("📞 Get Contact Info Response:", response.data);
      }

      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      if (__DEV__) {
        console.log("❌ Get Contact Info Error:", error);
        if (error.response) {
          console.log("❌ Error Response Status:", error.response.status);
          console.log("❌ Error Response Data:", error.response.data);
        }
      }

      return {
        success: false,
        errors: error.response?.data?.errors ||
          error.data?.data?.errors || [
            error.message || "Failed to get contact information",
          ],
        message:
          error.response?.data?.message ||
          error.data?.message ||
          "Failed to get contact information",
        data: null,
      };
    }
  }
  // Add this method to your existing apiService.js (inside the ApiService class)

  /**
   * Check current subscription status
   * Used for periodic checks while user is logged in
   */
  async checkSubscriptionStatus() {
    try {
      const userId = await SecureStore.getItemAsync("user_id");

      if (!userId) {
        throw new Error("User ID not found");
      }

      if (__DEV__) {
        console.log("📊 Check subscription status for user:", userId);
      }

      const response = await apiClient.post(
        "/check-subscription-status.php",
        {
          user_id: parseInt(userId),
        },
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        },
      );

      if (__DEV__) {
        console.log("📊 Subscription check response:", response.data);
      }

      return response.data;
    } catch (error) {
      console.error("❌ Check subscription error:", error);

      if (error.response) {
        return {
          success: false,
          message:
            error.response.data?.message || "Failed to check subscription",
          errors: error.response.data?.errors || [],
          response_code: error.response.status,
        };
      }

      return {
        success: false,
        message: "Network error. Please check your connection.",
        errors: ["Network error"],
      };
    }
  }
}

// Create and export service instance
const apiService = new ApiService();
export default apiService;
