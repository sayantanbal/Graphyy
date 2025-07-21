// Core mathematical types
export interface Point2D {
  x: number;
  y: number;
}

export interface Point3D extends Point2D {
  z: number;
}

export interface ComplexNumber {
  real: number;
  imaginary: number;
}

// Function types
export type FunctionType = 
  | 'linear'
  | 'quadratic'
  | 'polynomial'
  | 'trigonometric'
  | 'logarithmic'
  | 'exponential'
  | 'parametric'
  | 'polar'
  | 'implicit'
  | 'piecewise'
  | 'recursive'
  | 'complex';

export interface FunctionExpression {
  id: string;
  expression: string;
  type: FunctionType;
  color: string;
  visible: boolean;
  domain?: {
    min: number;
    max: number;
  };
  range?: {
    min: number;
    max: number;
  };
  parameters?: Record<string, number>;
  style?: {
    strokeWidth: number;
    dashArray?: string;
    opacity: number;
  };
}

// Parametric function specific types
export interface ParametricFunction extends Omit<FunctionExpression, 'expression'> {
  xExpression: string;
  yExpression: string;
  parameter: string;
  parameterRange: {
    min: number;
    max: number;
    step: number;
  };
}

// Polar function specific types
export interface PolarFunction extends Omit<FunctionExpression, 'expression'> {
  rExpression: string;
  thetaRange: {
    min: number;
    max: number;
    step: number;
  };
}

// Graph viewport and settings
export interface GraphViewport {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
  xScale: number;
  yScale: number;
  zoom: number;
  centerX: number;
  centerY: number;
}

export interface GridSettings {
  showMajorGrid: boolean;
  showMinorGrid: boolean;
  majorGridSpacing: number;
  minorGridSpacing: number;
  majorGridColor: string;
  minorGridColor: string;
  majorGridOpacity: number;
  minorGridOpacity: number;
}

export interface AxisSettings {
  showXAxis: boolean;
  showYAxis: boolean;
  showXLabels: boolean;
  showYLabels: boolean;
  axisColor: string;
  labelColor: string;
  fontSize: number;
  tickLength: number;
}

// Data visualization types
export interface DataPoint {
  x: number;
  y: number;
  label?: string;
  color?: string;
  size?: number;
}

export interface DataSet {
  id: string;
  name: string;
  data: DataPoint[];
  type: 'scatter' | 'line' | 'bar' | 'histogram' | 'box';
  color: string;
  visible: boolean;
  style?: {
    pointSize: number;
    lineWidth: number;
    fillOpacity: number;
  };
}

// Statistical analysis types
export interface RegressionResult {
  type: 'linear' | 'polynomial' | 'exponential' | 'logarithmic';
  equation: string;
  rSquared: number;
  coefficients: number[];
  residuals: number[];
}

export interface StatisticalSummary {
  mean: number;
  median: number;
  mode: number[];
  standardDeviation: number;
  variance: number;
  min: number;
  max: number;
  quartiles: {
    q1: number;
    q2: number;
    q3: number;
  };
}

// Geometry types
export interface GeometricShape {
  id: string;
  type: 'point' | 'line' | 'circle' | 'polygon' | 'arc';
  points: Point2D[];
  style: {
    color: string;
    fillColor?: string;
    strokeWidth: number;
    opacity: number;
  };
  label?: string;
  constraints?: string[];
}

// Animation types
export interface AnimationState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  speed: number;
  loop: boolean;
  timeVariable: string;
}

// UI State types
export interface ThemeSettings {
  mode: 'light' | 'dark';
  primaryColor: string;
  backgroundColor: string;
  textColor: string;
  accentColor: string;
}

export interface AppSettings {
  theme: ThemeSettings;
  language: string;
  precision: number;
  animationFps: number;
  autoSave: boolean;
  shortcuts: Record<string, string>;
}

// Calculator state
export interface CalculatorState {
  functions: FunctionExpression[];
  datasets: DataSet[];
  geometricShapes: GeometricShape[];
  viewport: GraphViewport;
  gridSettings: GridSettings;
  axisSettings: AxisSettings;
  animationState: AnimationState;
  selectedTool: string;
  settings: AppSettings;
}

// Error handling
export interface MathError {
  type: 'syntax' | 'domain' | 'computation' | 'overflow';
  message: string;
  position?: number;
  suggestions?: string[];
}

// Export and sharing
export interface ExportOptions {
  format: 'png' | 'svg' | 'pdf' | 'html' | 'json';
  resolution: number;
  includeGrid: boolean;
  includeAxes: boolean;
  includeFunctions: string[];
  backgroundColor: string;
}

export interface ShareableLink {
  id: string;
  url: string;
  expiresAt?: Date;
  password?: string;
  allowEdit: boolean;
}

// Performance monitoring
export interface PerformanceMetrics {
  renderTime: number;
  computationTime: number;
  frameRate: number;
  memoryUsage: number;
  activeFunctions: number;
  activeDataPoints: number;
}
