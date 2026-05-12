import express, {
	Request,
	Response,
	NextFunction,
} from "express";

import cors from "cors";
import jwt from "jsonwebtoken";
import jwksClient from "jwks-rsa";
import sqlite3 from "sqlite3";

const clientId = '92137605857-druh6dg38gdfb88rjgl953slegehasuc.apps.googleusercontent.com';

const app = express();

app.use(
	cors({
		origin: "http://localhost:5173",
	})
);

app.use(express.json());

const db = new sqlite3.Database("./db.sqlite");

db.serialize(() => {
	db.run(`
    CREATE TABLE IF NOT EXISTS records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      text TEXT NOT NULL
    )
  `);
});

const client = jwksClient({
	jwksUri: "https://www.googleapis.com/oauth2/v3/certs",
});

function getKey(header: any, callback: any) {
	client.getSigningKey(header.kid, (err, key) => {
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
	(req: Request, res: Response) => {
		const userId = (req.user as any).sub;

		db.all(
			"SELECT * FROM records WHERE user_id = ?",
			[userId],
			(err, rows) => {
				if (err) {
					return res.status(500).json({
						error: "Database error",
					});
				}

				res.json(rows);
			}
		);
	}
);

app.put(
	"/records",
	authMiddleware,
	(req: Request, res: Response) => {
		const userId = (req.user as any).sub;

		const { text } = req.body;

		if (!text) {
			return res.status(400).json({
				error: "Text required",
			});
		}

		db.run(
			"INSERT INTO records(user_id, text) VALUES (?, ?)",
			[userId, text],
			function (err) {
				if (err) {
					return res.status(500).json({
						error: "Database error",
					});
				}

				res.json({
					success: true,
					id: this.lastID,
				});
			}
		);
	}
);

app.listen(3001, () => {
	console.log(
		"Backend running on http://localhost:3001"
	);
});