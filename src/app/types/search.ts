// types/search.ts
export type ReadStatusFilter = "all" | "reading" | "unread" | "completed";
export type SortOption = "recent" | "title" | "progress" | "pages";

export interface FilterState {
  query: string;
  status: ReadStatusFilter;
  genre: string | null;
  publisher: string | null;
  sortBy: SortOption;
}

export const INITIAL_FILTERS: FilterState = {
  query: "",
  status: "all",
  genre: null,
  publisher: null,
  sortBy: "recent",
};