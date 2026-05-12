import { GoogleLogin } from "@react-oauth/google";
import { useState } from "react";

type RecordItem = {
  id: number;
  text: string;
};

export function App() {
  const [token, setToken] = useState<string>("");
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [text, setText] = useState<string>("");

  async function loadRecords(jwt: string) {
    const res = await fetch("http://localhost:3001/records", {
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
    });

    const data = await res.json();
    setRecords(data);
  }

  async function addRecord() {
    await fetch("http://localhost:3001/records", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        text,
      }),
    });

    setText("");
    loadRecords(token);
  }

  return (
    <div style={{ padding: 20 }}>
      {!token && (
        <GoogleLogin
          onSuccess={(response) => {
            if (!response.credential) {
              return;
            }

            setToken(response.credential);
            loadRecords(response.credential);
          }}
          onError={() => {
            console.log("Login Failed");
          }}
        />
      )}

      {token && (
        <>
          <h2>Your Records</h2>

          <ul>
            {records.map((r) => (
              <li key={r.id}>{r.text}</li>
            ))}
          </ul>

          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
          />

          <button onClick={addRecord}>
            Add
          </button>
        </>
      )}
    </div>
  );
}