import { useState, useEffect } from 'react';
import campusDataJson from '../../jamia_hamdard_data.json';
import { CanteenItem } from '../models/canteen';

export interface SearchResultItem extends CanteenItem {
  canteenId: string;
  canteenName: string;
  building: string;
}

export function useSearchFilter(
  query: string,
  category: string,
  maxPrice: number
) {
  const [filteredResults, setFilteredResults] = useState<SearchResultItem[]>([]);
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  // Debounce the query string updates
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(handler);
  }, [query]);

  useEffect(() => {
    // Flatten all items across all canteens
    const allItems: SearchResultItem[] = [];
    const canteens = campusDataJson.canteens || [];
    
    canteens.forEach((canteen: any) => {
      if (canteen.menu) {
        canteen.menu.forEach((item: any) => {
          allItems.push({
            ...item,
            canteenId: canteen.id,
            canteenName: canteen.name,
            building: canteen.building,
          });
        });
      }
    });

    const filtered = allItems.filter((item) => {
      // 1. Query Filter (Name, Canteen Name, Building, Category)
      const q = debouncedQuery.trim().toLowerCase();
      if (q) {
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesCanteen = item.canteenName.toLowerCase().includes(q);
        const matchesBuilding = item.building.toLowerCase().includes(q);
        const matchesCategory = item.category.toLowerCase().includes(q);
        if (!matchesName && !matchesCanteen && !matchesBuilding && !matchesCategory) {
          return false;
        }
      }

      // 2. Category Chip Filter
      if (category && category !== 'All') {
        if (item.category.toLowerCase() !== category.toLowerCase()) {
          return false;
        }
      }

      // 3. Price Filter
      if (maxPrice > 0) {
        if (item.price > maxPrice) {
          return false;
        }
      }

      return true;
    });

    setFilteredResults(filtered);
  }, [debouncedQuery, category, maxPrice]);

  return filteredResults;
}
