CREATE TABLE `articles` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`excerpt` text NOT NULL,
	`body` text NOT NULL,
	`tag` text NOT NULL,
	`date` text NOT NULL,
	`read_min` integer DEFAULT 5 NOT NULL,
	`image_id` integer,
	`sort` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`image_id`) REFERENCES `images`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `collections` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`desc` text,
	`sort` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `colors` (
	`id` text PRIMARY KEY NOT NULL,
	`label` text NOT NULL,
	`hex` text NOT NULL,
	`sort` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `contact_channels` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`type` text NOT NULL,
	`label` text NOT NULL,
	`value` text NOT NULL,
	`enabled` integer DEFAULT true NOT NULL,
	`sort` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `custom_order_submissions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`phone` text NOT NULL,
	`email` text,
	`collection_id` text,
	`is_bulk` integer DEFAULT false NOT NULL,
	`deadline` text,
	`dimensions_text` text,
	`description` text NOT NULL,
	`wants_sample` integer DEFAULT false NOT NULL,
	`ip` text,
	`archived_at` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`collection_id`) REFERENCES `collections`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `customer_addresses` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`customer_id` integer NOT NULL,
	`label` text NOT NULL,
	`recipient_name` text NOT NULL,
	`text` text NOT NULL,
	`postal_code` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `customers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`phone` text NOT NULL,
	`name` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `customers_phone_unique` ON `customers` (`phone`);--> statement-breakpoint
CREATE TABLE `declarations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`order_id` integer NOT NULL,
	`last4` text NOT NULL,
	`trace_code` text,
	`rejected_reason` text,
	`rejected_at` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `faq_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`question` text NOT NULL,
	`answer` text NOT NULL,
	`sort` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `images` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`path` text NOT NULL,
	`alt` text NOT NULL,
	`artist` text,
	`license` text,
	`width` integer,
	`height` integer
);
--> statement-breakpoint
CREATE TABLE `order_lines` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`order_id` integer NOT NULL,
	`product_id` integer,
	`name` text NOT NULL,
	`size_label` text,
	`color_label` text,
	`unit_price_toman` integer NOT NULL,
	`qty` integer NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`code` text NOT NULL,
	`customer_id` integer NOT NULL,
	`status` text DEFAULT 'awaiting-payment' NOT NULL,
	`recipient_name` text NOT NULL,
	`address_text` text NOT NULL,
	`postal_code` text,
	`subtotal_toman` integer NOT NULL,
	`shipping_toman` integer NOT NULL,
	`discount_toman` integer DEFAULT 0 NOT NULL,
	`total_toman` integer NOT NULL,
	`promo_code` text,
	`promo_percent` integer,
	`tracking_code` text,
	`note` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `orders_code_unique` ON `orders` (`code`);--> statement-breakpoint
CREATE TABLE `otp_codes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`phone` text NOT NULL,
	`code_sha256` text NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`expires_at` integer NOT NULL,
	`consumed_at` integer,
	`ip` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `payments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`order_id` integer NOT NULL,
	`path` text NOT NULL,
	`status` text NOT NULL,
	`authority` text,
	`amount_rial` integer,
	`ref_id` text,
	`last4` text,
	`trace_code` text,
	`reject_reason` text,
	`staff_note` text,
	`declared_at` integer,
	`approved_at` integer,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `payments_order_id_unique` ON `payments` (`order_id`);--> statement-breakpoint
CREATE TABLE `product_colors` (
	`product_id` integer NOT NULL,
	`color_id` text NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`color_id`) REFERENCES `colors`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE TABLE `product_images` (
	`product_id` integer NOT NULL,
	`image_id` integer NOT NULL,
	`sort` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`image_id`) REFERENCES `images`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `product_sizes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`product_id` integer NOT NULL,
	`label` text NOT NULL,
	`delta_toman` integer DEFAULT 0 NOT NULL,
	`sort` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`subtitle` text,
	`collection_id` text NOT NULL,
	`price_toman` integer NOT NULL,
	`compare_at_toman` integer,
	`stock` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`dimensions` text,
	`materials` text,
	`care` text,
	`weave` text,
	`weight_kg` real,
	`made_in` text,
	`handmade` integer DEFAULT true NOT NULL,
	`is_new` integer DEFAULT false NOT NULL,
	`rating` real DEFAULT 0 NOT NULL,
	`review_count` integer DEFAULT 0 NOT NULL,
	`description` text NOT NULL,
	`story` text,
	`sort` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`collection_id`) REFERENCES `collections`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `products_slug_unique` ON `products` (`slug`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`token_sha256` text NOT NULL,
	`subject_type` text NOT NULL,
	`subject_id` integer NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sessions_token_sha256_unique` ON `sessions` (`token_sha256`);--> statement-breakpoint
CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `staff_users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`username` text NOT NULL,
	`password_hash` text NOT NULL,
	`display_name` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `staff_users_username_unique` ON `staff_users` (`username`);--> statement-breakpoint
CREATE TABLE `submission_colors` (
	`submission_id` integer NOT NULL,
	`color_id` text NOT NULL,
	FOREIGN KEY (`submission_id`) REFERENCES `custom_order_submissions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`color_id`) REFERENCES `colors`(`id`) ON UPDATE no action ON DELETE restrict
);
