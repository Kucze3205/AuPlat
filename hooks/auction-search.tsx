import React, { createContext, ReactNode, useContext, useMemo, useState } from 'react';

type AuctionSearchContextValue = {
  searchInput: string;
  searchQuery: string;
  setSearchInput: (value: string) => void;
  applySearch: () => void;
  clearSearch: () => void;
};

const AuctionSearchContext = createContext<AuctionSearchContextValue | null>(null);

export function AuctionSearchProvider({ children }: { children: ReactNode }) {
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const applySearch = () => {
    setSearchQuery(searchInput.trim().toLowerCase());
  };

  const clearSearch = () => {
    setSearchInput('');
    setSearchQuery('');
  };

  const value = useMemo(
    () => ({ searchInput, searchQuery, setSearchInput, applySearch, clearSearch }),
    [searchInput, searchQuery],
  );

  return <AuctionSearchContext.Provider value={value}>{children}</AuctionSearchContext.Provider>;
}

export function useAuctionSearch() {
  const context = useContext(AuctionSearchContext);
  if (!context) {
    throw new Error('useAuctionSearch must be used within AuctionSearchProvider.');
  }
  return context;
}
