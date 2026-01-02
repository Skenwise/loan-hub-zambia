import { create } from 'zustand';

export type UserRole = 'SYSTEM_OWNER' | 'ORGANISATION_ADMIN' | 'BRANCH_MANAGER' | 'STAFF' | 'CUSTOMER';

interface RoleState {
  userRole: UserRole | null;
  organisationId: string | null;
  branchId: string | null;
  staffId: string | null;
  
  setUserRole: (role: UserRole) => void;
  setOrganisationId: (id: string) => void;
  setBranchId: (id: string) => void;
  setStaffId: (id: string) => void;
  clearRole: () => void;
  
  // Helper methods
  isSystemOwner: () => boolean;
  isOrganisationAdmin: () => boolean;
  isBranchManager: () => boolean;
  isStaff: () => boolean;
  isCustomer: () => boolean;
}

export const useRoleStore = create<RoleState>((set, get) => ({
  userRole: null,
  organisationId: null,
  branchId: null,
  staffId: null,

  setUserRole: (role: UserRole) => {
    set({ userRole: role });
  },

  setOrganisationId: (id: string) => {
    set({ organisationId: id });
  },

  setBranchId: (id: string) => {
    set({ branchId: id });
  },

  setStaffId: (id: string) => {
    set({ staffId: id });
  },

  clearRole: () => {
    set({
      userRole: null,
      organisationId: null,
      branchId: null,
      staffId: null,
    });
  },

  isSystemOwner: () => get().userRole === 'SYSTEM_OWNER',
  isOrganisationAdmin: () => get().userRole === 'ORGANISATION_ADMIN',
  isBranchManager: () => get().userRole === 'BRANCH_MANAGER',
  isStaff: () => get().userRole === 'STAFF',
  isCustomer: () => get().userRole === 'CUSTOMER',
}));
