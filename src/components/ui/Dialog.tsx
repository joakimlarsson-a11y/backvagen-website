import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import {
  DialogTrigger,
  Modal,
  ModalOverlay,
  Dialog as AriaDialog,
  Button as AriaButton,
  Heading,
} from 'react-aria-components';

import './ReactAria.css';

interface Props {
  title: string;
  trigger: ReactNode;
  children: (close: () => void) => ReactNode;
  footer?: (close: () => void) => ReactNode;
  isDismissable?: boolean;
}

export function Dialog({
  title,
  trigger,
  children,
  footer,
  isDismissable = true,
}: Props): ReactNode {
  return (
    <DialogTrigger>
      {trigger}
      <ModalOverlay className="ra-modal-overlay" isDismissable={isDismissable}>
        <Modal className="ra-modal">
          <AriaDialog className="ra-dialog">
            {({ close }) => (
              <>
                <div className="ra-dialog__header">
                  <Heading slot="title" className="ra-dialog__title">
                    {title}
                  </Heading>
                  {isDismissable && (
                    <AriaButton
                      className="ra-dialog__close"
                      onPress={close}
                      aria-label="Stäng dialog"
                    >
                      <X size={20} aria-hidden="true" />
                    </AriaButton>
                  )}
                </div>
                <div className="ra-dialog__body">{children(close)}</div>
                {footer && <div className="ra-dialog__footer">{footer(close)}</div>}
              </>
            )}
          </AriaDialog>
        </Modal>
      </ModalOverlay>
    </DialogTrigger>
  );
}
