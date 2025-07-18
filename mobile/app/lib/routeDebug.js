let currentRoute = '';

export const logRoute = (message) => {
  console.log(`[ROUTE] ${message} | Current route: ${currentRoute}`);
};

export const setCurrentRoute = (route) => {
  currentRoute = route;
  console.log(`[ROUTE] Navigation to: ${route}`);
};

export const getCurrentRoute = () => {
  return currentRoute;
};