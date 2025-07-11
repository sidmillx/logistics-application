ALTER TABLE "checkins" RENAME COLUMN "end_odometer" TO "start_location";--> statement-breakpoint
ALTER TABLE "checkouts" ADD COLUMN "end_odometer" integer;--> statement-breakpoint
ALTER TABLE "checkouts" ADD COLUMN "end_location" text NOT NULL;