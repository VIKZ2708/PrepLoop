from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.api.health import router as health_router
from app.api.syllabus import router as syllabus_router
from app.api.study import router as study_router
from app.api.project import router as project_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield


app = FastAPI(title="PrepLoop API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router)
app.include_router(syllabus_router)
app.include_router(study_router)
app.include_router(project_router)
