export const getCurrentUser = () => {
  return JSON.parse(localStorage.getItem("user"));
};

export const getToken = () => {
  return localStorage.getItem("token");
};
