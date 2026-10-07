from fastapi import APIRouter
from app.routes.auth import router as auth_router
from app.routes.users import router as users_router
from app.routes.teams import router as teams_router
from app.routes.projects import router as projects_router
from app.routes.tasks import router as tasks_router
from app.routes.comments import router as comments_router
from app.routes.subtasks import router as subtasks_router
from app.routes.dashboard import router as dashboard_router
from app.routes.notifications import router as notifications_router
from app.routes.social import router as social_router
from app.routes.activity import router as activity_router
from app.routes.calendar import router as calendar_router
from app.routes.attachments import router as attachments_router
from app.routes.analytics import router as analytics_router

api_router = APIRouter()
api_router.include_router(auth_router)
api_router.include_router(social_router)
api_router.include_router(users_router)
api_router.include_router(teams_router)
api_router.include_router(projects_router)
api_router.include_router(tasks_router)
api_router.include_router(comments_router)
api_router.include_router(subtasks_router)
api_router.include_router(attachments_router)
api_router.include_router(calendar_router)
api_router.include_router(analytics_router)
api_router.include_router(dashboard_router)
api_router.include_router(notifications_router)
api_router.include_router(activity_router)
