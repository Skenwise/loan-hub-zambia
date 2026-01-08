/**
 * Pagination Service
 * Handles pagination of large datasets
 * Phase 2A: Performance Optimization
 */

export interface PaginationOptions {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startIndex: number;
  endIndex: number;
}

export class PaginationService {
  // Default page size
  static readonly DEFAULT_PAGE_SIZE = 20;
  static readonly MAX_PAGE_SIZE = 100;
  static readonly MIN_PAGE_SIZE = 1;

  /**
   * Paginate array of items
   * @param items - Array of items to paginate
   * @param options - Pagination options
   * @returns Paginated result
   */
  static paginate<T>(items: T[], options: PaginationOptions): PaginationResult<T> {
    // Validate options
    const page = Math.max(1, options.page || 1);
    const pageSize = Math.min(
      Math.max(this.MIN_PAGE_SIZE, options.pageSize || this.DEFAULT_PAGE_SIZE),
      this.MAX_PAGE_SIZE
    );

    // Calculate pagination
    const total = items.length;
    const totalPages = Math.ceil(total / pageSize);
    const startIndex = (page - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, total);

    // Sort if requested
    let sortedItems = [...items];
    if (options.sortBy) {
      sortedItems = this.sort(sortedItems, options.sortBy, options.sortOrder || 'asc');
    }

    // Get page items
    const pageItems = sortedItems.slice(startIndex, endIndex);

    return {
      items: pageItems,
      total,
      page,
      pageSize,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
      startIndex,
      endIndex,
    };
  }

  /**
   * Paginate async data
   * @param fetchFn - Function to fetch all items
   * @param options - Pagination options
   * @returns Paginated result
   */
  static async paginateAsync<T>(
    fetchFn: () => Promise<T[]>,
    options: PaginationOptions
  ): Promise<PaginationResult<T>> {
    const items = await fetchFn();
    return this.paginate(items, options);
  }

  /**
   * Sort items by field
   * @param items - Items to sort
   * @param field - Field to sort by
   * @param order - Sort order (asc or desc)
   */
  private static sort<T>(items: T[], field: string, order: 'asc' | 'desc'): T[] {
    return items.sort((a, b) => {
      const aValue = (a as any)[field];
      const bValue = (b as any)[field];

      if (aValue === undefined || aValue === null) return 1;
      if (bValue === undefined || bValue === null) return -1;

      let comparison = 0;
      if (typeof aValue === 'string') {
        comparison = aValue.localeCompare(bValue);
      } else if (typeof aValue === 'number') {
        comparison = aValue - bValue;
      } else if (aValue instanceof Date && bValue instanceof Date) {
        comparison = aValue.getTime() - bValue.getTime();
      } else {
        comparison = aValue > bValue ? 1 : -1;
      }

      return order === 'asc' ? comparison : -comparison;
    });
  }

  /**
   * Get page range for display
   * @param currentPage - Current page
   * @param totalPages - Total pages
   * @param displayPages - Number of pages to display (default: 5)
   */
  static getPageRange(currentPage: number, totalPages: number, displayPages: number = 5): number[] {
    const pages: number[] = [];
    const halfDisplay = Math.floor(displayPages / 2);

    let startPage = Math.max(1, currentPage - halfDisplay);
    let endPage = Math.min(totalPages, startPage + displayPages - 1);

    // Adjust if we're near the end
    if (endPage - startPage + 1 < displayPages) {
      startPage = Math.max(1, endPage - displayPages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  }

  /**
   * Check if page is valid
   * @param page - Page number
   * @param totalPages - Total pages
   */
  static isValidPage(page: number, totalPages: number): boolean {
    return page >= 1 && page <= totalPages;
  }

  /**
   * Get offset and limit for database query
   * @param page - Page number
   * @param pageSize - Page size
   */
  static getOffsetAndLimit(page: number, pageSize: number): { offset: number; limit: number } {
    const offset = (Math.max(1, page) - 1) * pageSize;
    return {
      offset,
      limit: pageSize,
    };
  }

  /**
   * Create pagination metadata
   * @param result - Pagination result
   */
  static getMetadata<T>(result: PaginationResult<T>): {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasMore: boolean;
    pageRange: number[];
  } {
    return {
      currentPage: result.page,
      totalPages: result.totalPages,
      totalItems: result.total,
      itemsPerPage: result.pageSize,
      hasMore: result.hasNextPage,
      pageRange: this.getPageRange(result.page, result.totalPages),
    };
  }

  /**
   * Validate pagination options
   * @param options - Pagination options
   */
  static validateOptions(options: PaginationOptions): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!options.page || options.page < 1) {
      errors.push('Page must be >= 1');
    }

    if (!options.pageSize || options.pageSize < this.MIN_PAGE_SIZE) {
      errors.push(`Page size must be >= ${this.MIN_PAGE_SIZE}`);
    }

    if (options.pageSize > this.MAX_PAGE_SIZE) {
      errors.push(`Page size must be <= ${this.MAX_PAGE_SIZE}`);
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
