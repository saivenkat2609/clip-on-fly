// Template System for NebulaAI
// This file contains all template definitions and styling properties

export interface TemplateStyle {
  // Caption Styling
  captionFont: string;
  captionFontSize: string;
  captionFontWeight: string;
  captionColor: string;
  captionBackgroundColor?: string;
  captionBackgroundOpacity?: number;
  captionAlignment: 'left' | 'center' | 'right';
  captionPosition: 'top' | 'middle' | 'bottom';
  captionPadding: string;
  captionBorderRadius?: string;
  captionTextShadow?: string;
  captionLetterSpacing?: string;
  captionLineHeight?: string;

  // Word Highlight Styling (for active word during captions)
  highlightColor?: string;
  highlightBackgroundColor?: string;
  highlightFontWeight?: string;

  // Animation Properties
  captionAnimation?: 'fade' | 'slide' | 'bounce' | 'none';
  captionAnimationDuration?: string;
  wordByWordAnimation?: boolean;

  // Background & Overlay
  overlayColor?: string;
  overlayOpacity?: number;
  overlayGradient?: string;
  backgroundPattern?: 'dots' | 'lines' | 'grid' | 'none';

  // Branding
  logoPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  logoSize?: string;
  watermarkText?: string;
  watermarkPosition?: string;

  // Effects
  vignette?: boolean;
  blur?: number;
  brightness?: number;
  contrast?: number;
  saturation?: number;
}

export interface Template {
  id: string;
  name: string;
  category: 'Professional' | 'Creative' | 'Tech' | 'Lifestyle';
  description: string;
  thumbnail: string;
  popular?: boolean;
  trending?: boolean;
  plan: 'Free' | 'Starter' | 'Professional'; // Minimum plan required
  style: TemplateStyle;
  tags: string[]; // For search functionality
}

// Template Library
export const templates: Template[] = [
  // PROFESSIONAL CATEGORY
  {
    id: 'prof-modern-minimal',
    name: 'Modern Minimal',
    category: 'Professional',
    description: 'Clean, minimalist design perfect for business content',
    thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&h=600&fit=crop',
    popular: true,
    plan: 'Free',
    tags: ['minimal', 'clean', 'business', 'corporate', 'simple'],
    style: {
      captionFont: 'Inter, sans-serif',
      captionFontSize: '2.5rem',
      captionFontWeight: '600',
      captionColor: '#FFFFFF',
      captionBackgroundColor: '#000000',
      captionBackgroundOpacity: 0.75,
      captionAlignment: 'center',
      captionPosition: 'bottom',
      captionPadding: '1rem 2rem',
      captionBorderRadius: '0.5rem',
      captionTextShadow: '2px 2px 4px rgba(0,0,0,0.5)',
      captionLineHeight: '1.3',
      highlightColor: '#60A5FA',
      highlightFontWeight: '700',
      captionAnimation: 'fade',
      captionAnimationDuration: '0.3s',
      wordByWordAnimation: true,
      overlayOpacity: 0.1,
      logoPosition: 'bottom-right',
      logoSize: '80px'
    }
  },
  {
    id: 'prof-elegant-serif',
    name: 'Elegant Serif',
    category: 'Professional',
    description: 'Sophisticated serif typography for premium content',
    thumbnail: 'https://images.unsplash.com/photo-1618556450994-a6a128ef0d9d?w=400&h=600&fit=crop',
    plan: 'Starter',
    tags: ['elegant', 'serif', 'premium', 'sophisticated'],
    style: {
      captionFont: 'Playfair Display, serif',
      captionFontSize: '2.25rem',
      captionFontWeight: '500',
      captionColor: '#F8F9FA',
      captionBackgroundColor: '#1E293B',
      captionBackgroundOpacity: 0.85,
      captionAlignment: 'center',
      captionPosition: 'middle',
      captionPadding: '1.5rem 2.5rem',
      captionBorderRadius: '0.75rem',
      captionLetterSpacing: '0.02em',
      captionLineHeight: '1.4',
      highlightColor: '#D4AF37',
      captionAnimation: 'slide',
      captionAnimationDuration: '0.4s',
      wordByWordAnimation: true,
      overlayGradient: 'linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.3) 100%)',
      logoPosition: 'top-right',
      logoSize: '100px'
    }
  },
  {
    id: 'prof-corporate-clean',
    name: 'Corporate Clean',
    category: 'Professional',
    description: 'Professional design for corporate communications',
    thumbnail: 'https://images.unsplash.com/photo-1618556450994-a6a128ef0d9d?w=400&h=600&fit=crop',
    plan: 'Starter',
    tags: ['corporate', 'professional', 'clean', 'business'],
    style: {
      captionFont: 'Roboto, sans-serif',
      captionFontSize: '2.25rem',
      captionFontWeight: '500',
      captionColor: '#1E293B',
      captionBackgroundColor: '#F1F5F9',
      captionBackgroundOpacity: 0.95,
      captionAlignment: 'left',
      captionPosition: 'bottom',
      captionPadding: '1.25rem 2rem',
      captionBorderRadius: '0.25rem',
      captionLineHeight: '1.35',
      highlightColor: '#3B82F6',
      highlightFontWeight: '600',
      captionAnimation: 'fade',
      captionAnimationDuration: '0.25s',
      wordByWordAnimation: true,
      logoPosition: 'top-left',
      logoSize: '90px'
    }
  },

  // CREATIVE CATEGORY
  {
    id: 'creative-bold-energetic',
    name: 'Bold & Energetic',
    category: 'Creative',
    description: 'High-energy design with bold typography',
    thumbnail: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=400&h=600&fit=crop',
    trending: true,
    plan: 'Free',
    tags: ['bold', 'energetic', 'vibrant', 'dynamic'],
    style: {
      captionFont: 'Montserrat, sans-serif',
      captionFontSize: '3rem',
      captionFontWeight: '800',
      captionColor: '#FBBF24',
      captionBackgroundColor: '#7C3AED',
      captionBackgroundOpacity: 0.9,
      captionAlignment: 'center',
      captionPosition: 'middle',
      captionPadding: '1rem 2rem',
      captionBorderRadius: '1rem',
      captionTextShadow: '3px 3px 0px #000000',
      captionLetterSpacing: '0.05em',
      captionLineHeight: '1.2',
      highlightColor: '#F59E0B',
      highlightBackgroundColor: '#000000',
      highlightFontWeight: '900',
      captionAnimation: 'bounce',
      captionAnimationDuration: '0.4s',
      wordByWordAnimation: true,
      overlayGradient: 'linear-gradient(135deg, rgba(236,72,153,0.3) 0%, rgba(139,92,246,0.3) 100%)',
      logoPosition: 'top-right',
      logoSize: '100px'
    }
  },
  {
    id: 'creative-playful-pop',
    name: 'Playful Pop',
    category: 'Creative',
    description: 'Fun, colorful design for entertainment content',
    thumbnail: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=400&h=600&fit=crop',
    popular: true,
    plan: 'Starter',
    tags: ['playful', 'fun', 'colorful', 'pop'],
    style: {
      captionFont: 'Poppins, sans-serif',
      captionFontSize: '2.75rem',
      captionFontWeight: '700',
      captionColor: '#FFFFFF',
      captionBackgroundColor: '#EC4899',
      captionBackgroundOpacity: 0.85,
      captionAlignment: 'center',
      captionPosition: 'bottom',
      captionPadding: '1.25rem 2rem',
      captionBorderRadius: '2rem',
      captionTextShadow: '2px 2px 8px rgba(0,0,0,0.4)',
      captionLetterSpacing: '0.03em',
      captionLineHeight: '1.3',
      highlightColor: '#FBBF24',
      highlightFontWeight: '800',
      captionAnimation: 'bounce',
      captionAnimationDuration: '0.35s',
      wordByWordAnimation: true,
      backgroundPattern: 'dots',
      logoPosition: 'bottom-left',
      logoSize: '85px'
    }
  },
  {
    id: 'creative-retro-vibe',
    name: 'Retro Vibe',
    category: 'Creative',
    description: 'Nostalgic 80s-inspired design',
    thumbnail: 'https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead?w=400&h=600&fit=crop',
    plan: 'Professional',
    tags: ['retro', '80s', 'vintage', 'nostalgic'],
    style: {
      captionFont: 'Press Start 2P, monospace',
      captionFontSize: '1.75rem',
      captionFontWeight: '400',
      captionColor: '#FF00FF',
      captionBackgroundColor: '#000000',
      captionBackgroundOpacity: 0.7,
      captionAlignment: 'center',
      captionPosition: 'top',
      captionPadding: '1rem 1.5rem',
      captionBorderRadius: '0',
      captionTextShadow: '3px 3px 0px #00FFFF, -1px -1px 0px #FF00FF',
      captionLetterSpacing: '0.1em',
      captionLineHeight: '1.5',
      highlightColor: '#00FFFF',
      highlightFontWeight: '400',
      captionAnimation: 'none',
      wordByWordAnimation: false,
      overlayGradient: 'linear-gradient(180deg, rgba(255,0,255,0.1) 0%, rgba(0,255,255,0.1) 100%)',
      backgroundPattern: 'grid',
      logoPosition: 'bottom-right',
      logoSize: '70px'
    }
  },

  // TECH CATEGORY
  {
    id: 'tech-futuristic',
    name: 'Tech Futuristic',
    category: 'Tech',
    description: 'Modern, sleek design for tech content',
    thumbnail: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=400&h=600&fit=crop',
    plan: 'Starter',
    tags: ['tech', 'futuristic', 'modern', 'sleek'],
    style: {
      captionFont: 'Orbitron, sans-serif',
      captionFontSize: '2.5rem',
      captionFontWeight: '600',
      captionColor: '#00F0FF',
      captionBackgroundColor: '#0A0E27',
      captionBackgroundOpacity: 0.9,
      captionAlignment: 'left',
      captionPosition: 'bottom',
      captionPadding: '1.25rem 2rem',
      captionBorderRadius: '0.5rem',
      captionTextShadow: '0 0 10px rgba(0,240,255,0.5)',
      captionLetterSpacing: '0.05em',
      captionLineHeight: '1.3',
      highlightColor: '#00FF88',
      highlightFontWeight: '700',
      captionAnimation: 'slide',
      captionAnimationDuration: '0.3s',
      wordByWordAnimation: true,
      overlayGradient: 'linear-gradient(135deg, rgba(0,240,255,0.1) 0%, rgba(139,92,246,0.2) 100%)',
      backgroundPattern: 'lines',
      logoPosition: 'top-right',
      logoSize: '90px'
    }
  },
  {
    id: 'tech-minimalist-dark',
    name: 'Minimalist Dark',
    category: 'Tech',
    description: 'Dark, minimalist design for tech reviews',
    thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&h=600&fit=crop',
    popular: true,
    plan: 'Professional',
    tags: ['minimal', 'dark', 'tech', 'sleek'],
    style: {
      captionFont: 'Space Grotesk, sans-serif',
      captionFontSize: '2.5rem',
      captionFontWeight: '500',
      captionColor: '#E5E7EB',
      captionBackgroundColor: '#111827',
      captionBackgroundOpacity: 0.85,
      captionAlignment: 'center',
      captionPosition: 'bottom',
      captionPadding: '1.5rem 2.5rem',
      captionBorderRadius: '0.75rem',
      captionTextShadow: '1px 1px 2px rgba(0,0,0,0.8)',
      captionLetterSpacing: '0.02em',
      captionLineHeight: '1.35',
      highlightColor: '#10B981',
      highlightFontWeight: '600',
      captionAnimation: 'fade',
      captionAnimationDuration: '0.25s',
      wordByWordAnimation: true,
      overlayColor: '#000000',
      overlayOpacity: 0.2,
      logoPosition: 'bottom-right',
      logoSize: '85px'
    }
  },

  // LIFESTYLE CATEGORY
  {
    id: 'lifestyle-warm-cozy',
    name: 'Warm & Cozy',
    category: 'Lifestyle',
    description: 'Warm, inviting design for lifestyle content',
    thumbnail: 'https://images.unsplash.com/photo-1618556450991-2f1af64e8191?w=400&h=600&fit=crop',
    trending: true,
    plan: 'Free',
    tags: ['warm', 'cozy', 'lifestyle', 'inviting'],
    style: {
      captionFont: 'Quicksand, sans-serif',
      captionFontSize: '2.5rem',
      captionFontWeight: '500',
      captionColor: '#FFFFFF',
      captionBackgroundColor: '#D97706',
      captionBackgroundOpacity: 0.8,
      captionAlignment: 'center',
      captionPosition: 'bottom',
      captionPadding: '1.25rem 2.25rem',
      captionBorderRadius: '1.5rem',
      captionTextShadow: '2px 2px 4px rgba(0,0,0,0.3)',
      captionLetterSpacing: '0.01em',
      captionLineHeight: '1.4',
      highlightColor: '#FEF3C7',
      highlightFontWeight: '600',
      captionAnimation: 'fade',
      captionAnimationDuration: '0.35s',
      wordByWordAnimation: true,
      overlayGradient: 'linear-gradient(180deg, rgba(217,119,6,0.1) 0%, rgba(245,158,11,0.2) 100%)',
      vignette: true,
      logoPosition: 'top-left',
      logoSize: '80px'
    }
  },
  {
    id: 'lifestyle-fitness-energy',
    name: 'Fitness Energy',
    category: 'Lifestyle',
    description: 'High-energy design for fitness and wellness',
    thumbnail: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&h=600&fit=crop',
    plan: 'Starter',
    tags: ['fitness', 'energy', 'wellness', 'active'],
    style: {
      captionFont: 'Bebas Neue, sans-serif',
      captionFontSize: '3rem',
      captionFontWeight: '700',
      captionColor: '#FFFFFF',
      captionBackgroundColor: '#DC2626',
      captionBackgroundOpacity: 0.85,
      captionAlignment: 'center',
      captionPosition: 'middle',
      captionPadding: '1rem 2rem',
      captionBorderRadius: '0.5rem',
      captionTextShadow: '3px 3px 6px rgba(0,0,0,0.5)',
      captionLetterSpacing: '0.08em',
      captionLineHeight: '1.1',
      highlightColor: '#FBBF24',
      highlightFontWeight: '700',
      captionAnimation: 'bounce',
      captionAnimationDuration: '0.3s',
      wordByWordAnimation: true,
      overlayGradient: 'linear-gradient(135deg, rgba(220,38,38,0.2) 0%, rgba(234,88,12,0.2) 100%)',
      brightness: 1.1,
      contrast: 1.1,
      saturation: 1.2,
      logoPosition: 'top-right',
      logoSize: '95px'
    }
  }
];

// Helper Functions
export function getTemplateById(id: string): Template | undefined {
  return templates.find(t => t.id === id);
}

export function getTemplatesByCategory(category: string): Template[] {
  if (category === 'All') return templates;
  return templates.filter(t => t.category === category);
}

export function getTemplatesByPlan(userPlan: 'Free' | 'Starter' | 'Professional'): Template[] {
  const planHierarchy = { 'Free': 1, 'Starter': 2, 'Professional': 3 };
  const userPlanLevel = planHierarchy[userPlan];

  return templates.filter(t => planHierarchy[t.plan] <= userPlanLevel);
}

export function searchTemplates(searchTerm: string): Template[] {
  const term = searchTerm.toLowerCase();
  return templates.filter(t =>
    t.name.toLowerCase().includes(term) ||
    t.description.toLowerCase().includes(term) ||
    t.category.toLowerCase().includes(term) ||
    t.tags.some(tag => tag.toLowerCase().includes(term))
  );
}

export function getPopularTemplates(): Template[] {
  return templates.filter(t => t.popular);
}

export function getTrendingTemplates(): Template[] {
  return templates.filter(t => t.trending);
}

export function canUserAccessTemplate(template: Template, userPlan: 'Free' | 'Starter' | 'Professional'): boolean {
  const planHierarchy = { 'Free': 1, 'Starter': 2, 'Professional': 3 };
  return planHierarchy[userPlan] >= planHierarchy[template.plan];
}

// Generate CSS styles from template
export function generateTemplateCSS(template: Template): string {
  const style = template.style;

  return `
    .caption-text {
      font-family: ${style.captionFont};
      font-size: ${style.captionFontSize};
      font-weight: ${style.captionFontWeight};
      color: ${style.captionColor};
      ${style.captionBackgroundColor ? `background-color: ${style.captionBackgroundColor};` : ''}
      ${style.captionBackgroundOpacity ? `opacity: ${style.captionBackgroundOpacity};` : ''}
      text-align: ${style.captionAlignment};
      padding: ${style.captionPadding};
      ${style.captionBorderRadius ? `border-radius: ${style.captionBorderRadius};` : ''}
      ${style.captionTextShadow ? `text-shadow: ${style.captionTextShadow};` : ''}
      ${style.captionLetterSpacing ? `letter-spacing: ${style.captionLetterSpacing};` : ''}
      ${style.captionLineHeight ? `line-height: ${style.captionLineHeight};` : ''}
    }

    .caption-highlight {
      ${style.highlightColor ? `color: ${style.highlightColor};` : ''}
      ${style.highlightBackgroundColor ? `background-color: ${style.highlightBackgroundColor};` : ''}
      ${style.highlightFontWeight ? `font-weight: ${style.highlightFontWeight};` : ''}
    }
  `.trim();
}
