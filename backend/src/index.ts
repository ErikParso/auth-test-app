import "reflect-metadata";
import express, {
	Request,
	Response,
	NextFunction,
} from "express";

import cors from "cors";
import jwt from "jsonwebtoken";
import jwksClient from "jwks-rsa";
import { AppDataSource } from "./data-source.js";
import { Record } from "./entity/Record.js";

const clientId =
	"92137605857-druh6dg38gdfb88rjgl953slegehasuc.apps.googleusercontent.com";

const app = express();

app.use(
	cors({
		origin: "http://localhost:5173",
	})
);

app.use(express.json());

const client = jwksClient({
	jwksUri: "https://www.googleapis.com/oauth2/v3/certs",
});

function getKey(header: any, callback: any) {
	client.getSigningKey(header.kid, (_err, key) => {
		callback(null, key?.getPublicKey());
	});
}

function authMiddleware(
	req: Request,
	res: Response,
	next: NextFunction
) {
	const auth = req.headers.authorization;

	if (!auth) {
		return res.status(401).json({
			error: "Missing token",
		});
	}

	const token = auth.split(" ")[1];

	jwt.verify(
		token,
		getKey,
		{
			algorithms: ["RS256"],
			audience: clientId,
		},
		(err, decoded) => {
			if (err || !decoded) {
				return res.status(401).json({
					error: "Invalid token",
				});
			}
			req.user = decoded;
			next();
		}
	);
}

app.get(
	"/records",
	authMiddleware,
	async (req: Request, res: Response) => {
		const userId = (req.user as any).sub;
		const repo = AppDataSource.getRepository(Record);
		const records = await repo.findBy({ userId });
		res.json(records);
	}
);

app.put(
	"/records",
	authMiddleware,
	async (req: Request, res: Response) => {
		const userId = (req.user as any).sub;
		const { text } = req.body;

		if (!text) {
			return res.status(400).json({
				error: "Text required",
			});
		}

		const repo = AppDataSource.getRepository(Record);
		const record = repo.create({ userId, text });
		const saved = await repo.save(record);
		res.json({ success: true, id: saved.id });
	}
);

AppDataSource.initialize().then(() => {
	app.listen(3001, () => {
		console.log(
			"Backend running on http://localhost:3001"
		);
	});
});
