"use client";

import { CustomSelect } from "./CustomSelect";

type Option = { id: string | number; name: string };

/** Category-flavored wrapper around CustomSelect (id/name options + an "All" row). */
export function CategorySelect({
  value,
  onChange,
  options,
  placeholder = "All Categories",
  className = "",
}: {
  value: string;
  onChange: (v: string) => void;
  options: Option[];
  placeholder?: string;
  className?: string;
}) {
  return (
    <CustomSelect
      value={value}
      onChange={onChange}
      options={[{ value: "", label: placeholder }, ...options.map((o) => ({ value: String(o.id), label: o.name }))]}
      placeholder={placeholder}
      className={className}
    />
  );
}
