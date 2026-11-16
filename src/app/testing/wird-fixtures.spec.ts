import { Wird, WIRD_SEED } from '../core/wird-store';
export const TEST_WIRDS: Wird[] = [
  {
    id: 'salat-nabi',
    title: 'Salat ala Nabi',
    recurrence: 'Chaque vendredi',
    visibility: 'public',
    target: 1000,
    completed: 600,
  },
  {
    id: 'salat-fatihi',
    title: '1 000 Salatoul Fatihi',
    recurrence: 'Tous les jours',
    visibility: 'public',
    target: 1000,
    completed: 600,
  },
];

export const WIRD_TEST_PROVIDER = { provide: WIRD_SEED, useValue: TEST_WIRDS };
