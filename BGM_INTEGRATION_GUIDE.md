# BGM Visualization Component - Integration Guide

## Overview

The BGM (Bayesian Graphical Model) Visualization component displays analysis results for detecting correlated evolution between sites in protein-coding sequences. This guide covers proper integration, data format requirements, and troubleshooting.

## Quick Start

```javascript
import { BgmVisualization } from 'hyphy-scope';

// Basic usage
<BgmVisualization data={bgmResults} />
```

## Data Format Requirements

### Required Structure

The component expects BGM analysis results with this JSON structure:

```json
{
  "MLE": {
    "headers": [
      ["Site 1", "Index of site 1"],
      ["Site 2", "Index of site 2"],
      ["P [Site 1 -> Site 2]", "Probability that site 2 is conditionally dependent on site 1"],
      ["P [Site 2 -> Site 1]", "Probability that site 1 is conditionally dependent on site 2"],
      ["P [Site 1 <-> Site 2]", "Probability that sites 1 and 2 are not conditionally independent"],
      ["Site 1 subs", "Substitution counts inferred for Site 1"],
      ["Site 2 subs", "Substitution counts inferred for Site 2"],
      ["Shared subs", "Substitutions shared by both sites"]
    ],
    "content": [
      [1, 4, 0.3, 0.4, 0.7, 2, 3, 1],
      [2, 5, 0.2, 0.3, 0.6, 1, 2, 0],
      // ... more rows
    ]
  },
  "input": {
    "number of sequences": 10,
    "number of sites": 187
  },
  "data partitions": {
    "0": {
      "name": "partition.name",
      "coverage": [[1, 2, 3, 4, 5, ...]]
    }
  }
}
```

### Key Data Points

- **MLE.content**: Array of correlation results (required)
- **input**: Sequence and site counts (required for summary tiles)
- **data partitions**: Partition information (optional)

### MLE Content Array Format

Each row in `MLE.content` represents a site pair:

| Index | Field | Description | Example |
|-------|-------|-------------|---------|
| 0 | Site 1 | First site index | `1` |
| 1 | Site 2 | Second site index | `4` |
| 2 | P[Site 1 → Site 2] | Conditional dependency probability | `0.3` |
| 3 | P[Site 2 → Site 1] | Reverse conditional dependency | `0.4` |
| 4 | P[Site 1 ↔ Site 2] | **Bidirectional correlation** | `0.7` |
| 5 | Site 1 subs | Substitution count for site 1 | `2` |
| 6 | Site 2 subs | Substitution count for site 2 | `3` |
| 7 | Shared subs | Shared substitutions | `1` |

**Important**: Index 4 (bidirectional probability) is used for significance testing.

## Significance Threshold

The component uses **adaptive significance thresholds**:

- **Real data**: P > 0.5 (meaningful dependency)
- **Test data**: P > 0.005 (for small probability datasets)

### Threshold Logic
```javascript
const maxP = Math.max(...mleContent.map(row => row[4] || 0));
const significantThreshold = maxP > 0.1 ? 0.5 : 0.005;
```

## Integration Examples

### React/SvelteKit Integration

```javascript
import { BgmVisualization } from 'hyphy-scope';
import { useState, useEffect } from 'react';

function BGMAnalysisPage() {
  const [bgmData, setBgmData] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadBgmResults = async (analysisId) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/bgm-results/${analysisId}`);
      const data = await response.json();
      
      // Validate required structure
      if (!data.MLE || !data.MLE.content) {
        throw new Error('Invalid BGM data structure');
      }
      
      setBgmData(data);
    } catch (error) {
      console.error('Failed to load BGM results:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {loading ? (
        <div>Loading BGM analysis...</div>
      ) : bgmData ? (
        <BgmVisualization data={bgmData} />
      ) : (
        <div>No BGM data available</div>
      )}
    </div>
  );
}
```

### Direct Data Passing

```javascript
// From HyPhy analysis result
const hyPhyResult = await runBgmAnalysis(sequences, tree);

// Pass directly to component (no transformation needed)
<BgmVisualization data={hyPhyResult} />
```

## Common Issues & Solutions

### Issue: All Summary Tiles Show Zero

**Cause**: No correlations meet significance threshold

**Solutions**:
1. **Check data structure**:
   ```javascript
   console.log('MLE content:', data.MLE?.content);
   console.log('Max correlation:', Math.max(...data.MLE.content.map(row => row[4])));
   ```

2. **Verify threshold logic**:
   - Real data should have correlations > 0.5
   - Test data may have smaller values (< 0.05)

3. **Validate array format**:
   ```javascript
   // Each row should have 8 elements
   data.MLE.content.forEach((row, i) => {
     if (!Array.isArray(row) || row.length < 8) {
       console.error(`Invalid row ${i}:`, row);
     }
   });
   ```

### Issue: Component Not Updating

**Cause**: Reactivity not triggering

**Solutions**:
1. **Force re-render**:
   ```svelte
   {#key analysisId}
     <BgmVisualization data={bgmData} />
   {/key}
   ```

2. **Check data reference**:
   ```javascript
   // Create new object reference
   setBgmData({...newData});
   ```

### Issue: Missing Plot

**Cause**: No significant correlations for visualization

**Solutions**:
1. **Check correlation data**:
   ```javascript
   const significantRows = data.MLE.content.filter(row => row[4] > 0.5);
   console.log('Significant correlations:', significantRows.length);
   ```

2. **Lower threshold for testing**:
   ```javascript
   // Temporarily use lower threshold
   const significantRows = data.MLE.content.filter(row => row[4] > 0.01);
   ```

## Debug Mode

For development, you can enable detailed logging:

```javascript
// Add to component props or environment
const debugMode = process.env.NODE_ENV === 'development';

if (debugMode) {
  console.log('BGM Data Structure:', data);
  console.log('Correlation Summary:', {
    totalPairs: data.MLE.content.length,
    maxCorrelation: Math.max(...data.MLE.content.map(row => row[4])),
    significantCount: data.MLE.content.filter(row => row[4] > 0.5).length
  });
}
```

## Testing

### Unit Test Example

```javascript
import { render } from '@testing-library/svelte';
import BgmVisualization from './BgmVisualization.svelte';

const mockBgmData = {
  MLE: {
    content: [
      [1, 4, 0.3, 0.4, 0.7, 2, 3, 1],
      [2, 5, 0.2, 0.3, 0.6, 1, 2, 0]
    ]
  },
  input: {
    'number of sequences': 10,
    'number of sites': 17
  }
};

test('renders BGM visualization with data', () => {
  const { getByText } = render(BgmVisualization, {
    props: { data: mockBgmData }
  });
  
  expect(getByText('10')).toBeInTheDocument(); // sequences
  expect(getByText('17')).toBeInTheDocument(); // sites
  expect(getByText('2')).toBeInTheDocument();  // correlations
});
```

### Debug Page

Use the built-in debug page for testing:
- Navigate to `/bgm-debug` in development
- Test with sample data, real data, or custom JSON
- Compare manual calculations with component output

## Performance Considerations

### Large Datasets

For analyses with many site pairs (>1000):

```javascript
// Limit displayed correlations
const topCorrelations = data.MLE.content
  .sort((a, b) => (b[4] || 0) - (a[4] || 0))
  .slice(0, 50); // Show top 50

// Create subset for visualization
const optimizedData = {
  ...data,
  MLE: {
    ...data.MLE,
    content: topCorrelations
  }
};
```

### Memory Management

```javascript
// Clear large datasets when not needed
useEffect(() => {
  return () => {
    setBgmData(null); // Cleanup on unmount
  };
}, []);
```

## API Integration

### REST API Example

```javascript
// GET /api/bgm-analysis/{id}
{
  "status": "completed",
  "analysisId": "bgm_123456",
  "results": {
    // BGM data structure here
    "MLE": { ... },
    "input": { ... }
  }
}

// Error response
{
  "status": "error",
  "message": "Analysis failed",
  "code": "BGM_001"
}
```

### WebSocket Updates

```javascript
const ws = new WebSocket('/ws/bgm-analysis');

ws.onmessage = (event) => {
  const update = JSON.parse(event.data);
  
  if (update.type === 'analysis_complete') {
    setBgmData(update.results);
  }
};
```

## Troubleshooting Checklist

- [ ] Data has `MLE.content` array
- [ ] Each row has 8 elements minimum
- [ ] Index 4 contains correlation probabilities
- [ ] Input section has sequence/site counts
- [ ] At least one correlation > threshold
- [ ] Component receives new data reference
- [ ] No console errors in browser dev tools
- [ ] `/bgm-debug` page works with same data

## Support

For additional support:
- Check browser console for detailed error messages
- Use `/bgm-debug` page for isolated testing
- Verify data format against working examples
- Review component version compatibility

---

**Version**: hyphy-scope v1.3.6+  
**Last Updated**: January 2025