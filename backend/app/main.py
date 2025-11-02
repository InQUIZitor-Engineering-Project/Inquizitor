# app/main.py
import uvicorn
from fastapi import FastAPI
from app.core.config import settings
from app.db.session import engine, init_db
from app.routers import auth, users, files, tests, materials
from fastapi.middleware.cors import CORSMiddleware
app = FastAPI(
    title="Quiz Generator API",
    version="0.1.0",
)

origins = [
    "http://localhost:5173",     
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,        
    allow_credentials=True,
    allow_methods=["*"],          
    allow_headers=["*"],          
)

@app.get("/ping")
def pong():
    return {"msg": "pong"}

# w trybie development tworzymy tabele automatycznie
@app.on_event("startup")
def on_startup():
    init_db()

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(users.router, prefix="/users", tags=["users"])
app.include_router(files.router, prefix="/files", tags=["files"])
app.include_router(tests.router, prefix="/tests", tags=["tests"])
app.include_router(materials.router, prefix="/materials", tags=["materials"])

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
