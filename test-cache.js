// Simple test to verify query cache functionality
const { cachedQuery, getCacheStats, clearCache } = require('./app/utils/query-cache.ts');

async function testCache() {
  console.log('Testing query cache functionality...');
  
  // Clear cache to start fresh
  clearCache();
  
  // Test function that simulates a database query
  const mockQuery = async (id) => {
    console.log(`Executing mock query for ID: ${id}`);
    await new Promise(resolve => setTimeout(resolve, 100)); // Simulate delay
    return { id, data: `Result for ${id}`, timestamp: Date.now() };
  };
  
  // First call - should execute query
  console.log('\n1. First call (cache miss):');
  const result1 = await cachedQuery(
    () => mockQuery(1),
    'test_query_1',
    [1],
    5000 // 5 second cache
  );
  console.log('Result:', result1);
  
  // Second call - should use cache
  console.log('\n2. Second call (cache hit):');
  const result2 = await cachedQuery(
    () => mockQuery(1),
    'test_query_1',
    [1],
    5000
  );
  console.log('Result:', result2);
  
  // Different parameters - should execute query
  console.log('\n3. Different parameters (cache miss):');
  const result3 = await cachedQuery(
    () => mockQuery(2),
    'test_query_2',
    [2],
    5000
  );
  console.log('Result:', result3);
  
  // Check cache stats
  console.log('\n4. Cache statistics:');
  const stats = getCacheStats();
  console.log('Stats:', stats);
  
  console.log('\nCache test completed successfully!');
}

// Run the test
testCache().catch(console.error);