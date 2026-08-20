export const resolveOrderReference = (reference) => {
  if (reference == null) {
    return '';
  }

  if (typeof reference === 'string') {
    const trimmed = reference.trim();
    if (!trimmed) {
      return '';
    }

    return trimmed.replace(/^EPT-REF-/i, 'ADEPT-REF-');
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
      return candidate.trim().replace(/^EPT-REF-/i, 'ADEPT-REF-');
    }
  }

  return String(reference);
};
