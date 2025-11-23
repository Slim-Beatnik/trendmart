import Table from 'react-bootstrap/Table';

function OrderSummary({ validation }) {
  const items = validation?.items || [];
  const subtotal = items.reduce(
    (acc, it) => acc + Number(it?.price_cents || 0) * Number(it?.quantity || 0),
    0
  );
  const shipping = validation?.shipping_cents || 0;
  const tax = validation?.tax_cents || 0;
  const total = validation?.total_cents ?? subtotal + shipping + tax;

  return (
    <div
      className="overflow-auto"
      style={{ flex: 1 }}
    >
      <Table
        hover
        responsive
        size="sm"
        className="mb-3"
      >
        <thead>
          <tr>
            <th>product</th>
            <th className="text-end">Qty</th>
            <th className="text-end">Price</th>
            <th className="text-end">Total</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it) => (
            <tr key={it.id || it.product_id}>
              <td>{it.name || it.product_name || 'item'}</td>
              <td className="text-end">{it.quantity || 0}</td>
              <td className="text-end">
                ${(Number(it.price_cents || 0) / 100).toFixed(2)}
              </td>
              <td className="text-end">
                $
                {(
                  (Number(it.price_cents || 0) * Number(it.quantity || 0)) /
                  100
                ).toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      <div className="d-flex flex-column align-items-end gap-1">
        <div>Subtotal: ${(subtotal / 100).toFixed(2)}</div>
        <div>Shipping: ${(shipping / 100).toFixed(2)}</div>
        <div>Tax: ${(tax / 100).toFixed(2)}</div>
        <div className="fw-bold">Total: ${(total / 100).toFixed(2)}</div>
      </div>
    </div>
  );
}

export default OrderSummary;
