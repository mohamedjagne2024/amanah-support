import { MenuItemType } from './menu';

/**
 * Get all hrefs from menu items recursively
 */
export const getAllMenuHrefs = (menuItems: MenuItemType[]): string[] => {
  const hrefs: string[] = [];
  
  const collectHrefs = (items: MenuItemType[]) => {
    for (const item of items) {
      if (item.href) {
        hrefs.push(item.href);
      }
      if (item.children) {
        collectHrefs(item.children);
      }
    }
  };
  
  collectHrefs(menuItems);
  return hrefs;
};

/**
 * Strip query parameters and hash from URL
 */
const stripQueryAndHash = (url: string): string => {
  return url.split('?')[0].split('#')[0];
};

/**
 * Check if a menu item is active based on current URL
 * This handles:
 * - Exact matches
 * - Query parameter filtering (e.g., /work-orders?status=pending matches /work-orders)
 * - Nested routes with specificity (e.g., /work-orders/create vs /work-orders/request)
 */
export const isMenuActive = (
  currentUrl: string,
  menuHref: string,
  allHrefs: string[]
): boolean => {
  // Strip query parameters and hash from current URL
  const cleanUrl = stripQueryAndHash(currentUrl);
  const cleanMenuHref = stripQueryAndHash(menuHref);
  
  // Exact match (including query params stripped)
  if (cleanUrl === cleanMenuHref) {
    return true;
  }
  
  // Check if current URL starts with menu href (for nested routes)
  if (cleanUrl.startsWith(cleanMenuHref + '/')) {
    // Check if there's a more specific menu item that matches better
    // This prevents /work-orders from being active when on /work-orders/request
    const hasMoreSpecificMatch = allHrefs.some((href) => {
      const cleanHref = stripQueryAndHash(href);
      // Skip the current menu href
      if (cleanHref === cleanMenuHref) return false;
      
      // Check if this href is more specific and matches the current URL
      return (
        cleanHref.startsWith(cleanMenuHref) && // It's a child of the current menu
        (cleanUrl === cleanHref || cleanUrl.startsWith(cleanHref + '/')) // And it matches the current URL
      );
    });
    
    // Only return true if there's no more specific match
    return !hasMoreSpecificMatch;
  }
  
  return false;
};

/**
 * Check if a menu item or any of its children is active
 */
export const isItemActive = (
  item: MenuItemType,
  currentUrl: string,
  allHrefs: string[]
): boolean => {
  // Check if the item itself is active
  if (item.href && isMenuActive(currentUrl, item.href, allHrefs)) {
    return true;
  }
  
  // Check if any children are active
  if (item.children) {
    return item.children.some((child) => isItemActive(child, currentUrl, allHrefs));
  }
  
  return false;
};

