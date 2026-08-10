import type { PaginatedResponse } from '@/services/adminNews';
import type {
  Donation,
  DonationMethod,
  DonationStatistics,
  DonationStatus,
  DonationsListParams,
} from '@/services/adminDonations';

/** In-memory mock database emulating the Laravel Donations API. */

const delay = (ms = 350) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

interface Seed {
  donor_name: string;
  email: string;
  phone: string | null;
  amount: number;
  currency: string;
  method: DonationMethod;
  status: DonationStatus;
  notes: string | null;
}

const SEED: Seed[] = [
  { donor_name: 'أحمد الفارسي', email: 'ahmad.f@example.com', phone: '+966501234567', amount: 500, currency: 'SAR', method: 'card', status: 'completed', notes: 'تبرع لصالح برنامج تمكين الشباب' },
  { donor_name: 'Sara Al-Otaibi', email: 'sara.otaibi@example.com', phone: '+966555000111', amount: 1200, currency: 'SAR', method: 'bank_transfer', status: 'completed', notes: null },
  { donor_name: 'محمد الزهراني', email: 'm.zahrani@example.com', phone: null, amount: 250, currency: 'SAR', method: 'card', status: 'pending', notes: null },
  { donor_name: 'Layla Hassan', email: 'layla.h@example.com', phone: '+971509876543', amount: 300, currency: 'USD', method: 'paypal', status: 'completed', notes: 'Monthly supporter' },
  { donor_name: 'خالد العتيبي', email: 'khaled.o@example.com', phone: '+966533221100', amount: 2000, currency: 'SAR', method: 'bank_transfer', status: 'pending', notes: 'بانتظار تأكيد التحويل البنكي' },
  { donor_name: 'Omar Farouk', email: 'omar.farouk@example.com', phone: null, amount: 150, currency: 'USD', method: 'card', status: 'failed', notes: 'Card declined' },
  { donor_name: 'نورة السبيعي', email: 'noura.s@example.com', phone: '+966544556677', amount: 750, currency: 'SAR', method: 'card', status: 'completed', notes: null },
  { donor_name: 'Fatima Al-Ali', email: 'fatima.ali@example.com', phone: '+973390011223', amount: 100, currency: 'USD', method: 'paypal', status: 'refunded', notes: 'Refund requested by donor' },
  { donor_name: 'عبدالله القحطاني', email: 'a.qahtani@example.com', phone: '+966512345678', amount: 5000, currency: 'SAR', method: 'bank_transfer', status: 'completed', notes: 'تبرع سنوي' },
  { donor_name: 'Hassan Mahmoud', email: 'hassan.m@example.com', phone: null, amount: 80, currency: 'USD', method: 'card', status: 'cancelled', notes: 'Cancelled before processing' },
  { donor_name: 'ريم الدوسري', email: 'reem.d@example.com', phone: '+966599887766', amount: 400, currency: 'SAR', method: 'cash', status: 'completed', notes: 'تم الاستلام في مقر الجمعية' },
  { donor_name: 'Yousef Nasser', email: 'yousef.n@example.com', phone: '+962790123456', amount: 220, currency: 'USD', method: 'paypal', status: 'pending', notes: null },
  { donor_name: 'هند المطيري', email: 'hind.m@example.com', phone: '+966501112233', amount: 1500, currency: 'SAR', method: 'card', status: 'completed', notes: null },
  { donor_name: 'Ali Ibrahim', email: 'ali.ibrahim@example.com', phone: null, amount: 60, currency: 'USD', method: 'card', status: 'failed', notes: 'Insufficient funds' },
  { donor_name: 'مشاعل الحربي', email: 'mashael.h@example.com', phone: '+966577665544', amount: 950, currency: 'SAR', method: 'bank_transfer', status: 'completed', notes: 'تبرع لصالح صندوق الطوارئ' },
  { donor_name: 'Zainab Karim', email: 'zainab.k@example.com', phone: '+965600112233', amount: 175, currency: 'USD', method: 'paypal', status: 'completed', notes: null },
  { donor_name: 'سلطان الشمري', email: 'sultan.sh@example.com', phone: '+966588990011', amount: 3200, currency: 'SAR', method: 'bank_transfer', status: 'pending', notes: null },
  { donor_name: 'Mona Adel', email: 'mona.adel@example.com', phone: null, amount: 90, currency: 'USD', method: 'card', status: 'refunded', notes: 'Duplicate payment refunded' },
  { donor_name: 'فيصل الغامدي', email: 'faisal.g@example.com', phone: '+966522334455', amount: 600, currency: 'SAR', method: 'cash', status: 'completed', notes: null },
  { donor_name: 'Huda Salem', email: 'huda.salem@example.com', phone: '+20100123456', amount: 130, currency: 'USD', method: 'paypal', status: 'cancelled', notes: null },
  { donor_name: 'ماجد العنزي', email: 'majed.a@example.com', phone: '+966533445566', amount: 850, currency: 'SAR', method: 'card', status: 'completed', notes: 'تبرع شهري' },
  { donor_name: 'Nadia Rashid', email: 'nadia.r@example.com', phone: null, amount: 45, currency: 'USD', method: 'card', status: 'pending', notes: null },
];

let nextId = 5000;

const donations: Donation[] = SEED.map((seed, index) => {
  // Spread donations over recent months; keep several in the current month.
  const now = new Date();
  const monthsBack = index < 6 ? 0 : (index % 5) + 1;
  const donated = new Date(
    now.getFullYear(),
    now.getMonth() - monthsBack,
    Math.max(1, 26 - index),
    9 + (index % 10),
  );
  const id = ++nextId;
  return {
    id,
    ...seed,
    transaction_id: `TXN-${donated.getFullYear()}-${String(id).padStart(6, '0')}`,
    donated_at: donated.toISOString(),
    created_at: donated.toISOString(),
    updated_at: donated.toISOString(),
  };
});

function findDonation(id: number): Donation {
  const donation = donations.find((d) => d.id === id);
  if (!donation) throw new Error('Donation not found');
  return donation;
}

export const mockDonationsDb = {
  async list(
    params: DonationsListParams,
  ): Promise<PaginatedResponse<Donation>> {
    await delay();
    const search = params.search?.trim().toLowerCase();
    let rows = donations.filter((donation) => {
      if (
        search &&
        !donation.donor_name.toLowerCase().includes(search) &&
        !donation.email.toLowerCase().includes(search) &&
        !donation.transaction_id.toLowerCase().includes(search)
      ) {
        return false;
      }
      if (params.status && donation.status !== params.status) return false;
      if (params.method && donation.method !== params.method) return false;
      const date = donation.donated_at.slice(0, 10);
      if (params.date_from && date < params.date_from) return false;
      if (params.date_to && date > params.date_to) return false;
      return true;
    });
    rows = [...rows].sort((a, b) => b.donated_at.localeCompare(a.donated_at));

    const perPage = params.per_page ?? 10;
    const total = rows.length;
    const lastPage = Math.max(1, Math.ceil(total / perPage));
    const page = Math.min(Math.max(params.page ?? 1, 1), lastPage);
    const start = (page - 1) * perPage;
    const slice = rows.slice(start, start + perPage);
    return {
      data: slice.map((donation) => ({ ...donation })),
      meta: {
        current_page: page,
        last_page: lastPage,
        per_page: perPage,
        total,
        from: total === 0 ? null : start + 1,
        to: total === 0 ? null : start + slice.length,
      },
    };
  },

  /**
   * Aggregates are reported in SAR; the mock naively converts USD at a
   * fixed rate purely for display. Laravel will own real reporting.
   */
  async statistics(): Promise<DonationStatistics> {
    await delay();
    const USD_TO_SAR = 3.75;
    const inSar = (donation: Donation) =>
      donation.currency === 'USD'
        ? donation.amount * USD_TO_SAR
        : donation.amount;
    const now = new Date();
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    let total = 0;
    let completed = 0;
    let pendingCount = 0;
    let thisMonth = 0;
    const donors = new Set<string>();
    for (const donation of donations) {
      donors.add(donation.email.toLowerCase());
      if (donation.status === 'pending') pendingCount += 1;
      if (donation.status === 'completed' || donation.status === 'pending') {
        total += inSar(donation);
      }
      if (donation.status === 'completed') {
        completed += inSar(donation);
        if (donation.donated_at.slice(0, 7) === monthKey) {
          thisMonth += inSar(donation);
        }
      }
    }
    return {
      total_amount: Math.round(total),
      completed_amount: Math.round(completed),
      pending_count: pendingCount,
      donors_count: donors.size,
      this_month_amount: Math.round(thisMonth),
      currency: 'SAR',
    };
  },

  async get(id: number): Promise<Donation> {
    await delay();
    return { ...findDonation(id) };
  },

  async setStatus(
    id: number,
    status: Extract<DonationStatus, 'completed' | 'failed'>,
  ): Promise<Donation> {
    await delay();
    const donation = findDonation(id);
    if (donation.status !== 'pending') {
      throw new Error('Only pending donations can be marked completed or failed');
    }
    donation.status = status;
    donation.updated_at = new Date().toISOString();
    return { ...donation };
  },

  async refund(id: number): Promise<Donation> {
    await delay();
    const donation = findDonation(id);
    if (donation.status !== 'completed') {
      throw new Error('Only completed donations can be refunded');
    }
    donation.status = 'refunded';
    donation.updated_at = new Date().toISOString();
    return { ...donation };
  },

  async cancel(id: number): Promise<Donation> {
    await delay();
    const donation = findDonation(id);
    if (donation.status !== 'pending') {
      throw new Error('Only pending donations can be cancelled');
    }
    donation.status = 'cancelled';
    donation.updated_at = new Date().toISOString();
    return { ...donation };
  },
};
