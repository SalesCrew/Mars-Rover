export interface WavePresentation {
  goalType?: 'percentage' | 'value';
  noLimitWelle?: boolean;
  fotoOnly?: boolean;
}

// Stored prices also exist on coverage waves for exports. They must not switch
// the UI to revenue. Unlimited Zusatz-Umsatz waves are a separate revenue mode.
export const showsWaveRevenue = (wave?: WavePresentation | null): boolean =>
  !!wave &&
  !wave.fotoOnly &&
  (wave.goalType === 'value' || wave.noLimitWelle === true);
