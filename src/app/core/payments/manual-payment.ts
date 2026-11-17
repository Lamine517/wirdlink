export type PaymentMethod = 'wave' | 'orange';

export const PAYMENT_METHODS: Record<PaymentMethod, { name: string; logo: string; hint: string }> = {
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

export function formatPaymentNumber(number: string): string {
  return number.replace(/^(\d{2})(\d{3})(\d{2})(\d{2})$/, '$1 $2 $3 $4');
}
