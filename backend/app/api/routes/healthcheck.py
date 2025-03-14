

from fastapi import APIRouter, HTTPException

from backend.app.utils.utils import check_postgres, check_rabbitmq, check_redis


router = APIRouter()

@router.get("/health")
async def health_check():
    results = {
        "postgres": await check_postgres(),
        "redis": await check_redis(),
        "rabbitmq": await check_rabbitmq()
    }
    
    if all(results.values()):
        return {"status": "healthy", "details": results}
    
    raise HTTPException(status_code=503, detail={"status": "unhealthy", "details": results})