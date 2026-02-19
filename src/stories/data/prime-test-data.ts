// PRIME test data is too large to inline (~247KB).
// Loaded via fetch at runtime from src/data/prime_test_data.json.
export async function loadPrimeTestData(): Promise<any> {
  const response = await fetch('/src/data/prime_test_data.json');
  return response.json();
}
