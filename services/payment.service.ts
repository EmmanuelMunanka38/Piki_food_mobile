import { api } from './api';
import { ApiResponse, PaymentInitiationResult, Transaction } from '@/types';

export interface InitiateUSSDPushParams {
  orderId: string;
  amount: number;
  phoneNumber: string;
  currency?: string;
}

export const paymentService = {
  async initiateUSSDPush(params: InitiateUSSDPushParams): Promise<PaymentInitiationResult> {
    const res = await api.post<ApiResponse<PaymentInitiationResult>>('/payments/checkout', {
      orderId: params.orderId,
      amount: params.amount,
      phoneNumber: params.phoneNumber,
      currency: params.currency || 'TZS',
    });
    return res.data.data;
  },

  async getTransactionStatus(orderReference: string): Promise<Transaction> {
    const res = await api.get<ApiResponse<Transaction>>(`/payments/transaction/${orderReference}`);
    return res.data.data;
  },
};
