import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import {
  Users,
  TrendingUp,
  Calculator,
  Shield,
  BarChart3,
  FileCheck,
  Lock,
  CheckCircle2,
  ArrowRight,
  Zap,
  Database,
  Bell,
  Settings,
  Smartphone,
  Globe,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { motion, useInView } from 'framer-motion';

const AnimatedReveal = ({ children, className, delay = 0 }: { children: React.ReactNode, className?: string, delay?: number }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-10% 0px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{ duration: 0.8, ease: [0.21, 0.47, 0.32, 0.98], delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

const CORE_FEATURES = [
  {
    icon: Users,
    title: 'Customer Management',
    description: 'Comprehensive KYC profiles with credit scoring and verification workflows.',
    details: ['Profile Management', 'KYC Verification', 'Credit Scoring', 'Document Management']
  },
  {
    icon: TrendingUp,
    title: 'Loan Origination',
    description: 'Streamlined application processing with configurable product terms.',
    details: ['Application Processing', 'Product Configuration', 'Approval Workflows', 'Disbursement Management']
  },
  {
    icon: Calculator,
    title: 'Interest Calculations',
    description: 'Multiple interest calculation methods with amortization schedules.',
    details: ['Simple Interest', 'Compound Interest', 'Reducing Balance', 'Amortization Schedules']
  },
  {
    icon: Shield,
    title: 'BoZ Compliance',
    description: 'Bank of Zambia classification rules with automated provisioning.',
    details: ['Classification Rules', 'Provisioning Calculations', 'Regulatory Reporting', 'Audit Trail']
  },
  {
    icon: BarChart3,
    title: 'Portfolio Analytics',
    description: 'Real-time dashboards tracking performance and risk metrics.',
    details: ['Performance Metrics', 'Risk Analysis', 'Trend Analysis', 'Custom Reports']
  },
  {
    icon: FileCheck,
    title: 'Repayment Processing',
    description: 'Automated interest calculations and payment allocation.',
    details: ['Payment Recording', 'Interest Accrual', 'Balance Updates', 'Penalty Management']
  },
  {
    icon: Lock,
    title: 'Role-Based Access',
    description: 'Granular permissions for different user types.',
    details: ['Admin Controls', 'Officer Permissions', 'Manager Approvals', 'Customer Portal']
  },
  {
    icon: CheckCircle2,
    title: 'Audit Trail',
    description: 'Complete transaction history with exportable reports.',
    details: ['Activity Logging', 'Change Tracking', 'Report Generation', 'Compliance Export']
  },
];

const ADVANCED_FEATURES = [
  {
    icon: Zap,
    title: 'Write-off Management',
    description: 'Complete write-off and recovery workflow with tracking.',
  },
  {
    icon: Database,
    title: 'Data Analytics',
    description: 'Comprehensive portfolio and customer analytics.',
  },
  {
    icon: Bell,
    title: 'Notifications',
    description: 'Automated alerts for important events and milestones.',
  },
  {
    icon: Settings,
    title: 'Customization',
    description: 'Flexible configuration for your specific needs.',
  },
  {
    icon: Smartphone,
    title: 'Mobile Ready',
    description: 'Responsive design works on all devices.',
  },
  {
    icon: Globe,
    title: 'Multi-Currency',
    description: 'Support for multiple currencies and localization.',
  },
  {
    icon: Clock,
    title: 'Real-time Updates',
    description: 'Live data synchronization across the platform.',
  },
  {
    icon: AlertCircle,
    title: 'Risk Management',
    description: 'Advanced risk assessment and monitoring tools.',
  },
];

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-primary text-primary-foreground font-paragraph overflow-clip selection:bg-secondary selection:text-primary">
      <Header />

      {/* Hero Section */}
      <section className="relative w-full min-h-[60vh] flex items-center pt-20 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[60vw] h-[60vw] bg-brandaccent/5 rounded-full blur-[120px] translate-x-1/3 -translate-y-1/4" />
          <div className="absolute bottom-0 left-0 w-[40vw] h-[40vw] bg-secondary/5 rounded-full blur-[100px] -translate-x-1/3 translate-y-1/4" />
        </div>

        <div className="w-full max-w-[120rem] mx-auto px-6 lg:px-12 relative z-10">
          <AnimatedReveal className="max-w-3xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-[1px] bg-secondary" />
              <span className="text-secondary font-medium tracking-wider uppercase text-sm">Comprehensive Suite</span>
            </div>
            <h1 className="font-heading text-6xl lg:text-7xl font-bold leading-tight mb-6">
              Powerful Features for <span className="text-secondary">Modern Lending</span>
            </h1>
            <p className="text-xl text-primary-foreground/80 max-w-2xl">
              Everything you need to manage loans efficiently, from origination to closure, with built-in compliance and analytics.
            </p>
          </AnimatedReveal>
        </div>
      </section>

      {/* Core Features Grid */}
      <section className="w-full py-32 relative">
        <div className="max-w-[120rem] mx-auto px-6 lg:px-12">
          <AnimatedReveal className="mb-20 max-w-4xl">
            <h2 className="font-heading text-5xl lg:text-6xl font-bold mb-6">
              Core <span className="text-secondary">Features</span>
            </h2>
            <p className="text-xl text-primary-foreground/70">
              Essential tools for every stage of the lending lifecycle.
            </p>
          </AnimatedReveal>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {CORE_FEATURES.map((feature, index) => (
              <AnimatedReveal key={index} delay={index * 0.1} className="group">
                <div className="h-full p-8 rounded-3xl bg-primary-foreground/[0.03] border border-primary-foreground/10 hover:bg-primary-foreground/[0.06] hover:border-secondary/30 transition-all duration-500 flex flex-col">
                  <div className="w-14 h-14 rounded-2xl bg-primary-foreground/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 text-secondary">
                    <feature.icon className="w-7 h-7" />
                  </div>
                  <h3 className="font-heading text-2xl font-bold mb-3 group-hover:text-secondary transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-primary-foreground/60 leading-relaxed mb-6">
                    {feature.description}
                  </p>
                  <div className="space-y-2 mt-auto">
                    {feature.details.map((detail, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-primary-foreground/50">
                        <CheckCircle2 className="w-4 h-4 text-secondary" />
                        {detail}
                      </div>
                    ))}
                  </div>
                </div>
              </AnimatedReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Advanced Features */}
      <section className="w-full py-32 bg-primary-foreground/[0.02] border-y border-primary-foreground/5">
        <div className="max-w-[120rem] mx-auto px-6 lg:px-12">
          <AnimatedReveal className="mb-20 max-w-4xl">
            <h2 className="font-heading text-5xl lg:text-6xl font-bold mb-6">
              Advanced <span className="text-secondary">Capabilities</span>
            </h2>
            <p className="text-xl text-primary-foreground/70">
              Enterprise-grade features for sophisticated lending operations.
            </p>
          </AnimatedReveal>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {ADVANCED_FEATURES.map((feature, index) => (
              <AnimatedReveal key={index} delay={index * 0.1} className="group">
                <div className="h-full p-8 rounded-3xl bg-primary-foreground/[0.03] border border-primary-foreground/10 hover:bg-primary-foreground/[0.06] hover:border-brandaccent/30 transition-all duration-500 flex flex-col">
                  <div className="w-14 h-14 rounded-2xl bg-primary-foreground/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 text-brandaccent">
                    <feature.icon className="w-7 h-7" />
                  </div>
                  <h3 className="font-heading text-2xl font-bold mb-3 group-hover:text-brandaccent transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-primary-foreground/60 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </AnimatedReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Comparison */}
      <section className="w-full py-32 relative">
        <div className="max-w-[120rem] mx-auto px-6 lg:px-12">
          <AnimatedReveal className="mb-20 text-center max-w-4xl mx-auto">
            <h2 className="font-heading text-5xl lg:text-6xl font-bold mb-6">
              Everything You <span className="text-secondary">Need</span>
            </h2>
            <p className="text-xl text-primary-foreground/70">
              All features are included in every subscription tier. Scale your operations without limitations.
            </p>
          </AnimatedReveal>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: 'Loan Management',
                items: ['Application Processing', 'Approval Workflows', 'Disbursement Tracking', 'Status Monitoring']
              },
              {
                title: 'Financial Operations',
                items: ['Interest Calculations', 'Payment Processing', 'Balance Updates', 'Penalty Management']
              },
              {
                title: 'Compliance & Reporting',
                items: ['IFRS 9 Compliance', 'BoZ Standards', 'Audit Trail', 'Regulatory Reports']
              }
            ].map((category, i) => (
              <AnimatedReveal key={i} delay={i * 0.2}>
                <div className="p-8 rounded-3xl bg-primary-foreground/[0.03] border border-primary-foreground/10 hover:border-secondary/30 transition-all duration-500">
                  <h3 className="font-heading text-2xl font-bold mb-6 text-secondary">{category.title}</h3>
                  <ul className="space-y-4">
                    {category.items.map((item, j) => (
                      <li key={j} className="flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-secondary flex-shrink-0" />
                        <span className="text-primary-foreground/80">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </AnimatedReveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary to-black/40" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-primary-foreground/5 rounded-full" />

        <div className="max-w-4xl mx-auto px-6 relative z-10 text-center">
          <AnimatedReveal>
            <h2 className="font-heading text-6xl lg:text-7xl font-bold mb-8">
              Ready to Get <span className="text-secondary">Started?</span>
            </h2>
            <p className="text-2xl text-primary-foreground/70 mb-12 max-w-2xl mx-auto">
              Explore all features with a free trial. No credit card required.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Button className="bg-secondary text-primary hover:bg-secondary/90 h-16 px-12 text-xl rounded-full font-bold min-w-[200px]">
                Start Free Trial
              </Button>
              <Button variant="outline" className="border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10 h-16 px-12 text-xl rounded-full min-w-[200px]">
                View Pricing <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </AnimatedReveal>
        </div>
      </section>

      <Footer />
    </div>
  );
}
