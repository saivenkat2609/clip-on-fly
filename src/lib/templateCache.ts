import { templates, type Template } from './templates';

const TEMPLATE_CACHE_KEY = 'app_templates_v1';
const TEMPLATE_CACHE_VERSION = '1.0.0';

interface TemplateCache {
  version: string;
  templates: Template[];
  timestamp: number;
}

/**
 * Get templates with sessionStorage caching
 * Templates are static data that rarely change, so we cache them
 */
export function getCachedTemplates(): Template[] {
  try {
    const cached = sessionStorage.getItem(TEMPLATE_CACHE_KEY);

    if (cached) {
      const { version, templates: cachedTemplates, timestamp }: TemplateCache = JSON.parse(cached);

      // Check version match
      if (version === TEMPLATE_CACHE_VERSION) {
        return cachedTemplates;
      }
    }
  } catch (error) {
    console.error('Failed to read cached templates:', error);
  }

  // Cache miss or version mismatch - cache the templates
  try {
    const cacheData: TemplateCache = {
      version: TEMPLATE_CACHE_VERSION,
      templates,
      timestamp: Date.now(),
    };

    sessionStorage.setItem(TEMPLATE_CACHE_KEY, JSON.stringify(cacheData));
  } catch (error) {
    console.error('Failed to cache templates:', error);
  }

  return templates;
}

/**
 * Clear template cache (useful when templates are updated)
 */
export function clearTemplateCache() {
  try {
    sessionStorage.removeItem(TEMPLATE_CACHE_KEY);
  } catch (error) {
    console.error('Failed to clear template cache:', error);
  }
}

/**
 * Check if templates are cached
 */
export function isTemplateCached(): boolean {
  try {
    const cached = sessionStorage.getItem(TEMPLATE_CACHE_KEY);
    if (cached) {
      const { version }: TemplateCache = JSON.parse(cached);
      return version === TEMPLATE_CACHE_VERSION;
    }
  } catch (error) {
    return false;
  }
  return false;
}
