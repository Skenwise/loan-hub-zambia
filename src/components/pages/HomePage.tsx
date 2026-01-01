// HPI 1.6-V
import React, { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMember } from '@/integrations';
import { Button } from '@/components/ui/button';
import { Image } from '@/components/ui/image';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import RoleSelectionDialog from '@/components/RoleSelectionDialog';
import { 
  Shield, 
  TrendingUp, 
  FileCheck, 
  Users, 
  Calculator, 
  BarChart3, 
  Lock, 
  CheckCircle2,
  ArrowRight,
  Activity,
  Globe,
  Server
} from 'lucide-react';
import { motion, useScroll, useTransform, useSpring, useInView } from 'framer-motion';

// --- Canonical Data Sources ---
const FEATURES = [
  {
    icon: Users,
    title: 'Customer Management',
    description: 'Comprehensive KYC profiles with credit scoring and verification workflows.'
  },
  {
    icon: TrendingUp,
    title: 'Loan Origination',
    description: 'Streamlined application processing with configurable product terms and approval chains.'
  },
  {
    icon: Calculator,
    title: 'IFRS 9 ECL Engine',
    description: 'Automated Expected Credit Loss calculations with stage classification and PD modeling.'
  },
  {
    icon: Shield,
    title: 'BoZ Compliance',
    description: 'Bank of Zambia classification rules with automated provisioning calculations.'
  },
  {
    icon: BarChart3,
    title: 'Portfolio Analytics',
    description: 'Real-time dashboards tracking performance, risk metrics, and portfolio health.'
  },
  {
    icon: FileCheck,
    title: 'Repayment Processing',
    description: 'Automated interest calculations, payment allocation, and balance updates.'
  },
  {
    icon: Lock,
    title: 'Role-Based Access',
    description: 'Granular permissions for borrowers, officers, managers, and finance teams.'
  },
  {
    icon: CheckCircle2,
    title: 'Audit Trail',
    description: 'Complete transaction history with exportable reports for regulatory review.'
  }
];

const METRICS = [
  { label: 'Loan Products', value: 'Unlimited' },
  { label: 'User Roles', value: '4 Types' },
  { label: 'ECL Stages', value: '3 Levels' },
  { label: 'BoZ Classes', value: '5 Categories' }
];

const COMPLIANCE_ITEMS = [
  'IFRS 9 Expected Credit Loss methodology',
  'Bank of Zambia loan classification standards',
  'Automated provisioning calculations',
  'Comprehensive audit trail and reporting',
  'Data security and privacy controls'
];

// --- Utility Components ---

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

const ParallaxImage = ({ src, alt, className }: { src: string, alt: string, className?: string }) => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });
  const y = useTransform(scrollYProgress, [0, 1], ["-10%", "10%"]);

  return (
    <div ref={ref} className={`overflow-hidden ${className}`}>
      <motion.div style={{ y }} className="w-full h-[120%]">
        <Image src={src} alt={alt} className="w-full h-full object-cover" width={1200} />
      </motion.div>
    </div>
  );
};

// --- Main Page Component ---

export default function HomePage() {
  const { isAuthenticated, actions } = useMember();
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const [showRoleDialog, setShowRoleDialog] = useState(false);

  const handleGetStarted = () => {
    if (isAuthenticated) {
      navigate('/admin/dashboard');
    } else {
      setShowRoleDialog(true);
    }
  };

  const handleRoleSelect = (role: 'admin' | 'customer') => {
    setShowRoleDialog(false);
    // Store the selected role in sessionStorage for use after login
    sessionStorage.setItem('selectedRole', role);
    // Redirect to appropriate dashboard after login
    if (role === 'customer') {
      sessionStorage.setItem('redirectAfterLogin', '/customer-portal');
    } else {
      sessionStorage.setItem('redirectAfterLogin', '/admin/dashboard');
    }
    actions.login();
  };

  // Hero Animation
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 1000], [0, 300]);
  const heroOpacity = useTransform(scrollY, [0, 500], [1, 0]);

  return (
    <div className="min-h-screen bg-primary text-primary-foreground font-paragraph overflow-clip selection:bg-secondary selection:text-primary" ref={containerRef}>
      <Header />

      {/* --- HERO SECTION (Inspiration: Codyx) --- */}
      <section className="relative w-full min-h-[90vh] flex items-center pt-20 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[60vw] h-[60vw] bg-brandaccent/5 rounded-full blur-[120px] translate-x-1/3 -translate-y-1/4" />
          <div className="absolute bottom-0 left-0 w-[40vw] h-[40vw] bg-secondary/5 rounded-full blur-[100px] -translate-x-1/3 translate-y-1/4" />
        </div>

        <div className="w-full max-w-[120rem] mx-auto px-6 lg:px-12 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            
            {/* Left: Content */}
            <motion.div 
              style={{ y: heroY, opacity: heroOpacity }}
              className="space-y-8 max-w-3xl"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-[1px] bg-secondary" />
                <span className="text-secondary font-medium tracking-wider uppercase text-sm">Next Gen Lending</span>
              </div>
              
              <h1 className="font-heading text-6xl lg:text-8xl font-bold leading-[0.95] tracking-tight">
                Protecting Your <br />
                <span className="text-secondary">Capital</span> and <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-brandaccent to-secondary">Compliance.</span>
              </h1>
              
              <p className="text-xl text-primary-foreground/80 max-w-xl leading-relaxed border-l-2 border-primary-foreground/10 pl-6">
                Enterprise-grade platform delivering full regulatory compliance with IFRS 9 Expected Credit Loss calculations and Bank of Zambia classification standards.
              </p>
              
              <div className="flex flex-wrap gap-4 pt-4">
                <Button 
                  onClick={handleGetStarted}
                  className="bg-secondary text-primary hover:bg-secondary/90 h-14 px-8 text-lg rounded-full font-semibold transition-all hover:scale-105"
                >
                  Access Platform
                </Button>
                <Button 
                  variant="outline"
                  className="border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10 h-14 px-8 text-lg rounded-full"
                >
                  View Documentation
                </Button>
              </div>
            </motion.div>

            {/* Right: Abstract Visual (The "Eye" Motif) */}
            <div className="relative h-[600px] w-full hidden lg:flex items-center justify-center perspective-1000">
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="relative w-[500px] h-[500px]"
              >
                {/* Concentric Circles Animation */}
                {[...Array(5)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute top-1/2 left-1/2 rounded-full border border-primary-foreground/10"
                    style={{
                      width: `${(i + 1) * 20}%`,
                      height: `${(i + 1) * 20}%`,
                      x: "-50%",
                      y: "-50%",
                      zIndex: 5 - i
                    }}
                    animate={{
                      scale: [1, 1.05, 1],
                      opacity: [0.3, 0.6, 0.3],
                      rotate: i % 2 === 0 ? 360 : -360
                    }}
                    transition={{
                      duration: 15 + i * 5,
                      repeat: Infinity,
                      ease: "linear"
                    }}
                  />
                ))}
                
                {/* Core Sphere */}
                <motion.div 
                  className="absolute top-1/2 left-1/2 w-32 h-32 bg-gradient-to-br from-brandaccent to-secondary rounded-full blur-2xl opacity-60"
                  style={{ x: "-50%", y: "-50%" }}
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                />
                <div className="absolute top-1/2 left-1/2 w-24 h-24 bg-gradient-to-br from-brandaccent to-secondary rounded-full -translate-x-1/2 -translate-y-1/2 shadow-[0_0_60px_rgba(185,229,79,0.4)]" />
                
                {/* Floating Elements */}
                <motion.div 
                  className="absolute top-[20%] right-[10%] p-4 bg-primary/80 backdrop-blur-md border border-primary-foreground/10 rounded-xl shadow-xl"
                  animate={{ y: [0, -20, 0] }}
                  transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Shield className="w-8 h-8 text-secondary" />
                </motion.div>
                
                <motion.div 
                  className="absolute bottom-[20%] left-[10%] p-4 bg-primary/80 backdrop-blur-md border border-primary-foreground/10 rounded-xl shadow-xl"
                  animate={{ y: [0, 20, 0] }}
                  transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                >
                  <Activity className="w-8 h-8 text-brandaccent" />
                </motion.div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* --- TICKER SECTION --- */}
      <div className="w-full border-y border-primary-foreground/5 bg-primary-foreground/5 py-6 overflow-hidden">
        <div className="flex whitespace-nowrap">
          <motion.div 
            className="flex gap-16 items-center px-8"
            animate={{ x: ["0%", "-50%"] }}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          >
            {[...Array(2)].map((_, i) => (
              <React.Fragment key={i}>
                <span className="text-2xl font-heading font-bold text-primary-foreground/30 uppercase tracking-widest">Bank of Zambia Compliant</span>
                <span className="text-2xl font-heading font-bold text-primary-foreground/30 uppercase tracking-widest">IFRS 9 Ready</span>
                <span className="text-2xl font-heading font-bold text-primary-foreground/30 uppercase tracking-widest">Secure Lending</span>
                <span className="text-2xl font-heading font-bold text-primary-foreground/30 uppercase tracking-widest">Real-time Analytics</span>
                <span className="text-2xl font-heading font-bold text-primary-foreground/30 uppercase tracking-widest">Automated Provisioning</span>
              </React.Fragment>
            ))}
          </motion.div>
        </div>
      </div>

      {/* --- FEATURES GRID (Bento Style) --- */}
      <section className="w-full py-32 relative">
        <div className="max-w-[120rem] mx-auto px-6 lg:px-12">
          <AnimatedReveal className="mb-20 max-w-4xl">
            <h2 className="font-heading text-5xl lg:text-7xl font-bold mb-6">
              Engineered for <span className="text-secondary">Scale</span>
            </h2>
            <p className="text-xl text-primary-foreground/70 max-w-2xl">
              A complete ecosystem for modern lending. From origination to closure, every step is optimized for efficiency and compliance.
            </p>
          </AnimatedReveal>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((feature, index) => (
              <AnimatedReveal key={index} delay={index * 0.1} className="group">
                <div className="h-full p-8 rounded-3xl bg-primary-foreground/[0.03] border border-primary-foreground/10 hover:bg-primary-foreground/[0.06] hover:border-secondary/30 transition-all duration-500 flex flex-col relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-secondary/10 to-transparent rounded-bl-full -translate-y-16 translate-x-16 group-hover:translate-x-8 group-hover:-translate-y-8 transition-transform duration-500" />
                  
                  <div className="w-14 h-14 rounded-2xl bg-primary-foreground/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 text-secondary">
                    <feature.icon className="w-7 h-7" />
                  </div>
                  
                  <h3 className="font-heading text-2xl font-bold mb-3 group-hover:text-secondary transition-colors">
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

      {/* --- IMMERSIVE IMAGE BREAK --- */}
      <section className="w-full h-[80vh] relative overflow-hidden my-20">
        <ParallaxImage 
          src="https://static.wixstatic.com/media/20287c_9b8820f8dd1a44849c0d315b1b85adfc~mv2.png?originWidth=1280&originHeight=704" 
          alt="LMS Dashboard Interface" 
          className="w-full h-full"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/50 to-transparent" />
        <div className="absolute bottom-0 left-0 w-full p-12 lg:p-24">
          <AnimatedReveal>
            <h2 className="font-heading text-5xl lg:text-8xl font-bold text-white max-w-5xl leading-none">
              Data-Driven <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary to-brandaccent">Decisions.</span>
            </h2>
          </AnimatedReveal>
        </div>
      </section>

      {/* --- COMPLIANCE STICKY SECTION --- */}
      <section className="w-full py-32 relative">
        <div className="max-w-[120rem] mx-auto px-6 lg:px-12">
          <div className="flex flex-col lg:flex-row gap-20">
            
            {/* Sticky Left Side */}
            <div className="lg:w-1/2">
              <div className="sticky top-32">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brandaccent/10 border border-brandaccent/20 text-brandaccent mb-8">
                  <Shield className="w-4 h-4" />
                  <span className="text-sm font-semibold uppercase tracking-wider">Regulatory Standard</span>
                </div>
                
                <h2 className="font-heading text-5xl lg:text-6xl font-bold mb-8 leading-tight">
                  Compliance is not <br />
                  an afterthought. <br />
                  <span className="text-primary-foreground/30">It's the foundation.</span>
                </h2>
                
                <p className="text-xl text-primary-foreground/70 max-w-xl mb-12">
                  Our platform is built from the ground up to adhere to international and local regulatory frameworks, providing peace of mind for your lending operations.
                </p>

                <div className="grid grid-cols-2 gap-8">
                  {METRICS.map((metric, index) => (
                    <div key={index} className="border-l-2 border-secondary/30 pl-6">
                      <div className="font-heading text-4xl font-bold text-white mb-1">{metric.value}</div>
                      <div className="text-sm text-primary-foreground/50 uppercase tracking-wider">{metric.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Scrolling Right Side */}
            <div className="lg:w-1/2 space-y-8 pt-20 lg:pt-0">
              {COMPLIANCE_ITEMS.map((item, index) => (
                <AnimatedReveal key={index} delay={index * 0.1}>
                  <div className="group p-8 rounded-3xl bg-primary-foreground/[0.02] border border-primary-foreground/10 hover:bg-primary-foreground/[0.05] hover:border-brandaccent/30 transition-all duration-300 flex items-start gap-6">
                    <div className="w-12 h-12 rounded-full bg-brandaccent/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                      <CheckCircle2 className="w-6 h-6 text-brandaccent" />
                    </div>
                    <div>
                      <h3 className="font-heading text-2xl font-bold mb-2 group-hover:text-brandaccent transition-colors">
                        {item.split(' ')[0]} {item.split(' ')[1]}
                      </h3>
                      <p className="text-primary-foreground/60 text-lg">
                        {item}
                      </p>
                    </div>
                  </div>
                </AnimatedReveal>
              ))}
              
              <AnimatedReveal delay={0.6}>
                <div className="p-8 rounded-3xl bg-gradient-to-br from-secondary/20 to-transparent border border-secondary/20 mt-12">
                  <h3 className="font-heading text-2xl font-bold mb-4 text-secondary">Ready for Audit?</h3>
                  <p className="text-primary-foreground/80 mb-6">
                    Generate comprehensive reports instantly. No more scrambling during regulatory reviews.
                  </p>
                  <Button variant="link" className="text-secondary p-0 h-auto font-semibold text-lg group">
                    Explore Reporting <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </AnimatedReveal>
            </div>

          </div>
        </div>
      </section>

      {/* --- GLOBAL REACH / MAP SECTION --- */}
      <section className="w-full py-32 bg-primary-foreground/[0.02] border-y border-primary-foreground/5 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
           {/* Abstract Grid Lines */}
           <div className="absolute w-full h-full" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '100px 100px' }}></div>
        </div>

        <div className="max-w-[120rem] mx-auto px-6 lg:px-12 relative z-10 text-center">
          <AnimatedReveal>
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-foreground/5 mb-8">
              <Globe className="w-8 h-8 text-secondary" />
            </div>
            <h2 className="font-heading text-5xl lg:text-7xl font-bold mb-8">
              Built for the <span className="text-secondary">Zambian Market</span>
            </h2>
            <p className="text-xl text-primary-foreground/60 max-w-3xl mx-auto mb-12">
              Localized logic for tax, currency, and regulatory requirements. 
              Designed to support Retail and SME lending across the region.
            </p>
          </AnimatedReveal>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              { title: 'Retail Loans', desc: 'Personal finance, salary advances, and consumer credit.' },
              { title: 'SME Financing', desc: 'Working capital, asset finance, and business expansion.' },
              { title: 'Micro-Lending', desc: 'Group loans and small-ticket financing solutions.' }
            ].map((market, i) => (
              <AnimatedReveal key={i} delay={i * 0.2}>
                <div className="p-8 border border-primary-foreground/10 rounded-2xl bg-primary hover:border-secondary/50 transition-colors">
                  <h3 className="font-heading text-2xl font-bold mb-2">{market.title}</h3>
                  <p className="text-primary-foreground/50">{market.desc}</p>
                </div>
              </AnimatedReveal>
            ))}
          </div>
        </div>
      </section>

      {/* --- CTA SECTION --- */}
      <section className="w-full py-40 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary to-black/40" />
        
        {/* Decorative Circles */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-primary-foreground/5 rounded-full" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-primary-foreground/5 rounded-full" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] border border-primary-foreground/5 rounded-full" />

        <div className="max-w-4xl mx-auto px-6 relative z-10 text-center">
          <AnimatedReveal>
            <h2 className="font-heading text-6xl lg:text-8xl font-bold mb-8 leading-tight">
              Start Your <br />
              <span className="text-secondary">Transformation.</span>
            </h2>
            <p className="text-2xl text-primary-foreground/70 mb-12 max-w-2xl mx-auto">
              Join the financial institutions that trust ZamLoan for secure, compliant, and efficient loan management.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Button 
                onClick={handleGetStarted}
                className="bg-secondary text-primary hover:bg-secondary/90 h-16 px-12 text-xl rounded-full font-bold min-w-[200px]"
              >
                Get Started Now
              </Button>
              <Button 
                variant="outline"
                className="border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10 h-16 px-12 text-xl rounded-full min-w-[200px]"
              >
                Contact Sales
              </Button>
            </div>
          </AnimatedReveal>
        </div>
      </section>

      <Footer />

      <RoleSelectionDialog 
        isOpen={showRoleDialog}
        onClose={() => setShowRoleDialog(false)}
        onSelectRole={handleRoleSelect}
      />
    </div>
  );
}