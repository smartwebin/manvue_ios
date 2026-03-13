import apiService from "@/services/apiService";
import theme from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import * as SecureStore from 'expo-secure-store';
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import RazorpayCheckout from 'react-native-razorpay';

/**
 * Razorpay Payment Screen for Jobseeker Subscription
 *
 * This screen handles the 6-month subscription payment via Razorpay.
 */
export default function PaymentScreen() {
  const [subscriptionPlan, setSubscriptionPlan] = useState(null);
  const [isLoadingPlan, setIsLoadingPlan] = useState(true);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [userId, setUserId] = useState('');
  const [userName, setUserName] = useState('');
  const [userPhone, setUserPhone] = useState('');

  useEffect(() => {
    loadUserData();
    loadSubscriptionPlan();
  }, []);

  const loadUserData = async () => {
    try {
      const email = await SecureStore.getItemAsync('user_email');
      const id = await SecureStore.getItemAsync('user_id');
      const firstName = await SecureStore.getItemAsync('user_first_name');
      const lastName = await SecureStore.getItemAsync('user_last_name');
      const phone = await SecureStore.getItemAsync('user_phone');
      
      setUserEmail(email || '');
      setUserId(id || '');
      setUserName(`${firstName || ''} ${lastName || ''}`.trim());
      setUserPhone(phone || '');
    } catch (error) {
      console.error('Failed to load user data:', error);
    }
  };

  const loadSubscriptionPlan = async () => {
    setIsLoadingPlan(true);
    try {
      const response = await apiService.getSubscriptionPlans({ user_type: 'jobseeker' });

      if (response.success && response.data && response.data.length > 0) {
        const plan = response.data.find(p => p.is_active === 1 && p.duration_months === 6) || response.data[0];
        setSubscriptionPlan(plan);
      } else {
        throw new Error('No subscription plans found');
      }
    } catch (error) {
      console.error('Failed to load subscription plan:', error);
      Alert.alert(
        'Error',
        'Failed to load subscription plan. Please try again.',
        [
          { text: 'Retry', onPress: loadSubscriptionPlan },
          { text: 'Cancel', onPress: () => router.back() }
        ]
      );
    } finally {
      setIsLoadingPlan(false);
    }
  };

  const handlePayment = async () => {
    if (!subscriptionPlan) {
      Alert.alert('Error', 'No subscription plan selected');
      return;
    }

    if (!userId) {
      Alert.alert('Error', 'User session expired. Please login again.');
      return;
    }

    setIsProcessingPayment(true);

    try {
      console.log('💳 Creating Razorpay order...');
      
      const orderResponse = await apiService.createRazorpayOrder({
        plan_id: subscriptionPlan.plan_id,
        user_id: userId,
      });

      if (!orderResponse.success || !orderResponse.data) {
        throw new Error(orderResponse.message || 'Failed to create order');
      }

      const { 
        order_id, 
        amount, 
        currency, 
        razorpay_key_id, 
        plan_name,
        plan_duration,
        final_amount,
        transaction_id
      } = orderResponse.data;

      console.log('✅ Order created:', order_id);
      console.log('📝 Transaction ID:', transaction_id);

      // Store transaction_id for verification
      await SecureStore.setItemAsync('pending_transaction_id', transaction_id.toString());

      // Configure Razorpay checkout
      const options = {
        description: `${plan_name} - ${plan_duration}`,
        image: 'https://manvue.in/images/logo_icon.png', // Replace with your logo
        currency: currency,
        key: razorpay_key_id,
        amount: amount.toString(),
        name: 'Manvue',
        order_id: order_id,
        prefill: {
          email: userEmail,
          contact: userPhone,
          name: userName,
        },
        theme: {
          color: '#14b8a6', // Teal color
        },
        modal: {
          ondismiss: () => {
            console.log('Payment modal dismissed');
            setIsProcessingPayment(false);
          }
        }
      };

      console.log('🚀 Opening Razorpay checkout...');

      // Open Razorpay payment
      RazorpayCheckout.open(options)
        .then((data) => {
          console.log('✅ Payment successful:', data);
          handlePaymentSuccess(data);
        })
        .catch((error) => {
          console.log('❌ Payment error:', error);
          setIsProcessingPayment(false);
          
          // Check if user cancelled
          if (error.code === 0 || error.code === 2) {
            Alert.alert(
              'Payment Cancelled',
              'You have cancelled the payment. Please try again when ready.',
              [{ text: 'OK' }]
            );
          } else {
            handlePaymentFailure(error);
          }
        });

    } catch (error) {
      console.error('❌ Payment initiation error:', error);
      setIsProcessingPayment(false);
      
      const errorMessage = error.response?.data?.message || error.message || 'Failed to initiate payment. Please try again.';
      const errors = error.response?.data?.errors || [];
      
      Alert.alert(
        'Payment Failed',
        errors.length > 0 ? errors.join('\n') : errorMessage,
        [{ text: 'OK' }]
      );
    }
  };

  const handlePaymentSuccess = async (paymentData) => {
    console.log('🔍 Verifying payment...', paymentData);

    try {
      const transactionId = await SecureStore.getItemAsync('pending_transaction_id');

      const verifyResponse = await apiService.verifyRazorpayPayment({
        razorpay_payment_id: paymentData.razorpay_payment_id,
        razorpay_order_id: paymentData.razorpay_order_id,
        razorpay_signature: paymentData.razorpay_signature,
        user_id: userId,
        transaction_id: transactionId ? parseInt(transactionId) : undefined,
      });

      if (verifyResponse.success) {
        console.log('✅ Payment verified successfully');

        // Clear pending transaction
        await SecureStore.deleteItemAsync('pending_transaction_id');

        // Store subscription data
        if (verifyResponse.data?.subscription) {
          await SecureStore.setItemAsync('subscription_id', verifyResponse.data.subscription.subscription_id.toString());
          await SecureStore.setItemAsync('subscription_end_date', verifyResponse.data.subscription.end_date);
          await SecureStore.setItemAsync('subscription_status', verifyResponse.data.subscription.status);
        }

        setIsProcessingPayment(false);

        Alert.alert(
          'Payment Successful! 🎉',
          'Your subscription is now active. Welcome to Manvue Premium!',
          [
            {
              text: 'Get Started',
              onPress: () => {
                router.replace('/jobseeker/home');
              },
            },
          ],
          { cancelable: false }
        );
      } else {
        throw new Error(verifyResponse.message || 'Payment verification failed');
      }
    } catch (error) {
      console.error('❌ Payment verification error:', error);
      setIsProcessingPayment(false);
      
      const errorMessage = error.response?.data?.message || error.message || 'Payment completed but verification failed. Please contact support.';
      
      Alert.alert(
        'Verification Failed',
        `${errorMessage}\n\nPayment ID: ${paymentData.razorpay_payment_id}`,
        [
          {
            text: 'Contact Support',
            onPress: () => {
              // Add your support contact logic
            }
          },
          {
            text: 'OK',
            style: 'cancel'
          }
        ]
      );
    }
  };

  const handlePaymentFailure = (error) => {
    console.error('❌ Payment failed:', error);

    let errorMessage = 'Payment failed. Please try again.';
    
    if (error.description) {
      errorMessage = error.description;
    } else if (error.error) {
      errorMessage = error.error.description || errorMessage;
    }

    Alert.alert(
      'Payment Failed',
      errorMessage,
      [{ text: 'OK' }]
    );
  };

  const handleSkipPayment = () => {
    Alert.alert(
      'Skip Payment?',
      'You need an active subscription to access all features. Are you sure you want to skip?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        
      ]
    );
  };

  // Loading state
  if (isLoadingPlan) {
    return (
      <View style={{ 
        flex: 1, 
        backgroundColor: theme.colors.background.primary, 
        justifyContent: 'center', 
        alignItems: 'center' 
      }}>
        <ActivityIndicator size="large" color={theme.colors.primary.teal} />
        <Text style={{
          marginTop: theme.spacing.md,
          color: theme.colors.text.secondary,
          fontFamily: theme.typography.fonts.medium,
          fontSize: theme.typography.sizes.base,
        }}>
          Loading subscription plan...
        </Text>
      </View>
    );
  }

  // Error state - no plan found
  if (!subscriptionPlan) {
    return (
      <View style={{ 
        flex: 1, 
        backgroundColor: theme.colors.background.primary, 
        justifyContent: 'center', 
        alignItems: 'center', 
        padding: theme.spacing.xl 
      }}>
        <Ionicons name="alert-circle-outline" size={64} color={theme.colors.status.error} />
        <Text style={{
          marginTop: theme.spacing.md,
          color: theme.colors.text.primary,
          fontFamily: theme.typography.fonts.bold,
          fontSize: theme.typography.sizes.lg,
          textAlign: 'center',
        }}>
          No Plan Available
        </Text>
        <Text style={{
          marginTop: theme.spacing.sm,
          color: theme.colors.text.secondary,
          fontFamily: theme.typography.fonts.regular,
          fontSize: theme.typography.sizes.sm,
          textAlign: 'center',
        }}>
          Unable to load subscription plan. Please contact support.
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            marginTop: theme.spacing.lg,
            paddingHorizontal: theme.spacing.xl,
            paddingVertical: theme.spacing.md,
            backgroundColor: theme.colors.primary.teal,
            borderRadius: theme.borderRadius.lg,
          }}
        >
          <Text style={{
            color: theme.colors.neutral.white,
            fontFamily: theme.typography.fonts.semiBold,
            fontSize: theme.typography.sizes.base,
          }}>
            Go Back
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const discountPercent = subscriptionPlan.discount_percentage || 0;
  const originalPrice = subscriptionPlan.original_price || subscriptionPlan.price;
  const finalPrice = subscriptionPlan.price;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.background.primary }}
      contentContainerStyle={{ flexGrow: 1 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header with gradient */}
      <LinearGradient
        colors={[theme.colors.primary.teal, theme.colors.secondary.darkTeal]}
        style={{
          paddingTop: Platform.OS === 'ios' ? 60 : 40,
          paddingBottom: 40,
          paddingHorizontal: theme.spacing.xl,
          borderBottomLeftRadius: 30,
          borderBottomRightRadius: 30,
        }}
      >
        <View style={{ alignItems: 'center' }}>
          <View style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: theme.spacing.md,
          }}>
            <Ionicons name="rocket-outline" size={40} color={theme.colors.neutral.white} />
          </View>
          <Text style={{
            fontSize: theme.typography.sizes.xxl,
            fontFamily: theme.typography.fonts.bold,
            color: theme.colors.neutral.white,
            marginBottom: theme.spacing.xs,
          }}>
            Start Your Journey
          </Text>
          <Text style={{
            fontSize: theme.typography.sizes.sm,
            fontFamily: theme.typography.fonts.regular,
            color: 'rgba(255, 255, 255, 0.9)',
            textAlign: 'center',
          }}>
            Subscribe to unlock all premium features
          </Text>
        </View>
      </LinearGradient>

      {/* Plan Details Card */}
      <View style={{ paddingHorizontal: theme.spacing.xl, marginTop: -20 }}>
        <View style={{
          backgroundColor: theme.colors.background.card,
          borderRadius: theme.borderRadius.xl,
          padding: theme.spacing.xl,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 5,
        }}>
          {/* Plan Name */}
          <View style={{ alignItems: 'center', marginBottom: theme.spacing.lg }}>
            <Text style={{
              fontSize: theme.typography.sizes.xl,
              fontFamily: theme.typography.fonts.bold,
              color: theme.colors.text.primary,
              marginBottom: theme.spacing.xs,
            }}>
              {subscriptionPlan.plan_name}
            </Text>
            {subscriptionPlan.plan_description && (
              <Text style={{
                fontSize: theme.typography.sizes.sm,
                fontFamily: theme.typography.fonts.regular,
                color: theme.colors.text.secondary,
                textAlign: 'center',
              }}>
                {subscriptionPlan.plan_description}
              </Text>
            )}
          </View>

          {/* Pricing */}
          <View style={{ alignItems: 'center', marginBottom: theme.spacing.xl }}>
            {discountPercent > 0 && (
              <View style={{
                backgroundColor: theme.colors.status.success,
                paddingHorizontal: theme.spacing.md,
                paddingVertical: theme.spacing.xs,
                borderRadius: theme.borderRadius.full,
                marginBottom: theme.spacing.sm,
              }}>
                <Text style={{
                  fontSize: theme.typography.sizes.xs,
                  fontFamily: theme.typography.fonts.bold,
                  color: theme.colors.neutral.white,
                }}>
                  SAVE {discountPercent}%
                </Text>
              </View>
            )}

            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.xs }}>
              {discountPercent > 0 && (
                <Text style={{
                  fontSize: theme.typography.sizes.lg,
                  fontFamily: theme.typography.fonts.regular,
                  color: theme.colors.text.tertiary,
                  textDecorationLine: 'line-through',
                  marginRight: theme.spacing.sm,
                }}>
                  ₹{originalPrice}
                </Text>
              )}
              <Text style={{
                fontSize: 48,
                fontFamily: theme.typography.fonts.bold,
                color: theme.colors.primary.teal,
              }}>
                ₹{finalPrice}
              </Text>
            </View>

            <Text style={{
              fontSize: theme.typography.sizes.sm,
              fontFamily: theme.typography.fonts.medium,
              color: theme.colors.text.secondary,
            }}>
              for {subscriptionPlan.duration_months} months
            </Text>
          </View>

          {/* Features */}
          <View style={{
            backgroundColor: theme.colors.background.accent,
            borderRadius: theme.borderRadius.lg,
            padding: theme.spacing.lg,
            marginBottom: theme.spacing.lg,
          }}>
            <Text style={{
              fontSize: theme.typography.sizes.base,
              fontFamily: theme.typography.fonts.semiBold,
              color: theme.colors.text.primary,
              marginBottom: theme.spacing.md,
            }}>
              What's Included:
            </Text>

            {[
              'Unlimited job applications',
              'Priority listing in employer searches',
              'Advanced profile customization',
              'Direct messaging with employers',
              'Resume builder & templates',
              'Job alerts & notifications',
              'Application tracking dashboard',
              'Career resources & tips',
            ].map((feature, index) => (
              <View key={index} style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: theme.spacing.sm,
              }}>
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color={theme.colors.status.success}
                  style={{ marginRight: theme.spacing.sm }}
                />
                <Text style={{
                  fontSize: theme.typography.sizes.sm,
                  fontFamily: theme.typography.fonts.regular,
                  color: theme.colors.text.secondary,
                  flex: 1,
                }}>
                  {feature}
                </Text>
              </View>
            ))}
          </View>

          {/* Payment Button */}
          <TouchableOpacity
            onPress={handlePayment}
            disabled={isProcessingPayment}
            style={{
              borderRadius: theme.borderRadius.lg,
              overflow: 'hidden',
              marginBottom: theme.spacing.md,
              opacity: isProcessingPayment ? 0.7 : 1,
            }}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={[theme.colors.primary.teal, theme.colors.secondary.darkTeal]}
              style={{
                paddingVertical: theme.spacing.lg,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
              }}
            >
              {isProcessingPayment ? (
                <>
                  <ActivityIndicator 
                    size="small" 
                    color={theme.colors.neutral.white} 
                    style={{ marginRight: theme.spacing.sm }} 
                  />
                  <Text style={{
                    fontSize: theme.typography.sizes.base,
                    fontFamily: theme.typography.fonts.semiBold,
                    color: theme.colors.neutral.white,
                  }}>
                    Processing Payment...
                  </Text>
                </>
              ) : (
                <>
                  <Ionicons
                    name="card-outline"
                    size={24}
                    color={theme.colors.neutral.white}
                    style={{ marginRight: theme.spacing.sm }}
                  />
                  <Text style={{
                    fontSize: theme.typography.sizes.lg,
                    fontFamily: theme.typography.fonts.bold,
                    color: theme.colors.neutral.white,
                  }}>
                    Pay ₹{finalPrice}
                  </Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Secure Payment Badge */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: theme.spacing.md,
          }}>
            <Ionicons name="shield-checkmark" size={16} color={theme.colors.status.success} />
            <Text style={{
              fontSize: theme.typography.sizes.xs,
              fontFamily: theme.typography.fonts.medium,
              color: theme.colors.text.secondary,
              marginLeft: theme.spacing.xs,
            }}>
              Secure payment powered by Razorpay
            </Text>
          </View>

          {/* Payment Methods Info */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: theme.spacing.md,
            paddingVertical: theme.spacing.sm,
          }}>
            <Text style={{
              fontSize: theme.typography.sizes.xs,
              fontFamily: theme.typography.fonts.regular,
              color: theme.colors.text.tertiary,
              textAlign: 'center',
            }}>
              Accepts Cards, UPI, NetBanking & Wallets
            </Text>
          </View>

          
        </View>
      </View>

      {/* Terms & Privacy */}
      <View style={{ 
        paddingHorizontal: theme.spacing.xl, 
        paddingVertical: theme.spacing.lg,
        alignItems: 'center',
      }}>
        <Text style={{
          fontSize: theme.typography.sizes.xs,
          fontFamily: theme.typography.fonts.regular,
          color: theme.colors.text.tertiary,
          textAlign: 'center',
          lineHeight: 18,
        }}>
          By proceeding, you agree to our{' '}
          <Text style={{ 
            textDecorationLine: 'underline',
            color: theme.colors.primary.teal,
          }}>
            Terms of Service
          </Text>
          {' '}and{' '}
          <Text style={{ 
            textDecorationLine: 'underline',
            color: theme.colors.primary.teal,
          }}>
            Privacy Policy
          </Text>
        </Text>
      </View>

      {/* Bottom spacing */}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}