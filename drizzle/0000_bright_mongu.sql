CREATE TYPE "public"."entry_status" AS ENUM('coming', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."item_added_by" AS ENUM('host', 'guest');--> statement-breakpoint
CREATE TYPE "public"."log_action" AS ENUM('sign_up', 'edit', 'cancel', 'claim', 'release', 'merge', 'host_change');--> statement-breakpoint
CREATE TABLE "browser_link" (
	"token_hash" text PRIMARY KEY NOT NULL,
	"entry_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "change_log" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"at" timestamp with time zone DEFAULT now() NOT NULL,
	"actor" text NOT NULL,
	"actor_entry_id" uuid,
	"action" "log_action" NOT NULL,
	"target" text NOT NULL,
	"before" jsonb,
	"after" jsonb
);
--> statement-breakpoint
CREATE TABLE "claim" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"item_id" uuid NOT NULL,
	"entry_id" uuid NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "claim_item_entry_unique" UNIQUE("item_id","entry_id"),
	CONSTRAINT "claim_quantity_positive" CHECK ("claim"."quantity" >= 1)
);
--> statement-breakpoint
CREATE TABLE "entry" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"display_name" text NOT NULL,
	"party_size" integer NOT NULL,
	"status" "entry_status" DEFAULT 'coming' NOT NULL,
	"merged_into_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "entry_party_size_range" CHECK ("entry"."party_size" BETWEEN 1 AND 50)
);
--> statement-breakpoint
CREATE TABLE "entry_name" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entry_id" uuid NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"name_key" text NOT NULL,
	CONSTRAINT "entry_name_key_unique" UNIQUE("name_key")
);
--> statement-breakpoint
CREATE TABLE "event" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"title" text NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"address" text NOT NULL,
	CONSTRAINT "event_single_row" CHECK ("event"."id" = 1)
);
--> statement-breakpoint
CREATE TABLE "item" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"label" text NOT NULL,
	"quantity_needed" integer DEFAULT 1 NOT NULL,
	"added_by" "item_added_by" NOT NULL,
	"added_by_entry_id" uuid,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"removed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "item_quantity_positive" CHECK ("item"."quantity_needed" >= 1)
);
--> statement-breakpoint
ALTER TABLE "browser_link" ADD CONSTRAINT "browser_link_entry_id_entry_id_fk" FOREIGN KEY ("entry_id") REFERENCES "public"."entry"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "claim" ADD CONSTRAINT "claim_item_id_item_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."item"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "claim" ADD CONSTRAINT "claim_entry_id_entry_id_fk" FOREIGN KEY ("entry_id") REFERENCES "public"."entry"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entry" ADD CONSTRAINT "entry_merged_into_id_entry_id_fk" FOREIGN KEY ("merged_into_id") REFERENCES "public"."entry"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entry_name" ADD CONSTRAINT "entry_name_entry_id_entry_id_fk" FOREIGN KEY ("entry_id") REFERENCES "public"."entry"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "item" ADD CONSTRAINT "item_added_by_entry_id_entry_id_fk" FOREIGN KEY ("added_by_entry_id") REFERENCES "public"."entry"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "browser_link_entry_idx" ON "browser_link" USING btree ("entry_id");--> statement-breakpoint
CREATE INDEX "change_log_at_idx" ON "change_log" USING btree ("at");--> statement-breakpoint
CREATE INDEX "claim_entry_idx" ON "claim" USING btree ("entry_id");--> statement-breakpoint
CREATE INDEX "entry_status_idx" ON "entry" USING btree ("status");--> statement-breakpoint
CREATE INDEX "entry_name_entry_idx" ON "entry_name" USING btree ("entry_id");