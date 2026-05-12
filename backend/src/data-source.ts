import "reflect-metadata";
import { DataSource } from "typeorm";
import { Record } from "./entity/Record.js";

export const AppDataSource = new DataSource({
	type: "better-sqlite3",
	database: "./db.sqlite",
	synchronize: true,
	logging: false,
	entities: [Record],
});
