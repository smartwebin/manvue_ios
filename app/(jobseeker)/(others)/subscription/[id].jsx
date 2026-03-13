import apiService from "@/services/apiService";
import theme from "@/theme";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import * as SecureStore from 'expo-secure-store';
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Platform,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import Animated, {
    FadeInDown,
    FadeInUp,
} from "react-native-reanimated";

const { width } = Dimensions.get('window');

/**
 * Subscription Plans Page - Jobseeker
 * Displays all available subscription plans with features and pricing
 */
export default function SubscriptionPage() {
  const [plans, setPlans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [currentSubscription, setCurrentSubscription] = useState(null);

  useEffect(() => {
    loadPlans();
    loadCurrentSubscription();
  }, []);

  const loadPlans = async () => {
    setIsLoading(true);
    try {
      const response = await apiService.getSubscriptionPlans({ user_type: 'jobseeker' });
      if (response.success && response.data) {
        setPlans(response.data.filter(p => p.is_active === 1));
        
        // Auto-select the most popular or first plan
        const popularPlan = response.data.find(p => p.is_popular === 1) || response.data[0];
        setSelectedPlan(popularPlan?.plan_id);
      }
    } catch (error) {
      console.error('Failed to load plans:', error);
      Alert.alert('Error', 'Failed to load subscription plans. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadCurrentSubscription = async () => {
    try {
      const subscriptionId = await SecureStore.getItemAsync('subscription_id');
      const endDate = await SecureStore.getItemAsync('subscription_end_date');
      const status = await SecureStore.getItemAsync('subscription_status');
      
      if (subscriptionId && status === 'active') {
        setCurrentSubscription({
          id: subscriptionId,
          endDate: endDate,
          status: status,
        });
      }
    } catch (error) {
      console.error('Failed to load current subscription:', error);
    }
  };

  const handleSubscribe = (plan) => {
    if (currentSubscription && currentSubscription.status === 'active') {
      Alert.alert(
        'Already Subscribed',
        'You already have an active subscription. Would you like to upgrade or renew?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Continue', onPress: () => navigateToPayment(plan) }
        ]
      );
    } else {
      navigateToPayment(plan);
    }
  };

  const navigateToPayment = (plan) => {
    router.push({
      pathname: '/(auth)/payment',
      params: { plan_id: plan.plan_id }
    });
  };

  const PlanCard = ({ plan, index }) => {
    const isSelected = selectedPlan === plan.plan_id;
    const isPopular = plan.is_popular === 1;
    const discountPercent = plan.discount_percentage || 0;
    const originalPrice = plan.original_price || plan.price;
    const finalPrice = plan.price;

    return (
      <Animated.View
        entering={FadeInDown.delay(index * 100).springify()}
        style={{
          marginBottom: theme.spacing.lg,
          marginHorizontal: theme.spacing.md,
        }}
      >
        <TouchableOpacity
          onPress={() => setSelectedPlan(plan.plan_id)}
          activeOpacity={0.9}
          style={{
            borderRadius: theme.borderRadius.xl,
            overflow: 'hidden',
            borderWidth: isSelected ? 3 : 1,
            borderColor: isSelected ? theme.colors.primary.teal : theme.colors.border.light,
          }}
        >
          {/* Popular Badge */}
          {isPopular && (
            <View style={{
              position: 'absolute',
              top: 16,
              right: 16,
              zIndex: 10,
            }}>
              <LinearGradient
                colors={['#FFD700', '#FFA500']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  paddingHorizontal: theme.spacing.md,
                  paddingVertical: theme.spacing.xs,
                  borderRadius: theme.borderRadius.full,
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                <Ionicons name="star" size={14} color="#fff" />
                <Text style={{
                  fontSize: theme.typography.sizes.xs,
                  fontFamily: theme.typography.fonts.bold,
                  color: '#fff',
                  marginLeft: 4,
                }}>
                  POPULAR
                </Text>
              </LinearGradient>
            </View>
          )}

          <View style={{
            backgroundColor: theme.colors.background.card,
            padding: theme.spacing.xl,
          }}>
            {/* Plan Header */}
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: theme.spacing.md,
            }}>
              <View style={{
                width: 50,
                height: 50,
                borderRadius: 25,
                backgroundColor: `${theme.colors.primary.teal}20`,
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: theme.spacing.md,
              }}>
                <MaterialCommunityIcons 
                  name="crown" 
                  size={28} 
                  color={theme.colors.primary.teal} 
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{
                  fontSize: theme.typography.sizes.xl,
                  fontFamily: theme.typography.fonts.bold,
                  color: theme.colors.text.primary,
                }}>
                  {plan.plan_name}
                </Text>
                {plan.plan_description && (
                  <Text style={{
                    fontSize: theme.typography.sizes.xs,
                    fontFamily: theme.typography.fonts.regular,
                    color: theme.colors.text.secondary,
                    marginTop: 4,
                  }}>
                    {plan.plan_description}
                  </Text>
                )}
              </View>
            </View>

            {/* Pricing */}
            <View style={{
              flexDirection: 'row',
              alignItems: 'baseline',
              marginBottom: theme.spacing.md,
            }}>
              <Text style={{
                fontSize: theme.typography.sizes.sm,
                fontFamily: theme.typography.fonts.semiBold,
                color: theme.colors.text.secondary,
              }}>
                ₹
              </Text>
              <Text style={{
                fontSize: 42,
                fontFamily: theme.typography.fonts.bold,
                color: theme.colors.primary.teal,
                marginHorizontal: 4,
              }}>
                {finalPrice}
              </Text>
              <View>
                <Text style={{
                  fontSize: theme.typography.sizes.xs,
                  fontFamily: theme.typography.fonts.medium,
                  color: theme.colors.text.secondary,
                }}>
                  / {plan.duration_months} months
                </Text>
                {discountPercent > 0 && (
                  <Text style={{
                    fontSize: theme.typography.sizes.xs,
                    fontFamily: theme.typography.fonts.regular,
                    color: theme.colors.text.tertiary,
                    textDecorationLine: 'line-through',
                  }}>
                    ₹{originalPrice}
                  </Text>
                )}
              </View>
            </View>

            {/* Discount Badge */}
            {discountPercent > 0 && (
              <View style={{
                backgroundColor: theme.colors.status.success,
                paddingHorizontal: theme.spacing.sm,
                paddingVertical: 4,
                borderRadius: theme.borderRadius.md,
                alignSelf: 'flex-start',
                marginBottom: theme.spacing.md,
              }}>
                <Text style={{
                  fontSize: theme.typography.sizes.xs,
                  fontFamily: theme.typography.fonts.bold,
                  color: theme.colors.neutral.white,
                }}>
                  Save {discountPercent}% • ₹{originalPrice - finalPrice} OFF
                </Text>
              </View>
            )}

            {/* Divider */}
            <View style={{
              height: 1,
              backgroundColor: theme.colors.border.light,
              marginVertical: theme.spacing.md,
            }} />

            {/* Features */}
            <View>
              <Text style={{
                fontSize: theme.typography.sizes.sm,
                fontFamily: theme.typography.fonts.semiBold,
                color: theme.colors.text.primary,
                marginBottom: theme.spacing.sm,
              }}>
                What's Included:
              </Text>

              {[
                'Unlimited job applications',
                'Priority listing in searches',
                'Advanced profile customization',
                'Direct employer messaging',
                'Resume builder & templates',
                'Instant job alerts',
                'Application analytics',
                '24/7 priority support',
              ].map((feature, idx) => (
                <View
                  key={idx}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginBottom: theme.spacing.sm,
                  }}
                >
                  <Ionicons
                    name="checkmark-circle"
                    size={18}
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

            {/* Select Button */}
            <TouchableOpacity
              onPress={() => handleSubscribe(plan)}
              style={{
                marginTop: theme.spacing.lg,
                borderRadius: theme.borderRadius.lg,
                overflow: 'hidden',
              }}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={
                  isSelected
                    ? [theme.colors.primary.teal, theme.colors.secondary.darkTeal]
                    : [theme.colors.background.accent, theme.colors.background.accent]
                }
                style={{
                  paddingVertical: theme.spacing.md,
                  alignItems: 'center',
                }}
              >
                <Text style={{
                  fontSize: theme.typography.sizes.base,
                  fontFamily: theme.typography.fonts.bold,
                  color: isSelected ? theme.colors.neutral.white : theme.colors.primary.teal,
                }}>
                  {isSelected ? 'Continue with this Plan' : 'Select Plan'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  if (isLoading) {
    return (
      <View style={{
        flex: 1,
        backgroundColor: theme.colors.background.primary,
        justifyContent: 'center',
        alignItems: 'center',
      }}>
        <ActivityIndicator size="large" color={theme.colors.primary.teal} />
        <Text style={{
          marginTop: theme.spacing.md,
          color: theme.colors.text.secondary,
          fontFamily: theme.typography.fonts.medium,
          fontSize: theme.typography.sizes.base,
        }}>
          Loading subscription plans...
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background.primary }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Header */}
        <Animated.View entering={FadeInUp.springify()}>
          <LinearGradient
            colors={[theme.colors.primary.teal, theme.colors.secondary.darkTeal]}
            style={{
              paddingTop: Platform.OS === 'ios' ? 60 : 40,
              paddingBottom: 30,
              paddingHorizontal: theme.spacing.xl,
            }}
          >
            <TouchableOpacity
              onPress={() => router.back()}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: theme.spacing.md,
              }}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>

            <Text style={{
              fontSize: theme.typography.sizes.xxxl,
              fontFamily: theme.typography.fonts.bold,
              color: theme.colors.neutral.white,
              marginBottom: theme.spacing.xs,
            }}>
              Choose Your Plan
            </Text>
            <Text style={{
              fontSize: theme.typography.sizes.base,
              fontFamily: theme.typography.fonts.regular,
              color: 'rgba(255, 255, 255, 0.9)',
              lineHeight: 22,
            }}>
              Get unlimited access to premium features and supercharge your job search
            </Text>
          </LinearGradient>
        </Animated.View>

        {/* Current Subscription Status */}
        {currentSubscription && currentSubscription.status === 'active' && (
          <Animated.View
            entering={FadeInDown.delay(100).springify()}
            style={{
              marginHorizontal: theme.spacing.xl,
              marginTop: theme.spacing.lg,
              backgroundColor: theme.colors.status.success + '20',
              borderRadius: theme.borderRadius.lg,
              padding: theme.spacing.md,
              borderLeftWidth: 4,
              borderLeftColor: theme.colors.status.success,
            }}
          >
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
            }}>
              <Ionicons
                name="checkmark-circle"
                size={24}
                color={theme.colors.status.success}
                style={{ marginRight: theme.spacing.sm }}
              />
              <View style={{ flex: 1 }}>
                <Text style={{
                  fontSize: theme.typography.sizes.sm,
                  fontFamily: theme.typography.fonts.semiBold,
                  color: theme.colors.status.success,
                }}>
                  Active Subscription
                </Text>
                <Text style={{
                  fontSize: theme.typography.sizes.xs,
                  fontFamily: theme.typography.fonts.regular,
                  color: theme.colors.text.secondary,
                  marginTop: 2,
                }}>
                  Valid until {new Date(currentSubscription.endDate).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })}
                </Text>
              </View>
            </View>
          </Animated.View>
        )}

        {/* Features Highlight */}
        <Animated.View
          entering={FadeInDown.delay(200).springify()}
          style={{
            marginHorizontal: theme.spacing.xl,
            marginTop: theme.spacing.xl,
            marginBottom: theme.spacing.md,
          }}
        >
          <Text style={{
            fontSize: theme.typography.sizes.lg,
            fontFamily: theme.typography.fonts.bold,
            color: theme.colors.text.primary,
            marginBottom: theme.spacing.md,
          }}>
            Why Go Premium?
          </Text>

          <View style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: theme.spacing.sm,
          }}>
            {[
              { icon: 'rocket', label: 'Stand Out', color: '#FF6B6B' },
              { icon: 'trending-up', label: '3x More Views', color: '#4ECDC4' },
              { icon: 'flash', label: 'Instant Alerts', color: '#FFD93D' },
              { icon: 'shield-checkmark', label: 'Priority Support', color: '#6C5CE7' },
            ].map((item, index) => (
              <View
                key={index}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: theme.colors.background.card,
                  paddingHorizontal: theme.spacing.md,
                  paddingVertical: theme.spacing.sm,
                  borderRadius: theme.borderRadius.lg,
                  borderWidth: 1,
                  borderColor: theme.colors.border.light,
                }}
              >
                <Ionicons
                  name={item.icon}
                  size={18}
                  color={item.color}
                  style={{ marginRight: 6 }}
                />
                <Text style={{
                  fontSize: theme.typography.sizes.xs,
                  fontFamily: theme.typography.fonts.medium,
                  color: theme.colors.text.primary,
                }}>
                  {item.label}
                </Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Plans */}
        <View style={{ marginTop: theme.spacing.md }}>
          {plans.map((plan, index) => (
            <PlanCard key={plan.plan_id} plan={plan} index={index} />
          ))}
        </View>

        {/* Trust Badges */}
        <Animated.View
          entering={FadeInDown.delay(400).springify()}
          style={{
            marginHorizontal: theme.spacing.xl,
            marginTop: theme.spacing.xl,
            backgroundColor: theme.colors.background.card,
            borderRadius: theme.borderRadius.lg,
            padding: theme.spacing.lg,
          }}
        >
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-around',
            alignItems: 'center',
          }}>
            <View style={{ alignItems: 'center', flex: 1 }}>
              <Ionicons name="shield-checkmark" size={28} color={theme.colors.primary.teal} />
              <Text style={{
                fontSize: theme.typography.sizes.xs,
                fontFamily: theme.typography.fonts.semiBold,
                color: theme.colors.text.primary,
                marginTop: 4,
                textAlign: 'center',
              }}>
                Secure Payment
              </Text>
            </View>
            <View style={{ alignItems: 'center', flex: 1 }}>
              <Ionicons name="refresh" size={28} color={theme.colors.primary.teal} />
              <Text style={{
                fontSize: theme.typography.sizes.xs,
                fontFamily: theme.typography.fonts.semiBold,
                color: theme.colors.text.primary,
                marginTop: 4,
                textAlign: 'center',
              }}>
                Cancel Anytime
              </Text>
            </View>
            <View style={{ alignItems: 'center', flex: 1 }}>
              <Ionicons name="people" size={28} color={theme.colors.primary.teal} />
              <Text style={{
                fontSize: theme.typography.sizes.xs,
                fontFamily: theme.typography.fonts.semiBold,
                color: theme.colors.text.primary,
                marginTop: 4,
                textAlign: 'center',
              }}>
                50K+ Users
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* FAQ Section */}
        <Animated.View
          entering={FadeInDown.delay(500).springify()}
          style={{
            marginHorizontal: theme.spacing.xl,
            marginTop: theme.spacing.xl,
          }}
        >
          <Text style={{
            fontSize: theme.typography.sizes.lg,
            fontFamily: theme.typography.fonts.bold,
            color: theme.colors.text.primary,
            marginBottom: theme.spacing.md,
          }}>
            Frequently Asked Questions
          </Text>

          {[
            {
              q: 'Can I cancel my subscription?',
              a: 'Yes, you can cancel anytime. Your access will continue until the end of the billing period.'
            },
            {
              q: 'Is payment secure?',
              a: 'Absolutely! All payments are processed securely through Razorpay with bank-level encryption.'
            },
            {
              q: 'What happens after subscription expires?',
              a: 'Your profile will remain active but premium features will be locked. You can renew anytime.'
            },
          ].map((faq, index) => (
            <View
              key={index}
              style={{
                backgroundColor: theme.colors.background.card,
                borderRadius: theme.borderRadius.lg,
                padding: theme.spacing.md,
                marginBottom: theme.spacing.sm,
                borderWidth: 1,
                borderColor: theme.colors.border.light,
              }}
            >
              <Text style={{
                fontSize: theme.typography.sizes.sm,
                fontFamily: theme.typography.fonts.semiBold,
                color: theme.colors.text.primary,
                marginBottom: 4,
              }}>
                {faq.q}
              </Text>
              <Text style={{
                fontSize: theme.typography.sizes.xs,
                fontFamily: theme.typography.fonts.regular,
                color: theme.colors.text.secondary,
                lineHeight: 18,
              }}>
                {faq.a}
              </Text>
            </View>
          ))}
        </Animated.View>

        {/* Contact Support */}
        <Animated.View
          entering={FadeInDown.delay(600).springify()}
          style={{
            marginHorizontal: theme.spacing.xl,
            marginTop: theme.spacing.lg,
            alignItems: 'center',
          }}
        >
          <Text style={{
            fontSize: theme.typography.sizes.xs,
            fontFamily: theme.typography.fonts.regular,
            color: theme.colors.text.tertiary,
            textAlign: 'center',
            marginBottom: theme.spacing.sm,
          }}>
            Need help choosing a plan?
          </Text>
          <TouchableOpacity>
            <Text style={{
              fontSize: theme.typography.sizes.sm,
              fontFamily: theme.typography.fonts.semiBold,
              color: theme.colors.primary.teal,
              textDecorationLine: 'underline',
            }}>
              Contact Support
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </View>
  );
}