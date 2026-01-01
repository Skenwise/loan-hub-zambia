import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import {
  Shield,
  CheckCircle2,
  FileCheck,
  Lock,
  BarChart3,
  AlertCircle,
  ArrowRight,
  BookOpen,
  Zap,
  Globe,
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

const COMPLIANCE_FRAMEWORKS = [
  {
    icon: Shield,
    title: 'IFRS 9 Compliance',
    description: 'Expected Credit Loss (ECL) calculations with automated stage classification.',
    details: [
      'Stage 1: 12-month ECL for performing loans',
      'Stage 2: Lifetime ECL for underperforming loans',
      'Stage 3: Lifetime ECL for non-performing loans',
      'Probability of Default (PD) modeling',
      'Loss Given Default (LGD) calculations',
      'Exposure at Default (EAD) tracking'
    ]
  },
  {
    icon: Globe,
    title: 'Bank of Zambia Standards',
    description: 'Full compliance with BoZ loan classification and provisioning rules.',
    details: [
      'Standard (0-30 days): 0% provision',
      'Substandard (31-90 days): 10% provision',
      'Doubtful (91-180 days): 25% provision',
      'Loss (180+ days): 100% provision',
      'Automated classification',
      'Real-time provisioning calculations'
    ]
  },
  {
    icon: Lock,
    title: 'Data Security',
    description: 'Enterprise-grade security with encryption and access controls.',
    details: [
      'AES-256 encryption at rest',
      'TLS 1.3 encryption in transit',
      'Role-based access control (RBAC)',
      'Multi-factor authentication',
      'Audit logging and monitoring',
      'Regular security assessments'
    ]
  },
  {
    icon: FileCheck,
    title: 'Regulatory Reporting',
    description: 'Automated report generation for regulatory submissions.',
    details: [
      'BoZ quarterly reports',
      'IFRS 9 disclosure statements',
      'Portfolio risk reports',
      'Non-performing loan reports',
      'Provision adequacy reports',
      'Customizable report templates'
    ]
  }
];

const COMPLIANCE_FEATURES = [
  {
    icon: BarChart3,
    title: 'Portfolio Analytics',
    description: 'Real-time monitoring of portfolio health and risk metrics.'
  },
  {
    icon: AlertCircle,
    title: 'Risk Management',
    description: 'Automated alerts for compliance breaches and risk thresholds.'
  },
  {
    icon: BookOpen,
    title: 'Documentation',
    description: 'Complete audit trail and documentation for regulatory review.'
  },
  {
    icon: Zap,
    title: 'Automation',
    description: 'Automated calculations reduce manual errors and ensure accuracy.'
  }
];

const AUDIT_TRAIL = [
  'User activity logging',
  'Transaction tracking',
  'Change history',
  'Approval workflows',
  'System events',
  'Data access logs'
];

export default function CompliancePage() {
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
              <span className="text-secondary font-medium tracking-wider uppercase text-sm">Regulatory Excellence</span>
            </div>
            <h1 className="font-heading text-6xl lg:text-7xl font-bold leading-tight mb-6">
              Built for <span className="text-secondary">Compliance</span>
            </h1>
            <p className="text-xl text-primary-foreground/80 max-w-2xl">
              Full compliance with IFRS 9, Bank of Zambia standards, and international best practices. Automated calculations ensure accuracy and reduce regulatory risk.
            </p>
          </AnimatedReveal>
        </div>
      </section>

      {/* Compliance Frameworks */}
      <section className="w-full py-32 relative">
        <div className="max-w-[120rem] mx-auto px-6 lg:px-12">
          <AnimatedReveal className="mb-20 max-w-4xl">
            <h2 className="font-heading text-5xl lg:text-6xl font-bold mb-6">
              Compliance <span className="text-secondary">Frameworks</span>
            </h2>
            <p className="text-xl text-primary-foreground/70">
              Comprehensive support for all major regulatory requirements.
            </p>
          </AnimatedReveal>

          <div className="grid md:grid-cols-2 gap-8">
            {COMPLIANCE_FRAMEWORKS.map((framework, index) => (
              <AnimatedReveal key={index} delay={index * 0.1} className="group">
                <div className="h-full p-8 rounded-3xl bg-primary-foreground/[0.03] border border-primary-foreground/10 hover:bg-primary-foreground/[0.06] hover:border-secondary/30 transition-all duration-500 flex flex-col">
                  <div className="w-14 h-14 rounded-2xl bg-primary-foreground/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 text-secondary">
                    <framework.icon className="w-7 h-7" />
                  </div>
                  <h3 className="font-heading text-2xl font-bold mb-3 group-hover:text-secondary transition-colors">
                    {framework.title}
                  </h3>
                  <p className="text-primary-foreground/60 leading-relaxed mb-6">
                    {framework.description}
                  </p>
                  <div className="space-y-3 mt-auto">
                    {framework.details.map((detail, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-secondary flex-shrink-0 mt-0.5" />
                        <span className="text-primary-foreground/70 text-sm">{detail}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </AnimatedReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Key Features */}
      <section className="w-full py-32 bg-primary-foreground/[0.02] border-y border-primary-foreground/5">
        <div className="max-w-[120rem] mx-auto px-6 lg:px-12">
          <AnimatedReveal className="mb-20 text-center max-w-4xl mx-auto">
            <h2 className="font-heading text-5xl lg:text-6xl font-bold mb-6">
              Compliance <span className="text-secondary">Features</span>
            </h2>
            <p className="text-xl text-primary-foreground/70">
              Tools and capabilities to ensure regulatory compliance.
            </p>
          </AnimatedReveal>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {COMPLIANCE_FEATURES.map((feature, index) => (
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

      {/* IFRS 9 Deep Dive */}
      <section className="w-full py-32 relative">
        <div className="max-w-[120rem] mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <AnimatedReveal>
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/10 border border-secondary/20 text-secondary mb-8">
                  <Shield className="w-4 h-4" />
                  <span className="text-sm font-semibold uppercase tracking-wider">IFRS 9 Standard</span>
                </div>
                <h2 className="font-heading text-5xl lg:text-6xl font-bold mb-8 leading-tight">
                  Expected Credit Loss <span className="text-secondary">Modeling</span>
                </h2>
                <p className="text-xl text-primary-foreground/70 mb-8">
                  Our platform implements the complete IFRS 9 ECL framework with automated stage classification and PD/LGD modeling.
                </p>
                <div className="space-y-6">
                  {[
                    {
                      title: 'Automated Classification',
                      desc: 'Loans automatically classified into stages based on credit risk indicators'
                    },
                    {
                      title: 'PD Calculation',
                      desc: 'Probability of Default calculated using historical data and forward-looking information'
                    },
                    {
                      title: 'LGD Estimation',
                      desc: 'Loss Given Default estimated based on collateral values and recovery rates'
                    },
                    {
                      title: 'EAD Tracking',
                      desc: 'Exposure at Default tracked in real-time as loans are disbursed and repaid'
                    }
                  ].map((item, i) => (
                    <div key={i} className="flex gap-4">
                      <CheckCircle2 className="w-6 h-6 text-secondary flex-shrink-0 mt-1" />
                      <div>
                        <h4 className="font-heading font-bold mb-1">{item.title}</h4>
                        <p className="text-primary-foreground/60">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </AnimatedReveal>

            <AnimatedReveal delay={0.2}>
              <div className="p-8 rounded-3xl bg-primary-foreground/[0.03] border border-primary-foreground/10">
                <h3 className="font-heading text-2xl font-bold mb-6 text-secondary">ECL Calculation Process</h3>
                <div className="space-y-4">
                  {[
                    { step: '1', label: 'Data Collection', desc: 'Gather loan and borrower data' },
                    { step: '2', label: 'Stage Classification', desc: 'Classify loans into stages 1, 2, or 3' },
                    { step: '3', label: 'PD Estimation', desc: 'Calculate probability of default' },
                    { step: '4', label: 'LGD Calculation', desc: 'Estimate loss given default' },
                    { step: '5', label: 'EAD Determination', desc: 'Determine exposure at default' },
                    { step: '6', label: 'ECL Computation', desc: 'Calculate expected credit loss' }
                  ].map((item, i) => (
                    <div key={i} className="flex gap-4 pb-4 border-b border-primary-foreground/10 last:border-b-0">
                      <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center flex-shrink-0 text-secondary font-bold text-sm">
                        {item.step}
                      </div>
                      <div>
                        <h4 className="font-bold text-primary-foreground/90">{item.label}</h4>
                        <p className="text-sm text-primary-foreground/60">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </AnimatedReveal>
          </div>
        </div>
      </section>

      {/* Audit Trail */}
      <section className="w-full py-32 bg-primary-foreground/[0.02] border-y border-primary-foreground/5">
        <div className="max-w-[120rem] mx-auto px-6 lg:px-12">
          <AnimatedReveal className="mb-20 text-center max-w-4xl mx-auto">
            <h2 className="font-heading text-5xl lg:text-6xl font-bold mb-6">
              Complete <span className="text-secondary">Audit Trail</span>
            </h2>
            <p className="text-xl text-primary-foreground/70">
              Every action is logged and traceable for regulatory review.
            </p>
          </AnimatedReveal>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {AUDIT_TRAIL.map((item, i) => (
              <AnimatedReveal key={i} delay={i * 0.1}>
                <div className="p-8 rounded-3xl bg-primary-foreground/[0.03] border border-primary-foreground/10 hover:border-secondary/30 transition-all flex items-start gap-4">
                  <CheckCircle2 className="w-6 h-6 text-secondary flex-shrink-0 mt-1" />
                  <span className="text-primary-foreground/80 font-semibold">{item}</span>
                </div>
              </AnimatedReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Regulatory Reports */}
      <section className="w-full py-32 relative">
        <div className="max-w-[120rem] mx-auto px-6 lg:px-12">
          <AnimatedReveal className="mb-20 max-w-4xl">
            <h2 className="font-heading text-5xl lg:text-6xl font-bold mb-6">
              Regulatory <span className="text-secondary">Reports</span>
            </h2>
            <p className="text-xl text-primary-foreground/70">
              Generate compliance reports instantly for regulatory submissions.
            </p>
          </AnimatedReveal>

          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                title: 'BoZ Quarterly Reports',
                items: ['Loan portfolio summary', 'Non-performing loans', 'Provision adequacy', 'Risk metrics']
              },
              {
                title: 'IFRS 9 Disclosures',
                items: ['ECL calculations', 'Stage classification', 'PD/LGD assumptions', 'Sensitivity analysis']
              },
              {
                title: 'Portfolio Risk Reports',
                items: ['Concentration risk', 'Default risk', 'Liquidity risk', 'Interest rate risk']
              },
              {
                title: 'Audit Reports',
                items: ['Transaction history', 'User activity', 'System changes', 'Approval workflows']
              }
            ].map((report, i) => (
              <AnimatedReveal key={i} delay={i * 0.1}>
                <div className="p-8 rounded-3xl bg-primary-foreground/[0.03] border border-primary-foreground/10 hover:border-secondary/30 transition-all">
                  <h3 className="font-heading text-2xl font-bold mb-6 text-secondary">{report.title}</h3>
                  <ul className="space-y-3">
                    {report.items.map((item, j) => (
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
              Compliance <span className="text-secondary">Made Easy</span>
            </h2>
            <p className="text-2xl text-primary-foreground/70 mb-12 max-w-2xl mx-auto">
              Let our platform handle the complexity of regulatory compliance while you focus on growing your lending business.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Button className="bg-secondary text-primary hover:bg-secondary/90 h-16 px-12 text-xl rounded-full font-bold min-w-[200px]">
                Schedule Demo
              </Button>
              <Button variant="outline" className="border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10 h-16 px-12 text-xl rounded-full min-w-[200px]">
                Download Whitepaper <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </AnimatedReveal>
        </div>
      </section>

      <Footer />
    </div>
  );
}
