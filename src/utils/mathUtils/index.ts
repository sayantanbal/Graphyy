import { evaluate, parse, MathNode } from 'mathjs';
import { FunctionExpression, Point2D, MathError, ComplexNumber } from '@/types';

// Math constants and functions
export const MATH_CONSTANTS = {
  PI: Math.PI,
  E: Math.E,
  PHI: (1 + Math.sqrt(5)) / 2, // Golden ratio
  SQRT2: Math.SQRT2,
  SQRT3: Math.sqrt(3),
  LN2: Math.LN2,
  LN10: Math.LN10,
  LOG2E: Math.LOG2E,
  LOG10E: Math.LOG10E,
};

/**
 * Safely evaluate a mathematical expression
 */
export function safeEvaluate(
  expression: string, 
  variables: Record<string, number> = {}
): { result: number | null; error: MathError | null } {
  try {
    // Sanitize the expression
    const sanitized = sanitizeExpression(expression);
    console.log('Original:', expression, 'Sanitized:', sanitized); // Debug log
    
    // Use variables directly, mathjs has built-in constants
    const scope = { ...variables };
    
    // Parse and evaluate
    const node = parse(sanitized);
    const result = node.evaluate(scope);
    
    // Handle complex numbers
    if (typeof result === 'object' && 'im' in result) {
      return { result: result.re, error: null };
    }
    
    // Check for invalid results
    if (typeof result !== 'number' || !isFinite(result)) {
      return { 
        result: null, 
        error: { 
          type: 'computation', 
          message: 'Result is not a finite number',
          suggestions: ['Check for division by zero', 'Verify domain restrictions']
        } 
      };
    }
    
    return { result, error: null };
  } catch (error) {
    return {
      result: null,
      error: {
        type: 'syntax',
        message: error instanceof Error ? error.message : 'Unknown error',
        suggestions: ['Check syntax', 'Verify function names', 'Check parentheses']
      }
    };
  }
}

/**
 * Sanitize mathematical expression to prevent code injection
 */
export function sanitizeExpression(expression: string): string {
  // Remove dangerous patterns
  let sanitized = expression
    .replace(/['"`;]/g, '') // Remove quotes and semicolons
    .replace(/\b(eval|Function|require|import|export)\b/g, '') // Remove dangerous keywords
    .replace(/\.\./g, '') // Remove path traversal
    .replace(/\$\{.*?\}/g, ''); // Remove template literals
  
  // Replace common mathematical notation (keep ^ as is since mathjs supports it natively)
  sanitized = sanitized
    .replace(/×/g, '*') // Multiplication symbol
    .replace(/÷/g, '/') // Division symbol
    .replace(/π/g, 'pi') // Pi symbol (use lowercase 'pi' for mathjs)
    .replace(/√/g, 'sqrt') // Square root symbol
    .replace(/∞/g, 'Infinity') // Infinity symbol
    .replace(/±/g, '+') // Plus-minus (use plus for now)
    .replace(/≈/g, '=='); // Approximately equal
  
  return sanitized.trim();
}

/**
 * Evaluate a function at multiple points for plotting
 */
export function evaluateFunction(
  func: FunctionExpression,
  xRange: { min: number; max: number; step: number },
  additionalVariables: Record<string, number> = {}
): Point2D[] {
  const points: Point2D[] = [];
  const { min, max, step } = xRange;
  
  for (let x = min; x <= max; x += step) {
    const variables = { x, ...additionalVariables };
    const { result, error } = safeEvaluate(func.expression, variables);
    
    if (result !== null && isFinite(result)) {
      points.push({ x, y: result });
    }
    // Skip invalid points for continuous plotting
  }
  
  return points;
}

/**
 * Evaluate parametric function
 */
export function evaluateParametricFunction(
  xExpression: string,
  yExpression: string,
  parameter: string,
  paramRange: { min: number; max: number; step: number },
  additionalVariables: Record<string, number> = {}
): Point2D[] {
  const points: Point2D[] = [];
  const { min, max, step } = paramRange;
  
  for (let t = min; t <= max; t += step) {
    const variables = { [parameter]: t, ...additionalVariables };
    
    const xResult = safeEvaluate(xExpression, variables);
    const yResult = safeEvaluate(yExpression, variables);
    
    if (xResult.result !== null && yResult.result !== null &&
        isFinite(xResult.result) && isFinite(yResult.result)) {
      points.push({ x: xResult.result, y: yResult.result });
    }
  }
  
  return points;
}

/**
 * Evaluate polar function
 */
export function evaluatePolarFunction(
  rExpression: string,
  thetaRange: { min: number; max: number; step: number },
  additionalVariables: Record<string, number> = {}
): Point2D[] {
  const points: Point2D[] = [];
  const { min, max, step } = thetaRange;
  
  for (let theta = min; theta <= max; theta += step) {
    const variables = { theta, t: theta, ...additionalVariables };
    const { result: r, error } = safeEvaluate(rExpression, variables);
    
    if (r !== null && isFinite(r)) {
      const x = r * Math.cos(theta);
      const y = r * Math.sin(theta);
      
      if (isFinite(x) && isFinite(y)) {
        points.push({ x, y });
      }
    }
  }
  
  return points;
}

/**
 * Find derivative of a function at a point using numerical differentiation
 */
export function numericalDerivative(
  expression: string,
  x: number,
  h: number = 1e-8,
  additionalVariables: Record<string, number> = {}
): number | null {
  const variables = { ...additionalVariables };
  
  const f1 = safeEvaluate(expression, { ...variables, x: x + h });
  const f2 = safeEvaluate(expression, { ...variables, x: x - h });
  
  if (f1.result !== null && f2.result !== null) {
    return (f1.result - f2.result) / (2 * h);
  }
  
  return null;
}

/**
 * Find integral of a function using Simpson's rule
 */
export function numericalIntegral(
  expression: string,
  a: number,
  b: number,
  n: number = 1000,
  additionalVariables: Record<string, number> = {}
): number | null {
  if (n % 2 !== 0) n++; // Ensure even number of intervals
  
  const h = (b - a) / n;
  let sum = 0;
  
  const variables = { ...additionalVariables };
  
  // Evaluate at endpoints
  const fa = safeEvaluate(expression, { ...variables, x: a });
  const fb = safeEvaluate(expression, { ...variables, x: b });
  
  if (fa.result === null || fb.result === null) return null;
  
  sum += fa.result + fb.result;
  
  // Evaluate at odd points
  for (let i = 1; i < n; i += 2) {
    const x = a + i * h;
    const fx = safeEvaluate(expression, { ...variables, x });
    if (fx.result === null) return null;
    sum += 4 * fx.result;
  }
  
  // Evaluate at even points
  for (let i = 2; i < n; i += 2) {
    const x = a + i * h;
    const fx = safeEvaluate(expression, { ...variables, x });
    if (fx.result === null) return null;
    sum += 2 * fx.result;
  }
  
  return (h / 3) * sum;
}

/**
 * Find roots of a function using the Newton-Raphson method
 */
export function findRoots(
  expression: string,
  initialGuess: number,
  maxIterations: number = 100,
  tolerance: number = 1e-10,
  additionalVariables: Record<string, number> = {}
): number | null {
  let x = initialGuess;
  
  for (let i = 0; i < maxIterations; i++) {
    const fx = safeEvaluate(expression, { ...additionalVariables, x });
    const fpx = numericalDerivative(expression, x, 1e-8, additionalVariables);
    
    if (fx.result === null || fpx === null || Math.abs(fpx) < tolerance) {
      return null;
    }
    
    const newX = x - fx.result / fpx;
    
    if (Math.abs(newX - x) < tolerance) {
      return newX;
    }
    
    x = newX;
  }
  
  return null;
}

/**
 * Calculate distance between two points
 */
export function distance(p1: Point2D, p2: Point2D): number {
  return Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
}

/**
 * Check if a point is within a certain distance of a curve
 */
export function isPointNearCurve(
  point: Point2D,
  curvePoints: Point2D[],
  tolerance: number = 5
): boolean {
  return curvePoints.some(curvePoint => 
    distance(point, curvePoint) <= tolerance
  );
}

/**
 * Convert degrees to radians
 */
export function degToRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Convert radians to degrees
 */
export function radToDeg(radians: number): number {
  return radians * (180 / Math.PI);
}

/**
 * Format number for display
 */
export function formatNumber(
  num: number,
  precision: number = 6,
  scientific: boolean = false
): string {
  if (!isFinite(num)) return 'undefined';
  
  if (scientific || Math.abs(num) >= 1e6 || (Math.abs(num) < 1e-3 && num !== 0)) {
    return num.toExponential(precision);
  }
  
  // Remove trailing zeros
  const fixed = num.toFixed(precision);
  return parseFloat(fixed).toString();
}

/**
 * Check if two numbers are approximately equal
 */
export function approximately(a: number, b: number, tolerance: number = 1e-10): boolean {
  return Math.abs(a - b) < tolerance;
}

/**
 * Clamp a number between min and max values
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Linear interpolation between two values
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Map a value from one range to another
 */
export function mapRange(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number
): number {
  return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
}

/**
 * Complex number operations
 */
export class Complex {
  constructor(public real: number, public imaginary: number = 0) {}
  
  add(other: Complex): Complex {
    return new Complex(this.real + other.real, this.imaginary + other.imaginary);
  }
  
  subtract(other: Complex): Complex {
    return new Complex(this.real - other.real, this.imaginary - other.imaginary);
  }
  
  multiply(other: Complex): Complex {
    return new Complex(
      this.real * other.real - this.imaginary * other.imaginary,
      this.real * other.imaginary + this.imaginary * other.real
    );
  }
  
  divide(other: Complex): Complex {
    const denominator = other.real * other.real + other.imaginary * other.imaginary;
    return new Complex(
      (this.real * other.real + this.imaginary * other.imaginary) / denominator,
      (this.imaginary * other.real - this.real * other.imaginary) / denominator
    );
  }
  
  magnitude(): number {
    return Math.sqrt(this.real * this.real + this.imaginary * this.imaginary);
  }
  
  phase(): number {
    return Math.atan2(this.imaginary, this.real);
  }
  
  toString(): string {
    if (this.imaginary === 0) return this.real.toString();
    if (this.real === 0) return `${this.imaginary}i`;
    const sign = this.imaginary >= 0 ? '+' : '-';
    return `${this.real}${sign}${Math.abs(this.imaginary)}i`;
  }
}

// Export function type detection utilities
export * from './functionTypeDetector';
