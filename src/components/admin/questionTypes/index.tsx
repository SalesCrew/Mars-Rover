import React from 'react';
import { RadioButton, ToggleRight, Barcode, CheckSquare, Camera, Table, TextT, Hash, SlidersHorizontal } from '@phosphor-icons/react';
import type { QuestionType } from '../FragebogenPage';
import type { IconProps } from '@phosphor-icons/react';

export type PhosphorIcon = React.ForwardRefExoticComponent<IconProps & React.RefAttributes<SVGSVGElement>>;

export interface QuestionTypeConfig {
  label: string;
  icon: PhosphorIcon;
  color: string;
  requiresOptions: boolean;
  description: string;
}

export const QUESTION_TYPES: Record<QuestionType, QuestionTypeConfig> = {
  single_choice: {
    label: 'Single Choice',
    icon: RadioButton,
    color: '#3B82F6',
    requiresOptions: true,
    description: 'Nur eine Antwortoption kann angegeben werden',
  },
  yesno: {
    label: 'Ja/Nein',
    icon: ToggleRight,
    color: '#10B981',
    requiresOptions: false,
    description: 'Dichotome Ja/Nein Frage',
  },
  likert: {
    label: 'Likert-Skala',
    icon: Barcode,
    color: '#8B5CF6',
    requiresOptions: false,
    description: 'Bewertungsskala (z.B. Sehr schlecht bis Sehr gut)',
  },
  multiple_choice: {
    label: 'Multiple Choice',
    icon: CheckSquare,
    color: '#EC4899',
    requiresOptions: true,
    description: 'Mehrere Antwortoptionen können angegeben werden',
  },
  photo_upload: {
    label: 'Foto hochladen',
    icon: Camera,
    color: '#F59E0B',
    requiresOptions: false,
    description: 'Foto hochladen mit Anweisung',
  },
  matrix: {
    label: 'Matrix',
    icon: Table,
    color: '#EF4444',
    requiresOptions: false,
    description: 'Fragezeilen mit gleichen Antwortspalten',
  },
  open_text: {
    label: 'Offene Frage',
    icon: TextT,
    color: '#6366F1',
    requiresOptions: false,
    description: 'Freitextantwort',
  },
  open_numeric: {
    label: 'Numerisch',
    icon: Hash,
    color: '#14B8A6',
    requiresOptions: false,
    description: 'Offene Frage mit numerischer Eingabe',
  },
  slider: {
    label: 'Slider',
    icon: SlidersHorizontal,
    color: '#06B6D4',
    requiresOptions: false,
    description: 'Slider für Anteile',
  },
  barcode_scanner: {
    label: 'Barcode Scanner',
    icon: Barcode,
    color: '#84CC16',
    requiresOptions: false,
    description: 'Barcode/QR-Code Scanner',
  },
};

export const getQuestionTypeLabel = (type: QuestionType): string => {
  return QUESTION_TYPES[type]?.label || type;
};

export const getQuestionTypeColor = (type: QuestionType): string => {
  return QUESTION_TYPES[type]?.color || '#6B7280';
};

export const getQuestionTypeIcon = (type: QuestionType): PhosphorIcon => {
  return QUESTION_TYPES[type]?.icon || TextT;
};

