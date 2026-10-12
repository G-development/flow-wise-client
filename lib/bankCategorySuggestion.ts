interface Category {
  id: string | number;
  name: string;
  type: "I" | "E";
  active: boolean;
}

export type BankTransactionType = "I" | "E";

export interface BankTransactionForSuggestion {
  amount: number | string;
  description: string;
  counterparty: string | null;
}

export interface CategorySuggestion {
  categoryId: string;
  uncertain: boolean;
  score: number;
}

const CONFIDENT_MATCH_SCORE = 100;

function normalizeForMatch(text: string): string {
  return String(text)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

function scoreCategoryForTxn(txnTextNorm: string, categoryNameNorm: string): number {
  if (!txnTextNorm || !categoryNameNorm) return 0;
  const paddedTransactionText = ` ${txnTextNorm} `;
  const paddedCategoryName = ` ${categoryNameNorm} `;
  return categoryNameNorm.length >= 3 && paddedTransactionText.includes(paddedCategoryName)
    ? CONFIDENT_MATCH_SCORE
    : 0;
}

export function getBankTransactionType(amount: number | string): BankTransactionType {
  const numericAmount = Number(amount);
  return Number.isFinite(numericAmount) && numericAmount >= 0 ? "I" : "E";
}

export function suggestBankTransactionCategory(
  transaction: BankTransactionForSuggestion,
  categories: Category[]
): CategorySuggestion {
  const type = getBankTransactionType(transaction.amount);
  const matchingCategories = categories.filter((category) => category.type === type);
  const transactionText = normalizeForMatch(
    `${transaction.description || ""} ${transaction.counterparty || ""}`
  );
  const scored = matchingCategories
    .map((category) => ({
      category,
      score: scoreCategoryForTxn(
        transactionText,
        normalizeForMatch(category.name || "")
      ),
    }))
    .sort((a, b) => b.score - a.score);
  const best = scored[0];
  const tiedForBest = best
    ? scored.filter((candidate) => candidate.score === best.score).length > 1
    : false;

  if (best && best.score >= CONFIDENT_MATCH_SCORE && !tiedForBest) {
    return { categoryId: String(best.category.id), uncertain: false, score: best.score };
  }

  const other = matchingCategories.find(
    (category) => normalizeForMatch(category.name) === "altro"
  );
  return {
    categoryId: other ? String(other.id) : "",
    uncertain: true,
    score: best?.score ?? 0,
  };
}

export function getMissingOtherTypes(
  transactions: Array<BankTransactionForSuggestion & { id: string }>,
  suggestions: Record<string, CategorySuggestion>,
  categories: Category[]
): BankTransactionType[] {
  const types = new Set<BankTransactionType>();
  for (const transaction of transactions) {
    if (!suggestions[transaction.id]?.uncertain) continue;
    const type = getBankTransactionType(transaction.amount);
    const hasActiveOther = categories.some(
      (category) =>
        category.type === type && normalizeForMatch(category.name) === "altro"
    );
    if (!hasActiveOther) types.add(type);
  }
  return Array.from(types);
}
