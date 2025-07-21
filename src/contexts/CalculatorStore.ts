import { create } from 'zustand';
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { produce } from 'immer';
import { 
  CalculatorState, 
  FunctionExpression, 
  DataSet, 
  GraphViewport, 
  GridSettings, 
  AxisSettings, 
  AnimationState,
  ThemeSettings,
  AppSettings,
  GeometricShape,
  MathError 
} from '@/types';

// Default values
const defaultViewport: GraphViewport = {
  xMin: -10,
  xMax: 10,
  yMin: -10,
  yMax: 10,
  xScale: 1,
  yScale: 1,
  zoom: 1,
  centerX: 0,
  centerY: 0,
};

const defaultGridSettings: GridSettings = {
  showMajorGrid: true,
  showMinorGrid: true,
  majorGridSpacing: 1,
  minorGridSpacing: 0.2,
  majorGridColor: '#e2e8f0',
  minorGridColor: '#f1f5f9',
  majorGridOpacity: 0.8,
  minorGridOpacity: 0.4,
};

const defaultAxisSettings: AxisSettings = {
  showXAxis: true,
  showYAxis: true,
  showXLabels: true,
  showYLabels: true,
  axisColor: '#475569',
  labelColor: '#334155',
  fontSize: 12,
  tickLength: 5,
};

const defaultAnimationState: AnimationState = {
  isPlaying: false,
  currentTime: 0,
  duration: 10,
  speed: 1,
  loop: true,
  timeVariable: 't',
};

const defaultTheme: ThemeSettings = {
  mode: 'light',
  primaryColor: '#3b82f6',
  backgroundColor: '#ffffff',
  textColor: '#1f2937',
  accentColor: '#06b6d4',
};

const defaultSettings: AppSettings = {
  theme: defaultTheme,
  language: 'en',
  precision: 6,
  animationFps: 60,
  autoSave: true,
  shortcuts: {
    'ctrl+z': 'undo',
    'ctrl+y': 'redo',
    'ctrl+s': 'save',
    'ctrl+n': 'new',
    'ctrl+o': 'open',
    'space': 'play-pause',
  },
};

// Store interface
interface CalculatorStore extends CalculatorState {
  // Function management
  addFunction: (func: Omit<FunctionExpression, 'id'>) => void;
  updateFunction: (id: string, updates: Partial<FunctionExpression>) => void;
  removeFunction: (id: string) => void;
  toggleFunctionVisibility: (id: string) => void;
  duplicateFunction: (id: string) => void;
  
  // Dataset management
  addDataset: (dataset: Omit<DataSet, 'id'>) => void;
  updateDataset: (id: string, updates: Partial<DataSet>) => void;
  removeDataset: (id: string) => void;
  
  // Geometric shapes
  addShape: (shape: Omit<GeometricShape, 'id'>) => void;
  updateShape: (id: string, updates: Partial<GeometricShape>) => void;
  removeShape: (id: string) => void;
  
  // Viewport management
  setViewport: (viewport: Partial<GraphViewport>) => void;
  zoomIn: (factor?: number) => void;
  zoomOut: (factor?: number) => void;
  panTo: (x: number, y: number) => void;
  resetViewport: () => void;
  fitToData: () => void;
  
  // Grid and axis settings
  updateGridSettings: (settings: Partial<GridSettings>) => void;
  updateAxisSettings: (settings: Partial<AxisSettings>) => void;
  
  // Animation control
  playAnimation: () => void;
  pauseAnimation: () => void;
  stopAnimation: () => void;
  setAnimationTime: (time: number) => void;
  updateAnimationSettings: (settings: Partial<AnimationState>) => void;
  
  // Tool selection
  setSelectedTool: (tool: string) => void;
  
  // Settings management
  updateTheme: (theme: Partial<ThemeSettings>) => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  toggleTheme: () => void;
  
  // Error handling
  errors: MathError[];
  addError: (error: MathError) => void;
  clearErrors: () => void;
  
  // Undo/Redo functionality
  history: CalculatorState[];
  historyIndex: number;
  undo: () => void;
  redo: () => void;
  saveToHistory: () => void;
  
  // Utility methods
  clearAll: () => void;
  exportState: () => CalculatorState;
  importState: (state: Partial<CalculatorState>) => void;
}

let animationFrame: number;

export const useCalculatorStore = create<CalculatorStore>()(
  devtools(
    persist(
      subscribeWithSelector(
        immer((set, get) => ({
          // Initial state
          functions: [],
          datasets: [],
          geometricShapes: [],
          viewport: defaultViewport,
          gridSettings: defaultGridSettings,
          axisSettings: defaultAxisSettings,
          animationState: defaultAnimationState,
          selectedTool: 'function',
          settings: defaultSettings,
          errors: [],
          history: [],
          historyIndex: -1,

          // Function management
          addFunction: (func) => {
            set((state) => {
              const newFunction: FunctionExpression = {
                ...func,
                id: `func_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              };
              state.functions.push(newFunction);
              state.saveToHistory();
            });
          },

          updateFunction: (id, updates) => {
            set((state) => {
              const functionIndex = state.functions.findIndex(f => f.id === id);
              if (functionIndex !== -1) {
                Object.assign(state.functions[functionIndex], updates);
                state.saveToHistory();
              }
            });
          },

          removeFunction: (id) => {
            set((state) => {
              state.functions = state.functions.filter(f => f.id !== id);
              state.saveToHistory();
            });
          },

          toggleFunctionVisibility: (id) => {
            set((state) => {
              const func = state.functions.find(f => f.id === id);
              if (func) {
                func.visible = !func.visible;
              }
            });
          },

          duplicateFunction: (id) => {
            set((state) => {
              const func = state.functions.find(f => f.id === id);
              if (func) {
                const duplicated: FunctionExpression = {
                  ...func,
                  id: `func_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                  color: `hsl(${Math.random() * 360}, 70%, 50%)`,
                };
                state.functions.push(duplicated);
                state.saveToHistory();
              }
            });
          },

          // Dataset management
          addDataset: (dataset) => {
            set((state) => {
              const newDataset: DataSet = {
                ...dataset,
                id: `data_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              };
              state.datasets.push(newDataset);
              state.saveToHistory();
            });
          },

          updateDataset: (id, updates) => {
            set((state) => {
              const datasetIndex = state.datasets.findIndex(d => d.id === id);
              if (datasetIndex !== -1) {
                Object.assign(state.datasets[datasetIndex], updates);
                state.saveToHistory();
              }
            });
          },

          removeDataset: (id) => {
            set((state) => {
              state.datasets = state.datasets.filter(d => d.id !== id);
              state.saveToHistory();
            });
          },

          // Geometric shapes
          addShape: (shape) => {
            set((state) => {
              const newShape: GeometricShape = {
                ...shape,
                id: `shape_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              };
              state.geometricShapes.push(newShape);
              state.saveToHistory();
            });
          },

          updateShape: (id, updates) => {
            set((state) => {
              const shapeIndex = state.geometricShapes.findIndex(s => s.id === id);
              if (shapeIndex !== -1) {
                Object.assign(state.geometricShapes[shapeIndex], updates);
                state.saveToHistory();
              }
            });
          },

          removeShape: (id) => {
            set((state) => {
              state.geometricShapes = state.geometricShapes.filter(s => s.id !== id);
              state.saveToHistory();
            });
          },

          // Viewport management
          setViewport: (updates) => {
            set((state) => {
              Object.assign(state.viewport, updates);
            });
          },

          zoomIn: (factor = 1.5) => {
            set((state) => {
              const viewport = state.viewport;
              const centerX = (viewport.xMin + viewport.xMax) / 2;
              const centerY = (viewport.yMin + viewport.yMax) / 2;
              const width = (viewport.xMax - viewport.xMin) / factor;
              const height = (viewport.yMax - viewport.yMin) / factor;
              
              viewport.xMin = centerX - width / 2;
              viewport.xMax = centerX + width / 2;
              viewport.yMin = centerY - height / 2;
              viewport.yMax = centerY + height / 2;
              viewport.zoom *= factor;
            });
          },

          zoomOut: (factor = 1.5) => {
            set((state) => {
              const viewport = state.viewport;
              const centerX = (viewport.xMin + viewport.xMax) / 2;
              const centerY = (viewport.yMin + viewport.yMax) / 2;
              const width = (viewport.xMax - viewport.xMin) * factor;
              const height = (viewport.yMax - viewport.yMin) * factor;
              
              viewport.xMin = centerX - width / 2;
              viewport.xMax = centerX + width / 2;
              viewport.yMin = centerY - height / 2;
              viewport.yMax = centerY + height / 2;
              viewport.zoom /= factor;
            });
          },

          panTo: (x, y) => {
            set((state) => {
              const viewport = state.viewport;
              const width = viewport.xMax - viewport.xMin;
              const height = viewport.yMax - viewport.yMin;
              
              viewport.xMin = x - width / 2;
              viewport.xMax = x + width / 2;
              viewport.yMin = y - height / 2;
              viewport.yMax = y + height / 2;
              viewport.centerX = x;
              viewport.centerY = y;
            });
          },

          resetViewport: () => {
            set((state) => {
              state.viewport = { ...defaultViewport };
            });
          },

          fitToData: () => {
            set((state) => {
              const allData = state.datasets.flatMap(d => d.data);
              if (allData.length === 0) return;
              
              const xs = allData.map(p => p.x);
              const ys = allData.map(p => p.y);
              const xMin = Math.min(...xs);
              const xMax = Math.max(...xs);
              const yMin = Math.min(...ys);
              const yMax = Math.max(...ys);
              
              const xPadding = (xMax - xMin) * 0.1;
              const yPadding = (yMax - yMin) * 0.1;
              
              state.viewport.xMin = xMin - xPadding;
              state.viewport.xMax = xMax + xPadding;
              state.viewport.yMin = yMin - yPadding;
              state.viewport.yMax = yMax + yPadding;
            });
          },

          // Grid and axis settings
          updateGridSettings: (settings) => {
            set((state) => {
              Object.assign(state.gridSettings, settings);
            });
          },

          updateAxisSettings: (settings) => {
            set((state) => {
              Object.assign(state.axisSettings, settings);
            });
          },

          // Animation control
          playAnimation: () => {
            set((state) => {
              state.animationState.isPlaying = true;
            });
            
            const animate = () => {
              const state = get();
              if (!state.animationState.isPlaying) return;
              
              const newTime = state.animationState.currentTime + 
                (1 / state.settings.animationFps) * state.animationState.speed;
              
              if (newTime >= state.animationState.duration) {
                if (state.animationState.loop) {
                  set((state) => {
                    state.animationState.currentTime = 0;
                  });
                } else {
                  set((state) => {
                    state.animationState.isPlaying = false;
                    state.animationState.currentTime = state.animationState.duration;
                  });
                  return;
                }
              } else {
                set((state) => {
                  state.animationState.currentTime = newTime;
                });
              }
              
              animationFrame = requestAnimationFrame(animate);
            };
            
            animationFrame = requestAnimationFrame(animate);
          },

          pauseAnimation: () => {
            set((state) => {
              state.animationState.isPlaying = false;
            });
            if (animationFrame) {
              cancelAnimationFrame(animationFrame);
            }
          },

          stopAnimation: () => {
            set((state) => {
              state.animationState.isPlaying = false;
              state.animationState.currentTime = 0;
            });
            if (animationFrame) {
              cancelAnimationFrame(animationFrame);
            }
          },

          setAnimationTime: (time) => {
            set((state) => {
              state.animationState.currentTime = Math.max(0, 
                Math.min(time, state.animationState.duration));
            });
          },

          updateAnimationSettings: (settings) => {
            set((state) => {
              Object.assign(state.animationState, settings);
            });
          },

          // Tool selection
          setSelectedTool: (tool) => {
            set((state) => {
              state.selectedTool = tool;
            });
          },

          // Settings management
          updateTheme: (theme) => {
            set((state) => {
              Object.assign(state.settings.theme, theme);
            });
          },

          updateSettings: (settings) => {
            set((state) => {
              Object.assign(state.settings, settings);
            });
          },

          toggleTheme: () => {
            set((state) => {
              const newMode = state.settings.theme.mode === 'light' ? 'dark' : 'light';
              state.settings.theme.mode = newMode;
              
              if (newMode === 'dark') {
                state.settings.theme.backgroundColor = '#0f172a';
                state.settings.theme.textColor = '#f1f5f9';
                state.gridSettings.majorGridColor = '#334155';
                state.gridSettings.minorGridColor = '#1e293b';
                state.axisSettings.axisColor = '#94a3b8';
                state.axisSettings.labelColor = '#cbd5e1';
              } else {
                state.settings.theme.backgroundColor = '#ffffff';
                state.settings.theme.textColor = '#1f2937';
                state.gridSettings.majorGridColor = '#e2e8f0';
                state.gridSettings.minorGridColor = '#f1f5f9';
                state.axisSettings.axisColor = '#475569';
                state.axisSettings.labelColor = '#334155';
              }
            });
          },

          // Error handling
          addError: (error) => {
            set((state) => {
              state.errors.push(error);
            });
          },

          clearErrors: () => {
            set((state) => {
              state.errors = [];
            });
          },

          // Undo/Redo functionality
          saveToHistory: () => {
            set((state) => {
              const currentState = {
                functions: state.functions,
                datasets: state.datasets,
                geometricShapes: state.geometricShapes,
                viewport: state.viewport,
                gridSettings: state.gridSettings,
                axisSettings: state.axisSettings,
                animationState: state.animationState,
                selectedTool: state.selectedTool,
                settings: state.settings,
                errors: [],
                history: [],
                historyIndex: -1,
              };
              
              // Limit history size
              if (state.history.length >= 50) {
                state.history.shift();
              } else {
                state.historyIndex++;
              }
              
              state.history = state.history.slice(0, state.historyIndex + 1);
              state.history.push(currentState);
            });
          },

          undo: () => {
            set((state) => {
              if (state.historyIndex > 0) {
                state.historyIndex--;
                const previousState = state.history[state.historyIndex];
                Object.assign(state, {
                  ...previousState,
                  history: state.history,
                  historyIndex: state.historyIndex,
                });
              }
            });
          },

          redo: () => {
            set((state) => {
              if (state.historyIndex < state.history.length - 1) {
                state.historyIndex++;
                const nextState = state.history[state.historyIndex];
                Object.assign(state, {
                  ...nextState,
                  history: state.history,
                  historyIndex: state.historyIndex,
                });
              }
            });
          },

          // Utility methods
          clearAll: () => {
            set((state) => {
              state.functions = [];
              state.datasets = [];
              state.geometricShapes = [];
              state.errors = [];
              state.viewport = { ...defaultViewport };
              state.saveToHistory();
            });
          },

          exportState: () => {
            const state = get();
            return {
              functions: state.functions,
              datasets: state.datasets,
              geometricShapes: state.geometricShapes,
              viewport: state.viewport,
              gridSettings: state.gridSettings,
              axisSettings: state.axisSettings,
              animationState: state.animationState,
              selectedTool: state.selectedTool,
              settings: state.settings,
              errors: [],
              history: [],
              historyIndex: -1,
            };
          },

          importState: (newState) => {
            set((state) => {
              Object.assign(state, newState);
              state.saveToHistory();
            });
          },
        }))
      ),
      {
        name: 'graphyy-calculator-storage',
        partialize: (state) => ({
          functions: state.functions,
          datasets: state.datasets,
          geometricShapes: state.geometricShapes,
          viewport: state.viewport,
          gridSettings: state.gridSettings,
          axisSettings: state.axisSettings,
          settings: state.settings,
        }),
      }
    ),
    {
      name: 'graphyy-calculator-store',
    }
  )
);

// Selectors for optimized re-renders
export const useFunctions = () => useCalculatorStore(state => state.functions);
export const useDatasets = () => useCalculatorStore(state => state.datasets);
export const useViewport = () => useCalculatorStore(state => state.viewport);
export const useGridSettings = () => useCalculatorStore(state => state.gridSettings);
export const useAxisSettings = () => useCalculatorStore(state => state.axisSettings);
export const useAnimationState = () => useCalculatorStore(state => state.animationState);
export const useTheme = () => useCalculatorStore(state => state.settings.theme);
export const useSelectedTool = () => useCalculatorStore(state => state.selectedTool);
export const useErrors = () => useCalculatorStore(state => state.errors);

export type CalculatorStoreType = typeof useCalculatorStore;
