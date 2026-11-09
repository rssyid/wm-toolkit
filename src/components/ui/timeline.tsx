import * as React from "react";
import { cn } from "@/lib/utils";

export interface TimelineProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: "horizontal" | "vertical";
  defaultValue?: number;
  value?: number;
}

const TimelineContext = React.createContext<{
  orientation: "horizontal" | "vertical";
  activeStep?: number;
}>({
  orientation: "vertical",
});

export const Timeline = React.forwardRef<HTMLDivElement, TimelineProps>(
  ({ className, orientation = "vertical", defaultValue, value, children, ...props }, ref) => {
    return (
      <TimelineContext.Provider value={{ orientation, activeStep: value ?? defaultValue }}>
        <div
          ref={ref}
          data-slot="timeline"
          data-orientation={orientation}
          className={cn(
            "group/timeline flex",
            orientation === "vertical" ? "flex-col" : "w-full flex-row",
            className
          )}
          {...props}
        >
          {children}
        </div>
      </TimelineContext.Provider>
    );
  }
);
Timeline.displayName = "Timeline";

export interface TimelineItemProps extends React.HTMLAttributes<HTMLDivElement> {
  step?: number;
}

export const TimelineItem = React.forwardRef<HTMLDivElement, TimelineItemProps>(
  ({ className, step, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        data-slot="timeline-item"
        data-step={step}
        className={cn(
          "group/timeline-item relative flex flex-1 flex-col gap-0.5 group-data-[orientation=vertical]/timeline:ms-8 group-data-[orientation=vertical]/timeline:not-last:pb-6",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
TimelineItem.displayName = "TimelineItem";

export const TimelineHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      data-slot="timeline-header"
      className={cn("relative", className)}
      {...props}
    >
      {children}
    </div>
  );
});
TimelineHeader.displayName = "TimelineHeader";

export const TimelineSeparator = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      data-slot="timeline-separator"
      aria-hidden="true"
      className={cn(
        "group-data-[orientation=vertical]/timeline:-left-6 group-data-[orientation=vertical]/timeline:-translate-x-1/2 absolute self-start group-last/timeline-item:hidden group-data-[orientation=vertical]/timeline:w-0.5 group-data-[orientation=vertical]/timeline:translate-y-4.5 bg-border group-data-[orientation=vertical]/timeline:h-[calc(100%-1.25rem)]",
        className
      )}
      {...props}
    />
  );
});
TimelineSeparator.displayName = "TimelineSeparator";

export interface TimelineIndicatorProps
  extends React.HTMLAttributes<HTMLDivElement> {
  color?: string;
}

export const TimelineIndicator = React.forwardRef<
  HTMLDivElement,
  TimelineIndicatorProps
>(({ className, color = "bg-primary", ...props }, ref) => {
  return (
    <div
      ref={ref}
      data-slot="timeline-indicator"
      aria-hidden="true"
      className={cn(
        "group-data-[orientation=vertical]/timeline:-left-6 group-data-[orientation=vertical]/timeline:-translate-x-1/2 absolute rounded-full size-2 border-none group-data-[orientation=vertical]/timeline:top-1.5 transition-transform duration-200 group-hover/timeline-item:scale-125",
        color,
        className
      )}
      {...props}
    />
  );
});
TimelineIndicator.displayName = "TimelineIndicator";

export const TimelineDate = React.forwardRef<
  HTMLTimeElement,
  React.TimeHTMLAttributes<HTMLTimeElement>
>(({ className, children, ...props }, ref) => {
  return (
    <time
      ref={ref}
      data-slot="timeline-date"
      className={cn(
        "block text-muted-foreground/70 mb-0 text-[11px] font-semibold uppercase tracking-wider font-mono",
        className
      )}
      {...props}
    >
      {children}
    </time>
  );
});
TimelineDate.displayName = "TimelineDate";

export const TimelineTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, children, ...props }, ref) => {
  return (
    <h3
      ref={ref}
      data-slot="timeline-title"
      className={cn("font-medium text-sm leading-snug", className)}
      {...props}
    >
      {children}
    </h3>
  );
});
TimelineTitle.displayName = "TimelineTitle";

export const TimelineContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      data-slot="timeline-content"
      className={cn("text-foreground text-sm font-medium pt-1 space-y-1.5 min-w-0", className)}
      {...props}
    >
      {children}
    </div>
  );
});
TimelineContent.displayName = "TimelineContent";
