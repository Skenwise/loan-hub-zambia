import { create } from 'zustand';
import { Organizations, SubscriptionPlans } from '@/entities';

interface OrganisationState {
  currentOrganisation: Organizations | null;
  subscriptionPlan: SubscriptionPlans | null;
  isSubscriptionValid: boolean;
  setOrganisation: (org: Organizations) => void;
  setSubscriptionPlan: (plan: SubscriptionPlans) => void;
  checkSubscriptionValidity: () => boolean;
  clearOrganisation: () => void;
}

export const useOrganisationStore = create<OrganisationState>((set, get) => ({
  currentOrganisation: null,
  subscriptionPlan: null,
  isSubscriptionValid: false,

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

  clearOrganisation: () => {
    set({
      currentOrganisation: null,
      subscriptionPlan: null,
      isSubscriptionValid: false,
    });
  },
}));
