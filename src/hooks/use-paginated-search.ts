import { useState } from "react";

/** Keeps draft search text, applied filtering, and pagination in sync. */
export function usePaginatedSearch() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  function applySearch() {
    setPage(1);
    setSearch(searchInput.trim());
  }

  return {
    searchInput,
    setSearchInput,
    search,
    setSearch,
    page,
    setPage,
    applySearch,
  };
}
