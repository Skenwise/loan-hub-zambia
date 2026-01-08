import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Building2, User, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface RoleSelectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectRole: (role: 'admin' | 'customer') => void;
}

export default function RoleSelectionDialog({ isOpen, onClose, onSelectRole }: RoleSelectionDialogProps) {
  const [selectedRole, setSelectedRole] = useState<'admin' | 'customer' | null>(null);

  const handleContinue = () => {
    if (selectedRole) {
      onSelectRole(selectedRole);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-primary border-primary-foreground/20">
        <DialogHeader>
          <DialogTitle className="text-3xl font-heading font-bold text-primary-foreground">
            Choose Your Role
          </DialogTitle>
          <DialogDescription className="text-primary-foreground/70 text-lg mt-2">
            Select how you'll be using Lunar to get started with the right experience.
          </DialogDescription>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-6 mt-8">
          {/* Admin Role Card */}
          <motion.button
            onClick={() => setSelectedRole('admin')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`relative p-8 rounded-2xl border-2 transition-all duration-300 text-left group overflow-hidden ${
              selectedRole === 'admin'
                ? 'border-secondary bg-secondary/10'
                : 'border-primary-foreground/20 bg-primary-foreground/5 hover:border-secondary/50 hover:bg-secondary/5'
            }`}
          >
            {/* Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-secondary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            <div className="relative z-10">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-all duration-300 ${
                selectedRole === 'admin'
                  ? 'bg-secondary text-primary'
                  : 'bg-primary-foreground/10 text-secondary group-hover:bg-secondary/20'
              }`}>
                <Building2 className="w-8 h-8" />
              </div>

              <h3 className="font-heading text-2xl font-bold text-primary-foreground mb-3">
                Admin/Institution
              </h3>

              <p className="text-primary-foreground/70 mb-6 leading-relaxed">
                Manage loans, customers, approvals, and compliance. Full access to all platform features.
              </p>

              <ul className="space-y-3 mb-8">
                {[
                  'Create and manage loan products',
                  'Approve/reject loan applications',
                  'Process disbursements',
                  'Monitor portfolio performance',
                  'IFRS 9 compliance tracking',
                  'Generate regulatory reports'
                ].map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-sm text-primary-foreground/60">
                    <div className="w-5 h-5 rounded-full bg-secondary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <div className="w-2 h-2 rounded-full bg-secondary" />
                    </div>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <div className={`inline-flex items-center gap-2 text-sm font-semibold transition-all duration-300 ${
                selectedRole === 'admin' ? 'text-secondary' : 'text-primary-foreground/50 group-hover:text-secondary'
              }`}>
                {selectedRole === 'admin' && 'Selected'}
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </motion.button>

          {/* Customer Role Card */}
          <motion.button
            onClick={() => setSelectedRole('customer')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`relative p-8 rounded-2xl border-2 transition-all duration-300 text-left group overflow-hidden ${
              selectedRole === 'customer'
                ? 'border-secondary bg-secondary/10'
                : 'border-primary-foreground/20 bg-primary-foreground/5 hover:border-secondary/50 hover:bg-secondary/5'
            }`}
          >
            {/* Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-secondary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            <div className="relative z-10">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-all duration-300 ${
                selectedRole === 'customer'
                  ? 'bg-secondary text-primary'
                  : 'bg-primary-foreground/10 text-secondary group-hover:bg-secondary/20'
              }`}>
                <User className="w-8 h-8" />
              </div>

              <h3 className="font-heading text-2xl font-bold text-primary-foreground mb-3">
                Customer/Borrower
              </h3>

              <p className="text-primary-foreground/70 mb-6 leading-relaxed">
                Track applications, manage repayments, and access loan details. Limited access to personal account.
              </p>

              <ul className="space-y-3 mb-8">
                {[
                  'Track application status',
                  'View loan details',
                  'Make repayments',
                  'Download statements',
                  'Manage profile',
                  'Access support'
                ].map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-sm text-primary-foreground/60">
                    <div className="w-5 h-5 rounded-full bg-secondary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <div className="w-2 h-2 rounded-full bg-secondary" />
                    </div>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <div className={`inline-flex items-center gap-2 text-sm font-semibold transition-all duration-300 ${
                selectedRole === 'customer' ? 'text-secondary' : 'text-primary-foreground/50 group-hover:text-secondary'
              }`}>
                {selectedRole === 'customer' && 'Selected'}
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </motion.button>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mt-10 pt-6 border-t border-primary-foreground/10">
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1 border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10 h-12 rounded-lg"
          >
            Cancel
          </Button>
          <Button
            onClick={handleContinue}
            disabled={!selectedRole}
            className="flex-1 bg-secondary text-primary hover:bg-secondary/90 h-12 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue with {selectedRole === 'admin' ? 'Admin' : selectedRole === 'customer' ? 'Customer' : 'Selected Role'}
          </Button>
        </div>

        {/* Info Box */}
        <div className="mt-6 p-4 rounded-lg bg-brandaccent/10 border border-brandaccent/20">
          <p className="text-sm text-primary-foreground/70">
            <span className="font-semibold text-brandaccent">💡 Tip:</span> You can change your role later in your account settings if needed.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
