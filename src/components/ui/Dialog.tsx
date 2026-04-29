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

function DialogBody({
  title,
  children,
  footer,
  isDismissable,
}: {
  title: string;
  children: (close: () => void) => ReactNode;
  footer?: (close: () => void) => ReactNode;
  isDismissable: boolean;
}): ReactNode {
  return (
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
  );
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
          <DialogBody title={title} footer={footer} isDismissable={isDismissable}>
            {children}
          </DialogBody>
        </Modal>
      </ModalOverlay>
    </DialogTrigger>
  );
}

interface ControlledProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: (close: () => void) => ReactNode;
  footer?: (close: () => void) => ReactNode;
  isDismissable?: boolean;
}

/**
 * Controlled variant of Dialog — useful when the open state is driven by
 * external events (e.g. a select change) rather than a button click.
 */
export function ControlledDialog({
  isOpen,
  onOpenChange,
  title,
  children,
  footer,
  isDismissable = true,
}: ControlledProps): ReactNode {
  return (
    <ModalOverlay
      className="ra-modal-overlay"
      isDismissable={isDismissable}
      isOpen={isOpen}
      onOpenChange={onOpenChange}
    >
      <Modal className="ra-modal">
        <DialogBody title={title} footer={footer} isDismissable={isDismissable}>
          {children}
        </DialogBody>
      </Modal>
    </ModalOverlay>
  );
}
