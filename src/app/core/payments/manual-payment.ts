export const PAYMENT_NUMBER = '765578379';
export const PAYMENT_NUMBER_LABEL = PAYMENT_NUMBER.replace(
  /(\d{2})(\d{3})(\d{2})(\d{2})/,
  '$1 $2 $3 $4',
);

export type PaymentMethod = 'wave' | 'orange';

export const PAYMENT_METHODS: Record<PaymentMethod, { name: string; logo: string; hint: string }> =
  {
    wave: {
      name: 'Wave',
      logo: 'assets/brand/wave.png',
      hint: 'Ouvrez Wave, touchez Envoyer, puis collez le numéro.',
    },
    orange: {
      name: 'Orange Money',
      logo: 'assets/brand/om.png',
      hint: 'Ouvrez Max it ou composez #144#, choisissez Transfert d’argent, puis collez le numéro.',
    },
  };

export const PAYMENT_METHOD_LIST = (Object.keys(PAYMENT_METHODS) as PaymentMethod[]).map((id) => ({
  id,
  ...PAYMENT_METHODS[id],
}));
