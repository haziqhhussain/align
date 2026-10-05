from fastapi import APIRouter
from app.routes.auth import router as auth_router
from app.routes.users import router as users_router
from app.routes.teams import router as teams_router
from app.routes.projects import router as projects_router
from app.routes.tasks import router as tasks_router
from app.routes.comments import router as comments_router
from app.routes.dashboard import router as dashboard_router
from app.routes.notifications import router as notifications_router

api_router = APIRouter()
api_router.include_router(auth_router)
api_router.include_router(users_router)
api_router.include_router(teams_router)
api_router.include_router(projects_router)
api_router.include_router(tasks_router)
api_router.include_router(comments_router)
api_router.include_router(dashboard_router)
api_router.include_router(notifications_router)
