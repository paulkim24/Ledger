import Express from "express";
import { pool } from "./db";

export const router = Express.Router();

type AccountType = "user" | "merchant";

router.post('/accounts', async (req, res) => {
    try {
      const { name, type } = req.body as { name: string; type: AccountType };
  
      if (!name || (type !== 'user' && type !== 'merchant')) {
        return res.status(400).json({ error: 'Invalid name or type' });
      }
  
      const result = await pool.query(
        'INSERT INTO accounts (name, type) VALUES ($1, $2) RETURNING *',
        [name, type]
      );
  
      res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to create account' });
    }
  });
router.get('/accounts', async (_req, res) => {
    try {
      const result = await pool.query('SELECT * FROM accounts ORDER BY id');
      res.json(result.rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to list accounts' });
    }
});

router.get('/accounts/:id/balance', async (req, res) => {
    const { id } = req.params;
    try {
      const result = await pool.query(
        'SELECT COALESCE(SUM(amount_cents), 0) AS balance_cents FROM ledger_entries WHERE account_id = $1',
        [id]
      );
      res.json({ accountId: id, balance_cents: Number(result.rows[0].balance_cents) });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to get balance' });
    }
  });

router.get('/accounts/:id/payments', async (req, res) => {
    const { id } = req.params;
    try {
      const result = await pool.query(
        `SELECT p.*, 
                a_from.name AS from_name,
                a_to.name AS to_name
         FROM payments p
         JOIN accounts a_from ON p.from_account_id = a_from.id
         JOIN accounts a_to   ON p.to_account_id   = a_to.id
         WHERE p.from_account_id = $1 OR p.to_account_id = $1
         ORDER BY p.created_at DESC`,
        [id]
      );
      res.json(result.rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to get payments' });
    }
});

router.post('/payments', async (req, res) => {
    const client = await pool.connect();
    try {
      const { fromAccountId, toAccountId, amountCents, currency, idempotencyKey } =
        req.body as {
          fromAccountId: number;
          toAccountId: number;
          amountCents: number;
          currency?: string;
          idempotencyKey?: string;
        };
  
      if (!fromAccountId || !toAccountId || !amountCents || amountCents <= 0) {
        return res.status(400).json({ error: 'Invalid payment data' });
      }
      if (fromAccountId === toAccountId) {
        return res.status(400).json({ error: 'from and to must differ' });
      }
  
      await client.query('BEGIN');
  
      // idempotency
      if (idempotencyKey) {
        const existing = await client.query(
          'SELECT * FROM payments WHERE idempotency_key = $1',
          [idempotencyKey]
        );
        if (existing.rowCount > 0) {
          await client.query('ROLLBACK');
          return res.status(200).json(existing.rows[0]);
        }
      }
  
      // check accounts exist
      const accounts = await client.query(
        'SELECT id FROM accounts WHERE id = ANY($1::int[])',
        [[fromAccountId, toAccountId]]
      );
      if (accounts.rowCount !== 2) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Account not found' });
      }
  
      const paymentResult = await client.query(
        `INSERT INTO payments 
         (from_account_id, to_account_id, amount_cents, currency, idempotency_key)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [fromAccountId, toAccountId, amountCents, currency || 'USD', idempotencyKey || null]
      );
  
      const payment = paymentResult.rows[0];
  
      // double-entry ledger: from = negative, to = positive
      await client.query(
        `INSERT INTO ledger_entries (payment_id, account_id, amount_cents)
         VALUES 
           ($1, $2, $3),
           ($1, $4, $5)`,
        [payment.id, fromAccountId, -amountCents, toAccountId, amountCents]
      );
  
      await client.query('COMMIT');
  
      res.status(201).json(payment);
    } catch (err) {
      await pool.query('ROLLBACK');
      console.error(err);
      res.status(500).json({ error: 'Failed to create payment' });
    } finally {
      client.release();
    }
  });
  
  