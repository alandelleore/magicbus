import { createContext, useContext, useState, ReactNode } from 'react';
import type { Parada } from '../types';

export interface SearchState {
  inputValue: string;
  queryBuscada: string;
  resultados: Parada[];
}

interface SearchContextType {
  searchState: SearchState;
  setSearchState: (state: SearchState) => void;
}

const SearchContext = createContext<SearchContextType | null>(null);

export function SearchProvider({ children }: { children: ReactNode }) {
  const [searchState, setSearchState] = useState<SearchState>({
    inputValue: '',
    queryBuscada: '',
    resultados: [],
  });

  return (
    <SearchContext.Provider value={{ searchState, setSearchState }}>
      {children}
    </SearchContext.Provider>
  );
}

export function useSearchContext() {
  const ctx = useContext(SearchContext);
  if (!ctx) throw new Error('useSearchContext must be used within SearchProvider');
  return ctx;
}
