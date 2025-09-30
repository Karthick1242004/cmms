"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Copy, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { toast } from 'sonner';
import { validateDuplicateName, checkNameExists, generateDuplicateName } from '@/lib/duplication-utils';

interface DuplicationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newItem: any) => void;
  originalItem: {
    id: string;
    name: string;
    [key: string]: any;
  };
  moduleType: 'assets' | 'maintenance' | 'employees' | 'tickets' | 'safety-inspection' | 'daily-log-activities';
  title?: string;
  description?: string;
  nameLabel?: string;
  nameField?: string;
  apiEndpoint?: string; // If not provided, defaults to `/api/${moduleType}/${id}/duplicate`
}

export function DuplicationDialog({
  isOpen,
  onClose,
  onSuccess,
  originalItem,
  moduleType,
  title,
  description,
  nameLabel = "Name",
  nameField = "name",
  apiEndpoint
}: DuplicationDialogProps) {
  const [newName, setNewName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingName, setIsCheckingName] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [nameExists, setNameExists] = useState<boolean | null>(null);

  // Generate default values based on module type
  const defaultTitle = title || `Duplicate ${moduleType.slice(0, -1).toUpperCase()}${moduleType.slice(1, -1)}`;
  const defaultDescription = description || `Create a copy of "${originalItem.name}" with a new ${nameField}.`;
  const defaultEndpoint = apiEndpoint || `/api/${moduleType}/${originalItem.id}/duplicate`;

  // Handle dialog open/close
  const handleClose = () => {
    setNewName('');
    setNameError(null);
    setNameExists(null);
    setIsLoading(false);
    setIsCheckingName(false);
    onClose();
  };

  // Generate suggested name when dialog opens
  const handleGenerateName = () => {
    const suggestedName = generateDuplicateName(originalItem.name);
    setNewName(suggestedName);
    handleNameValidation(suggestedName);
  };

  // Validate name input
  const handleNameValidation = async (name: string) => {
    setNameError(null);
    setNameExists(null);

    if (!name.trim()) {
      return;
    }

    // Basic validation
    const validation = validateDuplicateName(name);
    if (!validation.isValid) {
      setNameError(validation.error || 'Invalid name');
      return;
    }

    // Check if name exists
    setIsCheckingName(true);
    try {
      const exists = await checkNameExists(name.trim(), moduleType);
      setNameExists(exists);
      if (exists) {
        setNameError(`A ${moduleType.slice(0, -1)} with this name already exists`);
      }
    } catch (error) {
      console.error('Error checking name uniqueness:', error);
      // Don't show error to user, just allow them to proceed
    } finally {
      setIsCheckingName(false);
    }
  };

  // Handle name input change
  const handleNameChange = (value: string) => {
    setNewName(value);
    
    // Debounce validation
    const timeoutId = setTimeout(() => {
      handleNameValidation(value);
    }, 500);

    return () => clearTimeout(timeoutId);
  };

  // Handle duplication submission
  const handleDuplicate = async () => {
    if (!newName.trim()) {
      setNameError('Name is required');
      return;
    }

    if (nameError || nameExists) {
      return;
    }

    setIsLoading(true);

    try {
      // Get auth token
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth-token') : null;
      if (!token) {
        throw new Error('Authentication required');
      }

      console.log('🔄 [Duplication Dialog] - Starting duplication');
      console.log('🔄 [Duplication Dialog] - Original item:', originalItem.id);
      console.log('🔄 [Duplication Dialog] - New name:', newName.trim());

      // Prepare request body based on module type
      const requestBody: any = {};
      
      switch (moduleType) {
        case 'assets':
          requestBody.newAssetName = newName.trim();
          break;
        case 'maintenance':
          requestBody.newTitle = newName.trim();
          break;
        case 'employees':
          requestBody.newName = newName.trim();
          break;
        case 'tickets':
          requestBody.newTitle = newName.trim();
          break;
        case 'safety-inspection':
          requestBody.newTitle = newName.trim();
          break;
        case 'daily-log-activities':
          requestBody.newProblemDescription = newName.trim();
          break;
        default:
          requestBody[`new${nameField.charAt(0).toUpperCase()}${nameField.slice(1)}`] = newName.trim();
      }

      const response = await fetch(defaultEndpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        console.error(`❌ [DUPLICATION DIALOG] - ${moduleType.toUpperCase()} Error:`, result);
        
        if (result.missingFields) {
          throw new Error(`Missing required fields: ${result.missingFields.join(', ')}`);
        }
        
        throw new Error(result.message || `Failed to duplicate ${moduleType.slice(0, -1)}`);
      }

      console.log(`✅ [DUPLICATION DIALOG] - ${moduleType.toUpperCase()} duplication successful`);
      console.log(`✅ [DUPLICATION DIALOG] - ${moduleType.toUpperCase()} new item:`, result.data);
      console.log(`🔄 [DUPLICATION DIALOG] - ${moduleType.toUpperCase()} calling onSuccess callback...`);

      toast.success(`${moduleType.slice(0, -1).toUpperCase()}${moduleType.slice(1, -1)} duplicated successfully`);
      
      // Call success callback with new item data
      onSuccess(result.data);
      console.log(`✅ [DUPLICATION DIALOG] - ${moduleType.toUpperCase()} onSuccess callback completed`);
      
      // Close dialog
      handleClose();

    } catch (error) {
      console.error('❌ [Duplication Dialog] - Error:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      toast.error(`Failed to duplicate ${moduleType.slice(0, -1)}: ${errorMessage}`);
      setNameError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Get name status icon and color
  const getNameStatus = () => {
    if (isCheckingName) {
      return { icon: Loader2, color: 'text-blue-500', message: 'Checking availability...' };
    }
    
    if (nameError || nameExists) {
      return { icon: AlertTriangle, color: 'text-red-500', message: nameError };
    }
    
    if (newName.trim() && !nameExists) {
      return { icon: CheckCircle2, color: 'text-green-500', message: 'Name is available' };
    }
    
    return null;
  };

  const nameStatus = getNameStatus();

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Copy className="h-5 w-5" />
            {defaultTitle}
          </DialogTitle>
          <DialogDescription>
            {defaultDescription}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Original item info */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Creating a copy of <strong>"{originalItem.name}"</strong>. 
              All data will be copied except unique identifiers, dates, and assignments.
            </AlertDescription>
          </Alert>

          {/* Name input */}
          <div className="space-y-2">
            <Label htmlFor="new-name">{nameLabel} *</Label>
            <div className="relative">
              <Input
                id="new-name"
                value={newName}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder={`Enter new ${nameField}...`}
                className={nameError ? 'border-red-500' : ''}
                disabled={isLoading}
              />
              {nameStatus && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <nameStatus.icon 
                    className={`h-4 w-4 ${nameStatus.color} ${isCheckingName ? 'animate-spin' : ''}`} 
                  />
                </div>
              )}
            </div>
            
            {nameStatus && nameStatus.message && (
              <p className={`text-sm ${nameStatus.color.replace('text-', 'text-')}`}>
                {nameStatus.message}
              </p>
            )}

            {/* Generate name suggestion button */}
            {!newName && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleGenerateName}
                disabled={isLoading}
              >
                Generate Suggested Name
              </Button>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleDuplicate}
            disabled={isLoading || !newName.trim() || !!nameError || nameExists === true}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? 'Creating Copy...' : 'Create Copy'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
