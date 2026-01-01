import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { CheckCircle2, ArrowRight, Zap } from 'lucide-react';
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

const PRICING_PLANS = [
  {
    name: 'Starter',
    price: 99,
    description: 'Perfect for small lending operations',
    features: [
      'Up to 100 loans',
      'Up to 5 users',
      'Basic reporting',
      'Email support',
      'KYC verification',
      'Loan origination',
      'Payment processing',
      'Basic analytics'
    ],
    highlighted: false,
    cta: 'Start Free Trial'
  },
  {
    name: 'Professional',
    price: 299,
    description: 'For growing lending institutions',
    features: [
      'Up to 1,000 loans',
      'Up to 25 users',
      'Advanced analytics',
      'Custom reports',
      'Write-off management',
      'Priority support',
      'IFRS 9 compliance',
      'BoZ provisioning',
      'Portfolio analytics',
      'Risk management'
    ],
    highlighted: true,
    cta: 'Start Free Trial'
  },
  {
    name: 'Enterprise',
    price: 999,
    description: 'For large-scale operations',
    features: [
      'Unlimited loans',
      'Unlimited users',
      'All features included',
      'Advanced compliance',
      'API access',
      'White-label options',
      'Dedicated support',
      'Custom integrations',
      'Advanced reporting',
      'SLA guarantee'
    ],
    highlighted: false,
    cta: 'Contact Sales'
  }
];

const FAQ_ITEMS = [
  {
    question: 'Can I upgrade or downgrade my plan?',
    answer: 'Yes, you can change your plan at any time. Changes take effect at the start of your next billing cycle.'
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'We accept all major credit cards, bank transfers, and mobile money payments for your convenience.'
  },
  {
    question: 'Is there a setup fee?',
    answer: 'No setup fees. You only pay the monthly subscription price. Implementation support is included.'
  },
  {
    question: 'What happens if I exceed my loan limit?',
    answer: 'We\'ll notify you when you\'re approaching your limit. You can upgrade anytime to increase your capacity.'
  },
  {
    question: 'Do you offer discounts for annual billing?',
    answer: 'Yes! Annual billing gets you 2 months free. Contact our sales team for custom enterprise pricing.'
  },
  {
    question: 'Is there a free trial?',
    answer: 'Yes, all plans come with a 14-day free trial. No credit card required to get started.'
  }
];

export default function PricingPage() {
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
              <span className="text-secondary font-medium tracking-wider uppercase text-sm">Transparent Pricing</span>
            </div>
            <h1 className="font-heading text-6xl lg:text-7xl font-bold leading-tight mb-6">
              Simple, Transparent <span className="text-secondary">Pricing</span>
            </h1>
            <p className="text-xl text-primary-foreground/80 max-w-2xl">
              Choose the plan that fits your lending operation. Scale up anytime as you grow.
            </p>
          </AnimatedReveal>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="w-full py-32 relative">
        <div className="max-w-[120rem] mx-auto px-6 lg:px-12">
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {PRICING_PLANS.map((plan, index) => (
              <AnimatedReveal key={index} delay={index * 0.2} className="group">
                <div className={`h-full rounded-3xl transition-all duration-500 flex flex-col relative overflow-hidden ${
                  plan.highlighted 
                    ? 'bg-gradient-to-br from-secondary/20 to-transparent border-2 border-secondary p-8 lg:scale-105' 
                    : 'bg-primary-foreground/[0.03] border border-primary-foreground/10 p-8 hover:border-primary-foreground/20'
                }`}>
                  {plan.highlighted && (
                    <div className="absolute top-0 right-0 bg-secondary text-primary px-4 py-2 rounded-bl-2xl font-bold text-sm">
                      POPULAR
                    </div>
                  )}

                  <div className="mb-8">
                    <h3 className="font-heading text-3xl font-bold mb-2">{plan.name}</h3>
                    <p className="text-primary-foreground/60 mb-6">{plan.description}</p>
                    <div className="flex items-baseline gap-2 mb-4">
                      <span className="font-heading text-5xl font-bold">${plan.price}</span>
                      <span className="text-primary-foreground/60">/month</span>
                    </div>
                    <p className="text-sm text-primary-foreground/50">Billed monthly. Cancel anytime.</p>
                  </div>

                  <Button 
                    className={`w-full h-12 rounded-full font-bold mb-8 transition-all ${
                      plan.highlighted
                        ? 'bg-secondary text-primary hover:bg-secondary/90'
                        : 'bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20 border border-primary-foreground/20'
                    }`}
                  >
                    {plan.cta}
                  </Button>

                  <div className="space-y-4 flex-1">
                    {plan.features.map((feature, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <CheckCircle2 className={`w-5 h-5 flex-shrink-0 mt-0.5 ${plan.highlighted ? 'text-secondary' : 'text-brandaccent'}`} />
                        <span className="text-primary-foreground/80">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </AnimatedReveal>
            ))}
          </div>

          {/* Additional Info */}
          <AnimatedReveal className="mt-20 text-center max-w-3xl mx-auto">
            <div className="p-8 rounded-3xl bg-primary-foreground/[0.03] border border-primary-foreground/10">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Zap className="w-5 h-5 text-secondary" />
                <span className="font-semibold text-secondary">Special Offer</span>
              </div>
              <h3 className="font-heading text-2xl font-bold mb-4">Annual Billing Discount</h3>
              <p className="text-primary-foreground/70 mb-6">
                Save 2 months when you pay annually. Plus, get priority support and custom implementation assistance.
              </p>
              <Button variant="link" className="text-secondary p-0 h-auto font-semibold text-lg group">
                Learn More <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </AnimatedReveal>
        </div>
      </section>

      {/* Features Comparison */}
      <section className="w-full py-32 bg-primary-foreground/[0.02] border-y border-primary-foreground/5">
        <div className="max-w-[120rem] mx-auto px-6 lg:px-12">
          <AnimatedReveal className="mb-20 text-center max-w-4xl mx-auto">
            <h2 className="font-heading text-5xl lg:text-6xl font-bold mb-6">
              What's <span className="text-secondary">Included</span>
            </h2>
            <p className="text-xl text-primary-foreground/70">
              All plans include core features. Professional and Enterprise add advanced capabilities.
            </p>
          </AnimatedReveal>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-primary-foreground/10">
                  <th className="text-left py-4 px-6 font-heading font-bold">Feature</th>
                  <th className="text-center py-4 px-6 font-heading font-bold">Starter</th>
                  <th className="text-center py-4 px-6 font-heading font-bold">Professional</th>
                  <th className="text-center py-4 px-6 font-heading font-bold">Enterprise</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { feature: 'Loan Management', starter: true, pro: true, enterprise: true },
                  { feature: 'Customer Profiles', starter: true, pro: true, enterprise: true },
                  { feature: 'Payment Processing', starter: true, pro: true, enterprise: true },
                  { feature: 'Basic Analytics', starter: true, pro: true, enterprise: true },
                  { feature: 'Advanced Analytics', starter: false, pro: true, enterprise: true },
                  { feature: 'Write-off Management', starter: false, pro: true, enterprise: true },
                  { feature: 'IFRS 9 Compliance', starter: false, pro: true, enterprise: true },
                  { feature: 'BoZ Provisioning', starter: false, pro: true, enterprise: true },
                  { feature: 'API Access', starter: false, pro: false, enterprise: true },
                  { feature: 'White-label', starter: false, pro: false, enterprise: true },
                  { feature: 'Dedicated Support', starter: false, pro: false, enterprise: true },
                ].map((row, i) => (
                  <tr key={i} className="border-b border-primary-foreground/5 hover:bg-primary-foreground/[0.02] transition-colors">
                    <td className="py-4 px-6 font-semibold text-primary-foreground/80">{row.feature}</td>
                    <td className="py-4 px-6 text-center">
                      {row.starter ? <CheckCircle2 className="w-5 h-5 text-secondary mx-auto" /> : <span className="text-primary-foreground/30">—</span>}
                    </td>
                    <td className="py-4 px-6 text-center">
                      {row.pro ? <CheckCircle2 className="w-5 h-5 text-secondary mx-auto" /> : <span className="text-primary-foreground/30">—</span>}
                    </td>
                    <td className="py-4 px-6 text-center">
                      {row.enterprise ? <CheckCircle2 className="w-5 h-5 text-secondary mx-auto" /> : <span className="text-primary-foreground/30">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="w-full py-32 relative">
        <div className="max-w-[120rem] mx-auto px-6 lg:px-12">
          <AnimatedReveal className="mb-20 text-center max-w-4xl mx-auto">
            <h2 className="font-heading text-5xl lg:text-6xl font-bold mb-6">
              Frequently Asked <span className="text-secondary">Questions</span>
            </h2>
          </AnimatedReveal>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {FAQ_ITEMS.map((item, index) => (
              <AnimatedReveal key={index} delay={index * 0.1}>
                <div className="p-8 rounded-3xl bg-primary-foreground/[0.03] border border-primary-foreground/10 hover:border-primary-foreground/20 transition-all">
                  <h3 className="font-heading text-xl font-bold mb-4 text-secondary">{item.question}</h3>
                  <p className="text-primary-foreground/70 leading-relaxed">{item.answer}</p>
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
              Start Your <span className="text-secondary">Free Trial</span>
            </h2>
            <p className="text-2xl text-primary-foreground/70 mb-12 max-w-2xl mx-auto">
              14 days free. No credit card required. Full access to all features.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Button className="bg-secondary text-primary hover:bg-secondary/90 h-16 px-12 text-xl rounded-full font-bold min-w-[200px]">
                Start Free Trial
              </Button>
              <Button variant="outline" className="border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10 h-16 px-12 text-xl rounded-full min-w-[200px]">
                Contact Sales <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </AnimatedReveal>
        </div>
      </section>

      <Footer />
    </div>
  );
}
