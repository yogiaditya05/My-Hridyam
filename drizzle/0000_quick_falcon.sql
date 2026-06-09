CREATE TABLE "messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"isCrisisDetected" boolean DEFAULT false NOT NULL,
	"emotion" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"openId" text NOT NULL,
	"name" text,
	"email" text,
	"passwordHash" text,
	"loginMethod" text,
	"role" text DEFAULT 'user' NOT NULL,
	"userContext" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"lastSignedIn" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_openId_unique" UNIQUE("openId")
);
