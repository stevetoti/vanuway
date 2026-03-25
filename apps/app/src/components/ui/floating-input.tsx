import * as React from "react";
import { cn } from "@/lib/utils";

export interface FloatingInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

const FloatingInput = React.forwardRef<HTMLInputElement, FloatingInputProps>(
  ({ className, label, type, id, ...props }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false);
    const [hasValue, setHasValue] = React.useState(false);
    const inputId = id || `floating-${label.replace(/\s/g, "-").toLowerCase()}`;

    const handleFocus = () => setIsFocused(true);
    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      setHasValue(!!e.target.value);
      props.onBlur?.(e);
    };

    React.useEffect(() => {
      if (props.value) {
        setHasValue(true);
      }
    }, [props.value]);

    return (
      <div className="relative">
        <input
          type={type}
          id={inputId}
          className={cn(
            "peer flex h-12 w-full rounded-md border border-input bg-background px-3 pt-4 pb-1 text-base ring-offset-background transition-all duration-200 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0 focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            className
          )}
          ref={ref}
          placeholder={label}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...props}
        />
        <label
          htmlFor={inputId}
          className={cn(
            "absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-all duration-200 pointer-events-none",
            (isFocused || hasValue) && "top-2 text-xs translate-y-0 text-primary"
          )}
        >
          {label}
        </label>
        <div
          className={cn(
            "absolute bottom-0 left-0 h-0.5 w-0 bg-primary transition-all duration-300 origin-left",
            isFocused && "w-full"
          )}
        />
      </div>
    );
  }
);
FloatingInput.displayName = "FloatingInput";

export { FloatingInput };
