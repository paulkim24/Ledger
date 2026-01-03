import { useEffect, useState } from 'react';
import { API_BASE } from './api';

type Account = {
  id: number;
  name: string;
  type: 'user' | 'merchant';
};

type Payment = {
  id: number;
  from_account_id: number;
  to_account_id: number;
  amount_cents: number;
  currency: string;
  created_at: string;
  from_name: string;
  to_name: string;
};

function App() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);

  // load accounts on mount
  useEffect(() => {
    fetch(`${API_BASE}/accounts`)
      .then((res) => res.json())
      .then(setAccounts);
  }, []);

  // when selected account changes, load balance + payments
  useEffect(() => {
    if (!selectedId) return;
    setLoading(true);
    Promise.all([
      fetch(`${API_BASE}/accounts/${selectedId}/balance`).then((r) => r.json()),
      fetch(`${API_BASE}/accounts/${selectedId}/payments`).then((r) => r.json()),
    ])
      .then(([bal, pays]) => {
        setBalance(bal.balance_cents);
        setPayments(pays);
      })
      .finally(() => setLoading(false));
  }, [selectedId]);

  const createDemoPayment = async () => {
    if (accounts.length < 2) return alert('Create at least two accounts via API first.');
    const from = accounts[0];
    const to = accounts[1];

    await fetch(`${API_BASE}/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fromAccountId: from.id,
        toAccountId: to.id,
        amountCents: 1234,
        idempotencyKey: `demo-${Date.now()}`,
      }),
    });

    if (selectedId) {
      // refresh
      const [balRes, payRes] = await Promise.all([
        fetch(`${API_BASE}/accounts/${selectedId}/balance`).then((r) => r.json()),
        fetch(`${API_BASE}/accounts/${selectedId}/payments`).then((r) => r.json()),
      ]);
      setBalance(balRes.balance_cents);
      setPayments(payRes);
    }
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '1.5rem', fontFamily: 'sans-serif' }}>
      <h1>MiniLedger</h1>
      <p>Simple payment & double-entry ledger demo.</p>

      <section style={{ marginTop: '1rem' }}>
        <h2>Accounts</h2>
        {accounts.length === 0 && <p>No accounts yet. Create via API.</p>}
        <ul>
          {accounts.map((a) => (
            <li key={a.id}>
              <button onClick={() => setSelectedId(a.id)}>
                {a.name} (#{a.id}, {a.type})
              </button>
            </li>
          ))}
        </ul>
      </section>

      {selectedId && (
        <section style={{ marginTop: '1rem' }}>
          <h2>
            Account #{selectedId} – Balance:{' '}
            {balance !== null ? `$${(balance / 100).toFixed(2)}` : '...'}
          </h2>
          {loading && <p>Loading...</p>}
          <button onClick={createDemoPayment}>Create demo payment between first two accounts</button>
          <h3 style={{ marginTop: '1rem' }}>Payments</h3>
          {payments.length === 0 ? (
            <p>No payments yet.</p>
          ) : (
            <table border={1} cellPadding={4}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>From</th>
                  <th>To</th>
                  <th>Amount</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td>{p.id}</td>
                    <td>{p.from_name}</td>
                    <td>{p.to_name}</td>
                    <td>${(p.amount_cents / 100).toFixed(2)}</td>
                    <td>{new Date(p.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      )}
    </div>
  );
}

export default App;
