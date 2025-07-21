import { Point2D, GraphViewport, GridSettings, AxisSettings } from '@/types';

/**
 * Convert screen coordinates to graph coordinates
 */
export function screenToGraph(
  screenX: number,
  screenY: number,
  viewport: GraphViewport,
  canvasWidth: number,
  canvasHeight: number
): Point2D {
  const graphX = viewport.xMin + (screenX / canvasWidth) * (viewport.xMax - viewport.xMin);
  const graphY = viewport.yMax - (screenY / canvasHeight) * (viewport.yMax - viewport.yMin);
  
  return { x: graphX, y: graphY };
}

/**
 * Convert graph coordinates to screen coordinates
 */
export function graphToScreen(
  graphX: number,
  graphY: number,
  viewport: GraphViewport,
  canvasWidth: number,
  canvasHeight: number
): Point2D {
  const screenX = ((graphX - viewport.xMin) / (viewport.xMax - viewport.xMin)) * canvasWidth;
  const screenY = ((viewport.yMax - graphY) / (viewport.yMax - viewport.yMin)) * canvasHeight;
  
  return { x: screenX, y: screenY };
}

/**
 * Check if a point is visible within the viewport
 */
export function isPointVisible(point: Point2D, viewport: GraphViewport): boolean {
  return point.x >= viewport.xMin && 
         point.x <= viewport.xMax && 
         point.y >= viewport.yMin && 
         point.y <= viewport.yMax;
}

/**
 * Calculate optimal tick spacing for axes
 */
export function calculateTickSpacing(range: number, maxTicks: number = 10): number {
  const roughSpacing = range / maxTicks;
  const magnitude = Math.pow(10, Math.floor(Math.log10(roughSpacing)));
  const normalized = roughSpacing / magnitude;
  
  let spacing;
  if (normalized <= 1) spacing = 1;
  else if (normalized <= 2) spacing = 2;
  else if (normalized <= 5) spacing = 5;
  else spacing = 10;
  
  return spacing * magnitude;
}

/**
 * Generate tick marks for an axis
 */
export function generateTicks(
  min: number,
  max: number,
  spacing: number
): number[] {
  const ticks: number[] = [];
  const start = Math.ceil(min / spacing) * spacing;
  
  for (let tick = start; tick <= max; tick += spacing) {
    // Handle floating point precision issues
    const roundedTick = Math.round(tick / spacing) * spacing;
    ticks.push(roundedTick);
  }
  
  return ticks;
}

/**
 * Draw grid lines on canvas
 */
export function drawGrid(
  ctx: CanvasRenderingContext2D,
  viewport: GraphViewport,
  gridSettings: GridSettings,
  canvasWidth: number,
  canvasHeight: number
): void {
  if (!gridSettings.showMajorGrid && !gridSettings.showMinorGrid) return;
  
  ctx.save();
  
  // Draw minor grid
  if (gridSettings.showMinorGrid) {
    ctx.strokeStyle = gridSettings.minorGridColor;
    ctx.globalAlpha = gridSettings.minorGridOpacity;
    ctx.lineWidth = 0.5;
    
    drawGridLines(ctx, viewport, gridSettings.minorGridSpacing, canvasWidth, canvasHeight);
  }
  
  // Draw major grid
  if (gridSettings.showMajorGrid) {
    ctx.strokeStyle = gridSettings.majorGridColor;
    ctx.globalAlpha = gridSettings.majorGridOpacity;
    ctx.lineWidth = 1;
    
    drawGridLines(ctx, viewport, gridSettings.majorGridSpacing, canvasWidth, canvasHeight);
  }
  
  ctx.restore();
}

/**
 * Helper function to draw grid lines
 */
function drawGridLines(
  ctx: CanvasRenderingContext2D,
  viewport: GraphViewport,
  spacing: number,
  canvasWidth: number,
  canvasHeight: number
): void {
  ctx.beginPath();
  
  // Vertical lines
  const xTicks = generateTicks(viewport.xMin, viewport.xMax, spacing);
  xTicks.forEach(x => {
    const screenPos = graphToScreen(x, 0, viewport, canvasWidth, canvasHeight);
    ctx.moveTo(screenPos.x, 0);
    ctx.lineTo(screenPos.x, canvasHeight);
  });
  
  // Horizontal lines
  const yTicks = generateTicks(viewport.yMin, viewport.yMax, spacing);
  yTicks.forEach(y => {
    const screenPos = graphToScreen(0, y, viewport, canvasWidth, canvasHeight);
    ctx.moveTo(0, screenPos.y);
    ctx.lineTo(canvasWidth, screenPos.y);
  });
  
  ctx.stroke();
}

/**
 * Draw coordinate axes
 */
export function drawAxes(
  ctx: CanvasRenderingContext2D,
  viewport: GraphViewport,
  axisSettings: AxisSettings,
  canvasWidth: number,
  canvasHeight: number
): void {
  ctx.save();
  ctx.strokeStyle = axisSettings.axisColor;
  ctx.lineWidth = 2;
  
  // Draw X-axis
  if (axisSettings.showXAxis) {
    const yAxisScreen = graphToScreen(0, 0, viewport, canvasWidth, canvasHeight);
    if (yAxisScreen.y >= 0 && yAxisScreen.y <= canvasHeight) {
      ctx.beginPath();
      ctx.moveTo(0, yAxisScreen.y);
      ctx.lineTo(canvasWidth, yAxisScreen.y);
      ctx.stroke();
      
      // Draw X-axis labels
      if (axisSettings.showXLabels) {
        drawXAxisLabels(ctx, viewport, axisSettings, canvasWidth, canvasHeight);
      }
    }
  }
  
  // Draw Y-axis
  if (axisSettings.showYAxis) {
    const xAxisScreen = graphToScreen(0, 0, viewport, canvasWidth, canvasHeight);
    if (xAxisScreen.x >= 0 && xAxisScreen.x <= canvasWidth) {
      ctx.beginPath();
      ctx.moveTo(xAxisScreen.x, 0);
      ctx.lineTo(xAxisScreen.x, canvasHeight);
      ctx.stroke();
      
      // Draw Y-axis labels
      if (axisSettings.showYLabels) {
        drawYAxisLabels(ctx, viewport, axisSettings, canvasWidth, canvasHeight);
      }
    }
  }
  
  ctx.restore();
}

/**
 * Draw X-axis labels
 */
function drawXAxisLabels(
  ctx: CanvasRenderingContext2D,
  viewport: GraphViewport,
  axisSettings: AxisSettings,
  canvasWidth: number,
  canvasHeight: number
): void {
  ctx.fillStyle = axisSettings.labelColor;
  ctx.font = `${axisSettings.fontSize}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  
  const spacing = calculateTickSpacing(viewport.xMax - viewport.xMin);
  const ticks = generateTicks(viewport.xMin, viewport.xMax, spacing);
  const yAxisScreen = graphToScreen(0, 0, viewport, canvasWidth, canvasHeight);
  
  ticks.forEach(x => {
    if (Math.abs(x) < 1e-10) return; // Skip zero
    
    const screenPos = graphToScreen(x, 0, viewport, canvasWidth, canvasHeight);
    const labelY = Math.min(yAxisScreen.y + axisSettings.tickLength + 5, canvasHeight - 20);
    
    // Draw tick mark
    ctx.beginPath();
    ctx.moveTo(screenPos.x, yAxisScreen.y - axisSettings.tickLength);
    ctx.lineTo(screenPos.x, yAxisScreen.y + axisSettings.tickLength);
    ctx.stroke();
    
    // Draw label
    const label = formatAxisLabel(x);
    ctx.fillText(label, screenPos.x, labelY);
  });
}

/**
 * Draw Y-axis labels
 */
function drawYAxisLabels(
  ctx: CanvasRenderingContext2D,
  viewport: GraphViewport,
  axisSettings: AxisSettings,
  canvasWidth: number,
  canvasHeight: number
): void {
  ctx.fillStyle = axisSettings.labelColor;
  ctx.font = `${axisSettings.fontSize}px sans-serif`;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  
  const spacing = calculateTickSpacing(viewport.yMax - viewport.yMin);
  const ticks = generateTicks(viewport.yMin, viewport.yMax, spacing);
  const xAxisScreen = graphToScreen(0, 0, viewport, canvasWidth, canvasHeight);
  
  ticks.forEach(y => {
    if (Math.abs(y) < 1e-10) return; // Skip zero
    
    const screenPos = graphToScreen(0, y, viewport, canvasWidth, canvasHeight);
    const labelX = Math.max(xAxisScreen.x - axisSettings.tickLength - 5, 5);
    
    // Draw tick mark
    ctx.beginPath();
    ctx.moveTo(xAxisScreen.x - axisSettings.tickLength, screenPos.y);
    ctx.lineTo(xAxisScreen.x + axisSettings.tickLength, screenPos.y);
    ctx.stroke();
    
    // Draw label
    const label = formatAxisLabel(y);
    ctx.fillText(label, labelX, screenPos.y);
  });
}

/**
 * Format axis label for display
 */
function formatAxisLabel(value: number): string {
  if (Math.abs(value) < 1e-10) return '0';
  
  // Use scientific notation for very large or very small numbers
  if (Math.abs(value) >= 1e6 || (Math.abs(value) < 1e-3 && value !== 0)) {
    return value.toExponential(1);
  }
  
  // Remove trailing zeros and unnecessary decimal points
  const fixed = value.toFixed(6);
  const trimmed = parseFloat(fixed).toString();
  
  return trimmed;
}

/**
 * Draw function curve
 */
export function drawFunctionCurve(
  ctx: CanvasRenderingContext2D,
  points: Point2D[],
  viewport: GraphViewport,
  canvasWidth: number,
  canvasHeight: number,
  style: {
    color: string;
    strokeWidth: number;
    dashArray?: string;
    opacity: number;
  }
): void {
  if (points.length === 0) return;
  
  ctx.save();
  ctx.strokeStyle = style.color;
  ctx.lineWidth = style.strokeWidth;
  ctx.globalAlpha = style.opacity;
  
  if (style.dashArray) {
    const dashValues = style.dashArray.split(',').map(Number);
    ctx.setLineDash(dashValues);
  }
  
  ctx.beginPath();
  
  let firstPoint = true;
  let lastScreenPoint: Point2D | null = null;
  
  for (let i = 0; i < points.length; i++) {
    const point = points[i];
    const screenPoint = graphToScreen(point.x, point.y, viewport, canvasWidth, canvasHeight);
    
    // Check for discontinuities (large jumps in y-value)
    if (lastScreenPoint && Math.abs(screenPoint.y - lastScreenPoint.y) > canvasHeight / 2) {
      firstPoint = true;
    }
    
    if (firstPoint) {
      ctx.moveTo(screenPoint.x, screenPoint.y);
      firstPoint = false;
    } else {
      ctx.lineTo(screenPoint.x, screenPoint.y);
    }
    
    lastScreenPoint = screenPoint;
  }
  
  ctx.stroke();
  ctx.restore();
}

/**
 * Draw data points (scatter plot)
 */
export function drawDataPoints(
  ctx: CanvasRenderingContext2D,
  points: Point2D[],
  viewport: GraphViewport,
  canvasWidth: number,
  canvasHeight: number,
  style: {
    color: string;
    size: number;
    opacity: number;
  }
): void {
  if (points.length === 0) return;
  
  ctx.save();
  ctx.fillStyle = style.color;
  ctx.globalAlpha = style.opacity;
  
  points.forEach(point => {
    if (isPointVisible(point, viewport)) {
      const screenPoint = graphToScreen(point.x, point.y, viewport, canvasWidth, canvasHeight);
      
      ctx.beginPath();
      ctx.arc(screenPoint.x, screenPoint.y, style.size, 0, 2 * Math.PI);
      ctx.fill();
    }
  });
  
  ctx.restore();
}

/**
 * Calculate bounds of a set of points
 */
export function calculateBounds(points: Point2D[]): {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
} {
  if (points.length === 0) {
    return { minX: -10, maxX: 10, minY: -10, maxY: 10 };
  }
  
  let minX = points[0].x;
  let maxX = points[0].x;
  let minY = points[0].y;
  let maxY = points[0].y;
  
  points.forEach(point => {
    minX = Math.min(minX, point.x);
    maxX = Math.max(maxX, point.x);
    minY = Math.min(minY, point.y);
    maxY = Math.max(maxY, point.y);
  });
  
  return { minX, maxX, minY, maxY };
}

/**
 * Create optimal viewport for a set of points
 */
export function createOptimalViewport(
  points: Point2D[],
  padding: number = 0.1
): GraphViewport {
  const bounds = calculateBounds(points);
  
  const xRange = bounds.maxX - bounds.minX;
  const yRange = bounds.maxY - bounds.minY;
  
  const xPadding = xRange * padding;
  const yPadding = yRange * padding;
  
  return {
    xMin: bounds.minX - xPadding,
    xMax: bounds.maxX + xPadding,
    yMin: bounds.minY - yPadding,
    yMax: bounds.maxY + yPadding,
    xScale: 1,
    yScale: 1,
    zoom: 1,
    centerX: (bounds.minX + bounds.maxX) / 2,
    centerY: (bounds.minY + bounds.maxY) / 2,
  };
}

/**
 * Smooth curve using cubic interpolation
 */
export function smoothCurve(points: Point2D[], smoothing: number = 0.3): Point2D[] {
  if (points.length < 3) return points;
  
  const smoothed: Point2D[] = [];
  
  for (let i = 0; i < points.length; i++) {
    if (i === 0 || i === points.length - 1) {
      smoothed.push(points[i]);
    } else {
      const prev = points[i - 1];
      const curr = points[i];
      const next = points[i + 1];
      
      const x = curr.x + smoothing * (prev.x + next.x - 2 * curr.x);
      const y = curr.y + smoothing * (prev.y + next.y - 2 * curr.y);
      
      smoothed.push({ x, y });
    }
  }
  
  return smoothed;
}

/**
 * Reduce points using Douglas-Peucker algorithm for performance
 */
export function simplifyPoints(points: Point2D[], tolerance: number = 1): Point2D[] {
  if (points.length <= 2) return points;
  
  return douglasPeucker(points, tolerance);
}

function douglasPeucker(points: Point2D[], tolerance: number): Point2D[] {
  if (points.length <= 2) return points;
  
  // Find the point with maximum distance from the line between first and last
  let maxDistance = 0;
  let maxIndex = 0;
  const first = points[0];
  const last = points[points.length - 1];
  
  for (let i = 1; i < points.length - 1; i++) {
    const distance = distanceToLine(points[i], first, last);
    if (distance > maxDistance) {
      maxDistance = distance;
      maxIndex = i;
    }
  }
  
  // If max distance is greater than tolerance, recursively simplify
  if (maxDistance > tolerance) {
    const left = douglasPeucker(points.slice(0, maxIndex + 1), tolerance);
    const right = douglasPeucker(points.slice(maxIndex), tolerance);
    
    // Combine results, removing duplicate point
    return left.slice(0, -1).concat(right);
  } else {
    return [first, last];
  }
}

function distanceToLine(point: Point2D, lineStart: Point2D, lineEnd: Point2D): number {
  const A = lineEnd.x - lineStart.x;
  const B = lineEnd.y - lineStart.y;
  const C = lineStart.x - point.x;
  const D = lineStart.y - point.y;
  
  const dot = A * C + B * D;
  const lenSq = A * A + B * B;
  
  if (lenSq === 0) return Math.sqrt(C * C + D * D);
  
  const param = -dot / lenSq;
  
  let xx: number, yy: number;
  
  if (param < 0) {
    xx = lineStart.x;
    yy = lineStart.y;
  } else if (param > 1) {
    xx = lineEnd.x;
    yy = lineEnd.y;
  } else {
    xx = lineStart.x + param * A;
    yy = lineStart.y + param * B;
  }
  
  const dx = point.x - xx;
  const dy = point.y - yy;
  
  return Math.sqrt(dx * dx + dy * dy);
}
