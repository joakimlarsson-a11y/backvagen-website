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
  return (
    <AriaForm className="ra-form" {...formProps}>
      {banner && (
        <div
          className={`ra-form__banner ra-form__banner--${banner.variant}`}
          role={banner.variant === 'error' ? 'alert' : 'status'}
        >
          {banner.message}
        </div>
      )}
      {children}
    </AriaForm>
  );
}

export function FormActions({ children }: { children: ReactNode }): ReactNode {
  return <div className="ra-form__actions">{children}</div>;
}
