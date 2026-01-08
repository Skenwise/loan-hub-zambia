/**
 * Advanced Filtering Service (Phase 2B)
 * Provides comprehensive filtering, searching, and sorting capabilities
 * for loans, customers, repayments, and other entities
 */

import { BaseCrudService } from './BaseCrudService';
import { Loans, CustomerProfiles, Repayments, LoanProducts, Branches } from '@/entities';

export interface FilterCriteria {
  field: string;
  operator: 'equals' | 'contains' | 'gt' | 'lt' | 'gte' | 'lte' | 'between' | 'in';
  value: any;
}

export interface SortCriteria {
  field: string;
  direction: 'asc' | 'desc';
}

export interface SearchOptions {
  filters?: FilterCriteria[];
  sort?: SortCriteria[];
  pagination?: {
    page: number;
    pageSize: number;
  };
  searchTerm?: string;
  searchFields?: string[];
}

export interface FilterResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

class AdvancedFilteringService {
  /**
   * Filter loans with advanced criteria
   */
  static async filterLoans(
    organisationId: string,
    options: SearchOptions
  ): Promise<FilterResult<Loans>> {
    try {
      const { items: allLoans } = await BaseCrudService.getAll<Loans>('loans');
      
      // Filter by organisation
      let filtered = allLoans.filter(l => l.organisationId === organisationId);

      // Apply search term
      if (options.searchTerm && options.searchFields) {
        const term = options.searchTerm.toLowerCase();
        filtered = filtered.filter(loan =>
          options.searchFields!.some(field => {
            const value = (loan as any)[field];
            return value && String(value).toLowerCase().includes(term);
          })
        );
      }

      // Apply filters
      if (options.filters) {
        filtered = this.applyFilters(filtered, options.filters);
      }

      // Apply sorting
      if (options.sort) {
        filtered = this.applySorting(filtered, options.sort);
      }

      // Apply pagination
      const { page = 1, pageSize = 10 } = options.pagination || {};
      const start = (page - 1) * pageSize;
      const end = start + pageSize;
      const paginatedItems = filtered.slice(start, end);

      return {
        items: paginatedItems,
        total: filtered.length,
        page,
        pageSize,
        totalPages: Math.ceil(filtered.length / pageSize),
      };
    } catch (error) {
      console.error('Error filtering loans:', error);
      throw error;
    }
  }

  /**
   * Filter customers with advanced criteria
   */
  static async filterCustomers(
    organisationId: string,
    options: SearchOptions
  ): Promise<FilterResult<CustomerProfiles>> {
    try {
      const { items: allCustomers } = await BaseCrudService.getAll<CustomerProfiles>('customers');
      
      let filtered = allCustomers.filter(c => c.organisationId === organisationId);

      if (options.searchTerm && options.searchFields) {
        const term = options.searchTerm.toLowerCase();
        filtered = filtered.filter(customer =>
          options.searchFields!.some(field => {
            const value = (customer as any)[field];
            return value && String(value).toLowerCase().includes(term);
          })
        );
      }

      if (options.filters) {
        filtered = this.applyFilters(filtered, options.filters);
      }

      if (options.sort) {
        filtered = this.applySorting(filtered, options.sort);
      }

      const { page = 1, pageSize = 10 } = options.pagination || {};
      const start = (page - 1) * pageSize;
      const end = start + pageSize;
      const paginatedItems = filtered.slice(start, end);

      return {
        items: paginatedItems,
        total: filtered.length,
        page,
        pageSize,
        totalPages: Math.ceil(filtered.length / pageSize),
      };
    } catch (error) {
      console.error('Error filtering customers:', error);
      throw error;
    }
  }

  /**
   * Filter repayments with advanced criteria
   */
  static async filterRepayments(
    organisationId: string,
    options: SearchOptions
  ): Promise<FilterResult<Repayments>> {
    try {
      const { items: allRepayments } = await BaseCrudService.getAll<Repayments>('repayments');
      
      let filtered = allRepayments.filter(r => r.organisationId === organisationId);

      if (options.searchTerm && options.searchFields) {
        const term = options.searchTerm.toLowerCase();
        filtered = filtered.filter(repayment =>
          options.searchFields!.some(field => {
            const value = (repayment as any)[field];
            return value && String(value).toLowerCase().includes(term);
          })
        );
      }

      if (options.filters) {
        filtered = this.applyFilters(filtered, options.filters);
      }

      if (options.sort) {
        filtered = this.applySorting(filtered, options.sort);
      }

      const { page = 1, pageSize = 10 } = options.pagination || {};
      const start = (page - 1) * pageSize;
      const end = start + pageSize;
      const paginatedItems = filtered.slice(start, end);

      return {
        items: paginatedItems,
        total: filtered.length,
        page,
        pageSize,
        totalPages: Math.ceil(filtered.length / pageSize),
      };
    } catch (error) {
      console.error('Error filtering repayments:', error);
      throw error;
    }
  }

  /**
   * Apply filter criteria to items
   */
  private static applyFilters<T>(items: T[], filters: FilterCriteria[]): T[] {
    return items.filter(item => {
      return filters.every(filter => {
        const value = (item as any)[filter.field];

        switch (filter.operator) {
          case 'equals':
            return value === filter.value;
          case 'contains':
            return String(value).toLowerCase().includes(String(filter.value).toLowerCase());
          case 'gt':
            return Number(value) > Number(filter.value);
          case 'lt':
            return Number(value) < Number(filter.value);
          case 'gte':
            return Number(value) >= Number(filter.value);
          case 'lte':
            return Number(value) <= Number(filter.value);
          case 'between':
            return (
              Number(value) >= Number(filter.value[0]) &&
              Number(value) <= Number(filter.value[1])
            );
          case 'in':
            return Array.isArray(filter.value) && filter.value.includes(value);
          default:
            return true;
        }
      });
    });
  }

  /**
   * Apply sorting criteria to items
   */
  private static applySorting<T>(items: T[], sortCriteria: SortCriteria[]): T[] {
    return items.sort((a, b) => {
      for (const sort of sortCriteria) {
        const aValue = (a as any)[sort.field];
        const bValue = (b as any)[sort.field];

        if (aValue === bValue) continue;

        const comparison = aValue < bValue ? -1 : 1;
        return sort.direction === 'asc' ? comparison : -comparison;
      }
      return 0;
    });
  }

  /**
   * Get filter suggestions for a field
   */
  static async getFilterSuggestions(
    collectionId: string,
    field: string,
    organisationId: string
  ): Promise<any[]> {
    try {
      const { items } = await BaseCrudService.getAll(collectionId);
      const filtered = items.filter((item: any) => item.organisationId === organisationId);
      
      const values = filtered
        .map((item: any) => item[field])
        .filter((v: any) => v !== undefined && v !== null);
      
      return [...new Set(values)];
    } catch (error) {
      console.error('Error getting filter suggestions:', error);
      return [];
    }
  }

  /**
   * Export filtered results to CSV
   */
  static exportToCSV<T>(items: T[], filename: string): void {
    if (items.length === 0) return;

    const headers = Object.keys(items[0] as any);
    const csv = [
      headers.join(','),
      ...items.map(item =>
        headers
          .map(header => {
            const value = (item as any)[header];
            const escaped = String(value).replace(/"/g, '""');
            return `"${escaped}"`;
          })
          .join(',')
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  /**
   * Get advanced statistics for filtered data
   */
  static getStatistics<T extends Record<string, any>>(
    items: T[],
    numericFields: string[]
  ): Record<string, any> {
    const stats: Record<string, any> = {};

    for (const field of numericFields) {
      const values = items
        .map(item => Number(item[field]))
        .filter(v => !isNaN(v));

      if (values.length === 0) continue;

      stats[field] = {
        sum: values.reduce((a, b) => a + b, 0),
        average: values.reduce((a, b) => a + b, 0) / values.length,
        min: Math.min(...values),
        max: Math.max(...values),
        count: values.length,
      };
    }

    return stats;
  }
}

export default AdvancedFilteringService;
