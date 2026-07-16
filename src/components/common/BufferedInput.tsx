/**
 * BufferedInput / BufferedTextarea
 *
 * Drop-in replacements for Input / Textarea that keep the typed value in local
 * state and only propagate it to the parent's onChange on a short debounce, on
 * blur, and on Enter (inputs). This prevents every keystroke from updating a
 * large parent form object and re-rendering the whole form.
 *
 * While the user types continuously the debounce timer keeps resetting, so the
 * parent does not re-render mid-word; it catches up shortly after a pause or on
 * blur. This preserves live behaviour that depends on the committed value (e.g.
 * a submit button gated on form fields) while removing the per-keystroke cost.
 *
 * API-compatible with Input/Textarea: pass `value` and `onChange` as usual.
 * The parent's `onChange` receives an event whose `target.value` is the
 * committed value — handlers must read the value via `event.target.value`.
 */

import * as React from 'react';
import { Input, type InputProps } from './Input';
import { Textarea, type TextareaProps } from './Textarea';

const COMMIT_DELAY_MS = 300;

export type BufferedInputProps = InputProps;

export const BufferedInput = React.forwardRef<HTMLInputElement, BufferedInputProps>(
  ({ value, onChange, onBlur, onFocus, onKeyDown, ...rest }, ref) => {
    const external = value === undefined ? '' : String(value);
    const [local, setLocal] = React.useState(external);
    const focusedRef = React.useRef(false);
    const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
    const onChangeRef = React.useRef(onChange);
    onChangeRef.current = onChange;

    React.useEffect(() => {
      if (!focusedRef.current) setLocal(external);
    }, [external]);

    const clearTimer = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
    React.useEffect(() => clearTimer, []);

    const commit = (next: string) => {
      clearTimer();
      if (next === external) return;
      onChangeRef.current?.({
        target: { value: next },
        currentTarget: { value: next },
      } as unknown as React.ChangeEvent<HTMLInputElement>);
    };

    const handleLocalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const next = e.target.value;
      setLocal(next);
      clearTimer();
      timerRef.current = setTimeout(() => commit(next), COMMIT_DELAY_MS);
    };

    return (
      <Input
        {...rest}
        ref={ref}
        value={local}
        onChange={handleLocalChange}
        onFocus={(e) => {
          focusedRef.current = true;
          onFocus?.(e);
        }}
        onBlur={(e) => {
          focusedRef.current = false;
          commit(local);
          onBlur?.(e);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit(local);
          onKeyDown?.(e);
        }}
      />
    );
  }
);
BufferedInput.displayName = 'BufferedInput';

export type BufferedTextareaProps = TextareaProps;

export const BufferedTextarea = React.forwardRef<HTMLTextAreaElement, BufferedTextareaProps>(
  ({ value, onChange, onBlur, onFocus, ...rest }, ref) => {
    const external = value === undefined ? '' : String(value);
    const [local, setLocal] = React.useState(external);
    const focusedRef = React.useRef(false);
    const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
    const onChangeRef = React.useRef(onChange);
    onChangeRef.current = onChange;

    React.useEffect(() => {
      if (!focusedRef.current) setLocal(external);
    }, [external]);

    const clearTimer = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
    React.useEffect(() => clearTimer, []);

    const commit = (next: string) => {
      clearTimer();
      if (next === external) return;
      onChangeRef.current?.({
        target: { value: next },
        currentTarget: { value: next },
      } as unknown as React.ChangeEvent<HTMLTextAreaElement>);
    };

    const handleLocalChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const next = e.target.value;
      setLocal(next);
      clearTimer();
      timerRef.current = setTimeout(() => commit(next), COMMIT_DELAY_MS);
    };

    return (
      <Textarea
        {...rest}
        ref={ref}
        value={local}
        onChange={handleLocalChange}
        onFocus={(e) => {
          focusedRef.current = true;
          onFocus?.(e);
        }}
        onBlur={(e) => {
          focusedRef.current = false;
          commit(local);
          onBlur?.(e);
        }}
      />
    );
  }
);
BufferedTextarea.displayName = 'BufferedTextarea';
