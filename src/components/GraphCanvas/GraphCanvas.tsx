import React, { useRef, useEffect, useCallback, useMemo, useState } from 'react';
import { useCalculatorStore } from '@/contexts/CalculatorStore';
import { 
  drawGrid, 
  drawAxes, 
  drawFunctionCurve, 
  drawDataPoints,
  screenToGraph, 
  graphToScreen,
  isPointVisible
} from '@/utils/graphUtils';
import { 
  evaluateFunction, 
  evaluateParametricFunction, 
  evaluatePolarFunction 
} from '@/utils/mathUtils';
import { Point2D, GraphViewport } from '@/types';

interface GraphCanvasProps {
  width?: number;
  height?: number;
  className?: string;
}

export const GraphCanvas: React.FC<GraphCanvasProps> = ({ 
  width, 
  height, 
  className = '' 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [lastMousePos, setLastMousePos] = useState<Point2D | null>(null);
  
  // Responsive canvas dimensions
  const [canvasSize, setCanvasSize] = useState({ 
    width: 600, 
    height: 400 
  });

  // Update canvas size based on container
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const container = containerRef.current;
        const rect = container.getBoundingClientRect();
        const newWidth = Math.floor(rect.width) || 600;
        const newHeight = Math.floor(rect.height) || 400;
        
        // Only update if size actually changed
        setCanvasSize(prev => {
          if (prev.width !== newWidth || prev.height !== newHeight) {
            return { width: newWidth, height: newHeight };
          }
          return prev;
        });
      }
    };

    // Initial size update
    setTimeout(updateSize, 0);
    
    window.addEventListener('resize', updateSize);
    
    // Also update when the container size changes
    const resizeObserver = new ResizeObserver(updateSize);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    
    return () => {
      window.removeEventListener('resize', updateSize);
      resizeObserver.disconnect();
    };
  }, [width, height]);
  
  // Store selectors
  const functions = useCalculatorStore(state => state.functions);
  const datasets = useCalculatorStore(state => state.datasets);
  const viewport = useCalculatorStore(state => state.viewport);
  const gridSettings = useCalculatorStore(state => state.gridSettings);
  const axisSettings = useCalculatorStore(state => state.axisSettings);
  const animationState = useCalculatorStore(state => state.animationState);
  const theme = useCalculatorStore(state => state.settings.theme);
  
  // Store actions
  const setViewport = useCalculatorStore(state => state.setViewport);
  const zoomIn = useCalculatorStore(state => state.zoomIn);
  const panTo = useCalculatorStore(state => state.panTo);
  
  // Calculate function points with memoization for performance
  const functionPoints = useMemo(() => {
    const stepSize = (viewport.xMax - viewport.xMin) / (canvasSize.width * 2); // Higher resolution
    const animationVars = animationState.isPlaying ? 
      { [animationState.timeVariable]: animationState.currentTime } : {};
    
    return functions
      .filter(func => func.visible)
      .map(func => {
        let points: Point2D[] = [];
        
        switch (func.type) {
          case 'parametric': {
            // Handle parametric functions (assuming we have xExpression and yExpression)
            const parametric = func as any; // Type assertion for now
            if (parametric.xExpression && parametric.yExpression) {
              points = evaluateParametricFunction(
                parametric.xExpression,
                parametric.yExpression,
                parametric.parameter || 't',
                parametric.parameterRange || { min: -10, max: 10, step: stepSize },
                animationVars
              );
            }
            break;
          }
          case 'polar': {
            // Handle polar functions
            const polar = func as any; // Type assertion for now
            if (polar.rExpression) {
              points = evaluatePolarFunction(
                polar.rExpression,
                polar.thetaRange || { min: 0, max: 2 * Math.PI, step: stepSize },
                animationVars
              );
            }
            break;
          }
          default: {
            // Handle regular functions
            points = evaluateFunction(
              func,
              { min: viewport.xMin, max: viewport.xMax, step: stepSize },
              animationVars
            );
            break;
          }
        }
        
        return { function: func, points };
      });
  }, [functions, viewport, canvasSize, animationState]);
  
  // Draw everything on the canvas
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas size
    canvas.width = canvasSize.width;
    canvas.height = canvasSize.height;
    
    // Clear canvas with background color
    ctx.fillStyle = theme.backgroundColor;
    ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);
    
    // Draw grid
    drawGrid(ctx, viewport, gridSettings, canvasSize.width, canvasSize.height);
    
    // Draw axes
    drawAxes(ctx, viewport, axisSettings, canvasSize.width, canvasSize.height);
    
    // Draw functions
    functionPoints.forEach(({ function: func, points }) => {
      if (points.length > 0) {
        drawFunctionCurve(ctx, points, viewport, canvasSize.width, canvasSize.height, {
          color: func.color,
          strokeWidth: func.style?.strokeWidth || 2,
          dashArray: func.style?.dashArray,
          opacity: func.style?.opacity || 1,
        });
      }
    });
    
    // Draw datasets
    datasets
      .filter(dataset => dataset.visible)
      .forEach(dataset => {
        switch (dataset.type) {
          case 'scatter':
          case 'line': {
            if (dataset.type === 'line') {
              // Draw line connecting points
              drawFunctionCurve(ctx, dataset.data, viewport, canvasSize.width, canvasSize.height, {
                color: dataset.color,
                strokeWidth: dataset.style?.lineWidth || 2,
                opacity: dataset.style?.fillOpacity || 1,
              });
            } else {
              // Draw scatter points
              drawDataPoints(ctx, dataset.data, viewport, canvasSize.width, canvasSize.height, {
                color: dataset.color,
                size: dataset.style?.pointSize || 3,
                opacity: dataset.style?.fillOpacity || 1,
              });
            }
            break;
          }
          case 'bar': {
            // Draw bar chart
            drawBarChart(ctx, dataset.data, viewport, canvasSize.width, canvasSize.height, dataset.color);
            break;
          }
          // Add more dataset types as needed
        }
      });
    
  }, [
    canvasSize.width, 
    canvasSize.height, 
    viewport, 
    gridSettings, 
    axisSettings, 
    theme, 
    functionPoints, 
    datasets
  ]);
  
  // Animation loop
  useEffect(() => {
    const animate = () => {
      draw();
      if (animationState.isPlaying) {
        animationFrameRef.current = requestAnimationFrame(animate);
      }
    };
    
    if (animationState.isPlaying) {
      animationFrameRef.current = requestAnimationFrame(animate);
    } else {
      draw();
    }
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [draw, animationState.isPlaying]);
  
  // Event handlers for mouse interactions
  const handleWheel = useCallback((event: React.WheelEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    const graphPoint = screenToGraph(mouseX, mouseY, viewport, canvasSize.width, canvasSize.height);
    
    // Zoom towards mouse position
    const zoomFactor = event.deltaY > 0 ? 1.1 : 0.9;
    const newWidth = (viewport.xMax - viewport.xMin) * zoomFactor;
    const newHeight = (viewport.yMax - viewport.yMin) * zoomFactor;
    
    const newXMin = graphPoint.x - (mouseX / canvasSize.width) * newWidth;
    const newXMax = newXMin + newWidth;
    const newYMax = graphPoint.y + ((canvasSize.height - mouseY) / canvasSize.height) * newHeight;
    const newYMin = newYMax - newHeight;
    
    setViewport({
      xMin: newXMin,
      xMax: newXMax,
      yMin: newYMin,
      yMax: newYMax,
      zoom: viewport.zoom * (1 / zoomFactor),
    });
  }, [viewport, canvasSize, setViewport]);
  
  const handleMouseDown = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    setLastMousePos({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    });
    setIsDragging(true);
  }, []);
  
  const handleMouseMove = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !lastMousePos) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const currentMousePos = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
    
    const deltaX = currentMousePos.x - lastMousePos.x;
    const deltaY = currentMousePos.y - lastMousePos.y;
    
    const xDelta = (deltaX / canvasSize.width) * (viewport.xMax - viewport.xMin);
    const yDelta = (deltaY / canvasSize.height) * (viewport.yMax - viewport.yMin);
    
    setViewport({
      xMin: viewport.xMin - xDelta,
      xMax: viewport.xMax - xDelta,
      yMin: viewport.yMin + yDelta,
      yMax: viewport.yMax + yDelta,
      centerX: viewport.centerX - xDelta,
      centerY: viewport.centerY + yDelta,
    });
    
    setLastMousePos(currentMousePos);
  }, [isDragging, lastMousePos, viewport, canvasSize, setViewport]);
  
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setLastMousePos(null);
  }, []);
  
  const handleDoubleClick = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    const graphPoint = screenToGraph(mouseX, mouseY, viewport, canvasSize.width, canvasSize.height);
    
    // Center on double-click point and zoom in
    panTo(graphPoint.x, graphPoint.y);
    zoomIn(1.5);
  }, [viewport, canvasSize, panTo, zoomIn]);
  
  // Helper function to draw bar chart
  const drawBarChart = useCallback((
    ctx: CanvasRenderingContext2D,
    data: Point2D[],
    viewport: GraphViewport,
    width: number,
    height: number,
    color: string
  ) => {
    if (data.length === 0) return;
    
    ctx.save();
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.7;
    
    const barWidth = (viewport.xMax - viewport.xMin) / data.length * 0.8;
    
    data.forEach(point => {
      if (isPointVisible(point, viewport)) {
        const screenStart = graphToScreen(point.x - barWidth/2, 0, viewport, width, height);
        const screenEnd = graphToScreen(point.x + barWidth/2, point.y, viewport, width, height);
        
        const barScreenWidth = screenEnd.x - screenStart.x;
        const barScreenHeight = screenStart.y - screenEnd.y;
        
        ctx.fillRect(screenStart.x, screenEnd.y, barScreenWidth, barScreenHeight);
      }
    });
    
    ctx.restore();
  }, []);
  
  return (
    <div ref={containerRef} className={`w-full h-full ${className}`}>
      <canvas
        ref={canvasRef}
        width={canvasSize.width}
        height={canvasSize.height}
        className="graph-canvas"
        style={{
          cursor: isDragging ? 'grabbing' : 'crosshair',
          display: 'block',
          width: '100%',
          height: '100%',
        }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDoubleClick={handleDoubleClick}
      />
    </div>
  );
};

export default GraphCanvas;
