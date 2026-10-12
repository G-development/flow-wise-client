import assert from "node:assert/strict";
import test from "node:test";
import {
  getBankTransactionType,
  getMissingOtherTypes,
  suggestBankTransactionCategory,
} from "./bankCategorySuggestion.ts";

interface Category {
  id: string;
  userid: string;
  name: string;
  type: "I" | "E";
  active: boolean;
}

const categories: Category[] = [
  { id: "1", userid: "user", name: "Alimentari", type: "E", active: true },
  { id: "2", userid: "user", name: "Altro", type: "E", active: true },
  { id: "3", userid: "user", name: "Stipendio", type: "I", active: true },
  { id: "4", userid: "user", name: "Altro", type: "I", active: true },
];

test("suggests a confident category when its full name matches transaction text", () => {
  assert.deepEqual(
    suggestBankTransactionCategory(
      { amount: "-12.50", description: "Pagamento ALIMENTARI Roma", counterparty: null },
      categories
    ),
    { categoryId: "1", uncertain: false, score: 100 }
  );
});

test("does not treat a partial word overlap as a confident match", () => {
  const result = suggestBankTransactionCategory(
    { amount: -3, description: "Bar tabacchi", counterparty: null },
    categories
  );
  assert.deepEqual(result, { categoryId: "2", uncertain: true, score: 0 });
});

test("uses type-specific Altro for an unmatched transaction", () => {
  assert.deepEqual(
    suggestBankTransactionCategory(
      { amount: 25, description: "Bonifico ricevuto", counterparty: "Mario" },
      categories
    ),
    { categoryId: "4", uncertain: true, score: 0 }
  );
});

test("treats ambiguous same-score category matches as uncertain", () => {
  const ambiguousCategories = [
    { ...categories[0], id: "5", name: "Cibo" },
    { ...categories[0], id: "6", name: "Cibo" },
    categories[1],
  ];
  assert.deepEqual(
    suggestBankTransactionCategory(
      { amount: -5, description: "Cibo", counterparty: null },
      ambiguousCategories
    ),
    { categoryId: "2", uncertain: true, score: 100 }
  );
});

test("leaves unmatched category blank when type-specific Altro is missing", () => {
  assert.deepEqual(
    suggestBankTransactionCategory(
      { amount: -5, description: "Pagamento", counterparty: null },
      [categories[2]]
    ),
    { categoryId: "", uncertain: true, score: 0 }
  );
});

test("reports only missing Altro types needed by uncertain transactions", () => {
  const transactions = [
    { id: "income", amount: 2, description: "N/D", counterparty: null },
    { id: "expense", amount: -2, description: "N/D", counterparty: null },
  ];
  const suggestions = {
    income: { categoryId: "4", uncertain: true, score: 0 },
    expense: { categoryId: "", uncertain: true, score: 0 },
  };
  assert.deepEqual(getMissingOtherTypes(transactions, suggestions, [categories[3]]), ["E"]);
});

test("classifies nonnegative amounts as income and negative amounts as expense", () => {
  assert.equal(getBankTransactionType(0), "I");
  assert.equal(getBankTransactionType(-0.01), "E");
});
