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

  // Data Isolation - Phase 1
  organisationId: string | null; // Current organization context for filtering
  isSuperAdminViewAll: boolean; // Super Admin can toggle to view all organizations
  allowedOrganisations: string[]; // Organizations the user can access

  // Actions
  setOrganisation: (org: Organizations) => void;
  setSubscriptionPlan: (plan: SubscriptionPlans) => void;
  checkSubscriptionValidity: () => boolean;
  setStaff: (staff: StaffMembers) => void;
  setRole: (role: Roles) => void;
  setPermissions: (perms: string[]) => void;
  
  // Data Isolation Actions
  setOrganisationId: (orgId: string) => void;
  setAllowedOrganisations: (orgIds: string[]) => void;
  toggleSuperAdminViewAll: () => void;
  setSuperAdminViewAll: (viewAll: boolean) => void;
  getActiveOrganisationFilter: () => string | null; // Returns org ID to filter by, or null if viewing all
  
  clearOrganisation: () => void;
}

export const useOrganisationStore = create<OrganisationState>((set, get) => ({
  currentOrganisation: null,
  subscriptionPlan: null,
  isSubscriptionValid: false,
  currentStaff: null,
  currentRole: null,
  permissions: [],
  organisationId: null,
  isSuperAdminViewAll: false,
  allowedOrganisations: [],

  setOrganisation: (org: Organizations) => {
    set({ currentOrganisation: org, organisationId: org._id });
  },

  setSubscriptionPlan: (plan: SubscriptionPlans) => {
    set({ subscriptionPlan: plan });
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

  setOrganisationId: (orgId: string) => {
    set({ organisationId: orgId, isSuperAdminViewAll: false });
  },

  setAllowedOrganisations: (orgIds: string[]) => {
    set({ allowedOrganisations: orgIds });
  },

  toggleSuperAdminViewAll: () => {
    const state = get();
    set({ isSuperAdminViewAll: !state.isSuperAdminViewAll });
  },

  setSuperAdminViewAll: (viewAll: boolean) => {
    set({ isSuperAdminViewAll: viewAll });
  },

  getActiveOrganisationFilter: () => {
    const state = get();
    // If Super Admin is viewing all, return null (no filter)
    if (state.isSuperAdminViewAll) {
      return null;
    }
    // Otherwise return the current organisation ID
    return state.organisationId;
  },

  clearOrganisation: () => {
    set({
      currentOrganisation: null,
      subscriptionPlan: null,
      isSubscriptionValid: false,
      currentStaff: null,
      currentRole: null,
      permissions: [],
      organisationId: null,
      isSuperAdminViewAll: false,
      allowedOrganisations: [],
    });
  },
}));
