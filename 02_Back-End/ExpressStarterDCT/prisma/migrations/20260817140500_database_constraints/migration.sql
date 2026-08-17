CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "WeeklyAvailability"
ADD CONSTRAINT "weekly_availability_bounds_check"
CHECK (
  "weekday" BETWEEN 1 AND 7
  AND "startMinute" BETWEEN 0 AND 1439
  AND "endMinute" BETWEEN 1 AND 1440
);
ALTER TABLE "WeeklyAvailability"
ADD CONSTRAINT "weekly_availability_order_check"
CHECK ("startMinute" < "endMinute");
ALTER TABLE "Unavailability"
ADD CONSTRAINT "unavailability_interval_check"
CHECK ("startAt" < "endAt");
ALTER TABLE "Appointment"
ADD CONSTRAINT "appointment_duration_check"
CHECK ("endAt" = "startAt" + INTERVAL '1 hour');
ALTER TABLE "Appointment"
ADD CONSTRAINT "appointment_state_check"
CHECK (
  (
    "status" = 'CONFIRMED'
    AND "canceledAt" IS NULL
    AND "cancellationCause" IS NULL
  ) OR (
    "status" = 'CANCELED'
    AND "canceledAt" IS NOT NULL
    AND "cancellationCause" IS NOT NULL
  )
);
ALTER TABLE "Appointment"
ADD CONSTRAINT "appointment_cancellation_reason_check"
CHECK (
  "cancellationCause" IS NULL
  OR "cancellationCause" = 'CLIENT'
  OR (
    "cancellationCause" IN ('PROFESSIONAL', 'UNAVAILABILITY')
    AND NULLIF(BTRIM("cancellationReason"), '') IS NOT NULL
  ) OR (
    "cancellationCause" IN ('SCHEDULE_CHANGED', 'ACCOUNT_DELETED')
    AND "cancellationReason" IS NULL
  )
);
ALTER TABLE "Appointment"
ADD CONSTRAINT "appointment_client_anonymization_check"
CHECK (
  (
    NOT "clientAnonymized"
    AND "clientFirstName" IS NOT NULL
    AND "clientLastName" IS NOT NULL
    AND "clientPhone" IS NOT NULL
    AND "clientEmail" IS NOT NULL
  ) OR (
    "clientAnonymized"
    AND "clientUserId" IS NULL
    AND "clientFirstName" IS NULL
    AND "clientLastName" IS NULL
    AND "clientPhone" IS NULL
    AND "clientEmail" IS NULL
  )
);

ALTER TABLE "Appointment"
ADD CONSTRAINT "appointment_professional_anonymization_check"
CHECK (
  (
    NOT "professionalAnonymized"
    AND "professionalUserId" IS NOT NULL
    AND "professionalBusinessName" IS NOT NULL
  ) OR (
    "professionalAnonymized"
    AND "professionalUserId" IS NULL
    AND "professionalBusinessName" IS NULL
  )
);

ALTER TABLE "AppointmentChangeProposal"
ADD CONSTRAINT "proposal_duration_check"
CHECK ("proposedEndAt" = "proposedStartAt" + INTERVAL '1 hour');

ALTER TABLE "AppointmentChangeProposal"
ADD CONSTRAINT "proposal_state_check"
CHECK (
  "authorParty" <> "recipientParty"
  AND (
    ("status" = 'PENDING' AND "decidedAt" IS NULL)
    OR ("status" <> 'PENDING' AND "decidedAt" IS NOT NULL)
  )
  AND ("status" = 'REJECTED' OR "rejectionReason" IS NULL)
);

ALTER TABLE "ProfessionalProfile"
ADD CONSTRAINT "professional_calendar_version_check"
CHECK ("calendarVersion" >= 0);

ALTER TABLE "Session"
ADD CONSTRAINT "session_expiration_check"
CHECK ("expiresAt" > "createdAt");
