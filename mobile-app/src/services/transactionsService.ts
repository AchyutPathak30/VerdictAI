/**
 * Transactions Service
 * Connects to: backend/app/api/v1/transactions.py (Darshan Prajapati)
 * Endpoints: GET /transactions/cardholder/:id, GET /transactions/:txn_id
 * Seed users: usr_alice_01, usr_bob_02
 * Implements resilient live API query with automatic offline demo fallback.
 */

import apiClient, { setBackendReachable } from './apiClient';
import { Transaction } from '../types';
import { FALLBACK_TRANSACTIONS } from '../data/mockDisputes';

/** Get all transactions for a cardholder (to pick from when filing dispute) */
export const getCardholderTransactions = async (
  cardholderId: string
): Promise<Transaction[]> => {
  try {
    const response = await apiClient.get(`/transactions/cardholder/${cardholderId}`);
    setBackendReachable(true);
    if (response.data && Array.isArray(response.data) && response.data.length > 0) {
      // If backend has only 1 seeded transaction (e.g. Croma), augment with other domestic transactions
      // so the cardholder has a realistic list of charges to choose from in Step 1 of the wizard
      if (response.data.length < 3) {
        const existingIds = new Set(response.data.map((t: Transaction) => t.id));
        const additions = FALLBACK_TRANSACTIONS.filter((t) => !existingIds.has(t.id));
        return [...response.data, ...additions];
      }
      return response.data;
    }
    // If backend returned empty list for this cardholder ID
    return FALLBACK_TRANSACTIONS;
  } catch (err: any) {
    console.warn(
      `[VerdictAI] Transactions API offline (${err?.message || 'timeout'}). Using fallback seed data.`
    );
    setBackendReachable(false);
    return FALLBACK_TRANSACTIONS;
  }
};

/** Get a single transaction by ID */
export const getTransactionById = async (
  transactionId: string
): Promise<Transaction> => {
  try {
    const response = await apiClient.get(`/transactions/${transactionId}`);
    setBackendReachable(true);
    return response.data;
  } catch {
    setBackendReachable(false);
    const fallback = FALLBACK_TRANSACTIONS.find((t) => t.id === transactionId);
    if (fallback) return fallback;
    throw new Error(`Transaction ${transactionId} not found.`);
  }
};
