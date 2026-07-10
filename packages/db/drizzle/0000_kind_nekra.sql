CREATE TYPE "public"."bid_status" AS ENUM('pending', 'accepted', 'rejected', 'withdrawn', 'expired');--> statement-breakpoint
CREATE TYPE "public"."task_status" AS ENUM('open', 'bidding', 'assigned', 'in_progress', 'submitted', 'verifying', 'disputed', 'completed', 'failed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."verification_result" AS ENUM('approved', 'rejected', 'partial', 'disputed');--> statement-breakpoint
CREATE TABLE "agents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"owner_address" text NOT NULL,
	"chain_id" text NOT NULL,
	"chain_address" text NOT NULL,
	"chain_type" text NOT NULL,
	"reputation_score" numeric(5, 2) DEFAULT '0' NOT NULL,
	"total_stake" numeric(36, 18) DEFAULT '0' NOT NULL,
	"tasks_completed" numeric DEFAULT '0' NOT NULL,
	"tasks_failed" numeric DEFAULT '0' NOT NULL,
	"capabilities" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bids" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid NOT NULL,
	"bidder_agent_id" uuid NOT NULL,
	"price" numeric(36, 18) NOT NULL,
	"currency" text DEFAULT 'ETH' NOT NULL,
	"estimated_duration" text,
	"proposal" text,
	"status" "bid_status" DEFAULT 'pending' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"accepted_at" timestamp with time zone,
	"rejected_at" timestamp with time zone,
	"withdrawn_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chain_id" text NOT NULL,
	"on_chain_task_id" text,
	"buyer_agent_id" uuid NOT NULL,
	"bounty_amount" numeric(36, 18) NOT NULL,
	"bounty_token" text DEFAULT 'ETH' NOT NULL,
	"chain_type" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"acceptance_criteria_hash" text NOT NULL,
	"requirements" jsonb DEFAULT '{}'::jsonb,
	"status" "task_status" DEFAULT 'open' NOT NULL,
	"assigned_agent_id" uuid,
	"deadline" timestamp with time zone,
	"submitted_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid NOT NULL,
	"verifier_agent_id" uuid NOT NULL,
	"result" "verification_result" NOT NULL,
	"confidence" text,
	"attestation_hash" text NOT NULL,
	"attestation_data" jsonb DEFAULT '{}'::jsonb,
	"signature" text,
	"signature_algorithm" text,
	"chain_tx_ref" text,
	"chain_id" text,
	"dispute_reason" text,
	"dispute_resolution" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"verified_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bids" ADD CONSTRAINT "bids_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bids" ADD CONSTRAINT "bids_bidder_agent_id_agents_id_fk" FOREIGN KEY ("bidder_agent_id") REFERENCES "public"."agents"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_buyer_agent_id_agents_id_fk" FOREIGN KEY ("buyer_agent_id") REFERENCES "public"."agents"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assigned_agent_id_agents_id_fk" FOREIGN KEY ("assigned_agent_id") REFERENCES "public"."agents"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verifications" ADD CONSTRAINT "verifications_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verifications" ADD CONSTRAINT "verifications_verifier_agent_id_agents_id_fk" FOREIGN KEY ("verifier_agent_id") REFERENCES "public"."agents"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "agents_owner_address_idx" ON "agents" USING btree ("owner_address");--> statement-breakpoint
CREATE INDEX "agents_chain_idx" ON "agents" USING btree ("chain_type","chain_address");--> statement-breakpoint
CREATE INDEX "agents_status_idx" ON "agents" USING btree ("status");--> statement-breakpoint
CREATE INDEX "bids_task_idx" ON "bids" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "bids_bidder_idx" ON "bids" USING btree ("bidder_agent_id");--> statement-breakpoint
CREATE INDEX "bids_status_idx" ON "bids" USING btree ("status");--> statement-breakpoint
CREATE INDEX "bids_task_price_idx" ON "bids" USING btree ("task_id","price");--> statement-breakpoint
CREATE INDEX "tasks_buyer_idx" ON "tasks" USING btree ("buyer_agent_id");--> statement-breakpoint
CREATE INDEX "tasks_assigned_idx" ON "tasks" USING btree ("assigned_agent_id");--> statement-breakpoint
CREATE INDEX "tasks_status_idx" ON "tasks" USING btree ("status");--> statement-breakpoint
CREATE INDEX "tasks_chain_idx" ON "tasks" USING btree ("chain_id","on_chain_task_id");--> statement-breakpoint
CREATE INDEX "tasks_bounty_idx" ON "tasks" USING btree ("bounty_amount");--> statement-breakpoint
CREATE INDEX "verifications_task_idx" ON "verifications" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "verifications_verifier_idx" ON "verifications" USING btree ("verifier_agent_id");--> statement-breakpoint
CREATE INDEX "verifications_result_idx" ON "verifications" USING btree ("result");--> statement-breakpoint
CREATE INDEX "verifications_attestation_idx" ON "verifications" USING btree ("attestation_hash");--> statement-breakpoint
CREATE INDEX "verifications_chain_idx" ON "verifications" USING btree ("chain_id","chain_tx_ref");