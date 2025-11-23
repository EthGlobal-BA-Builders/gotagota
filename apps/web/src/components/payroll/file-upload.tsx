"use client";

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, FileSpreadsheet } from 'lucide-react';
import type { PayrollEntryInput } from '@/types/payroll';

interface FileUploadProps {
  onFileParsed: (entries: PayrollEntryInput[]) => void;
  onError: (error: string) => void;
  chainId?: number;
}

export function FileUpload({ onFileParsed, onError, chainId }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file) return;

    const validExtensions = ['xlsx', 'xls', 'csv'];
    const extension = file.name.split('.').pop()?.toLowerCase();
    
    if (!extension || !validExtensions.includes(extension)) {
      onError('Please upload a .xlsx, .xls, or .csv file');
      return;
    }

    setIsProcessing(true);
    try {
      const { parsePayrollFile } = await import('@/lib/file-parser');
      const entries = await parsePayrollFile(file, chainId);
      
      if (entries.length === 0) {
        onError('No valid payroll entries found in the file');
        return;
      }

      onFileParsed(entries);
    } catch (error) {
      console.error('Error parsing file:', error);
      onError(error instanceof Error ? error.message : 'Failed to parse file');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  return (
    <div className="w-full">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center transition-colors
          ${isDragging ? 'border-primary bg-primary/5' : 'border-gray-300'}
          ${isProcessing ? 'opacity-50 pointer-events-none' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileSelect}
          className="hidden"
        />
        
        <FileSpreadsheet className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        
        <p className="text-sm text-gray-600 mb-4">
          Drag and drop your payroll file here, or
        </p>
        
        <Button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isProcessing}
          className="bg-pink-500 hover:bg-pink-600 text-white"
        >
          {isProcessing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Processing...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Choose File
            </>
          )}
        </Button>
        
        <p className="text-xs text-gray-500 mt-4">
          Supported formats: .xlsx, .xls, .csv
        </p>
      </div>
    </div>
  );
}

