-- Active: 1748792942453@@edendb-eden-storage.e.aivencloud.com@11747@defaultdb
CREATE TABLE "bindings" (
	"id" serial PRIMARY KEY NOT NULL,
	"serverId" varchar(20) NOT NULL,
	"groupName" varchar(50) NOT NULL,
	"rank" integer NOT NULL,
	"secondaryRank" integer,
	"operator" varchar(10) NOT NULL,
	"roles" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"discordId" varchar(20) PRIMARY KEY NOT NULL,
	"robloxId" varchar(20),
	"token" text,
	"discordToken" text,
	"refreshToken" text,
	"discordRefreshToken" text,
	"tokenExpires" integer,
	"discordTokenExpires" integer,
	CONSTRAINT "users_robloxId_unique" UNIQUE("robloxId")
);
--> statement-breakpoint
CREATE INDEX "tokenIdx" ON "users" USING btree ("token");