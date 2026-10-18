import type { InputHTMLAttributes } from 'react';

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string[];
}

export function Field({ label, error, id, name, ...rest }: Props) {
  const fieldId = id ?? name;
  return (
    <label htmlFor={fieldId} className="flex flex-col gap-1 text-sm">
      {label}
      <input id={fieldId} name={name} className="rounded border px-3 py-2" {...rest} />
      {error?.[0] && <span role="alert" className="text-red-600">{error[0]}</span>}
    </label>
  );
}