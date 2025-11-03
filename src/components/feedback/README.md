# Error Handling and User Feedback System

This directory contains a comprehensive error handling and user feedback system for the Health Tracker app. The system provides consistent error handling, loading states, and user feedback across all screens.

## Components

### Error Handling Components

#### `ErrorMessage`
Displays error messages with retry options and dismissal functionality.

```tsx
<ErrorMessage
  error={appError}
  onRetry={() => retryOperation()}
  onDismiss={() => clearError()}
  showDetails={__DEV__}
/>
```

#### `InlineError`
Compact error display for inline use within forms or lists.

```tsx
<InlineError
  error={appError}
  onRetry={() => retryOperation()}
/>
```

#### `ValidationError`
Specialized error component for form validation feedback.

```tsx
<ValidationError
  error={validationError}
  field="email"
/>
```

### Loading Components

#### `LoadingIndicator`
Full-screen loading indicator with optional overlay.

```tsx
<LoadingIndicator
  message="Processing your request..."
  overlay={true}
  size="large"
/>
```

#### `ProgressIndicator`
Progress bar with percentage display for upload operations.

```tsx
<ProgressIndicator
  progress={0.75}
  message="Uploading image..."
  showPercentage={true}
/>
```

#### `InlineLoading`
Compact loading indicator for inline use.

```tsx
<InlineLoading
  message="Saving..."
  size="small"
/>
```

### Success and Confirmation Components

#### `SuccessMessage`
Success notification with auto-hide functionality.

```tsx
<SuccessMessage
  message="Data saved successfully!"
  autoHide={true}
  duration={3000}
/>
```

#### `DataPreview`
Preview component for displaying analyzed data before saving.

```tsx
<DataPreview
  entry={analysisResult}
  onSave={handleSave}
  onDiscard={handleDiscard}
  isLoading={isSaving}
/>
```

#### `ConfirmationDialog`
Modal confirmation dialog for destructive actions.

```tsx
<ConfirmationDialog
  title="Delete Entry"
  message="Are you sure you want to delete this entry?"
  confirmText="Delete"
  cancelText="Cancel"
  onConfirm={handleDelete}
  onCancel={handleCancel}
  isDestructive={true}
/>
```

## Error Types

The system uses a standardized `AppError` type for consistent error handling:

```typescript
type AppError = 
  | { type: 'network'; message: string; shouldRetry: boolean }
  | { type: 'validation'; message: string; field?: string }
  | { type: 'processing'; message: string; shouldRetry?: boolean }
  | { type: 'storage'; message: string; operation?: string }
  | { type: 'permission'; message: string; permission: string }
  | { type: 'api'; message: string; shouldRetry: boolean; statusCode?: number }
  | { type: 'unknown'; message: string };
```

## Hooks

### `useAsyncOperation`
Hook for handling async operations with error handling and retry logic.

```tsx
const operation = useAsyncOperation(
  async (data) => {
    return await apiCall(data);
  },
  {
    onSuccess: (result) => console.log('Success:', result),
    onError: (error) => console.error('Error:', error),
    maxRetries: 3,
  }
);

// Usage
const handleSubmit = async () => {
  try {
    await operation.execute(formData);
  } catch (error) {
    // Error is already handled by the hook
  }
};
```

### `useImageUpload`
Specialized hook for image upload operations with progress tracking.

```tsx
const imageUpload = useImageUpload(
  async (imageUri) => {
    return await uploadImage(imageUri);
  },
  {
    onSuccess: (result) => setUploadResult(result),
  }
);

// Usage
<ProgressIndicator progress={imageUpload.progress / 100} />
```

### `useValidation`
Hook for form validation with real-time feedback.

```tsx
const validation = useValidation(
  async (data) => {
    return await validateData(data);
  }
);

// Usage
const handleValidate = async () => {
  const isValid = await validation.validate(formData);
  if (!isValid) {
    // Show validation error
  }
};
```

## Error Handling Utilities

### `ErrorHandlingUtils`
Centralized utilities for error processing and formatting.

```typescript
// Handle different error types
const apiError = ErrorHandlingUtils.handleApiError(error);
const validationError = ErrorHandlingUtils.handleValidationError(error, 'email');
const storageError = ErrorHandlingUtils.handleStorageError(error, 'save');

// Format user-friendly messages
const userMessage = ErrorHandlingUtils.formatUserMessage(error);

// Check if error should show retry option
const shouldRetry = ErrorHandlingUtils.shouldShowRetry(error);

// Get retry delay with exponential backoff
const delay = ErrorHandlingUtils.getRetryDelay(error, attemptNumber);
```

## Best Practices

### Error Handling
1. Always use the standardized `AppError` type
2. Provide user-friendly error messages
3. Include retry options for recoverable errors
4. Log errors in development mode for debugging
5. Handle permission errors gracefully

### Loading States
1. Show loading indicators for operations > 500ms
2. Use progress indicators for upload operations
3. Provide meaningful loading messages
4. Disable UI interactions during loading

### User Feedback
1. Show success messages for completed actions
2. Use confirmation dialogs for destructive actions
3. Provide data preview before saving
4. Auto-hide success messages after 3-5 seconds

### Validation
1. Validate data in real-time where appropriate
2. Show field-specific validation errors
3. Clear validation errors when fields are corrected
4. Use consistent validation rules across the app

## Integration Examples

### Page-Level Error Handling

```tsx
function MyPage() {
  const [error, setError] = useState<AppError | null>(null);
  
  const operation = useAsyncOperation(
    async (data) => await processData(data),
    {
      onError: (error) => setError(error),
    }
  );

  return (
    <View>
      {error && (
        <ErrorMessage
          error={error}
          onRetry={() => operation.retry()}
          onDismiss={() => setError(null)}
        />
      )}
      
      {operation.isLoading && (
        <LoadingIndicator message="Processing..." />
      )}
      
      {/* Page content */}
    </View>
  );
}
```

### Form Validation

```tsx
function MyForm() {
  const validation = useValidationFeedback();
  
  const handleSubmit = async () => {
    const isValid = await validation.validateForm(formData, {
      email: [ValidationRules.required(), ValidationRules.email()],
      password: [ValidationRules.required(), ValidationRules.minLength(8)],
    });
    
    if (isValid) {
      // Submit form
    }
  };

  return (
    <View>
      <TextInput
        value={email}
        onChangeText={(text) => {
          setEmail(text);
          validation.clearFieldError('email');
        }}
      />
      {validation.hasFieldError('email') && (
        <ValidationError
          error={validation.getFieldError('email')!}
          field="email"
        />
      )}
    </View>
  );
}
```

This system provides a robust foundation for error handling and user feedback throughout the Health Tracker app, ensuring a consistent and user-friendly experience.