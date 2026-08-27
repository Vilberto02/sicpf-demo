export * from "./types"

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface PaginatedState<T> {
  items: T[];
  count: number;
  page: number;
  pageSize: number;
  search: string;
  ordering: string;
}