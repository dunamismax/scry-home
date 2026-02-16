CREATE INDEX "api_key_project_id_idx" ON "api_key" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "chunk_document_id_idx" ON "chunk" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX "document_project_id_idx" ON "document" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "project_user_id_idx" ON "project" USING btree ("user_id");