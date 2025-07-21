import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useCalculatorStore } from '@/contexts/CalculatorStore';
import { FunctionExpression } from '@/types';
import { safeEvaluate, detectFunctionType } from '@/utils/mathUtils';
import { Plus, Trash2, Eye, EyeOff, Copy } from 'lucide-react';

interface ExpressionEditorProps {
  className?: string;
}

const FUNCTION_COLORS = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b',
  '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16',
  '#f97316', '#6366f1', '#14b8a6', '#f43f5e'
];

export const ExpressionEditor: React.FC<ExpressionEditorProps> = ({ className = '' }) => {
  const [newExpression, setNewExpression] = useState('');
  const [colorIndex, setColorIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Store selectors and actions
  const functions = useCalculatorStore(state => state.functions);
  const addFunction = useCalculatorStore(state => state.addFunction);
  const updateFunction = useCalculatorStore(state => state.updateFunction);
  const removeFunction = useCalculatorStore(state => state.removeFunction);
  const toggleFunctionVisibility = useCalculatorStore(state => state.toggleFunctionVisibility);
  const duplicateFunction = useCalculatorStore(state => state.duplicateFunction);
  const addError = useCalculatorStore(state => state.addError);
  const clearErrors = useCalculatorStore(state => state.clearErrors);
  
  // Validate expression as user types
  const validateExpression = useCallback((expression: string) => {
    if (!expression.trim()) return true;
    
    const { error } = safeEvaluate(expression, { x: 0 });
    return !error;
  }, []);
  
  // Add new function
  const handleAddFunction = useCallback(() => {
    if (!newExpression.trim()) return;
    
    // Validate expression
    const { error } = safeEvaluate(newExpression, { x: 0 });
    if (error) {
      addError(error);
      return;
    }
    
    clearErrors();
    
    // Auto-detect function type
    const detectedType = detectFunctionType(newExpression);
    
    const newFunction: Omit<FunctionExpression, 'id'> = {
      expression: newExpression,
      type: detectedType,
      color: FUNCTION_COLORS[colorIndex % FUNCTION_COLORS.length],
      visible: true,
      style: {
        strokeWidth: 2,
        opacity: 1,
      },
    };
    
    addFunction(newFunction);
    setNewExpression('');
    setColorIndex((prev) => (prev + 1) % FUNCTION_COLORS.length);
    
    // Focus back to input
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [newExpression, colorIndex, addFunction, addError, clearErrors]);
  
  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleAddFunction();
    }
  }, [handleAddFunction]);
  
  // Update function expression
  const handleUpdateExpression = useCallback((id: string, expression: string) => {
    const { error } = safeEvaluate(expression, { x: 0 });
    if (error) {
      addError(error);
      return;
    }
    
    clearErrors();
    updateFunction(id, { expression });
  }, [updateFunction, addError, clearErrors]);
  
  // Auto-focus input when component mounts
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);
  
  return (
    <div className={`expression-editor ${className} h-full flex flex-col`}>
      <div className="h-full flex flex-col">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Functions
        </h3>
        
        {/* Add new function */}
        <div className="space-y-3 mb-6">
          <div className="flex items-center space-x-2">
            <div 
              className="function-color-indicator" 
              style={{ backgroundColor: FUNCTION_COLORS[colorIndex % FUNCTION_COLORS.length] }}
            />
            <input
              ref={inputRef}
              type="text"
              value={newExpression}
              onChange={(e) => setNewExpression(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter function expression (e.g., x^2 + 2*x + 1)"
              className="expression-input flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={handleAddFunction}
              disabled={!newExpression.trim() || !validateExpression(newExpression)}
              className="p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-md transition-colors"
              title="Add function"
            >
              <Plus size={20} />
            </button>
          </div>
          
          {/* Show detected function type if expression is entered */}
          {newExpression.trim() && (
            <div className="text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded">
              Auto-detected: <span className="font-medium capitalize">{detectFunctionType(newExpression)}</span>
            </div>
          )}
          
          {/* Expression syntax help */}
          <div className="text-xs text-gray-600 dark:text-gray-400">
            <p>Examples: x^2, sin(x), log(x), abs(x), sqrt(x), exp(x)</p>
            <p>Constants: PI, E, sqrt(2), sqrt(3)</p>
          </div>
        </div>
        
        {/* Function list */}
        <div className="space-y-2 flex-1 overflow-y-auto">
          {functions.map((func, index) => (
            <FunctionItem
              key={func.id}
              function={func}
              index={index}
              onUpdate={handleUpdateExpression}
              onRemove={removeFunction}
              onToggleVisibility={toggleFunctionVisibility}
              onDuplicate={duplicateFunction}
              onUpdateColor={(id, color) => updateFunction(id, { color })}
            />
          ))}
          
          {functions.length === 0 && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <p>No functions added yet.</p>
              <p className="text-sm">Add a function above to get started!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface FunctionItemProps {
  function: FunctionExpression;
  index: number;
  onUpdate: (id: string, expression: string) => void;
  onRemove: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  onDuplicate: (id: string) => void;
  onUpdateColor: (id: string, color: string) => void;
}

const FunctionItem: React.FC<FunctionItemProps> = ({
  function: func,
  index,
  onUpdate,
  onRemove,
  onToggleVisibility,
  onDuplicate,
  onUpdateColor,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(func.expression);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const colorPickerRef = useRef<HTMLDivElement>(null);
  
  // Close color picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (colorPickerRef.current && !colorPickerRef.current.contains(event.target as Node)) {
        setShowColorPicker(false);
      }
    };
    
    if (showColorPicker) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showColorPicker]);
  
  const handleSave = useCallback(() => {
    onUpdate(func.id, editValue);
    setIsEditing(false);
  }, [func.id, editValue, onUpdate]);
  
  const handleCancel = useCallback(() => {
    setEditValue(func.expression);
    setIsEditing(false);
  }, [func.expression]);
  
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleSave();
    } else if (event.key === 'Escape') {
      handleCancel();
    }
  }, [handleSave, handleCancel]);
  
  return (
    <div className="function-item flex flex-col space-y-3 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-750 transition-all duration-200 shadow-sm hover:shadow-md">
      {/* Top row: Function number, color, and actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="text-sm font-semibold text-gray-600 dark:text-gray-300 w-6 flex items-center justify-center bg-gray-100 dark:bg-gray-600 rounded-full h-6">
            {index + 1}
          </span>
          <div className="relative" ref={colorPickerRef}>
            <button
              className="function-color-indicator hover:scale-110 transition-transform shadow-sm border border-white dark:border-gray-600"
              style={{ backgroundColor: func.color }}
              onClick={() => setShowColorPicker(!showColorPicker)}
              title="Change color"
            />
            {showColorPicker && (
              <div className="absolute top-full left-0 mt-1 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-10">
                <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Choose Color</h4>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    defaultValue={func.color}
                    className="w-10 h-10 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
                    onChange={(e) => {
                      onUpdateColor(func.id, e.target.value);
                      setShowColorPicker(false);
                    }}
                    title="Choose custom color"
                  />
                  <span className="text-xs text-gray-500 dark:text-gray-400">Click to pick any color</span>
                </div>
              </div>
            )}
          </div>
          <span className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full font-medium">
            {func.type}
          </span>
        </div>
        
        {/* Action buttons */}
        <div className="flex items-center space-x-1">
          <button
            onClick={() => onToggleVisibility(func.id)}
            className="p-1.5 bg-white text-black hover:text-gray-800 dark:text-white dark:bg-black dark:hover:text-gray-200 border-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-all"
            title={func.visible ? 'Hide function' : 'Show function'}
          >
            {func.visible ? <Eye size={16} /> : <EyeOff size={16} />}
          </button>
          
          <button
            onClick={() => onDuplicate(func.id)}
            className="p-1.5 bg-white text-black hover:text-gray-800 dark:text-white dark:bg-black dark:hover:text-gray-200  border-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-all"
            title="Duplicate function"
          >
            <Copy size={16} />
          </button>
          
          <button
            onClick={() => onRemove(func.id)}
            className="p-1.5 bg-white text-black hover:text-gray-800 border-gray-200 dark:text-white dark:bg-black dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-all"
            title="Remove function"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
      
      {/* Function expression - Full width on second row */}
      <div className="w-full">
        {isEditing ? (
          <input
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleSave}
            className="expression-input w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
            autoFocus
          />
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className="text-left w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-md transition-all duration-200 break-all border border-gray-200 dark:border-gray-600 shadow-sm hover:shadow-md"
            title="Click to edit"
          >
            <code className="text-sm font-mono text-gray-800 dark:text-gray-200 font-medium">{func.expression}</code>
          </button>
        )}
      </div>
    </div>
  );
};

export default ExpressionEditor;
