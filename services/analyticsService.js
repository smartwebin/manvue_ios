import { Platform } from 'react-native';

/**
 * Analytics Service for Meta App Events (App Events)
 * Handles centralized event tracking across the application.
 */
class AnalyticsService {
  constructor() {
    this.AppEventsLogger = null;
    this.initialized = false;
  }

  /**
   * Lazy load the Facebook SDK components
   */
  async _getSDK() {
    if (this.AppEventsLogger) return this.AppEventsLogger;
    
    try {
      const { AppEventsLogger } = await import('react-native-fbsdk-next');
      this.AppEventsLogger = AppEventsLogger;
      return AppEventsLogger;
    } catch (error) {
      console.warn('⚠️ Meta SDK not available:', error.message);
      return null;
    }
  }

  /**
   * Log a standard or custom event
   * @param {string} eventName - Standard event name or custom string
   * @param {Object} params - Optional parameters for the event
   */
  async logEvent(eventName, params = {}) {
    const logger = await this._getSDK();
    if (!logger) return;

    try {
      if (__DEV__) {
        console.log(`📊 [Analytics] Logging event: ${eventName}`, params);
      }
      
      logger.logEvent(eventName, params);
    } catch (error) {
      console.error(`❌ [Analytics] Failed to log event ${eventName}:`, error);
    }
  }

  /**
   * Standard Event: Completed Registration
   */
  async logRegistration(method = 'Email', userType = 'jobseeker') {
    const logger = await this._getSDK();
    if (!logger) return;
    
    this.logEvent(logger.AppEvents.CompletedRegistration, {
      [logger.AppEventParams.RegistrationMethod]: method,
      user_type: userType
    });
  }

  /**
   * Associate events with a specific user profile
   */
  async setUser(user) {
    const logger = await this._getSDK();
    if (!logger) return;

    if (user && user.user_id) {
      logger.setUserID(String(user.user_id));
      
      const userData = {};
      if (user.email) userData.email = user.email;
      if (user.first_name) userData.firstName = user.first_name;
      if (user.last_name) userData.lastName = user.last_name;
      if (user.phone) userData.phone = user.phone;
      
      if (Object.keys(userData).length > 0) {
        logger.setUserData(userData);
      }
    } else {
      logger.setUserID(null);
    }
  }

  /**
   * Standard Event: Login
   */
  async logLogin(user, method = 'Email') {
    if (user) {
      await this.setUser(user);
    }
    
    this.logEvent('Login', {
      method,
      user_type: user?.user_type || 'jobseeker'
    });
  }

  /**
   * Standard Event: View Content
   */
  async logViewContent(contentType, contentId, contentName, extra = {}) {
    const logger = await this._getSDK();
    if (!logger) return;

    this.logEvent(logger.AppEvents.ViewedContent, {
      [logger.AppEventParams.ContentType]: contentType,
      [logger.AppEventParams.ContentID]: String(contentId),
      content_name: contentName,
      ...extra
    });
  }

  /**
   * Standard Event: Search
   */
  async logSearch(searchString, location = '') {
    const logger = await this._getSDK();
    if (!logger) return;

    this.logEvent(logger.AppEvents.Searched, {
      [logger.AppEventParams.SearchString]: searchString,
      location_search: location,
      [logger.AppEventParams.Success]: 1
    });
  }

  /**
   * Standard Event: Submit Application (Custom for Job Portal)
   */
  async logSubmitApplication(jobId, jobTitle, companyName) {
    this.logEvent('SubmitApplication', {
      job_id: String(jobId),
      job_title: jobTitle,
      company_name: companyName
    });
  }

  /**
   * Standard Event: Contact / Lead
   */
  async logLead(type, id, name) {
    const logger = await this._getSDK();
    if (!logger) return;

    this.logEvent(logger.AppEvents.Contact, {
      lead_type: type,
      lead_id: String(id),
      lead_name: name
    });
  }

  /**
   * Standard Event: Purchase / Subscribe
   */
  async logPurchase(amount, currency, planId, planName) {
    const logger = await this._getSDK();
    if (!logger) return;

    try {
      // Use logPurchase for monetary events
      logger.logPurchase(amount, currency, {
        plan_id: String(planId),
        plan_name: planName
      });
    } catch (error) {
      console.error('❌ [Analytics] Failed to log purchase:', error);
    }
  }
}

const analyticsService = new AnalyticsService();
export default analyticsService;
