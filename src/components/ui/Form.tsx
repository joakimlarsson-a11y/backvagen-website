import type { ReactNode } from 'react';
import { Form as AriaForm, type FormProps } from 'react-aria-components';

import './ReactAria.css';

type BannerVariant = 'error' | 'success';

interface Props extends Omit<FormProps, 'children'> {
  children: ReactNode;
  banner?: {
    variant: BannerVariant;
    message: string;
  } | null;
}

export function Form({ children, banner, ...formProps }: Props): ReactNode {
  const isError = banner?.variant === 'error';
  return (
    <AriaForm className="ra-form" {...formProps}>
      {/* Permanent live regions so screen readers announce dynamic messages
          regardless of whether the banner element existed on first render. */}
      <div
        className={
          banner && !isError ? `ra-form__banner ra-form__banner--${banner.variant}` : ''
        }
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {banner && !isError ? banner.message : ''}
      </div>
      <div
        className={banner && isError ? `ra-form__banner ra-form__banner--${banner.variant}` : ''}
        role="alert"
        aria-atomic="true"
      >
        {banner && isError ? banner.message : ''}
      </div>
      {children}
    </AriaForm>
  );
}

export function FormActions({ children }: { children: ReactNode }): ReactNode {
  return <div className="ra-form__actions">{children}</div>;
}
