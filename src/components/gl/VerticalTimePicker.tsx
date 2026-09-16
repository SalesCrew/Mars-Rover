import { useLayoutEffect, useRef, useState } from 'react';
import type { PointerEvent, UIEvent, KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import styles from './VerticalTimePicker.module.css';

const ITEM_HEIGHT = 44;
const HOURS = Array.from({ length: 24 }, (_, index) => index);
const MINUTES = Array.from({ length: 60 }, (_, index) => index);

const parseTime = (value: string): [number, number] => {
  const match = /^(\d{1,2}):(\d{1,2})$/.exec(value);
  if (match) {
    const hour = Number(match[1]);
    const minute = Number(match[2]);
    if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) return [hour, minute];
  }
  const now = new Date();
  return [now.getHours(), now.getMinutes()];
};

const twoDigits = (value: number) => String(value).padStart(2, '0');

interface WheelColumnProps {
  label: string;
  values: number[];
  selected: number;
  wheelRef: React.RefObject<HTMLDivElement | null>;
  onScrollValue: (value: number) => void;
  onChoose: (value: number) => void;
}

function WheelColumn({ label, values, selected, wheelRef, onScrollValue, onChoose }: WheelColumnProps) {
  const drag = useRef<{ pointerId: number; y: number; scrollTop: number; moved: boolean } | null>(null);
  const suppressClickUntil = useRef(0);

  const handleScroll = (event: UIEvent<HTMLDivElement>) => {
    const index = Math.max(0, Math.min(values.length - 1, Math.round(event.currentTarget.scrollTop / ITEM_HEIGHT)));
    if (values[index] !== selected) onScrollValue(values[index]);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    let next = selected;
    if (event.key === 'ArrowDown') next += 1;
    else if (event.key === 'ArrowUp') next -= 1;
    else if (event.key === 'PageDown') next += 5;
    else if (event.key === 'PageUp') next -= 5;
    else if (event.key === 'Home') next = values[0];
    else if (event.key === 'End') next = values[values.length - 1];
    else return;
    event.preventDefault();
    onChoose(Math.max(values[0], Math.min(values[values.length - 1], next)));
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== 'mouse' || event.button !== 0) return;
    drag.current = { pointerId: event.pointerId, y: event.clientY, scrollTop: event.currentTarget.scrollTop, moved: false };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!drag.current || drag.current.pointerId !== event.pointerId) return;
    if (Math.abs(drag.current.y - event.clientY) > 4) drag.current.moved = true;
    event.currentTarget.scrollTop = drag.current.scrollTop + drag.current.y - event.clientY;
  };

  const handlePointerEnd = (event: PointerEvent<HTMLDivElement>) => {
    if (drag.current?.pointerId === event.pointerId) {
      if (drag.current.moved) suppressClickUntil.current = Date.now() + 300;
      drag.current = null;
    }
  };

  return (
    <div className={styles.column}>
      <span className={styles.columnLabel}>{label}</span>
      <div className={styles.wheelFrame}>
        <div className={styles.selectionBand} aria-hidden="true" />
        <div
          ref={wheelRef}
          className={styles.wheel}
          role="spinbutton"
          tabIndex={0}
          aria-label={label}
          aria-valuemin={values[0]}
          aria-valuemax={values[values.length - 1]}
          aria-valuenow={selected}
          aria-valuetext={`${twoDigits(selected)} ${label}`}
          onScroll={handleScroll}
          onKeyDown={handleKeyDown}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerEnd}
          onPointerCancel={handlePointerEnd}
        >
          {values.map((value) => (
            <div
              key={value}
              className={`${styles.wheelItem} ${value === selected ? styles.wheelItemSelected : ''}`}
              aria-hidden="true"
              onClick={() => { if (Date.now() >= suppressClickUntil.current) onChoose(value); }}
            >
              {twoDigits(value)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface VerticalTimePickerProps {
  value: string;
  onChange: (value: string) => void;
  onClose: () => void;
  variant?: 'day' | 'extra';
}

export function VerticalTimePicker({ value, onChange, onClose, variant = 'day' }: VerticalTimePickerProps) {
  const [initialTime] = useState(() => parseTime(value));
  const [hour, setHour] = useState(initialTime[0]);
  const [minute, setMinute] = useState(initialTime[1]);
  const hourRef = useRef<HTMLDivElement>(null);
  const minuteRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (hourRef.current) hourRef.current.scrollTop = initialTime[0] * ITEM_HEIGHT;
    if (minuteRef.current) minuteRef.current.scrollTop = initialTime[1] * ITEM_HEIGHT;
    hourRef.current?.focus({ preventScroll: true });
  }, [initialTime]);

  const chooseHour = (next: number) => {
    setHour(next);
    if (hourRef.current) hourRef.current.scrollTop = next * ITEM_HEIGHT;
  };
  const chooseMinute = (next: number) => {
    setMinute(next);
    if (minuteRef.current) minuteRef.current.scrollTop = next * ITEM_HEIGHT;
  };
  const handleNow = () => {
    const now = new Date();
    chooseHour(now.getHours());
    chooseMinute(now.getMinutes());
  };

  return createPortal(
    <div className={styles.portal} onMouseDown={(event) => event.stopPropagation()}>
      <div className={styles.backdrop} onMouseDown={onClose} aria-hidden="true" />
      <div
      className={`${styles.picker} ${variant === 'extra' ? styles.extra : styles.day}`}
      role="group"
      aria-label="Uhrzeit auswählen"
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => { if (event.key === 'Escape') onClose(); }}
    >
      <div className={styles.heading}>Uhrzeit auswählen</div>
      <div className={styles.wheels}>
        <WheelColumn label="Stunden" values={HOURS} selected={hour} wheelRef={hourRef} onScrollValue={setHour} onChoose={chooseHour} />
        <span className={styles.colon} aria-hidden="true">:</span>
        <WheelColumn label="Minuten" values={MINUTES} selected={minute} wheelRef={minuteRef} onScrollValue={setMinute} onChoose={chooseMinute} />
      </div>
      <div className={styles.preview} aria-live="polite">{twoDigits(hour)}:{twoDigits(minute)}</div>
      <div className={styles.actions}>
        <button type="button" className={styles.nowButton} onClick={handleNow}>Jetzt</button>
        <button type="button" className={styles.confirmButton} onClick={() => { onChange(`${twoDigits(hour)}:${twoDigits(minute)}`); onClose(); }}>Übernehmen</button>
      </div>
      </div>
    </div>
  , document.body);
}
