import { create } from 'zustand';
import { Organizations, SubscriptionPlans, StaffMembers, Roles } from '@/entities';

interface OrganisationState {
  // Organisation data
  currentOrganisation: Organizations | null;
  subscriptionPlan: SubscriptionPlans | null;
  isSubscriptionValid: boolean;

  // Staff data
  currentStaff: StaffMembers | null;
  currentRole: Roles | null;
  permissions: string[];

  // Actions
  setOrganisation: (org: Organizations) => void;
  setSubscriptionPlan: (plan: SubscriptionPlans) => void;
  checkSubscriptionValidity: () => boolean;
  setStaff: (staff: StaffMembers) => void;
  setRole: (role: Roles) => void;
  setPermissions: (perms: string[]) => void;
  clearOrganisation: () => void;
}

export const useOrganisationStore = create<OrganisationState>((set, get) => ({
  currentOrganisation: null,
  subscriptionPlan: null,
  isSubscriptionValid: false,
  currentStaff: null,
  currentRole: null,
  permissions: [],

  setOrganisation: (org: Organizations) => {
    set({ currentOrganisation: org });
  },

  setSubscriptionPlan: (plan: SubscriptionPlans) => {
    set({ subscriptionPlan: plan });
    // Check if subscription is active
    const isValid = plan.isActive === true;
    set({ isSubscriptionValid: isValid });
  },

  checkSubscriptionValidity: () => {
    const state = get();
    const isValid = state.subscriptionPlan?.isActive === true;
    set({ isSubscriptionValid: isValid });
    return isValid;
  },

  setStaff: (staff: StaffMembers) => {
    set({ currentStaff: staff });
  },

  setRole: (role: Roles) => {
    set({ currentRole: role });
  },

  setPermissions: (perms: string[]) => {
    set({ permissions: perms });
  },

  clearOrganisation: () => {
    set({
      currentOrganisation: null,
      subscriptionPlan: null,
      isSubscriptionValid: false,
      currentStaff: null,
      currentRole: null,
      permissions: [],
    });
  },
}));
