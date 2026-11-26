"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogPortal = DialogPrimitive.Portal;
const DialogClose = DialogPrimitive.Close;

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

interface DialogContentProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  scrollable?: boolean;
}

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  DialogContentProps
>(({ className, children, onInteractOutside, scrollable = false, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      data-scrollable={scrollable ? "true" : undefined}
      className={cn(
        "group/dialog fixed left-[50%] top-[50%] z-50 w-[calc(100vw-1.5rem)] sm:w-full max-w-lg translate-x-[-50%] translate-y-[-50%] border bg-background shadow-xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] rounded-lg max-h-[85dvh]",
        scrollable
          ? "flex flex-col gap-0 p-0 overflow-hidden"
          : "grid gap-4 p-5 sm:p-6 overflow-y-auto",
        className
      )}
      onInteractOutside={(e) => {
        const target = e.target as HTMLElement;
        if (target?.closest?.('[data-radix-popper-content-wrapper], [data-radix-select-content], [cmdk-root], [role="listbox"], [role="combobox"]')) {
          e.preventDefault();
        }
        onInteractOutside?.(e);
      }}
      {...props}
    >
      {children}
      <DialogPrimitive.Close
        aria-label="Tutup dialog"
        className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground opacity-80 ring-offset-background transition-colors hover:bg-muted hover:text-foreground hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none cursor-pointer"
      >
        <X className="h-4 w-4" aria-hidden="true" />
        <span className="sr-only">Tutup</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
));
DialogContent.displayName = DialogPrimitive.Content.displayName;

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-1 text-left group-data-[scrollable=true]/dialog:shrink-0 group-data-[scrollable=true]/dialog:border-b group-data-[scrollable=true]/dialog:px-5 group-data-[scrollable=true]/dialog:pt-4 group-data-[scrollable=true]/dialog:pb-3 group-data-[scrollable=true]/dialog:pr-12",
      className
    )}
    {...props}
  />
);
DialogHeader.displayName = "DialogHeader";

const DialogBody = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("flex-1 min-h-0 overflow-y-auto px-5 py-3.5", className)}
    {...props}
  />
);
DialogBody.displayName = "DialogBody";

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:space-x-2 sm:gap-0 group-data-[scrollable=true]/dialog:shrink-0 group-data-[scrollable=true]/dialog:border-t group-data-[scrollable=true]/dialog:bg-muted/20 group-data-[scrollable=true]/dialog:px-5 group-data-[scrollable=true]/dialog:py-3",
      className
    )}
    {...props}
  />
);
DialogFooter.displayName = "DialogFooter";

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-xs text-muted-foreground", className)}
    {...props}
  />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};
