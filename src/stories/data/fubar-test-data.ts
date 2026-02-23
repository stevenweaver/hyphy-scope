export async function loadFubarTestData(): Promise<any> {
  const response = await fetch('/src/data/fubar_test_data.json');
  return response.json();
}
