import { useCallback, useEffect, useRef, useState } from 'react';

const CONNECTION_STATUS = {
  IDLE: 'idle',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  RECONNECTING: 'reconnecting',
  DISCONNECTED: 'disconnected',
  ERROR: 'error',
};

const UPDATE_EVENT_HINTS = ['created', 'updated', 'changed', 'sync'];
const DELETE_EVENT_HINTS = ['deleted', 'removed'];

function defaultBaseUrl() {
  const envUrl =
    import.meta.env.VITE_BACKEND_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    'http://localhost:5000/api';

  return envUrl.endsWith('/') ? envUrl.slice(0, -1) : envUrl;
}

function toUrl(pathOrUrl) {
  if (!pathOrUrl) {
    return `${defaultBaseUrl()}/marketplace/events`;
  }

  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) {
    return pathOrUrl;
  }

  const normalizedPath = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`;
  return `${defaultBaseUrl()}${normalizedPath}`;
}

function parseEventData(raw) {
  if (!raw || typeof raw !== 'string') {
    return null;
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }

  if (!parsed || typeof parsed !== 'object') {
    return null;
  }

  const payload = parsed.payload || parsed.data || parsed.product || {};
  const type =
    parsed.type || parsed.eventType || parsed.event || payload.type || 'unknown';

  const productId =
    payload.id ||
    payload.productId ||
    parsed.productId ||
    parsed.id ||
    null;

  return {
    id: parsed.id || payload.eventId || null,
    type,
    payload,
    productId,
    timestamp: parsed.timestamp || payload.timestamp || new Date().toISOString(),
    raw: parsed,
  };
}

function resolveProductId(candidate, fallbackId) {
  if (candidate?.id != null) {
    return candidate.id;
  }

  if (candidate?.productId != null) {
    return candidate.productId;
  }

  return fallbackId;
}

function upsertProduct(products, event) {
  const payload = event.payload || {};
  const productId = resolveProductId(payload, event.productId);

  if (productId == null) {
    return products;
  }

  const index = products.findIndex((item) => String(item.id) === String(productId));
  const normalizedPayload = {
    ...payload,
    id: productId,
  };

  if (index === -1) {
    return [...products, normalizedPayload];
  }

  const next = [...products];
  next[index] = {
    ...next[index],
    ...normalizedPayload,
  };
  return next;
}

function removeProduct(products, event) {
  const payload = event.payload || {};
  const productId = resolveProductId(payload, event.productId);

  if (productId == null) {
    return products;
  }

  return products.filter((item) => String(item.id) !== String(productId));
}

function applyPriceUpdate(products, event) {
  const payload = event.payload || {};
  const productId = resolveProductId(payload, event.productId);

  if (productId == null) {
    return products;
  }

  return products.map((item) => {
    if (String(item.id) !== String(productId)) {
      return item;
    }

    return {
      ...item,
      ...(payload.pricePerTon != null ? { pricePerTon: payload.pricePerTon } : {}),
      ...(payload.currency ? { currency: payload.currency } : {}),
      ...(payload.price != null ? { price: payload.price } : {}),
      ...(payload.unitPrice != null ? { unitPrice: payload.unitPrice } : {}),
      ...(payload.previousPricePerTon != null
        ? { previousPricePerTon: payload.previousPricePerTon }
        : {}),
      ...(event.timestamp ? { lastPriceUpdateAt: event.timestamp } : {}),
    };
  });
}

function applyInventoryUpdate(products, event) {
  const payload = event.payload || {};
  const productId = resolveProductId(payload, event.productId);

  if (productId == null) {
    return products;
  }

  return products.map((item) => {
    if (String(item.id) !== String(productId)) {
      return item;
    }

    return {
      ...item,
      ...(payload.stockTonnage != null ? { stockTonnage: payload.stockTonnage } : {}),
      ...(payload.inventoryTons != null ? { inventoryTons: payload.inventoryTons } : {}),
      ...(payload.availableQuantity != null
        ? { availableQuantity: payload.availableQuantity }
        : {}),
      ...(payload.quantity != null ? { quantity: payload.quantity } : {}),
      ...(payload.status ? { status: payload.status } : {}),
      ...(event.timestamp ? { lastInventoryUpdateAt: event.timestamp } : {}),
    };
  });
}

function applyMarketplaceEvent(products, event) {
  if (!event) {
    return products;
  }

  const eventType = String(event.type || '').toLowerCase();

  if (eventType.includes('heartbeat') || eventType.includes('ping')) {
    return products;
  }

  if (eventType.includes('price')) {
    return applyPriceUpdate(products, event);
  }

  if (eventType.includes('inventory') || eventType.includes('stock')) {
    return applyInventoryUpdate(products, event);
  }

  if (DELETE_EVENT_HINTS.some((hint) => eventType.includes(hint))) {
    return removeProduct(products, event);
  }

  if (UPDATE_EVENT_HINTS.some((hint) => eventType.includes(hint))) {
    return upsertProduct(products, event);
  }

  return products;
}

function computeReconnectDelay(attempt, baseDelay, maxDelay) {
  const exponential = baseDelay * Math.pow(2, Math.max(0, attempt - 1));
  const jitter = Math.floor(Math.random() * 250);
  return Math.min(maxDelay, exponential + jitter);
}

function resolveHookArgs(initialProductsOrUrl, options) {
  if (typeof initialProductsOrUrl === 'string') {
    return {
      initialProducts: Array.isArray(options.initialProducts) ? options.initialProducts : [],
      eventSourceUrl: initialProductsOrUrl,
    };
  }

  return {
    initialProducts: Array.isArray(initialProductsOrUrl) ? initialProductsOrUrl : [],
    eventSourceUrl: options.eventSourceUrl,
  };
}

function buildStockChangePayload(event) {
  const payload = event?.payload || {};
  return {
    productId: payload.productId ?? payload.id ?? event?.productId,
    newStockTons:
      payload.newStockTons ??
      payload.stockTonnage ??
      payload.inventoryTons ??
      payload.availableQuantity ??
      payload.quantity ??
      null,
    raw: payload,
  };
}

function buildPriceChangePayload(event) {
  const payload = event?.payload || {};
  return {
    productId: payload.productId ?? payload.id ?? event?.productId,
    newPricePerTon:
      payload.newPricePerTon ??
      payload.pricePerTon ??
      payload.unitPrice ??
      payload.price ??
      null,
    currency: payload.currency,
    raw: payload,
  };
}

/**
 * useMarketplaceEvents
 * Real-time products, inventory, and pricing updates via SSE with resilient reconnects.
 */
export function useMarketplaceEvents(initialProductsOrUrl = [], options = {}) {
  const { initialProducts, eventSourceUrl: resolvedEventSourceUrl } = resolveHookArgs(
    initialProductsOrUrl,
    options
  );

  const {
    enabled = true,
    withCredentials = false,
    reconnectBaseDelay = 1000,
    reconnectMaxDelay = 30000,
    maxReconnectAttempts = Infinity,
    parser = parseEventData,
    onStockChange,
    onPriceChange,
    onEvent,
    onError,
  } = options;

  const [products, setProducts] = useState(() => [...initialProducts]);
  const [connectionStatus, setConnectionStatus] = useState(CONNECTION_STATUS.IDLE);
  const [error, setError] = useState(null);
  const [reconnectAttempt, setReconnectAttempt] = useState(0);
  const [lastEvent, setLastEvent] = useState(null);
  const [lastEventAt, setLastEventAt] = useState(null);
  const [connectedAt, setConnectedAt] = useState(null);

  const eventSourceRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const reconnectAttemptRef = useRef(0);
  const manualCloseRef = useRef(false);
  const mountedRef = useRef(true);

  const clearReconnectTimer = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
  }, []);

  const closeEventSource = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  }, []);

  const connect = useCallback(() => {
    if (!enabled) {
      return;
    }

    clearReconnectTimer();
    closeEventSource();

    const url = toUrl(resolvedEventSourceUrl);
    const nextAttempt = reconnectAttemptRef.current;
    setConnectionStatus(
      nextAttempt > 0 ? CONNECTION_STATUS.RECONNECTING : CONNECTION_STATUS.CONNECTING
    );

    const source = new EventSource(url, { withCredentials });
    eventSourceRef.current = source;

    source.onopen = () => {
      if (!mountedRef.current) {
        return;
      }

      reconnectAttemptRef.current = 0;
      setReconnectAttempt(0);
      setError(null);
      setConnectedAt(new Date().toISOString());
      setConnectionStatus(CONNECTION_STATUS.CONNECTED);
    };

    source.onmessage = (message) => {
      if (!mountedRef.current) {
        return;
      }

      const parsedEvent = parser(message.data);
      if (!parsedEvent) {
        return;
      }

      setLastEvent(parsedEvent);
      setLastEventAt(new Date().toISOString());
      setProducts((previous) => applyMarketplaceEvent(previous, parsedEvent));

      const eventType = String(parsedEvent.type || '').toLowerCase();

      if (eventType.includes('price') && onPriceChange) {
        onPriceChange(buildPriceChangePayload(parsedEvent));
      }

      if ((eventType.includes('inventory') || eventType.includes('stock')) && onStockChange) {
        onStockChange(buildStockChangePayload(parsedEvent));
      }

      if (onEvent) {
        onEvent(parsedEvent);
      }
    };

    source.onerror = (event) => {
      if (!mountedRef.current) {
        return;
      }

      closeEventSource();

      if (manualCloseRef.current || !enabled) {
        setConnectionStatus(CONNECTION_STATUS.DISCONNECTED);
        return;
      }

      const nextReconnectAttempt = reconnectAttemptRef.current + 1;
      reconnectAttemptRef.current = nextReconnectAttempt;
      setReconnectAttempt(nextReconnectAttempt);

      if (nextReconnectAttempt > maxReconnectAttempts) {
        setConnectionStatus(CONNECTION_STATUS.ERROR);
        setError('Unable to reconnect to marketplace updates.');

        if (onError) {
          onError(event);
        }
        return;
      }

      const delay = computeReconnectDelay(
        nextReconnectAttempt,
        reconnectBaseDelay,
        reconnectMaxDelay
      );

      setConnectionStatus(CONNECTION_STATUS.RECONNECTING);
      setError(`Connection lost. Reconnecting in ${Math.ceil(delay / 1000)}s...`);

      if (onError) {
        onError(event);
      }

      reconnectTimerRef.current = setTimeout(() => {
        connect();
      }, delay);
    };
  }, [
    clearReconnectTimer,
    closeEventSource,
    enabled,
    maxReconnectAttempts,
    onError,
    onPriceChange,
    onStockChange,
    onEvent,
    parser,
    reconnectBaseDelay,
    reconnectMaxDelay,
    resolvedEventSourceUrl,
    withCredentials,
  ]);

  const disconnect = useCallback(() => {
    manualCloseRef.current = true;
    clearReconnectTimer();
    closeEventSource();
    setConnectionStatus(CONNECTION_STATUS.DISCONNECTED);
  }, [clearReconnectTimer, closeEventSource]);

  const reconnect = useCallback(() => {
    manualCloseRef.current = false;
    reconnectAttemptRef.current = 0;
    setReconnectAttempt(0);
    setError(null);
    connect();
  }, [connect]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    setProducts([...initialProducts]);
  }, [initialProducts]);

  useEffect(() => {
    manualCloseRef.current = false;

    if (!enabled) {
      disconnect();
      return undefined;
    }

    connect();

    return () => {
      clearReconnectTimer();
      closeEventSource();
    };
  }, [enabled, connect, disconnect, clearReconnectTimer, closeEventSource]);

  return {
    products,
    setProducts,
    connectionStatus,
    isConnected: connectionStatus === CONNECTION_STATUS.CONNECTED,
    error,
    reconnectAttempt,
    lastEvent,
    lastEventAt,
    connectedAt,
    reconnect,
    disconnect,
  };
}

export default useMarketplaceEvents;
