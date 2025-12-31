import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  HelpCircle,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  Lightbulb,
  X,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";

type TooltipMode = "hover" | "click" | "blocking";
type TooltipType = "info" | "warning" | "success" | "error" | "tip";

interface ContextualTooltipProps {
  tooltipKey: string;
  title: string;
  content: React.ReactNode;
  whyMatters?: string;
  howToFix?: string;
  mode?: TooltipMode;
  type?: TooltipType;
  dismissable?: boolean;
  showOnce?: boolean;
  children?: React.ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  className?: string;
  triggerClassName?: string;
  onDismiss?: () => void;
  onAcknowledge?: () => void;
  forceShow?: boolean;
}

const typeConfig: Record<
  TooltipType,
  { icon: typeof Info; bgColor: string; borderColor: string; iconColor: string }
> = {
  info: {
    icon: Info,
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
    borderColor: "border-blue-200 dark:border-blue-800",
    iconColor: "text-blue-500",
  },
  warning: {
    icon: AlertTriangle,
    bgColor: "bg-amber-50 dark:bg-amber-950/30",
    borderColor: "border-amber-200 dark:border-amber-800",
    iconColor: "text-amber-500",
  },
  success: {
    icon: CheckCircle,
    bgColor: "bg-green-50 dark:bg-green-950/30",
    borderColor: "border-green-200 dark:border-green-800",
    iconColor: "text-green-500",
  },
  error: {
    icon: XCircle,
    bgColor: "bg-red-50 dark:bg-red-950/30",
    borderColor: "border-red-200 dark:border-red-800",
    iconColor: "text-red-500",
  },
  tip: {
    icon: Lightbulb,
    bgColor: "bg-purple-50 dark:bg-purple-950/30",
    borderColor: "border-purple-200 dark:border-purple-800",
    iconColor: "text-purple-500",
  },
};

export function ContextualTooltip({
  tooltipKey,
  title,
  content,
  whyMatters,
  howToFix,
  mode = "hover",
  type = "info",
  dismissable = true,
  showOnce = false,
  children,
  side = "right",
  className,
  triggerClassName,
  onDismiss,
  onAcknowledge,
  forceShow = false,
}: ContextualTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const queryClient = useQueryClient();

  const config = typeConfig[type];
  const Icon = config.icon;

  const { data: dismissedTooltips } = useQuery<string[]>({
    queryKey: ["/api/tooltips/dismissed"],
    enabled: showOnce || dismissable,
  });

  const dismissMutation = useMutation({
    mutationFn: async (key: string) => {
      const response = await apiRequest("POST", "/api/tooltips/dismiss", { tooltipKey: key });
      if (!response.ok) throw new Error("Failed to dismiss tooltip");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tooltips/dismissed"] });
    },
  });

  const isDismissed = dismissedTooltips?.includes(tooltipKey);

  useEffect(() => {
    if (showOnce && !isDismissed && !forceShow) {
      setIsOpen(true);
    }
  }, [showOnce, isDismissed, forceShow]);

  const handleDismiss = () => {
    if (dontShowAgain || dismissable) {
      dismissMutation.mutate(tooltipKey);
    }
    setIsOpen(false);
    onDismiss?.();
  };

  const handleAcknowledge = () => {
    if (dontShowAgain) {
      dismissMutation.mutate(tooltipKey);
    }
    setIsOpen(false);
    onAcknowledge?.();
  };

  if (isDismissed && !forceShow) {
    return <>{children}</>;
  }

  if (mode === "blocking") {
    return (
      <>
        {children}
        <Dialog open={isOpen || forceShow} onOpenChange={setIsOpen}>
          <DialogContent
            className={cn("sm:max-w-md", config.bgColor, config.borderColor)}
            data-testid={`tooltip-modal-${tooltipKey}`}
          >
            <DialogHeader>
              <div className="flex items-center gap-2">
                <Icon className={cn("h-5 w-5", config.iconColor)} />
                <DialogTitle>{title}</DialogTitle>
              </div>
              <DialogDescription className="pt-2 text-left">
                {content}
              </DialogDescription>
            </DialogHeader>

            {(whyMatters || howToFix) && (
              <div className="space-y-3 pt-2">
                {whyMatters && (
                  <div className="rounded-lg border bg-white/50 p-3 dark:bg-black/20">
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      Por que isso importa?
                    </p>
                    <p className="text-sm">{whyMatters}</p>
                  </div>
                )}
                {howToFix && (
                  <div className="rounded-lg border bg-white/50 p-3 dark:bg-black/20">
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      O que fazer?
                    </p>
                    <p className="text-sm">{howToFix}</p>
                  </div>
                )}
              </div>
            )}

            <DialogFooter className="flex-col sm:flex-row gap-2 pt-4">
              {dismissable && (
                <div className="flex items-center space-x-2 mr-auto">
                  <Checkbox
                    id={`dont-show-${tooltipKey}`}
                    checked={dontShowAgain}
                    onCheckedChange={(checked) =>
                      setDontShowAgain(checked === true)
                    }
                    data-testid={`checkbox-dont-show-${tooltipKey}`}
                  />
                  <label
                    htmlFor={`dont-show-${tooltipKey}`}
                    className="text-xs text-muted-foreground cursor-pointer"
                  >
                    Não mostrar novamente
                  </label>
                </div>
              )}
              <Button
                onClick={handleAcknowledge}
                data-testid={`button-acknowledge-${tooltipKey}`}
              >
                Entendido
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  const tooltipContent = (
    <div className={cn("max-w-xs space-y-2", className)}>
      <div className="flex items-start gap-2">
        <Icon className={cn("h-4 w-4 mt-0.5 shrink-0", config.iconColor)} />
        <div>
          <p className="font-medium text-sm">{title}</p>
          <div className="text-xs text-muted-foreground mt-1">{content}</div>
        </div>
      </div>

      {whyMatters && (
        <div className="pl-6 border-l-2 border-current/20 text-xs">
          <span className="font-medium">Por quê? </span>
          {whyMatters}
        </div>
      )}

      {howToFix && (
        <div className="pl-6 border-l-2 border-green-400/50 text-xs">
          <span className="font-medium text-green-600">Ação: </span>
          {howToFix}
        </div>
      )}

      {dismissable && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleDismiss();
          }}
          className="absolute top-1 right-1 p-1 hover:bg-black/10 rounded-full"
          data-testid={`button-dismiss-${tooltipKey}`}
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );

  if (mode === "click") {
    return (
      <TooltipProvider>
        <Tooltip open={isOpen} onOpenChange={setIsOpen}>
          <TooltipTrigger asChild onClick={() => setIsOpen(!isOpen)}>
            <span className={cn("cursor-pointer inline-flex", triggerClassName)}>
              {children || (
                <HelpCircle
                  className={cn("h-4 w-4", config.iconColor)}
                  data-testid={`tooltip-trigger-${tooltipKey}`}
                />
              )}
            </span>
          </TooltipTrigger>
          <TooltipContent
            side={side}
            className={cn("relative p-3", config.bgColor, config.borderColor)}
          >
            {tooltipContent}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <span className={cn("inline-flex", triggerClassName)}>
            {children || (
              <HelpCircle
                className={cn("h-4 w-4 cursor-help", config.iconColor)}
                data-testid={`tooltip-trigger-${tooltipKey}`}
              />
            )}
          </span>
        </TooltipTrigger>
        <TooltipContent
          side={side}
          className={cn("relative p-3", config.bgColor, config.borderColor)}
        >
          {tooltipContent}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function FirstTimeTooltip({
  tooltipKey,
  title,
  content,
  whyMatters,
  children,
}: {
  tooltipKey: string;
  title: string;
  content: React.ReactNode;
  whyMatters?: string;
  children: React.ReactNode;
}) {
  return (
    <ContextualTooltip
      tooltipKey={tooltipKey}
      title={title}
      content={content}
      whyMatters={whyMatters}
      mode="blocking"
      type="tip"
      showOnce
      dismissable
    >
      {children}
    </ContextualTooltip>
  );
}

export function WarningTooltip({
  tooltipKey,
  title,
  content,
  howToFix,
  children,
}: {
  tooltipKey: string;
  title: string;
  content: React.ReactNode;
  howToFix?: string;
  children?: React.ReactNode;
}) {
  return (
    <ContextualTooltip
      tooltipKey={tooltipKey}
      title={title}
      content={content}
      howToFix={howToFix}
      mode="hover"
      type="warning"
    >
      {children}
    </ContextualTooltip>
  );
}

export function ActionBlocker({
  tooltipKey,
  title,
  content,
  whyMatters,
  howToFix,
  onAcknowledge,
  children,
}: {
  tooltipKey: string;
  title: string;
  content: React.ReactNode;
  whyMatters?: string;
  howToFix?: string;
  onAcknowledge?: () => void;
  children: React.ReactNode;
}) {
  const [showBlocker, setShowBlocker] = useState(false);

  return (
    <>
      <span
        onClick={() => setShowBlocker(true)}
        className="cursor-pointer"
        data-testid={`action-blocker-trigger-${tooltipKey}`}
      >
        {children}
      </span>
      <ContextualTooltip
        tooltipKey={tooltipKey}
        title={title}
        content={content}
        whyMatters={whyMatters}
        howToFix={howToFix}
        mode="blocking"
        type="warning"
        forceShow={showBlocker}
        onAcknowledge={() => {
          setShowBlocker(false);
          onAcknowledge?.();
        }}
        onDismiss={() => setShowBlocker(false)}
      >
        <></>
      </ContextualTooltip>
    </>
  );
}
