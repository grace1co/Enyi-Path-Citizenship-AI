export const CIVICS_MODULE_MAP: Record<string, string> = {
  "Principles of American Democracy": "Principles of Democracy",
  "Principles of Democracy": "Principles of Democracy",
  "System of Government": "System of Government",
  "American Government": "System of Government",
  "American History": "American History",
  "History": "American History",
  "Rights and Responsibilities": "Rights & Responsibilities",
  "Rights & Responsibilities": "Rights & Responsibilities",
  "Geography": "Geography & Symbols",
  "Symbols": "Geography & Symbols",
  "Holidays": "Geography & Symbols",
};

export function normalizeModuleName(moduleName: string): string {
  return CIVICS_MODULE_MAP[moduleName] ?? moduleName;
}
