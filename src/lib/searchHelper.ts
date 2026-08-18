import { Product } from '../types';

// Phonetic & Misspelling dictionary for metal fabrication & lathe workshop terms
const PHONETIC_SYNONYMS: Record<string, string[]> = {
  // Grills
  gills: ['grill', 'grills', 'safety grill', 'safety grills', 'கிரில்', 'கிரில்கள்'],
  gill: ['grill', 'grills', 'safety grill', 'safety grills', 'கிரில்'],
  gril: ['grill', 'grills', 'safety grill'],
  grils: ['grill', 'grills', 'safety grills'],
  grilll: ['grill', 'grills', 'safety grill'],
  kiril: ['grill', 'grills', 'கிரில்'],
  kirils: ['grill', 'grills', 'கிரில்கள்'],
  
  // Kallapai / Plough
  kalapai: ['kallapai', '7 kallapai', '7-kallapai', 'கலப்பை', 'ஏர் கலப்பை'],
  kalappai: ['kallapai', '7 kallapai', '7-kallapai', 'கலப்பை', 'ஏர் கலப்பை'],
  kallappai: ['kallapai', '7 kallapai', '7-kallapai', 'கலப்பை'],
  kalape: ['kallapai', 'கலப்பை'],
  kallape: ['kallapai', 'கலப்பை'],
  kalappae: ['kallapai', 'கலப்பை'],
  plough: ['kallapai', 'ஏர் கலப்பை'],
  plow: ['kallapai', 'ஏர் கலப்பை'],
  '7kalapai': ['7 kallapai', 'kallapai'],
  '7kallapai': ['7 kallapai', 'kallapai'],

  // Gates
  gate: ['gate', 'gates', 'main gate', 'designer gate', 'கேட்', 'கேட்டுகள்'],
  gates: ['gate', 'gates', 'main gate', 'கேட்டுகள்'],
  geyt: ['gate', 'gates', 'கேட்'],
  geyts: ['gate', 'gates', 'கேட்டுகள்'],
  geit: ['gate', 'gates'],
  geits: ['gate', 'gates'],
  maingate: ['main gate', 'gate', 'மெயின் கேட்'],
  
  // Roofing
  roof: ['roofing', 'roofing structure', 'shed', 'கூரை', 'கூரை ஸ்ட்ரக்சர்'],
  roofin: ['roofing', 'கூரை'],
  roofs: ['roofing', 'கூரை'],
  rufing: ['roofing', 'கூரை'],
  rufin: ['roofing', 'கூரை'],
  shed: ['roofing', 'shed', 'கூரை'],
  sheds: ['roofing', 'sheds'],

  // Welding
  welding: ['welding', 'arc welding', 'custom welding', 'வெல்டிங்'],
  velding: ['welding', 'arc welding', 'வெல்டிங்'],
  welder: ['welding', 'வெல்டிங்'],
  velder: ['welding', 'வெல்டிங்'],
  ark: ['arc welding', 'welding', 'ARC வெல்டிங்'],
  arc: ['arc welding', 'welding', 'ARC வெல்டிங்'],

  // Rolling Shutters
  shutter: ['rolling shutter', 'shutter', 'shutters', 'ரோலிங் ஷட்டர்', 'ஷட்டர்'],
  shutters: ['rolling shutter', 'shutters', 'ரோலிங் ஷட்டர்'],
  sutter: ['rolling shutter', 'shutter', 'ரோலிங் ஷட்டர்'],
  sutters: ['rolling shutter', 'shutters'],
  roling: ['rolling shutter', 'shutter'],

  // Windows & Frames
  window: ['windows', 'windows & frames', 'window frames', 'ஜன்னல்', 'ஜன்னல்கள்'],
  windows: ['windows & frames', 'window', 'ஜன்னல்கள்'],
  vindow: ['windows', 'window', 'ஜன்னல்'],
  vindows: ['windows', 'window', 'ஜன்னல்கள்'],
  frame: ['frames', 'windows & frames', 'பிரேம்கள்'],
  frames: ['windows & frames', 'பிரேம்கள்'],

  // Tables & Desks
  table: ['tables', 'tables & desks', 'desk', 'மேஜை', 'மேஜைகள்'],
  tables: ['tables & desks', 'table', 'மேஜைகள்'],
  teble: ['tables', 'table', 'மேஜை'],
  desk: ['tables & desks', 'desk', 'desks', 'மேஜை'],
  desks: ['tables & desks', 'desks', 'மேஜைகள்'],
  bench: ['tables & desks', 'bench'],

  // Lathe Works
  lathe: ['lathe works', 'lathe', 'machining', 'turning', 'லேத்', 'லேத் வேலைகள்'],
  leyth: ['lathe', 'லேத்'],
  leth: ['lathe', 'லேத்'],
  turning: ['lathe', 'shaft lathe turning', 'லேத் டர்னிங்'],
  shaft: ['lathe', 'shaft turning'],

  // Chairs
  chair: ['steel chair', 'chair', 'chairs', 'நாற்காலி', 'நாற்காலிகள்'],
  chairs: ['steel chair', 'chair', 'chairs', 'நாற்காலிகள்'],
  cher: ['chair', 'chairs', 'நாற்காலி'],
  chers: ['chairs', 'நாற்காலிகள்']
};

/**
 * Calculate Levenshtein distance between two lowercase strings
 */
export function getLevenshteinDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Checks if tokenA is fuzzy close to tokenB
 */
function isFuzzyMatch(queryWord: string, targetWord: string): boolean {
  if (queryWord === targetWord) return true;
  if (targetWord.includes(queryWord) || queryWord.includes(targetWord)) return true;

  // For words of length 3-4, allow distance 1
  if (queryWord.length >= 3 && targetWord.length >= 3) {
    const dist = getLevenshteinDistance(queryWord, targetWord);
    if (dist <= 1) return true;
    // For longer words (5+), allow distance 2 (e.g. "gills" vs "grills")
    if (queryWord.length >= 5 && targetWord.length >= 5 && dist <= 2) return true;
  }

  return false;
}

/**
 * Expand a single token using phonetic dictionary and Tamil keywords
 */
function expandQueryToken(token: string): string[] {
  const clean = token.toLowerCase().trim();
  const set = new Set<string>([clean]);

  if (PHONETIC_SYNONYMS[clean]) {
    PHONETIC_SYNONYMS[clean].forEach((s) => set.add(s.toLowerCase()));
  }

  // Also check if any key in PHONETIC_SYNONYMS is fuzzy-close to this token
  for (const [key, synonyms] of Object.entries(PHONETIC_SYNONYMS)) {
    if (isFuzzyMatch(clean, key)) {
      set.add(key);
      synonyms.forEach((s) => set.add(s.toLowerCase()));
    }
  }

  return Array.from(set);
}

/**
 * Normalize and clean speech input
 */
export function normalizeSpeechTranscript(transcript: string): string {
  let cleaned = transcript.trim().toLowerCase();

  // Common speech-to-text misinterpretations
  cleaned = cleaned.replace(/\bgills\b/gi, 'grills');
  cleaned = cleaned.replace(/\bgill\b/gi, 'grill');
  cleaned = cleaned.replace(/\bkalapai\b/gi, 'kallapai');
  cleaned = cleaned.replace(/\bkalappai\b/gi, 'kallapai');
  cleaned = cleaned.replace(/\b7 call a pie\b/gi, '7 kallapai');
  cleaned = cleaned.replace(/\bcall a pie\b/gi, 'kallapai');
  cleaned = cleaned.replace(/\bgeyt\b/gi, 'gate');
  cleaned = cleaned.replace(/\bshutter\b/gi, 'rolling shutter');

  return cleaned;
}

/**
 * Smart Search Products: Supports multi-word queries, substring matching for long titles,
 * phonetic correction, and relevance ranking.
 */
export function filterProductsSmartly(products: Product[], rawQuery: string): Product[] {
  const query = rawQuery.trim().toLowerCase();
  if (!query) return products;

  const queryTokens = query
    .split(/\s+/)
    .map((t) => t.replace(/[^\w\u0B80-\u0BFF]/g, ''))
    .filter((t) => t.length > 0);

  if (queryTokens.length === 0) return products;

  // Build expanded token sets for each word in query
  const expandedTokenGroups = queryTokens.map((t) => expandQueryToken(t));

  const scoredProducts: { product: Product; score: number }[] = [];

  for (const product of products) {
    const titleEn = (product.name_en || '').toLowerCase();
    const titleTa = (product.name_ta || '').toLowerCase();
    const catName = (product.category_name || '').toLowerCase();
    const descEn = (product.description_en || '').toLowerCase();
    const descTa = (product.description_ta || '').toLowerCase();
    const materials = (product.materials || '').toLowerCase();
    const sizes = (product.available_sizes || '').toLowerCase();

    const fullCorpus = `${titleEn} ${titleTa} ${catName} ${descEn} ${descTa} ${materials} ${sizes}`.toLowerCase();
    const titleCorpus = `${titleEn} ${titleTa} ${catName}`.toLowerCase();
    const corpusWords = fullCorpus
      .split(/\s+/)
      .map((w) => w.replace(/[^\w\u0B80-\u0BFF]/g, ''))
      .filter((w) => w.length > 0);

    let score = 0;

    // 1. Exact full query match
    if (titleEn.includes(query) || titleTa.includes(query)) {
      score += 100;
    } else if (fullCorpus.includes(query)) {
      score += 60;
    }

    // 2. Evaluate each query token
    let matchedTokenCount = 0;

    for (const tokenVariants of expandedTokenGroups) {
      let variantMatched = false;

      for (const variant of tokenVariants) {
        // Direct substring in title
        if (titleCorpus.includes(variant)) {
          score += 30;
          variantMatched = true;
          break;
        }

        // Direct substring in full description / materials
        if (fullCorpus.includes(variant)) {
          score += 15;
          variantMatched = true;
          break;
        }

        // Fuzzy match against individual words in product
        const hasFuzzyWord = corpusWords.some((w) => isFuzzyMatch(variant, w));
        if (hasFuzzyWord) {
          score += 20;
          variantMatched = true;
          break;
        }
      }

      if (variantMatched) {
        matchedTokenCount++;
      }
    }

    // Bonus for matching multiple query words
    if (matchedTokenCount === queryTokens.length) {
      score += 40;
    } else if (matchedTokenCount > 0) {
      score += matchedTokenCount * 10;
    }

    if (score > 0) {
      scoredProducts.push({ product, score });
    }
  }

  // Sort descending by relevance score
  scoredProducts.sort((a, b) => b.score - a.score);

  return scoredProducts.map((sp) => sp.product);
}
