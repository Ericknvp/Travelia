import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dotenv import load_dotenv
load_dotenv()
from app.db.mysql_client import get_mysql_connection

conn = get_mysql_connection()
try:
    with conn.cursor() as cur:
        try:
            cur.execute("ALTER TABLE usuarios ADD COLUMN username VARCHAR(50) NULL UNIQUE")
            conn.commit()
            print("Columna 'username' agregada.")
        except Exception as e:
            print(f"Columna ya existe o error: {e}")

        cur.execute("SELECT id_usuario, correo FROM usuarios WHERE username IS NULL")
        rows = cur.fetchall()
        import re
        for row in rows:
            base = re.sub(r"[^a-z0-9_]", "", row["correo"].split("@")[0].lower()) or "user"
            username = base
            suffix = 1
            while True:
                cur.execute("SELECT id_usuario FROM usuarios WHERE username=%s", (username,))
                if not cur.fetchone():
                    break
                username = f"{base}{suffix}"
                suffix += 1
            cur.execute("UPDATE usuarios SET username=%s WHERE id_usuario=%s", (username, row["id_usuario"]))
        conn.commit()
        print(f"Se actualizaron {len(rows)} usuarios.")
finally:
    conn.close()
