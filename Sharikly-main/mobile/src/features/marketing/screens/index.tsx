import { colors, radii, shadows, spacing } from "@/core/theme/tokens";
import { useNavigation } from "@react-navigation/native";
import {
  ArrowLeft,
  Calendar,
  CreditCard,
  HelpCircle,
  Package,
  Search,
} from "lucide-react-native";
import React, { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const STEPS = [
  {
    icon: Search,
    step: "1",
    title: "Browse",
    text: "Find cameras, lenses, tools, and gear near you. Filter by category, price, and location.",
  },
  {
    icon: Calendar,
    step: "2",
    title: "Request",
    text: "Select your dates and send a booking request. The owner will accept or decline.",
  },
  {
    icon: CreditCard,
    step: "3",
    title: "Book",
    text: "Once accepted, your booking is confirmed. You'll receive a receipt and confirmation.",
  },
  {
    icon: Package,
    step: "4",
    title: "Enjoy",
    text: "Pick up the item, use it for your rental period, and return it in the same condition.",
  },
];

const FAQS = [
  {
    q: "How do I book an item?",
    a: "Go to the listing, choose your dates, and tap \"Send Request.\" The owner will respond. If they accept, your booking is confirmed.",
  },
  {
    q: "What if I need to cancel?",
    a: "Cancel from your Bookings page. Contact the owner directly and they can help with the cancellation.",
  },
  {
    q: "How do I list my gear?",
    a: "Go to Profile → Host Dashboard → List Item. Add photos and details, set your price and location. You'll receive requests and can accept or decline.",
  },
  {
    q: "Is Ekra safe to use?",
    a: "Yes. Every booking is tracked and verified. Hosts and renters build public profiles with reviews so you always know who you're dealing with.",
  },
  {
    q: "What categories can I rent?",
    a: "Cameras, electronics, tools, sports equipment, vehicles, event gear, and more. Browse the Explore tab to see all categories.",
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <Pressable style={styles.faqItem} onPress={() => setOpen((o) => !o)}>
      <View style={styles.faqHeader}>
        <Text style={styles.faqQ}>{q}</Text>
        <Text style={styles.faqToggle}>{open ? "−" : "+"}</Text>
      </View>
      {open && <Text style={styles.faqA}>{a}</Text>}
    </Pressable>
  );
}

export function HowItWorksScreen(): React.ReactElement {
  const navigation = useNavigation();
  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={8}>
          <ArrowLeft size={20} color={colors.foreground} />
        </Pressable>
        <Text style={styles.headerTitle}>How It Works</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Text style={styles.mainTitle}>Rent gear in four{"\n"}simple steps</Text>
        <Text style={styles.mainSub}>Browse, request, confirm, and enjoy. Simple and secure.</Text>
        <View style={styles.stepsGrid}>
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <View key={i} style={styles.stepCard}>
                <View style={styles.stepHeader}>
                  <View style={styles.stepBadge}>
                    <Text style={styles.stepBadgeText}>Step {step.step}</Text>
                  </View>
                  <View style={styles.stepIconWrap}>
                    <Icon size={18} color={colors.primary} />
                  </View>
                </View>
                <Text style={styles.stepTitle}>{step.title}</Text>
                <Text style={styles.stepText}>{step.text}</Text>
              </View>
            );
          })}
        </View>
        <View style={styles.faqSection}>
          <View style={styles.faqTitleRow}>
            <HelpCircle size={18} color={colors.primary} />
            <Text style={styles.faqTitle}>Frequently Asked Questions</Text>
          </View>
          <View style={styles.faqCard}>
            {FAQS.map((faq, i) => (
              <React.Fragment key={i}>
                <FaqItem q={faq.q} a={faq.a} />
                {i < FAQS.length - 1 && <View style={styles.faqDivider} />}
              </React.Fragment>
            ))}
          </View>
        </View>
        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

export function AboutScreen(): React.ReactElement {
  const navigation = useNavigation();
  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={8}>
          <ArrowLeft size={20} color={colors.foreground} />
        </Pressable>
        <Text style={styles.headerTitle}>About Ekra</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.aboutHero}>
          <Text style={styles.aboutLogoText}>ekra</Text>
          <Text style={styles.aboutTagline}>The P2P Rental Marketplace</Text>
        </View>
        <View style={styles.aboutCard}>
          <Text style={styles.aboutHeading}>Our Mission</Text>
          <Text style={styles.aboutBody}>
            Ekra connects people who have items they&apos;re not using with people who need them for short periods. We believe in a world where ownership is shared and value doesn&apos;t sit idle.
          </Text>
        </View>
        <View style={styles.aboutCard}>
          <Text style={styles.aboutHeading}>What We Do</Text>
          <Text style={styles.aboutBody}>
            We built the first peer-to-peer rental marketplace in Saudi Arabia, starting with cameras and electronics and expanding across all categories. Whether you need tools for a weekend project or photography gear for a shoot, Ekra has you covered.
          </Text>
        </View>
        <View style={styles.aboutCard}>
          <Text style={styles.aboutHeading}>For Hosts</Text>
          <Text style={styles.aboutBody}>
            Turn your unused items into a source of passive income. List anything from cameras and drones to tools and sporting equipment. Thousands of renters browse Ekra every day.
          </Text>
        </View>
        <View style={styles.aboutCard}>
          <Text style={styles.aboutHeading}>Contact</Text>
          <Text style={styles.aboutBody}>
            Have questions or feedback? Reach us through the Support section in the app. We&apos;re always happy to hear from our community.
          </Text>
        </View>
        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

export function PrivacyScreen(): React.ReactElement {
  const navigation = useNavigation();
  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={8}>
          <ArrowLeft size={20} color={colors.foreground} />
        </Pressable>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {[
          { h: "Information We Collect", b: "We collect information you provide when signing up and using Ekra, including your name, email, profile information, listing details, booking history, and communications with other users." },
          { h: "How We Use Your Information", b: "We use your information to operate the Ekra platform, process bookings, send notifications, provide customer support, and improve our services." },
          { h: "Information Sharing", b: "We share necessary information between hosts and renters to facilitate bookings. We do not sell your personal information to third parties." },
          { h: "Data Security", b: "We implement industry-standard security measures to protect your information. However, no method of transmission over the Internet is completely secure." },
          { h: "Your Rights", b: "You can access, correct, or delete your account information at any time through the Settings page. You may also contact us to request data deletion." },
          { h: "Contact Us", b: "If you have questions about this privacy policy, please contact us through the Support section in the app." },
        ].map((section, i) => (
          <View key={i} style={styles.aboutCard}>
            <Text style={styles.aboutHeading}>{section.h}</Text>
            <Text style={styles.aboutBody}>{section.b}</Text>
          </View>
        ))}
        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

export function TermsScreen(): React.ReactElement {
  const navigation = useNavigation();
  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={8}>
          <ArrowLeft size={20} color={colors.foreground} />
        </Pressable>
        <Text style={styles.headerTitle}>Terms of Service</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {[
          { h: "Acceptance of Terms", b: "By using Ekra, you agree to these Terms of Service. If you do not agree, please do not use our platform." },
          { h: "User Accounts", b: "You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account." },
          { h: "Listings and Bookings", b: "Hosts are responsible for the accuracy of their listings. Renters are responsible for returning items in the same condition as received." },
          { h: "Prohibited Use", b: "You may not use Ekra for illegal activities, misrepresent items, or engage in fraudulent transactions. Violations may result in account termination." },
          { h: "Limitation of Liability", b: "Ekra acts as a marketplace platform. We are not responsible for the condition of items, disputes between users, or losses arising from transactions." },
          { h: "Changes to Terms", b: "We reserve the right to modify these terms at any time. Continued use of Ekra after changes constitutes acceptance of the new terms." },
        ].map((section, i) => (
          <View key={i} style={styles.aboutCard}>
            <Text style={styles.aboutHeading}>{section.h}</Text>
            <Text style={styles.aboutBody}>{section.b}</Text>
          </View>
        ))}
        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

export function CareersScreen(): React.ReactElement {
  const navigation = useNavigation();
  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={8}>
          <ArrowLeft size={20} color={colors.foreground} />
        </Pressable>
        <Text style={styles.headerTitle}>Careers</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.aboutHero}>
          <Text style={styles.careersTitle}>Join the Ekra Team</Text>
          <Text style={styles.mainSub}>Help us build the future of peer-to-peer rentals in Saudi Arabia.</Text>
        </View>
        <View style={styles.aboutCard}>
          <Text style={styles.aboutHeading}>Open Positions</Text>
          <Text style={styles.aboutBody}>We&apos;re always looking for talented people. Send your resume and cover letter to us through the Support section and mention the role you&apos;re interested in.</Text>
        </View>
        <View style={styles.aboutCard}>
          <Text style={styles.aboutHeading}>Our Values</Text>
          <Text style={styles.aboutBody}>We build for the community, move fast, and trust each other. If you share these values, we&apos;d love to hear from you.</Text>
        </View>
        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: radii.full,
    backgroundColor: colors.surface2,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerTitle: { fontSize: 17, fontWeight: "700", color: colors.foreground },

  content: { padding: spacing.md },
  mainTitle: { fontSize: 28, fontWeight: "900", color: colors.foreground, letterSpacing: -0.5, marginBottom: 8, marginTop: 8 },
  mainSub: { fontSize: 15, color: colors.mutedForeground, lineHeight: 22, marginBottom: 20 },

  stepsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 24 },
  stepCard: {
    width: "47%",
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: radii.xl,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  stepHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  stepBadge: {
    backgroundColor: colors.accent,
    borderRadius: radii.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  stepBadgeText: { fontSize: 10, fontWeight: "700", color: colors.primary },
  stepIconWrap: {
    width: 30,
    height: 30,
    borderRadius: radii.md,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  stepTitle: { fontSize: 15, fontWeight: "700", color: colors.foreground, marginBottom: 4 },
  stepText: { fontSize: 12, color: colors.mutedForeground, lineHeight: 18 },

  faqSection: { marginBottom: 24 },
  faqTitleRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  faqTitle: { fontSize: 17, fontWeight: "800", color: colors.foreground },
  faqCard: {
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    ...shadows.card,
  },
  faqItem: { padding: spacing.md },
  faqHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 },
  faqQ: { flex: 1, fontSize: 14, fontWeight: "700", color: colors.foreground },
  faqToggle: { fontSize: 22, fontWeight: "300", color: colors.primary },
  faqA: { fontSize: 14, color: colors.textSecondary, lineHeight: 21, marginTop: 8 },
  faqDivider: { height: 1, backgroundColor: colors.border, marginHorizontal: spacing.md },

  aboutHero: {
    alignItems: "center",
    paddingVertical: 24,
    marginBottom: 8,
  },
  aboutLogoText: { fontSize: 44, fontWeight: "900", color: colors.primary, letterSpacing: -2 },
  aboutTagline: { fontSize: 15, color: colors.mutedForeground, marginTop: 6 },
  careersTitle: { fontSize: 28, fontWeight: "900", color: colors.foreground, letterSpacing: -0.5, marginBottom: 8 },

  aboutCard: {
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: 10,
    ...shadows.card,
  },
  aboutHeading: { fontSize: 16, fontWeight: "700", color: colors.foreground, marginBottom: 8 },
  aboutBody: { fontSize: 14, color: colors.textSecondary, lineHeight: 22 },
});
