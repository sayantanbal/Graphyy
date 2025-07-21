import { DataPoint, StatisticalSummary, RegressionResult } from '@/types';
import * as ss from 'simple-statistics';

/**
 * Calculate statistical summary for a dataset
 */
export function calculateStatistics(data: DataPoint[]): StatisticalSummary {
  const values = data.map(point => point.y);
  
  if (values.length === 0) {
    return {
      mean: 0,
      median: 0,
      mode: [],
      standardDeviation: 0,
      variance: 0,
      min: 0,
      max: 0,
      quartiles: { q1: 0, q2: 0, q3: 0 }
    };
  }
  
  const mean = ss.mean(values);
  const median = ss.median(values);
  const mode = ss.mode(values);
  const standardDeviation = ss.standardDeviation(values);
  const variance = ss.variance(values);
  const min = ss.min(values);
  const max = ss.max(values);
  
  // Calculate quartiles
  const sortedValues = values.slice().sort((a, b) => a - b);
  const q1 = ss.quantile(sortedValues, 0.25);
  const q2 = median;
  const q3 = ss.quantile(sortedValues, 0.75);
  
  return {
    mean,
    median,
    mode: Array.isArray(mode) ? mode : [mode],
    standardDeviation,
    variance,
    min,
    max,
    quartiles: { q1, q2, q3 }
  };
}

/**
 * Perform linear regression on data points
 */
export function linearRegression(data: DataPoint[]): RegressionResult {
  if (data.length < 2) {
    throw new Error('Need at least 2 data points for regression');
  }
  
  const points = data.map(point => [point.x, point.y]);
  const regression = ss.linearRegression(points);
  
  // Calculate R-squared manually
  const meanY = ss.mean(data.map(p => p.y));
  let totalSumSquares = 0;
  let residualSumSquares = 0;
  
  data.forEach(point => {
    const predicted = regression.m * point.x + regression.b;
    totalSumSquares += Math.pow(point.y - meanY, 2);
    residualSumSquares += Math.pow(point.y - predicted, 2);
  });
  
  const rSquared = 1 - (residualSumSquares / totalSumSquares);
  
  // Calculate residuals
  const residuals = data.map(point => {
    const predicted = regression.m * point.x + regression.b;
    return point.y - predicted;
  });
  
  const equation = `y = ${regression.m.toFixed(4)}x + ${regression.b.toFixed(4)}`;
  
  return {
    type: 'linear',
    equation,
    rSquared,
    coefficients: [regression.b, regression.m], // [intercept, slope]
    residuals
  };
}

/**
 * Perform polynomial regression
 */
export function polynomialRegression(data: DataPoint[], degree: number): RegressionResult {
  if (data.length < degree + 1) {
    throw new Error(`Need at least ${degree + 1} data points for degree ${degree} polynomial`);
  }
  
  // Simple implementation for quadratic regression (degree 2)
  if (degree === 2) {
    return quadraticRegression(data);
  }
  
  // For higher degrees, fall back to linear regression
  return linearRegression(data);
}

/**
 * Perform quadratic regression (y = ax^2 + bx + c)
 */
function quadraticRegression(data: DataPoint[]): RegressionResult {
  const n = data.length;
  if (n < 3) {
    throw new Error('Need at least 3 data points for quadratic regression');
  }
  
  // Set up normal equations for quadratic regression
  let sumX = 0, sumX2 = 0, sumX3 = 0, sumX4 = 0;
  let sumY = 0, sumXY = 0, sumX2Y = 0;
  
  data.forEach(point => {
    const x = point.x;
    const y = point.y;
    const x2 = x * x;
    const x3 = x2 * x;
    const x4 = x2 * x2;
    
    sumX += x;
    sumX2 += x2;
    sumX3 += x3;
    sumX4 += x4;
    sumY += y;
    sumXY += x * y;
    sumX2Y += x2 * y;
  });
  
  // Solve the system of equations using Cramer's rule
  const det = n * (sumX2 * sumX4 - sumX3 * sumX3) - 
              sumX * (sumX * sumX4 - sumX2 * sumX3) + 
              sumX2 * (sumX * sumX3 - sumX2 * sumX2);
  
  if (Math.abs(det) < 1e-10) {
    throw new Error('Cannot solve quadratic regression - singular matrix');
  }
  
  const c = (sumY * (sumX2 * sumX4 - sumX3 * sumX3) - 
             sumXY * (sumX * sumX4 - sumX2 * sumX3) + 
             sumX2Y * (sumX * sumX3 - sumX2 * sumX2)) / det;
  
  const b = (n * (sumXY * sumX4 - sumX2Y * sumX3) - 
             sumY * (sumX * sumX4 - sumX2 * sumX3) + 
             sumX2Y * (sumX * sumX2 - n * sumX3)) / det;
  
  const a = (n * (sumX2 * sumX2Y - sumX3 * sumXY) - 
             sumX * (sumX * sumX2Y - sumX2 * sumXY) + 
             sumY * (sumX * sumX3 - sumX2 * sumX2)) / det;
  
  // Calculate R-squared
  const meanY = ss.mean(data.map(p => p.y));
  let totalSumSquares = 0;
  let residualSumSquares = 0;
  
  data.forEach(point => {
    const predicted = a * point.x * point.x + b * point.x + c;
    totalSumSquares += Math.pow(point.y - meanY, 2);
    residualSumSquares += Math.pow(point.y - predicted, 2);
  });
  
  const rSquared = 1 - (residualSumSquares / totalSumSquares);
  
  // Calculate residuals
  const residuals = data.map(point => {
    const predicted = a * point.x * point.x + b * point.x + c;
    return point.y - predicted;
  });
  
  const equation = `y = ${a.toFixed(4)}x² + ${b.toFixed(4)}x + ${c.toFixed(4)}`;
  
  return {
    type: 'polynomial',
    equation,
    rSquared,
    coefficients: [c, b, a], // [constant, linear, quadratic]
    residuals
  };
}

/**
 * Perform exponential regression (y = a * e^(b*x))
 */
export function exponentialRegression(data: DataPoint[]): RegressionResult {
  // Filter out non-positive y values
  const validData = data.filter(point => point.y > 0);
  
  if (validData.length < 2) {
    throw new Error('Need at least 2 data points with positive y values for exponential regression');
  }
  
  // Transform to linear: ln(y) = ln(a) + b*x
  const transformedPoints = validData.map(point => [point.x, Math.log(point.y)]);
  const linearReg = ss.linearRegression(transformedPoints);
  
  const a = Math.exp(linearReg.b);
  const b = linearReg.m;
  
  // Calculate R-squared for original data
  const meanY = ss.mean(validData.map(p => p.y));
  let totalSumSquares = 0;
  let residualSumSquares = 0;
  
  validData.forEach(point => {
    const predicted = a * Math.exp(b * point.x);
    totalSumSquares += Math.pow(point.y - meanY, 2);
    residualSumSquares += Math.pow(point.y - predicted, 2);
  });
  
  const rSquared = 1 - (residualSumSquares / totalSumSquares);
  
  // Calculate residuals
  const residuals = data.map(point => {
    if (point.y <= 0) return 0; // Cannot predict for non-positive values
    const predicted = a * Math.exp(b * point.x);
    return point.y - predicted;
  });
  
  const equation = `y = ${a.toFixed(4)} * e^(${b.toFixed(4)}x)`;
  
  return {
    type: 'exponential',
    equation,
    rSquared,
    coefficients: [a, b],
    residuals
  };
}

/**
 * Perform logarithmic regression (y = a + b * ln(x))
 */
export function logarithmicRegression(data: DataPoint[]): RegressionResult {
  // Filter out non-positive x values
  const validData = data.filter(point => point.x > 0);
  
  if (validData.length < 2) {
    throw new Error('Need at least 2 data points with positive x values for logarithmic regression');
  }
  
  // Transform: y = a + b * ln(x)
  const transformedPoints = validData.map(point => [Math.log(point.x), point.y]);
  const linearReg = ss.linearRegression(transformedPoints);
  
  const a = linearReg.b; // intercept
  const b = linearReg.m; // slope
  
  // Calculate R-squared
  const meanY = ss.mean(validData.map(p => p.y));
  let totalSumSquares = 0;
  let residualSumSquares = 0;
  
  validData.forEach(point => {
    const predicted = a + b * Math.log(point.x);
    totalSumSquares += Math.pow(point.y - meanY, 2);
    residualSumSquares += Math.pow(point.y - predicted, 2);
  });
  
  const rSquared = 1 - (residualSumSquares / totalSumSquares);
  
  // Calculate residuals
  const residuals = data.map(point => {
    if (point.x <= 0) return 0; // Cannot predict for non-positive values
    const predicted = a + b * Math.log(point.x);
    return point.y - predicted;
  });
  
  const equation = `y = ${a.toFixed(4)} + ${b.toFixed(4)} * ln(x)`;
  
  return {
    type: 'logarithmic',
    equation,
    rSquared,
    coefficients: [a, b],
    residuals
  };
}

/**
 * Detect outliers using the IQR method
 */
export function detectOutliers(data: DataPoint[]): DataPoint[] {
  const values = data.map(point => point.y);
  const q1 = ss.quantile(values, 0.25);
  const q3 = ss.quantile(values, 0.75);
  const iqr = q3 - q1;
  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;
  
  return data.filter(point => point.y < lowerBound || point.y > upperBound);
}

/**
 * Smooth data using moving average
 */
export function smoothData(data: DataPoint[], windowSize: number): DataPoint[] {
  if (windowSize <= 1 || windowSize >= data.length) return data;
  
  const smoothed: DataPoint[] = [];
  const halfWindow = Math.floor(windowSize / 2);
  
  for (let i = 0; i < data.length; i++) {
    const start = Math.max(0, i - halfWindow);
    const end = Math.min(data.length - 1, i + halfWindow);
    
    let sum = 0;
    let count = 0;
    
    for (let j = start; j <= end; j++) {
      sum += data[j].y;
      count++;
    }
    
    smoothed.push({
      x: data[i].x,
      y: sum / count,
      label: data[i].label,
      color: data[i].color,
      size: data[i].size
    });
  }
  
  return smoothed;
}

/**
 * Calculate correlation coefficient between two datasets
 */
export function calculateCorrelation(data1: DataPoint[], data2: DataPoint[]): number {
  const minLength = Math.min(data1.length, data2.length);
  if (minLength < 2) return 0;
  
  const values1 = data1.slice(0, minLength).map(p => p.y);
  const values2 = data2.slice(0, minLength).map(p => p.y);
  
  return ss.sampleCorrelation(values1, values2);
}

/**
 * Generate data points for normal distribution
 */
export function generateNormalDistribution(
  mean: number, 
  stdDev: number, 
  numPoints: number = 100,
  range: { min: number; max: number } = { min: mean - 4 * stdDev, max: mean + 4 * stdDev }
): DataPoint[] {
  const points: DataPoint[] = [];
  const step = (range.max - range.min) / (numPoints - 1);
  
  for (let i = 0; i < numPoints; i++) {
    const x = range.min + i * step;
    const y = (1 / (stdDev * Math.sqrt(2 * Math.PI))) * 
              Math.exp(-0.5 * Math.pow((x - mean) / stdDev, 2));
    
    points.push({ x, y });
  }
  
  return points;
}

/**
 * Parse CSV data into DataPoint array
 */
export function parseCSVData(csvText: string): DataPoint[] {
  const lines = csvText.trim().split('\n');
  const points: DataPoint[] = [];
  
  lines.forEach((line, index) => {
    if (index === 0) return; // Skip header
    
    const values = line.split(',').map(v => v.trim());
    if (values.length >= 2) {
      const x = parseFloat(values[0]);
      const y = parseFloat(values[1]);
      
      if (!isNaN(x) && !isNaN(y)) {
        points.push({
          x,
          y,
          label: values[2] || undefined,
        });
      }
    }
  });
  
  return points;
}

/**
 * Export data to CSV format
 */
export function exportToCSV(data: DataPoint[]): string {
  const header = 'x,y,label\n';
  const rows = data.map(point => 
    `${point.x},${point.y},${point.label || ''}`
  ).join('\n');
  
  return header + rows;
}
