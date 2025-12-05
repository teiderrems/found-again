import {Pages} from "@/config/constant";

export const preparePathForRouter = (path: Pages): string => {
  if (!path) {
    return '';
  }

  let url = path.trim();

  // Remove leading slash if present (Angular route `path` must not start with '/')
  if (url.startsWith('/')) {
    url = url.slice(1);
  }

  // Optionally, collapse multiple consecutive slashes inside the path
  url = url.replace(/\/{2,}/g, '/');

  return url;
};
