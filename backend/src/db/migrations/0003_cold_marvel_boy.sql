ALTER TABLE "fuel_logs" ADD COLUMN "odometer" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "fuel_logs" ADD COLUMN "location" text NOT NULL;--> statement-breakpoint
ALTER TABLE "fuel_logs" ADD COLUMN "payment_reference" text NOT NULL;--> statement-breakpoint
ALTER TABLE "fuel_logs" ADD COLUMN "receipt_url" text;