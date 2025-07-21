import { FunctionType } from '@/types';

/**
 * Auto-detect the type of mathematical function based on the expression
 */
export function detectFunctionType(expression: string): FunctionType {
  if (!expression || !expression.trim()) {
    return 'polynomial';
  }

  // Clean the expression for analysis
  const cleanExpression = expression.toLowerCase().trim();

  // Check for trigonometric functions
  const trigFunctions = ['sin', 'cos', 'tan', 'sec', 'csc', 'cot', 'asin', 'acos', 'atan'];
  if (trigFunctions.some(func => cleanExpression.includes(func))) {
    return 'trigonometric';
  }

  // Check for logarithmic functions
  const logFunctions = ['log', 'ln', 'log10', 'log2'];
  if (logFunctions.some(func => cleanExpression.includes(func))) {
    return 'logarithmic';
  }

  // Check for exponential functions
  const expFunctions = ['exp', 'e^'];
  if (expFunctions.some(func => cleanExpression.includes(func)) || 
      /\b\d+\s*\^\s*x|\be\s*\^\s*x/.test(cleanExpression)) {
    return 'exponential';
  }

  // Check for parametric functions (contains both x and y expressions or uses parameter t)
  if (cleanExpression.includes('t') && 
      (cleanExpression.includes('x(t)') || cleanExpression.includes('y(t)') || 
       cleanExpression.includes('x=') || cleanExpression.includes('y='))) {
    return 'parametric';
  }

  // Check for polar functions (uses theta or r)
  if (cleanExpression.includes('theta') || cleanExpression.includes('θ') || 
      (cleanExpression.includes('r') && !cleanExpression.includes('sqrt'))) {
    return 'polar';
  }

  // Check for implicit functions (contains both x and y without explicit y= or f(x)=)
  if (cleanExpression.includes('x') && cleanExpression.includes('y') && 
      !cleanExpression.startsWith('y=') && !cleanExpression.startsWith('f(x)=')) {
    return 'implicit';
  }

  // Check for piecewise functions (contains conditional operators)
  if (cleanExpression.includes('{') || cleanExpression.includes('if') || 
      cleanExpression.includes('?') || cleanExpression.includes(':')) {
    return 'piecewise';
  }

  // Analyze polynomial degree
  const degree = getPolynomialDegree(cleanExpression);
  
  if (degree === 1) {
    return 'linear';
  } else if (degree === 2) {
    return 'quadratic';
  } else if (degree > 0) {
    return 'polynomial';
  }

  // Default to polynomial if no specific pattern is detected
  return 'polynomial';
}

/**
 * Determine the degree of a polynomial expression
 */
function getPolynomialDegree(expression: string): number {
  // Remove spaces and convert to lowercase
  const clean = expression.replace(/\s/g, '').toLowerCase();
  
  let maxDegree = 0;

  // Look for explicit power notation x^n
  const powerMatches = clean.match(/x\s*\^\s*(\d+)/g);
  if (powerMatches) {
    powerMatches.forEach(match => {
      const degreeMatch = match.match(/(\d+)/);
      if (degreeMatch) {
        const degree = parseInt(degreeMatch[1], 10);
        maxDegree = Math.max(maxDegree, degree);
      }
    });
  }

  // Look for repeated multiplication x*x*x...
  const multiplicationMatches = clean.match(/x(\*x)+/g);
  if (multiplicationMatches) {
    multiplicationMatches.forEach(match => {
      const xCount = (match.match(/x/g) || []).length;
      maxDegree = Math.max(maxDegree, xCount);
    });
  }

  // If x appears without explicit power, assume degree 1
  if (maxDegree === 0 && clean.includes('x')) {
    maxDegree = 1;
  }

  return maxDegree;
}

/**
 * Get function type description for UI display
 */
export function getFunctionTypeDescription(type: FunctionType): string {
  const descriptions: Record<FunctionType, string> = {
    linear: 'Linear function (degree 1)',
    quadratic: 'Quadratic function (degree 2)',
    polynomial: 'Polynomial function (degree 3+)',
    trigonometric: 'Trigonometric function',
    logarithmic: 'Logarithmic function',
    exponential: 'Exponential function',
    parametric: 'Parametric equations',
    polar: 'Polar coordinates',
    implicit: 'Implicit function',
    piecewise: 'Piecewise function',
    recursive: 'Recursive function',
    complex: 'Complex function',
  };

  return descriptions[type] || 'Unknown function type';
}

/**
 * Get examples for each function type
 */
export function getFunctionTypeExamples(type: FunctionType): string[] {
  const examples: Record<FunctionType, string[]> = {
    linear: ['2*x + 3', 'x - 5', '0.5*x'],
    quadratic: ['x^2 + 2*x + 1', 'x^2 - 4', '2*x^2 + 3*x - 1'],
    polynomial: ['x^3 - 2*x^2 + x - 1', 'x^4 + x^2', '2*x^5 - 3*x^3 + x'],
    trigonometric: ['sin(x)', 'cos(2*x) + sin(x)', 'tan(x/2)'],
    logarithmic: ['log(x)', 'ln(x) + 2', 'log10(x^2)'],
    exponential: ['exp(x)', '2^x', 'e^(-x^2)'],
    parametric: ['x(t) = cos(t), y(t) = sin(t)', 'x = t^2, y = t^3'],
    polar: ['r = 1 + cos(theta)', 'r = sin(3*theta)'],
    implicit: ['x^2 + y^2 = 25', 'x^2 - y^2 = 1'],
    piecewise: ['{x < 0: -x, x^2}', 'if(x > 0, x^2, -x)'],
    recursive: ['f(n) = f(n-1) + f(n-2)'],
    complex: ['z^2 + c', 'sin(z)'],
  };

  return examples[type] || [];
}
