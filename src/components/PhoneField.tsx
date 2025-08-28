"use client";

import React, { forwardRef, useState } from "react";
import PhoneInput, { type Value } from "react-phone-number-input";
import "react-phone-number-input/style.css";

interface PhoneFieldProps {
  id?: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  className?: string;
}

const StyledInput = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(function StyledInput(
  props,
  ref
) {
  const { className = "", ...rest } = props;
  return (
    <input
      ref={ref}
      {...rest}
      className={
        "w-full px-4 py-3 border border-gray-300 rounded-l-none rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors " +
        className
      }
    />
  );
});

export default function PhoneField(props: PhoneFieldProps) {
  const {
    id,
    label,
    value,
    onChange,
    placeholder = "Enter phone number",
    disabled,
    required,
    error,
    className = "",
  } = props;

  // Manage focus styling on the container for a nicer look
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-500"> *</span>}
        </label>
      )}
      <div
        className={
          `rounded-xl border ${error ? "border-red-500" : "border-gray-300"} bg-white ` +
          `${isFocused ? "ring-2 ring-purple-500 border-purple-500" : ""}`
        }
      >
        <div className="px-0">
          <PhoneInput
            id={id}
            value={(value as Value) || ""}
            onChange={(val) => onChange(val as string)}
            inputComponent={StyledInput as any}
            placeholder={placeholder}
            disabled={disabled}
            // onFocus={() => setIsFocused(true)}
            // onBlur={() => onChange(value)}
            className="w-full"
          />
        </div>
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
