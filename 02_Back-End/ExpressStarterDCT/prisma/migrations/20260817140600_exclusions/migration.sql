ALTER TABLE "Appointment"
ADD CONSTRAINT "appointment_no_overlap"
EXCLUDE USING gist (
  "professionalUserId" WITH =,
  tstzrange("startAt", "endAt", '[)') WITH &&
)
WHERE ("status" = 'CONFIRMED');

ALTER TABLE "WeeklyAvailability"
ADD CONSTRAINT "weekly_availability_no_overlap"
EXCLUDE USING gist (
  "professionalUserId" WITH =,
  "weekday" WITH =,
  int4range("startMinute", "endMinute", '[)') WITH &&
);

ALTER TABLE "Unavailability"
ADD CONSTRAINT "unavailability_no_overlap"
EXCLUDE USING gist (
  "professionalUserId" WITH =,
  tstzrange("startAt", "endAt", '[)') WITH &&
);

CREATE UNIQUE INDEX "proposal_one_pending"
ON "AppointmentChangeProposal" ("appointmentId")
WHERE "status" = 'PENDING';
