import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity("records")
export class Record {
	@PrimaryGeneratedColumn()
	id!: number;

	@Column({ type: "text", name: "user_id" })
	userId!: string;

	@Column({ type: "text" })
	text!: string;
}
