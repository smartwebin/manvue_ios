# Manvue - Next-Gen Recruitment Platform

![Manvue Logo](assets/images/company/logo.png)

*"Your skills, your jobs"*

## 📱 Project Overview

**Manvue** is a revolutionary recruitment application that eliminates traditional job postings and focuses on direct skill-based candidate search and intelligent matchmaking. Built with **Expo React Native SDK 54** using **App Router**, featuring modern UI/UX with subtle animations, clean and futuristic design.

### 🎨 Design Theme
- **Primary Colors:**
  - Teal/Turquoise: `#1BA3A3` (Main brand color)
  - Orange: `#FF8A3D` (Vibrant accent color)  
  - Deep Blue: `#1E4A72` (Professional text color)
- **Design Philosophy:** Modern, clean, futuristic with subtle animations
- **UI/UX:** Intuitive swipe-based interactions with seamless transitions

## 🏗️ System Architecture

### User Roles & Access Levels

#### 1. **Job Seekers (Candidates)**
- **Registration:** Mobile/Email + OTP verification
- **Profile Categories:**
  - **Experienced:** Skills, Years of experience, Current organization, Industry
  - **Fresher/Campus:** Learned skills, College/University, Course details
  - **Part-time:** Offered skills, Interested fields, Availability
- **Subscription:** Required (₹___ / 6 months) for account activation
- **Payment Methods:** UPI, Debit/Credit Cards, Net Banking, Digital Wallets

#### 2. **Employers/Recruiters**
- **Registration:** Company email/mobile + GST number verification
- **Profile Requirements:** Organization details, Industry, Contact person info
- **Approval Process:** Admin approval required before activation
- **Usage:** Completely free with unlimited candidate search access

#### 3. **Admin Panel**
- **Web-based:** Comprehensive management dashboard
- **Core Functions:**
  - Employer registration approval/rejection
  - Profile update moderation
  - Subscription & payment management
  - Analytics & reporting
  - User activity monitoring

## 🔍 Core Features

### 🎯 Smart Matchmaking System

#### For Employers:
- **Skills-Based Search:** Filter by skills, education, experience, work type
- **Swipe Interface:** Intuitive candidate shortlisting system
- **Profile Access Levels:**
  - Limited summary view initially
  - Full profile unlocked after shortlisting
- **No Job Postings:** Direct candidate discovery approach

#### For Job Seekers:
- **Direct Recommendations:** Receive job opportunities when shortlisted by employers
- **Profile Visibility Control:** Private profiles, not searchable outside Manvue
- **Recommendation Visibility Setting:** 
  - **Default:** Jobs only visible when directly sent by employer
  - **Enhanced:** Enable recommendation visibility for broader job discovery

#### Smart Skill Assistance:
- **Skill Suggestions:** When users add skills, related skills are suggested for comprehensive profiles
- **Skill Database:** AI assists in building complete skill sets during profile creation

### 💬 Communication Suite

- **In-App Chat:** Secure messaging with document sharing (unlocked after match)
- **Voice Calls:** Integrated calling system
- **Video Interviews:** 
  - Scheduling with calendar integration
  - Automated reminders
  - Direct VC invite from employers
- **Calendar Integration:** Interview management with notifications

### 🔒 Security & Privacy

- **End-to-End Encryption:** User data, chat, and calls
- **Data Protection:** 
  - Candidate profiles visible only to verified employers
  - No resume downloads/exports allowed
  - Secure data storage with cloud hosting
- **Authentication:** Mandatory OTP login for all users
- **Privacy Controls:** User-controlled profile visibility

### 💳 Payment & Subscription

#### Job Seekers:
- **Subscription Fee:** ₹___ per 6 months
- **Payment Options:** UPI, Cards, Net Banking, Digital Wallets
- **Auto-Renewal:** Smart reminders via push notifications & email
- **Payment Security:** Integrated secure payment gateway

#### Employers:
- **Free Model:** No charges, unlimited access
- **No Hidden Costs:** Complete free usage for all employer features

### 📊 Admin Dashboard Features

#### User Management:
- **Employer Approval:** Registration verification and activation
- **Profile Moderation:** Major profile changes require admin approval
- **Account Management:** User status control and management

#### Analytics & Reporting:
- **User Metrics:** Active users, registrations, growth trends
- **Financial Tracking:** Subscription revenue, payment records
- **Platform Analytics:** Matches, communication logs, success rates
- **Usage Reports:** Feature utilization and engagement metrics

#### System Monitoring:
- **Activity Logs:** Chat, call, and interview monitoring
- **Security Oversight:** Fraud detection and prevention
- **Performance Monitoring:** Platform health and optimization

## 📱 Application Structure

### 🔐 Authentication Flow
1. **User Registration:** Role selection (Job Seeker/Employer)
2. **Profile Creation:** Category-specific information collection
3. **Verification:** OTP-based authentication
4. **Approval Process:** Admin verification for employers
5. **Payment:** Subscription activation for job seekers

### 🏠 Core Navigation
- **Dashboard:** Role-based personalized home screen
- **Search/Discovery:** Skill-based candidate matching
- **Messages:** Communication center with chat/call history
- **Profile:** Comprehensive profile management
- **Notifications:** Real-time updates and alerts
- **Settings:** Account preferences and privacy controls

## 🛠️ Technical Specifications

### Frontend:
- **Framework:** Expo React Native SDK 54
- **Architecture:** App Router for navigation
- **UI Library:** Custom components with theme system
- **Animations:** Smooth transitions and micro-interactions
- **State Management:** Modern React patterns

### Backend Requirements:
- **Scalability:** Cloud-based with load balancing
- **Real-time:** WebSocket support for chat/video
- **Database:** Secure data storage with encryption
- **APIs:** RESTful architecture with security layers

### Platform Support:
- **Mobile:** iOS and Android native apps
- **Web:** Admin panel with responsive design
- **Cross-Platform:** Consistent experience across devices

## 🔔 Notification System

### Automated Alerts:
- **Authentication:** OTP and registration confirmations
- **Subscriptions:** Expiry reminders and renewal notifications
- **Matching:** Shortlist alerts and job recommendations
- **Interviews:** Scheduling confirmations and reminders
- **System:** Admin announcements and updates

### Smart Delivery:
- **Push Notifications:** Real-time mobile alerts
- **Email Notifications:** Detailed communication backup
- **In-App Notifications:** Centralized notification center

## 🌍 Localization & Accessibility

- **Language Support:** English + Regional languages (configurable)
- **Accessibility:** Screen reader compatibility and inclusive design
- **Regional Adaptation:** Local payment methods and cultural preferences

## 🚀 Key Differentiators

1. **No Job Postings:** Revolutionary skills-first approach
2. **Swipe-Based Matching:** Tinder-like interface for recruitment
3. **Employer-Free Model:** Zero cost for recruiters
4. **Integrated Video Interviews:** Complete hiring workflow
5. **Skills-Based Matching:** Direct candidate-job alignment
6. **Secure & Private:** Enterprise-grade data protection
7. **Recommendation Visibility Control:** User-controlled job discovery
8. **Smart Skill Building:** AI-assisted skill profile completion

## 📋 Development Roadmap

### Phase 1: Core Platform
- [ ] User authentication and profile management
- [ ] Basic search and matching functionality
- [ ] Admin panel development
- [ ] Payment integration

### Phase 2: Communication Features
- [ ] In-app messaging system
- [ ] Voice and video call integration
- [ ] Calendar and scheduling features
- [ ] Notification system

### Phase 3: Advanced Features
- [ ] Smart skill suggestions system
- [ ] Analytics dashboard
- [ ] Mobile app optimization
- [ ] Security enhancements

### Phase 4: Scale & Optimize
- [ ] Performance optimization
- [ ] Regional language support
- [ ] Advanced analytics
- [ ] Enterprise features

## 🔧 Installation & Setup

```bash
# Clone the repository
git clone https://github.com/your-org/manvue-app.git

# Install dependencies
cd manvue-app
npm install

# Start the development server
npx expo start
```

## 📝 Configuration

### Environment Variables:
```env
EXPO_PUBLIC_API_URL=your_api_endpoint
EXPO_PUBLIC_PAYMENT_GATEWAY_KEY=your_payment_key
EXPO_PUBLIC_FIREBASE_CONFIG=your_firebase_config
```

### Theme Configuration:
```javascript
// theme.js
export const colors = {
  primary: {
    teal: '#1BA3A3',
    orange: '#FF8A3D', 
    deepBlue: '#1E4A72',
  }
}
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is proprietary software. All rights reserved.

## 📞 Support

For technical support or business inquiries:
- **Email:** manuve2@gmail.com
- **Website:** https://www.manvue.com
- **Documentation:** https://docs.manvue.com

---

**Built with ❤️ using Expo React Native SDK 54**

*Revolutionizing recruitment through intelligent matching and seamless user experience.*