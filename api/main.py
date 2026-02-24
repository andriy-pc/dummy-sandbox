import uvicorn
from fastapi import FastAPI

app = FastAPI(title="Dummy API")

@app.get("/api/v1/health")
def get_health_status() -> dict[str, str]:
    return {"status": "healthy"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)