ALTER TABLE "custom_requests" ADD CONSTRAINT "custom_requests_budget_range_valid" CHECK ("custom_requests"."budget_range" in ('25', '35', '50'));--> statement-breakpoint
ALTER TABLE "custom_requests" ADD CONSTRAINT "custom_requests_status_valid" CHECK ("custom_requests"."status" in ('pending', 'quoted', 'paid', 'prep', 'assembly', 'shipping', 'shipped', 'cancelled'));--> statement-breakpoint
ALTER TABLE "custom_requests" ADD CONSTRAINT "custom_requests_quoted_price_nonnegative" CHECK ("custom_requests"."quoted_price" is null or "custom_requests"."quoted_price" >= 0);--> statement-breakpoint
ALTER TABLE "notification_events" ADD CONSTRAINT "notification_events_status_valid" CHECK ("notification_events"."status" in ('pending', 'sent', 'failed', 'skipped'));--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_quantity_positive" CHECK ("order_items"."quantity" > 0);--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_price_at_purchase_positive" CHECK ("order_items"."price_at_purchase" > 0);--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_total_cents_nonnegative" CHECK ("orders"."total_cents" >= 0);--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_status_valid" CHECK ("orders"."status" in ('new', 'prep', 'assembly', 'shipping', 'shipped', 'cancelled'));--> statement-breakpoint
ALTER TABLE "product_reservations" ADD CONSTRAINT "product_reservations_quantity_positive" CHECK ("product_reservations"."quantity" > 0);--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_price_cents_positive" CHECK ("products"."price_cents" > 0);--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_stock_nonnegative" CHECK ("products"."stock" >= 0);