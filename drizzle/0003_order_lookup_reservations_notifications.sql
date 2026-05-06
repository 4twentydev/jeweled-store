CREATE TYPE "public"."product_category" AS ENUM('bejeweled-lighters', 'lighter-cases', 'small-cases', 'lip-balms', 'lotions', 'custom-rhinestone-items');--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "category" TYPE "public"."product_category" USING "category"::"public"."product_category";--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "lookup_token" text;--> statement-breakpoint
CREATE TABLE "checkout_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ip" text NOT NULL,
	"attempted_at" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE TABLE "product_reservations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reservation_token" text NOT NULL,
	"stripe_checkout_session_id" text,
	"product_id" uuid NOT NULL,
	"quantity" integer NOT NULL,
	"customer_email" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"fulfilled_at" timestamp,
	"released_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE TABLE "notification_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" text NOT NULL,
	"channel" text NOT NULL,
	"recipient" text,
	"subject" text,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"external_id" text,
	"error_message" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"sent_at" timestamp
);--> statement-breakpoint
ALTER TABLE "product_reservations" ADD CONSTRAINT "product_reservations_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "checkout_attempts_ip_at_idx" ON "checkout_attempts" USING btree ("ip","attempted_at");--> statement-breakpoint
CREATE INDEX "product_reservation_token_idx" ON "product_reservations" USING btree ("reservation_token");--> statement-breakpoint
CREATE INDEX "product_reservation_session_idx" ON "product_reservations" USING btree ("stripe_checkout_session_id");--> statement-breakpoint
CREATE INDEX "product_reservation_expiry_idx" ON "product_reservations" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "notification_events_kind_idx" ON "notification_events" USING btree ("kind","created_at");--> statement-breakpoint
