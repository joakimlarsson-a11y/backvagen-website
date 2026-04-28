import type { ReactNode } from 'react';
import {
  TextField as AriaTextField,
  Label,
  Input,
  TextArea,
  FieldError,
  Text,
  type TextFieldProps as AriaTextFieldProps,
  type ValidationResult,
} from 'react-aria-components';

import './ReactAria.css';

interface Props extends Omit<AriaTextFieldProps, 'children'> {
  label: string;
  description?: string;
  errorMessage?: string | ((validation: ValidationResult) => string);
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
  requiredMarker?: boolean;
}

export function TextField({
  label,
  description,
  errorMessage,
  placeholder,
  multiline = false,
  rows = 4,
  isRequired,
  requiredMarker = true,
  ...fieldProps
}: Props): ReactNode {
  return (
    <AriaTextField className="ra-field" isRequired={isRequired} {...fieldProps}>
      <Label className="ra-label">
        {label}
        {isRequired && requiredMarker && (
          <span className="ra-required" aria-hidden="true">
            {' '}*
          </span>
        )}
      </Label>
      {multiline ? (
        <TextArea className="ra-textarea" placeholder={placeholder} rows={rows} />
      ) : (
        <Input className="ra-input" placeholder={placeholder} />
      )}
      {description && (
        <Text slot="description" className="ra-description">
          {description}
        </Text>
      )}
      <FieldError className="ra-error">{errorMessage}</FieldError>
    </AriaTextField>
  );
}
