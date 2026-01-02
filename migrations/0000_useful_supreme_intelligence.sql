CREATE TABLE "admin_audit_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"actor" text NOT NULL,
	"actor_role" text,
	"actor_ip" text,
	"user_agent" text,
	"action" text NOT NULL,
	"entity_type" text,
	"entity_id" integer,
	"client_id" integer,
	"deal_id" text,
	"details_json" jsonb,
	"event_hash" text,
	"prev_event_hash" text,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "admin_sessions" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"expires_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bill_uploads" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"file_name" text NOT NULL,
	"file_type" text,
	"file_size" integer,
	"ocr_raw_text" text,
	"ocr_confidence" numeric(3, 2),
	"ocr_status" text DEFAULT 'pending',
	"uc_code" text,
	"consumo_kwh" numeric(10, 2),
	"demanda_kw" numeric(10, 2),
	"valor_total" numeric(10, 2),
	"distribuidora" text,
	"mes_referencia" text,
	"extraction_method" text,
	"reviewed_by" text DEFAULT 'system',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "client_contracts" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"contract_start" date NOT NULL,
	"contract_end" date NOT NULL,
	"price_rmwh" numeric(10, 2) NOT NULL,
	"volume_mwh_month" numeric(10, 2),
	"supplier_name" text NOT NULL,
	"flexibility_notes" text,
	"flexibility_percent" numeric(5, 2),
	"commission_type" text DEFAULT 'supplier_paid',
	"commission_rmwh" numeric(10, 2),
	"status" text DEFAULT 'active',
	"renewal_status" text DEFAULT 'hold',
	"alert_level" text,
	"last_ecos_review_at" timestamp,
	"last_ecos_review_by" text,
	"renewal_notes" text,
	"linked_benchmark_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "client_dossier_snapshots" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_dossier_id" integer NOT NULL,
	"deal_id" varchar,
	"rfo_request_id" integer,
	"snapshot_data" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" varchar
);
--> statement-breakpoint
CREATE TABLE "client_dossiers" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"legal_name" text NOT NULL,
	"trade_name" text,
	"cnpj" text NOT NULL,
	"distributor" text,
	"submarket" text,
	"connection_type" text,
	"eligibility_type" text,
	"annual_consumption_mwh" numeric(12, 2),
	"average_monthly_mwh" numeric(12, 2),
	"peak_demand_kw" numeric(10, 2),
	"number_of_ucs" integer DEFAULT 1,
	"tariff_class" text,
	"data_sources" jsonb DEFAULT '[]'::jsonb,
	"confidence_score" text DEFAULT 'LOW',
	"last_validated_at" timestamp,
	"validated_by" varchar,
	"status" text DEFAULT 'DRAFT' NOT NULL,
	"locked_at" timestamp,
	"locked_by" varchar,
	"ops_notes" text,
	"is_demo" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" varchar,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"updated_by" varchar,
	CONSTRAINT "client_dossiers_client_id_unique" UNIQUE("client_id")
);
--> statement-breakpoint
CREATE TABLE "client_usage_periods" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" integer NOT NULL,
	"deal_id" varchar,
	"uc_code" text,
	"period_start_date" date NOT NULL,
	"period_end_date" date NOT NULL,
	"energy_kwh" numeric(12, 2) NOT NULL,
	"demand_kw" numeric(10, 2),
	"billed_amount_brl" numeric(12, 2),
	"source_type" text NOT NULL,
	"source_doc_id" integer,
	"extraction_confidence" numeric(3, 2),
	"status" text DEFAULT 'DRAFT' NOT NULL,
	"verified_by_user_id" varchar,
	"verified_at" timestamp,
	"notes" text,
	"is_demo" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clients" (
	"id" serial PRIMARY KEY NOT NULL,
	"lead_id" integer,
	"sales_owner" text DEFAULT 'Renan',
	"company_name" text NOT NULL,
	"cnpj" text,
	"uc_code" text,
	"email" text,
	"phone" text,
	"contact_person" text,
	"status" text DEFAULT 'prospect',
	"current_supplier" text,
	"current_price_rmwh" numeric(10, 2),
	"avg_consumption_kwh" numeric(12, 2),
	"selected_quote_id" integer,
	"segment" text,
	"region" text,
	"zoho_id" text,
	"is_demo" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "commission_reconciliation_lines" (
	"id" serial PRIMARY KEY NOT NULL,
	"reconciliation_run_id" integer NOT NULL,
	"deal_id" varchar NOT NULL,
	"commission_event_id" integer,
	"client_id" integer NOT NULL,
	"supplier_id" integer NOT NULL,
	"period_start" date NOT NULL,
	"period_end" date NOT NULL,
	"expected_amount_brl" numeric(12, 2) NOT NULL,
	"supplier_reported_amount_brl" numeric(12, 2),
	"paid_amount_brl" numeric(12, 2),
	"variance_amount_brl" numeric(12, 2),
	"variance_reason" text,
	"status" text DEFAULT 'UNRECONCILED' NOT NULL,
	"evidence_doc_ids" jsonb DEFAULT '[]'::jsonb,
	"usage_period_id" varchar,
	"notes" text,
	"reconciled_at" timestamp,
	"reconciled_by" varchar
);
--> statement-breakpoint
CREATE TABLE "commission_reconciliation_runs" (
	"id" serial PRIMARY KEY NOT NULL,
	"run_type" text DEFAULT 'MONTHLY_CLOSE' NOT NULL,
	"period_start" date NOT NULL,
	"period_end" date NOT NULL,
	"created_by" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"status" text DEFAULT 'OPEN' NOT NULL,
	"total_expected" numeric(14, 2),
	"total_reported" numeric(14, 2),
	"total_paid" numeric(14, 2),
	"total_variance" numeric(14, 2),
	"line_count" integer DEFAULT 0,
	"notes" text,
	"finalized_at" timestamp,
	"finalized_by" varchar
);
--> statement-breakpoint
CREATE TABLE "communication_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"deal_id" varchar,
	"client_id" integer,
	"lead_id" integer,
	"communication_type" text NOT NULL,
	"direction" text DEFAULT 'outbound',
	"subject" text,
	"summary" text,
	"external_call_id" text,
	"external_system_link" text,
	"contact_person" text,
	"contact_info" text,
	"logged_by" varchar NOT NULL,
	"occurred_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "compliance_checklist_requirements" (
	"id" serial PRIMARY KEY NOT NULL,
	"transition_from" text NOT NULL,
	"transition_to" text NOT NULL,
	"requirement_key" text NOT NULL,
	"requirement_label" text NOT NULL,
	"description" text,
	"is_required" boolean DEFAULT true,
	"required_for_roles" jsonb DEFAULT '["all"]'::jsonb,
	"sort_order" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "compliance_checklist_requirements_transition_key_unique" UNIQUE("transition_from","transition_to","requirement_key")
);
--> statement-breakpoint
CREATE TABLE "consumption_profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer,
	"billing_cycle" text,
	"data_source" text,
	"file_url" text,
	"original_filename" text,
	"monthly_consumption_kwh" jsonb,
	"demand_kw" numeric(10, 2),
	"voltage" text,
	"distributor" text,
	"upload_session_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contract_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"template_type" varchar(50) NOT NULL,
	"clauses" jsonb NOT NULL,
	"variables" jsonb NOT NULL,
	"includes_aneel_clauses" boolean DEFAULT true,
	"includes_lgpd_clauses" boolean DEFAULT true,
	"includes_consumer_clauses" boolean DEFAULT true,
	"supplier_id" integer,
	"is_generic" boolean DEFAULT true,
	"is_active" boolean DEFAULT true,
	"last_reviewed" date,
	"reviewed_by" varchar(100),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "deal_cases" (
	"id" serial PRIMARY KEY NOT NULL,
	"deal_id" varchar NOT NULL,
	"case_type" text NOT NULL,
	"severity" text DEFAULT 'MED' NOT NULL,
	"status" text DEFAULT 'OPEN' NOT NULL,
	"owner_user_id" varchar,
	"next_action_date" date,
	"sla_due_date" date,
	"root_cause" text,
	"resolution_summary" text,
	"is_demo" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "deal_checklist_completions" (
	"id" serial PRIMARY KEY NOT NULL,
	"deal_id" varchar NOT NULL,
	"checklist_item_id" integer NOT NULL,
	"is_completed" boolean DEFAULT false NOT NULL,
	"completed_at" timestamp,
	"completed_by" varchar,
	"notes" text,
	"evidence_doc_id" integer,
	"evidence_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "deal_checklist_completions_deal_id_checklist_item_id_unique" UNIQUE("deal_id","checklist_item_id")
);
--> statement-breakpoint
CREATE TABLE "deal_checklist_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"deal_id" varchar NOT NULL,
	"requirement_id" integer NOT NULL,
	"completed_by" varchar NOT NULL,
	"completed_at" timestamp DEFAULT now() NOT NULL,
	"response" text,
	"confirmation_method" text,
	"confidence_level" text,
	"notes" text,
	"evidence_doc_id" integer,
	"communication_log_id" integer
);
--> statement-breakpoint
CREATE TABLE "deal_checklist_requirements" (
	"id" serial PRIMARY KEY NOT NULL,
	"target_state" text NOT NULL,
	"requirement_type" text NOT NULL,
	"requirement_key" text NOT NULL,
	"requirement_label" text NOT NULL,
	"is_mandatory" boolean DEFAULT true,
	"validation_rule" text,
	"validation_params" jsonb,
	"display_order" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "deal_commission_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"deal_id" varchar(255) NOT NULL,
	"event_type" text NOT NULL,
	"event_index" integer,
	"calc_type" text,
	"calc_inputs" jsonb,
	"source_of_truth" text,
	"evidence_doc_id" integer,
	"amount_brl" numeric(14, 2),
	"amount_formula" text,
	"is_estimated" boolean DEFAULT true,
	"due_condition" text,
	"expected_date" date,
	"status" text DEFAULT 'FUTURE' NOT NULL,
	"invoiced_at" timestamp,
	"invoice_number" text,
	"paid_at" timestamp,
	"paid_amount" numeric(14, 2),
	"payment_reference" text,
	"days_overdue" integer DEFAULT 0,
	"last_reminder_sent" timestamp,
	"reminder_count" integer DEFAULT 0,
	"notes" text,
	"is_demo" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "deal_commission_terms_snapshots" (
	"id" serial PRIMARY KEY NOT NULL,
	"deal_id" varchar(255) NOT NULL,
	"snapshot_taken_at" timestamp DEFAULT now() NOT NULL,
	"snapshot_taken_by" text NOT NULL,
	"snapshot_trigger" text NOT NULL,
	"commission_model" text NOT NULL,
	"commission_value_rmwh" numeric(10, 4),
	"commission_percent_spread" numeric(5, 4),
	"commission_payment_type" text,
	"commission_payer_entity_id" text,
	"commission_payer_entity_name" text,
	"accrual_basis" text,
	"contract_start_date" date,
	"contract_end_date" date,
	"volume_mwh_year" numeric(12, 2),
	"price_structure" text,
	"base_energy_price_rmwh" numeric(10, 4),
	"terms_json" jsonb NOT NULL,
	"terms_human_readable" text,
	"expected_commission_total" numeric(14, 2),
	"expected_commission_monthly" numeric(12, 2),
	"supersedes_snapshot_id" integer,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "deal_disputes" (
	"id" serial PRIMARY KEY NOT NULL,
	"deal_id" varchar(255) NOT NULL,
	"commission_event_id" integer,
	"dispute_reference" text,
	"dispute_reason" text NOT NULL,
	"dispute_reason_detail" text,
	"disputed_amount_brl" numeric(14, 2),
	"claimed_amount_brl" numeric(14, 2),
	"dispute_owner" text NOT NULL,
	"dispute_with_party" text,
	"opened_at" timestamp DEFAULT now() NOT NULL,
	"sla_due_date" date,
	"is_sla_breach" boolean DEFAULT false,
	"status" text DEFAULT 'OPEN' NOT NULL,
	"resolution" text,
	"resolution_notes" text,
	"resolved_at" timestamp,
	"resolved_by" text,
	"resolved_amount_brl" numeric(14, 2),
	"communications_log" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "deal_documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"deal_id" varchar(255) NOT NULL,
	"document_type" text NOT NULL,
	"document_subtype" text,
	"file_name" text NOT NULL,
	"file_url" text,
	"file_size" integer,
	"mime_type" text,
	"description" text,
	"uploaded_by" text NOT NULL,
	"is_verified" boolean DEFAULT false,
	"verified_by" text,
	"verified_at" timestamp,
	"extracted_data_json" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "deal_ecos_snapshots" (
	"id" serial PRIMARY KEY NOT NULL,
	"deal_id" varchar(255) NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by_user_id" varchar,
	"trigger_type" text NOT NULL,
	"input_data" jsonb NOT NULL,
	"benchmark_match" jsonb,
	"results" jsonb NOT NULL,
	"status" text NOT NULL,
	"confidence_level" text NOT NULL,
	"confidence_reasons" jsonb,
	"recommended_next_step" text NOT NULL,
	"talk_track" text,
	"talk_track_pt" text,
	"pdf_document_id" integer
);
--> statement-breakpoint
CREATE TABLE "deal_quotes" (
	"id" varchar(255) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"deal_id" varchar(255) NOT NULL,
	"supplier_id" integer NOT NULL,
	"quote_reference" text,
	"supplier_entity" text,
	"raw_quote_json" jsonb NOT NULL,
	"raw_quote_hash" text,
	"raw_quote_source" text,
	"raw_quote_file_url" text,
	"received_via" text,
	"received_from_name" text,
	"received_from_email" text,
	"received_from_phone" text,
	"attachment_doc_ids" jsonb,
	"rfq_dispatch_id" integer,
	"energy_type" text,
	"price_structure" text,
	"base_energy_price_rmwh" numeric(10, 4),
	"indexation_rules" jsonb,
	"flexibility_clauses" jsonb,
	"penalty_clauses" jsonb,
	"commission_model" text,
	"commission_value_rmwh" numeric(10, 4),
	"commission_percent_spread" numeric(5, 4),
	"commission_payment_type" text,
	"valid_until" date,
	"is_expired" boolean DEFAULT false,
	"is_selected" boolean DEFAULT false,
	"selected_at" timestamp,
	"selection_reason" text,
	"is_rejected" boolean DEFAULT false,
	"rejected_at" timestamp,
	"rejection_reason" text,
	"risk_flags" jsonb,
	"normalization_confidence" numeric(3, 2),
	"received_at" timestamp DEFAULT now() NOT NULL,
	"normalized_by" text,
	"normalized_at" timestamp,
	"is_demo" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "deal_state_transitions" (
	"id" serial PRIMARY KEY NOT NULL,
	"deal_id" varchar(255) NOT NULL,
	"from_state" text NOT NULL,
	"to_state" text NOT NULL,
	"triggered_by" text NOT NULL,
	"triggered_by_type" text NOT NULL,
	"reason" text,
	"notes" text,
	"requires_approval" boolean DEFAULT false,
	"approved_by" text,
	"approved_at" timestamp,
	"metadata_json" jsonb,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "deal_transition_overrides" (
	"id" serial PRIMARY KEY NOT NULL,
	"deal_id" varchar NOT NULL,
	"from_state" text NOT NULL,
	"to_state" text NOT NULL,
	"blockers_overridden" jsonb NOT NULL,
	"override_reason" text NOT NULL,
	"typed_confirmation" text NOT NULL,
	"overridden_by" varchar NOT NULL,
	"overridden_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "deals" (
	"id" varchar(255) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" integer NOT NULL,
	"zoho_opportunity_id" text,
	"internal_owner" text DEFAULT 'Renan' NOT NULL,
	"ops_owner" text,
	"status" text DEFAULT 'DRAFT' NOT NULL,
	"supplier_id" integer,
	"supplier_legal_entity_id" text,
	"supplier_legal_entity_name" text,
	"supplier_brand_name" text,
	"intermediary_partner_id" integer,
	"intermediary_partner_name" text,
	"commission_payer_entity_id" text,
	"commission_payer_entity_name" text,
	"energy_type" text,
	"submarket" text,
	"volume_type" text,
	"contract_start_date" date,
	"contract_end_date" date,
	"contract_term_months" integer,
	"volume_mwh_year" numeric(12, 2),
	"volume_mwh_month" numeric(12, 2),
	"price_structure" text,
	"base_energy_price_rmwh" numeric(10, 4),
	"indexation_rules" jsonb,
	"flexibility_clauses" jsonb,
	"penalty_clauses" jsonb,
	"raw_supplier_quote_json" jsonb,
	"selected_quote_id" varchar(255),
	"commission_model" text,
	"commission_value_rmwh" numeric(10, 4),
	"commission_percent_spread" numeric(5, 4),
	"commission_currency" text DEFAULT 'BRL',
	"commission_payer" text,
	"commission_payment_type" text,
	"expected_commission_total" numeric(14, 2),
	"expected_commission_monthly" numeric(12, 2),
	"credit_risk_rating" text,
	"contract_risk_flags" jsonb,
	"commission_risk_score" integer,
	"missing_documents" jsonb,
	"manual_override_required" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"rfq_sent_at" timestamp,
	"quotes_received_at" timestamp,
	"offer_selected_at" timestamp,
	"onboarding_pending_at" timestamp,
	"contract_signed_at" timestamp,
	"supply_live_at" timestamp,
	"contract_ended_at" timestamp,
	"closed_at" timestamp,
	"lost_at" timestamp,
	"lost_reason" text,
	"lost_reason_category" text,
	"lost_supplier_id" integer,
	"lost_stage" text,
	"lost_by_user_id" text,
	"lost_notes" text,
	"is_demo" boolean DEFAULT false,
	"zoho_lead_id" text,
	"zoho_lead_source_agent" text,
	"zoho_lead_outcome" text,
	"zoho_callback_at" timestamp,
	"zoho_quick_note" text,
	"br_market" text,
	"br_group" text,
	"dm_name" text,
	"dm_role" text,
	"dm_direct_phone" text,
	"dm_availability" text,
	CONSTRAINT "deals_zoho_lead_id_unique" UNIQUE("zoho_lead_id")
);
--> statement-breakpoint
CREATE TABLE "dossier_edit_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"dossier_id" integer NOT NULL,
	"edited_fields" jsonb NOT NULL,
	"edit_reason" text NOT NULL,
	"edited_by" varchar NOT NULL,
	"edited_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ecos_decision_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"contract_id" integer,
	"decision_date" timestamp DEFAULT now() NOT NULL,
	"trigger_type" text NOT NULL,
	"benchmark_id" integer,
	"benchmark_lower_rmwh" numeric(10, 2),
	"benchmark_upper_rmwh" numeric(10, 2),
	"snapshot_confidence" text,
	"snapshot_source_type" text,
	"client_price_rmwh" numeric(10, 2) NOT NULL,
	"client_consumption_mwh" numeric(10, 2),
	"contract_remaining_months" integer,
	"status_result" text NOT NULL,
	"recommendation" text NOT NULL,
	"explanation_pt" text NOT NULL,
	"potential_savings_r" numeric(12, 2),
	"action_taken" text,
	"action_date" timestamp,
	"action_by" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ecos_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"segment" text NOT NULL,
	"band_width_percent" numeric(5, 2) DEFAULT '10.00',
	"friction_buffer_rmwh" numeric(10, 2) DEFAULT '5.00',
	"price_gap_threshold_percent" numeric(5, 2) DEFAULT '15.00',
	"min_annual_savings_r" numeric(12, 2) DEFAULT '10000.00',
	"min_remaining_months" integer DEFAULT 6,
	"renewal_window_months" integer DEFAULT 6,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ecos_settings_segment_unique" UNIQUE("segment")
);
--> statement-breakpoint
CREATE TABLE "lead_ecos_snapshots" (
	"id" serial PRIMARY KEY NOT NULL,
	"lead_id" integer NOT NULL,
	"benchmark_id_used" integer,
	"benchmark_lower_rmwh" numeric(10, 2),
	"benchmark_upper_rmwh" numeric(10, 2),
	"benchmark_segment" text,
	"benchmark_region" text,
	"benchmark_confidence" text,
	"benchmark_last_reviewed_at" timestamp,
	"estimated_consumption_kwh" numeric(12, 2),
	"estimated_price_rmwh" numeric(10, 2),
	"segment" text,
	"region" text,
	"voltage_level" text,
	"contract_status" text,
	"monthly_spend_r" numeric(12, 2),
	"volatility_exposure" text,
	"contract_rigidity" text,
	"timing_risk" text,
	"eligibility_status" text,
	"eligibility_window" text,
	"band_result" text NOT NULL,
	"summary_text" text NOT NULL,
	"potential_savings_r" numeric(12, 2),
	"generated_at" timestamp DEFAULT now() NOT NULL,
	"generated_by" text NOT NULL,
	"is_snapshot" boolean DEFAULT true,
	"watermark_text" text DEFAULT 'ECOS Snapshot — Not a Full Analysis',
	"pdf_url" text,
	"locked" boolean DEFAULT false,
	"locked_at" timestamp,
	"locked_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"company_name" text,
	"message" text,
	"source" text DEFAULT 'website',
	"portal_token" text,
	"portal_sent_at" timestamp,
	"zoho_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "leads_portal_token_unique" UNIQUE("portal_token")
);
--> statement-breakpoint
CREATE TABLE "market_price_benchmarks" (
	"id" serial PRIMARY KEY NOT NULL,
	"segment" text NOT NULL,
	"region" text NOT NULL,
	"contract_length_months" integer NOT NULL,
	"lower_bound_rmwh" numeric(10, 2) NOT NULL,
	"upper_bound_rmwh" numeric(10, 2) NOT NULL,
	"effective_date" date NOT NULL,
	"expires_at" date,
	"source" text,
	"notes" text,
	"updated_by" text DEFAULT 'admin',
	"source_type" text,
	"source_name" text,
	"source_details" text,
	"source_url" text,
	"source_doc_id" integer,
	"confidence" text DEFAULT 'Medium',
	"review_cadence" text DEFAULT 'Quarterly',
	"next_review_date" date,
	"last_reviewed_at" timestamp,
	"last_reviewed_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_queue" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"recipient_email" text NOT NULL,
	"recipient_user_id" varchar,
	"subject" text NOT NULL,
	"body" text NOT NULL,
	"deal_id" varchar,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"sent_at" timestamp,
	"fail_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ops_checklist_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"checklist_id" integer NOT NULL,
	"item_key" text NOT NULL,
	"label" text NOT NULL,
	"description" text,
	"help_text" text,
	"is_blocking" boolean DEFAULT false NOT NULL,
	"requires_evidence" boolean DEFAULT false,
	"sort_order" integer DEFAULT 0,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ops_checklists" (
	"id" serial PRIMARY KEY NOT NULL,
	"deal_stage" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ops_error_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"deal_id" varchar,
	"user_id" varchar,
	"supplier_id" integer,
	"error_type" text NOT NULL,
	"error_category" text,
	"deal_stage" text,
	"severity" text DEFAULT 'MEDIUM',
	"description" text,
	"root_cause" text,
	"resolution" text,
	"resolved_at" timestamp,
	"resolved_by" varchar,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ops_performance_snapshots" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"period_type" text NOT NULL,
	"period_start" date NOT NULL,
	"period_end" date NOT NULL,
	"deals_handled" integer DEFAULT 0,
	"deals_won" integer DEFAULT 0,
	"deals_lost" integer DEFAULT 0,
	"avg_deal_duration_days" numeric(10, 2),
	"avg_rfq_response_hours" numeric(10, 2),
	"sla_breach_count" integer DEFAULT 0,
	"checklist_retries" integer DEFAULT 0,
	"rfq_restarts" integer DEFAULT 0,
	"error_count" integer DEFAULT 0,
	"dispute_count" integer DEFAULT 0,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ops_performance_snapshots_user_id_period_type_period_start_unique" UNIQUE("user_id","period_type","period_start")
);
--> statement-breakpoint
CREATE TABLE "ops_playbooks" (
	"id" serial PRIMARY KEY NOT NULL,
	"scenario_key" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"trigger_conditions" jsonb DEFAULT '[]'::jsonb,
	"severity" text DEFAULT 'MEDIUM',
	"applicable_stages" text[],
	"action_steps" jsonb DEFAULT '[]'::jsonb,
	"escalation_path" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ops_playbooks_scenario_key_unique" UNIQUE("scenario_key")
);
--> statement-breakpoint
CREATE TABLE "partner_referrals" (
	"id" serial PRIMARY KEY NOT NULL,
	"partner_id" integer NOT NULL,
	"lead_id" integer,
	"client_id" integer,
	"deal_id" varchar,
	"referral_status" text DEFAULT 'PENDING' NOT NULL,
	"commission_earned" numeric(12, 2),
	"commission_paid" numeric(12, 2),
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "partners" (
	"id" serial PRIMARY KEY NOT NULL,
	"full_name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text NOT NULL,
	"cpf_cnpj" text NOT NULL,
	"profession" text,
	"referral_source" text,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"referral_code" text,
	"referred_by_partner_id" integer,
	"approved_at" timestamp,
	"approved_by" varchar,
	"rejected_at" timestamp,
	"rejected_reason" text,
	"terms_accepted_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "partners_email_unique" UNIQUE("email"),
	CONSTRAINT "partners_referral_code_unique" UNIQUE("referral_code")
);
--> statement-breakpoint
CREATE TABLE "playbook_deal_snapshots" (
	"id" serial PRIMARY KEY NOT NULL,
	"deal_id" varchar NOT NULL,
	"playbook_id" integer NOT NULL,
	"playbook_version" integer NOT NULL,
	"snapshot_data" jsonb NOT NULL,
	"snapshoted_by" varchar NOT NULL,
	"snapshoted_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "playbook_deal_snapshots_deal_id_unique" UNIQUE("deal_id")
);
--> statement-breakpoint
CREATE TABLE "portal_access_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer,
	"session_token" text,
	"action" text NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "proposal_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"template_type" varchar(30) NOT NULL,
	"language" varchar(10) DEFAULT 'pt-BR',
	"html_template" text NOT NULL,
	"css_styles" text,
	"variables" jsonb NOT NULL,
	"paper_size" varchar(20) DEFAULT 'A4',
	"orientation" varchar(10) DEFAULT 'portrait',
	"margin_top" integer DEFAULT 20,
	"margin_bottom" integer DEFAULT 20,
	"margin_left" integer DEFAULT 20,
	"margin_right" integer DEFAULT 20,
	"include_header" boolean DEFAULT true,
	"include_footer" boolean DEFAULT true,
	"header_html" text,
	"footer_html" text,
	"sections" jsonb,
	"is_default" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "proposal_views" (
	"id" serial PRIMARY KEY NOT NULL,
	"proposal_id" integer NOT NULL,
	"view_date" timestamp DEFAULT now() NOT NULL,
	"ip_address" varchar(45),
	"user_agent" text,
	"country" varchar(100),
	"city" varchar(100),
	"time_spent_seconds" integer,
	"pages_viewed" integer DEFAULT 1,
	"downloaded" boolean DEFAULT false,
	"download_date" timestamp,
	"client_email" varchar(255),
	"client_name" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "proposals" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"quote_id" integer NOT NULL,
	"rfo_id" integer,
	"proposal_number" varchar(50) NOT NULL,
	"proposal_date" date DEFAULT now() NOT NULL,
	"valid_until" date NOT NULL,
	"proposal_pdf_path" varchar(500),
	"contract_pdf_path" varchar(500),
	"summary_pdf_path" varchar(500),
	"client_name" varchar(255) NOT NULL,
	"client_cnpj" varchar(50),
	"uc_code" varchar(50),
	"consumption_mwh" numeric(12, 2),
	"demanda_kw" numeric(10, 2),
	"distribuidora" varchar(100),
	"supplier_name" varchar(255) NOT NULL,
	"price_structure" varchar(200),
	"contract_duration" integer,
	"contract_start" date,
	"contract_type" varchar(50),
	"current_annual_cost" numeric(12, 2),
	"proposed_annual_cost" numeric(12, 2),
	"annual_savings" numeric(12, 2),
	"savings_percentage" numeric(5, 2),
	"our_commission_annual" numeric(10, 2),
	"commission_structure" varchar(100),
	"commission_paid_by" varchar(50) DEFAULT 'supplier',
	"payment_terms" varchar(200),
	"status" text DEFAULT 'draft',
	"sent_date" timestamp,
	"viewed_date" timestamp,
	"viewed_count" integer DEFAULT 0,
	"last_viewed" timestamp,
	"response_date" timestamp,
	"response_notes" text,
	"rejection_reason" text,
	"tracking_token" varchar(100),
	"created_by" varchar(100) DEFAULT 'system',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "proposals_proposal_number_unique" UNIQUE("proposal_number"),
	CONSTRAINT "proposals_tracking_token_unique" UNIQUE("tracking_token")
);
--> statement-breakpoint
CREATE TABLE "quarterly_reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"contract_id" integer,
	"decision_log_id" integer,
	"period_label" text NOT NULL,
	"period_start" date NOT NULL,
	"period_end" date NOT NULL,
	"market_summary_pt" text,
	"client_position_pt" text,
	"health_score" integer,
	"status_classification" text NOT NULL,
	"recommendation" text NOT NULL,
	"explanation_pt" text NOT NULL,
	"current_price_rmwh" numeric(10, 2),
	"benchmark_median_rmwh" numeric(10, 2),
	"optimised_reference_price_rmwh" numeric(10, 2),
	"estimated_annual_savings_r" numeric(12, 2),
	"next_review_date" date,
	"approved" boolean DEFAULT false,
	"approved_by" text,
	"approved_at" timestamp,
	"sent_to_client" boolean DEFAULT false,
	"sent_at" timestamp,
	"viewed_by_client" boolean DEFAULT false,
	"viewed_at" timestamp,
	"pdf_path" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quote_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer,
	"profile_id" integer,
	"status" text DEFAULT 'draft',
	"priority" text DEFAULT 'normal',
	"notes" text,
	"zoho_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rfo_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"bill_upload_id" integer,
	"rfo_number" varchar(50) NOT NULL,
	"rfo_date" timestamp DEFAULT now(),
	"status" text DEFAULT 'draft',
	"response_deadline" date NOT NULL,
	"priority" text DEFAULT 'normal',
	"snapshot_consumption_kwh" numeric(10, 2),
	"snapshot_demanda_kw" numeric(10, 2),
	"snapshot_uc" varchar(50),
	"snapshot_distribuidora" varchar(100),
	"snapshot_contract_end" date,
	"sent_count" integer DEFAULT 0,
	"response_count" integer DEFAULT 0,
	"last_sent_date" timestamp,
	"email_subject" varchar(200),
	"email_body" text,
	"attachments" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "rfo_requests_rfo_number_unique" UNIQUE("rfo_number")
);
--> statement-breakpoint
CREATE TABLE "rfo_supplier_tracking" (
	"id" serial PRIMARY KEY NOT NULL,
	"rfo_id" integer NOT NULL,
	"supplier_id" integer NOT NULL,
	"contact_name" varchar(100),
	"contact_email" varchar(255) NOT NULL,
	"contact_phone" varchar(50),
	"sent_status" text DEFAULT 'pending',
	"sent_date" timestamp,
	"sent_method" text,
	"response_status" text DEFAULT 'waiting',
	"response_date" timestamp,
	"response_quote_id" integer,
	"open_count" integer DEFAULT 0,
	"last_opened" timestamp,
	"reminder_sent" boolean DEFAULT false,
	"reminder_date" timestamp,
	"error_message" text,
	"retry_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rfo_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"format_type" varchar(20) NOT NULL,
	"subject_template" varchar(200),
	"body_template" text NOT NULL,
	"variables" jsonb NOT NULL,
	"generate_pdf" boolean DEFAULT false,
	"generate_excel" boolean DEFAULT false,
	"attachment_template" varchar(50),
	"default_for_format" varchar(20),
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rfq_dispatches" (
	"id" serial PRIMARY KEY NOT NULL,
	"deal_id" varchar NOT NULL,
	"rfq_request_id" integer,
	"supplier_id" integer NOT NULL,
	"supplier_rfq_playbook_id" integer,
	"playbook_version" integer,
	"dossier_snapshot_id" integer,
	"channel_used" text NOT NULL,
	"status" text DEFAULT 'DRAFT' NOT NULL,
	"sent_at" timestamp,
	"due_at" timestamp,
	"responded_at" timestamp,
	"last_followup_at" timestamp,
	"followup_count" integer DEFAULT 0,
	"assigned_to_user_id" varchar,
	"message_subject" text,
	"message_body" text,
	"attachments" jsonb DEFAULT '[]'::jsonb,
	"local_overrides" jsonb,
	"override_reason" text,
	"evidence_communication_log_id" integer,
	"is_demo" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" varchar,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rfq_packets" (
	"id" serial PRIMARY KEY NOT NULL,
	"rfo_request_id" integer NOT NULL,
	"deal_id" varchar,
	"supplier_id" integer NOT NULL,
	"adapter_id" integer,
	"adapter_version" integer,
	"packet_status" text DEFAULT 'DRAFT' NOT NULL,
	"is_manual_send" boolean DEFAULT false NOT NULL,
	"manual_send_notes" text,
	"manual_send_channel" text,
	"generated_payload" jsonb DEFAULT '{"email":{"to":[],"cc":[],"subject":"","body":""},"whatsapp":{"message":""},"portal":{"url":"","instructions":""},"requiredFields":{},"attachments":[]}'::jsonb,
	"missing_requirements" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" varchar,
	"sent_at" timestamp,
	"sent_by" varchar,
	"send_method_used" text,
	"communication_log_id" integer
);
--> statement-breakpoint
CREATE TABLE "saved_audit_filters" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"filters_json" jsonb NOT NULL,
	"is_default" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "supplier_contacts" (
	"id" serial PRIMARY KEY NOT NULL,
	"supplier_id" integer NOT NULL,
	"name" varchar(100) NOT NULL,
	"email" varchar(255),
	"phone" varchar(50),
	"role" varchar(100),
	"department" varchar(100),
	"preferred_format" text DEFAULT 'email',
	"format_details" jsonb,
	"typical_response_hours" integer DEFAULT 48,
	"best_contact_time" varchar(50),
	"responsiveness_score" integer DEFAULT 3,
	"last_contacted" timestamp,
	"custom_subject_template" varchar(200),
	"custom_body_template" text,
	"email_template" varchar(50),
	"is_active" boolean DEFAULT true,
	"is_primary" boolean DEFAULT false,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "supplier_playbooks" (
	"id" serial PRIMARY KEY NOT NULL,
	"supplier_id" integer NOT NULL,
	"commission_payer_entity" text,
	"payment_cadence" text DEFAULT 'MONTHLY',
	"report_formats_supported" jsonb DEFAULT '[]'::jsonb,
	"required_fields" jsonb DEFAULT '{}'::jsonb,
	"calc_defaults" jsonb DEFAULT '{}'::jsonb,
	"submission_requirements" jsonb DEFAULT '{}'::jsonb,
	"contacts" jsonb DEFAULT '{}'::jsonb,
	"sla_targets" jsonb DEFAULT '{}'::jsonb,
	"rules" jsonb DEFAULT '{}'::jsonb,
	"version" integer DEFAULT 1 NOT NULL,
	"is_active" boolean DEFAULT true,
	"updated_by" varchar,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "supplier_portals" (
	"id" serial PRIMARY KEY NOT NULL,
	"supplier_id" integer NOT NULL,
	"portal_name" varchar(100),
	"portal_url" varchar(500) NOT NULL,
	"login_required" boolean DEFAULT true,
	"submission_format" varchar(50),
	"required_fields" jsonb,
	"notes" text,
	"last_used" timestamp,
	"success_rate" numeric(3, 2),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "supplier_quotes" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"bill_upload_id" integer,
	"rfq_id" integer,
	"supplier_name" text NOT NULL,
	"supplier_contact" text,
	"quote_reference" text,
	"quote_date" date DEFAULT now() NOT NULL,
	"valid_until" date NOT NULL,
	"price_rmwh" numeric(10, 2),
	"pld_spread_rmwh" numeric(10, 2),
	"demanda_price_rkw_mes" numeric(10, 2),
	"contract_start" date,
	"contract_duration" integer,
	"contract_type" text,
	"modulacao_ponta_rmwh" numeric(10, 2),
	"modulacao_fora_ponta_rmwh" numeric(10, 2),
	"modulacao_reservada_rmwh" numeric(10, 2),
	"sazonalidade_seca_rmwh" numeric(10, 2),
	"sazonalidade_umida_rmwh" numeric(10, 2),
	"flexibilidade_percent" numeric(5, 2),
	"flexibilidade_penalty_rmwh" numeric(10, 2),
	"our_commission_rmwh" numeric(10, 2),
	"commission_percent" numeric(5, 2),
	"commission_paid_by" text DEFAULT 'supplier',
	"total_client_cost_annual" numeric(12, 2),
	"our_commission_annual" numeric(12, 2),
	"client_savings_annual" numeric(12, 2),
	"effective_price_rmwh" numeric(10, 2),
	"status" text DEFAULT 'draft',
	"notes" text,
	"attachment_url" text,
	"rfo_id" integer,
	"rfo_tracking_id" integer,
	"received_via" text DEFAULT 'manual',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "supplier_report_imports" (
	"id" serial PRIMARY KEY NOT NULL,
	"supplier_id" integer NOT NULL,
	"imported_by" varchar NOT NULL,
	"imported_at" timestamp DEFAULT now() NOT NULL,
	"file_doc_id" integer,
	"file_name" text,
	"file_type" text,
	"parsing_status" text DEFAULT 'RECEIVED' NOT NULL,
	"detected_columns" jsonb DEFAULT '[]'::jsonb,
	"mapping_config" jsonb DEFAULT '{}'::jsonb,
	"parsed_data" jsonb DEFAULT '[]'::jsonb,
	"row_count" integer DEFAULT 0,
	"error_log" text,
	"hash_sha256" text
);
--> statement-breakpoint
CREATE TABLE "supplier_rfq_adapters" (
	"id" serial PRIMARY KEY NOT NULL,
	"supplier_id" integer NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"status" text DEFAULT 'ACTIVE' NOT NULL,
	"name" text NOT NULL,
	"submission_channels" jsonb DEFAULT '{"email":{"enabled":true},"whatsapp":{"enabled":false},"portal":{"enabled":false},"excelTemplate":{"enabled":false}}'::jsonb,
	"email_config" jsonb DEFAULT '{"to":[],"cc":[],"subjectTemplate":"RFQ #{{RFO_NUMBER}} - {{CLIENT_NAME}} - Solicitação de Cotação","bodyTemplate":"Prezado(a) {{CONTACT_NAME}},\n\nSolicitamos cotação para o cliente {{CLIENT_NAME}} (CNPJ: {{CNPJ}}).\n\nConsumo anual: {{ANNUAL_MWH}} MWh\nInício do suprimento: {{START_DATE}}\nPrazo para resposta: {{DEADLINE_HOURS}} horas\n\nAtenciosamente,\n{{OTIMA_CONTACT}}"}'::jsonb,
	"whatsapp_config" jsonb DEFAULT '{"messageTemplate":"Olá {{CONTACT_NAME}}, tudo bem?\n\nEnvio RFQ #{{RFO_NUMBER}} para {{CLIENT_NAME}}.\nConsumo: {{ANNUAL_MWH}} MWh/ano\nInício: {{START_DATE}}\n\nPrazo: {{DEADLINE_HOURS}}h\n\nObrigado!"}'::jsonb,
	"portal_config" jsonb DEFAULT '{"url":"","instructions":""}'::jsonb,
	"required_fields_schema" jsonb DEFAULT '[{"key":"client_company_name","label":"Razão Social","type":"text","required":true},{"key":"cnpj","label":"CNPJ","type":"text","required":true},{"key":"ucs","label":"UC(s)","type":"list","required":true,"minItems":1},{"key":"annual_mwh","label":"Consumo Anual (MWh)","type":"number","required":true},{"key":"start_date","label":"Início do Suprimento","type":"date","required":true}]'::jsonb,
	"required_attachments_schema" jsonb DEFAULT '[{"key":"bill_pdf_last_12_months","label":"Últimas 12 faturas (PDF)","required":true},{"key":"load_dossier_pdf","label":"Dossiê de Consumo (PDF)","required":false},{"key":"credit_docs","label":"Documentos de Crédito (se aplicável)","required":false}]'::jsonb,
	"response_format_hints" jsonb DEFAULT '{"expected":"EMAIL_PDF_OR_EXCEL","notes":""}'::jsonb,
	"relationship_notes" text,
	"preferred_contact_id" integer,
	"response_behavior" jsonb DEFAULT '{"preferred_channel":null,"best_hours":null,"format_preference":null,"notes":null}'::jsonb,
	"internal_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" varchar,
	"retired_at" timestamp,
	"retired_by" varchar
);
--> statement-breakpoint
CREATE TABLE "supplier_rfq_playbooks" (
	"id" serial PRIMARY KEY NOT NULL,
	"supplier_id" integer NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"status" text DEFAULT 'ACTIVE' NOT NULL,
	"preferred_channel" text NOT NULL,
	"required_fields" jsonb DEFAULT '[]'::jsonb,
	"email_config" jsonb,
	"whatsapp_config" jsonb,
	"portal_config" jsonb,
	"sla_config" jsonb,
	"internal_notes" text,
	"onboarding_sla_days" integer,
	"quote_response_sla_hours" integer,
	"relationship_notes" text,
	"products_supported" text[],
	"submarkets_covered" text[],
	"rfq_intake_method" text,
	"rfq_template_required" boolean DEFAULT false,
	"rfq_template_id" text,
	"rfq_required_fields" jsonb DEFAULT '[]'::jsonb,
	"rfq_attachment_requirements" jsonb DEFAULT '[]'::jsonb,
	"docs_required" jsonb DEFAULT '[]'::jsonb,
	"guarantees_supported" text[],
	"credit_turnaround_days" integer,
	"common_credit_reject_reasons" jsonb DEFAULT '[]'::jsonb,
	"commission_report_format" text,
	"commission_report_frequency" text,
	"commission_report_fields_expected" jsonb DEFAULT '[]'::jsonb,
	"variance_method" text,
	"variance_frequency" text,
	"variance_notes" text,
	"created_by" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"retired_at" timestamp,
	"retired_by" varchar,
	"is_demo" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "supplier_sla_tracking" (
	"id" serial PRIMARY KEY NOT NULL,
	"supplier_id" integer NOT NULL,
	"deal_id" varchar(255),
	"rfo_id" integer,
	"request_type" text NOT NULL,
	"request_sent_at" timestamp NOT NULL,
	"first_response_at" timestamp,
	"quote_validity_expiry" date,
	"expected_response_hours" integer DEFAULT 48,
	"actual_response_hours" numeric(8, 2),
	"is_sla_breach" boolean DEFAULT false,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "suppliers" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"short_code" text NOT NULL,
	"category" text,
	"contact_email" text,
	"contact_phone" text,
	"website" text,
	"commission_terms" text,
	"is_active" boolean DEFAULT true,
	"is_demo" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "suppliers_name_unique" UNIQUE("name"),
	CONSTRAINT "suppliers_short_code_unique" UNIQUE("short_code")
);
--> statement-breakpoint
CREATE TABLE "upload_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer,
	"token" text NOT NULL,
	"access_code" text,
	"is_used" boolean DEFAULT false,
	"expires_at" timestamp DEFAULT NOW() + INTERVAL '7 days',
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "upload_sessions_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user_tooltip_state" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"tooltip_key" text NOT NULL,
	"dismissed_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_tooltip_state_user_id_tooltip_key_unique" UNIQUE("user_id","tooltip_key")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"role" text DEFAULT 'admin',
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "zoho_intake_errors" (
	"id" serial PRIMARY KEY NOT NULL,
	"zoho_lead_id" text,
	"received_at" timestamp DEFAULT now() NOT NULL,
	"payload_json" jsonb,
	"error_type" text NOT NULL,
	"error_message" text NOT NULL,
	"error_details" jsonb,
	"ip_address" text,
	"user_agent" text,
	"resolved" boolean DEFAULT false,
	"resolved_at" timestamp,
	"resolved_by" text,
	"resolved_notes" text
);
--> statement-breakpoint
CREATE TABLE "zoho_intake_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"zoho_lead_id" text NOT NULL,
	"received_at" timestamp DEFAULT now() NOT NULL,
	"payload_json" jsonb NOT NULL,
	"result_status" text NOT NULL,
	"portal_deal_id" varchar(255),
	"portal_client_id" integer,
	"error_message" text,
	"ip_address" text,
	"user_agent" text
);
--> statement-breakpoint
ALTER TABLE "admin_sessions" ADD CONSTRAINT "admin_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bill_uploads" ADD CONSTRAINT "bill_uploads_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_contracts" ADD CONSTRAINT "client_contracts_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_contracts" ADD CONSTRAINT "client_contracts_linked_benchmark_id_market_price_benchmarks_id_fk" FOREIGN KEY ("linked_benchmark_id") REFERENCES "public"."market_price_benchmarks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_dossier_snapshots" ADD CONSTRAINT "client_dossier_snapshots_client_dossier_id_client_dossiers_id_fk" FOREIGN KEY ("client_dossier_id") REFERENCES "public"."client_dossiers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_dossier_snapshots" ADD CONSTRAINT "client_dossier_snapshots_deal_id_deals_id_fk" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_dossier_snapshots" ADD CONSTRAINT "client_dossier_snapshots_rfo_request_id_rfo_requests_id_fk" FOREIGN KEY ("rfo_request_id") REFERENCES "public"."rfo_requests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_dossier_snapshots" ADD CONSTRAINT "client_dossier_snapshots_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_dossiers" ADD CONSTRAINT "client_dossiers_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_dossiers" ADD CONSTRAINT "client_dossiers_validated_by_users_id_fk" FOREIGN KEY ("validated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_dossiers" ADD CONSTRAINT "client_dossiers_locked_by_users_id_fk" FOREIGN KEY ("locked_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_dossiers" ADD CONSTRAINT "client_dossiers_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_dossiers" ADD CONSTRAINT "client_dossiers_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_usage_periods" ADD CONSTRAINT "client_usage_periods_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_usage_periods" ADD CONSTRAINT "client_usage_periods_deal_id_deals_id_fk" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_usage_periods" ADD CONSTRAINT "client_usage_periods_verified_by_user_id_users_id_fk" FOREIGN KEY ("verified_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clients" ADD CONSTRAINT "clients_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commission_reconciliation_lines" ADD CONSTRAINT "commission_reconciliation_lines_reconciliation_run_id_commission_reconciliation_runs_id_fk" FOREIGN KEY ("reconciliation_run_id") REFERENCES "public"."commission_reconciliation_runs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commission_reconciliation_lines" ADD CONSTRAINT "commission_reconciliation_lines_deal_id_deals_id_fk" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commission_reconciliation_lines" ADD CONSTRAINT "commission_reconciliation_lines_commission_event_id_deal_commission_events_id_fk" FOREIGN KEY ("commission_event_id") REFERENCES "public"."deal_commission_events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commission_reconciliation_lines" ADD CONSTRAINT "commission_reconciliation_lines_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commission_reconciliation_lines" ADD CONSTRAINT "commission_reconciliation_lines_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commission_reconciliation_lines" ADD CONSTRAINT "commission_reconciliation_lines_usage_period_id_client_usage_periods_id_fk" FOREIGN KEY ("usage_period_id") REFERENCES "public"."client_usage_periods"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commission_reconciliation_lines" ADD CONSTRAINT "commission_reconciliation_lines_reconciled_by_users_id_fk" FOREIGN KEY ("reconciled_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commission_reconciliation_runs" ADD CONSTRAINT "commission_reconciliation_runs_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commission_reconciliation_runs" ADD CONSTRAINT "commission_reconciliation_runs_finalized_by_users_id_fk" FOREIGN KEY ("finalized_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "communication_log" ADD CONSTRAINT "communication_log_deal_id_deals_id_fk" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "communication_log" ADD CONSTRAINT "communication_log_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "communication_log" ADD CONSTRAINT "communication_log_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "communication_log" ADD CONSTRAINT "communication_log_logged_by_users_id_fk" FOREIGN KEY ("logged_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consumption_profiles" ADD CONSTRAINT "consumption_profiles_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consumption_profiles" ADD CONSTRAINT "consumption_profiles_upload_session_id_upload_sessions_id_fk" FOREIGN KEY ("upload_session_id") REFERENCES "public"."upload_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contract_templates" ADD CONSTRAINT "contract_templates_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deal_cases" ADD CONSTRAINT "deal_cases_deal_id_deals_id_fk" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deal_cases" ADD CONSTRAINT "deal_cases_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deal_checklist_completions" ADD CONSTRAINT "deal_checklist_completions_deal_id_deals_id_fk" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deal_checklist_completions" ADD CONSTRAINT "deal_checklist_completions_checklist_item_id_ops_checklist_items_id_fk" FOREIGN KEY ("checklist_item_id") REFERENCES "public"."ops_checklist_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deal_checklist_completions" ADD CONSTRAINT "deal_checklist_completions_completed_by_users_id_fk" FOREIGN KEY ("completed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deal_checklist_items" ADD CONSTRAINT "deal_checklist_items_deal_id_deals_id_fk" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deal_checklist_items" ADD CONSTRAINT "deal_checklist_items_requirement_id_compliance_checklist_requirements_id_fk" FOREIGN KEY ("requirement_id") REFERENCES "public"."compliance_checklist_requirements"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deal_checklist_items" ADD CONSTRAINT "deal_checklist_items_completed_by_users_id_fk" FOREIGN KEY ("completed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deal_checklist_items" ADD CONSTRAINT "deal_checklist_items_communication_log_id_communication_log_id_fk" FOREIGN KEY ("communication_log_id") REFERENCES "public"."communication_log"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deal_commission_events" ADD CONSTRAINT "deal_commission_events_deal_id_deals_id_fk" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deal_commission_terms_snapshots" ADD CONSTRAINT "deal_commission_terms_snapshots_deal_id_deals_id_fk" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deal_disputes" ADD CONSTRAINT "deal_disputes_deal_id_deals_id_fk" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deal_documents" ADD CONSTRAINT "deal_documents_deal_id_deals_id_fk" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deal_ecos_snapshots" ADD CONSTRAINT "deal_ecos_snapshots_deal_id_deals_id_fk" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deal_ecos_snapshots" ADD CONSTRAINT "deal_ecos_snapshots_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deal_ecos_snapshots" ADD CONSTRAINT "deal_ecos_snapshots_pdf_document_id_deal_documents_id_fk" FOREIGN KEY ("pdf_document_id") REFERENCES "public"."deal_documents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deal_quotes" ADD CONSTRAINT "deal_quotes_deal_id_deals_id_fk" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deal_quotes" ADD CONSTRAINT "deal_quotes_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deal_quotes" ADD CONSTRAINT "deal_quotes_rfq_dispatch_id_rfq_dispatches_id_fk" FOREIGN KEY ("rfq_dispatch_id") REFERENCES "public"."rfq_dispatches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deal_state_transitions" ADD CONSTRAINT "deal_state_transitions_deal_id_deals_id_fk" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deal_transition_overrides" ADD CONSTRAINT "deal_transition_overrides_deal_id_deals_id_fk" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deal_transition_overrides" ADD CONSTRAINT "deal_transition_overrides_overridden_by_users_id_fk" FOREIGN KEY ("overridden_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deals" ADD CONSTRAINT "deals_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deals" ADD CONSTRAINT "deals_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deals" ADD CONSTRAINT "deals_lost_supplier_id_suppliers_id_fk" FOREIGN KEY ("lost_supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dossier_edit_logs" ADD CONSTRAINT "dossier_edit_logs_dossier_id_client_dossiers_id_fk" FOREIGN KEY ("dossier_id") REFERENCES "public"."client_dossiers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dossier_edit_logs" ADD CONSTRAINT "dossier_edit_logs_edited_by_users_id_fk" FOREIGN KEY ("edited_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ecos_decision_logs" ADD CONSTRAINT "ecos_decision_logs_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ecos_decision_logs" ADD CONSTRAINT "ecos_decision_logs_contract_id_client_contracts_id_fk" FOREIGN KEY ("contract_id") REFERENCES "public"."client_contracts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ecos_decision_logs" ADD CONSTRAINT "ecos_decision_logs_benchmark_id_market_price_benchmarks_id_fk" FOREIGN KEY ("benchmark_id") REFERENCES "public"."market_price_benchmarks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_ecos_snapshots" ADD CONSTRAINT "lead_ecos_snapshots_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_ecos_snapshots" ADD CONSTRAINT "lead_ecos_snapshots_benchmark_id_used_market_price_benchmarks_id_fk" FOREIGN KEY ("benchmark_id_used") REFERENCES "public"."market_price_benchmarks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_queue" ADD CONSTRAINT "notification_queue_recipient_user_id_users_id_fk" FOREIGN KEY ("recipient_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_queue" ADD CONSTRAINT "notification_queue_deal_id_deals_id_fk" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ops_checklist_items" ADD CONSTRAINT "ops_checklist_items_checklist_id_ops_checklists_id_fk" FOREIGN KEY ("checklist_id") REFERENCES "public"."ops_checklists"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ops_error_events" ADD CONSTRAINT "ops_error_events_deal_id_deals_id_fk" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ops_error_events" ADD CONSTRAINT "ops_error_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ops_error_events" ADD CONSTRAINT "ops_error_events_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ops_error_events" ADD CONSTRAINT "ops_error_events_resolved_by_users_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ops_performance_snapshots" ADD CONSTRAINT "ops_performance_snapshots_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_referrals" ADD CONSTRAINT "partner_referrals_partner_id_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_referrals" ADD CONSTRAINT "partner_referrals_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_referrals" ADD CONSTRAINT "partner_referrals_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_referrals" ADD CONSTRAINT "partner_referrals_deal_id_deals_id_fk" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partners" ADD CONSTRAINT "partners_referred_by_partner_id_partners_id_fk" FOREIGN KEY ("referred_by_partner_id") REFERENCES "public"."partners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partners" ADD CONSTRAINT "partners_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "playbook_deal_snapshots" ADD CONSTRAINT "playbook_deal_snapshots_deal_id_deals_id_fk" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "playbook_deal_snapshots" ADD CONSTRAINT "playbook_deal_snapshots_playbook_id_supplier_playbooks_id_fk" FOREIGN KEY ("playbook_id") REFERENCES "public"."supplier_playbooks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "playbook_deal_snapshots" ADD CONSTRAINT "playbook_deal_snapshots_snapshoted_by_users_id_fk" FOREIGN KEY ("snapshoted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portal_access_logs" ADD CONSTRAINT "portal_access_logs_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposal_views" ADD CONSTRAINT "proposal_views_proposal_id_proposals_id_fk" FOREIGN KEY ("proposal_id") REFERENCES "public"."proposals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_quote_id_supplier_quotes_id_fk" FOREIGN KEY ("quote_id") REFERENCES "public"."supplier_quotes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_rfo_id_rfo_requests_id_fk" FOREIGN KEY ("rfo_id") REFERENCES "public"."rfo_requests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quarterly_reports" ADD CONSTRAINT "quarterly_reports_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quarterly_reports" ADD CONSTRAINT "quarterly_reports_contract_id_client_contracts_id_fk" FOREIGN KEY ("contract_id") REFERENCES "public"."client_contracts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quarterly_reports" ADD CONSTRAINT "quarterly_reports_decision_log_id_ecos_decision_logs_id_fk" FOREIGN KEY ("decision_log_id") REFERENCES "public"."ecos_decision_logs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_requests" ADD CONSTRAINT "quote_requests_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_requests" ADD CONSTRAINT "quote_requests_profile_id_consumption_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."consumption_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rfo_requests" ADD CONSTRAINT "rfo_requests_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rfo_requests" ADD CONSTRAINT "rfo_requests_bill_upload_id_bill_uploads_id_fk" FOREIGN KEY ("bill_upload_id") REFERENCES "public"."bill_uploads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rfo_supplier_tracking" ADD CONSTRAINT "rfo_supplier_tracking_rfo_id_rfo_requests_id_fk" FOREIGN KEY ("rfo_id") REFERENCES "public"."rfo_requests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rfo_supplier_tracking" ADD CONSTRAINT "rfo_supplier_tracking_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rfo_supplier_tracking" ADD CONSTRAINT "rfo_supplier_tracking_response_quote_id_supplier_quotes_id_fk" FOREIGN KEY ("response_quote_id") REFERENCES "public"."supplier_quotes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rfq_dispatches" ADD CONSTRAINT "rfq_dispatches_deal_id_deals_id_fk" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rfq_dispatches" ADD CONSTRAINT "rfq_dispatches_rfq_request_id_rfo_requests_id_fk" FOREIGN KEY ("rfq_request_id") REFERENCES "public"."rfo_requests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rfq_dispatches" ADD CONSTRAINT "rfq_dispatches_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rfq_dispatches" ADD CONSTRAINT "rfq_dispatches_supplier_rfq_playbook_id_supplier_rfq_playbooks_id_fk" FOREIGN KEY ("supplier_rfq_playbook_id") REFERENCES "public"."supplier_rfq_playbooks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rfq_dispatches" ADD CONSTRAINT "rfq_dispatches_dossier_snapshot_id_client_dossier_snapshots_id_fk" FOREIGN KEY ("dossier_snapshot_id") REFERENCES "public"."client_dossier_snapshots"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rfq_dispatches" ADD CONSTRAINT "rfq_dispatches_assigned_to_user_id_users_id_fk" FOREIGN KEY ("assigned_to_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rfq_dispatches" ADD CONSTRAINT "rfq_dispatches_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rfq_packets" ADD CONSTRAINT "rfq_packets_rfo_request_id_rfo_requests_id_fk" FOREIGN KEY ("rfo_request_id") REFERENCES "public"."rfo_requests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rfq_packets" ADD CONSTRAINT "rfq_packets_deal_id_deals_id_fk" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rfq_packets" ADD CONSTRAINT "rfq_packets_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rfq_packets" ADD CONSTRAINT "rfq_packets_adapter_id_supplier_rfq_adapters_id_fk" FOREIGN KEY ("adapter_id") REFERENCES "public"."supplier_rfq_adapters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rfq_packets" ADD CONSTRAINT "rfq_packets_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rfq_packets" ADD CONSTRAINT "rfq_packets_sent_by_users_id_fk" FOREIGN KEY ("sent_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rfq_packets" ADD CONSTRAINT "rfq_packets_communication_log_id_communication_log_id_fk" FOREIGN KEY ("communication_log_id") REFERENCES "public"."communication_log"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_audit_filters" ADD CONSTRAINT "saved_audit_filters_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_contacts" ADD CONSTRAINT "supplier_contacts_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_playbooks" ADD CONSTRAINT "supplier_playbooks_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_playbooks" ADD CONSTRAINT "supplier_playbooks_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_portals" ADD CONSTRAINT "supplier_portals_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_quotes" ADD CONSTRAINT "supplier_quotes_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_quotes" ADD CONSTRAINT "supplier_quotes_bill_upload_id_bill_uploads_id_fk" FOREIGN KEY ("bill_upload_id") REFERENCES "public"."bill_uploads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_quotes" ADD CONSTRAINT "supplier_quotes_rfq_id_quote_requests_id_fk" FOREIGN KEY ("rfq_id") REFERENCES "public"."quote_requests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_report_imports" ADD CONSTRAINT "supplier_report_imports_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_report_imports" ADD CONSTRAINT "supplier_report_imports_imported_by_users_id_fk" FOREIGN KEY ("imported_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_rfq_adapters" ADD CONSTRAINT "supplier_rfq_adapters_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_rfq_adapters" ADD CONSTRAINT "supplier_rfq_adapters_preferred_contact_id_supplier_contacts_id_fk" FOREIGN KEY ("preferred_contact_id") REFERENCES "public"."supplier_contacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_rfq_adapters" ADD CONSTRAINT "supplier_rfq_adapters_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_rfq_adapters" ADD CONSTRAINT "supplier_rfq_adapters_retired_by_users_id_fk" FOREIGN KEY ("retired_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_rfq_playbooks" ADD CONSTRAINT "supplier_rfq_playbooks_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_rfq_playbooks" ADD CONSTRAINT "supplier_rfq_playbooks_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_rfq_playbooks" ADD CONSTRAINT "supplier_rfq_playbooks_retired_by_users_id_fk" FOREIGN KEY ("retired_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_sla_tracking" ADD CONSTRAINT "supplier_sla_tracking_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "upload_sessions" ADD CONSTRAINT "upload_sessions_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_tooltip_state" ADD CONSTRAINT "user_tooltip_state_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;