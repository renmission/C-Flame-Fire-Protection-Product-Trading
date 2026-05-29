CREATE TABLE "installation_service" (
	"id" text PRIMARY KEY NOT NULL,
	"service_date" timestamp NOT NULL,
	"customer_id" text,
	"customer_name" text NOT NULL,
	"customer_address" text NOT NULL,
	"customer_phone" text,
	"customer_email" text,
	"fee_type" text DEFAULT 'preset' NOT NULL,
	"fee_preset" text,
	"fee_custom" numeric(12, 2),
	"fee_amount" numeric(12, 2) NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"notes" text,
	"created_by_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "installation_service" ADD CONSTRAINT "installation_service_customer_id_customer_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customer"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "installation_service" ADD CONSTRAINT "installation_service_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "installation_service_status_idx" ON "installation_service" USING btree ("status");--> statement-breakpoint
CREATE INDEX "installation_service_customer_id_idx" ON "installation_service" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "installation_service_created_at_idx" ON "installation_service" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "installation_service_service_date_idx" ON "installation_service" USING btree ("service_date");