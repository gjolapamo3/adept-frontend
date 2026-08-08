export const resolveOrderReference = (reference) => {
  if (reference == null) {
    return '';
  }

  if (typeof reference === 'string') {
    const trimmed = reference.trim();
    return trimmed || '';
  }

  if (typeof reference === 'object') {
    const candidate =
      reference.orderReference ||
      reference.reference ||
      reference.escrowReference ||
      reference.orderId ||
      reference.id ||
      '';

    if (typeof candidate === 'string') {
      return candidate.trim();
    }
  }

  return String(reference);
};
