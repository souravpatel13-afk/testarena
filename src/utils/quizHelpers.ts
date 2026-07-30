import { Question } from '../types';

/**
 * Helper to determine if a question is a Previous Year Question (PYQ).
 * A question is classified as PYQ if it has a valid exam field.
 */
export const isPyq = (q: Question | undefined | null): boolean => {
  if (!q) return false;
  
  // Check exam validity
  if (!q.exam || typeof q.exam !== 'string') return false;
  const examStr = q.exam.trim();
  const examLower = examStr.toLowerCase();
  if (
    examLower === '' || 
    examLower === 'undefined' || 
    examLower === 'null' || 
    examLower === 'none' || 
    examLower === 'nan' || 
    examLower === 'n/a'
  ) {
    return false;
  }
  
  return true;
};

/**
 * Helper to determine if a question belongs to Subject Tests.
 * Any question with a valid subject field is eligible for subject practice,
 * provided it is not classified as a PYQ (does not have an exam field).
 */
export const isSubjectTestQuestion = (q: Question | undefined | null): boolean => {
  if (!q) return false;
  return !isPyq(q) && !!q.subject && typeof q.subject === 'string' && q.subject.trim() !== '';
};

/**
 * Ultra-robust helper to parse CorrectAnswerIndex from Google Sheets or CSV.
 * It intelligently handles:
 *  1. 0-indexed integers (0, 1, 2, 3, 4)
 *  2. 1-indexed integers (1, 2, 3, 4, 5)
 *  3. Letter indexes (A, B, C, D, E or a, b, c, d, e)
 *  4. Direct text matching of correct option
 */
export const parseCorrectAnswer = (rawVal: any, options: string[]): number => {
  if (rawVal === undefined || rawVal === null) return 0;
  
  const valStr = String(rawVal).trim();
  if (valStr === '') return 0;

  // 1. If it's a letter A-E / a-e
  if (/^[a-eA-E]$/.test(valStr)) {
    return valStr.toUpperCase().charCodeAt(0) - 65;
  }

  // 2. Exact or case-insensitive string value match against actual option text list
  const exactMatchIdx = options.findIndex(opt => opt && opt.trim() === valStr);
  if (exactMatchIdx !== -1) {
    return exactMatchIdx;
  }

  const lowerMatchIdx = options.findIndex(opt => opt && opt.trim().toLowerCase() === valStr.toLowerCase());
  if (lowerMatchIdx !== -1) {
    return lowerMatchIdx;
  }

  // 3. Number index conversion
  const parsed = parseInt(valStr, 10);
  if (!isNaN(parsed)) {
    // 1-indexed (1 to 5) - very common for non-technical users
    if (parsed >= 1 && parsed <= options.length) {
      return parsed - 1;
    }
    // 0-indexed check
    if (parsed === 0) {
      return 0;
    }
    if (parsed >= 0 && parsed < options.length) {
      return parsed;
    }
  }

  return 0;
};

