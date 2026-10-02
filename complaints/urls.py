from rest_framework.routers import DefaultRouter
from .views import (AssignmentViewSet, ComplaintViewSet, DepartmentViewSet,
                    FeedbackViewSet, StatusUpdateViewSet, StudentViewSet)

router = DefaultRouter()
router.register("students", StudentViewSet)
router.register("departments", DepartmentViewSet)
router.register("complaints", ComplaintViewSet)
router.register("assignments", AssignmentViewSet)
router.register("status-updates", StatusUpdateViewSet)
router.register("feedback", FeedbackViewSet)
urlpatterns = router.urls
