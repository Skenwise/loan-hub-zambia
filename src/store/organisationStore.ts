import { create } from 'zustand';
import { Organisations, SubscriptionPlans } from '@/entities';

interface OrganisationState {
  currentOrganisation: Organisations | null;
  subscriptionPlan: SubscriptionPlans | null;
  isSubscriptionValid: boolean;
  setOrganisation: (org: Organisations) => void;
  setSubscriptionPlan: (plan: SubscriptionPlans) => void;
  checkSubscriptionValidity: () => boolean;
  clearOrganisation: () => void;
}

export const useOrganisationStore = create<OrganisationState>((set, get) => ({
  currentOrganisation: null,
  subscriptionPlan: null,
  isSubscriptionValid: false,

  setOrganisation: (org: Organisations) => {
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
