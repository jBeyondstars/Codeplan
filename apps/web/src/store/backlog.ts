import { create } from "zustand";
import type { BacklogItem, BacklogConfig } from "@codeplan/core";

type FilterStatus = string | "all";
type FilterType = string | "all";
type FilterPriority = string | "all";
type SortField = "title" | "status" | "priority" | "created" | "updated";
type SortOrder = "asc" | "desc";

interface BacklogState {
  items: BacklogItem[];
  config: BacklogConfig | null;
  isLoading: boolean;
  error: string | null;

  // Filters
  filterStatus: FilterStatus;
  filterType: FilterType;
  filterPriority: FilterPriority;
  searchQuery: string;

  // Sorting
  sortField: SortField;
  sortOrder: SortOrder;

  // Actions
  setItems: (items: BacklogItem[]) => void;
  setConfig: (config: BacklogConfig) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setFilterStatus: (status: FilterStatus) => void;
  setFilterType: (type: FilterType) => void;
  setFilterPriority: (priority: FilterPriority) => void;
  setSearchQuery: (query: string) => void;
  setSorting: (field: SortField, order: SortOrder) => void;
  reset: () => void;
}

const initialState = {
  items: [],
  config: null,
  isLoading: false,
  error: null,
  filterStatus: "all" as FilterStatus,
  filterType: "all" as FilterType,
  filterPriority: "all" as FilterPriority,
  searchQuery: "",
  sortField: "created" as SortField,
  sortOrder: "desc" as SortOrder,
};

export const useBacklogStore = create<BacklogState>((set) => ({
  ...initialState,

  setItems: (items) => set({ items }),
  setConfig: (config) => set({ config }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setFilterStatus: (filterStatus) => set({ filterStatus }),
  setFilterType: (filterType) => set({ filterType }),
  setFilterPriority: (filterPriority) => set({ filterPriority }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setSorting: (sortField, sortOrder) => set({ sortField, sortOrder }),
  reset: () => set(initialState),
}));

export const selectFilteredItems = (state: BacklogState): BacklogItem[] => {
  let filtered = [...state.items];

  // status filter
  if (state.filterStatus !== "all") {
    filtered = filtered.filter((item) => item.status === state.filterStatus);
  }

  // type filter
  if (state.filterType !== "all") {
    filtered = filtered.filter((item) => item.type === state.filterType);
  }

  // priority filter
  if (state.filterPriority !== "all") {
    filtered = filtered.filter((item) => item.priority === state.filterPriority);
  }

  // search query
  if (state.searchQuery) {
    const query = state.searchQuery.toLowerCase();
    filtered = filtered.filter(
      (item) =>
        item.title.toLowerCase().includes(query) ||
        item.id.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query)
    );
  }

  filtered.sort((a, b) => {
    let comparison = 0;

    switch (state.sortField) {
      case "title":
        comparison = a.title.localeCompare(b.title);
        break;
      case "status":
        comparison = a.status.localeCompare(b.status);
        break;
      case "priority": {
        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
        break;
      }
      case "created":
        comparison = new Date(a.created).getTime() - new Date(b.created).getTime();
        break;
      case "updated":
        comparison =
          new Date(a.updated || a.created).getTime() -
          new Date(b.updated || b.created).getTime();
        break;
    }

    return state.sortOrder === "asc" ? comparison : -comparison;
  });

  return filtered;
};

export const selectItemsByStatus = (
  state: BacklogState
): Record<string, BacklogItem[]> => {
  const statuses = state.config?.statuses || [
    "backlog",
    "todo",
    "in-progress",
    "review",
    "done",
  ];

  const grouped: Record<string, BacklogItem[]> = {};

  for (const status of statuses) {
    grouped[status] = [];
  }

  for (const item of state.items) {
    if (grouped[item.status]) {
      grouped[item.status].push(item);
    }
  }

  return grouped;
};
