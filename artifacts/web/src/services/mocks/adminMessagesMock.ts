import type { PaginatedResponse } from '@/services/adminNews';
import type {
  ContactMessage,
  MessageStatistics,
  MessageStatus,
  MessagesListParams,
  ReplyInput,
} from '@/services/adminMessages';

/**
 * In-memory mock database emulating the Laravel Contact Messages API.
 * All senders and messages below are fictional sample data; real contact
 * messages will only ever come from the authorized Laravel endpoints.
 */

const delay = (ms = 350) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

interface Seed {
  sender_name: string;
  email: string;
  phone: string | null;
  subject: string;
  body: string;
  is_read: boolean;
  status: MessageStatus;
}

const SEED: Seed[] = [
  {
    sender_name: 'محمد العمري',
    email: 'm.alamri@example.com',
    phone: '+966501234567',
    subject: 'استفسار عن التسجيل في برنامج تمكين الشباب',
    body: 'السلام عليكم،\n\nأود الاستفسار عن شروط التسجيل في برنامج تمكين الشباب للدفعة القادمة، وهل التسجيل متاح لمن هم خارج مدينة الرياض؟\n\nولكم جزيل الشكر.',
    is_read: false,
    status: 'new',
  },
  {
    sender_name: 'Sarah Thompson',
    email: 'sarah.t@example.com',
    phone: null,
    subject: 'Partnership opportunity with our foundation',
    body: 'Hello,\n\nI represent an international foundation interested in partnering with Mujaddidun on youth development initiatives in the region. Could we schedule a call to discuss potential collaboration areas?\n\nBest regards,\nSarah',
    is_read: false,
    status: 'new',
  },
  {
    sender_name: 'نورة السبيعي',
    email: 'noura.s@example.com',
    phone: '+966552223344',
    subject: 'مشكلة في نموذج التبرع',
    body: 'مرحباً،\n\nحاولت إتمام عملية تبرع عبر الموقع لكن ظهرت رسالة خطأ بعد إدخال بيانات البطاقة. هل يمكنكم التحقق من المشكلة؟\n\nشكراً لكم.',
    is_read: true,
    status: 'in_progress',
  },
  {
    sender_name: 'خالد الزهراني',
    email: 'khaled.z@example.com',
    phone: '+966533445566',
    subject: 'طلب زيارة تعريفية للجمعية',
    body: 'السلام عليكم ورحمة الله،\n\nنحن مجموعة طلاب من جامعة الملك عبدالعزيز ونرغب في تنظيم زيارة تعريفية لمقر الجمعية للتعرف على برامجكم وفرص التطوع المتاحة.\n\nبانتظار ردكم الكريم.',
    is_read: true,
    status: 'resolved',
  },
  {
    sender_name: 'Emily Chen',
    email: 'emily.chen@example.com',
    phone: '+14155550123',
    subject: 'Media inquiry — feature story on your programs',
    body: "Hi,\n\nI'm a journalist working on a feature about community-led education programs in the Gulf. I'd love to interview someone from your team about the Digital Literacy program.\n\nThanks,\nEmily",
    is_read: false,
    status: 'new',
  },
  {
    sender_name: 'عبدالله الغامدي',
    email: 'a.ghamdi@example.com',
    phone: '+966544556677',
    subject: 'شكر وتقدير لفريق التطوع',
    body: 'أحببت أن أتقدم بجزيل الشكر لفريق المتطوعين الذين شاركوا في فعالية الحي الأسبوع الماضي. كان تنظيمهم رائعاً وتعاملهم راقياً.\n\nوفقكم الله.',
    is_read: true,
    status: 'resolved',
  },
  {
    sender_name: 'ريم القحطاني',
    email: 'reem.q@example.com',
    phone: null,
    subject: 'استفسار عن شهادات التطوع',
    body: 'مرحباً،\n\nشاركت في ثلاث فعاليات تطوعية خلال الشهرين الماضيين ولم أستلم شهادات التطوع بعد. متى يتم إصدارها عادة؟\n\nشكراً.',
    is_read: true,
    status: 'in_progress',
  },
  {
    sender_name: 'James Miller',
    email: 'j.miller@example.com',
    phone: '+442071234567',
    subject: 'Donation receipt request',
    body: 'Hello,\n\nI made a donation last month and need an official receipt for tax purposes. My transaction reference is TXN-2026-004521. Could you send it to this email?\n\nThank you.',
    is_read: true,
    status: 'resolved',
  },
  {
    sender_name: 'هند العنزي',
    email: 'hind.anzi@example.com',
    phone: '+966588990011',
    subject: 'اقتراح برنامج جديد لكبار السن',
    body: 'السلام عليكم،\n\nأقترح إطلاق برنامج لمحو الأمية الرقمية موجه لكبار السن، فكثير منهم يواجه صعوبة في استخدام التطبيقات الحكومية.\n\nمستعدة للمساهمة في تصميم المحتوى التدريبي.',
    is_read: false,
    status: 'new',
  },
  {
    sender_name: 'فيصل الحارثي',
    email: 'faisal.h@example.com',
    phone: '+966566778899',
    subject: 'خطأ في بيانات فعالية اليوم المفتوح',
    body: 'مرحباً،\n\nلاحظت أن موقع فعالية اليوم المفتوح المذكور في الموقع يختلف عن الموقع المرسل في رسالة التأكيد. أيهما الصحيح؟',
    is_read: true,
    status: 'archived',
  },
  {
    sender_name: 'Layla Ibrahim',
    email: 'layla.i@example.com',
    phone: null,
    subject: 'Volunteering from abroad',
    body: "Hi,\n\nI'm based in Canada and interested in remote volunteering opportunities — translation, content writing, or design. Do you accept international volunteers?\n\nRegards,\nLayla",
    is_read: false,
    status: 'new',
  },
  {
    sender_name: 'سعود المالكي',
    email: 'saud.m@example.com',
    phone: '+966511223344',
    subject: 'طلب رعاية فعالية مدرسية',
    body: 'السلام عليكم،\n\nنحن إدارة مدرسة ثانوية ونرغب في التواصل معكم بخصوص إمكانية رعاية معرض التوعية البيئية الذي تنظمه المدرسة نهاية الفصل الدراسي.',
    is_read: true,
    status: 'in_progress',
  },
  {
    sender_name: 'أمجاد الشمري',
    email: 'amjad.sh@example.com',
    phone: '+966599887766',
    subject: 'تحديث بيانات العضوية',
    body: 'مرحباً،\n\nغيرت رقم جوالي مؤخراً وأرغب في تحديث بياناتي في سجل الأعضاء. ما هي الطريقة المناسبة لذلك؟',
    is_read: true,
    status: 'archived',
  },
  {
    sender_name: 'Omar Farouk',
    email: 'omar.f@example.com',
    phone: '+201001234567',
    subject: 'Question about the gallery photos usage',
    body: 'Hello,\n\nI noticed some wonderful photos in your gallery. May I use two of them in a university presentation about community initiatives, with attribution?\n\nThanks in advance.',
    is_read: false,
    status: 'new',
  },
];

let nextId = 4000;

const messages: ContactMessage[] = SEED.map((seed, index) => {
  const received = new Date(2026, 5 + (index % 3), 3 + index * 2, 9 + (index % 8));
  const id = ++nextId;
  return {
    id,
    ...seed,
    read_at: seed.is_read
      ? new Date(received.getTime() + 26 * 60 * 60 * 1000).toISOString()
      : null,
    received_at: received.toISOString(),
    created_at: received.toISOString(),
    updated_at: received.toISOString(),
  };
});

/** Replies recorded for inspection until Laravel sends real emails. */
const sentReplies: Array<{ messageId: number; input: ReplyInput }> = [];

function findMessage(id: number): ContactMessage {
  const message = messages.find((m) => m.id === id);
  if (!message) throw new Error('Message not found');
  return message;
}

const touch = (message: ContactMessage) => {
  message.updated_at = new Date().toISOString();
};

export const mockMessagesDb = {
  async list(
    params: MessagesListParams,
  ): Promise<PaginatedResponse<ContactMessage>> {
    await delay();
    const search = params.search?.trim().toLowerCase();
    let rows = messages.filter((message) => {
      if (
        search &&
        !message.sender_name.toLowerCase().includes(search) &&
        !message.email.toLowerCase().includes(search) &&
        !message.subject.toLowerCase().includes(search)
      ) {
        return false;
      }
      if (params.read !== undefined && message.is_read !== params.read) {
        return false;
      }
      if (params.status && message.status !== params.status) return false;
      const date = message.received_at.slice(0, 10);
      if (params.date_from && date < params.date_from) return false;
      if (params.date_to && date > params.date_to) return false;
      return true;
    });
    rows = [...rows].sort((a, b) => b.received_at.localeCompare(a.received_at));

    const perPage = params.per_page ?? 10;
    const total = rows.length;
    const lastPage = Math.max(1, Math.ceil(total / perPage));
    const page = Math.min(Math.max(params.page ?? 1, 1), lastPage);
    const start = (page - 1) * perPage;
    const slice = rows.slice(start, start + perPage);
    return {
      data: slice.map((message) => ({ ...message })),
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

  async statistics(): Promise<MessageStatistics> {
    await delay();
    return {
      total: messages.length,
      unread: messages.filter((m) => !m.is_read).length,
      in_progress: messages.filter((m) => m.status === 'in_progress').length,
      resolved: messages.filter((m) => m.status === 'resolved').length,
    };
  },

  async get(id: number): Promise<ContactMessage> {
    await delay(250);
    return { ...findMessage(id) };
  },

  async setRead(id: number, isRead: boolean): Promise<ContactMessage> {
    await delay(200);
    const message = findMessage(id);
    message.is_read = isRead;
    if (isRead && !message.read_at) {
      message.read_at = new Date().toISOString();
    }
    if (!isRead) message.read_at = null;
    touch(message);
    return { ...message };
  },

  async setStatus(id: number, status: MessageStatus): Promise<ContactMessage> {
    await delay();
    const message = findMessage(id);
    message.status = status;
    touch(message);
    return { ...message };
  },

  async archive(id: number): Promise<ContactMessage> {
    await delay();
    const message = findMessage(id);
    message.status = 'archived';
    touch(message);
    return { ...message };
  },

  async remove(id: number): Promise<void> {
    await delay();
    const index = messages.findIndex((m) => m.id === id);
    if (index === -1) throw new Error('Message not found');
    messages.splice(index, 1);
  },

  async reply(id: number, input: ReplyInput): Promise<void> {
    await delay(450);
    findMessage(id);
    if (!input.subject.trim()) throw new Error('Reply subject is required');
    const text = input.body_html.replace(/<[^>]*>/g, '').trim();
    if (!text) throw new Error('Reply message is required');
    sentReplies.push({ messageId: id, input });
  },
};
