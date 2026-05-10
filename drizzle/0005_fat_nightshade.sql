CREATE TABLE "custom_request_upload_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ip" text NOT NULL,
	"attempted_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "custom_request_upload_attempts_ip_at_idx" ON "custom_request_upload_attempts" USING btree ("ip","attempted_at");