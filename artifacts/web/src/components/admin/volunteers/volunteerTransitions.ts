import {
  canTransition,
  type ApplicationStatus,
} from '@/services/adminVolunteers';

/** UI helpers over the shared transition matrix in the service layer. */
export const canReview = (status: ApplicationStatus) =>
  canTransition(status, 'under_review');
export const canApprove = (status: ApplicationStatus) =>
  canTransition(status, 'approved');
export const canReject = (status: ApplicationStatus) =>
  canTransition(status, 'rejected');
export const canWithdraw = (status: ApplicationStatus) =>
  canTransition(status, 'withdrawn');
