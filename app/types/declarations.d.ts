declare module '@headlessui/react' {
    import * as React from 'react';
    
    export interface DisclosureProps extends React.HTMLAttributes<HTMLElement> {
      as?: React.ElementType;
      defaultOpen?: boolean;
      open?: boolean;
      onChange?: (open: boolean) => void;
      children?: React.ReactNode | ((props: { open: boolean }) => React.ReactNode);
    }
    
    export const Disclosure: React.FC<DisclosureProps> & {
      Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>>;
      Panel: React.FC<React.HTMLAttributes<HTMLDivElement>>;
    };
    
    export interface MenuProps extends React.HTMLAttributes<HTMLElement> {
      as?: React.ElementType;
      children?: React.ReactNode | ((props: { open: boolean }) => React.ReactNode);
    }
    
    export const Menu: React.FC<MenuProps> & {
      Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>>;
      Items: React.FC<React.HTMLAttributes<HTMLDivElement>>;
      Item: React.FC<{children?: React.ReactNode | ((props: { active: boolean }) => React.ReactNode)}>;
    };
    
    export interface DialogProps extends React.HTMLAttributes<HTMLElement> {
      as?: React.ElementType;
      open: boolean;
      onClose: (open: boolean) => void;
      children?: React.ReactNode;
    }
    
    export const Dialog: React.FC<DialogProps> & {
      Panel: React.FC<React.HTMLAttributes<HTMLDivElement>>;
      Title: React.FC<React.HTMLAttributes<HTMLHeadingElement>>;
      Description: React.FC<React.HTMLAttributes<HTMLParagraphElement>>;
    };
    
    export interface TransitionProps extends React.HTMLAttributes<HTMLElement> {
      as?: React.ElementType;
      show?: boolean;
      enter?: string;
      enterFrom?: string;
      enterTo?: string;
      leave?: string;
      leaveFrom?: string;
      leaveTo?: string;
      children?: React.ReactNode;
    }
    
    export const Transition: React.FC<TransitionProps> & {
      Child: React.FC<TransitionProps>;
    };
  }
  
  declare module '@heroicons/react/24/outline' {
    import * as React from 'react';
    
    export const Bars3Icon: React.ForwardRefExoticComponent<React.SVGProps<SVGSVGElement>>;
    export const XMarkIcon: React.ForwardRefExoticComponent<React.SVGProps<SVGSVGElement>>;
    export const FolderIcon: React.ForwardRefExoticComponent<React.SVGProps<SVGSVGElement>>;
    export const ArrowsRightLeftIcon: React.ForwardRefExoticComponent<React.SVGProps<SVGSVGElement>>;
    export const ArrowRightOnRectangleIcon: React.ForwardRefExoticComponent<React.SVGProps<SVGSVGElement>>;
    export const ExclamationTriangleIcon: React.ForwardRefExoticComponent<React.SVGProps<SVGSVGElement>>;
    export const TrashIcon: React.ForwardRefExoticComponent<React.SVGProps<SVGSVGElement>>;
    export const ArrowUpTrayIcon: React.ForwardRefExoticComponent<React.SVGProps<SVGSVGElement>>;
    export const FolderPlusIcon: React.ForwardRefExoticComponent<React.SVGProps<SVGSVGElement>>;
  }