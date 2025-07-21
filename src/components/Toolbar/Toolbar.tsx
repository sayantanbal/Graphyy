import React from 'react';
import { useCalculatorStore } from '@/contexts/CalculatorStore';
import { 
  ZoomIn, 
  ZoomOut, 
  Play, 
  Pause, 
  Square,
  Home,
  Grid,
  Settings,
  Sun,
  Moon,
  Download,
  Upload,
  Share2
} from 'lucide-react';

interface ToolbarProps {
  className?: string;
}

export const Toolbar: React.FC<ToolbarProps> = ({ className = '' }) => {
  // Store selectors
  const animationState = useCalculatorStore(state => state.animationState);
  const theme = useCalculatorStore(state => state.settings.theme);
  const viewport = useCalculatorStore(state => state.viewport);
  const gridSettings = useCalculatorStore(state => state.gridSettings);
  const selectedTool = useCalculatorStore(state => state.selectedTool);
  
  // Store actions
  const zoomIn = useCalculatorStore(state => state.zoomIn);
  const zoomOut = useCalculatorStore(state => state.zoomOut);
  const resetViewport = useCalculatorStore(state => state.resetViewport);
  const playAnimation = useCalculatorStore(state => state.playAnimation);
  const pauseAnimation = useCalculatorStore(state => state.pauseAnimation);
  const stopAnimation = useCalculatorStore(state => state.stopAnimation);
  const toggleTheme = useCalculatorStore(state => state.toggleTheme);
  const updateGridSettings = useCalculatorStore(state => state.updateGridSettings);
  const setSelectedTool = useCalculatorStore(state => state.setSelectedTool);
  const exportState = useCalculatorStore(state => state.exportState);
  const importState = useCalculatorStore(state => state.importState);
  
  const handleExport = () => {
    const state = exportState();
    const dataStr = JSON.stringify(state, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = 'graphyy-session.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  
  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = JSON.parse(e.target?.result as string);
            importState(data);
          } catch (error) {
            console.error('Error importing session:', error);
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };
  
  const handleShare = async () => {
    const state = exportState();
    const dataStr = JSON.stringify(state);
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Graphyy Session',
          text: 'Check out this graphing calculator session!',
          files: [new File([dataStr], 'graphyy-session.json', { type: 'application/json' })]
        });
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(dataStr);
        alert('Session data copied to clipboard!');
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };
  
  return (
    <div className={`toolbar bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 ${className}`}>
      <div className="flex items-center justify-between px-4 py-2">
        {/* Left section - View controls */}
        <div className="flex items-center space-x-1">
          <button
            onClick={() => zoomIn()}
            className="toolbar-button p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
            title="Zoom In"
          >
            <ZoomIn size={16} />
          </button>
          <button
            onClick={() => zoomOut()}
            className="toolbar-button p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
            title="Zoom Out"
          >
            <ZoomOut size={16} />
          </button>
          <button
            onClick={resetViewport}
            className="toolbar-button p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
            title="Reset View"
          >
            <Home size={16} />
          </button>
          <div className="h-4 w-px bg-gray-300 dark:bg-gray-600 mx-1" />
          <button
            onClick={() => updateGridSettings({ 
              showMajorGrid: !gridSettings.showMajorGrid 
            })}
            className={`toolbar-button p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded ${gridSettings.showMajorGrid ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' : ''}`}
            title="Toggle Grid"
          >
            <Grid size={16} />
          </button>
        </div>
        
        {/* Center section - Animation controls */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1 bg-gray-50 dark:bg-gray-800 rounded-lg p-1">
            {!animationState.isPlaying ? (
              <button
                onClick={playAnimation}
                className="toolbar-button p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                title="Play Animation"
              >
                <Play size={16} />
              </button>
            ) : (
              <button
                onClick={pauseAnimation}
                className="toolbar-button p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                title="Pause Animation"
              >
                <Pause size={16} />
              </button>
            )}
            <button
              onClick={stopAnimation}
              className="toolbar-button p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              title="Stop Animation"
            >
              <Square size={16} />
            </button>
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400 min-w-[80px] text-center">
            t = {animationState.currentTime.toFixed(2)}s
          </div>
        </div>
        
        {/* Right section - App controls */}
        <div className="flex items-center space-x-1">
          <button
            onClick={handleImport}
            className="toolbar-button p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
            title="Import Session"
          >
            <Upload size={16} />
          </button>
          <button
            onClick={handleExport}
            className="toolbar-button p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
            title="Export Session"
          >
            <Download size={16} />
          </button>
          <button
            onClick={handleShare}
            className="toolbar-button p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
            title="Share Session"
          >
            <Share2 size={16} />
          </button>
          <div className="h-4 w-px bg-gray-300 dark:bg-gray-600 mx-1" />
          <button
            onClick={toggleTheme}
            className="toolbar-button p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
            title={`Switch to ${theme.mode === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme.mode === 'light' ? <Moon size={16} /> : <Sun size={16} />}
          </button>
          <button
            onClick={() => setSelectedTool('settings')}
            className={`toolbar-button p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded ${selectedTool === 'settings' ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' : ''}`}
            title="Settings"
          >
            <Settings size={16} />
          </button>
        </div>
      </div>
      
      {/* Compact viewport info */}
      <div className="px-4 py-1 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
          <div>x: [{viewport.xMin.toFixed(1)}, {viewport.xMax.toFixed(1)}]</div>
          <div>y: [{viewport.yMin.toFixed(1)}, {viewport.yMax.toFixed(1)}]</div>
          <div>Zoom: {(viewport.zoom * 100).toFixed(0)}%</div>
        </div>
      </div>
    </div>
  );
};

export default Toolbar;
