import test from 'node:test';
import assert from 'node:assert/strict';
import {
  hasIntervalOverlap,
  calculateBookingPrice,
  isParticipantCountValid,
  isWithinOperatingHours,
  canUserCancelBooking,
} from './rules.ts';

test('Overlap Logic: Exactly adjacent intervals do NOT overlap [10:00-11:00) and [11:00-12:00)', () => {
  const existingStart = '2026-10-16T10:00:00Z';
  const existingEnd   = '2026-10-16T11:00:00Z';
  const requestedStart = '2026-10-16T11:00:00Z';
  const requestedEnd   = '2026-10-16T12:00:00Z';

  const overlap = hasIntervalOverlap(existingStart, existingEnd, requestedStart, requestedEnd);
  assert.equal(overlap, false, 'Adjacent intervals sharing an endpoint must not conflict');
});

test('Overlap Logic: Partially overlapping intervals DO conflict', () => {
  const existingStart = '2026-10-16T10:00:00Z';
  const existingEnd   = '2026-10-16T11:30:00Z';
  const requestedStart = '2026-10-16T11:00:00Z';
  const requestedEnd   = '2026-10-16T12:00:00Z';

  const overlap = hasIntervalOverlap(existingStart, existingEnd, requestedStart, requestedEnd);
  assert.equal(overlap, true, 'Partial collision must trigger conflict');
});

test('Overlap Logic: Fully contained interval triggers conflict', () => {
  const existingStart = '2026-10-16T09:00:00Z';
  const existingEnd   = '2026-10-16T13:00:00Z';
  const requestedStart = '2026-10-16T10:00:00Z';
  const requestedEnd   = '2026-10-16T11:00:00Z';

  const overlap = hasIntervalOverlap(existingStart, existingEnd, requestedStart, requestedEnd);
  assert.equal(overlap, true, 'Subset interval must be detected as conflict');
});

test('Overlap Logic: Disjoint intervals with gap do not overlap', () => {
  const existingStart = '2026-10-16T09:00:00Z';
  const existingEnd   = '2026-10-16T10:00:00Z';
  const requestedStart = '2026-10-16T14:00:00Z';
  const requestedEnd   = '2026-10-16T15:00:00Z';

  const overlap = hasIntervalOverlap(existingStart, existingEnd, requestedStart, requestedEnd);
  assert.equal(overlap, false);
});

test('Pricing calculation handles exact hourly and fractional rates', () => {
  const start = '2026-10-16T10:00:00Z';
  const end = '2026-10-16T11:30:00Z'; // 1.5 hours
  const hourlyRate = 20.0;

  const price = calculateBookingPrice(start, end, hourlyRate);
  assert.equal(price, 30.0);
});

test('Participant count validation enforces positive integer within capacity', () => {
  const capacity = 30;
  assert.equal(isParticipantCountValid(10, capacity), true);
  assert.equal(isParticipantCountValid(30, capacity), true);
  assert.equal(isParticipantCountValid(31, capacity), false);
  assert.equal(isParticipantCountValid(0, capacity), false);
  assert.equal(isParticipantCountValid(-5, capacity), false);
  assert.equal(isParticipantCountValid(4.5, capacity), false);
});

test('Operating hours validation checks daily schedule boundary', () => {
  const validStart = new Date('2026-10-16T08:00:00');
  const validEnd = new Date('2026-10-16T10:00:00');
  assert.equal(isWithinOperatingHours(validStart, validEnd, '06:00:00', '22:00:00'), true);

  const tooEarlyStart = new Date('2026-10-16T05:00:00');
  const tooEarlyEnd = new Date('2026-10-16T07:00:00');
  assert.equal(isWithinOperatingHours(tooEarlyStart, tooEarlyEnd, '06:00:00', '22:00:00'), false);
});

test('Cancellation authorization enforces ownership and state rules', () => {
  // Member cancelling their own PENDING booking -> allowed
  assert.equal(canUserCancelBooking('MEMBER', 4, 4, 'PENDING'), true);
  // Member cancelling their own APPROVED booking -> allowed
  assert.equal(canUserCancelBooking('MEMBER', 4, 4, 'APPROVED'), true);
  // Member attempting to cancel another member's booking -> FORBIDDEN
  assert.equal(canUserCancelBooking('MEMBER', 5, 4, 'PENDING'), false);
  // Admin cancelling any user's booking -> allowed
  assert.equal(canUserCancelBooking('ADMIN', 1, 4, 'PENDING'), true);
  // Cannot cancel already cancelled or rejected booking
  assert.equal(canUserCancelBooking('MEMBER', 4, 4, 'CANCELLED'), false);
  assert.equal(canUserCancelBooking('MEMBER', 4, 4, 'REJECTED'), false);
});
