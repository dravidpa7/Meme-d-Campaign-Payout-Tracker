import { useId } from "react";

type FieldProps = {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  autoComplete?: string;
  error?: string;
  hint?: string;
};

export function Field({
  label,
  name,
  type = "text",
  placeholder,
  required = false,
  autoComplete,
  error,
  hint,
}: FieldProps) {
  const generatedId = useId();
  const id = `${name}-${generatedId.replace(/:/g, "")}`;
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;

  return (
    <div className="md-field">
      <label className="md-label" htmlFor={id}>
        {label}
        {required ? <span aria-hidden="true"> *</span> : null}
      </label>
      <input
        id={id}
        className="md-input"
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
        autoComplete={autoComplete}
        min={type === "number" ? 1 : undefined}
        step={type === "number" ? 1 : undefined}
        aria-invalid={Boolean(error)}
        aria-describedby={[hintId, errorId].filter(Boolean).join(" ") || undefined}
      />
      {hint ? <span className="md-hint" id={hintId}>{hint}</span> : null}
      {error ? <span className="md-error" id={errorId}>{error}</span> : null}
    </div>
  );
}
