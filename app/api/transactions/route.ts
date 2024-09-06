import { kv } from '@vercel/kv';
import { NextResponse } from 'next/server';

type Transaction = {
  id: number;
  type: 'income' | 'expense' | 'loan';
  amount: number;
  remarks: string;
  date: string;
};

export async function GET() {
  const transactions = await kv.get<Transaction[]>('transactions') || [];
  return NextResponse.json(transactions);
}

export async function POST(request: Request) {
  const transaction: Transaction = await request.json();
  const transactions = await kv.get<Transaction[]>('transactions') || [];
  const updatedTransactions = [transaction, ...transactions];
  await kv.set('transactions', updatedTransactions);
  return NextResponse.json(transaction);
}