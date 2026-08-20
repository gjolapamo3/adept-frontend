import { useEffect, useMemo, useState } from 'react';
import './PricingDashboard.css';

const initialTickers = [
  {
    symbol: 'UREA',
    label: 'Urea',
    price: 392,
    change: 1.82,
    producer: 'MOPCO',
    verified: true,
  },
  {
    symbol: 'AMM',
    label: 'Ammonia',
    price: 518,
    change: 0.94,
    producer: 'Orascom',
    verified: true,
  },
  {
    symbol: 'NPK',
    label: 'NPK 20-20-20',
    price: 441,
    change: -0.61,
    producer: 'Notore',
    verified: true,
  },
];

const productOptions = [
  { value: 'urea', label: 'Urea', price: 392 },
  { value: 'ammonia', label: 'Ammonia', price: 518 },
  { value: 'npk', label: 'NPK 20-20-20', price: 441 },
];

const freightOptions = [
  { value: 'port', label: 'Port handoff', amount: 42 },
  { value: 'inland', label: 'Inland haul', amount: 86 },
  { value: 'priority', label: 'Priority export', amount: 124 },
];

export default function PricingDashboard({ onOpenShipmentTracking }) {
  const [tickers, setTickers] = useState(initialTickers);
  const [selectedProduct, setSelectedProduct] = useState(productOptions[0].value);
  const [quantity, setQuantity] = useState(25);
  const [freight, setFreight] = useState('inland');
  const [escrowEnabled, setEscrowEnabled] = useState(true);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setTickers((current) =>
        current.map((item) => {
          const drift = (Math.random() - 0.5) * 6;
          const nextPrice = Number((item.price + drift).toFixed(2));
          const nextChange = Number((item.change + (Math.random() > 0.5 ? 0.1 : -0.1)).toFixed(2));

          return {
            ...item,
            price: nextPrice,
            change: nextChange,
          };
        })
      );
    }, 4000);

    return () => window.clearInterval(timer);
  }, []);

  const selectedProductMeta = useMemo(
    () => productOptions.find((product) => product.value === selectedProduct) || productOptions[0],
    [selectedProduct]
  );

  const freightMeta = useMemo(
    () => freightOptions.find((option) => option.value === freight) || freightOptions[0],
    [freight]
  );

  const orderSummary = useMemo(() => {
    const productCost = Number((selectedProductMeta.price * quantity).toFixed(2));
    const freightCost = freightMeta.amount;
    const escrowFee = escrowEnabled ? Number((productCost * 0.015).toFixed(2)) : 0;
    const total = Number((productCost + freightCost + escrowFee).toFixed(2));

    return { productCost, freightCost, escrowFee, total };
  }, [escrowEnabled, freightMeta.amount, quantity, selectedProductMeta.price]);

  const handleTrack = () => {
    const producerByProduct = {
      urea: 'MOPCO',
      ammonia: 'Orascom',
      npk: 'Notore',
    };

    const payload = {
      orderId: `ADEPT-REF-${Date.now().toString().slice(-6)}`,
      item: selectedProductMeta.label,
      quantity,
      total: orderSummary.total,
      supplier: producerByProduct[selectedProduct] || 'Primary Producer',
    };

    onOpenShipmentTracking?.(payload);
  };

  const handleShareQuote = () => {
    const text = encodeURIComponent(
      `Hi, I want to request ${quantity} metric tons of ${selectedProductMeta.label}. Estimated total: $${orderSummary.total.toLocaleString()}. Please confirm availability and next steps.`
    );

    window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener,noreferrer');
  };

  const marketStats = [
    { label: 'Verified suppliers', value: '03', detail: 'Active allocation' },
    { label: 'Avg. freight', value: '$86', detail: 'Across lanes' },
    { label: 'Escrow protection', value: '1.5%', detail: 'Policy cover' },
    { label: 'Lead time', value: '14d', detail: 'Avg. fulfillment' },
  ];

  return (
    <section className="pricing-dashboard">
      <div className="pricing-dashboard__hero">
        <div className="pricing-dashboard__hero-copy">
          <p className="pricing-dashboard__eyebrow">Enterprise Pricing Desk</p>
          <h1>Live procurement pricing for strategic fertilizer and chemical supply</h1>
          <p>
            Review verified producer offers, calculate landed order costs, and route directly into shipment tracking.
          </p>
        </div>
        <div className="pricing-dashboard__hero-actions">
          <div className="pricing-dashboard__hero-badge">
            <span className="pricing-dashboard__dot" />
            Live market access
          </div>
          <button type="button" className="pricing-dashboard__spotlight-button">
            Get Quote
          </button>
        </div>
      </div>

      <div className="pricing-dashboard__stats">
        {marketStats.map((stat) => (
          <div key={stat.label} className="pricing-dashboard__stat-card">
            <span>{stat.label}</span>
            <strong>{stat.value}</strong>
            <small>{stat.detail}</small>
          </div>
        ))}
      </div>

      <div className="pricing-dashboard__ticker-grid">
        {tickers.map((ticker) => (
          <article key={ticker.symbol} className="pricing-dashboard__ticker-card">
            <div className="pricing-dashboard__ticker-head">
              <div>
                <p className="pricing-dashboard__ticker-symbol">{ticker.symbol}</p>
                <h3>{ticker.label}</h3>
              </div>
              {ticker.verified ? (
                <span className="pricing-dashboard__verified">Verified Producer</span>
              ) : null}
            </div>
            <div className="pricing-dashboard__ticker-price-row">
              <strong>${ticker.price.toFixed(2)}</strong>
              <span className={ticker.change >= 0 ? 'pricing-dashboard__change positive' : 'pricing-dashboard__change negative'}>
                {ticker.change >= 0 ? '+' : ''}{ticker.change.toFixed(2)}%
              </span>
            </div>
            <p className="pricing-dashboard__producer">Primary source: {ticker.producer}</p>
          </article>
        ))}
      </div>

      <div className="pricing-dashboard__content-grid">
        <div className="pricing-dashboard__panel">
          <div className="pricing-dashboard__panel-header">
            <div>
              <p className="pricing-dashboard__eyebrow">Verified supply lanes</p>
              <h2>Primary producer availability</h2>
            </div>
          </div>

          <div className="pricing-dashboard__producer-list">
            <div className="pricing-dashboard__producer-item">
              <div>
                <strong>MOPCO</strong>
                <p>Urea export allocation • 14-day lead time</p>
              </div>
              <span className="pricing-dashboard__pill">Primary Producer</span>
            </div>
            <div className="pricing-dashboard__producer-item">
              <div>
                <strong>Orascom</strong>
                <p>Ammonia FOB confirmed • Port clearance included</p>
              </div>
              <span className="pricing-dashboard__pill">Primary Producer</span>
            </div>
            <div className="pricing-dashboard__producer-item">
              <div>
                <strong>Notore</strong>
                <p>NPK blend • 8-ton lot minimum</p>
              </div>
              <span className="pricing-dashboard__pill">Primary Producer</span>
            </div>
          </div>
        </div>

        <div className="pricing-dashboard__panel">
          <div className="pricing-dashboard__panel-header">
            <div>
              <p className="pricing-dashboard__eyebrow">Order calculator</p>
              <h2>Product + Freight + Escrow</h2>
            </div>
          </div>

          <label className="pricing-dashboard__field">
            <span>Product</span>
            <select value={selectedProduct} onChange={(event) => setSelectedProduct(event.target.value)}>
              {productOptions.map((product) => (
                <option key={product.value} value={product.value}>
                  {product.label}
                </option>
              ))}
            </select>
          </label>

          <label className="pricing-dashboard__field">
            <span>Quantity (metric tons)</span>
            <input
              type="number"
              min="1"
              step="1"
              value={quantity}
              onChange={(event) => setQuantity(Number(event.target.value))}
            />
          </label>

          <label className="pricing-dashboard__field">
            <span>Freight lane</span>
            <select value={freight} onChange={(event) => setFreight(event.target.value)}>
              {freightOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="pricing-dashboard__checkbox-row">
            <input type="checkbox" checked={escrowEnabled} onChange={() => setEscrowEnabled((value) => !value)} />
            <span>Protect with escrow</span>
          </label>

          <div className="pricing-dashboard__calc-lines">
            <div className="pricing-dashboard__calc-line">
              <span>Product</span>
              <strong>${orderSummary.productCost.toLocaleString()}</strong>
            </div>
            <div className="pricing-dashboard__calc-line">
              <span>Freight</span>
              <strong>${orderSummary.freightCost.toLocaleString()}</strong>
            </div>
            <div className="pricing-dashboard__calc-line">
              <span>Escrow</span>
              <strong>${orderSummary.escrowFee.toLocaleString()}</strong>
            </div>
            <div className="pricing-dashboard__calc-line pricing-dashboard__calc-line--total">
              <span>Total</span>
              <strong>${orderSummary.total.toLocaleString()}</strong>
            </div>
          </div>

          <div className="pricing-dashboard__action-stack">
            <button type="button" className="pricing-dashboard__secondary-button" onClick={handleShareQuote}>
              Share on WhatsApp
            </button>
            <button type="button" className="pricing-dashboard__track-button" onClick={handleTrack}>
              Track My Order
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
