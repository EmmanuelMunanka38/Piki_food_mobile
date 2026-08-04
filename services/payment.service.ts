import { api } from './api';
import { ApiResponse } from '@/types';

interface InitiateUSSDPushParams {
  orderId: string;
  amount: number;
  phoneNumber: string;
  currency?: string;
}

interface Transaction {
  id: string;
  orderReference: string;
  orderId: string;
  clickPesaId: string | null;
  amount: number;
  phoneNumber: string;
  status: 'PENDING' | 'SUCCESSFUL' | 'FAILED';
  createdAt: string;
  updatedAt: string;
}

export interface PaymentInitiationResult {
  transaction: Transaction;
  clickPesa: any;
}

export const paymentService = {
  async initiateUSSDPush(params: InitiateUSSDPushParams): Promise<PaymentInitiationResult> {
    const res = await api.post<ApiResponse<PaymentInitiationResult>>('/payment/checkout', {
      orderId: params.orderId,
      amount: params.amount,
      phoneNumber: params.phoneNumber,
      currency: params.currency || 'TZS',
    });
    return res.data.data;
  },
};
